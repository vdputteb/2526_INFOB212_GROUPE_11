import { fetchBroomsFromAPI, getCurrentBrooms, getHasMagicalBrooms, setCurrentBrooms, getMasterBrooms } from './shop_fetch.js';
import { displayBrooms } from './shop_ui.js';
import { filterBrooms, sortBrooms, searchBrooms, resetFilters, updatePagination } from './shop_event.js';
import { showNotification } from './shop_utils.js';

let currentPage = 1;
const itemsPerPage = 6;

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
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
    addRefreshButton();
    await fetchBroomsFromAPI();
    
    // Mettre à jour l'affichage après chargement API
    const updatedBrooms = getCurrentBrooms();
    displayBrooms(updatedBrooms, currentPage, itemsPerPage);
    updatePagination(updatedBrooms.length);
    updateCategorySelector();
});

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

function addRefreshButton() {
    const filtersContainer = document.querySelector('.filters');
    
    if (filtersContainer && !document.getElementById('refreshBtn')) {
        const refreshButton = document.createElement('button');
        refreshButton.id = 'refreshBtn';
        refreshButton.textContent = '🔄 Rafraîchir les données';
        refreshButton.style.marginLeft = '10px';
        refreshButton.style.padding = '8px 12px';
        refreshButton.style.backgroundColor = '#4CAF50';
        refreshButton.style.color = 'white';
        refreshButton.style.border = 'none';
        refreshButton.style.borderRadius = '5px';
        refreshButton.style.cursor = 'pointer';
        refreshButton.onclick = async () => {
            refreshButton.disabled = true;
            refreshButton.textContent = '🔄 Chargement...';
            await fetchBroomsFromAPI();
            const refreshedBrooms = getCurrentBrooms();
            displayBrooms(refreshedBrooms, currentPage, itemsPerPage);
            updatePagination(refreshedBrooms.length);
            updateCategorySelector();
            refreshButton.disabled = false;
            refreshButton.textContent = '🔄 Rafraîchir les données';
        };
        
        filtersContainer.appendChild(refreshButton);
    }
}

// Reconnexion automatique toutes les 5 minutes
setInterval(async () => {
    await fetchBroomsFromAPI();
    const refreshedBrooms = getCurrentBrooms();
    displayBrooms(refreshedBrooms, currentPage, itemsPerPage);
    updatePagination(refreshedBrooms.length);
    updateCategorySelector();
}, 300000);