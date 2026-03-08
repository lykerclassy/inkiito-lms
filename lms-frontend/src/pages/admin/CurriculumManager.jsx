import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function CurriculumManager() {
    const navigate = useNavigate();

    // Data State
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // UI Expansion State
    const [expandedSubjects, setExpandedSubjects] = useState([]);
    const [expandedUnits, setExpandedUnits] = useState([]);
    const [expandedSubUnits, setExpandedSubUnits] = useState([]);

    // Modal States
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', mode: 'create', parentId: null, editId: null });
    const [formData, setFormData] = useState({ title: '', academic_level_id: '1' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch the full academic tree
    const fetchCurriculum = async () => {
        try {
            const response = await api.get('/subjects');
            setSubjects(response.data);
        } catch (err) {
            console.error("Failed to fetch curriculum:", err);
            setError("Failed to load curriculum data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCurriculum();
    }, []);

    // --- TOGGLE HANDLERS ---
    const toggleExpand = (id, type, state, setState) => {
        setState(state.includes(id) ? state.filter(item => item !== id) : [...state, id]);
    };

    // --- MODAL HANDLERS ---
    const openModal = (type, mode = 'create', parentId = null, existingItem = null) => {
        setModalConfig({ isOpen: true, type, mode, parentId, editId: existingItem?.id || null });
        setFormData({
            title: existingItem?.title || existingItem?.name || '',
            academic_level_id: existingItem?.academic_level_id || '1'
        });
    };

    const closeModal = () => {
        setModalConfig({ isOpen: false, type: '', mode: 'create', parentId: null, editId: null });
        setFormData({ title: '', academic_level_id: '1' });
    };

    // --- FORM SUBMISSION LOGIC ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { type, mode, parentId, editId } = modalConfig;
            
            // Determine API Endpoint and Payload based on the Item Type
            let endpoint = '';
            let payload = {};

            if (type === 'subject') {
                endpoint = '/subjects'; // We only have Create for Subject right now
                payload = { name: formData.title, academic_level_id: formData.academic_level_id };
            } 
            else if (type === 'unit') {
                endpoint = mode === 'create' ? '/units' : `/units/${editId}`;
                payload = { title: formData.title, order: 1 };
                if (mode === 'create') payload.subject_id = parentId;
            } 
            else if (type === 'subunit') {
                endpoint = mode === 'create' ? '/subunits' : `/subunits/${editId}`;
                payload = { title: formData.title, order: 1 };
                if (mode === 'create') payload.unit_id = parentId;
            } 
            else if (type === 'lesson') {
                endpoint = mode === 'create' ? '/lessons' : `/lessons/${editId}`;
                payload = { title: formData.title, order: 1 };
                if (mode === 'create') payload.sub_unit_id = parentId;
            }

            // Execute Request
            if (mode === 'create') {
                await api.post(endpoint, payload);
            } else {
                await api.put(endpoint, payload);
            }

            // Refresh data and close modal
            await fetchCurriculum();
            closeModal();

        } catch (err) {
            console.error("Submission failed:", err);
            alert("Failed to save. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-4 text-gray-500 font-medium">Loading curriculum structure...</div>;
    if (error) return <div className="p-4 text-red-500 font-medium">{error}</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Curriculum Builder</h1>
                    <p className="text-gray-500 mt-1">Manage subjects, strands, and interactive lessons.</p>
                </div>
                <Button variant="primary" onClick={() => openModal('subject')}>
                    + Create New Subject
                </Button>
            </div>

            {/* Curriculum Tree */}
            <div className="space-y-4">
                {subjects.length === 0 ? (
                    <Card className="p-4 text-center text-gray-500">No subjects created yet. Click above to start.</Card>
                ) : (
                    subjects.map((subject) => (
                        <Card key={subject.id} noPadding={true} className="overflow-hidden border border-gray-200">
                            
                            {/* SUBJECT HEADER */}
                            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleExpand(subject.id, 'subject', expandedSubjects, setExpandedSubjects)}>
                                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                        {expandedSubjects.includes(subject.id) ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                        )}
                                    </button>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">{subject.name}</h2>
                                        <p className="text-xs text-gray-500">{subject.academic_level?.name || 'Unassigned Level'}</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => openModal('unit', 'create', subject.id)}>
                                    + Add Unit (Strand)
                                </Button>
                            </div>

                            {/* UNITS (STRANDS) LIST */}
                            {expandedSubjects.includes(subject.id) && (
                                <div className="divide-y divide-gray-100 bg-white">
                                    {(!subject.units || subject.units.length === 0) && (
                                        <div className="px-5 py-4 text-sm text-gray-400">No units/strands added yet.</div>
                                    )}
                                    
                                    {subject.units?.map((unit) => (
                                        <div key={unit.id} className="pl-6">
                                            
                                            {/* UNIT HEADER */}
                                            <div className="px-6 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors border-l-4 border-blue-500">
                                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleExpand(unit.id, 'unit', expandedUnits, setExpandedUnits)}>
                                                    <button className="text-gray-400 hover:text-gray-600">
                                                        {expandedUnits.includes(unit.id) ? (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                        )}
                                                    </button>
                                                    <span className="font-semibold text-gray-800">Unit: {unit.title}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openModal('unit', 'edit', null, unit)} className="text-xs font-medium text-gray-400 hover:text-blue-600">Edit</button>
                                                    <button onClick={() => openModal('subunit', 'create', unit.id)} className="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add Topic</button>
                                                </div>
                                            </div>

                                            {/* SUBUNITS (TOPICS) LIST */}
                                            {expandedUnits.includes(unit.id) && (
                                                <div className="pl-6 divide-y divide-gray-50 bg-gray-50/50">
                                                    {(!unit.sub_units || unit.sub_units.length === 0) && (
                                                        <div className="px-4 py-3 text-sm text-gray-400">No topics added yet.</div>
                                                    )}

                                                    {unit.sub_units?.map((subUnit) => (
                                                        <div key={subUnit.id} className="pl-6">
                                                            
                                                            {/* SUBUNIT HEADER */}
                                                            <div className="px-6 py-3 flex items-center justify-between hover:bg-white transition-colors border-l-4 border-purple-400">
                                                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleExpand(subUnit.id, 'subunit', expandedSubUnits, setExpandedSubUnits)}>
                                                                    <button className="text-gray-400 hover:text-gray-600">
                                                                        {expandedSubUnits.includes(subUnit.id) ? (
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                                        ) : (
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                                        )}
                                                                    </button>
                                                                    <span className="font-medium text-gray-700">Topic: {subUnit.title}</span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => openModal('subunit', 'edit', null, subUnit)} className="text-xs font-medium text-gray-400 hover:text-purple-600">Edit</button>
                                                                    <button onClick={() => openModal('lesson', 'create', subUnit.id)} className="text-xs font-medium text-purple-600 hover:text-purple-800">+ Add Lesson</button>
                                                                </div>
                                                            </div>

                                                            {/* LESSONS LIST */}
                                                            {expandedSubUnits.includes(subUnit.id) && (
                                                                <div className="pl-8 py-2 bg-white border-l-4 border-gray-200 space-y-1">
                                                                    {(!subUnit.lessons || subUnit.lessons.length === 0) && (
                                                                        <div className="px-5 py-2 text-sm text-gray-400">No lessons added yet.</div>
                                                                    )}

                                                                    {subUnit.lessons?.map((lesson) => (
                                                                        <div key={lesson.id} className="px-6 py-2 flex items-center justify-between group rounded-md hover:bg-gray-50 transition-colors">
                                                                            <div className="flex items-center gap-3">
                                                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                                                <span className="text-sm text-gray-700">{lesson.title}</span>
                                                                                {!lesson.is_published && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded uppercase ">Draft</span>}
                                                                            </div>
                                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-3">
                                                                                <button onClick={() => openModal('lesson', 'edit', null, lesson)} className="text-xs font-medium text-gray-500 hover:text-gray-900">Edit Title</button>
                                                                                <button onClick={() => navigate(`/admin/lessons/${lesson.id}/edit`)} className="text-xs font-bold text-blue-600 hover:text-blue-800">Build Content &rarr;</button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {/* === UNIFIED CREATION / EDIT MODAL === */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-sm w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900 capitalize">
                                {modalConfig.mode} {modalConfig.type.replace('subunit', 'topic')}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {modalConfig.type === 'subject' ? 'Subject Name' : 'Title'}
                                    </label>
                                    <input 
                                        type="text" required autoFocus
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder={`Enter ${modalConfig.type.replace('subunit', 'topic')} name...`}
                                    />
                                </div>

                                {/* Only show Academic Level selection when creating a root Subject */}
                                {modalConfig.type === 'subject' && modalConfig.mode === 'create' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Level Framework</label>
                                        <select 
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                            value={formData.academic_level_id}
                                            onChange={(e) => setFormData({...formData, academic_level_id: e.target.value})}
                                        >
                                            <option value="1">Grade 10 (CBC)</option>
                                            <option value="2">Form 3 (8-4-4)</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                                    Save {modalConfig.type.replace('subunit', 'topic')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
        </div>
    );
}