import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Batch, Subject } from '../../types';
import { 
  Users, Mail, Phone, BookOpen, Calendar, 
  CheckCircle, Plus, Shield, UserCheck, 
  UserX, Edit3, X, Award 
} from 'lucide-react';

export const TeachersView: React.FC = () => {
  const { isSuperAdmin, user: currentUser } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditAssignmentsModal, setShowEditAssignmentsModal] = useState<any | null>(null);

  // Invite Form
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '+977-',
    designation: 'Tuition Faculty',
    role: 'TEACHER',
    assignedSubjects: [] as string[],
    assignedBatchIds: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);

  // Assignment edit state
  const [editBatchIds, setEditBatchIds] = useState<string[]>([]);
  const [editSubjectNames, setEditSubjectNames] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tList, bList, sList] = await Promise.all([
        api.getTeachers(),
        api.getBatches(),
        api.getSubjects()
      ]);
      setTeachers(tList);
      setBatches(bList);
      setSubjects(sList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (teacher: any) => {
    if (teacher.id === 'USR-001') {
      alert('Cannot deactivate the Founding Director.');
      return;
    }
    const confirm = window.confirm(`Are you sure you want to ${teacher.isActive ? 'deactivate' : 'activate'} ${teacher.name}?`);
    if (!confirm) return;

    try {
      await api.toggleTeacherStatus(teacher.id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createTeacher(newTeacher);
      setShowInviteModal(false);
      setNewTeacher({
        name: '',
        email: '',
        phone: '+977-',
        designation: 'Tuition Faculty',
        role: 'TEACHER',
        assignedSubjects: [],
        assignedBatchIds: []
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create teacher account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditAssignmentsModal) return;

    try {
      setSubmitting(true);
      await api.updateTeacherAssignments(showEditAssignmentsModal.id, editBatchIds, editSubjectNames);
      setShowEditAssignmentsModal(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update assignments');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Teachers & Faculty Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            5 Founding Teachers in Kathmandu · Individual accounts, role authorization, and monthly session checklist
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Faculty Account</span>
          </button>
        )}
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teachers.map((teacher) => {
          const isDirector = teacher.id === 'USR-001';

          return (
            <div 
              key={teacher.id}
              className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between ${
                teacher.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base text-white shrink-0 ${
                      teacher.role === 'SUPER_ADMIN' ? 'bg-indigo-950' : 'bg-indigo-800'
                    }`}>
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                        <span>{teacher.name}</span>
                        {isDirector && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1 rounded">Director</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500">{teacher.designation}</p>
                    </div>
                  </div>

                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    teacher.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {teacher.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] truncate">{teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px]">{teacher.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-700">Role: {teacher.role}</span>
                  </div>
                </div>

                {/* Assigned Subjects */}
                <div className="mt-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Teaching Subjects
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(teacher.assignedSubjects || []).length === 0 ? (
                      <span className="text-slate-400 text-[11px] italic">No subjects assigned</span>
                    ) : (
                      teacher.assignedSubjects.map((sub: string, sIdx: number) => (
                        <span key={sIdx} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {sub}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Assigned Batches */}
                <div className="mt-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Assigned Batches
                  </div>
                  <div className="space-y-0.5">
                    {(teacher.assignedBatches || []).length === 0 ? (
                      <span className="text-slate-400 text-[11px] italic">No batches assigned</span>
                    ) : (
                      teacher.assignedBatches.map((b: any) => (
                        <div key={b.id} className="text-[11px] text-slate-700 font-medium truncate" title={b.name}>
                          • {b.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Attendance Checklist Metric & Admin Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-slate-500">This Month: </span>
                  <span className="font-mono font-bold text-indigo-950 tabular-nums">
                    {teacher.submittedThisMonth || 0} sessions
                  </span>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setShowEditAssignmentsModal(teacher);
                        setEditBatchIds(teacher.assignedBatchIds || []);
                        setEditSubjectNames(teacher.assignedSubjects || []);
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded"
                    >
                      Assign
                    </button>
                    {!isDirector && (
                      <button
                        onClick={() => handleToggleStatus(teacher)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded ${
                          teacher.isActive 
                            ? 'text-rose-700 bg-rose-50 hover:bg-rose-100' 
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {teacher.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Faculty Account */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Create Faculty / Staff Account</h2>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Teacher Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                    placeholder="e.g. Ramesh Koirala"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Axis Email / Google ID *</label>
                  <input
                    type="email"
                    required
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    placeholder="teacher@axislearning.edu.np"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                    placeholder="+977-98XXXXXXXX"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newTeacher.designation}
                    onChange={(e) => setNewTeacher({ ...newTeacher, designation: e.target.value })}
                    placeholder="e.g. Senior Faculty - Mathematics"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">System Role</label>
                <select
                  value={newTeacher.role}
                  onChange={(e) => setNewTeacher({ ...newTeacher, role: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                >
                  <option value="TEACHER">Faculty Teacher (Assigned Batches only)</option>
                  <option value="SUPER_ADMIN">Super Administrator (Full System Access)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 shadow-xs"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Batch & Subject Assignments */}
      {showEditAssignmentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                Edit Assignments for {showEditAssignmentsModal.name}
              </h2>
              <button 
                onClick={() => setShowEditAssignmentsModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignments} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Assigned Batches</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border p-2 rounded-lg">
                  {batches.map(b => {
                    const isChecked = editBatchIds.includes(b.id);
                    return (
                      <label key={b.id} className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditBatchIds([...editBatchIds, b.id]);
                            } else {
                              setEditBatchIds(editBatchIds.filter(id => id !== b.id));
                            }
                          }}
                        />
                        <span>{b.name} ({b.startTime} - {b.endTime})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Subjects (Comma separated)</label>
                <input
                  type="text"
                  value={editSubjectNames.join(', ')}
                  onChange={(e) => setEditSubjectNames(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g. Compulsory Mathematics, Optional Mathematics"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditAssignmentsModal(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
