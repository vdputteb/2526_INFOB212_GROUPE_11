import { getMasterBrooms, getCurrentBrooms, setCurrentBrooms, getHasMagicalBrooms } from './shop_fetch.js';
import { displayBrooms } from './shop_ui.js';

let currentPage = 1;
const itemsPerPage = 6;

export function filterBrooms() {
    const category = document.getElementById('category').value;
    const prix = document.getElementById('prix').value;
    const prixVente = document.getElementById('prixVente').value;
    const stock = document.getElementById('stock').value;
    const masterBrooms = getMasterBrooms();

    const filtered = masterBrooms.filter(broom => {
        if (category !== 'all' && broom.categorie !== category) return false;

        if (prix !== 'all') {
            const [min, max] = prix.split('-');
            if (max) {
                if (broom.prix_location < parseFloat(min) || broom.prix_location > parseFloat(max)) return false;
            } else if (prix === '20+' && broom.prix_location <= 20) return false;
        }
        
        if (prixVente !== 'all') {
            const [min, max] = prixVente.split('-');
            if (max) {
                if (broom.prix_vente < parseFloat(min) || broom.prix_vente > parseFloat(max)) return false;
            } else if (prixVente === '100+' && broom.prix_vente <= 100) return false;
        }

        if (stock === 'disponible' && broom.nb_utilisation >= 500) return false;
        if (stock === 'faible' && (broom.nb_utilisation < 500 && broom.nb_utilisation > 350)) return false;

        return true;
    });

    setCurrentBrooms(filtered);
    currentPage = 1;
    displayBrooms(filtered, currentPage, itemsPerPage);
}

export function sortBrooms(criteria) {
    const currentBrooms = [...getCurrentBrooms()];
    
    switch (criteria) {
        case 'prix-croissant':
            currentBrooms.sort((a, b) => a.prix_location - b.prix_location);
            break;
        case 'prix-decroissant':
            currentBrooms.sort((a, b) => b.prix_location - a.prix_location);
            break;
        case 'prix-vente-croissant':
            currentBrooms.sort((a, b) => a.prix_vente - b.prix_vente);
            break;
        case 'prix-vente-decroissant':
            currentBrooms.sort((a, b) => b.prix_vente - a.prix_vente);
            break;
        case 'nom':
            currentBrooms.sort((a, b) => a.libelle.localeCompare(b.libelle));
            break;
        default:
            currentBrooms.sort((a, b) => a.id - b.id);
    }
    
    setCurrentBrooms(currentBrooms);
    currentPage = 1;
    displayBrooms(currentBrooms, currentPage, itemsPerPage);
}

export function searchBrooms() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const masterBrooms = getMasterBrooms();

    if (searchTerm.trim() === '') {
        setCurrentBrooms([...masterBrooms]);
    } else {
        const filtered = masterBrooms.filter(broom =>
            broom.libelle.toLowerCase().includes(searchTerm) ||
            broom.description.toLowerCase().includes(searchTerm)
        );
        setCurrentBrooms(filtered);
    }
    
    currentPage = 1;
    displayBrooms(getCurrentBrooms(), currentPage, itemsPerPage);
}

export function resetFilters() {
    document.getElementById('category').value = 'all';
    document.getElementById('prix').value = 'all';
    document.getElementById('prixVente').value = 'all';
    document.getElementById('stock').value = 'all';
    document.getElementById('searchInput').value = '';
    
    setCurrentBrooms([...getMasterBrooms()]);
    currentPage = 1;
    displayBrooms(getCurrentBrooms(), currentPage, itemsPerPage);
}

export function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationDiv = document.querySelector('.pagination');
    if (!paginationDiv) return;
    
    paginationDiv.innerHTML = '';
    
    const prevBtn = document.createElement('a');
    prevBtn.href = '#';
    prevBtn.textContent = '«';
    prevBtn.onclick = (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            displayBrooms(getCurrentBrooms(), currentPage, itemsPerPage);
            updatePagination(getCurrentBrooms().length);
        }
    };
    if (currentPage === 1) prevBtn.style.opacity = '0.5';
    paginationDiv.appendChild(prevBtn);
    
    for (let i = 1; i <= totalPages; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = '#';
        pageLink.textContent = i;
        if (i === currentPage) pageLink.classList.add('active');
        pageLink.onclick = (e) => {
            e.preventDefault();
            currentPage = i;
            displayBrooms(getCurrentBrooms(), currentPage, itemsPerPage);
            updatePagination(getCurrentBrooms().length);
        };
        paginationDiv.appendChild(pageLink);
    }
    
    const nextBtn = document.createElement('a');
    nextBtn.href = '#';
    nextBtn.textContent = '»';
    nextBtn.onclick = (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            displayBrooms(getCurrentBrooms(), currentPage, itemsPerPage);
            updatePagination(getCurrentBrooms().length);
        }
    };
    if (currentPage === totalPages) nextBtn.style.opacity = '0.5';
    paginationDiv.appendChild(nextBtn);
}