import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Lab,
  Computer,
  LabSession,
  Incident,
  IncidentHistory,
  StudentProfile,
  UserProfile,
  AuditLog,
  ComputerStatus,
  IncidentStatus,
  IncidentCategory,
  IncidentSeverity
} from '../types';

// Labs
export async function getLabs(): Promise<Lab[]> {
  const path = 'labs';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Lab));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

// Computers
export async function getComputers(labId?: string): Promise<Computer[]> {
  const path = 'computers';
  try {
    let q = query(collection(db, path));
    if (labId) {
      q = query(collection(db, path), where('lab_id', '==', labId));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Computer));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function updateComputerStatus(
  computerId: string,
  status: ComputerStatus,
  notes?: string
): Promise<void> {
  const path = `computers/${computerId}`;
  try {
    const updateData: Partial<Computer> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    await updateDoc(doc(db, 'computers', computerId), updateData);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function addComputer(computerData: Omit<Computer, 'created_at' | 'updated_at'>): Promise<void> {
  const path = `computers/${computerData.id}`;
  try {
    const now = new Date().toISOString();
    await setDoc(doc(db, 'computers', computerData.id), {
      ...computerData,
      created_at: now,
      updated_at: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Student Active Session Lookup
export async function getActiveSessionForStudent(studentId: string): Promise<LabSession | null> {
  const path = 'lab_sessions';
  try {
    const q = query(
      collection(db, path),
      where('student_id', '==', studentId),
      where('status', '==', 'active'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docData = snap.docs[0];
    return { ...docData.data(), id: docData.id } as LabSession;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

// Start Lab Session
export async function startLabSession(params: {
  studentId: string;
  studentName?: string;
  studentRollNo?: string;
  computerId: string;
  computerNumber: string;
  labId: string;
  labName: string;
  purpose: string;
}): Promise<LabSession> {
  // 1. Verify student doesn't already have an active session
  const existingStudentSession = await getActiveSessionForStudent(params.studentId);
  if (existingStudentSession) {
    throw new Error(`You already have an active session on workstation ${existingStudentSession.computer_number || 'PC'}. Please end it first.`);
  }

  // 2. Check computer availability
  const compDoc = await getDoc(doc(db, 'computers', params.computerId));
  if (!compDoc.exists()) {
    throw new Error('Selected computer could not be found.');
  }
  const compData = compDoc.data() as Computer;
  if (compData.status === 'in_use') {
    throw new Error('This computer is currently occupied by another student.');
  }
  if (compData.status === 'maintenance' || compData.status === 'damaged') {
    throw new Error(`This computer is unavailable (${compData.status}). Please choose another workstation.`);
  }

  // 3. Create session record
  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const session: LabSession = {
    id: sessionId,
    student_id: params.studentId,
    student_name: params.studentName || 'Student',
    student_roll_no: params.studentRollNo || 'N/A',
    computer_id: params.computerId,
    computer_number: params.computerNumber,
    lab_id: params.labId,
    lab_name: params.labName,
    purpose: params.purpose,
    login_time: now,
    status: 'active',
    created_at: now,
  };

  try {
    await setDoc(doc(db, 'lab_sessions', sessionId), session);
    // 4. Update computer status to in_use
    await updateDoc(doc(db, 'computers', params.computerId), {
      status: 'in_use',
      updated_at: now,
    });

    // 5. Audit log
    await recordAuditLog({
      actor_id: params.studentId,
      actor_name: params.studentName,
      action: `Started lab session on ${params.computerNumber} (${params.labName})`,
      entity_type: 'lab_session',
      entity_id: sessionId,
    });

    return session;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'lab_sessions');
  }
}

// End Lab Session
export async function endLabSession(sessionId: string, computerId: string, studentId: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'lab_sessions', sessionId), {
      logout_time: now,
      status: 'completed',
    });

    // Release computer back to available unless marked as damaged
    const compDoc = await getDoc(doc(db, 'computers', computerId));
    if (compDoc.exists()) {
      const comp = compDoc.data() as Computer;
      if (comp.status === 'in_use') {
        await updateDoc(doc(db, 'computers', computerId), {
          status: 'available',
          updated_at: now,
        });
      }
    }

    await recordAuditLog({
      actor_id: studentId,
      action: `Ended lab session on ${sessionId}`,
      entity_type: 'lab_session',
      entity_id: sessionId,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `lab_sessions/${sessionId}`);
  }
}

// Incident Reporting
export async function reportIncident(params: {
  computerId: string;
  computerNumber: string;
  studentId: string;
  studentName?: string;
  studentRollNo?: string;
  sessionId?: string;
  category: IncidentCategory;
  description: string;
  severity: IncidentSeverity;
}): Promise<Incident> {
  const incidentId = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const incident: Incident = {
    id: incidentId,
    computer_id: params.computerId,
    computer_number: params.computerNumber,
    student_id: params.studentId,
    student_name: params.studentName || 'Student',
    student_roll_no: params.studentRollNo || 'N/A',
    session_id: params.sessionId,
    category: params.category,
    description: params.description,
    severity: params.severity,
    status: 'Open',
    reported_at: now,
  };

  try {
    await setDoc(doc(db, 'incidents', incidentId), incident);

    // Initial history record
    const historyId = `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const historyEntry: IncidentHistory = {
      id: historyId,
      incident_id: incidentId,
      changed_by: params.studentId,
      changed_by_name: params.studentName || 'Reporting Student',
      previous_status: 'None',
      new_status: 'Open',
      notes: `Ticket created with ${params.severity} priority: ${params.description.substring(0, 100)}`,
      created_at: now,
    };
    await setDoc(doc(db, 'incident_history', historyId), historyEntry);

    // If critical or hardware damage, automatically flag workstation for inspection
    if (params.severity === 'Critical' || params.category === 'Physical Damage') {
      await updateDoc(doc(db, 'computers', params.computerId), {
        status: 'damaged',
        updated_at: now,
      });
    }

    await recordAuditLog({
      actor_id: params.studentId,
      actor_name: params.studentName,
      action: `Reported issue (${params.category}) for ${params.computerNumber}`,
      entity_type: 'incident',
      entity_id: incidentId,
    });

    return incident;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'incidents');
  }
}

// Update Incident Status
export async function updateIncidentStatus(params: {
  incidentId: string;
  newStatus: IncidentStatus;
  previousStatus: IncidentStatus;
  notes: string;
  changedBy: string;
  changedByName: string;
  computerId?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  try {
    const updatePayload: Partial<Incident> = {
      status: params.newStatus,
    };
    if (params.newStatus === 'Resolved' || params.newStatus === 'Closed') {
      updatePayload.resolved_at = now;
    }
    if (params.notes) {
      updatePayload.investigation_notes = params.notes;
    }

    await updateDoc(doc(db, 'incidents', params.incidentId), updatePayload);

    // Append history
    const historyId = `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await setDoc(doc(db, 'incident_history', historyId), {
      id: historyId,
      incident_id: params.incidentId,
      changed_by: params.changedBy,
      changed_by_name: params.changedByName,
      previous_status: params.previousStatus,
      new_status: params.newStatus,
      notes: params.notes || `Status transitioned to ${params.newStatus}`,
      created_at: now,
    });

    // If resolved and computer was marked damaged/maintenance, teacher can restore computer to available
    if ((params.newStatus === 'Resolved' || params.newStatus === 'Closed') && params.computerId) {
      const compDoc = await getDoc(doc(db, 'computers', params.computerId));
      if (compDoc.exists()) {
        const comp = compDoc.data() as Computer;
        if (comp.status === 'damaged') {
          await updateDoc(doc(db, 'computers', params.computerId), {
            status: 'available',
            updated_at: now,
          });
        }
      }
    }

    await recordAuditLog({
      actor_id: params.changedBy,
      actor_name: params.changedByName,
      action: `Updated incident ${params.incidentId} to ${params.newStatus}`,
      entity_type: 'incident',
      entity_id: params.incidentId,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `incidents/${params.incidentId}`);
  }
}

// Get Incident History
export async function getIncidentHistory(incidentId: string): Promise<IncidentHistory[]> {
  try {
    const q = query(
      collection(db, 'incident_history'),
      where('incident_id', '==', incidentId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as IncidentHistory));
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'incident_history');
  }
}

// Incident List
export async function getIncidents(): Promise<Incident[]> {
  try {
    const snap = await getDocs(collection(db, 'incidents'));
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as Incident));
    return items.sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'incidents');
  }
}

// Get Sessions
export async function getSessionsForStudent(studentId: string): Promise<LabSession[]> {
  try {
    const q = query(collection(db, 'lab_sessions'), where('student_id', '==', studentId));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as LabSession));
    return items.sort((a, b) => new Date(b.login_time).getTime() - new Date(a.login_time).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'lab_sessions');
  }
}

export async function getAllSessions(): Promise<LabSession[]> {
  try {
    const snap = await getDocs(collection(db, 'lab_sessions'));
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as LabSession));
    return items.sort((a, b) => new Date(b.login_time).getTime() - new Date(a.login_time).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'lab_sessions');
  }
}

// Students Management
export async function getStudentsList(): Promise<{ profile: UserProfile; student?: StudentProfile }[]> {
  try {
    const profilesSnap = await getDocs(collection(db, 'profiles'));
    const studentsSnap = await getDocs(collection(db, 'students'));

    const studentsMap = new Map<string, StudentProfile>();
    studentsSnap.docs.forEach(doc => {
      const data = { ...doc.data(), id: doc.id } as StudentProfile;
      studentsMap.set(data.profile_id, data);
    });

    const result: { profile: UserProfile; student?: StudentProfile }[] = [];
    profilesSnap.docs.forEach(doc => {
      const p = { ...doc.data(), id: doc.id } as UserProfile;
      if (p.role === 'student') {
        result.push({
          profile: p,
          student: studentsMap.get(p.id),
        });
      }
    });

    return result;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'profiles');
  }
}

// Audit Logs
export async function recordAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
  const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  try {
    await setDoc(doc(db, 'audit_logs', logId), {
      ...log,
      id: logId,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit logging is non-blocking to prevent UI crash
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const snap = await getDocs(collection(db, 'audit_logs'));
    const logs = snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditLog));
    return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);
  } catch {
    return [];
  }
}
