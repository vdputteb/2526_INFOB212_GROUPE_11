import {showRentalModal } from './reservation.js';
import {showNotification} from './notification.js';
import { updateCartCount } from './update_cart.js';
import { escapeHtml } from './escape_html.js';
import { BasketManager } from '../class/BasketManager.js';

export function displayBrooms(brooms) {
    const grid = document.getElementById('broomGrid');
    if (!grid) return;
    
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }
    
    if (brooms.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        
        const paragraph = document.createElement('p');
        paragraph.textContent = 'Aucun balai trouvé';
        noResults.appendChild(paragraph);
        
        grid.appendChild(noResults);
        return;
    }
    
    brooms.forEach(broom => {
        grid.appendChild(createBroomCard(broom));
    });
}

function createBroomCard(broom) {
    const card = document.createElement('div');
    card.className = 'broom-card';
    
    const broomImage = document.createElement('div');
    broomImage.className = 'broom-image';
    broomImage.textContent = broom.img || '🧹';
    
    const broomInfo = document.createElement('div');
    broomInfo.className = 'broom-info';
    
    const broomCategory = document.createElement('span');
    broomCategory.className = 'broom-category';
    broomCategory.textContent = broom.categorie === 'magique' ? 'Magique ✨' : 'Non-magique 🧹';
    
    const broomName = document.createElement('h3');
    broomName.className = 'broom-name';
    broomName.textContent = escapeHtml(broom.libelle);
    
    const broomDescription = document.createElement('p');
    broomDescription.className = 'broom-description';
    broomDescription.textContent = escapeHtml(broom.description);
    
    const etatContainer = document.createElement('div');
    etatContainer.className = 'etat-container';
    
    const etatLabel = document.createElement('div');
    etatLabel.className = 'etat-label';
    const etatValue = broom.etat === 'neuf' ? 'Neuf' : (broom.nb_utilisation > 400 ? 'Usé' : 'Bon');
    etatLabel.innerHTML = `<strong>État:</strong> ${etatValue}`;
    
    const etatBar = document.createElement('div');
    etatBar.className = 'etat-bar';
    
    const etatFill = document.createElement('div');
    etatFill.className = 'etat-fill';
    const fillWidth = Math.min(100, broom.nb_utilisation / 5);
    etatFill.style.width = `${fillWidth}%`;
    etatFill.style.backgroundColor = broom.nb_utilisation > 400 ? '#e74c3c' : (broom.nb_utilisation > 250 ? '#f39c12' : '#27ae60');
    
    etatBar.appendChild(etatFill);
    etatContainer.appendChild(etatLabel);
    etatContainer.appendChild(etatBar);
    
    const priceContainer = document.createElement('div');
    priceContainer.className = 'price-container';
    
    const priceRent = document.createElement('div');
    priceRent.className = 'price-rent';
    priceRent.innerHTML = `${broom.prix_location.toFixed(2)}€ <span class="price-period">/jour</span>`;
    
    const priceBuy = document.createElement('div');
    priceBuy.className = 'price-buy';
    priceBuy.innerHTML = `${broom.prix_vente.toFixed(2)}€ <span class="price-label">achat</span>`;
    
    priceContainer.appendChild(priceRent);
    priceContainer.appendChild(priceBuy);
    
    broomInfo.appendChild(broomCategory);
    broomInfo.appendChild(broomName);
    broomInfo.appendChild(broomDescription);
    broomInfo.appendChild(etatContainer);
    broomInfo.appendChild(priceContainer);
    
    const broomActions = document.createElement('div');
    broomActions.className = 'broom-actions';
    
    const btnLocation = document.createElement('button');
    btnLocation.className = 'btn-location';
    btnLocation.textContent = 'Louer';
    btnLocation.addEventListener('click', () => showRentalModal(broom));
    
    const btnAchat = document.createElement('button');
    btnAchat.className = 'btn-achat';
    btnAchat.textContent = 'Acheter';
    btnAchat.addEventListener('click', () => addToCart(broom, 'buy'));
    
    broomActions.appendChild(btnLocation);
    broomActions.appendChild(btnAchat);
    
    card.appendChild(broomImage);
    card.appendChild(broomInfo);
    card.appendChild(broomActions);
    
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
    BasketManager.updateCartButtonCount();
}