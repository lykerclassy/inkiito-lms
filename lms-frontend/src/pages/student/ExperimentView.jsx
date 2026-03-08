import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function ExperimentView() {
    const location = useLocation();
    const navigate = useNavigate();
    const experiment = location.state?.experiment;
    const lab = location.state?.lab;

    const [checkedAnswers, setCheckedAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);

    // Coordinator Interaction State
    const [showAskModal, setShowAskModal] = useState(false);
    const [question, setQuestion] = useState('');
    const [isSubmittingAsk, setIsSubmittingAsk] = useState(false);

    if (!experiment || !lab) {
        return (
            <div className="max-w-4xl mx-auto p-5 bg-gray-50 text-gray-400 font-semibold rounded-xl border border-gray-100 mt-20 text-center animate-in fade-in duration-700">
                <p>Session expired. Please go back and select an experiment.</p>
                <Button onClick={() => navigate('/student/science-lab')} className="mt-8 bg-school-primary px-5 py-4">Back to Science Lab</Button>
            </div>
        );
    }

    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeId(experiment.youtube_url);

    // Knowledge Check state handling
    const knowledgeCheck = typeof experiment.knowledge_check === 'string' ? JSON.parse(experiment.knowledge_check || '[]') : (experiment.knowledge_check || []);

    const handleAnswerSelect = (qIdx, optIdx) => {
        if (showResults) return;
        setCheckedAnswers({ ...checkedAnswers, [qIdx]: optIdx });
    };

    const submitKnowledgeCheck = () => {
        setShowResults(true);
    };

    const handleAskCoordinator = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;
        setIsSubmittingAsk(true);
        try {
            await api.post(`/science-labs/${lab.db_id}/ask`, { question });
            setQuestion('');
            setShowAskModal(false);
        } catch (err) {
            console.error('Failed to submit question', err);
        } finally {
            setIsSubmittingAsk(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-32 px-6 mt-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* Professional Empirical Header */}
            <div className="relative group">
                <div className="absolute top-0 left-0 w-64 h-64 bg-school-primary/5 rounded-full blur-[100px] -ml-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-4">
                    <div className="space-y-6">
                        <button
                            onClick={() => navigate('/student/science-lab')}
                            className="text-xs font-semibold text-gray-400 hover:text-school-primary flex items-center gap-4 uppercase group/back bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm shadow-gray-50 transition-all"
                        >
                            <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover/back:bg-school-primary group-hover/back:text-white transition-all transform group-hover/back:-translate-x-1">&larr;</span>
                            BACK TO SCIENCE LAB
                        </button>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-school-primary border border-gray-100 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                                {lab.icon || <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-school-primary/10 text-school-primary text-[10px] font-medium uppercase rounded-lg">{lab.name} Lab Facility</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] font-medium text-gray-400">Status: Active</span>
                                </div>
                                <h1 className="text-2xl md:text-2xl font-bold text-gray-900 leading-none uppercase">{experiment.title}</h1>
                                <div className="flex items-center gap-6 mt-6">
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" /></svg>
                                        <span className="text-xs font-semibold text-gray-500">{experiment.duration} SESSION</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        <span className="text-xs font-semibold text-gray-500">{experiment.level} LEVEL</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {lab.coordinator_id && (
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => setShowAskModal(true)}
                                className="px-4 py-5 bg-school-secondary text-white rounded-lg font-semibold uppercase text-[10px] flex items-center gap-4 shadow-sm shadow-indigo-200 hover:-translate-y-2 hover:scale-105 transition-all duration-500 active:scale-95 group/req"
                            >
                                <svg className="w-6 h-6 group-hover/req:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ASK TEACHER
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Empirical Data Stream (Video) Page Architecture */}
            <div className="group/video relative">
                <div className="absolute inset-0 bg-school-primary/5 rounded-2xl blur-3xl opacity-0 group-hover/video:opacity-100 transition-opacity duration-1000"></div>
                <div className="aspect-video bg-gray-950 rounded-2xl overflow-hidden shadow-sm shadow-black/40 relative ring-8 ring-white group-hover/video:ring-school-primary/10 transition-all duration-700">
                    <div className="absolute top-4 left-8 z-20 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-white/50">EXPERIMENT VIDEO: LIVE</span>
                    </div>
                    {videoId ? (
                        <iframe
                            className="w-full h-full border-none"
                            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&autoplay=0`}
                            title="Experiment Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 gap-6">
                            <div className="p-4 rounded-full bg-white/5 text-white/20">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </div>
                            <p className="font-black text-white/40 text-sm">No video available for this experiment.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-6">
                    {/* FACILITY PROTOCOL (Requirements) */}
                    {experiment.requirements && (
                        <div className="space-y-4 animate-in slide-in-from-left-8 duration-700">
                            <div className="flex items-center gap-4">
                                <span className="w-12 h-1 bg-school-primary rounded-full"></span>
                                <h3 className="text-base font-bold text-gray-900">Requirements</h3>
                            </div>
                            <Card className="p-5 bg-white border-none shadow-sm rounded-2xl border border-gray-100 relative overflow-hidden group/protocol">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 group-hover/protocol:bg-red-50 transition-colors -mr-16 -mt-16 rounded-full blur-3xl"></div>
                                <div className="relative z-10 flex gap-4">
                                    <div className="w-9 h-9 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                                        <svg className="w-8 h-8 text-school-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    </div>
                                    <p className="text-gray-600 font-bold leading-loose text-sm tracking-wide">{experiment.requirements}</p>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* EMPIRICAL PROCEDURE */}
                    {experiment.steps && experiment.steps.length > 0 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <span className="w-12 h-1 bg-school-secondary rounded-full"></span>
                                <h3 className="text-base font-bold text-gray-900">Procedure</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {experiment.steps.map((step, idx) => (
                                    <Card key={idx} className="p-4 bg-white border-none shadow-sm shadow-gray-100/50 rounded-xl flex gap-6 border border-gray-100 group/step hover:-translate-y-2 transition-all duration-500">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-school-secondary flex items-center justify-center font-semibold text-xl shrink-0 shadow-lg shadow-indigo-100 group-hover/step:rotate-12 transition-transform">{idx + 1}</div>
                                        <p className="text-xs font-bold text-gray-500 leading-relaxed tracking-tight group-hover:text-gray-900 transition-colors">{step.instruction}</p>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RESULTS ARCHITECTURE */}
                    {(experiment.observations || experiment.explanations || experiment.conclusion) && (
                        <div className="space-y-5 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="w-12 h-1 bg-school-accent rounded-full"></span>
                                <h3 className="text-base font-bold text-gray-900">Results</h3>
                            </div>

                            <div className="space-y-5">
                                {experiment.observations && (
                                    <div className="space-y-4">
                                        <label className="text-xs font-semibold text-gray-500 text-amber-600 ml-6">Observations</label>
                                        <div className="bg-white p-4 rounded-xl shadow-sm shadow-amber-100/20 border-l-8 border-school-accent text-gray-600 font-bold leading-relaxed text-sm">
                                            {experiment.observations}
                                        </div>
                                    </div>
                                )}
                                {experiment.explanations && (
                                    <div className="space-y-4">
                                        <label className="text-xs font-semibold text-gray-500 text-emerald-600 ml-6">Explanation</label>
                                        <div className="bg-white p-4 rounded-xl shadow-sm shadow-emerald-100/20 border-l-8 border-emerald-500 text-gray-600 font-bold leading-relaxed text-sm">
                                            {experiment.explanations}
                                        </div>
                                    </div>
                                )}
                                {experiment.conclusion && (
                                    <div className="space-y-4">
                                        <label className="text-xs font-semibold text-gray-500 text-indigo-600 ml-6">Conclusion</label>
                                        <div className="bg-indigo-900 p-5 rounded-xl shadow-sm shadow-indigo-200 text-white font-semibold uppercase tracking-tight text-xl leading-snug relative overflow-hidden group/conclusion">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                            <div className="relative z-10">{experiment.conclusion}</div>
                                            <svg className="absolute bottom-8 right-8 w-9 h-9 text-white/10 group-hover/conclusion:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* SIDEBAR TOOLS */}
                <div className="space-y-5">
                    {/* KNOWLEDGE VERIFICATION NODE */}
                    {knowledgeCheck && knowledgeCheck.length > 0 && (
                        <div className="space-y-5 sticky top-4">
                            <Card className="p-5 border-none shadow-sm shadow-gray-200/50 bg-white rounded-2xl border border-gray-100 relative overflow-hidden group/quiz">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-school-secondary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-12">
                                        <div className="w-14 h-14 rounded-2xl bg-school-secondary text-white flex items-center justify-center shadow-sm group-hover/quiz:rotate-12 group-hover/quiz:scale-110 transition-all duration-500">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <h3 className="text-[11px] font-semibold text-school-secondary leading-tight">Knowledge Check</h3>
                                    </div>

                                    <div className="space-y-6">
                                        {knowledgeCheck.map((kc, idx) => (
                                            <div key={idx} className="space-y-4">
                                                <div className="flex gap-4">
                                                    <span className="text-lg font-bold text-school-secondary">0{idx + 1}</span>
                                                    <h4 className="text-sm font-semibold text-gray-900 leading-tight mt-1">
                                                        {kc.question}
                                                    </h4>
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {kc.options.map((opt, oIdx) => {
                                                        const isSelected = checkedAnswers[idx] === oIdx;
                                                        const isCorrect = kc.correct_index === oIdx;

                                                        let btnClasses = "w-full p-4 rounded-xl text-left transition-all duration-500 font-semibold uppercase text-xs border-2 flex justify-between items-center group/btn ";
                                                        if (!showResults) {
                                                            btnClasses += isSelected ? "border-school-secondary bg-school-secondary text-white shadow-sm shadow-indigo-200 scale-105" : "border-gray-50 bg-gray-50 text-gray-500 hover:border-school-secondary/30 hover:bg-white hover:shadow-sm";
                                                        } else {
                                                            if (isCorrect) {
                                                                btnClasses += "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-50 scale-105";
                                                            } else if (isSelected && !isCorrect) {
                                                                btnClasses += "border-school-primary bg-red-50 text-school-primary shadow-sm shadow-red-50";
                                                            } else {
                                                                btnClasses += "border-gray-50 bg-gray-50/50 text-gray-300 opacity-40 cursor-not-allowed";
                                                            }
                                                        }

                                                        return (
                                                            <button
                                                                key={oIdx}
                                                                disabled={showResults}
                                                                onClick={() => handleAnswerSelect(idx, oIdx)}
                                                                className={btnClasses}
                                                            >
                                                                <span className="flex-1 pr-4">{opt}</span>
                                                                <div className="shrink-0">
                                                                    {showResults && isCorrect && (
                                                                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-in zoom-in">
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                                        </div>
                                                                    )}
                                                                    {showResults && isSelected && !isCorrect && (
                                                                        <div className="w-8 h-8 rounded-full bg-school-primary text-white flex items-center justify-center animate-in zoom-in">
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                        </div>
                                                                    )}
                                                                    {!showResults && (
                                                                        <div className={`w-6 h-6 rounded-full border-2 transition-all ${isSelected ? 'border-white bg-white/20' : 'border-current opacity-20 group-hover/btn:opacity-100'}`}></div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {showResults && kc.explanation && (
                                                    <div className={`p-4 rounded-xl text-xs font-semibold text-gray-500 animate-in slide-in-from-top-4 duration-500 ${checkedAnswers[idx] === kc.correct_index ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-school-primary'}`}>
                                                        Feedback: {kc.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {!showResults ? (
                                        <Button
                                            onClick={submitKnowledgeCheck}
                                            className="w-full mt-16 py-4 bg-school-secondary text-white font-semibold uppercase text-[11px] rounded-xl shadow-sm shadow-indigo-300 hover:-translate-y-2 hover:scale-105 active:scale-95 transition-all duration-500"
                                            disabled={Object.keys(checkedAnswers).length < knowledgeCheck.length}
                                        >
                                            SUBMIT ANSWERS
                                        </Button>
                                    ) : (
                                        <div className="mt-16 text-center space-y-4 animate-in zoom-in duration-500">
                                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-sm shadow-emerald-200 ring-8 ring-emerald-50">
                                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <p className="text-base font-bold text-gray-900">Completed!</p>
                                            <Button
                                                onClick={() => navigate('/student/science-lab')}
                                                className="w-full py-6 bg-gray-900 text-white font-semibold uppercase text-[10px] rounded-2xl hover:bg-black transition-all"
                                            >
                                                FINISH & RETURN
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Coordinator Request Modal */}
            {showAskModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-950/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500 border border-white/20">
                        <div className="bg-school-accent p-5 text-gray-900 relative">
                            <button
                                onClick={() => setShowAskModal(false)}
                                className="absolute top-4 right-10 w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center hover:bg-black/20 hover:rotate-90 transition-all duration-500"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/40 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 shadow-sm ">
                                    <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold uppercase leading-none">Ask a Question</h3>
                                    <p className="text-gray-900/50 text-xs font-semibold text-gray-500">Send your question to the teacher</p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleAskCoordinator} className="p-5 space-y-5">
                            <div className="space-y-4">
                                <label className="text-xs font-semibold text-gray-500 text-gray-400">Your Question</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-school-accent outline-none font-bold resize-none min-h-[200px] text-gray-800 uppercase tracking-tight text-sm shadow-inner"
                                    placeholder="Type your question about this experiment..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSubmittingAsk}
                                    className="w-full sm:w-auto bg-school-primary hover:bg-red-600 shadow-sm px-20 py-6 text-[11px] font-semibold rounded-xl transition-all hover:-translate-y-2 hover:scale-105 active:scale-95"
                                >
                                    {isSubmittingAsk ? 'SENDING...' : 'SEND QUESTION'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
