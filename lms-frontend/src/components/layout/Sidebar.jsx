import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ isOpen, toggleSidebar }) {
    // Reusable navigation link component
    const NavItem = ({ to, icon, label }) => (
        <NavLink 
            to={to} 
            onClick={() => {
                if (window.innerWidth < 768) toggleSidebar(); // Auto-close on mobile after click
            }}
            className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200
                ${isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-300 hover:bg-blue-800/50 hover:text-white'
                }
            `}
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );

    return (
        <>
            {/* Mobile Dark Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden" 
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed top-0 left-0 h-full w-64 bg-[#0f172a] text-white flex flex-col z-50 
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 md:static md:flex-shrink-0
            `}>
                {/* Branding Header */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
                    <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-sm">IM</div>
                        <span>Inkiito Manoh</span>
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
                    <NavItem 
                        to="/student/dashboard" 
                        label="Dashboard" 
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        } 
                    />
                    <NavItem 
                        to="/student/subjects" 
                        label="My Subjects" 
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        } 
                    />
                    <NavItem 
                        to="/student/assignments" 
                        label="Assignments" 
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        } 
                    />
                    <NavItem 
                        to="/student/grades" 
                        label="My Grades" 
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        } 
                    />
                </nav>
            </aside>
        </>
    );
}