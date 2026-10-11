import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MonitorPlay,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  StopCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getActiveSessionForStudent, getSessionsForStudent, endLabSession } from '../../services/labService';
import { LabSession } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export function StudentDashboard() {
  const { profile, studentDetails } = useAuth();
  const { success, error } = useToast();

  const [activeSession, setActiveSession] = useState<LabSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<LabSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [endSessionModalOpen, setEndSessionModalOpen] = useState(false);
  const [ending, setEnding] = useState(false);

  const loadStudentData = async () => {
    if (!profile?.id) return;
    try {
      const [active, history] = await Promise.all([
        getActiveSessionForStudent(profile.id),
        getSessionsForStudent(profile.id),
      ]);
      setActiveSession(active);
      setRecentSessions((history || []).slice(0, 5));
    } catch (err) {
      console.warn('Dashboard load err:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [profile?.id]);

  // Live timer for active session
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      const start = new Date(activeSession.login_time).getTime();
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((now - start) / 1000));
      const hours = String(Math.floor(diffSecs / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((diffSecs % 3600) / 60)).padStart(2, '0');
      const seconds = String(diffSecs % 60).padStart(2, '0');
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const handleEndSession = async () => {
    if (!activeSession || !profile?.id) return;
    setEnding(true);
    try {
      await endLabSession(activeSession.id, activeSession.computer_id, profile.id);
      success('Session Ended', `Workstation ${activeSession.computer_number} released successfully.`);
      setActiveSession(null);
      setEndSessionModalOpen(false);
      loadStudentData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to end session';
      error('Operation Failed', msg);
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0B2858] to-[#12366B] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600/70 border border-blue-400/30 uppercase tracking-wider text-white">
              Student ID: {studentDetails?.student_id || '21GIETCS042'}
            </span>
            <span className="text-xs text-slate-300">
              {studentDetails?.department || 'Computer Science & Engineering'}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-2">
            Welcome back, {profile?.full_name || 'Rahul Varma'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {studentDetails?.year || '3rd Year'} • {studentDetails?.section || 'Section A'} • Central Computer Center
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/student/session">
            <Button variant="primary" size="md">
              <MonitorPlay className="w-4 h-4 mr-1.5" />
              {activeSession ? 'Manage Active Session' : 'Start Lab Session'}
            </Button>
          </Link>
          <Link to="/student/report-incident">
            <Button variant="outline" size="md" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <AlertCircle className="w-4 h-4 mr-1.5 text-blue-200" />
              Report Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Session Status Box */}
      {activeSession ? (
        <Card className="border-l-4 border-l-emerald-500 bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MonitorPlay className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Active Lab Session
                    </span>
                    <span className="text-xs text-slate-500">
                      Started at {new Date(activeSession.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    Workstation {activeSession.computer_number}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <strong>Lab:</strong> {activeSession.lab_name || 'Turing Lab 101'} • <strong>Purpose:</strong> {activeSession.purpose}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Elapsed Duration
                  </span>
                  <span className="text-xl font-mono font-bold text-[#0B2858]">
                    {elapsedTime}
                  </span>
                </div>
                <Button
                  variant="navy"
                  size="sm"
                  onClick={() => setEndSessionModalOpen(true)}
                  className="shrink-0"
                >
                  <StopCircle className="w-4 h-4 mr-1.5" />
                  End Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">No Active Session</h4>
                <p className="text-xs text-slate-500">
                  Select an available workstation to log in for your lab practical.
                </p>
              </div>
            </div>
            <Link to="/student/session">
              <Button variant="navy" size="sm">
                Login to PC <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Grid: Academic & Lab Info + Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Academic & Lab Pass details */}
        <Card className="lg:col-span-1">
          <CardHeader title="Student Identification Card" />
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Roll Number:</span>
                <span className="font-bold text-slate-800">{studentDetails?.student_id || '21GIETCS042'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Program:</span>
                <span className="font-semibold text-slate-800">B.Tech (CSE)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Academic Year:</span>
                <span className="font-semibold text-slate-800">{studentDetails?.year || '3rd Year'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Class Section:</span>
                <span className="font-semibold text-slate-800">{studentDetails?.section || 'Section A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Lab Clearance:</span>
                <span className="inline-flex items-center text-emerald-600 font-semibold gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authorized
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Lab Code of Conduct:</strong> Always log out your workstation before leaving. Report any damaged peripherals immediately to avoid shared accountability.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Right: Recent Sessions */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Lab Sessions"
            action={
              <Link to="/student/history" className="text-xs font-semibold text-[#0B2858] hover:underline flex items-center gap-1">
                View All History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardContent className="p-0">
            {recentSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No past lab sessions recorded yet. Start your first session above!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSessions.map((sess) => (
                  <div key={sess.id} className="p-4 hover:bg-slate-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#0B2858] font-bold flex items-center justify-center shrink-0">
                        {sess.computer_number || 'PC'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">
                          {sess.lab_name || 'Alan Turing Lab'}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {sess.purpose}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-slate-600 font-medium">
                        {new Date(sess.login_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(sess.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {sess.logout_time && ` - ${new Date(sess.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal for Ending Session */}
      <Modal
        isOpen={endSessionModalOpen}
        onClose={() => setEndSessionModalOpen(false)}
        title="Confirm End of Lab Session"
        description="Are you sure you wish to log out and release this workstation?"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEndSessionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="navy"
              size="sm"
              loading={ending}
              onClick={handleEndSession}
            >
              Yes, Release Workstation
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Ending this session will record your exact logout timestamp in the GIET Lab Attendance registry and make workstation <strong>{activeSession?.computer_number}</strong> available for other engineering students.
        </p>
      </Modal>
    </div>
  );
}
