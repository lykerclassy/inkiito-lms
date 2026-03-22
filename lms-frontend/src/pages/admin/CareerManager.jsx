import React, { useState, useEffect, useContext } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageLoader from '../../components/common/PageLoader';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { AuthContext } from '../../contexts/AuthContext';

export default function CareerManager() {
    const { user: currentUser } = useContext(AuthContext);
    const [pathways, setPathways] = useState([]);
    const [careers, setCareers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showNotification, askConfirmation } = useNotification();
    const [activeTab, setActiveTab] = useState('careers'); // 'careers' | 'pathways'

    // Form States
    const [isEditingCareer, setIsEditingCareer] = useState(null); // ID or 'new'
    const [isEditingPathway, setIsEditingPathway] = useState(null); // ID or 'new'
    const [isEditingTrack, setIsEditingTrack] = useState(null); // {id, pathway_id} or 'new'

    const [careerForm, setCareerForm] = useState({
        pathway_id: '',
        career_track_id: '',
        name: '',
        description: '',
        salary_range: '',
        outlook: 'Steady',
        qualifications: '',
        skills: '',
        typical_employers: '',
        subjects: []
    });

    const [pathwayForm, setPathwayForm] = useState({
        name: '',
        description: '',
        color_code: 'blue',
        icon: ''
    });

    const [trackForm, setTrackForm] = useState({
        pathway_id: '',
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [pRes, cRes, sRes] = await Promise.all([
                api.get('pathways'),
                api.get('careers'),
                api.get('subjects')
            ]);
            setPathways(pRes.data);
            setCareers(cRes.data);
            setSubjects(sRes.data);
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Pathway Actions ---
    const handleSavePathway = async (e) => {
        e.preventDefault();
        try {
            if (isEditingPathway === 'new') {
                await api.post('pathways', pathwayForm);
            } else {
                await api.put(`pathways/${isEditingPathway}`, pathwayForm);
            }
            setIsEditingPathway(null);
            fetchData();
            showNotification("Pathway updated successfully.", "success");
        } catch (err) {
            showNotification("Save failed", "error");
        }
    };

    const handleDeletePathway = async (id) => {
        const confirmed = await askConfirmation("Delete this pathway? All tracks and careers will be affected.", "Destroy Pathway?");
        if (!confirmed) return;
        try {
            await api.delete(`pathways/${id}`);
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.message || "Delete failed", "error");
        }
    };

    // --- Track Actions ---
    const handleSaveTrack = async (e) => {
        e.preventDefault();
        try {
            if (isEditingTrack === 'new') {
                await api.post('career-tracks', trackForm);
            } else {
                await api.put(`career-tracks/${isEditingTrack.id}`, trackForm);
            }
            setIsEditingTrack(null);
            fetchData();
            showNotification("Track saved.", "success");
        } catch (err) {
            showNotification("Save failed", "error");
        }
    };

    const handleDeleteTrack = async (id) => {
        const confirmed = await askConfirmation("Delete this track? Careers using it will be unassigned.", "Delete Track?");
        if (!confirmed) return;
        try {
            await api.delete(`career-tracks/${id}`);
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.message || "Delete failed", "error");
        }
    };

    // --- Career Actions ---
    const handleSaveCareer = async (e) => {
        e.preventDefault();
        try {
            if (isEditingCareer === 'new') {
                await api.post('careers', careerForm);
            } else {
                await api.put(`careers/${isEditingCareer}`, careerForm);
            }
            setIsEditingCareer(null);
            fetchData();
            showNotification("Career commited to repository.", "success");
        } catch (err) {
            showNotification("Save failed", "error");
        }
    };

    const toggleSubject = (subId) => {
        const exists = careerForm.subjects.find(s => s.id === subId);
        if (exists) {
            setCareerForm({ ...careerForm, subjects: careerForm.subjects.filter(s => s.id !== subId) });
        } else {
            setCareerForm({ ...careerForm, subjects: [...careerForm.subjects, { id: subId, is_mandatory: false }] });
        }
    };

    if (isLoading) return <PageLoader message="Architecting Career Hierarchy..." color="blue" />;

    return (
        <div className="space-y-6 pb-20">
            {/* Contextual Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Governance: Career Focus</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] mt-1 tracking-widest leading-none">Pillars, Tracks & Professional Paths</p>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full lg:w-auto">
                    <button onClick={() => setActiveTab('careers')} className={`flex-1 lg:flex-none px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'careers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Careers</button>
                    <button onClick={() => setActiveTab('pathways')} className={`flex-1 lg:flex-none px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pathways' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Setup Pathways</button>
                </div>
            </header>

            {activeTab === 'careers' ? (
                <div className="space-y-6">
                    {!isEditingCareer ? (
                        <>
                            <div className="flex justify-end">
                                <Button onClick={() => {
                                    setCareerForm({ pathway_id: pathways[0]?.id || '', career_track_id: '', name: '', description: '', salary_range: '', outlook: 'Steady', qualifications: '', skills: '', typical_employers: '', subjects: [] });
                                    setIsEditingCareer('new');
                                }} className="px-8 bg-gray-900 border-none shadow-xl shadow-gray-200 uppercase text-[10px] font-black tracking-widest">+ New Career Path</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {careers.map(career => (
                                    <div key={career.id} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm group hover:shadow-xl transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className={`px-3 py-1 bg-gray-50 text-gray-900 rounded-full text-[9px] font-black uppercase tracking-widest border border-gray-100`}>
                                                {career.pathway.name}
                                            </span>
                                            <div className="flex gap-2">
                                                <button onClick={() => {
                                                    setCareerForm({
                                                        pathway_id: career.pathway_id,
                                                        career_track_id: career.career_track_id || '',
                                                        name: career.name,
                                                        description: career.description,
                                                        salary_range: career.salary_range || '',
                                                        outlook: career.outlook || 'Steady',
                                                        qualifications: career.qualifications || '',
                                                        skills: career.skills || '',
                                                        typical_employers: career.typical_employers || '',
                                                        subjects: career.subjects.map(s => ({ id: s.id, is_mandatory: !!s.pivot?.is_mandatory }))
                                                    });
                                                    setIsEditingCareer(career.id);
                                                }} className="p-2.5 bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white rounded-xl transition-all">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                                </button>
                                                <button onClick={() => {
                                                    askConfirmation("Delete this career?", "Confirm Action").then(ok => {
                                                        if(ok) api.delete(`careers/${career.id}`).then(() => fetchData());
                                                    });
                                                }} className="p-2.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight italic uppercase mb-1">{career.name}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{career.career_track?.name || 'General Core'}</p>
                                        <div className="flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {career.subjects.slice(0, 3).map(s => (
                                                <span key={s.id} className="px-2 py-1 bg-gray-100 rounded-md text-[8px] font-black uppercase text-gray-600">{s.name}</span>
                                            ))}
                                            {career.subjects.length > 3 && <span className="text-[8px] font-black text-gray-400">+{career.subjects.length - 3}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-5 duration-500">
                            <Card title="Professional Definition">
                                <form onSubmit={handleSaveCareer} className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Job Title</label>
                                        <input required className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-gray-900 rounded-2xl outline-none font-black text-gray-900" value={careerForm.name} onChange={(e) => setCareerForm({ ...careerForm, name: e.target.value })} />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Foundation Pillar</label>
                                            <select className="w-full p-4 bg-gray-50 rounded-2xl font-black text-gray-900 outline-none" value={careerForm.pathway_id} onChange={(e) => setCareerForm({ ...careerForm, pathway_id: e.target.value, career_track_id: '' })}>
                                                {pathways.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Specialty Track</label>
                                            <select className="w-full p-4 bg-gray-50 rounded-2xl font-black text-gray-900 outline-none" value={careerForm.career_track_id} onChange={(e) => setCareerForm({ ...careerForm, career_track_id: e.target.value })}>
                                                <option value="">Select a Track</option>
                                                {pathways.find(p => p.id == careerForm.pathway_id)?.tracks?.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contextual Description</label>
                                        <textarea required className="w-full p-4 bg-gray-50 rounded-2xl font-bold h-32 outline-none" value={careerForm.description} onChange={(e) => setCareerForm({ ...careerForm, description: e.target.value })} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Salary Indication</label>
                                            <input placeholder="KSh 100k - 300k" className="w-full p-4 bg-gray-50 rounded-2xl font-black outline-none" value={careerForm.salary_range} onChange={(e) => setCareerForm({ ...careerForm, salary_range: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Outlook</label>
                                            <select className="w-full p-4 bg-gray-50 rounded-2xl font-black outline-none" value={careerForm.outlook} onChange={(e) => setCareerForm({ ...careerForm, outlook: e.target.value })}>
                                                <option>Steady</option>
                                                <option>Growth</option>
                                                <option>High Growth</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button type="button" variant="outline" onClick={() => setIsEditingCareer(null)} className="flex-1 py-4 border-2 border-gray-100 uppercase text-[10px] font-black">Discard</Button>
                                        <Button type="submit" className="flex-1 py-4 bg-gray-900 border-none uppercase text-[10px] font-black tracking-widest">Commit Path</Button>
                                    </div>
                                </form>
                            </Card>

                            <Card title="Academic Prerequisites">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Select relevant subjects</p>
                                    <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {subjects.map(s => {
                                            const mapping = careerForm.subjects.find(ms => ms.id === s.id);
                                            return (
                                                <div key={s.id} className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${mapping ? 'bg-gray-900 border-gray-900' : 'bg-gray-50 border-transparent'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <input type="checkbox" className="w-5 h-5 accent-gray-400 cursor-pointer" checked={!!mapping} onChange={() => toggleSubject(s.id)} />
                                                        <span className={`font-black text-[12px] uppercase ${mapping ? 'text-white' : 'text-gray-900'}`}>{s.name}</span>
                                                    </div>
                                                    {mapping && (
                                                        <div className="flex bg-gray-800 p-1 rounded-xl shadow-inner">
                                                            <button onClick={() => setCareerForm({...careerForm, subjects: careerForm.subjects.map(sub => sub.id === s.id ? {...sub, is_mandatory: true} : sub)})} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${mapping.is_mandatory ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400'}`}>Mandatory</button>
                                                            <button onClick={() => setCareerForm({...careerForm, subjects: careerForm.subjects.map(sub => sub.id === s.id ? {...sub, is_mandatory: false} : sub)})} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${!mapping.is_mandatory ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400'}`}>Recommended</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-end">
                        <Button onClick={() => { setPathwayForm({ name: '', description: '', color_code: 'blue', icon: '' }); setIsEditingPathway('new'); }} className="px-8 bg-gray-900 border-none uppercase text-[10px] font-black tracking-widest">+ Define New Pillar</Button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {pathways.map(p => (
                            <div key={p.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500">
                                <div className="p-8 pb-4">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-xl rotate-3`}>
                                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setPathwayForm({ name: p.name, description: p.description, color_code: p.color_code, icon: p.icon }); setIsEditingPathway(p.id); }} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                            </button>
                                            <button onClick={() => handleDeletePathway(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">{p.name}</h3>
                                    <p className="text-sm text-gray-500 font-bold leading-relaxed line-clamp-3 mb-6">{p.description}</p>
                                    
                                    <div className="border-t border-gray-100 pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[10px] font-black uppercase text-gray-900 tracking-widest">Tracks within Pillar</h4>
                                            <button onClick={() => { setTrackForm({ pathway_id: p.id, name: '', description: '' }); setIsEditingTrack('new'); }} className="text-[10px] font-black text-school-primary uppercase hover:scale-105 transition-transform">+ Add Track</button>
                                        </div>
                                        <div className="space-y-2">
                                            {p.tracks?.map(t => (
                                                <div key={t.id} className="group/track flex items-center justify-between bg-gray-50 p-4 rounded-2xl hover:bg-gray-100 transition-all">
                                                    <span className="text-[11px] font-black text-gray-900 uppercase italic">{t.name}</span>
                                                    <div className="flex gap-2 opacity-0 group-hover/track:opacity-100 transition-opacity">
                                                        <button onClick={() => { setTrackForm({ pathway_id: p.id, name: t.name, description: t.description }); setIsEditingTrack(t); }} className="p-1.5 text-gray-400 hover:text-gray-900"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                        <button onClick={() => handleDeleteTrack(t.id)} className="p-1.5 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODALS */}
            
            {/* Pathway Modal */}
            {isEditingPathway && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-500">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic mb-8">{isEditingPathway === 'new' ? 'Initialize Pillar' : 'Refine Pillar'}</h2>
                        <form onSubmit={handleSavePathway} className="space-y-8">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Pillar Identity</label>
                                <input required className="w-full p-5 bg-gray-50 rounded-3xl outline-none font-black text-gray-900 text-lg" value={pathwayForm.name} onChange={(e) => setPathwayForm({...pathwayForm, name: e.target.value})} placeholder="e.g. STEM" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Manifesto / Description</label>
                                <textarea required className="w-full p-5 bg-gray-50 rounded-3xl outline-none font-bold text-gray-800 h-32" value={pathwayForm.description} onChange={(e) => setPathwayForm({...pathwayForm, description: e.target.value})} placeholder="Describe the mission of this pathway..." />
                            </div>
                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditingPathway(null)} className="flex-1 py-5 rounded-2xl border-2 border-gray-100 uppercase text-[10px] font-black">Abort</Button>
                                <Button type="submit" className="flex-1 py-5 rounded-2xl bg-gray-900 border-none uppercase text-[10px] font-black tracking-widest shadow-xl shadow-gray-200">Commit Pillar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Track Modal */}
            {isEditingTrack && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-500">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic mb-8">{isEditingTrack === 'new' ? 'Deploy Specialty Track' : 'Update Track'}</h2>
                        <form onSubmit={handleSaveTrack} className="space-y-8">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Track Designation</label>
                                <input required className="w-full p-5 bg-gray-50 rounded-3xl outline-none font-black text-gray-900 text-lg" value={trackForm.name} onChange={(e) => setTrackForm({...trackForm, name: e.target.value})} placeholder="e.g. Robotics & AI" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Specialization Focus</label>
                                <textarea className="w-full p-5 bg-gray-50 rounded-3xl outline-none font-bold text-gray-800 h-32" value={trackForm.description} onChange={(e) => setTrackForm({...trackForm, description: e.target.value})} placeholder="Focus areas for this track..." />
                            </div>
                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditingTrack(null)} className="flex-1 py-5 rounded-2xl border-2 border-gray-100 uppercase text-[10px] font-black">Cancel</Button>
                                <Button type="submit" className="flex-1 py-5 rounded-2xl bg-gray-900 border-none uppercase text-[10px] font-black tracking-widest shadow-xl shadow-school-primary/10">Launch Track</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
