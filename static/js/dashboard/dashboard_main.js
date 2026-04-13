import {showOrders} from './show_commands.js';
import {showReservations} from './show_reservations.js';
import {AddClient} from './add_client.js';

let currentClient = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("vendeur_name").innerText = sessionStorage.getItem("userID") || "Vendeur";
    
    loadClients();
    setupEventListeners();
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
        const clients = await response.json();
        displayClients(clients);
    } catch (error) {
        console.error('Erreur chargement clients:', error);
    }
}

function displayClients(clients) {
    const container = document.getElementById('clientList');
    const searchTerm = document.getElementById('clientSearch')?.value.toLowerCase() || '';
    
    const filtered = clients.filter(c => 
        c.nom.toLowerCase().includes(searchTerm) || 
        c.prenom.toLowerCase().includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm)
    );
    
    // Vider le conteneur
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Ajouter chaque client
    filtered.forEach(client => {
        const card = document.createElement('div');
        card.className = `client-card ${currentClient?.id === client.id ? 'selected' : ''}`;
        card.dataset.clientId = client.id;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'client-name';
        nameDiv.textContent = `${client.prenom} ${client.nom}`;
        
        const emailDiv = document.createElement('div');
        emailDiv.className = 'client-email';
        emailDiv.textContent = client.email;
        
        const phoneDiv = document.createElement('div');
        phoneDiv.className = 'client-phone';
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
            displayClientInfo(currentClient);
            
            // Mettre à jour la classe selected des cartes
            document.querySelectorAll('.client-card').forEach(card => {
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

// a modif après par rapport à sorcier ou moldu
function displayClientInfo(client) {
    document.getElementById('clientInfo').classList.remove('hidden');
    document.getElementById('noClientSelected').classList.add('hidden');
    
    document.getElementById('clientNom').textContent = client.nom;
    document.getElementById('clientPrenom').textContent = client.prenom;
    document.getElementById('clientEmail').textContent = client.email;
    document.getElementById('clientTelephone').textContent = client.telephone;
    document.getElementById('clientAdresse').textContent = client.adresse;
}


function setupEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        window.location.href = '/logout';
    });
    
    document.getElementById('clientSearch')?.addEventListener('input', loadClients);
    
    document.getElementById('viewCatalogueBtn')?.addEventListener('click', () => {
        if (currentClient) {
            window.location.href = `/shop`;
        }
    });
    
    document.getElementById('viewOrdersBtn')?.addEventListener('click', async () => {
        if (currentClient) {
            await showOrders(currentClient.id);
        }
    });
    
    document.getElementById('viewReservationsBtn')?.addEventListener('click', async () => {
        if (currentClient) {
            await showReservations(currentClient.id);
        }
    });
    
    AddClient();
}