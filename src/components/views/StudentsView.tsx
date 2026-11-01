import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, exportToCsv } from '../../services/api';
import { Student, Batch, GradeLevel, StudentStatus } from '../../types';
import { 
  Search, Plus, Download, Upload, Filter, 
  Eye, Edit3, ArrowRightLeft, AlertTriangle, 
  CheckCircle, User, Phone, Mail, MapPin, 
  Calendar, X, RefreshCw 
} from 'lucide-react';

export const StudentsView: React.FC = () => {
  const { isSuperAdmin, user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Student | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<Student | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form states for New Student
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    grade: 'Class 10' as GradeLevel,
    stream: 'General' as 'General' | 'Science' | 'Management',
    batchIds: [] as string[],
    guardianName: '',
    guardianPhone: '+977-',
    guardianEmail: '',
    guardianRelation: 'Father',
    address: 'Butwal Shitalnagar, Nepal',
    notes: ''
  });
  const [duplicateWarning, setDuplicateWarning] = useState<any[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for Batch Transfer
  const [transferTargetBatch, setTransferTargetBatch] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Bulk CSV import state
  const [csvRawText, setCsvRawText] = useState('');
  const [importResult, setImportResult] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stList, bList] = await Promise.all([
        api.getStudents({
          grade: selectedGrade || undefined,
          batchId: selectedBatchId || undefined,
          status: selectedStatus || undefined,
          search: search || undefined
        }),
        api.getBatches()
      ]);
      setStudents(stList);
      setBatches(bList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedGrade, selectedBatchId, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Duplicate check as user types
  const handleCheckDuplicate = async () => {
    if (!newStudent.fullName || newStudent.fullName.length < 3) return;
    try {
      const res = await api.checkDuplicate({
        fullName: newStudent.fullName,
        guardianPhone: newStudent.guardianPhone,
        guardianEmail: newStudent.guardianEmail,
        grade: newStudent.grade
      });
      if (res.isDuplicateLikely) {
        setDuplicateWarning(res.matches);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createStudent(newStudent);
      setShowAddModal(false);
      setNewStudent({
        fullName: '',
        grade: 'Class 10',
        stream: 'General' as 'General' | 'Science' | 'Management',
        batchIds: [],
        guardianName: '',
        guardianPhone: '+977-',
        guardianEmail: '',
        guardianRelation: 'Father',
        address: 'Butwal Shitalnagar, Nepal',
        notes: ''
      });
      setDuplicateWarning(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to register student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTransferModal || !transferTargetBatch) return;

    try {
      setSubmitting(true);
      await api.transferBatch(showTransferModal.id, transferTargetBatch, transferReason);
      setShowTransferModal(null);
      setTransferTargetBatch('');
      setTransferReason('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to transfer student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Student ID', 'Full Name', 'Grade', 'Stream', 'Batches Enrolled', 'Guardian Name', 'Guardian Phone', 'Guardian Email', 'Address', 'Admission Date', 'Status'];
    const rows = students.map(s => [
      s.id,
      s.fullName,
      s.grade,
      s.stream || 'General',
      s.batchIds.map(bId => {
        const b = batches.find(x => x.id === bId);
        return b ? b.name : bId;
      }).join('; '),
      s.guardianName,
      s.guardianPhone,
      s.guardianEmail,
      s.address,
      s.admissionDate,
      s.status
    ]);

    exportToCsv(`Axis_Students_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
  };

  const handleProcessCsvImport = async () => {
    if (!csvRawText.trim()) return;
    try {
      setSubmitting(true);
      const lines = csvRawText.trim().split('\n');
      const parsedList: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts[0]) {
          parsedList.push({
            fullName: parts[0],
            grade: parts[1] || 'Class 10',
            stream: parts[2] || 'General',
            guardianName: parts[3] || 'Guardian',
            guardianPhone: parts[4] || '+977-9840000000',
            guardianEmail: parts[5] || '',
            address: parts[6] || 'Butwal Shitalnagar',
            admissionDate: parts[7] || new Date().toISOString().split('T')[0]
          });
        }
      }

      const res = await api.bulkImportStudents(parsedList);
      setImportResult(`Successfully imported ${res.importedCount} student records!`);
      fetchData();
      setTimeout(() => {
        setShowImportModal(false);
        setImportResult(null);
        setCsvRawText('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Distinct count
  const distinctCount = students.length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Student Management & Admissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Canonical student records with single ID tracking across multiple batches · No double counting
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {isSuperAdmin && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Import CSV</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Register Student</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student ID (AX-2026-...), student name, or guardian..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="">All Grades</option>
              <option value="Class 10">Class 10 (SEE)</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 8">Class 8</option>
              <option value="+2 Science">+2 Science</option>
              <option value="+2 Management">+2 Management</option>
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
            </select>

            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden max-w-[180px]"
            >
              <option value="">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>

            <button
              type="submit"
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Filter
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-semibold text-slate-800 font-mono tabular-nums">{distinctCount}</span> distinct student record(s)
          </div>
          {(search || selectedGrade || selectedBatchId || selectedStatus !== 'ACTIVE') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedGrade('');
                setSelectedBatchId('');
                setSelectedStatus('ACTIVE');
              }}
              className="text-xs text-indigo-700 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Students Data Grid (Tabular nums) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Grade & Stream</th>
                <th className="py-3 px-4">Enrolled Batch</th>
                <th className="py-3 px-4">Guardian Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No student records found matching the active criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const enrolledBatchNames = student.batchIds.map(bId => {
                    const b = batches.find(x => x.id === bId);
                    return b ? b.name : bId;
                  });

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 tabular-nums">
                        {student.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{student.fullName}</div>
                        <div className="text-[11px] text-slate-400">Adm: {student.admissionDate}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{student.grade}</div>
                        <div className="text-[11px] text-slate-500">{student.stream}</div>
                      </td>
                      <td className="py-3 px-4">
                        {enrolledBatchNames.length === 0 ? (
                          <span className="text-slate-400 italic">No batch assigned</span>
                        ) : (
                          <div className="space-y-0.5 max-w-[200px]">
                            {enrolledBatchNames.map((name, i) => (
                              <div key={i} className="text-[11px] font-medium text-slate-700 truncate" title={name}>
                                {name}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{student.guardianName} ({student.guardianRelation})</div>
                        <div className="font-mono text-[11px] text-slate-500 tabular-nums">{student.guardianPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          student.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-800'
                            : student.status === 'TRANSFERRED'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setShowDetailModal(student)}
                            title="View Student Profile"
                            className="p-1 text-slate-500 hover:text-indigo-900 hover:bg-slate-100 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                setShowTransferModal(student);
                                setTransferTargetBatch(student.batchIds[0] || '');
                              }}
                              title="Transfer Batch"
                              className="p-1 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Student Registration */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Register New Student</h2>
              <button 
                onClick={() => { setShowAddModal(false); setDuplicateWarning(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {duplicateWarning && duplicateWarning.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Likely Duplicate Student Detected</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    A student with similar details already exists: {duplicateWarning.map(m => `${m.fullName} (${m.id})`).join(', ')}. Please verify if this is a re-admission or distinct student.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.fullName}
                    onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                    onBlur={handleCheckDuplicate}
                    placeholder="e.g. Aarav Shrestha"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Grade / Class Level *</label>
                  <select
                    value={newStudent.grade}
                    onChange={(e) => {
                      const gr = e.target.value as GradeLevel;
                      let st: 'General' | 'Science' | 'Management' = 'General';
                      if (gr.includes('Science')) st = 'Science';
                      else if (gr.includes('Management')) st = 'Management';
                      setNewStudent({ ...newStudent, grade: gr, stream: st });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                  >
                    <option value="Class 10">Class 10 (SEE)</option>
                    <option value="+2 Science">+2 Science</option>
                    <option value="+2 Management">+2 Management</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8 (BLE)</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Class 4">Class 4</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 1">Class 1</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Enroll into Initial Batch(es)</label>
                <select
                  multiple
                  value={newStudent.batchIds}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions, opt => opt.value);
                    setNewStudent({ ...newStudent, batchIds: opts });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden h-24"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.startTime} - {b.endTime})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">Hold Ctrl / Cmd to select multiple batches</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Guardian Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.guardianName}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianName: e.target.value })}
                    placeholder="e.g. Ram Krishna Shrestha"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Guardian Phone (Nepal Mobile) *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.guardianPhone}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianPhone: e.target.value })}
                    onBlur={handleCheckDuplicate}
                    placeholder="+977-98XXXXXXXX"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Guardian Email (For Absence Alerts)</label>
                  <input
                    type="email"
                    value={newStudent.guardianEmail}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianEmail: e.target.value })}
                    onBlur={handleCheckDuplicate}
                    placeholder="guardian@example.com"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Relation</label>
                  <select
                    value={newStudent.guardianRelation}
                    onChange={(e) => setNewStudent({ ...newStudent, guardianRelation: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Local Guardian">Local Guardian</option>
                    <option value="Sibling">Sibling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={newStudent.address}
                  onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                  placeholder="e.g. Shankhamul, Butwal Shitalnagar"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Admission Notes / Target</label>
                <textarea
                  rows={2}
                  value={newStudent.notes}
                  onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                  placeholder="e.g. Focus on optional math, aiming for St. Xavier's entrance..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 shadow-xs"
                >
                  {submitting ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Student Detail & Profile */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-900">{showDetailModal.id}</span>
                <span className="text-slate-300">·</span>
                <span className="font-bold text-slate-900 text-sm">{showDetailModal.fullName}</span>
              </div>
              <button 
                onClick={() => setShowDetailModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Grade</span>
                  <div className="font-bold text-slate-900">{showDetailModal.grade} ({showDetailModal.stream})</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Status</span>
                  <div>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800">
                      {showDetailModal.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Admission Date</span>
                  <div className="font-mono text-slate-700">{showDetailModal.admissionDate}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Enrolled Batches</span>
                  <div className="text-slate-800 font-medium">
                    {showDetailModal.batchIds.length} batch(es) assigned
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Guardian Contact Details</div>
                <div className="grid grid-cols-1 gap-1 text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{showDetailModal.guardianName} ({showDetailModal.guardianRelation})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{showDetailModal.guardianPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{showDetailModal.guardianEmail || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{showDetailModal.address}</span>
                  </div>
                </div>
              </div>

              {showDetailModal.notes && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Academic Counselor Notes</span>
                  <p className="mt-1 text-slate-700 bg-amber-50/50 p-2.5 rounded border border-amber-100 leading-relaxed">
                    {showDetailModal.notes}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Batch Transfer without losing history */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Transfer Student Batch</h2>
              <button 
                onClick={() => setShowTransferModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransferBatch} className="p-5 space-y-4 text-xs">
              <div>
                <p className="text-slate-600">
                  Transferring <span className="font-bold text-slate-900">{showTransferModal.fullName}</span> ({showTransferModal.id}).
                  Historical attendance and session logs are retained in the database.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Batch *</label>
                <select
                  required
                  value={transferTargetBatch}
                  onChange={(e) => setTransferTargetBatch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden"
                >
                  <option value="">Select Target Batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.startTime} - {b.endTime})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Reason for Transfer (Recorded in Audit Log) *</label>
                <textarea
                  required
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Guardian requested shift change from Morning to Evening due to school timetable..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !transferTargetBatch || !transferReason}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk CSV Import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Bulk Import Students from CSV</h2>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Paste your comma-separated student records below. First line must be the header.
              </p>

              <div className="p-2.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700 overflow-x-auto">
                FullName,Grade,Stream,GuardianName,GuardianPhone,GuardianEmail,Address
              </div>

              <textarea
                rows={8}
                value={csvRawText}
                onChange={(e) => setCsvRawText(e.target.value)}
                placeholder="FullName,Grade,Stream,GuardianName,GuardianPhone,GuardianEmail,Address&#10;Dipak Sharma,Class 10,General,Hari Sharma,+977-9841223344,hari@example.com,Koteshwor&#10;Smriti KC,+2 Science,Science,Bimal KC,+977-9851009988,bimal@example.com,Baneshwor"
                className="w-full p-3 rounded-lg border border-slate-200 font-mono text-xs focus:outline-hidden"
              />

              {importResult && (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                  {importResult}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessCsvImport}
                  disabled={submitting || !csvRawText.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
