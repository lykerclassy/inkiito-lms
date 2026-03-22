import React from 'react';

export default function PageLoader({ message = "Booting Systems...", color = "blue" }) {
    const colorClasses = {
        blue: "bg-blue-600 shadow-blue-100",
        red: "bg-school-primary shadow-red-100",
        emerald: "bg-emerald-500 shadow-emerald-100",
        purple: "bg-purple-600 shadow-purple-100",
        amber: "bg-amber-500 shadow-amber-100"
    };

    const selectedColor = colorClasses[color] || colorClasses.blue;

    return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
            <div className="relative">
                <div className={`w-16 h-16 ${selectedColor} rounded-[22px] animate-spin shadow-2xl flex items-center justify-center`}>
                    <div className="w-6 h-6 border-2 border-white/30 rounded-full border-t-white"></div>
                </div>
                {/* Decorative pulses */}
                <div className={`absolute inset-0 w-16 h-16 ${selectedColor} rounded-[22px] animate-ping opacity-20`}></div>
            </div>
            
            <div className="mt-8 text-center space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse transition-all">
                    System Synchronization
                </h3>
                <p className="text-sm font-bold text-gray-600 italic">
                    {message}
                </p>
            </div>
            
            {/* Minimalist loading bar */}
            <div className="w-32 h-1 bg-gray-100 rounded-full mt-6 overflow-hidden">
                <div className={`h-full ${selectedColor.split(' ')[0]} animate-progress-flow w-2/3 rounded-full shadow-sm`}></div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes progress-flow {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .animate-progress-flow {
                    animation: progress-flow 2s infinite ease-in-out;
                }
            `}} />
        </div>
    );
}
