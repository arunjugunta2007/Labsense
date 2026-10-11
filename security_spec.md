# Security Specification — LabSense Security & Access Control

## 1. Data Invariants
1. **Zero-Trust Identity**: A student cannot create or update sessions, reports, or profiles using another user's UID.
2. **Immutable Role Assignment**: Users cannot elevate their own role (`role: 'teacher'` or `role: 'admin'`) during profile update or creation without administrative authority.
3. **Session Integrity**: A session cannot be claimed as active without a valid timestamp, valid computer reference, and owner matching authenticated UID.
4. **No History Tampering**: Incident history and audit log entries are append-only; historical logs cannot be mutated or deleted by students.
5. **Computer Ownership Integrity**: Only authorized lab staff (teachers/administrators) can alter computer operational status (e.g. marking as 'maintenance' or 'damaged') or modify computer inventory.
6. **Incident Authenticity**: Incident reports must be tied to the reporting student's authenticated ID and a valid computer ID.

## 2. The Dirty Dozen Payloads (Adversarial Security Tests)
1. **Payload 1 (Privilege Escalation on Signup)**: Student registers with `{ role: 'admin', full_name: 'Mallory' }`. Expected: Rejected (roles cannot be self-elevated).
2. **Payload 2 (Session Impersonation)**: Student A creates session with `student_id: 'Student-B-UID'`. Expected: Rejected.
3. **Payload 3 (Retroactive Time Manipulation)**: Student attempts to update past session `login_time` to 2 hours ago. Expected: Rejected (session historical times immutable).
4. **Payload 4 (Ghost Computer Creation)**: Student attempts to insert unauthorized computer into `/computers`. Expected: Rejected (teachers/admins only).
5. **Payload 5 (Destructive Incident Deletion)**: Student attempts `deleteDoc(/incidents/inc-123)`. Expected: Rejected (incidents cannot be purged by students).
6. **Payload 6 (Incident History Falsification)**: Student writes fake status change into `/incident_history`. Expected: Rejected.
7. **Payload 7 (Denial of Wallet Buffer Bomb)**: User sends 1.2MB payload in `description` or 5000 character ID. Expected: Rejected via `isValidId()` and `.size()` limits.
8. **Payload 8 (Foreign Session Termination)**: Student A attempts to mark Student B's active session as completed. Expected: Rejected.
9. **Payload 9 (Unauthenticated State Access)**: Anonymous unverified client requests private student academic files. Expected: Rejected.
10. **Payload 10 (Audit Log Purge)**: Attacker calls `delete` on `/audit_logs`. Expected: Rejected (audit logs are write-only by authorized actors, zero deletion).
11. **Payload 11 (Shadow Field Injection)**: Incident report injected with `{ category: 'Mouse', description: 'Broken', isResolvedImmediately: true, secretBypass: true }`. Expected: Rejected via `hasOnly()` validation.
12. **Payload 12 (Cross-Tenant Profile Read)**: User attempts to scan all user PII without teacher/admin credential. Expected: Controlled by access boundaries.
