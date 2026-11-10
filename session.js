document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('id');
    const token = localStorage.getItem('accessToken');

    if (!sessionId) {
        window.location.href = 'index.html';
        return;
    }

    const goToCartBtn = document.getElementById('go-to-cart-btn');
    if (goToCartBtn) {
        goToCartBtn.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }

    try {
        // Fetch Session and Seats concurrently
        const [sessionRes, seatsRes] = await Promise.all([
            fetch(`https://api.cinema.int.hardcoder.ru/api/sessions/${sessionId}`),
            fetch(`https://api.cinema.int.hardcoder.ru/api/sessions/${sessionId}/seats`)
        ]);

        if (!sessionRes.ok || !seatsRes.ok) throw new Error('Failed to load session data');

        const session = await sessionRes.json();
        const seats = await seatsRes.json();

        renderHeader(session);
        renderSeatMap(seats, session, token);

    } catch (error) {
        console.error('Data fetch error:', error);
        document.getElementById('session-header').innerHTML = `<h1 class="c-alert c-alert--danger">Error loading session. Please try again later.</h1>`;
    }
});

function renderHeader(session) {
    const header = document.getElementById('session-header');
    const startTime = new Date(session.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const endTime = new Date(session.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const formatStr = session.format === 'Imax' ? 'IMAX' : (session.format === 'ThreeD' ? '3D' : '2D');

    header.innerHTML = `
        <div class="c-page-title__main">
            <h1>${session.movie.title}</h1>
            <div class="c-page-title__subtitle">
                <span class="c-page-title__item"><svg class="c-icon c-icon--sm"><use href="cinema-kit/kit/icons.svg#icon-calendar"></use></svg>${new Date(session.startsAt).toLocaleDateString()} · ${startTime}–${endTime}</span>
                <span class="c-format">${formatStr}</span>
                <span class="c-page-title__item"><svg class="c-icon c-icon--sm"><use href="cinema-kit/kit/icons.svg#icon-hall"></use></svg>${session.hall.name}</span>
                <span class="c-age">${session.movie.ageRating.replace('Age', '')}+</span>
            </div>
        </div>
    `;
}

function renderSeatMap(seats, session, token) {
    const container = document.getElementById('seat-rows');
    container.innerHTML = '';
    const rowsCount = session.hall.rowsCount;
    const seatsPerRow = session.hall.seatsPerRow;

    document.getElementById('seat-map').style.setProperty('--seat-cols', seatsPerRow);

    // Group by row
    const seatsByRow = {};
    seats.forEach(seat => {
        if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
        seatsByRow[seat.row].push(seat);
    });

    for (let r = 1; r <= rowsCount; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'c-seatmap__row';

        const leftLabel = document.createElement('span');
        leftLabel.className = 'c-seatmap__label';
        leftLabel.innerText = r;
        rowDiv.appendChild(leftLabel);

        const rowSeats = (seatsByRow[r] || []).sort((a, b) => a.number - b.number);

        rowSeats.forEach(seat => {
            const btn = document.createElement('button');
            btn.className = 'c-seat';
            btn.type = 'button';
            
            // Store IDs for API calls
            btn.dataset.seatId = seat.id; 
            btn.dataset.row = seat.row;
            btn.dataset.number = seat.number;
            btn.dataset.price = seat.price;
            btn.dataset.cartId = seat.cartItemId || '';

            if (seat.type === 'Vip') btn.classList.add('c-seat--vip');

            if (seat.status === 'Occupied') {
                btn.disabled = true;
                btn.setAttribute('aria-label', `Row ${seat.row}, Seat ${seat.number}, occupied`);
            } else {
                const isMine = seat.status === 'InMyCart';
                btn.setAttribute('aria-pressed', isMine ? 'true' : 'false');
                btn.setAttribute('aria-label', `Row ${seat.row}, Seat ${seat.number}, ${seat.type}, ${seat.price} ₽`);

                btn.addEventListener('click', async () => {
                    if (!token) return alert('Please log in to select seats.');

                    const isCurrentlySelected = btn.getAttribute('aria-pressed') === 'true';
                    
                    btn.classList.add('is-loading');

                    if (isCurrentlySelected) {
                        // Remove from cart API
                        const cartId = btn.dataset.cartId;
                        if (cartId) {
                            await fetch(`https://api.cinema.int.hardcoder.ru/api/cart/items/${cartId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                        }
                        btn.setAttribute('aria-pressed', 'false');
                        btn.dataset.cartId = '';
                    } else {
                        // Add to cart API
                        try {
                            const res = await fetch('https://api.cinema.int.hardcoder.ru/api/cart/items', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}` 
                                },
                                body: JSON.stringify({ 
                                    sessionId: session.id, 
                                    row: seat.row, 
                                    number: seat.number 
                                })
                            });
                            
                            if (res.ok) {
                                const data = await res.json();
                                btn.dataset.cartId = data.id; // Save returned cartItemId
                                btn.setAttribute('aria-pressed', 'true');
                            } else {
                                alert('Failed to select seat. It might be occupied.');
                            }
                        } catch (err) {
                            alert('Network error while selecting seat.');
                        }
                    }
                    
                    btn.classList.remove('is-loading');
                    updateSummary();
                });
            }
            rowDiv.appendChild(btn);
        });

        const rightLabel = document.createElement('span');
        rightLabel.className = 'c-seatmap__label';
        rightLabel.innerText = r;
        rowDiv.appendChild(rightLabel);

        container.appendChild(rowDiv);
    }
    renderLegend(session.prices);
    updateSummary();
}

