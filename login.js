document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorContainer = document.getElementById('error-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorContainer.innerHTML = ''; // Clear previous errors

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) return;

        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch('https://api.cinema.int.hardcoder.ru/api/account/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                
                // Redirect logic based on URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const returnUrl = urlParams.get('returnUrl');
                window.location.href = returnUrl ? decodeURIComponent(returnUrl) : 'index.html';
            } else {
                errorContainer.innerHTML = `
                    <div class="c-alert c-alert--danger" role="alert">
                        <div class="c-alert__body"><p>Invalid email or password.</p ></div>
                    </div>
                `;
                passwordInput.value = '';
            }
        } catch (error) {
            errorContainer.innerHTML = `
                <div class="c-alert c-alert--danger" role="alert">
                    <div class="c-alert__body"><p>The server is unavailable. Try again later.</p ></div>
                </div>
            `;
        } finally {
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
        }
    });
});