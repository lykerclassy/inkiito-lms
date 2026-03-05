import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ProgressBar from '../../components/common/ProgressBar';

export default function SubjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [subject, setSubject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSubjectDetails = async () => {
            try {
                // This single call fetches the Subject, Units, Sub-Units, and Lessons
                const response = await api.get(`/subjects/${id}`);
                setSubject(response.data);
            } catch (err) {
                console.error("Failed to fetch subject details:", err);
                setError('Could not load the syllabus. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubjectDetails();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 font-medium">Loading syllabus...</p>
            </div>
        );
    }

    if (error || !subject) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
                <p>{error || 'Subject not found.'}</p>
                <Button onClick={() => navigate('/student/subjects')} className="mt-4" variant="outline">
                    &larr; Back to Subjects
                </Button>
            </div>
        );
    }

    // Safely handle Laravel's JSON serialization (camelCase relation becomes snake_case array key)
    const units = subject.units || [];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            
            {/* Subject Header */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <button 
                        onClick={() => navigate('/student/subjects')}
                        className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 mb-3 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Subjects
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
                    <p className="text-gray-500 mt-2">Master the concepts step-by-step.</p>
                </div>
                <div className="w-full md:w-64 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <ProgressBar progress={0} label="Overall Course Progress" />
                </div>
            </div>

            {/* Syllabus Content */}
            <div className="space-y-6">
                {units.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800">No content available yet</h3>
                        <p className="text-gray-500 mt-2">Your teacher is still preparing the syllabus for this subject.</p>
                    </div>
                ) : (
                    units.map((unit, index) => {
                        const subUnits = unit.sub_units || unit.subUnits || [];
                        
                        return (
                            <Card key={unit.id} className="overflow-visible">
                                {/* Unit Header */}
                                <div className="border-b border-gray-100 pb-4 mb-4">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                                            {index + 1}
                                        </span>
                                        {unit.title}
                                    </h2>
                                </div>

                                {/* Sub-Units & Lessons */}
                                {subUnits.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic px-4">No topics added to this unit yet.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {subUnits.map((subUnit) => {
                                            const lessons = subUnit.lessons || [];
                                            
                                            return (
                                                <div key={subUnit.id} className="pl-4 md:pl-11">
                                                    <h3 className="text-lg font-semibold text-gray-700 mb-3 border-l-2 border-blue-500 pl-3">
                                                        {subUnit.title}
                                                    </h3>
                                                    
                                                    {lessons.length === 0 ? (
                                                        <p className="text-sm text-gray-500 italic pl-4">No lessons published yet.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {lessons.map((lesson, lessonIndex) => (
                                                                <div 
                                                                    key={lesson.id}
                                                                    onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                                                                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm hover:border-blue-200 cursor-pointer transition-all group"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                                                                                {lessonIndex + 1}. {lesson.title}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        Start &rarr;
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}