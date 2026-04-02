// Notifications
let notificationElement = null;

export function showNotification(message, type = "info") {
    if (!notificationElement) {
        notificationElement = document.createElement('div');
        notificationElement.id = 'notification';
        notificationElement.style.position = 'fixed';
        notificationElement.style.top = '20px';
        notificationElement.style.right = '20px';
        notificationElement.style.padding = '12px 20px';
        notificationElement.style.borderRadius = '8px';
        notificationElement.style.zIndex = '1000';
        notificationElement.style.fontSize = '14px';
        notificationElement.style.fontWeight = 'bold';
        notificationElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        notificationElement.style.transition = 'all 0.3s ease';
        document.body.appendChild(notificationElement);
    }
    
    const colors = {
        success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
        error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
        info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' }
    };
    
    const color = colors[type] || colors.info;
    notificationElement.style.backgroundColor = color.bg;
    notificationElement.style.color = color.text;
    notificationElement.style.border = `1px solid ${color.border}`;
    notificationElement.textContent = message;
    notificationElement.style.display = 'block';
    
    setTimeout(() => {
        notificationElement.style.opacity = '0';
        setTimeout(() => {
            if (notificationElement) {
                notificationElement.style.display = 'none';
                notificationElement.style.opacity = '1';
            }
        }, 300);
    }, 3000);
}

// Calculs d'état
export function getEtatPercentage(nbUtilisation, maxUtilisation = 500) {
    const percentage = (nbUtilisation / maxUtilisation) * 100;
    return Math.min(percentage, 100);
}

export function getEtatColor(percentage) {
    if (percentage >= 75) return '#27ae60';
    if (percentage >= 50) return '#f39c12';
    return '#e74c3c';
}

export function getEtatText(etat, percentage) {
    if (etat === "neuf") return "Neuf";
    if (percentage >= 75) return "Très bon état";
    if (percentage >= 50) return "Bon état";
    if (percentage >= 25) return "État correct";
    return "Usé";
}