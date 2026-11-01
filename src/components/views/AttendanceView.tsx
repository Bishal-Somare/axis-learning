import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, exportToCsv } from '../../services/api';
import { Batch, Subject, Student, AttendanceSession, AttendanceStatus } from '../../types';
import { 
  ClipboardCheck, Calendar, Clock, Check, X, 
  AlertCircle, Download, History, Edit, Save, 
  RefreshCw, CheckCircle2, UserCheck, AlertTriangle 
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  
  // Master data
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: 'record' or 'history' or 'report'
  const [activeTab, setActiveTab] = useState<'record' | 'history' | 'report'>('record');

  // Form State for Recording Session
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('06:30');
  const [endTime, setEndTime] = useState('08:00');
  
  // Student roll state
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Correction Modal State
  const [correctionSession, setCorrectionSession] = useState<AttendanceSession | null>(null);
  const [correctedRecords, setCorrectedRecords] = useState<any[]>([]);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correcting, setCorrecting] = useState(false);

  // Report State
  const [reportBatchId, setReportBatchId] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bList, sList, sessList] = await Promise.all([
        api.getBatches(),
        api.getSubjects(),
        api.getAttendanceSessions()
      ]);
      setBatches(bList);
      setSubjects(sList);
      setSessions(sessList);

      // Pre-select first batch if teacher is assigned
      if (bList.length > 0 && !selectedBatchId) {
        const assignedBatch = bList.find(b => 
          user?.assignedBatchIds?.includes(b.id) || b.primaryTeacherId === user?.id
        );
        const defaultB = assignedBatch || bList[0];
        setSelectedBatchId(defaultB.id);
        setStartTime(defaultB.startTime);
        setEndTime(defaultB.endTime);
        if (defaultB.subjectIds.length > 0) {
          setSelectedSubjectId(defaultB.subjectIds[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  // Load enrolled students whenever selectedBatchId changes
  useEffect(() => {
    if (!selectedBatchId) return;

    const loadStudentsForBatch = async () => {
      try {
        const students = await api.getStudents({ batchId: selectedBatchId, status: 'ACTIVE' });
        setEnrolledStudents(students);
        
        // Initialize attendance records to PRESENT by default
        const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};
        students.forEach(s => {
          initialMap[s.id] = { status: 'PRESENT', remarks: '' };
        });
        setAttendanceRecords(initialMap);

        // Update default times from batch
        const b = batches.find(x => x.id === selectedBatchId);
        if (b) {
          setStartTime(b.startTime);
          setEndTime(b.endTime);
          if (b.subjectIds.length > 0 && !b.subjectIds.includes(selectedSubjectId)) {
            setSelectedSubjectId(b.subjectIds[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load batch students:', err);
      }
    };

    loadStudentsForBatch();
  }, [selectedBatchId]);

  // Load Report
  const loadReport = async () => {
    try {
      setLoadingReport(true);
      const data = await api.getAttendanceReport({ batchId: reportBatchId || undefined });
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'report') {
      loadReport();
    }
  }, [activeTab, reportBatchId]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    enrolledStudents.forEach(s => {
      updated[s.id] = {
        status,
        remarks: attendanceRecords[s.id]?.remarks || ''
      };
    });
    setAttendanceRecords(updated);
  };

  // Submit attendance session
  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !selectedSubjectId || !sessionDate) {
      setSubmitError('Please select batch, subject, and date.');
      return;
    }

    if (enrolledStudents.length === 0) {
      setSubmitError('No active students enrolled in this batch.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const records = enrolledStudents.map(s => ({
        studentId: s.id,
        studentName: s.fullName,
        status: attendanceRecords[s.id]?.status || 'PRESENT',
        remarks: attendanceRecords[s.id]?.remarks || ''
      }));

      const res = await api.submitAttendanceSession({
        batchId: selectedBatchId,
        subjectId: selectedSubjectId,
        date: sessionDate,
        startTime,
        endTime,
        records
      });

      setSubmitSuccess(
        `Session attendance submitted successfully! ${res.queuedNotificationsCount} absence notification(s) queued for guardians.`
      );
      
      // Refresh session history
      const updatedSessions = await api.getAttendanceSessions();
      setSessions(updatedSessions);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  // Open correction modal
  const handleOpenCorrection = (session: AttendanceSession) => {
    setCorrectionSession(session);
    setCorrectedRecords(JSON.parse(JSON.stringify(session.records)));
    setCorrectionReason('');
  };

  const handleSaveCorrection = async () => {
    if (!correctionSession) return;
    if (!correctionReason.trim() || correctionReason.trim().length < 5) {
      alert('Please provide a mandatory explanation reason (at least 5 characters).');
      return;
    }

    try {
      setCorrecting(true);
      await api.correctAttendanceSession(correctionSession.id, correctedRecords, correctionReason);
      setCorrectionSession(null);
      const updatedSessions = await api.getAttendanceSessions();
      setSessions(updatedSessions);
      alert('Attendance session successfully corrected and logged to audit trail.');
    } catch (err: any) {
      alert(err.message || 'Failed to correct attendance');
    } finally {
      setCorrecting(false);
    }
  };

  // Export session records to CSV
  const handleExportSessionCsv = (sess: AttendanceSession) => {
    const headers = ['Session ID', 'Batch', 'Subject', 'Date', 'Student ID', 'Student Name', 'Status', 'Remarks', 'Recorded By'];
    const rows = sess.records.map(r => [
      sess.id,
      sess.batchName,
      sess.subjectName,
      sess.date,
      r.studentId,
      r.studentName,
      r.status,
      r.remarks || '',
      sess.teacherName
    ]);
    exportToCsv(`Axis_Attendance_${sess.batchName.replace(/\s+/g, '_')}_${sess.date}`, [headers, ...rows]);
  };

  // Export Summary Report to CSV
  const handleExportReportCsv = () => {
    if (!reportData || !reportData.studentReport) return;
    const headers = ['Student ID', 'Student Name', 'Grade', 'Total Sessions', 'Present', 'Absent', 'Late', 'Leave', 'Attendance %', 'Repeated Absentee'];
    const rows = reportData.studentReport.map((s: any) => [
      s.studentId,
      s.studentName,
      s.grade,
      s.totalSessions,
      s.present,
      s.absent,
      s.late,
      s.leave,
      `${s.attendancePercentage}%`,
      s.isRepeatedAbsentee ? 'YES' : 'NO'
    ]);
    exportToCsv(`Axis_Attendance_Report_${new Date().toISOString().split('T')[0]}`, [headers, ...rows]);
  };

  // Summary counts for current form
  const currentCounts = {
    present: Object.values(attendanceRecords).filter(r => r.status === 'PRESENT').length,
    absent: Object.values(attendanceRecords).filter(r => r.status === 'ABSENT').length,
    late: Object.values(attendanceRecords).filter(r => r.status === 'LATE').length,
    leave: Object.values(attendanceRecords).filter(r => r.status === 'LEAVE').length,
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* View Header and Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Session-Based Attendance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Recorded per scheduled class period with automated absence queuing and audit correction history
          </p>
        </div>

        {/* Segmented Control Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('record')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'record'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Record Session
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Session History
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'report'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Percentage Reports
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RECORD SESSION ATTENDANCE */}
      {/* ========================================================= */}
      {activeTab === 'record' && (
        <div className="space-y-5">
          {/* Form Filter Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Batch / Shift *</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Subject *</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Period Time</label>
                <div className="flex items-center gap-1.5 font-mono">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-1/2 px-2 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-1/2 px-2 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Live Count and Quick Mark Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Session Roll:</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {currentCounts.present} Present
                </span>
                <span className="font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                  {currentCounts.absent} Absent
                </span>
                <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                  {currentCounts.late} Late
                </span>
                <span className="font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                  {currentCounts.leave} Leave
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Quick mark:</span>
                <button
                  type="button"
                  onClick={() => handleMarkAll('PRESENT')}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px]"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('ABSENT')}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px]"
                >
                  All Absent
                </button>
              </div>
            </div>
          </div>

          {submitSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{submitSuccess}</span>
              </div>
              <button 
                onClick={() => setSubmitSuccess(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{submitError}</span>
              </div>
              <button 
                onClick={() => setSubmitError(null)}
                className="text-rose-700 hover:text-rose-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Student Roll Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Student ID & Name</th>
                    <th className="py-3 px-4">Guardian Contact</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4">Remarks / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No enrolled active students found for this batch.
                      </td>
                    </tr>
                  ) : (
                    enrolledStudents.map((student, idx) => {
                      const current = attendanceRecords[student.id] || { status: 'PRESENT', remarks: '' };

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-400 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{student.fullName}</div>
                            <div className="font-mono text-[11px] text-slate-500">{student.id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-700">{student.guardianName}</div>
                            <div className="font-mono text-[11px] text-slate-400">{student.guardianEmail || student.guardianPhone}</div>
                          </td>
                          <td className="py-3 px-4">
                            {/* Status Buttons */}
                            <div className="flex items-center gap-1">
                              {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as AttendanceStatus[]).map((st) => {
                                const isSelected = current.status === st;
                                let colorClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
                                if (isSelected) {
                                  if (st === 'PRESENT') colorClass = 'bg-emerald-600 text-white font-bold shadow-xs';
                                  if (st === 'ABSENT') colorClass = 'bg-rose-600 text-white font-bold shadow-xs';
                                  if (st === 'LATE') colorClass = 'bg-amber-600 text-white font-bold shadow-xs';
                                  if (st === 'LEAVE') colorClass = 'bg-sky-600 text-white font-bold shadow-xs';
                                }

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleStatusChange(student.id, st)}
                                    className={`px-2.5 py-1 rounded text-xs transition-colors ${colorClass}`}
                                  >
                                    {st === 'PRESENT' ? 'P' : st === 'ABSENT' ? 'A' : st === 'LATE' ? 'Late' : 'Leave'}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={current.remarks}
                              onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                              placeholder="Optional remark..."
                              className="w-full px-2.5 py-1 rounded border border-slate-200 text-xs focus:outline-hidden"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Submit Action */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                <span>Submitting as teacher: </span>
                <span className="font-semibold text-slate-900">{user?.name}</span>
                <span className="mx-1.5">·</span>
                <span>Anti-duplicate locking active</span>
              </div>

              <button
                type="button"
                onClick={handleSubmitSession}
                disabled={submitting || enrolledStudents.length === 0}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Session Attendance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: HISTORICAL SESSIONS & CORRECTIONS */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Session Attendance History</h2>
            <p className="text-xs text-slate-500 mb-3">All recorded sessions with submission timestamps, audit indicators, and export actions</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Batch Name</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Teacher</th>
                    <th className="py-3 px-4">Roll Breakdown</th>
                    <th className="py-3 px-4">Status / Audit</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No recorded sessions found.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((sess) => {
                      const p = sess.records.filter(r => r.status === 'PRESENT').length;
                      const a = sess.records.filter(r => r.status === 'ABSENT').length;
                      const l = sess.records.filter(r => r.status === 'LATE').length;
                      const lv = sess.records.filter(r => r.status === 'LEAVE').length;

                      return (
                        <tr key={sess.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-slate-900 tabular-nums">{sess.date}</div>
                            <div className="font-mono text-[11px] text-slate-400">{sess.startTime} - {sess.endTime}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {sess.batchName}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {sess.subjectName}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {sess.teacherName}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
                              <span className="text-emerald-700 font-semibold">{p} P</span>
                              <span>·</span>
                              <span className="text-rose-700 font-semibold">{a} A</span>
                              <span>·</span>
                              <span className="text-amber-700">{l} L</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {sess.isEdited ? (
                              <div>
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800">
                                  Corrected
                                </span>
                                <div className="text-[10px] text-slate-400 truncate max-w-[120px]" title={sess.editReason}>
                                  {sess.editReason}
                                </div>
                              </div>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800">
                                Original
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleExportSessionCsv(sess)}
                                title="Export Session CSV"
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenCorrection(sess)}
                                title="Authorized Attendance Correction"
                                className="px-2 py-1 text-[11px] font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded"
                              >
                                Correct
                              </button>
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
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ATTENDANCE PERCENTAGE REPORTS */}
      {/* ========================================================= */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Attendance Percentage & Absentee Analysis</h2>
                <p className="text-xs text-slate-500">
                  Formula: (Present + 0.5 × Late) / Total Sessions × 100% · Flags students with ≥ 3 unexcused absences
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={reportBatchId}
                  onChange={(e) => setReportBatchId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
                >
                  <option value="">All Batches Combined</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                <button
                  onClick={handleExportReportCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export Report CSV</span>
                </button>
              </div>
            </div>

            {loadingReport ? (
              <div className="py-8 text-center text-xs text-slate-500">Calculating attendance statistics...</div>
            ) : !reportData || !reportData.studentReport || reportData.studentReport.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No session attendance data recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Student ID & Name</th>
                      <th className="py-3 px-4">Grade</th>
                      <th className="py-3 px-4 text-center">Total Sessions</th>
                      <th className="py-3 px-4 text-center">Present</th>
                      <th className="py-3 px-4 text-center">Absent</th>
                      <th className="py-3 px-4 text-center">Late</th>
                      <th className="py-3 px-4 text-right">Attendance %</th>
                      <th className="py-3 px-4 text-center">Warning Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.studentReport.map((s: any) => (
                      <tr key={s.studentId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{s.studentName}</div>
                          <div className="font-mono text-[11px] text-slate-400">{s.studentId}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{s.grade}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums">{s.totalSessions}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-emerald-700 font-semibold">{s.present}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-rose-700 font-semibold">{s.absent}</td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-amber-700">{s.late}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                          {s.attendancePercentage}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          {s.isRepeatedAbsentee ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700">
                              Repeated Absent (≥3)
                            </span>
                          ) : s.attendancePercentage >= 90 ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              Exemplary
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Nominal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Authorized Attendance Correction */}
      {correctionSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Attendance Correction with Audit Reason</h2>
                <p className="text-[11px] text-slate-500">{correctionSession.batchName} · {correctionSession.date}</p>
              </div>
              <button 
                onClick={() => setCorrectionSession(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <span className="font-bold">Security & Audit Notice:</span> Any modifications made to this submitted session are permanently recorded in the administrative Audit Trail along with the modifier's username and timestamp.
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Mandatory Reason for Correction *</label>
                <textarea
                  required
                  rows={2}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Student arrived late during roll call; medical slip submitted afterwards by guardian..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="divide-y divide-slate-100 border rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 font-semibold text-slate-700 flex justify-between">
                  <span>Student</span>
                  <span>Corrected Status</span>
                </div>
                {correctedRecords.map((rec, i) => (
                  <div key={rec.studentId} className="px-3 py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{rec.studentName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{rec.studentId}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as AttendanceStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            const updated = [...correctedRecords];
                            updated[i].status = st;
                            setCorrectedRecords(updated);
                          }}
                          className={`px-2 py-0.5 rounded text-xs transition-colors ${
                            rec.status === st
                              ? 'bg-indigo-900 text-white font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st === 'PRESENT' ? 'P' : st === 'ABSENT' ? 'A' : st === 'LATE' ? 'Late' : 'Leave'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectionSession(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCorrection}
                  disabled={correcting || !correctionReason.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 shadow-xs disabled:opacity-50"
                >
                  {correcting ? 'Saving Correction...' : 'Commit Correction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
