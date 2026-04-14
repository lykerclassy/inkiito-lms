import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';

export default function Grades() {
    const [gradeData, setGradeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTitleId, setSelectedTitleId] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchGrades();
    }, [selectedTitleId]);

    const fetchGrades = async () => {
        setIsLoading(true);
        try {
            const url = selectedTitleId ? `admin/gradebook?subject_title_id=${selectedTitleId}` : 'admin/gradebook';
            const res = await api.get(url);
            setGradeData(res.data);
            setLeaderboard(res.data.leaderboard);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !gradeData) return <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">Compiling Neural Records...</div>;

    const myGrade = gradeData?.gradebook?.find(s => s.id === user?.id);
    const myRank = leaderboard.findIndex(s => s.id === myGrade?.id) + 1;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-32">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-4 sm:px-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Academic Intelligence</h1>
                    </div>
                    <p className="text-gray-500 text-xs md:text-sm">Global Performance & Subject Rankings</p>
                </div>
                <select
                    className="w-full sm:w-auto p-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-semibold text-gray-700"
                    value={selectedTitleId}
                    onChange={(e) => setSelectedTitleId(e.target.value)}
                >
                    <option value="">Consolidated Ranking</option>
                    {gradeData?.subject_titles?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
                {/* Personal Status Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-gradient-to-br from-indigo-600 to-blue-800 text-white p-8 sm:p-10 border border-indigo-700 shadow-lg shadow-indigo-200 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="text-center md:text-left space-y-2">
                                <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-indigo-100">My Performance</h2>
                                <p className="text-4xl sm:text-6xl font-bold tracking-tight">{myGrade?.average || 0}%</p>
                                <div className="inline-flex px-3 py-1 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 mt-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">Mastery Status: {myGrade?.status}</span>
                                </div>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <div className="p-5 bg-white/10 rounded-2xl border border-white/20 text-center backdrop-blur-sm">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-100 mb-1">Quiz Avg</p>
                                    <p className="text-2xl font-bold">{myGrade?.quiz_avg || 0}%</p>
                                </div>
                                <div className="p-5 bg-white/10 rounded-2xl border border-white/20 text-center backdrop-blur-sm">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-100 mb-1">Subject Rank</p>
                                    <p className="text-2xl font-bold">#{myRank || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Decorative */}
                        <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12 transition-transform duration-1000 group-hover:rotate-45">
                            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 bg-purple-600 text-white shadow-lg shadow-purple-200 border border-purple-700">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-4 text-purple-100">Learning Statistics</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-100">Total Quizzes</span>
                                    <span className="text-lg font-bold">{myGrade?.total_quizzes || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-100">Assignments</span>
                                    <span className="text-lg font-bold">{myGrade?.assignment_count || 0}</span>
                                </div>
                            </div>
                        </Card>
                        
                        <div className="flex items-center justify-center p-6 bg-blue-50 rounded-2xl border border-blue-100 group">
                            <Button className="w-full py-4 bg-white text-blue-600 hover:bg-blue-600 hover:text-white border-2 border-blue-600 font-bold uppercase tracking-widest text-xs transition-colors shadow-sm" onClick={() => navigate('/student/quizzes')}>
                                Explore New Quizzes
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Column */}
                <div className="lg:col-span-1">
                    <Card noPadding className="border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800 tracking-tight flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                {selectedTitleId ? gradeData.subject_titles.find(s => s.id == selectedTitleId)?.name : 'Consolidated'} Ranking
                            </h2>
                            <p className="text-[10px] font-semibold text-gray-400 mt-1">Top Performing Students</p>
                        </div>
                        <div className="p-2 space-y-1 overflow-y-auto cool-scrollbar flex-1">
                            {leaderboard.length === 0 && <p className="text-xs text-gray-400 p-4 text-center">No ranking data yet.</p>}
                            {leaderboard.map((student, idx) => (
                                <div key={student.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-default ${student.id === myGrade?.id ? 'bg-blue-50 border border-blue-100 shadow-sm' : 'hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] ${student.id === myGrade?.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold tracking-tight ${student.id === myGrade?.id ? 'text-blue-900' : 'text-gray-800'}`}>{student.name}</p>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${student.id === myGrade?.id ? 'text-blue-500' : 'text-gray-400'}`}>{student.level}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${student.id === myGrade?.id ? 'text-blue-600' : 'text-gray-900'}`}>{student.average}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
