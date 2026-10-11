import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, StudentProfile, UserRole } from '../types';
import { DEMO_STUDENTS, DEMO_TEACHER, seedInitialDatabaseIfEmpty } from '../services/seedData';

interface AuthContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  studentDetails: StudentProfile | null;
  role: UserRole | null;
  loading: boolean;
  isDemoUser: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    fullName: string,
    role: UserRole,
    studentMeta?: { rollNo: string; department: string; year: string; section: string }
  ) => Promise<void>;
  switchToDemoAccount: (role: 'student' | 'teacher', index?: number) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

  // Initialize seed data on load
  useEffect(() => {
    seedInitialDatabaseIfEmpty();
  }, []);

  const loadUserProfile = async (user: User) => {
    try {
      const profileDocRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileDocRef);

      if (profileSnap.exists()) {
        const profData = profileSnap.data() as UserProfile;
        setProfile(profData);

        if (profData.role === 'student') {
          // fetch student record
          const studentDocRef = doc(db, 'students', `stud-${user.uid}`);
          const studSnap = await getDoc(studentDocRef);
          if (studSnap.exists()) {
            setStudentDetails(studSnap.data() as StudentProfile);
          }
        }
      } else {
        // Auto-provision profile for first-time sign-in
        const isAdminEmail = user.email === 'arunjugunta2007@gmail.com';
        const initialRole: UserRole = isAdminEmail ? 'admin' : 'student';

        const newProfile: UserProfile = {
          id: user.uid,
          full_name: user.displayName || user.email?.split('@')[0] || 'User',
          role: initialRole,
          email: user.email || '',
          created_at: new Date().toISOString(),
        };

        await setDoc(profileDocRef, newProfile);
        setProfile(newProfile);

        if (initialRole === 'student') {
          const newStudent: StudentProfile = {
            id: `stud-${user.uid}`,
            profile_id: user.uid,
            student_id: 'GIET' + Math.floor(100000 + Math.random() * 900000),
            department: 'Computer Science & Engineering',
            year: '3rd Year',
            section: 'Section A',
            created_at: new Date().toISOString(),
          };
          await setDoc(doc(db, 'students', `stud-${user.uid}`), newStudent);
          setStudentDetails(newStudent);
        }
      }
    } catch (err) {
      console.error('Failed to load user profile from Firestore:', err);
    }
  };

  useEffect(() => {
    // Check if demo user was saved in session storage
    const savedDemo = sessionStorage.getItem('labsense_demo_user');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setProfile(parsed.profile);
        setStudentDetails(parsed.studentDetails || null);
        setIsDemoUser(true);
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem('labsense_demo_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsDemoUser(false);
        await loadUserProfile(user);
      } else {
        // If not in demo mode
        if (!sessionStorage.getItem('labsense_demo_user')) {
          setProfile(null);
          setStudentDetails(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    sessionStorage.removeItem('labsense_demo_user');
    setIsDemoUser(false);
    const res = await signInWithPopup(auth, provider);
    await loadUserProfile(res.user);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    sessionStorage.removeItem('labsense_demo_user');
    setIsDemoUser(false);
    const res = await signInWithEmailAndPassword(auth, email, pass);
    await loadUserProfile(res.user);
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    fullName: string,
    role: UserRole,
    studentMeta?: { rollNo: string; department: string; year: string; section: string }
  ) => {
    sessionStorage.removeItem('labsense_demo_user');
    setIsDemoUser(false);
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const user = res.user;

    const newProfile: UserProfile = {
      id: user.uid,
      full_name: fullName,
      role: email === 'arunjugunta2007@gmail.com' ? 'admin' : role,
      email: user.email || email,
      created_at: new Date().toISOString(),
    };
    await setDoc(doc(db, 'profiles', user.uid), newProfile);
    setProfile(newProfile);

    if (role === 'student' && studentMeta) {
      const newStudent: StudentProfile = {
        id: `stud-${user.uid}`,
        profile_id: user.uid,
        student_id: studentMeta.rollNo,
        department: studentMeta.department,
        year: studentMeta.year,
        section: studentMeta.section,
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, 'students', `stud-${user.uid}`), newStudent);
      setStudentDetails(newStudent);
    }
  };

  const switchToDemoAccount = (role: 'student' | 'teacher', index: number = 0) => {
    if (role === 'student') {
      const demo = DEMO_STUDENTS[index] || DEMO_STUDENTS[0];
      setProfile(demo.profile);
      setStudentDetails(demo.student);
      setIsDemoUser(true);
      sessionStorage.setItem('labsense_demo_user', JSON.stringify({
        profile: demo.profile,
        studentDetails: demo.student,
      }));
    } else {
      setProfile(DEMO_TEACHER);
      setStudentDetails(null);
      setIsDemoUser(true);
      sessionStorage.setItem('labsense_demo_user', JSON.stringify({
        profile: DEMO_TEACHER,
        studentDetails: null,
      }));
    }
  };

  const signOut = async () => {
    sessionStorage.removeItem('labsense_demo_user');
    setIsDemoUser(false);
    setProfile(null);
    setStudentDetails(null);
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await loadUserProfile(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        studentDetails,
        role: profile?.role || null,
        loading,
        isDemoUser,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        switchToDemoAccount,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
