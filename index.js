document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page')) || 1;
    const currentSorting = urlParams.get('sorting') || 'TitleAsc';

    const sortSelect = document.getElementById('filter-sorting');
    if (sortSelect) sortSelect.value = currentSorting;

    try {
        const response = await fetch(`https://api.cinema.int.hardcoder.ru/api/movies?page=${currentPage}&sorting=${currentSorting}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        const movies = data.movies || [];
        const totalItems = data.pagination?.totalItems || 0;
        const pageSize = data.pagination?.pageSize || 8;

        document.getElementById('movie-total').innerText = `${totalItems} movies`;
        renderMovies(movies);
        renderPagination(totalItems, pageSize, currentPage, currentSorting);

    } catch (error) {
        console.error('Failed to load movies:', error);
        document.getElementById('movie-total').innerText = 'Error loading movies';
    }
});

function renderMovies(movies) {
    const grid = document.getElementById('movie-grid');
    grid.innerHTML = ''; 

    if (movies.length === 0) {
        grid.innerHTML = `<div class="c-empty" style="grid-column: span 4;"><h2 class="c-empty__title">No movies found</h2></div>`;
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('article');
        card.className = 'c-movie-card';

        // Poster
        const mediaDiv = document.createElement('div');
        mediaDiv.className = 'c-movie-card__media';
        const posterDiv = document.createElement('div');
        posterDiv.className = 'c-poster c-poster--md';
        posterDiv.style.backgroundColor = '#1F232C';

        const img = document.createElement('img');
        img.className = 'c-poster__img';
        img.src = movie.posterUrl || '';
        img.alt = movie.title;
        img.onerror = function() { this.style.display = 'none'; }; // Safe in JS API

        posterDiv.appendChild(img);

        if (movie.ageRating) {
            const ageBadge = document.createElement('div');
            ageBadge.className = 'c-badge c-badge--neutral c-movie-card__badge';
            ageBadge.innerText = `${movie.ageRating.replace('Age', '')}+`;
            posterDiv.appendChild(ageBadge);
        }
        mediaDiv.appendChild(posterDiv);

        // Title
        const titleH2 = document.createElement('h2');
        titleH2.className = 'c-movie-card__title';
        const titleA = document.createElement('a');
        titleA.className = 'c-movie-card__link';
        titleA.href = `movie.html?id=${movie.id}`;
        titleA.innerText = movie.title;
        titleH2.appendChild(titleA);

        // Meta
        const metaP = document.createElement('p');
        metaP.className = 'c-movie-card__meta';
        const duration = movie.durationMinutes ? `${Math.floor(movie.durationMinutes / 60)} h ${movie.durationMinutes % 60} min` : '';
        metaP.innerText = `${movie.genres ? movie.genres.join(', ') : ''} · ${duration}`;

        // Stars
        const starsDiv = document.createElement('div');
        starsDiv.className = 'c-stars c-stars--sm';
        starsDiv.style.setProperty('--rating', movie.rating || 0);
        
        const iconsSpan = document.createElement('span');
        iconsSpan.className = 'c-stars__icons';
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'c-stars__value';
        valueSpan.innerText = movie.reviewsCount > 0 ? movie.rating.toFixed(2) : '—';

        starsDiv.appendChild(iconsSpan);
        starsDiv.appendChild(valueSpan);

        if (movie.reviewsCount > 0) {
            const countSpan = document.createElement('span');
            countSpan.className = 'c-stars__count';
            countSpan.innerText = `${movie.reviewsCount} reviews`;
            starsDiv.appendChild(countSpan);
        }

        card.appendChild(mediaDiv);
        card.appendChild(titleH2);
        card.appendChild(metaP);
        card.appendChild(starsDiv);

        grid.appendChild(card);
    });
}

function renderPagination(totalItems, pageSize, currentPage, currentSorting) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';
    pagination.innerHTML = '';
    const baseUrl = `index.html?sorting=${currentSorting}&page=`;

    const prev = document.createElement('a');
    prev.className = 'c-pagination__link';
    if (currentPage === 1) prev.setAttribute('aria-disabled', 'true');
    else prev.href = `${baseUrl}${currentPage - 1}`;
    prev.innerHTML = `<svg class="c-icon c-icon--sm"><use href="cinema-kit/kit/icons.svg#icon-chevron-left"></use></svg>Previous`;
    pagination.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const page = document.createElement('a');
        page.className = 'c-pagination__link';
        page.innerText = i;
        page.href = `${baseUrl}${i}`;
        if (i === currentPage) page.setAttribute('aria-current', 'page');
        pagination.appendChild(page);
    }

    const next = document.createElement('a');
    next.className = 'c-pagination__link';
    if (currentPage === totalPages) next.setAttribute('aria-disabled', 'true');
    else next.href = `${baseUrl}${currentPage + 1}`;
    next.innerHTML = `Next<svg class="c-icon c-icon--sm"><use href="cinema-kit/kit/icons.svg#icon-chevron-right"></use></svg>`;
    pagination.appendChild(next);
}