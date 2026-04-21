import {showOrders} from './show_commands.js';
import {showReservations} from './show_reservations.js';
import {AddClient} from './add_client.js';
import {setupModifyClient} from './modify_client.js';

let currentClient = null;
let currentVendeur = null;
window.currentClient = currentClient;
window.currentVendeur = currentVendeur;
window.loadClients = loadClients;
window.displayClientInfo = displayClientInfo;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("vendeur_name").innerText = sessionStorage.getItem("username") || "Vendeur";
    
    let role = sessionStorage.getItem("role");
    
    const adminVue = document.getElementById("admin-vue");
    const vendeurVue = document.getElementById("vendeur-vue");
    
    if (role && role.toLowerCase() === "admin") {
        if (adminVue) adminVue.style.display = "block";
        if (vendeurVue) vendeurVue.style.display = "block";
        loadVendeurs();
        setupAdminEventListeners();
    } else {
        if (adminVue) adminVue.style.display = "none";
        if (vendeurVue) vendeurVue.style.display = "block";
    }
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
        card.className = `card ${currentClient?.id_client === client.id_client ? 'selected' : ''}`;
        card.dataset.clientId = client.id_client;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = `${client.surname || ''} ${client.name || ''}`;
        
        const emailDiv = document.createElement('div');
        emailDiv.className = 'email';
        if (client.type_client === 'sorcier') {
            emailDiv.textContent = client.sorcier?.chimney || 'Pas de cheminée';
        } else {
            emailDiv.textContent = client.moldu?.mail || 'Pas d\'email';
        }
        
        const typeDiv = document.createElement('div');
        typeDiv.className = 'phone';
        typeDiv.textContent = client.type_client === 'sorcier' ? '🧙 Sorcier' : '🏠 Moldu';
        
        card.appendChild(nameDiv);
        card.appendChild(emailDiv);
        card.appendChild(typeDiv);
        
        card.addEventListener('click', () => selectClient(parseInt(card.dataset.clientId)));
        window.selectClient = selectClient;
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
    const sorcierDetails = document.getElementById('sorcierDetails');
    const molduDetails = document.getElementById('molduDetails');
    
    if (clientInfo) clientInfo.classList.remove('hidden');
    if (noClientSelected) noClientSelected.classList.add('hidden');
    
    // Informations générales
    document.getElementById('clientNom').textContent = client.name || '';
    document.getElementById('clientPrenom').textContent = client.surname || '';
    document.getElementById('clientBirthDate').textContent = client.birth_date || 'Non renseigné';
    document.getElementById('clientType').innerHTML = client.SORCIER != null ? '🧙 Sorcier' : '🏠 Moldu';
    document.getElementById('clientMoney').textContent = client.money ? parseFloat(client.money).toFixed(2) : '0.00';
    
    // Afficher les détails spécifiques
    if (client.SORCIER != null) {
        sorcierDetails.style.display = 'block';
        molduDetails.style.display = 'none';
        
        document.getElementById('clientEmail').textContent = client.sorcier.Chimney || 'Non renseigné';
        document.getElementById('clientAdresse').textContent = `${client.sorcier.Add_House || ''}, ${client.sorcier.Add_School_name || ''}, ${client.sorcier.Add_Country || ''}`;
        
        document.getElementById('sorcierRegistry').textContent = client.sorcier.Wizard_registry_number || 'Non renseigné';
        document.getElementById('sorcierChimney').textContent = client.sorcier.Chimney || 'Non renseigné';
        document.getElementById('sorcierSchool').textContent = client.sorcier.Add_School_name || 'Non renseigné';
        document.getElementById('sorcierHouse').textContent = client.sorcier.Add_House || 'Non renseigné';
        document.getElementById('sorcierCountry').textContent = client.sorcier.Add_Country || 'Non renseigné';
        document.getElementById('sorcierFlightLicence').textContent = client.sorcier.Flight_licence || '0';
        
        const owls = client.sorcier.owls || [];
        document.getElementById('clientTelephone').textContent = owls.length > 0 ? owls.join(', ') : 'Aucun';
        
    } else if (client.MOLDU != null) {
        sorcierDetails.style.display = 'none';
        molduDetails.style.display = 'block';
        
        document.getElementById('clientEmail').textContent = client.moldu.Mail || 'Non renseigné';
        
        document.getElementById('clientAdresse').textContent = `${client.moldu.Add_House_number || ''} ${client.moldu.Add_Street || ''}, ${client.moldu.Add_City || ''}, ${client.moldu.Add_Country || ''}`;
        
        document.getElementById('molduNationalRegister').textContent = client.moldu.National_register_number || 'Non renseigné';
        document.getElementById('molduStreet').textContent = client.moldu.Add_Street || 'Non renseigné';
        document.getElementById('molduCity').textContent = client.moldu.Add_City || 'Non renseigné';
        document.getElementById('molduHouseNumber').textContent = client.moldu.Add_House_number || 'Non renseigné';
        document.getElementById('molduCountry').textContent = client.moldu.Add_Country || 'Non renseigné';

        const telephones = client.telephones || [];
        document.getElementById('clientTelephone').textContent = telephones.length > 0 ? telephones.join(', ') : 'Non renseigné';
    }
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
        nameDiv.textContent = `${vendeur.surname || ''} ${vendeur.name || ''}`;
        
        const emailDiv = document.createElement('div');
        emailDiv.className = 'email';
        emailDiv.textContent = vendeur.mail_pro || '';
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'phone';
        statusDiv.textContent = vendeur.actif ? '🟢 Actif' : '🔴 Inactif';
        
        card.appendChild(nameDiv);
        card.appendChild(emailDiv);
        card.appendChild(statusDiv);
        
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
            window.currentVendeur = currentVendeur;
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
    const noVendeurSelected = document.getElementById('noVendeurSelected');
    
    if (vendeurInfo) vendeurInfo.classList.remove('hidden');
    if (noVendeurSelected) noVendeurSelected.classList.add('hidden');
    
    document.getElementById('vendeurNom').textContent = vendeur.name || '';
    document.getElementById('vendeurPrenom').textContent = vendeur.surname || '';
    document.getElementById('vendeurEmail').textContent = vendeur.mail_pro || '';
    document.getElementById('vendeurLogin').textContent = vendeur.login || '';
    
    // Récupérer les téléphones
    const phones = [vendeur.tel1, vendeur.tel2, vendeur.tel3].filter(t => t);
    document.getElementById('vendeurTelephone').textContent = phones.length > 0 ? phones.join(', ') : 'Non renseigné';
    
    const actifSpan = document.getElementById('vendeurActif');
    if (actifSpan) {
        actifSpan.innerHTML = vendeur.actif ? '<span style="color: green;">🟢 Actif</span>' : '<span style="color: red;">🔴 Inactif</span>';
    }
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
    
    const showAddVendeurBtn = document.getElementById('showAddVendeurBtn');
    if (showAddVendeurBtn) {
        showAddVendeurBtn.addEventListener('click', () => {
            alert('Fonctionnalité à implémenter');
        });
    }
    
    const viewVendeurOrdersBtn = document.getElementById('viewVendeurOrdersBtn');
    if (viewVendeurOrdersBtn) {
        viewVendeurOrdersBtn.addEventListener('click', async () => {
            if (currentVendeur) {
                await showVendeurOrders(currentVendeur.id_employee);
            } else {
                alert('Veuillez d\'abord sélectionner un vendeur');
            }
        });
    }
    
    const viewVendeurReservationsBtn = document.getElementById('viewVendeurReservationsBtn');
    if (viewVendeurReservationsBtn) {
        viewVendeurReservationsBtn.addEventListener('click', async () => {
            if (currentVendeur) {
                await showVendeurReservations(currentVendeur.id_employee);
            } else {
                alert('Veuillez d\'abord sélectionner un vendeur');
            }
        });
    }
    
    const modifyVendeurBtn = document.getElementById('modifyVendeurBtn');
    if (modifyVendeurBtn) {
        modifyVendeurBtn.addEventListener('click', () => {
            if (currentVendeur) {
                alert(`Modification du vendeur ${currentVendeur.surname} ${currentVendeur.name} à implémenter`);
            } else {
                alert('Veuillez d\'abord sélectionner un vendeur');
            }
        });
    }
    
    const deleteVendeurBtn = document.getElementById('deleteVendeurBtn');
    if (deleteVendeurBtn) {
        deleteVendeurBtn.addEventListener('click', async () => {
            if (currentVendeur && confirm(`Supprimer ${currentVendeur.surname} ${currentVendeur.name} ?`)) {
                await deleteVendeur(currentVendeur.id_employee);
            } else if (!currentVendeur) {
                alert('Veuillez d\'abord sélectionner un vendeur');
            }
        });
    }
}

