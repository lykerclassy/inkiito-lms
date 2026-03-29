import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

export default function CampusCommunities() {
    const [communities, setCommunities] = useState([]);
    const [subjectTitles, setSubjectTitles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', is_public: true, subject_title_id: '' });
    
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const isStaff = ['admin', 'developer', 'principal', 'teacher', 'class_teacher', 'dos', 'deputy_principal'].includes(user?.role);

    useEffect(() => {
        fetchCommunities();
    }, []);

    const fetchCommunities = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('communities');
            setCommunities(res.data.communities || []);
            setSubjectTitles(res.data.subjects || []);
        } catch (err) {
            showNotification('Failed to load communities', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('communities', formData);
            showNotification('Community created', 'success');
            setShowModal(false);
            setFormData({ name: '', description: '', is_public: true, subject_title_id: '' });
            fetchCommunities();
        } catch (err) {
            showNotification('Failed to create community', 'error');
        }
    };

    const handleJoin = async (community, e) => {
        e.stopPropagation();
        if (!community.can_join) {
            showNotification(`Access restricted. Enrollment in ${community.subject_title?.name || 'the subject'} required.`, 'error');
            return;
        }
        try {
            await api.post(`communities/${community.id}/join`);
            showNotification('Joined community', 'success');
            fetchCommunities();
        } catch (err) {
            showNotification(err.response?.data?.error || 'Failed to join', 'error');
        }
    };

    const handleLeave = async (id, e) => {
        e.stopPropagation();
        try {
            await api.post(`communities/${id}/leave`);
            showNotification('Left community', 'success');
            fetchCommunities();
        } catch (err) {
            showNotification('Failed to leave', 'error');
        }
    };

    const basePath = isStaff ? '/admin' : '/student';

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 italic tracking-tighter uppercase">Campus Communities</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Connect, share, and collaborate freely</p>
                </div>
                {isStaff && (
                    <Button onClick={() => setShowModal(true)} className="uppercase text-xs tracking-widest font-black rounded-2xl px-6 py-4 shadow-xl shadow-blue-500/10">
                        + New Community
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">Loading Communities...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {communities.map(c => (
                        <Card 
                            key={c.id} 
                            onClick={() => navigate(`${basePath}/communities/${c.id}`)}
                            className={`p-6 border-t-8 transition-all hover:-translate-y-2 cursor-pointer hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-[40px] ${c.is_member ? 'border-t-blue-500 shadow-blue-100/30' : 'border-t-gray-100 hover:border-t-blue-400'}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-blue-50/50 text-blue-600 rounded-[20px] shadow-sm">
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                </div>
                                {c.is_member ? (
                                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-2xl italic tracking-widest">Member</span>
                                ) : c.subject_title_id ? (
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black uppercase text-pink-500 bg-pink-50 px-3 py-1.5 rounded-2xl mb-1 italic tracking-widest border border-pink-100">Restricted</span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter italic">{c.subject_title?.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-4 py-2 rounded-2xl tracking-widest italic border border-gray-100">Open Group</span>
                                )}
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight uppercase italic">{c.name}</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-tight leading-relaxed mb-8 line-clamp-3">{c.description || 'A dedicated space for learning, discussion, and collaborative evolution of knowledge.'}</p>
                            
                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{c.members_count} Participants</span>
                                {c.is_member ? (
                                    <button 
                                        className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors italic px-2 py-1"
                                        onClick={(e) => handleLeave(c.id, e)}
                                    >
                                        Leave Group
                                    </button>
                                ) : (
                                    <Button 
                                        className={`text-[10px] py-3 px-6 uppercase tracking-widest shadow-xl rounded-2xl italic font-black transition-all transform active:scale-95 ${!c.can_join ? 'opacity-30 grayscale cursor-not-allowed shadow-none bg-gray-400' : 'shadow-blue-500/20'}`} 
                                        onClick={(e) => handleJoin(c, e)}
                                        title={!c.can_join ? `Requires ${c.subject_title?.name}` : ''}
                                    >
                                        {!c.can_join ? 'Locked' : 'Join Group'}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                    {communities.length === 0 && (
                        <div className="col-span-full py-40 text-center bg-white rounded-[50px] border-4 border-dashed border-gray-100 shadow-inner">
                            <svg className="w-16 h-16 text-gray-200 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            <p className="text-gray-300 font-black uppercase tracking-[0.2em] italic text-xs">No Communities Found</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full p-10 animate-in zoom-in slide-in-from-bottom-10 duration-500 rounded-[50px] shadow-2xl relative overflow-hidden border-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <h2 className="text-3xl font-black text-gray-900 italic tracking-tighter uppercase mb-8 relative">Create Community</h2>
                        <form onSubmit={handleCreate} className="space-y-6 relative">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block italic">Community Name</label>
                                <input required type="text" placeholder="e.g. Advanced Biology" className="w-full p-5 bg-gray-50 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-black italic uppercase text-xs transition-all border-0 shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                             <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block italic">Description</label>
                                <textarea rows="3" placeholder="Briefly describe what this group is about..." className="w-full p-5 bg-gray-50 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 text-xs font-bold uppercase resize-none transition-all border-0 shadow-inner" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block italic">Subject Restriction</label>
                                <select 
                                    className="w-full p-5 bg-gray-50 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 font-black italic uppercase text-xs appearance-none transition-all border-0 shadow-inner cursor-pointer"
                                    value={formData.subject_title_id}
                                    onChange={e => setFormData({...formData, subject_title_id: e.target.value})}
                                >
                                    <option value="" className="font-bold">PUBLIC GROUP (ANYONE)</option>
                                    {subjectTitles.map(s => (
                                        <option key={s.id} value={s.id} className="font-bold">{s.name.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <Button type="submit" className="flex-1 uppercase text-xs tracking-widest font-black italic py-5 rounded-3xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Publish Group</Button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 uppercase text-[10px] tracking-widest font-black italic text-gray-400 hover:text-gray-900 transition-colors">Cancel</button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
