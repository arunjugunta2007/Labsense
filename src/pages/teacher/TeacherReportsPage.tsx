import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  Monitor,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  getAllSessions,
  getIncidents,
  getComputers,
  getStudentsList
} from '../../services/labService';
import { LabSession, Incident, Computer, UserProfile, StudentProfile } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';

export function TeacherReportsPage() {
  const { success } = useToast();
  const [sessions, setSessions] = useState<LabSession[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [students, setStudents] = useState<{ profile: UserProfile; student?: StudentProfile }[]>([]);
  const [reportType, setReportType] = useState<'sessions' | 'computers' | 'incidents'>('sessions');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    async function loadData() {
      const [sessData, incData, compData, studData] = await Promise.all([
        getAllSessions(),
        getIncidents(),
        getComputers(),
        getStudentsList(),
      ]);
      setSessions(sessData || []);
      setIncidents(incData || []);
      setComputers(compData || []);
      setStudents(studData || []);
    }
    loadData();
  }, []);

  // Filter sessions by date range if provided
  const filteredSessions = sessions.filter((s) => {
    if (!startDate && !endDate) return true;
    const sessionDate = new Date(s.login_time).toISOString().split('T')[0];
    if (startDate && sessionDate < startDate) return false;
    if (endDate && sessionDate > endDate) return false;
    return true;
  });

  // Calculate usage frequency per computer
  const computerUsageMap = new Map<string, { count: number; totalMinutes: number }>();
  sessions.forEach((s) => {
    const key = s.computer_number || 'PC';
    const existing = computerUsageMap.get(key) || { count: 0, totalMinutes: 0 };
    existing.count += 1;
    if (s.logout_time) {
      const diffMins = Math.round((new Date(s.logout_time).getTime() - new Date(s.login_time).getTime()) / 60000);
      existing.totalMinutes += Math.max(1, diffMins);
    } else {
      existing.totalMinutes += 45; // default estimate for active
    }
    computerUsageMap.set(key, existing);
  });

  // Export CSV generator
  const exportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = 'giet_labsense_report.csv';

    if (reportType === 'sessions') {
      filename = `giet_lab_sessions_report_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Session ID', 'Student Name', 'Roll Number', 'Workstation', 'Laboratory', 'Purpose', 'Login Time', 'Logout Time', 'Status'];
      rows = filteredSessions.map((s) => [
        s.id,
        `"${s.student_name || 'Student'}"`,
        s.student_roll_no || 'N/A',
        s.computer_number || 'PC',
        `"${s.lab_name || 'Lab 101'}"`,
        `"${(s.purpose || '').replace(/"/g, '""')}"`,
        s.login_time,
        s.logout_time || 'Active',
        s.status,
      ]);
    } else if (reportType === 'computers') {
      filename = `giet_computer_utilization_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Computer Number', 'Asset Tag', 'Laboratory ID', 'Status', 'Total Recorded Sessions', 'Approx Hours Used'];
      rows = computers.map((c) => {
        const stats = computerUsageMap.get(c.computer_number) || { count: 0, totalMinutes: 0 };
        return [
          c.computer_number,
          c.asset_tag || 'N/A',
          c.lab_id,
          c.status,
          stats.count,
          (stats.totalMinutes / 60).toFixed(1),
        ];
      });
    } else {
      filename = `giet_incidents_maintenance_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Incident ID', 'Workstation', 'Reporting Student', 'Roll Number', 'Category', 'Severity', 'Status', 'Reported At', 'Resolved At', 'Description'];
      rows = incidents.map((i) => [
        i.id,
        i.computer_number || 'PC',
        `"${i.student_name || 'Student'}"`,
        i.student_roll_no || 'N/A',
        i.category,
        i.severity,
        i.status,
        i.reported_at,
        i.resolved_at || 'Unresolved',
        `"${(i.description || '').replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('CSV Export Generated', `Downloaded ${filename}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Institutional Usage & Compliance Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs for lab utilization, NAAC Criterion IV documentation, and maintenance history.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={exportCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-1.5" />
          Export Report to CSV
        </Button>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <Tabs
          tabs={[
            { id: 'sessions', label: 'Session Attendance Logs', count: filteredSessions.length },
            { id: 'computers', label: 'Workstation Utilization', count: computers.length },
            { id: 'incidents', label: 'Maintenance & Incidents', count: incidents.length },
          ]}
          activeTab={reportType}
          onChange={(t) => setReportType(t as 'sessions' | 'computers' | 'incidents')}
        />

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-medium">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          />
          <span className="text-slate-500 font-medium">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>
      </div>

      {/* Report Tables */}
      {reportType === 'sessions' && (
        <Card>
          <CardHeader
            title="Lab Practical Attendance Register"
            subtitle="Calculated from authentic student session records"
          />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 font-semibold text-slate-600 uppercase">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Workstation</th>
                    <th className="py-3 px-4">Laboratory</th>
                    <th className="py-3 px-4">Practical Purpose</th>
                    <th className="py-3 px-4">Login Time</th>
                    <th className="py-3 px-4">Logout Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/75">
                      <td className="py-3 px-4 font-semibold text-slate-900">{s.student_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{s.student_roll_no}</td>
                      <td className="py-3 px-4 font-bold text-[#0B2858]">{s.computer_number}</td>
                      <td className="py-3 px-4 text-slate-600">{s.lab_name}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{s.purpose}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(s.login_time).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {s.logout_time ? new Date(s.logout_time).toLocaleString() : 'In Progress'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold text-slate-700">{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'computers' && (
        <Card>
          <CardHeader
            title="Workstation Hardware Utilization"
            subtitle="Tracks frequency and cumulative operational hours per PC"
          />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 font-semibold text-slate-600 uppercase">
                    <th className="py-3 px-4">Terminal</th>
                    <th className="py-3 px-4">Asset Tag</th>
                    <th className="py-3 px-4">Hostname</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Recorded Sessions</th>
                    <th className="py-3 px-4">Cumulative Usage Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {computers.map((c) => {
                    const stats = computerUsageMap.get(c.computer_number) || { count: 0, totalMinutes: 0 };
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/75">
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">{c.computer_number}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{c.asset_tag}</td>
                        <td className="py-3 px-4 text-slate-500">{c.hostname}</td>
                        <td className="py-3 px-4 capitalize font-semibold">{c.status}</td>
                        <td className="py-3 px-4 font-bold text-[#0B2858]">{stats.count} sessions</td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {(stats.totalMinutes / 60).toFixed(1)} hrs
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'incidents' && (
        <Card>
          <CardHeader
            title="Hardware & Software Maintenance Tickets"
            subtitle="Chronological log of reported defects and faculty resolutions"
          />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 font-semibold text-slate-600 uppercase">
                    <th className="py-3 px-4">Workstation</th>
                    <th className="py-3 px-4">Reporting Student</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Symptom Description</th>
                    <th className="py-3 px-4">Reported Timestamp</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Resolution Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50/75">
                      <td className="py-3 px-4 font-bold text-slate-900">{i.computer_number}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {i.student_name} ({i.student_roll_no})
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{i.category}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm truncate">{i.description}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(i.reported_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold">{i.severity}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{i.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
