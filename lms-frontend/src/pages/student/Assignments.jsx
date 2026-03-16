import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CardSkeleton } from '../../components/common/Skeleton';
import MathText from '../../components/common/MathText';

export default function Assignments() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAssignments = async () => {
        try {
            const response = await api.get('student/assignments');
            const processedAssignments = response.data.map(assignment => {
                const mySubmission = assignment.submissions && assignment.submissions.length > 0 ? assignment.submissions[0] : null;
                return { ...assignment, mySubmission, status: mySubmission ? 'completed' : 'pending' };
            });
            setAssignments(processedAssignments);
        } catch (err) { setError("Could not load your assignments."); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchAssignments(); }, []);

    const toggleExpand = (assignment) => {
        navigate(`/student/assignments/${assignment.id}`);
    };

    const getBlocks = (contentString) => {
        try { return typeof contentString === 'string' ? JSON.parse(contentString) : (contentString || []); }
        catch (e) { return []; }
    };

    const filteredAssignments = assignments.filter(a => a.status === activeTab);

    if (isLoading) {
        return (
            <div className="space-y-4 animate-in fade-in duration-500">
                <CardSkeleton />
                <div className="grid grid-cols-1 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }
    if (error) return <div className="p-4 bg-red-50 text-school-primary font-black rounded-xl border border-red-100">{error}</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-5 pb-20 animate-in fade-in duration-300">

            {/* High-Impact Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-school-primary animate-pulse"></div>
                        <span className="text-xs font-semibold text-gray-400 uppercase">My Assignments</span>
                    </div>
                    <h1 className="text-4xl lg:text-2xl font-bold text-gray-900 leading-none">
                        Assignments
                    </h1>
                </div>
            </div>

            <Card noPadding={true} className="overflow-hidden border-none shadow-sm rounded-2xl bg-white border border-gray-100">
                {/* Visual Tab System */}
                <div className="flex p-2 bg-gray-50/50">
                    <button
                        className={`flex-1 py-4 rounded-lg font-semibold uppercase text-[10px] italic transition-all ${activeTab === 'pending' ? 'bg-white text-school-primary shadow-sm shadow-red-50 border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending ({assignments.filter(a => a.status === 'pending').length})
                    </button>
                    <button
                        className={`flex-1 py-4 rounded-lg font-semibold uppercase text-[10px] italic transition-all ${activeTab === 'completed' ? 'bg-white text-school-secondary shadow-sm shadow-indigo-50 border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed ({assignments.filter(a => a.status === 'completed').length})
                    </button>
                </div>

                <div className="divide-y divide-gray-50 bg-white">
                    {filteredAssignments.length === 0 ? (
                        <div className="p-6 text-center">
                            <div className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-400">No assignments in this category</h3>
                        </div>
                    ) : (
                        filteredAssignments.map((assignment) => {
                            const blocks = getBlocks(assignment.content);

                            return (
                                <div key={assignment.id} className="group flex flex-col transition-all">
                                    {/* Assessment Summary Item */}
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer group-hover:bg-gray-50/50 transition-all border-b border-gray-50/50" onClick={() => toggleExpand(assignment)}>
                                        <div className="flex items-center gap-6">
                                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-3 ${assignment.status === 'pending' ? 'bg-school-primary text-white shadow-red-100' : 'bg-school-secondary text-white shadow-indigo-100'}`}>
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 italic uppercase tracking-tight group-hover:text-school-primary transition-colors"><MathText text={assignment.title} /></h3>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-xs font-semibold text-gray-400">{assignment.subject?.name}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span className={`text-xs font-semibold text-gray-500 ${assignment.status === 'pending' ? 'text-red-500' : 'text-indigo-500'}`}>
                                                        {assignment.status === 'pending' ? `Due: ${assignment.due_date}` : `Submitted`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {assignment.mySubmission?.status === 'graded' && (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-semibold text-gray-400 mb-1 italic">Score</span>
                                                    <span className="bg-school-accent text-gray-900 text-sm font-semibold px-5 py-2 rounded-full shadow-lg shadow-yellow-100 italic">{assignment.mySubmission.score}%</span>
                                                </div>
                                            )}
                                            {assignment.mySubmission?.status === 'submitted' && (
                                                <span className="px-4 py-2 bg-indigo-50 text-school-secondary rounded-full font-black text-[10px] border border-indigo-100">Awaiting Grade</span>
                                            )}
                                            <Button
                                                className={`font-black uppercase text-[10px] px-5 rounded-xl h-12 ${assignment.status === 'pending' ? 'bg-school-primary shadow-red-50 shadow-lg text-white' : 'bg-white text-gray-500 border-gray-200 border hover:bg-gray-50'}`}
                                            >
                                                {assignment.status === 'pending' ? 'Start Assignment' : 'View Submission'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>
        </div>
    );
}
