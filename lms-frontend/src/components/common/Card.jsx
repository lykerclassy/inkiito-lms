import React from 'react';

export default function Card({ children, title, subtitle, className = '', noPadding = false, onClick, ...props }) {
    return (
        <div
            onClick={onClick}
            {...props}
            className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        >
            {(title || subtitle) && (
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
            )}
            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>
        </div>
    );
}