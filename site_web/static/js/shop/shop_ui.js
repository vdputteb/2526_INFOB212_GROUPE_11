import { getEtatPercentage, getEtatColor, getEtatText, showNotification } from './shop_utils.js';

export function createBroomCard(broom) {
    const card = document.createElement('div');
    card.className = 'broom-card';
    
    // Image
    const imageDiv = document.createElement('div');
    imageDiv.className = 'broom-image';
    if (broom.img && broom.img.startsWith('http')) {
        const img = document.createElement('img');
        img.src = broom.img;
        img.alt = broom.libelle;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        imageDiv.appendChild(img);
    } else {
        imageDiv.textContent = broom.img || '🧹';
    }
    card.appendChild(imageDiv);
    
    // Info container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'broom-info';
    
    // Catégorie
    const categorySpan = document.createElement('span');
    categorySpan.className = 'broom-category';
    categorySpan.textContent = broom.categorie === 'magique' ? 'Magique ✨' : 'Non-magique 🧹';
    infoDiv.appendChild(categorySpan);
    
    // Nom
    const nameH3 = document.createElement('h3');
    nameH3.className = 'broom-name';
    nameH3.textContent = broom.libelle;
    infoDiv.appendChild(nameH3);
    
    // Description
    const descP = document.createElement('p');
    descP.className = 'broom-description';
    descP.textContent = broom.description;
    infoDiv.appendChild(descP);
    
    // Barre d'état
    const etatPercentage = getEtatPercentage(broom.nb_utilisation);
    const etatColor = getEtatColor(etatPercentage);
    const etatText = getEtatText(broom.etat, etatPercentage);
    
    const etatContainer = document.createElement('div');
    etatContainer.className = 'etat-container';
    
    const etatLabel = document.createElement('div');
    etatLabel.className = 'etat-label';
    etatLabel.innerHTML = `<strong>État:</strong> ${etatText}`;
    etatContainer.appendChild(etatLabel);
    
    const progressBar = document.createElement('div');
    progressBar.className = 'etat-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'etat-fill';
    progressFill.style.width = `${100 - etatPercentage}%`;
    progressFill.style.backgroundColor = etatColor;
    progressBar.appendChild(progressFill);
    etatContainer.appendChild(progressBar);
    
    const utilisationSpan = document.createElement('span');
    utilisationSpan.className = 'utilisation-text';
    utilisationSpan.textContent = `${broom.nb_utilisation}/500 utilisations`;
    etatContainer.appendChild(utilisationSpan);
    
    infoDiv.appendChild(etatContainer);
    
    // Prix container
    const priceContainer = document.createElement('div');
    priceContainer.className = 'price-container';
    
    const rentDiv = document.createElement('div');
    rentDiv.className = 'price-rent';
    rentDiv.innerHTML = `${broom.prix_location.toFixed(2)}€ <span class="price-period">/jour</span><span class="price-label"> (location)</span>`;
    priceContainer.appendChild(rentDiv);
    
    const buyDiv = document.createElement('div');
    buyDiv.className = 'price-buy';
    buyDiv.innerHTML = `${broom.prix_vente.toFixed(2)}€ <span class="price-label">achat</span>`;
    priceContainer.appendChild(buyDiv);
    
    infoDiv.appendChild(priceContainer);
    
    // Attributs magiques
    if (broom.categorie === 'magique') {
        const magicDiv = document.createElement('div');
        magicDiv.className = 'magic-attributes';
        
        const niveauMagique = document.createElement('div');
        niveauMagique.className = 'magic-level';
        niveauMagique.innerHTML = `<strong>Niveau magique:</strong> ${'⭐'.repeat(broom.niveau_magique)}${'☆'.repeat(5-broom.niveau_magique)} (${broom.niveau_magique}/5)`;
        
        const vitesse = document.createElement('div');
        vitesse.className = 'magic-speed';
        vitesse.innerHTML = `<strong>Vitesse:</strong> ${broom.vitesse} km/h`;
        
        const permis = document.createElement('div');
        permis.className = 'magic-permis';
        permis.innerHTML = `<strong>Permis requis:</strong> ${'🔮'.repeat(broom.permis_magique_requis)}${'⚪'.repeat(5-broom.permis_magique_requis)} (niv.${broom.permis_magique_requis}/5)`;
        
        const composants = document.createElement('div');
        composants.className = 'magic-composants';
        composants.innerHTML = `<strong>Composants:</strong> ${broom.composants_magiques.join(', ')}`;
        
        magicDiv.appendChild(niveauMagique);
        magicDiv.appendChild(vitesse);
        magicDiv.appendChild(permis);
        magicDiv.appendChild(composants);
        
        infoDiv.appendChild(magicDiv);
    }
    
    card.appendChild(infoDiv);
    
    // Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'broom-actions';
    
    const rentBtn = document.createElement('button');
    rentBtn.className = 'btn-location';
    rentBtn.textContent = 'Louer ce balai';
    if (broom.nb_utilisation >= 500) rentBtn.disabled = true;
    rentBtn.addEventListener('click', () => {
        showNotification(`📍 Demande de location pour : ${broom.libelle} - ${broom.prix_location.toFixed(2)}€/jour`, "info");
    });
    actionsDiv.appendChild(rentBtn);
    
    const buyBtn = document.createElement('button');
    buyBtn.className = 'btn-achat';
    buyBtn.textContent = 'Acheter ce balai';
    if (broom.nb_utilisation >= 500) buyBtn.disabled = true;
    buyBtn.addEventListener('click', () => {
        showNotification(`🛒 Demande d'achat pour : ${broom.libelle} - ${broom.prix_vente.toFixed(2)}€`, "success");
    });
    actionsDiv.appendChild(buyBtn);
    
    card.appendChild(actionsDiv);
    
    return card;
}

export function displayBrooms(broomsToShow, currentPage = 1, itemsPerPage = 6, onPageChange) {
    const grid = document.getElementById('broomGrid');
    const resultCount = document.getElementById('resultCount');

    if (!grid) return;

    resultCount.textContent = broomsToShow.length;

    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }

    if (broomsToShow.length === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.innerHTML = '<p>😕 Aucun balai ne correspond à vos critères</p>';
        grid.appendChild(noResultsDiv);
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBrooms = broomsToShow.slice(startIndex, startIndex + itemsPerPage);
    
    paginatedBrooms.forEach(broom => {
        grid.appendChild(createBroomCard(broom));
    });
}