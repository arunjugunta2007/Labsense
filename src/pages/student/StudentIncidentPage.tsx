import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Send,
  AlertTriangle,
  Monitor,
  Shield,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getComputers,
  getActiveSessionForStudent,
  reportIncident
} from '../../services/labService';
import { Computer, LabSession, IncidentCategory, IncidentSeverity } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

const CATEGORIES: IncidentCategory[] = [
  'Keyboard',
  'Mouse',
  'Monitor',
  'CPU',
  'Network',
  'Software',
  'Power Supply',
  'Physical Damage',
  'Other',
];

const SEVERITIES: { value: IncidentSeverity; label: string; desc: string }[] = [
  { value: 'Low', label: 'Low', desc: 'Cosmetic or minor inconvenience; PC remains usable.' },
  { value: 'Medium', label: 'Medium', desc: 'Feature degraded (e.g. one USB port non-functional).' },
  { value: 'High', label: 'High', desc: 'Critical component failure (e.g. display flickering, OS loop).' },
  { value: 'Critical', label: 'Critical', desc: 'Completely inoperable, spark/burn odor, or hardware damage.' },
];

export function StudentIncidentPage() {
  const navigate = useNavigate();
  const { profile, studentDetails } = useAuth();
  const { success, error: toastError } = useToast();

  const [computers, setComputers] = useState<Computer[]>([]);
  const [activeSession, setActiveSession] = useState<LabSession | null>(null);
  const [selectedComputerId, setSelectedComputerId] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('Mouse');
  const [severity, setSeverity] = useState<IncidentSeverity>('Medium');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      if (!profile?.id) return;
      try {
        const [comps, active] = await Promise.all([
          getComputers(),
          getActiveSessionForStudent(profile.id),
        ]);
        setComputers(comps || []);
        setActiveSession(active);
        if (active) {
          setSelectedComputerId(active.computer_id);
        } else if (comps && comps.length > 0) {
          setSelectedComputerId(comps[0].id);
        }
      } catch (err) {
        console.warn('Init incident page err:', err);
      }
    }
    init();
  }, [profile?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    if (!selectedComputerId) {
      toastError('Workstation Required', 'Please select which computer has the malfunction.');
      return;
    }
    if (!description.trim()) {
      toastError('Description Required', 'Please provide a clear description of the problem.');
      return;
    }

    setLoading(true);
    try {
      const comp = computers.find((c) => c.id === selectedComputerId);
      await reportIncident({
        computerId: selectedComputerId,
        computerNumber: comp?.computer_number || 'PC',
        studentId: profile.id,
        studentName: profile.full_name,
        studentRollNo: studentDetails?.student_id,
        sessionId: activeSession?.id,
        category,
        description: description.trim(),
        severity,
      });

      success(
        'Incident Ticket Submitted',
        `Faculty lab administrators have been alerted for ${comp?.computer_number || 'Workstation'}.`
      );
      navigate('/student/history');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit report';
      toastError('Submission Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Report Hardware / Software Malfunction</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit equipment tickets to the GIET Central Computer Center support queue.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Incident Diagnostic Ticket"
          subtitle="Your authenticated roll number and identity will automatically be attached."
        />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Authenticated identity card (read-only per specification) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0B2858] text-white flex items-center justify-center font-bold text-xs">
                  {profile?.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{profile?.full_name}</div>
                  <div className="text-[11px] text-slate-500">
                    Roll No: <strong>{studentDetails?.student_id || '21GIETCS042'}</strong> • {studentDetails?.department}
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Verified Identity
              </span>
            </div>

            {/* Workstation Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Affected Workstation *
              </label>
              <select
                value={selectedComputerId}
                onChange={(e) => setSelectedComputerId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20 focus:border-[#0B2858]"
              >
                {computers.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.computer_number} — ({comp.asset_tag || 'Standard Asset'}) [{comp.status}]
                  </option>
                ))}
              </select>
              {activeSession && (
                <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1 font-medium">
                  <Monitor className="w-3.5 h-3.5" /> Automatically pre-selected your active workstation ({activeSession.computer_number}).
                </p>
              )}
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Malfunction Category *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all cursor-pointer ${
                      category === cat
                        ? 'border-[#0B2858] bg-[#0B2858]/5 text-[#0B2858] font-bold ring-1 ring-[#0B2858]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Severity Level *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SEVERITIES.map((sev) => (
                  <div
                    key={sev.value}
                    onClick={() => setSeverity(sev.value)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      severity === sev.value
                        ? 'border-[#0B2858] bg-blue-50/60 ring-1 ring-[#0B2858]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{sev.label}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          sev.value === 'Critical'
                            ? 'bg-amber-700'
                            : sev.value === 'High'
                            ? 'bg-amber-500'
                            : sev.value === 'Medium'
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{sev.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Description & Symptoms *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe what occurred (e.g. Left mouse button is sticky and fails to click, or monitor shows horizontal blue lines upon booting Ubuntu)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20 focus:border-[#0B2858]"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigate('/student')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
              >
                <Send className="w-4 h-4 mr-1.5" />
                Submit Incident Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
