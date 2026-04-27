document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const modal = document.getElementById('authModal');
    const modalClose = document.querySelector('.auth-modal-close');
    const modalOkBtn = document.getElementById('modalOkBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');
    
    // Références aux champs
    const emailInput = document.getElementById('loginmail');
    const usernameInput = document.getElementById('loginusername');
    const passwordInput = document.getElementById('loginPassword');
    
    // Regex pour la validation d'email (standard complet)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Variable pour suivre la validité de l'email
    let isEmailValid = true;

    document.getElementById("profil-link").style.display = "none";
    
    // Fonction pour supprimer un message d'erreur existant
    function removeErrorMessage(inputElement) {
        const existingError = inputElement.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        inputElement.classList.remove('error-border');
    }
    
    // Fonction pour afficher un message d'erreur sous un champ
    function showErrorMessage(inputElement, message) {
        // Supprimer l'ancien message s'il existe
        removeErrorMessage(inputElement);
        
        // Ajouter la classe d'erreur
        inputElement.classList.add('error-border');
        
        // Créer le message d'erreur
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Insérer après le champ
        inputElement.parentElement.appendChild(errorDiv);
    }
    
    // Fonction de validation d'email en temps réel
    function validateEmail(email) {
        if (!email || email.trim() === '') {
            return { valid: false, message: 'L\'adresse email est requise' };
        }
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Format d\'email invalide (exemple: nom@domaine.com)' };
        }
        return { valid: true, message: '' };
    }
    
    // Validation en temps réel à la saisie
    emailInput.addEventListener('input', (e) => {
        const email = e.target.value;
        const validation = validateEmail(email);
        
        isEmailValid = validation.valid;
        
        if (!validation.valid && email.trim() !== '') {
            showErrorMessage(emailInput, validation.message);
        } else {
            removeErrorMessage(emailInput);
        }
    });
    
    // Supprimer l'erreur quand le champ reprend le focus
    emailInput.addEventListener('focus', () => {
        removeErrorMessage(emailInput);
    });
    
    // Validation au blur (quand on quitte le champ)
    emailInput.addEventListener('blur', (e) => {
        const email = e.target.value;
        const validation = validateEmail(email);
        
        isEmailValid = validation.valid;
        
        if (!validation.valid) {
            showErrorMessage(emailInput, validation.message);
        }
    });

    function showModal(title, message, isError = false) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalIcon.textContent = isError ? '⚠️' : '✓';
        modalIcon.style.backgroundColor = isError ? '#e74c3c' : '#27ae60';
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    modalClose.addEventListener('click', closeModal);
    modalOkBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const mail = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validation de l'email avant envoi
        const emailValidation = validateEmail(mail);
        
        if (!emailValidation.valid) {
            showErrorMessage(emailInput, emailValidation.message);
            // Scroll jusqu'au champ email
            emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // Validation supplémentaire : username non vide
        if (!username) {
            showErrorMessage(usernameInput, 'Le nom d\'utilisateur est requis');
            usernameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // Validation : password non vide
        if (!password) {
            showErrorMessage(passwordInput, 'Le mot de passe est requis');
            passwordInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, mail, password })
            });

            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem("username", data.username);
                sessionStorage.setItem("role", data.role);

                showModal('Login successful', 'Redirecting to the dashboard...');

                setTimeout(() => {
                    window.location.href = "/dashboard";
                }, 1500);
            } else {
                showModal('Erreur', data.error || 'Identifiants invalides', true);
            }
        } catch (error) {
            showModal('Erreur', 'Erreur de connexion au serveur', true);
        }
    });
});