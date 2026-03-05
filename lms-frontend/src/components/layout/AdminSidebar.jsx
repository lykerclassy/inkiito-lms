import React, { useContext, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function AdminSidebar({ isOpen, toggleSidebar }) {
    const { user } = useContext(AuthContext);

    // Define role groupings dynamically
    const role = user?.role;
    const isManagement = ['admin', 'developer', 'principal', 'deputy_principal', 'dos'].includes(role);
    const isSysAdmin = ['admin', 'developer'].includes(role);
    const isClassTeacher = role === 'class_teacher';

    const formatRole = (r) => {
        const roles = {
            student: 'Student',
            teacher: 'Teacher',
            class_teacher: 'Class Teacher',
            dos: 'Director of Studies',
            deputy_principal: 'Deputy Principal',
            principal: 'Principal',
            developer: 'Developer',
            admin: 'System Admin'
        };
        return roles[r] || 'Staff'; // Fallback
    };

    const [schoolName, setSchoolName] = useState('Inkiito Manoh');

    useEffect(() => {
        api.get('/settings').then(res => {
            if (res.data?.school_name) setSchoolName(res.data.school_name);
        }).catch(err => console.error("Could not fetch school settings", err));
    }, []);

    // Create a 2-letter abbreviation for the logo block. 
    // Example: "Inkiito Manoh Academy" -> "IM", "Starehe Boys" -> "SB"
    const generateInitials = (name) => {
        const words = name.split(' ');
        if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const NavItem = ({ to, icon, label }) => (
        <NavLink
            to={to}
            onClick={() => {
                if (window.innerWidth < 768) toggleSidebar();
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
            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={toggleSidebar}></div>}

            <aside className={`
                fixed top-0 left-0 h-full w-64 bg-[#0f172a] text-white flex flex-col z-50 
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 md:static md:flex-shrink-0
            `}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
                    <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 flex-shrink-0 bg-blue-600 rounded flex items-center justify-center text-sm cursor-help" title={schoolName}>
                            {generateInitials(schoolName)}
                        </div>
                        <span className="truncate" title={`${formatRole(role)} Portal`}>{formatRole(role)} Portal</span>
                    </div>
                    <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
                    <NavItem
                        to="/admin/dashboard"
                        label="Overview"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                    />

                    {/* DOS, PRINCIPALS, & ADMINS */}
                    {isManagement && (
                        <div className="pt-4 mt-4 border-t border-gray-800">
                            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Administration
                            </p>
                            <NavItem
                                to="/admin/curriculum"
                                label="Curriculum Manager"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                            />
                            <NavItem
                                to="/admin/users"
                                label="Students & Staff"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                            />
                        </div>
                    )}

                    {/* CLASS TEACHER SPECIFIC */}
                    {isClassTeacher && (
                        <div className="pt-4 mt-4 border-t border-gray-800">
                            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Class Management
                            </p>
                            <NavItem
                                to="/admin/my-class"
                                label="My Homeroom Class"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                            />
                        </div>
                    )}

                    <div className="pt-4 mt-4 border-t border-gray-800">
                        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Academic Assessment
                        </p>
                        {/* ALL TEACHERS GET TO ASSIGN AND GRADE */}
                        <NavItem
                            to="/admin/assignments"
                            label="Assignments"
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                        />
                        <NavItem
                            to="/admin/grades"
                            label="Gradebook"
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                        />
                    </div>

                    {/* SYSTEM ADMIN SPECIFIC */}
                    {isSysAdmin && (
                        <div className="pt-4 mt-4 border-t border-gray-800">
                            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                System Utilities
                            </p>
                            <NavItem
                                to="/admin/settings"
                                label="System Settings"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                            />
                            <NavItem
                                to="/admin/lab-assets"
                                label="Lab Hardware"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                            />
                            <NavItem
                                to="/admin/science-labs"
                                label="Science Lab Manager"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1l-1 7l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5l-1-7l-1-1z" /></svg>}
                            />
                            <NavItem
                                to="/admin/career-mapping"
                                label="Career Mapping"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                            />
                        </div>
                    )}
                </nav>
            </aside>
        </>
    );
}