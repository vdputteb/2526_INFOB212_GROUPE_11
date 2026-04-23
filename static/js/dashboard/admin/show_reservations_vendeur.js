export async function showVendeurReservations(vendeurId) {
    try {
        const response = await fetch(`/api/reservations/vendeur`, {
            credentials: "include",
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        
        if (!response.ok) {
            console.error('Erreur chargement locations:', response.status);
            alert('Erreur lors du chargement des locations');
            return;
        }
        
        const reservations = await response.json();
        
        const modal = document.getElementById('reservationsModal');
        const container = document.getElementById('reservationsList');
        const modalTitle = document.getElementById('reservationsModalTitle');
        
        if (modalTitle) {
            modalTitle.textContent = `📅 Locations du vendeur`;
        }
        
        if (!container) return;
        
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (!reservations || reservations.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune location pour ce vendeur.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '40px';
            emptyMessage.style.color = '#6c757d';
            container.appendChild(emptyMessage);
        } else {
            reservations.forEach(res => {
                const reservationCard = document.createElement('div');
                reservationCard.className = 'reservation-card';
                
                const reservationHeader = document.createElement('div');
                reservationHeader.className = 'reservation-header';
                
                // Informations du balai
                const broomName = res.broom_name || `Balai #${res.id_balai}`;
                const broomStrong = document.createElement('strong');
                broomStrong.textContent = broomName;
                
                // Informations du client
                const clientInfo = document.createElement('span');
                clientInfo.className = 'client-info';
                clientInfo.style.fontSize = '12px';
                clientInfo.style.color = '#6c757d';
                clientInfo.style.marginLeft = '10px';
                clientInfo.textContent = `Client: ${res.client_name || ''} ${res.client_surname || ''}`;
                
                reservationHeader.appendChild(broomStrong);
                reservationHeader.appendChild(clientInfo);
                
                // Dates de location
                const reservationDates = document.createElement('div');
                reservationDates.className = 'reservation-dates';
                reservationDates.style.marginTop = '8px';
                reservationDates.style.fontSize = '14px';
                
                const dateStrong = document.createElement('strong');
                dateStrong.textContent = 'Période: ';
                reservationDates.appendChild(dateStrong);
                reservationDates.appendChild(document.createTextNode(`${res.begin_date || 'N/A'} → ${res.end_date || 'N/A'}`));
                
                // Statut de la location
                const reservationStatus = document.createElement('div');
                reservationStatus.className = 'reservation-status';
                reservationStatus.style.marginTop = '10px';
                reservationStatus.style.fontSize = '14px';
                reservationStatus.style.padding = '4px 12px';
                reservationStatus.style.borderRadius = '20px';
                reservationStatus.style.display = 'inline-block';
                
                const status = res.status || 'En cours';
                if (status === 'Pending') {
                    reservationStatus.style.backgroundColor = '#f39c12';
                    reservationStatus.textContent = '⏳ En attente';
                } else if (status === 'Confirmed') {
                    reservationStatus.style.backgroundColor = '#27ae60';
                    reservationStatus.textContent = ' Confirmée';
                } else if (status === 'Finished') {
                    reservationStatus.style.backgroundColor = '#95a5a6';
                    reservationStatus.textContent = ' Terminée';
                } else if (status === 'Cancelled') {
                    reservationStatus.style.backgroundColor = '#e74c3c';
                    reservationStatus.textContent = ' Annulée';
                } else {
                    reservationStatus.style.backgroundColor = '#3498db';
                    reservationStatus.textContent = `📌 ${status}`;
                }
                
                // Numéro de commande
                const commandeInfo = document.createElement('div');
                commandeInfo.style.marginTop = '8px';
                commandeInfo.style.fontSize = '12px';
                commandeInfo.style.color = '#6c757d';
                
                const commandeStrong = document.createElement('strong');
                commandeStrong.textContent = `Commande #${res.id_commande}`;
                commandeInfo.appendChild(commandeStrong);
                
                reservationCard.appendChild(reservationHeader);
                reservationCard.appendChild(reservationDates);
                reservationCard.appendChild(commandeInfo);
                reservationCard.appendChild(reservationStatus);
                
                container.appendChild(reservationCard);
            });
        }
        
        if (modal) modal.style.display = 'flex';
        
        const closeModal = modal?.querySelector('.close-modal');
        if (closeModal) {
            closeModal.onclick = () => modal.style.display = 'none';
        }
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    } catch (error) {
        console.error('Erreur chargement locations:', error);
        alert('Erreur lors du chargement des locations');
    }
}