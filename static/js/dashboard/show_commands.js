export async function showOrders(clientId) {
    try {
        const response = await fetch("/api/commandes/client", {
            credentials: "include",
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        const commandes = await response.json();
        
        const modal = document.getElementById('ordersModal');
        const container = document.getElementById('ordersList');
        
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (commandes.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune commande pour ce client.';
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
                orderDate.textContent = new Date(cmd.command_date).toLocaleDateString();
                
                const orderType = document.createElement('span');
                orderType.className = 'order-status';
                orderType.textContent = cmd.type_commande === 'vente' ? '💰 Vente' : '📅 Location';
                
                orderHeader.appendChild(orderIdStrong);
                orderHeader.appendChild(orderDate);
                orderHeader.appendChild(orderType);
                
                orderCard.appendChild(orderHeader);
                container.appendChild(orderCard);
            });
        }
        
        modal.style.display = 'flex';
        
        modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
    }
}