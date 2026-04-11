let currentClient = null;

document.addEventListener('DOMContentLoaded', () => {
    loadClients();
    setupEventListeners();
});

async function loadClients() {
    try {
        const response = await fetch('/api/clients');
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
    
    container.innerHTML = filtered.map(client => `
        <div class="client-card ${currentClient?.id === client.id ? 'selected' : ''}" data-client-id="${client.id}">
            <div class="client-name">${client.prenom} ${client.nom}</div>
            <div class="client-email">${client.email}</div>
            <div class="client-phone">${client.telephone || 'Pas de téléphone'}</div>
        </div>
    `).join('');
    
    document.querySelectorAll('.client-card').forEach(card => {
        card.addEventListener('click', () => selectClient(parseInt(card.dataset.clientId)));
    });
}

async function selectClient(clientId) {
    try {
        const response = await fetch('/api/clients/select', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: clientId })
        });
        
        const data = await response.json();
        if (data.success) {
            currentClient = data.client;
            displayClientInfo(currentClient);
            document.querySelectorAll('.client-card').forEach(card => {
                card.classList.toggle('selected', parseInt(card.dataset.clientId) === clientId);
            });
        }
    } catch (error) {
        console.error('Erreur sélection client:', error);
    }
}

function displayClientInfo(client) {
    document.getElementById('clientInfo').classList.remove('hidden');
    document.getElementById('noClientSelected').classList.add('hidden');
    
    document.getElementById('clientNom').textContent = client.nom;
    document.getElementById('clientPrenom').textContent = client.prenom;
    document.getElementById('clientEmail').textContent = client.email;
    document.getElementById('clientTelephone').textContent = client.telephone || 'Non renseigné';
    document.getElementById('clientAdresse').textContent = client.adresse || 'Non renseignée';
}

function setupEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/auth';
    });
    
    document.getElementById('clientSearch')?.addEventListener('input', loadClients);
    
    document.getElementById('viewCatalogueBtn')?.addEventListener('click', () => {
        if (currentClient) {
            window.location.href = `/client/shop?client_id=${currentClient.id}`;
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
    
    setupAddClientModal();
}

async function showOrders(clientId) {
    try {
        const response = await fetch(`/api/commandes/client/${clientId}`);
        const commandes = await response.json();
        
        const modal = document.getElementById('ordersModal');
        const container = document.getElementById('ordersList');
        
        if (commandes.length === 0) {
            container.innerHTML = '<p>Aucune commande pour ce client.</p>';
        } else {
            container.innerHTML = commandes.map(cmd => `
                <div class="order-card">
                    <div class="order-header">
                        <strong>Commande #${cmd.id}</strong>
                        <span class="order-date">${new Date(cmd.date_commande).toLocaleDateString()}</span>
                        <span class="order-status">${cmd.statut}</span>
                    </div>
                    <div class="order-total">Total : ${cmd.total.toFixed(2)} €</div>
                    <div class="order-items">
                        ${cmd.articles.map(a => `
                            <div class="order-item">
                                ${a.name} x ${a.quantity} - ${a.total.toFixed(2)}€
                                ${a.rental_dates ? `<small>(${a.rental_dates})</small>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
        
        modal.style.display = 'flex';
        
        modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
    }
}

async function showReservations(clientId) {
    try {
        const response = await fetch(`/api/reservations/client/${clientId}`);
        const reservations = await response.json();
        
        const modal = document.getElementById('reservationsModal');
        const container = document.getElementById('reservationsList');
        
        if (reservations.length === 0) {
            container.innerHTML = '<p>Aucune location pour ce client.</p>';
        } else {
            // Récupérer les noms des balais
            const catalogueRes = await fetch('/api/catalogue');
            const catalogue = await catalogueRes.json();
            
            container.innerHTML = reservations.map(res => {
                const broom = catalogue.find(b => b.id === res.broomId);
                return `
                    <div class="reservation-card">
                        <div class="reservation-header">
                            <strong>${broom?.libelle || `Balai #${res.broomId}`}</strong>
                            <span class="reservation-dates">${res.startDate} → ${res.endDate}</span>
                        </div>
                        <div class="reservation-id">Réservation #${res.id}</div>
                    </div>
                `;
            }).join('');
        }
        
        modal.style.display = 'flex';
        
        modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    } catch (error) {
        console.error('Erreur chargement locations:', error);
    }
}

function setupAddClientModal() {
    const modal = document.getElementById('addClientModal');
    const showBtn = document.getElementById('showAddClientBtn');
    const closeBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('addClientForm');
    
    showBtn.addEventListener('click', () => modal.style.display = 'flex');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newClient = {
            nom: document.getElementById('newClientNom').value,
            prenom: document.getElementById('newClientPrenom').value,
            email: document.getElementById('newClientEmail').value,
            telephone: document.getElementById('newClientTelephone').value,
            adresse: document.getElementById('newClientAdresse').value,
            username: document.getElementById('newClientEmail').value.split('@')[0]
        };
        
        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClient)
            });
            
            if (response.ok) {
                modal.style.display = 'none';
                form.reset();
                loadClients();
                alert('Client créé avec succès !');
            } else {
                alert('Erreur lors de la création du client');
            }
        } catch (error) {
            console.error('Erreur création client:', error);
            alert('Erreur réseau');
        }
    });
}