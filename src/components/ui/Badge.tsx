import React from 'react';
import { ComputerStatus, IncidentSeverity, IncidentStatus, UserRole } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'status' | 'severity' | 'incidentStatus' | 'role' | 'outline' | 'default';
  status?: ComputerStatus;
  severity?: IncidentSeverity;
  incidentStatus?: IncidentStatus;
  role?: UserRole;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  status,
  severity,
  incidentStatus,
  role,
  className = '',
}: BadgeProps) {
  // Computer Status styling
  if (variant === 'status' && status) {
    switch (status) {
      case 'available':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available
          </span>
        );
      case 'in_use':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Use
          </span>
        );
      case 'maintenance':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Maintenance
          </span>
        );
      case 'damaged':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-300 ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Damaged
          </span>
        );
      case 'offline':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Offline
          </span>
        );
    }
  }

  // Incident Severity styling
  if (variant === 'severity' && severity) {
    switch (severity) {
      case 'Critical':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 ${className}`}>
            Critical
          </span>
        );
      case 'High':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
            High
          </span>
        );
      case 'Medium':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 ${className}`}>
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
            Low
          </span>
        );
    }
  }

  // Incident Status styling
  if (variant === 'incidentStatus' && incidentStatus) {
    switch (incidentStatus) {
      case 'Open':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
            Open
          </span>
        );
      case 'Investigating':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}>
            Investigating
          </span>
        );
      case 'In Progress':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
            Closed
          </span>
        );
    }
  }

  // Role styling
  if (variant === 'role' && role) {
    switch (role) {
      case 'teacher':
      case 'admin':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#0B2858]/10 text-[#0B2858] border border-[#0B2858]/20 ${className}`}>
            Faculty / Admin
          </span>
        );
      case 'student':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
            Student
          </span>
        );
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 ${className}`}>
      {children}
    </span>
  );
}
