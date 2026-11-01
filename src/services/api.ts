import { 
  User, Student, Batch, Subject, AttendanceSession, 
  AbsenceNotification, TeacherReminderLog, FeeInvoice, FeePayment, 
  ExpenseRecord, HomeworkAssignment, TestScore, Announcement, 
  AuditLog, PortalSettings, AttendanceCorrectionLog 
} from '../types';

let currentUserId = localStorage.getItem('axis_user_id') || 'USR-001';

export function setCurrentUserId(userId: string) {
  currentUserId = userId;
  localStorage.setItem('axis_user_id', userId);
}

export function getCurrentUserId() {
  return currentUserId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('x-user-id', currentUserId);

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const rawText = await response.text();

  if (!response.ok) {
    let errMsg = `Request failed: ${response.statusText} (${response.status})`;
    try {
      const errObj = JSON.parse(rawText);
      if (errObj && errObj.error) {
        errMsg = errObj.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  if (rawText.trim().startsWith('<!doctype') || rawText.trim().startsWith('<html') || rawText.trim().startsWith('<!DOCTYPE')) {
    throw new Error('Backend route returned an HTML document instead of API JSON. If running on Vercel, ensure the API Serverless function or Google Apps Script is configured.');
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (err: any) {
    throw new Error(`Failed to parse JSON response: ${err.message}`);
  }
}

export const api = {
  // Auth
  async getMe() {
    return request<{ user: User; availableAccounts: any[] }>('/api/auth/me');
  },
  async switchAccount(userId: string) {
    setCurrentUserId(userId);
    return request<{ success: boolean; user: User }>('/api/auth/switch', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  // Dashboard Stats
  async getDashboardStats() {
    return request<any>('/api/dashboard/stats');
  },

  // Students
  async getStudents(params?: { grade?: string; batchId?: string; status?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return request<Student[]>(`/api/students${query ? `?${query}` : ''}`);
  },
  async createStudent(data: Partial<Student>) {
    return request<Student>('/api/students', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async updateStudent(id: string, data: Partial<Student>) {
    return request<Student>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async checkDuplicate(data: { fullName: string; guardianPhone?: string; guardianEmail?: string; grade?: string }) {
    return request<{ isDuplicateLikely: boolean; matches: Student[] }>('/api/students/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async transferBatch(id: string, targetBatchId: string, reason: string) {
    return request<{ success: boolean; student: Student }>(`/api/students/${id}/transfer-batch`, {
      method: 'POST',
      body: JSON.stringify({ targetBatchId, reason })
    });
  },
  async bulkImportStudents(studentsList: any[]) {
    return request<{ success: boolean; importedCount: number }>('/api/students/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ studentsList })
    });
  },

  // Teachers
  async getTeachers() {
    return request<(User & { assignedBatches: any[]; submittedThisMonth: number })[]>('/api/teachers');
  },
  async createTeacher(data: any) {
    return request<User>('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async toggleTeacherStatus(id: string) {
    return request<User>(`/api/teachers/${id}/toggle-status`, {
      method: 'PATCH'
    });
  },
  async updateTeacherAssignments(id: string, assignedBatchIds: string[], assignedSubjects: string[]) {
    return request<User>(`/api/teachers/${id}/assignments`, {
      method: 'PUT',
      body: JSON.stringify({ assignedBatchIds, assignedSubjects })
    });
  },

  // Batches & Subjects
  async getBatches() {
    return request<Batch[]>('/api/batches');
  },
  async getSubjects() {
    return request<Subject[]>('/api/subjects');
  },
  async createBatch(data: Partial<Batch>) {
    return request<Batch>('/api/batches', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Attendance
  async getAttendanceSessions(params?: { batchId?: string; subjectId?: string; date?: string; teacherId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return request<AttendanceSession[]>(`/api/attendance/sessions${query ? `?${query}` : ''}`);
  },
  async submitAttendanceSession(data: {
    batchId: string;
    subjectId: string;
    date: string;
    startTime?: string;
    endTime?: string;
    records: { studentId: string; studentName: string; status: string; remarks?: string }[];
  }) {
    return request<{ session: AttendanceSession; queuedNotificationsCount: number }>('/api/attendance/sessions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async correctAttendanceSession(id: string, records: any[], reason: string) {
    return request<{ success: boolean; session: AttendanceSession }>(`/api/attendance/sessions/${id}/correct`, {
      method: 'PUT',
      body: JSON.stringify({ records, reason })
    });
  },
  async getCorrectionLogs() {
    return request<AttendanceCorrectionLog[]>('/api/attendance/correction-logs');
  },
  async getAttendanceReport(params?: { batchId?: string; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return request<{ totalSessionsCount: number; studentReport: any[] }>(`/api/attendance/report${query ? `?${query}` : ''}`);
  },

  // Notifications
  async getNotifications(params?: { status?: string; studentId?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return request<AbsenceNotification[]>(`/api/notifications${query ? `?${query}` : ''}`);
  },
  async retryNotification(id: string) {
    return request<{ success: boolean; notification: AbsenceNotification }>(`/api/notifications/${id}/retry`, {
      method: 'POST'
    });
  },
  async dispatchQueuedNotifications() {
    return request<{ success: boolean; processedCount: number }>('/api/notifications/dispatch-queued', {
      method: 'POST'
    });
  },

  // Reminders
  async getReminderLogs() {
    return request<TeacherReminderLog[]>('/api/reminders/logs');
  },
  async evaluateReminders(month?: string) {
    return request<{ success: boolean; month: string; results: any[] }>('/api/reminders/evaluate', {
      method: 'POST',
      body: JSON.stringify({ month })
    });
  },

  // Finance
  async getInvoices(params?: { studentId?: string; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return request<FeeInvoice[]>(`/api/finance/invoices${query ? `?${query}` : ''}`);
  },
  async getPayments() {
    return request<FeePayment[]>('/api/finance/payments');
  },
  async recordPayment(data: { invoiceId: string; amount: number; paymentMethod: string; referenceNumber?: string; notes?: string }) {
    return request<{ payment: FeePayment; invoice: FeeInvoice }>('/api/finance/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async getExpenses() {
    return request<ExpenseRecord[]>('/api/finance/expenses');
  },
  async recordExpense(data: Partial<ExpenseRecord>) {
    return request<ExpenseRecord>('/api/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // LMS
  async getAssignments(batchId?: string) {
    return request<HomeworkAssignment[]>(`/api/lms/assignments${batchId ? `?batchId=${batchId}` : ''}`);
  },
  async createAssignment(data: any) {
    return request<HomeworkAssignment>('/api/lms/assignments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async getTestScores() {
    return request<TestScore[]>('/api/lms/test-scores');
  },
  async recordTestScores(data: any) {
    return request<TestScore>('/api/lms/test-scores', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async getAnnouncements() {
    return request<Announcement[]>('/api/announcements');
  },
  async createAnnouncement(data: any) {
    return request<Announcement>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Audit Logs
  async getAuditLogs() {
    return request<AuditLog[]>('/api/audit-logs');
  },

  // Settings & Backups
  async getSettings() {
    return request<PortalSettings>('/api/settings');
  },
  async updateSettings(data: Partial<PortalSettings>) {
    return request<PortalSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  async restoreBackup(backupData: any) {
    return request<{ success: boolean; message: string }>('/api/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ backupData })
    });
  },

  // Google Sheets & Excel Live Database Integration
  async getSheetsLiveStatus() {
    try {
      return await request<{ connected: boolean; data?: any; error?: string; url?: string; excelDownloadUrl?: string }>('/api/sheets/live-status');
    } catch {
      const scriptUrl = (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL;
      if (!scriptUrl) return { connected: false, message: 'Google Apps Script URL not configured' };
      try {
        const res = await fetch(scriptUrl + '?action=ping');
        const data = await res.json();
        return {
          connected: true,
          data,
          url: scriptUrl,
          excelDownloadUrl: data.excelDownloadUrl || `${scriptUrl}?action=getExcelUrl`
        };
      } catch (err: any) {
        return { connected: false, error: err.message, url: scriptUrl };
      }
    }
  },

  async syncAllToSheets() {
    return request<{ success: boolean; result: any }>('/api/sheets/sync-all', {
      method: 'POST'
    });
  }
};

/**
 * Utility to download formatted CSV files with Excel-compatible UTF-8 BOM
 */
export function exportToCsv(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    let finalVal = '';
    for (let j = 0; j < row.length; j++) {
      let innerValue = row[j] === null || row[j] === undefined ? '' : row[j].toString();
      let result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) {
        result = '"' + result + '"';
      }
      if (j > 0) finalVal += ',';
      finalVal += result;
    }
    return finalVal + '\r\n';
  };

  let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel compatibility
  for (let i = 0; i < rows.length; i++) {
    csvContent += processRow(rows[i]);
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
