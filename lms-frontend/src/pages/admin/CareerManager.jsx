import React, { useState, useEffect, useContext } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
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

    const [isEditing, setIsEditing] = useState(null); // ID or 'new'
    const [isEditingPathway, setIsEditingPathway] = useState(null); // ID or 'new'

    const [formData, setFormData] = useState({
        pathway_id: '',
        name: '',
        description: '',
        salary_range: '',
        outlook: 'Steady',
        qualifications: '',
        skills: '',
        typical_employers: '',
        subjects: [] // {id, is_mandatory}
    });

    const [pathwayForm, setPathwayForm] = useState({
        name: '',
        description: '',
        color_code: 'blue',
        icon: ''
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

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing === 'new') {
                await api.post('careers', formData);
            } else {
                await api.put(`careers/${isEditing}`, formData);
            }
            setIsEditing(null);
            fetchData();
            showNotification("Career updated successfully.", "success");
        } catch (err) {
            showNotification("Save failed", "error");
        }
    };

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
            showNotification("Pathway updated.", "success");
        } catch (err) {
            showNotification("Save failed", "error");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await askConfirmation("Delete this career?", "Confirm Action");
        if (!confirmed) return;
        try {
            await api.delete(`careers/${id}`);
            fetchData();
            showNotification("Career deleted.", "success");
        } catch (err) {
            showNotification("Delete failed", "error");
        }
    };

    const handleDeletePathway = async (id) => {
        const confirmed = await askConfirmation("Delete this pathway? This will fail if it has careers attached.", "Delete Pathway?");
        if (!confirmed) return;
        try {
            await api.delete(`pathways/${id}`);
            fetchData();
            showNotification("Pathway removed.", "success");
        } catch (err) {
            showNotification(err.response?.data?.message || "Delete failed", "error");
        }
    };

    const openEditPathway = (p) => {
        if (p) {
            setPathwayForm({
                name: p.name,
                description: p.description || '',
                color_code: p.color_code || 'blue',
                icon: p.icon || ''
            });
            setIsEditingPathway(p.id);
        } else {
            setPathwayForm({
                name: '',
                description: '',
                color_code: 'blue',
                icon: ''
            });
            setIsEditingPathway('new');
        }
    };

    const openEdit = (career) => {
        if (career) {
            setFormData({
                pathway_id: career.pathway_id,
                name: career.name,
                description: career.description,
                salary_range: career.salary_range || '',
                outlook: career.outlook || 'Steady',
                qualifications: career.qualifications || '',
                skills: career.skills || '',
                typical_employers: career.typical_employers || '',
                subjects: career.subjects.map(s => ({ id: s.id, is_mandatory: !!s.pivot?.is_mandatory }))
            });
            setIsEditing(career.id);
        } else {
            setFormData({
                pathway_id: pathways[0]?.id || '',
                name: '',
                description: '',
                salary_range: '',
                outlook: 'Steady',
                qualifications: '',
                skills: '',
                typical_employers: '',
                subjects: []
            });
            setIsEditing('new');
        }
    };

    const toggleSubject = (subId) => {
        const exists = formData.subjects.find(s => s.id === subId);
        if (exists) {
            setFormData({ ...formData, subjects: formData.subjects.filter(s => s.id !== subId) });
        } else {
            setFormData({ ...formData, subjects: [...formData.subjects, { id: subId, is_mandatory: false }] });
        }
    };

    const setMandatory = (subId, val) => {
        setFormData({
            ...formData,
            subjects: formData.subjects.map(s => s.id === subId ? { ...s, is_mandatory: val } : s)
        });
    };

    if (isLoading) return <div className="p-6 text-center font-semibold text-gray-400">Loading Career Repository...</div>;

    return (
        <div className="space-y-4 pb-20">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 gap-6">
                <div className="w-full lg:w-auto">
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Career & Pathway Governance</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] mt-1 tracking-wider opacity-70">Map subjects to future career qualifications</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                    {!isEditing && !isEditingPathway && (
                        <div className="flex bg-gray-100/80 p-1 rounded-xl sm:rounded-2xl shrink-0">
                            <button
                                onClick={() => setActiveTab('careers')}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase transition-all ${activeTab === 'careers' ? 'bg-white text-school-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Careers
                            </button>
                            <button
                                onClick={() => setActiveTab('pathways')}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase transition-all ${activeTab === 'pathways' ? 'bg-white text-school-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Pathways
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {!isEditing && !isEditingPathway && currentUser?.role !== 'teacher' && (
                            <Button
                                className="w-full sm:w-auto py-3.5 sm:py-2 px-6 text-[10px] font-black uppercase tracking-widest bg-school-primary shadow-lg shadow-red-100"
                                onClick={() => activeTab === 'careers' ? openEdit(null) : openEditPathway(null)}
                            >
                                <span className="sm:hidden">+ New {activeTab === 'careers' ? 'Career' : 'Pathway'}</span>
                                <span className="hidden sm:inline">+ Launch New {activeTab === 'careers' ? 'Career' : 'Pathway'}</span>
                            </Button>
                        )}
                        {(isEditing || isEditingPathway) && (
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto py-3.5 sm:py-2 px-6 text-[10px] font-black uppercase tracking-widest border-2 border-gray-200"
                                onClick={() => { setIsEditing(null); setIsEditingPathway(null); }}
                            >
                                Cancel Edit
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {activeTab === 'careers' && isEditing ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
                    <Card title="Career Definition">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-semibold text-gray-400">Career Title</label>
                                <input
                                    required
                                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400">Pathway</label>
                                    <select
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold"
                                        value={formData.pathway_id}
                                        onChange={(e) => setFormData({ ...formData, pathway_id: e.target.value })}
                                    >
                                        {pathways.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400">Outlook</label>
                                    <select
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold"
                                        value={formData.outlook}
                                        onChange={(e) => setFormData({ ...formData, outlook: e.target.value })}
                                    >
                                        <option>Steady</option>
                                        <option>Growth</option>
                                        <option>High Growth</option>
                                        <option>Disruptive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400">Salary Range (e.g. KSh 100k - 200k)</label>
                                <input
                                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold"
                                    value={formData.salary_range}
                                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400">Job Description</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-medium h-24"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400">Minimum Qualifications</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-medium h-24"
                                    placeholder="Degree in Computer Science, etc."
                                    value={formData.qualifications}
                                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400">Core Skills</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-medium h-24"
                                    placeholder="Problem Solving, Coding, Teamwork..."
                                    value={formData.skills}
                                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400">Typical Employers</label>
                                <input
                                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold"
                                    placeholder="Tech Companies, Banks, Government..."
                                    value={formData.typical_employers}
                                    onChange={(e) => setFormData({ ...formData, typical_employers: e.target.value })}
                                />
                            </div>

                            <Button type="submit" className="w-full py-5 text-sm uppercase shadow-sm">Commit Career Map</Button>
                        </form>
                    </Card>

                    <Card title="Subject Prerequisites">
                        <div className="space-y-4">
                            <p className="text-xs text-gray-500 font-medium">Select the mandatory and recommended subjects for this career.</p>
                            <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {subjects.map(s => {
                                    const mapping = formData.subjects.find(ms => ms.id === s.id);
                                    return (
                                        <div key={s.id} className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${mapping ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-transparent opacity-60 hover:opacity-100'}`}>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 accent-indigo-600 cursor-pointer"
                                                    checked={!!mapping}
                                                    onChange={() => toggleSubject(s.id)}
                                                />
                                                <span className="font-black text-sm text-gray-800">{s.name}</span>
                                            </div>
                                            {mapping && (
                                                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                                                    <button
                                                        onClick={() => setMandatory(s.id, true)}
                                                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${mapping.is_mandatory ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                                                    >
                                                        Mandatory
                                                    </button>
                                                    <button
                                                        onClick={() => setMandatory(s.id, false)}
                                                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${!mapping.is_mandatory ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                                                    >
                                                        Optional
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {careers.map(career => (
                        <Card key={career.id} className="group hover:border-indigo-100 transition-all cursor-default">
                            <div className="flex justify-between items-start mb-6">
                                <span className={`px-3 py-1 bg-${career.pathway.color_code}-50 text-${career.pathway.color_code}-600 rounded-full text-xs font-semibold`}>
                                    {career.pathway.name}
                                </span>
                                {currentUser?.role !== 'teacher' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(career)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(career.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">{career.name}</h3>
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-1.5">
                                    {career.subjects.map(s => (
                                        <span key={s.id} className={`text-[8px] font-semibold px-2 py-1 rounded-md border ${s.pivot.is_mandatory ? 'border-red-100 text-red-600 bg-red-50' : 'border-emerald-100 text-emerald-600 bg-emerald-50'}`}>
                                            {s.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {activeTab === 'pathways' && (
                isEditingPathway ? (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                        <Card title={isEditingPathway === 'new' ? "New Pathway" : "Edit Pathway"}>
                            <form onSubmit={handleSavePathway} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400">Pathway Name</label>
                                    <input
                                        required
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold"
                                        value={pathwayForm.name}
                                        onChange={(e) => setPathwayForm({ ...pathwayForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400">Color Code (Tailwind brand color)</label>
                                    <select
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold"
                                        value={pathwayForm.color_code}
                                        onChange={(e) => setPathwayForm({ ...pathwayForm, color_code: e.target.value })}
                                    >
                                        <option value="blue">Blue (STEM)</option>
                                        <option value="emerald">Emerald (Social Science)</option>
                                        <option value="amber">Amber (Arts)</option>
                                        <option value="indigo">Indigo</option>
                                        <option value="rose">Rose</option>
                                        <option value="violet">Violet</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400">Description</label>
                                    <textarea
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-medium h-32"
                                        value={pathwayForm.description}
                                        onChange={(e) => setPathwayForm({ ...pathwayForm, description: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full py-4 shadow-lg shadow-indigo-100 text-xs">Save Pathway</Button>
                            </form>
                        </Card>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pathways.map(p => (
                            <Card key={p.id} className={`border-l-8 border-${p.color_code}-500 hover:shadow-md transition-shadow`}>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-sm font-semibold text-gray-900">{p.name}</h3>
                                    {currentUser?.role !== 'teacher' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditPathway(p)} className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                            </button>
                                            <button onClick={() => handleDeletePathway(p.id)} className="p-2 bg-gray-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 font-medium line-clamp-3 mb-4">{p.description}</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full bg-${p.color_code}-500`} />
                                    <span className="text-xs font-semibold uppercase text-gray-400">
                                        {careers.filter(c => c.pathway_id === p.id).length} Careers Linked
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
