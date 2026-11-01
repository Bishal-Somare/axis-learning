import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { PortalSettings } from '../../types';
import { AXIS_APPS_SCRIPT_SOURCE } from '../../scripts/gasCodeString';
import { 
  Settings, FileSpreadsheet, Download, Upload, 
  CheckCircle2, AlertTriangle, Copy, Shield, 
  ExternalLink, RefreshCw, Save, Check, Globe, 
  Database, ArrowRight 
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [settings, setSettings] = useState<PortalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Apps Script code copy state
  const [copiedCode, setCopiedCode] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testingPing, setTestingPing] = useState(false);
  const [syncingToSheets, setSyncingToSheets] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [excelUrl, setExcelUrl] = useState<string | null>(null);

  // Backup restore state
  const [restoreFileJson, setRestoreFileJson] = useState<string>('');
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      setSettings(res);

      if (res.googleAppsScriptUrl) {
        setExcelUrl(res.googleAppsScriptUrl + '?action=getExcelUrl');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setSaveSuccess(false);
      await api.updateSettings(settings);
      setSaveSuccess(true);
      if (settings.googleAppsScriptUrl) {
        setExcelUrl(settings.googleAppsScriptUrl + '?action=getExcelUrl');
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingPing(true);
    setTestStatus(null);
    try {
      const res = await api.getSheetsLiveStatus();
      if (res.connected) {
        setTestStatus(`SUCCESS: Connected to Google Sheets & Excel Database! Spreadsheet ID: ${res.data?.spreadsheetId || 'Connected'}`);
        if (res.excelDownloadUrl) {
          setExcelUrl(res.excelDownloadUrl);
        }
      } else {
        setTestStatus(`Notice: Endpoint ping response: ${(res as any).error || (res as any).message || 'Offline'}. Check your Apps Script deployment.`);
      }
    } catch (err: any) {
      setTestStatus(`Connection check error: ${err.message}`);
    } finally {
      setTestingPing(false);
    }
  };

  const handleSyncToSheets = async () => {
    try {
      setSyncingToSheets(true);
      setSyncResult(null);
      const res = await api.syncAllToSheets();
      setSyncResult('Successfully synchronized students and batches to your Google Sheets / Excel database!');
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err.message}`);
    } finally {
      setSyncingToSheets(false);
    }
  };

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(AXIS_APPS_SCRIPT_SOURCE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFileJson.trim()) return;

    try {
      setRestoring(true);
      setRestoreMessage(null);
      const parsed = JSON.parse(restoreFileJson);
      const res = await api.restoreBackup(parsed);
      setRestoreMessage(res.message);
      fetchSettings();
    } catch (err: any) {
      setRestoreMessage(`Restore failed: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRestoreFileJson(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Shield className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Restricted Administration</h2>
        <p className="text-xs text-slate-500 mt-1">
          Only Super Administrators can configure integration settings, Google Sheets synchronization, and system recovery backups.
        </p>
      </div>
    );
  }

  if (loading || !settings) {
    return <div className="p-6 text-xs text-slate-500">Loading portal configuration...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Portal Configuration & Deployment Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vercel deployment setup, Google Sheets & Excel cloud database, and system backups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/backup/export"
            download
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Full JSON Backup</span>
          </a>
        </div>
      </div>

      {/* Section 0: VERCEL & EXCEL DATABASE DEPLOYMENT GUIDE */}
      <div className="p-5 rounded-xl bg-slate-900 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-bold text-sm text-white">Deploy Frontend to Vercel with Excel as Database</h2>
              <p className="text-[11px] text-slate-400">Zero-cost production deployment for Axis Learning</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded self-start sm:self-auto">
            vercel.json ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-800/90 border border-slate-700 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>1. Push to GitHub</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Your codebase is already configured with <code>vercel.json</code> in the root directory. Push your project repository to GitHub or GitLab.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-800/90 border border-slate-700 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>2. Import to Vercel</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              In your Vercel Dashboard, click <strong>"Add New Project"</strong>, select your repository. Framework preset automatically detects <strong>Vite</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-800/90 border border-slate-700 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>3. Add Environment Variable</span>
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed">
              Under <strong>Environment Variables</strong> on Vercel, add:
              <div className="mt-1 font-mono text-[10px] bg-slate-950 p-1.5 rounded text-indigo-300 break-all select-all">
                VITE_GOOGLE_APPS_SCRIPT_URL = {settings.googleAppsScriptUrl || 'your_script_url'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Excel Database Connected:</strong> Any data written to your Google Sheet can be opened, analyzed, or edited directly in Microsoft Excel (.xlsx)!
            </span>
          </div>

          {excelUrl && (
            <a
              href={excelUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel (.xlsx)</span>
            </a>
          )}
        </div>
      </div>

      {/* Section 1: Google Sheets & Excel Database Connection Hub */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-900" />
            <h2 className="text-sm font-bold text-slate-900">Google Sheets & Excel Cloud Database Hub</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncToSheets}
              disabled={syncingToSheets || !settings.googleAppsScriptUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingToSheets ? 'animate-spin' : ''}`} />
              <span>{syncingToSheets ? 'Pushing Data...' : 'Push All Data to Excel'}</span>
            </button>
            <button
              onClick={handleCopyAppsScript}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Script Copied!' : 'Copy Script Code'}</span>
            </button>
          </div>
        </div>

        {syncResult && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between font-medium">
            <span>{syncResult}</span>
            <button onClick={() => setSyncResult(null)} className="text-emerald-700">✕</button>
          </div>
        )}

        <p className="text-xs text-slate-600 leading-relaxed">
          The portal uses your deployed Google Sheet & Apps Script endpoint as the authoritative live cloud database with table locking and automatic email triggers.
        </p>

        {/* Web App URL Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Google Apps Script Web App URL *</label>
            <input
              type="url"
              value={settings.googleAppsScriptUrl}
              onChange={(e) => setSettings({ ...settings, googleAppsScriptUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-[11px] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Apps Script API Secret Key</label>
            <input
              type="text"
              value={settings.googleAppsScriptApiKey}
              onChange={(e) => setSettings({ ...settings, googleAppsScriptApiKey: e.target.value })}
              placeholder="AXIS_KTM_SECURE_KEY_2026"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-[11px] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={settings.enableGoogleSheetsSync}
              onChange={(e) => setSettings({ ...settings, enableGoogleSheetsSync: e.target.checked })}
              className="rounded"
            />
            <span>Enable real-time mirrored write to Google Sheets on attendance submission</span>
          </label>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingPing || !settings.googleAppsScriptUrl}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {testingPing ? 'Testing...' : 'Test Cloud Connection'}
          </button>
        </div>

        {testStatus && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono leading-relaxed">
            {testStatus}
          </div>
        )}
      </div>

      {/* Section 2: General Centre Profile & Notification Templates */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Centre Profile & Email Notification Templates</h2>
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Settings Saved Successfully!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Centre Name</label>
            <input
              type="text"
              value={settings.centreName}
              onChange={(e) => setSettings({ ...settings, centreName: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Academic Year</label>
            <input
              type="text"
              value={settings.academicYear}
              onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Kathmandu Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
            <input
              type="text"
              value={settings.contactPhone}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Timezone</label>
            <input
              type="text"
              disabled
              value={settings.timeZone}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">
            Absence Email Notification Template (To Guardians)
          </label>
          <div className="text-[11px] text-slate-400 mb-1">
            Placeholders: <code>{'{{guardianName}}'}</code>, <code>{'{{studentName}}'}</code>, <code>{'{{grade}}'}</code>, <code>{'{{subjectName}}'}</code>, <code>{'{{batchName}}'}</code>, <code>{'{{date}}'}</code>
          </div>
          <textarea
            rows={5}
            value={settings.absenceEmailTemplate}
            onChange={(e) => setSettings({ ...settings, absenceEmailTemplate: e.target.value })}
            className="w-full p-3 rounded-lg border border-slate-200 font-mono text-[11px] leading-relaxed focus:outline-hidden"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>

      {/* Section 3: Database Restore from Backup */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-indigo-900" />
          <h2 className="text-sm font-bold text-slate-900">Database Recovery & Restore</h2>
        </div>

        <p className="text-slate-600">
          Restore the entire portal database (students, teachers, batches, sessions, financial ledgers, audit logs) from a previously exported JSON backup file.
        </p>

        <form onSubmit={handleRestoreBackup} className="space-y-3">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Select Backup File (.json)</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Or Paste Backup JSON Payload</label>
            <textarea
              rows={4}
              value={restoreFileJson}
              onChange={(e) => setRestoreFileJson(e.target.value)}
              placeholder='{"version": "1.0.0", "data": { ... }}'
              className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] focus:outline-hidden"
            />
          </div>

          {restoreMessage && (
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium">
              {restoreMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={restoring || !restoreFileJson.trim()}
            className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold shadow-xs disabled:opacity-50"
          >
            {restoring ? 'Restoring Database...' : 'Restore Database from JSON'}
          </button>
        </form>
      </div>
    </div>
  );
};
