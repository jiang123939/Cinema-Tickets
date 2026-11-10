document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (!movieId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`https://api.cinema.int.hardcoder.ru/api/movies/${movieId}`);
        if (!response.ok) throw new Error('Movie not found');
        
        const movie = await response.json();
        renderMovieDetails(movie);
        renderDateTabs(movie.id);
        loadSessions(movie.id, '2026-10-05');
        loadReviews(movie.id); 

    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('movie-header-area').innerHTML = `<h2 class="c-empty__title">Movie not found or server error.</h2>`;
    }
});

function renderMovieDetails(movie) {
    const headerArea = document.getElementById('movie-header-area');
    const posterDiv = document.createElement('div');
    posterDiv.className = 'c-poster c-poster--lg';
    posterDiv.style.backgroundColor = '#1F232C';
    
    const img = document.createElement('img');
    img.className = 'c-poster__img';
    img.src = movie.posterUrl || '';
    img.alt = movie.title;
    img.onerror = function() { this.style.display = 'none'; };
    posterDiv.appendChild(img);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'l-stack';
    infoDiv.innerHTML = `
        <h1>${movie.title}</h1>
        <div class="l-cluster">
            <span class="c-age">${movie.ageRating.replace('Age', '')}+</span>
            ${movie.genres.map(g => `<span class="c-badge c-badge--neutral">${g}</span>`).join('')}
        </div>
        <div class="c-stars c-stars--lg" style="--rating: ${movie.rating || 0}">
            <span class="c-stars__icons"></span>
            <span class="c-stars__value">${movie.rating ? movie.rating.toFixed(2) : 'No ratings'}</span>
            ${movie.reviewsCount > 0 ? `<span class="c-stars__count">${movie.reviewsCount} reviews</span>` : ''}
        </div>
        <p>${movie.description || 'No description available.'}</p >
        <dl class="c-dl">
            <div class="c-dl__row"><dt class="c-dl__term">Director</dt><dd class="c-dl__desc">${movie.director || '—'}</dd></div>
            <div class="c-dl__row"><dt class="c-dl__term">Cast</dt><dd class="c-dl__desc">${movie.cast ? movie.cast.join(', ') : '—'}</dd></div>
            <div class="c-dl__row"><dt class="c-dl__term">Country</dt><dd class="c-dl__desc">${movie.country || '—'}</dd></div>
            <div class="c-dl__row"><dt class="c-dl__term">Duration</dt><dd class="c-dl__desc">${Math.floor(movie.durationMinutes / 60)} h ${movie.durationMinutes % 60} min</dd></div>
            <div class="c-dl__row"><dt class="c-dl__term">Release date</dt><dd class="c-dl__desc">${movie.releaseDate}</dd></div>
        </dl>
    `;

    headerArea.innerHTML = '';
    headerArea.appendChild(posterDiv);
    headerArea.appendChild(infoDiv);
}

function renderDateTabs(movieId) {
    const tabsContainer = document.getElementById('date-tabs');
    const baseDate = new Date('2026-10-05T12:00:00Z'); 
    tabsContainer.innerHTML = '';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 7; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        const tab = document.createElement('button');
        tab.className = 'c-date-tabs__tab';
        if (i === 0) tab.setAttribute('aria-current', 'date');
        tab.innerHTML = `
            <span class="c-date-tabs__day">${i === 0 ? 'Today' : dayNames[date.getDay()]}</span>
            <span class="c-date-tabs__date">${date.getDate()} ${monthNames[date.getMonth()]}</span>
        `;
        
        tab.addEventListener('click', () => {
            tabsContainer.querySelectorAll('.c-date-tabs__tab').forEach(t => t.removeAttribute('aria-current'));
            tab.setAttribute('aria-current', 'date');
            loadSessions(movieId, dateStr);
        });
        tabsContainer.appendChild(tab);
    }
}

async function loadSessions(movieId, date) {
    const container = document.getElementById('sessions-container');
    container.innerHTML = '<p class="u-muted">Loading sessions...</p >';

    try {
        const response = await fetch(`https://api.cinema.int.hardcoder.ru/api/movies/${movieId}/sessions?date=${date}`);
        const sessions = await response.json();
        
        if (sessions.length === 0) {
            container.innerHTML = '<div class="c-alert c-alert--info">There are no sessions available for this date.</div>';
            return;
        }

        const grouped = { 'IMAX': [], '3D': [], '2D': [] };
        sessions.forEach(session => {
            let formatKey = session.format === 'Imax' ? 'IMAX' : (session.format === 'ThreeD' ? '3D' : '2D');
            grouped[formatKey].push(session);
        });

        container.innerHTML = '';
        for (const format in grouped) {
            if (grouped[format].length === 0) continue;

            const groupSection = document.createElement('section');
            groupSection.className = 'c-session-group';
            
            let listHtml = '';
            grouped[format].forEach(session => {
                const startTime = new Date(session.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const isClosed = !session.isBookingOpen;
                
                listHtml += `
                    <a class="c-session session-card-btn" 
                       data-id="${session.id}" 
                       data-closed="${isClosed}"
                       ${isClosed ? 'aria-disabled="true" style="pointer-events:none; opacity:0.5;"' : 'style="cursor:pointer;"'}>
                        <span class="c-session__time">${startTime}</span>
                        <span class="c-session__hall">${session.hall.name}</span>
                        <span class="c-session__price">${isClosed ? 'Booking closed' : `from ${session.prices.standard} ₽`}</span>
                    </a >
                `;
            });

            groupSection.innerHTML = `
                <header class="c-session-group__header">
                    <span class="c-format">${format}</span>
                    <span class="c-session-group__halls">${[...new Set(grouped[format].map(s => s.hall.name))].join(', ')}</span>
                </header>
                <div class="c-session-group__list">${listHtml}</div>
            `;
            container.appendChild(groupSection);
        }

        // FORCE BIND CLICK EVENTS FOR RELIABILITY
        document.querySelectorAll('.session-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Stop default link behavior
                if (e.currentTarget.dataset.closed === 'true') return;
                const id = e.currentTarget.dataset.id;
                window.location.href = `session.html?id=${id}`;
            });
        });

    } catch (error) {
        console.error('Session fetch error:', error);
        container.innerHTML = '<div class="c-alert c-alert--danger">Error loading sessions. Server unavailable.</div>';
    }
}

async function loadReviews(movieId) {
    const reviewContainer = document.getElementById('reviews-list');
    if (!reviewContainer) return;

    try {
        const response = await fetch(`https://api.cinema.int.hardcoder.ru/api/movies/${movieId}/reviews?page=1`);
        const data = await response.json();
        reviewContainer.innerHTML = '';
        
        if (!data.items || data.items.length === 0) {
            reviewContainer.innerHTML = '<p class="u-muted">No reviews yet.</p >';
            return;
        }

        data.items.forEach(review => {
            const dateStr = new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            reviewContainer.insertAdjacentHTML('beforeend', `
                <article class="c-review">
                    <header class="c-review__header">
                        <span class="c-review__author">${review.authorName || 'User'}</span>
                        <div class="c-stars c-stars--sm" style="--rating: ${review.rating}">
                            <span class="c-stars__icons"></span>
                            <span class="c-stars__value">${review.rating}</span>
                        </div>
                        <time class="c-review__date">${dateStr}</time>
                    </header>
                    <p class="c-review__text">${review.text}</p >
                </article>
            `);
        });
    } catch (error) {
        console.error('Reviews fetch error:', error);
    }
}