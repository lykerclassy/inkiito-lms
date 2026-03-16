import React, { useState, useEffect, useRef } from 'react';
import api, { getMediaUrl } from '../../services/api';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function Settings() {
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [settings, setSettings] = useState({
        school_name: '',
        contact_email: '',
        academic_year: '2025/2026',
        current_term: 'Term 1',
        enforce_passwords: 'true',
        allow_parallel_sessions: 'true',
        brand_primary: '#d81d22',
        brand_secondary: '#4b4da3',
        brand_accent: '#f8af18'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('settings');
                // Backend returns a flat key-value object of settings
                setSettings(prev => ({ ...prev, ...response.data }));
                if (response.data.school_logo) {
                    setLogoPreview(getMediaUrl(response.data.school_logo));
                }
            } catch (err) {
                console.error("Failed to load settings");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();

            // Append standard text settings (exclude reserved/dangerous keys)
            const EXCLUDED_KEYS = ['school_logo', '_method', '_token'];
            Object.keys(settings).forEach(key => {
                if (!EXCLUDED_KEYS.includes(key)) {
                    formData.append(key, settings[key]);
                }
            });

            // Append logo if specifically selected
            if (logoFile) {
                formData.append('school_logo', logoFile);
            }

            // IMPORTANT: Do NOT set 'Content-Type' manually when sending FormData.
            // The browser must set it automatically so it includes the multipart boundary.
            // Deleting the global default header forces Axios to allow the browser to handle it.
            await api.post('settings', formData);

            alert('Settings updated successfully!');
            // Reload to reflect potential topbar name/logo changes broadly
            window.location.reload();
        } catch (err) {
            const status = err.response?.status;
            const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            console.error('Settings save error:', { status, serverMsg, full: err.response?.data });
            alert(`Failed to save settings. Error ${status}: ${serverMsg}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-4 text-gray-500">Loading settings...</div>;

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-500 mt-1">Configure global application preferences and parameters.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card title="General Configuration" className="shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">School Name</label>
                            <input
                                type="text"
                                name="school_name"
                                value={settings.school_name}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">System Contact Email</label>
                            <input
                                type="email"
                                name="contact_email"
                                value={settings.contact_email}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Academic Year</label>
                            <select
                                name="academic_year"
                                value={settings.academic_year}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                <option value="2025/2026">2025/2026</option>
                                <option value="2026/2027">2026/2027</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Current Term</label>
                            <select
                                name="current_term"
                                value={settings.current_term}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                <option value="Term 1">Term 1</option>
                                <option value="Term 2">Term 2</option>
                                <option value="Term 3">Term 3</option>
                            </select>
                        </div>
                    </div>
                </Card>

                <Card title="Security & API" className="shadow-sm border border-gray-100">
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="enforce_passwords"
                                    checked={settings.enforce_passwords === 'true'}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Enforce strong passwords for new staff accounts</span>
                            </label>
                        </div>
                        <div>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="allow_parallel_sessions"
                                    checked={settings.allow_parallel_sessions === 'true'}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Allow parallel student sessions</span>
                            </label>
                            <p className="text-xs text-gray-500 ml-8 mt-1">If unchecked, logging into a new device forces logout on old devices.</p>
                        </div>
                    </div>
                </Card>

                <Card title="Visual Branding & Identity (Developer UI)" className="shadow-sm border border-gray-100 bg-gray-50/50">
                    <div className="mt-4 mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">School Logo</label>
                        <div className="flex items-start gap-6">
                            <div
                                className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-white overflow-hidden relative group cursor-pointer hover:border-school-primary transition-colors hover:shadow-sm"
                                onClick={triggerFileSelect}
                            >
                                {logoPreview ? (
                                    <>
                                        <img src={logoPreview} alt="School Logo" className="w-full h-full object-contain p-2" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                            <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-school-primary transition-colors">
                                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-xs font-semibold">Upload Logo</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="flex-1 mt-2">
                                <p className="text-sm text-gray-600 font-medium">Upload your official school crest or logo.</p>
                                <p className="text-xs text-gray-400 mt-1">Recommended: Square PNG with transparent background. This logo will appear on the top navigation bar and official documents.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200/60">
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <label className="block text-xs font-semibold text-gray-400 mb-2">Uniform Primary (Red)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    name="brand_primary"
                                    value={settings.brand_primary || '#d81d22'}
                                    onChange={handleChange}
                                    className="w-12 h-12 rounded-lg cursor-pointer border-none"
                                />
                                <input
                                    type="text" name="brand_primary" value={settings.brand_primary || '#d81d22'} onChange={handleChange}
                                    className="flex-1 p-2 text-xs font-bold uppercase border border-gray-200 rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <label className="block text-xs font-semibold text-gray-400 mb-2">Uniform Secondary (Indigo)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    name="brand_secondary"
                                    value={settings.brand_secondary || '#4b4da3'}
                                    onChange={handleChange}
                                    className="w-12 h-12 rounded-lg cursor-pointer border-none"
                                />
                                <input
                                    type="text" name="brand_secondary" value={settings.brand_secondary || '#4b4da3'} onChange={handleChange}
                                    className="flex-1 p-2 text-xs font-bold uppercase border border-gray-200 rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <label className="block text-xs font-semibold text-gray-400 mb-2">Sunlight Accent (Yellow)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    name="brand_accent"
                                    value={settings.brand_accent || '#f8af18'}
                                    onChange={handleChange}
                                    className="w-12 h-12 rounded-lg cursor-pointer border-none"
                                />
                                <input
                                    type="text" name="brand_accent" value={settings.brand_accent || '#f8af18'} onChange={handleChange}
                                    className="flex-1 p-2 text-xs font-bold uppercase border border-gray-200 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] text-gray-400 font-bold">
                        * Changes here will synchronize across the entire student and staff network instantly.
                    </p>
                </Card>


                <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" isLoading={isSaving}>Save Settings</Button>
                </div>
            </form>
        </div>
    );
}
