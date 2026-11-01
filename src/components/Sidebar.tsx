import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, ClipboardCheck, Users, GraduationCap, 
  BookOpen, Calendar, Bell, Clock, CreditCard, 
  FileText, ShieldAlert, Settings, FileSpreadsheet,
  X
} from 'lucide-react';

export type NavItemKey = 
  | 'dashboard' 
  | 'attendance' 
  | 'students' 
  | 'batches' 
  | 'teachers' 
  | 'notifications' 
  | 'reminders' 
  | 'finance' 
  | 'lms' 
  | 'reports' 
  | 'audit' 
  | 'settings';

interface SidebarProps {
  currentView: NavItemKey;
  onSelectView: (view: NavItemKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile
}) => {
  const { isSuperAdmin, user } = useAuth();

  const primaryItems = [
    { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'attendance' as NavItemKey, label: 'Record Attendance', icon: ClipboardCheck },
    { key: 'students' as NavItemKey, label: 'Students Directory', icon: GraduationCap },
    { key: 'batches' as NavItemKey, label: 'Batches & Timetable', icon: Calendar },
    { key: 'teachers' as NavItemKey, label: 'Teachers & Assignments', icon: Users },
  ];

  const communicationItems = [
    { key: 'notifications' as NavItemKey, label: 'Absence Email Queue', icon: Bell },
    { key: 'reminders' as NavItemKey, label: 'Month-End Reminders', icon: Clock },
    { key: 'lms' as NavItemKey, label: 'Homework & Marks', icon: BookOpen },
    { key: 'reports' as NavItemKey, label: 'Reports & CSV Export', icon: FileSpreadsheet },
  ];

  const adminOnlyItems = [
    { key: 'finance' as NavItemKey, label: 'Fees & Accounts', icon: CreditCard },
    { key: 'audit' as NavItemKey, label: 'Audit & Correction Logs', icon: ShieldAlert },
    { key: 'settings' as NavItemKey, label: 'Sheets & Settings', icon: Settings },
  ];

  const renderNavButton = (item: { key: NavItemKey; label: string; icon: any }, isAdminOnly = false) => {
    const Icon = item.icon;
    const isActive = currentView === item.key;

    return (
      <button
        key={item.key}
        onClick={() => {
          onSelectView(item.key);
          onCloseMobile();
        }}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
          isActive
            ? 'bg-indigo-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-200' : 'text-slate-500'}`} />
          <span className="truncate">{item.label}</span>
        </div>
        {isAdminOnly && !isActive && (
          <span className="text-[10px] text-slate-400 font-semibold px-1 rounded bg-slate-100">Admin</span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 md:top-[57px] left-0 z-50 md:z-20 h-full md:h-[calc(100vh-57px)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 md:hidden">
          <div className="font-bold text-slate-900 text-sm">Navigation Menu</div>
          <button 
            onClick={onCloseMobile}
            className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-3 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Core Academic
            </div>
            <nav className="space-y-1">
              {primaryItems.map(item => renderNavButton(item))}
            </nav>
          </div>

          <div>
            <div className="px-3 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Communication & Records
            </div>
            <nav className="space-y-1">
              {communicationItems.map(item => renderNavButton(item))}
            </nav>
          </div>

          <div>
            <div className="px-3 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Administration</span>
              {!isSuperAdmin && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded font-normal">Restricted</span>
              )}
            </div>
            <nav className="space-y-1">
              {adminOnlyItems.map(item => {
                if (!isSuperAdmin) {
                  return (
                    <div
                      key={item.key}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-slate-400 bg-slate-50 cursor-not-allowed opacity-60"
                      title="Restricted to Super Admin role"
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 text-slate-400" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px]">Locked</span>
                    </div>
                  );
                }
                return renderNavButton(item, true);
              })}
            </nav>
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="px-2 py-1.5 rounded-md bg-white border border-slate-200 text-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-[11px] font-semibold text-slate-700">Academic Year</span>
              <span className="font-mono text-[11px] font-bold text-indigo-900">2081/82 BS</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Centre Code</span>
              <span className="font-mono text-[11px]">AXIS-KTM-01</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
