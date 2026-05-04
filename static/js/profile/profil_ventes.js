import { apiRequest, showNotification, formatDate, formatCurrency, createElement, clearElement, getStatusText } from './profile_api.js';
import { setupPagination } from './profile_ui.js';

let ventesData = [];

//  CHARGEMENT DES VENTES 
export async function loadVentes(page = 1, onReturnClick) {
    try {
        const response = await apiRequest(`/profile/ventes?page=${page}`, 'GET');
        if (response.success) {
            ventesData = response.ventes;
            renderVentes(ventesData, 'ventesList');
            setupPagination('ventesPagination', response.pagination, (p) => loadVentes(p, onReturnClick));
        } else {
            throw new Error('Erreur lors du chargement des ventes');
        }
    } catch (error) {
        const container = document.getElementById('ventesList');
        if (container) {
            clearElement(container);
            const errorDiv = createElement('div', 'error-message', 'Erreur lors du chargement des ventes');
            container.appendChild(errorDiv);
        }
        console.error(error);
    }
}

//  RENDU DES VENTES 
function renderVentes(ventes, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    clearElement(container);
    
    if (!ventes || !ventes.length) {
        container.appendChild(createElement('div', 'empty-message', 'Aucune vente trouvée'));
        return;
    }
    
    const template = document.getElementById('venteTemplate');
    
    // Grouper les ventes par commande (si plusieurs balais par commande)
    const groupedVentes = groupVentesByCommande(ventes);
    
    groupedVentes.forEach(venteGroup => {
        const clone = template.content.cloneNode(true);
        
        // Date de vente
        clone.querySelector('.vente-date').textContent = formatDate(venteGroup.sale_date);
        
        // Montant total
        clone.querySelector('.vente-total').textContent = formatCurrency(venteGroup.total_amount);
        
        // Client
        clone.querySelector('.vente-client').textContent = venteGroup.client_name && venteGroup.client_surname 
            ? `${venteGroup.client_name} ${venteGroup.client_surname}` 
            : (venteGroup.client_name || 'Client inconnu');
        
        // Articles
        const itemsContainer = clone.querySelector('.vente-items');
        if (venteGroup.items && Array.isArray(venteGroup.items) && venteGroup.items.length) {
            venteGroup.items.forEach(item => {
                const itemDiv = createElement('div', 'vente-item', `${item.broom_name} ${formatCurrency(item.sale_price)}`);
                itemsContainer.appendChild(itemDiv);
            });
        } else {
            // Fallback pour les données simples
            const itemDiv = createElement('div', 'vente-item', `${venteGroup.broom_name} - ${formatCurrency(venteGroup.total_amount)}`);
            itemsContainer.appendChild(itemDiv);
        }
        
        container.appendChild(clone);
    });
}

// Fonction utilitaire pour grouper les ventes par commande
function groupVentesByCommande(ventes) {
    const grouped = new Map();
    
    ventes.forEach(vente => {
        if (!grouped.has(vente.id_commande)) {
            grouped.set(vente.id_commande, {
                id_commande: vente.id_commande,
                sale_date: vente.sale_date,
                id_client: vente.id_client,
                client_name: vente.client_name,
                client_surname: vente.client_surname,
                total_amount: vente.total_amount,
                items: []
            });
        }
        
        const group = grouped.get(vente.id_commande);
        group.items.push({
            broom_name: vente.broom_name,
            quantity: 1,
            sale_price : vente.sale_price,
            price: vente.total_amount / (group.items.length + 1) || vente.total_amount
        });
    });
    
    return Array.from(grouped.values());
}

//  COMMANDES FOURNISSEUR 
export async function loadFournisseurCommandes(page = 1, refreshCallback) {
    try {
        const response = await apiRequest(`/profile/commandes-fournisseur?page=${page}`, 'GET');
        if (response.success) {
            renderFournisseurCommandes(response.commandes, 'fournisseurList');
            setupPagination('fournisseurPagination', response.pagination, (p) => loadFournisseurCommandes(p, refreshCallback));
        } else {
            throw new Error('Erreur lors du chargement des commandes fournisseur');
        }
    } catch (error) {
        const container = document.getElementById('fournisseurList');
        if (container) {
            clearElement(container);
            const errorDiv = createElement('div', 'error-message', 'Erreur lors du chargement des commandes fournisseur');
            container.appendChild(errorDiv);
        }
        console.error(error);
    }
}

