// shop_rental.js
import { showNotification } from './shop_utils.js';

// État actuel des réservations
let currentReservations = [];

// Structure d'une réservation
// {
//     broomId: number,
//     startDate: string (YYYY-MM-DD),
//     endDate: string (YYYY-MM-DD),
//     userId: string
// }

/**
 * Charge les réservations depuis l'API
 */
export async function loadReservations() {
    try {
        const response = await fetch('/api/reservations');
        if (response.ok) {
            currentReservations = await response.json();
            console.log(`${currentReservations.length} réservations chargées`);
        }
    } catch (error) {
        console.error('Erreur chargement réservations:', error);
        currentReservations = [];
    }
}

/**
 * Vérifie si un balai est disponible pour une période donnée
 */
export function isBroomAvailable(broomId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const conflicting = currentReservations.filter(res => res.broomId === broomId);
    
    for (const res of conflicting) {
        const resStart = new Date(res.startDate);
        const resEnd = new Date(res.endDate);
        
        // Vérifie si les périodes se chevauchent
        if ((start <= resEnd && end >= resStart)) {
            return false;
        }
    }
    return true;
}

/**
 * Crée une nouvelle réservation
 */
export async function createReservation(broomId, startDate, endDate, userId = 'anonymous') {
    try {
        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                broomId,
                startDate,
                endDate,
                userId
            })
        });
        
        if (response.ok) {
            const newRes = await response.json();
            currentReservations.push(newRes);
            return { success: true, reservation: newRes };
        } else {
            const error = await response.json();
            return { success: false, error: error.message };
        }
    } catch (error) {
        console.error('Erreur création réservation:', error);
        return { success: false, error: 'Erreur réseau' };
    }
}

/**
 * Obtient les dates indisponibles pour un balai
 */
