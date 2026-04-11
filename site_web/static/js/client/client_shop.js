// static/js/client/client_shop.js
import { fetchCatalogue } from '../catalogue.js';
import { BasketManager } from '../basket_manager.js';

let currentBrooms = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadCatalogue();
    setupEventListeners();
    BasketManager.createCartButton();  // ← Afficher le panier flottant uniquement ici
    updateCartCount();
});

async function loadCatalogue() {
    const brooms = await fetchCatalogue();
    if (brooms) {
        currentBrooms = brooms;
        applyFiltersAndDisplay();
    }
}

function setupEventListeners() {
    document.getElementById('category')?.addEventListener('change', () => applyFiltersAndDisplay());
    document.getElementById('prix')?.addEventListener('change', () => applyFiltersAndDisplay());
    document.getElementById('prixVente')?.addEventListener('change', () => applyFiltersAndDisplay());
    document.getElementById('searchInput')?.addEventListener('input', () => applyFiltersAndDisplay());
    document.getElementById('sortSelect')?.addEventListener('change', () => applyFiltersAndDisplay());
}

function applyFiltersAndDisplay() {
    let filtered = [...currentBrooms];
    
    const category = document.getElementById('category')?.value;
    if (category && category !== 'all') {
        filtered = filtered.filter(b => b.categorie === category);
    }
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(b => 
            b.libelle.toLowerCase().includes(searchTerm) || 
            b.description.toLowerCase().includes(searchTerm)
        );
    }
    
    const prix = document.getElementById('prix')?.value;
    if (prix && prix !== 'all') {
        if (prix === '20+') {
            filtered = filtered.filter(b => b.prix_location > 20);
        } else {
            const [min, max] = prix.split('-');
            filtered = filtered.filter(b => b.prix_location >= parseFloat(min) && b.prix_location <= parseFloat(max));
        }
    }
    
    const prixVente = document.getElementById('prixVente')?.value;
    if (prixVente && prixVente !== 'all') {
        if (prixVente === '100+') {
            filtered = filtered.filter(b => b.prix_vente > 100);
        } else {
            const [min, max] = prixVente.split('-');
            filtered = filtered.filter(b => b.prix_vente >= parseFloat(min) && b.prix_vente <= parseFloat(max));
        }
    }
    
    const sortValue = document.getElementById('sortSelect')?.value;
    switch(sortValue) {
        case 'prix-croissant': filtered.sort((a,b) => a.prix_location - b.prix_location); break;
        case 'prix-decroissant': filtered.sort((a,b) => b.prix_location - a.prix_location); break;
        case 'prix-vente-croissant': filtered.sort((a,b) => a.prix_vente - b.prix_vente); break;
        case 'prix-vente-decroissant': filtered.sort((a,b) => b.prix_vente - a.prix_vente); break;
        case 'nom': filtered.sort((a,b) => a.libelle.localeCompare(b.libelle)); break;
        default: filtered.sort((a,b) => a.id - b.id);
    }
    
    document.getElementById('resultCount').textContent = filtered.length;
    displayBrooms(filtered);
}

function displayBrooms(brooms) {
    const grid = document.getElementById('broomGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (brooms.length === 0) {
        grid.innerHTML = '<div class="no-results"><p>😕 Aucun balai trouvé</p></div>';
        return;
    }
    
    brooms.forEach(broom => {
        grid.appendChild(createBroomCard(broom));
    });
}

function createBroomCard(broom) {
    const card = document.createElement('div');
    card.className = 'broom-card';
    
    card.innerHTML = `
        <div class="broom-image">${broom.img || '🧹'}</div>
        <div class="broom-info">
            <span class="broom-category">${broom.categorie === 'magique' ? 'Magique ✨' : 'Non-magique 🧹'}</span>
            <h3 class="broom-name">${escapeHtml(broom.libelle)}</h3>
            <p class="broom-description">${escapeHtml(broom.description)}</p>
            <div class="etat-container">
                <div class="etat-label"><strong>État:</strong> ${broom.etat === 'neuf' ? 'Neuf' : (broom.nb_utilisation > 400 ? 'Usé' : 'Bon')}</div>
                <div class="etat-bar"><div class="etat-fill" style="width: ${Math.min(100, broom.nb_utilisation / 5)}%; background-color: ${broom.nb_utilisation > 400 ? '#e74c3c' : (broom.nb_utilisation > 250 ? '#f39c12' : '#27ae60')}"></div></div>
            </div>
            <div class="price-container">
                <div class="price-rent">${broom.prix_location.toFixed(2)}€ <span class="price-period">/jour</span></div>
                <div class="price-buy">${broom.prix_vente.toFixed(2)}€ <span class="price-label">achat</span></div>
            </div>
        </div>
        <div class="broom-actions">
            <button class="btn-location" data-broom='${JSON.stringify(broom)}'>Louer</button>
            <button class="btn-achat" data-broom='${JSON.stringify(broom)}'>Acheter</button>
        </div>
    `;
    
    card.querySelector('.btn-location').addEventListener('click', () => showRentalModal(broom));
    card.querySelector('.btn-achat').addEventListener('click', () => addToCart(broom, 'buy'));
    
    return card;
}

