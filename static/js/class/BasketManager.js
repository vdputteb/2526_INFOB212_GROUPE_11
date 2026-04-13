const STORAGE_KEY = 'locbalais_basket';

let basket = [];

export const BasketManager = {
    load() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                basket = JSON.parse(saved);
            } catch(e) { basket = []; }
        }
        return basket;
    },
    
    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
    },
    
    getItems() {
        return [...basket];
    },
    
    getItemCount() {
        return basket.reduce((sum, item) => sum + (item.quantity || 1), 0);
    },
    
    addItem(item) {
        const existingIndex = basket.findIndex(i => 
            i.id === item.id && 
            i.type === item.type && 
            (!item.startDate || i.startDate === item.startDate)
        );
        
        if (existingIndex !== -1) {
            basket[existingIndex].quantity += item.quantity || 1;
            basket[existingIndex].total = (basket[existingIndex].price || basket[existingIndex].prix) * basket[existingIndex].quantity;
        } else {
            basket.push({
                ...item,
                quantity: item.quantity || 1,
                total: (item.price || item.prix) * (item.quantity || 1)
            });
        }
        this.save();
    },
    
    removeItem(index) {
        basket.splice(index, 1);
        this.save();
    },
    
    updateQuantity(index, newQuantity) {
        if (newQuantity < 1) {
            this.removeItem(index);
            return;
        }
        basket[index].quantity = newQuantity;
        basket[index].total = basket[index].price * newQuantity;
        this.save();
    },
    
    clear() {
        basket = [];
        this.save();
    },
    
    calculateTotals() {
        let subtotal = basket.reduce((sum, item) => sum + (item.total || item.price * item.quantity), 0);
        let deliveryFee = subtotal > 0 && subtotal < 50 ? 5.90 : 0;
        let ecoFee = basket.reduce((sum, item) => sum + (item.quantity * 0.50), 0);
        return { subtotal, deliveryFee, ecoFee, total: subtotal + deliveryFee + ecoFee };
    },

    // Nouvelle méthode pour créer le bouton panier flottant (appelée uniquement sur la page shop)
    createCartButton() {
        if (document.querySelector('.cart-fixed')) return;
        
        const cartFixed = document.createElement('div');
        cartFixed.className = 'cart-fixed';
        
        const cartLink = document.createElement('a');
        cartLink.href = '/client/basket';
        cartLink.className = 'cart-link';
        
        const cartIcon = document.createElement('span');
        cartIcon.textContent = '🛒';
        
        const cartText = document.createElement('span');
        cartText.textContent = 'Panier';
        
        const cartCount = document.createElement('span');
        cartCount.id = 'cart-count';
        cartCount.textContent = this.getItemCount().toString();
        
        cartLink.appendChild(cartIcon);
        cartLink.appendChild(cartText);
        cartLink.appendChild(cartCount);
        cartFixed.appendChild(cartLink);
        
        document.body.appendChild(cartFixed);
        
        // Mise à jour périodique du compteur (optionnel)
        setInterval(() => {
            const countSpan = document.getElementById('cart-count');
            if (countSpan) countSpan.textContent = this.getItemCount().toString();
        }, 1000);
    },

    updateCartButtonCount() {
        const countSpan = document.getElementById('cart-count');
        if (countSpan) countSpan.textContent = this.getItemCount().toString();
    }
};

BasketManager.load();