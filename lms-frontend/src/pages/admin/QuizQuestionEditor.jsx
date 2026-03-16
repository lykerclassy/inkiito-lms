import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api, { getMediaUrl } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export default function QuizQuestionEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(null); // Question object or 'new'
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Question Form
    const [formData, setFormData] = useState({
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 1,
        image: null,
        image_preview: null
    });

    const { showNotification, askConfirmation } = useNotification();

    useEffect(() => {
        fetchQuiz();
    }, [id]);

    const fetchQuiz = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`admin/quizzes/${id}`);
            setQuiz(res.data);
        } catch (err) {
            console.error(err);
            showNotification("Failed to load quiz questions", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = new FormData();
        data.append('question_text', formData.question_text);
        data.append('question_type', formData.question_type);
        data.append('correct_answer', formData.correct_answer);
        data.append('points', formData.points);
        data.append('options', JSON.stringify(formData.options));
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            if (isEditing === 'new') {
                await api.post(`admin/quizzes/${id}/questions`, data);
            } else {
                // Laravel workaround for file uploads with PUT: use POST + _method
                data.append('_method', 'PUT');
                await api.post(`admin/quiz-questions/${isEditing.id}`, data);
            }
            setShowModal(false);
            fetchQuiz();
            showNotification("Question saved", "success");
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || err.response?.data?.error || "Failed to save question";
            showNotification(message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (qid) => {
        const confirmed = await askConfirmation("Remove this question?", "Delete Question?");
        if (!confirmed) return;
        try {
            await api.delete(`admin/quiz-questions/${qid}`);
            showNotification("Question removed", "success");
            fetchQuiz();
        } catch (err) {
            showNotification("Delete failed", "error");
        }
    };

    const openEdit = (q) => {
        if (q) {
            setFormData({
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options || ['', '', '', ''],
                correct_answer: q.correct_answer,
                points: q.points,
                image: null,
                image_preview: getMediaUrl(q.image_path)
            });
            setIsEditing(q);
        } else {
            setFormData({
                question_text: '',
                question_type: 'multiple_choice',
                options: ['', '', '', ''],
                correct_answer: '',
                points: 1,
                image: null,
                image_preview: null
            });
            setIsEditing('new');
        }
        setShowModal(true);
    };

    if (isLoading) return <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">Loading Master Library...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/admin/quizzes')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">{quiz?.title}</h1>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{quiz?.subject?.name} • Question Editor</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    {quiz?.questions?.map((q, idx) => (
                        <Card key={q.id} className="relative group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                            {idx + 1}
                                        </span>
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{q.question_type}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(q)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg bg-gray-50 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(q.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg bg-gray-50 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                                {q.image_path && (
                                    <div className="mb-6 rounded-2xl overflow-hidden border border-gray-100 max-h-64 flex items-center justify-center bg-gray-50">
                                        <img
                                            src={getMediaUrl(q.image_path)}
                                            alt="Question Visual"
                                            className="max-h-64 object-contain"
                                        />
                                    </div>
                                )}
                                <p className="text-gray-900 font-bold text-lg mb-6">{q.question_text}</p>

                                {q.options && Array.isArray(q.options) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className={`p-3 rounded-xl border text-sm font-semibold transition-all ${opt === q.correct_answer ? 'bg-green-50 border-green-200 text-green-700 ring-2 ring-green-100' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                                                {String.fromCharCode(65 + i)}. {opt}
                                                {opt === q.correct_answer && <span className="ml-2 text-[10px] uppercase font-black">✓ Correct</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}

                    {(!quiz?.questions || quiz.questions.length === 0) && (
                        <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold">This quiz is empty. Add your first question!</p>
                            <Button onClick={() => openEdit(null)} className="mt-4">+ Add Question</Button>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-80">
                    <Card className="sticky top-24 p-6 bg-blue-600 border-none text-white overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6 opacity-80">Quiz Summary</h3>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold opacity-60">Total Points</span>
                                    <span className="text-2xl font-black">{quiz?.questions?.reduce((acc, q) => acc + q.points, 0) || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold opacity-60">Questions</span>
                                    <span className="font-black">{quiz?.questions?.length || 0}</span>
                                </div>
                            </div>
                            <Button variant="white" onClick={() => openEdit(null)} className="w-full py-4 text-blue-600 font-black uppercase tracking-wider text-xs">
                                + Add Question
                            </Button>
                        </div>
                        <div className="absolute -bottom-10 -right-10 opacity-10">
                            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                        </div>
                    </Card>
                </div>
            </div>

            {
                showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in duration-200">
                            <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">{isEditing === 'new' ? 'New Question' : 'Edit Question'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleSaveQuestion} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Question Prompt</label>
                                        <textarea
                                            required
                                            rows="3"
                                            placeholder="Type your question here..."
                                            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 resize-none"
                                            value={formData.question_text}
                                            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Illustration (Optional)</label>
                                        <div className="flex flex-col gap-4">
                                            {formData.image_preview && (
                                                <div className="relative w-full h-48 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 p-2">
                                                    <img src={formData.image_preview} className="w-full h-full object-contain" alt="Preview" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, image: null, image_preview: null })}
                                                        className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="question-image"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setFormData({
                                                            ...formData,
                                                            image: file,
                                                            image_preview: URL.createObjectURL(file)
                                                        });
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor="question-image"
                                                className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-600 rounded-2xl cursor-pointer hover:bg-blue-100 transition-all border-2 border-dashed border-blue-200"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                <span className="text-xs font-black uppercase tracking-widest">{formData.image_preview ? 'Change Illustration' : 'Upload Illustration'}</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Type</label>
                                            <select
                                                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700"
                                                value={formData.question_type}
                                                onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                                            >
                                                <option value="multiple_choice">Multiple Choice</option>
                                                <option value="true_false">True / False</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Points</label>
                                            <input
                                                type="number"
                                                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700"
                                                value={formData.points}
                                                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {formData.question_type === 'multiple_choice' && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Options</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {formData.options.map((opt, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                            className={`flex-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700 ${formData.correct_answer === opt && opt !== '' ? 'ring-2 ring-green-500' : ''}`}
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newOpts = [...formData.options];
                                                                newOpts[i] = e.target.value;
                                                                setFormData({ ...formData, options: newOpts });
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, correct_answer: opt })}
                                                            className={`p-3 rounded-xl transition-all ${formData.correct_answer === opt && opt !== '' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            {formData.correct_answer === '' && <p className="text-[10px] text-red-500 font-bold uppercase pl-1 animate-pulse">Select the correct answer by clicking the checkmark</p>}
                                        </div>
                                    )}

                                    {formData.question_type === 'true_false' && (
                                        <div className="flex gap-4">
                                            {['True', 'False'].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, correct_answer: val, options: ['True', 'False'] })}
                                                    className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all ${formData.correct_answer === val ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button type="submit" className="flex-1 py-4 uppercase text-xs tracking-widest font-black" isLoading={isSubmitting} disabled={!formData.correct_answer && formData.question_type !== 'text'}>
                                        Save Question
                                    </Button>
                                    <Button variant="outline" type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 uppercase text-xs tracking-widest font-black">
                                        Discard Changes
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
