import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Eye,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getComputers,
  getIncidents,
  getAllSessions,
  getStudentsList
} from '../../services/labService';
import { Computer, Incident, LabSession, UserProfile, StudentProfile } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export function TeacherDashboard() {
  const { profile } = useAuth();
  const [computers, setComputers] = useState<Computer[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sessions, setSessions] = useState<LabSession[]>([]);
  const [students, setStudents] = useState<{ profile: UserProfile; student?: StudentProfile }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [comps, incs, sess, studs] = await Promise.all([
        getComputers(),
        getIncidents(),
        getAllSessions(),
        getStudentsList(),
      ]);
      setComputers(comps || []);
      setIncidents(incs || []);
      setSessions(sess || []);
      setStudents(studs || []);
    } catch (e) {
      console.warn('Dashboard err:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalComputers = computers.length;
  const inUseCount = computers.filter((c) => c.status === 'in_use').length;
  const availableCount = computers.filter((c) => c.status === 'available').length;
  const maintenanceCount = computers.filter((c) => c.status === 'maintenance' || c.status === 'damaged').length;
  const openIncidentsCount = incidents.filter((i) => i.status === 'Open' || i.status === 'Investigating' || i.status === 'In Progress').length;
  const activeSessions = sessions.filter((s) => s.status === 'active');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E1E5EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0B2858] text-white uppercase tracking-wider">
              Faculty Administration
            </span>
            <span className="text-xs text-slate-500 font-medium">
              GIET Central Computer Center
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Laboratory Command Overview
          </h1>
          <p className="text-xs text-slate-500">
            Real-time telemetry for computer terminals, student attendance sessions, and maintenance incident tickets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/teacher/reports">
            <Button variant="outline" size="sm">
              Generate Accreditation Report
            </Button>
          </Link>
          <Link to="/teacher/computers">
            <Button variant="primary" size="sm">
              <Monitor className="w-4 h-4 mr-1.5" />
              Manage Inventory
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={students.length || 3}
          subtitle="Enrolled in Labs"
          icon={<Users className="w-5 h-5" />}
          colorVariant="navy"
        />
        <StatCard
          title="Total Workstations"
          value={totalComputers}
          subtitle="Across 2 Labs"
          icon={<Monitor className="w-5 h-5" />}
          colorVariant="blue"
        />
        <StatCard
          title="Computers In Use"
          value={inUseCount}
          subtitle={`${Math.round((inUseCount / (totalComputers || 1)) * 100)}% Utilization`}
          icon={<Clock className="w-5 h-5" />}
          colorVariant="emerald"
        />
        <StatCard
          title="Available PCs"
          value={availableCount}
          subtitle="Ready for practicals"
          icon={<CheckCircle2 className="w-5 h-5" />}
          colorVariant="emerald"
        />
        <StatCard
          title="Under Maintenance"
          value={maintenanceCount}
          subtitle="Hardware / OS triage"
          icon={<Wrench className="w-5 h-5" />}
          colorVariant="amber"
        />
        <StatCard
          title="Open Incidents"
          value={openIncidentsCount}
          subtitle="Awaiting action"
          icon={<AlertTriangle className="w-5 h-5" />}
          colorVariant="amber"
        />
      </div>

      {/* Main Grid: Workstations Telemetry & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Workstation Status Board */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Live Computer Grid Status"
              subtitle="Overview of workstations in Alan Turing Lab (101) & Ada Lovelace Lab (204)"
              action={
                <Link
                  to="/teacher/computers"
                  className="text-xs font-semibold text-[#0B2858] hover:underline flex items-center gap-1"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {computers.map((comp) => {
                  const currentSession = activeSessions.find((s) => s.computer_id === comp.id);
                  return (
                    <div
                      key={comp.id}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        comp.status === 'in_use'
                          ? 'bg-blue-50/70 border-blue-200'
                          : comp.status === 'available'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : comp.status === 'damaged'
                          ? 'bg-slate-100 border-slate-300'
                          : 'bg-amber-50/60 border-amber-200'
                      }`}
                    >
                      <div className="font-bold text-slate-800 text-sm">{comp.computer_number}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {currentSession?.student_name ? currentSession.student_name.split(' ')[0] : comp.status}
                      </div>
                      <div className="mt-2 flex justify-center">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            comp.status === 'available'
                              ? 'bg-emerald-500 animate-pulse'
                              : comp.status === 'in_use'
                              ? 'bg-blue-500'
                              : comp.status === 'damaged'
                              ? 'bg-slate-500'
                              : 'bg-amber-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Lab Sessions */}
          <Card>
            <CardHeader
              title="Currently Active Sessions"
              subtitle="Students logged into laboratory machines in real-time."
              action={
                <Link
                  to="/teacher/sessions"
                  className="text-xs font-semibold text-[#0B2858] hover:underline flex items-center gap-1"
                >
                  All Sessions <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent className="p-0">
              {activeSessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No active workstation sessions right now. Computers are idle and available.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {activeSessions.map((s) => (
                    <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0B2858] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {s.computer_number}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{s.student_name}</div>
                          <div className="text-slate-500">
                            Roll: {s.student_roll_no || 'N/A'} • {s.purpose}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Online
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Started at {new Date(s.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Incident Tickets Priority Queue */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Incident Priority Queue"
              subtitle="Pending malfunctions requiring faculty or CCC technician inspection"
              action={
                <Link
                  to="/teacher/incidents"
                  className="text-xs font-semibold text-[#0B2858] hover:underline"
                >
                  Desk ({openIncidentsCount})
                </Link>
              }
            />
            <CardContent className="p-0">
              {incidents.slice(0, 6).map((inc) => (
                <div key={inc.id} className="p-3.5 border-b border-slate-100 hover:bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {inc.computer_number}: {inc.category}
                    </span>
                    <Badge variant="severity" severity={inc.severity} />
                  </div>
                  <p className="text-slate-600 line-clamp-2 leading-relaxed">
                    {inc.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>By {inc.student_name || 'Student'}</span>
                    <Badge variant="incidentStatus" incidentStatus={inc.status} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[#0B2858] text-white">
            <CardContent className="p-5 space-y-2">
              <h4 className="font-bold text-sm text-white">GIET Autonomous Lab Protocol</h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                All laboratory assets must be inspected bi-weekly. Incident resolutions are permanently archived for NAAC Criterion IV infrastructure audits.
              </p>
              <div className="pt-2">
                <Link to="/teacher/reports">
                  <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs">
                    Export Audit Trail
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
