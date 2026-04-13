document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const modal = document.getElementById('authModal');
    const modalClose = document.querySelector('.auth-modal-close');
    const modalOkBtn = document.getElementById('modalOkBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');

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

    // Déconnexion forcée lors de l'arrivée sur la page
    if (sessionStorage.getItem("userID"))
        sessionStorage.removeItem("userID")
        window.location.href = "/logout"



    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginusername').value;
        const mail = document.getElementById('loginmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username,mail, password })
            });

            const data = await response.json();

            if (data.success) {
                showModal('Login successful', 'Redirecting to the dashboard...');
                sessionStorage.setItem("userID",username)
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1500);
            } else {
                showModal('Erreur', data.error || 'Identifiants invalides', true);
            }
        } catch (error) {
            showModal('Erreur', 'Erreur de connexion au serveur', true);
        }
    });
});