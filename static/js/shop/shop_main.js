import { fetchCatalogue } from './catalogue.js';
import { displayBrooms } from './brooms.js';
import { BasketManager } from '../class/BasketManager.js';
import { updateCartCount } from './update_cart.js';


let currentBrooms = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadCatalogue();
    setupEventListeners();
    BasketManager.createCartButton();
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

