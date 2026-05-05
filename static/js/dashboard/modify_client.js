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
    
    if (!form) {
        console.error('Formulaire modifyClientForm non trouvé');
        return;
    }
    
    let currentClientId = null;

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
    
    function updateFieldsRequired(hasSorcier, hasMoldu) {
        const sorcierFieldsList = [
            'modifySorcierRegistry', 'modifySorcierChimney', 
            'modifySorcierSchool', 'modifySorcierHouse'
        ];
        const molduFieldsList = [
            'modifyMolduNationalRegister', 'modifyMolduMail',
            'modifyMolduStreet', 'modifyMolduCity', 'modifyMolduCountry'
        ];
        
        sorcierFieldsList.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.required = hasSorcier;
        });
        
        molduFieldsList.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.required = hasMoldu;
        });
    }

    function attachRealtimeValidations() {
        const fields = getFields();
        const clientTypeSelect = document.getElementById('modifyClientType');
        const selectedType = clientTypeSelect ? clientTypeSelect.value : 'sorcier';
        const hasSorcier = selectedType === 'sorcier' || selectedType === 'sorcier&moldu';
        const hasMoldu = selectedType === 'moldu' || selectedType === 'sorcier&moldu';
        
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
            const validate = () => validateSingleField(fields.wizardRegistry, regex.wizardRegistry, "Numéro de registre", hasSorcier);
            fields.wizardRegistry.removeEventListener('input', validate);
            fields.wizardRegistry.removeEventListener('blur', validate);
            fields.wizardRegistry.addEventListener('input', validate);
            fields.wizardRegistry.addEventListener('blur', validate);
        }
        
        if (fields.chimney) {
            const validate = () => validateSingleField(fields.chimney, regex.chimney, "Cheminée", hasSorcier);
            fields.chimney.removeEventListener('input', validate);
            fields.chimney.removeEventListener('blur', validate);
            fields.chimney.addEventListener('input', validate);
            fields.chimney.addEventListener('blur', validate);
        }
        
        if (fields.schoolName) {
            const validate = () => validateSingleField(fields.schoolName, regex.schoolName, "Nom de l'école", hasSorcier);
            fields.schoolName.removeEventListener('input', validate);
            fields.schoolName.removeEventListener('blur', validate);
            fields.schoolName.addEventListener('input', validate);
            fields.schoolName.addEventListener('blur', validate);
        }
        
        if (fields.house) {
            const validate = () => validateSingleField(fields.house, regex.house, "Maison", hasSorcier);
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
            const validate = () => validateSingleField(fields.nationalRegister, regex.nationalRegister, "Numéro de registre national", hasMoldu);
            fields.nationalRegister.removeEventListener('input', validate);
            fields.nationalRegister.removeEventListener('blur', validate);
            fields.nationalRegister.addEventListener('input', validate);
            fields.nationalRegister.addEventListener('blur', validate);
        }
        
        if (fields.email) {
            const validate = () => validateSingleField(fields.email, regex.email, "Email", hasMoldu, "Format d'email invalide (ex: nom@domaine.com)");
            fields.email.removeEventListener('input', validate);
            fields.email.removeEventListener('blur', validate);
            fields.email.addEventListener('input', validate);
            fields.email.addEventListener('blur', validate);
        }
        
        if (fields.street) {
            const validate = () => validateSingleField(fields.street, regex.street, "Rue", hasMoldu);
            fields.street.removeEventListener('input', validate);
            fields.street.removeEventListener('blur', validate);
            fields.street.addEventListener('input', validate);
            fields.street.addEventListener('blur', validate);
        }
        
        if (fields.city) {
            const validate = () => validateSingleField(fields.city, regex.city, "Ville", hasMoldu);
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
            const validate = () => validateSingleField(fields.countryMoldu, regex.country, "Pays", hasMoldu);
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
    
    function setupClientTypeChangeHandler() {
        const clientTypeSelect = document.getElementById('modifyClientType');
        if (!clientTypeSelect) return;
        
        clientTypeSelect.addEventListener('change', async () => {
            const selectedType = clientTypeSelect.value;
            const hasSorcier = selectedType === 'sorcier' || selectedType === 'sorcier&moldu';
            const hasMoldu = selectedType === 'moldu' || selectedType === 'sorcier&moldu';
            
            // Sauvegarder les valeurs actuelles
            const currentValues = {
                sorcier: {
                    wizardRegistry: document.getElementById('modifySorcierRegistry')?.value || '',
                    chimney: document.getElementById('modifySorcierChimney')?.value || '',
                    schoolName: document.getElementById('modifySorcierSchool')?.value || '',
                    house: document.getElementById('modifySorcierHouse')?.value || '',
                    country: document.getElementById('modifySorcierCountry')?.value || 'United Kingdom',
                    flightLicence: document.getElementById('modifySorcierFlightLicence')?.value || '0',
                    owls: document.getElementById('modifySorcierOwls')?.value || ''
                },
                moldu: {
                    nationalRegister: document.getElementById('modifyMolduNationalRegister')?.value || '',
                    email: document.getElementById('modifyMolduMail')?.value || '',
                    street: document.getElementById('modifyMolduStreet')?.value || '',
                    city: document.getElementById('modifyMolduCity')?.value || '',
                    houseNumber: document.getElementById('modifyMolduHouseNumber')?.value || '',
                    countryMoldu: document.getElementById('modifyMolduCountry')?.value || 'France'
                }
            };
            
            const sorcierFields = document.getElementById('modifySorcierFieldsSection');
            const molduFields = document.getElementById('modifyMolduFieldsSection');
            
            if (sorcierFields) sorcierFields.style.display = hasSorcier ? 'block' : 'none';
            if (molduFields) molduFields.style.display = hasMoldu ? 'block' : 'none';
            
            updateFieldsRequired(hasSorcier, hasMoldu);
            
            if (hasSorcier) {
                const regField = document.getElementById('modifySorcierRegistry');
                const chimneyField = document.getElementById('modifySorcierChimney');
                const schoolField = document.getElementById('modifySorcierSchool');
                const houseField = document.getElementById('modifySorcierHouse');
                const countryField = document.getElementById('modifySorcierCountry');
                const licenceField = document.getElementById('modifySorcierFlightLicence');
                const owlsField = document.getElementById('modifySorcierOwls');
                
                if (regField) regField.value = currentValues.sorcier.wizardRegistry;
                if (chimneyField) chimneyField.value = currentValues.sorcier.chimney;
                if (schoolField) schoolField.value = currentValues.sorcier.schoolName;
                if (houseField) houseField.value = currentValues.sorcier.house;
                if (countryField) countryField.value = currentValues.sorcier.country;
                if (licenceField) licenceField.value = currentValues.sorcier.flightLicence;
                if (owlsField) owlsField.value = currentValues.sorcier.owls;
            }
            
            if (hasMoldu) {
                const registerField = document.getElementById('modifyMolduNationalRegister');
                const emailField = document.getElementById('modifyMolduMail');
                const streetField = document.getElementById('modifyMolduStreet');
                const cityField = document.getElementById('modifyMolduCity');
                const houseNumField = document.getElementById('modifyMolduHouseNumber');
                const countryMolduField = document.getElementById('modifyMolduCountry');
                
                if (registerField) registerField.value = currentValues.moldu.nationalRegister;
                if (emailField) emailField.value = currentValues.moldu.email;
                if (streetField) streetField.value = currentValues.moldu.street;
                if (cityField) cityField.value = currentValues.moldu.city;
                if (houseNumField) houseNumField.value = currentValues.moldu.houseNumber;
                if (countryMolduField) countryMolduField.value = currentValues.moldu.countryMoldu;
            }
            
            attachRealtimeValidations();
            clearAllErrors();
        });
    }

    // Fonction pour charger les données 
    function loadClientDataFromCurrentClient() {
        const client = window.currentClient;
        if (!client) return;
        
        const fields = getFields();
        
        // Informations générales
        if (fields.nom) fields.nom.value = client.name || '';
        if (fields.prenom) fields.prenom.value = client.surname || '';
        if (fields.birthDate) fields.birthDate.value = client.birth_date || '';
        if (fields.money) fields.money.value = client.money ? parseFloat(client.money).toFixed(2) : '0.00';
        
        // Déterminer le type de client 
        const hasSorcier = client.SORCIER == 1 || client.sorcier;
        const hasMoldu = client.MOLDU == 1 || client.moldu;
        
        let clientType = '';
        if (hasSorcier && hasMoldu) {
            clientType = 'sorcier&moldu';
        } else if (hasSorcier) {
            clientType = 'sorcier';
        } else {
            clientType = 'moldu';
        }
        
        const clientTypeSelect = document.getElementById('modifyClientType');
        if (clientTypeSelect) {
            clientTypeSelect.value = clientType;
        }
        
        const sorcierFieldsSection = document.getElementById('modifySorcierFieldsSection');
        const molduFieldsSection = document.getElementById('modifyMolduFieldsSection');
        
        if (sorcierFieldsSection) sorcierFieldsSection.style.display = hasSorcier ? 'block' : 'none';
        if (molduFieldsSection) molduFieldsSection.style.display = hasMoldu ? 'block' : 'none';
        
        updateFieldsRequired(hasSorcier, hasMoldu);
        
        // Données Sorcier 
        if (hasSorcier && client.sorcier) {
            const sorcierData = client.sorcier;
            if (fields.wizardRegistry) fields.wizardRegistry.value = sorcierData?.Wizard_registry_number || '';
            if (fields.chimney) fields.chimney.value = sorcierData?.Chimney || '';
            if (fields.schoolName) fields.schoolName.value = sorcierData?.Add_School_name || '';
            if (fields.house) fields.house.value = sorcierData?.Add_House || '';
            if (fields.country) fields.country.value = sorcierData?.Add_Country || 'United Kingdom';
            if (fields.flightLicence) fields.flightLicence.value = sorcierData?.Flight_licence || '0';
            
            // Hiboux
            const owls = client.sorcier?.owls || [];
            if (fields.owls) fields.owls.value = owls.length > 0 ? owls.join(', ') : '';
        }
        
        // Données Moldu
        if (hasMoldu && client.moldu) {
            const molduData = client.moldu;
            if (fields.nationalRegister) fields.nationalRegister.value = molduData?.National_register_number || '';
            if (fields.email) fields.email.value = molduData?.Mail || '';
            if (fields.street) fields.street.value = molduData?.Add_Street || '';
            if (fields.city) fields.city.value = molduData?.Add_City || '';
            if (fields.houseNumber) fields.houseNumber.value = molduData?.Add_House_number || '';
            if (fields.countryMoldu) fields.countryMoldu.value = molduData?.Add_Country || 'France';
            // Téléphones
            const tels = client.moldu?.telephones || [];
            if (fields.telephones) fields.telephones.value = tels.length > 0 ? tels.join(', ') : '';
        }
        
        clearAllErrors();
    }

    function validateFormBeforeSubmit() {
        const clientTypeSelect = document.getElementById('modifyClientType');
        const selectedType = clientTypeSelect ? clientTypeSelect.value : 'sorcier';
        const hasSorcier = selectedType === 'sorcier' || selectedType === 'sorcier&moldu';
        const hasMoldu = selectedType === 'moldu' || selectedType === 'sorcier&moldu';
        
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
        
        if (hasSorcier) {
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
        }
        
        if (hasMoldu) {
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
        loadClientDataFromCurrentClient();
        modal.style.display = 'flex';
        
        setTimeout(() => {
            attachRealtimeValidations();
        }, 50);
    }
    
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
    
    const cancelBtn = document.getElementById('cancelModifyBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            resetForm();
        });
    }
    
    setupClientTypeChangeHandler();
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        attachRealtimeValidations();
        
        const isValid = validateFormBeforeSubmit();
        if (!isValid) return;
        
        const fields = getFields();
        const clientTypeSelect = document.getElementById('modifyClientType');
        const selectedType = clientTypeSelect ? clientTypeSelect.value : 'sorcier';
        const hasSorcier = selectedType === 'sorcier' || selectedType === 'sorcier&moldu';
        const hasMoldu = selectedType === 'moldu' || selectedType === 'sorcier&moldu';
        
        const updatedClient = {
            id_client: currentClientId,
            name: fields.nom.value,
            surname: fields.prenom.value,
            birth_date: fields.birthDate.value,
            money: parseFloat(fields.money.value) || 0,
            type_client: selectedType,
        };
        
        if (hasSorcier) {
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
            updatedClient.sorcier = null;
        }
        
        if (hasMoldu) {
            updatedClient.moldu = {
                national_register_number: parseInt(fields.nationalRegister.value) || 0,
                mail: fields.email.value,
                add_street: fields.street.value,
                add_city: fields.city.value,
                add_house_number: fields.houseNumber.value,
                add_country: fields.countryMoldu.value || 'France',
                telephones: fields.telephones.value.split(',').map(t => t.trim()).filter(t => t),
            };
        } else {
            updatedClient.moldu = null;
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