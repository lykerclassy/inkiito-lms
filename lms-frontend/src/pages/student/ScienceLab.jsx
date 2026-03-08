import React, { useState, useContext, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { AuthContext } from '../../contexts/AuthContext';
import { CardSkeleton } from '../../components/common/Skeleton';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function ScienceLab() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [scienceLabs, setScienceLabs] = useState([]);
    const [selectedLab, setSelectedLab] = useState(null);
    const [curriculum, setCurriculum] = useState('8-4-4');
    const [loading, setLoading] = useState(true);

    const [showAskModal, setShowAskModal] = useState(false);
    const [coordinatorTab, setCoordinatorTab] = useState('ask');
    const [question, setQuestion] = useState('');
    const [isSubmittingAsk, setIsSubmittingAsk] = useState(false);
    const [myQuestions, setMyQuestions] = useState([]);

    useEffect(() => {
        fetchLabs();
        fetchMyQuestions();
        if (user?.curriculum?.name) {
            setCurriculum(user.curriculum.name);
        }
    }, [user]);

    const fetchMyQuestions = async () => {
        try {
            const res = await api.get('/lab-questions');
            setMyQuestions(res.data);
        } catch (err) {
            console.error("Failed to fetch lab questions", err);
        }
    };

    const fetchLabs = async () => {
        try {
            const res = await api.get('/science-labs');
            const mappedLabs = res.data.map(lab => ({
                ...lab,
                db_id: lab.id,
                id: lab.slug,
                icon: (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                ),
                experiments: (lab.experiments || []).reduce((acc, exp) => {
                    const cName = exp.curriculum?.name || 'Any';
                    if (!acc[cName]) acc[cName] = [];
                    acc[cName].push({ ...exp, id: exp.slug });
                    return acc;
                }, {})
            }));
            setScienceLabs(mappedLabs);
        } catch (err) {
            console.error("Failed to fetch science labs", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLaunchSimulation = (exp) => {
        const safeLab = { ...selectedLab };
        delete safeLab.icon;
        navigate(`/student/science-lab/${exp.slug}`, { state: { experiment: exp, lab: safeLab } });
    };

    const handleAskCoordinator = async (e) => {
        e.preventDefault();
        if (!question.trim() || !selectedLab) return;
        setIsSubmittingAsk(true);
        try {
            await api.post(`/science-labs/${selectedLab.db_id}/ask`, { question });
            setQuestion('');
            setCoordinatorTab('history');
            fetchMyQuestions();
        } catch (err) {
            console.error('Failed to submit question', err);
        } finally {
            setIsSubmittingAsk(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-5">
                <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => <CardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-5 pb-24 animate-in fade-in duration-300">
            {/* Premium Header Section */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-school-primary/5 rounded-full blur-3xl group-hover:bg-school-primary/10 transition-all duration-1000"></div>

                <div className="flex flex-col md:flex-row items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-school-primary rounded-xl flex items-center justify-center text-white shadow-sm transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 italic uppercase leading-none">Science Lab</h1>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="flex items-center gap-2 text-xs font-semibold text-school-primary bg-red-50 px-4 py-1.5 rounded-xl border border-red-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-school-primary animate-pulse" />
                                {curriculum} Curriculum Active
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex bg-gray-50 p-2.5 rounded-xl self-start lg:self-center border border-gray-100">
                    {['8-4-4', 'CBC'].map(c => (
                        <button
                            key={c}
                            onClick={() => setCurriculum(c)}
                            className={`px-4 py-4 rounded-lg text-xs font-semibold transition-all duration-500 italic ${curriculum === c ? 'bg-white text-school-primary shadow-sm shadow-red-50 border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </header>

            {!selectedLab ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {scienceLabs.map(lab => (
                        <Card
                            key={lab.id}
                            className={`p-5 hover:scale-[1.02] active:scale-95 transition-all duration-500 cursor-pointer relative overflow-hidden group border-none shadow-sm rounded-2xl bg-white border border-gray-100`}
                            onClick={() => setSelectedLab(lab)}
                        >
                            <div className="absolute top-4 right-10 flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                                <span className="text-[10px] font-medium text-gray-300 uppercase italic">Online</span>
                            </div>

                            <div className={`w-12 h-12 rounded-xl bg-gray-50 text-school-primary flex items-center justify-center mb-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-sm shadow-gray-100/50 border border-gray-100`}>
                                {lab.icon}
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 leading-none group-hover:text-school-primary transition-colors">
                                    {lab.name}
                                </h2>
                                <p className="text-gray-400 font-bold leading-relaxed italic uppercase text-xs tracking-wide">
                                    {lab.description}
                                </p>
                                <div className="flex items-center justify-between pt-10 border-t border-gray-50 mt-4">
                                    <span className={`text-school-primary font-black text-[10px] uppercase italic flex items-center gap-3 group-hover:translate-x-2 transition-transform`}>
                                        OPEN LAB <span className="text-lg">&rarr;</span>
                                    </span>
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-4 border-white bg-gray-50 flex items-center justify-center shadow-sm">
                                                <div className={`w-2 h-2 rounded-full bg-school-primary opacity-40`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-school-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                        <div className="space-y-4">
                            <button
                                onClick={() => setSelectedLab(null)}
                                className="text-xs font-semibold text-gray-400 hover:text-school-primary flex items-center gap-4 uppercase group italic bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 transition-all"
                            >
                                <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> BACK TO LABS
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900 uppercase leading-none">{selectedLab.name}</h2>
                        </div>
                        <div className={`w-full lg:w-auto p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex justify-between lg:flex-col items-center lg:items-start gap-3`}>
                            <p className={`text-[10px] font-medium text-school-primary uppercase italic`}>EXPERIMENTS</p>
                            <p className="text-base font-bold text-gray-900">{selectedLab.experiments[curriculum]?.length || 0} SIMULATIONS</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(selectedLab.experiments[curriculum] || []).map(exp => (
                                <Card key={exp.id} className="group relative border-none shadow-sm rounded-2xl bg-white p-4 flex flex-col justify-between border border-gray-100 hover:ring-school-primary/20 transition-all duration-500 overflow-hidden">
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <span className="px-5 py-2 bg-gray-900 text-white text-[10px] font-medium uppercase rounded-xl italic">{exp.level} LEVEL</span>
                                            <span className="text-xs font-semibold text-gray-300 italic">{exp.duration}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 italic group-hover:text-school-primary transition-colors leading-none">{exp.title}</h3>
                                        <div className="space-y-4 pt-6 border-t border-gray-50">
                                            {(exp.steps || []).slice(0, 3).map((s, i) => (
                                                <div key={i} className="flex gap-4 items-center">
                                                    <span className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-semibold text-gray-400 italic shadow-sm border border-gray-100">{i + 1}</span>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tight italic truncate">{s.instruction}</span>
                                                </div>
                                            ))}
                                            {exp.steps?.length > 3 && (
                                                <p className="text-xs font-semibold text-school-primary ml-10 italic">+ {exp.steps.length - 3} MORE STEPS</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full mt-10 py-6 text-xs font-semibold text-gray-500 italic rounded-2xl shadow-sm shadow-red-100 transition-all hover:-translate-y-1 active:translate-y-0"
                                        onClick={() => handleLaunchSimulation(exp)}
                                    >
                                        START EXPERIMENT
                                    </Button>
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-12 h-12 bg-school-primary/5 rounded-full blur-3xl group-hover:bg-school-primary/10 transition-all duration-1000"></div>
                                </Card>
                            ))}

                            {(selectedLab.experiments[curriculum] || []).length === 0 && (
                                <div className="col-span-full py-32 bg-gray-50/50 rounded-2xl border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-200 shadow-sm shadow-gray-100">
                                        <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-bold text-gray-300">No Experiments Available</h3>
                                        <p className="text-gray-400 font-bold text-xs max-w-sm mx-auto opacity-80 leading-relaxed">No {curriculum} experiments have been added yet.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-5">
                            <Card className="p-4 border-none shadow-sm bg-gray-900 text-white relative overflow-hidden rounded-2xl group">
                                <div className="relative z-10 space-y-4">
                                    <h3 className="text-lg font-bold leading-none text-school-accent">Safety Protocols</h3>
                                    <ul className="space-y-4">
                                        {[
                                            { id: 1, text: "Wear proper protective gear (Lab Coat & Goggles) before starting any virtual reaction.", color: "bg-school-primary" },
                                            { id: 2, text: "Read all experiment instructions carefully to ensure the safety of your virtual equipment.", color: "bg-school-secondary" },
                                            { id: 3, text: "Do not consume any virtual substances—keep your learning space strictly professional!", color: "bg-school-accent" }
                                        ].map(item => (
                                            <li key={item.id} className="flex items-start gap-6 group/item">
                                                <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center shrink-0 font-black text-xs italic shadow-lg shadow-black/20 group-hover/item:scale-110 transition-transform`}>{item.id}</div>
                                                <p className="text-[11px] font-bold text-gray-400 uppercase leading-loose italic tracking-wide group-hover/item:text-white transition-colors">{item.text}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 rotate-12">
                                    <svg className="w-80 h-80" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                                </div>
                            </Card>

                            {selectedLab.coordinator_id && selectedLab.coordinator && (
                                <Card className="p-4 rounded-2xl border-none shadow-sm bg-school-secondary text-white relative overflow-hidden group/coord">
                                    <h3 className="text-xs font-semibold text-gray-500 mb-8 italic opacity-60">Lab Teacher</h3>
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl overflow-hidden ring-4 ring-white/5 flex items-center justify-center font-black text-3xl italic uppercase shadow-sm transform group-hover/coord:rotate-6 transition-all duration-500">
                                            {selectedLab.coordinator.name.substring(0, 2)}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-black text-xl leading-none">{selectedLab.coordinator.name}</p>
                                            <p className="text-[9px] text-indigo-200 font-bold uppercase italic">Department Head</p>
                                        </div>
                                    </div>
                                    <div className="mt-10 pt-10 border-t border-white/10 relative z-10">
                                        <button
                                            onClick={() => {
                                                setCoordinatorTab('ask');
                                                setShowAskModal(true);
                                            }}
                                            className="w-full py-5 bg-white text-school-secondary rounded-xl font-semibold uppercase text-[10px] hover:scale-105 transition-all shadow-sm italic"
                                        >
                                            ASK TEACHER
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl opacity-0 group-hover/coord:opacity-100 transition-opacity duration-1000"></div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Coordinator Hub Modal - Premium Design */}
            {showAskModal && selectedLab && (() => {
                const labQuestions = myQuestions.filter(q => q.science_lab_id === selectedLab.db_id);
                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-xl animate-in fade-in duration-500">
                        <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-500 border border-white/20 flex flex-col max-h-[90vh]">
                            <div className="bg-school-accent p-5 text-gray-900 relative shrink-0">
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
                                        <h3 className="text-xl font-bold uppercase leading-none">{selectedLab.coordinator?.name}</h3>
                                        <p className="text-gray-900/60 text-xs font-semibold text-gray-500 italic">Ask a question about this lab</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex bg-gray-50 border-b border-gray-100 shrink-0 p-2">
                                <button
                                    onClick={() => setCoordinatorTab('ask')}
                                    className={`flex-1 py-5 rounded-3xl font-black uppercase text-[10px] transition-all duration-500 italic ${coordinatorTab === 'ask' ? 'bg-white text-school-primary shadow-sm shadow-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    ASK A QUESTION
                                </button>
                                <button
                                    onClick={() => setCoordinatorTab('history')}
                                    className={`flex-1 py-5 rounded-3xl font-black uppercase text-[10px] transition-all duration-500 italic ${coordinatorTab === 'history' ? 'bg-white text-school-primary shadow-sm shadow-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    MY QUESTIONS ({labQuestions.length})
                                </button>
                            </div>

                            <div className="overflow-y-auto p-5 bg-white min-h-[400px] custom-scrollbar">
                                {coordinatorTab === 'ask' ? (
                                    <form onSubmit={handleAskCoordinator} className="space-y-5">
                                        <div className="space-y-4">
                                            <label className="text-xs font-semibold text-gray-500 text-gray-400 italic">Your Question</label>
                                            <textarea
                                                className="w-full p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-school-accent outline-none font-bold italic resize-none min-h-[160px] text-gray-800 uppercase tracking-tight text-sm shadow-inner"
                                                placeholder="Type your question for the teacher..."
                                                value={question}
                                                onChange={(e) => setQuestion(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="submit"
                                                disabled={isSubmittingAsk}
                                                className="w-full sm:w-auto bg-school-primary hover:bg-red-600 shadow-sm px-5 py-6 text-xs font-semibold uppercase italic rounded-xl transition-all hover:-translate-y-1 active:translate-y-0"
                                            >
                                                {isSubmittingAsk ? 'SENDING...' : 'SEND QUESTION'}
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-6">
                                        {labQuestions.length === 0 ? (
                                            <div className="text-center py-24 bg-gray-50/50 rounded-2xl border-4 border-dashed border-gray-100 space-y-4">
                                                <p className="text-gray-300 font-black uppercase text-[10px] italic">No questions sent yet.</p>
                                            </div>
                                        ) : (
                                            labQuestions.map(q => (
                                                <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-100 space-y-6 shadow-sm shadow-gray-50 group hover:-translate-y-1 transition-all duration-500">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <span className={`text-[10px] font-medium uppercase px-4 py-2 rounded-xl italic ${q.status === 'answered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                                {q.status}
                                                            </span>
                                                            <span className="text-[10px] text-gray-300 font-black italic">{new Date(q.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-base font-black text-gray-900 leading-tight">"{q.question}"</p>
                                                    </div>
                                                    {q.answer && (
                                                        <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-50 relative mt-6">
                                                            <div className="absolute -top-3 left-10 w-6 h-6 bg-indigo-50/50 rotate-45 border-l border-t border-indigo-50"></div>
                                                            <p className="text-[10px] font-medium text-school-secondary uppercase mb-3 italic">TEACHER RESPONSE:</p>
                                                            <p className="text-sm font-bold text-indigo-900 leading-relaxed italic uppercase tracking-tight">{q.answer}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
