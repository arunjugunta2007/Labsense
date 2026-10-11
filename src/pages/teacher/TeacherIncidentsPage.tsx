import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  History,
  MessageSquare,
  Wrench,
  Shield,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getIncidents,
  getIncidentHistory,
  updateIncidentStatus
} from '../../services/labService';
import { Incident, IncidentHistory, IncidentStatus } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export function TeacherIncidentsPage() {
  const { profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Inspection & Resolution Modal
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentHistory, setIncidentHistory] = useState<IncidentHistory[]>([]);
  const [newStatus, setNewStatus] = useState<IncidentStatus>('Investigating');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const data = await getIncidents();
      setIncidents(data || []);
    } catch (err) {
      console.warn('Incidents err:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenIncident = async (inc: Incident) => {
    setSelectedIncident(inc);
    setNewStatus(inc.status);
    setInvestigationNotes('');
    setModalOpen(true);
    setLoadingHistory(true);
    try {
      const historyLogs = await getIncidentHistory(inc.id);
      setIncidentHistory(historyLogs || []);
    } catch (err) {
      console.warn('History err:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedIncident || !profile?.id) return;
    setSavingStatus(true);
    try {
      await updateIncidentStatus({
        incidentId: selectedIncident.id,
        newStatus,
        previousStatus: selectedIncident.status,
        notes: investigationNotes.trim() || `Status updated to ${newStatus} by ${profile.full_name}`,
        changedBy: profile.id,
        changedByName: profile.full_name || 'Faculty Staff',
        computerId: selectedIncident.computer_id,
      });

      success(
        'Incident Status Updated',
        `Ticket for ${selectedIncident.computer_number} changed to ${newStatus}.`
      );
      setModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toastError('Update Error', msg);
    } finally {
      setSavingStatus(false);
    }
  };

  const filtered = incidents.filter((i) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (i.computer_number && i.computer_number.toLowerCase().includes(q)) ||
      i.category.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      (i.student_name && i.student_name.toLowerCase().includes(q)) ||
      (i.student_roll_no && i.student_roll_no.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || i.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Incident Diagnostic Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Triage hardware malfunctions, monitor diagnostic notes, and record repairs with immutable audit history.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search incident, student, PC, or symptom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20 focus:border-[#0B2858]"
          />
        </div>
      </div>

      <Card>
        <CardHeader
          title={`Incident Tickets (${filtered.length})`}
          subtitle="Accreditation-grade hardware and software maintenance tracking"
        />
        <CardContent className="p-0">
          <Table
            headers={['Terminal', 'Category', 'Symptom / Description', 'Reporting Student', 'Reported At', 'Severity', 'Status', 'Action']}
            empty={filtered.length === 0}
            emptyMessage="No incident problem reports match the selected filters."
          >
            {filtered.map((inc) => (
              <tr key={inc.id} className="hover:bg-slate-50/75">
                <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap text-xs">
                  {inc.computer_number || 'PC'}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap text-xs">
                  {inc.category}
                </td>
                <td className="py-3 px-4 text-slate-600 text-xs max-w-sm">
                  <div className="line-clamp-2">{inc.description}</div>
                  {inc.investigation_notes && (
                    <div className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">
                      Last Note: {inc.investigation_notes}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-xs">
                  <span className="font-medium text-slate-900">{inc.student_name}</span>
                  <div className="text-[10px] text-slate-400 font-mono">{inc.student_roll_no}</div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                  {new Date(inc.reported_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <Badge variant="severity" severity={inc.severity} />
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <Badge variant="incidentStatus" incidentStatus={inc.status} />
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenIncident(inc)}
                    className="text-xs py-1"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Review & Triage
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </CardContent>
      </Card>

      {/* Review & Resolution Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Incident Ticket: ${selectedIncident?.computer_number} (${selectedIncident?.category})`}
        description={`Reported on ${selectedIncident?.reported_at ? new Date(selectedIncident.reported_at).toLocaleString() : ''}`}
        maxWidth="2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" loading={savingStatus} onClick={handleUpdateStatus}>
              Save Diagnostic Update
            </Button>
          </>
        }
      >
        <div className="space-y-5 text-xs">
          {/* Original Problem Summary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                Original Student Incident Report
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="severity" severity={selectedIncident?.severity} />
                <Badge variant="incidentStatus" incidentStatus={selectedIncident?.status} />
              </div>
            </div>
            <p className="text-slate-800 text-xs leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
              {selectedIncident?.description}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                Reported by: <strong>{selectedIncident?.student_name}</strong> ({selectedIncident?.student_roll_no})
              </span>
              <span>Terminal: <strong>{selectedIncident?.computer_number}</strong></span>
            </div>
          </div>

          {/* Status Change Form */}
          <div className="space-y-3 bg-blue-50/40 p-4 rounded-xl border border-blue-200">
            <h4 className="font-bold text-slate-900 text-sm">Faculty / Technician Diagnostic Update</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none capitalize text-xs"
                >
                  <option value="Open">Open (Pending Inspection)</option>
                  <option value="Investigating">Investigating (Technician on Site)</option>
                  <option value="In Progress">In Progress (Parts or OS Reinstallation)</option>
                  <option value="Resolved">Resolved (Workstation Fully Restored)</option>
                  <option value="Closed">Closed (Archived in NAAC Log)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Investigation / Resolution Notes *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Optical mouse replaced with Logitech M90; terminal verified operational."
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Immutable Audit Trail History */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#0B2858]" />
              Status Change History & Audit Trail
            </h4>

            {loadingHistory ? (
              <div className="py-4 text-center text-slate-400">Loading audit trail...</div>
            ) : incidentHistory.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                Initial report created. No subsequent status transitions logged yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {incidentHistory.map((h) => (
                  <div key={h.id} className="p-3 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {h.previous_status} → <span className="text-[#0B2858] font-bold">{h.new_status}</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{h.notes}</p>
                    <div className="text-[10px] text-slate-400">
                      Logged by: {h.changed_by_name || 'Authorized Staff'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
