import { apiRequest, showNotification, formatDate, formatCurrency, createElement, clearElement } from './profile_api.js';
import { setupPagination } from './profile_ui.js';
import { loadVentes, loadFournisseurCommandes, loadPendingApprovals, getVentesData } from './profil_ventes.js';
import { loadLocations, validateReturn, getLocationsData } from './profil_locations.js';

let currentUser = null;
let currentUserRole = null;

//  CHARGEMENT PROFIL UTILISATEUR 
async function loadUserInfo() {
    try {
        const response = await apiRequest('/me', 'GET');
        if (response.success) {
            currentUser = response.user;
            currentUserRole = currentUser.is_admin ? 'admin' : 'vendeur';
            
            const userFullName = document.getElementById('userFullName');
            const userLogin = document.getElementById('userLogin');
            const userEmail = document.getElementById('userEmail');
            const userInitials = document.getElementById('userInitials');
            const userRoleBadge = document.getElementById('userRoleBadge');
            
            if (userFullName) userFullName.textContent = `${currentUser.name} ${currentUser.surname}`;
            if (userLogin) userLogin.textContent = `@${currentUser.login}`;
            if (userEmail) userEmail.textContent = currentUser.mail;
            if (userInitials) userInitials.textContent = `${currentUser.name[0]}${currentUser.surname[0]}`;
            if (userRoleBadge) userRoleBadge.textContent = currentUser.is_admin ? 'Administrateur' : 'Vendeur';
        }
    } catch (error) {
        console.error('Erreur chargement profil:', error);
        showNotification('Erreur lors du chargement du profil', 'error');
    }
}

//  MODALES 
function openReturnModal(data) {
    const modal = document.getElementById('validateReturnModal');
    if (!modal) return;
    
    document.getElementById('returnCommandeId').value = data.commandeId;
    document.getElementById('returnBroomName').textContent = data.broomName;
    document.getElementById('returnClientName').textContent = data.clientName;
    document.getElementById('returnPeriod').textContent = `${formatDate(data.beginDate)} → ${formatDate(data.endDate)}`;
    document.getElementById('returnActualEndDate').valueAsDate = new Date();
    modal.style.display = 'flex';
}

async function openCommandeFournisseurModal() {
    try {
        const [fournisseursRes, balaisRes] = await Promise.all([
            apiRequest('/fournisseurs', 'GET'),
            apiRequest('/balais/all', 'GET')
        ]);
        
        const fournisseurSelect = document.getElementById('cfFournisseurId');
        clearElement(fournisseurSelect);
        fournisseurSelect.appendChild(createElement('option', '', 'Sélectionner un fournisseur'));
        
        fournisseursRes.fournisseurs.forEach(f => {
            const option = createElement('option', '', f.name);
            option.value = f.id_fabricant;
            fournisseurSelect.appendChild(option);
        });
        
        // Stocker tous les balais dans une variable globale pour filtrage
        window.allBroems = balaisRes.balais;
        
        // Initialiser les sélecteurs de balais (désactivés jusqu'à sélection fournisseur)
        initBroomSelectors();
        
        // Ajouter écouteur pour filtrage par fournisseur
        fournisseurSelect.removeEventListener('change', window.supplierFilterHandler);
        window.supplierFilterHandler = () => filterBroemsBySupplier(fournisseurSelect.value);
        fournisseurSelect.addEventListener('change', window.supplierFilterHandler);
        
        document.getElementById('cfCommandDate').valueAsDate = new Date();
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + 14);
        document.getElementById('cfExpectedDeliveryDate').valueAsDate = expectedDate;
        
        document.getElementById('commandeFournisseurModal').style.display = 'flex';
    } catch (error) {
        showNotification('Erreur lors du chargement des données', 'error');
        console.error(error);
    }
}

function initBroomSelectors() {
    const broomSelects = document.querySelectorAll('.cfBroomSelect');
    broomSelects.forEach(select => {
        clearElement(select);
        select.appendChild(createElement('option', '', 'Sélectionner d\'abord un fournisseur'));
        select.disabled = true;
    });
}

