import React, { useState, useEffect } from 'react';
import { History, Clock, AlertTriangle, Search, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSessionsForStudent, getIncidents } from '../../services/labService';
import { LabSession, Incident } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';

export function StudentHistoryPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'sessions' | 'incidents'>('sessions');
  const [sessions, setSessions] = useState<LabSession[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!profile?.id) return;
      try {
        const [sessData, incData] = await Promise.all([
          getSessionsForStudent(profile.id),
          getIncidents(),
        ]);
        setSessions(sessData || []);
        // Only student's own incidents
        setIncidents((incData || []).filter((i) => i.student_id === profile.id));
      } catch (err) {
        console.warn('History err:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [profile?.id]);

  const filteredSessions = sessions.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.computer_number && s.computer_number.toLowerCase().includes(q)) ||
      s.purpose.toLowerCase().includes(q) ||
      (s.lab_name && s.lab_name.toLowerCase().includes(q))
    );
  });

  const filteredIncidents = incidents.filter((i) => {
    const q = search.toLowerCase();
    return (
      (i.computer_number && i.computer_number.toLowerCase().includes(q)) ||
      i.category.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
    );
  });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Lab Attendance & History</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review your official practical workstation sessions and status of your filed incident reports.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: 'sessions', label: 'Workstation Sessions', count: sessions.length },
            { id: 'incidents', label: 'My Reported Issues', count: incidents.length },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as 'sessions' | 'incidents')}
        />

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by PC, purpose, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20 focus:border-[#0B2858]"
          />
        </div>
      </div>

      {activeTab === 'sessions' ? (
        <Card>
          <CardHeader
            title="Recorded Lab Sessions"
            subtitle="Immutable timestamps generated during workstation log-in and log-out."
          />
          <CardContent className="p-0">
            <Table
              headers={['Terminal', 'Laboratory', 'Practical Task', 'Date & Time', 'Duration', 'Status']}
              empty={filteredSessions.length === 0}
              emptyMessage="No lab session records found matching your filter."
            >
              {filteredSessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-50/75">
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {sess.computer_number || 'PC'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                    {sess.lab_name || 'Turing Lab 101'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {sess.purpose}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    <div>{new Date(sess.login_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(sess.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                    {calculateDuration(sess.login_time, sess.logout_time)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        sess.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {sess.status === 'active' ? '● In Progress' : 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="My Incident Problem Reports"
            subtitle="Track administrative resolution and hardware diagnostics from GIET CCC."
          />
          <CardContent className="p-0">
            <Table
              headers={['Ticket ID', 'Terminal', 'Category', 'Description', 'Reported Date', 'Severity', 'Resolution Status']}
              empty={filteredIncidents.length === 0}
              emptyMessage="You have not filed any incident reports."
            >
              {filteredIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/75">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {inc.id.substring(0, 10)}...
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {inc.computer_number || 'PC'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                    {inc.category}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-sm">
                    <div className="truncate">{inc.description}</div>
                    {inc.investigation_notes && (
                      <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        Staff Note: {inc.investigation_notes}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(inc.reported_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="severity" severity={inc.severity} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="incidentStatus" incidentStatus={inc.status} />
                  </td>
                </tr>
              ))}
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
