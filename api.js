const API_URL = 'http://localhost:3000';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('token');
    }
    isAuthenticated() {
        return !!this.token;
    }
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }
    removeToken() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('cartCount');
    }
    logout() {
        this.removeToken();
        window.location.href = 'index.html';
    }
    async register(fullname, email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, email, password })
            });
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

   
    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                throw new Error('Ошибка входа');
            }           
            const result = await response.json();
            
            if (result.token) {
                this.setToken(result.token);
            }            
            return result;
        } catch (error) {
            throw error;
        }
    }
    async getProducts() {
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) throw new Error('Ошибка загрузки товаров');
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            return [];
        }
    }
    async getCategories() {
        try {
            const response = await fetch(`${API_URL}/categories`);
            if (!response.ok) throw new Error('Ошибка загрузки категорий');
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            return [];
        }
    }

    async createProductWithImage(productData, imageFile) {
        if (!this.isAuthenticated()) {
            throw new Error('Требуется авторизация');
        }

        const formData = new FormData();
        formData.append('title', productData.title);
        formData.append('price', productData.price);
        formData.append('categoryid', productData.categoryid);
        formData.append('description', productData.description || '');
        formData.append('stock', productData.stock || 0);
        
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка создания товара: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка создания товара:', error);
            throw error;
        }
    }

    async updateProductWithImage(productId, productData, imageFile) {
        if (!this.isAuthenticated()) {
            throw new Error('Требуется авторизация');
        }

        const formData = new FormData();
        formData.append('title', productData.title);
        formData.append('price', productData.price);
        formData.append('categoryid', productData.categoryid);
        formData.append('description', productData.description || '');
        formData.append('stock', productData.stock || 0);
        
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await fetch(`${API_URL}/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка обновления товара: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка обновления товара:', error);
            throw error;
        }
    }

    async getCart() {
        if (!this.isAuthenticated()) {
            return [];
        }
        
        try {
            const response = await fetch(`${API_URL}/cart`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.removeToken();
                }
                throw new Error('Ошибка загрузки корзины');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки корзины:', error);
            return [];
        }
    }

    async addToCart(productId, quantity = 1) {
    if (!this.isAuthenticated()) {
        throw new Error('Требуется авторизация');
    }
    
    // Приводим количество к правильному формату
    let finalQuantity = quantity;
    
    // Если количество целое (например 1.00), делаем его целым числом
    if (Number.isInteger(finalQuantity) || Math.abs(finalQuantity - Math.round(finalQuantity)) < 0.01) {
        finalQuantity = Math.round(finalQuantity);
    }
    
    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ productid: productId, quantity: finalQuantity })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка добавления в корзину');
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

    async updateCartItem(productId, quantity) {
        if (!this.isAuthenticated()) {
            throw new Error('Требуется авторизация');
        }
        
        try {
            const response = await fetch(`${API_URL}/cart/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ quantity })
            });
            
            if (!response.ok) {
                throw new Error('Ошибка обновления корзины');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async removeFromCart(productId) {
        if (!this.isAuthenticated()) {
            throw new Error('Требуется авторизация');
        }
        
        try {
            const response = await fetch(`${API_URL}/cart/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка удаления из корзины');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async clearCart() {
        if (!this.isAuthenticated()) {
            throw new Error('Требуется авторизация');
        }
        
        try {
            const response = await fetch(`${API_URL}/cart`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка очистки корзины');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async createOrder() {
        if (!this.isAuthenticated()) {
            throw new Error('Требуется авторизация');
        }
        
        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка создания заказа');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async getOrders() {
        if (!this.isAuthenticated()) {
            throw new Error('Требуется авторизация');
        }
        
        try {
            const response = await fetch(`${API_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки заказов');
            }
            
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    getFullImageUrl(imageName) {
        if (!imageName) {
            return '/uploads/products/default.jpg';
        }
        
        if (imageName.startsWith('http') || imageName.startsWith('/uploads/')) {
            return imageName;
        }
        
        return `/uploads/products/${imageName}`;
    }
}

if (typeof api === 'undefined') {
    const api = new ApiClient();
    window.api = api; 
}
