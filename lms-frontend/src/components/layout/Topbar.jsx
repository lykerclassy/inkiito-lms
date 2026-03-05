import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function Topbar({ toggleSidebar }) {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [schoolName, setSchoolName] = useState('Academy');
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Fetch custom school name from settings silently
        api.get('/settings').then(res => {
            if (res.data?.school_name) setSchoolName(res.data.school_name);
        }).catch(err => console.error("Could not fetch school settings", err));

        // Fetch user notifications
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unread_count || 0);
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
    };

    const markAsRead = async (id, link) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            setShowNotifications(false);
            if (link) {
                navigate(link);
            }
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const formatRole = (role) => {
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
        return roles[role] || role;
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-30">
            {/* Left side: Mobile Toggle & Breadcrumbs */}
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="hidden sm:block text-gray-800 font-semibold tracking-tight">
                    {user?.role === 'student' ? (
                        <>{user?.curriculum?.name} • {user?.academic_level?.name}</>
                    ) : (
                        <span className="text-gray-900 border-l-2 border-blue-600 pl-3 ml-1">{schoolName}</span>
                    )}
                </div>
            </div>

            {/* Right side: Notifications & Profile */}
            <div className="flex items-center gap-3 sm:gap-5">

                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full relative transition-colors"
                    >
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                                <span className="font-semibold text-gray-700">Notifications</span>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500 text-center">No new notifications.</div>
                                ) : (
                                    <div className="flex flex-col">
                                        {notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => markAsRead(notif.id, notif.link)}
                                                className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs font-bold uppercase tracking-wide ${notif.type === 'system' ? 'text-gray-500' :
                                                            notif.type === 'assignment' ? 'text-blue-500' :
                                                                notif.type === 'grade' ? 'text-green-500' : 'text-gray-500'
                                                        }`}>
                                                        {notif.type}
                                                    </span>
                                                    {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                                                </div>
                                                <p className={`text-sm ${!notif.is_read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                                    {notif.message}
                                                </p>
                                                <span className="text-xs text-gray-400 mt-2 block">
                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                {/* Profile Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 focus:outline-none"
                    >
                        <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold border border-blue-200">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</span>
                            <span className="text-xs text-gray-500">{formatRole(user?.role)}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Profile Dropdown */}
                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                            <div className="px-4 py-3 border-b border-gray-50 sm:hidden">
                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    navigate(`/${user?.role === 'student' ? 'student' : 'admin'}/profile`);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Account Settings
                            </button>
                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}