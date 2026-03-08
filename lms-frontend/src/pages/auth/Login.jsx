import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import InstallAppButton from '../../components/common/InstallAppButton';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [securityKey, setSecurityKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [schoolName, setSchoolName] = useState('Inkiito Manoh');
    const [schoolLogo, setSchoolLogo] = useState(null);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/settings').then(res => {
            if (res.data?.school_name) setSchoolName(res.data.school_name);
            if (res.data?.school_logo) setSchoolLogo(res.data.school_logo);
        }).catch(err => console.error("Could not fetch school settings", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await login({
                identifier: identifier.trim(),
                security_key: securityKey.trim()
            });

            if (user.role !== 'student') {
                navigate('/admin/dashboard');
            } else {
                navigate('/student/dashboard');
            }
        } catch (err) {
            console.error("Login component error:", err);
            const message = err.response?.data?.message ||
                err.response?.data?.error ||
                (err.response?.data?.errors ? Object.values(err.response.data.errors)[0][0] : null) ||
                'Invalid credentials. Please check your details and try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[100dvh] w-full overflow-hidden flex flex-col md:flex-row bg-white font-sans">

            {/* Left Side: Branding & Image Cover */}
            <div className="md:w-1/2 relative hidden md:flex flex-col justify-center bg-gray-900 border-r border-gray-800">
                {/* Background Image with Overlays */}
                <div
                    className="absolute inset-0 z-0 opacity-40 mix-blend-overlay"
                    style={{
                        backgroundImage: 'url("/login-bg.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900/80 to-transparent z-0"></div>
                <div className="absolute inset-0 bg-school-primary/5 mix-blend-multiply z-0"></div>

                {/* Concentrated Branding Area */}
                <div className="relative z-10 px-12 lg:px-20 max-w-2xl">
                    {/* Larger Logo */}
                    <div className="mb-10 inline-block">
                        {schoolLogo ? (
                            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl p-3 border-4 border-white/20">
                                <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white/20">
                                <span className="text-school-primary font-bold text-4xl tracking-tighter">IM</span>
                            </div>
                        )}
                    </div>

                    {/* Content Grouped Tight */}
                    <div className="space-y-6">
                        <h1 className="text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                            Welcome to <br />
                            <span className="text-school-primary brightness-125">{schoolName}</span>
                        </h1>

                        <p className="text-gray-300 text-xl max-w-md leading-relaxed font-medium">
                            Experience the gold-standard of digital learning. Secure, optimized, and tailored for academic excellence.
                        </p>

                        <div className="pt-8 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-semibold text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-school-primary rounded-full shadow-[0_0_10px_var(--school-primary)]"></div>
                                CBC Integrated
                            </span>
                            <span className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-school-primary rounded-full shadow-[0_0_10px_var(--school-primary)]"></div>
                                8-4-4 Framework
                            </span>
                            <span className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-school-primary rounded-full shadow-[0_0_10px_var(--school-primary)]"></div>
                                AI Ready
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-16 bg-white overflow-hidden">
                <div className="max-w-[400px] w-full animate-in fade-in slide-in-from-bottom-4 duration-700 mt-2 md:mt-0">

                    {/* Mobile Header (Hidden on Desktop) */}
                    <div className="md:hidden flex flex-col items-center text-center mb-6">
                        {schoolLogo ? (
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-school-primary/20 p-2 border border-gray-100">
                                <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-school-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-school-primary/20">
                                <span className="text-white font-bold text-2xl tracking-tighter">IM</span>
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{schoolName}</h1>
                        <p className="text-gray-500 mt-1 text-sm">Sign in to access your portal</p>
                    </div>

                    {/* Desktop Form Header */}
                    <div className="hidden md:block mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Sign in</h2>
                        <p className="text-gray-500 mt-2 text-base">Welcome back! Please enter your details.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium flex items-start gap-3 border border-red-100/50">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email or Admin Number
                            </label>
                            <input
                                type="text"
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-school-primary focus:ring-4 focus:ring-school-primary/10 outline-none transition-all text-gray-900 text-sm"
                                placeholder="Enter your email or admin number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={securityKey}
                                onChange={(e) => setSecurityKey(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-school-primary focus:ring-4 focus:ring-school-primary/10 outline-none transition-all text-gray-900 text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-school-primary focus:ring-school-primary border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-school-primary hover:text-school-primary/80 transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 px-6 rounded-xl text-white font-medium text-sm transition-all flex justify-center items-center shadow-lg shadow-school-primary/25 hover:shadow-school-primary/40 focus:ring-4 focus:ring-school-primary/20 ${isLoading ? 'bg-school-primary/80 cursor-not-allowed' : 'bg-school-primary hover:bg-school-primary/95'
                                }`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-400 text-xs text-center">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-5 pb-4">
                            <InstallAppButton />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
