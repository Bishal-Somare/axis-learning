import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AuditLog, AttendanceCorrectionLog } from '../../types';
import { 
  ShieldAlert, Clock, User, Filter, 
  History, RefreshCw, AlertTriangle 
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [correctionLogs, setCorrectionLogs] = useState<AttendanceCorrectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'system' | 'attendance'>('system');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aList, cList] = await Promise.all([
        api.getAuditLogs(),
        api.getCorrectionLogs()
      ]);
      setAuditLogs(aList);
      setCorrectionLogs(cList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-slate-500">
        <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Restricted Audit Log</h2>
        <p className="text-xs text-slate-500 mt-1">
          Only Super Administrators can review system security and operational audit logs.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Security & Audit Activity Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable administrative log of all student registrations, batch shifts, and attendance corrections
          </p>
        </div>

        <button
          onClick={fetchData}
          title="Refresh logs"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Segmented Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('system')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'system' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          System Action Trail ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'attendance' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Attendance Corrections & Reasons ({correctionLogs.length})
        </button>
      </div>

      {/* TAB: SYSTEM AUDIT LOG */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Modifier User</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Timestamp (Asia/Butwal Shitalnagar)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-950 text-[11px]">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-800">{log.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.userRole}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                          {log.entityType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 max-w-md">
                        {log.details}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp ? log.timestamp.replace('T', ' ').substring(0, 19) : '–'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ATTENDANCE CORRECTIONS */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Session ID</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Status Change</th>
                  <th className="py-3 px-4">Mandatory Reason Given</th>
                  <th className="py-3 px-4">Modified By</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {correctionLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No attendance corrections on record.
                    </td>
                  </tr>
                ) : (
                  correctionLogs.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono text-slate-700">{c.sessionId}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{c.studentId}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <span className="line-through text-slate-400">{c.previousStatus}</span>
                          <span>→</span>
                          <span className="font-bold text-emerald-800">{c.newStatus}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 max-w-sm">
                        <span className="italic font-medium">"{c.reason}"</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{c.modifiedBy}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {c.timestamp ? c.timestamp.replace('T', ' ').substring(0, 19) : '–'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
