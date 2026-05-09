import { 
    regex, 
    removeErrorMessage, 
    showErrorMessage, 
    showSuccessIndicator,
    validateField, 
    validateTelephones, 
    setupRealtimeValidation
} from '../validation.js';

export function AddVendeur() {
    const modal = document.getElementById('addVendeurModal');
    const showBtn = document.getElementById('showAddVendeurBtn');
    const closeBtn = modal?.querySelector('.close-modal');
    const form = document.getElementById('addVendeurForm');
    const roleSelect = document.getElementById('newVendeurRole');
    
    if (!modal || !showBtn || !closeBtn || !form) return;
    
    function getFields() {
        return {
            nom: document.getElementById('newVendeurNom'),
            prenom: document.getElementById('newVendeurPrenom'),
            email: document.getElementById('newVendeurMail'),
            login: document.getElementById('newVendeurLogin'),
            password: document.getElementById('newVendeurpassword'),
            retryPassword: document.getElementById('RetryVendeurPassword'),
            role: document.getElementById('newVendeurRole'),
            telephones: document.getElementById('newVendeurTelephones')
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
    
    function validatePasswordMatch() {
        const fields = getFields();
        const password = fields.password?.value || '';
        const retryPassword = fields.retryPassword?.value || '';
        
        if (!fields.password || !fields.retryPassword) return true;
        
        if (password !== retryPassword) {
            showErrorMessage(fields.retryPassword, "Les mots de passe ne correspondent pas.");
            return false;
        } else if (password.length > 0) {
            showSuccessIndicator(fields.retryPassword);
            return true;
        } else {
            removeErrorMessage(fields.retryPassword);
            fields.retryPassword.classList.remove('error-border', 'valid-border');
            return true;
        }
    }
    
    function validateLoginField(field) {
        if (!field) return true;
        
        const value = field.value;
        // Login: 3 à 50 caractères, lettres, chiffres, underscore, point
        const loginRegex = /^[a-zA-Z0-9_.]{3,50}$/;
        const validation = validateField(value, loginRegex, "Identifiant", true);
        
        if (validation.valid) {
            showSuccessIndicator(field);
            return true;
        } else if (value.trim() !== '') {
            showErrorMessage(field, "L'identifiant doit contenir 3 à 50 caractères (lettres, chiffres, _, .)");
            return false;
        } else {
            removeErrorMessage(field);
            field.classList.remove('error-border', 'valid-border');
            return true;
        }
    }
    
    function validatePasswordField(field) {
        if (!field) return true;
        
        const value = field.value;
        // Mot de passe: au moins 6 caractères
        const passwordRegex = /^.{6,}$/;
        const validation = validateField(value, passwordRegex, "Mot de passe", true);
        
        if (validation.valid) {
            showSuccessIndicator(field);
            validatePasswordMatch();
            return true;
        } else if (value.trim() !== '') {
            showErrorMessage(field, "Le mot de passe doit contenir au moins 6 caractères.");
            return false;
        } else {
            removeErrorMessage(field);
            field.classList.remove('error-border', 'valid-border');
            return true;
        }
    }
    
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
        
        // Champ Email
        if (fields.email) {
            const validate = () => validateSingleField(fields.email, regex.email, "Email professionnel", true, "Format d'email invalide (ex: nom@domaine.com)");
            fields.email.removeEventListener('input', validate);
            fields.email.removeEventListener('blur', validate);
            fields.email.addEventListener('input', validate);
            fields.email.addEventListener('blur', validate);
        }
        
        // Champ Login
        if (fields.login) {
            const validate = () => validateLoginField(fields.login);
            fields.login.removeEventListener('input', validate);
            fields.login.removeEventListener('blur', validate);
            fields.login.addEventListener('input', validate);
            fields.login.addEventListener('blur', validate);
        }
        
        // Champ Mot de passe
        if (fields.password) {
            const validate = () => validatePasswordField(fields.password);
            fields.password.removeEventListener('input', validate);
            fields.password.removeEventListener('blur', validate);
            fields.password.addEventListener('input', validate);
            fields.password.addEventListener('blur', validate);
        }
        
        // Champ Confirmation mot de passe
        if (fields.retryPassword) {
            const validate = () => {
                const isValid = validatePasswordMatch();
                if (isValid && fields.password?.value) {
                    showSuccessIndicator(fields.retryPassword);
                }
                return isValid;
            };
            fields.retryPassword.removeEventListener('input', validate);
            fields.retryPassword.removeEventListener('blur', validate);
            fields.retryPassword.addEventListener('input', validate);
            fields.retryPassword.addEventListener('blur', validate);
        }
        
        // Champ Téléphones
        if (fields.telephones) {
            const validate = () => validateTelephonesField(fields.telephones);
            fields.telephones.removeEventListener('input', validate);
            fields.telephones.removeEventListener('blur', validate);
            fields.telephones.addEventListener('input', validate);
            fields.telephones.addEventListener('blur', validate);
        }
    }
    
    function clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(msg => msg.remove());
        document.querySelectorAll('.error-border, .valid-border').forEach(field => {
            field.classList.remove('error-border', 'valid-border');
        });
    }
    
    function validateFormBeforeSubmit() {
        const fields = getFields();
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
        
        // Validation Email
        if (!validateSingleField(fields.email, regex.email, "Email professionnel", true, "Format d'email invalide (ex: nom@domaine.com)")) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.email;
        }
        
        // Validation Login
        if (!validateLoginField(fields.login)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.login;
        }
        
        // Validation Mot de passe
        if (!validatePasswordField(fields.password)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.password;
        }
        
        // Validation Confirmation mot de passe
        if (!validatePasswordMatch()) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.retryPassword;
        }
        
        // Validation Téléphones (optionnel)
        if (!validateTelephonesField(fields.telephones)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.telephones;
        }
        
        if (!isValid && firstInvalidField) {
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidField.focus();
        }
        
        return isValid;
    }
    
    function resetForm() {
        const formElem = document.getElementById('addVendeurForm');
        if (formElem) formElem.reset();
        
        // Réinitialiser le rôle à la valeur par défaut
        if (roleSelect) roleSelect.value = 'vendeur';
        
        clearAllErrors();
    }
    
    // Ré-attacher les validations à chaque ouverture
    showBtn.addEventListener('click', () => {
        resetForm();
        modal.style.display = 'flex';
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
    
    setTimeout(() => {
        attachRealtimeValidations();
    }, 100);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        attachRealtimeValidations();
        
        const isValid = validateFormBeforeSubmit();
        if (!isValid) return;
        
        const fields = getFields();
        
        // Traitement des téléphones
        let telephones = [];
        if (fields.telephones && fields.telephones.value.trim()) {
            telephones = fields.telephones.value.split(',').map(t => t.trim()).filter(t => t);
        }
        
        const vendeurData = {
            username: fields.login.value,
            password: fields.password.value,
            name: fields.nom.value,
            surname: fields.prenom.value,
            mail: fields.email.value,
            phone: telephones,
            role: fields.role.value,
            actif: true
        };
        
        try {
            const response = await fetch('/api/register/employee', {
                credentials: "include",
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vendeurData)
            });
            
            if (response.ok) {
                const result = await response.json();
                modal.style.display = 'none';
                resetForm();
                
                if (window.loadVendeurs) {
                    await window.loadVendeurs();
                }
                
                alert(result.message || 'Vendeur créé avec succès !');
            } else {
                const error = await response.json();
                alert(`Erreur lors de la création du vendeur: ${error.detail || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.error('Erreur création vendeur:', error);
            alert('Erreur réseau');
        }
    });
    
}