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
    
    // Type de client (non modifiable)
    const typeGroup = document.createElement('div');
    typeGroup.className = 'form-group';
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Type de client';
    const typeDisplay = document.createElement('p');
    typeDisplay.id = 'modifyClientTypeDisplay';
    typeDisplay.style.padding = '12px';
    typeDisplay.style.background = '#f8f9fa';
    typeDisplay.style.borderRadius = '10px';
    typeGroup.appendChild(typeLabel);
    typeGroup.appendChild(typeDisplay);
    
    form.appendChild(nomGroup);
    form.appendChild(prenomGroup);
    form.appendChild(typeGroup);
    
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
    document.getElementById('modifyClientPrenom').value = client.surname || '';
    document.getElementById('modifyClientTypeDisplay').textContent = client.type_client === 'sorcier' ? '🧙 Sorcier' : '🏠 Moldu';
    
    window.currentClientForModify = client;
    
    const form = document.getElementById('modifyClientForm');
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await modifyClient(window.currentClientForModify.id_client);
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
        id_client: clientId,
        name: document.getElementById('modifyClientNom').value,
        surname: document.getElementById('modifyClientPrenom').value
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
                
                if (window.currentClient && window.currentClient.id_client === clientId) {
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
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le client ${client.surname} ${client.name} ?\n\nCette action est irréversible et supprimera toutes ses commandes et réservations.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/delete/client/?client_id=${client.id_client}`, {
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