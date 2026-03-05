import React from 'react';

export default function EnrollmentIndicator({ status }) {
    // status can be 'active' (red tick), 'completed' (blue tick), or 'dropped/exempt' (blue x)
    
    if (status === 'active') {
        return (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100" title="Currently Doing">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
            </div>
        );
    }

    if (status === 'completed') {
        return (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100" title="Completed">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
            </div>
        );
    }

    if (status === 'dropped') {
        return (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100" title="Not Doing">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
        );
    }

    return null;
}