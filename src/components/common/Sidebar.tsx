import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MonitorPlay,
  AlertCircle,
  History,
  Users,
  Monitor,
  Clock,
  AlertTriangle,
  FileBarChart,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  portal: 'student' | 'teacher';
}

export function Sidebar({ portal }: SidebarProps) {
  const { role, studentDetails } = useAuth();

  const studentLinks = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/session', label: 'Workstation Session', icon: MonitorPlay },
    { to: '/student/report-incident', label: 'Report Incident', icon: AlertCircle },
    { to: '/student/history', label: 'My Session History', icon: History },
  ];

  const teacherLinks = [
    { to: '/teacher', label: 'Overview Dashboard', icon: LayoutDashboard, end: true },
    { to: '/teacher/students', label: 'Students Directory', icon: Users },
    { to: '/teacher/computers', label: 'Computer Inventory', icon: Monitor },
    { to: '/teacher/sessions', label: 'Active & Past Sessions', icon: Clock },
    { to: '/teacher/incidents', label: 'Incident Desk', icon: AlertTriangle },
    { to: '/teacher/reports', label: 'Usage & Audit Reports', icon: FileBarChart },
  ];

  const links = portal === 'student' ? studentLinks : teacherLinks;

  return (
    <aside className="w-64 bg-[#0B2858] text-white flex flex-col shrink-0 min-h-screen">
      {/* College Identity Header */}
      <div className="p-5 border-b border-[#12366B] flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1E40AF] border border-blue-400/30 flex items-center justify-center font-black text-white text-lg shadow-md shrink-0">
          G
        </div>
        <div>
          <div className="font-extrabold text-sm tracking-wide leading-none text-white flex items-center gap-1.5">
            GIET <span className="text-blue-300 font-bold">COLLEGE</span>
          </div>
          <div className="text-[11px] font-medium text-slate-300 tracking-wider mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            LabSense OS
          </div>
        </div>
      </div>

      {/* Portal Indicator Badge */}
      <div className="px-5 py-3 bg-[#081e42] border-b border-[#12366B] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          {portal === 'teacher' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <GraduationCap className="w-4 h-4 text-blue-300" />
          )}
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            {portal === 'teacher' ? 'Faculty Portal' : 'Student Portal'}
          </span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
          {portal === 'teacher' ? 'Admin' : studentDetails?.section || 'Active'}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#12366B] text-white font-semibold border-l-4 border-blue-400 pl-2.5 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* College Info Footer */}
      <div className="p-4 border-t border-[#12366B] bg-[#081e42]/60 text-[11px] text-slate-400 leading-relaxed">
        <div className="font-semibold text-slate-300">GIET Engineering College</div>
        <div className="text-[10px] text-slate-400">Autonomous • NAAC 'A+'</div>
        <div className="mt-2 text-[10px] text-slate-500">
          Central Computer Center (CCC)
        </div>
      </div>
    </aside>
  );
}
