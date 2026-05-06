export async function showClientlocations() {
    try {
        const response = await fetch("/api/locations/client", {
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
        
        let locations = await response.json();
        
        // Regrouper les locations par id_commande (une location peut avoir plusieurs balais)
        const locationsMap = new Map();
        
        for (const location of locations) {
            const commandeId = location.id_commande;
            
            if (!locationsMap.has(commandeId)) {
                // Première occurrence de cette location
                locationsMap.set(commandeId, {
                    id_commande: location.id_commande,
                    begin_date: location.begin_date,
                    end_date: location.end_date,
                    actual_end_date: location.actual_end_date,
                    status: location.status,
                    brooms: [],
                    id_balais: [] // Pour suivre les IDs uniques
                });
            }
            
            // Ajouter le balai à la location (si pas déjà ajouté)
            const locationGroup = locationsMap.get(commandeId);
            if (!locationGroup.id_balais.includes(location.id_balai)) {
                locationGroup.id_balais.push(location.id_balai);
                locationGroup.brooms.push({
                    id_balai: location.id_balai,
                    broom_name: location.broom_name,
                    Libelle: location.Libelle
                });
            }
        }
        
        // Convertir la Map en tableau et trier par date de début (plus récente d'abord)
        let groupedLocations = Array.from(locationsMap.values());
        groupedLocations.sort((a, b) => {
            const dateA = new Date(a.begin_date);
            const dateB = new Date(b.begin_date);
            return dateB - dateA;
        });
        
        const modal = document.getElementById('locationsModal');
        const container = document.getElementById('locationsList');
        const modalTitle = document.getElementById('locationsModalTitle');
        
        if (modalTitle) {
            modalTitle.textContent = `📅 Locations du client`;
        }
        
        if (!container) return;
        
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (!groupedLocations || groupedLocations.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucune location pour ce client.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '40px';
            emptyMessage.style.color = '#6c757d';
            container.appendChild(emptyMessage);
        } else {
            for (const res of groupedLocations) {
                const reservationCard = document.createElement('div');
                reservationCard.className = 'reservation-card';
                reservationCard.style.border = '1px solid #e0e0e0';
                reservationCard.style.borderRadius = '8px';
                reservationCard.style.padding = '15px';
                reservationCard.style.marginBottom = '10px';
                reservationCard.style.backgroundColor = '#fff';
                reservationCard.style.position = 'relative';
                
                const reservationHeader = document.createElement('div');
                reservationHeader.className = 'reservation-header';
                reservationHeader.style.display = 'flex';
                reservationHeader.style.justifyContent = 'space-between';
                reservationHeader.style.alignItems = 'flex-start';
                reservationHeader.style.flexWrap = 'wrap';
                reservationHeader.style.gap = '10px';
                
                // Afficher le nombre de balais
                const broomStrong = document.createElement('strong');
                broomStrong.style.fontSize = '16px';
                if (res.brooms.length === 1) {
                    broomStrong.textContent = res.brooms[0].broom_name || res.brooms[0].Libelle || `Balai #${res.brooms[0].id_balai}`;
                } else {
                    broomStrong.textContent = `${res.brooms.length} balais en location`;
                }
                
                const reservationDates = document.createElement('span');
                reservationDates.className = 'reservation-dates';
                reservationDates.style.fontSize = '14px';
                reservationDates.style.color = '#666';
                
                const startDate = formatDate(res.begin_date);
                const endDate = formatDate(res.end_date);
                const actualEndDate = res.actual_end_date ? formatDate(res.actual_end_date) : null;
                
                if (actualEndDate) {
                    const dateText = document.createTextNode(`${startDate} → ${endDate}`);
                    const returnSpan = document.createElement('span');
                    returnSpan.style.color = '#27ae60';
                    returnSpan.textContent = `  Retour effectué le: ${actualEndDate}`;
                    reservationDates.appendChild(dateText);
                    reservationDates.appendChild(document.createElement('br'));
                    reservationDates.appendChild(returnSpan);
                } else {
                    reservationDates.textContent = `${startDate} → ${endDate}`;
                }
                
                reservationHeader.appendChild(broomStrong);
                reservationHeader.appendChild(reservationDates);
                
                // Afficher la liste des balais si plusieurs
                if (res.brooms.length > 1) {
                    const broomList = document.createElement('div');
                    broomList.style.marginTop = '8px';
                    broomList.style.fontSize = '12px';
                    broomList.style.color = '#666';
                    broomList.style.paddingLeft = '10px';
                    
                    const listTitle = document.createElement('div');
                    listTitle.style.fontWeight = 'bold';
                    listTitle.style.marginBottom = '4px';
                    listTitle.textContent = 'Balais:';
                    broomList.appendChild(listTitle);
                    
                    for (const broom of res.brooms) {
                        const broomItem = document.createElement('div');
                        broomItem.textContent = `• ${broom.broom_name || broom.Libelle || `Balai #${broom.id_balai}`}`;
                        broomItem.style.marginBottom = '2px';
                        broomList.appendChild(broomItem);
                    }
                    
                    reservationCard.appendChild(broomList);
                }
                
                // Durée
                const durationInfo = document.createElement('div');
                durationInfo.style.marginTop = '8px';
                durationInfo.style.fontSize = '12px';
                durationInfo.style.color = '#6c757d';
                const duration = calculateDuration(res.begin_date, res.end_date);
                durationInfo.textContent = `⏱️ Durée: ${duration} jours`;
                
                // Status
                const statusContainer = document.createElement('div');
                statusContainer.style.marginTop = '10px';
                statusContainer.style.display = 'flex';
                statusContainer.style.justifyContent = 'space-between';
                statusContainer.style.alignItems = 'center';
                
                const locationstatus = document.createElement('span');
                locationstatus.style.fontSize = '14px';
                locationstatus.style.padding = '4px 12px';
                locationstatus.style.borderRadius = '20px';
                locationstatus.style.display = 'inline-block';
                locationstatus.style.color = '#fff';
                
                const status = res.status || 'En cours';
                let isCompleted = false;
                
                if (status === 'Pending') {
                    locationstatus.style.backgroundColor = '#f39c12';
                    locationstatus.textContent = '⏳ En attente';
                } else if (status === 'Confirmed') {
                    if (res.actual_end_date) {
                        locationstatus.style.backgroundColor = '#27ae60';
                        locationstatus.textContent = ' Retourné';
                        isCompleted = true;
                    } else if (new Date(res.end_date) < new Date()) {
                        locationstatus.style.backgroundColor = '#e74c3c';
                        locationstatus.textContent = '⚠️ En retard';
                    } else {
                        locationstatus.style.backgroundColor = '#27ae60';
                        locationstatus.textContent = '📌 En cours';
                    }
                } else if (status === 'Finished') {
                    locationstatus.style.backgroundColor = '#95a5a6';
                    locationstatus.textContent = '🏁 Terminée';
                    isCompleted = true;
                } else {
                    locationstatus.style.backgroundColor = '#3498db';
                    locationstatus.textContent = `📌 ${status}`;
                }
                
                statusContainer.appendChild(locationstatus);
                
                // Bouton de suppression (toujours visible)
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '🗑️ Supprimer';
                deleteBtn.style.backgroundColor = '#e74c3c';
                deleteBtn.style.color = 'white';
                deleteBtn.style.border = 'none';
                deleteBtn.style.padding = '6px 12px';
                deleteBtn.style.borderRadius = '5px';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.fontSize = '12px';
                deleteBtn.style.transition = 'background-color 0.2s';
                deleteBtn.title = 'Supprimer cette location';
                
                deleteBtn.onmouseover = () => deleteBtn.style.backgroundColor = '#c0392b';
                deleteBtn.onmouseout = () => deleteBtn.style.backgroundColor = '#e74c3c';
                
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const broomText = res.brooms.length === 1 ? 
                        (res.brooms[0].broom_name || res.brooms[0].Libelle || `balai #${res.brooms[0].id_balai}`) : 
                        `${res.brooms.length} balais`;
                    if (confirm(`Êtes-vous sûr de vouloir supprimer cette location pour ${broomText} ?\nCette action est irréversible.`)) {
                        await deleteLocation(res.id_commande, reservationCard);
                    }
                });
                
                statusContainer.appendChild(deleteBtn);
                
                reservationCard.appendChild(reservationHeader);
                reservationCard.appendChild(durationInfo);
                reservationCard.appendChild(statusContainer);
                
                // Bouton de validation de retour (uniquement pour les locations non terminées)
                if (!isCompleted && !res.actual_end_date && status !== 'Finished') {
                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.marginTop = '15px';
                    buttonContainer.style.paddingTop = '10px';
                    buttonContainer.style.borderTop = '1px solid #e9ecef';
                    
                    const returnBtn = document.createElement('button');
                    returnBtn.textContent = '📅 Valider le retour';
                    returnBtn.style.backgroundColor = '#3498db';
                    returnBtn.style.color = 'white';
                    returnBtn.style.border = 'none';
                    returnBtn.style.padding = '8px 16px';
                    returnBtn.style.borderRadius = '5px';
                    returnBtn.style.cursor = 'pointer';
                    returnBtn.style.fontSize = '14px';
                    returnBtn.style.transition = 'background-color 0.2s';
                    
                    returnBtn.onmouseover = () => returnBtn.style.backgroundColor = '#2980b9';
                    returnBtn.onmouseout = () => returnBtn.style.backgroundColor = '#3498db';
                    
                    const bookingData = {
                        commandeId: res.id_commande,
                        broomName: res.brooms.length === 1 ? 
                            (res.brooms[0].broom_name || res.brooms[0].Libelle || `Balai #${res.brooms[0].id_balai}`) : 
                            `${res.brooms.length} balais`,
                        beginDate: res.begin_date,
                        endDate: res.end_date
                    };
                    
                    returnBtn.addEventListener('click', () => showReturnModal(bookingData));
                    
                    buttonContainer.appendChild(returnBtn);
                    reservationCard.appendChild(buttonContainer);
                }
                
                container.appendChild(reservationCard);
            }
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

// Fonction pour afficher le modal de validation de retour
function showReturnModal(bookingData) {
    // Vérifier si le modal existe déjà, sinon le créer
    let modal = document.getElementById('validateReturnModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'validateReturnModal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.zIndex = '1000';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.backgroundColor = '#fff';
        modalContent.style.padding = '25px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.maxWidth = '500px';
        modalContent.style.width = '90%';
        modalContent.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        
        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '20px';
        
        const title = document.createElement('h3');
        title.style.margin = '0';
        title.textContent = '📅 Valider le retour';
        
        const closeSpan = document.createElement('span');
        closeSpan.textContent = '×';
        closeSpan.style.cursor = 'pointer';
        closeSpan.style.fontSize = '24px';
        closeSpan.className = 'close-return-modal';
        
        header.appendChild(title);
        header.appendChild(closeSpan);
        
        // Info box
        const infoBox = document.createElement('div');
        infoBox.id = 'returnBookingInfo';
        infoBox.style.marginBottom = '20px';
        infoBox.style.padding = '10px';
        infoBox.style.backgroundColor = '#f8f9fa';
        infoBox.style.borderRadius = '5px';
        
        // Form
        const form = document.createElement('form');
        form.id = 'returnForm';
        
        // Date group
        const dateGroup = document.createElement('div');
        dateGroup.style.marginBottom = '15px';
        dateGroup.className = 'form-group';
        
        const dateLabel = document.createElement('label');
        dateLabel.textContent = 'Date de retour réelle *';
        dateLabel.style.display = 'block';
        dateLabel.style.marginBottom = '5px';
        dateLabel.style.fontWeight = 'bold';
        
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = 'returnActualEndDate';
        dateInput.required = true;
        dateInput.style.width = '100%';
        dateInput.style.padding = '8px';
        dateInput.style.border = '1px solid #ddd';
        dateInput.style.borderRadius = '4px';
        
        dateGroup.appendChild(dateLabel);
        dateGroup.appendChild(dateInput);
        
        // Condition group
        const conditionGroup = document.createElement('div');
        conditionGroup.style.marginBottom = '20px';
        conditionGroup.className = 'form-group';
        
        const conditionLabel = document.createElement('label');
        conditionLabel.textContent = 'État du balai';
        conditionLabel.style.display = 'block';
        conditionLabel.style.marginBottom = '5px';
        conditionLabel.style.fontWeight = 'bold';
        
        const conditionSelect = document.createElement('select');
        conditionSelect.id = 'returnCondition';
        conditionSelect.style.width = '100%';
        conditionSelect.style.padding = '8px';
        conditionSelect.style.border = '1px solid #ddd';
        conditionSelect.style.borderRadius = '4px';
        
        const optionGood = document.createElement('option');
        optionGood.value = 'good';
        optionGood.textContent = '👍 Bon état';
        
        const optionDamaged = document.createElement('option');
        optionDamaged.value = 'damaged';
        optionDamaged.textContent = '⚠️ Léger dommage';
        
        const optionBroken = document.createElement('option');
        optionBroken.value = 'broken';
        optionBroken.textContent = '💥 Cassé / Endommagé';
        
        conditionSelect.appendChild(optionGood);
        conditionSelect.appendChild(optionDamaged);
        conditionSelect.appendChild(optionBroken);
        
        conditionGroup.appendChild(conditionLabel);
        conditionGroup.appendChild(conditionSelect);
        
        // Buttons container
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '10px';
        buttonsDiv.style.justifyContent = 'flex-end';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'cancel-return-btn';
        cancelBtn.textContent = 'Annuler';
        cancelBtn.style.padding = '8px 16px';
        cancelBtn.style.backgroundColor = '#6c757d';
        cancelBtn.style.color = 'white';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.cursor = 'pointer';
        
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = '✓ Valider le retour';
        submitBtn.style.padding = '8px 16px';
        submitBtn.style.backgroundColor = '#27ae60';
        submitBtn.style.color = 'white';
        submitBtn.style.border = 'none';
        submitBtn.style.borderRadius = '4px';
        submitBtn.style.cursor = 'pointer';
        
        buttonsDiv.appendChild(cancelBtn);
        buttonsDiv.appendChild(submitBtn);
        
        form.appendChild(dateGroup);
        form.appendChild(conditionGroup);
        form.appendChild(buttonsDiv);
        
        modalContent.appendChild(header);
        modalContent.appendChild(infoBox);
        modalContent.appendChild(form);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Stocker les handlers pour pouvoir les supprimer plus tard
        modal._closeHandler = () => {
            modal.style.display = 'none';
        };
        
        modal._cancelHandler = () => {
            modal.style.display = 'none';
        };
        
        modal._outsideClickHandler = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        closeSpan.onclick = modal._closeHandler;
        cancelBtn.onclick = modal._cancelHandler;
        window.addEventListener('click', modal._outsideClickHandler);
        
        // Stocker le formulaire pour l'utiliser dans submit
        modal._form = form;
        modal._dateInput = dateInput;
        modal._conditionSelect = conditionSelect;
        modal._infoBox = infoBox;
    }
    
    // Remplir les informations de la location
    const infoBox = modal._infoBox;
    const dateInput = modal._dateInput;
    
    // Vider l'infoBox
    while (infoBox.firstChild) {
        infoBox.removeChild(infoBox.firstChild);
    }
    
    // Date par défaut = aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today;
    dateInput.min = bookingData.beginDate;
    
    // Construire l'infoBox sans innerHTML
    const broomLabel = document.createElement('strong');
    broomLabel.textContent = '📍 Balai: ';
    const broomText = document.createTextNode(bookingData.broomName);
    
    const broomLine = document.createElement('div');
    broomLine.appendChild(broomLabel);
    broomLine.appendChild(broomText);
    
    const periodLabel = document.createElement('strong');
    periodLabel.textContent = '📅 Période de location: ';
    const periodText = document.createTextNode(`${formatDate(bookingData.beginDate)} → ${formatDate(bookingData.endDate)}`);
    
    const periodLine = document.createElement('div');
    periodLine.appendChild(periodLabel);
    periodLine.appendChild(periodText);
    
    const delayLabel = document.createElement('strong');
    delayLabel.textContent = '⚠️ Retard: ';
    
    const delayLine = document.createElement('div');
    delayLine.appendChild(delayLabel);
    
    const isLate = new Date(bookingData.endDate) < new Date();
    const delayStatus = document.createElement('span');
    delayStatus.textContent = isLate ? 'Oui (en retard)' : 'Non';
    delayStatus.style.color = isLate ? '#e74c3c' : '#27ae60';
    delayLine.appendChild(delayStatus);
    
    infoBox.appendChild(broomLine);
    infoBox.appendChild(periodLine);
    infoBox.appendChild(delayLine);
    
    modal.style.display = 'flex';
    
    // Supprimer l'ancien submit handler
    if (modal._submitHandler) {
        modal._form.removeEventListener('submit', modal._submitHandler);
    }
    
    // Nouveau submit handler
    modal._submitHandler = async (e) => {
        e.preventDefault();
        
        const actualEndDate = modal._dateInput.value;
        const condition = modal._conditionSelect.value;
        
        if (!actualEndDate) {
            alert('Veuillez sélectionner une date de retour');
            return;
        }
        
        if (actualEndDate < bookingData.beginDate) {
            alert('La date de retour ne peut pas être antérieure à la date de début de location');
            return;
        }
        
        try {
            const response = await fetch('/api/locations/validate-return', {
                credentials: "include",
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commandeId: parseInt(bookingData.commandeId),
                    actual_end_date: actualEndDate,
                    condition: condition
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                alert(' Retour validé avec succès !');
                modal.style.display = 'none';
                await showClientlocations();
            } else {
                alert(` Erreur: ${result.detail || result.message || 'Impossible de valider le retour'}`);
            }
        } catch (error) {
            console.error('Erreur validation retour:', error);
            alert(' Erreur réseau lors de la validation du retour');
        }
    };
    
    modal._form.addEventListener('submit', modal._submitHandler);
}

// Fonction utilitaire pour formater les dates
function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Fonction pour calculer la durée en jours
function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Fonction pour supprimer une location
async function deleteLocation(locationId, cardElement) {
    try {
        const response = await fetch(`/api/locations/${locationId}`, {
            credentials: "include",
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Location supprimée avec succès');
            // Retirer la carte de l'affichage
            if (cardElement && cardElement.parentNode) {
                cardElement.remove();
            }
            // Recharger la liste si nécessaire
            await showClientlocations();
        } else {
            const error = await response.json();
            alert(`Erreur: ${error.detail || 'Impossible de supprimer la location'}`);
        }
    } catch (error) {
        console.error('Erreur suppression location:', error);
        alert('Erreur réseau lors de la suppression');
    }
}
