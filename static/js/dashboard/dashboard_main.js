import {showClientOrders} from './show_ventes.js';
import {showClientlocations} from './show_locations.js';
import {AddClient} from './add_client.js';
import {setupModifyClient, addDeleteClientButton, addModifyClientButton} from './modify_client.js';
import {AddVendeur} from './admin/add_vendeur.js';
import {setupModifyVendeur, addModifyVendeurButton} from './admin/modify_vendeur.js';
import {showVendeurOrders} from './admin/show_ventes_vendeur.js';
import {showVendeurlocations} from './admin/show_locations_vendeur.js';

let currentClient = null;
let currentVendeur = null;
window.currentClient = currentClient;
window.currentVendeur = currentVendeur;
window.loadClients = loadClients;
window.displayClientInfo = displayClientInfo;
window.loadVendeurs = loadVendeurs;

document.addEventListener('DOMContentLoaded', () => {
    // Définir d'abord les variables globales nécessaires
    window.currentClient = currentClient;
    window.currentVendeur = currentVendeur;
    window.loadClients = loadClients;
    window.loadVendeurs = loadVendeurs;
    window.displayClientInfo = displayClientInfo;
    window.selectClient = selectClient;
    
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
    
    // Charger les clients en premier
    loadClients().then(() => {
        // Une fois les clients chargés, configurer le reste
        setupVendeurEventListeners();
        AddClient();
        
        setupModifyClient();
        addModifyClientButton();
        addDeleteClientButton();
    });
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
            return [];
        }
        
        const data = await response.json();
        if (data.success && data.clients){
            displayClients(data.clients);
            return data.clients;
        }
        return [];
    } catch (error) {
        console.error('Erreur chargement clients:', error);
        return [];
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
    
    // Vider le container efficacement
    container.innerHTML = '';
    
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
        typeDiv.textContent = client.SORCIER != null ? '🧙 Sorcier' : '🏠 Moldu';
        
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
    const sorcierDetails = document.getElementById('sorcierDetails');
    const molduDetails = document.getElementById('molduDetails');
    
    if (!clientInfo || !noClientSelected) return;
    
    clientInfo.classList.remove('hidden');
    noClientSelected.classList.add('hidden');
    
    // Informations générales
    const nomElem = document.getElementById('clientNom');
    const prenomElem = document.getElementById('clientPrenom');
    const birthDateElem = document.getElementById('clientBirthDate');
    const typeElem = document.getElementById('clientType');
    const moneyElem = document.getElementById('clientMoney');
    
    if (nomElem) nomElem.textContent = client.name || '';
    if (prenomElem) prenomElem.textContent = client.surname || '';
    if (birthDateElem) birthDateElem.textContent = client.birth_date || 'Non renseigné';
    if (typeElem) typeElem.innerHTML = client.SORCIER != null ? '🧙 Sorcier' : '🏠 Moldu';
    if (moneyElem) moneyElem.textContent = client.money ? parseFloat(client.money).toFixed(2) : '0.00';
    
    // Afficher les détails spécifiques
    if (client.SORCIER != null && sorcierDetails && molduDetails) {
        sorcierDetails.style.display = 'block';
        molduDetails.style.display = 'none';
        
        const emailElem = document.getElementById('clientEmail');
        const adresseElem = document.getElementById('clientAdresse');
        const registryElem = document.getElementById('sorcierRegistry');
        const chimneyElem = document.getElementById('sorcierChimney');
        const schoolElem = document.getElementById('sorcierSchool');
        const houseElem = document.getElementById('sorcierHouse');
        const countryElem = document.getElementById('sorcierCountry');
        const licenceElem = document.getElementById('sorcierFlightLicence');
        const telephoneElem = document.getElementById('clientTelephone');
        
        if (emailElem) emailElem.textContent = client.sorcier?.Chimney || 'Non renseigné';
        if (adresseElem) adresseElem.textContent = `${client.sorcier?.Add_House || ''}, ${client.sorcier?.Add_School_name || ''}, ${client.sorcier?.Add_Country || ''}`;
        if (registryElem) registryElem.textContent = client.sorcier?.Wizard_registry_number || 'Non renseigné';
        if (chimneyElem) chimneyElem.textContent = client.sorcier?.Chimney || 'Non renseigné';
        if (schoolElem) schoolElem.textContent = client.sorcier?.Add_School_name || 'Non renseigné';
        if (houseElem) houseElem.textContent = client.sorcier?.Add_House || 'Non renseigné';
        if (countryElem) countryElem.textContent = client.sorcier?.Add_Country || 'Non renseigné';
        if (licenceElem) licenceElem.textContent = client.sorcier?.Flight_licence || '0';
        
        const owls = client.sorcier?.owls || [];
        if (telephoneElem) telephoneElem.textContent = owls.length > 0 ? owls.join(', ') : 'Aucun';
        
    } else if (client.MOLDU != null && sorcierDetails && molduDetails) {
        sorcierDetails.style.display = 'none';
        molduDetails.style.display = 'block';
        
        const emailElem = document.getElementById('clientEmail');
        const adresseElem = document.getElementById('clientAdresse');
        const registerElem = document.getElementById('molduNationalRegister');
        const streetElem = document.getElementById('molduStreet');
        const cityElem = document.getElementById('molduCity');
        const houseNumElem = document.getElementById('molduHouseNumber');
        const countryElem = document.getElementById('molduCountry');
        const telephoneElem = document.getElementById('clientTelephone');
        
        if (emailElem) emailElem.textContent = client.moldu?.Mail || 'Non renseigné';
        if (adresseElem) adresseElem.textContent = `${client.moldu?.Add_House_number || ''} ${client.moldu?.Add_Street || ''}, ${client.moldu?.Add_City || ''}, ${client.moldu?.Add_Country || ''}`;
        if (registerElem) registerElem.textContent = client.moldu?.National_register_number || 'Non renseigné';
        if (streetElem) streetElem.textContent = client.moldu?.Add_Street || 'Non renseigné';
        if (cityElem) cityElem.textContent = client.moldu?.Add_City || 'Non renseigné';
        if (houseNumElem) houseNumElem.textContent = client.moldu?.Add_House_number || 'Non renseigné';
        if (countryElem) countryElem.textContent = client.moldu?.Add_Country || 'Non renseigné';

        const telephones = client.telephones || [];
        if (telephoneElem) telephoneElem.textContent = telephones.length > 0 ? telephones.join(', ') : 'Non renseigné';
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
                await showClientOrders();
            } else {
                alert('Veuillez d\'abord sélectionner un client');
            }
        });
    }
    
    const viewlocationsBtn = document.getElementById('viewlocationsBtn');
    if (viewlocationsBtn) {
        viewlocationsBtn.addEventListener('click', async () => {
            if (currentClient) {
                await showClientlocations();
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
    
    container.innerHTML = '';
    
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
        statusDiv.textContent = vendeur.actif == "1" ? '🟢 Actif' : '🔴 Inactif';
        
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
    
    const nomElem = document.getElementById('vendeurNom');
    const prenomElem = document.getElementById('vendeurPrenom');
    const emailElem = document.getElementById('vendeurEmail');
    const loginElem = document.getElementById('vendeurLogin');
    const telephoneElem = document.getElementById('vendeurTelephone');
    const actifElem = document.getElementById('vendeurActif');
    
    if (nomElem) nomElem.textContent = vendeur.name || '';
    if (prenomElem) prenomElem.textContent = vendeur.surname || '';
    if (emailElem) emailElem.textContent = vendeur.mail_pro || '';
    if (loginElem) loginElem.textContent = vendeur.login || '';
    
    // Récupérer les téléphones
    const phones = [vendeur.tel1, vendeur.tel2, vendeur.tel3].filter(t => t);
    if (telephoneElem) telephoneElem.textContent = phones.length > 0 ? phones.join(', ') : 'Non renseigné';
    
    if (actifElem) {
        actifElem.innerHTML = vendeur.actif ? '<span style="color: green;">🟢 Actif</span>' : '<span style="color: red;">🔴 Inactif</span>';
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
    
    const viewVendeurOrdersBtn = document.getElementById('viewVendeurOrdersBtn');
    if (viewVendeurOrdersBtn) {
        viewVendeurOrdersBtn.addEventListener('click', async () => {
            if (currentVendeur) {
                await showVendeurOrders();
            } else {
                alert('Veuillez d\'abord sélectionner un vendeur');
            }
        });
    }
    
    const viewVendeurlocationsBtn = document.getElementById('viewVendeurlocationsBtn');
    if (viewVendeurlocationsBtn) {
        viewVendeurlocationsBtn.addEventListener('click', async () => {
            if (currentVendeur) {
                await showVendeurlocations();
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

    AddVendeur();
    setupModifyVendeur();
    addModifyVendeurButton();

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