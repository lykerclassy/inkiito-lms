import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const [resolver, setResolver] = useState(null);

    const showNotification = useCallback((message, type = 'info', title = '') => {
        setNotification({ message, type, title });
    }, []);

    const askConfirmation = useCallback((message, title = 'Are you sure?') => {
        setNotification({ message, type: 'confirm', title });
        return new Promise((resolve) => {
            setResolver(() => resolve);
        });
    }, []);

    const hideNotification = useCallback((result = false) => {
        if (resolver) resolver(result);
        setNotification(null);
        setResolver(null);
    }, [resolver]);

    return (
        <NotificationContext.Provider value={{ showNotification, askConfirmation, hideNotification }}>
            {children}
            {notification && (
                <AlertModal
                    isOpen={!!notification}
                    onClose={() => hideNotification(false)}
                    onConfirm={() => hideNotification(true)}
                    {...notification}
                />
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);

// Internal Component for the Modal
const AlertModal = ({ isOpen, onClose, onConfirm, message, type, title }) => {
    if (!isOpen) return null;

    const isConfirm = type === 'confirm';

    const icons = {
        success: (
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
            </div>
        ),
        error: (
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
        ),
        info: (
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        ),
        warning: (
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
        ),
        confirm: (
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-red-100">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </div>
        )
    };

    const typeTitles = {
        success: 'Success',
        error: 'System Error',
        info: 'Notification',
        warning: 'Alert',
        confirm: 'Destructive Action'
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}></div>
            <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl relative animate-in zoom-in slide-in-from-bottom-8 duration-500 flex flex-col items-center text-center border border-gray-100">
                {icons[type]}
                <h3 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tighter leading-none italic">
                    {title || typeTitles[type]}
                </h3>
                <p className="text-gray-500 font-bold text-sm leading-relaxed mb-10 px-2 whitespace-pre-wrap">
                    {message}
                </p>

                <div className="flex flex-col gap-3 w-full">
                    {isConfirm ? (
                        <>
                            <button
                                onClick={onConfirm}
                                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95"
                            >
                                Proceed with Action
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-5 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gray-200 transition-all active:scale-95"
                            >
                                Never Mind
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
