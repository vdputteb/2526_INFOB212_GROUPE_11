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
        
        const existingIndex = basket.findIndex(i => i.id === item.id && i.type === item.type);
        
        if (existingIndex !== -1 && item.type === 'rent') {
            
            basket[existingIndex].startDate = item.startDate;
            basket[existingIndex].endDate = item.endDate;
            basket[existingIndex].rentalDays = this.calculateDays(item.startDate, item.endDate);
            basket[existingIndex].total = item.price * basket[existingIndex].rentalDays;
        } else if (existingIndex !== -1 && item.type === 'buy') {
            
            basket[existingIndex].quantity += item.quantity || 1;
            basket[existingIndex].total = (basket[existingIndex].price || basket[existingIndex].prix) * basket[existingIndex].quantity;
        } else {
            
            const rentalDays = item.type === 'rent' ? this.calculateDays(item.startDate, item.endDate) : 1;
            basket.push({
                ...item,
                quantity: item.type === 'rent' ? 1 : (item.quantity || 1),
                rentalDays: rentalDays,
                total: (item.price || item.prix) * (item.type === 'rent' ? rentalDays : (item.quantity || 1))
            });
        }
        this.save();
    },
    
    calculateDays(startDate, endDate) {
        if (!startDate || !endDate) return 1;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 1;
    },
    
    removeItem(index) {
        basket.splice(index, 1);
        this.save();
    },
    
    updateQuantity(index, newQuantity) {
        
        if (basket[index].type === 'rent') {
            console.warn('Cannot change quantity for rental items');
            return;
        }
        
        if (newQuantity < 1) {
            this.removeItem(index);
            return;
        }
        basket[index].quantity = newQuantity;
        basket[index].total = basket[index].price * newQuantity;
        this.save();
    },
    
    
    updateRentalDates(index, startDate, endDate) {
        if (basket[index].type !== 'rent') {
            console.warn('Can only update dates for rental items');
            return false;
        }
        
        const newRentalDays = this.calculateDays(startDate, endDate);
        basket[index].startDate = startDate;
        basket[index].endDate = endDate;
        basket[index].rentalDays = newRentalDays;
        basket[index].total = basket[index].price * newRentalDays;
        this.save();
        return true;
    },
    
    clear() {
        basket = [];
        this.save();
    },
    
    calculateTotals() {
        let subtotal = basket.reduce((sum, item) => sum + (item.total || item.price * item.quantity), 0);
        let deliveryFee = subtotal > 0 && subtotal < 50 ? 5.90 : 0;
        let ecoFee = basket.reduce((sum, item) => {
            
            if (item.type === 'rent') return sum;
            return sum + (item.quantity * 0.50);
        }, 0);
        return { subtotal, deliveryFee, ecoFee, total: subtotal + deliveryFee + ecoFee };
    },

    createCartButton() {
        if (document.querySelector('.cart-fixed')) return;
        
        const cartFixed = document.createElement('div');
        cartFixed.className = 'cart-fixed';
        
        const cartLink = document.createElement('a');
        cartLink.href = '/basket';
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