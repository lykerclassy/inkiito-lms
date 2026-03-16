import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';

export default function Grades() {
    const [gradeData, setGradeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchGrades();
    }, [selectedSubjectId]);

    const fetchGrades = async () => {
        setIsLoading(true);
        try {
            const url = selectedSubjectId ? `admin/gradebook?subject_id=${selectedSubjectId}` : 'admin/gradebook';
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
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 italic tracking-tighter uppercase leading-tight">Academic Intelligence</h1>
                    <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] mt-1">Global Performance & Subject Rankings</p>
                </div>
                <select
                    className="w-full sm:w-auto p-4 bg-white border-2 border-gray-100 rounded-3xl shadow-sm focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-black text-gray-700 uppercase tracking-wider"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                >
                    <option value="">Consolidated Ranking</option>
                    {gradeData?.subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
                {/* Personal Status Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-8 sm:p-12 border-none shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="text-center md:text-left space-y-2">
                                <h2 className="text-sm font-black uppercase tracking-[0.4em] opacity-60">My Performance</h2>
                                <p className="text-5xl sm:text-7xl font-black tracking-tighter italic">{myGrade?.average || 0}%</p>
                                <div className="inline-flex px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <span className="text-xs font-black uppercase tracking-widest">Mastery Status: {myGrade?.status}</span>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <div className="p-6 bg-white/5 rounded-[30px] border border-white/10 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Quiz Avg</p>
                                    <p className="text-2xl font-black">{myGrade?.quiz_avg || 0}%</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-[30px] border border-white/10 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Subject Rank</p>
                                    <p className="text-2xl font-black">#{myRank || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Decorative */}
                        <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12 transition-transform duration-1000 group-hover:rotate-45">
                            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-8 border-2 border-gray-100 shadow-xl bg-white">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Subject Breakdown</h3>
                            <div className="space-y-4">
                                <div
                                    onClick={() => setSelectedSubjectId('')}
                                    className={`flex items-center justify-between p-4 rounded-2xl transition-all group cursor-pointer ${selectedSubjectId === '' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <span className={`text-sm font-black uppercase tracking-tight ${selectedSubjectId === '' ? 'text-white' : 'text-gray-900'}`}>Consolidated View</span>
                                    <svg className={`w-4 h-4 ${selectedSubjectId === '' ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                </div>

                                {gradeData?.subjects?.map(subj => {
                                    const isSelected = selectedSubjectId == subj.id;
                                    return (
                                        <div
                                            key={subj.id}
                                            onClick={() => setSelectedSubjectId(subj.id)}
                                            className={`flex items-center justify-between p-4 rounded-2xl transition-all group cursor-pointer ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 hover:bg-gray-100'}`}
                                        >
                                            <span className={`text-sm font-black uppercase tracking-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}>{subj.name}</span>
                                            <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'} transform group-hover:translate-x-1 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <div className="space-y-6">
                            <Card className="p-8 bg-purple-600 text-white border-none shadow-xl">
                                <h3 className="text-xs font-black uppercase tracking-widest opacity-70 mb-4">Neural Learning Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-black/10 p-4 rounded-2xl">
                                        <span className="text-xs font-bold italic uppercase tracking-wider">Total Quizzes</span>
                                        <span className="text-2xl font-black">{myGrade?.total_quizzes || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-black/10 p-4 rounded-2xl">
                                        <span className="text-xs font-bold italic uppercase tracking-wider">Assignments</span>
                                        <span className="text-2xl font-black">{myGrade?.assignment_count || 0}</span>
                                    </div>
                                </div>
                            </Card>
                            <Button className="w-full py-6 font-black uppercase tracking-widest italic" onClick={() => navigate('/student/quizzes')}>
                                Explore New Quizzes
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Column */}
                <div className="lg:col-span-1">
                    <Card noPadding className="border-none shadow-2xl overflow-hidden animate-in slide-in-from-right-8 duration-700">
                        <div className="p-6 sm:p-8 bg-gray-50 border-b border-gray-100">
                            <h2 className="text-xl font-black uppercase tracking-tighter italic text-gray-900">
                                {selectedSubjectId ? gradeData.subjects.find(s => s.id == selectedSubjectId)?.name : 'Consolidated'} Ranking
                            </h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Top 20 Performing Students</p>
                        </div>
                        <div className="p-2 sm:p-4 space-y-2">
                            {leaderboard.slice(0, 20).map((student, idx) => (
                                <div key={student.id} className={`flex items-center justify-between p-4 rounded-3xl transition-all ${student.id === myGrade?.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-[1.02]' : 'hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${student.id === myGrade?.id ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-black ${student.id === myGrade?.id ? 'text-white' : 'text-gray-900'} uppercase tracking-tight`}>{student.name}</p>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${student.id === myGrade?.id ? 'text-blue-200' : 'text-gray-400'}`}>{student.level}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black">{student.average}%</p>
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
