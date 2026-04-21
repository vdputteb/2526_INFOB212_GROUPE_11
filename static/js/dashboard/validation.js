// validation.js - Fonctions de validation réutilisables

// ========== REGEX DE VALIDATION ==========
export const regex = {
    // Champs texte de base
    name: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
    surname: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
    
    // Email
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    
    // Téléphone (international)
    telephone: /^(\+?[0-9]{1,4}[\s\-]?)?([0-9\s\-]{6,20})$/,
    
    // Date de naissance
    birthDate: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    
    // Argent
    money: /^\d+(\.\d{1,2})?$/,
    
    // Champs Sorcier
    wizardRegistry: /^[0-9]{1,10}$/,
    chimney: /^[a-zA-ZÀ-ÿ0-9\s\-']{2,100}$/,
    schoolName: /^[a-zA-ZÀ-ÿ\s\-']{2,100}$/,
    house: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/,
    country: /^[a-zA-ZÀ-ÿ\s\-']{2,100}$/,
    flightLicence: /^[0-5]$/,
    owl: /^[a-zA-ZÀ-ÿ\s\-']+#[0-9]{3}$/,
    
    // Champs Moldu
    nationalRegister: /^[0-9]{1,15}$/,
    street: /^[a-zA-ZÀ-ÿ0-9\s\-']{2,150}$/,
    city: /^[a-zA-ZÀ-ÿ\s\-']{2,100}$/,
    houseNumber: /^[0-9]{1,5}[a-zA-Z]?$/
};

// ========== FONCTIONS UTILITAIRES ==========

// Supprimer un message d'erreur existant
export function removeErrorMessage(inputElement) {
    const existingError = inputElement.parentElement?.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    inputElement.classList.remove('error-border', 'error-shake');
}

// Supprimer l'indicateur de succès
export function removeSuccessBorder(inputElement) {
    inputElement.classList.remove('valid-border');
}

// Afficher un message d'erreur sous un champ
export function showErrorMessage(inputElement, message, shake = true) {
    removeErrorMessage(inputElement);
    
    inputElement.classList.add('error-border');
    if (shake) {
        inputElement.classList.add('error-shake');
        setTimeout(() => {
            inputElement.classList.remove('error-shake');
        }, 300);
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    if (inputElement.parentElement) {
        inputElement.parentElement.appendChild(errorDiv);
    }
}

// Afficher un indicateur de succès
export function showSuccessIndicator(inputElement) {
    removeErrorMessage(inputElement);
    inputElement.classList.remove('error-border');
    inputElement.classList.add('valid-border');
}

// Valider un champ avec une regex
export function validateField(value, regexPattern, fieldName, required = true) {
    const trimmedValue = value?.trim() || '';
    
    if (required && !trimmedValue) {
        return { valid: false, message: `Le champ "${fieldName}" est requis.` };
    }
    
    if (!required && !trimmedValue) {
        return { valid: true };
    }
    
    if (!regexPattern.test(trimmedValue)) {
        return { valid: false, message: `Le champ "${fieldName}" n'est pas valide.` };
    }
    
    return { valid: true };
}

// Valider l'âge (18 ans minimum)
export function validateAge(birthDateStr) {
    if (!birthDateStr) {
        return { valid: false, message: "La date de naissance est requise." };
    }
    
    const today = new Date();
    const birth = new Date(birthDateStr);
    
    if (isNaN(birth.getTime())) {
        return { valid: false, message: "Date de naissance invalide." };
    }
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    if (age < 18) {
        return { valid: false, message: "Le client doit avoir au moins 18 ans." };
    }
    
    if (age > 120) {
        return { valid: false, message: "Âge invalide (maximum 120 ans)." };
    }
    
    return { valid: true };
}

// Valider une liste de téléphones
export function validateTelephones(telephonesStr, required = false) {
    const trimmed = telephonesStr?.trim() || '';
    
    if (!required && !trimmed) {
        return { valid: true, phones: [] };
    }
    
    if (required && !trimmed) {
        return { valid: false, message: "Au moins un numéro de téléphone est requis." };
    }
    
    const phones = trimmed.split(',').map(p => p.trim()).filter(p => p);
    
    if (required && phones.length === 0) {
        return { valid: false, message: "Au moins un numéro de téléphone est requis." };
    }
    
    for (let phone of phones) {
        if (!regex.telephone.test(phone)) {
            return { valid: false, message: `Numéro invalide: "${phone}". Format: +32 471 12 34 56` };
        }
    }
    
    return { valid: true, phones };
}

// Valider une liste de hiboux
export function validateOwls(owlsStr, required = false) {
    const trimmed = owlsStr?.trim() || '';
    
    if (!required && !trimmed) {
        return { valid: true, owls: [] };
    }
    
    const owls = trimmed.split(',').map(o => o.trim()).filter(o => o);
    
    for (let owl of owls) {
        if (!regex.owl.test(owl)) {
            return { valid: false, message: `Hibou invalide: "${owl}". Format attendu: Nom#001` };
        }
    }
    
    return { valid: true, owls };
}

// Valider le montant d'argent
export function validateMoney(value, required = false) {
    const trimmed = value?.trim() || '';
    
    if (!required && !trimmed) {
        return { valid: true, amount: 0 };
    }
    
    if (required && !trimmed) {
        return { valid: false, message: "Le montant d'argent est requis." };
    }
    
    if (!regex.money.test(trimmed)) {
        return { valid: false, message: "Montant invalide. Utilisez un nombre positif (ex: 100 ou 100.50)." };
    }
    
    const amount = parseFloat(trimmed);
    if (amount < 0) {
        return { valid: false, message: "Le montant ne peut pas être négatif." };
    }
    
    return { valid: true, amount };
}

// Configurer la validation en temps réel sur un champ
export function setupRealtimeValidation(inputElement, regexPattern, fieldName, required = true, customMessage = null) {
    if (!inputElement) return;
    
    const validate = () => {
        const value = inputElement.value;
        const validation = validateField(value, regexPattern, fieldName, required);
        
        if (validation.valid) {
            showSuccessIndicator(inputElement);
        } else if (value.trim() !== '' || required) {
            showErrorMessage(inputElement, customMessage || validation.message, false);
        } else {
            removeErrorMessage(inputElement);
            inputElement.classList.remove('error-border', 'valid-border');
        }
    };
    
    inputElement.addEventListener('input', validate);
    inputElement.addEventListener('blur', validate);
    
    return validate;
}