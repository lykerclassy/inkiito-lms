import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import Login from './pages/auth/Login';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';

// Student Pages
import Dashboard from './pages/student/Dashboard';
import SubjectList from './pages/student/SubjectList';
import SubjectDetails from './pages/student/SubjectDetails';
import LessonView from './pages/student/LessonView';
import Assignments from './pages/student/Assignments';
import AssignmentView from './pages/student/AssignmentView';
import Grades from './pages/student/Grades';
import Quizzes from './pages/student/Quizzes';
import QuizPlayer from './pages/student/QuizPlayer';
import KeyboardingTracker from './pages/student/KeyboardingTracker';
import EnglishLearning from './pages/student/EnglishLearning';
import ICTLab from './pages/student/ICTLab';
import ScienceLab from './pages/student/ScienceLab';
import ExperimentView from './pages/student/ExperimentView';
import CareerExplorer from './pages/student/CareerExplorer';
import Downloadables from './pages/student/Downloadables';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CurriculumManager from './pages/admin/CurriculumManager';
import LessonBuilder from './pages/admin/LessonBuilder';
import UserManagement from './pages/admin/UserManagement';
import AdminAssignments from './pages/admin/Assignments';
import AssignmentBuilder from './pages/admin/AssignmentBuilder';
import AdminGrades from './pages/admin/Grades';
import Settings from './pages/admin/Settings';
import HardwareManager from './pages/admin/HardwareManager';
import ScienceLabManager from './pages/admin/ScienceLabManager';
import CareerManager from './pages/admin/CareerManager';
import VocabularyManager from './pages/admin/VocabularyManager';
import ResourceManager from './pages/admin/ResourceManager';
import QuizManager from './pages/admin/QuizManager';
import QuizQuestionEditor from './pages/admin/QuizQuestionEditor';

// Shared Pages
import Profile from './pages/common/Profile';

// --- ROLE GROUPS ---
const ALL_STAFF = ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'class_teacher', 'teacher'];
const MANAGEMENT = ['admin', 'developer', 'principal', 'deputy_principal', 'dos'];
const SYS_ADMIN = ['admin', 'developer'];
const CONTENT_STAFF = ALL_STAFF; // All teachers + management can manage content

import nprogress from 'nprogress';
import 'nprogress/nprogress.css';
import { useLocation } from 'react-router-dom';
import api from './services/api';
import { useNotification } from './contexts/NotificationContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-2 border-gray-100 border-t-school-primary rounded-[1.5rem] animate-[spin_2s_linear_infinite] shadow-xl shadow-red-50"></div>
      <div className="text-center">
        <p className="font-black uppercase tracking-[0.3em] italic text-gray-900 text-[10px] leading-tight mb-2">Synchronizing Node</p>
        <p className="font-black uppercase tracking-[0.4em] italic text-gray-300 text-[8px] opacity-60">Master Connection Engaged</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'student' ? "/student/dashboard" : "/admin/dashboard"} replace />;
  }

  return children;
};

// Professional Navigation Sync Handler
const NavigationSync = () => {
  const location = useLocation();

  useEffect(() => {
    nprogress.start();
    const timer = setTimeout(() => {
      nprogress.done();
    }, 100); // Visual cue that sync is complete
    return () => {
      clearTimeout(timer);
      nprogress.done();
    };
  }, [location.pathname]);

  return null;
};

