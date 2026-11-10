document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('accessToken');
    const guestSection = document.getElementById('auth-guest');
    const userSection = document.getElementById('auth-user');
    const emailDisplay = document.getElementById('header-email');
    const logoutBtn = document.getElementById('logout-btn');

    if (!guestSection || !userSection) return;

    if (token) {
        guestSection.style.display = 'none';
        userSection.style.display = 'flex';

        try {
            const response = await fetch('https://api.cinema.int.hardcoder.ru/api/account/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const profile = await response.json();
                emailDisplay.innerText = profile.email;
            } else {
                handleLogout();
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
        }

        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    } else {
        guestSection.style.display = 'flex';
        userSection.style.display = 'none';
    }

    function handleLogout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = 'index.html';
    }
});