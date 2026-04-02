// Base de données des balais (fallback)
const fallbackBrooms = [
    {
        id: 1,
        name: "Balai traditionnel en paille",
        description: "Balai classique en paille de riz, idéal pour un usage domestique quotidien.",
        category: "traditionnel",
        rent_price: 3.50,
        buy_price: 15.00,
        stock: 12,
        image: "🧹",
        inStock: true
    },
    {
        id: 2,
        name: "Balai mécanique à franges",
        description: "Balai mécanique avec franges en microfibre, parfait pour les sols lisses.",
        category: "mecanique",
        rent_price: 7.90,
        buy_price: 25.00,
        stock: 8,
        image: "🧹🧹",
        inStock: true
    },
    {
        id: 3,
        name: "Balai industriel grande largeur",
        description: "Balai professionnel 80cm pour espaces vastes (entrepôts, ateliers).",
        category: "industrie",
        rent_price: 15.50,
        buy_price: 45.00,
        stock: 3,
        image: "🏭🧹",
        inStock: true
    },
    {
        id: 4,
        name: "Balai à gazon extérieur",
        description: "Balai robuste pour feuilles et débris sur pelouse ou terrasse.",
        category: "exterieur",
        rent_price: 8.50,
        buy_price: 28.00,
        stock: 5,
        image: "🌿🧹",
        inStock: true
    },
    {
        id: 5,
        name: "Balai microfibre plat",
        description: "Balai plat avec tête rotative, idéal pour atteindre les coins.",
        category: "mecanique",
        rent_price: 6.90,
        buy_price: 22.00,
        stock: 0,
        image: "🧹✨",
        inStock: false
    },
    {
        id: 6,
        name: "Balai coco traditionnel",
        description: "Balai en fibres de coco naturelles, résistant et écologique.",
        category: "traditionnel",
        rent_price: 4.90,
        buy_price: 18.00,
        stock: 15,
        image: "🥥🧹",
        inStock: true
    },
    {
        id: 7,
        name: "Balai télescopique",
        description: "Balai avec manche télescopique réglable de 1m à 1.8m.",
        category: "mecanique",
        rent_price: 12.90,
        buy_price: 35.00,
        stock: 7,
        image: "📏🧹",
        inStock: true
    },
    {
        id: 8,
        name: "Balai lourd pour chantier",
        description: "Balai extra résistant pour nettoyage de chantier et gravats.",
        category: "industrie",
        rent_price: 22.00,
        buy_price: 55.00,
        stock: 2,
        image: "🏗️🧹",
        inStock: true
    },
    {
        id: 9,
        name: "Balai poussoir caoutchouc",
        description: "Pour sols humides et extérieurs, avec racle en caoutchouc.",
        category: "exterieur",
        rent_price: 11.50,
        buy_price: 32.00,
        stock: 4,
        image: "🌧️🧹",
        inStock: true
    }
];

let currentBrooms = [...fallbackBrooms];
let masterBrooms = [...fallbackBrooms];

// Fonction pour récupérer les balais depuis l'API
async function fetchBroomsFromAPI() {
    try {
        console.log("Tentative de récupération des balais depuis l'API...");
        
        const response = await fetch('/shop/balai_moldu/');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
            console.log("Données récupérées avec succès depuis l'API");
            masterBrooms = [...data];
            currentBrooms = [...data];
            showNotification("Données mises à jour depuis le serveur", "success");
            displayBrooms(currentBrooms);
            return data;
        } else {
            throw new Error("Format de données invalide reçu de l'API");
        }
        
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des balais:", error);
        showNotification("Impossible de récupérer les balais du serveur. Affichage de la liste locale.", "error");
        currentBrooms = [...masterBrooms];
        displayBrooms(currentBrooms);
        return null;
    }
}

