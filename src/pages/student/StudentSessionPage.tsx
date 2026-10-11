import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Monitor,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  StopCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getLabs,
  getComputers,
  getActiveSessionForStudent,
  startLabSession,
  endLabSession
} from '../../services/labService';
import { Lab, Computer, LabSession } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export function StudentSessionPage() {
  const navigate = useNavigate();
  const { profile, studentDetails } = useAuth();
  const { success, error } = useToast();

  const [labs, setLabs] = useState<Lab[]>([]);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string>('lab-101');
  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  const [purpose, setPurpose] = useState('');
  const [activeSession, setActiveSession] = useState<LabSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [elapsedTimer, setElapsedTimer] = useState('00:00:00');

  const loadData = async () => {
    if (!profile?.id) return;
    try {
      const [labsData, compsData, active] = await Promise.all([
        getLabs(),
        getComputers(),
        getActiveSessionForStudent(profile.id),
      ]);
      setLabs(labsData || []);
      setComputers(compsData || []);
      setActiveSession(active);
      if (labsData && labsData.length > 0 && !selectedLabId) {
        setSelectedLabId(labsData[0].id);
      }
    } catch (e) {
      console.warn('Load err:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  // Timer for active session
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      const start = new Date(activeSession.login_time).getTime();
      const diffSecs = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const hours = String(Math.floor(diffSecs / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((diffSecs % 3600) / 60)).padStart(2, '0');
      const seconds = String(diffSecs % 60).padStart(2, '0');
      setElapsedTimer(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleStartSession = async () => {
    if (!selectedComputer || !profile?.id) return;
    if (!purpose.trim()) {
      error('Input Required', 'Please enter your purpose or practical task.');
      return;
    }

    setSubmitting(true);
    try {
      const currentLab = labs.find((l) => l.id === selectedLabId);
      const newSession = await startLabSession({
        studentId: profile.id,
        studentName: profile.full_name,
        studentRollNo: studentDetails?.student_id,
        computerId: selectedComputer.id,
        computerNumber: selectedComputer.computer_number,
        labId: selectedLabId,
        labName: currentLab?.name || 'Central Lab',
        purpose: purpose.trim(),
      });

      setActiveSession(newSession);
      setSelectedComputer(null);
      setPurpose('');
      setConfirmModalOpen(false);
      success('Session Started!', `Logged into ${selectedComputer.computer_number}. Happy coding!`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start session';
      error('Session Start Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession || !profile?.id) return;
    setSubmitting(true);
    try {
      await endLabSession(activeSession.id, activeSession.computer_id, profile.id);
      success('Session Concluded', `Workstation ${activeSession.computer_number} is now freed.`);
      setActiveSession(null);
      setEndModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to end session';
      error('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComputers = computers.filter((c) => c.lab_id === selectedLabId);

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Workstation Session Manager</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Reserve an available terminal, record your lab practical purpose, and release the machine when finished.
        </p>
      </div>

      {/* ACTIVE SESSION BANNER (If Student is currently logged in) */}
      {activeSession ? (
        <Card className="border-2 border-emerald-500 bg-white shadow-md">
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-950 font-bold">Currently Active Session</span>
              </div>
            }
            action={
              <Button
                variant="navy"
                size="sm"
                onClick={() => setEndModalOpen(true)}
              >
                <StopCircle className="w-4 h-4 mr-1.5" />
                End Session & Logout
              </Button>
            }
          />
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Workstation ID
                </span>
                <span className="text-2xl font-black text-[#0B2858]">
                  {activeSession.computer_number}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Assigned Lab
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {activeSession.lab_name}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Login Time
                </span>
                <span className="text-sm font-medium text-slate-800">
                  {new Date(activeSession.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Elapsed Time
                </span>
                <span className="text-xl font-mono font-bold text-emerald-600">
                  {elapsedTimer}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100 text-xs">
              <div>
                <span className="font-semibold text-[#0B2858]">Practical Task / Purpose: </span>
                <span className="text-slate-700">{activeSession.purpose}</span>
              </div>
              <Link to="/student/report-incident">
                <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Report Hardware/Software Issue on this PC
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* START NEW SESSION FLOW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workstation Grid Selector (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Lab Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 mr-2">Select Lab:</span>
              {labs.map((lab) => (
                <button
                  key={lab.id}
                  onClick={() => {
                    setSelectedLabId(lab.id);
                    setSelectedComputer(null);
                  }}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    selectedLabId === lab.id
                      ? 'bg-[#0B2858] text-white border-[#0B2858] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {lab.name} ({lab.room_number})
                </button>
              ))}
            </div>

            {/* Interactive Computer Layout */}
            <Card>
              <CardHeader
                title="Select Available Workstation"
                subtitle="Click on an open terminal below to assign yourself."
              />
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {filteredComputers.map((comp) => {
                    const isSelected = selectedComputer?.id === comp.id;
                    const isAvailable = comp.status === 'available';

                    return (
                      <div
                        key={comp.id}
                        onClick={() => {
                          if (isAvailable) setSelectedComputer(comp);
                        }}
                        className={`p-3.5 rounded-xl border transition-all relative flex flex-col justify-between h-28 ${
                          isSelected
                            ? 'border-2 border-[#0B2858] bg-blue-50/60 shadow-sm ring-2 ring-[#0B2858]/20'
                            : isAvailable
                            ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer'
                            : comp.status === 'in_use'
                            ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                            : 'border-slate-300 bg-slate-100 opacity-75 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {comp.computer_number}
                          </span>
                          <Monitor
                            className={`w-4 h-4 ${
                              isSelected
                                ? 'text-[#0B2858]'
                                : isAvailable
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          />
                        </div>

                        <div className="text-[10px] text-slate-500 truncate">
                          {comp.asset_tag || comp.hostname}
                        </div>

                        <div className="pt-1">
                          <Badge variant="status" status={comp.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Available ({filteredComputers.filter((c) => c.status === 'available').length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>In Use ({filteredComputers.filter((c) => c.status === 'in_use').length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Maintenance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>Damaged</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form & Session Confirmation (Right Column) */}
          <div className="space-y-4">
            <Card>
              <CardHeader title="Session Confirmation" />
              <CardContent className="space-y-4">
                {selectedComputer ? (
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Selected Workstation:</span>
                      <span className="font-bold text-[#0B2858] text-sm">
                        {selectedComputer.computer_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Asset Tag:</span>
                      <span className="font-medium text-slate-700">
                        {selectedComputer.asset_tag}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Specs / Info:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[150px]">
                        {selectedComputer.notes || 'Standard College OS'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400">
                    <Monitor className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    Please click an available workstation from the left grid.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lab Purpose / Task Description *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Design & Analysis of Algorithms Practical #4 (Dijkstra implementation) or Web Dev Project..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20 focus:border-[#0B2858]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Subject purpose will be timestamped in the college attendance audit trail.
                  </p>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  disabled={!selectedComputer || !purpose.trim()}
                  onClick={() => setConfirmModalOpen(true)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Begin Lab Session
                </Button>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Single Active Session Rule:</strong> GIET lab policies only allow one workstation per student simultaneously. You must end this session before accessing another machine.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog to Start */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Workstation Allocation"
        description="Verify your lab assignment details below."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={submitting}
              onClick={handleStartSession}
            >
              Confirm & Start
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            You are logging into workstation <strong>{selectedComputer?.computer_number}</strong> under student roll number <strong>{studentDetails?.student_id || '21GIETCS042'}</strong>.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div><strong>Practical Task:</strong> {purpose}</div>
            <div><strong>Location:</strong> {labs.find((l) => l.id === selectedLabId)?.name}</div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog to End */}
      <Modal
        isOpen={endModalOpen}
        onClose={() => setEndModalOpen(false)}
        title="End Lab Session"
        description="Release this workstation back to available inventory?"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEndModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="navy"
              size="sm"
              loading={submitting}
              onClick={handleEndSession}
            >
              Release Terminal
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Your final duration will be saved to your GIET student lab attendance record.
        </p>
      </Modal>
    </div>
  );
}
