import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Search,
  Filter,
  Plus,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  getComputers,
  getLabs,
  getAllSessions,
  updateComputerStatus,
  addComputer
} from '../../services/labService';
import { Computer, Lab, LabSession, ComputerStatus } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export function TeacherComputersPage() {
  const { success, error: toastError } = useToast();
  const [computers, setComputers] = useState<Computer[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [sessions, setSessions] = useState<LabSession[]>([]);
  const [search, setSearch] = useState('');
  const [labFilter, setLabFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Edit Status Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedComp, setSelectedComp] = useState<Computer | null>(null);
  const [newStatus, setNewStatus] = useState<ComputerStatus>('available');
  const [statusNotes, setStatusNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Add Computer Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newCompNumber, setNewCompNumber] = useState('');
  const [newCompLabId, setNewCompLabId] = useState('lab-101');
  const [newCompAssetTag, setNewCompAssetTag] = useState('');
  const [newCompHostname, setNewCompHostname] = useState('');
  const [newCompNotes, setNewCompNotes] = useState('');
  const [addingComp, setAddingComp] = useState(false);

  const loadData = async () => {
    try {
      const [compsData, labsData, sessData] = await Promise.all([
        getComputers(),
        getLabs(),
        getAllSessions(),
      ]);
      setComputers(compsData || []);
      setLabs(labsData || []);
      setSessions(sessData || []);
    } catch (err) {
      console.warn('Computers fetch err:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeSessions = sessions.filter((s) => s.status === 'active');

  const filtered = computers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.computer_number.toLowerCase().includes(q) ||
      (c.asset_tag && c.asset_tag.toLowerCase().includes(q)) ||
      (c.hostname && c.hostname.toLowerCase().includes(q));

    const matchesLab = labFilter === 'ALL' || c.lab_id === labFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesLab && matchesStatus;
  });

  const handleOpenEditModal = (comp: Computer) => {
    setSelectedComp(comp);
    setNewStatus(comp.status);
    setStatusNotes(comp.notes || '');
    setEditModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedComp) return;
    setSavingStatus(true);
    try {
      await updateComputerStatus(selectedComp.id, newStatus, statusNotes);
      success('Workstation Updated', `${selectedComp.computer_number} marked as ${newStatus}.`);
      setEditModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toastError('Update Error', msg);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddComputer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompNumber.trim()) {
      toastError('Required', 'Please enter computer number (e.g. PC-13)');
      return;
    }
    setAddingComp(true);
    try {
      const compId = `pc-${Date.now().toString().slice(-4)}`;
      await addComputer({
        id: compId,
        lab_id: newCompLabId,
        computer_number: newCompNumber.trim().toUpperCase(),
        asset_tag: newCompAssetTag.trim() || `GIET-CCC-${compId.toUpperCase()}`,
        hostname: newCompHostname.trim() || `${newCompNumber.toLowerCase().replace('-', '')}.giet.local`,
        status: 'available',
        notes: newCompNotes.trim(),
      });
      success('Computer Asset Added', `${newCompNumber} registered in lab inventory.`);
      setAddModalOpen(false);
      setNewCompNumber('');
      setNewCompAssetTag('');
      setNewCompHostname('');
      setNewCompNotes('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add computer';
      toastError('Add Error', msg);
    } finally {
      setAddingComp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Computer Terminal Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor workstation statuses, active student logins, hardware maintenance, and assets.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setAddModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Workstation Asset
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Laboratories</option>
            {labs.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none capitalize"
          >
            <option value="ALL">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="damaged">Damaged</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by PC, asset tag, hostname..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20 focus:border-[#0B2858]"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader
          title={`Workstations (${filtered.length})`}
          subtitle="Real-time operational status synced across college network"
        />
        <CardContent className="p-0">
          <Table
            headers={['Workstation', 'Laboratory', 'Current Student', 'Session Start', 'Status', 'Asset Tag / Specs', 'Action']}
            empty={filtered.length === 0}
            emptyMessage="No computer workstations match your filters."
          >
            {filtered.map((comp) => {
              const currentSession = activeSessions.find((s) => s.computer_id === comp.id);
              const lab = labs.find((l) => l.id === comp.lab_id);

              return (
                <tr key={comp.id} className="hover:bg-slate-50/75">
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap text-sm">
                    {comp.computer_number}
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap text-xs">
                    {lab?.name || 'Turing Lab 101'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-xs">
                    {currentSession ? (
                      <div>
                        <span className="font-semibold text-slate-900">{currentSession.student_name}</span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {currentSession.student_roll_no}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">None (Idle)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                    {currentSession ? (
                      new Date(currentSession.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="status" status={comp.status} />
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                    <span className="font-mono text-slate-700 font-medium">{comp.asset_tag}</span>
                    {comp.notes && <div className="text-[11px] text-slate-400 truncate">{comp.notes}</div>}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(comp)}
                      className="text-xs py-1"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Change Status
                    </Button>
                  </td>
                </tr>
              );
            })}
          </Table>
        </CardContent>
      </Card>

      {/* Edit Status Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Workstation Status: ${selectedComp?.computer_number}`}
        description="Update operational state for maintenance or lab availability."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={savingStatus} onClick={handleSaveStatus}>
              Save Status Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Operational State</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ComputerStatus)}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none capitalize"
            >
              <option value="available">Available (Ready for Students)</option>
              <option value="in_use">In Use (Occupied)</option>
              <option value="maintenance">Maintenance (OS patch / hardware diagnostics)</option>
              <option value="damaged">Damaged (Awaiting replacement parts)</option>
              <option value="offline">Offline (Powered Down)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Maintenance Notes / Diagnostic Remarks</label>
            <textarea
              rows={3}
              placeholder="e.g. Memory card replaced; reinstalling Ubuntu 22.04 LTS network drivers..."
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* Add New Computer Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register New Workstation Asset"
        description="Enter hardware specifications for the Central Computer Center database."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={addingComp} onClick={handleAddComputer}>
              Register Terminal
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Workstation Number *</label>
              <input
                type="text"
                placeholder="PC-13"
                value={newCompNumber}
                onChange={(e) => setNewCompNumber(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Lab *</label>
              <select
                value={newCompLabId}
                onChange={(e) => setNewCompLabId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
              >
                {labs.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asset Tag</label>
              <input
                type="text"
                placeholder="GIET-TURING-13"
                value={newCompAssetTag}
                onChange={(e) => setNewCompAssetTag(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hostname</label>
              <input
                type="text"
                placeholder="lab101-pc13.giet.local"
                value={newCompHostname}
                onChange={(e) => setNewCompHostname(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hardware Specs & Installed Software</label>
            <textarea
              rows={2}
              placeholder="Intel Core i7-12700, 16GB RAM, Dual-Boot Linux/Windows..."
              value={newCompNotes}
              onChange={(e) => setNewCompNotes(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
