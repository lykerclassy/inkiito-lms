import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CardSkeleton } from '../../components/common/Skeleton';

export default function SubjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [subject, setSubject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSubjectDetails = async () => {
            try {
                const response = await api.get(`subjects/${id}`);
                setSubject(response.data);
            } catch (err) {
                console.error("Failed to fetch subject details:", err);
                setError('Could not load the syllabus. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubjectDetails();

        // Real-time synchronization on focus
        const onFocus = () => fetchSubjectDetails();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [id]);

    if (isLoading) {
        return (
            <div className="space-y-4 animate-in fade-in duration-500">
                <CardSkeleton />
                <div className="grid grid-cols-1 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    if (error || !subject) {
        return (
            <div className="bg-red-50 text-school-primary p-4 rounded-2xl border border-red-100 text-center max-w-2xl mx-auto shadow-sm shadow-red-50">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-school-primary shadow-sm">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-sm font-semibold uppercase mb-2">Unable to Load Subject</h3>
                <p className="text-sm font-bold opacity-70 italic">{error || 'Subject not found.'}</p>
                <Button onClick={() => navigate('/student/subjects')} className="mt-8 bg-school-primary px-4 font-black text-[10px] rounded-xl shadow-lg shadow-red-100" variant="primary">
                    ← Back to Subjects
                </Button>
            </div>
        );
    }

    const units = subject.units || [];

    return (
        <div className="space-y-5 max-w-5xl mx-auto animate-in fade-in duration-300">

            {/* Premium Subject Header Node */}
            <div className="relative overflow-hidden bg-school-secondary rounded-2xl p-4 text-white shadow-sm group">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="flex-1">
                        <button
                            onClick={() => navigate('/student/subjects')}
                            className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full text-xs font-semibold text-white border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2 mb-8 group/btn"
                        >
                            <svg className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Subjects
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-sm shadow-red-400"></div>
                            <span className="text-xs font-semibold text-indigo-200 uppercase tracking-widest">Enrolled Subject</span>
                        </div>
                        <h1 className="text-4xl lg:text-2xl font-bold leading-none">{subject.name}</h1>
                        <p className="text-indigo-100 font-bold mt-4 italic text-[11px] opacity-70 max-w-md">Work through each lesson to master this subject.</p>
                    </div>

                    <div className="w-full md:w-80 bg-black/20 backdrop-blur-3xl p-4 rounded-xl border border-white/10 shadow-inner">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-xs font-semibold text-indigo-200">Progress</span>
                            <span className="text-[11px] font-black text-white italic">{subject.progress || 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-school-primary rounded-full transition-all duration-1000 shadow-sm shadow-red-500/50"
                                style={{ width: `${subject.progress || 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Multi-Layered Content Hub */}
            <div className="space-y-4 pb-20">
                {units.length === 0 ? (
                    <div className="bg-white p-6 text-center rounded-2xl shadow-sm shadow-gray-100 border border-gray-50 max-w-2xl mx-auto">
                        <div className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 12h14m-7 4h7" /></svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase">No Content Yet</h3>
                        <p className="text-gray-400 font-bold text-[10px] mt-2 italic">The teacher hasn't added any content to this subject yet.</p>
                    </div>
                ) : (
                    units.map((unit, index) => {
                        const subUnits = unit.sub_units || unit.subUnits || [];

                        return (
                            <div key={unit.id} className="group/unit">
                                <div className="flex items-center gap-4 mb-4 px-4">
                                    <div className="w-12 h-12 rounded-2xl bg-school-primary text-white font-black text-xl flex items-center justify-center shadow-lg shadow-red-100 italic transition-transform group-hover/unit:rotate-6">
                                        {index + 1}
                                    </div>
                                    <h2 className="text-sm font-semibold text-gray-900 uppercase">{unit.title}</h2>
                                </div>

                                <Card className="border-none shadow-sm shadow-gray-100 rounded-2xl p-4 bg-white border border-gray-100 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <span className="text-8xl font-black uppercase text-gray-200">{index + 1}</span>
                                    </div>

                                    <div className="relative z-10 space-y-5">
                                        {subUnits.length === 0 ? (
                                            <p className="text-xs font-semibold text-gray-300 py-4">No topics in this unit yet.</p>
                                        ) : (
                                            subUnits.map((subUnit) => {
                                                const lessons = subUnit.lessons || [];

                                                return (
                                                    <div key={subUnit.id} className="space-y-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-0.5 w-6 bg-school-primary/30 rounded-full"></div>
                                                            <h3 className="text-md font-black text-gray-600 uppercase opacity-80">
                                                                {subUnit.title}
                                                            </h3>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3 pl-10">
                                                            {lessons.length === 0 ? (
                                                                <p className="text-xs font-semibold text-gray-300">No lessons yet.</p>
                                                            ) : (
                                                                lessons.map((lesson, lessonIndex) => (
                                                                    <div
                                                                        key={lesson.id}
                                                                        onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                                                                        className="group/lesson flex items-center justify-between p-5 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-sm hover:shadow-red-50 hover:border-school-primary/20 border border-gray-100 cursor-pointer transition-all duration-300"
                                                                    >
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover/lesson:text-school-primary group-hover/lesson:border-school-primary/30 transition-all duration-300 shadow-sm">
                                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[13px] font-black text-gray-800 uppercase group-hover/lesson:text-school-primary transition-colors">
                                                                                    {lessonIndex + 1}. {lesson.title}
                                                                                </p>
                                                                                <p className="text-[10px] font-bold text-gray-400 group-hover/lesson:opacity-70">Lesson</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover/lesson:bg-school-primary group-hover/lesson:text-white transition-all shadow-sm">
                                                                            <svg className="w-5 h-5 translate-x-px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </Card>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
