export async function showClientReservations() {
    try {
        const response = await fetch("/api/reservations/client", {
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
            modalTitle.textContent = `📅 Locations du client`;
        }
        
        if (!container) return;
        
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (!reservations || reservations.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune location pour ce client.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '40px';
            emptyMessage.style.color = '#6c757d';
            container.appendChild(emptyMessage);
        } else {
            const catalogueRes = await fetch('/api/catalogue');
            const catalogue = await catalogueRes.json();
            
            reservations.forEach(res => {
                const broom = catalogue.find(b => b.id_balai === res.id_balai);
                
                const reservationCard = document.createElement('div');
                reservationCard.className = 'reservation-card';
                
                const reservationHeader = document.createElement('div');
                reservationHeader.className = 'reservation-header';
                
                const broomStrong = document.createElement('strong');
                broomStrong.textContent = broom?.Libelle || broom?.libelle || `Balai #${res.id_balai}`;
                
                const reservationDates = document.createElement('span');
                reservationDates.className = 'reservation-dates';
                reservationDates.textContent = `${res.begin_date} → ${res.end_date}`;
                
                reservationHeader.appendChild(broomStrong);
                reservationHeader.appendChild(reservationDates);
                
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
                    reservationStatus.textContent = 'En attente';
                } else if (status === 'Confirmed') {
                    reservationStatus.style.backgroundColor = '#27ae60';
                    reservationStatus.textContent = 'Confirmée';
                } else if (status === 'Finished') {
                    reservationStatus.style.backgroundColor = '#95a5a6';
                    reservationStatus.textContent = 'Terminée';
                } else {
                    reservationStatus.style.backgroundColor = '#3498db';
                    reservationStatus.textContent = `📌 ${status}`;
                }
                
                reservationCard.appendChild(reservationHeader);
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