export function getUnavailableDates(broomId) {
    const reservations = currentReservations.filter(res => res.broomId === broomId);
    const unavailableDates = [];
    
    reservations.forEach(res => {
        const start = new Date(res.startDate);
        const end = new Date(res.endDate);
        const current = new Date(start);
        
        while (current <= end) {
            unavailableDates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
    });
    
    return unavailableDates;
}

/**
 * Affiche le modal de location
 */
export function showRentalModal(broom, onSuccess) {
    // Vérifier si le modal existe déjà
    let modal = document.getElementById('rentalModal');
    if (modal) {
        modal.remove();
    }
    
    // Créer le modal
    modal = document.createElement('div');
    modal.id = 'rentalModal';
    modal.className = 'rental-modal';
    
    // Date d'aujourd'hui au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    modal.innerHTML = `
        <div class="rental-modal-overlay"></div>
        <div class="rental-modal-content">
            <div class="rental-modal-header">
                <h3>📍 Location : ${escapeHtml(broom.libelle)}</h3>
                <button class="rental-modal-close">&times;</button>
            </div>
            <div class="rental-modal-body">
                <div class="rental-price-info">
                    <span class="price">${broom.prix_location.toFixed(2)}€</span>
                    <span class="period">/jour</span>
                </div>
                
                <div class="rental-form-group">
                    <label for="rentalStartDate">📅 Date de début</label>
                    <input type="date" id="rentalStartDate" min="${today}" max="${maxDateStr}" value="${today}">
                </div>
                
                <div class="rental-form-group">
                    <label for="rentalEndDate">📅 Date de fin</label>
                    <input type="date" id="rentalEndDate" min="${today}" max="${maxDateStr}">
                </div>
                
                <div class="rental-form-group">
                    <label for="rentalDays">📊 Durée</label>
                    <div class="rental-days-display" id="rentalDaysDisplay">- jours</div>
                </div>
                
                <div class="rental-form-group">
                    <label for="rentalTotal">💰 Total</label>
                    <div class="rental-total-display" id="rentalTotalDisplay">0,00 €</div>
                </div>
                
                <div class="rental-availability" id="rentalAvailability">
                    <div class="availability-checking">Vérification de disponibilité...</div>
                </div>
            </div>
            <div class="rental-modal-footer">
                <button class="btn-cancel">Annuler</button>
                <button class="btn-confirm" id="rentalConfirmBtn" disabled>Ajouter au panier</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Éléments du modal
    const overlay = modal.querySelector('.rental-modal-overlay');
    const closeBtn = modal.querySelector('.rental-modal-close');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const startDateInput = modal.querySelector('#rentalStartDate');
    const endDateInput = modal.querySelector('#rentalEndDate');
    const daysDisplay = modal.querySelector('#rentalDaysDisplay');
    const totalDisplay = modal.querySelector('#rentalTotalDisplay');
    const availabilityDiv = modal.querySelector('#rentalAvailability');
    const confirmBtn = modal.querySelector('#rentalConfirmBtn');
    
    let currentAvailability = false;
    let currentDays = 0;
    
    // Fonction pour calculer les jours
    function calculateDays() {
        const start = startDateInput.value;
        const end = endDateInput.value;
        
        if (!start || !end) {
            daysDisplay.textContent = '- jours';
            totalDisplay.textContent = '0,00 €';
            return 0;
        }
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (endDate < startDate) {
            daysDisplay.textContent = 'Date de fin invalide';
            totalDisplay.textContent = '0,00 €';
            return 0;
        }
        
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        daysDisplay.textContent = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
        const total = diffDays * broom.prix_location;
        totalDisplay.textContent = `${total.toFixed(2)} €`;
        
        return diffDays;
    }
    
    // Fonction pour vérifier la disponibilité
    async function checkAvailability() {
        const start = startDateInput.value;
        const end = endDateInput.value;
        
        if (!start || !end) {
            availabilityDiv.innerHTML = '<div class="availability-error">Veuillez sélectionner des dates</div>';
            confirmBtn.disabled = true;
            currentAvailability = false;
            return;
        }
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (endDate < startDate) {
            availabilityDiv.innerHTML = '<div class="availability-error">La date de fin doit être postérieure à la date de début</div>';
            confirmBtn.disabled = true;
            currentAvailability = false;
            return;
        }
        
        availabilityDiv.innerHTML = '<div class="availability-checking">🔄 Vérification de disponibilité...</div>';
        
        try {
            const response = await fetch(`/api/reservations/check?broomId=${broom.id}&startDate=${start}&endDate=${end}`);
            const data = await response.json();
            
            if (data.available) {
                availabilityDiv.innerHTML = '<div class="availability-success">✅ Balai disponible pour cette période !</div>';
                confirmBtn.disabled = false;
                currentAvailability = true;
            } else {
                availabilityDiv.innerHTML = `<div class="availability-error">❌ Balai déjà réservé du ${data.conflictStart} au ${data.conflictEnd}</div>`;
                confirmBtn.disabled = true;
                currentAvailability = false;
            }
        } catch (error) {
            availabilityDiv.innerHTML = '<div class="availability-error">⚠️ Erreur de vérification</div>';
            confirmBtn.disabled = true;
            currentAvailability = false;
        }
    }
    
    // Fonction pour ajouter au panier
    function addToBasketWithDates() {
        if (!currentAvailability) return;
        
        const start = startDateInput.value;
        const end = endDateInput.value;
        const days = calculateDays();
        const total = days * broom.prix_location;
        
        const rentalItem = {
            id: broom.id,
            name: broom.libelle,
            type: 'rent',
            price: broom.prix_location,
            quantity: days,
            totalPrice: total,
            startDate: start,
            endDate: end,
            days: days,
            category: broom.categorie === 'magique' ? 'Balai magique ✨' : 'Balai traditionnel',
            icon: broom.categorie === 'magique' ? '✨🧹' : '🧹',
            rentalDates: `${start} → ${end} (${days} jours)`
        };
        
        if (window.BasketManager) {
            window.BasketManager.addRentalItem(rentalItem);
            showNotification(`📍 "${broom.libelle}" ajouté au panier du ${start} au ${end}`, "success");
        }
        
        closeModal();
        if (onSuccess) onSuccess();
    }
    
    function closeModal() {
        modal.remove();
    }
    
    // Événements
    startDateInput.addEventListener('change', () => {
        calculateDays();
        checkAvailability();
    });
    
    endDateInput.addEventListener('change', () => {
        calculateDays();
        checkAvailability();
    });
    
    confirmBtn.addEventListener('click', addToBasketWithDates);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // Initialisation
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    endDateInput.value = tomorrow.toISOString().split('T')[0];
    calculateDays();
    checkAvailability();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}