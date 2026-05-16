// API_BASE_URL should be loaded before this from config.js
const BASE_URL = typeof API_BASE_URL !== 'undefined' && API_BASE_URL.includes('127.0.0.1') ? API_BASE_URL : '/backend/api';

const api = {
    async login(email, password) {
        const response = await fetch(`${BASE_URL}/auth/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('name', data.name);
            return { success: true, data };
        } else {
            return { success: false, message: data.message };
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        window.location.href = 'login.html';
    },

    async get(endpoint) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 401 || response.status === 403) {
            this.logout();
            throw new Error('Unauthorized');
        }
        return response.json();
    },

    async post(endpoint, payload) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        if (response.status === 401 || response.status === 403) {
            this.logout();
            throw new Error('Unauthorized');
        }
        return response.json();
    }
};
