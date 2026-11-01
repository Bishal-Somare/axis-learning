import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { TeacherReminderLog } from '../../types';
import { 
  Clock, CheckCircle, AlertTriangle, Play, 
  RefreshCw, Info, Calendar, ShieldCheck, Mail 
} from 'lucide-react';

export const RemindersView: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState<TeacherReminderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState(false);
  const [lastRunResults, setLastRunResults] = useState<any[] | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getReminderLogs();
      setLogs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRunEvaluation = async () => {
    try {
      setRunningJob(true);
      const currentMonth = new Date().toISOString().substring(0, 7);
      const res = await api.evaluateReminders(currentMonth);
      setLastRunResults(res.results);
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to execute reminders job');
    } finally {
      setRunningJob(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Month-End Teacher Attendance Reminders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Targeted automation for Asia/Butwal Shitalnagar (UTC+5:45) · Dispatched only to faculty with pending sessions
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunEvaluation}
              disabled={runningJob}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{runningJob ? 'Evaluating...' : 'Evaluate & Run Reminders Now'}</span>
            </button>

            <button
              onClick={fetchLogs}
              title="Refresh log"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Timezone and Idempotency Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Clock className="w-4 h-4 text-indigo-900" />
            <span>Timezone & Schedule Cadence</span>
          </div>
          <div className="text-slate-600 space-y-1 text-[11px] leading-relaxed">
            <div><strong>Configured Timezone:</strong> Asia/Butwal Shitalnagar (Nepal Standard Time, UTC+5:45)</div>
            <div><strong>Mid-Month Run:</strong> 25th of every month at 17:00 NST</div>
            <div><strong>Final Month-End Run:</strong> Final day (28th/30th/31st) at 18:00 NST</div>
            <div><strong>Audit Guarantee:</strong> Complete records are marked <code>SKIPPED_COMPLETE</code> to avoid bothering faculty who have finished all submissions.</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-indigo-900" />
            <span>Idempotency Protection</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Repeated execution or retrying the scheduled trigger is safe. The system generates unique idempotent tracking keys (<code>REM-YYYYMM-TeacherID</code>), preventing teachers from receiving annoying duplicate emails for the same month.
          </p>
        </div>
      </div>

      {/* Last Run Summary (if recently executed) */}
      {lastRunResults && (
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-2 text-xs">
          <div className="font-bold text-indigo-950 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-900" />
            <span>Latest Job Evaluation Results</span>
          </div>
          <div className="space-y-1 text-[11px]">
            {lastRunResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-indigo-900 bg-white p-2 rounded border border-indigo-100">
                <span className="font-semibold">{r.teacherName}</span>
                <span className="font-mono text-[10px] bg-indigo-50 px-2 py-0.5 rounded">{r.status}</span>
                <span className="text-slate-600">{r.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminder Execution Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 text-xs font-semibold text-slate-900">
          Historical Reminder Execution Audit Log
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Faculty Teacher</th>
                <th className="py-3 px-4">Academic Month</th>
                <th className="py-3 px-4">Trigger Cadence</th>
                <th className="py-3 px-4">Incomplete Sessions</th>
                <th className="py-3 px-4">Job Outcome</th>
                <th className="py-3 px-4">Timestamp (Asia/Butwal Shitalnagar)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No reminder logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.teacherName}</div>
                      <div className="font-mono text-[11px] text-slate-400">{log.teacherEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {log.month}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {log.reminderType === 'MID_MONTH' ? 'Mid-Month (25th)' : 'Month-End Closure'}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-800">
                      {log.incompleteSessionsCount} missing
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'SENT' 
                          ? 'bg-amber-50 text-amber-800'
                          : log.status === 'SKIPPED_COMPLETE'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}>
                        {log.status === 'SKIPPED_COMPLETE' ? 'Skipped (100% Complete)' : log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {log.timestamp ? log.timestamp.replace('T', ' ').substring(0, 19) : '–'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
