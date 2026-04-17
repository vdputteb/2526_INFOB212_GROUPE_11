import {showOrders} from './show_commands.js';
import {showReservations} from './show_reservations.js';
import {AddClient} from './add_client.js';
import {setupModifyClient} from './modify_client.js';

let currentClient = null;
window.currentClient = currentClient;
window.loadClients = loadClients;
window.displayClientInfo = displayClientInfo;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("vendeur_name").innerText = sessionStorage.getItem("username") || "Vendeur";
    
    let role = sessionStorage.getItem("role");
    console.log("Rôle détecté:", role);
    
    // Gestion de l'affichage des vues
    const adminVue = document.getElementById("admin-vue");
    const vendeurVue = document.getElementById("vendeur-vue");
    
    if (role && role.toLowerCase() === "admin") {
        if (adminVue) adminVue.style.display = "block";

        loadVendeurs();
        setupAdminEventListeners();
    } else {
        
        if (adminVue) adminVue.style.display = "none";
    }
    if (vendeurVue) vendeurVue.style.display = "block";
    
    // Charger les clients pour le vendeur
    loadClients();
    setupVendeurEventListeners();
    AddClient();
    setupModifyClient();
    
});

// ========== FONCTIONS POUR LA VUE VENDEUR ==========

async function loadClients() {
    try {
        const response = await fetch("/api/clients", {
            credentials: "include",
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        
        if (!response.ok) {
            console.error('Erreur chargement clients:', response.status);
            return;
        }
        
        const data = await response.json();
        if (data.success && data.clients){
            displayClients(data.clients);
            return data.clients;
        }
    } catch (error) {
        console.error('Erreur chargement clients:', error);
    }
}

function displayClients(clients) {
    const container = document.getElementById('clientList');
    if (!container) return;
    
    const searchTerm = document.getElementById('clientSearch')?.value.toLowerCase() || '';
    
    const filtered = clients.filter(c => 
        c.name?.toLowerCase().includes(searchTerm) || 
        c.prenom?.toLowerCase().includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm)
    );
    
    // Vider le conteneur
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Ajouter chaque client
    filtered.forEach(client => {
        const card = document.createElement('div');
        card.className = `card ${currentClient?.id === client.id ? 'selected' : ''}`;
        card.dataset.clientId = client.id;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = `${client.prenom} ${client.name}`;
        
        const emailDiv = document.createElement('div');
        emailDiv.className = 'email';
        emailDiv.textContent = client.email;
        
        const phoneDiv = document.createElement('div');
        phoneDiv.className = 'phone';
        phoneDiv.textContent = client.telephone || 'Pas de téléphone';
        
        card.appendChild(nameDiv);
        card.appendChild(emailDiv);
        card.appendChild(phoneDiv);
        
        card.addEventListener('click', () => selectClient(parseInt(card.dataset.clientId)));
        
        container.appendChild(card);
    });
}

async function selectClient(clientId) {
    try {
        const response = await fetch('/api/clients/select', {
            credentials: "include",
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: clientId })
        });
        
        const data = await response.json();
        if (data.success) {
            currentClient = data.client;
            window.currentClient = currentClient;
            displayClientInfo(currentClient);
            
            document.querySelectorAll('#clientList .card').forEach(card => {
                if (parseInt(card.dataset.clientId) === clientId) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            });
        }
    } catch (error) {
        console.error('Erreur sélection client:', error);
    }
}

function displayClientInfo(client) {
    const clientInfo = document.getElementById('clientInfo');
    const noClientSelected = document.getElementById('noClientSelected');
    
    if (clientInfo) clientInfo.classList.remove('hidden');
    if (noClientSelected) noClientSelected.classList.add('hidden');
    
    const nomSpan = document.getElementById('clientNom');
    const prenomSpan = document.getElementById('clientPrenom');
    const emailSpan = document.getElementById('clientEmail');
    const telephoneSpan = document.getElementById('clientTelephone');
    const adresseSpan = document.getElementById('clientAdresse');
    
    if (nomSpan) nomSpan.textContent = client.name || '';
    if (prenomSpan) prenomSpan.textContent = client.prenom || '';
    if (emailSpan) emailSpan.textContent = client.email || '';
    if (telephoneSpan) telephoneSpan.textContent = client.telephone || 'Non renseigné';
    if (adresseSpan) adresseSpan.textContent = client.adresse || 'Non renseignée';
}

