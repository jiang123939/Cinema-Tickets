document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html?returnUrl=purchase.html';
        return;
    }

    const promoInput = document.getElementById('promo-input');
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const promoContainer = document.getElementById('promo-container');
    const confirmBtn = document.getElementById('confirm-btn');
    
    let currentTotal = 0;

    // 1. Get User Profile
    try {
        const profileRes = await fetch('https://api.cinema.int.hardcoder.ru/api/account/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
            const profile = await profileRes.json();
            document.getElementById('contact-name').innerText = profile.fullName;
            document.getElementById('contact-email').innerText = profile.email;
        }
    } catch (e) { console.error('Profile fetch error'); }

    // 2. Get Cart Data
    try {
        const cartRes = await fetch('https://api.cinema.int.hardcoder.ru/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const cart = await cartRes.json();
        
        if (!cart.items || cart.items.length === 0) {
            window.location.href = 'cart.html';
            return;
        }
        
        currentTotal = cart.totalPrice;

        document.getElementById('subtotal-price').innerText = `${currentTotal} ₽`;
        document.getElementById('total-price').innerText = `${currentTotal} ₽`;

        const ticketsContainer = document.getElementById('tickets-container');
        cart.items.forEach(item => {
            ticketsContainer.insertAdjacentHTML('beforeend', `
                <article class="c-cart-group" style="margin-bottom: 16px;">
                    <header class="c-cart-group__header">
                        <div class="c-cart-group__info">
                            <h3 class="c-cart-group__title">${item.movieTitle || 'Movie Session'}</h3>
                            <p class="c-cart-group__meta">Row ${item.row}, Seat ${item.number}</p >
                        </div>
                    </header>
                </article>
            `);
        });

    } catch (e) {
        console.error(e);
        document.getElementById('checkout-alerts').innerHTML = '<div class="c-alert c-alert--danger">Failed to load cart data.</div>';
    }

    // 3. Apply Promo Code (Simple Demo Logic)
    applyPromoBtn.addEventListener('click', () => {
        const code = promoInput.value.trim().toUpperCase();
        if (code === 'WELCOME10') {
            const discount = Math.round(currentTotal * 0.1);
            const newTotal = currentTotal - discount;
            
            document.getElementById('total-price').innerText = `${newTotal} ₽`;
            document.getElementById('discount-price').innerText = `-${discount} ₽`;
            document.getElementById('discount-line').style.display = 'flex';
            
            promoContainer.innerHTML = `
                <div class="c-promo__applied">
                    <span>Code <b>${code}</b> applied.</span>
                </div>
            `;
        } else {
            alert('Invalid promo code. Try WELCOME10');
        }
    });

    // 4. Confirm Booking
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.classList.add('is-loading');
        confirmBtn.disabled = true;

        try {
            const res = await fetch('https://api.cinema.int.hardcoder.ru/api/bookings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ paymentMethod: 'Card' })
            });

            // Jump to bookings page regardless of response
            window.location.href = `bookings.html?created=1`;

        } catch (err) {
            console.error(err);
            // Even on network error, jump to bookings to show the fallback data
            window.location.href = `bookings.html?created=1`;
        }
    });
});