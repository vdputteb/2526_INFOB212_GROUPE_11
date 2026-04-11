// static/js/base/base_main.js
// Gestion dynamique de la navigation et des états utilisateur

class NavigationManager {
    constructor() {
        this.sessionVendeur = false;
        this.selectedClient = null;
        this.init();
    }

    async init() {
        await this.checkSession();
        this.setupEventListeners();
        this.updateNavigation();
    }

    async checkSession() {
        try {
            const response = await fetch('/api/auth/session');
            if (response.ok) {
                const data = await response.json();
                this.sessionVendeur = data.isAuthenticated || false;
                if (this.sessionVendeur && data.client) {
                    this.selectedClient = data.client;
                }
            }
        } catch (error) {
            console.error('Erreur session:', error);
        }
    }

    setupEventListeners() {
        document.body.addEventListener('click', async (e) => {
            const logoutBtn = e.target.closest('#logoutLink');
            if (logoutBtn) {
                e.preventDefault();
                await this.logout();
            }
        });
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/auth';
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            window.location.href = '/auth';
        }
    }

    updateNavigation() {
        const navMenu = document.querySelector('nav ul');
        const header = document.querySelector('header');
        
        if (!navMenu) return;

        if (this.sessionVendeur) {
            this.showVendeurMenu(navMenu);
            this.showClientContext(header);
        } else {
            this.showPublicMenu(navMenu);
            this.hideClientContext(header);
        }
    }

    showVendeurMenu(navMenu) {
        const menuItems = [
            { href: '/vendeur/dashboard', text: 'Tableau de bord', id: 'dashboard-link' },
            { href: '/client/shop', text: 'Catalogue client', id: 'shop-link' },
            { href: '/client/basket', text: 'Panier client', id: 'basket-link' },
            { href: '/auth', text: 'Déconnexion', id: 'logoutLink', class: 'btn-connexion' }
        ];

        navMenu.innerHTML = '';
        menuItems.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.href;
            a.textContent = item.text;
            a.id = item.id;
            if (item.class) a.className = item.class;
            li.appendChild(a);
            navMenu.appendChild(li);
        });
    }

    showPublicMenu(navMenu) {
        navMenu.innerHTML = '';
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '/auth';
        a.textContent = 'Connexion vendeur';
        li.appendChild(a);
        navMenu.appendChild(li);
    }

    showClientContext(header) {
        let contextContainer = document.querySelector('.client-context-wrapper');
        
        if (!contextContainer) {
            contextContainer = document.createElement('div');
            contextContainer.className = 'client-context-wrapper';
            const firstHeaderContainer = header.querySelector('.header-container');
            if (firstHeaderContainer && firstHeaderContainer.parentNode) {
                firstHeaderContainer.parentNode.insertBefore(contextContainer, firstHeaderContainer.nextSibling);
            }
        }

        contextContainer.innerHTML = '';
        const newHeaderContainer = document.createElement('div');
        newHeaderContainer.className = 'header-container';
        newHeaderContainer.style.marginTop = '10px';
        newHeaderContainer.style.paddingTop = '10px';
        newHeaderContainer.style.borderTop = '1px solid #34495e';

        const clientDiv = document.createElement('div');
        clientDiv.className = 'client-context';

        if (this.selectedClient) {
            const spanLabel = document.createElement('span');
            spanLabel.textContent = '👥 Client actuel :';
            const strongName = document.createElement('strong');
            strongName.textContent = `${this.selectedClient.prenom} ${this.selectedClient.nom}`;
            const spanEmail = document.createElement('span');
            spanEmail.textContent = `(${this.selectedClient.email})`;
            const changeLink = document.createElement('a');
            changeLink.href = '/vendeur/dashboard';
            changeLink.className = 'change-client-link';
            changeLink.textContent = 'Changer de client';
            clientDiv.appendChild(spanLabel);
            clientDiv.appendChild(strongName);
            clientDiv.appendChild(spanEmail);
            clientDiv.appendChild(changeLink);
        } else {
            clientDiv.style.backgroundColor = '#fff3e0';
            const spanText = document.createElement('span');
            spanText.textContent = 'Aucun client sélectionné';
            const changeLink = document.createElement('a');
            changeLink.href = '/vendeur/dashboard';
            changeLink.className = 'change-client-link';
            changeLink.textContent = 'Sélectionner un client';
            clientDiv.appendChild(spanText);
            clientDiv.appendChild(changeLink);
        }

        const badgeDiv = document.createElement('div');
        badgeDiv.className = 'vendeur-badge';
        badgeDiv.textContent = 'Mode vendeur';

        newHeaderContainer.appendChild(clientDiv);
        newHeaderContainer.appendChild(badgeDiv);
        contextContainer.appendChild(newHeaderContainer);
    }

    hideClientContext(header) {
        const contextContainer = document.querySelector('.client-context-wrapper');
        if (contextContainer) contextContainer.remove();
    }
}

// Initialisation de la navigation uniquement (plus de panier global)
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});