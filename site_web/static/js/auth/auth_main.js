// auth_main.js - Gestion de l'authentification

document.addEventListener('DOMContentLoaded', () => {
    // Gestion des onglets
    const tabBtns = document.querySelectorAll('.tab-btn');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Mettre à jour les onglets
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Afficher le bon formulaire
            if (tab === 'login') {
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
            } else {
                registerTab.classList.add('active');
                loginTab.classList.remove('active');
            }
        });
    });

    // Gestion de la connexion
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Logique de connexion à implémenter
    });

    // Gestion de l'inscription
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Logique d'inscription à implémenter
    });

    // Gestion du modal
    const modal = document.getElementById('authModal');
    const modalClose = document.querySelector('.auth-modal-close');
    const modalOkBtn = document.getElementById('modalOkBtn');

    function closeModal() {
        modal.style.display = 'none';
    }

    modalClose.addEventListener('click', closeModal);
    modalOkBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
});