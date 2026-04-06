// basket_main.js
// Structure de données pour le panier (stocké dans localStorage)

// Clé pour le localStorage
const STORAGE_KEY = 'locbalais_basket';

// Structure d'un article du panier
// {
//     id: number,
//     name: string,
//     type: 'rent' | 'buy',
//     price: number,
//     quantity: number,
//     category: string,
//     icon: string,
//     startDate?: string,
//     endDate?: string,
//     days?: number,
//     rentalDates?: string
// }

// Initialisation du panier
let basket = [];

// Charger le panier depuis localStorage
function loadBasket() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            basket = JSON.parse(saved);
        } catch(e) {
            basket = [];
        }
    }
    return basket;
}

// Sauvegarder le panier dans localStorage
function saveBasket() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
}

// Ajouter un article d'achat au panier
function addToBasket(item) {
    const existingIndex = basket.findIndex(i => i.id === item.id && i.type === item.type && !i.startDate);
    
    if (existingIndex !== -1) {
        basket[existingIndex].quantity += item.quantity;
    } else {
        basket.push({ ...item });
    }
    
    saveBasket();
    renderBasket();
}

// Ajouter un article de location avec dates
function addRentalItem(rentalItem) {
    // Vérifier si le même balai est déjà loué sur les mêmes dates
    const existingIndex = basket.findIndex(i => 
        i.id === rentalItem.id && 
        i.type === 'rent' && 
        i.startDate === rentalItem.startDate && 
        i.endDate === rentalItem.endDate
    );
    
    if (existingIndex !== -1) {
        basket[existingIndex].quantity += rentalItem.quantity;
        basket[existingIndex].totalPrice = basket[existingIndex].quantity * basket[existingIndex].price;
    } else {
        basket.push({ ...rentalItem });
    }
    
    saveBasket();
    renderBasket();
}

// Supprimer un article du panier
function removeFromBasket(index) {
    const removedItem = basket[index];
    basket.splice(index, 1);
    saveBasket();
    renderBasket();
    
    // Afficher le modal de confirmation
    showConfirmationModal(removedItem.name);
}

// Mettre à jour la quantité d'un article
function updateQuantity(index, newQuantity) {
    if (newQuantity < 1) {
        removeFromBasket(index);
        return;
    }
    
    basket[index].quantity = newQuantity;
    if (basket[index].type === 'rent' && basket[index].days) {
        basket[index].totalPrice = basket[index].price * newQuantity * basket[index].days;
    }
    saveBasket();
    renderBasket();
}

// Calculer les totaux
function calculateTotals() {
    let subtotal = 0;
    
    basket.forEach(item => {
        if (item.type === 'rent' && item.totalPrice) {
            subtotal += item.totalPrice;
        } else {
            subtotal += item.price * item.quantity;
        }
    });
    
    // Frais de livraison
    let deliveryFee = 0;
    if (subtotal > 0 && subtotal < 50) {
        deliveryFee = 5.90;
    }
    
    // Éco-participation (0.50€ par article)
    let ecoFee = basket.reduce((sum, item) => sum + (item.quantity * 0.50), 0);
    
    const total = subtotal + deliveryFee + ecoFee;
    
    return {
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        ecoFee: ecoFee,
        total: total
    };
}

// Mettre à jour l'affichage des totaux
function updateTotalsDisplay() {
    const totals = calculateTotals();
    
    document.getElementById('subtotal').textContent = totals.subtotal.toFixed(2) + ' €';
    document.getElementById('deliveryFee').textContent = totals.deliveryFee.toFixed(2) + ' €';
    document.getElementById('ecoFee').textContent = totals.ecoFee.toFixed(2) + ' €';
    document.getElementById('total').textContent = totals.total.toFixed(2) + ' €';
}

// Afficher le modal de confirmation
function showConfirmationModal(itemName) {
    const modal = document.getElementById('confirmationModal');
    const modalText = modal.querySelector('p');
    modalText.textContent = `"${itemName}" a été supprimé de votre panier`;
    modal.style.display = 'flex';
    
    // Fermeture du modal
    const closeBtn = modal.querySelector('.close-modal');
    const modalCloseBtn = modal.querySelector('.btn-modal-close');
    
    const closeModal = () => {
        modal.style.display = 'none';
    };
    
    closeBtn.onclick = closeModal;
    modalCloseBtn.onclick = closeModal;
    
    // Fermer en cliquant en dehors
    window.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };
    
    // Auto-fermeture après 2 secondes
    setTimeout(closeModal, 2000);
}

