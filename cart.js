document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html?returnUrl=cart.html';
        return;
    }

    const contentArea = document.getElementById('cart-content');
    const countArea = document.getElementById('cart-total-count');

    async function fetchCart() {
        try {
            const response = await fetch('https://api.cinema.int.hardcoder.ru/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const cart = await response.json();
            renderCart(cart);
        } catch (error) {
            console.error(error);
            contentArea.innerHTML = `<div class="c-alert c-alert--danger">Failed to load cart data.</div>`;
        }
    }

    function renderCart(cart) {
        if (!cart || !cart.items || cart.items.length === 0) {
            countArea.innerText = '0 tickets';
            contentArea.innerHTML = `
                <div class="c-empty">
                    <div class="c-empty__icon"><svg class="c-icon c-icon--lg"><use href="cinema-kit/kit/icons.svg#icon-cart"></use></svg></div>
                    <h2 class="c-empty__title">The cart is empty</h2>
                    <div class="c-empty__action"><a class="c-btn c-btn--primary" href=" ">Browse movies</a ></div>
                </div>
            `;
            return;
        }

        countArea.innerText = `${cart.items.length} tickets`;

        let itemsHtml = '';
        let totalPrice = 0;

        cart.items.forEach(item => {
            totalPrice += item.price;
            itemsHtml += `
                <article class="c-cart-group" style="margin-bottom: 16px;">
                    <header class="c-cart-group__header">
                        <div class="c-cart-group__info">
                            <h3 class="c-cart-group__title">${item.movieTitle}</h3>
                            <p class="c-cart-group__meta">
                                <span>Row ${item.row}, Seat ${item.number}</span>
                                <span class="c-badge c-badge--neutral">${item.type}</span>
                            </p >
                        </div>
                    </header>
                    <div class="c-cart-group__footer">
                        <span>Price</span>
                        <span>${item.price} ₽</span>
                    </div>
                </article>
            `;
        });

        contentArea.innerHTML = `
            <div class="l-split">
                <div class="l-split__main">${itemsHtml}</div>
                <aside class="l-split__aside">
                    <section class="c-summary">
                        <h2 class="c-summary__title">Summary</h2>
                        <dl class="c-summary__lines">
                            <div class="c-summary__line"><dt>Tickets</dt><dd>${cart.items.length}</dd></div>
                            <div class="c-summary__total"><dt>Total</dt><dd>${cart.totalPrice} ₽</dd></div>
                        </dl>
                        <div class="c-summary__actions">
                            <!-- 给它加上一个唯一的 ID -->
                            <a class="c-btn c-btn--primary c-btn--block" href="purchase.html" id="proceed-btn">Proceed to checkout</a >
                        </div>
                    </section>
                </aside>
            </div>
        `;

        const proceedBtn = document.getElementById('proceed-btn');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', (e) => {
                e.preventDefault(); 
                console.log("Proceed clicked, redirecting...");
                window.location.href = 'purchase.html'; 
            });
        }
    }

    fetchCart();
});