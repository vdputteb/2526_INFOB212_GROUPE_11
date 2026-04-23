export async function showClientOrders() {
    try {
        const response = await fetch("/api/commandes/client", {
            credentials: "include",
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        
        if (!response.ok) {
            console.error('Erreur chargement commandes:', response.status);
            alert('Erreur lors du chargement des commandes');
            return;
        }
        
        const commandes = await response.json();
        
        const modal = document.getElementById('ordersModal');
        const container = document.getElementById('ordersList');
        const modalTitle = document.getElementById('ordersModalTitle');
        
        if (modalTitle) {
            modalTitle.textContent = `📦 Commandes du client`;
        }
        
        if (!container) return;
        
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (!commandes || commandes.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune commande pour ce client.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '40px';
            emptyMessage.style.color = '#6c757d';
            container.appendChild(emptyMessage);
        } else {
            commandes.forEach(cmd => {
                const orderCard = document.createElement('div');
                orderCard.className = 'order-card';
                
                const orderHeader = document.createElement('div');
                orderHeader.className = 'order-header';
                
                const orderIdStrong = document.createElement('strong');
                orderIdStrong.textContent = `Commande #${cmd.id_commande}`;
                
                const orderDate = document.createElement('span');
                orderDate.className = 'order-date';
                orderDate.textContent = cmd.sale_date ? new Date(cmd.sale_date).toLocaleDateString() : 
                                       (cmd.command_date ? new Date(cmd.command_date).toLocaleDateString() : 'Date inconnue');
                
                orderHeader.appendChild(orderIdStrong);
                orderHeader.appendChild(orderDate);
                
                orderCard.appendChild(orderHeader);
                
                // Ajouter les détails des balais si disponibles
                if (cmd.broom_name) {
                    const broomInfo = document.createElement('div');
                    broomInfo.className = 'order-items';
                    broomInfo.style.marginTop = '10px';
                    broomInfo.style.paddingTop = '10px';
                    broomInfo.style.borderTop = '1px solid #e9ecef';
                    broomInfo.innerHTML = `<strong>Balai:</strong> ${cmd.broom_name}`;
                    orderCard.appendChild(broomInfo);
                }
                
                container.appendChild(orderCard);
            });
        }
        
        if (modal) modal.style.display = 'flex';
        
        const closeModal = modal?.querySelector('.close-modal');
        if (closeModal) {
            closeModal.onclick = () => modal.style.display = 'none';
        }
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
        alert('Erreur lors du chargement des commandes');
    }
}