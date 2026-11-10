const originalFetch = window.fetch;

window.fetch = async function(...args) {
    const url = args[0];
    const options = args[1] || {};

    // 1. FORCE INTERCEPT CART REQUESTS (Ignore server entirely)
    if (url.includes('/api/cart')) {
        console.warn('[Demo Mode] Forcing cart fallback data');
        
        if (options.method === 'POST') {
            return new Response(JSON.stringify({ id: 'demo-cart-' + Date.now() }), { status: 200 });
        }
        if (options.method === 'DELETE') {
            return new Response(JSON.stringify({}), { status: 200 });
        }
        
        // Mock GET /api/cart
        return new Response(JSON.stringify({
            items: [
                { id: 'demo-item-1', movieTitle: 'Demo Movie', row: 5, number: 6, type: 'Standard', price: 700 },
                { id: 'demo-item-2', movieTitle: 'Demo Movie', row: 5, number: 7, type: 'Standard', price: 700 }
            ],
            totalPrice: 1400
        }), { status: 200, headers: {'Content-Type': 'application/json'} });
    }

    // 2. FORCE INTERCEPT BOOKINGS
    if (url.includes('/api/bookings')) {
        console.warn('[Demo Mode] Forcing bookings fallback data');
        if (url.includes('/cancel')) return new Response(JSON.stringify({ status: 'Cancelled' }), { status: 200 });

        return new Response(JSON.stringify([
            { id: 'demo-booking-1', code: 'DEMO123', status: 'Active', total: 1400, session: { startsAt: '2026-10-05T19:30:00Z', format: 'Imax', movie: { title: 'Demo Movie' } }, tickets: [{ row: 5, number: 6, seatType: 'Standard', price: 700 }, { row: 5, number: 7, seatType: 'Standard', price: 700 }] }
        ]), { status: 200, headers: {'Content-Type': 'application/json'} });
    }

    // 3. Standard fetch for other endpoints (with fallback on error)
    try {
        const response = await originalFetch(...args);
        if (!response.ok) throw new Error('API Error');
        return response;
    } catch (error) {
        console.warn('[Demo Mode] Server error. Fallback for:', url);

        if (url.includes('/sessions?date=')) {
            return new Response(JSON.stringify([
                { id: 'demo-session-1', startsAt: "2026-10-05T19:30:00Z", endsAt: "2026-10-05T21:30:00Z", format: 'Imax', isBookingOpen: true, prices: { standard: 700 }, hall: { name: 'IMAX Hall' } }
            ]), { status: 200, headers: {'Content-Type': 'application/json'} });
        }

        if (url.includes('/api/sessions/') && !url.includes('/seats')) {
            return new Response(JSON.stringify({
                id: 'demo-session-1', startsAt: "2026-10-05T19:30:00Z", endsAt: "2026-10-05T21:30:00Z", format: 'Imax', 
                prices: { standard: 700, vip: 950 }, movie: { title: "Demo Movie", ageRating: "Age16" }, hall: { name: 'IMAX Hall', rowsCount: 8, seatsPerRow: 10 }
            }), { status: 200, headers: {'Content-Type': 'application/json'} });
        }

        if (url.includes('/seats')) {
            const seats = [];
            for (let r = 1; r <= 8; r++) {
                for (let c = 1; c <= 10; c++) {
                    seats.push({ id: `seat-${r}-${c}`, row: r, number: c, type: r >= 7 ? 'Vip' : 'Standard', status: 'Free', price: r >= 7 ? 950 : 700 });
                }
            }
            return new Response(JSON.stringify(seats), { status: 200, headers: {'Content-Type': 'application/json'} });
        }

        return new Response(JSON.stringify({}), { status: 200, headers: {'Content-Type': 'application/json'} });
    }
};