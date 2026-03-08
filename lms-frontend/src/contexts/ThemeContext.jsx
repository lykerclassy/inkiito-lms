import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState({
        brand_primary: '#d81d22',
        brand_secondary: '#4b4da3',
        brand_accent: '#f8af18'
    });

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const res = await api.get('/branding');
                setTheme(res.data);
                applyTheme(res.data);
            } catch (err) {
                console.warn("Theme synchronization failed, using defaults.");
                applyTheme(theme);
            }
        };
        fetchBranding();
    }, []);

    const applyTheme = (colors) => {
        const root = document.documentElement;
        root.style.setProperty('--school-primary', colors.brand_primary);
        root.style.setProperty('--school-secondary', colors.brand_secondary);
        root.style.setProperty('--school-accent', colors.brand_accent);
    };

    return (
        <ThemeContext.Provider value={{ theme, refreshTheme: applyTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
