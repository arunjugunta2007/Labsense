import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';

// Layouts
import { StudentLayout } from './layouts/StudentLayout';
import { TeacherLayout } from './layouts/TeacherLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentSessionPage } from './pages/student/StudentSessionPage';
import { StudentIncidentPage } from './pages/student/StudentIncidentPage';
import { StudentHistoryPage } from './pages/student/StudentHistoryPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherStudentsPage } from './pages/teacher/TeacherStudentsPage';
import { TeacherComputersPage } from './pages/teacher/TeacherComputersPage';
import { TeacherSessionsPage } from './pages/teacher/TeacherSessionsPage';
import { TeacherIncidentsPage } from './pages/teacher/TeacherIncidentsPage';
import { TeacherReportsPage } from './pages/teacher/TeacherReportsPage';

function RootRedirect() {
  const { profile, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#0B2858] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Initializing GIET LabSense...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'teacher' || role === 'admin') {
    return <Navigate to="/teacher" replace />;
  }

  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Student Portal Routes */}
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="session" element={<StudentSessionPage />} />
              <Route path="report-incident" element={<StudentIncidentPage />} />
              <Route path="history" element={<StudentHistoryPage />} />
            </Route>

            {/* Teacher Portal Routes */}
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<TeacherDashboard />} />
              <Route path="students" element={<TeacherStudentsPage />} />
              <Route path="computers" element={<TeacherComputersPage />} />
              <Route path="sessions" element={<TeacherSessionsPage />} />
              <Route path="incidents" element={<TeacherIncidentsPage />} />
              <Route path="reports" element={<TeacherReportsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
