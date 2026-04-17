// modify_client.js
export function setupModifyClient() {
    let currentClientForModify = null;
    
    createModifyModal();
    addModifyButton();
    addDeleteButton();
}

function createModifyModal() {
    if (document.getElementById('modifyClientModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'modifyClientModal';
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const closeSpan = document.createElement('span');
    closeSpan.className = 'close-modal';
    closeSpan.textContent = '×';
    
    const title = document.createElement('h3');
    title.textContent = '✏️ Modifier le client';
    
    const form = document.createElement('form');
    form.id = 'modifyClientForm';
    
    // Champ Nom
    const nomGroup = document.createElement('div');
    nomGroup.className = 'form-group';
    const nomLabel = document.createElement('label');
    nomLabel.textContent = 'Nom *';
    const nomInput = document.createElement('input');
    nomInput.type = 'text';
    nomInput.id = 'modifyClientNom';
    nomInput.required = true;
    nomGroup.appendChild(nomLabel);
    nomGroup.appendChild(nomInput);
    
    // Champ Prénom
    const prenomGroup = document.createElement('div');
    prenomGroup.className = 'form-group';
    const prenomLabel = document.createElement('label');
    prenomLabel.textContent = 'Prénom *';
    const prenomInput = document.createElement('input');
    prenomInput.type = 'text';
    prenomInput.id = 'modifyClientPrenom';
    prenomInput.required = true;
    prenomGroup.appendChild(prenomLabel);
    prenomGroup.appendChild(prenomInput);
    
    // Champ Email
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';
    const emailLabel = document.createElement('label');
    emailLabel.textContent = 'Email *';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'modifyClientEmail';
    emailInput.required = true;
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);
    
    // Champ Téléphone
    const phoneGroup = document.createElement('div');
    phoneGroup.className = 'form-group';
    const phoneLabel = document.createElement('label');
    phoneLabel.textContent = 'Téléphone';
    const phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.id = 'modifyClientTelephone';
    phoneGroup.appendChild(phoneLabel);
    phoneGroup.appendChild(phoneInput);
    
    // Champ Adresse
    const adresseGroup = document.createElement('div');
    adresseGroup.className = 'form-group';
    const adresseLabel = document.createElement('label');
    adresseLabel.textContent = 'Adresse';
    const adresseTextarea = document.createElement('textarea');
    adresseTextarea.id = 'modifyClientAdresse';
    adresseTextarea.rows = 2;
    adresseGroup.appendChild(adresseLabel);
    adresseGroup.appendChild(adresseTextarea);
    
    // Conteneur des boutons
    const formActions = document.createElement('div');
    formActions.className = 'form-actions';
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn-submit';
    submitBtn.textContent = 'Enregistrer';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.id = 'deleteClientBtn';
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '🗑️ Supprimer';
    
    formActions.appendChild(submitBtn);
    formActions.appendChild(deleteBtn);
    
    form.appendChild(nomGroup);
    form.appendChild(prenomGroup);
    form.appendChild(emailGroup);
    form.appendChild(phoneGroup);
    form.appendChild(adresseGroup);
    form.appendChild(formActions);
    
    modalContent.appendChild(closeSpan);
    modalContent.appendChild(title);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    closeSpan.onclick = () => modal.style.display = 'none';
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

function addModifyButton() {
    const actionsDiv = document.querySelector('.actions');
    if (actionsDiv && !document.getElementById('modifyClientBtn')) {
        const modifyBtn = document.createElement('button');
        modifyBtn.id = 'modifyClientBtn';
        modifyBtn.className = 'btn-action';
        modifyBtn.textContent = 'Modifier le client';
        modifyBtn.style.backgroundColor = '#3498db';
        modifyBtn.style.borderColor = '#3498db';
        modifyBtn.style.color = 'white';
        
        modifyBtn.addEventListener('click', () => {
            const client = window.currentClient;
            if (client) {
                openModifyModal(client);
            } else {
                alert('Veuillez d\'abord sélectionner un client');
            }
        });
        
        actionsDiv.appendChild(modifyBtn);
    }
}

function addDeleteButton() {
    const actionsDiv = document.querySelector('.actions');
    if (actionsDiv && !document.getElementById('deleteClientMainBtn')) {
        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'deleteClientMainBtn';
        deleteBtn.className = 'btn-action';
        deleteBtn.textContent = '🗑️ Supprimer le client';
        deleteBtn.style.backgroundColor = '#e74c3c';
        deleteBtn.style.borderColor = '#e74c3c';
        deleteBtn.style.color = 'white';
        
        deleteBtn.addEventListener('click', async () => {
            const client = window.currentClient;
            if (client) {
                await confirmDeleteClient(client);
            } else {
                alert('Veuillez d\'abord sélectionner un client');
            }
        });
        
        actionsDiv.appendChild(deleteBtn);
    }
}

function openModifyModal(client) {
    const modal = document.getElementById('modifyClientModal');
    
    document.getElementById('modifyClientNom').value = client.name || '';
    document.getElementById('modifyClientPrenom').value = client.prenom || '';
    document.getElementById('modifyClientEmail').value = client.email || '';
    document.getElementById('modifyClientTelephone').value = client.telephone || '';
    document.getElementById('modifyClientAdresse').value = client.adresse || '';
    
    window.currentClientForModify = client;
    
    const form = document.getElementById('modifyClientForm');
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await modifyClient(window.currentClientForModify.id);
    });
    
    const deleteBtn = document.getElementById('deleteClientBtn');
    if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        
        newDeleteBtn.addEventListener('click', async () => {
            await confirmDeleteClient(window.currentClientForModify);
            modal.style.display = 'none';
        });
    }
    
    modal.style.display = 'flex';
}

