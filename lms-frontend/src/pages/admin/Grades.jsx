import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function AdminGrades() {
    const [studentsProgress, setStudentsProgress] = useState([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        schoolAverage: 0,
        missingAssignments: 0,
        atRiskCount: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('All Levels');
    const [selectedStudent, setSelectedStudent] = useState(null); // Detailed report card data
    const [fetchingDetail, setFetchingDetail] = useState(false);

    useEffect(() => {
        fetchGradebook();
    }, []);

    const fetchGradebook = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/gradebook');
            setStudentsProgress(res.data.students);
            setStats(res.data.stats);
        } catch (err) {
            console.error("Failed to fetch gradebook", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReportCard = async (studentId) => {
        setFetchingDetail(true);
        try {
            const res = await api.get(`/admin/gradebook/${studentId}`);
            setSelectedStudent(res.data);
        } catch (err) {
            console.error("Failed to fetch report card", err);
            alert("Could not load report card");
        } finally {
            setFetchingDetail(false);
        }
    };

    const exportToCSV = () => {
        if (!studentsProgress.length) return;

        const headers = ["Name", "Admission", "Level", "Overall Avg", "Status", "Quiz Avg", "Assignment Avg"];
        const rows = studentsProgress.map(s => [
            s.name,
            s.admission,
            s.level,
            `${s.average}%`,
            s.status,
            `${s.quiz_avg}%`,
            `${s.assignment_avg}%`
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Inkiito_Gradebook_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportStudentToCSV = () => {
        if (!selectedStudent) return;

        const student = selectedStudent.student;
        const csvRows = [
            [`REPORT CARD: ${student.name}`],
            [`Admission: ${student.admission}`],
            [`Level: ${student.level}`],
            [""],
            ["SUBJECT PERFORMANCE"]
        ];

        csvRows.push(["Subject", "Type", "Details", "Score"]);

        // Add Quizzes
        Object.entries(selectedStudent.quizzes).forEach(([sub, stats]) => {
            csvRows.push([sub, "Quiz", `${stats.correct}/${stats.count} Correct`, `${stats.avg}%`]);
        });

        // Add Assignments
        Object.entries(selectedStudent.assignments).forEach(([sub, stats]) => {
            csvRows.push([sub, "Assignment", `${stats.count} Submissions`, `${stats.avg}%`]);
        });

        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${student.name}_Report_Card.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredStudents = studentsProgress.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.admission.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = levelFilter === 'All Levels' || s.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    const levels = ['All Levels', ...new Set(studentsProgress.map(s => s.level))];

    if (isLoading) return <div className="p-20 text-center font-black text-gray-400">Aggregating School performance...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gradebook & Progress</h1>
                    <p className="text-gray-500 mt-1">Track student performance across all curriculums and identify at-risk learners.</p>
                </div>
                <Button variant="outline" onClick={exportToCSV}>
                    Export Gradebook (CSV)
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">School Average</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.schoolAverage}%</p>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Missing Assignments</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.missingAssignments}</p>
                </Card>
                <Card className="border-l-4 border-l-red-500 bg-red-50">
                    <p className="text-sm text-red-600 font-bold uppercase tracking-wider">At Risk Students</p>
                    <p className="text-2xl font-bold text-red-700 mt-1">{stats.atRiskCount}</p>
                </Card>
            </div>

            <Card noPadding={true} className="overflow-hidden border border-gray-200 shadow-sm mt-8">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search name or admission..."
                            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white capitalize"
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                        >
                            {levels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-white text-gray-500 font-medium border-b border-gray-100 uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Level</th>
                                <th className="px-6 py-4 text-center">Overall Average</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${student.flagged ? 'bg-red-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 flex items-center gap-2">
                                            {student.name}
                                            {student.flagged && <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{student.admission}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-800">{student.level}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 max-w-[100px] mx-auto overflow-hidden">
                                            <div
                                                className={`h-2.5 rounded-full ${student.average >= 80 ? 'bg-green-500' : student.average >= 60 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                style={{ width: `${student.average}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-bold">{student.average}%</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${student.flagged ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => fetchReportCard(student.id)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                                        >
                                            View Report Card
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Report Card Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="absolute top-6 right-6 w-10 h-10 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl flex items-center justify-center transition-all z-10"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="p-10 space-y-10">
                            {/* Student Info Header */}
                            <div className="flex items-start gap-6 pb-8 border-b border-gray-100">
                                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black italic">
                                    {selectedStudent.student.name.charAt(0)}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-gray-900 italic uppercase">{selectedStudent.student.name}</h2>
                                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{selectedStudent.student.admission} • {selectedStudent.student.level}</p>
                                    <div className="flex gap-4 mt-4">
                                        <div className="bg-green-50 px-4 py-2 rounded-xl">
                                            <p className="text-[8px] font-black text-green-600 uppercase tracking-widest">Quiz Avg</p>
                                            <p className="text-xl font-black text-green-700">
                                                {Object.values(selectedStudent.quizzes).length > 0
                                                    ? Math.round(Object.values(selectedStudent.quizzes).reduce((acc, curr) => acc + curr.avg, 0) / Object.values(selectedStudent.quizzes).length)
                                                    : 0}%
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 px-4 py-2 rounded-xl">
                                            <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Assignment Avg</p>
                                            <p className="text-xl font-black text-blue-700">
                                                {Object.values(selectedStudent.assignments).length > 0
                                                    ? Math.round(Object.values(selectedStudent.assignments).reduce((acc, curr) => acc + curr.avg, 0) / Object.values(selectedStudent.assignments).length)
                                                    : 0}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Subject Quiz Performance */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Quiz Performance by Subject
                                    </h3>
                                    <div className="space-y-3">
                                        {Object.entries(selectedStudent.quizzes).length > 0 ? Object.entries(selectedStudent.quizzes).map(([subject, stats]) => (
                                            <div key={subject} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-green-100 transition-all">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{subject}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{stats.correct}/{stats.count} Correct</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-black ${stats.avg >= 80 ? 'text-green-600' : 'text-blue-600'}`}>{stats.avg}%</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-xs text-gray-400 italic p-4">No quiz records found.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Assignment Performance */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        Assignment Scores by Subject
                                    </h3>
                                    <div className="space-y-3">
                                        {Object.entries(selectedStudent.assignments).length > 0 ? Object.entries(selectedStudent.assignments).map(([subject, stats]) => (
                                            <div key={subject} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-blue-100 transition-all">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{subject}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{stats.count} Submissions</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-blue-700">{stats.avg}%</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-xs text-gray-400 italic p-4">No assignment records found.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <span>Official Academic Record • Iinkiito LMS</span>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="px-6 py-2" onClick={() => window.print()}>Print / Download PDF</Button>
                                    <Button variant="outline" className="px-6 py-2" onClick={exportStudentToCSV}>Export CSV</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}