import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { getMediaUrl } from '../services/api';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Attach token to all future requests
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Verify the token with Laravel
                const response = await api.get('me');
                const userData = response.data;
                if (userData.avatar) userData.avatar = getMediaUrl(userData.avatar);
                setUser(userData);
            } catch (error) {
                console.error('Invalid or expired session');
                localStorage.removeItem('token');
                delete api.defaults.headers.common['Authorization'];
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Inactivity logout timer (e.g. 30 minutes)
    useEffect(() => {
        let timer;
        const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            // Only start/reset timer if there's a user logged in
            if (user) {
                timer = setTimeout(() => {
                    console.log('User inactive. Logging out...');
                    logout();
                    alert('You have been logged out due to inactivity.');
                }, INACTIVITY_TIME);
            }
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        // Start the initial timer
        resetTimer();

        return () => {
            if (timer) clearTimeout(timer);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [user]);

    const login = async (credentials) => {
        try {
            const response = await api.post('login', credentials);
            const { user, token } = response.data;

            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            if (user.avatar) user.avatar = `${getMediaUrl(user.avatar)}?t=${new Date().getTime()}`;
            setUser(user);
            return user;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // First, remove the token from storage
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);

            // Then notify the server
            await api.post('logout');
        } catch (error) {
            console.error("Logout error on server:", error);
        }
    };

    const refreshUser = async () => {
        try {
            const response = await api.get('me');
            const userData = response.data;
            if (userData.avatar) userData.avatar = getMediaUrl(userData.avatar);
            setUser(userData);
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
    };

    const updateUser = (newData) => {
        if (newData.avatar) {
            newData.avatar = `${getMediaUrl(newData.avatar)}?t=${new Date().getTime()}`;
        }
        setUser(prev => ({ ...prev, ...newData }));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, refreshUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};