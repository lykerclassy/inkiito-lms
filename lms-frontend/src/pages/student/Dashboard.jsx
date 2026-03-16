import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { DashboardSkeleton } from '../../components/common/Skeleton';
import api from '../../services/api';

// Mini stat card
function StatCard({ icon, value, label, color }) {
    return (
        <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xl font-bold text-gray-800 leading-none">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user, refreshUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({ recentActivity: null, upcomingDeadlines: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => { 
        fetchDashboardData(); 
        refreshUser(); 

        // Refetch when tab is focused (Real-time update)
        const onFocus = () => {
            fetchDashboardData();
            refreshUser();
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('dashboard');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const enrolledSubjects = user?.subjects?.map(s => ({
        id: s.id,
        name: s.name,
        status: s.pivot?.status || 'active',
        progress: s.progress ?? 0
    })) || [];

    const totalSubjects = enrolledSubjects.length;
    const completedSubjects = enrolledSubjects.filter(s => s.progress >= 80).length;
    const pendingAssignments = stats.upcomingDeadlines?.length || 0;

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg, #d81d22 0%, #a01018 60%, #4b4da3 100%)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                    <svg viewBox="0 0 200 200" fill="white">
                        <circle cx="150" cy="50" r="80" />
                        <circle cx="50" cy="150" r="60" />
                    </svg>
                </div>
                <div className="relative z-10 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="text-red-200 text-xs font-semibold uppercase tracking-wider mb-1">
                                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋
                            </p>
                            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                {user?.name?.split(' ')[0]} {user?.name?.split(' ')[1] || ''}
                            </h1>
                            <p className="text-red-100 text-sm mt-1 opacity-90">
                                {user?.curriculum?.name} · {user?.academic_level?.name || 'Student'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/20">
                                <p className="text-white font-bold text-lg leading-none">{totalSubjects}</p>
                                <p className="text-red-100 text-xs mt-0.5">Subjects</p>
                            </div>
                            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/20">
                                <p className="text-white font-bold text-lg leading-none">{pendingAssignments}</p>
                                <p className="text-red-100 text-xs mt-0.5">Due Soon</p>
                            </div>
                            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/20">
                                <p className="text-white font-bold text-lg leading-none">{completedSubjects}</p>
                                <p className="text-red-100 text-xs mt-0.5">On Track</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column — Main Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard
                            icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>}
                            value={totalSubjects}
                            label="Enrolled Subjects"
                            color="bg-school-primary"
                        />
                        <StatCard
                            icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                            value={pendingAssignments}
                            label="Pending Assignments"
                            color="bg-school-secondary"
                        />
                        <StatCard
                            icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                            value={completedSubjects}
                            label="On Track"
                            color="bg-amber-500"
                        />
                    </div>

                    {/* Continue Learning */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">Continue Learning</h2>
                            {stats.recentActivity && (
                                <span className="text-xs text-gray-400">{stats.recentActivity.subject}</span>
                            )}
                        </div>
                        <div className="p-5">
                            {stats.recentActivity ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-school-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{stats.recentActivity.lesson}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-school-primary rounded-full transition-all duration-700"
                                                    style={{ width: `${stats.recentActivity.progress}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-500 flex-shrink-0">{stats.recentActivity.progress}%</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/student/subjects/${stats.recentActivity.subject_id}`)}
                                        className="flex-shrink-0 px-4 py-2 bg-school-primary text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Continue
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-400">No recent activity</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Start learning from your subjects below</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/student/subjects')}
                                        className="ml-auto flex-shrink-0 px-4 py-2 bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                                    >
                                        Browse Subjects
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Assignments */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">Upcoming Assignments</h2>
                            <button
                                onClick={() => navigate('/student/assignments')}
                                className="text-xs text-school-primary font-medium hover:underline"
                            >
                                View all
                            </button>
                        </div>

                        {stats.upcomingDeadlines?.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {stats.upcomingDeadlines.map((task) => {
                                    const isUrgent = task.due?.toLowerCase().includes('today') || task.due?.toLowerCase().includes('tomorrow');
                                    return (
                                        <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${isUrgent ? 'bg-red-50 text-school-primary' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {task.day || '!'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{task.subject} · <span className={isUrgent ? 'text-red-500 font-medium' : ''}>{task.due}</span></p>
                                            </div>
                                            <button
                                                onClick={() => navigate(task.link)}
                                                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isUrgent ? 'bg-school-primary text-white hover:bg-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                Open
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-5 py-10 text-center">
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-500">All caught up!</p>
                                <p className="text-xs text-gray-400 mt-0.5">No upcoming assignments right now.</p>
                            </div>
                        )}
                    </div>

                    {/* My Subjects */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">My Subjects</h2>
                            <button
                                onClick={() => navigate('/student/subjects')}
                                className="text-xs text-school-primary font-medium hover:underline"
                            >
                                View all
                            </button>
                        </div>
                        {enrolledSubjects.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <p className="text-sm text-gray-400">No subjects enrolled yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {enrolledSubjects.slice(0, 5).map((subject) => (
                                    <div
                                        key={subject.id}
                                        onClick={() => navigate(`/student/subjects/${subject.id}`)}
                                        className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/60 cursor-pointer transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-school-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-school-primary">
                                                {subject.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 group-hover:text-school-primary transition-colors truncate">{subject.name}</p>
                                            {subject.status === 'active' ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-school-primary rounded-full"
                                                            style={{ width: `${subject.progress}%` }} />
                                                    </div>
                                                    <span className="text-xs text-gray-400 flex-shrink-0">{subject.progress}%</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">Inactive</span>
                                            )}
                                        </div>
                                        <svg className="w-4 h-4 text-gray-300 group-hover:text-school-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">

                    {/* Career Goal */}
                    {user?.target_career ? (
                        <div className="rounded-2xl overflow-hidden shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #4b4da3 0%, #2d2f7a 100%)' }}>
                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    <p className="text-indigo-200 text-xs font-medium">Career Goal</p>
                                </div>
                                <h3 className="text-base font-bold text-white leading-tight mb-1">
                                    {user.target_career.name}
                                </h3>
                                <p className="text-indigo-200 text-xs mb-4">{user.target_career.pathway?.name}</p>
                                <button
                                    onClick={() => navigate('/student/future-focus')}
                                    className="w-full py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-colors border border-white/20"
                                >
                                    Update Goal
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 text-center shadow-sm">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-5 h-5 text-school-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-0.5">Set a Career Goal</p>
                            <p className="text-xs text-gray-400 mb-3">Discover careers that match your subjects</p>
                            <button
                                onClick={() => navigate('/student/future-focus')}
                                className="w-full py-2 bg-school-secondary text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Explore Careers
                            </button>
                        </div>
                    )}

                    {/* Quick Navigation */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800">Quick Access</h2>
                        </div>
                        <div className="p-3 space-y-1">
                            {[
                                { label: 'My Assignments', icon: '📋', path: '/student/assignments', badge: pendingAssignments > 0 ? pendingAssignments : null },
                                { label: 'My Grades', icon: '📊', path: '/student/grades', badge: null },
                                { label: 'Science Lab', icon: '🔬', path: '/student/science-lab', badge: null },
                                { label: 'Library', icon: '📚', path: '/student/library', badge: null },
                                { label: 'Career Explorer', icon: '🎯', path: '/student/future-focus', badge: null },
                                { label: 'Downloads', icon: '⬇️', path: '/student/downloads', badge: null },
                            ].map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                >
                                    <span className="text-base">{item.icon}</span>
                                    <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors flex-1">{item.label}</span>
                                    {item.badge && (
                                        <span className="bg-school-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                            {item.badge}
                                        </span>
                                    )}
                                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Student Profile Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-school-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {user?.name?.charAt(0) || 'S'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Curriculum</span>
                                <span className="text-xs font-medium text-gray-700">{user?.curriculum?.name || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Level</span>
                                <span className="text-xs font-medium text-gray-700">{user?.academic_level?.name || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Subjects</span>
                                <span className="text-xs font-medium text-gray-700">{totalSubjects} enrolled</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
