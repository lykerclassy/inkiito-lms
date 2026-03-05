import React, { useState, useEffect, useContext } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

export default function CareerExplorer() {
    const { user } = useContext(AuthContext);
    const [pathways, setPathways] = useState([]);
    const [careers, setCareers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedPathway, setSelectedPathway] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [basket, setBasket] = useState([]); // Selected subjects for reverse engineering
    const [qualifiedCareers, setQualifiedCareers] = useState([]);
    const { setUser } = useContext(AuthContext); // To update the goal in context
    const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'reverse'
    const [loading, setLoading] = useState(true);
    const [selectedCareerDetails, setSelectedCareerDetails] = useState(null);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const [pRes, cRes, sRes] = await Promise.all([
                api.get('/pathways'),
                api.get('/careers'),
                api.get('/subjects') // Fixed from /subject to /subjects
            ]);
            setPathways(pRes.data);
            setCareers(cRes.data);
            setSubjects(sRes.data);
        } catch (err) {
            console.error("Failed to fetch career resources", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePathwayClick = (pathway) => {
        setSelectedPathway(pathway === selectedPathway ? null : pathway);
    };

    const toggleBasketSubject = (subject) => {
        if (basket.find(s => s.id === subject.id)) {
            setBasket(basket.filter(s => s.id !== subject.id));
        } else {
            setBasket([...basket, subject]);
        }
    };

    useEffect(() => {
        if (activeTab === 'reverse') {
            calculateMatches();
        }
    }, [basket, activeTab]);

    const calculateMatches = () => {
        const basketIds = basket.map(s => s.id);
        const matches = careers.filter(career => {
            const mandatoryIds = career.subjects
                .filter(s => s.pivot.is_mandatory)
                .map(s => s.id);
            if (mandatoryIds.length === 0) return true;
            return mandatoryIds.every(id => basketIds.includes(id));
        });
        setQualifiedCareers(matches);
    };

    const handleSetGoal = async (careerId) => {
        try {
            const res = await api.post('/careers/set-goal', { career_id: careerId });
            setUser(res.data.user);
            alert("North Star Goal Set! You can now track your progress on the dashboard.");
        } catch (err) {
            alert("Failed to set career goal.");
        }
    };

    const filteredCareers = careers.filter(career => {
        const matchesPathway = selectedPathway ? career.pathway_id === selectedPathway.id : true;
        const matchesSearch = career.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesPathway && matchesSearch;
    });

    if (loading) return <div className="p-20 text-center font-black text-gray-400">Charting Future Pathways...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-24">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-50">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 rotate-3">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Future Focus Explorer</h1>
                        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Kenyan CBC Career Guidance & Subject Mapping</p>
                    </div>
                </div>
                <div className="flex bg-gray-100 p-2 rounded-3xl self-start md:self-center">
                    {[
                        { id: 'discover', label: 'Discovery Library', icon: '🔍' },
                        { id: 'reverse', label: 'Reverse Engineer', icon: '⚙️' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'discover' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6">
                    {/* Pathway Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {pathways.map(p => (
                            <Card
                                key={p.id}
                                className={`p-8 cursor-pointer transition-all duration-300 border-4 border-transparent hover:border-${p.color_code}-100 ${selectedPathway?.id === p.id ? `bg-${p.color_code}-600 text-white shadow-2xl shadow-${p.color_code}-200 -translate-y-2` : 'bg-white text-gray-900'}`}
                                onClick={() => handlePathwayClick(p)}
                            >
                                <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center ${selectedPathway?.id === p.id ? 'bg-white/20' : `bg-${p.color_code}-50 text-${p.color_code}-600`}`}>
                                    <span className="text-2xl">
                                        {p.name.includes('STEM') ? '🔬' :
                                            p.name.includes('Social') ? '👥' :
                                                p.name.includes('Arts') ? '🎨' :
                                                    p.name.includes('Agri') ? '🌿' : '🚀'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">{p.name}</h3>
                                <p className={`text-xs font-medium leading-relaxed ${selectedPathway?.id === p.id ? 'text-white/80' : 'text-gray-500'}`}>
                                    {p.description}
                                </p>
                            </Card>
                        ))}
                    </div>

                    {/* Careers Search & Library */}
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-3xl font-black text-gray-900 italic uppercase">
                                {selectedPathway ? `${selectedPathway.name} Careers` : 'Featured Careers'}
                            </h2>
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search careers (e.g. Pilot, Surgeon)"
                                    className="pl-12 pr-6 py-4 bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl w-full md:w-80 font-bold shadow-sm outline-none transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">🔍</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredCareers.map(career => (
                                <Card key={career.id} className="group relative border-2 border-transparent hover:border-indigo-100 transition-all p-8 flex flex-col justify-between overflow-hidden">
                                    <div className="space-y-6 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <span className={`px-3 py-1 bg-${career.pathway.color_code}-50 text-${career.pathway.color_code}-600 text-[10px] font-black uppercase tracking-widest rounded-lg`}>
                                                {career.pathway.name}
                                            </span>
                                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg italic">{career.outlook}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 italic leading-tight group-hover:text-indigo-600 transition-colors">{career.name}</h3>
                                        <p className="text-sm text-gray-500 font-medium line-clamp-2">{career.description}</p>

                                        <div className="space-y-3 pt-4 border-t border-gray-50">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mandatory Subjects</p>
                                            <div className="flex flex-wrap gap-2">
                                                {career.subjects.filter(s => s.pivot.is_mandatory).map(s => (
                                                    <span key={s.id} className="px-3 py-1 bg-white border border-gray-100 text-[10px] font-bold text-gray-600 rounded-full shadow-sm">{s.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Est. Salary: <span className="text-gray-900">{career.salary_range}</span></span>
                                        <Button
                                            variant="outline"
                                            className="text-[10px] uppercase font-black px-4 py-2 hover:bg-indigo-600 hover:text-white transition-all"
                                            onClick={() => setSelectedCareerDetails(career)}
                                        >
                                            Deep Dive
                                        </Button>
                                    </div>
                                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                        <span className="text-6xl">💼</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'reverse' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in slide-in-from-right-8 fade-in duration-500">
                    {/* The Basket Sidebar */}
                    <div className="space-y-8">
                        <Card className="p-8 space-y-8 bg-indigo-900 text-white relative overflow-hidden">
                            <div className="relative z-10 space-y-6">
                                <h2 className="text-3xl font-black italic uppercase italic tracking-tighter">Your Subject Basket</h2>
                                <p className="text-indigo-200 text-sm font-medium">Select the subjects you enjoy to see which careers you qualify for.</p>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Selected ({basket.length})</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {basket.map(s => (
                                            <span
                                                key={s.id}
                                                onClick={() => toggleBasketSubject(s)}
                                                className="px-4 py-2 bg-white text-indigo-900 rounded-2xl text-xs font-black cursor-pointer hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-2"
                                            >
                                                {s.name} <span>×</span>
                                            </span>
                                        ))}
                                        {basket.length === 0 && <p className="text-indigo-400/50 italic text-xs font-medium">Your basket is empty...</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12">
                                <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                        </Card>

                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-4">Available Subjects</h3>
                            <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {subjects.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => toggleBasketSubject(s)}
                                        className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${basket.find(bs => bs.id === s.id) ? 'bg-indigo-50 border-indigo-500 scale-95' : 'bg-white border-transparent hover:border-gray-200 shadow-sm'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`font-black text-sm ${basket.find(bs => bs.id === s.id) ? 'text-indigo-600' : 'text-gray-700'}`}>{s.name}</span>
                                            {basket.find(bs => bs.id === s.id) && <span className="text-indigo-600 font-black">✓</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-xl shadow-indigo-50 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic">Qualification Status</h3>
                                <p className="text-indigo-600 font-bold text-sm">Based on your selection, you qualify for {qualifiedCareers.length} career paths.</p>
                            </div>
                            <div className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl flex flex-col items-center">
                                <span className="text-3xl font-black">{qualifiedCareers.length}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Career Matches</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {qualifiedCareers.map(career => (
                                <Card key={career.id} className="p-8 border-2 border-emerald-50 relative group">
                                    <div className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-2`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Qualified
                                    </div>
                                    <h4 className="text-xl font-black text-gray-900 italic mb-4">{career.name}</h4>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Entry Pathway</p>
                                            <p className="text-xs font-bold text-indigo-600">{career.pathway.name}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Key Requirements Covered</p>
                                            <div className="flex flex-wrap gap-2">
                                                {career.subjects.map(s => (
                                                    <span key={s.id} className={`text-[10px] font-bold px-3 py-1 rounded-full ${s.pivot.is_mandatory ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full text-[10px] uppercase font-black py-2 mt-4"
                                            onClick={() => setSelectedCareerDetails(career)}
                                        >
                                            Deep Dive
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                            {basket.length > 0 && qualifiedCareers.length === 0 && (
                                <div className="col-span-full py-20 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-400 italic uppercase">No Exact Matches</h3>
                                        <p className="text-gray-400 font-bold text-sm max-w-xs mx-auto">None of the careers in our library match this specific subject combination. Try adding Mathematics or Science.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Career Detail Modal */}
            {selectedCareerDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                        <button
                            onClick={() => setSelectedCareerDetails(null)}
                            className="absolute top-8 right-8 w-12 h-12 bg-gray-50 text-gray-400 hover:text-red-600 rounded-2xl flex items-center justify-center transition-all z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="p-12 space-y-12">
                            <div className="flex flex-col md:flex-row gap-10 items-start">
                                <div className={`p-8 rounded-[2.5rem] bg-${selectedCareerDetails.pathway.color_code}-600 text-white shadow-2xl shadow-${selectedCareerDetails.pathway.color_code}-100 rotate-1`}>
                                    <span className="text-6xl">💼</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-1.5 bg-${selectedCareerDetails.pathway.color_code}-50 text-${selectedCareerDetails.pathway.color_code}-600 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                                            {selectedCareerDetails.pathway.name} Pathway
                                        </span>
                                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest italic">
                                            {selectedCareerDetails.outlook} Outlook
                                        </span>
                                    </div>
                                    <h2 className="text-5xl font-black text-gray-900 italic uppercase leading-none">{selectedCareerDetails.name}</h2>
                                    <p className="text-xl text-gray-500 font-medium leading-relaxed">{selectedCareerDetails.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-6">
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Academic Requirements</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-500">Mandatory Subjects</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCareerDetails.subjects.filter(s => s.pivot.is_mandatory).map(s => (
                                                    <span key={s.id} className="px-4 py-2 bg-white border-2 border-red-50 text-red-600 rounded-2xl text-xs font-black">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-500">Recommended Subjects</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCareerDetails.subjects.filter(s => !s.pivot.is_mandatory).map(s => (
                                                    <span key={s.id} className="px-4 py-2 bg-white border-2 border-emerald-50 text-emerald-600 rounded-2xl text-xs font-black">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-gray-100 italic">
                                        <p className="text-xs font-bold text-gray-900">Minimum Qualifications:</p>
                                        <p className="text-sm text-gray-500 mt-1">{selectedCareerDetails.qualifications || 'Standard university degree in related field.'}</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-indigo-50 p-8 rounded-[2.5rem] space-y-4 border-2 border-indigo-100">
                                        <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Skill Inventory</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {(selectedCareerDetails.skills || "Communication, Analysis, Creativity").split(',').map((skill, i) => (
                                                <span key={i} className="px-4 py-2 bg-white text-indigo-600 rounded-2xl text-xs font-black shadow-sm">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 p-8 rounded-[2.5rem] space-y-4 border-2 border-amber-100">
                                        <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest">Financial & Industry</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-amber-800/50 uppercase tracking-widest">Est. Salary</p>
                                                <p className="text-lg font-black text-amber-900">{selectedCareerDetails.salary_range}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-amber-800/50 uppercase tracking-widest">Employment</p>
                                                <p className="text-sm font-bold text-amber-900">{selectedCareerDetails.typical_employers || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-600 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black italic uppercase">Bridge the Gap</h4>
                                    <p className="text-indigo-100 text-sm font-medium">Add this career to your goals to track your academic progress.</p>
                                </div>
                                <Button
                                    className="bg-white text-indigo-600 hover:bg-indigo-50 px-10 py-4 font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl"
                                    onClick={() => handleSetGoal(selectedCareerDetails.id)}
                                >
                                    {user?.target_career_id === selectedCareerDetails.id ? 'Goal Active' : 'Set as North Star Goal'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
