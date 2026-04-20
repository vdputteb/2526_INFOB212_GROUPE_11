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
    
    loadClients();
    setupVendeurEventListeners();
    AddClient();
    setupModifyClient();
});

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
        c.surname?.toLowerCase().includes(searchTerm) ||
        (c.moldu?.mail?.toLowerCase().includes(searchTerm)) ||
        (c.sorcier?.chimney?.toLowerCase().includes(searchTerm))
    );
    
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    filtered.forEach(client => {
        const card = document.createElement('div');
        card.className = `card ${currentClient?.id === client.id_client ? 'selected' : ''}`;
        card.dataset.clientId = client.id_client;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = `${client.surname} ${client.name}`;
        
        const emailDiv = document.createElement('div');
        emailDiv.className = 'email';
        emailDiv.textContent = client.type_client === 'sorcier' ? 
            (client.sorcier?.chimney || 'Pas de cheminée') : 
            (client.moldu?.mail || 'Pas d\'email');
        
        const typeDiv = document.createElement('div');
        typeDiv.className = 'phone';
        typeDiv.textContent = client.type_client === 'sorcier' ? '🧙 Sorcier' : '🏠 Moldu';
        
        card.appendChild(nameDiv);
        card.appendChild(emailDiv);
        card.appendChild(typeDiv);
        
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
    
    document.getElementById('clientNom').textContent = client.name || '';
    document.getElementById('clientPrenom').textContent = client.surname || '';
    document.getElementById('clientType').textContent = client.type_client === 'sorcier' ? '🧙 Sorcier' : '🏠 Moldu';
    
    if (client.type_client === 'sorcier' && client.sorcier) {
        document.getElementById('clientEmail').textContent = client.sorcier.chimney || 'Non renseigné';
        document.getElementById('clientAdresse').textContent = `${client.sorcier.add_house || ''}, ${client.sorcier.add_school_name || ''}`;
    } else if (client.moldu) {
        document.getElementById('clientEmail').textContent = client.moldu.mail || 'Non renseigné';
        document.getElementById('clientAdresse').textContent = `${client.moldu.add_house_number || ''} ${client.moldu.add_street || ''}, ${client.moldu.add_city || ''}, ${client.moldu.add_country || ''}`;
    }
    
    const telephones = client.telephones || [];
    document.getElementById('clientTelephone').textContent = telephones.length > 0 ? telephones.join(', ') : 'Non renseigné';
}

function setupVendeurEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            window.location.href = '/logout';
        });
    }
    
    const clientSearch = document.getElementById('clientSearch');
    if (clientSearch) {
        clientSearch.addEventListener('input', () => loadClients());
    }
    
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
    
    const viewOrdersBtn = document.getElementById('viewOrdersBtn');
    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', async () => {
            if (currentClient) {
                await showOrders(currentClient.id_client);
            } else {
                alert('Veuillez d\'abord sélectionner un client');
            }
        });
    }
    
    const viewReservationsBtn = document.getElementById('viewReservationsBtn');
    if (viewReservationsBtn) {
        viewReservationsBtn.addEventListener('click', async () => {
            if (currentClient) {
                await showReservations(currentClient.id_client);
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
        v.surname?.toLowerCase().includes(searchTerm) ||
        v.mail_pro?.toLowerCase().includes(searchTerm)
    );
    
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    filtered.forEach(vendeur => {
        const card = document.createElement('div');
        card.className = `card ${currentVendeur?.id_employee === vendeur.id_employee ? 'selected' : ''}`;
        card.dataset.vendeurId = vendeur.id_employee;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = `${vendeur.surname} ${vendeur.name}`;
        
        const emailDiv = document.createElement('div');
        emailDiv.className = 'email';
        emailDiv.textContent = vendeur.mail_pro;
        
        const roleDiv = document.createElement('div');
        roleDiv.className = 'phone';
        roleDiv.textContent = vendeur.is_patron ? '👑 Patron' : '👤 Vendeur';
        
        card.appendChild(nameDiv);
        card.appendChild(emailDiv);
        card.appendChild(roleDiv);
        
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
            body: JSON.stringify({ vendeurs_id: vendeurId })
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
    
    document.getElementById('vendeurNom').textContent = vendeur.name || '';
    document.getElementById('vendeurPrenom').textContent = vendeur.surname || '';
    document.getElementById('vendeurEmail').textContent = vendeur.mail_pro || '';
    document.getElementById('vendeurTelephone').textContent = 'Non renseigné';
}

function setupAdminEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            window.location.href = '/logout';
        });
    }
    
    const vendeurSearch = document.getElementById('vendeurSearch');
    if (vendeurSearch) {
        vendeurSearch.addEventListener('input', () => loadVendeurs());
    }
    
    const showAddVendeurBtn = document.getElementById('showAddvendeurBtn');
    if (showAddVendeurBtn) {
        showAddVendeurBtn.addEventListener('click', () => {
            alert('Fonctionnalité à implémenter');
        });
    }
    
    const viewOrdersBtn = document.getElementById('viewOrdersBtn');
    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', async () => {
            if (currentVendeur) {
                await showVendeurOrders(currentVendeur.id_employee);
            } else {
                alert('Veuillez d\'abord sélectionner un vendeur');
            }
        });
    }
    
    const viewReservationsBtn = document.getElementById('viewReservationsBtn');
    if (viewReservationsBtn) {
        viewReservationsBtn.addEventListener('click', async () => {
            if (currentVendeur) {
                await showVendeurReservations(currentVendeur.id_employee);
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
                    const broom = catalogue.find(b => b.id_balai === res.id_balai);
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
    orderIdStrong.textContent = `Commande #${cmd.id_commande}`;
    
    const orderDate = document.createElement('span');
    orderDate.className = 'order-date';
    orderDate.textContent = new Date(cmd.command_date).toLocaleDateString();
    
    const orderType = document.createElement('span');
    orderType.className = 'order-status';
    orderType.textContent = cmd.type_commande === 'vente' ? '💰 Vente' : '📅 Location';
    
    orderHeader.appendChild(orderIdStrong);
    orderHeader.appendChild(orderDate);
    orderHeader.appendChild(orderType);
    
    orderCard.appendChild(orderHeader);
    
    return orderCard;
}

function createReservationCard(res, broom) {
    const reservationCard = document.createElement('div');
    reservationCard.className = 'reservation-card';
    
    const reservationHeader = document.createElement('div');
    reservationHeader.className = 'reservation-header';
    
    const broomStrong = document.createElement('strong');
    broomStrong.textContent = broom?.Libelle || `Balai #${res.id_balai}`;
    
    const reservationDates = document.createElement('span');
    reservationDates.className = 'reservation-dates';
    reservationDates.textContent = `${res.begin_date} → ${res.end_date}`;
    
    reservationHeader.appendChild(broomStrong);
    reservationHeader.appendChild(reservationDates);
    
    const reservationStatus = document.createElement('div');
    reservationStatus.className = 'reservation-id';
    reservationStatus.textContent = `Statut: ${res.status}`;
    
    reservationCard.appendChild(reservationHeader);
    reservationCard.appendChild(reservationStatus);
    
    return reservationCard;
}