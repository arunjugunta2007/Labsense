import React, { useState } from 'react';
import { Search, LogOut, User, RefreshCw, Shield, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface HeaderProps {
  onOpenCommand: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({ onOpenCommand, onRefresh, isRefreshing = false }: HeaderProps) {
  const { profile, studentDetails, role, signOut, isDemoUser, switchToDemoAccount } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-[#E1E5EB] sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Search Bar / Command Palette trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={onOpenCommand}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Search PC, student, roll no, or ticket...</span>
            <span className="sm:hidden">Search...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Manual Refresh Button */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-slate-600 hover:text-slate-900"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0B2858]' : ''}`} />
          </Button>
        )}

        {/* Demo Switcher Quick Pill (Great for collegiate evaluators!) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Switch demo account for testing"
          >
            <Shield className="w-3.5 h-3.5 text-[#0B2858]" />
            <span className="hidden md:inline">Account:</span>
            <span className="font-semibold capitalize text-[#0B2858]">{role || 'Select'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
              <div className="px-2 py-1.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                Quick Evaluator Switcher
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    switchToDemoAccount('teacher');
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-slate-800">Teacher Portal</div>
                    <div className="text-[11px] text-slate-500">Prof. S. R. Patnaik (Faculty)</div>
                  </div>
                  {role === 'teacher' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  onClick={() => {
                    switchToDemoAccount('student', 0);
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-slate-800">Student Portal (Rahul)</div>
                    <div className="text-[11px] text-slate-500">Roll: 21GIETCS042 (CSE 3rd Yr)</div>
                  </div>
                  {role === 'student' && studentDetails?.student_id === '21GIETCS042' && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </button>

                <button
                  onClick={() => {
                    switchToDemoAccount('student', 1);
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-slate-800">Student Portal (Pooja)</div>
                    <div className="text-[11px] text-slate-500">Roll: 22GIETCS108 (CSE 2nd Yr)</div>
                  </div>
                  {role === 'student' && studentDetails?.student_id === '22GIETCS108' && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              </div>
              {isDemoUser && (
                <div className="p-2 bg-amber-50 rounded text-[11px] text-amber-800 border border-amber-200 mt-1">
                  Testing Mode Active (Isolated storage)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0B2858] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {profile?.full_name || 'GIET User'}
              </div>
              <div className="text-[10px] text-slate-500">
                {studentDetails?.student_id || (role === 'teacher' ? 'Faculty Admin' : profile?.email || '')}
              </div>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
              <div className="p-2 border-b border-slate-100 mb-1">
                <p className="font-semibold text-slate-900">{profile?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{profile?.email}</p>
                <div className="mt-1.5">
                  <Badge variant="role" role={role || 'student'} />
                </div>
              </div>

              <div className="p-1">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
