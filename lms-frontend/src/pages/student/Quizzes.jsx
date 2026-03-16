import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function Quizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('student/quizzes');
            setQuizzes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="px-4 sm:px-0">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 italic tracking-tighter uppercase">Self-Paced Quizzes</h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] opacity-60 mt-1">Challenge your knowledge and track your subject rankings</p>
            </header>

            {isLoading ? (
                <div className="py-20 text-center animate-pulse">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl mx-auto animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase text-gray-400">Booting Quiz Engine...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 px-4 sm:px-0">
                    {quizzes.map(quiz => (
                        <Card key={quiz.id} className="relative group overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all duration-500 shadow-xl shadow-gray-100 hover:shadow-blue-100">
                            <div className="p-6 sm:p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl">
                                        {quiz.subject?.name}
                                    </span>
                                    {quiz.best_score !== null && (
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-gray-400 uppercase">Best Score</p>
                                            <p className="text-lg font-black text-green-600 leading-none">
                                                {quiz.questions_count > 0
                                                    ? Math.round((quiz.best_score / quiz.questions_count) * 100)
                                                    : 0}%
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors uppercase leading-tight italic">
                                    {quiz.title}
                                </h3>
                                <p className="text-sm text-gray-400 font-bold line-clamp-2 mb-8 h-10">{quiz.description || 'Test your proficiency in this subject area.'}</p>

                                <div className="flex items-center gap-6 mb-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        {quiz.questions_count} Questions
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        {quiz.time_limit ? `${quiz.time_limit} Minutes` : 'Infinite Time'}
                                    </div>
                                </div>

                                <Button
                                    className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-100 italic"
                                    onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                                >
                                    {quiz.attempted_count > 0 ? 'Retake Challenge' : 'Begin Assessment'}
                                </Button>
                            </div>

                            {/* Decorative background Icon */}
                            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            </div>
                        </Card>
                    ))}

                    {quizzes.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-100">
                            <h2 className="text-2xl font-black text-gray-300 italic uppercase">No active assessments available</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Check back soon for new subject challenges</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
