import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageLoader from '../../components/common/PageLoader';
import api from '../../services/api';

export default function AdminGrades() {
    const [gradebook, setGradebook] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        schoolAverage: 0,
        atRiskCount: 0
    });
    const [subjectTitles, setSubjectTitles] = useState([]);
    const [academicLevels, setAcademicLevels] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [fetchingDetail, setFetchingDetail] = useState(false);
    const [curriculums, setCurriculums] = useState([]);
    const [selectedCurriculum, setSelectedCurriculum] = useState('');

    useEffect(() => {
        fetchGradebook();
    }, [selectedTitle, selectedLevel, selectedCurriculum]);

    const fetchGradebook = async () => {
        setIsLoading(true);
        try {
            let url = 'admin/gradebook?';
            if (selectedTitle) url += `subject_title_id=${selectedTitle}&`;
            if (selectedLevel) url += `academic_level_id=${selectedLevel}&`;
            if (selectedCurriculum) url += `curriculum_id=${selectedCurriculum}`;

            const res = await api.get(url);
            setGradebook(res.data.gradebook);
            setLeaderboard(res.data.leaderboard);
            setStats(res.data.stats);
            if (res.data.subject_titles) setSubjectTitles(res.data.subject_titles);
            if (res.data.academic_levels) setAcademicLevels(res.data.academic_levels);
            if (res.data.curriculums) setCurriculums(res.data.curriculums);
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

    if (isLoading) return <PageLoader message="Analyzing Academic Performance..." color="blue" />;
    
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Academic Gradebook</h1>
                    </div>
                    <p className="text-gray-500 text-xs md:text-sm">Track progress, identify at-risk students, and analyze performance.</p>
                </div>
                <div className="flex gap-4 flex-wrap mt-4 md:mt-0 justify-end">
                    <select
                        className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-semibold text-gray-700 min-w-[200px]"
                        value={selectedCurriculum}
                        onChange={(e) => {
                            setSelectedCurriculum(e.target.value);
                        }}
                    >
                        <option value="">Global Rankings (All Curricula)</option>
                        {curriculums.map(c => (
                            <option key={c.id} value={c.id}>{c.name} Framework</option>
                        ))}
                    </select>
                    <select
                        className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-semibold text-gray-700 min-w-[200px]"
                        value={selectedTitle}
                        onChange={(e) => setSelectedTitle(e.target.value)}
                    >
                        <option value="">All Subjects</option>
                        {subjectTitles.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    <select
                        className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-semibold text-gray-700 min-w-[150px]"
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                    >
                        <option value="">All Classes/Levels</option>
                        {academicLevels.map(lvl => (
                            <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl text-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Students</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalStudents}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl text-purple-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subject Average</p>
                            <p className="text-xl font-bold text-gray-900">{stats.schoolAverage}%</p>
                        </div>
                    </div>
                </Card>
                <Card className="border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-50 rounded-xl text-red-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">At Risk Count</p>
                            <p className="text-xl font-bold text-gray-900">{stats.atRiskCount}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Leaderboard Column */}
                <div className="lg:col-span-1">
                    <Card noPadding className="overflow-hidden border border-gray-100 shadow-sm h-full flex flex-col">
                        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800 tracking-tight flex items-center gap-2">
                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                {(() => {
                                    const t = subjectTitles.find(title => title.id == selectedTitle);
                                    const l = academicLevels.find(lvl => lvl.id == selectedLevel);
                                    if (t && l) return `${t.name} (${l.name})`;
                                    if (t) return t.name;
                                    if (l) return l.name;
                                    return 'Overall';
                                })()} Top Ranks
                            </h2>
                            <p className="text-[10px] font-semibold text-gray-400 mt-1">Based on global analytics</p>
                        </div>
                        <div className="p-2 space-y-1 overflow-y-auto cool-scrollbar max-h-[500px]">
                            {leaderboard.length === 0 && <p className="text-xs text-gray-400 p-4 text-center">No ranking data yet.</p>}
                            {leaderboard.slice(0, 10).map((student, idx) => (
                                <div key={student.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 flex items-center justify-center font-black text-[10px] rounded-full ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800 tracking-tight">{student.name}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{student.level}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-black text-indigo-600">{student.average}%</div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Main Gradebook Column */}
                <div className="lg:col-span-2">
                    <Card noPadding className="shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-h-[600px]">
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white z-10">
                            <h2 className="text-sm font-semibold text-gray-800 tracking-tight">Detail Registry</h2>
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    className="w-full py-2 px-3 pl-9 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs text-gray-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>
                        <div className="overflow-y-auto cool-scrollbar flex-1 relative">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/95 backdrop-blur sticky top-0 z-10 text-[10px] font-bold uppercase text-gray-500 tracking-widest border-b border-gray-100 shadow-sm">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Student Identity</th>
                                        <th className="px-5 py-3 font-semibold text-center">Mastery Score</th>
                                        <th className="px-5 py-3 font-semibold text-center">Status</th>
                                        <th className="px-5 py-3 font-semibold text-right">Report Card</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {filteredGradebook.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-5 py-8 text-center text-gray-400 text-xs font-medium">No students match your search criteria.</td>
                                        </tr>
                                    )}
                                    {filteredGradebook.map((student) => (
                                        <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group cursor-default">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm border border-indigo-100">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-800 tracking-tight">{student.name}</p>
                                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">{student.admission} • {student.level}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-col items-center">
                                                    <div className="text-sm font-black text-gray-800">{student.average}%</div>
                                                    <div className="w-20 bg-gray-100 rounded-full h-1 mt-1 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${student.average >= 80 ? 'bg-green-500' : student.average >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                            style={{ width: `${student.average}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${student.flagged ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => fetchReportCard(student.id)}
                                                    className="p-1.5 hover:bg-white rounded-lg text-blue-600 hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
                                                    title="View Full Report Card"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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
                    <div className="bg-white rounded-[30px] md:rounded-[40px] w-full max-w-5xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh] animate-in zoom-in slide-in-from-bottom-10 duration-500">
                        {/* Close Button Mobile */}
                        <button 
                            onClick={() => setSelectedStudent(null)}
                            className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur rounded-full md:hidden shadow-lg border border-gray-100"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {/* Sidebar */}
                        <div className="w-full md:w-80 bg-gray-50 p-8 md:p-10 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col shrink-0 overflow-y-auto max-h-[40vh] md:max-h-full">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-[30px] md:rounded-[35px] flex items-center justify-center text-white text-2xl md:text-3xl font-black mb-4 md:mb-6 shadow-2xl shadow-blue-200">
                                    {selectedStudent.student.name.charAt(0)}
                                </div>
                                <h2 className="text-lg md:text-xl font-black text-gray-900 leading-tight">{selectedStudent.student.name}</h2>
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">{selectedStudent.student.admission}</p>
                                <div className="mt-4 px-4 py-1.5 bg-blue-100 rounded-full text-[9px] md:text-[10px] font-black uppercase text-blue-600 tracking-wider">
                                    {selectedStudent.student.level}
                                </div>
                            </div>

                            <div className="space-y-4 md:space-y-6 mt-8 md:mt-auto">
                                <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 leading-none">Interactive Lessons</p>
                                    <p className="text-2xl font-black text-blue-600">
                                        {Object.values(selectedStudent.quizzes).length > 0
                                            ? Math.round(Object.values(selectedStudent.quizzes).reduce((acc, curr) => acc + curr.avg, 0) / Object.values(selectedStudent.quizzes).length)
                                            : 0}%
                                    </p>
                                </div>
                                <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 leading-none">Quizzes Average</p>
                                    <p className="text-2xl font-black text-purple-600">
                                        {Object.values(selectedStudent.standalone_quizzes || {}).length > 0
                                            ? Math.round(Object.values(selectedStudent.standalone_quizzes).reduce((acc, curr) => acc + curr.avg, 0) / Object.values(selectedStudent.standalone_quizzes).length)
                                            : 0}%
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="hidden md:block w-full py-4 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
                                >
                                    Close Portal
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-white">
                            <h3 className="text-[11px] md:text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-8 md:mb-10 flex items-center gap-4">
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