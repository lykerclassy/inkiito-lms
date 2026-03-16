import axios from 'axios';
import nprogress from 'nprogress';

// Create a custom axios instance pointing to your Laravel API
// Determine if we are on localhost or production
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseURL = isLocal
    ? 'http://127.0.0.1:8000/api/'
    : 'https://backend.inkiitomanohseniorschool.co.ke/api/';

const api = axios.create({
    baseURL: baseURL,
    withCredentials: true, // CRUCIAL: Allows Laravel Sanctum to share login sessions across your subdomains!
    headers: {
        'Accept': 'application/json',
    }
});

/**
 * PRODUCTION MEDIA HANDLER
 * Ensures that avatars and file downloads work even if the backend is 
 * misconfigured with localhost in production.
 */
export const getMediaUrl = (url) => {
    if (!url) return null;

    // Handle data URLs (base64) and blob URLs
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;

    // 0. Handle external social media URLs
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('tiktok.com')) return url;

    const domain = isLocal
        ? 'http://127.0.0.1:8000'
        : 'https://backend.inkiitomanohseniorschool.co.ke';

    // 1. If it's a relative path (e.g. storage/...), prepend the domain
    if (!url.startsWith('http')) {
        const cleanPath = url.startsWith('/') ? url.substring(1) : url;
        // If the path doesn't already contain storage/ but it should (from models)
        // Some models store relative path 'resources/abc.pdf', some might store 'storage/resources/abc.pdf'
        // But our storage link is at /storage
        if (!cleanPath.startsWith('storage/')) {
            return `${domain}/storage/${cleanPath}`;
        }
        return `${domain}/${cleanPath}`;
    }

    // 2. If it's a full URL, fix localhost/127.0.0.1 in production OR fix missing port locally
    if (url.startsWith('http')) {
        if (!isLocal) {
            // Production fix for localhost urls
            return url.replace(/http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?/, domain);
        } else {
            // Local fix: Ensure port 8000 is present if it's localhost
            if (url.includes('localhost') && !url.includes(':8000')) {
                return url.replace('localhost', 'localhost:8000');
            }
            if (url.includes('127.0.0.1') && !url.includes(':8000')) {
                return url.replace('127.0.0.1', '127.0.0.1:8000');
            }
        }
    }

    return url;
};

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
