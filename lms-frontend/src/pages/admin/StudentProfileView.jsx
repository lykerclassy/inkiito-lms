import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageLoader from '../../components/common/PageLoader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

// Mini stat card (reused from Dashboard)
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

export default function StudentProfileView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudentProfile();
    }, [id]);

    const fetchStudentProfile = async () => {
        try {
            const response = await api.get(`users/${id}/profile`);
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch student profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <PageLoader message="Loading student profile..." color="blue" />;
    if (!data) return <div className="p-8 text-center text-gray-500">Student profile not found.</div>;

    const { student, subjects, pendingAssignments, completedAssignments, recentActivity, stats } = data;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 md:p-0">
            
            {/* Top Navigation / Breadcrumbs */}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2 italic">
                <button onClick={() => navigate('/admin/users')} className="hover:text-school-primary transition-colors">User Management</button>
                <span>/</span>
                <span className="text-gray-900">Student Profile</span>
            </div>

            {/* Welcome Banner (Mirroring Student Dashboard) */}
            <div className="relative overflow-hidden rounded-2xl text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #d81d22 0%, #a01018 60%, #4b4da3 100%)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                    <svg viewBox="0 0 200 200" fill="white">
                        <circle cx="150" cy="50" r="80" />
                        <circle cx="50" cy="150" r="60" />
                    </svg>
                </div>
                <div className="relative z-10 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center overflow-hidden shadow-xl">
                                {student.avatar ? (
                                    <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-black text-white/50 italic">{student.name.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <p className="text-red-200 text-[10px] font-black uppercase tracking-[0.4em] mb-2 italic">
                                    Student Profile
                                </p>
                                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight uppercase">
                                    {student.name}
                                </h1>
                                <p className="text-red-100 text-[11px] mt-3 font-bold uppercase tracking-[0.2em] opacity-80 italic">
                                    {student.curriculum?.name || student.curriculum_name || 'Unassigned'} · {student.academic_level?.name || student.academic_level_name || 'Unassigned'} · ADM No: {student.admission_number || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2.5 text-center border border-white/20 shadow-lg">
                                <p className="text-white font-bold text-lg leading-none">{stats.totalSubjects}</p>
                                <p className="text-red-100 text-[10px] font-medium uppercase tracking-wider mt-1 opacity-70">Subjects</p>
                            </div>
                            <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2.5 text-center border border-white/20 shadow-lg">
                                <p className="text-white font-bold text-lg leading-none">{stats.pendingAssignmentsCount}</p>
                                <p className="text-red-100 text-[10px] font-medium uppercase tracking-wider mt-1 opacity-70">Due Soon</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">

                {/* Left Column — Main Progress and Assignments */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>}
                            value={stats.totalSubjects}
                            label="Total Subjects"
                            color="bg-school-primary shadow-lg shadow-red-100"
                        />
                        <StatCard
                            icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                            value={stats.pendingAssignmentsCount}
                            label="Pending Tasks"
                            color="bg-school-secondary shadow-lg shadow-indigo-100"
                        />
                        <StatCard
                            icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                            value={stats.completedSubjectsCount}
                            label="Subjects On Track"
                            color="bg-amber-500 shadow-lg shadow-amber-100"
                        />
                    </div>

                    {/* Subject Progress List */}
                    <Card noPadding className="overflow-hidden border-none shadow-sm rounded-2xl">
                        <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div>
                                <h2 className="text-lg font-black italic uppercase tracking-widest text-gray-900 leading-none">Subjects</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">Overall Progress</p>
                            </div>
                            <div className="hidden md:block">
                                <span className="text-[10px] font-black uppercase text-gray-300 tracking-[0.4em] italic leading-none">Course Overview</span>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50 bg-white">
                            {subjects.map(subject => (
                                <div key={subject.id} className="p-8 hover:bg-gray-50/50 transition-all duration-300 group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-black text-sm group-hover:bg-school-primary group-hover:text-white group-hover:border-school-primary group-hover:rotate-12 transition-all duration-500">
                                                {subject.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black uppercase italic tracking-tighter text-gray-800">{subject.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`w-2 h-2 rounded-full ${subject.status === 'active' ? 'bg-emerald-400' : 'bg-gray-300'}`}></span>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">{subject.status} Enrollment</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-gray-900 italic tracking-tighter">{subject.progress}%</span>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Completion</p>
                                        </div>
                                    </div>
                                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-3 shadow-inner">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-school-primary rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(216,29,34,0.3)]"
                                            style={{ width: `${subject.progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">{subject.completed_lessons} Units Mastered</span>
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">{subject.total_lessons} Total Curriculum Units</span>
                                    </div>
                                </div>
                            ))}
                            {subjects.length === 0 && (
                                <div className="p-12 text-center text-gray-300 italic uppercase font-black tracking-widest text-sm">
                                    No subject enrollments detected.
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Detailed Assignments Table */}
                    <Card noPadding className="overflow-hidden border-none shadow-sm rounded-2xl">
                        <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div>
                                <h2 className="text-lg font-black italic uppercase tracking-widest text-gray-900 leading-none">Assignments</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">Submission History</p>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto bg-white">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5">Assignment Name</th>
                                        <th className="px-8 py-5">Subject</th>
                                        <th className="px-8 py-5 text-center">Due Date</th>
                                        <th className="px-8 py-5 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[...pendingAssignments, ...completedAssignments].map((task, idx) => (
                                        <tr key={task.id || idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-black text-gray-800 uppercase tracking-tighter italic leading-none">{task.title}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">ID_REF: #{task.id}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-black uppercase px-4 py-1.5 bg-gray-100 text-gray-500 rounded-xl whitespace-nowrap border border-gray-200 shadow-sm">
                                                    {task.subject}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <p className={`text-xs font-black italic uppercase tracking-tighter ${task.due.includes('Overdue') ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>{task.due}</p>
                                                <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em] mt-1 opacity-60 leading-none">{task.due_date}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full border shadow-sm ${
                                                        task.status === 'graded' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        task.status === 'submitted' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-red-50 text-red-500 border-red-100'
                                                    }`}>
                                                        {task.status}
                                                    </span>
                                                    {task.score !== null && (
                                                        <span className="text-[11px] font-black text-gray-900 italic tracking-tighter underline decoration-school-primary decoration-2 underline-offset-4">Verified Score: {task.score}%</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {pendingAssignments.length === 0 && completedAssignments.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-16 text-center text-gray-300 italic uppercase font-black tracking-[0.4em] text-sm">
                                                Zero assignment data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar — Student Meta Data */}
                <div className="space-y-8">
                    
                    {/* Career Goal */}
                    {student.target_career ? (
                        <div className="rounded-2xl overflow-hidden shadow-lg relative group bg-indigo-900 border border-white/10"
                            style={{ background: 'linear-gradient(135deg, #4b4da3 0%, #2d2f7a 100%)' }}>
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <svg className="w-32 h-32" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14H11V7h2v9z"/></svg>
                            </div>
                            <div className="p-10 relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.8)]"></span>
                                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.4em] italic">Set Career Goal</p>
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">
                                    {student.target_career.name}
                                </h3>
                                <p className="text-indigo-200 text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 italic">{student.target_career.pathway?.name}</p>
                                <div className="mt-10 pt-8 border-t border-white/10">
                                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em] leading-relaxed opacity-60 italic">Coursework is aligned with this career goal.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border-4 border-dashed border-gray-100 p-12 text-center shadow-2xl shadow-indigo-900/5 transition-all hover:bg-gray-50 duration-500">
                            <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <svg className="w-10 h-10 text-school-secondary opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <p className="text-base font-black uppercase italic tracking-tighter text-gray-800">No Goal Set</p>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-3 max-w-[180px] mx-auto leading-relaxed">No career goal has been chosen for this student.</p>
                        </div>
                    )}

                    {/* Recent Timeline */}
                    <Card noPadding className="overflow-hidden border-none shadow-sm rounded-2xl">
                        <div className="px-8 py-7 border-b border-gray-100 bg-white">
                            <h2 className="text-base font-black italic uppercase tracking-widest text-gray-900 leading-none">Recent Activity</h2>
                        </div>
                        <div className="p-8 space-y-8 bg-white">
                            {recentActivity.map((act, idx) => (
                                <div key={idx} className="flex gap-6 group">
                                    <div className="relative flex flex-col items-center">
                                        <div className={`w-3.5 h-3.5 rounded-full ${act.type === 'lesson' ? 'bg-school-primary shadow-[0_0_10px_rgba(216,29,34,0.4)]' : 'bg-school-secondary shadow-[0_0_10px_rgba(75,77,163,0.4)]'} z-10`} />
                                        {idx !== recentActivity.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 absolute top-4 bottom--4" />}
                                    </div>
                                    <div className="pb-8">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 italic opacity-60">{act.date}</p>
                                        <h4 className="text-sm font-black uppercase text-gray-800 tracking-tighter leading-tight group-hover:text-school-primary transition-all duration-300">{act.title}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{act.subject}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                            <span className="text-[10px] text-school-primary font-black uppercase tracking-widest italic">{act.description}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {recentActivity.length === 0 && (
                                <p className="text-center py-10 text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 italic">Historical data purged</p>
                            )}
                        </div>
                    </Card>

                    {/* Student Snapshot Summary */}
                    <Card className="border border-gray-100 shadow-sm rounded-2xl p-6 bg-white text-gray-900 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all duration-1000 rotate-12 group-hover:rotate-0">
                            <svg className="w-40 h-40 text-gray-200" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-school-primary mb-8 italic">Student Summary</h3>
                        <div className="space-y-8 relative z-10">
                            <div className="grid grid-cols-2 gap-6 pb-2">
                                <div>
                                    <p className="text-[10px] font-black text-school-secondary uppercase tracking-[0.2em] mb-4 italic">Academic Track</p>
                                    <div className="bg-gray-50 border border-gray-100 p-5 rounded-3xl shadow-sm transition-all hover:bg-gray-100">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Curriculum</p>
                                        <p className="text-sm font-black text-gray-900 italic tracking-tighter uppercase">{student.curriculum?.name || student.curriculum_name || 'Unassigned'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-school-secondary uppercase tracking-[0.2em] mb-4 italic">Grade Level</p>
                                    <div className="bg-gray-50 border border-gray-100 p-5 rounded-3xl shadow-sm transition-all hover:bg-gray-100">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Level</p>
                                        <p className="text-sm font-black text-gray-900 italic tracking-tighter uppercase">{student.academic_level?.name || student.academic_level_name || 'Unassigned'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <p className="text-[10px] font-black text-school-secondary uppercase tracking-[0.2em] mb-4 italic">Contact Details</p>
                                <div className="bg-gray-50 border border-gray-100 p-5 rounded-3xl shadow-sm transition-all hover:bg-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</p>
                                    <p className="text-sm font-black text-gray-900 tracking-tighter underline decoration-school-primary decoration-2 underline-offset-4">{student.email || 'No email associated'}</p>
                                </div>
                            </div>
                            <div className="pt-8 mt-8 border-t border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] text-center italic leading-relaxed">
                                    Inkiito Learning Management System <br/> Official School Record
                                </p>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
