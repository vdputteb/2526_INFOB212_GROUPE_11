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

export function AddClient() {
    const modal = document.getElementById('addClientModal');
    const showBtn = document.getElementById('showAddClientBtn');
    const closeBtn = modal?.querySelector('.close-modal');
    const form = document.getElementById('addClientForm');
    const clientTypeSelect = document.getElementById('newClientType');
    
    if (!modal || !showBtn || !closeBtn || !form) return;
    
    // ========== FONCTION POUR OBTENIR LES RÉFÉRENCES FRAÎCHES ==========
    function getFields() {
        return {
            nom: document.getElementById('newClientNom'),
            prenom: document.getElementById('newClientPrenom'),
            birthDate: document.getElementById('newClientBirthDate'),
            telephones: document.getElementById('newClientTelephones'),
            money: document.getElementById('newClientMoney'),
            // Sorcier
            wizardRegistry: document.getElementById('newClientWizardRegistry'),
            chimney: document.getElementById('newClientChimney'),
            schoolName: document.getElementById('newClientSchoolName'),
            house: document.getElementById('newClientHouse'),
            country: document.getElementById('newClientCountry'),
            flightLicence: document.getElementById('newClientFlightLicence'),
            owls: document.getElementById('newClientOwls'),
            // Moldu
            nationalRegister: document.getElementById('newClientNationalRegister'),
            email: document.getElementById('newClientEmail'),
            street: document.getElementById('newClientStreet'),
            city: document.getElementById('newClientCity'),
            houseNumber: document.getElementById('newClientHouseNumber'),
            countryMoldu: document.getElementById('newClientCountryMoldu')
        };
    }
    
    // ========== VALIDATION D'UN CHAMP INDIVIDUEL ==========
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
    
    // ========== VALIDATION SPÉCIFIQUE POUR LA DATE (ÂGE) ==========
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
    
    // ========== VALIDATION SPÉCIFIQUE POUR LES TÉLÉPHONES ==========
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
    
    // ========== VALIDATION SPÉCIFIQUE POUR L'ARGENT ==========
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
    
    // ========== VALIDATION SPÉCIFIQUE POUR LE PERMIS DE VOL ==========
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
    
    // ========== VALIDATION SPÉCIFIQUE POUR LES HIBOUX ==========
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
    
    // ========== VALIDATION SPÉCIFIQUE POUR LE NUMÉRO DE MAISON ==========
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
    
    // ========== ATTACHER LES ÉVÉNEMENTS DE VALIDATION EN TEMPS RÉEL ==========
    function attachRealtimeValidations() {
        const fields = getFields();
        
        // Champ Nom
        if (fields.nom) {
            const validate = () => validateSingleField(fields.nom, regex.name, "Nom", true);
            fields.nom.removeEventListener('input', validate);
            fields.nom.removeEventListener('blur', validate);
            fields.nom.addEventListener('input', validate);
            fields.nom.addEventListener('blur', validate);
        }
        
        // Champ Prénom
        if (fields.prenom) {
            const validate = () => validateSingleField(fields.prenom, regex.surname, "Prénom", true);
            fields.prenom.removeEventListener('input', validate);
            fields.prenom.removeEventListener('blur', validate);
            fields.prenom.addEventListener('input', validate);
            fields.prenom.addEventListener('blur', validate);
        }
        
        // Champ Date de naissance
        if (fields.birthDate) {
            const validate = () => validateDateField(fields.birthDate);
            fields.birthDate.removeEventListener('input', validate);
            fields.birthDate.removeEventListener('blur', validate);
            fields.birthDate.addEventListener('input', validate);
            fields.birthDate.addEventListener('blur', validate);
        }
        
        // Champ Téléphones
        if (fields.telephones) {
            const validate = () => validateTelephonesField(fields.telephones);
            fields.telephones.removeEventListener('input', validate);
            fields.telephones.removeEventListener('blur', validate);
            fields.telephones.addEventListener('input', validate);
            fields.telephones.addEventListener('blur', validate);
        }
        
        // Champ Argent
        if (fields.money) {
            const validate = () => validateMoneyField(fields.money);
            fields.money.removeEventListener('input', validate);
            fields.money.removeEventListener('blur', validate);
            fields.money.addEventListener('input', validate);
            fields.money.addEventListener('blur', validate);
        }
        
        // Champs Sorcier
        if (fields.wizardRegistry) {
            const validate = () => validateSingleField(fields.wizardRegistry, regex.wizardRegistry, "Numéro de registre", false);
            fields.wizardRegistry.removeEventListener('input', validate);
            fields.wizardRegistry.removeEventListener('blur', validate);
            fields.wizardRegistry.addEventListener('input', validate);
            fields.wizardRegistry.addEventListener('blur', validate);
        }
        
        if (fields.chimney) {
            const validate = () => validateSingleField(fields.chimney, regex.chimney, "Cheminée", false);
            fields.chimney.removeEventListener('input', validate);
            fields.chimney.removeEventListener('blur', validate);
            fields.chimney.addEventListener('input', validate);
            fields.chimney.addEventListener('blur', validate);
        }
        
        if (fields.schoolName) {
            const validate = () => validateSingleField(fields.schoolName, regex.schoolName, "Nom de l'école", false);
            fields.schoolName.removeEventListener('input', validate);
            fields.schoolName.removeEventListener('blur', validate);
            fields.schoolName.addEventListener('input', validate);
            fields.schoolName.addEventListener('blur', validate);
        }
        
        if (fields.house) {
            const validate = () => validateSingleField(fields.house, regex.house, "Maison", false);
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
        
        // Champs Moldu
        if (fields.nationalRegister) {
            const validate = () => validateSingleField(fields.nationalRegister, regex.nationalRegister, "Numéro de registre national", false);
            fields.nationalRegister.removeEventListener('input', validate);
            fields.nationalRegister.removeEventListener('blur', validate);
            fields.nationalRegister.addEventListener('input', validate);
            fields.nationalRegister.addEventListener('blur', validate);
        }
        
        if (fields.email) {
            const validate = () => validateSingleField(fields.email, regex.email, "Email", false, "Format d'email invalide (ex: nom@domaine.com)");
            fields.email.removeEventListener('input', validate);
            fields.email.removeEventListener('blur', validate);
            fields.email.addEventListener('input', validate);
            fields.email.addEventListener('blur', validate);
        }
        
        if (fields.street) {
            const validate = () => validateSingleField(fields.street, regex.street, "Rue", false);
            fields.street.removeEventListener('input', validate);
            fields.street.removeEventListener('blur', validate);
            fields.street.addEventListener('input', validate);
            fields.street.addEventListener('blur', validate);
        }
        
        if (fields.city) {
            const validate = () => validateSingleField(fields.city, regex.city, "Ville", false);
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
            const validate = () => validateSingleField(fields.countryMoldu, regex.country, "Pays", false);
            fields.countryMoldu.removeEventListener('input', validate);
            fields.countryMoldu.removeEventListener('blur', validate);
            fields.countryMoldu.addEventListener('input', validate);
            fields.countryMoldu.addEventListener('blur', validate);
        }
    }
    
    // ========== NETTOYER LES MESSAGES D'ERREUR ==========
    function clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(msg => msg.remove());
        document.querySelectorAll('.error-border, .valid-border').forEach(field => {
            field.classList.remove('error-border', 'valid-border');
        });
    }
    
    // ========== GESTION DE L'AFFICHAGE DES CHAMPS ==========
    function toggleFields() {
        const isSorcier = clientTypeSelect.value === 'sorcier';
        const sorcierFields = document.getElementById('sorcierFields');
        const molduFields = document.getElementById('molduFields');
        const fields = getFields();
        
        if (isSorcier) {
            if (sorcierFields) sorcierFields.style.display = 'block';
            if (molduFields) molduFields.style.display = 'none';
            
            // Marquer les champs Sorcier comme requis
            if (fields.wizardRegistry) fields.wizardRegistry.required = true;
            if (fields.chimney) fields.chimney.required = true;
            if (fields.schoolName) fields.schoolName.required = true;
            if (fields.house) fields.house.required = true;
            
            // Désactiver les champs Moldu
            if (fields.nationalRegister) fields.nationalRegister.required = false;
            if (fields.email) fields.email.required = false;
            if (fields.street) fields.street.required = false;
            if (fields.city) fields.city.required = false;
            if (fields.houseNumber) fields.houseNumber.required = false;
            if (fields.countryMoldu) fields.countryMoldu.required = false;
        } else {
            if (sorcierFields) sorcierFields.style.display = 'none';
            if (molduFields) molduFields.style.display = 'block';
            
            // Désactiver les champs Sorcier
            if (fields.wizardRegistry) fields.wizardRegistry.required = false;
            if (fields.chimney) fields.chimney.required = false;
            if (fields.schoolName) fields.schoolName.required = false;
            if (fields.house) fields.house.required = false;
            
            // Marquer les champs Moldu comme requis
            if (fields.nationalRegister) fields.nationalRegister.required = true;
            if (fields.email) fields.email.required = true;
            if (fields.street) fields.street.required = true;
            if (fields.city) fields.city.required = true;
            if (fields.houseNumber) fields.houseNumber.required = true;
            if (fields.countryMoldu) fields.countryMoldu.required = true;
        }
        
        clearAllErrors();
    }
    
    // ========== VALIDATION COMPLÈTE AVANT SOUMISSION ==========
    function validateFormBeforeSubmit() {
        const fields = getFields();
        const isSorcier = clientTypeSelect.value === 'sorcier';
        let isValid = true;
        let firstInvalidField = null;
        
        // Validation Nom
        if (!validateSingleField(fields.nom, regex.name, "Nom", true)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.nom;
        }
        
        // Validation Prénom
        if (!validateSingleField(fields.prenom, regex.surname, "Prénom", true)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.prenom;
        }
        
        // Validation Date
        if (!validateDateField(fields.birthDate)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.birthDate;
        }
        
        // Validation Argent
        if (!validateMoneyField(fields.money)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.money;
        }
        
        // Validation Téléphones
        if (!validateTelephonesField(fields.telephones)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.telephones;
        }
        
        if (isSorcier) {
            // Validation champs Sorcier requis
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
            // Validation champs Moldu requis
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
    
    // ========== RÉINITIALISATION COMPLÈTE DU FORMULAIRE ==========
    function resetForm() {
        const form = document.getElementById('addClientForm');
        if (form) form.reset();
        
        const select = document.getElementById('newClientType');
        if (select) select.value = 'sorcier';
        
        clearAllErrors();
        toggleFields();
    }
    
    // ========== ATTACHER LES ÉVÉNEMENTS ==========
    
    // Ré-attacher les validations à chaque ouverture (pour être sûr)
    showBtn.addEventListener('click', () => {
        resetForm();
        modal.style.display = 'flex';
        // Petit délai pour que les champs soient bien dans le DOM
        setTimeout(() => {
            attachRealtimeValidations();
        }, 50);
    });
    
    clientTypeSelect.addEventListener('change', () => {
        toggleFields();
        // Ré-attacher les validations après le changement de type
        setTimeout(() => {
            attachRealtimeValidations();
        }, 50);
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        resetForm();
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetForm();
        }
    });
    
    // Remplacer le formulaire pour éviter les événements en double
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Ré-attacher les références après le remplacement
    setTimeout(() => {
        attachRealtimeValidations();
    }, 100);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Ré-attacher les validations une dernière fois
        attachRealtimeValidations();
        
        const isValid = validateFormBeforeSubmit();
        if (!isValid) return;
        
        const fields = getFields();
        const isSorcier = clientTypeSelect.value === 'sorcier';
        
        const clientData = {
            name: fields.nom.value,
            surname: fields.prenom.value,
            birth_date: fields.birthDate.value,
            money: parseFloat(fields.money.value) || 0,
            type_client: isSorcier ? 'sorcier' : 'moldu',
            telephones: fields.telephones.value.split(',').map(t => t.trim()).filter(t => t),
        };
        
        if (isSorcier) {
            clientData.sorcier = {
                wizard_registry_number: parseInt(fields.wizardRegistry.value),
                chimney: fields.chimney.value,
                add_school_name: fields.schoolName.value,
                add_house: fields.house.value,
                add_country: fields.country.value || 'UK',
                flight_licence: parseInt(fields.flightLicence.value) || 0,
                owls: fields.owls.value.split(',').map(o => o.trim()).filter(o => o)
            };
        } else {
            clientData.moldu = {
                national_register_number: parseInt(fields.nationalRegister.value),
                mail: fields.email.value,
                add_street: fields.street.value,
                add_city: fields.city.value,
                add_house_number: fields.houseNumber.value,
                add_country: fields.countryMoldu.value
            };
        }
        
        try {
            const response = await fetch('/api/register/client', {
                credentials: "include",
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
            
            if (response.ok) {
                const result = await response.json();
                modal.style.display = 'none';
                resetForm();
                
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