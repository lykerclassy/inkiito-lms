import React, { useState, useEffect, useContext } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { AuthContext } from '../../contexts/AuthContext';

export default function QuizManager() {
    const { user: currentUser } = useContext(AuthContext);
    const [quizzes, setQuizzes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(null); // Quiz object or 'new'
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Quiz Form
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject_id: '',
        time_limit: '',
        is_active: true
    });

    const { showNotification, askConfirmation } = useNotification();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [quizRes, subjRes] = await Promise.all([
                api.get('admin/quizzes'),
                api.get('subjects')
            ]);
            setQuizzes(quizRes.data);
            setSubjects(subjRes.data);
        } catch (err) {
            console.error("Failed to fetch data", err);
            showNotification("Failed to load quizzes", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveQuiz = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditing === 'new') {
                await api.post('admin/quizzes', formData);
                showNotification("Quiz created successfully", "success");
            } else {
                await api.put(`admin/quizzes/${isEditing.id}`, formData);
                showNotification("Quiz updated", "success");
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.message || "Save failed", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await askConfirmation("Are you sure you want to delete this quiz?", "Delete Quiz?");
        if (!confirmed) return;
        try {
            await api.delete(`admin/quizzes/${id}`);
            showNotification("Quiz removed", "success");
            fetchData();
        } catch (err) {
            showNotification("Delete failed", "error");
        }
    };

    const openEdit = (quiz) => {
        if (quiz) {
            setFormData({
                title: quiz.title,
                description: quiz.description,
                subject_id: quiz.subject_id,
                time_limit: quiz.time_limit || '',
                is_active: quiz.is_active
            });
            setIsEditing(quiz);
        } else {
            setFormData({
                title: '',
                description: '',
                subject_id: currentUser?.taught_subjects?.[0]?.id || '',
                time_limit: '',
                is_active: true
            });
            setIsEditing('new');
        }
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quiz Management</h1>
                    <p className="text-gray-500">Create and manage standalone quizzes for your subjects.</p>
                </div>
                <Button onClick={() => openEdit(null)} className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Create New Quiz
                </Button>
            </div>

            {isLoading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Loading your quizzes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map(quiz => (
                        <Card key={quiz.id} className="relative group hover:shadow-xl transition-all duration-300 border-t-4 border-blue-500">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded">
                                        {quiz.subject?.name}
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(quiz)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(quiz.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{quiz.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{quiz.description || 'No description provided.'}</p>

                                <div className="flex items-center justify-between text-xs font-bold text-gray-400 border-t border-gray-50 pt-4">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {quiz.questions?.length || 0} Questions
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {quiz.time_limit ? `${quiz.time_limit}m` : 'Un-timed'}
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full mt-6 text-blue-600 border-blue-100 hover:bg-blue-50"
                                    onClick={() => window.location.href = `/admin/quizzes/${quiz.id}/questions`}
                                >
                                    Manage Questions
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {quizzes.length === 0 && (
                        <div className="col-span-full py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                            <p className="text-gray-400 font-bold">No quizzes created yet.</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-6 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-black text-gray-900">{isEditing === 'new' ? 'New Quiz' : 'Edit Quiz'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveQuiz} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Target Subject</label>
                                        <select
                                            required
                                            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700"
                                            value={formData.subject_id}
                                            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.academic_level?.name})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Time Limit (Min)</label>
                                        <input
                                            type="number"
                                            placeholder="Optional"
                                            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700"
                                            value={formData.time_limit}
                                            onChange={(e) => setFormData({ ...formData, time_limit: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Quiz Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter descriptive title..."
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Description</label>
                                    <textarea
                                        rows="3"
                                        placeholder="What is this quiz about?"
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700 resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        className="w-5 h-5 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <label htmlFor="is_active" className="text-xs font-bold text-blue-900">Publish Quiz (Visible to Students)</label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="submit" className="flex-1 py-4 shadow-lg shadow-blue-100 uppercase text-xs tracking-widest" isLoading={isSubmitting}>
                                    {isEditing === 'new' ? 'Launch Quiz' : 'Update Details'}
                                </Button>
                                <Button variant="outline" type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 uppercase text-xs tracking-widest">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
