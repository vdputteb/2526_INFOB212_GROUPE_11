import { BasketManager } from '../class/BasketManager.js';

let currentClient = null;

document.addEventListener('DOMContentLoaded', () => {
    loadClientInfo();
    displayClientInfo();
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

function displayClientInfo() {
    // Afficher le nom du client
    const clientName = sessionStorage.getItem("ClientName") || "Client";
    const clientNameElement = document.getElementById('clientName');
    if (clientNameElement) {
        clientNameElement.textContent = clientName;
    }
    
    // Afficher l'argent du client
    const clientMoney = sessionStorage.getItem("ClientMoney");
    const moneyElement = document.getElementById('clientMoney');
    const moneyBox = document.querySelector('.client-money');
    
    if (clientMoney && !isNaN(parseFloat(clientMoney))) {
        const amount = parseFloat(clientMoney).toFixed(2);
        moneyElement.textContent = `${amount} €`;
        
        // Changer la couleur si solde bas
        if (parseFloat(clientMoney) < 50) {
            moneyBox.classList.add('insufficient');
        } else {
            moneyBox.classList.remove('insufficient');
        }
    } else {
        moneyElement.textContent = '0,00 €';
    }
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
    checkSufficientFunds();
}

function checkSufficientFunds() {
    const totals = BasketManager.calculateTotals();
    const clientMoney = sessionStorage.getItem("ClientMoney");
    const checkoutBtn = document.getElementById('checkoutBtn');
    const moneyBox = document.querySelector('.client-money');
    
    if (clientMoney && !isNaN(parseFloat(clientMoney))) {
        const currentMoney = parseFloat(clientMoney);
        const totalAmount = totals.total;
        
        if (currentMoney < totalAmount && totals.total > 0) {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = '💰 Solde insuffisant';
            checkoutBtn.style.backgroundColor = '#e74c3c';
            if (moneyBox) moneyBox.classList.add('insufficient');
        } else {
            if (checkoutBtn.disabled === true && totals.total > 0) {
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = 'Valider la commande';
                checkoutBtn.style.backgroundColor = '#27ae60';
            }
            if (moneyBox && parseFloat(clientMoney) >= 50) {
                moneyBox.classList.remove('insufficient');
            }
        }
    }
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
    document.getElementById('total').textContent = totals.total.toFixed(2) + ' €';
}

function setupEventListeners() {
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
}

async function checkout() {
    const items = BasketManager.getItems();
    if (!items.length) return;
    
    const totals = BasketManager.calculateTotals();
    const clientMoney = sessionStorage.getItem("ClientMoney");
    
    if (clientMoney && parseFloat(clientMoney) < totals.total) {
        alert('💰 Solde insuffisant pour effectuer cette commande !');
        return;
    }
    
    const buyItems = items.filter(item => item.type === 'buy');
    const rentItems = items.filter(item => item.type === 'rent');
    
    const successfulRents = [];
    const failedRents = [];
    let buySuccess = false;
    let buyError = null;
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Traitement en cours...';
    
    try {
        for (const item of rentItems) {
            try {
                const response = await fetch('/api/locations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        broomId: item.id,
                        startDate: item.startDate,
                        endDate: item.endDate
                    })
                });
                
                if (response.ok) {
                    successfulRents.push(item);
                } else {
                    const error = await response.json();
                    failedRents.push({ item, error: error.detail || 'Erreur lors de la réservation' });
                }
            } catch (error) {
                failedRents.push({ item, error: error.message });
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
                const response = await fetch('/api/ventes', {
                    credentials: 'include',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(commandeData)
                });
                
                buySuccess = response.ok;
                if (!buySuccess) {
                    const error = await response.json();
                    buyError = error.detail || 'Erreur lors de la commande';
                }
            } catch (error) {
                buyError = error.message;
            }
        }
        
        if (failedRents.length === 0 && (buyItems.length === 0 || buySuccess)) {
            const newBalance = parseFloat(clientMoney) - totals.total;
            sessionStorage.setItem("ClientMoney", newBalance.toString());
            displayClientInfo();
            
            BasketManager.clear();
            renderBasket();
            showSuccessConfirmation(successfulRents, buySuccess, buyItems, newBalance);
        } else {
            for (const rent of successfulRents) {
                const currentItems = BasketManager.getItems();
                const index = currentItems.findIndex(item => 
                    item.id === rent.id && item.type === 'rent'
                );
                if (index !== -1) BasketManager.removeItem(index);
            }
            
            if (buySuccess && buyItems.length > 0) {
                for (const buyItem of buyItems) {
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

function showSuccessConfirmation(successfulRents, buySuccess, buyItems, newBalance) {
    const modal = document.getElementById('confirmationModal');
    const message = document.getElementById('confirmationMessage');
    
    let messageHtml = '<div style="text-align: left;">';
    messageHtml += '<strong>Commande validée !</strong><br><br>';
    
    if (successfulRents.length > 0) {
        messageHtml += '<strong>📍 Locations :</strong><br>';
        successfulRents.forEach(rent => {
            messageHtml += `&nbsp;&nbsp;• ${rent.name}<br>`;
        });
        messageHtml += '<br>';
    }
    
    if (buySuccess && buyItems.length > 0) {
        messageHtml += '<strong>🛒 Achats :</strong><br>';
        buyItems.forEach(item => {
            messageHtml += `&nbsp;&nbsp;• ${item.name} x${item.quantity}<br>`;
        });
        messageHtml += '<br>';
    }
    
    messageHtml += `<div class="balance-update">💰 Nouveau solde : ${newBalance.toFixed(2)} €</div>`;
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
    
    let messageHtml = '<div style="text-align: left;">';
    messageHtml += '<strong>⚠️ Validation partielle</strong><br><br>';
    
    if (successfulRents.length > 0) {
        messageHtml += '<strong style="color: green;">Locations confirmées :</strong><br>';
        successfulRents.forEach(rent => {
            messageHtml += `&nbsp;&nbsp;• ${rent.name}<br>`;
        });
        messageHtml += '<br>';
    }
    
    if (failedRents.length > 0) {
        messageHtml += '<strong style="color: red;">Locations échouées :</strong><br>';
        failedRents.forEach(rent => {
            messageHtml += `&nbsp;&nbsp;• ${rent.item.name} - ${rent.error}<br>`;
        });
        messageHtml += '<br>';
    }
    
    if (buySuccess) {
        messageHtml += '<strong style="color: green;">Achats confirmés :</strong><br>';
        buyItems.forEach(item => {
            messageHtml += `&nbsp;&nbsp;• ${item.name} x${item.quantity}<br>`;
        });
    } else if (buyItems.length > 0) {
        messageHtml += '<strong style="color: red;">Échec des achats :</strong><br>';
        messageHtml += `&nbsp;&nbsp;• ${buyError}<br>`;
    }
    
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