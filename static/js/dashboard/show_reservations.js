export async function showReservations(clientId) {
    try {
        const response = await fetch("/api/reservations/client", {
            credentials: "include",
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        const reservations = await response.json();
        
        const modal = document.getElementById('reservationsModal');
        const container = document.getElementById('reservationsList');
        
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (reservations.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune location pour ce client.';
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
                broomStrong.textContent = broom?.Libelle || `Balai #${res.id_balai}`;
                
                const reservationDates = document.createElement('span');
                reservationDates.className = 'reservation-dates';
                reservationDates.textContent = `${res.begin_date} → ${res.end_date}`;
                
                reservationHeader.appendChild(broomStrong);
                reservationHeader.appendChild(reservationDates);
                
                const reservationStatus = document.createElement('div');
                reservationStatus.className = 'reservation-id';
                reservationStatus.textContent = `Statut: ${res.status}`;
                
                reservationCard.appendChild(reservationHeader);
                reservationCard.appendChild(reservationStatus);
                container.appendChild(reservationCard);
            });
        }
        
        modal.style.display = 'flex';
        
        modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    } catch (error) {
        console.error('Erreur chargement locations:', error);
    }
}