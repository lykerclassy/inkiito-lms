import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EnrollmentIndicator from '../../components/common/EnrollmentIndicator';
import ProgressBar from '../../components/common/ProgressBar';

export default function SubjectList() {
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                // Fetch the subjects for the currently logged-in student
                const response = await api.get('/subjects');
                setSubjects(response.data);
            } catch (err) {
                console.error("Failed to fetch subjects:", err);
                setError('Could not load your subjects. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 font-medium">Loading your subjects...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
                <p>{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>
                    <p className="text-gray-500 mt-1">Select a subject to view its syllabus and continue learning.</p>
                </div>
            </div>

            {subjects.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">No subjects found</h3>
                    <p className="text-gray-500 mt-2">You have not been assigned to any subjects yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((subject) => (
                        <Card key={subject.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <EnrollmentIndicator status="active" />
                                    <h3 className="text-xl font-bold text-gray-800">{subject.name}</h3>
                                </div>
                            </div>
                            
                            <div className="mb-6 flex-1">
                                {/* Since we don't have real progress calculations in the backend yet, 
                                    we mock a progress value to demonstrate the UI */}
                                <ProgressBar progress={0} label="Course Completion" />
                            </div>

                            <Button 
                                onClick={() => navigate(`/student/subjects/${subject.id}`)}
                                className="w-full"
                                variant="outline"
                            >
                                View Syllabus &rarr;
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}