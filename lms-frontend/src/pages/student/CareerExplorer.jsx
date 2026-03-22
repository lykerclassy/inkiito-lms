import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageLoader from '../../components/common/PageLoader';

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

                // Fetch pathways directly to ensure we have all 3
                const pRes = await api.get('pathways');
                setPathways(pRes.data);
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
                .map(c => c.career_track?.name || c.track || 'General Core')
        )]
        : [];

    const finalCareers = (selectedPathway && selectedTrack)
        ? careers.filter(c =>
            c.pathway_id === selectedPathway.id &&
            ((c.career_track?.name === selectedTrack) || (!c.career_track && c.track === selectedTrack) || (!c.career_track && !c.track && selectedTrack === 'General Core'))
        )
        : [];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Contextual Header Section */}
            <div className="flex flex-col md:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="flex flex-col md:flex-row items-center gap-5 relative z-10">
                    <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-gray-200 rotate-3 transition-transform duration-500 group-hover:rotate-0">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-school-primary uppercase tracking-widest">Inkiito Career Hub</span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Pathway Explorer</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-400">
                        <span onClick={() => { setStep(1); setSelectedPathway(null); setSelectedTrack(null); }} className={`cursor-pointer ${step === 1 ? 'text-gray-900' : 'hover:text-gray-600'}`}>Pathways</span>
                        <span className="opacity-30">/</span>
                        <span onClick={() => { if(step >= 2) {setStep(2); setSelectedTrack(null);} }} className={`cursor-pointer ${step === 2 ? 'text-gray-900' : 'hover:text-gray-600'}`}>Tracks</span>
                        <span className="opacity-30">/</span>
                        <span className={`${step === 3 ? 'text-gray-900' : ''}`}>Careers</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <PageLoader message="Analyzing Career Trajectories..." color="blue" />
            ) : (
                <div className="relative">

                    {/* STEP 1: SELECT THE 3 DEFINED PATHWAYS */}
                    {step === 1 && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
                            <div className="mb-8 text-center max-w-2xl mx-auto">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Select Your Core Focus</h2>
                                <p className="text-sm text-gray-500 font-medium">Choose one of the three primary pathways defined by the Ministry of Education.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {pathways.map(pw => (
                                    <div
                                        key={pw.id}
                                        onClick={() => { setSelectedPathway(pw); setStep(2); }}
                                        className="group bg-white rounded-[2.5rem] p-8 border-2 border-transparent shadow-sm hover:shadow-2xl hover:border-gray-900 cursor-pointer transition-all duration-500 transform hover:-translate-y-2 flex flex-col items-center text-center"
                                    >
                                        <div
                                            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-inner transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6"
                                            style={{ backgroundColor: `${pw.color_code === 'blue' ? '#3b82f6' : pw.color_code === 'emerald' ? '#10b981' : '#f59e0b'}`, color: '#fff' }}
                                        >
                                            {pw.name === 'STEM' && <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.288a2 2 0 01-1.645.033l-2.257-.903a2 2 0 00-1.393-.051l-2.99 1.07a2 2 0 00-1.217 2.216L4.85 21a2 2 0 001.962 1.5h10.376a2 2 0 001.962-1.5l1.277-5.572a2 2 0 00-.999-2.5zm-5.428-5.428a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                                            {pw.name === 'Social Sciences' && <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                                            {pw.name === 'Art and Sports' && <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-4">{pw.name}</h3>
                                        <p className="text-sm text-gray-500 font-bold leading-relaxed mb-8">
                                            {pw.description}
                                        </p>
                                        <div className="mt-auto px-6 py-3 bg-gray-50 text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-gray-900 group-hover:text-white transition-all transform active:scale-95">
                                            Select Foundation
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: SELECT TRACK WITHIN PATHWAY */}
                    {step === 2 && selectedPathway && (
                        <div className="animate-in slide-in-from-right-8 duration-500 fade-in">
                            <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Select a Specialty Track</h2>
                                    <p className="text-sm text-gray-500 font-medium">Focused specializations within the <span className="text-gray-900 font-black uppercase">{selectedPathway.name}</span> pathway.</p>
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 bg-white text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl border border-gray-100 shadow-sm hover:text-gray-900 transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                    Back to Foundations
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availableTracks.map((trackName, idx) => {
                                    const count = careers.filter(c => c.pathway_id === selectedPathway.id && (c.track === trackName || (!c.track && trackName === 'General Core'))).length;
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => { setSelectedTrack(trackName); setStep(3); }}
                                            className="group bg-white rounded-3xl p-8 border-l-8 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-500 transform hover:-translate-y-1 flex items-center justify-between"
                                            style={{ borderLeftColor: `${selectedPathway.color_code === 'blue' ? '#3b82f6' : selectedPathway.color_code === 'emerald' ? '#10b981' : '#f59e0b'}` }}
                                        >
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 uppercase tracking-tight">{trackName}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                        {count} Available Careers
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-gray-900 group-hover:text-white transition-all transform group-hover:rotate-12">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: VIEW CAREERS */}
                    {step === 3 && selectedTrack && selectedPathway && (
                        <div className="animate-in slide-in-from-right-8 duration-500 fade-in">
                            <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Career Catalog</h2>
                                    <p className="text-sm text-gray-500 font-medium">Displaying qualified paths for <span className="text-gray-900 font-black uppercase">{selectedTrack}</span>.</p>
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-6 py-3 bg-white text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl border border-gray-100 shadow-sm hover:text-gray-900 transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                    Back to Tracks
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {finalCareers.map(career => (
                                    <Card key={career.id} className="border border-gray-100 shadow-sm p-0 overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col bg-white rounded-[2rem] group">
                                        
                                        <div className="p-8 flex-1">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter mb-1 uppercase italic">{career.name}</h3>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{selectedTrack} Spec</span>
                                                </div>
                                                {career.outlook && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white bg-gray-900 px-3 py-1.5 rounded-full">
                                                        {career.outlook} Outlook
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="text-sm text-gray-500 font-bold leading-relaxed line-clamp-3 mb-8">
                                                {career.description}
                                            </p>

                                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Est. Salary</span>
                                                    <p className="text-sm font-black text-gray-900">{career.salary_range || 'Competitive'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Rank</span>
                                                    <p className="text-sm font-black text-gray-900">Alpha Grade</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 pt-0 mt-auto">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Required Subject Mastery</h4>
                                            
                                            <div className="flex flex-wrap gap-2 mb-8">
                                                {career.subjects?.map(sub => (
                                                    <span 
                                                        key={sub.id}
                                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border flex items-center gap-2 ${sub.pivot.is_mandatory 
                                                            ? 'bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-200' 
                                                            : 'bg-white text-gray-600 border-gray-100'
                                                        }`}
                                                    >
                                                        {sub.name}
                                                    </span>
                                                ))}
                                            </div>

                                            <Button 
                                                onClick={() => handleSetGoal(career.id)}
                                                className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${user?.target_career_id === career.id 
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200' 
                                                    : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'
                                                }`}
                                            >
                                                {user?.target_career_id === career.id ? '★ Target Locked' : 'Select Pathway'}
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
