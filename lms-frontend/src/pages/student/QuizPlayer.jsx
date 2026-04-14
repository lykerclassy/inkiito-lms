import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getMediaUrl } from '../../services/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useNotification } from '../../contexts/NotificationContext';
import confetti from 'canvas-confetti';
import MathText from '../../components/common/MathText';

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
            
            // Defensively parse options in case they were double-encoded as strings in the database
            if (res.data && Array.isArray(res.data.questions)) {
                res.data.questions.forEach(q => {
                    if (typeof q.options === 'string') {
                        try {
                            q.options = JSON.parse(q.options);
                        } catch (e) {
                            q.options = ['', '', '', ''];
                        }
                    }
                    // Final fallback
                    if (!Array.isArray(q.options)) {
                        q.options = ['', '', '', ''];
                    }
                });
            }

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
        if (Object.keys(answers).length < quiz.questions.length) {
            showNotification("Please select an answer for all questions before submitting.", "error");
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await api.post(`student/quizzes/${id}/submit`, {
                answers,
                started_at: startTime
            });
            const submissionRes = res.data;
            setResult(submissionRes);
            
            const scorePercentage = submissionRes.attempt.total_points > 0 
                ? (submissionRes.attempt.score / submissionRes.attempt.total_points) * 100 
                : 0;
            
            if (scorePercentage >= 50) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#4ade80', '#3b82f6', '#a855f7']
                });
                showNotification("Excellent work! You passed the quiz! 👏", "success");
            } else {
                showNotification("Don't give up! Try aiming for a higher score next time.", "error");
            }
            
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
        const percentage = result.attempt.total_points > 0
            ? Math.round((result.attempt.score / result.attempt.total_points) * 100)
            : 0;
            
        const isPassed = percentage >= 50;

        return (
            <div className="max-w-3xl mx-auto py-10 sm:py-20 px-4">
                <Card className={`p-6 sm:p-12 text-center border-t-8 shadow-2xl ${isPassed ? 'border-t-green-500' : 'border-t-red-500'}`}>
                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-xl ${isPassed ? 'bg-green-100 text-green-600 shadow-green-100' : 'bg-red-100 text-red-600 shadow-red-100'}`}>
                        {isPassed ? (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 italic uppercase tracking-tighter mb-2">
                        {isPassed ? 'Outstanding! 👏' : 'Keep Pushing! 😔'}
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-8 sm:mb-12">Performance Data Synchronized</p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12 mb-12">
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Score</p>
                            <p className="text-3xl sm:text-4xl font-black text-blue-600">{result.attempt.score} <span className="text-lg text-gray-300">/ {result.attempt.total_points}</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Efficiency</p>
                            <p className={`text-3xl sm:text-4xl font-black ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
                                {percentage}%
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-16">
                        {!isPassed && (
                            <Button 
                                className="w-full py-5 font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white italic shadow-lg shadow-red-200" 
                                onClick={() => {
                                    setResult(null);
                                    setAnswers({});
                                    setCurrentIndex(0);
                                    setQuizStarted(false);
                                    setTimeLeft(quiz.time_limit ? quiz.time_limit * 60 : null);
                                }}
                            >
                                Try Again (Retake Quiz)
                            </Button>
                        )}
                        <Button className="w-full py-5 font-black uppercase tracking-widest italic" onClick={() => navigate('/student/quizzes')}>
                            Return to subjects
                        </Button>
                        <Button variant="outline" className="w-full py-5 font-black uppercase tracking-widest italic" onClick={() => navigate('/student/grades')}>
                            View Subject Leaderboard
                        </Button>
                    </div>

                    <div className="mt-16 text-left border-t-2 border-dashed border-gray-100 pt-16">
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8 text-center italic">Assessment Review</h3>
                        <div className="space-y-8">
                            {quiz.questions.map((q, idx) => {
                                const detail = result.details.find(d => d.question_id === q.id);
                                if (!detail) return null;

                                const isCorrect = detail.is_correct;
                                const feedback = isCorrect ? detail.feedback_correct : detail.feedback_incorrect;

                                return (
                                    <div key={q.id} className={`p-6 sm:p-8 rounded-[30px] border-4 ${isCorrect ? 'bg-green-50/30 border-green-100' : 'bg-red-50/30 border-red-100'}`}>
                                        <div className="flex gap-4 items-start mb-6">
                                            <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center font-black ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg leading-snug">
                                                    <MathText text={q.question_text} />
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Your Answer</span>
                                                <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-500 line-through opacity-70'}`}>
                                                    {detail.student_answer ? <MathText text={detail.student_answer} /> : "Skipped"}
                                                </span>
                                            </div>
                                            {!isCorrect && (
                                                <div className="p-4 rounded-2xl bg-green-50 border border-green-100 shadow-sm ring-2 ring-green-100">
                                                    <span className="text-[10px] font-black uppercase text-green-600 tracking-widest block mb-2">Correct Answer</span>
                                                    <span className="font-bold text-green-700">
                                                        <MathText text={detail.correct_answer} />
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {feedback && (
                                            <div className={`p-5 rounded-2xl flex gap-4 items-start ${isCorrect ? 'bg-green-100/50 text-green-800' : 'bg-amber-100/50 text-amber-900'}`}>
                                                <div className="shrink-0 mt-0.5">
                                                    <svg className="w-5 h-5 opacity-50" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-50 mb-1">Teacher Feedback</span>
                                                    <p className="font-semibold text-sm leading-relaxed italic">{feedback}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
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
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-[14px] font-black text-lg shadow-lg shadow-blue-100 mb-4 italic">
                            {currentIndex + 1}
                        </div>
                        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight italic tracking-tight mb-4">
                            <MathText text={currentQuestion.question_text} />
                        </h3>
                        {currentQuestion.image_path && (
                            <div className="mb-6 max-w-xl mx-auto rounded-3xl overflow-hidden border border-gray-100 bg-white">
                                <img
                                    src={getMediaUrl(currentQuestion.image_path)}
                                    alt="Visual Aid"
                                    className="w-full h-48 sm:h-64 object-contain"
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
                                className={`group p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 border-2 relative overflow-hidden ${answers[currentQuestion.id] === opt
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white border-transparent text-gray-700 hover:border-gray-200 shadow-md shadow-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black transition-all ${answers[currentQuestion.id] === opt ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="text-base font-semibold leading-tight">
                                        <MathText text={opt} />
                                    </span>
                                </div>
                                {answers[currentQuestion.id] === opt && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
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
