export type Role = 'SUPER_ADMIN' | 'TEACHER';

export type GradeLevel = 
  | 'Class 1' | 'Class 2' | 'Class 3' | 'Class 4' | 'Class 5'
  | 'Class 6' | 'Class 7' | 'Class 8' | 'Class 9' | 'Class 10'
  | '+2 Science' | '+2 Management';

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'WITHDRAWN';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  designation: string;
  assignedSubjects: string[];
  assignedBatchIds: string[];
  isActive: boolean;
  avatarUrl?: string;
}

export interface Student {
  id: string; // e.g. AX-2026-001
  fullName: string;
  grade: GradeLevel;
  stream?: 'Science' | 'Management' | 'General';
  batchIds: string[]; // Batches enrolled
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelation: string;
  address: string;
  admissionDate: string; // YYYY-MM-DD
  status: StudentStatus;
  notes?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  gradeLevels: GradeLevel[];
}

export interface Batch {
  id: string;
  name: string; // e.g. "Class 10 - Morning Alpha"
  grade: GradeLevel;
  stream?: string;
  academicYear: string; // e.g. "2081/2082 BS (2026)"
  primaryTeacherId: string;
  subjectIds: string[];
  scheduleDays: string[]; // ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]
  startTime: string; // "06:30"
  endTime: string;   // "08:00"
  room: string;
  maxCapacity: number;
}

export interface StudentAttendanceRecord {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceSession {
  id: string;
  batchId: string;
  batchName: string;
  subjectId: string;
  subjectName: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  teacherId: string;
  teacherName: string;
  submittedAt: string;
  records: StudentAttendanceRecord[];
  isEdited?: boolean;
  editReason?: string;
  editedBy?: string;
  editedAt?: string;
  status: 'DRAFT' | 'SUBMITTED';
}

export interface AttendanceCorrectionLog {
  id: string;
  sessionId: string;
  studentId: string;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason: string;
  modifiedBy: string;
  timestamp: string;
}

export type NotificationStatus = 'QUEUED' | 'SENT' | 'ATTEMPTED' | 'FAILED' | 'UNKNOWN';

export interface AbsenceNotification {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  batchName: string;
  subjectName: string;
  date: string;
  status: NotificationStatus;
  attempts: number;
  lastAttemptAt?: string;
  failureReason?: string;
  queuedAt: string;
  sentAt?: string;
  content: string;
}

export interface TeacherReminderLog {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  month: string; // "2026-10"
  reminderType: 'MID_MONTH' | 'MONTH_END_FINAL';
  status: 'QUEUED' | 'SENT' | 'SKIPPED_COMPLETE' | 'FAILED';
  incompleteSessionsCount: number;
  timestamp: string;
  details: string;
}

export interface FeeInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  grade: GradeLevel;
  batchName: string;
  month: string; // e.g., "October 2026"
  tuitionFee: number;
  discount: number;
  netPayable: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';
  createdAt: string;
}

export interface FeePayment {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'eSewa' | 'Khalti' | 'Bank Transfer' | 'Cheque';
  referenceNumber?: string;
  receivedBy: string;
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  category: 'Rent' | 'Electricity & Utilities' | 'Printing & Materials' | 'Teacher Honorarium' | 'Refreshment' | 'Maintenance' | 'Miscellaneous';
  amount: number;
  expenseDate: string;
  description: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'eSewa';
  enteredBy: string;
  receiptNumber?: string;
}

export interface HomeworkAssignment {
  id: string;
  batchId: string;
  batchName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  dueDate: string;
  assignedDate: string;
  totalSubmissions: number;
}

export interface TestScore {
  id: string;
  testName: string;
  batchId: string;
  subjectId: string;
  date: string;
  fullMarks: number;
  passMarks: number;
  studentScores: {
    studentId: string;
    studentName: string;
    marksObtained: number;
    gradeLetter: string;
    remarks?: string;
  }[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: Role;
  targetAudience: 'ALL' | 'STUDENTS' | 'TEACHERS' | 'GRADE';
  targetGrade?: GradeLevel;
  publishedAt: string;
  isImportant?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  entityType: 'STUDENT' | 'TEACHER' | 'ATTENDANCE' | 'BATCH' | 'FINANCE' | 'SETTING' | 'BACKUP';
  entityId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface PortalSettings {
  centreName: string;
  tagline: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  academicYear: string;
  timeZone: string; // "Asia/Butwal Shitalnagar"
  googleAppsScriptUrl: string;
  googleAppsScriptApiKey: string;
  enableGoogleSheetsSync: boolean;
  absenceEmailTemplate: string;
  teacherReminderTemplate: string;
  feeReceiptFooter: string;
}
