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
                
                sessionStorage.setItem("username", data.username)
                sessionStorage.setItem("role", data.role)

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