// Constantes
const STATUS_MAP = {
    'Pending': 'En attente',
    'in Progress': 'En cours',
    'In Progress': 'En cours',
    'finished': 'Terminé',
    'Finished': 'Terminé',
    'Processing': 'En traitement',
    'In transit': 'En transit',
    'Cancelled': 'Annulé',
    'in location': 'En location',
    'in stock': 'En stock',
    'sold': 'Vendu'
};

// Fonctions utilitaires
export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export function formatCurrency(amount) {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(numAmount || 0);
}

export function getStatusText(status) {
    if (!status) return 'Inconnu';
    return STATUS_MAP[status] || STATUS_MAP[status.toLowerCase()] || status;
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export function clearElement(element) {
    if (element && element.firstChild) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}

export function createElement(tag, className, text = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
}

// Appels API
export async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`/api${url}`, options);
    
    if (!response.ok) {
        let errorMessage;
        try {
            const error = await response.json();
            errorMessage = error.detail || error.message || `Erreur ${response.status}`;
        } catch (e) {
            errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    
    const result = await response.json();
    return result;
}

export function showNotification(message, type = 'success') {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = createElement('div', `notification notification-${type}`, message);
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        zIndex: '10000',
        animation: 'slideIn 0.3s ease',
        backgroundColor: type === 'success' ? '#4CAF50' : (type === 'warning' ? '#ff9800' : '#f44336'),
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        fontSize: '14px',
        fontWeight: '500'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 300);
    }, 3000);
}

// Ajouter du CSS pour l'animation
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}