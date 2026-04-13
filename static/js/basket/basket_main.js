import { BasketManager } from '../class/BasketManager.js';

let currentClient = null;

document.addEventListener('DOMContentLoaded', () => {
    loadClientInfo();
    renderBasket();
    setupEventListeners();
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
        // Nettoyer le conteneur sans innerHTML
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }
    if (emptyDiv) emptyDiv.style.display = 'none';
    if (checkoutBtn) checkoutBtn.disabled = false;
    
    items.forEach((item, index) => {
        const row = createBasketItemRow(item, index);
        container?.appendChild(row);
    });
    
    updateTotalsDisplay();
}

function createBasketItemRow(item, index) {
    const row = document.createElement('div');
    row.className = 'basket-item';
    
    // Conteneur des infos produit
    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';
    
    // Icône du produit
    const productIcon = document.createElement('div');
    productIcon.className = 'product-icon';
    productIcon.textContent = item.icon || '🧹';
    
    // Détails du produit
    const productDetails = document.createElement('div');
    productDetails.className = 'product-details';
    
    const productName = document.createElement('div');
    productName.className = 'product-name';
    productName.textContent = escapeHtml(item.name);
    
    const productCategory = document.createElement('div');
    productCategory.className = 'product-category';
    productCategory.textContent = item.category || 'Balai';
    
    productDetails.appendChild(productName);
    productDetails.appendChild(productCategory);
    
    // Dates de location si nécessaire
    if (item.rentalDates) {
        const rentalDates = document.createElement('div');
        rentalDates.className = 'rental-dates';
        rentalDates.textContent = `📅 ${item.rentalDates}`;
        productDetails.appendChild(rentalDates);
    }
    
    productInfo.appendChild(productIcon);
    productInfo.appendChild(productDetails);
    
    // Type d'article (location/achat)
    const itemType = document.createElement('div');
    itemType.className = `item-type ${item.type === 'rent' ? 'rent' : 'buy'}`;
    itemType.textContent = item.type === 'rent' ? 'Location' : '🛒 Achat';
    
    // Prix
    const itemPrice = document.createElement('div');
    itemPrice.className = 'item-price';
    itemPrice.textContent = `${item.price.toFixed(2)} €`;
    if (item.type === 'rent') {
        const small = document.createElement('small');
        small.textContent = '/jour';
        itemPrice.appendChild(small);
    }
    
    // Contrôle de quantité
    const quantityControl = document.createElement('div');
    quantityControl.className = 'quantity-control';
    
    const decreaseBtn = document.createElement('button');
    decreaseBtn.className = 'quantity-btn';
    decreaseBtn.setAttribute('data-action', 'decrease');
    decreaseBtn.setAttribute('data-index', index);
    decreaseBtn.textContent = '-';
    decreaseBtn.addEventListener('click', () => {
        BasketManager.updateQuantity(index, item.quantity - 1);
        renderBasket();
    });
    
    const quantityValue = document.createElement('span');
    quantityValue.className = 'quantity-value';
    quantityValue.textContent = item.quantity;
    
    const increaseBtn = document.createElement('button');
    increaseBtn.className = 'quantity-btn';
    increaseBtn.setAttribute('data-action', 'increase');
    increaseBtn.setAttribute('data-index', index);
    increaseBtn.textContent = '+';
    increaseBtn.addEventListener('click', () => {
        BasketManager.updateQuantity(index, item.quantity + 1);
        renderBasket();
    });
    
    quantityControl.appendChild(decreaseBtn);
    quantityControl.appendChild(quantityValue);
    quantityControl.appendChild(increaseBtn);
    
    // Total de l'article
    const itemTotal = document.createElement('div');
    itemTotal.className = 'item-total';
    itemTotal.textContent = `${item.total.toFixed(2)} €`;
    
    // Bouton supprimer
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-item';
    removeBtn.setAttribute('data-index', index);
    removeBtn.textContent = '🗑️';
    removeBtn.addEventListener('click', () => {
        BasketManager.removeItem(index);
        renderBasket();
    });
    
    const removeContainer = document.createElement('div');
    removeContainer.appendChild(removeBtn);
    
    // Assemblage de la ligne
    row.appendChild(productInfo);
    row.appendChild(itemType);
    row.appendChild(itemPrice);
    row.appendChild(quantityControl);
    row.appendChild(itemTotal);
    row.appendChild(removeContainer);
    
    return row;
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
        window.location.href = '/dashboard';
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}