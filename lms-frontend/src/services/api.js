import axios from 'axios';

// Create a custom axios instance pointing to your Laravel API
const api = axios.create({
    baseURL: 'http://localhost:8000/api', // The default Laravel port
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Intercept every request to automatically attach the secure login token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('lms_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;