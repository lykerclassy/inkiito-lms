import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { DashboardSkeleton } from '../../components/common/Skeleton';
import api from '../../services/api';

function StatCard({ icon, value, label, trend, color }) {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                {trend && (
                    <span className="inline-block mt-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}

function QuickAction({ icon, label, description, onClick, color }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left w-full group"
        >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{label}</p>
                {description && <p className="text-xs text-gray-400 truncate">{description}</p>}
            </div>
            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
        </button>
    );
}

// Role configuration: colors, label, panel name, gradient, quick actions
const ROLE_CONFIG = {
    admin: {
        label: 'System Administrator',
        panel: 'Administration Panel',
        gradient: 'linear-gradient(135deg, #1a1b4b 0%, #4b4da3 70%, #d81d22 100%)',
        badgeColor: 'bg-indigo-600',
        accentDot: '🖥️',
    },
    developer: {
        label: 'Developer',
        panel: 'Developer Console',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)',
        badgeColor: 'bg-blue-700',
        accentDot: '⚙️',
    },
    principal: {
        label: 'Principal',
        panel: 'Principal\'s Dashboard',
        gradient: 'linear-gradient(135deg, #7c2d12 0%, #b91c1c 50%, #1a1b4b 100%)',
        badgeColor: 'bg-red-700',
        accentDot: '🏛️',
    },
    deputy_principal: {
        label: 'Deputy Principal',
        panel: 'Deputy Principal\'s Panel',
        gradient: 'linear-gradient(135deg, #1a1b4b 0%, #b91c1c 60%, #7c2d12 100%)',
        badgeColor: 'bg-red-800',
        accentDot: '🏅',
    },
    dos: {
        label: 'Director of Studies',
        panel: 'Academic Control Panel',
        gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #1a1b4b 100%)',
        badgeColor: 'bg-emerald-700',
        accentDot: '📚',
    },
    class_teacher: {
        label: 'Class Teacher',
        panel: 'Class Teacher Portal',
        gradient: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 60%, #d81d22 100%)',
        badgeColor: 'bg-violet-600',
        accentDot: '🎓',
    },
    teacher: {
        label: 'Subject Teacher',
        panel: 'Faculty Teaching Portal',
        gradient: 'linear-gradient(135deg, #d81d22 0%, #a01018 50%, #4b4da3 100%)',
        badgeColor: 'bg-school-primary',
        accentDot: '✏️',
    },
};

export default function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const role = user?.role;
    const isManagement = ['admin', 'developer', 'principal', 'deputy_principal', 'dos'].includes(role);
    const isSysAdmin = ['admin', 'developer'].includes(role);
    const isTeacher = ['teacher', 'class_teacher'].includes(role);
    const isClassTeacher = role === 'class_teacher';

    const config = ROLE_CONFIG[role] || ROLE_CONFIG.teacher;

    const greeting = () => {
        const h = new Date().getHours();
        return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    };

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        api.get('dashboard')
            .then(res => {
                setStats(res.data.stats || []);
                setItems(res.data.subjects || res.data.classes || []);
            })
            .catch(err => {
                console.error('Dashboard Fetch Error:', err);
                setError('Failed to load dashboard data.');
            })
            .finally(() => setIsLoading(false));
    }, [user]);

    if (isLoading) return <DashboardSkeleton />;

    const statColors = ['bg-school-primary', 'bg-school-secondary', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-purple-500'];

    const statIcons = [
        <svg key="s0" className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>,
        <svg key="s1" className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
        <svg key="s2" className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>,
        <svg key="s3" className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>,
        <svg key="s4" className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" /></svg>,
        <svg key="s5" className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ===== HERO BANNER (role-personalised) ===== */}
            <div className="relative overflow-hidden rounded-2xl text-white" style={{ background: config.gradient }}>
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-72 h-72 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 200 200" fill="white">
                        <circle cx="160" cy="40" r="100" />
                        <circle cx="40" cy="160" r="70" />
                    </svg>
                </div>
                <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{config.accentDot}</span>
                            <p className="text-white/60 text-xs font-medium">{greeting()}, {config.label}</p>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{user?.name}</h1>
                        <p className="text-white/70 text-sm mt-1">
                            {config.panel} · Inkiito Manoh Senior School
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {isManagement && (
                            <>
                                <button
                                    onClick={() => navigate('/admin/users')}
                                    className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
                                >
                                    Manage Users
                                </button>
                                <button
                                    onClick={() => navigate('/admin/curriculum')}
                                    className="px-4 py-2 bg-white text-gray-800 hover:bg-gray-100 text-xs font-semibold rounded-lg transition-colors"
                                >
                                    + New Content
                                </button>
                            </>
                        )}
                        {isTeacher && (
                            <>
                                <button
                                    onClick={() => navigate('/admin/assignments')}
                                    className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
                                >
                                    My Assignments
                                </button>
                                <button
                                    onClick={() => navigate('/admin/science-labs')}
                                    className="px-4 py-2 bg-white text-gray-800 hover:bg-gray-100 text-xs font-semibold rounded-lg transition-colors"
                                >
                                    + Add Experiment
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            {stats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <StatCard
                            key={i}
                            icon={statIcons[i % statIcons.length]}
                            value={stat.value}
                            label={stat.label}
                            trend={stat.trend}
                            color={statColors[i % statColors.length]}
                        />
                    ))}
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left — Subjects / Classes */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Subjects / Teaching Subjects */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">
                                {isManagement ? 'Curriculum Subjects' : 'My Teaching Subjects'}
                            </h2>
                            <button
                                onClick={() => navigate(isManagement ? '/admin/curriculum' : '/admin/assignments')}
                                className="text-xs text-school-primary font-medium hover:underline"
                            >
                                View all
                            </button>
                        </div>

                        {items.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {items.slice(0, 6).map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => navigate(isManagement ? '/admin/curriculum' : '/admin/assignments')}
                                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-school-primary flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                                            {(item.title || item.name || '?').charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 group-hover:text-school-primary transition-colors truncate">
                                                {item.title || item.name}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {item.framework || item.subtitle || item.studentCount || ''}
                                            </p>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-300 group-hover:text-school-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-5 py-12 text-center">
                                <p className="text-sm text-gray-400">No subjects found.</p>
                                {isManagement && (
                                    <button
                                        onClick={() => navigate('/admin/curriculum')}
                                        className="mt-3 px-4 py-2 bg-school-primary text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Add First Subject
                                    </button>
                                )}
                                {isTeacher && (
                                    <p className="text-xs text-gray-400 mt-2">Contact your administrator to be assigned to subjects.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Role-specific info panel */}
                    {isTeacher && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                                <h2 className="text-sm font-semibold text-gray-800">Faculty Tools</h2>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Science Labs', desc: 'Manage experiments', path: '/admin/science-labs', color: 'bg-blue-500', emoji: '🔬' },
                                    { label: 'Resource Library', desc: 'Upload study materials', path: '/admin/resource-library', color: 'bg-amber-500', emoji: '📁' },
                                    { label: 'Vocabulary Bank', desc: 'Manage English words', path: '/admin/vocabulary-bank', color: 'bg-emerald-500', emoji: '📖' },
                                    { label: 'Career Pathways', desc: 'Guide student futures', path: '/admin/career-mapping', color: 'bg-purple-500', emoji: '🚀' },
                                ].map(tool => (
                                    <button
                                        key={tool.path}
                                        onClick={() => navigate(tool.path)}
                                        className="flex flex-col items-start p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left group"
                                    >
                                        <div className={`w-8 h-8 rounded-lg ${tool.color} flex items-center justify-center mb-2 text-base`}>
                                            {tool.emoji}
                                        </div>
                                        <p className="text-xs font-semibold text-gray-800 group-hover:text-school-primary transition-colors">{tool.label}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{tool.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assignments panel */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">Assignments</h2>
                            <button onClick={() => navigate('/admin/assignments')} className="text-xs text-school-primary font-medium hover:underline">
                                View all
                            </button>
                        </div>
                        <div className="px-5 py-10 text-center">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-5 h-5 text-school-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mb-0.5">Manage Assignments</p>
                            <p className="text-xs text-gray-400 mb-3">Create and review student assignments</p>
                            <button
                                onClick={() => navigate('/admin/assignments')}
                                className="px-4 py-2 bg-school-secondary text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Go to Assignments
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">

                    {/* Quick Actions — role-aware */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">Quick Actions</h2>
                        </div>
                        <div className="p-3 space-y-1.5">
                            {isManagement && (
                                <>
                                    <QuickAction
                                        icon={<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
                                        label="Add User"
                                        description="Create student or staff account"
                                        onClick={() => navigate('/admin/users')}
                                        color="bg-school-primary"
                                    />
                                    <QuickAction
                                        icon={<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" /></svg>}
                                        label="Curriculum"
                                        description="Manage subjects & lessons"
                                        onClick={() => navigate('/admin/curriculum')}
                                        color="bg-school-secondary"
                                    />
                                </>
                            )}
                            {isTeacher && (
                                <QuickAction
                                    icon={<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                                    label="Science Labs"
                                    description="Add & manage experiments"
                                    onClick={() => navigate('/admin/science-labs')}
                                    color="bg-blue-500"
                                />
                            )}
                            <QuickAction
                                icon={<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4" /></svg>}
                                label="Assignments"
                                description="Create & grade work"
                                onClick={() => navigate('/admin/assignments')}
                                color="bg-amber-500"
                            />
                            <QuickAction
                                icon={<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                                label="Gradebook"
                                description="View student grades"
                                onClick={() => navigate('/admin/grades')}
                                color="bg-emerald-500"
                            />
                            <QuickAction
                                icon={<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                label="Resource Library"
                                description="Upload learning materials"
                                onClick={() => navigate('/admin/resource-library')}
                                color="bg-sky-500"
                            />
                            {isSysAdmin && (
                                <QuickAction
                                    icon={<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                    label="Settings"
                                    description="System configuration"
                                    onClick={() => navigate('/admin/settings')}
                                    color="bg-gray-700"
                                />
                            )}
                        </div>
                    </div>

                    {/* Staff Profile Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                style={{ background: config.gradient }}
                            >
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-400 truncate">{config.label}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Email</span>
                                <span className="text-xs font-medium text-gray-700 truncate max-w-[150px]">{user?.email}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Role</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${config.badgeColor}`}>{config.label}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Access Level</span>
                                <span className="text-xs font-medium text-gray-700">
                                    {isSysAdmin ? 'System Admin' : isManagement ? 'Management' : 'Faculty'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/admin/profile')}
                            className="w-full mt-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Edit My Profile
                        </button>
                    </div>

                    {/* Role Info Card */}
                    {role === 'developer' && (
                        <div className="rounded-2xl p-4 border border-indigo-100 bg-indigo-50/50">
                            <p className="text-xs font-semibold text-school-secondary mb-1">Developer Mode Active</p>
                            <p className="text-xs text-indigo-700/70 leading-relaxed">Full system access — settings, seeding, and all configurations are available to you.</p>
                        </div>
                    )}
                    {role === 'principal' && (
                        <div className="rounded-2xl p-4 border border-red-100 bg-red-50/50">
                            <p className="text-xs font-semibold text-red-700 mb-1">Principal Access</p>
                            <p className="text-xs text-red-700/70 leading-relaxed">Full school oversight — manage staff, curriculum, students, and all systems.</p>
                        </div>
                    )}
                    {role === 'deputy_principal' && (
                        <div className="rounded-2xl p-4 border border-orange-100 bg-orange-50/50">
                            <p className="text-xs font-semibold text-orange-700 mb-1">Deputy Principal Access</p>
                            <p className="text-xs text-orange-700/70 leading-relaxed">Full management access shared with the principal. You can manage all school systems.</p>
                        </div>
                    )}
                    {role === 'dos' && (
                        <div className="rounded-2xl p-4 border border-emerald-100 bg-emerald-50/50">
                            <p className="text-xs font-semibold text-emerald-700 mb-1">Director of Studies</p>
                            <p className="text-xs text-emerald-700/70 leading-relaxed">Academic oversight — manage curriculum, teachers, class assignments and performance analytics.</p>
                        </div>
                    )}
                    {role === 'class_teacher' && (
                        <div className="rounded-2xl p-4 border border-violet-100 bg-violet-50/50">
                            <p className="text-xs font-semibold text-violet-700 mb-1">Class Teacher Privileges</p>
                            <p className="text-xs text-violet-700/70 leading-relaxed">You can manage your class's performance, assignments, and support student success, plus manage all content as a teacher.</p>
                        </div>
                    )}
                    {role === 'teacher' && (
                        <div className="rounded-2xl p-4 border border-blue-100 bg-blue-50/50">
                            <p className="text-xs font-semibold text-blue-700 mb-1">Teaching Faculty</p>
                            <p className="text-xs text-blue-700/70 leading-relaxed">Create assignments, experiments, resources & vocabulary. You have full access to all content management tools.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
