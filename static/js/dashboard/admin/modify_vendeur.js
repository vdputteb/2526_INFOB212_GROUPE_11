import { 
    regex, 
    removeErrorMessage, 
    showErrorMessage, 
    showSuccessIndicator,
    validateField, 
    validateTelephones, 
    validateMoney,
    setupRealtimeValidation
} from '../validation.js';

// Variable globale pour stocker la fonction openModal
let globalOpenModal = null;

export function setupModifyVendeur() {
    const modal = document.getElementById('modifyVendeurModal');
    if (!modal) {
        console.error('Modal modifyVendeurModal non trouvé');
        return;
    }
    
    const closeBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('modifyVendeurForm');
    
    if (!form) {
        console.error('Formulaire modifyVendeurForm non trouvé');
        return;
    }
    
    let currentVendeurId = null;

    function getFields() {
        return {
            nom: document.getElementById('modifyVendeurNom'),
            prenom: document.getElementById('modifyVendeurPrenom'),
            email: document.getElementById('modifyVendeurMail'),
            login: document.getElementById('modifyVendeurLogin'),
            role: document.getElementById('modifyVendeurRole'),
            telephones: document.getElementById('modifyVendeurTelephones'),
            password: document.getElementById('modifyVendeurPassword'),
            retryPassword: document.getElementById('modifyRetryVendeurPassword')
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
    
    function validateLoginField(field) {
        if (!field) return true;
        
        const value = field.value;
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
        
        // Si le champ est vide, on ne valide pas (modification optionnelle)
        if (!value.trim()) {
            removeErrorMessage(field);
            field.classList.remove('error-border', 'valid-border');
            return true;
        }
        
        const passwordRegex = /^.{6,}$/;
        const validation = validateField(value, passwordRegex, "Mot de passe", false);
        
        if (validation.valid) {
            showSuccessIndicator(field);
            validatePasswordMatch();
            return true;
        } else {
            showErrorMessage(field, "Le mot de passe doit contenir au moins 6 caractères.");
            return false;
        }
    }
    
    function validatePasswordMatch() {
        const fields = getFields();
        const password = fields.password?.value || '';
        const retryPassword = fields.retryPassword?.value || '';
        
        if (!fields.password || !fields.retryPassword) return true;
        
        // Si les deux champs sont vides, c'est valide (pas de modification du mot de passe)
        if (!password && !retryPassword) {
            removeErrorMessage(fields.retryPassword);
            fields.retryPassword.classList.remove('error-border', 'valid-border');
            return true;
        }
        
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
    
    function attachRealtimeValidations() {
        const fields = getFields();
        
        if (fields.nom) {
            const validate = () => validateSingleField(fields.nom, regex.name, "Nom", true);
            fields.nom.removeEventListener('input', validate);
            fields.nom.removeEventListener('blur', validate);
            fields.nom.addEventListener('input', validate);
            fields.nom.addEventListener('blur', validate);
        }
        
        if (fields.prenom) {
            const validate = () => validateSingleField(fields.prenom, regex.surname, "Prénom", true);
            fields.prenom.removeEventListener('input', validate);
            fields.prenom.removeEventListener('blur', validate);
            fields.prenom.addEventListener('input', validate);
            fields.prenom.addEventListener('blur', validate);
        }
        
        if (fields.email) {
            const validate = () => validateSingleField(fields.email, regex.email, "Email professionnel", true, "Format d'email invalide (ex: nom@domaine.com)");
            fields.email.removeEventListener('input', validate);
            fields.email.removeEventListener('blur', validate);
            fields.email.addEventListener('input', validate);
            fields.email.addEventListener('blur', validate);
        }
        
        if (fields.login) {
            const validate = () => validateLoginField(fields.login);
            fields.login.removeEventListener('input', validate);
            fields.login.removeEventListener('blur', validate);
            fields.login.addEventListener('input', validate);
            fields.login.addEventListener('blur', validate);
        }
        
        if (fields.telephones) {
            const validate = () => validateTelephonesField(fields.telephones);
            fields.telephones.removeEventListener('input', validate);
            fields.telephones.removeEventListener('blur', validate);
            fields.telephones.addEventListener('input', validate);
            fields.telephones.addEventListener('blur', validate);
        }
        
        if (fields.password) {
            const validate = () => validatePasswordField(fields.password);
            fields.password.removeEventListener('input', validate);
            fields.password.removeEventListener('blur', validate);
            fields.password.addEventListener('input', validate);
            fields.password.addEventListener('blur', validate);
        }
        
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
    }
    
    function clearAllErrors() {
        document.querySelectorAll('.error-message').forEach(msg => msg.remove());
        document.querySelectorAll('.error-border, .valid-border').forEach(field => {
            field.classList.remove('error-border', 'valid-border');
        });
    }
    
    async function loadVendeurData(vendeurId) {
        try {
            const response = await fetch('/api/vendeurs', {
                credentials: "include",
                method: "GET"
            });
            const data = await response.json();
            
            if (data.success && data.vendeurs) {
                const vendeur = data.vendeurs.find(v => v.id_employee === vendeurId);
                if (!vendeur) return;
                
                const fields = getFields();
                
                if (fields.nom) fields.nom.value = vendeur.name || '';
                if (fields.prenom) fields.prenom.value = vendeur.surname || '';
                if (fields.email) fields.email.value = vendeur.mail_pro || '';
                if (fields.login) fields.login.value = vendeur.login || '';
                
                // Récupérer le rôle
                if (fields.role) {
                    if (vendeur.role) {
                        fields.role.value = vendeur.role;
                    } else {
                        // Déterminer le rôle basé sur id_patron (compatibilité ascendante)
                        fields.role.value = vendeur.id_patron === null ? 'patron' : 'vendeur';
                    }
                }
                
                // Récupérer les téléphones
                const phones = [vendeur.tel1, vendeur.tel2, vendeur.tel3].filter(t => t && t.trim());
                if (fields.telephones) fields.telephones.value = phones.join(', ');
                
                // Réinitialiser les champs de mot de passe
                if (fields.password) fields.password.value = '';
                if (fields.retryPassword) fields.retryPassword.value = '';
            }
        } catch (error) {
            console.error('Erreur chargement vendeur:', error);
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
        
        if (!validateSingleField(fields.email, regex.email, "Email professionnel", true, "Format d'email invalide (ex: nom@domaine.com)")) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.email;
        }
        
        if (!validateLoginField(fields.login)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.login;
        }
        
        if (!validateTelephonesField(fields.telephones)) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = fields.telephones;
        }
        
        // Validation du mot de passe seulement si un nouveau est fourni
        if (fields.password && fields.password.value.trim()) {
            if (!validatePasswordField(fields.password)) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.password;
            }
            
            if (!validatePasswordMatch()) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = fields.retryPassword;
            }
        }
        
        if (!isValid && firstInvalidField) {
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidField.focus();
        }
        
        return isValid;
    }
    
    function resetForm() {
        const formElem = document.getElementById('modifyVendeurForm');
        if (formElem) formElem.reset();
        
        clearAllErrors();
    }
    
    async function openModal() {
        const vendeur = window.currentVendeur;
        if (!vendeur) {
            alert('Veuillez d\'abord sélectionner un vendeur');
            return;
        }
        
        currentVendeurId = vendeur.id_employee;
        resetForm();
        await loadVendeurData(currentVendeurId);
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
    
    const cancelBtn = document.getElementById('cancelModifyVendeurBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            resetForm();
        });
    }
    
    form.addEventListener('submit', async (e) => {
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
            id_employee: currentVendeurId,
            username: fields.login.value,
            name: fields.nom.value,
            surname: fields.prenom.value,
            mail: fields.email.value,
            phone: telephones,
            role: fields.role.value,
        };
        
        // Ajouter le mot de passe seulement s'il a été modifié
        if (fields.password && fields.password.value.trim()) {
            vendeurData.password = fields.password.value;
        }
        
        try {
            const response = await fetch('/api/modify/vendeur', {
                credentials: "include",
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vendeurData)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    modal.style.display = 'none';
                    resetForm();
                    
                    if (window.loadVendeurs) {
                        await window.loadVendeurs();
                    }
                    
                    if (window.currentVendeur && window.currentVendeur.id_employee === currentVendeurId) {
                        if (window.selectVendeur) {
                            await window.selectVendeur(currentVendeurId);
                        }
                    }
                    
                    alert(result.message || 'Vendeur modifié avec succès !');
                } else {
                    throw new Error(result.detail || result.message);
                }
            } else {
                const error = await response.json();
                alert(`Erreur lors de la modification: ${error.detail || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.error('Erreur modification vendeur:', error);
            alert('Erreur réseau lors de la modification: ' + error.message);
        }
    });
}

export function addModifyVendeurButton() {
    const actionsDiv = document.querySelector('#vendeurInfo .actions');
    if (actionsDiv && !document.getElementById('modifyVendeurMainBtn')) {
        // Modifier le bouton existant ou en ajouter un nouveau
        const existingModifyBtn = document.getElementById('modifyVendeurBtn');
        
        if (existingModifyBtn) {
            // Remplacer l'ancien bouton par le nouveau qui utilise notre modal
            const newModifyBtn = document.createElement('button');
            newModifyBtn.id = 'modifyVendeurMainBtn';
            newModifyBtn.className = 'btn-action';
            newModifyBtn.textContent = '✏️ Modifier le vendeur';
            newModifyBtn.style.backgroundColor = '#3498db';
            newModifyBtn.style.borderColor = '#3498db';
            newModifyBtn.style.color = 'white';
            
            newModifyBtn.addEventListener('click', () => {
                if (globalOpenModal) {
                    globalOpenModal();
                } else {
                    console.error('globalOpenModal n\'est pas défini');
                    alert('Fonctionnalité de modification non disponible. Veuillez rafraîchir la page.');
                }
            });
            
            existingModifyBtn.parentNode.replaceChild(newModifyBtn, existingModifyBtn);
        } else {
            // Créer un nouveau bouton
            const modifyBtn = document.createElement('button');
            modifyBtn.id = 'modifyVendeurMainBtn';
            modifyBtn.className = 'btn-action';
            modifyBtn.textContent = '✏️ Modifier le vendeur';
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
        }
        
        console.log('Bouton modifier vendeur ajouté');
    }
}