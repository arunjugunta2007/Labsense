import {
  collection,
  getDocs,
  setDoc,
  doc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Lab, Computer, StudentProfile, UserProfile } from '../types';

export const INITIAL_LABS: Lab[] = [
  {
    id: 'lab-101',
    name: 'Alan Turing Computing Lab',
    room_number: 'Block-A / Room 101',
    description: 'High-performance workstations for Programming, Data Structures, and Algorithmic Labs.',
    total_systems: 12,
    created_at: new Date('2024-01-10T09:00:00Z').toISOString(),
  },
  {
    id: 'lab-204',
    name: 'Ada Lovelace Systems Lab',
    room_number: 'Block-B / Room 204',
    description: 'Specialized lab for Operating Systems, Computer Networks, and Database Engineering.',
    total_systems: 12,
    created_at: new Date('2024-01-10T09:00:00Z').toISOString(),
  },
];

export const INITIAL_COMPUTERS: Computer[] = [
  // Lab 101
  { id: 'pc-01', lab_id: 'lab-101', computer_number: 'PC-01', asset_tag: 'GIET-TURING-01', hostname: 'lab101-pc01.giet.local', status: 'available', notes: 'Intel Core i7, 16GB RAM, Ubuntu 22.04 LTS', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pc-02', lab_id: 'lab-101', computer_number: 'PC-02', asset_tag: 'GIET-TURING-02', hostname: 'lab101-pc02.giet.local', status: 'available', notes: 'Intel Core i7, 16GB RAM, Ubuntu 22.04 LTS', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pc-03', lab_id: 'lab-101', computer_number: 'PC-03', asset_tag: 'GIET-TURING-03', hostname: 'lab101-pc03.giet.local', status: 'available', notes: 'Intel Core i7, 16GB RAM, Ubuntu 22.04 LTS', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pc-04', lab_id: 'lab-101', computer_number: 'PC-04', asset_tag: 'GIET-TURING-04', hostname: 'lab101-pc04.giet.local', status: 'maintenance', notes: 'Scheduled OS kernel patch and RAM diagnostic', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pc-05', lab_id: 'lab-101', computer_number: 'PC-05', asset_tag: 'GIET-TURING-05', hostname: 'lab101-pc05.giet.local', status: 'available', notes: 'Intel Core i7, 16GB RAM, Dual boot Windows 11', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pc-06', lab_id: 'lab-101', computer_number: 'PC-06', asset_tag: 'GIET-TURING-06', hostname: 'lab101-pc06.giet.local', status: 'available', notes: 'Intel Core i7, 16GB RAM, Dual boot Windows 11', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pc-07', lab_id: 'lab-101', computer_number: 'PC-07', asset_tag: 'GIET-TURING-07', hostname: 'lab101-pc07.giet.local', status: 'available', notes: 'Intel Core i7, 16GB RAM, Dual boot Windows 11', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pc-08', lab_id: 'lab-101', computer_number: 'PC-08', asset_tag: 'GIET-TURING-08', hostname: 'lab101-pc08.giet.local', status: 'damaged', notes: 'Mouse right-click switch unresponsive; replacement pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Lab 204
  { id: 'pc-09', lab_id: 'lab-204', computer_number: 'PC-09', asset_tag: 'GIET-LOVELACE-09', hostname: 'lab204-pc09.giet.local', status: 'available', notes: 'AMD Ryzen 7, 32GB RAM, Cisco Packet Tracer installed', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pc-10', lab_id: 'lab-204', computer_number: 'PC-10', asset_tag: 'GIET-LOVELACE-10', hostname: 'lab204-pc10.giet.local', status: 'available', notes: 'AMD Ryzen 7, 32GB RAM, Wireshark & Postgres preconfigured', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pc-11', lab_id: 'lab-204', computer_number: 'PC-11', asset_tag: 'GIET-LOVELACE-11', hostname: 'lab204-pc11.giet.local', status: 'available', notes: 'AMD Ryzen 7, 32GB RAM', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pc-12', lab_id: 'lab-204', computer_number: 'PC-12', asset_tag: 'GIET-LOVELACE-12', hostname: 'lab204-pc12.giet.local', status: 'available', notes: 'AMD Ryzen 7, 32GB RAM', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const DEMO_STUDENTS: { profile: UserProfile; student: StudentProfile }[] = [
  {
    profile: {
      id: 'demo-student-01',
      full_name: 'Rahul Varma',
      email: 'rahul.21cse@giet.ac.in',
      role: 'student',
      created_at: new Date('2024-02-01').toISOString(),
    },
    student: {
      id: 'stud-doc-01',
      profile_id: 'demo-student-01',
      student_id: '21GIETCS042',
      department: 'Computer Science & Engineering',
      year: '3rd Year (Semester 6)',
      section: 'Section A',
      created_at: new Date('2024-02-01').toISOString(),
    },
  },
  {
    profile: {
      id: 'demo-student-02',
      full_name: 'Pooja Reddy',
      email: 'pooja.22cse@giet.ac.in',
      role: 'student',
      created_at: new Date('2024-02-05').toISOString(),
    },
    student: {
      id: 'stud-doc-02',
      profile_id: 'demo-student-02',
      student_id: '22GIETCS108',
      department: 'Computer Science & Engineering',
      year: '2nd Year (Semester 4)',
      section: 'Section B',
      created_at: new Date('2024-02-05').toISOString(),
    },
  },
  {
    profile: {
      id: 'demo-student-03',
      full_name: 'Karthik Nair',
      email: 'karthik.21it@giet.ac.in',
      role: 'student',
      created_at: new Date('2024-02-08').toISOString(),
    },
    student: {
      id: 'stud-doc-03',
      profile_id: 'demo-student-03',
      student_id: '21GIETIT019',
      department: 'Information Technology',
      year: '3rd Year (Semester 6)',
      section: 'Section A',
      created_at: new Date('2024-02-08').toISOString(),
    },
  },
];

export const DEMO_TEACHER: UserProfile = {
  id: 'demo-teacher-01',
  full_name: 'Prof. S. R. Patnaik',
  email: 'srpatnaik@giet.ac.in',
  role: 'teacher',
  created_at: new Date('2023-08-01').toISOString(),
};

export async function seedInitialDatabaseIfEmpty() {
  try {
    const labsSnap = await getDocs(collection(db, 'labs'));
    if (labsSnap.empty) {
      console.log('Seeding initial GIET labs and computers...');
      const batch = writeBatch(db);

      // Seed Labs
      for (const lab of INITIAL_LABS) {
        batch.set(doc(db, 'labs', lab.id), lab);
      }

      // Seed Computers
      for (const comp of INITIAL_COMPUTERS) {
        batch.set(doc(db, 'computers', comp.id), comp);
      }

      // Seed Demo Profiles & Students
      for (const demo of DEMO_STUDENTS) {
        batch.set(doc(db, 'profiles', demo.profile.id), demo.profile);
        batch.set(doc(db, 'students', demo.student.id), demo.student);
      }

      // Seed Demo Teacher Profile
      batch.set(doc(db, 'profiles', DEMO_TEACHER.id), DEMO_TEACHER);

      await batch.commit();
      console.log('Initial GIET database seeded successfully.');
    }
  } catch (error) {
    console.warn('Seeding notice (may be offline or already provisioned):', error);
  }
}
