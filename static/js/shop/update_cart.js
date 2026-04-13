import { BasketManager } from '../class/BasketManager.js';

export function updateCartCount() {
    const count = BasketManager.getItemCount();
    const cartCountSpan = document.getElementById('cartCount');
    if (cartCountSpan) cartCountSpan.textContent = count;
}
