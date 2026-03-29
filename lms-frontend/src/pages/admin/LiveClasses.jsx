import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageLoader from '../../components/common/PageLoader';
import { useNotification } from '../../contexts/NotificationContext';
import { AuthContext } from '../../contexts/AuthContext';
import { format, isAfter, isBefore, addHours } from 'date-fns';

export default function LiveClasses() {
    const { user } = useContext(AuthContext);
    const { showNotification, askConfirmation } = useNotification();
    const [liveClasses, setLiveClasses] = useState([]);
    const [mySubjects, setMySubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        subject_id: '',
        title: '',
        description: '',
        start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end_time: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        meeting_link: ''
    });

    const isStaff = ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'class_teacher', 'teacher'].includes(user?.role);

    const fetchData = async () => {
        try {
            const [classesRes, subjectsRes] = await Promise.all([
                api.get('live-classes'),
                api.get('subjects')
            ]);
            setLiveClasses(classesRes.data);
            
            // For staff, only show subjects they teach or all if management
            if (isStaff) {
                setMySubjects(subjectsRes.data);
            }
        } catch (err) {
            console.error("Failed to fetch live classes:", err);
            showNotification("Could not load live classes.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Auto-refresh data every 30 seconds to update statuses in real-time
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateClass = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.post('live-classes', formData);
            setLiveClasses([res.data.live_class, ...liveClasses]);
            setIsCreateModalOpen(false);
            showNotification(res.data.message, "success");
            // Reset form
            setFormData({
                subject_id: '',
                title: '',
                description: '',
                start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                end_time: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
                meeting_link: ''
            });
        } catch (err) {
            showNotification(err.response?.data?.message || "Failed to schedule class.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClass = async (id) => {
        const confirmed = await askConfirmation("Are you sure you want to cancel this live class?");
        if (!confirmed) return;

        try {
            await api.delete(`live-classes/${id}`);
            setLiveClasses(liveClasses.filter(c => c.id !== id));
            showNotification("Live class cancelled.", "success");
        } catch (err) {
            showNotification("Failed to cancel class.", "error");
        }
    };

    const getStatusBadge = (liveClass) => {
        const status = liveClass.computed_status || 'scheduled';

        if (status === 'scheduled') {
            return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Scheduled</span>;
        }
        if (status === 'started') {
            return (
                <span className="flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span>
                    Live Now
                </span>
            );
        }
        if (status === 'ended') {
            return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-wider">Finished</span>;
        }
        if (status === 'cancelled') {
            return <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Cancelled</span>;
        }

        return <span className="px-2 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-wider italic">Scheduled</span>;
    };

    if (isLoading) return <PageLoader message="Connecting to live stream engine..." />;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">Live Classes</h1>
                    <p className="text-gray-500">Create and join real-time interactive learning sessions via Google Meet.</p>
                </div>
                {isStaff && (
                    <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                        + Schedule New Session
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveClasses.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 uppercase italic">No Live Classes</h3>
                        <p className="text-gray-500 max-w-xs mx-auto text-sm mt-1">There are no upcoming live sessions scheduled at this time.</p>
                    </div>
                ) : (
                    liveClasses.map((lc) => (
                        <Card key={lc.id} noPadding={true} className="overflow-hidden hover:shadow-xl transition-all group border-0 shadow-lg shadow-gray-100">
                            <div className="p-1 bg-gradient-to-r from-school-primary/20 to-school-secondary/20 h-2"></div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-school-primary">{lc.subject?.name || 'General'}</p>
                                        <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-school-primary transition-colors">{lc.title}</h3>
                                    </div>
                                    {getStatusBadge(lc)}
                                </div>
                                
                                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{lc.description || 'Join this live session to interact with your teacher and peers in real-time.'}</p>
                                
                                <div className="space-y-3 pt-2 border-t border-gray-50">
                                    <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                                        <span>{format(new Date(lc.start_time), "EEE, MMM do • h:mm a")}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <span>Taught by <span className="font-bold text-gray-900">{lc.teacher?.name}</span></span>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-2">
                                    <a 
                                        href={lc.meeting_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button variant="primary" className="w-full shadow-lg shadow-school-primary/20">
                                            Join Meeting
                                        </Button>
                                    </a>
                                    {isStaff && (lc.teacher_id === user.id || ['admin', 'developer'].includes(user.role)) && (
                                        <button 
                                            onClick={() => handleDeleteClass(lc.id)}
                                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
                                            title="Cancel Class"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* CREATE MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Live Scheduler</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Connect with your students</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateClass} className="p-8 space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Academic Subject</label>
                                <select 
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-school-primary outline-none transition-all font-bold text-gray-900"
                                    value={formData.subject_id}
                                    onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                                >
                                    <option value="">Select Target Subject</option>
                                    {mySubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Session Title</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. Introduction to Calculus Live"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-school-primary outline-none transition-all font-bold text-gray-900"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Start Time</label>
                                    <input 
                                        type="datetime-local" 
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-school-primary outline-none transition-all font-bold text-gray-900"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">End Time</label>
                                    <input 
                                        type="datetime-local" 
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-school-primary outline-none transition-all font-bold text-gray-900"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Google Meet Link (Optional)</label>
                                <input 
                                    type="url" 
                                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-school-primary outline-none transition-all font-bold text-gray-900"
                                    value={formData.meeting_link}
                                    onChange={(e) => setFormData({...formData, meeting_link: e.target.value})}
                                />
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1 px-1">Leave blank to auto-generate a secure Inkiito link.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1 shadow-xl shadow-school-primary/20" isLoading={isSubmitting}>
                                    Initialize Class
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