function filterBroemsBySupplier(supplierId) {
    if (!supplierId || !window.allBroems) {
        return;
    }
    
    // Filtrer les balais par fournisseur
    const filteredBroems = window.allBroems.filter(b => b.id_fabricant === parseInt(supplierId));
    
    // Mettre à jour tous les sélecteurs de balais
    const broomSelects = document.querySelectorAll('.cfBroomSelect');
    broomSelects.forEach(select => {
        clearElement(select);
        select.disabled = false;
        select.appendChild(createElement('option', '', 'Sélectionner un balai'));
        
        filteredBroems.forEach(b => {
            const option = createElement('option', '', `${b.Libelle} - Prix vente: ${formatCurrency(b.purchase_price)}`);
            option.value = b.id_balai;
            option.dataset.locationPrice = b.location_price;
            option.dataset.purchase_price = b.purchase_price;
            option.dataset.salePrice = b.purchase_price + (0.2*b.purchase_price); // prix d'achat +20%
            select.appendChild(option);
        });
    });
}

function openApproveModal(data) {
    const modal = document.getElementById('approveCommandeModal');
    if (!modal) return;
    
    document.getElementById('approveCommandeId').value = data.commandeId;
    document.getElementById('approveFournisseurName').textContent = data.fournisseur;
    document.getElementById('approveCommandDate').textContent = formatDate(data.commandDate);
    document.getElementById('approveExpectedDate').textContent = formatDate(data.expectedDate);
    
    const itemsContainer = document.getElementById('approveBalaisList');
    clearElement(itemsContainer);
    const items = JSON.parse(data.items);
    items.forEach(item => {
        const div = createElement('div', 'approve-item', `${item.broom_name} x${item.quantity} - ${formatCurrency(item.price)}/unité`);
        itemsContainer.appendChild(div);
    });
    
    modal.style.display = 'flex';
}

//  VALIDATION FORMULAIRES 
async function handleValidateReturn(event) {
    const success = await validateReturn(event, refreshAllData);
    if (success) {
        await refreshAllData();
    }
}

async function createCommandeFournisseur(event) {
    event.preventDefault();
    
    const supplierId = document.getElementById('cfFournisseurId').value;
    if (!supplierId) {
        showNotification('Veuillez sélectionner un fournisseur', 'error');
        return;
    }
    
    const broomRows = document.querySelectorAll('.broom-order-row');
    const broomQuantities = new Map(); // Pour grouper les balais identiques
    
    broomRows.forEach(row => {
        const broomId = row.querySelector('.cfBroomSelect').value;
        const quantity = parseInt(row.querySelector('.cfQuantity').value);
        
        if (broomId && quantity > 0) {
            if (broomQuantities.has(broomId)) {
                broomQuantities.set(broomId, broomQuantities.get(broomId) + quantity);
            } else {
                broomQuantities.set(broomId, quantity);
            }
        }
    });
    
    if (broomQuantities.size === 0) {
        showNotification('Ajoutez au moins un balai à la commande', 'error');
        return;
    }
    
    // Convertir en tableau d'items
    const items = [];
    for (let [broomId, quantity] of broomQuantities) {
        items.push({ 
            broom_id: parseInt(broomId), 
            quantity: quantity
        });
    }
    
    const data = {
        fournisseur_id: parseInt(supplierId),
        command_date: document.getElementById('cfCommandDate').value,
        expected_delivery_date: document.getElementById('cfExpectedDeliveryDate').value,
        items: items
    };
    
    try {
        const response = await apiRequest('/commandes-fournisseur', 'POST', data);
        if (response.success) {
            showNotification('Commande fournisseur créée avec succès', 'success');
            document.getElementById('commandeFournisseurModal').style.display = 'none';
            await refreshAllData();
            if (currentUserRole === 'admin') await loadPendingApprovals(openApproveModal, refreshAllData);
        }
    } catch (error) {
        showNotification(error.message || 'Erreur lors de la création', 'error');
    }
}