function setupVendeurEventListeners() {
    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            window.location.href = '/logout';
        });
    }
    
    // Recherche client
    const clientSearch = document.getElementById('clientSearch');
    if (clientSearch) {
        clientSearch.addEventListener('input', () => loadClients());
    }
    
    // Bouton catalogue
    const viewCatalogueBtn = document.getElementById('viewCatalogueBtn');
    if (viewCatalogueBtn) {
        viewCatalogueBtn.addEventListener('click', () => {
            if (currentClient) {
                window.location.href = `/shop`;
            } else {
                alert('Veuillez d\'abord sélectionner un client');
            }
        });
    }
    
    // Bouton commandes
    const viewOrdersBtn = document.getElementById('viewOrdersBtn');
    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', async () => {
            if (currentClient) {
                await showOrders(currentClient.id);
            } else {
                alert('Veuillez d\'abord sélectionner un client');
            }
        });
    }
    
    // Bouton réservations
    const viewReservationsBtn = document.getElementById('viewReservationsBtn');
    if (viewReservationsBtn) {
        viewReservationsBtn.addEventListener('click', async () => {
            if (currentClient) {
                await showReservations(currentClient.id);
            } else {
                alert('Veuillez d\'abord sélectionner un client');
            }
        });
    }
}

// ========== FONCTIONS POUR LA VUE ADMIN ==========

let currentVendeur = null;

async function loadVendeurs() {
    try {
        const response = await fetch("/api/vendeurs", {
            credentials: "include",
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        
        if (!response.ok) {
            console.error('Erreur chargement vendeurs:', response.status);
            return;
        }
        
        const data = await response.json();
        if (data.success && data.vendeurs){
            displayVendeurs(data.vendeurs);
            return data.vendeurs;
        }
    } catch (error) {
        console.error('Erreur chargement vendeurs:', error);
    }
}

function displayVendeurs(vendeurs) {
    const container = document.getElementById('vendeurList');
    if (!container) return;
    
    const searchTerm = document.getElementById('vendeurSearch')?.value.toLowerCase() || '';
    
    const filtered = vendeurs.filter(v => 
        v.name?.toLowerCase().includes(searchTerm) || 
        v.prenom?.toLowerCase().includes(searchTerm) ||
        v.email?.toLowerCase().includes(searchTerm)
    );
    
    // Vider le conteneur
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Ajouter chaque vendeur
    filtered.forEach(vendeur => {
        const card = document.createElement('div');
        card.className = `card ${currentVendeur?.id === vendeur.id ? 'selected' : ''}`;
        card.dataset.vendeurId = vendeur.id;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = `${vendeur.prenom} ${vendeur.name}`;
        
        const emailDiv = document.createElement('div');
        emailDiv.className = 'email';
        emailDiv.textContent = vendeur.email;
        
        const phoneDiv = document.createElement('div');
        phoneDiv.className = 'phone';
        phoneDiv.textContent = vendeur.telephone || 'Pas de téléphone';
        
        card.appendChild(nameDiv);
        card.appendChild(emailDiv);
        card.appendChild(phoneDiv);
        
        card.addEventListener('click', () => selectVendeur(parseInt(card.dataset.vendeurId)));
        
        container.appendChild(card);
    });
}

async function selectVendeur(vendeurId) {
    try {
        const response = await fetch('/api/vendeurs/select', {
            credentials: "include",
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vendeur_id: vendeurId })
        });
        
        const data = await response.json();
        if (data.success) {
            currentVendeur = data.vendeur;
            displayVendeurInfo(currentVendeur);
            
            document.querySelectorAll('#vendeurList .card').forEach(card => {
                if (parseInt(card.dataset.vendeurId) === vendeurId) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            });
        }
    } catch (error) {
        console.error('Erreur sélection vendeur:', error);
    }
}

function displayVendeurInfo(vendeur) {
    const vendeurInfo = document.getElementById('vendeurInfo');
    const noVendeurSelected = document.getElementById('novendeurSelected');
    
    if (vendeurInfo) vendeurInfo.classList.remove('hidden');
    if (noVendeurSelected) noVendeurSelected.classList.add('hidden');
    
    const nomSpan = document.getElementById('vendeurNom');
    const prenomSpan = document.getElementById('vendeurPrenom');
    const emailSpan = document.getElementById('vendeurEmail');
    const telephoneSpan = document.getElementById('vendeurTelephone');
    
    if (nomSpan) nomSpan.textContent = vendeur.name || '';
    if (prenomSpan) prenomSpan.textContent = vendeur.prenom || '';
    if (emailSpan) emailSpan.textContent = vendeur.email || '';
    if (telephoneSpan) telephoneSpan.textContent = vendeur.telephone || 'Non renseigné';
}

function setupAdminEventListeners() {
    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            window.location.href = '/logout';
        });
    }
    
    // Recherche vendeur
    const vendeurSearch = document.getElementById('vendeurSearch');
    if (vendeurSearch) {
        vendeurSearch.addEventListener('input', () => loadVendeurs());
    }
    
    // Bouton ajout vendeur
    const showAddVendeurBtn = document.getElementById('showAddvendeurBtn');
    if (showAddVendeurBtn) {
        showAddVendeurBtn.addEventListener('click', () => {
            // TODO: Implémenter l'ajout de vendeur
            alert('Fonctionnalité à implémenter');
        });
    }
    
    // Bouton commandes vendeur
    const viewOrdersBtn = document.getElementById('viewOrdersBtn');
    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', async () => {
            if (currentVendeur) {
                await showVendeurOrders(currentVendeur.id);
            } else {
                alert('Veuillez d\'abord sélectionner un vendeur');
            }
        });
    }
    
    // Bouton réservations vendeur
    const viewReservationsBtn = document.getElementById('viewReservationsBtn');
    if (viewReservationsBtn) {
        viewReservationsBtn.addEventListener('click', async () => {
            if (currentVendeur) {
                await showVendeurReservations(currentVendeur.id);
            } else {
                alert('Veuillez d\'abord sélectionner un vendeur');
            }
        });
    }
}