// Fonction pour afficher des notifications
function showNotification(message, type = "info") {
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '8px';
        notification.style.zIndex = '1000';
        notification.style.fontSize = '14px';
        notification.style.fontWeight = 'bold';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        notification.style.transition = 'all 0.3s ease';
        document.body.appendChild(notification);
    }
    
    const colors = {
        success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
        error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
        info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' }
    };
    
    const color = colors[type] || colors.info;
    
    notification.style.backgroundColor = color.bg;
    notification.style.color = color.text;
    notification.style.border = `1px solid ${color.border}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification) {
                notification.style.display = 'none';
                notification.style.opacity = '1';
            }
        }, 300);
    }, 3000);
}

// Créer une carte de balai
function createBroomCard(broom) {
    const card = document.createElement('div');
    card.className = 'broom-card';
    
    // Image
    const imageDiv = document.createElement('div');
    imageDiv.className = 'broom-image';
    imageDiv.textContent = broom.image;
    card.appendChild(imageDiv);
    
    // Info container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'broom-info';
    
    // Catégorie
    const categorySpan = document.createElement('span');
    categorySpan.className = 'broom-category';
    categorySpan.textContent = getCategoryLabel(broom.category);
    infoDiv.appendChild(categorySpan);
    
    // Nom
    const nameH3 = document.createElement('h3');
    nameH3.className = 'broom-name';
    nameH3.textContent = broom.name;
    infoDiv.appendChild(nameH3);
    
    // Description
    const descP = document.createElement('p');
    descP.className = 'broom-description';
    descP.textContent = broom.description;
    infoDiv.appendChild(descP);
    
    // Prix container
    const priceContainer = document.createElement('div');
    priceContainer.className = 'price-container';
    
    // Prix location
    const rentDiv = document.createElement('div');
    rentDiv.className = 'price-rent';
    rentDiv.innerHTML = `${broom.rent_price.toFixed(2)}€ <span class="price-period">/jour</span><span class="price-label"> (location)</span>`;
    priceContainer.appendChild(rentDiv);
    
    // Prix achat
    const buyDiv = document.createElement('div');
    buyDiv.className = 'price-buy';
    buyDiv.innerHTML = `${broom.buy_price.toFixed(2)}€ <span class="price-label">achat</span>`;
    priceContainer.appendChild(buyDiv);
    
    // Stock
    const stockSpan = document.createElement('span');
    stockSpan.className = 'broom-stock';
    stockSpan.textContent = broom.stock > 0 ? `✔️ ${broom.stock} disponible(s)` : '⚠️ Rupture de stock';
    priceContainer.appendChild(stockSpan);
    
    infoDiv.appendChild(priceContainer);
    card.appendChild(infoDiv);
    
    // Actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'broom-actions';
    
    // Bouton location
    const rentBtn = document.createElement('button');
    rentBtn.className = 'btn-location';
    rentBtn.textContent = '🔑 Louer ce balai';
    if (broom.stock === 0) rentBtn.disabled = true;
    rentBtn.addEventListener('click', () => handleRent(broom));
    actionsDiv.appendChild(rentBtn);
    
    // Bouton achat
    const buyBtn = document.createElement('button');
    buyBtn.className = 'btn-achat';
    buyBtn.textContent = '💰 Acheter ce balai';
    if (broom.stock === 0) buyBtn.disabled = true;
    buyBtn.addEventListener('click', () => handleBuy(broom));
    actionsDiv.appendChild(buyBtn);
    
    card.appendChild(actionsDiv);
    
    return card;
}

// Gestionnaire pour la location
function handleRent(broom) {
    showNotification(`📍 Demande de location pour : ${broom.name} - ${broom.rent_price.toFixed(2)}€/jour`, "info");
    // À implémenter : redirection vers page de réservation
}

// Gestionnaire pour l'achat
function handleBuy(broom) {
    showNotification(`🛒 Demande d'achat pour : ${broom.name} - ${broom.buy_price.toFixed(2)}€`, "success");
    // À implémenter : redirection vers page de paiement
}

