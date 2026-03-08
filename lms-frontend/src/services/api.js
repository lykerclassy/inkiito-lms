import axios from 'axios';
import nprogress from 'nprogress';

// Create a custom axios instance pointing to your Laravel API
// Determine if we are on localhost or production
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseURL = isLocal
    ? 'http://127.0.0.1:8000/api'
    : 'https://backend.inkiitomanohseniorschool.co.ke/api';

const api = axios.create({
    baseURL: baseURL,
    withCredentials: true, // CRUCIAL: Allows Laravel Sanctum to share login sessions across your subdomains!
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Intercept every request to automatically attach the secure login token
api.interceptors.request.use(
    (config) => {
        nprogress.start();
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        nprogress.done();
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        nprogress.done();
        return response;
    },
    (error) => {
        nprogress.done();
        return Promise.reject(error);
    }
);

export default api;