async function deleteVendeur(vendeurId) {
    try {
        const response = await fetch(`/api/delete/vendeurs/${vendeurId}`, {
            credentials: "include",
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Vendeur supprimé avec succès');
            currentVendeur = null;
            await loadVendeurs();
            
            const vendeurInfo = document.getElementById('vendeurInfo');
            const noVendeurSelected = document.getElementById('noVendeurSelected');
            if (vendeurInfo) vendeurInfo.classList.add('hidden');
            if (noVendeurSelected) noVendeurSelected.classList.remove('hidden');
        } else {
            const error = await response.json();
            alert(`Erreur: ${error.detail || 'Erreur lors de la suppression'}`);
        }
    } catch (error) {
        console.error('Erreur suppression vendeur:', error);
        alert('Erreur réseau');
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
        const modalTitle = document.getElementById('ordersModalTitle');
        
        if (modalTitle) {
            modalTitle.textContent = `📦 Commandes du vendeur`;
        }
        
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            
            if (!commandes || commandes.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.textContent = 'Aucune commande pour ce vendeur.';
                emptyMessage.style.textAlign = 'center';
                emptyMessage.style.padding = '40px';
                emptyMessage.style.color = '#6c757d';
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
        alert('Erreur lors du chargement des commandes');
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
        const modalTitle = document.getElementById('reservationsModalTitle');
        
        if (modalTitle) {
            modalTitle.textContent = `📅 Locations gérées par le vendeur`;
        }
        
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            
            if (!reservations || reservations.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.textContent = 'Aucune location pour ce vendeur.';
                emptyMessage.style.textAlign = 'center';
                emptyMessage.style.padding = '40px';
                emptyMessage.style.color = '#6c757d';
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
        alert('Erreur lors du chargement des locations');
    }
}

function createOrderCard(cmd) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    const orderHeader = document.createElement('div');
    orderHeader.className = 'order-header';
    
    const orderIdStrong = document.createElement('strong');
    orderIdStrong.textContent = `Commande #${cmd.id_commande || cmd.id}`;
    
    const orderDate = document.createElement('span');
    orderDate.className = 'order-date';
    orderDate.textContent = cmd.sale_date || cmd.command_date ? new Date(cmd.sale_date || cmd.command_date).toLocaleDateString() : 'Date inconnue';
    
    const orderType = document.createElement('span');
    orderType.className = 'order-status';
    const typeText = cmd.type_commande === 'vente' ? '💰 Vente' : (cmd.type_commande === 'location' ? '📅 Location' : (cmd.VENTE ? '💰 Vente' : '📅 Location'));
    orderType.textContent = typeText;
    
    orderHeader.appendChild(orderIdStrong);
    orderHeader.appendChild(orderDate);
    orderHeader.appendChild(orderType);
    
    orderCard.appendChild(orderHeader);
    
    if (cmd.client_name || cmd.client_surname) {
        const clientInfo = document.createElement('div');
        clientInfo.className = 'order-client';
        clientInfo.style.marginTop = '10px';
        clientInfo.style.fontSize = '14px';
        clientInfo.style.color = '#6c757d';
        clientInfo.textContent = `Client: ${cmd.client_surname || ''} ${cmd.client_name || ''}`;
        orderCard.appendChild(clientInfo);
    }
    
    return orderCard;
}

function createReservationCard(res, broom) {
    const reservationCard = document.createElement('div');
    reservationCard.className = 'reservation-card';
    
    const reservationHeader = document.createElement('div');
    reservationHeader.className = 'reservation-header';
    
    const broomStrong = document.createElement('strong');
    broomStrong.textContent = broom?.Libelle || broom?.libelle || `Balai #${res.id_balai || res.broomId}`;
    
    const reservationDates = document.createElement('span');
    reservationDates.className = 'reservation-dates';
    reservationDates.textContent = `${res.begin_date || res.startDate} → ${res.end_date || res.endDate}`;
    
    reservationHeader.appendChild(broomStrong);
    reservationHeader.appendChild(reservationDates);
    
    const reservationStatus = document.createElement('div');
    reservationStatus.className = 'reservation-status';
    reservationStatus.style.marginTop = '10px';
    reservationStatus.style.fontSize = '14px';
    reservationStatus.style.padding = '4px 12px';
    reservationStatus.style.borderRadius = '20px';
    reservationStatus.style.display = 'inline-block';
    
    const status = res.status || 'En cours';
    if (status === 'Pending') {
        reservationStatus.style.backgroundColor = '#f39c12';
        reservationStatus.textContent = ' En attente';
    } else if (status === 'Confirmed') {
        reservationStatus.style.backgroundColor = '#27ae60';
        reservationStatus.textContent = ' Confirmée';
    } else if (status === 'Finished') {
        reservationStatus.style.backgroundColor = '#95a5a6';
        reservationStatus.textContent = ' Terminée';
    } else {
        reservationStatus.style.backgroundColor = '#3498db';
        reservationStatus.textContent = `📌 ${status}`;
    }
    
    reservationCard.appendChild(reservationHeader);
    reservationCard.appendChild(reservationStatus);
    
    if (res.client_name || res.client_surname) {
        const clientInfo = document.createElement('div');
        clientInfo.className = 'reservation-client';
        clientInfo.style.marginTop = '10px';
        clientInfo.style.fontSize = '12px';
        clientInfo.style.color = '#6c757d';
        clientInfo.textContent = `Client: ${res.client_surname || ''} ${res.client_name || ''}`;
        reservationCard.appendChild(clientInfo);
    }
    
    return reservationCard;
}