import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { NavItemKey } from '../Sidebar';
import { 
  Users, GraduationCap, Calendar, BookOpen, 
  CheckCircle2, XCircle, Clock, AlertTriangle, 
  ArrowRight, PlusCircle, ClipboardCheck, DollarSign,
  TrendingUp, RefreshCw, Bell
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: NavItemKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardStats();
      setStats(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-200 rounded-xl"></div>
          <div className="h-24 bg-slate-200 rounded-xl"></div>
          <div className="h-24 bg-slate-200 rounded-xl"></div>
          <div className="h-24 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{error || 'Unable to fetch dashboard statistics.'}</span>
          </div>
          <button 
            onClick={fetchStats}
            className="px-3 py-1 bg-white border border-rose-300 rounded font-semibold text-rose-700 hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { counts, todayAttendance, missingSessions, finance, recentAnnouncements } = stats;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Academic Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Signed in as <span className="font-semibold text-slate-700">{user?.name}</span> ({user?.designation})
            <span className="mx-1.5">·</span>
            <span className="font-mono text-slate-600">Session 2081/82 BS</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('attendance')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Record Attendance</span>
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => onNavigate('students')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-slate-500" />
              <span>Register Student</span>
            </button>
          )}
          <button
            onClick={fetchStats}
            title="Refresh statistics"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI 4-Column Strip (Tabular Figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Distinct Active Students</span>
            <GraduationCap className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {counts.distinctActiveStudents}
            </span>
            <span className="text-[11px] text-slate-400">enrolled</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Across Classes 1–10 & +2
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Founding Faculty</span>
            <Users className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {counts.activeTeachers}
            </span>
            <span className="text-[11px] text-slate-400">teachers</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            5 Core subject heads active
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Batches</span>
            <Calendar className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {counts.totalBatches}
            </span>
            <span className="text-[11px] text-slate-400">shifts</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Morning (6:15) & Evening
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Today's Sessions Recorded</span>
            <ClipboardCheck className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {counts.todaySessionsRecorded}
            </span>
            <span className="text-[11px] text-slate-400">submitted</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {counts.missingSessionsCount > 0 ? (
              <span className="text-amber-700 font-semibold">{counts.missingSessionsCount} session(s) pending today</span>
            ) : (
              <span className="text-emerald-700 font-medium">All scheduled sessions completed</span>
            )}
          </div>
        </div>
      </div>

      {/* Today's Attendance Snapshot Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Today's Attendance Status Breakdown</h2>
            <p className="text-[11px] text-slate-500">Real-time roll counts recorded across submitted batches for today</p>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs text-indigo-900 font-semibold hover:underline flex items-center gap-1"
          >
            <span>View detailed roll</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              P
            </div>
            <div>
              <div className="text-[11px] text-emerald-800 font-medium">Present</div>
              <div className="text-xl font-bold text-emerald-950 font-mono tabular-nums">{todayAttendance.present}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              A
            </div>
            <div>
              <div className="text-[11px] text-rose-800 font-medium">Absent</div>
              <div className="text-xl font-bold text-rose-950 font-mono tabular-nums">{todayAttendance.absent}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              L
            </div>
            <div>
              <div className="text-[11px] text-amber-800 font-medium">Late Arrival</div>
              <div className="text-xl font-bold text-amber-950 font-mono tabular-nums">{todayAttendance.late}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-sky-50/70 border border-sky-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              Lv
            </div>
            <div>
              <div className="text-[11px] text-sky-800 font-medium">Approved Leave</div>
              <div className="text-xl font-bold text-sky-950 font-mono tabular-nums">{todayAttendance.leave}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Missing Attendance Sessions & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Missing / Pending Sessions Today */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Pending Attendance Submissions</span>
                {missingSessions.length > 0 && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    {missingSessions.length} Unrecorded
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500">Batches scheduled for today with no recorded session</p>
            </div>
          </div>

          {missingSessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">All Scheduled Sessions Recorded!</p>
              <p className="text-slate-400 mt-0.5">Every batch timetable for today has its attendance submitted.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {missingSessions.map((ms: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">{ms.batchName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{ms.grade}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-600">{ms.time}</span>
                      <span>·</span>
                      <span>Teacher: {ms.teacherName}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('attendance')}
                    className="px-2.5 py-1 text-[11px] font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors whitespace-nowrap"
                  >
                    Record Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-900" />
                <span>Notice Board</span>
              </h2>
              <button
                onClick={() => onNavigate('lms')}
                className="text-xs text-indigo-900 font-semibold hover:underline"
              >
                All Notices
              </button>
            </div>

            <div className="space-y-3">
              {recentAnnouncements.map((ann: any) => (
                <div 
                  key={ann.id} 
                  className={`p-3 rounded-lg border text-xs ${
                    ann.isImportant ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-900">{ann.title}</div>
                    {ann.isImportant && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1 rounded shrink-0">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-2 text-[11px] leading-relaxed">
                    {ann.content}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    By {ann.authorName} · {ann.publishedAt.split('T')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Super Admin Financial Snapshot (Only visible to Super Admin) */}
      {isSuperAdmin && finance && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-900" />
                <span>Financial Overview (Owner / Super Admin)</span>
              </h2>
              <p className="text-[11px] text-slate-500">Summary of fees invoiced, collections, and center operational expenses</p>
            </div>
            <button
              onClick={() => onNavigate('finance')}
              className="text-xs font-semibold text-indigo-900 hover:underline flex items-center gap-1"
            >
              <span>Detailed Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px]">Total Fees Invoiced</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                NPR {finance.totalInvoiced.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-100">
              <div className="text-emerald-800 text-[11px]">Total Fee Collected</div>
              <div className="text-lg font-bold text-emerald-950 font-mono tabular-nums mt-1">
                NPR {finance.totalCollected.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-100">
              <div className="text-rose-800 text-[11px]">Outstanding Dues</div>
              <div className="text-lg font-bold text-rose-950 font-mono tabular-nums mt-1">
                NPR {finance.totalOutstanding.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[11px]">Center Expenses</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                NPR {finance.totalExpenses.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
