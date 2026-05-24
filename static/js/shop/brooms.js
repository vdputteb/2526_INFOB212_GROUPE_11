import { showRentalModal } from './reservation.js';
import { showNotification } from './notification.js';
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
    // Utilisation de l'image si disponible, sinon emoji par défaut
    if (broom.img) {
        const img = document.createElement('img');
        img.src = `/static${broom.img}`;
        img.alt = escapeHtml(broom.Libelle);
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        broomImage.appendChild(img);
    } else {
        broomImage.textContent = '🧹';
    }
    
    const broomInfo = document.createElement('div');
    broomInfo.className = 'broom-info';
    
    // Déterminer la catégorie (magique si BALAI_MAGIQUE === 1)
    const isMagique = broom.BALAI_MAGIQUE === 1;
    const broomCategory = document.createElement('span');
    broomCategory.className = 'broom-category';
    broomCategory.textContent = isMagique ? 'Magique ✨' : 'Non-magique 🧹';
    
    const broomName = document.createElement('h3');
    broomName.className = 'broom-name';
    broomName.textContent = escapeHtml(broom.Libelle);
    
    const broomDescription = document.createElement('p');
    broomDescription.className = 'broom-description';
    broomDescription.textContent = escapeHtml(broom.description || '');
    
    const etatContainer = document.createElement('div');
    etatContainer.className = 'etat-container';
    
    const etatLabel = document.createElement('div');
    etatLabel.className = 'etat-label';
    // Calcul de l'état basé sur wear ou uses_number
    const wear = broom.wear !== undefined ? broom.wear : (broom.uses_number || 0);
    let etatValue = 'Neuf';
    if (wear > 80) {
        etatValue = 'Usé';
    } else if (wear > 40) {
        etatValue = 'Bon';
    }
    etatLabel.innerHTML = `<strong>État:</strong> ${etatValue}`;
    
    const etatBar = document.createElement('div');
    etatBar.className = 'etat-bar';
    
    const etatFill = document.createElement('div');
    etatFill.className = 'etat-fill';
    const fillWidth = Math.min(100, wear);
    etatFill.style.width = `${fillWidth}%`;
    etatFill.style.backgroundColor = wear > 80 ? '#e74c3c' : (wear > 40 ? '#f39c12' : '#27ae60');
    
    etatBar.appendChild(etatFill);
    etatContainer.appendChild(etatLabel);
    etatContainer.appendChild(etatBar);
    
    const priceContainer = document.createElement('div');
    priceContainer.className = 'price-container';
    
    const priceRent = document.createElement('div');
    priceRent.className = 'price-rent';
    priceRent.innerHTML = `${(broom.location_price || 0).toFixed(2)}€ <span class="price-period">/jour</span>`;
    
    const priceBuy = document.createElement('div');
    priceBuy.className = 'price-buy';
    priceBuy.innerHTML = `${(broom.sale_price || 0).toFixed(2)}€ <span class="price-label">achat</span>`;
    
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
        id: broom.id_balai,
        name: broom.Libelle,
        type: type,
        price: type === 'buy' ? broom.sale_price : broom.location_price,
        quantity: 1,
        total: type === 'buy' ? broom.sale_price : broom.location_price,
        category: broom.BALAI_MAGIQUE === 1 ? 'Balai magique ✨' : 'Balai traditionnel',
        icon: broom.BALAI_MAGIQUE === 1 ? '✨🧹' : '🧹'
    };
    
    BasketManager.addItem(item);
    showNotification(`"${broom.Libelle}" ajouté au panier`, 'success');
    updateCartCount();
    BasketManager.updateCartButtonCount();
}