import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EnrollmentIndicator from '../../components/common/EnrollmentIndicator';
import ProgressBar from '../../components/common/ProgressBar';

export default function SubjectList() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Securely read assigned user subjects directly from internal token payload context.
    // This fully isolates the list and prevents random fetch access to opposing curriculums.
    const subjects = user?.subjects || [];

    // Component logic shifts straight to rendering as state is handled at router level

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