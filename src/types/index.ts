export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  id: string; // Auth UID
  full_name: string;
  role: UserRole;
  email: string;
  created_at: string;
}

export interface StudentProfile {
  id: string; // doc id
  profile_id: string; // matches UserProfile.id
  student_id: string; // Roll number e.g. "21GIETCS042"
  department: string; // e.g. "Computer Science & Engineering"
  year: string; // e.g. "3rd Year"
  section: string; // e.g. "Section B"
  created_at: string;
}

export interface Lab {
  id: string;
  name: string;
  room_number: string;
  description: string;
  total_systems?: number;
  created_at: string;
}

export type ComputerStatus = 'available' | 'in_use' | 'maintenance' | 'damaged' | 'offline';

export interface Computer {
  id: string;
  lab_id: string;
  computer_number: string; // e.g. "PC-01"
  asset_tag: string; // e.g. "GIET-CSE-2024-001"
  hostname: string;
  status: ComputerStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type SessionStatus = 'active' | 'completed' | 'terminated';

export interface LabSession {
  id: string;
  student_id: string; // profile_id
  student_name?: string;
  student_roll_no?: string;
  computer_id: string;
  computer_number?: string;
  lab_id: string;
  lab_name?: string;
  purpose: string;
  login_time: string;
  logout_time?: string;
  status: SessionStatus;
  created_at: string;
}

export type IncidentCategory =
  | 'Keyboard'
  | 'Mouse'
  | 'Monitor'
  | 'CPU'
  | 'Network'
  | 'Software'
  | 'Power Supply'
  | 'Physical Damage'
  | 'Other';

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type IncidentStatus = 'Open' | 'Investigating' | 'In Progress' | 'Resolved' | 'Closed';

export interface Incident {
  id: string;
  computer_id: string;
  computer_number?: string;
  student_id: string;
  student_name?: string;
  student_roll_no?: string;
  session_id?: string;
  category: IncidentCategory;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reported_at: string;
  resolved_at?: string;
  investigation_notes?: string;
}

export interface IncidentHistory {
  id: string;
  incident_id: string;
  changed_by: string; // User ID / Name
  changed_by_name?: string;
  previous_status: string;
  new_status: string;
  notes: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}
