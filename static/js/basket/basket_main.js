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
    row.dataset.index = index;
    
    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';
    
    const productIcon = document.createElement('div');
    productIcon.className = 'product-icon';
    productIcon.textContent = item.icon || '🧹';
    
    const productDetails = document.createElement('div');
    productDetails.className = 'product-details';
    
    const productName = document.createElement('div');
    productName.className = 'product-name';
    productName.textContent = escapeHtml(item.name);
    
    const broomId = document.createElement('div');
    broomId.className = 'product-id';
    broomId.textContent = `ID: ${item.id}`;
    
    const productCategory = document.createElement('div');
    productCategory.className = 'product-category';
    productCategory.textContent = item.category || 'Balai';
    
    productDetails.appendChild(productName);
    productDetails.appendChild(broomId);
    productDetails.appendChild(productCategory);
    
    productInfo.appendChild(productIcon);
    productInfo.appendChild(productDetails);
    
    const itemType = document.createElement('div');
    itemType.className = `item-type ${item.type === 'rent' ? 'rent' : 'buy'}`;
    itemType.textContent = item.type === 'rent' ? '📍 Location' : '🛒 Achat';
    
    const itemPrice = document.createElement('div');
    itemPrice.className = 'item-price';
    itemPrice.textContent = `${item.price.toFixed(2)} €`;
    if (item.type === 'rent') {
        const small = document.createElement('small');
        small.textContent = '/jour';
        itemPrice.appendChild(small);
    }
    
    let rentalSection = null;
    if (item.type === 'rent') {
        rentalSection = createRentalSection(item, index);
    }
    
    const quantityControl = document.createElement('div');
    quantityControl.className = 'quantity-control';
    
    let itemTotalDisplay = document.createElement('div');
    itemTotalDisplay.className = 'item-total';
    
    if (item.type === 'buy') {
        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'quantity-btn';
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
        increaseBtn.textContent = '+';
        increaseBtn.addEventListener('click', () => {
            BasketManager.updateQuantity(index, item.quantity + 1);
            renderBasket();
        });
        
        quantityControl.appendChild(decreaseBtn);
        quantityControl.appendChild(quantityValue);
        quantityControl.appendChild(increaseBtn);
        itemTotalDisplay.textContent = `${item.total.toFixed(2)} €`;
    } else {
        const quantityValue = document.createElement('span');
        quantityValue.className = 'quantity-value static';
        quantityValue.textContent = '1';
        quantityControl.appendChild(quantityValue);
        
        const totalPrice = item.price * (item.rentalDays || 1);
        itemTotalDisplay.textContent = `${totalPrice.toFixed(2)} €`;
    }
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-item';
    removeBtn.textContent = '🗑️';
    removeBtn.addEventListener('click', () => {
        BasketManager.removeItem(index);
        renderBasket();
    });
    
    const removeContainer = document.createElement('div');
    removeContainer.appendChild(removeBtn);
    
    row.appendChild(productInfo);
    row.appendChild(itemType);
    row.appendChild(itemPrice);
    if (rentalSection) {
        const rentalContainer = document.createElement('div');
        rentalContainer.className = 'rental-container';
        rentalContainer.appendChild(rentalSection);
        row.appendChild(rentalContainer);
    } else {
        row.appendChild(quantityControl);
    }
    row.appendChild(itemTotalDisplay);
    row.appendChild(removeContainer);
    
    return row;
}

