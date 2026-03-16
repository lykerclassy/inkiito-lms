import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getMediaUrl } from '../../services/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useNotification } from '../../contexts/NotificationContext';

export default function QuizPlayer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [quiz, setQuiz] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [quizStarted, setQuizStarted] = useState(false);
    const [result, setResult] = useState(null);
    const [startTime] = useState(new Date().toISOString());
    const [controlPosition, setControlPosition] = useState('top'); // 'top' or 'bottom'

    useEffect(() => {
        fetchQuiz();
    }, [id]);

    useEffect(() => {
        let timer;
        if (quizStarted && timeLeft !== null && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && quizStarted) {
            handleSubmit();
        }
        return () => clearInterval(timer);
    }, [quizStarted, timeLeft]);

    const fetchQuiz = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`student/quizzes/${id}`);
            setQuiz(res.data);
            if (res.data.time_limit) {
                setTimeLeft(res.data.time_limit * 60);
            }
        } catch (err) {
            showNotification("Failed to load quiz", "error");
            navigate('/student/quizzes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAnswer = (questionId, answer) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await api.post(`student/quizzes/${id}/submit`, {
                answers,
                started_at: startTime
            });
            setResult(res.data);
            showNotification("Quiz successfully analyzed!", "success");
        } catch (err) {
            showNotification("Submission failed", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-gray-400 tracking-widest animate-pulse">Initializing Virtual Assessment Room...</div>;

    if (result) {
        return (
            <div className="max-w-3xl mx-auto py-10 sm:py-20 px-4">
                <Card className="p-6 sm:p-12 text-center border-t-8 border-t-green-500 shadow-2xl">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-100">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 italic uppercase tracking-tighter mb-2">Analysis Complete</h2>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-8 sm:mb-12">Performance Data Synchronized</p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12 mb-12">
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Score</p>
                            <p className="text-4xl sm:text-5xl font-black text-blue-600">{result.attempt.score} <span className="text-xl text-gray-300">/ {result.attempt.total_points}</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Efficiency</p>
                            <p className="text-4xl sm:text-5xl font-black text-green-500">
                                {result.attempt.total_points > 0
                                    ? Math.round((result.attempt.score / result.attempt.total_points) * 100)
                                    : 0}%
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button className="w-full py-5 font-black uppercase tracking-widest italic" onClick={() => navigate('/student/quizzes')}>
                            Return to subjects
                        </Button>
                        <Button variant="outline" className="w-full py-5 font-black uppercase tracking-widest italic" onClick={() => navigate('/student/grades')}>
                            View Subject Leaderboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!quizStarted) {
        return (
            <div className="max-w-2xl mx-auto py-10 sm:py-20 px-4">
                <Card className="p-6 sm:p-12 border-none shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-gray-900 italic tracking-tighter uppercase mb-4">{quiz.title}</h2>
                        <p className="text-gray-500 font-bold text-lg mb-8 leading-relaxed">{quiz.description || 'This assessment tracks your mastery of the subject curriculum.'}</p>

                        <div className="grid grid-cols-2 gap-4 mb-10">
                            <div className="p-6 bg-gray-50 rounded-[30px] border border-gray-100 text-center">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Items</p>
                                <p className="text-2xl font-black text-gray-900">{quiz.questions.length}</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-[30px] border border-gray-100 text-center">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Duration</p>
                                <p className="text-2xl font-black text-gray-900">{quiz.time_limit ? `${quiz.time_limit}m` : 'Untimed'}</p>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 bg-blue-600 rounded-[30px] sm:rounded-[40px] text-white shadow-2xl shadow-blue-200">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-80">Rules of Engagement</h3>
                            <ul className="space-y-4 text-sm font-bold opacity-90 italic">
                                <li className="flex gap-3">
                                    <span className="text-yellow-300">•</span>
                                    Answers are saved only upon final submission.
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-yellow-300">•</span>
                                    {quiz.time_limit ? 'The session will terminate automatically when time expires.' : 'This session has no strict time limit.'}
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-yellow-300">•</span>
                                    Your performance directly impacts your subject ranking.
                                </li>
                            </ul>
                        </div>

                        <Button className="w-full mt-10 py-6 text-lg font-black uppercase italic tracking-widest" onClick={() => setQuizStarted(true)}>
                            Engage Assessment
                        </Button>
                    </div>

                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply opacity-50 blur-3xl animate-pulse" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-50 rounded-full mix-blend-multiply opacity-50 blur-3xl animate-pulse" />
                </Card>
            </div>
        );
    }


    const currentQuestion = quiz.questions[currentIndex];

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            {/* Standard Header - Scrolls with page */}
            <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="hidden sm:block">
                        <h2 className="text-lg font-black italic uppercase tracking-tighter text-gray-900">{quiz.title}</h2>
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Question {currentIndex + 1} of {quiz.questions.length}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                    {timeLeft !== null && (
                        <div className={`px-4 sm:px-6 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 sm:gap-3 border-2 transition-all ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-gray-50 text-gray-900 border-gray-100'}`}>
                            <svg className="w-4 h-4 sm:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {formatTime(timeLeft)}
                        </div>
                    )}

                    <Button variant="outline" className="border-red-100 text-red-600 hover:bg-red-50 text-[10px] sm:text-xs font-black px-4 sm:px-6" onClick={() => navigate('/student/quizzes')}>
                        Abort Session
                    </Button>
                </div>
            </div>

            {/* Question Progress Bar */}
            <div className="w-full h-1 bg-gray-100">
                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }} />
            </div>

            <div className="max-w-4xl mx-auto px-6 pt-16">
                <div className="space-y-12">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-blue-100 mb-6 italic">
                            {currentIndex + 1}
                        </div>
                        <h3 className="text-xl sm:text-3xl font-black text-gray-900 leading-tight italic tracking-tight mb-4">
                            {currentQuestion.question_text}
                        </h3>
                        {currentQuestion.image_path && (
                            <div className="mb-8 max-w-2xl mx-auto rounded-[40px] overflow-hidden border-4 border-white shadow-2xl">
                                <img
                                    src={getMediaUrl(currentQuestion.image_path)}
                                    alt="Visual Aid"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        )}
                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Value: {currentQuestion.points} Neural Points</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.isArray(currentQuestion.options) && currentQuestion.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelectAnswer(currentQuestion.id, opt)}
                                className={`group p-6 sm:p-8 rounded-[30px] sm:rounded-[40px] text-left transition-all duration-300 border-4 relative overflow-hidden ${answers[currentQuestion.id] === opt
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-200'
                                    : 'bg-white border-transparent text-gray-700 hover:border-gray-200 shadow-xl shadow-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${answers[currentQuestion.id] === opt ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="text-lg font-bold leading-tight">{opt}</span>
                                </div>
                                {answers[currentQuestion.id] === opt && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20">
                                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-gray-100">
                        <button
                            disabled={currentIndex === 0}
                            onClick={() => setCurrentIndex(prev => prev - 1)}
                            className="text-sm font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 disabled:opacity-0 transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            Backtrack
                        </button>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {currentIndex === quiz.questions.length - 1 ? (
                                <Button
                                    className="flex-1 sm:flex-none px-12 py-5 font-black uppercase tracking-widest bg-gray-900 text-white italic"
                                    onClick={handleSubmit}
                                    isLoading={isSubmitting}
                                >
                                    Final Submission
                                </Button>
                            ) : (
                                <Button
                                    className="flex-1 sm:flex-none px-12 py-5 font-black uppercase tracking-widest bg-blue-600 shadow-xl shadow-blue-100 italic"
                                    onClick={() => setCurrentIndex(prev => prev + 1)}
                                >
                                    Next Protocol
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
