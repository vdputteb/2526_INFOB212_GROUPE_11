import { apiRequest, showNotification, formatDate, formatCurrency, createElement, clearElement } from './profile_api.js';
import { setupPagination } from './profile_ui.js';
import { loadVentes, loadFournisseurCommandes, loadPendingApprovals, getVentesData } from './profil_ventes.js';
import { loadLocations, validateReturn, getLocationsData } from './profil_locations.js';

let currentUser = null;
let currentUserRole = null;

// ==================== CHARGEMENT PROFIL UTILISATEUR ====================
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

// ==================== MODALES ====================
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
        
        const broomSelects = document.querySelectorAll('.cfBroomSelect');
        broomSelects.forEach(select => {
            clearElement(select);
            select.appendChild(createElement('option', '', 'Sélectionner un balai'));
            balaisRes.balais.forEach(b => {
                const option = createElement('option', '', `${b.Libelle} - ${formatCurrency(b.sale_price)}`);
                option.value = b.id_balai;
                select.appendChild(option);
            });
        });
        
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

// ==================== VALIDATION FORMULAIRES ====================
async function handleValidateReturn(event) {
    const success = await validateReturn(event);
    if (success) {
        await refreshAllData();
    }
}

async function createCommandeFournisseur(event) {
    event.preventDefault();
    
    const broomRows = document.querySelectorAll('.broom-order-row');
    const items = [];
    
    broomRows.forEach(row => {
        const broomId = row.querySelector('.cfBroomSelect').value;
        const quantity = parseInt(row.querySelector('.cfQuantity').value);
        const price = parseFloat(row.querySelector('.cfPrice').value);
        
        if (broomId && quantity > 0 && price > 0) {
            items.push({ broom_id: parseInt(broomId), quantity, price });
        }
    });
    
    if (items.length === 0) {
        showNotification('Ajoutez au moins un balai à la commande', 'error');
        return;
    }
    
    const data = {
        fournisseur_id: parseInt(document.getElementById('cfFournisseurId').value),
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
            if (currentUserRole === 'admin') await loadPendingApprovals(openApproveModal);
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
            await loadPendingApprovals(openApproveModal);
        }
    } catch (error) {
        showNotification(error.message || 'Erreur lors de l\'approbation', 'error');
    }
}

function addBroomRow() {
    const template = document.getElementById('broomOrderTemplate');
    const clone = template.content.cloneNode(true);
    
    const firstSelect = document.querySelector('.cfBroomSelect');
    if (firstSelect) {
        const newSelect = clone.querySelector('.cfBroomSelect');
        Array.from(firstSelect.options).forEach(opt => {
            newSelect.appendChild(new Option(opt.text, opt.value));
        });
    }
    
    const removeBtn = clone.querySelector('.remove-broom-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.target.closest('.broom-order-row').remove();
        });
    }
    
    document.getElementById('cfBalaisList').appendChild(clone);
}

// ==================== RAFRAÎCHISSEMENT DONNÉES ====================
async function refreshAllData() {
    await loadVentes(1, openReturnModal);
    await loadLocations(1, openReturnModal);
    await loadFournisseurCommandes();
    
    showNotification('Données actualisées', 'success');
}

// ==================== ONGLETS ====================
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

// ==================== ÉVÈNEMENTS ====================
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

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    setupEventListeners();
    setupTabs();
    
    await loadVentes(1, openReturnModal);
    await loadLocations(1, openReturnModal);
    await loadFournisseurCommandes();
    
});