import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { AuthContext } from '../../contexts/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const quillModules = {
    toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        ['clean']
    ],
};

export default function ScienceLabManager() {
    const { user: currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [labs, setLabs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [curriculums, setCurriculums] = useState([]);
    const [staff, setStaff] = useState([]);
    const [questions, setQuestions] = useState([]);
    const { showNotification, askConfirmation } = useNotification();

    const canManageLab = (user, lab) => {
        if (!user || !lab) return false;
        if (['admin', 'principal', 'deputy_principal', 'dos', 'developer'].includes(user.role)) return true;
        if (user.role !== 'teacher') return false;

        const labSlug = (lab.slug || lab.name || '').toLowerCase();
        return (user.taught_subjects || user.taughtSubjects || [])?.some(subject => {
            const subjectName = subject.name.toLowerCase();
            return labSlug.includes(subjectName) || subjectName.includes(labSlug);
        });
    };

    // UI State
    const [selectedLab, setSelectedLab] = useState(null);
    const [isEditingExp, setIsEditingExp] = useState(null); // ID of exp or 'new'
    const [activeTab, setActiveTab] = useState('experiments');

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        level: 'Intermediate',
        duration: '45 mins',
        curriculum_id: '',
        youtube_url: '',
        observations: '',
        explanations: '',
        requirements: '',
        conclusion: '',
        knowledge_check: [],
        steps: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [labsRes, currRes, usersRes, questionsRes] = await Promise.all([
                api.get('science-labs'),
                api.get('science-labs/curriculums'),
                api.get('staff-list'),
                api.get('lab-questions')
            ]);
            setLabs(labsRes.data);

            // Sync selectedLab if one is currently open to ensure fresh data
            if (selectedLab) {
                const refreshedSelected = labsRes.data.find(l => l.id === selectedLab.id);
                if (refreshedSelected) setSelectedLab(refreshedSelected);
            }

            if (currRes.data?.curricula) setCurriculums(currRes.data.curricula);
            else if (Array.isArray(currRes.data)) setCurriculums(currRes.data);

            const allStaff = usersRes.data.filter(u => ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'class_teacher', 'teacher'].includes(u.role));
            setStaff(allStaff);

            setQuestions(questionsRes.data);
        } catch (err) {
            console.error("Failed to fetch lab data", err);
            setCurriculums([{ id: 1, name: '8-4-4' }, { id: 2, name: 'CBC' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreviewSimulation = (exp) => {
        const safeLab = { ...selectedLab };
        delete safeLab.experiments; // Reduce state payload
        navigate(`/admin/science-labs/preview/${exp.slug}`, { state: { experiment: exp, lab: safeLab } });
    };

    const handleSaveExperiment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                science_lab_id: selectedLab.id,
                curriculum_id: formData.curriculum_id || null,
                slug: formData.slug || null
            };

            if (isEditingExp === 'new') {
                await api.post('science-labs/experiments', payload);
            } else {
                await api.put(`science-labs/experiments/${isEditingExp}`, payload);
            }
            setIsEditingExp(null);
            fetchData();
            showNotification("Experiment saved successfully.", "success");
        } catch (err) {
            console.error("Save failed", err);
            showNotification("Failed to save experiment", "error");
        }
    };

    const handleDeleteExp = async (id) => {
        const confirmed = await askConfirmation("Delete this experiment?", "Confirm deletion");
        if (!confirmed) return;
        try {
            await api.delete(`science-labs/experiments/${id}`);
            fetchData();
            showNotification("Experiment deleted.", "success");
        } catch (err) {
            showNotification("Delete failed", "error");
        }
    };

    const openEditExp = (exp) => {
        if (exp) {
            setFormData({
                title: exp.title,
                slug: exp.slug,
                level: exp.level,
                duration: exp.duration,
                youtube_url: exp.youtube_url || '',
                observations: exp.observations || '',
                explanations: exp.explanations || '',
                requirements: exp.requirements || '',
                conclusion: exp.conclusion || '',
                knowledge_check: typeof exp.knowledge_check === 'string' ? JSON.parse(exp.knowledge_check) : (exp.knowledge_check || []),
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
                youtube_url: '',
                observations: '',
                explanations: '',
                requirements: '',
                conclusion: '',
                knowledge_check: [],
                curriculum_id: curriculums.find(c => c.name === '8-4-4')?.id || (curriculums[0]?.id || ''),
                steps: []
            });
            setIsEditingExp('new');
        }
    };

    const handleOpenStudentView = () => {
        navigate(`/admin/science-labs/view/${selectedLab.slug}`);
    };

    const addStep = () => {
        setFormData({
            ...formData,
            steps: [...formData.steps, { instruction: '', type: 'observation' }]
        });
    };

    const updateStep = (index, field, value) => {
        const newSteps = [...formData.steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setFormData({ ...formData, steps: newSteps });
    };

    const removeStep = (index) => {
        setFormData({
            ...formData,
            steps: formData.steps.filter((_, i) => i !== index)
        });
    };

    const addKnowledgeCheck = () => {
        setFormData({
            ...formData,
            knowledge_check: [...(formData.knowledge_check || []), { question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' }]
        });
    };

    const updateKnowledgeCheck = (index, field, value) => {
        const newChecks = [...(formData.knowledge_check || [])];
        if (field.startsWith('option_')) {
            const optIndex = parseInt(field.split('_')[1]);
            newChecks[index].options[optIndex] = value;
        } else {
            newChecks[index][field] = value;
        }
        setFormData({ ...formData, knowledge_check: newChecks });
    };

    const removeKnowledgeCheck = (index) => {
        setFormData({
            ...formData,
            knowledge_check: (formData.knowledge_check || []).filter((_, i) => i !== index)
        });
    };

    const handleAssignCoordinator = async (coordinatorId) => {
        try {
            const res = await api.put(`science-labs/${selectedLab.id}/coordinator`, { coordinator_id: coordinatorId || null });
            setSelectedLab(res.data.lab);
            fetchData();
            showNotification("Coordinator updated.", "success");
        } catch (err) {
            console.error("Failed to assign coordinate", err);
            showNotification("Failed to assign coordinator", "error");
        }
    };

    const handleAnswerQuestion = async (e, qId) => {
        e.preventDefault();
        const formDataObj = new FormData(e.target);
        const answer = formDataObj.get('answer');
        if (!answer) return;

        try {
            await api.post(`lab-questions/${qId}/answer`, { answer });
            fetchData();
            showNotification("Reply posted.", "success");
        } catch (err) {
            console.error("Failed to answer question", err);
            showNotification("Failed to post answer", "error");
        }
    };

    if (isLoading) return <div className="p-6 text-center font-semibold text-gray-400">Loading Science Lab Systems...</div>;

    return (
        <div className="space-y-6 md:space-y-4 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-4 rounded-3xl md:rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl md:text-lg font-bold text-gray-900">Virtual Science Lab Manager</h1>
                    <p className="text-sm md:text-base text-gray-500">Manage interactive experiments for Biology, Chemistry, Physics, and Agriculture.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    {selectedLab && (
                        <Button variant="outline" className="w-full md:w-auto" onClick={() => setSelectedLab(null)}>
                            &larr; Back to Labs
                        </Button>
                    )}
                </div>
            </header>

            {!selectedLab ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {labs.map(lab => (
                        <Card key={lab.id} className="hover:scale-105 transition-all cursor-pointer group" onClick={() => setSelectedLab(lab)}>
                            <div className={`w-9 h-9 rounded-2xl bg-${lab.color}-50 text-${lab.color}-600 flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform`}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">{lab.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{lab.description}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                <span className="text-xs font-bold text-gray-400 uppercase">{lab.experiments?.length || 0} Experiments</span>
                                <span className={`text-${lab.color}-600 font-semibold text-xs`}>Manage &rarr;</span>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-6 md:space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-${selectedLab.color}-50 text-${selectedLab.color}-600 rounded-xl flex items-center justify-center`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl md:text-base font-bold text-gray-900">{selectedLab.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-semibold text-gray-400">Department Head:</span>
                                    {['admin', 'developer', 'principal', 'deputy_principal', 'dos'].includes(currentUser?.role) ? (
                                        <select
                                            className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                                            value={selectedLab.coordinator_id || ''}
                                            onChange={(e) => handleAssignCoordinator(e.target.value)}
                                        >
                                            <option value="">No Coordinator Assigned</option>
                                            {staff.map(user => (
                                                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="text-xs font-bold text-gray-700 ml-1">
                                            {selectedLab.coordinator?.name || 'Unassigned'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('experiments')}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'experiments' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                Experiments
                            </button>
                            <button
                                onClick={() => setActiveTab('questions')}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${activeTab === 'questions' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                Student Q&A
                                {questions.filter(q => q.status === 'pending' && q.science_lab_id === selectedLab.id).length > 0 && (
                                    <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] animate-pulse">
                                        {questions.filter(q => q.status === 'pending' && q.science_lab_id === selectedLab.id).length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {activeTab === 'experiments' && !isEditingExp && (
                            <button
                                onClick={handleOpenStudentView}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Switch to Student View
                            </button>
                        )}
                    </div>

                    {activeTab === 'experiments' && (
                        isEditingExp ? (
                            <Card title={isEditingExp === 'new' ? 'New Experiment' : 'Edit Experiment'}>
                                <form onSubmit={handleSaveExperiment} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-400">Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-400">Curriculum</label>
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
                                            <label className="text-xs font-semibold text-gray-400">Level</label>
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
                                            <label className="text-xs font-semibold text-gray-400">Duration (e.g., 45 mins)</label>
                                            <input
                                                type="text"
                                                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-gray-400">YouTube Video URL</label>
                                            <input
                                                type="text"
                                                placeholder="https://youtube.com/watch?v=..."
                                                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold"
                                                value={formData.youtube_url}
                                                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-semibold text-gray-400">Requirements (Materials needed)</label>
                                            <ReactQuill
                                                theme="snow"
                                                modules={quillModules}
                                                className="bg-gray-50 rounded-2xl overflow-hidden"
                                                value={formData.requirements}
                                                onChange={(val) => setFormData({ ...formData, requirements: val })}
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-semibold text-gray-400">Observations</label>
                                            <ReactQuill
                                                theme="snow"
                                                modules={quillModules}
                                                className="bg-gray-50 rounded-2xl overflow-hidden"
                                                value={formData.observations}
                                                onChange={(val) => setFormData({ ...formData, observations: val })}
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-semibold text-gray-400">Explanations</label>
                                            <ReactQuill
                                                theme="snow"
                                                modules={quillModules}
                                                className="bg-gray-50 rounded-2xl overflow-hidden"
                                                value={formData.explanations}
                                                onChange={(val) => setFormData({ ...formData, explanations: val })}
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-semibold text-gray-400">Conclusion</label>
                                            <ReactQuill
                                                theme="snow"
                                                modules={quillModules}
                                                className="bg-gray-50 rounded-2xl overflow-hidden"
                                                value={formData.conclusion}
                                                onChange={(val) => setFormData({ ...formData, conclusion: val })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-semibold text-gray-800">Experiment Steps</h4>
                                            <button type="button" onClick={addStep} className="text-blue-600 font-semibold text-sm hover:underline">+ Add Step</button>
                                        </div>
                                        <div className="space-y-4">
                                            {formData.steps.map((step, idx) => (
                                                <div key={idx} className="flex gap-4 items-start bg-gray-50 p-6 rounded-xl border border-gray-100">
                                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-semibold text-gray-400 flex-shrink-0 shadow-sm border border-gray-100">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <div className="md:col-span-3">
                                                            <ReactQuill
                                                                theme="bubble"
                                                                modules={quillModules}
                                                                placeholder="Step instruction..."
                                                                className="bg-white border border-gray-100 rounded-2xl"
                                                                value={step.instruction}
                                                                onChange={(val) => updateStep(idx, 'instruction', val)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <select
                                                                className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none text-sm font-semibold shadow-sm"
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
                                                <div className="py-4 bg-gray-50 rounded-xl text-center border-4 border-dashed border-gray-100">
                                                    <p className="text-gray-400 font-bold">No steps added yet. Add steps to make it interactive!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-semibold text-gray-800">Knowledge Check (Multiple Choice)</h4>
                                            <button type="button" onClick={addKnowledgeCheck} className="text-green-600 font-semibold text-sm hover:underline">+ Add Question</button>
                                        </div>
                                        <div className="space-y-6">
                                            {(formData.knowledge_check || []).map((kc, idx) => (
                                                <div key={idx} className="bg-gray-50 p-6 rounded-xl border border-gray-100 relative">
                                                    <button type="button" onClick={() => removeKnowledgeCheck(idx)} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-400">Question {idx + 1}</label>
                                                            <input type="text" className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-bold mt-1" value={kc.question} onChange={e => updateKnowledgeCheck(idx, 'question', e.target.value)} />
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {kc.options.map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex items-center gap-2">
                                                                    <input type="radio" name={`correct_${idx}`} checked={kc.correct_index === oIdx} onChange={() => updateKnowledgeCheck(idx, 'correct_index', oIdx)} />
                                                                    <input type="text" placeholder={`Option ${oIdx + 1}`} className="flex-1 p-2 bg-white border border-gray-200 rounded-lg outline-none text-sm" value={opt} onChange={e => updateKnowledgeCheck(idx, `option_${oIdx}`, e.target.value)} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-400">Feedback / Explanation</label>
                                                            <textarea className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm mt-1" placeholder="Why is this correct?" value={kc.explanation} onChange={e => updateKnowledgeCheck(idx, 'explanation', e.target.value)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-gray-50">
                                        <Button type="submit" className="px-4 py-4 w-full md:w-auto">Save Experiment</Button>
                                        <Button variant="outline" type="button" className="w-full md:w-auto" onClick={() => setIsEditingExp(null)}>Cancel</Button>
                                    </div>
                                </form>
                            </Card>
                        ) : (
                            <>
                                <div className="flex justify-end">
                                    {canManageLab(currentUser, selectedLab) && (
                                        <Button className="w-full md:w-auto mt-4 md:mt-0" onClick={() => openEditExp(null)}>+ Add New Experiment</Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {(selectedLab.experiments || []).map(exp => (
                                        <Card key={exp.id} className="relative group border border-gray-100 hover:border-school-primary/30 transition-all">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-black uppercase tracking-tighter`}>
                                                            {exp.curriculum?.name || 'Any'}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase tracking-tighter">
                                                            {exp.level}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-sm font-black text-gray-900 uppercase italic leading-none">{exp.title}</h3>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Duration: {exp.duration}</p>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => handlePreviewSimulation(exp)}
                                                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                        title="Preview Simulation"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </button>
                                                    {canManageLab(currentUser, selectedLab) && (
                                                        <>
                                                            <button onClick={() => openEditExp(exp)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Edit">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                                            </button>
                                                            <button onClick={() => handleDeleteExp(exp.id)} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Delete">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-4 pt-4 border-t border-gray-50 bg-gray-50/30 -mx-4 px-4 pb-4">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experimental Sequence ({exp.steps?.length || 0})</h4>
                                                <div className="space-y-2">
                                                    {(exp.steps || []).slice(0, 3).map((s, i) => (
                                                        <div key={i} className="flex gap-3 items-center text-[11px] font-bold text-gray-500 uppercase italic truncate">
                                                            <span className="w-5 h-5 bg-white rounded-md flex items-center justify-center text-[10px] text-gray-300 border border-gray-100 shadow-sm">{i + 1}</span>
                                                            <span className="truncate">{s.instruction}</span>
                                                        </div>
                                                    ))}
                                                    {exp.steps?.length > 3 && (
                                                        <p className="text-[10px] font-black text-school-primary ml-8 uppercase opacity-60 italic">+ {exp.steps.length - 3} More Phases</p>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    {(selectedLab.experiments || []).length === 0 && (
                                        <div className="col-span-full p-20 text-center border-4 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-200 shadow-sm border border-gray-100">
                                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-400 mb-2 italic uppercase">No Experiments Yet</h3>
                                            <p className="text-gray-400 font-bold text-xs max-w-sm mx-auto uppercase">Click "Add New Experiment" above to start building interactive content for this lab.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )
                    )}

                    {activeTab === 'questions' && (
                        <div className="space-y-6">
                            {questions.filter(q => q.science_lab_id === selectedLab.id).length === 0 ? (
                                <div className="p-6 text-center border-[3px] border-dashed border-gray-100 rounded-2xl bg-gray-50">
                                    <h3 className="text-base font-bold text-gray-400 mb-2">No Student Questions Yet</h3>
                                    <p className="text-gray-400 font-bold max-w-sm mx-auto">When students ask questions in this lab, they will appear here for the coordinator to answer.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {questions.filter(q => q.science_lab_id === selectedLab.id).map(q => (
                                        <Card key={q.id} className={`p-4 border-l-8 ${q.status === 'answered' ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                                        {q.student?.avatar ? <img src={q.student.avatar} className="w-full h-full object-cover" alt="Student" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{q.student?.name?.[0]}</div>}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{q.student?.name}</p>
                                                        <p className="text-[10px] text-gray-500 font-semibold">{new Date(q.created_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${q.status === 'answered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
                                                    {q.status}
                                                </span>
                                            </div>

                                            <div className="bg-gray-50 p-6 rounded-2xl mb-6 shadow-inner border border-gray-100">
                                                <p className="text-gray-800 font-medium text-lg leading-relaxed shrink max-h-40 overflow-auto whitespace-pre-wrap">"{q.question}"</p>
                                            </div>

                                            {q.status === 'pending' ? (
                                                <form onSubmit={(e) => handleAnswerQuestion(e, q.id)} className="space-y-4 pt-4 border-t border-gray-100">
                                                    <textarea
                                                        name="answer"
                                                        required
                                                        className="w-full p-4 bg-white border-2 border-gray-100 focus:border-amber-500 rounded-2xl outline-none font-medium resize-none text-sm"
                                                        placeholder="Write your explanation or answer here..."
                                                        rows="3"
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button type="submit" className="bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/20 px-5 py-3">Submit Reply</Button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="pt-4 border-t border-gray-100">
                                                    <h4 className="text-xs font-semibold text-emerald-600 mb-2">Coordinator Reply</h4>
                                                    <p className="text-sm font-medium text-gray-600 whitespace-pre-wrap">{q.answer}</p>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
