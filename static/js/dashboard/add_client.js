export function AddClient() {
    const modal = document.getElementById('addClientModal');
    const showBtn = document.getElementById('showAddClientBtn');
    const closeBtn = modal?.querySelector('.close-modal');
    const form = document.getElementById('addClientForm');
    
    if (!modal || !showBtn || !closeBtn || !form) return;
    
    showBtn.addEventListener('click', () => modal.style.display = 'flex');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    
    // Supprimer les anciens event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newClient = {
            name: document.getElementById('newClientNom').value,
            prenom: document.getElementById('newClientPrenom').value,
            email: document.getElementById('newClientEmail').value,
            telephone: document.getElementById('newClientTelephone').value,
            adresse: document.getElementById('newClientAdresse').value,
            username: document.getElementById('newClientEmail').value.split('@')[0]
        };
        
        try {
            // Correction: Utiliser /api/register/clients/ au lieu de /api/register/client
            const response = await fetch('/api/register/clients/', {
                credentials: "include",
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClient)
            });
            
            if (response.ok) {
                const result = await response.json();
                modal.style.display = 'none';
                newForm.reset();
                if (window.loadClients) {
                    await window.loadClients();
                }
                alert(result.message || 'Client créé avec succès !');
            } else {
                const error = await response.json();
                alert(`Erreur lors de la création du client: ${error.detail || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.error('Erreur création client:', error);
            alert('Erreur réseau');
        }
    });
}