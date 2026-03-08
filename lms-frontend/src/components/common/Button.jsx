import React from 'react';

export default function Button({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = ''
}) {
    const baseStyle = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm";

    const variants = {
        primary: "bg-school-primary text-white hover:bg-red-700 focus:ring-school-primary/30 shadow-sm",
        secondary: "bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-200",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200",
        outline: "border border-gray-200 text-gray-600 hover:bg-gray-50 focus:ring-gray-200",
        ghost: "text-school-primary hover:bg-red-50"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-sm"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`${baseStyle} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
}