async function showVendeurOrders(vendeurId) {
    try {
        const response = await fetch(`/api/commandes/vendeur/${vendeurId}`, {
            credentials: "include",
            method: "GET"
        });
        const commandes = await response.json();
        
        const modal = document.getElementById('ordersModal');
        const container = document.getElementById('ordersList');
        
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            
            if (commandes.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.textContent = 'Aucune commande pour ce vendeur.';
                container.appendChild(emptyMessage);
            } else {
                commandes.forEach(cmd => {
                    const orderCard = createOrderCard(cmd);
                    container.appendChild(orderCard);
                });
            }
        }
        
        if (modal) modal.style.display = 'flex';
        
        const closeModal = modal?.querySelector('.close-modal');
        if (closeModal) {
            closeModal.onclick = () => modal.style.display = 'none';
        }
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    } catch (error) {
        console.error('Erreur chargement commandes vendeur:', error);
    }
}

async function showVendeurReservations(vendeurId) {
    try {
        const response = await fetch(`/api/reservations/vendeur/${vendeurId}`, {
            credentials: "include",
            method: "GET"
        });
        const reservations = await response.json();
        
        const modal = document.getElementById('reservationsModal');
        const container = document.getElementById('reservationsList');
        
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            
            if (reservations.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.textContent = 'Aucune location pour ce vendeur.';
                container.appendChild(emptyMessage);
            } else {
                const catalogueRes = await fetch('/api/catalogue');
                const catalogue = await catalogueRes.json();
                
                reservations.forEach(res => {
                    const broom = catalogue.find(b => b.id === res.broomId);
                    const reservationCard = createReservationCard(res, broom);
                    container.appendChild(reservationCard);
                });
            }
        }
        
        if (modal) modal.style.display = 'flex';
        
        const closeModal = modal?.querySelector('.close-modal');
        if (closeModal) {
            closeModal.onclick = () => modal.style.display = 'none';
        }
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    } catch (error) {
        console.error('Erreur chargement locations vendeur:', error);
    }
}

function createOrderCard(cmd) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    const orderHeader = document.createElement('div');
    orderHeader.className = 'order-header';
    
    const orderIdStrong = document.createElement('strong');
    orderIdStrong.textContent = `Commande #${cmd.id}`;
    
    const orderDate = document.createElement('span');
    orderDate.className = 'order-date';
    orderDate.textContent = new Date(cmd.date_commande).toLocaleDateString();
    
    const orderStatus = document.createElement('span');
    orderStatus.className = 'order-status';
    orderStatus.textContent = cmd.statut;
    
    orderHeader.appendChild(orderIdStrong);
    orderHeader.appendChild(orderDate);
    orderHeader.appendChild(orderStatus);
    
    const orderTotal = document.createElement('div');
    orderTotal.className = 'order-total';
    orderTotal.textContent = `Total : ${cmd.total.toFixed(2)} €`;
    
    const orderItems = document.createElement('div');
    orderItems.className = 'order-items';
    
    if (cmd.articles) {
        cmd.articles.forEach(article => {
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            orderItem.textContent = `${article.name} x ${article.quantity} - ${article.total?.toFixed(2)}€`;
            
            if (article.rental_dates) {
                const small = document.createElement('small');
                small.textContent = ` (${article.rental_dates})`;
                orderItem.appendChild(small);
            }
            
            orderItems.appendChild(orderItem);
        });
    }
    
    orderCard.appendChild(orderHeader);
    orderCard.appendChild(orderTotal);
    orderCard.appendChild(orderItems);
    
    return orderCard;
}

function createReservationCard(res, broom) {
    const reservationCard = document.createElement('div');
    reservationCard.className = 'reservation-card';
    
    const reservationHeader = document.createElement('div');
    reservationHeader.className = 'reservation-header';
    
    const broomStrong = document.createElement('strong');
    broomStrong.textContent = broom?.libelle || `Balai #${res.broomId}`;
    
    const reservationDates = document.createElement('span');
    reservationDates.className = 'reservation-dates';
    reservationDates.textContent = `${res.startDate} → ${res.endDate}`;
    
    reservationHeader.appendChild(broomStrong);
    reservationHeader.appendChild(reservationDates);
    
    const reservationId = document.createElement('div');
    reservationId.className = 'reservation-id';
    reservationId.textContent = `Réservation #${res.id}`;
    
    reservationCard.appendChild(reservationHeader);
    reservationCard.appendChild(reservationId);
    
    return reservationCard;
}