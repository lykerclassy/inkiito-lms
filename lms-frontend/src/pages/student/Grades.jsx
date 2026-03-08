import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import { CardSkeleton } from '../../components/common/Skeleton';

export default function Grades() {
    const [grades, setGrades] = useState([]);
    const [summary, setSummary] = useState({ average: 0, topSubject: '-', needsAttention: '-' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const response = await api.get('/student/grades');
                const rawResults = response.data;

                if (rawResults.length === 0) {
                    setGrades([]);
                    setIsLoading(false);
                    return;
                }

                const subjectStats = {};
                let totalCorrectAll = 0;
                let totalQuestionsAll = rawResults.length;

                rawResults.forEach(result => {
                    const subjectName = result.lesson?.sub_unit?.unit?.subject?.name
                        || result.lesson?.subUnit?.unit?.subject?.name
                        || 'Uncategorized Subject';

                    if (!subjectStats[subjectName]) {
                        subjectStats[subjectName] = { correct: 0, total: 0 };
                    }

                    subjectStats[subjectName].total += 1;
                    if (result.is_correct) {
                        subjectStats[subjectName].correct += 1;
                        totalCorrectAll += 1;
                    }
                });

                const processedGrades = Object.keys(subjectStats).map((subjectName, index) => {
                    const stats = subjectStats[subjectName];
                    const score = Math.round((stats.correct / stats.total) * 100);

                    let grade = 'E';
                    let status = 'Needs Improvement';

                    if (score >= 80) { grade = 'A'; status = 'Exceeding Expectations'; }
                    else if (score >= 70) { grade = 'B'; status = 'Meeting Expectations'; }
                    else if (score >= 60) { grade = 'C'; status = 'Approaching Expectations'; }
                    else if (score >= 50) { grade = 'D'; status = 'Below Expectations'; }

                    return {
                        id: index,
                        subject: subjectName,
                        score: score,
                        grade: grade,
                        status: status,
                        fraction: `${stats.correct}/${stats.total}`
                    };
                });

                processedGrades.sort((a, b) => b.score - a.score);

                const overallAverage = Math.round((totalCorrectAll / totalQuestionsAll) * 100);
                const topSubject = processedGrades[0]?.subject || '-';
                const needsAttention = processedGrades[processedGrades.length - 1]?.subject || '-';

                setGrades(processedGrades);
                setSummary({ average: overallAverage, topSubject, needsAttention });

            } catch (err) {
                console.error("Failed to fetch grades:", err);
                setError("Could not load your academic performance. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchGrades();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-5 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
                    ))}
                </div>
                <CardSkeleton />
            </div>
        );
    }
    if (error) return <div className="p-4 bg-red-50 text-school-primary font-black rounded-xl border border-red-100 shadow-sm shadow-red-50/50">{error}</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-5 pb-24 animate-in fade-in duration-300">
            {/* Premium Header Section */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-school-secondary/5 rounded-full blur-3xl group-hover:bg-school-secondary/10 transition-all duration-1000"></div>

                <div className="flex flex-col md:flex-row items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-school-secondary rounded-xl flex items-center justify-center text-white shadow-sm transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-2 h-2 rounded-full bg-school-primary animate-pulse"></span>
                            <span className="text-xs font-semibold text-gray-400 uppercase italic">Quiz Results</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-none">
                            My Grades
                        </h1>
                    </div>
                </div>

                <div className="relative z-10 bg-gray-50 px-5 py-5 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase italic text-center md:text-right">
                        Scores from your completed lesson quizzes
                    </p>
                </div>
            </header>

            {grades.length === 0 ? (
                <Card className="p-4 text-center border-none shadow-sm rounded-2xl bg-white border border-gray-100 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-300">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-200 shadow-sm shadow-gray-100 border border-gray-100">
                        <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-300">No Grades Yet</h3>
                        <p className="text-gray-400 font-bold max-w-sm mx-auto italic uppercase text-xs leading-relaxed">Complete lesson quizzes to see your grades here.</p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-5">
                    {/* Performance Overview Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-school-primary p-5 rounded-2xl border-none shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:rotate-12 transition-transform duration-1000">
                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                            </div>
                            <div className="relative z-10 space-y-6">
                                <h3 className="text-red-100 font-black text-[10px] uppercase italic">Overall Average</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-white leading-none">{summary.average}%</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 w-max px-4 py-1.5 rounded-xl backdrop-blur-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-200 animate-pulse"></div>
                                    <p className="text-[10px] font-medium text-red-100 uppercase">Quiz Average</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white p-5 rounded-2xl border-none shadow-sm border border-gray-100 group hover:ring-school-secondary/20 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute -bottom-10 -right-10 w-12 h-12 bg-school-secondary/5 rounded-full blur-2xl group-hover:bg-school-secondary/10 transition-all duration-1000"></div>
                            <div className="relative z-10 space-y-4">
                                <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center text-school-secondary shadow-sm shadow-indigo-100/50 group-hover:rotate-6 transition-transform duration-500">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-gray-400 font-black text-[10px] uppercase italic">Best Subject</h3>
                                    <span className="text-lg font-bold text-gray-900 group-hover:text-school-secondary transition-colors leading-none block">{summary.topSubject}</span>
                                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100 italic w-max block">Top Performer</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white p-5 rounded-2xl border-none shadow-sm border border-gray-100 group hover:ring-school-accent/20 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute -bottom-10 -right-10 w-12 h-12 bg-school-accent/5 rounded-full blur-2xl group-hover:bg-school-accent/10 transition-all duration-1000"></div>
                            <div className="relative z-10 space-y-4">
                                <div className="w-9 h-9 rounded-2xl bg-yellow-50 flex items-center justify-center text-school-accent shadow-sm shadow-yellow-100/50 group-hover:-rotate-6 transition-transform duration-500">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-gray-400 font-black text-[10px] uppercase italic">Needs Improvement</h3>
                                    <span className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors leading-none block">{summary.needsAttention}</span>
                                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-4 py-1.5 rounded-xl border border-amber-100 italic w-max block">Needs Review</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Detailed Grades Table */}
                    <Card noPadding={true} className="overflow-hidden border-none shadow-sm rounded-2xl bg-white border border-gray-100 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase italic">Subject Breakdown</h2>
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-semibold text-emerald-600">Live</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white text-xs font-semibold text-gray-400 uppercase italic border-b border-gray-50">
                                        <th className="px-5 py-4">Subject</th>
                                        <th className="px-5 py-4 text-center uppercase">Score</th>
                                        <th className="px-5 py-4 text-center uppercase">Progress</th>
                                        <th className="px-5 py-4 text-center uppercase">Grade</th>
                                        <th className="px-5 py-4 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {grades.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-all duration-300 group">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-school-primary group-hover:text-white group-hover:rotate-6 transition-all duration-500 font-black text-lg italic shadow-sm">
                                                        {item.subject.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-900 group-hover:text-school-primary transition-colors leading-none mb-2">{item.subject}</span>
                                                        <span className="text-[10px] font-medium text-gray-300 uppercase italic">Enrolled Subject</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className="px-6 py-2 bg-gray-50 rounded-lg font-semibold text-gray-800 italic text-sm border border-gray-100 group-hover:bg-white group-hover:shadow-lg transition-all">{item.fraction}</span>
                                            </td>
                                            <td className="px-5 py-3 min-w-[200px]">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-full bg-gray-100 rounded-full h-2.5 max-w-[140px] overflow-hidden shadow-inner border border-gray-100">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 group-hover:scale-x-105 origin-left ${item.score >= 80 ? 'bg-school-secondary shadow-lg shadow-indigo-100' :
                                                                item.score >= 60 ? 'bg-school-primary shadow-lg shadow-red-100' :
                                                                    'bg-school-accent shadow-lg shadow-yellow-100'
                                                                }`}
                                                            style={{ width: `${item.score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-900">{item.score}%</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex w-14 h-14 items-center justify-center rounded-lg font-black text-2xl italic shadow-sm transition-all duration-500 group-hover:rotate-12 ${item.grade === 'A' ? 'bg-indigo-50 text-school-secondary shadow-indigo-100 ring-1 ring-indigo-200' :
                                                    item.grade === 'B' ? 'bg-red-50 text-school-primary shadow-red-100 ring-1 ring-red-200' :
                                                        item.grade === 'C' ? 'bg-yellow-50 text-amber-600 shadow-yellow-100 ring-1 ring-yellow-200' :
                                                            'bg-gray-50 text-gray-400 shadow-gray-100 border border-gray-100'
                                                    }`}>
                                                    {item.grade}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2 h-2 rounded-full ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 50 ? 'bg-amber-500' : 'bg-red-500'} shadow-lg`} />
                                                    <span className="text-xs font-semibold text-gray-400 uppercase italic leading-tight group-hover:text-gray-900 transition-colors">{item.status}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