function renderFournisseurCommandes(commandes, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    clearElement(container);
    
    if (!commandes.length) {
        container.appendChild(createElement('div', 'empty-message', 'Aucune commande fournisseur trouvée'));
        return;
    }
    
    const template = document.getElementById('fournisseurTemplate');
    
    commandes.forEach(cmd => {
        const clone = template.content.cloneNode(true);
        clone.querySelector('.fournisseur-id').textContent = `Commande #${cmd.id_commande || cmd.id}`;
        
        const statusSpan = clone.querySelector('.fournisseur-status');
        statusSpan.textContent = getStatusText(cmd.status);
        statusSpan.className = `fournisseur-status status-${(cmd.status || 'unknown').toLowerCase().replace(' ', '-')}`;
        
        const datesDiv = clone.querySelector('.fournisseur-dates');
        const dateParts = [`Commande: ${formatDate(cmd.command_date)}`, `Livraison prévue: ${formatDate(cmd.expected_delivery_date)}`];
        if (cmd.actual_delivery_date) dateParts.push(`Livrée: ${formatDate(cmd.actual_delivery_date)}`);
        datesDiv.textContent = dateParts.join(' | ');
        
        const itemsDiv = clone.querySelector('.fournisseur-items');
        if (cmd.items && cmd.items.length) {
            cmd.items.forEach(item => {
                const itemDiv = createElement('div', 'fournisseur-item', `${item.broom_name} x${item.quantity} - ${formatCurrency(item.purchase_price)}/unité`);
                itemsDiv.appendChild(itemDiv);
            });
        } else {
            const noItemsDiv = createElement('div', 'fournisseur-item', 'Aucun article');
            itemsDiv.appendChild(noItemsDiv);
        }
        
        container.appendChild(clone);
    });
}

//  COMMANDES EN ATTENTE (ADMIN) 
export async function loadPendingApprovals(onApproveClick, refreshCallback) {
    try {
        const response = await apiRequest('/profile/pending-approvals', 'GET');
        if (response.success && response.commandes && response.commandes.length > 0) {
            renderPendingApprovals(response.commandes, onApproveClick);
        } else {
            const container = document.getElementById('pendingApprovalList');
            if (container) {
                clearElement(container);
                container.appendChild(createElement('div', 'empty-message', 'Aucune commande en attente d\'approbation'));
            }
        }
    } catch (error) {
        console.error('Erreur chargement approbations:', error);
        const container = document.getElementById('pendingApprovalList');
        if (container) {
            clearElement(container);
            container.appendChild(createElement('div', 'error-message', 'Erreur lors du chargement des commandes en attente'));
        }
    }
}

function renderPendingApprovals(commandes, onApproveClick) {
    const container = document.getElementById('pendingApprovalList');
    if (!container) return;
    
    clearElement(container);
    
    if (!commandes.length) {
        container.appendChild(createElement('div', 'empty-message', 'Aucune commande en attente'));
        return;
    }
    
    const template = document.getElementById('fournisseurTemplate');
    
    commandes.forEach(cmd => {
        const clone = template.content.cloneNode(true);
        clone.querySelector('.fournisseur-id').textContent = `Commande #${cmd.id_commande || cmd.id} - ${cmd.vendeur_name || cmd.seller_name || 'Vendeur'}`;
        
        const statusSpan = clone.querySelector('.fournisseur-status');
        statusSpan.textContent = 'En attente d\'approbation';
        statusSpan.className = 'fournisseur-status status-pending-approval';
        
        clone.querySelector('.fournisseur-dates').textContent = `Demandée le: ${formatDate(cmd.command_date)} | Livraison prévue: ${formatDate(cmd.expected_delivery_date)}`;
        
        const itemsDiv = clone.querySelector('.fournisseur-items');
        if (cmd.items && cmd.items.length) {
            cmd.items.forEach(item => {
                const itemDiv = createElement('div', 'fournisseur-item', `${item.broom_name} x${item.quantity} - ${formatCurrency(item.purchase_price)}/unité`);
                itemsDiv.appendChild(itemDiv);
            });
        }
        
        const actionsDiv = clone.querySelector('.fournisseur-actions');
        const approveBtn = createElement('button', 'btn-approve', ' Approuver / Gérer');
        approveBtn.dataset.commandeId = cmd.id_commande || cmd.id;
        approveBtn.dataset.fournisseur = cmd.fournisseur_name || cmd.supplier_name || 'Fournisseur';
        approveBtn.dataset.commandDate = cmd.command_date;
        approveBtn.dataset.expectedDate = cmd.expected_delivery_date;
        approveBtn.dataset.items = JSON.stringify(cmd.items || []);
        approveBtn.addEventListener('click', () => onApproveClick(approveBtn.dataset));
        actionsDiv.appendChild(approveBtn);
        
        container.appendChild(clone);
    });
}

//  EXPORT 
export function getVentesData() { return ventesData; }