import React from 'react';

export default function ProgressBar({ progress = 0, label, showPercentage = true }) {
    // Ensure progress stays between 0 and 100
    const normalizedProgress = Math.min(Math.max(progress, 0), 100);
    
    // Change color based on completion
    const getBarColor = () => {
        if (normalizedProgress === 100) return 'bg-green-500';
        if (normalizedProgress > 0) return 'bg-blue-600';
        return 'bg-gray-200';
    };

    return (
        <div className="w-full">
            {(label || showPercentage) && (
                <div className="flex justify-between items-center mb-1">
                    {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
                    {showPercentage && <span className="text-xs font-semibold text-gray-500">{normalizedProgress}%</span>}
                </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${getBarColor()}`} 
                    style={{ width: `${normalizedProgress}%` }}
                ></div>
            </div>
        </div>
    );
}