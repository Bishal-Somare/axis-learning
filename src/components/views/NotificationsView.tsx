import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AbsenceNotification, NotificationStatus } from '../../types';
import { 
  Bell, Mail, RefreshCw, Send, CheckCircle2, 
  XCircle, Clock, AlertTriangle, Eye, ShieldCheck, 
  Info 
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [notifications, setNotifications] = useState<AbsenceNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<AbsenceNotification | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const list = await api.getNotifications({ status: selectedStatus || undefined });
      setNotifications(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedStatus]);

  const handleRetry = async (id: string) => {
    try {
      setRetryingId(id);
      await api.retryNotification(id);
      fetchNotifications();
    } catch (err: any) {
      alert(err.message || 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  const handleDispatchQueued = async () => {
    try {
      setDispatching(true);
      const res = await api.dispatchQueuedNotifications();
      alert(`Processed ${res.processedCount} queued absence notice(s).`);
      fetchNotifications();
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    } finally {
      setDispatching(false);
    }
  };

  const queuedCount = notifications.filter(n => n.status === 'QUEUED').length;
  const sentCount = notifications.filter(n => n.status === 'SENT').length;
  const failedCount = notifications.filter(n => n.status === 'FAILED').length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Absence Email Notification Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated guardian alerts triggered upon unexcused session absences · Honest delivery status verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          {queuedCount > 0 && (
            <button
              onClick={handleDispatchQueued}
              disabled={dispatching}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{dispatching ? 'Dispatching...' : `Dispatch ${queuedCount} Queued Emails`}</span>
            </button>
          )}

          <button
            onClick={fetchNotifications}
            title="Refresh Notification Queue"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Honest Status and Quota Explanatory Notice */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-900 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900">Email Delivery Transparency & Free-Tier Quotas:</span>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            In accordance with educational communication ethics, messages are reported as <strong>SENT</strong> only when accepted by the upstream mail transport (Gmail API or Google Apps Script <code>MailApp.sendEmail</code>). If a guardian's email address is missing or invalid, the message remains safely recorded as <strong>FAILED</strong> with the exact reason so staff can telephone the guardian directly. Free consumer Google accounts have an email quota of 100 recipients/day (1,500/day on Google Workspace).
          </p>
        </div>
      </div>

      {/* 3-Column Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Sent Successfully</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {sentCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dispatched to guardian inbox</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Queued in Outbox</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {queuedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pending provider dispatch</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Failed / Needs Attention</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {failedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Invalid format or address missing</div>
        </div>
      </div>

      {/* Notification Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-800">
            Delivery Log History
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2 py-1 text-xs rounded border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="QUEUED">Queued</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Student & Class</th>
                <th className="py-3 px-4">Subject & Date</th>
                <th className="py-3 px-4">Recipient Guardian</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Queued Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No absence notifications found in queue.
                  </td>
                </tr>
              ) : (
                notifications.map((notif) => {
                  let statusBadge = 'bg-slate-100 text-slate-700';
                  if (notif.status === 'SENT') statusBadge = 'bg-emerald-50 text-emerald-800 font-bold';
                  if (notif.status === 'QUEUED') statusBadge = 'bg-amber-50 text-amber-800 font-bold';
                  if (notif.status === 'FAILED') statusBadge = 'bg-rose-50 text-rose-800 font-bold';

                  return (
                    <tr key={notif.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{notif.studentName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{notif.studentId} · {notif.batchName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{notif.subjectName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{notif.date}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{notif.guardianName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{notif.guardianEmail || 'Missing email'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${statusBadge}`}>
                            {notif.status}
                          </span>
                          {notif.failureReason && (
                            <div className="text-[10px] text-rose-600 mt-0.5 truncate max-w-[150px]" title={notif.failureReason}>
                              {notif.failureReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {notif.queuedAt ? notif.queuedAt.split('T')[0] : '–'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedNotif(notif)}
                            title="Preview Email Content"
                            className="p-1 text-slate-500 hover:text-indigo-900 hover:bg-slate-100 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(notif.status === 'FAILED' || notif.status === 'QUEUED') && (
                            <button
                              onClick={() => handleRetry(notif.id)}
                              disabled={retryingId === notif.id}
                              className="px-2 py-1 text-[11px] font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded disabled:opacity-50"
                            >
                              {retryingId === notif.id ? 'Retrying...' : 'Dispatch'}
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

      {/* Modal: Preview Email Content */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-900" />
                <h2 className="text-sm font-bold text-slate-900">Absence Notification Message</h2>
              </div>
              <button 
                onClick={() => setSelectedNotif(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <div><span className="font-semibold text-slate-700">To:</span> {selectedNotif.guardianName} ({selectedNotif.guardianEmail})</div>
                <div><span className="font-semibold text-slate-700">Student:</span> {selectedNotif.studentName} ({selectedNotif.studentId})</div>
                <div><span className="font-semibold text-slate-700">Session:</span> {selectedNotif.subjectName} · {selectedNotif.date}</div>
                <div><span className="font-semibold text-slate-700">Delivery Status:</span> {selectedNotif.status} (Attempts: {selectedNotif.attempts})</div>
              </div>

              <div className="border rounded-lg p-3.5 bg-white font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedNotif.content}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
