import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ProgressBar from '../../components/common/ProgressBar';
import EnrollmentIndicator from '../../components/common/EnrollmentIndicator';

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Mock data for the dashboard overview to showcase the UI components.
    // Later, this will be fetched dynamically via Axios.
    const recentActivity = {
        subject: "Computer Studies",
        unit: "Foundations of Computer Systems",
        lesson: "Evolution of Mechanical Computers",
        progress: 65,
    };

    // Load enrolled subjects dynamically from User context payload
    const enrolledSubjects = user?.subjects?.map(s => ({
        id: s.id,
        name: s.name,
        status: s.pivot?.status || 'active',
        progress: Math.floor(Math.random() * 40) + 20 // Mocking progress visually for UI pending backend tracker
    })) || [];

    return (
        <div className="space-y-6">

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-8 text-white shadow-md">
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
                <p className="text-blue-100 text-lg max-w-2xl">
                    You are making great progress in your {user?.curriculum?.name} curriculum. Let's pick up right where you left off.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Up Next & Quick Stats (Takes up 2/3 of the screen on desktop) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Up Next Widget */}
                    <Card title="Up Next" subtitle="Continue your latest module">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div className="flex-1">
                                <div className="text-sm text-blue-600 font-semibold mb-1 uppercase tracking-wider">
                                    {recentActivity.subject}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {recentActivity.lesson}
                                </h3>
                                <p className="text-gray-500 text-sm mb-4">
                                    Unit: {recentActivity.unit}
                                </p>
                                <ProgressBar progress={recentActivity.progress} label="Module Progress" />
                            </div>
                            <div className="w-full md:w-auto mt-4 md:mt-0 flex-shrink-0">
                                <Button
                                    onClick={() => navigate('/student/subjects/1')}
                                    className="w-full md:w-auto px-8"
                                >
                                    Resume Lesson
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Upcoming Tasks Widget */}
                    <Card title="Upcoming Deadlines">
                        <div className="space-y-4">
                            {/* Example Task 1 */}
                            <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 transition-colors hover:bg-white hover:border-blue-100 hover:shadow-sm">
                                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">
                                    12
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">HTML Structure Assignment</h4>
                                    <p className="text-sm text-gray-500">Computer Studies • Due in 2 days</p>
                                </div>
                                <Button variant="outline" size="sm">Start</Button>
                            </div>
                            {/* Example Task 2 */}
                            <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 transition-colors hover:bg-white hover:border-blue-100 hover:shadow-sm">
                                <div className="w-12 h-12 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">
                                    15
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">Napier's Bones Quiz</h4>
                                    <p className="text-sm text-gray-500">Computer Studies • Due next week</p>
                                </div>
                                <Button variant="secondary" size="sm">Review</Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Subject Overview & Career Goal */}
                <div className="space-y-6">
                    {user?.target_career && (
                        <Card className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 text-white p-0 overflow-hidden border-none shadow-2xl">
                            <div className="p-8 space-y-6 relative">
                                <div className="absolute top-4 right-4 opacity-10">
                                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">North Star Goal</p>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">{user.target_career.name}</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Entry Pathway</p>
                                        <p className={`text-[10px] font-black px-3 py-1 bg-white/10 rounded-lg text-white`}>{user.target_career.pathway.name}</p>
                                    </div>
                                    <div className="pt-4 border-t border-white/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Subject Coverage</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {enrolledSubjects.map(s => (
                                                <span key={s.id} className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" title={s.name} />
                                            ))}
                                            {/* Fill the rest with placeholders if needed, but for now just showing enrollment */}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="secondary"
                                    className="w-full bg-white text-indigo-900 border-none hover:bg-indigo-50 font-black uppercase text-[10px] tracking-widest py-3"
                                    onClick={() => navigate('/student/future-focus')}
                                >
                                    Adjust Goal
                                </Button>
                            </div>
                        </Card>
                    )}

                    <Card title="My Subjects" subtitle="Current Enrollment">
                        <div className="space-y-5">
                            {enrolledSubjects.length === 0 ? (
                                <div className="text-sm text-gray-500 italic text-center py-4">
                                    You have not been assigned to any subjects yet.
                                </div>
                            ) : (
                                enrolledSubjects.map((subject) => (
                                    <div key={subject.id} className="group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <EnrollmentIndicator status={subject.status} />
                                                <span className={`font-medium ${subject.status === 'dropped' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                    {subject.name}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-gray-500">
                                                {subject.status === 'active' ? `${subject.progress}%` : ''}
                                            </span>
                                        </div>
                                        {subject.status === 'active' && (
                                            <ProgressBar progress={subject.progress} showPercentage={false} />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => navigate('/student/subjects')}
                                className="text-sm text-blue-600 font-semibold hover:text-blue-800"
                            >
                                View All Subjects &rarr;
                            </button>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
}