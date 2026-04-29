import { apiRequest, showNotification, formatDate, formatCurrency, getStatusText, createElement, clearElement } from './profile_api.js';
import { setupPagination } from './profile_ui.js';

let locationsData = [];

//  CHARGEMENT DES LOCATIONS 
export async function loadLocations(page = 1, onReturnClick) {
    try {
        const response = await apiRequest(`/profile/locations?page=${page}`, 'GET');
        if (response.success) {
            locationsData = response.locations;
            // Filtrer les locations en cours (status !== 'Finished')
            const inProgress = locationsData.filter(l => l.status !== 'Finished');
            const finished = locationsData.filter(l => l.status === 'Finished');
            
            renderLocations(inProgress, 'locationsList', true, onReturnClick);
            renderLocations(finished, 'finishedLocationsList', false, null);
            setupPagination('locationsPagination', response.pagination, (p) => loadLocations(p, onReturnClick));
        } else {
            throw new Error('Erreur lors du chargement des locations');
        }
    } catch (error) {
        const container = document.getElementById('locationsList');
        if (container) {
            clearElement(container);
            const errorDiv = createElement('div', 'error-message', 'Erreur lors du chargement des locations');
            container.appendChild(errorDiv);
        }
        console.error(error);
    }
}

//  RENDU DES LOCATIONS 
function renderLocations(locations, containerId, showReturnButton, onReturnClick) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    clearElement(container);
    
    if (!locations || !locations.length) {
        container.appendChild(createElement('div', 'empty-message', 'Aucune location trouvée'));
        return;
    }
    
    const template = document.getElementById('locationTemplate');
    
    locations.forEach(location => {
        const clone = template.content.cloneNode(true);
        
        clone.querySelector('.location-period').textContent = `${formatDate(location.begin_date)} → ${formatDate(location.end_date)}`;
        
        // Status avec classe CSS appropriée
        const statusSpan = clone.querySelector('.location-status');
        statusSpan.textContent = getStatusText(location.status);
        statusSpan.className = `location-status status-${(location.status || 'unknown').toLowerCase().replace(' ', '-')}`;
        
        // Client
        clone.querySelector('.location-client').textContent = location.client_name && location.client_surname 
            ? `${location.client_name} ${location.client_surname}` 
            : (location.client_name || 'Client inconnu');
        
        // Balai
        clone.querySelector('.location-broom').textContent = `Balai: ${location.broom_name || 'Inconnu'}`;
        
        // Bouton de retour (si location non terminée et pas de date de retour réelle)
        if (showReturnButton && location.status !== 'Finished' && !location.actual_end_date) {
            const actionsDiv = clone.querySelector('.location-actions');
            const returnBtn = createElement('button', 'btn-return', '📅 Valider le retour');
            returnBtn.dataset.commandeId = location.id_commande;
            returnBtn.dataset.broomName = location.broom_name || '';
            returnBtn.dataset.clientName = location.client_name ? `${location.client_name} ${location.client_surname || ''}` : '';
            returnBtn.dataset.beginDate = location.begin_date;
            returnBtn.dataset.endDate = location.end_date;
            returnBtn.addEventListener('click', () => onReturnClick(returnBtn.dataset));
            actionsDiv.appendChild(returnBtn);
        }
        
        container.appendChild(clone);
    });
}

//  VALIDATION DE RETOUR 
export async function validateReturn(event, refreshCallback) {
    event.preventDefault();
    
    const data = {
        commandeId: parseInt(document.getElementById('returnCommandeId').value),
        actual_end_date: document.getElementById('returnActualEndDate').value,
        condition: document.getElementById('returnCondition').value
    };
    
    try {
        const response = await apiRequest('/locations/validate-return', 'POST', data);
        if (response.success) {
            showNotification('Retour validé avec succès', 'success');
            document.getElementById('validateReturnModal').style.display = 'none';
            
            // Rafraîchir les données après validation
            if (refreshCallback) await refreshCallback();
            
            return true;
        } else {
            throw new Error(response.message || 'Erreur lors de la validation');
        }
    } catch (error) {
        showNotification(error.message || 'Erreur lors de la validation', 'error');
        return false;
    }
}

//  EXPORT 
export function getLocationsData() { return locationsData; }