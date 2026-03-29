import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import PageLoader from '../../components/common/PageLoader';
import Button from '../../components/common/Button';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

export default function MuseumPortfolio() {
    const { user } = useContext(AuthContext);
    const { showNotification } = useNotification();
    const [searchParams, setSearchParams] = useSearchParams();
    const [wings, setWings] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeWing, setActiveWing] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Get student_id from URL - Staff MUST select a student to see anything
    const selectedStudentId = searchParams.get('student_id') || (!isStaff ? user?.id : null);

    // Is the viewer a staff member?
    const isStaff = ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'teacher', 'class_teacher'].includes(user?.role);
    
    // Filtered students for search
    const filteredStudents = students.filter(s => 
        (s.admission_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Upload Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        subject_id: '',
        title: '',
        description: '',
        media: null,
        exhibition_date: format(new Date(), 'yyyy-MM-dd'),
        competency_tag: ''
    });

    const scrollRef = useRef(null);

    const fetchPortfolio = async () => {
        setIsLoading(true);
        try {
            // Include student_id if staff is viewing, or current user if student
            const res = await api.get('portfolios', { params: { student_id: selectedStudentId } });
            setWings(res.data);
            const wingNames = Object.keys(res.data);
            if (wingNames.length > 0) {
                setActiveWing(wingNames[0]);
            } else {
                setActiveWing(null);
            }
        } catch (err) {
            showNotification("Could not open the Museum doors.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStudents = async () => {
        if (!isStaff) return;
        try {
            const res = await api.get('users', { params: { role: 'student' } });
            setStudents(res.data);
        } catch (err) {
            console.error("Failed to fetch student directory");
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await api.get('subjects');
            setSubjects(res.data);
        } catch (err) {
            console.error("Failed to fetch subjects");
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, [selectedStudentId]);

    useEffect(() => {
        fetchSubjects();
        fetchStudents();
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!formData.media) return showNotification("Please select an exhibit to upload.", "warning");
        
        setIsSubmitting(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });

        try {
            await api.post('portfolios', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showNotification("Your exhibit has been curated into the museum!", "success");
            setIsUploadModalOpen(false);
            fetchPortfolio();
            // Reset
            setFormData({
                subject_id: '',
                title: '',
                description: '',
                media: null,
                exhibition_date: format(new Date(), 'yyyy-MM-dd'),
                competency_tag: ''
            });
        } catch (err) {
            showNotification("The curator rejected your exhibit. Check file size/type.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <PageLoader message="Stepping into your Digital Museum..." />;

    const currentExhibits = activeWing ? wings[activeWing] : [];

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white overflow-hidden flex flex-col">
            
            {/* Museum Header */}
            <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-gradient-to-b from-black to-transparent">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-school-primary text-[10px] font-black uppercase tracking-[0.3em] italic rounded">Exhibit Gallery</span>
                        <div className="h-px w-12 bg-white/20"></div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic">
                            {isStaff && selectedStudentId !== user.id ? `Viewing ${students.find(s => s.id == selectedStudentId)?.name}'s Collection` : 'Personal Collection'}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none mt-2">
                        CBC <span className="text-school-primary brightness-125">Museum</span>
                    </h1>

                    {/* Highly Efficient Searchable Selector for Staff */}
                    {isStaff && (
                        <div className="mt-8 relative w-full max-w-xl group">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 w-full focus-within:border-indigo-500/50 transition-all">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input 
                                    type="text" 
                                    placeholder="Type Admission Number or Student Name to view exhibition..." 
                                    className="bg-transparent text-white font-medium text-sm outline-none flex-1 placeholder:text-gray-600"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-white/10 rounded-full">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>

                            {/* Live Search Results Results Panel */}
                            {searchQuery.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-[60] custom-scrollbar">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.slice(0, 10).map(s => (
                                            <button 
                                                key={s.id}
                                                onClick={() => {
                                                    setSearchParams({ student_id: s.id });
                                                    setSearchQuery('');
                                                }}
                                                className="w-full text-left p-4 flex items-center justify-between hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                                            >
                                                <div>
                                                    <p className="font-black text-sm uppercase tracking-tighter">{s.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{s.admission_number || 'No ADM'}</p>
                                                </div>
                                                <div className="px-3 py-1 bg-indigo-900/40 text-indigo-300 text-[10px] font-black uppercase rounded-lg border border-indigo-500/20">View Gallery</div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-600 italic text-sm">No students matched this criteria.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    {!isStaff ? (
                        <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-full hover:scale-105 transition-all shadow-2xl shadow-white/10"
                        >
                            + Add New Exhibit
                        </button>
                    ) : (
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic ml-4">Authorized Curator Review</span>
                            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
                                Staff Portal Active
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Empty State / Search Prompt for Staff when no student is selected */}
            {isStaff && !selectedStudentId && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-60">
                    <div className="w-24 h-24 mb-6 relative">
                        <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-pulse"></div>
                        <div className="absolute inset-4 border-2 border-indigo-500/20 rounded-full animate-ping"></div>
                        <svg className="absolute inset-6 w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                   <p className="text-xl font-black italic uppercase tracking-tighter">Waiting for Admission Entry</p>
                   <p className="text-sm text-gray-500 mt-2 max-w-sm">Please search and select a student above to open their digital museum exhibition.</p>
                </div>
            )}

            {/* Museum Wings (Navigation) */}
            <div className="px-8 pt-8 overflow-x-auto flex gap-6 no-scrollbar">
                {Object.keys(wings).map(wing => (
                    <button 
                        key={wing}
                        onClick={() => setActiveWing(wing)}
                        className={`whitespace-nowrap pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeWing === wing ? 'border-school-primary text-white scale-110' : 'border-transparent text-gray-600 hover:text-gray-400'}`}
                    >
                        {wing} Wing
                    </button>
                ))}
                {Object.keys(wings).length === 0 && (
                    <p className="text-gray-600 font-bold italic tracking-widest text-xs py-4">The wings are currently empty. Start curating below.</p>
                )}
            </div>

            {/* The Gallery Floor (2.5D Scrolling) */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-x-auto overflow-y-hidden flex items-center px-12 gap-16 no-scrollbar py-20 bg-[radial-gradient(circle_at_50%_0%,#1a1a20,transparent_70%)]"
            >
                {currentExhibits.length === 0 ? (
                    <div className="w-full flex flex-col items-center justify-center opacity-20">
                        <div className="w-32 h-32 border-4 border-dashed border-white rounded-[3rem] mb-6 flex items-center justify-center">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <p className="text-2xl font-black italic uppercase italic tracking-widest text-center">Empty Wing</p>
                    </div>
                ) : (
                    currentExhibits.map((exhibit, idx) => (
                        <div 
                            key={exhibit.id}
                            className="flex-shrink-0 w-64 md:w-80 group relative"
                            style={{ 
                                perspective: '1000px',
                                transform: `translateY(${idx % 2 === 0 ? '-15px' : '15px'})`
                            }}
                        >
                            {/* The Frame */}
                            <div className="relative bg-[#121214] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] transform-gpu transition-all duration-700 group-hover:rotate-y-12 group-hover:scale-105 border-[10px] border-[#1a1a1c] rounded-sm">
                                
                                <div className="aspect-video bg-black overflow-hidden relative border border-white/5">
                                    {exhibit.media_type === 'image' && (
                                        <img src={exhibit.media_path} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={exhibit.title} />
                                    )}
                                    {exhibit.media_type === 'audio' && (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-950/40 p-4 text-center">
                                            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-2 animate-pulse">
                                                <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                                            </div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-300">Audio Exhibition</p>
                                        </div>
                                    )}
                                    {exhibit.media_type === 'video' && (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-red-950/40 p-4">
                                             <svg className="w-10 h-10 text-red-500/50 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09s-.03 1.29-.1 2.09c-.06.8-.15 1.43-.28 1.9-.17.6-.44 1.05-.83 1.32-.38.27-.85.45-1.39.53-1.01.16-2.61.24-4.8.24s-3.79-.08-4.8-.24c-.54-.08-1.01-.26-1.39-.53-.39-.27-.66-.72-.83-1.32-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09s.03-1.29.1-2.09c.06-.8.15-1.43.28-1.9.17-.6.44-1.05.83-1.32.38-.27.85-.45 1.39-.53 1.01-.16-2.61-.24 4.8-.24s3.79.08 4.8.24c.54.08 1.01.26 1.39.53.39.27.66.72.83 1.32z"/></svg>
                                             <p className="text-[8px] font-black uppercase tracking-widest text-red-300">Video Presentation</p>
                                        </div>
                                    )}

                                    {/* Overlay Info */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                                        <p className="text-[9px] font-black text-school-primary uppercase tracking-widest mb-1">{exhibit.competency_tag || 'Core Competency'}</p>
                                        <h4 className="text-white font-bold leading-tight">{exhibit.title}</h4>
                                    </div>
                                </div>

                                {/* Museum Label */}
                                <div className="mt-3 pt-3 border-t border-white/5">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">
                                        {format(new Date(exhibit.exhibition_date), 'MMMM yyyy')}
                                    </p>
                                    <h3 className="text-white font-black uppercase tracking-tighter italic text-base truncate">{exhibit.title}</h3>
                                    <p className="text-[9px] text-gray-500 font-medium line-clamp-1 mt-1 leading-relaxed">
                                        {exhibit.description}
                                    </p>
                                </div>
                            </div>

                            {/* Lighting Effect */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-400/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    ))
                )}
            </div>

            {/* Museum Footer Stats */}
            <div className="p-8 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 italic">
                <span>End of {activeWing || 'Wing'} Exhibition</span>
                <span className="animate-pulse text-school-primary">Walking the Timeline</span>
                <span>Inkiito Museum v1.0</span>
            </div>

            {/* UPLOAD MODAL */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 overflow-hidden p-8 md:p-12 relative">
                        <button 
                            onClick={() => setIsUploadModalOpen(false)}
                            className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="mb-8">
                            <p className="text-school-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2 italic">CBC Curator</p>
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Add Your <span className="text-white">Exhibit</span></h2>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Subject Wing</label>
                                    <select 
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:border-school-primary outline-none text-white font-bold"
                                        value={formData.subject_id}
                                        onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                                    >
                                        <option value="" className="bg-gray-900">Select Subject</option>
                                        {subjects.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Date Created</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:border-school-primary outline-none text-white font-bold"
                                        value={formData.exhibition_date}
                                        onChange={(e) => setFormData({...formData, exhibition_date: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Exhibit Title</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g. My Solar System Project"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:border-school-primary outline-none text-white font-bold"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Curator's Statement</label>
                                <textarea 
                                    rows="2"
                                    placeholder="Describe the skills you demonstrated..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:border-school-primary outline-none text-white font-semibold"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Upload Exhibit (Img/Audio/Video)</label>
                                <input 
                                    type="file"
                                    required
                                    accept="image/*,audio/*,video/*"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-white file:text-black"
                                    onChange={(e) => setFormData({...formData, media: e.target.files[0]})}
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-school-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:brightness-110 shadow-xl shadow-school-primary/20 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Curating Gallery...' : 'Publish to Museum'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
