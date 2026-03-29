import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 md:px-8">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-12 border border-gray-100">
                
                <div className="mb-12 text-center">
                    <div className="inline-block p-4 bg-school-primary/10 rounded-2xl mb-4">
                        <svg className="w-12 h-12 text-school-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 italic uppercase tracking-tighter mb-2">Privacy Policy</h1>
                    <p className="text-gray-500 font-medium">Last updated: March 22, 2026</p>
                </div>

                <div className="prose prose-indigo max-w-none space-y-10">
                    
                    <section>
                        <h2 className="text-2xl font-black text-gray-800 italic uppercase tracking-tight mb-4 border-l-4 border-school-primary pl-4">1. Introduction</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Inkiito LMS ("we", "our", or "the platform") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your data when you use our learning management system.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-gray-800 italic uppercase tracking-tight mb-4 border-l-4 border-school-primary pl-4">2. Data We Collect</h2>
                        <ul className="list-disc pl-6 space-y-3 text-gray-600 font-medium">
                            <li>Account Information: Name, school email, role (student/teacher), and profile avatar.</li>
                            <li>Academic Data: Enrollment, grades, assignments, and curriculum progress.</li>
                            <li>Integration Tokens: For schools using Google Meet integration, we securely store encrypted OAuth tokens.</li>
                        </ul>
                    </section>

                    <section className="bg-blue-50/50 p-6 md:p-8 rounded-3xl border border-blue-100">
                        <h2 className="text-2xl font-black text-blue-900 italic uppercase tracking-tight mb-4 flex items-center gap-3">
                            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            3. Google API Usage
                        </h2>
                        <p className="text-blue-800/80 mb-4 leading-relaxed font-medium">
                            Inkiito LMS integrates with **Google Calendar** and **Google Meet APIs** to provide automated scheduling of live classes.
                        </p>
                        <ul className="list-disc pl-6 space-y-3 text-blue-800 font-bold">
                            <li>We use these APIs to create Calendar Events and generate Google Meet meeting links on the teacher's behalf.</li>
                            <li>We only request access to scopes necessary for calendar management (`https://www.googleapis.com/auth/calendar`).</li>
                            <li>The data retrieved from Google APIs is used exclusively for synchronizing the LMS schedule with your Google account.</li>
                            <li>**We do not share data received from Google APIs with third parties.**</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-gray-800 italic uppercase tracking-tight mb-4 border-l-4 border-school-primary pl-4">4. Data Security</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We use industry-standard encryption (AES-256) to store sensitive OAuth tokens and session data. All API communications between the LMS and Google are conducted over secure HTTPS connections.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-gray-800 italic uppercase tracking-tight mb-4 border-l-4 border-school-primary pl-4">5. Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have any questions about this Privacy Policy or Inkiito LMS, please contact our system administrator or the school's ICT department.
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-100 flex justify-center">
                    <Link to="/login" className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black uppercase tracking-widest text-xs rounded-xl transition-all">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