export default function App() {
  const { showNotification } = useNotification();
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    // Global Alert Override
    window.alert = (message) => {
      showNotification(message, 'info');
    };

    // Global Confirm Override (Note: returns promise, might need await in modern code)
    window.confirm = (message) => {
      showNotification(message, 'confirm', 'Wait a moment');
      return false; // Native confirm is sync, this override is limited. 
      // Better to use useNotification().askConfirmation() directly in components.
    };

    // Fetch and Apply Shared Branding (Uniform Colors)
    const applyBranding = async () => {
      try {
        const res = await api.get('branding');
        const settings = res.data;
        if (settings.brand_primary) document.documentElement.style.setProperty('--school-primary', settings.brand_primary);
        if (settings.brand_secondary) document.documentElement.style.setProperty('--school-secondary', settings.brand_secondary);
        if (settings.brand_accent) document.documentElement.style.setProperty('--school-accent', settings.brand_accent);
      } catch (err) {
        console.warn("Using default school theme palette.");
      }
    };
    applyBranding();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,var(--school-primary),transparent_70%)] animate-pulse"></div>
      <div className="relative">
        <div className="w-24 h-24 border-2 border-gray-50 rounded-[2.5rem] animate-[spin_3s_linear_infinite] shadow-2xl shadow-red-100"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-school-primary rounded-2xl animate-pulse shadow-2xl shadow-red-200 rotate-12"></div>
        </div>
      </div>
      <div className="mt-12 text-center space-y-4 relative z-10">
        <h2 className="text-4xl font-black text-gray-900 italic uppercase tracking-tighter leading-none">Inkiito Engine</h2>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] italic animate-pulse opacity-60">Master Synchronization Engaged</p>
      </div>
    </div>
  );


  return (
    <Router>
      <NavigationSync />
      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'student' ? "/student/dashboard" : "/admin/dashboard"} replace /> : <Login />} />

        {/* --- STUDENT ROUTES --- */}
        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['student', ...ALL_STAFF]}>
            <StudentLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="subjects" element={<SubjectList />} />
                <Route path="subjects/:id" element={<SubjectDetails />} />
                <Route path="lessons/:id" element={<LessonView />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="assignments/:id" element={<AssignmentView />} />
                <Route path="quizzes" element={<Quizzes />} />
                <Route path="quizzes/:id" element={<QuizPlayer />} />
                <Route path="grades" element={<Grades />} />
                <Route path="profile" element={<Profile />} />
                <Route path="typing" element={<KeyboardingTracker />} />
                <Route path="english" element={<EnglishLearning />} />
                <Route path="ict-lab" element={<ICTLab />} />
                <Route path="science-lab" element={<ScienceLab />} />
                <Route path="science-lab/:slug" element={<ExperimentView />} />
                <Route path="future-focus" element={<CareerExplorer />} />
                <Route path="resources" element={<Downloadables />} />
              </Routes>
            </StudentLayout>
          </ProtectedRoute>
        } />

        {/* --- ADMIN / STAFF ROUTES --- */}
        <Route path="/admin/*" element={
          // The Layout itself requires basic staff access
          <ProtectedRoute allowedRoles={ALL_STAFF}>
            <AdminLayout>
              <Routes>
                {/* Universally accessible staff pages */}
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="lessons/:id/edit" element={<LessonBuilder />} />
                <Route path="assignments" element={<AdminAssignments />} />
                <Route path="assignments/:id/edit-content" element={<AssignmentBuilder />} />
                <Route path="grades" element={<AdminGrades />} />
                <Route path="quizzes" element={<QuizManager />} />
                <Route path="quizzes/:id/questions" element={<QuizQuestionEditor />} />
                <Route path="profile" element={<Profile />} />

                {/* CONTENT MANAGEMENT: Available to ALL STAFF (all teachers teach) */}
                <Route path="science-labs" element={<ScienceLabManager />} />
                <Route path="career-mapping" element={<CareerManager />} />
                <Route path="vocabulary-bank" element={<VocabularyManager />} />
                <Route path="resource-library" element={<ResourceManager />} />
                <Route path="lab-assets" element={<HardwareManager />} />

                {/* PREVIEW MODES: Point to the same student components but rendered inside AdminLayout */}
                <Route path="science-labs/view/:slug" element={<ScienceLab />} />
                <Route path="science-labs/preview/:slug" element={<ExperimentView />} />

                {/* MANAGEMENT RESTRICTED: Curriculum structure & User accounts */}
                <Route path="curriculum" element={
                  <ProtectedRoute allowedRoles={MANAGEMENT}>
                    <CurriculumManager />
                  </ProtectedRoute>
                } />
                <Route path="users" element={
                  <ProtectedRoute allowedRoles={MANAGEMENT}>
                    <UserManagement />
                  </ProtectedRoute>
                } />

                {/* SYSTEM ADMIN ONLY: App settings */}
                <Route path="settings" element={
                  <ProtectedRoute allowedRoles={SYS_ADMIN}>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}