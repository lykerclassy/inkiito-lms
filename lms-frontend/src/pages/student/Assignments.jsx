import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function Assignments() {
    const [activeTab, setActiveTab] = useState('pending');
    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [expandedId, setExpandedId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Holds answers keyed by blockId
    const [studentAnswers, setStudentAnswers] = useState({});

    const fetchAssignments = async () => {
        try {
            const response = await api.get('/student/assignments');
            const processedAssignments = response.data.map(assignment => {
                const mySubmission = assignment.submissions && assignment.submissions.length > 0 ? assignment.submissions[0] : null;
                return { ...assignment, mySubmission, status: mySubmission ? 'completed' : 'pending' };
            });
            setAssignments(processedAssignments);
        } catch (err) { setError("Could not load your assignments."); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchAssignments(); }, []);

    const toggleExpand = (assignment) => {
        if (expandedId === assignment.id) {
            setExpandedId(null);
        } else {
            setExpandedId(assignment.id);
            setStudentAnswers({}); // Clear form on open
        }
    };

    // Handle standard inputs & radio buttons
    const handleAnswerChange = (blockId, value) => {
        setStudentAnswers(prev => ({ ...prev, [blockId]: value }));
    };

    // Handle array-based checkboxes
    const handleCheckboxChange = (blockId, option) => {
        setStudentAnswers(prev => {
            const currentAnswers = Array.isArray(prev[blockId]) ? prev[blockId] : [];
            if (currentAnswers.includes(option)) {
                return { ...prev, [blockId]: currentAnswers.filter(o => o !== option) };
            } else {
                return { ...prev, [blockId]: [...currentAnswers, option] };
            }
        });
    };

    const handleHandInWork = async (assignment) => {
        setIsSubmitting(true);
        try {
            let parsedBlocks = [];
            try { parsedBlocks = typeof assignment.content === 'string' ? JSON.parse(assignment.content) : (assignment.content || []); } 
            catch(e) { parsedBlocks = []; }

            const formattedAnswers = parsedBlocks
                .filter(block => !block.type.includes('info')) // Exclude presentation blocks
                .map(block => ({
                    blockId: block.id,
                    qText: block.title || block.question,
                    inputType: block.type,
                    answer: studentAnswers[block.id] || (block.type === 'checkboxes' ? [] : '')
                }));

            await api.post(`/assignments/${assignment.id}/submit`, { answers: formattedAnswers });
            await fetchAssignments();
            setExpandedId(null);
            alert("Great job! Your assessment has been handed in.");
            setActiveTab('completed');
        } catch (err) {
            alert("Failed to submit. Please ensure you have a stable connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getBlocks = (contentString) => {
        try { return typeof contentString === 'string' ? JSON.parse(contentString) : (contentString || []); } 
        catch (e) { return []; }
    };

    const filteredAssignments = assignments.filter(a => a.status === activeTab);

    if (isLoading) return <div className="p-8 text-gray-500 font-medium">Loading your assessments...</div>;
    if (error) return <div className="p-8 text-red-500 font-medium">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Assessments</h1>
                <p className="text-gray-500 mt-1">Complete your assigned homework, projects, and exams.</p>
            </div>

            <Card noPadding={true} className="overflow-hidden border border-gray-200 shadow-sm">
                <div className="flex border-b border-gray-200 bg-gray-50 px-4">
                    <button className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'pending' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('pending')}>
                        Pending Tasks ({assignments.filter(a => a.status === 'pending').length})
                    </button>
                    <button className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'completed' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('completed')}>
                        Handed In ({assignments.filter(a => a.status === 'completed').length})
                    </button>
                </div>

                <div className="divide-y divide-gray-100 bg-white">
                    {filteredAssignments.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 italic">You have no {activeTab} assessments right now.</div>
                    ) : (
                        filteredAssignments.map((assignment) => {
                            const blocks = getBlocks(assignment.content);
                            
                            return (
                                <div key={assignment.id} className="flex flex-col transition-colors">
                                    {/* Header Summary Bar */}
                                    <div className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 ${expandedId === assignment.id ? 'bg-blue-50/30' : ''}`} onClick={() => toggleExpand(assignment)}>
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${assignment.status === 'pending' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                    <span className="font-medium text-gray-700">{assignment.subject?.name}</span>
                                                    <span>•</span>
                                                    <span className={assignment.status === 'pending' ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                                                        {assignment.status === 'pending' ? `Due: ${assignment.due_date}` : `Submitted`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {assignment.mySubmission?.status === 'graded' && (
                                                <span className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full border border-green-200 shadow-sm">Score: {assignment.mySubmission.score}%</span>
                                            )}
                                            {assignment.mySubmission?.status === 'submitted' && (
                                                <span className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full border border-yellow-200">Pending Grading</span>
                                            )}
                                            <Button variant={expandedId === assignment.id ? 'secondary' : (assignment.status === 'pending' ? 'primary' : 'outline')}>
                                                {expandedId === assignment.id ? 'Close Assessment' : (assignment.status === 'pending' ? 'Start Task' : 'View Feedback')}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded Content Workspace */}
                                    {expandedId === assignment.id && (
                                        <div className="border-t border-blue-100 bg-blue-50/10 p-6 sm:p-8 space-y-6">

                                            {/* RENDER DYNAMIC BLOCKS */}
                                            {blocks.map((block, index) => {
                                                const isGraded = assignment.status === 'completed';
                                                // Find the student's submitted answer if it exists
                                                const submittedAnswerData = assignment.mySubmission?.student_answers?.find(a => a.blockId === block.id);
                                                const displayAnswer = submittedAnswerData ? submittedAnswerData.answer : null;

                                                return (
                                                    <div key={block.id} className="w-full">
                                                        
                                                        {/* --- Presentation Blocks --- */}
                                                        {block.type === 'text_info' && (
                                                            <div className="mb-2">
                                                                <h3 className="text-xl font-bold text-gray-900">{block.title}</h3>
                                                                <p className="text-gray-700 whitespace-pre-wrap mt-1">{block.description}</p>
                                                            </div>
                                                        )}

                                                        {block.type === 'image_info' && block.url && (
                                                            <div className="my-4 text-center">
                                                                <img src={block.url} alt="Assessment Diagram" className="max-w-full h-auto mx-auto rounded-lg border border-gray-200 shadow-sm" />
                                                            </div>
                                                        )}

                                                        {block.type === 'video_info' && block.url && (
                                                            <div className="relative w-full overflow-hidden rounded-xl shadow-sm border border-gray-200 my-4" style={{ paddingTop: '56.25%' }}>
                                                                {block.url.includes('youtube.com') || block.url.includes('youtu.be') ? (
                                                                    <iframe className="absolute top-0 left-0 w-full h-full" src={`https://www.youtube.com/embed/${block.url.split('v=')[1]?.split('&')[0] || block.url.split('youtu.be/')[1]}`} title="Video" frameBorder="0" allowFullScreen></iframe>
                                                                ) : (
                                                                    <video controls className="absolute top-0 left-0 w-full h-full"><source src={block.url} />Not supported.</video>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* --- Question Blocks --- */}
                                                        {!block.type.includes('info') && (
                                                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                                                <div className="flex justify-between gap-4 mb-2">
                                                                    <p className="font-bold text-gray-900 text-lg">{block.title || block.question} {block.required && <span className="text-red-500">*</span>}</p>
                                                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded shrink-0">{block.points} pts</span>
                                                                </div>
                                                                {block.description && <p className="text-sm text-gray-500 mb-4">{block.description}</p>}

                                                                {/* SHORT ANSWER */}
                                                                {block.type === 'short_answer' && (
                                                                    !isGraded ? (
                                                                        <input 
                                                                            type="text" className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                                                            placeholder="Your answer"
                                                                            value={studentAnswers[block.id] || ''}
                                                                            onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                                                                        />
                                                                    ) : (
                                                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-800">{displayAnswer || <span className="italic text-gray-400">No answer</span>}</div>
                                                                    )
                                                                )}

                                                                {/* LONG ANSWER */}
                                                                {block.type === 'paragraph' && (
                                                                    !isGraded ? (
                                                                        <textarea 
                                                                            rows="4" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                                                            placeholder="Your answer"
                                                                            value={studentAnswers[block.id] || ''}
                                                                            onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                                                                        ></textarea>
                                                                    ) : (
                                                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg whitespace-pre-wrap text-gray-800">{displayAnswer || <span className="italic text-gray-400">No answer</span>}</div>
                                                                    )
                                                                )}

                                                                {/* MULTIPLE CHOICE */}
                                                                {block.type === 'multiple_choice' && (
                                                                    <div className="space-y-3 mt-4">
                                                                        {block.options.map((opt, i) => (
                                                                            <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                                                                <input 
                                                                                    type="radio" 
                                                                                    name={`block-${block.id}`}
                                                                                    className="w-5 h-5 text-blue-600 cursor-pointer"
                                                                                    checked={!isGraded ? studentAnswers[block.id] === opt : displayAnswer === opt}
                                                                                    onChange={() => !isGraded && handleAnswerChange(block.id, opt)}
                                                                                    disabled={isGraded}
                                                                                />
                                                                                <span className={`text-base ${isGraded && displayAnswer === opt ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{opt}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* CHECKBOXES */}
                                                                {block.type === 'checkboxes' && (
                                                                    <div className="space-y-3 mt-4">
                                                                        {block.options.map((opt, i) => {
                                                                            const isChecked = !isGraded 
                                                                                ? (Array.isArray(studentAnswers[block.id]) && studentAnswers[block.id].includes(opt))
                                                                                : (Array.isArray(displayAnswer) && displayAnswer.includes(opt));
                                                                            return (
                                                                                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                                                                    <input 
                                                                                        type="checkbox" 
                                                                                        className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                                                                                        checked={isChecked}
                                                                                        onChange={() => !isGraded && handleCheckboxChange(block.id, opt)}
                                                                                        disabled={isGraded}
                                                                                    />
                                                                                    <span className={`text-base ${isGraded && isChecked ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{opt}</span>
                                                                                </label>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {/* FILE UPLOAD */}
                                                                {block.type === 'file_upload' && (
                                                                    !isGraded ? (
                                                                        <div>
                                                                            <input 
                                                                                type="url" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                                                                placeholder="Paste URL to file (e.g., Google Drive link)"
                                                                                value={studentAnswers[block.id] || ''}
                                                                                onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                                            {displayAnswer ? (
                                                                                <a href={displayAnswer} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline break-all">View Attached File &rarr;</a>
                                                                            ) : <span className="italic text-gray-400">No file submitted</span>}
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Submit Button */}
                                            {assignment.status === 'pending' && (
                                                <div className="flex justify-end pt-4">
                                                    <Button variant="primary" onClick={() => handleHandInWork(assignment)} isLoading={isSubmitting}>
                                                        Submit Assessment
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Teacher Feedback Display */}
                                            {assignment.status === 'completed' && assignment.mySubmission?.teacher_feedback && (
                                                <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm mt-8">
                                                    <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Teacher's Feedback</h4>
                                                    <p className="text-green-900 font-medium text-lg italic">"{assignment.mySubmission.teacher_feedback}"</p>
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>
        </div>
    );
}