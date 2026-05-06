export async function showClientOrders() {
    try {
        const response = await fetch("/api/ventes/client", {
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
        
        let ventes = await response.json();
        
        // Regrouper les ventes par id_commande
        const ventesMap = new Map();
        
        for (const vente of ventes) {
            const commandeId = vente.id_commande;
            
            if (!ventesMap.has(commandeId)) {
                // Première occurrence de cette commande
                ventesMap.set(commandeId, {
                    id_commande: vente.id_commande,
                    sale_date: vente.sale_date || vente.command_date,
                    client_name: vente.client_name,
                    client_surname: vente.client_surname,
                    items: [],
                    total_amount: 0
                });
            }
            
            // Ajouter le balai à la commande
            const commande = ventesMap.get(commandeId);
            commande.items.push({
                broom_name: vente.broom_name,
                sale_price: parseFloat(vente.sale_price || 0),
                id_balai: vente.id_balai
            });
            commande.total_amount += parseFloat(vente.sale_price || 0);
        }
        
        // Convertir la Map en tableau et trier par date (plus récent d'abord)
        let groupedVentes = Array.from(ventesMap.values());
        groupedVentes.sort((a, b) => {
            const dateA = new Date(a.sale_date);
            const dateB = new Date(b.sale_date);
            return dateB - dateA;
        });
        
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
        
        if (!groupedVentes || groupedVentes.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune commande pour ce client.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '40px';
            emptyMessage.style.color = '#6c757d';
            container.appendChild(emptyMessage);
        } else {
            for (const cmd of groupedVentes) {
                const orderCard = document.createElement('div');
                orderCard.className = 'order-card';
                orderCard.style.border = '1px solid #e0e0e0';
                orderCard.style.borderRadius = '8px';
                orderCard.style.padding = '15px';
                orderCard.style.marginBottom = '10px';
                orderCard.style.backgroundColor = '#fff';
                orderCard.style.position = 'relative';
                
                const orderHeader = document.createElement('div');
                orderHeader.className = 'order-header';
                orderHeader.style.display = 'flex';
                orderHeader.style.justifyContent = 'space-between';
                orderHeader.style.alignItems = 'center';
                orderHeader.style.flexWrap = 'wrap';
                orderHeader.style.gap = '10px';
                
                const orderIdStrong = document.createElement('strong');
                orderIdStrong.style.fontSize = '16px';
                orderIdStrong.textContent = `Commande #${cmd.id_commande}`;
                
                const orderDate = document.createElement('span');
                orderDate.className = 'order-date';
                orderDate.style.fontSize = '14px';
                orderDate.style.color = '#666';
                if (cmd.sale_date) {
                    const dateObj = new Date(cmd.sale_date);
                    orderDate.textContent = dateObj.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                } else {
                    orderDate.textContent = 'Date inconnue';
                }
                
                orderHeader.appendChild(orderIdStrong);
                orderHeader.appendChild(orderDate);
                
                orderCard.appendChild(orderHeader);
                
                // Afficher les balais achetés
                if (cmd.items && cmd.items.length > 0) {
                    const itemsContainer = document.createElement('div');
                    itemsContainer.style.marginTop = '10px';
                    itemsContainer.style.paddingTop = '10px';
                    itemsContainer.style.borderTop = '1px solid #e9ecef';
                    
                    const itemsTitle = document.createElement('strong');
                    itemsTitle.textContent = 'Balais achetés:';
                    itemsTitle.style.display = 'block';
                    itemsTitle.style.marginBottom = '8px';
                    itemsContainer.appendChild(itemsTitle);
                    
                    for (const item of cmd.items) {
                        const itemDiv = document.createElement('div');
                        itemDiv.style.display = 'flex';
                        itemDiv.style.justifyContent = 'space-between';
                        itemDiv.style.marginBottom = '5px';
                        itemDiv.style.fontSize = '14px';
                        
                        const itemName = document.createElement('span');
                        itemName.textContent = `• ${item.broom_name || `Balai #${item.id_balai}`}`;
                        
                        const itemPrice = document.createElement('span');
                        itemPrice.textContent = `${item.sale_price.toFixed(2)} €`;
                        itemPrice.style.fontWeight = 'bold';
                        itemPrice.style.color = '#27ae60';
                        
                        itemDiv.appendChild(itemName);
                        itemDiv.appendChild(itemPrice);
                        itemsContainer.appendChild(itemDiv);
                    }
                    
                    // Afficher le total
                    const totalDiv = document.createElement('div');
                    totalDiv.style.marginTop = '10px';
                    totalDiv.style.paddingTop = '5px';
                    totalDiv.style.borderTop = '1px solid #e9ecef';
                    totalDiv.style.textAlign = 'right';
                    totalDiv.style.fontWeight = 'bold';
                    totalDiv.style.fontSize = '14px';
                    totalDiv.innerHTML = `Total: ${cmd.total_amount.toFixed(2)} €`;
                    itemsContainer.appendChild(totalDiv);
                    
                    orderCard.appendChild(itemsContainer);
                }
                
                // Ajouter le bouton de suppression
                const buttonContainer = document.createElement('div');
                buttonContainer.style.marginTop = '15px';
                buttonContainer.style.display = 'flex';
                buttonContainer.style.justifyContent = 'flex-end';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '🗑️ Supprimer la commande';
                deleteBtn.style.backgroundColor = '#e74c3c';
                deleteBtn.style.color = 'white';
                deleteBtn.style.border = 'none';
                deleteBtn.style.padding = '8px 16px';
                deleteBtn.style.borderRadius = '5px';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.fontSize = '14px';
                deleteBtn.style.transition = 'background-color 0.2s';
                
                deleteBtn.onmouseover = () => deleteBtn.style.backgroundColor = '#c0392b';
                deleteBtn.onmouseout = () => deleteBtn.style.backgroundColor = '#e74c3c';
                
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm(`Êtes-vous sûr de vouloir supprimer la commande #${cmd.id_commande} ?\nCette action est irréversible et le client sera remboursé.`)) {
                        await deleteOrder(cmd.id_commande, orderCard);
                    }
                });
                
                buttonContainer.appendChild(deleteBtn);
                orderCard.appendChild(buttonContainer);
                
                container.appendChild(orderCard);
            }
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

// Fonction pour supprimer une commande
async function deleteOrder(orderId, cardElement) {
    try {
        const response = await fetch(`/api/ventes/${orderId}`, {
            credentials: "include",
            method: 'DELETE'
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(result.message || 'Commande supprimée avec succès et client remboursé');
            // Retirer la carte de l'affichage
            if (cardElement && cardElement.parentNode) {
                cardElement.remove();
            }
            // Recharger la liste si nécessaire
            await showClientOrders();
        } else {
            const error = await response.json();
            alert(`Erreur: ${error.detail || 'Impossible de supprimer la commande'}`);
        }
    } catch (error) {
        console.error('Erreur suppression commande:', error);
        alert('Erreur réseau lors de la suppression');
    }
}