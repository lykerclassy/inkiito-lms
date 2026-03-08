import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useNotification } from '../../contexts/NotificationContext';

export default function AdminAssignments() {
    const navigate = useNavigate();
    const { showNotification, askConfirmation } = useNotification();

    // Data State
    const [assignments, setAssignments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Assignment Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editId, setEditId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Grading Modal State
    const [isGradingOpen, setIsGradingOpen] = useState(false);
    const [activeSubmissions, setActiveSubmissions] = useState([]);
    const [activeAssignment, setActiveAssignment] = useState(null);

    // Controlled state for grading inputs
    const [gradingData, setGradingData] = useState({});

    const initialFormState = {
        title: '',
        subject_id: '',
        type: 'Homework',
        due_date: '',
        description: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            const [assignmentsRes, subjectsRes] = await Promise.all([
                api.get('/assignments'),
                api.get('/subjects')
            ]);

            setAssignments(assignmentsRes.data);
            setSubjects(subjectsRes.data);

            if (subjectsRes.data.length > 0 && !formData.subject_id) {
                setFormData(prev => ({ ...prev, subject_id: subjectsRes.data[0].id }));
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError("Could not load assignments.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- ASSIGNMENT CRUD ---
    const openCreateModal = () => {
        setModalMode('create');
        setEditId(null);
        setFormData({ ...initialFormState, subject_id: subjects.length > 0 ? subjects[0].id : '' });
        setIsModalOpen(true);
    };

    const openEditModal = (assignment) => {
        setModalMode('edit');
        setEditId(assignment.id);
        setFormData({
            title: assignment.title,
            subject_id: assignment.subject_id,
            type: assignment.type,
            due_date: assignment.due_date,
            description: assignment.description || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await askConfirmation("Delete this assignment and all submissions permanently?", "Delete assignment?");
        if (!confirmed) return;
        try {
            await api.delete(`/assignments/${id}`);
            await fetchData();
            showNotification("Assignment deleted.", "success");
        } catch (err) {
            showNotification("Failed to delete.", "error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (modalMode === 'create') {
                await api.post('/assignments', formData);
            } else {
                await api.put(`/assignments/${editId}`, formData);
            }
            await fetchData();
            setIsModalOpen(false);
            showNotification("Assignment saved successfully.", "success");
        } catch (err) {
            showNotification("Failed to save assignment.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- GRADING LOGIC ---
    const openGradingModal = async (assignment) => {
        setActiveAssignment(assignment);
        setIsGradingOpen(true);
        try {
            const res = await api.get(`/assignments/${assignment.id}/submissions`);
            setActiveSubmissions(res.data);

            // Initialize the controlled grading inputs for each submission
            const initialGradingData = {};
            res.data.forEach(sub => {
                initialGradingData[sub.id] = {
                    score: sub.score || '',
                    teacher_feedback: sub.teacher_feedback || ''
                };
            });
            setGradingData(initialGradingData);

        } catch (err) {
            showNotification("Failed to load submissions.", "error");
        }
    };

    const handleSaveGradeAndFeedback = async (submissionId) => {
        const data = gradingData[submissionId];

        if (data.score === '') {
            showNotification("Please enter a score before saving.", "warning");
            return;
        }

        try {
            await api.put(`/submissions/${submissionId}/grade`, {
                score: data.score,
                teacher_feedback: data.teacher_feedback
            });

            // Update local state to reflect the new graded status
            setActiveSubmissions(prev => prev.map(sub =>
                sub.id === submissionId ? { ...sub, score: data.score, teacher_feedback: data.teacher_feedback, status: 'graded' } : sub
            ));

            showNotification("Grade and feedback saved successfully!", "success");
        } catch (err) {
            showNotification("Failed to save grade.", "error");
        }
    };

    if (isLoading) return <div className="p-4 text-gray-500 font-medium">Loading assignments...</div>;
    if (error) return <div className="p-4 text-red-500 font-medium">{error}</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Assignment Center</h1>
                    <p className="text-gray-500 mt-1">Manage structured assessments and provide feedback.</p>
                </div>
                <Button variant="primary" onClick={openCreateModal}>
                    + Create Basic Assignment
                </Button>
            </div>

            <Card noPadding={true} className="overflow-hidden border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Active Assessments</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-white text-gray-500 font-medium border-b border-gray-100 uppercase  text-xs">
                            <tr>
                                <th className="px-6 py-4">Title / Category</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4 text-center">Submitted</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {assignments.map((assignment) => (
                                <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{assignment.title}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{assignment.type}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-700">{assignment.subject?.name}</td>
                                    <td className="px-6 py-4 text-gray-800">{assignment.due_date}</td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-400">pending track</td>
                                    <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                                        <button onClick={() => openGradingModal(assignment)} className="text-green-600 hover:text-green-800 font-bold text-sm">Grade Work</button>
                                        <button onClick={() => navigate(`/admin/assignments/${assignment.id}/edit-content`)} className="text-blue-600 hover:text-blue-800 font-bold text-sm">Build Content &rarr;</button>
                                        <button onClick={() => openEditModal(assignment)} className="text-gray-400 hover:text-gray-600 font-medium text-sm">Edit</button>
                                        <button onClick={() => handleDelete(assignment.id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* BASIC CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-sm w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <h3 className="text-lg font-bold text-gray-900 capitalize">{modalMode} Basic Assignment</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <select required value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500">
                                        {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500">
                                            <option>Homework</option>
                                            <option>Project</option>
                                            <option>Exam</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                        <input type="date" required value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Summary / Description (Optional)</label>
                                    <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Short description for the table view" />
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 flex gap-3 mt-4">
                                    <svg className="w-10 h-10 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p>You will build the actual questions (Short answer, Biology diagrams, Long answer essays, etc.) on the next screen after saving these details.</p>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" isLoading={isSubmitting}>Save Details</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* GRADING MODAL */}
            {isGradingOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-sm w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Grading: {activeAssignment?.title}</h3>
                            <button onClick={() => setIsGradingOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6 space-y-6 bg-gray-50">
                            {activeSubmissions.length === 0 ? (
                                <div className="text-center text-gray-500 py-3">No students have submitted yet.</div>
                            ) : (
                                activeSubmissions.map(submission => (
                                    <Card key={submission.id} className="border border-gray-200">
                                        <div className="flex justify-between items-start mb-4 gap-4">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{submission.student?.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase  ${submission.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {submission.status}
                                                    </span>
                                                    <p className="text-xs text-gray-500">Handed in: {new Date(submission.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number" placeholder="Score (%)"
                                                    className="w-24 p-2 border border-gray-300 rounded outline-none text-lg font-bold text-center"
                                                    value={gradingData[submission.id]?.score || ''}
                                                    onChange={(e) => setGradingData({ ...gradingData, [submission.id]: { ...gradingData[submission.id], score: e.target.value } })}
                                                />
                                                <span className="font-bold text-gray-600">%</span>
                                            </div>
                                        </div>

                                        {/* View Student's Structured Answers */}
                                        <div className="bg-white p-4 rounded border border-gray-100 text-sm text-gray-700 space-y-4 mb-4">
                                            <strong className="text-gray-900">Student Responses:</strong>

                                            {(!submission.student_answers || submission.student_answers.length === 0) ? (
                                                <div className="italic text-gray-400">Empty submission.</div>
                                            ) : (
                                                submission.student_answers.map((ans, index) => (
                                                    <div key={index} className="border-l-4 border-blue-200 pl-4 py-1">
                                                        <p className="font-medium text-gray-900 mb-1">Q: {ans.qText}</p>

                                                        {ans.inputType === 'file' ? (
                                                            <a href={ans.answer} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm break-all font-medium">View Student Upload/Link &rarr;</a>
                                                        ) : (
                                                            <div className="bg-gray-50 p-3 rounded border border-gray-100 whitespace-pre-wrap">{ans.answer || <span className="italic text-gray-400">No answer provided.</span>}</div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Teacher's Feedback & Save Button */}
                                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                            <label className="text-xs font-bold text-gray-500 uppercase ">Teacher's Feedback (Private to student)</label>
                                            <textarea
                                                rows="1"
                                                style={{ height: 'auto', minHeight: '80px' }}
                                                onInput={(e) => {
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = (e.target.scrollHeight) + 'px';
                                                }}
                                                placeholder="Type personalized feedback here..."
                                                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white resize-none overflow-hidden"
                                                value={gradingData[submission.id]?.teacher_feedback || ''}
                                                onChange={(e) => setGradingData({ ...gradingData, [submission.id]: { ...gradingData[submission.id], teacher_feedback: e.target.value } })}
                                            ></textarea>

                                            <div className="flex justify-end">
                                                <Button
                                                    variant="primary"
                                                    onClick={() => handleSaveGradeAndFeedback(submission.id)}
                                                >
                                                    Save Grade & Feedback
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}