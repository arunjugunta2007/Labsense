import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { CommandMenu } from '../components/ui/CommandMenu';
import { useAuth } from '../context/AuthContext';
import { getComputers, getIncidents, getSessionsForStudent } from '../services/labService';
import { Computer, Incident, LabSession } from '../types';

export function StudentLayout() {
  const { profile, role, loading } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sessions, setSessions] = useState<LabSession[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [compData, incData] = await Promise.all([
        getComputers(),
        getIncidents(),
      ]);
      setComputers(compData || []);
      setIncidents(incData || []);
      if (profile?.id) {
        const sessData = await getSessionsForStudent(profile.id);
        setSessions(sessData || []);
      }
    } catch (e) {
      console.warn('StudentLayout fetch err:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#0B2858] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading LabSense Student Portal...</p>
        </div>
      </div>
    );
  }

  // Auth & Role protection
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <Sidebar portal="student" />
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
        isTeacher={false}
      />
    </div>
  );
}
