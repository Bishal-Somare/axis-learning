import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, UserCheck, Shield, ChevronDown, 
  LogOut, Globe, Sparkles, AlertCircle 
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  currentViewTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, currentViewTitle }) => {
  const { user, availableAccounts, switchAccount, isSuperAdmin, logout, publicViewMode, setPublicViewMode } = useAuth();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 md:px-6 py-3 bg-white border-b border-slate-200">
      {/* Zone 1: Wordmark & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 -ml-1 text-slate-600 rounded-md md:hidden hover:bg-slate-100"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <a 
          href="#portal" 
          onClick={(e) => { e.preventDefault(); setPublicViewMode(false); }}
          className="flex items-center gap-2 text-slate-900 group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            AL
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 leading-tight">
              Axis Learning
            </div>
            <div className="text-[11px] text-slate-500 font-medium leading-none">
              Management Portal · Butwal Shitalnagar
            </div>
          </div>
        </a>
      </div>

      {/* Zone 2: Navigation Breadcrumb / Context */}
      <div className="hidden lg:flex items-center gap-2 text-sm text-slate-600">
        <span className="text-slate-400">Portal</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800">{currentViewTitle}</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-500 font-mono">Asia/Butwal Shitalnagar (UTC+5:45)</span>
      </div>

      {/* Zone 3: Single Primary Action & Role Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setPublicViewMode(!publicViewMode)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          title="Switch between Public Website view and Portal"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{publicViewMode ? 'Return to Portal' : 'Public Website'}</span>
        </button>

        {/* User Account Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors text-left"
          >
            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white ${
              isSuperAdmin ? 'bg-indigo-700' : 'bg-emerald-600'
            }`}>
              {user?.name.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-xs leading-tight">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <span className="truncate max-w-[120px]">{user?.name}</span>
                {isSuperAdmin && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1 rounded">Admin</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 truncate max-w-[130px]">
                {user?.designation?.split('-')[0] || user?.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showAccountDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${isSuperAdmin ? 'bg-indigo-600' : 'bg-emerald-600'}`}></span>
                  <span className="font-medium text-slate-700">{user?.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Faculty Teacher'}</span>
                </div>
              </div>

              <div className="px-3 py-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Test Switch Role / Founding Teacher
                </p>
                <div className="mt-1 space-y-1">
                  {availableAccounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        switchAccount(acc.id);
                        setShowAccountDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors text-left ${
                        user?.id === acc.id 
                          ? 'bg-slate-100 font-semibold text-slate-900' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="truncate">
                        <div>{acc.name}</div>
                        <div className="text-[10px] text-slate-400">{acc.role === 'SUPER_ADMIN' ? 'Director (Admin)' : 'Teacher'}</div>
                      </div>
                      {user?.id === acc.id && (
                        <span className="text-[10px] text-emerald-600 font-bold">Active</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowAccountDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out to Public View</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
