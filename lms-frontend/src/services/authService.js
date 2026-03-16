import api from './api';

const authService = {
    // 1. Send email and password to Laravel
    login: async (credentials) => {
        const response = await api.post('login', credentials);

        // If successful, Laravel sends back a secure token. We save it to the browser.
        if (response.data.token) {
            localStorage.setItem('lms_token', response.data.token);
        }
        return response.data;
    },

    // 2. Destroy the token on the backend and remove it from the browser
    logout: async () => {
        try {
            await api.post('logout');
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            localStorage.removeItem('lms_token');
        }
    },

    // 3. Fetch the logged-in user's profile (including their Grade and Curriculum)
    getCurrentUser: async () => {
        const response = await api.get('me');
        return response.data;
    }
};

export default authService;