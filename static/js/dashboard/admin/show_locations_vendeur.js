// admin/show_locations_vendeur.js
export async function showVendeurlocations() {
    try {
        const response = await fetch("/api/locations/vendeur", {
            credentials: "include",
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        
        if (!response.ok) {
            console.error('Erreur chargement locations:', response.status);
            alert('Erreur lors du chargement des locations du vendeur');
            return;
        }
        
        const locations = await response.json();
        
        const modal = document.getElementById('locationsModal');
        const container = document.getElementById('locationsList');
        const modalTitle = document.getElementById('locationsModalTitle');
        
        if (modalTitle) {
            modalTitle.textContent = `📅 Locations gérées par le vendeur`;
        }
        
        if (!container) return;
        
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (!locations || locations.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune location gérée par ce vendeur.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '40px';
            emptyMessage.style.color = '#6c757d';
            container.appendChild(emptyMessage);
        } else {
            locations.forEach(res => {
                const reservationCard = document.createElement('div');
                reservationCard.className = 'reservation-card';
                
                const reservationHeader = document.createElement('div');
                reservationHeader.className = 'reservation-header';
                
                const broomStrong = document.createElement('strong');
                broomStrong.textContent = res.broom_name || `Balai #${res.id_balai}`;
                
                const reservationDates = document.createElement('span');
                reservationDates.className = 'reservation-dates';
                
                const startDate = formatDate(res.begin_date);
                const endDate = formatDate(res.end_date);
                
                reservationDates.innerHTML = `
                    <div>📅 Période: ${startDate} → ${endDate}</div>
                    <div style="font-size: 12px; margin-top: 4px;">
                        ⏱️ Durée: ${calculateDuration(res.begin_date, res.end_date)} jours
                    </div>
                `;
                
                reservationHeader.appendChild(broomStrong);
                reservationHeader.appendChild(reservationDates);
                
                // Info client
                const clientInfo = document.createElement('div');
                clientInfo.className = 'reservation-client';
                clientInfo.style.marginTop = '8px';
                clientInfo.style.fontSize = '13px';
                clientInfo.style.color = '#2c3e50';
                clientInfo.innerHTML = `👤 Client: ${res.client_name || ''} ${res.client_surname || ''}`;
                
                const locationstatus = document.createElement('div');
                locationstatus.className = 'reservation-status';
                locationstatus.style.marginTop = '10px';
                locationstatus.style.fontSize = '14px';
                locationstatus.style.padding = '4px 12px';
                locationstatus.style.borderRadius = '20px';
                locationstatus.style.display = 'inline-block';
                
                const status = res.status || 'En cours';
                if (status === 'Pending') {
                    locationstatus.style.backgroundColor = '#f39c12';
                    locationstatus.textContent = '⏳ En attente';
                } else if (status === 'Confirmed') {
                    if (res.actual_end_date) {
                        locationstatus.style.backgroundColor = '#27ae60';
                        locationstatus.textContent = ' Retourné le ' + formatDate(res.actual_end_date);
                    } else if (new Date(res.end_date) < new Date()) {
                        locationstatus.style.backgroundColor = '#e74c3c';
                        locationstatus.textContent = '⚠️ En retard (retour non validé)';
                    } else {
                        locationstatus.style.backgroundColor = '#27ae60';
                        locationstatus.textContent = '📌 En cours';
                    }
                } else if (status === 'Finished') {
                    locationstatus.style.backgroundColor = '#95a5a6';
                    locationstatus.textContent = '🏁 Terminée';
                } else {
                    locationstatus.style.backgroundColor = '#3498db';
                    locationstatus.textContent = `📌 ${status}`;
                }
                
                reservationCard.appendChild(reservationHeader);
                reservationCard.appendChild(clientInfo);
                reservationCard.appendChild(locationstatus);
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

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('fr-FR');
}

function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}