// Afficher les balais
function displayBrooms(broomsToShow) {
    const grid = document.getElementById('broomGrid');
    const resultCount = document.getElementById('resultCount');

    if (!grid) {
        console.error("L'élément broomGrid n'existe pas");
        return;
    }

    resultCount.textContent = broomsToShow.length;

    // Vider le grid
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }

    if (broomsToShow.length === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        
        const messageP = document.createElement('p');
        messageP.textContent = '😕 Aucun balai ne correspond à vos critères';
        noResultsDiv.appendChild(messageP);
        
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Réinitialiser les filtres';
        resetBtn.onclick = () => resetFilters();
        noResultsDiv.appendChild(resetBtn);
        
        grid.appendChild(noResultsDiv);
        return;
    }

    // Ajouter chaque carte
    broomsToShow.forEach(broom => {
        const card = createBroomCard(broom);
        grid.appendChild(card);
    });
}

function getCategoryLabel(category) {
    const labels = {
        'traditionnel': 'Traditionnel',
        'mecanique': 'Mécanique',
        'industrie': 'Industriel',
        'exterieur': 'Extérieur'
    };
    return labels[category] || category;
}

// Filtrage
function filterBrooms() {
    const type = document.getElementById('type').value;
    const prix = document.getElementById('prix').value;
    const stock = document.getElementById('stock').value;

    currentBrooms = masterBrooms.filter(broom => {
        if (type !== 'all' && broom.category !== type) return false;

        if (prix !== 'all') {
            const [min, max] = prix.split('-');
            if (max) {
                if (broom.rent_price < parseFloat(min) || broom.rent_price > parseFloat(max)) return false;
            } else if (prix === '20+') {
                if (broom.rent_price <= 20) return false;
            }
        }

        if (stock === 'disponible' && broom.stock === 0) return false;
        if (stock === 'faible' && broom.stock > 3) return false;

        return true;
    });

    displayBrooms(currentBrooms);
}

// Tri
function sortBrooms(criteria) {
    switch (criteria) {
        case 'prix-croissant':
            currentBrooms.sort((a, b) => a.rent_price - b.rent_price);
            break;
        case 'prix-decroissant':
            currentBrooms.sort((a, b) => b.rent_price - a.rent_price);
            break;
        case 'nom':
            currentBrooms.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            currentBrooms.sort((a, b) => a.id - b.id);
    }
    displayBrooms(currentBrooms);
}

// Recherche
function searchBrooms() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (searchTerm.trim() === '') {
        currentBrooms = [...masterBrooms];
    } else {
        currentBrooms = masterBrooms.filter(broom =>
            broom.name.toLowerCase().includes(searchTerm) ||
            broom.description.toLowerCase().includes(searchTerm)
        );
    }

    displayBrooms(currentBrooms);
}

// Réinitialisation des filtres
function resetFilters() {
    const typeSelect = document.getElementById('type');
    const prixSelect = document.getElementById('prix');
    const stockSelect = document.getElementById('stock');
    const searchInput = document.getElementById('searchInput');
    
    if (typeSelect) typeSelect.value = 'all';
    if (prixSelect) prixSelect.value = 'all';
    if (stockSelect) stockSelect.value = 'all';
    if (searchInput) searchInput.value = '';
    
    currentBrooms = [...masterBrooms];
    displayBrooms(currentBrooms);
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    displayBrooms(currentBrooms);
    addRefreshButton();
    await fetchBroomsFromAPI();
});

// Ajouter un bouton pour rafraîchir les données
function addRefreshButton() {
    const filtersContainer = document.querySelector('.filters');
    
    if (filtersContainer) {
        const refreshButton = document.createElement('button');
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
            refreshButton.disabled = false;
            refreshButton.textContent = '🔄 Rafraîchir les données';
        };
        
        filtersContainer.appendChild(refreshButton);
    }
}

// Reconnexion automatique toutes les 5 minutes
setInterval(async () => {
    await fetchBroomsFromAPI();
}, 300000);