// Rendre le panier
function renderBasket() {
    const container = document.getElementById('basketItemsList');
    const emptyDiv = document.getElementById('emptyBasket');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!basket || basket.length === 0) {
        if (container) container.style.display = 'none';
        if (emptyDiv) emptyDiv.style.display = 'block';
        if (checkoutBtn) checkoutBtn.disabled = true;
        updateTotalsDisplay();
        return;
    }
    
    if (container) container.style.display = 'block';
    if (emptyDiv) emptyDiv.style.display = 'none';
    if (checkoutBtn) checkoutBtn.disabled = false;
    
    if (container) container.innerHTML = '';
    
    basket.forEach((item, index) => {
        const itemElement = createBasketItemElement(item, index);
        if (container) container.appendChild(itemElement);
    });
    
    updateTotalsDisplay();
}

// Créer l'élément HTML pour un article
function createBasketItemElement(item, index) {
    const div = document.createElement('div');
    div.className = 'basket-item';
    
    let total;
    if (item.type === 'rent' && item.totalPrice) {
        total = item.totalPrice;
    } else {
        total = item.price * item.quantity;
    }
    
    let typeText = item.type === 'rent' ? '📍 Location' : '🛒 Achat';
    let priceDetails = `${item.price.toFixed(2)} €`;
    if (item.type === 'rent') {
        priceDetails += '<small>/jour</small>';
    }
    
    let extraDetails = '';
    if (item.type === 'rent' && item.rentalDates) {
        extraDetails = `<div class="rental-dates">📅 ${item.rentalDates}</div>`;
    }
    
    div.innerHTML = `
        <div class="product-info">
            <div class="product-icon">${item.icon || '🧹'}</div>
            <div class="product-details">
                <div class="product-name">${escapeHtml(item.name)}</div>
                <div class="product-category">${item.category || 'Balai'}</div>
                ${extraDetails}
            </div>
        </div>
        <div class="item-type ${item.type === 'rent' ? 'rent' : 'buy'}">
            ${typeText}
        </div>
        <div class="item-price">
            ${priceDetails}
        </div>
        <div class="quantity-control">
            <button class="quantity-btn" data-action="decrease" data-index="${index}">-</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn" data-action="increase" data-index="${index}">+</button>
        </div>
        <div class="item-total">
            ${total.toFixed(2)} €
        </div>
        <div>
            <button class="remove-item" data-index="${index}" title="Supprimer">🗑️</button>
        </div>
    `;
    
    // Ajouter les écouteurs d'événements
    const decreaseBtn = div.querySelector('[data-action="decrease"]');
    const increaseBtn = div.querySelector('[data-action="increase"]');
    const removeBtn = div.querySelector('.remove-item');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            updateQuantity(index, item.quantity - 1);
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            updateQuantity(index, item.quantity + 1);
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            removeFromBasket(index);
        });
    }
    
    return div;
}

// Fonction utilitaire pour échapper les caractères HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Vider le panier (utilisé après validation de commande)
function clearBasket() {
    basket = [];
    saveBasket();
    renderBasket();
}

// Obtenir le nombre total d'articles dans le panier
function getTotalItems() {
    return basket.reduce((sum, item) => sum + item.quantity, 0);
}

// Obtenir le panier (pour export)
function getBasket() {
    return [...basket];
}

// Fonction pour passer la commande
function checkout() {
    if (basket.length === 0) {
        alert('Votre panier est vide');
        return;
    }
    
    const totals = calculateTotals();
    
    // Simulation de commande
    if (confirm(`Confirmez-vous votre commande d'un montant de ${totals.total.toFixed(2)} € ?`)) {
        alert('Commande confirmée ! Merci de votre confiance.');
        clearBasket();
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadBasket();
    renderBasket();
    
    // Écouteur pour le bouton de paiement
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
    
    // Mettre à jour le compteur du panier dans le header si présent
    const updateCartCounter = () => {
        const cartLink = document.querySelector('nav a[href="#"]');
        if (cartLink && cartLink.textContent.includes('Panier')) {
            const count = getTotalItems();
            if (count > 0) {
                cartLink.textContent = `Panier (${count})`;
            } else {
                cartLink.textContent = 'Panier';
            }
        }
    };
    
    // Observer les changements du panier
    const observer = new MutationObserver(updateCartCounter);
    observer.observe(document.body, { childList: true, subtree: true });
    updateCartCounter();
});

// Export des fonctions pour une utilisation externe
window.BasketManager = {
    addToBasket,
    addRentalItem,
    removeFromBasket,
    updateQuantity,
    clearBasket,
    getBasket,
    getTotalItems,
    loadBasket
};