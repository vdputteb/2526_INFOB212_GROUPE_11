import { fetchBroomsFromAPI, getCurrentBrooms, getHasMagicalBrooms, setCurrentBrooms, getMasterBrooms } from './shop_fetch.js';
import { displayBrooms } from './shop_ui.js';
import { filterBrooms, sortBrooms, searchBrooms, resetFilters, updatePagination } from './shop_event.js';
import { showNotification } from './shop_utils.js';
import { loadReservations, showRentalModal } from './shop_rental.js';

let currentPage = 1;
const itemsPerPage = 6;

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // Charger les réservations
    await loadReservations();
    
    // Attacher les événements
    document.getElementById('category')?.addEventListener('change', filterBrooms);
    document.getElementById('prix')?.addEventListener('change', filterBrooms);
    document.getElementById('prixVente')?.addEventListener('change', filterBrooms);
    document.getElementById('stock')?.addEventListener('change', filterBrooms);
    document.getElementById('searchInput')?.addEventListener('input', searchBrooms);
    document.getElementById('sort')?.addEventListener('change', (e) => sortBrooms(e.target.value));
    
    // Bouton reset
    const resetBtn = document.querySelector('.reset-filters');
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    
    // Affichage initial
    const initialBrooms = getCurrentBrooms();
    displayBrooms(initialBrooms, currentPage, itemsPerPage);
    updatePagination(initialBrooms.length);
    
    // Rafraîchir depuis l'API
    await fetchBroomsFromAPI();
    
    // Mettre à jour l'affichage après chargement API
    const updatedBrooms = getCurrentBrooms();
    displayBrooms(updatedBrooms, currentPage, itemsPerPage);
    updatePagination(updatedBrooms.length);
    updateCategorySelector();
});

// Exposer la fonction showRentalModal globalement
window.showRentalModal = showRentalModal;

function updateCategorySelector() {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;
    
    if (!getHasMagicalBrooms()) {
        categorySelect.style.display = 'none';
        categorySelect.value = 'non_magique';
        filterBrooms();
    } else {
        categorySelect.style.display = 'inline-block';
    }
}

// Reconnexion automatique toutes les 5 minutes
setInterval(async () => {
    await fetchBroomsFromAPI();
    await loadReservations();
    const refreshedBrooms = getCurrentBrooms();
    displayBrooms(refreshedBrooms, currentPage, itemsPerPage);
    updatePagination(refreshedBrooms.length);
    updateCategorySelector();
}, 300000);