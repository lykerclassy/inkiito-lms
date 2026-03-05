import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function ScienceLabManager() {
    const [labs, setLabs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [curriculums, setCurriculums] = useState([]);

    // UI State
    const [selectedLab, setSelectedLab] = useState(null);
    const [isEditingExp, setIsEditingExp] = useState(null); // ID of exp or 'new'

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        level: 'Intermediate',
        duration: '45 mins',
        curriculum_id: '',
        simulation_type: 'none',
        steps: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [labsRes, currRes] = await Promise.all([
                api.get('/science-labs'),
                api.get('/science-labs/curriculums')
            ]);
            setLabs(labsRes.data);
            // If /admin/curriculum doesn't exist, we might need to fetch them differently.
            // Let's check CurriculumManager or just hardcode for now if needed.
            if (currRes.data?.curricula) setCurriculums(currRes.data.curricula);
            else if (Array.isArray(currRes.data)) setCurriculums(currRes.data);
        } catch (err) {
            console.error("Failed to fetch lab data", err);
            // Fallback for curriculums if route fails
            setCurriculums([{ id: 1, name: '8-4-4' }, { id: 2, name: 'CBC' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveExperiment = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, science_lab_id: selectedLab.id };
            if (isEditingExp === 'new') {
                await api.post('/science-labs/experiments', payload);
            } else {
                await api.put(`/science-labs/experiments/${isEditingExp}`, payload);
            }
            setIsEditingExp(null);
            fetchData();
        } catch (err) {
            console.error("Save failed", err);
            alert("Failed to save experiment");
        }
    };

    const handleDeleteExp = async (id) => {
        if (!window.confirm("Delete this experiment?")) return;
        try {
            await api.delete(`/science-labs/experiments/${id}`);
            fetchData();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const openEditExp = (exp) => {
        if (exp) {
            setFormData({
                title: exp.title,
                slug: exp.slug,
                level: exp.level,
                duration: exp.duration,
                simulation_type: exp.simulation_type || 'none',
                curriculum_id: exp.curriculum_id,
                steps: exp.steps || []
            });
            setIsEditingExp(exp.id);
        } else {
            setFormData({
                title: '',
                slug: '',
                level: 'Intermediate',
                duration: '45 mins',
                simulation_type: 'none',
                curriculum_id: curriculums[0]?.id || '',
                steps: []
            });
            setIsEditingExp('new');
        }
    };

    const addStep = () => {
        setFormData({
            ...formData,
            steps: [...formData.steps, { instruction: '', type: 'observation' }]
        });
    };

    const updateStep = (index, field, value) => {
        const newSteps = [...formData.steps];
        newSteps[index][field] = value;
        setFormData({ ...formData, steps: newSteps });
    };

    const removeStep = (index) => {
        setFormData({
            ...formData,
            steps: formData.steps.filter((_, i) => i !== index)
        });
    };

    if (isLoading) return <div className="p-20 text-center font-black text-gray-400">Loading Science Lab Systems...</div>;

    return (
        <div className="space-y-8 pb-20">
            <header className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Virtual Science Lab Manager</h1>
                    <p className="text-gray-500">Manage interactive experiments for Biology, Chemistry, Physics, and Agriculture.</p>
                </div>
                <div className="flex gap-4">
                    {selectedLab && (
                        <Button variant="outline" onClick={() => setSelectedLab(null)}>
                            &larr; Back to Labs
                        </Button>
                    )}
                </div>
            </header>

            {!selectedLab ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {labs.map(lab => (
                        <Card key={lab.id} className="hover:scale-105 transition-all cursor-pointer group" onClick={() => setSelectedLab(lab)}>
                            <div className={`w-16 h-16 rounded-2xl bg-${lab.color}-50 text-${lab.color}-600 flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform`}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">{lab.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{lab.description}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                <span className="text-xs font-bold text-gray-400 uppercase">{lab.experiments?.length || 0} Experiments</span>
                                <span className={`text-${lab.color}-600 font-black text-xs uppercase tracking-widest`}>Manage &rarr;</span>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <span className={`w-3 h-8 bg-${selectedLab.color}-500 rounded-full`} />
                            {selectedLab.name} Experiments
                        </h2>
                        {!isEditingExp && (
                            <Button onClick={() => openEditExp(null)}>+ Add New Experiment</Button>
                        )}
                    </div>

                    {isEditingExp ? (
                        <Card title={isEditingExp === 'new' ? 'New Experiment' : 'Edit Experiment'}>
                            <form onSubmit={handleSaveExperiment} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Title</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Curriculum</label>
                                        <select
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"
                                            value={formData.curriculum_id}
                                            onChange={(e) => setFormData({ ...formData, curriculum_id: e.target.value })}
                                        >
                                            <option value="">Select Curriculum</option>
                                            {curriculums.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Level</label>
                                        <select
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"
                                            value={formData.level}
                                            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        >
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Advanced</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Duration (e.g., 45 mins)</label>
                                        <input
                                            type="text"
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Simulation Template</label>
                                        <select
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"
                                            value={formData.simulation_type}
                                            onChange={(e) => setFormData({ ...formData, simulation_type: e.target.value })}
                                        >
                                            <option value="none">Plain Instruction (No Visuals)</option>
                                            <option value="biology_microscopy">Biology: Microscope View</option>
                                            <option value="biology_circulatory">Biology: Heart & Valves</option>
                                            <option value="chemistry_titration">Chemistry: Titration/Burette</option>
                                            <option value="chemistry_states_of_matter">Chemistry: Molecular Heat</option>
                                            <option value="physics_newton_motion">Physics: Motion Track</option>
                                            <option value="physics_light_reflection">Physics: Reflection Ray</option>
                                            <option value="agriculture_soil_testing">Agriculture: Ph Soil Tube</option>
                                            <option value="agriculture_irrigation">Agriculture: Irrigation Grid</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-lg font-black text-gray-800">Experiment Steps</h4>
                                        <button type="button" onClick={addStep} className="text-blue-600 font-black text-sm hover:underline">+ Add Step</button>
                                    </div>
                                    <div className="space-y-4">
                                        {formData.steps.map((step, idx) => (
                                            <div key={idx} className="flex gap-4 items-start bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-gray-400 flex-shrink-0 shadow-sm border border-gray-100">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="md:col-span-3">
                                                        <textarea
                                                            placeholder="Instruction text..."
                                                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none text-sm font-medium resize-none shadow-sm"
                                                            value={step.instruction}
                                                            onChange={(e) => updateStep(idx, 'instruction', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <select
                                                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none text-sm font-black shadow-sm"
                                                            value={step.type}
                                                            onChange={(e) => updateStep(idx, 'type', e.target.value)}
                                                        >
                                                            <option value="setup">Setup</option>
                                                            <option value="interactive">Interactive</option>
                                                            <option value="observation">Observation</option>
                                                            <option value="recording">Recording</option>
                                                            <option value="analysis">Analysis</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeStep(idx)} className="text-red-400 hover:text-red-600 p-2">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                        {formData.steps.length === 0 && (
                                            <div className="py-12 bg-gray-50 rounded-[2.5rem] text-center border-4 border-dashed border-gray-100">
                                                <p className="text-gray-400 font-bold italic">No steps added yet. Add steps to make it interactive!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-8 border-t border-gray-50">
                                    <Button type="submit" className="px-10 py-4">Save Experiment</Button>
                                    <Button variant="outline" type="button" onClick={() => setIsEditingExp(null)}>Cancel</Button>
                                </div>
                            </form>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(selectedLab.experiments || []).map(exp => (
                                <Card key={exp.id} className="relative group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-3 py-1 bg-${selectedLab.color}-50 text-${selectedLab.color}-600 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                                                    {exp.curriculum?.name || 'Any'}
                                                </span>
                                                <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    {exp.level}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900">{exp.title}</h3>
                                            <p className="text-xs text-gray-400 font-bold mt-1">Duration: {exp.duration}</p>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditExp(exp)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                            </button>
                                            <button onClick={() => handleDeleteExp(exp.id)} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sequence ({exp.steps?.length || 0} steps)</h4>
                                        <div className="space-y-2">
                                            {(exp.steps || []).slice(0, 3).map((s, i) => (
                                                <div key={i} className="flex gap-3 items-center text-sm text-gray-600">
                                                    <span className="w-5 h-5 bg-gray-50 rounded-full flex items-center justify-center text-[10px] font-black text-gray-400">{i + 1}</span>
                                                    <span className="truncate">{s.instruction}</span>
                                                </div>
                                            ))}
                                            {exp.steps?.length > 3 && (
                                                <p className="text-[10px] font-black text-gray-300 ml-8 uppercase">+ {exp.steps.length - 3} more phases</p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
