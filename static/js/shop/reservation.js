import {showNotification} from './notification.js';
import { updateCartCount } from './update_cart.js';
import { BasketManager } from '../class/BasketManager.js';
import { escapeHtml } from './escape_html.js';

export function showRentalModal(broom) {
    let modal = document.getElementById('rentalModal');
    if (modal) modal.remove();
    
    modal = document.createElement('div');
    modal.id = 'rentalModal';
    modal.className = 'rental-modal';
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const overlay = document.createElement('div');
    overlay.className = 'rental-modal-overlay';
    
    const content = document.createElement('div');
    content.className = 'rental-modal-content';
    
    const header = document.createElement('div');
    header.className = 'rental-modal-header';
    
    const title = document.createElement('h3');
    title.textContent = `Location : ${escapeHtml(broom.libelle)}`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'rental-modal-close';
    closeBtn.textContent = '×';
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    const body = document.createElement('div');
    body.className = 'rental-modal-body';
    
    const priceInfo = document.createElement('div');
    priceInfo.className = 'rental-price-info';
    
    const priceSpan = document.createElement('span');
    priceSpan.className = 'price';
    priceSpan.textContent = `${broom.prix_location.toFixed(2)}€`;
    
    const periodSpan = document.createElement('span');
    periodSpan.className = 'period';
    periodSpan.textContent = '/jour';
    
    priceInfo.appendChild(priceSpan);
    priceInfo.appendChild(periodSpan);
    
    const startGroup = document.createElement('div');
    startGroup.className = 'rental-form-group';
    
    const startLabel = document.createElement('label');
    startLabel.textContent = '📅 Date de début';
    
    const startInput = document.createElement('input');
    startInput.type = 'date';
    startInput.id = 'rentalStartDate';
    startInput.min = today;
    startInput.value = today;
    
    startGroup.appendChild(startLabel);
    startGroup.appendChild(startInput);
    
    const endGroup = document.createElement('div');
    endGroup.className = 'rental-form-group';
    
    const endLabel = document.createElement('label');
    endLabel.textContent = '📅 Date de fin';
    
    const endInput = document.createElement('input');
    endInput.type = 'date';
    endInput.id = 'rentalEndDate';
    endInput.min = today;
    endInput.value = tomorrowStr;
    
    endGroup.appendChild(endLabel);
    endGroup.appendChild(endInput);
    
    const daysGroup = document.createElement('div');
    daysGroup.className = 'rental-form-group';
    
    const daysLabel = document.createElement('label');
    daysLabel.textContent = '📊 Durée';
    
    const daysDisplay = document.createElement('div');
    daysDisplay.className = 'rental-days-display';
    daysDisplay.id = 'rentalDaysDisplay';
    daysDisplay.textContent = '- jours';
    
    daysGroup.appendChild(daysLabel);
    daysGroup.appendChild(daysDisplay);
    
    const totalGroup = document.createElement('div');
    totalGroup.className = 'rental-form-group';
    
    const totalLabel = document.createElement('label');
    totalLabel.textContent = 'Total';
    
    const totalDisplay = document.createElement('div');
    totalDisplay.className = 'rental-total-display';
    totalDisplay.id = 'rentalTotalDisplay';
    totalDisplay.textContent = '0,00 €';
    
    totalGroup.appendChild(totalLabel);
    totalGroup.appendChild(totalDisplay);
    
    const availabilityDiv = document.createElement('div');
    availabilityDiv.id = 'rentalAvailability';
    availabilityDiv.className = 'rental-availability';
    
    body.appendChild(priceInfo);
    body.appendChild(startGroup);
    body.appendChild(endGroup);
    body.appendChild(daysGroup);
    body.appendChild(totalGroup);
    body.appendChild(availabilityDiv);
    
    const footer = document.createElement('div');
    footer.className = 'rental-modal-footer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = 'Annuler';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-confirm';
    confirmBtn.textContent = 'Ajouter au panier';
    confirmBtn.disabled = true;
    
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    
    modal.appendChild(overlay);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    function calculateAndCheck() {
        const start = startInput.value;
        const end = endInput.value;
        
        if (!start || !end) {
            daysDisplay.textContent = '- jours';
            totalDisplay.textContent = '0,00 €';
            confirmBtn.disabled = true;
            return;
        }
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (endDate < startDate) {
            daysDisplay.textContent = 'Date invalide';
            totalDisplay.textContent = '0,00 €';
            confirmBtn.disabled = true;
            return;
        }
        
        const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        daysDisplay.textContent = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
        const total = diffDays * broom.prix_location;
        totalDisplay.textContent = `${total.toFixed(2)} €`;
        
        checkAvailability(broom.id, start, end, availabilityDiv, confirmBtn);
    }
    
    startInput.addEventListener('change', calculateAndCheck);
    endInput.addEventListener('change', calculateAndCheck);
    
    closeBtn.onclick = () => modal.remove();
    cancelBtn.onclick = () => modal.remove();
    overlay.onclick = () => modal.remove();
    
    confirmBtn.onclick = () => {
        const start = startInput.value;
        const end = endInput.value;
        const daysText = daysDisplay.textContent;
        const days = parseInt(daysText);
        const total = parseFloat(totalDisplay.textContent);
        
        const rentalItem = {
            id: broom.id,
            name: broom.libelle,
            type: 'rent',
            price: broom.prix_location,
            quantity: days,
            total: total,
            startDate: start,
            endDate: end,
            rentalDates: `${start} → ${end} (${days} jours)`,
            category: broom.categorie === 'magique' ? 'Balai magique ✨' : 'Balai traditionnel',
            icon: broom.categorie === 'magique' ? '✨🧹' : '🧹'
        };
        
        BasketManager.addItem(rentalItem);
        showNotification(`Location "${broom.libelle}" du ${start} au ${end} ajoutée au panier`, 'success');
        updateCartCount();
        BasketManager.updateCartButtonCount();
        modal.remove();
    };
    
    calculateAndCheck();
}

async function checkAvailability(broomId, startDate, endDate, container, confirmBtn) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    const checkingDiv = document.createElement('div');
    checkingDiv.className = 'availability-checking';
    checkingDiv.textContent = '🔄 Vérification...';
    container.appendChild(checkingDiv);
    
    try {
        const response = await fetch(`/api/locations/check?broom_id=${broomId}&start_date=${startDate}&end_date=${endDate}`);
        const data = await response.json();
        
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (data.available) {
            const successDiv = document.createElement('div');
            successDiv.className = 'availability-success';
            successDiv.textContent = '✓ Balai disponible !';
            container.appendChild(successDiv);
            confirmBtn.disabled = false;
        } else {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'availability-error';
            errorDiv.textContent = `✗ ${data.message}`;
            container.appendChild(errorDiv);
            confirmBtn.disabled = true;
        }
    } catch (error) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        const errorDiv = document.createElement('div');
        errorDiv.className = 'availability-error';
        errorDiv.textContent = 'Erreur de vérification';
        container.appendChild(errorDiv);
        confirmBtn.disabled = true;
    }
}