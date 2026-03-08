import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function Topbar({ toggleSidebar }) {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unread_count || 0);
        } catch { }
    };

    const markAsRead = async (id, link) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            setShowNotifications(false);
            if (link) navigate(link);
        } catch { }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { }
    };

    const formatRole = (role) => {
        const roles = {
            student: 'Student', teacher: 'Teacher', class_teacher: 'Class Teacher',
            dos: 'Director of Studies', deputy_principal: 'Deputy Principal',
            principal: 'Principal', developer: 'Developer', admin: 'System Admin'
        };
        return roles[role] || role;
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (!e.target.closest('[data-topbar-dropdown]')) {
                setShowNotifications(false);
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-40 flex-shrink-0">

            {/* Left: Mobile toggle + breadcrumb */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <div className="hidden sm:block">
                    {user?.role === 'student' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-school-primary bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                {user?.curriculum?.name}
                            </span>
                            {user?.academic_level?.name && (
                                <span className="text-xs text-gray-400">{user.academic_level.name}</span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-semibold text-school-primary bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest hidden md:block">Admin Panel</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Notifications + Profile */}
            <div className="flex items-center gap-2 sm:gap-3" data-topbar-dropdown>

                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative transition-all"
                    >
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-school-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-800">Notifications</span>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs text-school-primary font-medium hover:underline">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-xs text-gray-400">No notifications yet.</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id, notif.link)}
                                            className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-red-50/30' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${notif.type === 'assignment' ? 'text-school-primary' :
                                                    notif.type === 'grade' ? 'text-emerald-600' : 'text-gray-400'
                                                    }`}>{notif.type}</span>
                                                {!notif.is_read && <span className="w-1.5 h-1.5 bg-school-primary rounded-full mt-1 flex-shrink-0"></span>}
                                            </div>
                                            <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                                {notif.message}
                                            </p>
                                            <span className="text-[10px] text-gray-400 mt-1 block">
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                {/* Profile Menu */}
                <div className="relative">
                    <button
                        onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                    >
                        <div className="w-8 h-8 bg-school-primary text-white rounded-lg flex items-center justify-center font-bold text-sm overflow-hidden">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || 'U'
                            )}
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-sm font-semibold text-gray-800 leading-none">{user?.name?.split(' ')[0]}</span>
                            <span className="text-xs text-gray-400 mt-0.5">{formatRole(user?.role)}</span>
                        </div>
                        <svg className={`w-3.5 h-3.5 text-gray-400 hidden sm:block transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    navigate(`/${user?.role === 'student' ? 'student' : 'admin'}/profile`);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                My Profile
                            </button>
                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
