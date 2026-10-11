import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { CommandMenu } from '../components/ui/CommandMenu';
import { useAuth } from '../context/AuthContext';
import { getComputers, getIncidents, getAllSessions } from '../services/labService';
import { Computer, Incident, LabSession } from '../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function TeacherLayout() {
  const { profile, role, loading, switchToDemoAccount } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sessions, setSessions] = useState<LabSession[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [compData, incData, sessData] = await Promise.all([
        getComputers(),
        getIncidents(),
        getAllSessions(),
      ]);
      setComputers(compData || []);
      setIncidents(incData || []);
      setSessions(sessData || []);
    } catch (e) {
      console.warn('TeacherLayout fetch error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (profile?.id && (role === 'teacher' || role === 'admin')) {
      loadData();
    }
  }, [profile?.id, role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#0B2858] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Verifying faculty administrative credentials...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // Unauthorized student trying to access teacher portal
  if (role !== 'teacher' && role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-[#0B2858]/10 text-[#0B2858] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Faculty Access Restricted</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your authenticated account (<span className="font-semibold">{profile.email}</span>) is assigned the <strong>Student</strong> role. You do not possess teacher or lab administrator permissions.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link to="/student">
              <Button variant="navy" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Student Portal
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchToDemoAccount('teacher')}
              className="text-xs"
            >
              Switch to Faculty Evaluator Demo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <Sidebar portal="teacher" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenCommand={() => setCommandOpen(true)}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
        />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <CommandMenu
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        computers={computers}
        incidents={incidents}
        sessions={sessions}
        isTeacher={true}
      />
    </div>
  );
}
