import React, { useState, useEffect } from 'react';
import { Search, Clock, Calendar, Filter, StopCircle, ArrowUpDown, UserCheck } from 'lucide-react';
import { getAllSessions, endLabSession } from '../../services/labService';
import { LabSession } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export function TeacherSessionsPage() {
  const { success, error: toastError } = useToast();
  const [sessions, setSessions] = useState<LabSession[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSessionToTerminate, setSelectedSessionToTerminate] = useState<LabSession | null>(null);
  const [terminating, setTerminating] = useState(false);

  const loadData = async () => {
    try {
      const data = await getAllSessions();
      setSessions(data || []);
    } catch (err) {
      console.warn('Sessions err:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return 'Active Now';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const mins = Math.max(1, Math.round((e - s) / 60000));
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  const handleForceEndSession = async () => {
    if (!selectedSessionToTerminate) return;
    setTerminating(true);
    try {
      await endLabSession(
        selectedSessionToTerminate.id,
        selectedSessionToTerminate.computer_id,
        'faculty-admin'
      );
      success('Session Closed', `Workstation ${selectedSessionToTerminate.computer_number} was released by faculty.`);
      setSelectedSessionToTerminate(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to end session';
      toastError('Error', msg);
    } finally {
      setTerminating(false);
    }
  };

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (s.student_name && s.student_name.toLowerCase().includes(q)) ||
      (s.student_roll_no && s.student_roll_no.toLowerCase().includes(q)) ||
      (s.computer_number && s.computer_number.toLowerCase().includes(q)) ||
      s.purpose.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    let matchesDate = true;
    if (dateFilter) {
      const sessionDate = new Date(s.login_time).toISOString().split('T')[0];
      matchesDate = sessionDate === dateFilter;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lab Attendance & Workstation Sessions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional timestamped audit log of all student logins and laboratory duration.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="completed">Completed Only</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          />

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-[#0B2858] font-semibold hover:underline"
            >
              Clear Date
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student, roll no, PC, or task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20 focus:border-[#0B2858]"
          />
        </div>
      </div>

      <Card>
        <CardHeader
          title={`All Recorded Sessions (${filtered.length})`}
          subtitle="Directly sourced from trusted Firestore lab_sessions collection"
        />
        <CardContent className="p-0">
          <Table
            headers={['Student', 'Roll No', 'Workstation', 'Laboratory', 'Practical Purpose', 'Login Time', 'Duration', 'Status', 'Action']}
            empty={filtered.length === 0}
            emptyMessage="No lab sessions found matching your search parameters."
          >
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/75">
                <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap text-xs">
                  {s.student_name || 'Student'}
                </td>
                <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap text-xs">
                  {s.student_roll_no || '21GIETCS042'}
                </td>
                <td className="py-3 px-4 font-bold text-[#0B2858] whitespace-nowrap text-xs">
                  {s.computer_number || 'PC'}
                </td>
                <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-xs">
                  {s.lab_name || 'Turing Lab 101'}
                </td>
                <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">
                  {s.purpose}
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                  <div>{new Date(s.login_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(s.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-xs font-medium text-slate-700">
                  {calculateDuration(s.login_time, s.logout_time)}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      s.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {s.status === 'active' ? '● In Progress' : 'Completed'}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {s.status === 'active' ? (
                    <Button
                      variant="navy"
                      size="sm"
                      onClick={() => setSelectedSessionToTerminate(s)}
                      className="text-xs py-1"
                    >
                      <StopCircle className="w-3.5 h-3.5 mr-1" />
                      Terminate
                    </Button>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </CardContent>
      </Card>

      {/* Force Terminate Modal */}
      <Modal
        isOpen={Boolean(selectedSessionToTerminate)}
        onClose={() => setSelectedSessionToTerminate(null)}
        title="Administrative Session Termination"
        description="Forcibly log out student and release workstation?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSelectedSessionToTerminate(null)}>
              Cancel
            </Button>
            <Button variant="navy" size="sm" loading={terminating} onClick={handleForceEndSession}>
              Confirm Force Logout
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Use this if student <strong>{selectedSessionToTerminate?.student_name}</strong> departed the laboratory without ending their active session on <strong>{selectedSessionToTerminate?.computer_number}</strong>. This will set logout timestamp to right now and release the PC.
        </p>
      </Modal>
    </div>
  );
}
