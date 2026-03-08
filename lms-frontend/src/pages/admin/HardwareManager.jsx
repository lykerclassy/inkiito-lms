import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export default function HardwareManager() {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showNotification, askConfirmation } = useNotification();
    const [isEditing, setIsEditing] = useState(null); // ID of item being edited or 'new'
    const [formData, setFormData] = useState({ name: '', description: '', image_url: '', category: 'Hardware', is_active: true });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/hardware-items');
            setItems(res.data);
        } catch (err) {
            console.error("Failed to fetch hardware items", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing === 'new') {
                await api.post('/hardware-items', formData);
            } else {
                await api.put(`/hardware-items/${isEditing}`, formData);
            }
            setIsEditing(null);
            fetchItems();
            showNotification("Hardware item saved.", "success");
        } catch (err) {
            console.error("Save failed", err);
            showNotification("Failed to save hardware", "error");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await askConfirmation("Are you sure you want to delete this hardware item?", "Delete Asset?");
        if (!confirmed) return;
        try {
            await api.delete(`/hardware-items/${id}`);
            fetchItems();
            showNotification("Item removed.", "success");
        } catch (err) {
            showNotification("Delete failed", "error");
        }
    };

    const openEdit = (item) => {
        if (item) {
            setFormData(item);
            setIsEditing(item.id);
        } else {
            setFormData({ name: '', description: '', image_url: '', category: 'Hardware', is_active: true });
            setIsEditing('new');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-base font-bold text-gray-900">Lab Hardware Manager</h1>
                    <p className="text-gray-500">Add or edit equipment for the ICT Innovation Lab.</p>
                </div>
                {!isEditing && (
                    <Button onClick={() => openEdit(null)} className="flex items-center gap-2 w-full sm:w-auto justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Add New Hardware
                    </Button>
                )}
            </div>

            {isEditing ? (
                <Card title={isEditing === 'new' ? 'Add New Hardware' : 'Edit Hardware'}>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 uppercase ">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 uppercase ">Category</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-bold text-gray-700 uppercase ">Image URL</label>
                                <input
                                    type="url"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://images.unsplash.com/..."
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                />
                                {formData.image_url && (
                                    <div className="mt-2 text-xs text-gray-400 font-medium">Preview:</div>
                                )}
                                <div className="h-32 w-48 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-bold text-gray-700 uppercase ">Description</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32"
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
                                <label htmlFor="is_active" className="text-gray-700 font-bold">Show in Student Portal</label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-gray-100">
                            <Button type="submit" variant="primary" className="px-5">Save Hardware</Button>
                            <Button type="button" variant="outline" onClick={() => setIsEditing(null)}>Cancel</Button>
                        </div>
                    </form>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center text-gray-400 font-bold">Loading hardware assets...</div>
                    ) : items.map(item => (
                        <Card key={item.id} className="relative group overflow-hidden">
                            <div className="h-40 bg-gray-100 overflow-hidden">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {!item.is_active && (
                                    <div className="absolute top-2 left-2 bg-gray-900/80 text-white text-[10px] px-2 py-1 rounded-md uppercase font-semibold">Hidden</div>
                                )}
                            </div>
                            <div className="p-6">
                                <div className="mb-4">
                                    <span className="text-xs font-semibold text-blue-500">{item.category}</span>
                                    <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                                </div>
                                <div className="flex gap-2 border-t border-gray-50 pt-4 mt-auto">
                                    <button
                                        onClick={() => openEdit(item)}
                                        className="flex-1 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                    >
                                        Edit Details
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-red-400 hover:text-red-600 bg-red-50 rounded-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
