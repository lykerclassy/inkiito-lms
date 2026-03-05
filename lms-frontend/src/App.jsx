import React, { useContext } from 'react';
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
import Grades from './pages/student/Grades';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CurriculumManager from './pages/admin/CurriculumManager';
import LessonBuilder from './pages/admin/LessonBuilder';
import UserManagement from './pages/admin/UserManagement';
import AdminAssignments from './pages/admin/Assignments';
import AssignmentBuilder from './pages/admin/AssignmentBuilder';
import AdminGrades from './pages/admin/Grades';

// --- ROLE GROUPS ---
const ALL_STAFF = ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'class_teacher', 'teacher'];
const MANAGEMENT = ['admin', 'developer', 'principal', 'deputy_principal', 'dos'];

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If they lack permission, send them to their respective safe zone
    return <Navigate to={user.role === 'student' ? "/student/dashboard" : "/admin/dashboard"} replace />;
  }

  return children;
};

export default function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'student' ? "/student/dashboard" : "/admin/dashboard"} replace /> : <Login />} />

        {/* --- STUDENT ROUTES --- */}
        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="subjects" element={<SubjectList />} />
                <Route path="subjects/:id" element={<SubjectDetails />} />
                <Route path="lessons/:id" element={<LessonView />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="grades" element={<Grades />} />
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

                      {/* RESTRICTED PAGES: Only Management can access these */}
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
                  </Routes>
              </AdminLayout>
            </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}