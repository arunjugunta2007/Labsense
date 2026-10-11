import React, { useState, useEffect } from 'react';
import { Search, Users, Eye, GraduationCap, History, Mail, Filter } from 'lucide-react';
import { getStudentsList, getSessionsForStudent } from '../../services/labService';
import { UserProfile, StudentProfile, LabSession } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

export function TeacherStudentsPage() {
  const [students, setStudents] = useState<{ profile: UserProfile; student?: StudentProfile }[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<{ profile: UserProfile; student?: StudentProfile } | null>(null);
  const [studentSessions, setStudentSessions] = useState<LabSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function init() {
      const data = await getStudentsList();
      setStudents(data || []);
    }
    init();
  }, []);

  const handleInspectStudent = async (item: { profile: UserProfile; student?: StudentProfile }) => {
    setSelectedStudent(item);
    setModalOpen(true);
    setLoadingSessions(true);
    try {
      const sessions = await getSessionsForStudent(item.profile.id);
      setStudentSessions(sessions || []);
    } catch (err) {
      console.warn('Student session fetch err:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const roll = s.student?.student_id?.toLowerCase() || '';
    const name = s.profile.full_name.toLowerCase();
    const email = s.profile.email.toLowerCase();
    const dept = s.student?.department || '';

    const matchesSearch = roll.includes(q) || name.includes(q) || email.includes(q);
    const matchesDept = departmentFilter === 'ALL' || dept.includes(departmentFilter);

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Directory & Academic Enrollment</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorized faculty inspection of enrolled lab students and their practical computer usage logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer Science">Computer Science & Engg</option>
            <option value="Information Technology">Information Technology</option>
          </select>

          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by roll no, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2858]/20 focus:border-[#0B2858]"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader
          title={`Enrolled Students (${filtered.length})`}
          subtitle="Showing authorized accounts synced with Supabase / Firestore"
        />
        <CardContent className="p-0">
          <Table
            headers={['Roll Number', 'Student Name', 'Institutional Email', 'Department', 'Year & Section', 'Status', 'Action']}
            empty={filtered.length === 0}
            emptyMessage="No student records found."
          >
            {filtered.map((item) => (
              <tr key={item.profile.id} className="hover:bg-slate-50/75">
                <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
                  {item.student?.student_id || '21GIETCS042'}
                </td>
                <td className="py-3 px-4 text-slate-900 font-medium whitespace-nowrap">
                  {item.profile.full_name}
                </td>
                <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                  {item.profile.email}
                </td>
                <td className="py-3 px-4 text-slate-700 text-xs whitespace-nowrap">
                  {item.student?.department || 'Computer Science & Engineering'}
                </td>
                <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                  {item.student?.year || '3rd Year'} • {item.student?.section || 'Section A'}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInspectStudent(item)}
                    className="text-xs py-1"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Inspect History
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </CardContent>
      </Card>

      {/* Student Details & Session History Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Student Profile: ${selectedStudent?.profile.full_name}`}
        description={`Roll Number: ${selectedStudent?.student?.student_id || 'N/A'}`}
        maxWidth="2xl"
      >
        <div className="space-y-5 text-xs">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">Email</span>
              <span className="font-semibold text-slate-800 truncate block">{selectedStudent?.profile.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Department</span>
              <span className="font-semibold text-slate-800">{selectedStudent?.student?.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Academic Year</span>
              <span className="font-semibold text-slate-800">{selectedStudent?.student?.year}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Class Section</span>
              <span className="font-semibold text-slate-800">{selectedStudent?.student?.section}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#0B2858]" />
              Workstation Practical Session Log
            </h4>

            {loadingSessions ? (
              <div className="py-6 text-center text-slate-400">Loading student attendance sessions...</div>
            ) : studentSessions.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 border border-dashed border-slate-200">
                No recorded lab sessions for this student.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {studentSessions.map((s) => (
                  <div key={s.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {s.computer_number} ({s.lab_name || 'Lab 101'})
                      </div>
                      <div className="text-slate-500 mt-0.5">{s.purpose}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-600 font-medium">
                        {new Date(s.login_time).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(s.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {s.logout_time && ` - ${new Date(s.logout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
