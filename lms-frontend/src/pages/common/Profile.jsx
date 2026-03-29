import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api, { getMediaUrl } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useNotification } from '../../contexts/NotificationContext';

export default function Profile() {
    const { user, updateUser } = useContext(AuthContext);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        avatar: null
    });

    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [isCheckingGoogle, setIsCheckingGoogle] = useState(true);

    useEffect(() => {
        const checkGoogleStatus = async () => {
            try {
                const res = await api.get('google/status');
                setIsGoogleConnected(res.data.is_connected);
            } catch (err) {
                console.error("Google status check failed", err);
            } finally {
                setIsCheckingGoogle(false);
            }
        };
        if (user) checkGoogleStatus();
    }, [user]);

    const handleConnectGoogle = async () => {
        try {
            const res = await api.get('auth/google/redirect');
            if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (err) {
            showNotification("Failed to initialize Google connection.", "error");
        }
    };

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
            if (user.avatar) {
                setAvatarPreview(getMediaUrl(user.avatar));
            }
        }
    }, [user]);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const status = query.get('status');
        const message = query.get('message');

        if (status === 'success') {
            showNotification(message || "Operation successful", "success");
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (status === 'error') {
            showNotification(message || "An error occurred", "error");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, avatar: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.password_confirmation) {
            showNotification('Passwords do not match', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            // Because we might send a file, we use FormData
            const payload = new FormData();
            payload.append('name', formData.name);

            if (formData.email) {
                payload.append('email', formData.email);
            }
            if (formData.password) {
                payload.append('password', formData.password);
            }
            if (formData.avatar) {
                payload.append('avatar', formData.avatar);
            }

            // IMPORTANT: Do NOT set Content-Type manually for FormData.
            // The browser must set it with the correct multipart boundary.
            const response = await api.post('user/profile', payload);

            // Update local context immediately
            if (response.data.user) {
                updateUser(response.data.user);
            }

            showNotification('Profile updated successfully!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Update failed:', error);
            showNotification(error.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Premium Header */}
            <div className="relative overflow-hidden bg-school-secondary rounded-3xl p-8 text-white shadow-xl shadow-indigo-900/10 group mt-4 mx-4 md:mx-0">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-school-primary/20 rounded-full blur-3xl group-hover:bg-school-primary/30 transition-all duration-1000"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Avatar Section */}
                    <div className="relative group/avatar cursor-pointer" onClick={triggerFileSelect}>
                        <div className="w-40 h-40 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl relative bg-white/10 backdrop-blur-md flex items-center justify-center transition-transform duration-500 group-hover/avatar:scale-105 group-hover/avatar:border-white/40">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-6xl font-black text-white/50">{user?.name?.charAt(0) || 'U'}</span>
                            )}
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                                <svg className="w-10 h-10 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-white text-xs font-bold tracking-wider uppercase">Change</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-school-primary text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg shadow-red-900/50 border border-white/20 whitespace-nowrap">
                            {user?.role === 'student' ? 'Student' : 'Staff Member'}
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left mt-4 md:mt-6">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                            <span className="text-xs font-bold text-indigo-200 tracking-widest uppercase">Active Account</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2 drop-shadow-md">
                            {user?.name}
                        </h1>
                        <p className="text-indigo-100/80 font-medium text-sm md:text-base max-w-lg mb-6">
                            Manage your personal settings, security preferences, and update your account details.
                        </p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            {user?.admission_number && (
                                <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-school-primary/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-school-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider mb-0.5">Admission No.</p>
                                        <p className="text-white font-black text-sm">{user.admission_number}</p>
                                    </div>
                                </div>
                            )}
                            <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider mb-0.5">Email Address</p>
                                    <p className="text-white font-black text-sm">{user?.email || 'Not Provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
                {/* Information Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-sm shadow-gray-100 rounded-3xl p-6 bg-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 1.5c-3.328 0-10 1.666-10 5v2h20v-2c0-3.334-6.672-5-10-5z" /></svg>
                        </div>
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-4 mb-6 relative z-10">
                            Account Details
                        </h3>
                        <div className="space-y-6 relative z-10">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role</p>
                                <p className="text-sm font-semibold text-gray-800 capitalize bg-gray-50 px-3 py-2 rounded-xl inline-block border border-gray-100">{user?.role?.replace('_', ' ')}</p>
                            </div>

                            {user?.curriculum && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Curriculum Focus</p>
                                    <p className="text-sm font-semibold text-gray-800 bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-2 rounded-xl inline-block">{user.curriculum.name}</p>
                                </div>
                            )}

                            {user?.academic_level && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Academic Level</p>
                                    <p className="text-sm font-semibold text-gray-800 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-2 rounded-xl inline-block">{user.academic_level.name}</p>
                                </div>
                            )}

                            <div className="pt-6 mt-6 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 italic pb-2 text-center">
                                    Security notice: Store your passwords and login credentials securely.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main Edit Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl shadow-gray-200/40 rounded-3xl p-6 md:p-8 bg-white relative overflow-hidden">

                        <div className="mb-8">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Edit Profile</h2>
                            <p className="text-sm text-gray-500 mt-1 font-medium">Update your profile identity and security settings.</p>
                        </div>

                        <form onSubmit={handleSave} className="space-y-8 relative z-10">
                            {/* Personal Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary outline-none transition-all duration-300 font-medium text-gray-800"
                                        placeholder="John Doe"
                                    />
                                </div>

                                {user?.role !== 'student' && (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary outline-none transition-all duration-300 font-medium text-gray-800"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                )}

                                {user?.role === 'student' && (
                                    <div className="space-y-2 relative">
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Admission Number</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={user.admission_number || ''}
                                            className="w-full p-3.5 bg-gray-100 border border-gray-200 text-gray-400 rounded-xl cursor-not-allowed font-medium"
                                        />
                                        <div className="absolute right-3 top-9 text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Security Section (Password) */}
                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-base font-black text-gray-800 mb-6 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-school-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" /></svg>
                                    Security settings
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-red-50/50 p-6 rounded-2xl border border-red-100">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">New Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary outline-none transition-all duration-300"
                                            placeholder="Leave blank to keep unchanged"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Confirm Password</label>
                                        <input
                                            type="password"
                                            name="password_confirmation"
                                            value={formData.password_confirmation}
                                            onChange={handleChange}
                                            className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary outline-none transition-all duration-300"
                                            placeholder="Re-enter new password"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Google Integration Section */}
                            {user?.role !== 'student' && (
                                <div className="pt-8 border-t border-gray-100">
                                    <h3 className="text-base font-black text-gray-800 mb-6 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        Live Classes & Calendar
                                    </h3>
                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-gray-900 uppercase italic tracking-tighter">Google Meet Integration</h4>
                                            <p className="text-xs text-gray-500 font-medium">Connect your Google account to automatically generate authentic Google Meet links and sync classes to your calendar.</p>
                                        </div>
                                        
                                        {isCheckingGoogle ? (
                                            <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                                        ) : isGoogleConnected ? (
                                            <div className="flex items-center gap-3 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                <span className="text-xs font-black uppercase tracking-widest">Google Connected</span>
                                            </div>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={handleConnectGoogle}
                                                className="flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl border border-gray-200 shadow-sm transition-all hover:scale-105 active:scale-95 group"
                                            >
                                                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/>
                                                </svg>
                                                <span className="text-xs font-black uppercase tracking-widest pt-0.5">Connect Google</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-6 border-t border-gray-100">
                                <Button
                                    type="submit"
                                    isLoading={isSaving}
                                    className="bg-school-primary hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl shadow-lg shadow-school-primary/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
