import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';

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

                // 1. Group the individual quiz results by Subject
                const subjectStats = {};
                let totalCorrectAll = 0;
                let totalQuestionsAll = rawResults.length;

                rawResults.forEach(result => {
                    // Laravel converts camelCase relations to snake_case in JSON by default
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

                // 2. Calculate percentages and grades for each subject
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

                // 3. Sort subjects to find the best and worst for the summary cards
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

    if (isLoading) return <div className="p-8 text-gray-500 font-medium">Calculating your grades...</div>;
    if (error) return <div className="p-8 text-red-500 font-medium">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Academic Performance</h1>
                <p className="text-gray-500 mt-1">Review your continuous assessment grades and termly summaries.</p>
            </div>

            {grades.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 border-gray-300">
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Grades Yet</h3>
                    <p className="text-gray-500">You haven't completed any interactive quizzes yet. Head over to your subjects and start learning to generate your report card!</p>
                </Card>
            ) : (
                <>
                    {/* Performance Overview Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-md">
                            <h3 className="text-blue-100 font-medium text-sm uppercase tracking-wider">Overall Average</h3>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold">{summary.average}%</span>
                            </div>
                            <p className="mt-2 text-sm text-blue-200">Across all completed quizzes</p>
                        </Card>

                        <Card className="border-l-4 border-l-green-500 shadow-sm">
                            <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Top Subject</h3>
                            <div className="mt-2">
                                <span className="text-2xl font-bold text-gray-900">{summary.topSubject}</span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-green-600">Excellent progress</p>
                        </Card>

                        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                            <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wider">Needs Attention</h3>
                            <div className="mt-2">
                                <span className="text-2xl font-bold text-gray-900">{summary.needsAttention}</span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-yellow-600">Review past lessons</p>
                        </Card>
                    </div>

                    {/* Detailed Grades Table */}
                    <Card noPadding={true} className="overflow-hidden border border-gray-200 shadow-sm mt-8">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">Subject Breakdown</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Subject</th>
                                        <th className="px-6 py-4 text-center">Questions Correct</th>
                                        <th className="px-6 py-4 text-center">Score</th>
                                        <th className="px-6 py-4 text-center">Grade</th>
                                        <th className="px-6 py-4">CBC Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {grades.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">{item.subject}</td>
                                            <td className="px-6 py-4 text-center font-medium text-gray-700">{item.fraction}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 max-w-[100px] mx-auto overflow-hidden">
                                                    <div 
                                                        className={`h-2.5 rounded-full transition-all duration-1000 ${item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-blue-500' : 'bg-yellow-500'}`} 
                                                        style={{ width: `${item.score}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-medium">{item.score}%</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                    item.grade.includes('A') ? 'bg-green-100 text-green-700' :
                                                    item.grade.includes('B') ? 'bg-blue-100 text-blue-700' :
                                                    item.grade.includes('C') ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.grade}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 italic text-gray-500">{item.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}