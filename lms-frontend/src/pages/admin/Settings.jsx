import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function Settings() {
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState({
        school_name: '',
        contact_email: '',
        academic_year: '2025/2026',
        current_term: 'Term 1',
        enforce_passwords: 'true',
        allow_parallel_sessions: 'true'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings');
                // Backend returns a flat key-value object of settings
                setSettings(prev => ({ ...prev, ...response.data }));
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

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put('/settings', settings);
            alert('Settings updated successfully!');
            // Reload to reflect potential topbar name changes broadly
            window.location.reload();
        } catch (err) {
            alert('Failed to save settings');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-gray-500">Loading settings...</div>;

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

                <div className="flex justify-end pt-4">
                    <Button type="submit" variant="primary" isLoading={isSaving}>Save Settings</Button>
                </div>
            </form>
        </div>
    );
}