async function approveCommande(event) {
    event.preventDefault();
    
    const data = {
        commandeId: parseInt(document.getElementById('approveCommandeId').value),
        status: document.getElementById('approveStatus').value
    };
    
    try {
        const response = await apiRequest('/commandes-fournisseur/approve', 'PUT', data);
        if (response.success) {
            showNotification('Commande mise à jour avec succès', 'success');
            document.getElementById('approveCommandeModal').style.display = 'none';
            await refreshAllData();
            await loadPendingApprovals(openApproveModal, refreshAllData);
        }
    } catch (error) {
        showNotification(error.message || 'Erreur lors de l\'approbation', 'error');
    }
}

function addBroomRow() {
    const template = document.getElementById('broomOrderTemplate');
    const clone = template.content.cloneNode(true);
    
    const currentSupplier = document.getElementById('cfFournisseurId').value;
    const newSelect = clone.querySelector('.cfBroomSelect');
    
    if (currentSupplier && window.allBroems) {
        const filteredBroems = window.allBroems.filter(b => b.id_fabricant === parseInt(currentSupplier));
        clearElement(newSelect);
        newSelect.disabled = false;
        newSelect.appendChild(createElement('option', '', 'Sélectionner un balai'));
        
        filteredBroems.forEach(b => {
            const option = createElement('option', '', `${b.Libelle} - Prix vente: ${formatCurrency(b.sale_price)}`);
            option.value = b.id_balai;
            option.dataset.locationPrice = b.location_price;
            option.dataset.salePrice = b.sale_price;
            newSelect.appendChild(option);
        });
    } else {
        clearElement(newSelect);
        newSelect.disabled = true;
        newSelect.appendChild(createElement('option', '', 'Sélectionner d\'abord un fournisseur'));
    }
    
    const removeBtn = clone.querySelector('.remove-broom-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.target.closest('.broom-order-row').remove();
        });
    }
    
    document.getElementById('cfBalaisList').appendChild(clone);
}

//  RAFRAÎCHISSEMENT DONNÉES 
async function refreshAllData() {
    await loadVentes(1, openReturnModal);
    await loadLocations(1, openReturnModal);
    await loadFournisseurCommandes(1, refreshAllData);
    
    showNotification('Données actualisées', 'success');
}

//  ONGLETS 
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(`${tab.dataset.tab}Tab`).classList.add('active');
        });
    });
}

//  ÉVÈNEMENTS 
function setupEventListeners() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) editProfileBtn.style.display = 'none';
    
    document.getElementById('validateReturnForm')?.addEventListener('submit', handleValidateReturn);
    document.getElementById('commandeFournisseurForm')?.addEventListener('submit', createCommandeFournisseur);
    document.getElementById('approveCommandeForm')?.addEventListener('submit', approveCommande);
    document.getElementById('addBroomRowBtn')?.addEventListener('click', addBroomRow);
    document.getElementById('newCommandeFournisseurBtn')?.addEventListener('click', openCommandeFournisseurModal);
    document.getElementById('refreshDataBtn')?.addEventListener('click', refreshAllData);
    
    document.querySelectorAll('.close-modal, .cancel-return, .cancel-commande, .cancel-approve').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
}

//  INITIALISATION 
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    setupEventListeners();
    setupTabs();
    
    await loadVentes(1, openReturnModal);
    await loadLocations(1, openReturnModal);
    await loadFournisseurCommandes(1, refreshAllData);
    
    // Afficher la section d'approbation si admin
    if (currentUserRole === 'admin') {
        const pendingSection = document.getElementById('pendingApprovalSection');
        if (pendingSection) pendingSection.style.display = 'block';
        await loadPendingApprovals(openApproveModal, refreshAllData);

        const button = document.createElement('button');
        button.className = 'tab-btn';
        button.setAttribute('data-tab', 'fournisseur');
        button.textContent = '📈 Statistiques';
        button.addEventListener('click', () => {
            window.location.href = '/stats';
        });

        const container = document.getElementById('profile-tabs');
        if (container) {
            container.appendChild(button);
        }
    }
});