function addToCart(broom, type) {
    const item = {
        id: broom.id,
        name: broom.libelle,
        type: type,
        price: type === 'buy' ? broom.prix_vente : broom.prix_location,
        quantity: 1,
        total: type === 'buy' ? broom.prix_vente : broom.prix_location,
        category: broom.categorie === 'magique' ? 'Balai magique ✨' : 'Balai traditionnel',
        icon: broom.categorie === 'magique' ? '✨🧹' : '🧹'
    };
    
    BasketManager.addItem(item);
    showNotification(`"${broom.libelle}" ajouté au panier`, 'success');
    updateCartCount();
    BasketManager.updateCartButtonCount(); // Met à jour le compteur flottant
}

function showRentalModal(broom) {
    let modal = document.getElementById('rentalModal');
    if (modal) modal.remove();
    
    modal = document.createElement('div');
    modal.id = 'rentalModal';
    modal.className = 'rental-modal';
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
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
                    <label>📅 Date de début</label>
                    <input type="date" id="rentalStartDate" min="${today}">
                </div>
                <div class="rental-form-group">
                    <label>📅 Date de fin</label>
                    <input type="date" id="rentalEndDate" min="${today}">
                </div>
                <div class="rental-form-group">
                    <label>📊 Durée</label>
                    <div class="rental-days-display" id="rentalDaysDisplay">- jours</div>
                </div>
                <div class="rental-form-group">
                    <label>💰 Total</label>
                    <div class="rental-total-display" id="rentalTotalDisplay">0,00 €</div>
                </div>
                <div id="rentalAvailability" class="rental-availability"></div>
            </div>
            <div class="rental-modal-footer">
                <button class="btn-cancel">Annuler</button>
                <button class="btn-confirm" disabled>Ajouter au panier</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const startInput = modal.querySelector('#rentalStartDate');
    const endInput = modal.querySelector('#rentalEndDate');
    const daysDisplay = modal.querySelector('#rentalDaysDisplay');
    const totalDisplay = modal.querySelector('#rentalTotalDisplay');
    const availabilityDiv = modal.querySelector('#rentalAvailability');
    const confirmBtn = modal.querySelector('.btn-confirm');
    
    startInput.value = today;
    endInput.value = tomorrow.toISOString().split('T')[0];
    
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
    
    modal.querySelector('.rental-modal-close').onclick = () => modal.remove();
    modal.querySelector('.btn-cancel').onclick = () => modal.remove();
    modal.querySelector('.rental-modal-overlay').onclick = () => modal.remove();
    
    confirmBtn.onclick = () => {
        const start = startInput.value;
        const end = endInput.value;
        const days = parseInt(daysDisplay.textContent);
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
    container.innerHTML = '<div class="availability-checking">🔄 Vérification...</div>';
    
    try {
        const response = await fetch(`/api/reservations/check?broomId=${broomId}&startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();
        
        if (data.available) {
            container.innerHTML = '<div class="availability-success">✓ Balai disponible !</div>';
            confirmBtn.disabled = false;
        } else {
            container.innerHTML = `<div class="availability-error">✗ ${data.message}</div>`;
            confirmBtn.disabled = true;
        }
    } catch (error) {
        container.innerHTML = '<div class="availability-error">⚠️ Erreur de vérification</div>';
        confirmBtn.disabled = true;
    }
}

function showNotification(message, type) {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    notif.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; padding: 12px 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'}; color: white;
        border-radius: 8px; z-index: 2000; animation: fadeInOut 2s ease;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
}

function updateCartCount() {
    const count = BasketManager.getItemCount();
    const cartCountSpan = document.getElementById('cartCount');
    if (cartCountSpan) cartCountSpan.textContent = count;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.searchBrooms = () => applyFiltersAndDisplay();