import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function Login() {
    // Updated state variables to match the new "Smart Login" logic
    const [identifier, setIdentifier] = useState('');
    const [securityKey, setSecurityKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Pass the new field names expected by the Laravel AuthController
            const user = await login({ 
                identifier: identifier, 
                security_key: securityKey 
            });
            
            // Route the user based on their role
            if (user.role === 'admin' || user.role === 'teacher') {
                navigate('/admin/dashboard');
            } else {
                navigate('/student/dashboard');
            }
        } catch (err) {
            setError('Invalid credentials. Please check your details and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
            
            {/* Left Side: Branding & Welcome */}
            <div className="md:w-1/2 bg-blue-700 text-white flex flex-col justify-center items-center p-8 lg:p-16">
                <div className="max-w-md w-full text-center md:text-left">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 mx-auto md:mx-0">
                        <span className="text-blue-700 font-bold text-xl">IM</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                        Inkiito Manoh <br /> Senior School
                    </h1>
                    <p className="text-blue-100 text-lg mb-8">
                        Welcome to the unified Learning Management System. Access your CBC and 8-4-4 materials, interactive practicals, and automated assessments in one place.
                    </p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 sm:p-12">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
                        <p className="text-gray-500 mt-2">Staff use email, students use admission number</p>
                    </div>

                    {/* Error Message Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address or Admission Number
                            </label>
                            <input 
                                type="text" 
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                                placeholder="e.g., admin@inkiitomanoh.com or ADM-1024"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password or Access Key
                            </label>
                            <input 
                                type="password" 
                                required
                                value={securityKey}
                                onChange={(e) => setSecurityKey(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className={`w-full py-3 px-4 rounded-lg text-white font-medium shadow-md transition-all flex justify-center items-center ${
                                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                            }`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>
            </div>

        </div>
    );
}