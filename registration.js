document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorContainer = document.getElementById('error-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorContainer.innerHTML = '';

        const fullName = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const birthDate = document.getElementById('reg-birth').value;
        const phoneInput = document.getElementById('reg-phone').value.trim();
        const genderElement = document.querySelector('input[name="gender"]:checked');

        if (!fullName || !email || !password || !birthDate || !genderElement || !phoneInput) {
            errorContainer.innerHTML = `<div class="c-alert c-alert--danger"><p>Please fill in all fields.</p ></div>`;
            return;
        }

        // Format phone number to match +7 (XXX) XXX-XX-XX
        const digits = phoneInput.replace(/\D/g, '');
        let formattedPhone = phoneInput;
        if (digits.length === 11) {
            formattedPhone = `+${digits[0]} (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 9)}-${digits.substring(9, 11)}`;
        }

        const payload = {
            fullName: fullName,
            email: email,
            password: password,
            birthDate: birthDate,
            gender: genderElement.value,
            phoneNumber: formattedPhone
        };

        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch('https://api.cinema.int.hardcoder.ru/api/account/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                window.location.href = 'index.html';
            } else {
                // Handle API validation errors
                let errorMsg = data.title || 'Registration failed.';
                if (data.errors) {
                    errorMsg = Object.values(data.errors).flat().join(' ');
                }
                errorContainer.innerHTML = `
                    <div class="c-alert c-alert--danger" role="alert">
                        <div class="c-alert__body"><p>${errorMsg}</p ></div>
                    </div>
                `;
            }
        } catch (error) {
            errorContainer.innerHTML = `
                <div class="c-alert c-alert--danger" role="alert">
                    <div class="c-alert__body"><p>Network error. Please try again later.</p ></div>
                </div>
            `;
        } finally {
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
        }
    });
});