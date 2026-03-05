import React, { useState, useContext, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import confetti from 'canvas-confetti';

// Experiments fetched from API

const BiologyExperiments = ({ activeSimulation, setActiveSimulation, selectedLab }) => {
    const [focus, setFocus] = useState(0); // For microscopy
    const [valves, setValves] = useState({ left: false, right: false }); // For circulatory
    const [bpm, setBpm] = useState(0);

    const isStepCorrect = () => {
        if (activeSimulation.simulation_type === 'biology_microscopy' && activeSimulation.step === 2) {
            return focus > 80;
        }
        if (activeSimulation.simulation_type === 'biology_circulatory' && activeSimulation.step === 1) {
            return valves.left && valves.right;
        }
        return true;
    };

    const handleNext = () => {
        if (activeSimulation.step < (activeSimulation.steps?.length || 3)) {
            setActiveSimulation(prev => ({ ...prev, step: prev.step + 1 }));
        } else {
            setActiveSimulation(prev => ({ ...prev, completed: true }));
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#ffffff', '#3b82f6']
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-4">
                <h3 className="text-2xl font-black text-gray-900 border-l-4 border-emerald-500 pl-4">
                    Stage {activeSimulation.step}: {activeSimulation.steps?.[activeSimulation.step - 1]?.instruction}
                </h3>
            </div>

            <div className="aspect-video bg-white rounded-[2.5rem] border-8 border-gray-100 flex items-center justify-center shadow-inner relative overflow-hidden group">
                {/* MICROSCOPY VIEW */}
                {activeSimulation.simulation_type === 'biology_microscopy' && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
                        <div className="w-64 h-64 rounded-full border-8 border-gray-800 overflow-hidden relative shadow-[0_0_100px_rgba(255,255,255,0.1)_inset]">
                            {/* The "Cell" image that gets clearer */}
                            <div
                                className="w-full h-full bg-cover transition-all duration-300"
                                style={{
                                    backgroundImage: 'url(https://images.unsplash.com/photo-1526413232644-8a40f03cc0c6?w=400&auto=format&fit=crop&q=60)',
                                    filter: `blur(${Math.max(0, (100 - focus) / 5)}px) contrast(${50 + focus / 2}%)`,
                                    transform: `scale(${1 + focus / 200})`
                                }}
                            />
                            {/* Grid overlay for scientific look */}
                            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                        </div>
                        {activeSimulation.step === 2 && (
                            <div className="absolute bottom-10 left-10 right-10 bg-black/60 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                                <label className="text-white text-xs font-black uppercase tracking-widest block mb-4">Focus Adjustment knob</label>
                                <input
                                    type="range"
                                    value={focus}
                                    onChange={(e) => setFocus(parseInt(e.target.value))}
                                    className="w-full accent-emerald-500 h-2 rounded-full cursor-pointer"
                                />
                            </div>
                        )}
                        {activeSimulation.step === 3 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-mono text-[10px] space-y-1">
                                    <div className="flex gap-2"><span>[+]</span> NUCLEUS DETECTED</div>
                                    <div className="flex gap-2"><span>[+]</span> CELL WALL IDENTIFIED</div>
                                    <div className="flex gap-2"><span>[+]</span> CYTOPLASM SCANNING...</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* HEART VIEW */}
                {activeSimulation.simulation_type === 'biology_circulatory' && (
                    <div className="w-full h-full bg-red-50 flex items-center justify-center p-12">
                        <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
                            {/* Heart Silhouette (Simplified with circles) */}
                            <div className={`w-40 h-48 bg-red-500 rounded-t-full rounded-b-3xl absolute ${valves.left && valves.right ? 'animate-pulse scale-105' : ''} transition-all duration-300 shadow-2xl overflow-hidden`}>
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent" />
                                {/* Blood Cells moving if valves active */}
                                {valves.left && valves.right && (
                                    <div className="absolute inset-0 overflow-hidden">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={`w-4 h-4 bg-red-200 rounded-full absolute left-1/2 -ml-2 animate-bounce`} style={{ top: `${i * 20}%`, animationDelay: `${i * 0.2}s` }} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Interactive Valves */}
                            <button
                                onClick={() => setValves(v => ({ ...v, left: !v.left }))}
                                className={`absolute left-0 top-1/2 -mt-8 w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${valves.left ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white text-gray-400 border-2 border-dashed border-gray-200'} shadow-xl`}
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                <span className="absolute -top-6 text-[8px] font-black text-gray-900 uppercase">Input Valve</span>
                            </button>
                            <button
                                onClick={() => setValves(v => ({ ...v, right: !v.right }))}
                                className={`absolute right-0 top-1/2 -mt-8 w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${valves.right ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white text-gray-400 border-2 border-dashed border-gray-200'} shadow-xl`}
                            >
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                <span className="absolute -top-6 text-[8px] font-black text-gray-900 uppercase">Output Valve</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* FALLBACK FOR OTHER BIOLOGY */}
                {activeSimulation.simulation_type !== 'biology_microscopy' && activeSimulation.simulation_type !== 'biology_circulatory' && (
                    <div className={`w-24 h-24 rounded-full bg-${selectedLab.color}-50 text-${selectedLab.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                        {selectedLab.icon}
                    </div>
                )}
            </div>

            <Button
                disabled={!isStepCorrect()}
                className={`w-full py-6 text-lg shadow-2xl transition-all ${isStepCorrect() ? 'bg-emerald-600 scale-100 hover:bg-emerald-700' : 'bg-gray-200 scale-95 opacity-50 cursor-not-allowed text-gray-400'}`}
                onClick={handleNext}
            >
                {activeSimulation.step < (activeSimulation.steps?.length || 3) ? "Next Phase &rarr;" : "Finalize Research"}
            </Button>
        </div>
    );
};

const ChemistryExperiments = ({ activeSimulation, setActiveSimulation, selectedLab }) => {
    const [tapOpen, setTapOpen] = useState(0); // For titration
    const [color, setColor] = useState('#ffffff');
    const [heat, setHeat] = useState(0); // For states of matter
    const [temp, setTemp] = useState(20);

    const isStepCorrect = () => {
        if (activeSimulation.simulation_type === 'chemistry_titration' && activeSimulation.step === 2) {
            return tapOpen > 70;
        }
        if (activeSimulation.simulation_type === 'chemistry_states_of_matter' && activeSimulation.step === 1) {
            return heat > 50;
        }
        return true;
    };

    const handleNext = () => {
        if (activeSimulation.step < (activeSimulation.steps?.length || 3)) {
            setActiveSimulation(prev => ({ ...prev, step: prev.step + 1 }));
        } else {
            setActiveSimulation(prev => ({ ...prev, completed: true }));
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#a855f7', '#ffffff', '#3b82f6']
            });
        }
    };

    useEffect(() => {
        if (activeSimulation.simulation_type === 'chemistry_titration' && tapOpen > 70) {
            setColor('#fce7f3'); // Pink/Phenolphthalein end-point
        }
    }, [tapOpen, activeSimulation.simulation_type]);

    useEffect(() => {
        if (activeSimulation.simulation_type === 'chemistry_states_of_matter') {
            setTemp(20 + (heat * 0.8));
        }
    }, [heat, activeSimulation.simulation_type]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-4">
                <h3 className="text-2xl font-black text-gray-900 border-l-4 border-purple-500 pl-4">
                    Stage {activeSimulation.step}: {activeSimulation.steps?.[activeSimulation.step - 1]?.instruction}
                </h3>
            </div>

            <div className="aspect-video bg-white rounded-[2.5rem] border-8 border-gray-100 flex items-center justify-center shadow-inner relative overflow-hidden group">
                {/* TITRATION VIEW */}
                {activeSimulation.simulation_type === 'chemistry_titration' && (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center p-8">
                        <div className="relative h-full flex flex-col items-center">
                            {/* Burette */}
                            <div className="w-4 h-64 bg-white/80 border-2 border-slate-200 rounded-full relative overflow-hidden">
                                <div
                                    className="absolute bottom-0 w-full bg-blue-100/50 transition-all duration-500"
                                    style={{ height: `${100 - (tapOpen / 2)}%` }}
                                />
                                <div className="absolute top-0 w-full flex flex-col gap-4 py-4 opacity-20">
                                    {[...Array(10)].map((_, i) => <div key={i} className="h-0.5 w-full bg-slate-400" />)}
                                </div>
                            </div>
                            {/* Flask */}
                            <div className="relative mt-8">
                                <div
                                    className="w-24 h-24 rounded-full border-4 border-slate-200 relative transition-colors duration-1000 overflow-hidden"
                                    style={{ backgroundColor: color }}
                                >
                                    <div className="absolute bottom-0 w-full h-12 bg-white/20" />
                                </div>
                                <div className="absolute -top-4 left-1/2 -ml-0.5 w-1 h-8 bg-slate-200" />
                            </div>

                            {activeSimulation.step === 2 && (
                                <div className="absolute bottom-0 left-10 right-10 bg-white shadow-xl p-6 rounded-3xl border border-slate-100">
                                    <label className="text-[10px] font-black uppercase tracking-widest block mb-2 text-slate-500">Burette Tap Control</label>
                                    <input
                                        type="range"
                                        value={tapOpen}
                                        onChange={(e) => setTapOpen(parseInt(e.target.value))}
                                        className="w-full accent-purple-600 h-2 rounded-full cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STATES OF MATTER VIEW */}
                {activeSimulation.simulation_type === 'chemistry_states_of_matter' && (
                    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-8">
                        <div className="relative w-48 h-48 bg-slate-50 border-4 border-slate-200 rounded-3xl overflow-hidden shadow-inner">
                            {/* Molecules */}
                            <div className="absolute inset-0 p-4 grid grid-cols-4 gap-2">
                                {[...Array(16)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-6 h-6 rounded-full bg-blue-400 shadow-md transition-all duration-500 ${heat > 50 ? 'animate-bounce' : ''}`}
                                        style={{
                                            transform: `translate(${Math.random() * (heat / 5)}px, ${Math.random() * (heat / 5)}px)`,
                                            opacity: 0.8 + (heat / 500)
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-sm">
                                {temp.toFixed(1)}°C
                            </div>
                        </div>

                        {activeSimulation.step === 1 && (
                            <div className="w-full max-w-xs mt-8 space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Bunsen Burner Control</span>
                                    <span className="text-orange-500">Heat Level: {heat}%</span>
                                </div>
                                <input
                                    type="range"
                                    value={heat}
                                    onChange={(e) => setHeat(parseInt(e.target.value))}
                                    className="w-full accent-orange-500 h-2 rounded-full cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* FALLBACK FOR OTHER CHEMISTRY */}
                {activeSimulation.simulation_type !== 'chemistry_titration' && activeSimulation.simulation_type !== 'chemistry_states_of_matter' && (
                    <div className={`w-24 h-24 rounded-full bg-${selectedLab.color}-50 text-${selectedLab.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                        {selectedLab.icon}
                    </div>
                )}
            </div>

            <Button
                disabled={!isStepCorrect()}
                className={`w-full py-6 text-lg shadow-2xl transition-all ${isStepCorrect() ? 'bg-purple-600 scale-100 hover:bg-purple-700' : 'bg-gray-200 scale-95 opacity-50 cursor-not-allowed text-gray-400'}`}
                onClick={handleNext}
            >
                {activeSimulation.step < (activeSimulation.steps?.length || 3) ? "Next Phase &rarr;" : "Finalize Research"}
            </Button>
        </div>
    );
};

const PhysicsExperiments = ({ activeSimulation, setActiveSimulation, selectedLab }) => {
    const [force, setForce] = useState(0); // For motion
    const [position, setPosition] = useState(0);
    const [angle, setAngle] = useState(45); // For reflection
    const [laserActive, setLaserActive] = useState(false);

    const isStepCorrect = () => {
        if (activeSimulation.simulation_type === 'physics_newton_motion' && activeSimulation.step === 2) {
            return force > 40;
        }
        if (activeSimulation.simulation_type === 'physics_light_reflection' && activeSimulation.step === 2) {
            return angle !== 45; // Neutral start
        }
        return true;
    };

    const handleNext = () => {
        if (activeSimulation.step < (activeSimulation.steps?.length || 3)) {
            setActiveSimulation(prev => ({ ...prev, step: prev.step + 1 }));
        } else {
            setActiveSimulation(prev => ({ ...prev, completed: true }));
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#ffffff', '#60a5fa']
            });
        }
    };

    useEffect(() => {
        let interval;
        if (activeSimulation.simulation_type === 'physics_newton_motion' && force > 40 && activeSimulation.step === 2) {
            interval = setInterval(() => {
                setPosition(prev => (prev < 300 ? prev + (force / 20) : prev));
            }, 50);
        }
        return () => clearInterval(interval);
    }, [force, activeSimulation.simulation_type, activeSimulation.step]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-4">
                <h3 className="text-2xl font-black text-gray-900 border-l-4 border-blue-500 pl-4">
                    Stage {activeSimulation.step}: {activeSimulation.steps?.[activeSimulation.step - 1]?.instruction}
                </h3>
            </div>

            <div className="aspect-video bg-white rounded-[2.5rem] border-8 border-gray-100 flex items-center justify-center shadow-inner relative overflow-hidden group">
                {/* NEWTON MOTION VIEW */}
                {activeSimulation.simulation_type === 'physics_newton_motion' && (
                    <div className="w-full h-full bg-slate-50 p-12 flex flex-col items-start justify-end relative">
                        {/* The Track */}
                        <div className="w-full h-2 bg-slate-300 rounded-full mb-1" />

                        {/* The Trolley */}
                        <div
                            className="absolute bottom-12 transition-all duration-75"
                            style={{ left: `${20 + position / 3}%` }}
                        >
                            <div className="w-24 h-12 bg-blue-600 rounded-xl relative shadow-lg">
                                <div className="absolute -bottom-2 left-2 w-4 h-4 bg-gray-800 rounded-full" />
                                <div className="absolute -bottom-2 right-2 w-4 h-4 bg-gray-800 rounded-full" />
                                <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-black">1.0kg</div>
                            </div>
                        </div>

                        {activeSimulation.step === 2 && (
                            <div className="absolute top-10 right-10 left-10 p-6 bg-white/80 backdrop-blur rounded-3xl border border-blue-100 shadow-xl space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-600">
                                    <span>Force Applied (Newtons)</span>
                                    <span>{force} N</span>
                                </div>
                                <input
                                    type="range"
                                    value={force}
                                    onChange={(e) => setForce(parseInt(e.target.value))}
                                    className="w-full accent-blue-600 h-2 rounded-full cursor-pointer"
                                />
                            </div>
                        )}

                        {activeSimulation.step === 3 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                                <div className="p-6 bg-white rounded-3xl shadow-2xl border-2 border-blue-500 space-y-4 animate-bounce">
                                    <h4 className="font-black text-blue-600 uppercase tracking-widest text-center">Data Captured</h4>
                                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                        <div className="p-2 bg-blue-50 rounded-lg">F = {force}N</div>
                                        <div className="p-2 bg-blue-50 rounded-lg">t = 2.4s</div>
                                        <div className="p-2 bg-blue-50 rounded-lg">a = {(force / 1.0).toFixed(2)} m/s²</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* LIGHT REFLECTION VIEW */}
                {activeSimulation.simulation_type === 'physics_light_reflection' && (
                    <div className="w-full h-full bg-gray-900 relative flex items-center justify-center overflow-hidden">
                        {/* The Mirror */}
                        <div className="absolute top-1/2 left-1/2 w-full h-1 bg-blue-200 shadow-[0_0_15px_rgba(191,219,254,0.5)] -translate-x-1/2 -translate-y-1/2" />

                        {/* Incident Ray */}
                        <div
                            className="absolute w-1 bg-red-500 shadow-[0_0_10px_red] transition-all origin-bottom"
                            style={{
                                height: '200px',
                                bottom: '50%',
                                left: '50%',
                                transform: `rotate(${-angle}deg)`
                            }}
                        />

                        {/* Reflected Ray */}
                        <div
                            className="absolute w-1 bg-red-400 shadow-[0_0_10px_red] transition-all origin-top opacity-60"
                            style={{
                                height: '200px',
                                top: '50%',
                                left: '50%',
                                transform: `rotate(${angle}deg)`
                            }}
                        />

                        {/* Protractor HUD */}
                        <div className="absolute inset-0 border-[40px] border-white/5 rounded-full pointer-events-none" />
                        <div className="absolute top-10 bg-black/60 px-4 py-2 rounded-full border border-white/10 text-white font-mono text-[10px]">
                            θi = {angle}° | θr = {angle}°
                        </div>

                        {activeSimulation.step === 2 && (
                            <div className="absolute bottom-10 left-10 right-10 bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                                <label className="text-white text-[10px] font-black uppercase tracking-widest block mb-4">Adjust Incidence Angle</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="90"
                                    value={angle}
                                    onChange={(e) => setAngle(parseInt(e.target.value))}
                                    className="w-full accent-blue-400 h-2 rounded-full cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* FALLBACK FOR OTHER PHYSICS */}
                {activeSimulation.simulation_type !== 'physics_newton_motion' && activeSimulation.simulation_type !== 'physics_light_reflection' && (
                    <div className={`w-24 h-24 rounded-full bg-${selectedLab.color}-50 text-${selectedLab.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                        {selectedLab.icon}
                    </div>
                )}
            </div>

            <Button
                disabled={!isStepCorrect()}
                className={`w-full py-6 text-lg shadow-2xl transition-all ${isStepCorrect() ? 'bg-blue-600 scale-100 hover:bg-blue-700' : 'bg-gray-200 scale-95 opacity-50 cursor-not-allowed text-gray-400'}`}
                onClick={handleNext}
            >
                {activeSimulation.step < (activeSimulation.steps?.length || 3) ? "Next Phase &rarr;" : "Finalize Research"}
            </Button>
        </div>
    );
};

const AgricultureExperiments = ({ activeSimulation, setActiveSimulation, selectedLab }) => {
    const [phValue, setPhValue] = useState(7); // For soil testing
    const [waterFlow, setWaterFlow] = useState(0); // For irrigation
    const [moisture, setMoisture] = useState(20);

    const isStepCorrect = () => {
        if (activeSimulation.simulation_type === 'agriculture_soil_testing' && activeSimulation.step === 2) {
            return phValue !== 7;
        }
        if (activeSimulation.simulation_type === 'agriculture_irrigation' && activeSimulation.step === 2) {
            return waterFlow > 50;
        }
        return true;
    };

    const handleNext = () => {
        if (activeSimulation.step < (activeSimulation.steps?.length || 3)) {
            setActiveSimulation(prev => ({ ...prev, step: prev.step + 1 }));
        } else {
            setActiveSimulation(prev => ({ ...prev, completed: true }));
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#f97316', '#ffffff', '#fbbf24']
            });
        }
    };

    useEffect(() => {
        if (activeSimulation.simulation_type === 'agriculture_irrigation' && waterFlow > 50 && activeSimulation.step === 2) {
            const timer = setInterval(() => {
                setMoisture(prev => (prev < 85 ? prev + 1 : prev));
            }, 100);
            return () => clearInterval(timer);
        }
    }, [waterFlow, activeSimulation.simulation_type, activeSimulation.step]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-4">
                <h3 className="text-2xl font-black text-gray-900 border-l-4 border-orange-500 pl-4">
                    Stage {activeSimulation.step}: {activeSimulation.steps?.[activeSimulation.step - 1]?.instruction}
                </h3>
            </div>

            <div className="aspect-video bg-white rounded-[2.5rem] border-8 border-gray-100 flex items-center justify-center shadow-inner relative overflow-hidden group">
                {/* SOIL TESTING VIEW */}
                {activeSimulation.simulation_type === 'agriculture_soil_testing' && (
                    <div className="w-full h-full bg-stone-50 p-12 flex flex-col items-center justify-center relative">
                        <div className="w-32 h-48 bg-stone-800 rounded-b-3xl relative overflow-hidden shadow-2xl">
                            {/* Soil layers */}
                            <div className="absolute bottom-0 w-full h-1/2 bg-yellow-900/40" />
                            {/* The "Liquid" that changes color based on pH */}
                            <div
                                className="absolute inset-0 transition-colors duration-1000"
                                style={{
                                    backgroundColor: phValue < 6 ? '#ef4444' : phValue > 8 ? '#3b82f6' : '#22c55e',
                                    opacity: 0.4
                                }}
                            />
                        </div>

                        {activeSimulation.step === 2 && (
                            <div className="absolute bottom-10 left-10 right-10 p-6 bg-white shadow-xl rounded-3xl border border-orange-100">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-orange-600 mb-4">
                                    <span>Soil pH scale</span>
                                    <span>pH {phValue}</span>
                                </div>
                                <input
                                    type="range"
                                    min="3"
                                    max="11"
                                    step="0.1"
                                    value={phValue}
                                    onChange={(e) => setPhValue(parseFloat(e.target.value))}
                                    className="w-full accent-orange-600 h-2 rounded-full cursor-pointer"
                                />
                                <div className="flex justify-between mt-2 font-mono text-[8px] text-gray-400">
                                    <span>ACIDIC</span>
                                    <span>NEUTRAL</span>
                                    <span>ALKALINE</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* IRRIGATION VIEW */}
                {activeSimulation.simulation_type === 'agriculture_irrigation' && (
                    <div className="w-full h-full bg-emerald-50 relative flex flex-col items-center justify-center p-8">
                        {/* Grid of plants */}
                        <div className="grid grid-cols-4 gap-4 p-4 bg-orange-50/50 rounded-3xl border-2 border-orange-100/50">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="relative">
                                    <div className={`w-12 h-12 rounded-full ${moisture > 60 ? 'bg-emerald-500' : 'bg-orange-300'} transition-colors duration-1000 flex items-center justify-center`}>
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    </div>
                                    {waterFlow > 50 && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce">
                                            <div className="w-1 h-3 bg-blue-400 rounded-full" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex gap-8">
                            <div className="bg-white px-6 py-3 rounded-2xl shadow-lg border border-orange-100">
                                <span className="text-[10px] font-black uppercase text-gray-400 block">Soil Moisture</span>
                                <span className="text-2xl font-black text-orange-600">{moisture}%</span>
                            </div>
                        </div>

                        {activeSimulation.step === 2 && (
                            <div className="absolute bottom-10 left-10 right-10 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-orange-100 shadow-xl">
                                <label className="text-orange-600 text-[10px] font-black uppercase tracking-widest block mb-4">Pump Pressure (PSI)</label>
                                <input
                                    type="range"
                                    value={waterFlow}
                                    onChange={(e) => setWaterFlow(parseInt(e.target.value))}
                                    className="w-full accent-orange-600 h-2 rounded-full cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* FALLBACK FOR OTHER AGRICULTURE */}
                {activeSimulation.simulation_type !== 'agriculture_soil_testing' && activeSimulation.simulation_type !== 'agriculture_irrigation' && (
                    <div className={`w-24 h-24 rounded-full bg-${selectedLab.color}-50 text-${selectedLab.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                        {selectedLab.icon}
                    </div>
                )}
            </div>

            <Button
                disabled={!isStepCorrect()}
                className={`w-full py-6 text-lg shadow-2xl transition-all ${isStepCorrect() ? 'bg-orange-600 scale-100 hover:bg-orange-700' : 'bg-gray-200 scale-95 opacity-50 cursor-not-allowed text-gray-400'}`}
                onClick={handleNext}
            >
                {activeSimulation.step < (activeSimulation.steps?.length || 3) ? "Next Phase &rarr;" : "Finalize Research"}
            </Button>
        </div>
    );
};

export default function ScienceLab() {
    const { user } = useContext(AuthContext);
    const [scienceLabs, setScienceLabs] = useState([]);
    const [selectedLab, setSelectedLab] = useState(null);
    const [curriculum, setCurriculum] = useState('8-4-4');
    const [activeSimulation, setActiveSimulation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLabs();
        if (user?.curriculum?.name) {
            setCurriculum(user.curriculum.name);
        }
    }, [user]);

    const fetchLabs = async () => {
        try {
            const res = await api.get('/science-labs');
            // Map flat experiments to curriculum-grouped object
            const mappedLabs = res.data.map(lab => ({
                ...lab,
                id: lab.slug, // Map slug to id for compatibility
                icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                ),
                experiments: (lab.experiments || []).reduce((acc, exp) => {
                    const cName = exp.curriculum?.name || 'Any';
                    if (!acc[cName]) acc[cName] = [];
                    acc[cName].push({ ...exp, id: exp.slug });
                    return acc;
                }, {})
            }));
            setScienceLabs(mappedLabs);
        } catch (err) {
            console.error("Failed to fetch science labs", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLaunchSimulation = (exp) => {
        setActiveSimulation({
            ...exp,
            step: 1,
            completed: false
        });
    };

    if (loading) return <div className="p-20 text-center font-black text-gray-400">Syncing Lab Resources...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-24">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-50">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 rotate-3">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Virtual Science Labs</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1.5 text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                {curriculum} Curriculum Enabled
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex bg-gray-100 p-2 rounded-3xl self-start md:self-center">
                    {['8-4-4', 'CBC'].map(c => (
                        <button
                            key={c}
                            onClick={() => setCurriculum(c)}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${curriculum === c ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </header>

            {!selectedLab ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {scienceLabs.map(lab => (
                        <Card
                            key={lab.id}
                            className={`p-10 hover:scale-[1.03] active:scale-95 transition-all duration-500 cursor-pointer relative overflow-hidden group border-4 border-transparent hover:border-${lab.color}-100`}
                            onClick={() => setSelectedLab(lab)}
                        >
                            {/* Status Badge */}
                            <div className="absolute top-6 right-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active System</span>
                            </div>

                            <div className={`w-20 h-20 rounded-3xl bg-${lab.color}-50 text-${lab.color}-600 flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform duration-500 shadow-xl shadow-${lab.color}-100/50`}>
                                {lab.icon}
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                    {lab.name}
                                </h2>
                                <p className="text-gray-500 font-medium leading-relaxed">
                                    {lab.description}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-4">
                                    <span className={`text-${lab.color}-600 font-black text-xs uppercase tracking-[0.2em]`}>
                                        Enter Facility &rarr;
                                    </span>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                                                <div className={`w-2 h-2 rounded-full bg-${lab.color}-400`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="flex justify-between items-end">
                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedLab(null)}
                                className="text-sm font-black text-gray-400 hover:text-gray-900 flex items-center gap-2 uppercase tracking-widest group"
                            >
                                <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Facilities
                            </button>
                            <h2 className="text-5xl font-black text-gray-900 italic tracking-tighter uppercase">{selectedLab.name}</h2>
                        </div>
                        <div className={`px-8 py-4 bg-${selectedLab.color}-50 rounded-2xl border-2 border-${selectedLab.color}-100`}>
                            <p className={`text-[10px] font-black text-${selectedLab.color}-600 uppercase tracking-[0.3em]`}>Current Lab</p>
                            <p className="text-sm font-black text-gray-900 mt-1">{selectedLab.experiments[curriculum]?.length || 0} Simulations Available</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(selectedLab.experiments[curriculum] || []).map(exp => (
                                <Card key={exp.id} className="group relative border-2 border-transparent hover:border-gray-100 transition-all p-8 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">{exp.level}</span>
                                            <span className="text-xs font-black text-gray-400">{exp.duration}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 italic group-hover:text-blue-600 transition-colors leading-tight">{exp.title}</h3>
                                        <div className="space-y-2">
                                            {(exp.steps || []).slice(0, 3).map((s, i) => (
                                                <div key={i} className="flex gap-3 items-center text-xs font-bold text-gray-500">
                                                    <span className="w-4 h-4 rounded-full bg-gray-50 flex items-center justify-center text-[8px] font-black">{i + 1}</span>
                                                    <span className="truncate">{s.instruction}</span>
                                                </div>
                                            ))}
                                            {exp.steps?.length > 3 && (
                                                <p className="text-[10px] font-black text-gray-300 ml-7">+ {exp.steps.length - 3} More Phases</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full mt-8 py-5 text-sm uppercase tracking-[0.2em]"
                                        onClick={() => handleLaunchSimulation(exp)}
                                    >
                                        Launch Simulation
                                    </Button>
                                </Card>
                            ))}

                            {(selectedLab.experiments[curriculum] || []).length === 0 && (
                                <div className="col-span-full py-20 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-400 italic uppercase">No Simulations Found</h3>
                                        <p className="text-gray-400 font-bold text-sm max-w-xs mx-auto">We are adding more experiments for {curriculum} curriculum soon!</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-8">
                            <Card className="p-8 border-none shadow-xl bg-gray-900 text-white relative overflow-hidden">
                                <div className="relative z-10 space-y-6">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Safety Protocols</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                                            <p className="text-sm text-gray-300">Wear proper protective gear (Lab Coat & Goggles) before starting any virtual reaction.</p>
                                        </li>
                                        <li className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                                            <p className="text-sm text-gray-300">Read all experiment instructions carefully to ensure the safety of your virtual equipment.</p>
                                        </li>
                                        <li className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                                            <p className="text-sm text-gray-300">Do not consume any virtual substances—keep your learning space strictly professional!</p>
                                        </li>
                                    </ul>
                                </div>
                                <div className="absolute -bottom-10 -right-10 opacity-10">
                                    <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                                </div>
                            </Card>

                            <Card className="p-8 rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                                <h3 className="text-xl font-black uppercase tracking-widest mb-4">Department Head</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md overflow-hidden ring-4 ring-white/10">
                                        <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60" alt="Avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-black text-lg">Dr. Sarah Einstein</p>
                                        <p className="text-xs text-blue-100 font-bold uppercase tracking-wide">Science Coordinator</p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <button className="w-full py-4 bg-white text-blue-600 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg">
                                        Ask Coordinator
                                    </button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {activeSimulation && (
                <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <button
                            onClick={() => setActiveSimulation(null)}
                            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors z-20"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 h-[75vh]">
                            <div className={`bg-${selectedLab.color}-600 p-12 text-white flex flex-col justify-between relative`}>
                                <div className="space-y-4">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Active Research</span>
                                    <h2 className="text-4xl font-black leading-tight italic">{activeSimulation.title}</h2>
                                    <p className="opacity-80 font-medium">Follow the protocols to complete this virtual laboratory procedure.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                        <div className="w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center font-black text-sm">{activeSimulation.step}</div>
                                        <span className="font-bold">Protocol Stage {activeSimulation.step}</span>
                                    </div>
                                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-white h-full transition-all duration-700"
                                            style={{ width: `${(activeSimulation.step / (activeSimulation.steps?.length || 3)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                    {selectedLab.icon}
                                </div>
                            </div>

                            <div className="p-12 flex flex-col justify-center bg-gray-50">
                                {!activeSimulation.completed ? (
                                    <>
                                        {selectedLab.id === 'biology' && (
                                            <BiologyExperiments
                                                activeSimulation={activeSimulation}
                                                setActiveSimulation={setActiveSimulation}
                                                selectedLab={selectedLab}
                                            />
                                        )}
                                        {selectedLab.id === 'chemistry' && (
                                            <ChemistryExperiments
                                                activeSimulation={activeSimulation}
                                                setActiveSimulation={setActiveSimulation}
                                                selectedLab={selectedLab}
                                            />
                                        )}
                                        {selectedLab.id === 'physics' && (
                                            <PhysicsExperiments
                                                activeSimulation={activeSimulation}
                                                setActiveSimulation={setActiveSimulation}
                                                selectedLab={selectedLab}
                                            />
                                        )}
                                        {selectedLab.id === 'agriculture' && (
                                            <AgricultureExperiments
                                                activeSimulation={activeSimulation}
                                                setActiveSimulation={setActiveSimulation}
                                                selectedLab={selectedLab}
                                            />
                                        )}
                                        {/* Fallback if no specific simulation implemented yet */}
                                        {['biology', 'chemistry', 'physics', 'agriculture'].indexOf(selectedLab.id) === -1 && (
                                            <div className="text-center space-y-4">
                                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                                    {selectedLab.icon}
                                                </div>
                                                <h3 className="text-xl font-bold">Simulation Coming Soon</h3>
                                                <p className="text-gray-500">We are currently developing the virtual protocols for {selectedLab.name}.</p>
                                                <Button className="w-full" onClick={() => setActiveSimulation(prev => ({ ...prev, completed: true }))}>
                                                    Skip Simulation
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-gray-900 mb-2">Research Completed</h3>
                                            <p className="text-gray-500 font-medium">You have successfully mastered the protocols for {activeSimulation.title}.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <Button variant="outline" className="flex-1 py-4" onClick={() => setActiveSimulation(null)}>Close Lab</Button>
                                            <Button className="flex-1 py-4 bg-gray-900" onClick={() => handleLaunchSimulation(activeSimulation)}>Restart</Button>
                                        </div>
                                    </div>
                                )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
