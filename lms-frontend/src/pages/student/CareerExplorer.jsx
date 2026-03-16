import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function CareerExplorer() {
    const { user } = useContext(AuthContext);
    const [careers, setCareers] = useState([]);
    const [pathways, setPathways] = useState([]);
    const [loading, setLoading] = useState(true);

    // Flow State
    const [step, setStep] = useState(1);
    const [selectedPathway, setSelectedPathway] = useState(null);
    const [selectedTrack, setSelectedTrack] = useState(null);

    useEffect(() => {
        const fetchCareers = async () => {
            try {
                // Fetch all careers (which include the pathway relationship)
                const response = await api.get('careers');
                const fetchedCareers = response.data;
                setCareers(fetchedCareers);

                // Extract unique pathways
                const uniquePathways = [];
                const pathwaySet = new Set();
                fetchedCareers.forEach(career => {
                    const pw = career.pathway;
                    if (pw && !pathwaySet.has(pw.id)) {
                        pathwaySet.add(pw.id);
                        uniquePathways.push(pw);
                    }
                });

                setPathways(uniquePathways);
            } catch (error) {
                console.error('Failed to fetch careers:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCareers();
    }, []);

    const handleSetGoal = async (careerId) => {
        try {
            await api.post('careers/set-goal', { career_id: careerId });
            alert("Career goal updated successfully!");
        } catch (error) {
            console.error("Failed to set career goal:", error);
            alert("Could not set career goal.");
        }
    };

    // Derived Data
    const availableTracks = selectedPathway
        ? [...new Set(
            careers
                .filter(c => c.pathway_id === selectedPathway.id)
                .map(c => c.track || 'General Core') // fallback for careers with no track
        )]
        : [];

    const finalCareers = (selectedPathway && selectedTrack)
        ? careers.filter(c =>
            c.pathway_id === selectedPathway.id &&
            (c.track === selectedTrack || (!c.track && selectedTrack === 'General Core'))
        )
        : [];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Contextual Header Section */}
            <div className="flex flex-col md:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-school-primary/5 rounded-full blur-3xl group-hover:bg-school-primary/10 transition-all duration-1000"></div>

                <div className="flex flex-col md:flex-row items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-school-secondary rounded-xl flex items-center justify-center text-white shadow-sm transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            <span className="text-xs font-semibold text-gray-400 uppercase italic">Future Focus</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-none">
                            Career Explorer
                        </h1>
                    </div>
                </div>

                <div className="relative z-10 bg-gray-50 px-5 py-5 rounded-xl border border-gray-100 flex items-center justify-between gap-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase italic text-center md:text-right hidden sm:block">
                        Discover your <span className="text-school-primary">Path</span>, {user?.name?.split(' ')[0]}
                    </p>

                    {/* Interactive Breadcrumb Nav */}
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 select-none">
                        <span
                            onClick={() => { setStep(1); setSelectedPathway(null); setSelectedTrack(null); }}
                            className={`cursor-pointer transition-colors hover:text-school-primary ${step === 1 ? 'text-school-primary' : ''}`}
                        >
                            Pathways
                        </span>
                        {step >= 2 && selectedPathway && (
                            <>
                                <span>/</span>
                                <span
                                    onClick={() => { setStep(2); setSelectedTrack(null); }}
                                    className={`cursor-pointer transition-colors hover:text-school-primary ${step === 2 ? 'text-school-primary' : ''}`}
                                >
                                    Tracks
                                </span>
                            </>
                        )}
                        {step === 3 && selectedTrack && (
                            <>
                                <span>/</span>
                                <span className={`text-school-primary`}>Careers</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="bg-white p-8 text-center rounded-2xl shadow-sm border border-gray-50">
                    <div className="w-12 h-12 border-4 border-school-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : pathways.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-2xl shadow-sm border border-gray-50">
                    <div className="w-16 h-16 bg-indigo-50 text-school-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 transform hover:scale-110 transition-transform duration-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Explore Your Future</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto italic">
                        No pathways configured just yet. Check back soon!
                    </p>
                </div>
            ) : (
                <div className="relative">

                    {/* STEP 1: SELECT PATHWAY */}
                    {step === 1 && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 px-2 tracking-tight">1. Choose a Pathway</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {pathways.map(pw => (
                                    <div
                                        key={pw.id}
                                        onClick={() => { setSelectedPathway(pw); setStep(2); }}
                                        className="group bg-white rounded-3xl p-6 border-2 border-transparent shadow-sm hover:shadow-xl hover:border-school-primary/20 cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                                            style={{ backgroundColor: pw.color_code || '#4b4da3', color: '#fff' }}
                                        >
                                            {/* Dynamic Icon Rendering - Fallback to briefcase if none provided */}
                                            {pw.icon ? (
                                                <i className={`${pw.icon} text-3xl`}></i>
                                            ) : (
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2 group-hover:text-school-primary transition-colors">{pw.name}</h3>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-3">
                                            {pw.description || 'Explore careers in this major discipline.'}
                                        </p>
                                        <div className="mt-6 flex items-center text-sm font-bold tracking-widest uppercase text-school-primary group-hover:text-school-secondary transition-colors">
                                            Explore Pathway
                                            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: SELECT TRACK */}
                    {step === 2 && selectedPathway && (
                        <div className="animate-in slide-in-from-right-8 duration-500 fade-in">
                            <div className="mb-6 px-2 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">2. Select a Specialization Track</h2>
                                    <p className="text-sm text-gray-500">Pick a focused track within {selectedPathway.name}</p>
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-700 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    Back
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availableTracks.map((trackName, idx) => {
                                    const count = careers.filter(c => c.pathway_id === selectedPathway.id && (c.track === trackName || (!c.track && trackName === 'General Core'))).length;
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => { setSelectedTrack(trackName); setStep(3); }}
                                            className="group bg-white rounded-3xl p-6 border-l-4 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-between"
                                            style={{ borderLeftColor: selectedPathway.color_code || '#4b4da3' }}
                                        >
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{trackName}</h3>
                                                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                                                    {count} {count === 1 ? 'Career' : 'Careers'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-school-primary group-hover:text-white transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: VIEW CAREERS & SUBJECTS */}
                    {step === 3 && selectedTrack && selectedPathway && (
                        <div className="animate-in slide-in-from-right-8 duration-500 fade-in">
                            <div className="mb-6 px-2 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">3. Explore Careers</h2>
                                    <p className="text-sm text-gray-500">Showing careers in {selectedPathway.name} • {selectedTrack}</p>
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-700 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    Back to Tracks
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {finalCareers.map(career => (
                                    <Card key={career.id} className="border border-gray-100 shadow-sm p-0 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">

                                        <div className="p-6 bg-white flex-1 border-b border-gray-50">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">{career.name}</h3>
                                                {career.outlook && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex-shrink-0">
                                                        {career.outlook} Outlook
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed mb-5">
                                                {career.description || 'A potential career pathway based on your studies.'}
                                            </p>

                                            {/* Career Meta Metadata */}
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                {career.salary_range && (
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Salary Est.
                                                        </span>
                                                        <p className="text-sm font-semibold text-gray-800">{career.salary_range}</p>
                                                    </div>
                                                )}
                                                {career.qualifications && (
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1.732V4a2 2 0 012 2v10m-3 0a2 2 0 002-2V4M10 4h4" /></svg>
                                                            Degree Req.
                                                        </span>
                                                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{career.qualifications}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Subject Combinations */}
                                        <div className="bg-gray-50/80 p-6 flex-shrink-0">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Target Subject Combination</h4>

                                            {(!career.subjects || career.subjects.length === 0) ? (
                                                <p className="text-xs text-gray-400 italic">No specific subject requirements listed.</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2 mb-6">
                                                    {career.subjects.map(sub => (
                                                        <span
                                                            key={sub.id}
                                                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${sub.pivot.is_mandatory
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-500/10'
                                                                : 'bg-white text-gray-600 border-gray-200'
                                                                }`}
                                                        >
                                                            {sub.pivot.is_mandatory && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>}
                                                            {sub.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <Button
                                                onClick={() => handleSetGoal(career.id)}
                                                className={`w-full font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-all shadow-md ${user?.target_career_id === career.id
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30'
                                                    : 'bg-school-primary text-white hover:bg-school-primary/90 shadow-school-primary/30'
                                                    }`}
                                            >
                                                {user?.target_career_id === career.id ? '★ Current Goal' : 'Set as Goal'}
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
