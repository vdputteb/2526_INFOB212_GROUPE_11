export async function showVendeurOrders(vendeurId) {
    try {
        const response = await fetch(`/api/ventes/vendeur`, {
            credentials: "include",
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        
        if (!response.ok) {
            console.error('Erreur chargement ventes:', response.status);
            alert('Erreur lors du chargement des ventes');
            return;
        }
        
        const ventes = await response.json();
        
        const modal = document.getElementById('ordersModal');
        const container = document.getElementById('ordersList');
        const modalTitle = document.getElementById('ordersModalTitle');
        
        if (modalTitle) {
            modalTitle.textContent = `📦 ventes du vendeur`;
        }
        
        if (!container) return;
        
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (!ventes || ventes.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune commande pour ce vendeur.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '40px';
            emptyMessage.style.color = '#6c757d';
            container.appendChild(emptyMessage);
        } else {
            ventes.forEach(cmd => {
                const orderCard = document.createElement('div');
                orderCard.className = 'order-card';
                
                const orderHeader = document.createElement('div');
                orderHeader.className = 'order-header';
                
                const orderIdStrong = document.createElement('strong');
                orderIdStrong.textContent = `Commande #${cmd.id_commande}`;
                
                const clientInfo = document.createElement('span');
                clientInfo.className = 'client-info';
                clientInfo.style.fontSize = '12px';
                clientInfo.style.color = '#6c757d';
                clientInfo.style.marginLeft = '10px';
                clientInfo.textContent = `${cmd.client_name || ''} ${cmd.client_surname || ''}`;
                
                orderHeader.appendChild(orderIdStrong);
                orderHeader.appendChild(clientInfo);
                
                orderCard.appendChild(orderHeader);
                
                // Détails de la vente
                const saleDetails = document.createElement('div');
                saleDetails.className = 'order-details';
                saleDetails.style.marginTop = '10px';
                saleDetails.style.paddingTop = '10px';
                saleDetails.style.borderTop = '1px solid #e9ecef';
                
                // Informations sur le balai
                if (cmd.broom_name) {
                    const broomInfo = document.createElement('div');
                    const broomStrong = document.createElement('strong');
                    broomStrong.textContent = 'Balai: ';
                    broomInfo.appendChild(broomStrong);
                    broomInfo.appendChild(document.createTextNode(cmd.broom_name));
                    saleDetails.appendChild(broomInfo);
                }
                
                // Informations sur la vente
                if (cmd.quantity !== undefined) {
                    const quantityInfo = document.createElement('div');
                    const quantityStrong = document.createElement('strong');
                    quantityStrong.textContent = 'Quantité: ';
                    quantityInfo.appendChild(quantityStrong);
                    quantityInfo.appendChild(document.createTextNode(cmd.quantity));
                    saleDetails.appendChild(quantityInfo);
                }
                
                if (cmd.total_price !== undefined) {
                    const priceInfo = document.createElement('div');
                    priceInfo.style.fontWeight = 'bold';
                    priceInfo.style.color = '#28a745';
                    priceInfo.style.marginTop = '5px';
                    
                    const priceStrong = document.createElement('strong');
                    priceStrong.textContent = 'Prix total: ';
                    priceInfo.appendChild(priceStrong);
                    priceInfo.appendChild(document.createTextNode(`${cmd.total_price} €`));
                    saleDetails.appendChild(priceInfo);
                }
                
                // Date de commande
                if (cmd.command_date) {
                    const dateInfo = document.createElement('div');
                    dateInfo.style.fontSize = '12px';
                    dateInfo.style.color = '#6c757d';
                    dateInfo.style.marginTop = '5px';
                    
                    const dateStrong = document.createElement('strong');
                    dateStrong.textContent = 'Date: ';
                    dateInfo.appendChild(dateStrong);
                    dateInfo.appendChild(document.createTextNode(new Date(cmd.command_date).toLocaleDateString()));
                    saleDetails.appendChild(dateInfo);
                }
                
                orderCard.appendChild(saleDetails);
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
        console.error('Erreur chargement ventes:', error);
        alert('Erreur lors du chargement des ventes');
    }
}