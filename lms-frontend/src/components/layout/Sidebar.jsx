import React, { useContext, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import api, { getMediaUrl } from '../../services/api';

import InstallAppButton from '../common/InstallAppButton';

export default function Sidebar({ isOpen, toggleSidebar }) {
    const { user } = useContext(AuthContext);
    const [schoolName, setSchoolName] = useState('Inkiito Manoh');
    const [schoolLogo, setSchoolLogo] = useState(null);

    useEffect(() => {
        api.get('settings').then(res => {
            if (res.data?.school_name) setSchoolName(res.data.school_name);
            if (res.data?.school_logo) setSchoolLogo(getMediaUrl(res.data.school_logo));

        }).catch(err => console.error("Could not fetch school settings", err));
    }, []);

    const generateInitials = (name) => {
        const words = name.split(' ');
        if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

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
                    ? 'bg-school-primary text-white shadow-md'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
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
                        {schoolLogo ? (
                            <img src={schoolLogo} alt="School Logo" className="h-8 w-auto object-contain rounded-sm" />
                        ) : (
                            <div className="w-8 h-8 bg-school-primary rounded flex items-center justify-center text-sm" title={schoolName}>
                                {generateInitials(schoolName)}
                            </div>
                        )}
                        <span className="text-base font-semibold truncate max-w-[140px]">{schoolName}</span>
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Intelligent Curriculum Banner */}
                {user?.role === 'student' && user?.curriculum && (
                    <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-800 flex flex-col items-center text-center">
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Current Syllabus</span>
                        <div className="text-sm font-bold text-red-400 bg-red-900/30 px-3 py-1.5 rounded-lg w-full border border-red-800/50">
                            {user.curriculum.name} • {user.academic_level?.name}
                        </div>
                    </div>
                )}


                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2 custom-scrollbar">
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
                        to="/student/quizzes"
                        label="Quizzes"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l.707.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        }
                    />
                    <NavItem
                        to="/student/english"
                        label="English Hub"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        }
                    />
                    <NavItem
                        to="/student/grades"
                        label="My Grades"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        }
                    />

                    {(user?.curriculum?.name?.includes('CBC') || user?.curriculum?.name?.includes('8-4-4')) && (
                        <NavItem
                            to="/student/typing"
                            label="Typing Tracker"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            }
                        />
                    )}

                    {(user?.curriculum?.name?.includes('CBC') || user?.curriculum?.name?.includes('8-4-4')) && (
                        <NavItem
                            to="/student/ict-lab"
                            label="ICT Innovation Lab"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            }
                        />
                    )}

                    <NavItem
                        to="/student/science-lab"
                        label="Science Complex"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        }
                    />

                    <NavItem
                        to="/student/resources"
                        label="Library & Resources"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        }
                    />

                    <NavItem
                        to="/student/future-focus"
                        label="Future Focus"
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        }
                    />

                    {/* App Install Prompt */}
                    <InstallAppButton />
                </nav>
            </aside>
        </>
    );
}