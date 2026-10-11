import React, { useState, useEffect } from 'react';
import { Search, Monitor, AlertTriangle, Clock, ArrowRight, UserCheck, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Computer, Incident, LabSession } from '../../types';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  computers: Computer[];
  incidents: Incident[];
  sessions: LabSession[];
  isTeacher?: boolean;
}

export function CommandMenu({
  isOpen,
  onClose,
  computers,
  incidents,
  sessions,
  isTeacher = false,
}: CommandMenuProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Filter computers
  const matchedComputers = computers.filter(
    (c) =>
      c.computer_number.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q) ||
      (c.asset_tag && c.asset_tag.toLowerCase().includes(q))
  ).slice(0, 5);

  // Filter incidents
  const matchedIncidents = incidents.filter(
    (i) =>
      i.computer_number?.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.status.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
  ).slice(0, 5);

  // Filter sessions (students or PCs)
  const matchedSessions = sessions.filter(
    (s) =>
      s.student_name?.toLowerCase().includes(q) ||
      s.student_roll_no?.toLowerCase().includes(q) ||
      s.computer_number?.toLowerCase().includes(q) ||
      s.purpose.toLowerCase().includes(q)
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 ml-2" />
          <input
            type="text"
            autoFocus
            placeholder="Type a computer (e.g. PC-01), student roll no, or incident keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm outline-none placeholder:text-slate-400 py-1"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-50 text-sm">
          {/* Quick preset filters if no query */}
          {!q && (
            <div className="p-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Suggested Quick Queries
              </p>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <button
                  onClick={() => setQuery('available')}
                  className="flex items-center gap-2 text-xs text-left p-2 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Available Workstations
                </button>
                <button
                  onClick={() => setQuery('Open')}
                  className="flex items-center gap-2 text-xs text-left p-2 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Open Incidents
                </button>
                <button
                  onClick={() => setQuery('active')}
                  className="flex items-center gap-2 text-xs text-left p-2 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  <Clock className="w-4 h-4 text-blue-500" />
                  Current Active Sessions
                </button>
                <button
                  onClick={() => setQuery('maintenance')}
                  className="flex items-center gap-2 text-xs text-left p-2 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  <Monitor className="w-4 h-4 text-amber-500" />
                  Computers Under Maintenance
                </button>
              </div>
            </div>
          )}

          {/* Computers match */}
          {matchedComputers.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Workstations ({matchedComputers.length})
              </p>
              {matchedComputers.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => {
                    onClose();
                    navigate(isTeacher ? '/teacher/computers' : '/student/session');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="font-semibold text-slate-800">{comp.computer_number}</span>
                      <span className="text-xs text-slate-400 ml-2">({comp.asset_tag || comp.hostname})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize bg-slate-100 text-slate-600">
                      {comp.status}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Incidents match */}
          {matchedIncidents.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Incidents ({matchedIncidents.length})
              </p>
              {matchedIncidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => {
                    onClose();
                    navigate(isTeacher ? '/teacher/incidents' : '/student/history');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-medium text-slate-800">
                        {inc.computer_number}: {inc.category}
                      </span>
                      <span className="text-xs text-slate-400 ml-2 truncate max-w-xs inline-block align-bottom">
                        {inc.description}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{inc.status}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sessions match */}
          {matchedSessions.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Sessions ({matchedSessions.length})
              </p>
              {matchedSessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => {
                    onClose();
                    navigate(isTeacher ? '/teacher/sessions' : '/student/history');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    <div>
                      <span className="font-medium text-slate-800">{sess.student_name}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        {sess.student_roll_no} on {sess.computer_number}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs capitalize text-slate-500">{sess.status}</span>
                </div>
              ))}
            </div>
          )}

          {q && matchedComputers.length === 0 && matchedIncidents.length === 0 && matchedSessions.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching computer, student, or incident records found for &quot;{query}&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
