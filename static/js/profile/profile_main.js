import { apiRequest, showNotification, formatDate, formatCurrency, createElement, clearElement } from './profile_api.js';
import { setupPagination } from './profile_ui.js';
import { loadVentes, loadFournisseurCommandes, loadPendingApprovals, getVentesData, updateCommandeStatus } from './profil_ventes.js';
import { loadLocations, validateReturn, getLocationsData } from './profil_locations.js';

let currentUser = null;
let currentUserRole = null;
let isCurrentUserAdmin = false;


async function loadUserInfo() {
    try {
        const response = await apiRequest('/me', 'GET');
        if (response.success) {
            currentUser = response.user;
            currentUserRole = currentUser.is_admin ? 'admin' : 'vendeur';
            isCurrentUserAdmin = currentUser.is_admin;
            
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
            
            const pendingSection = document.getElementById('pendingApprovalSection');
            if (pendingSection) {
                pendingSection.style.display = currentUser.is_admin ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error('Erreur chargement profil:', error);
        showNotification('Erreur lors du chargement du profil', 'error');
    }
}

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


// Créer une nouvelle ligne de balai
function createBroomRow() {
    const row = document.createElement('div');
    row.className = 'broom-order-row';
    
    // Select pour les balais
    const broomSelect = document.createElement('select');
    broomSelect.name = 'broomId[]';
    broomSelect.className = 'cfBroomSelect';
    broomSelect.required = true;
    
    // Input quantité
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.name = 'quantity[]';
    quantityInput.className = 'cfQuantity';
    quantityInput.placeholder = 'Quantité';
    quantityInput.min = '1';
    quantityInput.value = '1';
    
    // Bouton suppression
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-broom-btn';
    removeBtn.textContent = '🗑️';
    removeBtn.addEventListener('click', function() {
        const rows = document.querySelectorAll('.broom-order-row');
        if (rows.length > 1) {
            this.closest('.broom-order-row').remove();
        } else {
            showNotification('Vous devez avoir au moins un balai dans la commande', 'error');
        }
    });
    
    row.appendChild(broomSelect);
    row.appendChild(quantityInput);
    row.appendChild(removeBtn);
    
    return row;
}

// Mettre à jour les options d'un select de balai
function updateBroomSelectOptions(selectElement, supplierId) {
    if (!supplierId || !window.allBroems) {
        return;
    }
    
    const filteredBroems = window.allBroems.filter(b => b.id_fabricant === parseInt(supplierId));
    
    clearElement(selectElement);
    selectElement.disabled = false;
    
    const defaultOption = createElement('option', '', 'Sélectionner un balai');
    defaultOption.value = '';
    selectElement.appendChild(defaultOption);
    
    filteredBroems.forEach(b => {
        const option = createElement('option', '', `${b.Libelle} - ${formatCurrency(b.purchase_price)}`);
        option.value = b.id_balai;
        option.dataset.locationPrice = b.location_price;
        option.dataset.purchase_price = b.purchase_price;
        option.dataset.salePrice = b.purchase_price + (0.2 * b.purchase_price);
        selectElement.appendChild(option);
    });
}

// Initialiser tous les sélecteurs de balais (désactivés)
function initBroomSelectors() {
    const broomSelects = document.querySelectorAll('.cfBroomSelect');
    
    if (broomSelects.length === 0) {
        const initialRow = createBroomRow();
        document.getElementById('cfBalaisList').appendChild(initialRow);
    }
    
    const allSelects = document.querySelectorAll('.cfBroomSelect');
    allSelects.forEach(select => {
        clearElement(select);
        const defaultOption = createElement('option', '', 'Sélectionner d\'abord un fournisseur');
        defaultOption.value = '';
        select.appendChild(defaultOption);
        select.disabled = true;
    });
}

// Filtrer les balais par fournisseur pour TOUS les sélecteurs
function filterBroemsBySupplier(supplierId) {
    if (!supplierId || !window.allBroems) {
        const broomSelects = document.querySelectorAll('.cfBroomSelect');
        broomSelects.forEach(select => {
            clearElement(select);
            select.disabled = true;
            const defaultOption = createElement('option', '', 'Sélectionner d\'abord un fournisseur');
            defaultOption.value = '';
            select.appendChild(defaultOption);
        });
        return;
    }
    
    const filteredBroems = window.allBroems.filter(b => b.id_fabricant === parseInt(supplierId));
    
    if (filteredBroems.length === 0) {
        showNotification('Aucun balai disponible pour ce fournisseur', 'warning');
    }
    
    const broomSelects = document.querySelectorAll('.cfBroomSelect');
    broomSelects.forEach(select => {
        updateBroomSelectOptions(select, supplierId);
    });
}

// Ajouter une nouvelle ligne de balai
function addBroomRow() {
    const currentSupplier = document.getElementById('cfFournisseurId').value;
    
    if (!currentSupplier) {
        showNotification('Veuillez d\'abord sélectionner un fournisseur', 'error');
        return;
    }
    
    const newRow = createBroomRow();
    document.getElementById('cfBalaisList').appendChild(newRow);
    
    // Mettre à jour les options du nouveau select avec le fournisseur actuel
    updateBroomSelectOptions(newRow.querySelector('.cfBroomSelect'), currentSupplier);
}


async function openCommandeFournisseurModal() {
    try {
        const [fournisseursRes, balaisRes] = await Promise.all([
            apiRequest('/fournisseurs', 'GET'),
            apiRequest('/balais/all', 'GET')
        ]);
        
        const fournisseurSelect = document.getElementById('cfFournisseurId');
        clearElement(fournisseurSelect);
        
        const defaultOption = createElement('option', '', 'Sélectionner un fournisseur');
        defaultOption.value = '';
        fournisseurSelect.appendChild(defaultOption);
        
        fournisseursRes.fournisseurs.forEach(f => {
            const option = createElement('option', '', f.name);
            option.value = f.id_fabricant;
            fournisseurSelect.appendChild(option);
        });
        
        window.allBroems = balaisRes.balais;
        
        // Nettoyer et réinitialiser la liste des balais
        const balaisList = document.getElementById('cfBalaisList');
        clearElement(balaisList);
        
        // Créer la ligne initiale
        const initialRow = createBroomRow();
        balaisList.appendChild(initialRow);
        
        // Initialiser les sélecteurs (désactivés)
        const initialSelect = initialRow.querySelector('.cfBroomSelect');
        clearElement(initialSelect);
        const waitingOption = createElement('option', '', 'Sélectionner d\'abord un fournisseur');
        waitingOption.value = '';
        initialSelect.appendChild(waitingOption);
        initialSelect.disabled = true;
        
        // Gestionnaire de changement de fournisseur
        fournisseurSelect.removeEventListener('change', window.supplierFilterHandler);
        window.supplierFilterHandler = () => {
            const selectedSupplier = fournisseurSelect.value;
            if (selectedSupplier) {
                filterBroemsBySupplier(selectedSupplier);
            } else {
                // Si aucun fournisseur, désactiver tous les selects
                const selects = document.querySelectorAll('.cfBroomSelect');
                selects.forEach(select => {
                    clearElement(select);
                    select.disabled = true;
                    const opt = createElement('option', '', 'Sélectionner d\'abord un fournisseur');
                    opt.value = '';
                    select.appendChild(opt);
                });
            }
        };
        fournisseurSelect.addEventListener('change', window.supplierFilterHandler);
        
        // Dates par défaut
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

// Créer une commande fournisseur
async function createCommandeFournisseur(event) {
    event.preventDefault();
    
    const supplierId = document.getElementById('cfFournisseurId').value;
    if (!supplierId) {
        showNotification('Veuillez sélectionner un fournisseur', 'error');
        return;
    }
    
    const broomRows = document.querySelectorAll('.broom-order-row');
    const broomQuantities = new Map();
    let hasValidItems = false;
    
    broomRows.forEach(row => {
        const broomId = row.querySelector('.cfBroomSelect').value;
        const quantity = parseInt(row.querySelector('.cfQuantity').value);
        
        if (broomId && broomId !== '' && quantity > 0) {
            hasValidItems = true;
            if (broomQuantities.has(broomId)) {
                broomQuantities.set(broomId, broomQuantities.get(broomId) + quantity);
            } else {
                broomQuantities.set(broomId, quantity);
            }
        }
    });
    
    if (!hasValidItems) {
        showNotification('Veuillez sélectionner au moins un balai valide avec une quantité', 'error');
        return;
    }
    
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
            if (currentUserRole === 'admin') {
                await loadPendingApprovals(openApproveModal, refreshAllData);
            }
        }
    } catch (error) {
        showNotification(error.message || 'Erreur lors de la création', 'error');
    }
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

async function handleValidateReturn(event) {
    const success = await validateReturn(event, refreshAllData);
    if (success) {
        await refreshAllData();
    }
}


async function refreshFournisseurCommandes() {
    await loadFournisseurCommandes(1, updateCommandeStatusWrapper, isCurrentUserAdmin);
}

async function updateCommandeStatusWrapper(commandeId, newStatus) {
    const success = await updateCommandeStatus(commandeId, newStatus);
    if (success) {
        await refreshFournisseurCommandes();
        if (currentUserRole === 'admin') await loadPendingApprovals(openApproveModal, refreshAllData);
    }
    return success;
}

async function refreshAllData() {
    await loadVentes(1, openReturnModal);
    await loadLocations(1, openReturnModal);
    await loadFournisseurCommandes(1, updateCommandeStatusWrapper, isCurrentUserAdmin);
    showNotification('Données actualisées', 'success');
}


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


document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    setupEventListeners();
    setupTabs();
    
    window.refreshFournisseurCommandes = refreshFournisseurCommandes;
    
    await loadVentes(1, openReturnModal);
    await loadLocations(1, openReturnModal);
    await loadFournisseurCommandes(1, updateCommandeStatusWrapper, isCurrentUserAdmin);
    
    if (isCurrentUserAdmin) {
        await loadPendingApprovals(openApproveModal, refreshAllData);
    }
});