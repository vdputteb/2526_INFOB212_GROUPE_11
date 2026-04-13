
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
        
        // Vider le conteneur
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
                orderIdStrong.textContent = `Commande #${cmd.id}`;
                
                const orderDate = document.createElement('span');
                orderDate.className = 'order-date';
                orderDate.textContent = new Date(cmd.date_commande).toLocaleDateString();
                
                const orderStatus = document.createElement('span');
                orderStatus.className = 'order-status';
                orderStatus.textContent = cmd.statut;
                
                orderHeader.appendChild(orderIdStrong);
                orderHeader.appendChild(orderDate);
                orderHeader.appendChild(orderStatus);
                
                const orderTotal = document.createElement('div');
                orderTotal.className = 'order-total';
                orderTotal.textContent = `Total : ${cmd.total.toFixed(2)} €`;
                
                const orderItems = document.createElement('div');
                orderItems.className = 'order-items';
                
                cmd.articles.forEach(article => {
                    const orderItem = document.createElement('div');
                    orderItem.className = 'order-item';
                    orderItem.textContent = `${article.name} x ${article.quantity} - ${article.total.toFixed(2)}€`;
                    
                    if (article.rental_dates) {
                        const small = document.createElement('small');
                        small.textContent = ` (${article.rental_dates})`;
                        orderItem.appendChild(small);
                    }
                    
                    orderItems.appendChild(orderItem);
                });
                
                orderCard.appendChild(orderHeader);
                orderCard.appendChild(orderTotal);
                orderCard.appendChild(orderItems);
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
