import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function AdminGrades() {
    // Mock data for student progress overview
    const studentsProgress = [
        { id: 1, name: 'John Doe', admission: 'IM-2026-001', level: 'Grade 10', average: 88, status: 'Excellent', flagged: false },
        { id: 2, name: 'Jane Smith', admission: 'IM-2026-002', level: 'Grade 10', average: 74, status: 'Good', flagged: false },
        { id: 3, name: 'Michael Johnson', admission: 'IM-2026-003', level: 'Form 3', average: 45, status: 'At Risk', flagged: true },
        { id: 4, name: 'Sarah Williams', admission: 'IM-2026-004', level: 'Form 3', average: 92, status: 'Excellent', flagged: false },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gradebook & Progress</h1>
                    <p className="text-gray-500 mt-1">Track student performance across all curriculums and identify at-risk learners.</p>
                </div>
                <Button variant="outline">
                    Export Gradebook (CSV)
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">450</p>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">School Average</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">68%</p>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Missing Assignments</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
                </Card>
                <Card className="border-l-4 border-l-red-500 bg-red-50">
                    <p className="text-sm text-red-600 font-bold uppercase tracking-wider">At Risk Students</p>
                    <p className="text-2xl font-bold text-red-700 mt-1">12</p>
                </Card>
            </div>

            <Card noPadding={true} className="overflow-hidden border border-gray-200 shadow-sm mt-8">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex gap-2">
                        <input type="text" placeholder="Search student name or admission..." className="border border-gray-300 rounded-md text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white w-64" />
                        <select className="border border-gray-300 rounded-md text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                            <option>All Levels</option>
                            <option>Grade 10</option>
                            <option>Form 3</option>
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
                            {studentsProgress.map((student) => (
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
                                        <button className="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition-colors">
                                            View Report Card
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}