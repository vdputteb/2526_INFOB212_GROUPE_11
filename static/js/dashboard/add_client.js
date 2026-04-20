export function AddClient() {
    const modal = document.getElementById('addClientModal');
    const showBtn = document.getElementById('showAddClientBtn');
    const closeBtn = modal?.querySelector('.close-modal');
    const form = document.getElementById('addClientForm');
    const clientTypeSelect = document.getElementById('newClientType');
    
    
    if (!modal || !showBtn || !closeBtn || !form) return;
    
    
    function toggleFields() {

        const currentSelect = document.getElementById('newClientType');
        const sorcierFields = document.getElementById('sorcierFields');
        const molduFields = document.getElementById('molduFields');

        console.log(currentSelect.value)
        if (currentSelect.value === 'sorcier') {
            // Afficher sorcier, cacher moldu
            sorcierFields.style.display = 'block';
            molduFields.style.display = 'none';
            
            // Rendre les champs sorcier requis
            document.getElementById('newClientWizardRegistry').required = true;
            document.getElementById('newClientChimney').required = true;
            document.getElementById('newClientSchoolName').required = true;
            document.getElementById('newClientHouse').required = true;
            
            // Enlever required des champs moldu
            document.getElementById('newClientNationalRegister').required = false;
            document.getElementById('newClientEmail').required = false;
            document.getElementById('newClientStreet').required = false;
            document.getElementById('newClientCity').required = false;
            document.getElementById('newClientHouseNumber').required = false;
            document.getElementById('newClientCountryMoldu').required = false;
        } else {
            console.log("other")
            // Afficher moldu, cacher sorcier
            sorcierFields.style.display = 'none';
            molduFields.style.display = 'block';
            
            // Rendre les champs moldu requis
            document.getElementById('newClientNationalRegister').required = true;
            document.getElementById('newClientEmail').required = true;
            document.getElementById('newClientStreet').required = true;
            document.getElementById('newClientCity').required = true;
            document.getElementById('newClientHouseNumber').required = true;
            document.getElementById('newClientCountryMoldu').required = true;
            
            // Enlever required des champs sorcier
            document.getElementById('newClientWizardRegistry').required = false;
            document.getElementById('newClientChimney').required = false;
            document.getElementById('newClientSchoolName').required = false;
            document.getElementById('newClientHouse').required = false;
        }
    }

    // Ouvrir le modal
    showBtn.addEventListener('click', () => {
        // Réinitialiser le formulaire
        form.reset();
        // Remettre le type par défaut (sorcier)
        clientTypeSelect.value = 'sorcier';
        // Appliquer l'affichage correct
        toggleFields();
        
        // Afficher le modal
        modal.style.display = 'flex';
    });

    clientTypeSelect.addEventListener('change', toggleFields);
    
    // Fermer le modal
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { 
        if (e.target === modal) modal.style.display = 'none'; 
    });
    
    // Supprimer les anciens event listeners du formulaire
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    const newClientTypeSelect = document.getElementById('newClientType');
    newClientTypeSelect.addEventListener('change', toggleFields);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const clientData = {
            name: document.getElementById('newClientNom').value,
            surname: document.getElementById('newClientPrenom').value,
            birth_date: document.getElementById('newClientBirthDate').value,
            money: parseFloat(document.getElementById('newClientMoney').value) || 0,
            type_client: document.getElementById('newClientType').value,
            telephones: document.getElementById('newClientTelephones').value.split(',').map(t => t.trim()).filter(t => t),
        };
        
        if (clientData.type_client === 'sorcier') {
            // Vérifier les champs sorcier
            const wizardRegistry = document.getElementById('newClientWizardRegistry').value;
            const chimney = document.getElementById('newClientChimney').value;
            const schoolName = document.getElementById('newClientSchoolName').value;
            const house = document.getElementById('newClientHouse').value;
            
            if (!wizardRegistry || !chimney || !schoolName || !house) {
                alert('Veuillez remplir tous les champs obligatoires pour un sorcier');
                return;
            }
            
            clientData.sorcier = {
                wizard_registry_number: parseInt(wizardRegistry),
                chimney: chimney,
                add_school_name: schoolName,
                add_house: house,
                add_country: document.getElementById('newClientCountry').value || 'UK',
                flight_licence: parseInt(document.getElementById('newClientFlightLicence').value) || 0,
                owls: document.getElementById('newClientOwls').value.split(',').map(o => o.trim()).filter(o => o)
            };
        } else {
            // Vérifier les champs moldu
            const nationalRegister = document.getElementById('newClientNationalRegister').value;
            const email = document.getElementById('newClientEmail').value;
            const street = document.getElementById('newClientStreet').value;
            const city = document.getElementById('newClientCity').value;
            const houseNumber = document.getElementById('newClientHouseNumber').value;
            const country = document.getElementById('newClientCountryMoldu').value;
            
            if (!nationalRegister || !email || !street || !city || !houseNumber || !country) {
                alert('Veuillez remplir tous les champs obligatoires pour un moldu');
                return;
            }
            
            clientData.moldu = {
                national_register_number: parseInt(nationalRegister),
                mail: email,
                add_street: street,
                add_city: city,
                add_house_number: houseNumber,
                add_country: country
            };
        }
        
        try {
            const response = await fetch('/api/register/clients/', {
                credentials: "include",
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
            
            if (response.ok) {
                const result = await response.json();
                modal.style.display = 'none';
                newForm.reset();
                // Remettre l'affichage par défaut
                clientTypeSelect.value = 'sorcier';
                toggleFields();
                if (window.loadClients) {
                    await window.loadClients();
                }
                alert(result.message || 'Client créé avec succès !');
            } else {
                const error = await response.json();
                alert(`Erreur lors de la création du client: ${error.detail || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.error('Erreur création client:', error);
            alert('Erreur réseau');
        }
    });
}