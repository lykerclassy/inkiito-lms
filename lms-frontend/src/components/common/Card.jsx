import React from 'react';

export default function Card({ children, title, subtitle, className = '', noPadding = false, onClick, ...props }) {
    return (
        <div
            onClick={onClick}
            {...props}
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className} ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 transition-all duration-200' : ''}`}
        >
            {(title || subtitle) && (
                <div className="px-5 py-3.5 border-b border-gray-100">
                    {title && <h3 className="text-sm font-semibold text-gray-800">{title}</h3>}
                    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
            )}
            <div className={noPadding ? '' : 'p-5'}>
                {children}
            </div>
        </div>
    );
}