function createRentalSection(item, index) {
    const container = document.createElement('div');
    container.className = 'rental-control';
    
    const startDate = item.startDate ? new Date(item.startDate) : new Date();
    const endDate = item.endDate ? new Date(item.endDate) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    
    const startInput = document.createElement('input');
    startInput.type = 'date';
    startInput.className = 'date-input start-date';
    startInput.value = startDate.toISOString().split('T')[0];
    startInput.required = true;
    
    const endInput = document.createElement('input');
    endInput.type = 'date';
    endInput.className = 'date-input end-date';
    endInput.value = endDate.toISOString().split('T')[0];
    endInput.required = true;
    
    const daysSpan = document.createElement('span');
    daysSpan.className = 'rental-days';
    const currentDays = item.rentalDays || 1;
    daysSpan.textContent = `${currentDays} jour${currentDays > 1 ? 's' : ''}`;
    
    const updateButton = document.createElement('button');
    updateButton.className = 'update-dates-btn';
    updateButton.textContent = 'Mettre à jour';
    updateButton.addEventListener('click', async () => {
        const newStart = startInput.value;
        const newEnd = endInput.value;
        
        if (!newStart || !newEnd) {
            alert('Veuillez sélectionner les dates');
            return;
        }
        
        if (new Date(newStart) >= new Date(newEnd)) {
            alert('La date de fin doit être après la date de début');
            return;
        }
        
        try {
            const response = await fetch(`/api/reservations/check?broom_id=${item.id}&start_date=${newStart}&end_date=${newEnd}`);
            const data = await response.json();
            
            if (!data.available) {
                alert(`Ce balai n'est pas disponible du ${newStart} au ${newEnd}. ${data.message}`);
                return;
            }
            
            BasketManager.updateRentalDates(index, newStart, newEnd);
            renderBasket();
        } catch (error) {
            console.error('Erreur lors de la vérification:', error);
            alert('Erreur lors de la vérification des dates');
        }
    });
    
    container.appendChild(startInput);
    container.appendChild(document.createTextNode(' → '));
    container.appendChild(endInput);
    container.appendChild(updateButton);
    container.appendChild(daysSpan);
    
    const updateDaysDisplay = () => {
        if (startInput.value && endInput.value) {
            const days = Math.ceil((new Date(endInput.value) - new Date(startInput.value)) / (1000 * 60 * 60 * 24));
            if (days > 0) {
                daysSpan.textContent = `${days} jour${days > 1 ? 's' : ''} → ${(item.price * days).toFixed(2)} €`;
            }
        }
    };
    
    startInput.addEventListener('change', updateDaysDisplay);
    endInput.addEventListener('change', updateDaysDisplay);
    updateDaysDisplay();
    
    return container;
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
    
    // Sauvegarder le panier actuel en cas d'échec partiel
    const originalItems = [...items];
    
    // Séparer les achats et les locations
    const buyItems = items.filter(item => item.type === 'buy');
    const rentItems = items.filter(item => item.type === 'rent');
    
    const successfulRents = [];
    const failedRents = [];
    let buySuccess = false;
    let buyError = null;
    
    // Désactiver le bouton pendant le traitement
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Traitement en cours...';
    
    try {
        // 1. Traiter d'abord les locations
        for (const item of rentItems) {
            try {
                const reservationData = {
                    broomId: item.id,
                    startDate: item.startDate,
                    endDate: item.endDate
                };
                
                const response = await fetch('/api/reservations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reservationData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    successfulRents.push({
                        index: items.indexOf(item),
                        item: item,
                        result: result
                    });
                } else {
                    const error = await response.json();
                    failedRents.push({
                        index: items.indexOf(item),
                        item: item,
                        error: error.detail || 'Erreur lors de la réservation'
                    });
                }
            } catch (error) {
                failedRents.push({
                    index: items.indexOf(item),
                    item: item,
                    error: error.message
                });
            }
        }
        
        if (buyItems.length > 0) {
            const commandeData = {
                sale_date: new Date().toISOString().split('T')[0],
                broom_ids: []
            };
            buyItems.forEach(item => {
                for (let i = 0; i < item.quantity; i++) {
                    commandeData.broom_ids.push(item.id);
                }
            });
            
            try {
                const response = await fetch('/api/commandes', {
                    credentials: 'include',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(commandeData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    buySuccess = true;
                } else {
                    const error = await response.json();
                    buyError = error.detail || 'Erreur lors de la commande';
                }
            } catch (error) {
                buyError = error.message;
            }
        }
        
        // 3. Afficher le résultat et nettoyer le panier
        if (failedRents.length === 0 && (buyItems.length === 0 || buySuccess)) {
            BasketManager.clear();
            renderBasket();
            showSuccessConfirmation(successfulRents, buySuccess, buyItems);
        } else {
            for (let i = successfulRents.length - 1; i >= 0; i--) {
                const rent = successfulRents[i];
                const currentItems = BasketManager.getItems();
                const currentIndex = currentItems.findIndex(item => 
                    item.id === rent.item.id && 
                    item.type === 'rent' &&
                    item.startDate === rent.item.startDate &&
                    item.endDate === rent.item.endDate
                );
                if (currentIndex !== -1) {
                    BasketManager.removeItem(currentIndex);
                }
            }
            
            
            if (buySuccess && buyItems.length > 0) {
                for (let i = buyItems.length - 1; i >= 0; i--) {
                    const buyItem = buyItems[i];
                    const currentItems = BasketManager.getItems();
                    
                    const indicesToRemove = [];
                    currentItems.forEach((item, idx) => {
                        if (item.id === buyItem.id && item.type === 'buy') {
                            indicesToRemove.push(idx);
                        }
                    });
                    for (let j = indicesToRemove.length - 1; j >= 0; j--) {
                        BasketManager.removeItem(indicesToRemove[j]);
                    }
                }
            }
            
            renderBasket();
            showPartialConfirmation(successfulRents, failedRents, buySuccess, buyError, buyItems);
        }
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Valider la commande';
    }
}

