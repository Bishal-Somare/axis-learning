import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar, NavItemKey } from './components/Sidebar';
import { PublicWebsiteView } from './components/views/PublicWebsiteView';
import { DashboardView } from './components/views/DashboardView';
import { StudentsView } from './components/views/StudentsView';
import { TeachersView } from './components/views/TeachersView';
import { ClassesBatchesView } from './components/views/ClassesBatchesView';
import { AttendanceView } from './components/views/AttendanceView';
import { NotificationsView } from './components/views/NotificationsView';
import { RemindersView } from './components/views/RemindersView';
import { FinanceView } from './components/views/FinanceView';
import { LmsView } from './components/views/LmsView';
import { ReportsView } from './components/views/ReportsView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SettingsView } from './components/views/SettingsView';

function PortalLayout() {
  const { publicViewMode } = useAuth();
  const [currentView, setCurrentView] = useState<NavItemKey>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If in public website mode, render the public landing site
  if (publicViewMode) {
    return <PublicWebsiteView />;
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Operations Dashboard';
      case 'attendance': return 'Session Attendance';
      case 'students': return 'Students Directory';
      case 'batches': return 'Batches & Timetable';
      case 'teachers': return 'Faculty Teachers';
      case 'notifications': return 'Absence Notifications';
      case 'reminders': return 'Month-End Reminders';
      case 'finance': return 'Fees & Finance';
      case 'lms': return 'Homework & Marks';
      case 'reports': return 'Reports & CSV Export';
      case 'audit': return 'Audit & Security Logs';
      case 'settings': return 'Sheets & Settings';
      default: return 'Portal';
    }
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={(view) => setCurrentView(view)} />;
      case 'attendance':
        return <AttendanceView />;
      case 'students':
        return <StudentsView />;
      case 'batches':
        return <ClassesBatchesView />;
      case 'teachers':
        return <TeachersView />;
      case 'notifications':
        return <NotificationsView />;
      case 'reminders':
        return <RemindersView />;
      case 'finance':
        return <FinanceView />;
      case 'lms':
        return <LmsView />;
      case 'reports':
        return <ReportsView />;
      case 'audit':
        return <AuditLogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={(view) => setCurrentView(view)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Header
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        currentViewTitle={getViewTitle()}
      />

      <div className="flex-1 flex">
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-x-hidden min-w-0">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PortalLayout />
    </AuthProvider>
  );
}
