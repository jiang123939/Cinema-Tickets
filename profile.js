document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { window.location.href = 'login.html'; return; }

    const form = document.getElementById('profile-form');
    const saveBtn = document.getElementById('save-btn');

    try {
        const response = await fetch('https://api.cinema.int.hardcoder.ru/api/account/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed');
        
        const data = await response.json();
        document.getElementById('prof-email').innerText = data.email;
        document.getElementById('prof-gender').innerText = data.gender;
        document.getElementById('prof-name').value = data.fullName;
        document.getElementById('prof-birth').value = data.birthDate;
        document.getElementById('prof-phone').value = data.phoneNumber;
    } catch (error) {
        console.error(error);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveBtn.classList.add('is-loading');
        saveBtn.disabled = true;

        const payload = {
            fullName: document.getElementById('prof-name').value,
            birthDate: document.getElementById('prof-birth').value,
            phoneNumber: document.getElementById('prof-phone').value
        };

        try {
            const response = await fetch('https://api.cinema.int.hardcoder.ru/api/account/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Profile updated successfully.');
            } else {
                alert('Failed to update profile.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            saveBtn.classList.remove('is-loading');
            saveBtn.disabled = false;
        }
    });
});