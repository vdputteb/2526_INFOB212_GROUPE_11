import { 
    regex, 
    removeErrorMessage, 
    showErrorMessage, 
    showSuccessIndicator,
    validateField, 
    validateAge, 
    validateTelephones, 
    validateOwls, 
    validateMoney,
    setupRealtimeValidation
} from './validation.js';

// Variable globale pour stocker la fonction openModal
let globalOpenModal = null;

export function setupModifyClient() {
    const modal = document.getElementById('modifyClientModal');
    if (!modal) {
        console.error('Modal modifyClientModal non trouvé');
        return;
    }
    
    const closeBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('modifyClientForm');
    const clientTypeDisplay = document.getElementById('modifyClientTypeDisplay');
    
    if (!form) {
        console.error('Formulaire modifyClientForm non trouvé');
        return;
    }
    
    let currentClientId = null;
    let isSorcierMode = false;

    function getFields() {
        return {
            nom: document.getElementById('modifyClientNom'),
            prenom: document.getElementById('modifyClientPrenom'),
            birthDate: document.getElementById('modifyClientBirthDate'),
            telephones: document.getElementById('modifyClientPhones'),
            money: document.getElementById('modifyClientMoney'),
            wizardRegistry: document.getElementById('modifySorcierRegistry'),
            chimney: document.getElementById('modifySorcierChimney'),
            schoolName: document.getElementById('modifySorcierSchool'),
            house: document.getElementById('modifySorcierHouse'),
            country: document.getElementById('modifySorcierCountry'),
            flightLicence: document.getElementById('modifySorcierFlightLicence'),
            owls: document.getElementById('modifySorcierOwls'),
            nationalRegister: document.getElementById('modifyMolduNationalRegister'),
            email: document.getElementById('modifyMolduMail'),
            street: document.getElementById('modifyMolduStreet'),
            city: document.getElementById('modifyMolduCity'),
            houseNumber: document.getElementById('modifyMolduHouseNumber'),
            countryMoldu: document.getElementById('modifyMolduCountry')
        };
    }

    function validateSingleField(field, regexPattern, fieldName, required, customMessage = null) {
        if (!field) return true;
        
        const value = field.value;
        const validation = validateField(value, regexPattern, fieldName, required);
        
        if (validation.valid) {
            showSuccessIndicator(field);
            return true;
        } else if ((required && !value.trim()) || (value.trim() !== '')) {
            showErrorMessage(field, customMessage || validation.message);
            return false;
        } else {
            removeErrorMessage(field);
            field.classList.remove('error-border', 'valid-border');
            return true;
        }
    }

    function validateDateField(field) {
        if (!field) return true;
        
        const value = field.value;
        const dateValidation = validateField(value, regex.birthDate, "Date de naissance", true);
        
        if (!dateValidation.valid) {
            showErrorMessage(field, dateValidation.message);
            return false;
        }
        
        const ageValidation = validateAge(value);
        if (!ageValidation.valid) {
            showErrorMessage(field, ageValidation.message);
            return false;
        }
        
        showSuccessIndicator(field);
        return true;
    }

    function validateTelephonesField(field) {
        if (!field) return true;
        
        const value = field.value;
        const validation = validateTelephones(value, false);
        
        if (validation.valid) {
            showSuccessIndicator(field);
            return true;
        } else if (value.trim() !== '') {
            showErrorMessage(field, validation.message);
            return false;
        } else {
            removeErrorMessage(field);
            field.classList.remove('error-border', 'valid-border');
            return true;
        }
    }

    function validateMoneyField(field) {
        if (!field) return true;
        
        const value = field.value;
        const validation = validateMoney(value, false);
        
        if (validation.valid) {
            showSuccessIndicator(field);
            return true;
        } else if (value.trim() !== '') {
            showErrorMessage(field, validation.message);
            return false;
        } else {
            removeErrorMessage(field);
            field.classList.remove('error-border', 'valid-border');
            return true;
        }
    }

    function validateLicenceField(field) {
        if (!field) return true;
        
        const value = field.value;
        const validation = validateField(value, regex.flightLicence, "Permis de vol", false);
        
        if (validation.valid || value.trim() === '') {
            if (value.trim() !== '') showSuccessIndicator(field);
            else {
                removeErrorMessage(field);
                field.classList.remove('error-border', 'valid-border');
            }
            return true;
        } else {
            showErrorMessage(field, "Le permis de vol doit être un nombre entre 0 et 5.");
            return false;
        }
    }

    function validateOwlsField(field) {
        if (!field) return true;
        
        const value = field.value;
        const validation = validateOwls(value, false);
        
        if (validation.valid) {
            showSuccessIndicator(field);
            return true;
        } else if (value.trim() !== '') {
            showErrorMessage(field, validation.message);
            return false;
        } else {
            removeErrorMessage(field);
            field.classList.remove('error-border', 'valid-border');
            return true;
        }
    }

    function validateHouseNumberField(field) {
        if (!field) return true;
        
        const value = field.value;
        const validation = validateField(value, regex.houseNumber, "Numéro de maison", false);
        
        if (validation.valid || value.trim() === '') {
            if (value.trim() !== '') showSuccessIndicator(field);
            else {
                removeErrorMessage(field);
                field.classList.remove('error-border', 'valid-border');
            }
            return true;
        } else {
            showErrorMessage(field, "Le numéro de maison doit être un nombre (ex: 12 ou 12A)");
            return false;
        }
    }
    
    function attachRealtimeValidations() {
        const fields = getFields();
        
        const validateNom = () => validateSingleField(fields.nom, regex.name, "Nom", true);
        if (fields.nom) {
            fields.nom.removeEventListener('input', validateNom);
            fields.nom.removeEventListener('blur', validateNom);
            fields.nom.addEventListener('input', validateNom);
            fields.nom.addEventListener('blur', validateNom);
        }
        
        const validatePrenom = () => validateSingleField(fields.prenom, regex.surname, "Prénom", true);
        if (fields.prenom) {
            fields.prenom.removeEventListener('input', validatePrenom);
            fields.prenom.removeEventListener('blur', validatePrenom);
            fields.prenom.addEventListener('input', validatePrenom);
            fields.prenom.addEventListener('blur', validatePrenom);
        }
        
        if (fields.birthDate) {
            const validate = () => validateDateField(fields.birthDate);
            fields.birthDate.removeEventListener('input', validate);
            fields.birthDate.removeEventListener('blur', validate);
            fields.birthDate.addEventListener('input', validate);
            fields.birthDate.addEventListener('blur', validate);
        }
        
        if (fields.telephones) {
            const validate = () => validateTelephonesField(fields.telephones);
            fields.telephones.removeEventListener('input', validate);
            fields.telephones.removeEventListener('blur', validate);
            fields.telephones.addEventListener('input', validate);
            fields.telephones.addEventListener('blur', validate);
        }
        
        if (fields.money) {
            const validate = () => validateMoneyField(fields.money);
            fields.money.removeEventListener('input', validate);
            fields.money.removeEventListener('blur', validate);
            fields.money.addEventListener('input', validate);
            fields.money.addEventListener('blur', validate);
        }
        
        if (fields.wizardRegistry) {
            const validate = () => validateSingleField(fields.wizardRegistry, regex.wizardRegistry, "Numéro de registre", isSorcierMode);
            fields.wizardRegistry.removeEventListener('input', validate);
            fields.wizardRegistry.removeEventListener('blur', validate);
            fields.wizardRegistry.addEventListener('input', validate);
            fields.wizardRegistry.addEventListener('blur', validate);
        }
        
        if (fields.chimney) {
            const validate = () => validateSingleField(fields.chimney, regex.chimney, "Cheminée", isSorcierMode);
            fields.chimney.removeEventListener('input', validate);
            fields.chimney.removeEventListener('blur', validate);
            fields.chimney.addEventListener('input', validate);
            fields.chimney.addEventListener('blur', validate);
        }
        
        if (fields.schoolName) {
            const validate = () => validateSingleField(fields.schoolName, regex.schoolName, "Nom de l'école", isSorcierMode);
            fields.schoolName.removeEventListener('input', validate);
            fields.schoolName.removeEventListener('blur', validate);
            fields.schoolName.addEventListener('input', validate);
            fields.schoolName.addEventListener('blur', validate);
        }
        
        if (fields.house) {
            const validate = () => validateSingleField(fields.house, regex.house, "Maison", isSorcierMode);
            fields.house.removeEventListener('input', validate);
            fields.house.removeEventListener('blur', validate);
            fields.house.addEventListener('input', validate);
            fields.house.addEventListener('blur', validate);
        }
        
        if (fields.country) {
            const validate = () => validateSingleField(fields.country, regex.country, "Pays", false);
            fields.country.removeEventListener('input', validate);
            fields.country.removeEventListener('blur', validate);
            fields.country.addEventListener('input', validate);
            fields.country.addEventListener('blur', validate);
        }
        
        if (fields.flightLicence) {
            const validate = () => validateLicenceField(fields.flightLicence);
            fields.flightLicence.removeEventListener('input', validate);
            fields.flightLicence.removeEventListener('blur', validate);
            fields.flightLicence.addEventListener('input', validate);
            fields.flightLicence.addEventListener('blur', validate);
        }
        
        if (fields.owls) {
            const validate = () => validateOwlsField(fields.owls);
            fields.owls.removeEventListener('input', validate);
            fields.owls.removeEventListener('blur', validate);
            fields.owls.addEventListener('input', validate);
            fields.owls.addEventListener('blur', validate);
        }
        
        if (fields.nationalRegister) {
            const validate = () => validateSingleField(fields.nationalRegister, regex.nationalRegister, "Numéro de registre national", !isSorcierMode);
            fields.nationalRegister.removeEventListener('input', validate);
            fields.nationalRegister.removeEventListener('blur', validate);
            fields.nationalRegister.addEventListener('input', validate);
            fields.nationalRegister.addEventListener('blur', validate);
        }
        
        if (fields.email) {
            const validate = () => validateSingleField(fields.email, regex.email, "Email", !isSorcierMode, "Format d'email invalide (ex: nom@domaine.com)");
            fields.email.removeEventListener('input', validate);
            fields.email.removeEventListener('blur', validate);
            fields.email.addEventListener('input', validate);
            fields.email.addEventListener('blur', validate);
        }
        
        if (fields.street) {
            const validate = () => validateSingleField(fields.street, regex.street, "Rue", !isSorcierMode);
            fields.street.removeEventListener('input', validate);
            fields.street.removeEventListener('blur', validate);
            fields.street.addEventListener('input', validate);
            fields.street.addEventListener('blur', validate);
        }
        
        if (fields.city) {
            const validate = () => validateSingleField(fields.city, regex.city, "Ville", !isSorcierMode);
            fields.city.removeEventListener('input', validate);
            fields.city.removeEventListener('blur', validate);
            fields.city.addEventListener('input', validate);
            fields.city.addEventListener('blur', validate);
        }
        
        if (fields.houseNumber) {
            const validate = () => validateHouseNumberField(fields.houseNumber);
            fields.houseNumber.removeEventListener('input', validate);
            fields.houseNumber.removeEventListener('blur', validate);
            fields.houseNumber.addEventListener('input', validate);
            fields.houseNumber.addEventListener('blur', validate);
        }
        
        if (fields.countryMoldu) {
            const validate = () => validateSingleField(fields.countryMoldu, regex.country, "Pays", !isSorcierMode);
            fields.countryMoldu.removeEventListener('input', validate);
            fields.countryMoldu.removeEventListener('blur', validate);
            fields.countryMoldu.addEventListener('input', validate);
            fields.countryMoldu.addEventListener('blur', validate);
        }
    }

    function clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(msg => msg.remove());
        document.querySelectorAll('.error-border, .valid-border').forEach(field => {
            field.classList.remove('error-border', 'valid-border');
        });
    }
    
    function toggleFields() {
        // Utiliser les IDs uniques pour les sections dans le modal de modification
        const sorcierFields = document.getElementById('modifySorcierFieldsSection');
        const molduFields = document.getElementById('modifyMolduFieldsSection');
        const fields = getFields();
        
        if (isSorcierMode) {
            if (sorcierFields) sorcierFields.style.display = 'block';
            if (molduFields) molduFields.style.display = 'none';
            
            if (fields.wizardRegistry) fields.wizardRegistry.required = true;
            if (fields.chimney) fields.chimney.required = true;
            if (fields.schoolName) fields.schoolName.required = true;
            if (fields.house) fields.house.required = true;
            
            if (fields.nationalRegister) fields.nationalRegister.required = false;
            if (fields.email) fields.email.required = false;
            if (fields.street) fields.street.required = false;
            if (fields.city) fields.city.required = false;
            if (fields.houseNumber) fields.houseNumber.required = false;
            if (fields.countryMoldu) fields.countryMoldu.required = false;
        } else {
            if (sorcierFields) sorcierFields.style.display = 'none';
            if (molduFields) molduFields.style.display = 'block';
            
            if (fields.wizardRegistry) fields.wizardRegistry.required = false;
            if (fields.chimney) fields.chimney.required = false;
            if (fields.schoolName) fields.schoolName.required = false;
            if (fields.house) fields.house.required = false;
            
            if (fields.nationalRegister) fields.nationalRegister.required = true;
            if (fields.email) fields.email.required = true;
            if (fields.street) fields.street.required = true;
            if (fields.city) fields.city.required = true;
            if (fields.houseNumber) fields.houseNumber.required = true;
            if (fields.countryMoldu) fields.countryMoldu.required = true;
        }
        
        clearAllErrors();
    }

    async function loadClientData(clientId) {
        try {
            const response = await fetch(`/api/clients`, {
                credentials: "include",
                method: "GET"
            });
            const data = await response.json();
            
            if (data.success && data.clients) {
                const client = data.clients.find(c => c.id_client === clientId);
                if (!client) return;
                
                const fields = getFields();
                
                if (fields.nom) fields.nom.value = client.name || '';
                if (fields.prenom) fields.prenom.value = client.surname || '';
                if (fields.birthDate) fields.birthDate.value = client.birth_date || '';
                if (fields.money) fields.money.value = client.money || 0;
                
                let phones = [];
                if (client.telephones && Array.isArray(client.telephones)) {
                    phones = client.telephones;
                } else if (client.moldu && client.moldu.tel1) {
                    phones = [client.moldu.tel1, client.moldu.tel2, client.moldu.tel3].filter(t => t);
                }
                if (fields.telephones) fields.telephones.value = phones.join(', ');
                
                isSorcierMode = client.SORCIER === 1 || (client.sorcier && client.sorcier.Wizard_registry_number);
                
                if (clientTypeDisplay) {
                    clientTypeDisplay.textContent = isSorcierMode ? '🧙 Sorcier' : '🏠 Moldu';
                }
                
                if (isSorcierMode) {
                    const sorcierData = client.sorcier;
                    if (fields.wizardRegistry) fields.wizardRegistry.value = sorcierData?.Wizard_registry_number || '';
                    if (fields.chimney) fields.chimney.value = sorcierData?.Chimney || '';
                    if (fields.schoolName) fields.schoolName.value = sorcierData?.Add_School_name || '';
                    if (fields.house) fields.house.value = sorcierData?.Add_House || '';
                    if (fields.country) fields.country.value = sorcierData?.Add_Country || 'United Kingdom';
                    if (fields.flightLicence) fields.flightLicence.value = sorcierData?.Flight_licence || 0;
                    
                    let owls = [];
                    if (client.owls && Array.isArray(client.owls)) {
                        owls = client.owls;
                    } else if (sorcierData) {
                        owls = [sorcierData.Owls_number1, sorcierData.Owls_number2, sorcierData.Owls_number3].filter(o => o);
                    }
                    if (fields.owls) fields.owls.value = owls.join(', ');
                } else {
                    const molduData = client.moldu;
                    if (fields.nationalRegister) fields.nationalRegister.value = molduData?.National_register_number || '';
                    if (fields.email) fields.email.value = molduData?.Mail || '';
                    if (fields.street) fields.street.value = molduData?.Add_Street || '';
                    if (fields.city) fields.city.value = molduData?.Add_City || '';
                    if (fields.houseNumber) fields.houseNumber.value = molduData?.Add_House_number || '';
                    if (fields.countryMoldu) fields.countryMoldu.value = molduData?.Add_Country || 'United Kingdom';
                }
                
                toggleFields();
            }
        } catch (error) {
            console.error('Erreur chargement client:', error);
        }
    }

    function validateFormBeforeSubmit() {
        const fields = getFields();
        let isValid = true;
        let firstInvalidField = null;
        
        if (!validateSingleField(fields.nom, regex.name, "Nom", true)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.nom;
        }
        
        if (!validateSingleField(fields.prenom, regex.surname, "Prénom", true)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.prenom;
        }
        
        if (!validateDateField(fields.birthDate)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.birthDate;
        }
        
        if (!validateMoneyField(fields.money)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.money;
        }
        
        if (!validateTelephonesField(fields.telephones)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.telephones;
        }
        
        if (isSorcierMode) {
            if (!validateSingleField(fields.wizardRegistry, regex.wizardRegistry, "Numéro de registre", true)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.wizardRegistry;
            }
            if (!validateSingleField(fields.chimney, regex.chimney, "Cheminée", true)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.chimney;
            }
            if (!validateSingleField(fields.schoolName, regex.schoolName, "Nom de l'école", true)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.schoolName;
            }
            if (!validateSingleField(fields.house, regex.house, "Maison", true)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.house;
            }
            if (!validateLicenceField(fields.flightLicence)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.flightLicence;
            }
            if (!validateOwlsField(fields.owls)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.owls;
            }
        } else {
            if (!validateSingleField(fields.nationalRegister, regex.nationalRegister, "Numéro de registre national", true)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.nationalRegister;
            }
            if (!validateSingleField(fields.email, regex.email, "Email", true, "Format d'email invalide (ex: nom@domaine.com)")) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.email;
            }
            if (!validateSingleField(fields.street, regex.street, "Rue", true)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.street;
            }
            if (!validateSingleField(fields.city, regex.city, "Ville", true)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.city;
            }
            if (!validateHouseNumberField(fields.houseNumber)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.houseNumber;
            }
            if (!validateSingleField(fields.countryMoldu, regex.country, "Pays", true)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.countryMoldu;
            }
        }
        
        if (!isValid && firstInvalidField) {
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidField.focus();
        }
        
        return isValid;
    }

    function resetForm() {
        const formElem = document.getElementById('modifyClientForm');
        if (formElem) formElem.reset();
        
        clearAllErrors();
    }

    async function openModal() {
        const client = window.currentClient;
        if (!client) {
            alert('Veuillez d\'abord sélectionner un client');
            return;
        }
        
        currentClientId = client.id_client;
        resetForm();
        await loadClientData(currentClientId);
        modal.style.display = 'flex';
        
        setTimeout(() => {
            attachRealtimeValidations();
        }, 50);
    }
    
    // Stocker la fonction dans la variable globale
    globalOpenModal = openModal;
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            resetForm();
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetForm();
        }
    });
    
    // Bouton annuler
    const cancelBtn = document.getElementById('cancelModifyBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            resetForm();
        });
    }
    
    // Attacher l'événement submit directement sans cloner
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        attachRealtimeValidations();
        
        const isValid = validateFormBeforeSubmit();
        if (!isValid) return;
        
        const fields = getFields();
        
        const updatedClient = {
            id_client: currentClientId,
            name: fields.nom.value,
            surname: fields.prenom.value,
            birth_date: fields.birthDate.value,
            money: parseFloat(fields.money.value) || 0,
            type_client: isSorcierMode ? 'sorcier' : 'moldu',
            telephones: fields.telephones.value.split(',').map(t => t.trim()).filter(t => t),
        };
        
        if (isSorcierMode) {
            const owlsStr = fields.owls.value;
            const owls = owlsStr ? owlsStr.split(',').map(o => o.trim()).filter(o => o) : [];
            
            updatedClient.sorcier = {
                wizard_registry_number: parseInt(fields.wizardRegistry.value) || 0,
                chimney: fields.chimney.value,
                add_school_name: fields.schoolName.value,
                add_house: fields.house.value,
                add_country: fields.country.value || 'United Kingdom',
                flight_licence: parseInt(fields.flightLicence.value) || 0,
                owls: owls
            };
        } else {
            updatedClient.moldu = {
                national_register_number: parseInt(fields.nationalRegister.value) || 0,
                mail: fields.email.value,
                add_street: fields.street.value,
                add_city: fields.city.value,
                add_house_number: fields.houseNumber.value,
                add_country: fields.countryMoldu.value || 'United Kingdom'
            };
        }
        
        try {
            const response = await fetch(`/api/modify/client`, {
                credentials: "include",
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedClient)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    modal.style.display = 'none';
                    resetForm();
                    
                    if (window.loadClients) {
                        await window.loadClients();
                    }
                    
                    if (window.currentClient && window.currentClient.id_client === currentClientId) {
                        if (window.selectClient) {
                            await window.selectClient(currentClientId);
                        }
                    }
                    
                    alert(result.message || 'Client modifié avec succès !');
                } else {
                    throw new Error(result.detail || result.message);
                }
            } else {
                const error = await response.json();
                alert(`Erreur lors de la modification: ${error.detail || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.error('Erreur modification client:', error);
            alert('Erreur réseau lors de la modification: ' + error.message);
        }
    });
}

export function addModifyClientButton() {
    const actionsDiv = document.getElementById('vendeur-action');
    if (actionsDiv && !document.getElementById('modifyClientBtn')) {
        const modifyBtn = document.createElement('button');
        modifyBtn.id = 'modifyClientBtn';
        modifyBtn.className = 'btn-action';
        modifyBtn.textContent = '✏️ Modifier le client';
        modifyBtn.style.backgroundColor = '#3498db';
        modifyBtn.style.borderColor = '#3498db';
        modifyBtn.style.color = 'white';
        
        modifyBtn.addEventListener('click', () => {
            if (globalOpenModal) {
                globalOpenModal();
            } else {
                console.error('globalOpenModal n\'est pas défini');
                alert('Fonctionnalité de modification non disponible. Veuillez rafraîchir la page.');
            }
        });
        
        actionsDiv.appendChild(modifyBtn);
        console.log('Bouton modifier client ajouté');
    }
}

export function addDeleteClientButton() {
    const actionsDiv = document.getElementById('vendeur-action');
    if (actionsDiv && !document.getElementById('deleteClientMainBtn')) {
        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'deleteClientMainBtn';
        deleteBtn.className = 'btn-action';
        deleteBtn.textContent = '🗑️ Supprimer le client';
        deleteBtn.style.backgroundColor = '#e74c3c';
        deleteBtn.style.borderColor = '#e74c3c';
        deleteBtn.style.color = 'white';
        
        deleteBtn.addEventListener('click', async () => {
            const client = window.currentClient;
            if (!client) {
                alert('Veuillez d\'abord sélectionner un client');
                return;
            }
            
            if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le client ${client.surname} ${client.name} ?\n\nCette action est irréversible et supprimera toutes ses commandes et réservations.`)) {
                return;
            }
            
            try {
                const response = await fetch(`/api/delete/client/${client.id_client}`, {
                    credentials: "include",
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        alert(result.message || 'Client supprimé avec succès !');
                        
                        const modal = document.getElementById('modifyClientModal');
                        if (modal) modal.style.display = 'none';
                        
                        const clientInfo = document.getElementById('clientInfo');
                        const noClientSelected = document.getElementById('noClientSelected');
                        if (clientInfo) clientInfo.classList.add('hidden');
                        if (noClientSelected) noClientSelected.classList.remove('hidden');
                        
                        window.currentClient = null;
                        
                        if (window.loadClients) {
                            await window.loadClients();
                        }
                    } else {
                        alert(result.detail || result.message);
                    }
                } else {
                    const error = await response.json();
                    alert(`Erreur lors de la suppression: ${error.detail || 'Erreur inconnue'}`);
                }
            } catch (error) {
                console.error('Erreur suppression client:', error);
                alert('Erreur réseau lors de la suppression');
            }
        });
        
        actionsDiv.appendChild(deleteBtn);
        console.log('Bouton supprimer client ajouté');
    }
}