function updateSummary() {
    const selectedSeats = document.querySelectorAll('.c-seat[aria-pressed="true"]');
    const summaryList = document.getElementById('summary-list');
    const summaryCount = document.getElementById('summary-count');
    const summaryTotal = document.getElementById('summary-total');
    const goToCartBtn = document.getElementById('go-to-cart-btn');

    summaryList.innerHTML = '';
    let totalPrice = 0;

    if (selectedSeats.length === 0) {
        summaryList.innerHTML = '<li class="u-muted" id="no-seats-msg">No seats selected</li>';
        summaryCount.innerText = '0';
        summaryTotal.innerText = '0 ₽';
        goToCartBtn.disabled = true;
        return;
    }

    selectedSeats.forEach(seatBtn => {
        const row = seatBtn.dataset.row;
        const number = seatBtn.dataset.number;
        const price = parseInt(seatBtn.dataset.price);
        totalPrice += price;

        const li = document.createElement('li');
        li.className = 'c-cart-seat';
        li.innerHTML = `
            <span class="c-cart-seat__label">Row ${row}, Seat ${number}</span>
            <span class="c-cart-seat__price">${price} ₽</span>
            <button class="c-btn c-btn--ghost c-btn--icon c-btn--sm remove-btn">✖</button>
        `;
        
        li.querySelector('.remove-btn').addEventListener('click', () => {
            seatBtn.click(); // Trigger seat click to remove
        });
        summaryList.appendChild(li);
    });

    summaryCount.innerText = selectedSeats.length;
    summaryTotal.innerText = `${totalPrice} ₽`;
    goToCartBtn.disabled = false;
}

function renderLegend(prices) {
    document.getElementById('seat-legend').innerHTML = `
        <li class="c-legend__item"><span class="c-seat c-legend__seat"></span>Standard · ${prices.standard} ₽</li>
        <li class="c-legend__item"><span class="c-seat c-seat--vip c-legend__seat"></span>VIP · ${prices.vip} ₽</li>
        <li class="c-legend__item"><span class="c-seat c-legend__seat c-legend__seat--occupied"></span>Occupied</li>
        <li class="c-legend__item"><span class="c-seat c-legend__seat c-legend__seat--mine"></span>In your cart</li>
    `;
}