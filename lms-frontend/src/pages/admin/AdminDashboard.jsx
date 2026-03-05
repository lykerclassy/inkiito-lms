import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Purely academic stats
    const stats = [
        { label: 'Total Students', value: '842', trend: '+12 this week' },
        { label: 'Active Lessons', value: '156', trend: '+4 today' },
        { label: 'Published Units', value: '24', trend: 'Across all subjects' },
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
                    <p className="text-gray-500 mt-1">Manage curriculum, users, and school operations.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => navigate('/admin/users')} variant="outline">
                        Manage Users
                    </Button>
                    <Button onClick={() => navigate('/admin/curriculum')}>
                        + Create Lesson
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="p-6">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</h3>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                        </div>
                        <div className="mt-1 text-sm text-blue-600 font-medium">
                            {stat.trend}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Academic Management Widget */}
            <div className="grid grid-cols-1 gap-6">
                <Card title="My Classes & Curriculum">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:border-blue-200 transition-colors cursor-pointer" onClick={() => navigate('/admin/curriculum')}>
                            <div>
                                <h4 className="font-semibold text-gray-800">Grade 10 - Computer Studies</h4>
                                <p className="text-sm text-gray-500">CBC Framework • 45 Students</p>
                            </div>
                            <span className="text-blue-600 font-medium text-sm">Manage &rarr;</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:border-blue-200 transition-colors cursor-pointer" onClick={() => navigate('/admin/curriculum')}>
                            <div>
                                <h4 className="font-semibold text-gray-800">Form 3 - Computer Studies</h4>
                                <p className="text-sm text-gray-500">8-4-4 Framework • 38 Students</p>
                            </div>
                            <span className="text-blue-600 font-medium text-sm">Manage &rarr;</span>
                        </div>
                    </div>
                </Card>
            </div>
            
        </div>
    );
}