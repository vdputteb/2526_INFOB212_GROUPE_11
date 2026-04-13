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
        
        // Vider le conteneur
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (reservations.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune location pour ce client.';
            container.appendChild(emptyMessage);
        } else {
            // Récupérer les noms des balais
            const catalogueRes = await fetch('/api/catalogue');
            const catalogue = await catalogueRes.json();
            
            reservations.forEach(res => {
                const broom = catalogue.find(b => b.id === res.broomId);
                
                const reservationCard = document.createElement('div');
                reservationCard.className = 'reservation-card';
                
                const reservationHeader = document.createElement('div');
                reservationHeader.className = 'reservation-header';
                
                const broomStrong = document.createElement('strong');
                broomStrong.textContent = broom?.libelle || `Balai #${res.broomId}`;
                
                const reservationDates = document.createElement('span');
                reservationDates.className = 'reservation-dates';
                reservationDates.textContent = `${res.startDate} → ${res.endDate}`;
                
                reservationHeader.appendChild(broomStrong);
                reservationHeader.appendChild(reservationDates);
                
                const reservationId = document.createElement('div');
                reservationId.className = 'reservation-id';
                reservationId.textContent = `Réservation #${res.id}`;
                
                reservationCard.appendChild(reservationHeader);
                reservationCard.appendChild(reservationId);
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
