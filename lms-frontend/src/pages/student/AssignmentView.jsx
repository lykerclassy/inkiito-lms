import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CardSkeleton } from '../../components/common/Skeleton';
import MathText from '../../components/common/MathText';

export default function AssignmentView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [studentAnswers, setStudentAnswers] = useState({});

    // Added support for image attachments
    const fetchAssignment = async () => {
        try {
            const response = await api.get('/student/assignments');
            const foundAssignment = response.data.find(a => a.id === parseInt(id));

            if (!foundAssignment) {
                setError("Assignment not found or you don't have access.");
                setIsLoading(false);
                return;
            }

            const mySubmission = foundAssignment.submissions && foundAssignment.submissions.length > 0 ? foundAssignment.submissions[0] : null;
            setAssignment({ ...foundAssignment, mySubmission, status: mySubmission ? 'completed' : 'pending' });
        } catch (err) {
            setError("Could not load the assignment.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAssignment(); }, [id]);

    const handleAnswerChange = (blockId, value) => {
        setStudentAnswers(prev => ({ ...prev, [blockId]: value }));
    };

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

    const handleHandInWork = async () => {
        setIsSubmitting(true);
        try {
            let parsedBlocks = [];
            try { parsedBlocks = typeof assignment.content === 'string' ? JSON.parse(assignment.content) : (assignment.content || []); }
            catch (e) { parsedBlocks = []; }

            const formattedAnswers = parsedBlocks
                .filter(block => !block.type.includes('info'))
                .map(block => ({
                    blockId: block.id,
                    qText: block.title || block.question,
                    inputType: block.type,
                    answer: studentAnswers[block.id] || (block.type === 'checkboxes' ? [] : '')
                }));

            await api.post(`/assignments/${assignment.id}/submit`, { answers: formattedAnswers });
            await fetchAssignment();
            alert("Great job! Your assessment has been handed in.");
            navigate('/student/assignments');
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

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-4 pt-10 px-4 animate-in fade-in duration-500">
                <CardSkeleton />
                <div className="grid grid-cols-1 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div className="max-w-4xl mx-auto pt-10 px-4 animate-in fade-in">
                <div className="p-6 bg-red-50 text-school-primary font-black rounded-2xl border border-red-100 flex flex-col items-center justify-center min-h-[40vh]">
                    <span className="text-xl mb-4">{error || "Assignment not available"}</span>
                    <Button onClick={() => navigate('/student/assignments')} className="bg-school-primary text-white">Back to Assignments</Button>
                </div>
            </div>
        );
    }

    const blocks = getBlocks(assignment.content);
    const isGraded = assignment.status === 'completed';

    return (
        <div className="min-h-screen bg-gray-50/50 pt-8 pb-32 animate-in fade-in duration-300">
            <div className="max-w-4xl mx-auto px-4 space-y-8">

                {/* Back Link */}
                <button onClick={() => navigate('/student/assignments')} className="flex items-center gap-2 text-school-primary hover:text-school-secondary font-black uppercase text-[10px] tracking-widest transition-colors mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Assignments
                </button>

                {/* Assignment Header Card */}
                <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-school-primary/5 rounded-full blur-3xl group-hover:bg-school-primary/10 transition-all duration-1000 -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-school-secondary animate-pulse shrink-0"></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{assignment.subject?.name || 'Subject'}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${assignment.status === 'pending' ? 'text-red-500' : 'text-indigo-500'}`}>
                                    {assignment.status === 'pending' ? `Due: ${assignment.due_date}` : `Submitted`}
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight mb-2 break-words">
                                {assignment.title}
                            </h1>
                        </div>
                        <div className="shrink-0 flex flex-col items-start md:items-end gap-2 text-left md:text-right w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                            {assignment.mySubmission?.status === 'graded' ? (
                                <>
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Final Grade</span>
                                    <span className="bg-school-accent text-school-primary text-2xl font-black px-6 py-2 rounded-full shadow-lg shadow-yellow-100 italic">{assignment.mySubmission.score}%</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Total Points Available</span>
                                    <span className="bg-gray-100 text-gray-900 text-2xl font-black px-6 py-2 rounded-full border border-gray-200 shadow-inner italic">{blocks.reduce((sum, b) => sum + (Number(b.points) || 0), 0)}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Teacher Feedback Alert */}
                {assignment.status === 'completed' && assignment.mySubmission?.teacher_feedback && (
                    <div className="bg-school-secondary p-6 md:p-8 rounded-[2rem] shadow-xl shadow-indigo-100 rounded-bl-sm text-white relative overflow-hidden group animate-in slide-in-from-bottom-4">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-16 h-16 transform -rotate-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                        </div>
                        <div className="relative z-10 max-w-full overflow-x-auto overflow-y-hidden pb-1 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-transparent">
                            <h4 className="text-xs font-black text-indigo-300 uppercase mb-4 tracking-widest">Instructor Feedback</h4>
                            <div className="text-lg md:text-2xl font-bold leading-relaxed italic">
                                <MathText text={assignment.mySubmission.teacher_feedback} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Assignment Workspace */}
                <div className="space-y-6">
                    {blocks.map((block) => {
                        const submittedAnswerData = assignment.mySubmission?.student_answers?.find(a => a.blockId === block.id);
                        const displayAnswer = submittedAnswerData ? submittedAnswerData.answer : null;

                        return (
                            <div key={block.id} className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-school-primary/30 hover:shadow-md transition-all p-6 md:p-8">

                                {block.type.includes('info') && (
                                    <div className="max-w-2xl">
                                        <h3 className="text-2xl font-black text-gray-900 leading-snug tracking-tight mb-4"><MathText text={block.title} /></h3>
                                        <div className="text-gray-600 font-medium leading-relaxed"><MathText text={block.description} /></div>
                                    </div>
                                )}

                                {block.type === 'image_info' && (block.url || block.image_url) && (
                                    <div className="my-8 rounded-2xl overflow-hidden shadow-sm shadow-gray-200 border border-gray-100 bg-gray-50 flex items-center justify-center p-4">
                                        <img src={block.image_url || block.url} alt="Assessment Diagram" className="w-auto h-auto max-h-96 object-contain rounded" />
                                    </div>
                                )}

                                {block.type === 'video_info' && block.url && (
                                    <div className="relative w-full overflow-hidden rounded-2xl shadow-xl shadow-gray-200 border border-gray-100 my-8 bg-black" style={{ paddingTop: '56.25%' }}>
                                        {block.url.includes('youtube.com') || block.url.includes('youtu.be') ? (
                                            <iframe className="absolute top-0 left-0 w-full h-full" src={`https://www.youtube.com/embed/${block.url.split('v=')[1]?.split('&')[0] || block.url.split('youtu.be/')[1]}`} title="Video" frameBorder="0" allowFullScreen></iframe>
                                        ) : (
                                            <video controls className="absolute top-0 left-0 w-full h-full"><source src={block.url} />Not supported.</video>
                                        )}
                                    </div>
                                )}

                                {/* --- Question Blocks --- */}
                                {!block.type.includes('info') && (
                                    <div>
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 md:mb-8">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg md:text-xl font-black text-gray-900 leading-snug tracking-tight break-words">
                                                    <MathText text={block.title || block.question} />
                                                    {block.required && <span className="text-school-primary ml-1 text-xl md:text-2xl">*</span>}
                                                </h4>
                                                {block.description && <div className="text-[13px] md:text-sm font-semibold text-gray-400 mt-2 leading-relaxed whitespace-pre-wrap"><MathText text={block.description} /></div>}
                                            </div>
                                            <div className="shrink-0">
                                                <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-black text-school-primary bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">{block.points} pts</span>
                                            </div>
                                        </div>

                                        {/* Unified General Image Output rendering if block has image_url attach */}
                                        {block.image_url && (
                                            <div className="mb-8 rounded-2xl overflow-hidden shadow-sm shadow-gray-200/40 border border-gray-100 bg-gray-50/50 p-4 w-fit max-w-full inline-block">
                                                <img src={block.image_url} alt="Attached Diagram" className="max-h-72 object-contain rounded-xl w-auto" />
                                            </div>
                                        )}

                                        {/* SHORT ANSWER */}
                                        {block.type === 'short_answer' && (
                                            !isGraded ? (
                                                <input
                                                    type="text" className="w-full md:w-3/4 p-5 bg-gray-50/80 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-school-primary/10 focus:border-school-primary font-bold text-gray-800 transition-all shadow-inner text-lg"
                                                    placeholder="Type your short answer here..."
                                                    value={studentAnswers[block.id] || ''}
                                                    onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                                                />
                                            ) : (
                                                <div className={`p-5 w-full md:w-3/4 border-2 rounded-2xl font-bold uppercase tracking-tight text-lg shadow-inner flex justify-between items-center ${block.correctAnswer ? (String(block.correctAnswer).trim().toLowerCase() === String(displayAnswer || '').trim().toLowerCase() ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700' : 'bg-red-50/50 border-red-200 text-red-700') : 'bg-indigo-50/30 border-indigo-100 text-school-secondary'}`}>
                                                    <span>{displayAnswer || <span className="italic opacity-30 text-gray-400">No answer submitted</span>}</span>
                                                    {block.correctAnswer && String(block.correctAnswer).trim().toLowerCase() === String(displayAnswer || '').trim().toLowerCase() && <span className="text-emerald-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></span>}
                                                    {block.correctAnswer && String(block.correctAnswer).trim().toLowerCase() !== String(displayAnswer || '').trim().toLowerCase() && <span className="text-red-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></span>}
                                                </div>
                                            )
                                        )}

                                        {/* LONG ANSWER */}
                                        {block.type === 'paragraph' && (
                                            !isGraded ? (
                                                <textarea
                                                    rows="5" className="w-full p-6 bg-gray-50/80 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-school-primary/10 focus:border-school-primary font-bold text-gray-800 transition-all shadow-inner text-lg leading-relaxed"
                                                    placeholder="Write your detailed answer here..."
                                                    value={studentAnswers[block.id] || ''}
                                                    onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                                                ></textarea>
                                            ) : (
                                                <div className="p-6 bg-indigo-50/30 border border-indigo-100 rounded-2xl whitespace-pre-wrap font-bold text-school-secondary leading-relaxed text-lg shadow-inner">{displayAnswer || <span className="italic opacity-30 text-gray-400">No answer submitted</span>}</div>
                                            )
                                        )}

                                        {/* MULTIPLE CHOICE */}
                                        {block.type === 'multiple_choice' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {block.options.map((opt, i) => {
                                                    let isChecked = !isGraded ? studentAnswers[block.id] === opt : displayAnswer === opt;
                                                    let isCorrectOption = isGraded ? block.correctAnswer === opt : false;
                                                    let optClass = 'bg-white border-gray-100 shadow-sm';
                                                    let dotColor = 'bg-school-primary';
                                                    let checkColorClass = 'border-gray-200';
                                                    let textColor = 'text-gray-700';

                                                    if (!isGraded) {
                                                        if (isChecked) {
                                                            optClass = 'bg-school-primary/5 border-school-primary shadow-sm shadow-red-50';
                                                            checkColorClass = 'border-school-primary';
                                                            textColor = 'text-school-primary';
                                                        } else {
                                                            optClass = 'bg-white border-gray-100 hover:border-school-primary/30 shadow-sm';
                                                        }
                                                    } else {
                                                        if (isChecked && isCorrectOption) {
                                                            optClass = 'bg-emerald-50 border-emerald-400 shadow-sm shadow-emerald-50';
                                                            checkColorClass = 'border-emerald-500';
                                                            dotColor = 'bg-emerald-500';
                                                            textColor = 'text-emerald-700';
                                                        } else if (isChecked && !isCorrectOption) {
                                                            optClass = 'bg-red-50 border-red-400 shadow-sm shadow-red-50';
                                                            checkColorClass = 'border-red-500';
                                                            dotColor = 'bg-red-500';
                                                            textColor = 'text-red-700';
                                                        } else if (!isChecked && isCorrectOption) {
                                                            optClass = 'bg-white border-emerald-300 border-dashed';
                                                            checkColorClass = 'border-emerald-300';
                                                            textColor = 'text-emerald-700';
                                                        } else {
                                                            optClass = 'bg-gray-50/50 border-gray-100 opacity-60';
                                                        }
                                                    }

                                                    return (
                                                        <label key={i} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${!isGraded ? 'cursor-pointer' : 'cursor-default'} ${optClass}`}>
                                                            <input
                                                                type="radio"
                                                                name={`block-${block.id}`}
                                                                className="hidden"
                                                                checked={isChecked}
                                                                onChange={() => !isGraded && handleAnswerChange(block.id, opt)}
                                                                disabled={isGraded}
                                                            />
                                                            <div className={`w-7 h-7 rounded-full border-4 flex items-center justify-center shrink-0 transition-colors ${checkColorClass}`}>
                                                                {isChecked && <div className={`w-3 h-3 rounded-full ${dotColor}`}></div>}
                                                            </div>
                                                            <span className={`font-bold text-[15px] ${textColor}`}><MathText text={opt} /></span>
                                                            {isGraded && isChecked && isCorrectOption && <span className="ml-auto text-emerald-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></span>}
                                                            {isGraded && isChecked && !isCorrectOption && <span className="ml-auto text-red-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></span>}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* CHECKBOXES */}
                                        {block.type === 'checkboxes' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {block.options.map((opt, i) => {
                                                    const isChecked = !isGraded
                                                        ? (Array.isArray(studentAnswers[block.id]) && studentAnswers[block.id].includes(opt))
                                                        : (Array.isArray(displayAnswer) && displayAnswer.includes(opt));

                                                    let isCorrectOption = isGraded && Array.isArray(block.correctAnswer) ? block.correctAnswer.includes(opt) : false;
                                                    let optClass = 'bg-white border-gray-100 shadow-sm';
                                                    let dotColor = 'bg-school-secondary';
                                                    let checkColorClass = 'border-gray-200';
                                                    let textColor = 'text-gray-700';

                                                    if (!isGraded) {
                                                        if (isChecked) {
                                                            optClass = 'bg-school-secondary/5 border-school-secondary shadow-sm shadow-indigo-50';
                                                            checkColorClass = 'border-school-secondary bg-school-secondary';
                                                            textColor = 'text-school-secondary';
                                                        } else {
                                                            optClass = 'bg-white border-gray-100 hover:border-school-secondary/30 shadow-sm';
                                                        }
                                                    } else {
                                                        if (isChecked && isCorrectOption) {
                                                            optClass = 'bg-emerald-50 border-emerald-400 shadow-sm shadow-emerald-50';
                                                            checkColorClass = 'border-emerald-500 bg-emerald-500';
                                                            textColor = 'text-emerald-700';
                                                        } else if (isChecked && !isCorrectOption) {
                                                            optClass = 'bg-red-50 border-red-400 shadow-sm shadow-red-50';
                                                            checkColorClass = 'border-red-500 bg-red-500';
                                                            textColor = 'text-red-700';
                                                        } else if (!isChecked && isCorrectOption) {
                                                            optClass = 'bg-white border-emerald-300 border-dashed';
                                                            checkColorClass = 'border-emerald-300';
                                                            textColor = 'text-emerald-700';
                                                        } else {
                                                            optClass = 'bg-gray-50/50 border-gray-100 opacity-60';
                                                        }
                                                    }

                                                    return (
                                                        <label key={i} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${!isGraded ? 'cursor-pointer' : 'cursor-default'} ${optClass}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isChecked}
                                                                onChange={() => !isGraded && handleCheckboxChange(block.id, opt)}
                                                                disabled={isGraded}
                                                            />
                                                            <div className={`w-7 h-7 rounded-xl border-4 flex items-center justify-center shrink-0 transition-colors ${checkColorClass}`}>
                                                                {isChecked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                            </div>
                                                            <span className={`font-bold text-[15px] ${textColor}`}><MathText text={opt} /></span>
                                                            {isGraded && isChecked && isCorrectOption && <span className="ml-auto text-emerald-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></span>}
                                                            {isGraded && isChecked && !isCorrectOption && <span className="ml-auto text-red-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></span>}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* FILE UPLOAD */}
                                        {block.type === 'file_upload' && (
                                            !isGraded ? (
                                                <div className="flex flex-col gap-3">
                                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">File Link (Google Drive, Dropbox, etc.)</label>
                                                    <input
                                                        type="url" className="w-full p-5 bg-gray-50/80 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-school-primary/10 focus:border-school-primary font-bold text-gray-800 transition-all shadow-inner text-lg"
                                                        placeholder="Paste public link to your file..."
                                                        value={studentAnswers[block.id] || ''}
                                                        onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Attached File Link</span>
                                                    <div className="p-4 bg-gray-50/80 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
                                                        {displayAnswer ? (
                                                            <a href={displayAnswer} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2 px-6 bg-school-secondary text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-indigo-700 hover:-translate-y-0.5 shadow-md transition-all">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                                Open File Link
                                                            </a>
                                                        ) : <span className="block py-4 font-black italic text-gray-400 text-sm">No file successfully attached</span>}
                                                    </div>
                                                </div>
                                            )
                                        )}

                                        {/* RESPONSE EXPLANATION AND PROPER RESPONSE RENDERER */}
                                        {isGraded && (block.correctAnswer || block.explanation) && (
                                            <div className="mt-8 border border-emerald-100 bg-emerald-50/50 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
                                                {(block.correctAnswer && (block.type === 'short_answer' || block.type === 'multiple_choice' || block.type === 'checkboxes')) && (
                                                    <div className="p-5 border-b border-emerald-100/50 flex items-start gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-200">
                                                        <div className="bg-emerald-100/80 text-emerald-600 p-2 rounded-xl shrink-0 mt-0.5 shadow-sm">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block mb-1">Correct Answer</span>
                                                            <span className="text-[15px] font-bold text-gray-800">
                                                                <MathText text={Array.isArray(block.correctAnswer) ? block.correctAnswer.join(', ') : block.correctAnswer} />
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {block.explanation && (
                                                    <div className="p-5 flex items-start gap-4 bg-blue-50/30 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200">
                                                        <div className="bg-blue-100/80 text-blue-600 p-2 rounded-xl shrink-0 mt-0.5 shadow-sm">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest block mb-1">Reasoning / Feedback</span>
                                                            <div className="text-[14px] font-semibold text-gray-700 leading-relaxed">
                                                                <MathText text={block.explanation} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Finalization Node */}
                {assignment.status === 'pending' && (
                    <div className="flex justify-center pt-8 pb-16">
                        <Button
                            className="bg-school-primary hover:bg-red-600 text-white font-black uppercase text-sm tracking-widest px-10 py-6 rounded-full shadow-xl shadow-red-200 transition-all hover:-translate-y-1 active:translate-y-0"
                            onClick={handleHandInWork}
                            isLoading={isSubmitting}
                        >
                            Submit Assessment
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
