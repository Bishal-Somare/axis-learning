import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, exportToCsv } from '../../services/api';
import { 
  FileSpreadsheet, Download, Filter, 
  Calendar, CheckCircle2, Users, CreditCard, 
  Clock, AlertTriangle 
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [reportType, setReportType] = useState<'attendance' | 'students' | 'teachers' | 'finance'>('attendance');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    api.getBatches().then(setBatches).catch(console.error);
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      if (reportType === 'attendance') {
        const res = await api.getAttendanceReport({ batchId: selectedBatchId || undefined });
        setData(res);
      } else if (reportType === 'students') {
        const res = await api.getStudents();
        setData(res);
      } else if (reportType === 'teachers') {
        const res = await api.getTeachers();
        setData(res);
      } else if (reportType === 'finance') {
        const [inv, pay, exp] = await Promise.all([
          api.getInvoices(),
          api.getPayments(),
          api.getExpenses()
        ]);
        setData({ inv, pay, exp });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, selectedBatchId]);

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];

    if (reportType === 'attendance' && data?.studentReport) {
      const headers = ['Student ID', 'Student Name', 'Grade', 'Total Sessions', 'Present', 'Absent', 'Late', 'Leave', 'Attendance %', 'Flag'];
      const rows = data.studentReport.map((s: any) => [
        s.studentId,
        s.studentName,
        s.grade,
        s.totalSessions,
        s.present,
        s.absent,
        s.late,
        s.leave,
        `${s.attendancePercentage}%`,
        s.isRepeatedAbsentee ? 'REPEATED_ABSENT' : 'NOMINAL'
      ]);
      exportToCsv(`Axis_Attendance_Report_${timestamp}`, [headers, ...rows]);
    } else if (reportType === 'students' && Array.isArray(data)) {
      const headers = ['Student ID', 'Full Name', 'Grade', 'Stream', 'Guardian Name', 'Guardian Phone', 'Guardian Email', 'Admission Date', 'Status'];
      const rows = data.map((s: any) => [
        s.id,
        s.fullName,
        s.grade,
        s.stream,
        s.guardianName,
        s.guardianPhone,
        s.guardianEmail,
        s.admissionDate,
        s.status
      ]);
      exportToCsv(`Axis_Students_Master_${timestamp}`, [headers, ...rows]);
    } else if (reportType === 'teachers' && Array.isArray(data)) {
      const headers = ['Teacher ID', 'Name', 'Email', 'Role', 'Phone', 'Designation', 'Subjects', 'Sessions Submitted This Month'];
      const rows = data.map((t: any) => [
        t.id,
        t.name,
        t.email,
        t.role,
        t.phone,
        t.designation,
        (t.assignedSubjects || []).join('; '),
        t.submittedThisMonth || 0
      ]);
      exportToCsv(`Axis_Teachers_Report_${timestamp}`, [headers, ...rows]);
    } else if (reportType === 'finance' && data?.inv) {
      const headers = ['Invoice No', 'Student ID', 'Student Name', 'Month', 'Tuition Fee', 'Net Payable', 'Paid Amount', 'Due Amount', 'Status'];
      const rows = data.inv.map((i: any) => [
        i.invoiceNumber,
        i.studentId,
        i.studentName,
        i.month,
        i.tuitionFee,
        i.netPayable,
        i.paidAmount,
        i.dueAmount,
        i.status
      ]);
      exportToCsv(`Axis_Finance_Report_${timestamp}`, [headers, ...rows]);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Academic Reports & Excel Data Exports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            UTF-8 BOM encoded CSV exports ready for Microsoft Excel and offline regulatory reporting
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Current Report to CSV</span>
        </button>
      </div>

      {/* Segmented Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setReportType('attendance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              reportType === 'attendance' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance & Absentees
          </button>
          <button
            onClick={() => setReportType('students')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              reportType === 'students' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Enrollment Directory
          </button>
          <button
            onClick={() => setReportType('teachers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              reportType === 'teachers' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Teacher Monthly Completion
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setReportType('finance')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                reportType === 'finance' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fee Accounts & Dues
            </button>
          )}
        </div>

        {reportType === 'attendance' && (
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="">All Batches Combined</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Report Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Generating report table...</div>
        ) : !data ? (
          <div className="py-12 text-center text-xs text-slate-500">No report data generated.</div>
        ) : (
          <div className="overflow-x-auto">
            {reportType === 'attendance' && data.studentReport && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Student ID & Name</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4 text-center">Sessions</th>
                    <th className="py-3 px-4 text-center">Present</th>
                    <th className="py-3 px-4 text-center">Absent</th>
                    <th className="py-3 px-4 text-center">Late</th>
                    <th className="py-3 px-4 text-right">Attendance %</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.studentReport.map((s: any) => (
                    <tr key={s.studentId} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{s.studentName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{s.studentId}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{s.grade}</td>
                      <td className="py-2.5 px-4 text-center font-mono tabular-nums">{s.totalSessions}</td>
                      <td className="py-2.5 px-4 text-center font-mono tabular-nums text-emerald-700 font-bold">{s.present}</td>
                      <td className="py-2.5 px-4 text-center font-mono tabular-nums text-rose-700 font-bold">{s.absent}</td>
                      <td className="py-2.5 px-4 text-center font-mono tabular-nums text-amber-700">{s.late}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900">{s.attendancePercentage}%</td>
                      <td className="py-2.5 px-4 text-center">
                        {s.isRepeatedAbsentee ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            Repeated Absent
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Nominal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'students' && Array.isArray(data) && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Grade & Stream</th>
                    <th className="py-3 px-4">Guardian Contact</th>
                    <th className="py-3 px-4">Admission Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900 tabular-nums">{s.id}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{s.fullName}</td>
                      <td className="py-2.5 px-4 text-slate-700">{s.grade} ({s.stream})</td>
                      <td className="py-2.5 px-4 text-slate-600">{s.guardianName} · {s.guardianPhone}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{s.admissionDate}</td>
                      <td className="py-2.5 px-4 font-semibold text-emerald-800">{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'teachers' && Array.isArray(data) && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Teacher Name</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Assigned Subjects</th>
                    <th className="py-3 px-4 text-center">Sessions This Month</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{t.name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{t.designation}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{t.email}</td>
                      <td className="py-2.5 px-4 text-slate-700">{(t.assignedSubjects || []).join(', ')}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-indigo-950 tabular-nums">{t.submittedThisMonth || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'finance' && data.inv && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4 text-right">Invoiced (NPR)</th>
                    <th className="py-3 px-4 text-right">Paid (NPR)</th>
                    <th className="py-3 px-4 text-right">Due (NPR)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.inv.map((i: any) => (
                    <tr key={i.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{i.invoiceNumber}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{i.studentName}</td>
                      <td className="py-2.5 px-4 text-slate-700">{i.month}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">{i.netPayable.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">{i.paidAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-rose-700 font-bold">{i.dueAmount.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-[10px]">{i.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
