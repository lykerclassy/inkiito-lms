import React, { useState, useEffect, useContext } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageLoader from '../../components/common/PageLoader';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { AuthContext } from '../../contexts/AuthContext';

export default function HardwareManager() {
    const { user: currentUser } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showNotification, askConfirmation } = useNotification();
    const [isEditing, setIsEditing] = useState(null); 
    const [activeTab, setActiveTab] = useState('hardware');
    const [formData, setFormData] = useState({ 
        name: '', 
        description: '', 
        image_url: '', 
        video_url: '',
        type: 'hardware',
        category: 'Hardware', 
        is_active: true,
        file: null 
    });

    const canManageHub = (user) => {
        if (!user) return false;
        if (['admin', 'developer', 'principal', 'deputy_principal', 'dos'].includes(user.role)) return true;

        // Teachers who teach Computer Studies or ICT or Keyboarding
        const subjects = user.taught_subjects || user.taughtSubjects || [];
        return subjects.some(s => {
            const name = (s.name || s).toLowerCase();
            return name.includes('computer') || name.includes('ict') || name.includes('keyboarding');
        });
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('admin/hardware-items');
            setItems(res.data);
        } catch (err) {
            console.error("Failed to fetch hardware items", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'file') return;
            
            let val = formData[key];
            // Handle booleans for FormData
            if (key === 'is_active') val = val ? '1' : '0';
            // Convert empty strings to null for nullable backend fields
            if (val === '') val = null;
            
            if (val !== null) {
                data.append(key, val);
            }
        });
        if (formData.file) {
            data.append('file', formData.file);
        }

        try {
            if (isEditing === 'new') {
                await api.post('hardware-items', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // Laravel Spoofing for PUT with files
                data.append('_method', 'PUT');
                await api.post(`hardware-items/${isEditing}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setIsEditing(null);
            fetchItems();
            showNotification("Resource saved successfully.", "success");
        } catch (err) {
            console.error("Save failed", err);
            showNotification("Failed to save resource", "error");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await askConfirmation("Are you sure you want to delete this hardware item?", "Delete Asset?");
        if (!confirmed) return;
        try {
            await api.delete(`hardware-items/${id}`);
            fetchItems();
            showNotification("Item removed.", "success");
        } catch (err) {
            showNotification("Delete failed", "error");
        }
    };

    const openEdit = (item) => {
        if (item) {
            setFormData({ ...item, file: null });
            setIsEditing(item.id);
        } else {
            setFormData({ 
                name: '', 
                description: '', 
                image_url: '', 
                video_url: '',
                type: activeTab === 'safety' ? 'safety_video' : 'hardware',
                category: activeTab === 'safety' ? 'Safety' : 'Hardware', 
                is_active: true,
                file: null 
            });
            setIsEditing('new');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl font-black text-gray-900 tracking-tight italic uppercase">Lab Resource Manager</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manage equipment, safety videos, and guides for the Innovation Lab</p>
                </div>
                {!isEditing && canManageHub(currentUser) && (
                    <Button onClick={() => openEdit(null)} className="flex items-center gap-2 w-full sm:w-auto justify-center uppercase tracking-widest font-black text-[10px] py-4 shadow-sm shadow-blue-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Add New Resource
                    </Button>
                )}
            </div>

            {!isEditing && (
                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                    <button 
                        onClick={() => setActiveTab('hardware')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'hardware' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Physical Assets
                    </button>
                    <button 
                        onClick={() => setActiveTab('safety')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'safety' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Safety & Ethics
                    </button>
                </div>
            )}

            {isEditing ? (
                <Card title={isEditing === 'new' ? 'New Lab Resource' : 'Update Resource'}>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource Type</label>
                                <select
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value, category: e.target.value === 'hardware' ? 'Hardware' : 'Safety' })}
                                >
                                    <option value="hardware">Hardware / Physical Part</option>
                                    <option value="safety_video">Internet Safety Video (YouTube)</option>
                                    <option value="safety_guide">Digital Safety Guide (PDF)</option>
                                </select>
                            </div>

                            {formData.type === 'safety_video' && (
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">YouTube URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                        value={formData.video_url}
                                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                    />
                                </div>
                            )}

                            {formData.type === 'safety_guide' && (
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload PDF Guide</label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="w-full p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl outline-none text-sm font-bold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                                        onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                    />
                                    {formData.file_path && !formData.file && (
                                        <p className="text-[10px] font-bold text-green-500 flex items-center gap-2">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            Existing Guide Attached
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thumbnail / Cover Image URL</label>
                                <input
                                    type="url"
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                    placeholder="https://images.unsplash.com/..."
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource Description</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none h-32 text-sm font-bold"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Show in Student Lab</label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-gray-100">
                            <Button type="submit" variant="primary" className="px-8 uppercase tracking-widest font-black text-[10px] py-4">Save Resource</Button>
                            <Button type="button" variant="outline" className="px-8 uppercase tracking-widest font-black text-[10px] py-4" onClick={() => setIsEditing(null)}>Discard Changes</Button>
                        </div>
                    </form>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
                            <PageLoader message="Synchronizing Lab Assets..." color="blue" />
                        </div>
                    ) : items.filter(i => activeTab === 'hardware' ? i.type === 'hardware' : i.type !== 'hardware').map(item => (
                        <Card key={item.id} className="relative group overflow-hidden border-none shadow-sm h-full flex flex-col">
                            <div className="h-44 bg-gray-100 overflow-hidden relative">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="bg-white/90 backdrop-blur-md text-blue-600 text-[9px] px-3 py-1 rounded-full uppercase font-black shadow-sm">{item.type.replace('_', ' ')}</span>
                                    {!item.is_active && <span className="bg-gray-900/80 text-white text-[9px] px-3 py-1 rounded-full uppercase font-black">Hidden</span>}
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight line-clamp-1">{item.name}</h3>
                                    <p className="text-[11px] font-medium text-gray-400 line-clamp-2 mt-2 leading-relaxed">{item.description}</p>
                                </div>
                                {canManageHub(currentUser) && (
                                    <div className="flex gap-2 pt-4 mt-auto border-t border-gray-50">
                                        <button
                                            onClick={() => openEdit(item)}
                                            className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                        >
                                            Configure
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-3 text-red-400 hover:text-red-600 bg-red-50/50 rounded-xl transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
