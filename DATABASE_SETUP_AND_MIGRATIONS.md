# LabSense — GIET Engineering College Computer Lab Management System
## Database Migrations, Architecture & Deployment Guide

This document outlines the database schema, security rules, and setup instructions for both **Firebase (Active Live Engine)** and **Supabase / PostgreSQL (SQL Reference & Migration Pack)**.

---

### 1. Active Integration: Firebase Authentication & Cloud Firestore
The active application uses Firebase for persistent storage, user identity, and Row Level Security:
- **Configuration File**: `firebase-applet-config.json`
- **Security Rules**: `firestore.rules` (Deployed and active)
- **Data Blueprint**: `firebase-blueprint.json`
- **Security Specification**: `security_spec.md`

#### Collections:
- `/profiles/{profileId}`: User profile documents with authenticated roles (`student`, `teacher`, `admin`).
- `/students/{studentId}`: Student enrollment details (Roll Number, Department, Year, Section).
- `/labs/{labId}`: Lab facilities (e.g., Turing Computing Lab 101, Ada Lovelace Systems Lab 204).
- `/computers/{computerId}`: Workstation inventory assets (`PC-01` through `PC-24`) with hardware status.
- `/lab_sessions/{sessionId}`: Active and completed practical session logs.
- `/incidents/{incidentId}`: Hardware and software malfunction tickets.
- `/incident_history/{historyId}`: Append-only audit trail for incident status changes.
- `/audit_logs/{logId}`: System administrative audit entries.

---

### 2. Supabase / PostgreSQL Migration Script (SQL)
For deploying to a Supabase or PostgreSQL relational instance, execute the following script in the Supabase SQL Editor:

```sql
-- 1. Profiles Table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students Academic Details
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL UNIQUE, -- Roll Number e.g. '21GIETCS042'
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  section TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Labs
CREATE TABLE IF NOT EXISTS public.labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Computers Workstations
CREATE TABLE IF NOT EXISTS public.computers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  computer_number TEXT NOT NULL,
  asset_tag TEXT UNIQUE,
  hostname TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'damaged', 'offline')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Lab Sessions (Attendance & Terminal Locks)
CREATE TABLE IF NOT EXISTS public.lab_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  computer_id UUID NOT NULL REFERENCES public.computers(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent simultaneous active sessions for the same student
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_student
ON public.lab_sessions (student_id)
WHERE status = 'active';

-- Prevent simultaneous active sessions for the same computer
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_computer
ON public.lab_sessions (computer_id)
WHERE status = 'active';

-- 6. Incidents
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computer_id UUID NOT NULL REFERENCES public.computers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.lab_sessions(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('Keyboard', 'Mouse', 'Monitor', 'CPU', 'Network', 'Software', 'Power Supply', 'Physical Damage', 'Other')),
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Investigating', 'In Progress', 'Resolved', 'Closed')),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 7. Incident History (Append-only audit trail)
CREATE TABLE IF NOT EXISTS public.incident_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Row Level Security (RLS) Policies
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.computers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Students can read their own profile; Teachers can read all profiles.
CREATE POLICY "Profiles read access" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- Lab Sessions: Students can see their own sessions; Teachers can see all.
CREATE POLICY "Session read access" ON public.lab_sessions
FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- Incidents: Students can insert incident tickets with their own identity.
CREATE POLICY "Student insert incident" ON public.incidents
FOR INSERT WITH CHECK (student_id = auth.uid());

-- Incidents: Teachers can update incident status.
CREATE POLICY "Teacher update incident" ON public.incidents
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);
```

---

### 4. Running the Application & Evaluator Quick Access
1. Open the application in your browser.
2. The Login screen provides **Instant Evaluator Access**:
   - Click **Demo Faculty: Prof. S. R. Patnaik** to immediately launch the **Teacher Portal**.
   - Click **Demo Student 1: Rahul Varma (21GIETCS042)** or **Demo Student 2: Pooja Reddy (22GIETCS108)** to launch the **Student Portal**.
   - You can also sign up with custom emails or sign in with Google.
3. Use the top header's **Account Switcher** to toggle between Teacher and Student perspectives in real-time.
4. Press **⌘K** (or **Ctrl+K**) anywhere to open the 21st.dev Command Palette search.
