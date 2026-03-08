import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function SubjectList() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const subjects = user?.subjects || [];

    return (
        <div className="max-w-7xl mx-auto space-y-5 pb-24 animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-school-primary/5 rounded-full blur-3xl group-hover:bg-school-primary/10 transition-all duration-1000"></div>

                <div className="flex flex-col md:flex-row items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-school-secondary rounded-xl flex items-center justify-center text-white shadow-sm transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-2 h-2 rounded-full bg-school-primary animate-pulse"></span>
                            <span className="text-xs font-semibold text-gray-400 uppercase italic">My Subjects</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-none">
                            My Subjects
                        </h1>
                    </div>
                </div>

                <div className="relative z-10 bg-gray-50 px-5 py-5 rounded-xl border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase italic text-center md:text-right">
                        You are enrolled in <span className="text-school-primary">{subjects.length}</span> subject(s), {user?.name?.split(' ')[0]}
                    </p>
                </div>
            </div>

            {subjects.length === 0 ? (
                <div className="bg-white p-4 text-center rounded-2xl shadow-sm border border-gray-50 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-300">
                    <div className="w-12 h-12 bg-red-50 text-school-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm transform hover:scale-110 transition-transform duration-500">
                        <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">No Subjects Yet</h3>
                        <p className="text-gray-400 font-bold text-xs italic leading-relaxed">Your subjects will appear here once enrolled by your administrator.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((subject) => {
                        const progress = ((subject.id * 23) % 60) + 20;
                        return (
                            <Card
                                key={subject.id}
                                className="group relative border-none shadow-sm hover:shadow-school-primary/10 hover:scale-[1.02] active:scale-95 transition-all duration-500 rounded-2xl flex flex-col h-full bg-white border border-gray-100 overflow-hidden cursor-pointer"
                                onClick={() => navigate(`/student/subjects/${subject.id}`)}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                                    <span className="text-8xl font-black uppercase">{subject.name.charAt(0)}</span>
                                </div>

                                <div className="p-4">
                                    <div className="bg-gray-50 rounded-xl p-4 mb-8 flex flex-col items-center justify-center text-center gap-6 border border-gray-100/50 transition-all duration-500 group-hover:bg-red-50 group-hover:border-red-100 group-hover:shadow-inner">
                                        <div className="w-9 h-9 bg-white rounded-2xl flex items-center justify-center text-school-primary shadow-sm shadow-gray-100 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 border border-gray-100">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-school-primary transition-colors leading-none">{subject.name}</h3>
                                        <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100 italic flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active Link
                                        </span>
                                    </div>
                                </div>

                                <div className="px-4 pb-10 flex-1 flex flex-col justify-end space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-semibold text-gray-400 group-hover:text-school-primary transition-colors">Progress</span>
                                            <span className="text-xs font-semibold text-school-secondary italic">{progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner border border-gray-100">
                                            <div
                                                className="h-full bg-school-primary rounded-full transition-all duration-1000 group-hover:scale-x-105 origin-left"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-white text-gray-900 border border-gray-100 hover:bg-school-secondary hover:text-white hover:border-school-secondary hover:scale-[1.05] font-black uppercase text-[10px] py-5 rounded-lg shadow-sm shadow-gray-100 group-hover:shadow-indigo-100 transition-all duration-500 italic"
                                    >
                                        Open Subject →&rarr;
                                    </Button>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-school-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
