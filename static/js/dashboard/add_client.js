export function AddClient() {
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
            const response = await fetch('/api/register/client', {
                credentials: "include",
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