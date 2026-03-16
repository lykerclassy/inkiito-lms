import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function AdminGrades() {
    const [gradebook, setGradebook] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        schoolAverage: 0,
        atRiskCount: 0
    });
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [fetchingDetail, setFetchingDetail] = useState(false);

    useEffect(() => {
        fetchGradebook();
    }, [selectedSubject]);

    const fetchGradebook = async () => {
        setIsLoading(true);
        try {
            const url = selectedSubject ? `admin/gradebook?subject_id=${selectedSubject}` : 'admin/gradebook';
            const res = await api.get(url);
            setGradebook(res.data.gradebook);
            setLeaderboard(res.data.leaderboard);
            setStats(res.data.stats);
            setSubjects(res.data.subjects);
        } catch (err) {
            console.error("Failed to fetch gradebook", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReportCard = async (studentId) => {
        setFetchingDetail(true);
        try {
            const res = await api.get(`admin/gradebook/${studentId}`);
            setSelectedStudent(res.data);
        } catch (err) {
            console.error("Failed to fetch report card", err);
        } finally {
            setFetchingDetail(false);
        }
    };

    const filteredGradebook = gradebook.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academic Grading</h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Track progress, identify at-risk students, and analyze performance by subject.</p>
                </div>
                <div className="flex gap-4">
                    <select
                        className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700 min-w-[200px]"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                        <option value="">All Subjects (KCSE Mode)</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-b-4 border-b-blue-600 shadow-xl shadow-blue-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total Students</p>
                            <p className="text-3xl font-black text-gray-900">{stats.totalStudents}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-b-4 border-b-purple-600 shadow-xl shadow-purple-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Subject Average</p>
                            <p className="text-3xl font-black text-gray-900">{stats.schoolAverage}%</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-b-4 border-b-red-600 shadow-xl shadow-red-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">At Risk Count</p>
                            <p className="text-3xl font-black text-gray-900">{stats.atRiskCount}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Leaderboard Column */}
                <div className="lg:col-span-1">
                    <Card noPadding className="overflow-hidden border-none shadow-2xl">
                        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                {selectedSubject ? subjects.find(s => s.id == selectedSubject)?.name : 'Overall'} Top Ranks
                            </h2>
                            <p className="text-xs font-bold text-blue-100 opacity-80 mt-1">Based on quiz scores & assignments</p>
                        </div>
                        <div className="p-2 space-y-1">
                            {leaderboard.slice(0, 10).map((student, idx) => (
                                <div key={student.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-blue-100">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 flex items-center justify-center font-black text-sm rounded-full ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}>
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{student.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{student.level}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-blue-600">{student.average}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Main Gradebook Column */}
                <div className="lg:col-span-2">
                    <Card noPadding className="shadow-2xl border-none">
                        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Detail Registry</h2>
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Find student..."
                                    className="w-full p-3 pl-10 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Student Identity</th>
                                        <th className="px-6 py-4 text-center">Mastery Score</th>
                                        <th className="px-6 py-4 text-center">Performance Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredGradebook.map((student) => (
                                        <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-6 font-bold">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-900 text-sm">{student.name}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{student.admission} • {student.level}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="text-lg font-black text-gray-900">{student.average}%</div>
                                                    <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${student.average >= 80 ? 'bg-green-500' : student.average >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                            style={{ width: `${student.average}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${student.flagged ? 'bg-red-100 text-red-600 ring-2 ring-red-50' : 'bg-green-100 text-green-600 ring-2 ring-green-50'}`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => fetchReportCard(student.id)}
                                                    className="p-3 hover:bg-white rounded-2xl text-blue-600 hover:shadow-lg transition-all border border-transparent hover:border-blue-100"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Detailed Student Report Card Modal (Updated) */}
            {selectedStudent && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-5xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row h-[90vh]">
                        {/* Sidebar */}
                        <div className="w-full md:w-80 bg-gray-50 p-10 border-r border-gray-100 flex flex-col">
                            <div className="flex flex-col items-center text-center mb-10">
                                <div className="w-24 h-24 bg-blue-600 rounded-[35px] flex items-center justify-center text-white text-3xl font-black mb-6 shadow-2xl shadow-blue-200">
                                    {selectedStudent.student.name.charAt(0)}
                                </div>
                                <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedStudent.student.name}</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">{selectedStudent.student.admission}</p>
                                <div className="mt-4 px-4 py-1.5 bg-blue-100 rounded-full text-[10px] font-black uppercase text-blue-600 tracking-wider">
                                    {selectedStudent.student.level}
                                </div>
                            </div>

                            <div className="space-y-6 mt-auto">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Interactive Score</p>
                                    <p className="text-2xl font-black text-blue-600">
                                        {Object.values(selectedStudent.quizzes).length > 0
                                            ? Math.round(Object.values(selectedStudent.quizzes).reduce((acc, curr) => acc + curr.avg, 0) / Object.values(selectedStudent.quizzes).length)
                                            : 0}%
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Quizzes Average</p>
                                    <p className="text-2xl font-black text-purple-600">
                                        {Object.values(selectedStudent.standalone_quizzes || {}).length > 0
                                            ? Math.round(Object.values(selectedStudent.standalone_quizzes).reduce((acc, curr) => acc + curr.avg, 0) / Object.values(selectedStudent.standalone_quizzes).length)
                                            : 0}%
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="w-full py-4 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
                                >
                                    Close Portal
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-12 overflow-y-auto">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-10 flex items-center gap-4">
                                Mastery Breakdown
                                <div className="h-[1px] flex-1 bg-gray-100" />
                            </h3>

                            <div className="space-y-12 pb-20">
                                {/* Subject Performance Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-gray-900 border-l-4 border-blue-600 pl-3">Interactive Lessons</h4>
                                        <div className="space-y-3">
                                            {Object.entries(selectedStudent.quizzes).map(([subj, stats]) => (
                                                <div key={subj} className="bg-gray-50/50 p-5 rounded-3xl flex justify-between items-center group hover:bg-blue-50 transition-colors">
                                                    <div>
                                                        <p className="text-sm font-black text-gray-800">{subj}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{stats.correct}/{stats.count} blocks mastered</p>
                                                    </div>
                                                    <span className="text-lg font-black text-blue-600">{stats.avg}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-gray-900 border-l-4 border-purple-600 pl-3">Quizzes (Standalone)</h4>
                                        <div className="space-y-3">
                                            {Object.entries(selectedStudent.standalone_quizzes || {}).map(([subj, stats]) => (
                                                <div key={subj} className="bg-gray-50/50 p-5 rounded-3xl flex justify-between items-center group hover:bg-purple-50 transition-colors">
                                                    <div>
                                                        <p className="text-sm font-black text-gray-800">{subj}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{stats.count} attempts recorded</p>
                                                    </div>
                                                    <span className="text-lg font-black text-purple-600">{stats.avg}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-gray-900 border-l-4 border-yellow-600 pl-3">Assignments Portfolio</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {Object.entries(selectedStudent.assignments).map(([subj, stats]) => (
                                            <div key={subj} className="bg-gray-50/50 p-5 rounded-3xl text-center group hover:bg-yellow-50 transition-colors border-2 border-transparent hover:border-yellow-100">
                                                <p className="text-xs font-black text-gray-800 mb-1">{subj}</p>
                                                <p className="text-2xl font-black text-yellow-600 mb-1">{stats.avg}%</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Avg based on {stats.count} subs</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}