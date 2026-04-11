// static/js/client/client_basket.js
import { BasketManager } from '../basket_manager.js';

let currentClient = null;

document.addEventListener('DOMContentLoaded', () => {
    loadClientInfo();
    renderBasket();
    setupEventListeners();
    // Ne pas créer de panier flottant ici
});

function loadClientInfo() {
    currentClient = {
        id: document.getElementById('clientId')?.value,
        nom: document.getElementById('clientNom')?.value,
        prenom: document.getElementById('clientPrenom')?.value,
        email: document.getElementById('clientEmail')?.value,
        adresse: document.getElementById('clientAdresse')?.value
    };
}

function renderBasket() {
    const items = BasketManager.getItems();
    const container = document.getElementById('basketItemsList');
    const emptyDiv = document.getElementById('emptyBasket');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!items.length) {
        if (container) container.style.display = 'none';
        if (emptyDiv) emptyDiv.style.display = 'block';
        if (checkoutBtn) checkoutBtn.disabled = true;
        updateTotalsDisplay();
        return;
    }
    
    if (container) {
        container.style.display = 'block';
        container.innerHTML = '';
    }
    if (emptyDiv) emptyDiv.style.display = 'none';
    if (checkoutBtn) checkoutBtn.disabled = false;
    
    items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'basket-item';
        
        row.innerHTML = `
            <div class="product-info">
                <div class="product-icon">${item.icon || '🧹'}</div>
                <div class="product-details">
                    <div class="product-name">${escapeHtml(item.name)}</div>
                    <div class="product-category">${item.category || 'Balai'}</div>
                    ${item.rentalDates ? `<div class="rental-dates">📅 ${item.rentalDates}</div>` : ''}
                </div>
            </div>
            <div class="item-type ${item.type === 'rent' ? 'rent' : 'buy'}">
                ${item.type === 'rent' ? '📍 Location' : '🛒 Achat'}
            </div>
            <div class="item-price">
                ${item.price.toFixed(2)} €${item.type === 'rent' ? '<small>/jour</small>' : ''}
            </div>
            <div class="quantity-control">
                <button class="quantity-btn" data-action="decrease" data-index="${index}">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn" data-action="increase" data-index="${index}">+</button>
            </div>
            <div class="item-total">${item.total.toFixed(2)} €</div>
            <div><button class="remove-item" data-index="${index}">🗑️</button></div>
        `;
        
        row.querySelector('[data-action="decrease"]')?.addEventListener('click', () => {
            BasketManager.updateQuantity(index, item.quantity - 1);
            renderBasket();
        });
        
        row.querySelector('[data-action="increase"]')?.addEventListener('click', () => {
            BasketManager.updateQuantity(index, item.quantity + 1);
            renderBasket();
        });
        
        row.querySelector('.remove-item')?.addEventListener('click', () => {
            BasketManager.removeItem(index);
            renderBasket();
        });
        
        container?.appendChild(row);
    });
    
    updateTotalsDisplay();
}

function updateTotalsDisplay() {
    const totals = BasketManager.calculateTotals();
    document.getElementById('subtotal').textContent = totals.subtotal.toFixed(2) + ' €';
    document.getElementById('deliveryFee').textContent = totals.deliveryFee.toFixed(2) + ' €';
    document.getElementById('ecoFee').textContent = totals.ecoFee.toFixed(2) + ' €';
    document.getElementById('total').textContent = totals.total.toFixed(2) + ' €';
}

function setupEventListeners() {
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
}

async function checkout() {
    const items = BasketManager.getItems();
    if (!items.length) return;
    
    const totals = BasketManager.calculateTotals();
    
    const commande = {
        client_id: currentClient?.id,
        client_nom: currentClient?.nom,
        client_prenom: currentClient?.prenom,
        client_email: currentClient?.email,
        client_adresse: currentClient?.adresse || '',
        articles: items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
            rental_dates: item.rentalDates || null
        })),
        sous_total: totals.subtotal,
        frais_livraison: totals.deliveryFee,
        eco_participation: totals.ecoFee,
        total: totals.total,
        type: items.some(i => i.type === 'rent') ? 'mixte' : 'achat'
    };
    
    try {
        const response = await fetch('/api/commandes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commande)
        });
        
        if (response.ok) {
            const result = await response.json();
            BasketManager.clear();
            renderBasket();
            showConfirmation(result);
        } else {
            alert('Erreur lors de la validation de la commande');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur réseau');
    }
}

function showConfirmation(commande) {
    const modal = document.getElementById('confirmationModal');
    const message = document.getElementById('confirmationMessage');
    message.textContent = `Commande #${commande.id} validée pour un montant de ${commande.total.toFixed(2)} €`;
    modal.style.display = 'flex';
    
    const closeModal = () => modal.style.display = 'none';
    modal.querySelector('.close-modal').onclick = closeModal;
    modal.querySelector('.btn-modal-close').onclick = () => {
        closeModal();
        window.location.href = '/vendeur/dashboard';
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}