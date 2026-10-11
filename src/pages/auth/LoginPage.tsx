import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, GraduationCap, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, switchToDemoAccount } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        await signUpWithEmail(
          email,
          password,
          fullName,
          activeTab,
          activeTab === 'student'
            ? {
                rollNo: rollNo.trim() || '21GIETCS' + Math.floor(100 + Math.random() * 900),
                department,
                year: '3rd Year',
                section: 'Section A',
              }
            : undefined
        );
        success('Account created successfully!', 'Welcome to GIET LabSense.');
      } else {
        await signInWithEmail(email, password);
        success('Signed in successfully!', 'Welcome back.');
      }

      if (activeTab === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMessage(msg);
      toastError('Authentication Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await signInWithGoogle();
      success('Google Sign-in Successful', 'Authenticated with Firebase.');
      navigate(activeTab === 'teacher' ? '/teacher' : '/student');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in could not be completed';
      setErrorMessage(msg);
      toastError('Sign-in Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'student' | 'teacher', index: number = 0) => {
    switchToDemoAccount(role, index);
    success(`Demo Mode Activated`, `Signed in as ${role === 'teacher' ? 'Faculty Staff' : 'Student'}`);
    if (role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* College Branding Top */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0B2858] text-white shadow-lg mb-3 ring-4 ring-slate-200">
          <span className="text-2xl font-black text-white">G</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#0B2858] tracking-tight">
          GIET ENGINEERING COLLEGE
        </h1>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
          LabSense — Central Computer Lab Management
        </p>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-[#E1E5EB] sm:px-10">
          {/* Segmented Tab Control */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-[#0B2858] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('teacher');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-[#0B2858] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Teacher Portal
            </button>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {isSignUp ? `Register ${activeTab === 'student' ? 'Student' : 'Faculty'} Account` : `Sign In to ${activeTab === 'student' ? 'Student' : 'Teacher'} Portal`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your college credentials or utilize the fast evaluator demo access.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Varma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20 focus:border-[#0B2858]"
                />
              </div>
            )}

            {isSignUp && activeTab === 'student' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Roll / Student ID</label>
                  <input
                    type="text"
                    required
                    placeholder="21GIETCS042"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-2 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Data Science & AI">AI/ML</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {activeTab === 'student' ? 'Student Email / Roll ID' : 'Institutional Email'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={activeTab === 'student' ? 'student@giet.ac.in' : 'faculty@giet.ac.in'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20 focus:border-[#0B2858]"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20 focus:border-[#0B2858]"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="navy"
              loading={loading}
              className="w-full mt-2"
            >
              {isSignUp ? 'Create Account & Enter' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage('');
              }}
              className="text-xs text-[#0B2858] hover:underline font-semibold"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account yet? Register here"}
            </button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400 uppercase font-semibold text-[10px]">
                Or Instant Evaluator Access
              </span>
            </div>
          </div>

          {/* One-Click Demo Mode Buttons */}
          <div className="space-y-2">
            {activeTab === 'student' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('student', 0)}
                  className="w-full justify-between text-xs py-2 border-slate-300 bg-slate-50/50 hover:bg-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Demo Student 1: <strong>Rahul Varma</strong> (21GIETCS042)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">CSE 3rd Yr</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('student', 1)}
                  className="w-full justify-between text-xs py-2 border-slate-300 bg-slate-50/50 hover:bg-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Demo Student 2: <strong>Pooja Reddy</strong> (22GIETCS108)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">CSE 2nd Yr</span>
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('teacher')}
                className="w-full justify-between text-xs py-2 border-[#0B2858]/30 bg-blue-50/40 hover:bg-blue-50 text-[#0B2858]"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0B2858]" />
                  <span>Demo Faculty: <strong>Prof. S. R. Patnaik</strong></span>
                </div>
                <span className="text-[10px] font-semibold text-[#0B2858]">Lab Director</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGoogleSignIn}
              className="w-full text-xs py-2 text-slate-600 hover:text-slate-900 border-slate-200"
            >
              <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign In with Institutional Google Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
