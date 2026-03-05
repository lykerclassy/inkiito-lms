import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Roles Check
    const isManagement = ['admin', 'developer', 'principal', 'deputy_principal', 'dos'].includes(user?.role);
    const isTeacher = ['teacher', 'class_teacher'].includes(user?.role);
    const isAdmin = ['admin', 'developer'].includes(user?.role);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const res = await api.get('/dashboard');
                setStats(res.data.stats || []);
                setItems(res.data.subjects || res.data.classes || []);
            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
                setError("Failed to load real-time system stats.");
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    if (isLoading) {
        return <div className="p-12 text-center text-gray-500 font-medium">Authenticating & loading system overview...</div>;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 italic">
                        {isManagement ? 'System Overview' : 'Teacher Dashboard'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isManagement ? 'Manage curriculum, users, and school operations.' : 'Manage your classes, assignments, and student progress.'}
                    </p>
                </div>
                <div className="flex gap-3">
                    {isManagement && (
                        <>
                            <Button onClick={() => navigate('/admin/users')} variant="outline">
                                Manage Users
                            </Button>
                            <Button onClick={() => navigate('/admin/curriculum')}>
                                + Create Lesson
                            </Button>
                        </>
                    )}
                    {isTeacher && (
                        <Button onClick={() => navigate('/admin/assignments')}>
                            + New Assignment
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 mb-6 font-medium">
                    {error} (Showing fallback data)
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-none shadow-sm bg-white ring-1 ring-gray-100">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">{stat.label}</h3>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-4xl font-black text-gray-900 tracking-tighter">{stat.value}</span>
                        </div>
                        <div className="mt-4 text-xs inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-bold uppercase tracking-widest ring-1 ring-blue-100">
                            {stat.trend}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Dynamic Dashboard Widgets */}
            <div className="grid grid-cols-1 gap-6">
                {isManagement ? (
                    <Card title="Curriculum Management Overview" className="border-none shadow-sm ring-1 ring-gray-100">
                        <div className="space-y-3">
                            {items.length > 0 ? items.map(subject => (
                                <div
                                    key={subject.id}
                                    className="flex items-center justify-between p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                                    onClick={() => navigate('/admin/curriculum')}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                            {subject.title.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{subject.title}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5 font-bold uppercase tracking-widest">{subject.framework} • <span className="text-blue-600/70">{subject.studentCount}</span></p>
                                        </div>
                                    </div>
                                    <span className="text-blue-600 font-black text-xs uppercase tracking-tighter flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Manage <span className="text-lg leading-none">&rarr;</span>
                                    </span>
                                </div>
                            )) : (
                                <p className="text-center py-6 text-gray-500 italic">No subject data found in database.</p>
                            )}
                        </div>
                    </Card>
                ) : (
                    <Card title="My Active Classes" className="border-none shadow-sm ring-1 ring-gray-100">
                        <div className="space-y-4">
                            {items.length > 0 ? items.map(course => (
                                <div
                                    key={course.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white border-l-4 border-l-blue-600 transition-all cursor-pointer group"
                                    onClick={() => navigate('/admin/assignments')}
                                >
                                    <div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{course.title}</h4>
                                        <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">{course.subtitle}</p>
                                    </div>
                                    <span className="text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        Open Portal <span className="text-base">&rarr;</span>
                                    </span>
                                </div>
                            )) : (
                                <p className="text-center py-6 text-gray-500 italic">No classes assigned to you.</p>
                            )}
                        </div>
                    </Card>
                )}

                {isAdmin && (
                    <Card title="System Diagnostics" className="mt-6 border-none bg-purple-900 text-white rounded-[2rem] shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 transform translate-x-1/2 -translate-y-1/2 bg-white/10 w-64 h-64 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
                        <div className="flex flex-col sm:flex-row gap-6 relative z-10 p-4">
                            <div className="flex-1">
                                <h4 className="text-purple-300 text-xs font-black uppercase tracking-[0.3em] mb-2">Developer Operations</h4>
                                <p className="text-purple-100/80 text-sm leading-relaxed max-w-md italic">
                                    Full administrative telemetry engaged. You can manage global curriculum frameworks, monitor student enrollment velocity, and secure system-wide configurations.
                                </p>
                            </div>
                            <div className="shrink-0 flex items-center">
                                <Button
                                    onClick={() => navigate('/admin/settings')}
                                    className="bg-white text-purple-900 hover:bg-purple-100 font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-full shadow-lg"
                                >
                                    System Settings
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

        </div>
    );
}