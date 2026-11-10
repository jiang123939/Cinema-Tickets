document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('accessToken');
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id');

    if (!token || !bookingId) {
        window.location.href = 'bookings.html';
        return;
    }

    try {
        const res = await fetch(`https://api.cinema.int.hardcoder.ru/api/bookings/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load booking');
        
        const booking = await res.json();
        
        document.getElementById('booking-header').innerHTML = `
            <div class="c-page-title__main">
                <h1>Booking ${booking.code}</h1>
                <span class="c-status c-status--${booking.status.toLowerCase()}">${booking.status}</span>
            </div>
        `;

        document.getElementById('booking-details-list').innerHTML = `
            <div class="c-dl__row"><dt class="c-dl__term">Created</dt><dd class="c-dl__desc">${new Date(booking.createdAt).toLocaleString()}</dd></div>
            <div class="c-dl__row"><dt class="c-dl__term">Payment</dt><dd class="c-dl__desc">${booking.paymentMethod}</dd></div>
            <div class="c-dl__row"><dt class="c-dl__term">Email</dt><dd class="c-dl__desc">${booking.contactEmail}</dd></div>
            <div class="c-dl__row"><dt class="c-dl__term">Total</dt><dd class="c-dl__desc">${booking.total} ₽</dd></div>
        `;

        const tbody = document.getElementById('ticket-tbody');
        booking.tickets.forEach(ticket => {
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${ticket.row}</td>
                    <td>${ticket.number}</td>
                    <td>${ticket.seatType}</td>
                    <td class="c-table__num">${ticket.price} ₽</td>
                </tr>
            `);
        });

    } catch (err) {
        document.getElementById('booking-header').innerHTML = `<h1 class="c-alert c-alert--danger">Booking not found or access denied.</h1>`;
        document.getElementById('details-grid').style.display = 'none';
    }
});