function showSuccessConfirmation(successfulRents, buySuccess, buyItems) {
    const modal = document.getElementById('confirmationModal');
    const message = document.getElementById('confirmationMessage');
    
    let messageHtml = '<div class="confirmation-success">';
    messageHtml += '<strong> Commande validée avec succès !</strong><br><br>';
    
    if (successfulRents.length > 0) {
        messageHtml += '<strong>📍 Locations confirmées :</strong><br>';
        successfulRents.forEach(rent => {
            const days = Math.ceil((new Date(rent.item.endDate) - new Date(rent.item.startDate)) / (1000 * 60 * 60 * 24));
            messageHtml += `&nbsp;&nbsp;• ${rent.item.name} - Du ${rent.item.startDate} au ${rent.item.endDate} (${days} jours)<br>`;
        });
        messageHtml += '<br>';
    }
    
    if (buySuccess && buyItems.length > 0) {
        messageHtml += '<strong>🛒 Achats confirmés :</strong><br>';
        buyItems.forEach(item => {
            messageHtml += `&nbsp;&nbsp;• ${item.name} x${item.quantity}<br>`;
        });
        messageHtml += '<br>';
    }
    
    messageHtml += 'Un email de confirmation vous sera envoyé.';
    messageHtml += '</div>';
    
    message.innerHTML = messageHtml;
    modal.style.display = 'flex';
    
    const closeModal = () => {
        modal.style.display = 'none';
        window.location.href = '/dashboard';
    };
    
    modal.querySelector('.close-modal').onclick = closeModal;
    modal.querySelector('.btn-modal-close').onclick = closeModal;
}

function showPartialConfirmation(successfulRents, failedRents, buySuccess, buyError, buyItems) {
    const modal = document.getElementById('confirmationModal');
    const message = document.getElementById('confirmationMessage');
    
    let messageHtml = '<div class="confirmation-partial">';
    messageHtml += '<strong>⚠️ Validation partielle</strong><br><br>';
    
    if (successfulRents.length > 0) {
        messageHtml += '<strong style="color: green;"> Locations confirmées :</strong><br>';
        successfulRents.forEach(rent => {
            messageHtml += `&nbsp;&nbsp;• ${rent.item.name}<br>`;
        });
        messageHtml += '<br>';
    }
    
    if (failedRents.length > 0) {
        messageHtml += '<strong style="color: red;"> Locations échouées :</strong><br>';
        failedRents.forEach(rent => {
            messageHtml += `&nbsp;&nbsp;• ${rent.item.name} - ${rent.error}<br>`;
        });
        messageHtml += '<br>';
    }
    
    if (buySuccess) {
        messageHtml += '<strong style="color: green;"> Achats confirmés :</strong><br>';
        buyItems.forEach(item => {
            messageHtml += `&nbsp;&nbsp;• ${item.name} x${item.quantity}<br>`;
        });
        messageHtml += '<br>';
    } else if (buyItems.length > 0) {
        messageHtml += '<strong style="color: red;"> Échec des achats :</strong><br>';
        messageHtml += `&nbsp;&nbsp;• ${buyError}<br><br>`;
    }
    
    messageHtml += '<strong>Les éléments validés ont été retirés de votre panier.</strong><br>';
    messageHtml += 'Veuillez corriger les erreurs pour les autres articles.';
    messageHtml += '</div>';
    
    message.innerHTML = messageHtml;
    modal.style.display = 'flex';
    
    const closeModal = () => {
        modal.style.display = 'none';
    };
    
    modal.querySelector('.close-modal').onclick = closeModal;
    modal.querySelector('.btn-modal-close').onclick = closeModal;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}