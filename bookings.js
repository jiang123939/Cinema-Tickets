document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { window.location.href = 'login.html'; return; }

    const container = document.getElementById('bookings-container');
    const alertsContainer = document.getElementById('bookings-alerts');

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('created')) {
        alertsContainer.innerHTML = `
            <div class="c-alert c-alert--success" role="status">
                <div class="c-alert__body"><p>Booking created. The cart is empty.</p ></div>
            </div>
        `;
    }

    try {
        const res = await fetch('https://api.cinema.int.hardcoder.ru/api/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch');
        
        const bookings = await res.json();

        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="c-empty">
                    <div class="c-empty__icon"><svg class="c-icon c-icon--lg"><use href="cinema-kit/kit/icons.svg#icon-ticket"></use></svg></div>
                    <h2 class="c-empty__title">There are no bookings yet</h2>
                    <div class="c-empty__action"><a class="c-btn c-btn--primary" href=" ">Browse movies</a ></div>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        
        bookings.forEach(booking => {
            const statusClass = booking.status === 'Active' ? 'c-status--active' : (booking.status === 'Cancelled' ? 'c-status--cancelled' : 'c-status--completed');
            const actionHtml = booking.status === 'Active' ? `<button class="c-btn c-btn--secondary c-btn--danger c-btn--sm cancel-btn" data-id="${booking.id}">Cancel booking</button>` : '';
            
            // Safely construct date
            const dateObj = new Date(booking.session.startsAt);
            const dateStr = dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            const article = document.createElement('article');
            article.className = 'c-booking-item';

            article.innerHTML = `
                <div class="c-poster c-poster--xs" style="background:#1F232C;"></div>
                <div class="c-booking-item__main">
                    <h3 class="c-booking-item__title">
                        <a href="booking.html?id=${booking.id}">${booking.session.movie.title || 'Movie'}</a >
                    </h3>
                    <p class="c-booking-item__meta">
                        <span>${dateStr} · ${timeStr}</span>
                        <span class="c-format">${booking.session.format === 'Imax' ? 'IMAX' : '2D'}</span>
                    </p >
                </div>
                <a class="c-booking-item__code" href="booking.html?id=${booking.id}">${booking.code}</a >
                <span class="c-booking-item__tickets">${booking.tickets.length} tickets</span>
                <span class="c-booking-item__total">${booking.total} ₽</span>
                <span class="c-status ${statusClass}">${booking.status}</span>
                <div class="c-booking-item__actions">${actionHtml}</div>
            `;
            container.appendChild(article);
        });

        // Cancel Logic
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!confirm('Are you sure you want to cancel this booking?')) return;
                const id = e.currentTarget.dataset.id;
                e.currentTarget.classList.add('is-loading');
                await fetch(`https://api.cinema.int.hardcoder.ru/api/bookings/${id}/cancel`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                window.location.reload();
            });
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="c-alert c-alert--danger">Failed to load bookings from server.</div>`;
    }
});