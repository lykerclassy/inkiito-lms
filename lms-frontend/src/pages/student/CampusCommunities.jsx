import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

export default function CampusCommunities() {
    const [communities, setCommunities] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', is_public: true, subject_id: '' });
    
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
            setSubjects(res.data.subjects || []);
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
            setFormData({ name: '', description: '', is_public: true, subject_id: '' });
            fetchCommunities();
        } catch (err) {
            showNotification('Failed to create community', 'error');
        }
    };

    const handleJoin = async (community, e) => {
        e.stopPropagation();
        if (!community.can_join) {
            showNotification(`Access restricted. Enrollment in ${community.subject?.name} required.`, 'error');
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
        <div className="max-w-6xl mx-auto space-y-8 pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 italic tracking-tighter uppercase">Campus Communities</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Connect, share, and collaborate freely</p>
                </div>
                {isStaff && (
                    <Button onClick={() => setShowModal(true)} className="uppercase text-xs tracking-widest font-black">
                        + New Community
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">Scanning Social Nodes...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {communities.map(c => (
                        <Card 
                            key={c.id} 
                            onClick={() => navigate(`${basePath}/communities/${c.id}`)}
                            className={`p-6 border-t-4 transition-all hover:-translate-y-1 cursor-pointer hover:shadow-2xl ${c.is_member ? 'border-t-blue-500 shadow-blue-100 hover:shadow-blue-200' : 'border-t-gray-200 hover:border-blue-300'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                </div>
                                {c.is_member ? (
                                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Member</span>
                                ) : c.subject_id ? (
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black uppercase text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full mb-1">Restricted</span>
                                        <span className="text-[8px] font-bold text-gray-400">{c.subject?.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Open</span>
                                )}
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">{c.name}</h3>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6 line-clamp-2">{c.description || 'A space for learning and discussion.'}</p>
                            
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{c.members_count} Members</span>
                                {c.is_member ? (
                                    <Button variant="outline" className="text-[10px] py-2 px-4 uppercase tracking-widest" onClick={(e) => handleLeave(c.id, e)}>Leave</Button>
                                ) : (
                                    <Button 
                                        className={`text-[10px] py-2 px-4 uppercase tracking-widest shadow-lg ${!c.can_join ? 'opacity-50 grayscale cursor-not-allowed shadow-none' : 'shadow-blue-200'}`} 
                                        onClick={(e) => handleJoin(c, e)}
                                        title={!c.can_join ? `Requires ${c.subject?.name}` : ''}
                                    >
                                        {!c.can_join ? 'Locked' : 'Join'}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                    {communities.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold">No public communities established yet.</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full p-8 animate-in zoom-in duration-200">
                        <h2 className="text-2xl font-black text-gray-900 italic tracking-tighter uppercase mb-6">Create Community</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Name</label>
                                <input required type="text" className="w-full p-4 mt-1 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                             <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Description</label>
                                <textarea rows="3" className="w-full p-4 mt-1 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Restrict to Subject (Optional)</label>
                                <select 
                                    className="w-full p-4 mt-1 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                    value={formData.subject_id}
                                    onChange={e => setFormData({...formData, subject_id: e.target.value})}
                                >
                                    <option value="">Public Group (Anyone can join)</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button type="submit" className="flex-1 uppercase text-xs tracking-widest font-black">Publish</Button>
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 uppercase text-xs tracking-widest font-black">Cancel</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