async function modifyClient(clientId) {
    const updatedClient = {
        id: clientId,  // Ajout de l'ID requis par l'API
        name: document.getElementById('modifyClientNom').value,
        prenom: document.getElementById('modifyClientPrenom').value,
        email: document.getElementById('modifyClientEmail').value,
        telephone: document.getElementById('modifyClientTelephone').value,
        adresse: document.getElementById('modifyClientAdresse').value
    };
    
    try {
        const response = await fetch(`/api/modify/client/`, {
            credentials: "include",
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedClient)
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success){
                alert(result.message || 'Client modifié avec succès !');
                document.getElementById('modifyClientModal').style.display = 'none';
                
                if (window.loadClients) {
                    await window.loadClients();
                }
                
                if (window.currentClient && window.currentClient.id === clientId) {
                    window.currentClient = { ...window.currentClient, ...updatedClient };
                    if (window.displayClientInfo) {
                        window.displayClientInfo(window.currentClient);
                    }
                }
            } else {
                throw new Error(result.detail);
            }
        } else {
            const error = await response.json();
            alert(`Erreur lors de la modification: ${error.detail || 'Erreur inconnue'}`);
        }
    } catch (error) {
        console.error('Erreur modification client:', error);
        alert('Erreur réseau lors de la modification');
    }
}

async function confirmDeleteClient(client) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le client ${client.prenom} ${client.name} ?\n\nCette action est irréversible et supprimera toutes ses commandes et réservations.`)) {
        return;
    }
    
    try {
        // Correction: L'API attend client_id comme paramètre de requête
        const response = await fetch(`/api/delete/client/?client_id=${client.id}`, {
            credentials: "include",
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const result = await response.json();
            if(result.success){
                alert(result.message || 'Client supprimé avec succès !');
                
                const modal = document.getElementById('modifyClientModal');
                if (modal) modal.style.display = 'none';
                
                const clientInfo = document.getElementById('clientInfo');
                const noClientSelected = document.getElementById('noClientSelected');
                if (clientInfo) clientInfo.classList.add('hidden');
                if (noClientSelected) noClientSelected.classList.remove('hidden');
                
                window.currentClient = null;
                
                if (window.loadClients) {
                    await window.loadClients();
                }
            } else {
                alert(result.detail);
            }
        } else {
            const error = await response.json();
            alert(`Erreur lors de la suppression: ${error.detail || 'Erreur inconnue'}`);
        }
    } catch (error) {
        console.error('Erreur suppression client:', error);
        alert('Erreur réseau lors de la suppression');
    }
}