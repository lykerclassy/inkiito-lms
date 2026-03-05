import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function Profile() {
    const { user, login } = useContext(AuthContext); // In some apps updateContext logic goes through login mapping
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.password_confirmation) {
            alert('Passwords do not match');
            return;
        }

        setIsSaving(true);
        try {
            const response = await api.put('/user/profile', formData);
            alert('Profile updated successfully!');
            // Force a refresh so the token/user state clears/refetches if they changed major credentials
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500 mt-1">Manage your personal account settings and security.</p>
            </div>

            <Card className="shadow-sm border border-gray-100">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {user?.role !== 'student' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    )}

                    {user?.role === 'student' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Number</label>
                            <input
                                type="text"
                                disabled
                                value={user.admission_number || ''}
                                className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1">Admission numbers cannot be changed.</p>
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Update Password</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">New Password (Optional)</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Leave blank to keep current password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="password_confirmation"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" variant="primary" isLoading={isSaving}>Save Profile</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
