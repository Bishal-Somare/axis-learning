import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  User, Student, Batch, Subject, AttendanceSession, 
  AbsenceNotification, TeacherReminderLog, FeeInvoice, FeePayment, 
  ExpenseRecord, HomeworkAssignment, TestScore, Announcement, 
  AuditLog, PortalSettings, AttendanceCorrectionLog 
} from './src/types/index.ts';

interface PortalDatabase {
  users: User[];
  batches: Batch[];
  subjects: Subject[];
  students: Student[];
  sessions: AttendanceSession[];
  correctionLogs: AttendanceCorrectionLog[];
  notifications: AbsenceNotification[];
  reminders: TeacherReminderLog[];
  invoices: FeeInvoice[];
  payments: FeePayment[];
  expenses: ExpenseRecord[];
  assignments: HomeworkAssignment[];
  testScores: TestScore[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  settings: PortalSettings;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data Directory and DB persistence file (/tmp for Vercel serverless environment)
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'portal-db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Data for Axis Learning (5 Founding Teachers in Nepal)
const initialSeedData = {
  users: [
    {
      id: 'USR-001',
      name: 'Ramesh Adhikari',
      email: 'ramesh.adhikari@axislearning.edu.np',
      role: 'SUPER_ADMIN',
      phone: '+977-9841234567',
      designation: 'Founding Director & Head of Mathematics',
      assignedSubjects: ['Compulsory Mathematics', 'Optional Mathematics', 'Business Math'],
      assignedBatchIds: ['BATCH-C10-MORN', 'BATCH-P2SCI-MORN'],
      isActive: true,
      avatarUrl: ''
    },
    {
      id: 'USR-002',
      name: 'Sunita Sharma',
      email: 'sunita.sharma@axislearning.edu.np',
      role: 'TEACHER',
      phone: '+977-9851098765',
      designation: 'Founding Faculty - Chemistry & Science',
      assignedSubjects: ['Science', 'Chemistry (+2)'],
      assignedBatchIds: ['BATCH-C10-MORN', 'BATCH-C9-EVE', 'BATCH-P2SCI-MORN'],
      isActive: true,
      avatarUrl: ''
    },
    {
      id: 'USR-003',
      name: 'Pradeep Thapa',
      email: 'pradeep.thapa@axislearning.edu.np',
      role: 'TEACHER',
      phone: '+977-9812345678',
      designation: 'Founding Faculty - Physics & Computer Science',
      assignedSubjects: ['Physics (+2)', 'Computer Science'],
      assignedBatchIds: ['BATCH-P2SCI-MORN', 'BATCH-C10-MORN'],
      isActive: true,
      avatarUrl: ''
    },
    {
      id: 'USR-004',
      name: 'Gita Pokhrel',
      email: 'gita.pokhrel@axislearning.edu.np',
      role: 'TEACHER',
      phone: '+977-9860112233',
      designation: 'Founding Faculty - English & Social Studies',
      assignedSubjects: ['Compulsory English', 'Social Studies'],
      assignedBatchIds: ['BATCH-C10-MORN', 'BATCH-C9-EVE', 'BATCH-P2MGT-MORN'],
      isActive: true,
      avatarUrl: ''
    },
    {
      id: 'USR-005',
      name: 'Bikash Shrestha',
      email: 'bikash.shrestha@axislearning.edu.np',
      role: 'TEACHER',
      phone: '+977-9801998877',
      designation: 'Founding Faculty - Accountancy & Economics',
      assignedSubjects: ['Principles of Accounting', 'Economics'],
      assignedBatchIds: ['BATCH-P2MGT-MORN'],
      isActive: true,
      avatarUrl: ''
    }
  ],

  batches: [
    {
      id: 'BATCH-C10-MORN',
      name: 'SEE Target 2081/82 (Class 10) - Morning Alpha',
      grade: 'Class 10',
      stream: 'General',
      academicYear: '2081/2082 BS (2026)',
      primaryTeacherId: 'USR-001',
      subjectIds: ['SUB-C10-MATH', 'SUB-C10-OPT-MATH', 'SUB-C10-SCI', 'SUB-C10-ENG'],
      scheduleDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '06:30',
      endTime: '08:30',
      room: 'Room 101 (Main Hall)',
      maxCapacity: 35
    },
    {
      id: 'BATCH-C9-EVE',
      name: 'Class 9 Foundation - Evening Beta',
      grade: 'Class 9',
      stream: 'General',
      academicYear: '2081/2082 BS (2026)',
      primaryTeacherId: 'USR-002',
      subjectIds: ['SUB-C9-MATH', 'SUB-C9-SCI', 'SUB-C9-ENG'],
      scheduleDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '16:30',
      endTime: '18:00',
      room: 'Room 102',
      maxCapacity: 30
    },
    {
      id: 'BATCH-P2SCI-MORN',
      name: '+2 Science Excellence (Grade 11/12) - Morning',
      grade: '+2 Science',
      stream: 'Science',
      academicYear: '2081/2082 BS (2026)',
      primaryTeacherId: 'USR-003',
      subjectIds: ['SUB-P2-PHY', 'SUB-P2-CHEM', 'SUB-P2-MATH'],
      scheduleDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '06:15',
      endTime: '08:45',
      room: 'Science Lab Annex',
      maxCapacity: 40
    },
    {
      id: 'BATCH-P2MGT-MORN',
      name: '+2 Management & Finance - Morning',
      grade: '+2 Management',
      stream: 'Management',
      academicYear: '2081/2082 BS (2026)',
      primaryTeacherId: 'USR-005',
      subjectIds: ['SUB-P2-ACC', 'SUB-P2-ECO', 'SUB-P2-BMATH'],
      scheduleDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '06:45',
      endTime: '08:30',
      room: 'Room 201',
      maxCapacity: 35
    },
    {
      id: 'BATCH-C8-EVE',
      name: 'Class 8 BLE Prep - Evening',
      grade: 'Class 8',
      stream: 'General',
      academicYear: '2081/2082 BS (2026)',
      primaryTeacherId: 'USR-004',
      subjectIds: ['SUB-C8-MATH', 'SUB-C8-SCI'],
      scheduleDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '17:00',
      endTime: '18:30',
      room: 'Room 103',
      maxCapacity: 25
    }
  ],

  subjects: [
    { id: 'SUB-C10-MATH', name: 'Compulsory Mathematics', code: 'MTH-10', gradeLevels: ['Class 10'] },
    { id: 'SUB-C10-OPT-MATH', name: 'Optional Mathematics', code: 'OPM-10', gradeLevels: ['Class 10'] },
    { id: 'SUB-C10-SCI', name: 'Science & Technology', code: 'SCI-10', gradeLevels: ['Class 10'] },
    { id: 'SUB-C10-ENG', name: 'Compulsory English', code: 'ENG-10', gradeLevels: ['Class 10'] },
    { id: 'SUB-C9-MATH', name: 'Mathematics 9', code: 'MTH-09', gradeLevels: ['Class 9'] },
    { id: 'SUB-C9-SCI', name: 'Science 9', code: 'SCI-09', gradeLevels: ['Class 9'] },
    { id: 'SUB-C9-ENG', name: 'English 9', code: 'ENG-09', gradeLevels: ['Class 9'] },
    { id: 'SUB-P2-PHY', name: 'Physics (+2)', code: 'PHY-11', gradeLevels: ['+2 Science'] },
    { id: 'SUB-P2-CHEM', name: 'Chemistry (+2)', code: 'CHM-11', gradeLevels: ['+2 Science'] },
    { id: 'SUB-P2-MATH', name: 'Higher Mathematics (+2)', code: 'MTH-11', gradeLevels: ['+2 Science'] },
    { id: 'SUB-P2-ACC', name: 'Principles of Accounting', code: 'ACC-11', gradeLevels: ['+2 Management'] },
    { id: 'SUB-P2-ECO', name: 'Economics (+2)', code: 'ECO-11', gradeLevels: ['+2 Management'] },
    { id: 'SUB-P2-BMATH', name: 'Business Mathematics', code: 'BMT-11', gradeLevels: ['+2 Management'] },
    { id: 'SUB-C8-MATH', name: 'Mathematics 8', code: 'MTH-08', gradeLevels: ['Class 8'] },
    { id: 'SUB-C8-SCI', name: 'Science 8', code: 'SCI-08', gradeLevels: ['Class 8'] }
  ],

  students: [
    {
      id: 'AX-2026-001',
      fullName: 'Aarav Shrestha',
      grade: 'Class 10',
      stream: 'General',
      batchIds: ['BATCH-C10-MORN'],
      guardianName: 'Ram Krishna Shrestha',
      guardianPhone: '+977-9841334455',
      guardianEmail: 'ram.shrestha.parent@gmail.com',
      guardianRelation: 'Father',
      address: 'Koteshwor-32, Kathmandu',
      admissionDate: '2026-01-15',
      status: 'ACTIVE',
      notes: 'Strong in science, needs focus in Optional Math algebra',
      createdAt: '2026-01-15T08:00:00.000Z'
    },
    {
      id: 'AX-2026-002',
      fullName: 'Prashant Karki',
      grade: 'Class 10',
      stream: 'General',
      batchIds: ['BATCH-C10-MORN'],
      guardianName: 'Binod Karki',
      guardianPhone: '+977-9851122334',
      guardianEmail: 'binod.karki88@gmail.com',
      guardianRelation: 'Father',
      address: 'Baneshwor, Kathmandu',
      admissionDate: '2026-01-18',
      status: 'ACTIVE',
      notes: 'Consistent attendance',
      createdAt: '2026-01-18T09:30:00.000Z'
    },
    {
      id: 'AX-2026-003',
      fullName: 'Pooja Thapa Magar',
      grade: 'Class 10',
      stream: 'General',
      batchIds: ['BATCH-C10-MORN'],
      guardianName: 'Maya Thapa Magar',
      guardianPhone: '+977-9803124567',
      guardianEmail: 'maya.thapa.parent@yahoo.com',
      guardianRelation: 'Mother',
      address: 'Chabahil, Kathmandu',
      admissionDate: '2026-01-20',
      status: 'ACTIVE',
      notes: 'Top scorer in Compulsory Math',
      createdAt: '2026-01-20T10:15:00.000Z'
    },
    {
      id: 'AX-2026-004',
      fullName: 'Bibek Gautam',
      grade: 'Class 10',
      stream: 'General',
      batchIds: ['BATCH-C10-MORN'],
      guardianName: 'Krishna Gautam',
      guardianPhone: '+977-9849221100',
      guardianEmail: 'krishna.gautam.parent@gmail.com',
      guardianRelation: 'Father',
      address: 'Shankhamul, Lalitpur',
      admissionDate: '2026-01-22',
      status: 'ACTIVE',
      notes: 'Medical leave on occasions',
      createdAt: '2026-01-22T11:00:00.000Z'
    },
    {
      id: 'AX-2026-005',
      fullName: 'Shrijana Adhikari',
      grade: '+2 Science',
      stream: 'Science',
      batchIds: ['BATCH-P2SCI-MORN'],
      guardianName: 'Deepak Adhikari',
      guardianPhone: '+977-9813009988',
      guardianEmail: 'deepak.adhikari.parent@gmail.com',
      guardianRelation: 'Father',
      address: 'Kalanki, Kathmandu',
      admissionDate: '2026-02-01',
      status: 'ACTIVE',
      notes: 'Preparing for Engineering entrance exams',
      createdAt: '2026-02-01T08:00:00.000Z'
    },
    {
      id: 'AX-2026-006',
      fullName: 'Rohan Maharjan',
      grade: '+2 Science',
      stream: 'Science',
      batchIds: ['BATCH-P2SCI-MORN'],
      guardianName: 'Laxmi Maharjan',
      guardianPhone: '+977-9861445566',
      guardianEmail: 'laxmi.maharjan.parent@gmail.com',
      guardianRelation: 'Mother',
      address: 'Patan Dhoka, Lalitpur',
      admissionDate: '2026-02-05',
      status: 'ACTIVE',
      notes: 'Excellent Physics analytical thinking',
      createdAt: '2026-02-05T09:00:00.000Z'
    },
    {
      id: 'AX-2026-007',
      fullName: 'Anjali Basnet',
      grade: '+2 Science',
      stream: 'Science',
      batchIds: ['BATCH-P2SCI-MORN'],
      guardianName: 'Surendra Basnet',
      guardianPhone: '+977-9847118822',
      guardianEmail: 'surendra.basnet.parent@gmail.com',
      guardianRelation: 'Father',
      address: 'Maitidevi, Kathmandu',
      admissionDate: '2026-02-10',
      status: 'ACTIVE',
      notes: '',
      createdAt: '2026-02-10T09:45:00.000Z'
    },
    {
      id: 'AX-2026-008',
      fullName: 'Siddhartha Rimal',
      grade: '+2 Management',
      stream: 'Management',
      batchIds: ['BATCH-P2MGT-MORN'],
      guardianName: 'Gopal Rimal',
      guardianPhone: '+977-9808332211',
      guardianEmail: 'gopal.rimal.parent@gmail.com',
      guardianRelation: 'Father',
      address: 'Thamel, Kathmandu',
      admissionDate: '2026-02-15',
      status: 'ACTIVE',
      notes: 'Chartered Accountancy aspirant',
      createdAt: '2026-02-15T10:00:00.000Z'
    },
    {
      id: 'AX-2026-009',
      fullName: 'Kritika Neupane',
      grade: '+2 Management',
      stream: 'Management',
      batchIds: ['BATCH-P2MGT-MORN'],
      guardianName: 'Sarita Neupane',
      guardianPhone: '+977-9818556677',
      guardianEmail: 'sarita.neupane.parent@gmail.com',
      guardianRelation: 'Mother',
      address: 'Baluwatar, Kathmandu',
      admissionDate: '2026-02-18',
      status: 'ACTIVE',
      notes: '',
      createdAt: '2026-02-18T11:00:00.000Z'
    },
    {
      id: 'AX-2026-010',
      fullName: 'Nischal Tamang',
      grade: 'Class 9',
      stream: 'General',
      batchIds: ['BATCH-C9-EVE'],
      guardianName: 'Dawa Tamang',
      guardianPhone: '+977-9843776655',
      guardianEmail: 'dawa.tamang.parent@gmail.com',
      guardianRelation: 'Father',
      address: 'Boudha, Kathmandu',
      admissionDate: '2026-03-01',
      status: 'ACTIVE',
      notes: '',
      createdAt: '2026-03-01T08:30:00.000Z'
    },
    {
      id: 'AX-2026-011',
      fullName: 'Sneha Pandey',
      grade: 'Class 9',
      stream: 'General',
      batchIds: ['BATCH-C9-EVE'],
      guardianName: 'Rajan Pandey',
      guardianPhone: '+977-9851443322',
      guardianEmail: 'rajan.pandey.parent@gmail.com',
      guardianRelation: 'Father',
      address: 'Samakhusi, Kathmandu',
      admissionDate: '2026-03-05',
      status: 'ACTIVE',
      notes: 'Active in science experiments',
      createdAt: '2026-03-05T09:15:00.000Z'
    },
    {
      id: 'AX-2026-012',
      fullName: 'Dipesh Bhattarai',
      grade: 'Class 8',
      stream: 'General',
      batchIds: ['BATCH-C8-EVE'],
      guardianName: 'Ishwar Bhattarai',
      guardianPhone: '+977-9801223344',
      guardianEmail: 'ishwar.bhattarai.parent@gmail.com',
      guardianRelation: 'Father',
      address: 'Dillibazar, Kathmandu',
      admissionDate: '2026-03-10',
      status: 'ACTIVE',
      notes: 'BLE exam preparation batch',
      createdAt: '2026-03-10T10:00:00.000Z'
    }
  ],

  sessions: [
    {
      id: 'SESS-20261101-01',
      batchId: 'BATCH-C10-MORN',
      batchName: 'SEE Target 2081/82 (Class 10) - Morning Alpha',
      subjectId: 'SUB-C10-MATH',
      subjectName: 'Compulsory Mathematics',
      date: '2026-11-01',
      startTime: '06:30',
      endTime: '07:30',
      teacherId: 'USR-001',
      teacherName: 'Ramesh Adhikari',
      submittedAt: '2026-11-01T07:35:00.000Z',
      status: 'SUBMITTED',
      records: [
        { studentId: 'AX-2026-001', studentName: 'Aarav Shrestha', status: 'PRESENT', remarks: '' },
        { studentId: 'AX-2026-002', studentName: 'Prashant Karki', status: 'PRESENT', remarks: '' },
        { studentId: 'AX-2026-003', studentName: 'Pooja Thapa Magar', status: 'LATE', remarks: 'Arrived 15 mins late due to public bus delay' },
        { studentId: 'AX-2026-004', studentName: 'Bibek Gautam', status: 'ABSENT', remarks: 'Unannounced absence' }
      ]
    },
    {
      id: 'SESS-20261101-02',
      batchId: 'BATCH-P2SCI-MORN',
      batchName: '+2 Science Excellence (Grade 11/12) - Morning',
      subjectId: 'SUB-P2-PHY',
      subjectName: 'Physics (+2)',
      date: '2026-11-01',
      startTime: '06:15',
      endTime: '07:30',
      teacherId: 'USR-003',
      teacherName: 'Pradeep Thapa',
      submittedAt: '2026-11-01T07:40:00.000Z',
      status: 'SUBMITTED',
      records: [
        { studentId: 'AX-2026-005', studentName: 'Shrijana Adhikari', status: 'PRESENT', remarks: '' },
        { studentId: 'AX-2026-006', studentName: 'Rohan Maharjan', status: 'PRESENT', remarks: '' },
        { studentId: 'AX-2026-007', studentName: 'Anjali Basnet', status: 'ABSENT', remarks: 'Illness reported later' }
      ]
    },
    {
      id: 'SESS-20261031-01',
      batchId: 'BATCH-C10-MORN',
      batchName: 'SEE Target 2081/82 (Class 10) - Morning Alpha',
      subjectId: 'SUB-C10-SCI',
      subjectName: 'Science & Technology',
      date: '2026-10-31',
      startTime: '07:30',
      endTime: '08:30',
      teacherId: 'USR-002',
      teacherName: 'Sunita Sharma',
      submittedAt: '2026-10-31T08:35:00.000Z',
      status: 'SUBMITTED',
      records: [
        { studentId: 'AX-2026-001', studentName: 'Aarav Shrestha', status: 'PRESENT', remarks: '' },
        { studentId: 'AX-2026-002', studentName: 'Prashant Karki', status: 'PRESENT', remarks: '' },
        { studentId: 'AX-2026-003', studentName: 'Pooja Thapa Magar', status: 'PRESENT', remarks: '' },
        { studentId: 'AX-2026-004', studentName: 'Bibek Gautam', status: 'PRESENT', remarks: '' }
      ]
    }
  ],

  correctionLogs: [
    {
      id: 'CORR-001',
      sessionId: 'SESS-20261031-01',
      studentId: 'AX-2026-004',
      previousStatus: 'ABSENT',
      newStatus: 'PRESENT',
      reason: 'Teacher inadvertently marked absent; student arrived during attendance call and submitted homework.',
      modifiedBy: 'Ramesh Adhikari (Super Admin)',
      timestamp: '2026-10-31T09:00:00.000Z'
    }
  ],

  notifications: [
    {
      id: 'NOTIF-001',
      sessionId: 'SESS-20261101-01',
      studentId: 'AX-2026-004',
      studentName: 'Bibek Gautam',
      guardianName: 'Krishna Gautam',
      guardianEmail: 'krishna.gautam.parent@gmail.com',
      guardianPhone: '+977-9849221100',
      batchName: 'SEE Target 2081/82 (Class 10) - Morning Alpha',
      subjectName: 'Compulsory Mathematics',
      date: '2026-11-01',
      status: 'SENT',
      attempts: 1,
      lastAttemptAt: '2026-11-01T07:36:00.000Z',
      queuedAt: '2026-11-01T07:35:10.000Z',
      sentAt: '2026-11-01T07:36:00.000Z',
      content: 'Dear Krishna Gautam, this is to notify you that your ward Bibek Gautam was marked ABSENT today (2026-11-01) for Compulsory Mathematics in SEE Target 2081/82. Please contact Axis Learning at +977-1-4412345 if you have queries.'
    },
    {
      id: 'NOTIF-002',
      sessionId: 'SESS-20261101-02',
      studentId: 'AX-2026-007',
      studentName: 'Anjali Basnet',
      guardianName: 'Surendra Basnet',
      guardianEmail: 'surendra.basnet.parent@gmail.com',
      guardianPhone: '+977-9847118822',
      batchName: '+2 Science Excellence (Grade 11/12) - Morning',
      subjectName: 'Physics (+2)',
      date: '2026-11-01',
      status: 'QUEUED',
      attempts: 0,
      queuedAt: '2026-11-01T07:40:15.000Z',
      content: 'Dear Surendra Basnet, this is to notify you that your ward Anjali Basnet was marked ABSENT today (2026-11-01) for Physics (+2). Please contact Axis Learning at +977-1-4412345.'
    }
  ],

  reminders: [
    {
      id: 'REM-202610-01',
      teacherId: 'USR-004',
      teacherName: 'Gita Pokhrel',
      teacherEmail: 'gita.pokhrel@axislearning.edu.np',
      month: '2026-10',
      reminderType: 'MID_MONTH',
      status: 'SENT',
      incompleteSessionsCount: 2,
      timestamp: '2026-10-25T17:00:00.000Z',
      details: 'Automated mid-month reminder sent for 2 unrecorded sessions in Class 9 Evening.'
    },
    {
      id: 'REM-202610-02',
      teacherId: 'USR-005',
      teacherName: 'Bikash Shrestha',
      teacherEmail: 'bikash.shrestha@axislearning.edu.np',
      month: '2026-10',
      reminderType: 'MONTH_END_FINAL',
      status: 'SKIPPED_COMPLETE',
      incompleteSessionsCount: 0,
      timestamp: '2026-10-31T18:00:00.000Z',
      details: 'All required October 2026 attendance sessions submitted. No reminder required.'
    }
  ],

  invoices: [
    {
      id: 'INV-2026-001',
      invoiceNumber: 'AX-INV-2026-1001',
      studentId: 'AX-2026-001',
      studentName: 'Aarav Shrestha',
      grade: 'Class 10',
      batchName: 'SEE Target 2081/82 (Class 10) - Morning Alpha',
      month: 'Kartik 2081 (Oct/Nov 2026)',
      tuitionFee: 4500,
      discount: 500,
      netPayable: 4000,
      paidAmount: 4000,
      dueAmount: 0,
      dueDate: '2026-11-07',
      status: 'PAID',
      createdAt: '2026-10-20T08:00:00.000Z'
    },
    {
      id: 'INV-2026-002',
      invoiceNumber: 'AX-INV-2026-1002',
      studentId: 'AX-2026-002',
      studentName: 'Prashant Karki',
      grade: 'Class 10',
      batchName: 'SEE Target 2081/82 (Class 10) - Morning Alpha',
      month: 'Kartik 2081 (Oct/Nov 2026)',
      tuitionFee: 4500,
      discount: 0,
      netPayable: 4500,
      paidAmount: 2500,
      dueAmount: 2000,
      dueDate: '2026-11-07',
      status: 'PARTIAL',
      createdAt: '2026-10-20T08:05:00.000Z'
    },
    {
      id: 'INV-2026-003',
      invoiceNumber: 'AX-INV-2026-1003',
      studentId: 'AX-2026-005',
      studentName: 'Shrijana Adhikari',
      grade: '+2 Science',
      batchName: '+2 Science Excellence (Grade 11/12) - Morning',
      month: 'Kartik 2081 (Oct/Nov 2026)',
      tuitionFee: 6500,
      discount: 500,
      netPayable: 6000,
      paidAmount: 6000,
      dueAmount: 0,
      dueDate: '2026-11-07',
      status: 'PAID',
      createdAt: '2026-10-20T08:10:00.000Z'
    },
    {
      id: 'INV-2026-004',
      invoiceNumber: 'AX-INV-2026-1004',
      studentId: 'AX-2026-008',
      studentName: 'Siddhartha Rimal',
      grade: '+2 Management',
      batchName: '+2 Management & Finance - Morning',
      month: 'Kartik 2081 (Oct/Nov 2026)',
      tuitionFee: 5000,
      discount: 0,
      netPayable: 5000,
      paidAmount: 0,
      dueAmount: 5000,
      dueDate: '2026-11-07',
      status: 'UNPAID',
      createdAt: '2026-10-20T08:15:00.000Z'
    }
  ],

  payments: [
    {
      id: 'PAY-001',
      receiptNumber: 'AX-REC-8901',
      invoiceId: 'INV-2026-001',
      studentId: 'AX-2026-001',
      studentName: 'Aarav Shrestha',
      amount: 4000,
      paymentDate: '2026-10-25',
      paymentMethod: 'eSewa',
      referenceNumber: 'ESEWA-984133-7721',
      receivedBy: 'Ramesh Adhikari',
      notes: 'Monthly tuition paid in full'
    },
    {
      id: 'PAY-002',
      receiptNumber: 'AX-REC-8902',
      invoiceId: 'INV-2026-002',
      studentId: 'AX-2026-002',
      studentName: 'Prashant Karki',
      amount: 2500,
      paymentDate: '2026-10-27',
      paymentMethod: 'Cash',
      referenceNumber: 'CASH-REC-102',
      receivedBy: 'Ramesh Adhikari',
      notes: 'Partial payment. Remaining Rs. 2,000 promised by 5th Nov'
    },
    {
      id: 'PAY-003',
      receiptNumber: 'AX-REC-8903',
      invoiceId: 'INV-2026-003',
      studentId: 'AX-2026-005',
      studentName: 'Shrijana Adhikari',
      amount: 6000,
      paymentDate: '2026-10-26',
      paymentMethod: 'Khalti',
      referenceNumber: 'KHLT-4491-002',
      receivedBy: 'Ramesh Adhikari',
      notes: '+2 Science monthly tuition fee'
    }
  ],

  expenses: [
    {
      id: 'EXP-001',
      category: 'Rent',
      amount: 45000,
      expenseDate: '2026-10-01',
      description: 'Building Rent for Academic Premises - Ashwin/Kartik 2081',
      paymentMethod: 'Bank Transfer',
      enteredBy: 'Ramesh Adhikari',
      receiptNumber: 'RENT-REC-771'
    },
    {
      id: 'EXP-002',
      category: 'Printing & Materials',
      amount: 8500,
      expenseDate: '2026-10-14',
      description: 'SEE Model Question Sets & +2 Numerical Problem Booklets printing',
      paymentMethod: 'Cash',
      enteredBy: 'Pradeep Thapa',
      receiptNumber: 'PRINT-KTM-44'
    },
    {
      id: 'EXP-003',
      category: 'Electricity & Utilities',
      amount: 4200,
      expenseDate: '2026-10-20',
      description: 'Nepal Electricity Authority (NEA) monthly bill & water supply',
      paymentMethod: 'eSewa',
      enteredBy: 'Ramesh Adhikari',
      receiptNumber: 'NEA-EB-9921'
    }
  ],

  assignments: [
    {
      id: 'HW-001',
      batchId: 'BATCH-C10-MORN',
      batchName: 'SEE Target 2081/82 (Class 10) - Morning Alpha',
      subjectId: 'SUB-C10-MATH',
      subjectName: 'Compulsory Mathematics',
      teacherId: 'USR-001',
      teacherName: 'Ramesh Adhikari',
      title: 'Quadratic Equations & Word Problems Exercise 4.2',
      description: 'Complete all 12 problems from CDC Textbook pages 88-92. Show detailed factorization and discriminant tests.',
      dueDate: '2026-11-04',
      assignedDate: '2026-11-01',
      totalSubmissions: 3
    },
    {
      id: 'HW-002',
      batchId: 'BATCH-P2SCI-MORN',
      batchName: '+2 Science Excellence (Grade 11/12) - Morning',
      subjectId: 'SUB-P2-PHY',
      subjectName: 'Physics (+2)',
      teacherId: 'USR-003',
      teacherName: 'Pradeep Thapa',
      title: 'Rotational Dynamics & Moment of Inertia Numericals',
      description: 'Solve the 8 numerical problems given in sheet #4 including parallel and perpendicular axes theorem applications.',
      dueDate: '2026-11-05',
      assignedDate: '2026-11-01',
      totalSubmissions: 2
    }
  ],

  testScores: [
    {
      id: 'TEST-001',
      testName: 'October Monthly Assessment - Compulsory Math',
      batchId: 'BATCH-C10-MORN',
      subjectId: 'SUB-C10-MATH',
      date: '2026-10-28',
      fullMarks: 50,
      passMarks: 20,
      studentScores: [
        { studentId: 'AX-2026-001', studentName: 'Aarav Shrestha', marksObtained: 46, gradeLetter: 'A+', remarks: 'Exceptional presentation' },
        { studentId: 'AX-2026-002', studentName: 'Prashant Karki', marksObtained: 38, gradeLetter: 'A', remarks: 'Good work' },
        { studentId: 'AX-2026-003', studentName: 'Pooja Thapa Magar', marksObtained: 48, gradeLetter: 'A+', remarks: 'Highest mark in batch' },
        { studentId: 'AX-2026-004', studentName: 'Bibek Gautam', marksObtained: 27, gradeLetter: 'B', remarks: 'Need revision in Geometry theorems' }
      ]
    }
  ],

  announcements: [
    {
      id: 'ANN-001',
      title: 'SEE Model Test Series Phase I Starting Next Week',
      content: 'All Class 10 morning students are requested to collect their admit slips for the SEE Model Examination Series. Tests run every Sunday morning at 06:30 AM sharp.',
      authorName: 'Ramesh Adhikari',
      authorRole: 'SUPER_ADMIN',
      targetAudience: 'ALL',
      publishedAt: '2026-10-28T09:00:00.000Z',
      isImportant: true
    },
    {
      id: 'ANN-002',
      title: 'Faculty Meeting: Monthly Attendance Review & +2 Lab Sessions',
      content: 'Founding teachers meeting scheduled for Friday 5:00 PM in the Teacher Staff Room to finalize monthly attendance reports and curriculum pacing.',
      authorName: 'Ramesh Adhikari',
      authorRole: 'SUPER_ADMIN',
      targetAudience: 'TEACHERS',
      publishedAt: '2026-10-30T14:00:00.000Z',
      isImportant: false
    }
  ],

  auditLogs: [
    {
      id: 'AUD-001',
      userId: 'USR-001',
      userName: 'Ramesh Adhikari',
      userRole: 'SUPER_ADMIN',
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SETTING',
      entityId: 'AXIS-SYS',
      details: 'Axis Learning Management Portal database initial configuration completed for 2081/2082 academic session.',
      timestamp: '2026-10-01T06:00:00.000Z'
    },
    {
      id: 'AUD-002',
      userId: 'USR-001',
      userName: 'Ramesh Adhikari',
      userRole: 'SUPER_ADMIN',
      action: 'ATTENDANCE_CORRECTED',
      entityType: 'ATTENDANCE',
      entityId: 'SESS-20261031-01',
      details: 'Attendance corrected for Bibek Gautam from ABSENT to PRESENT. Reason: Teacher mistakenly marked absent; student arrived during attendance call.',
      timestamp: '2026-10-31T09:00:00.000Z'
    }
  ],

  settings: {
    centreName: 'Axis Learning Tuition & Coaching Centre',
    tagline: 'Guiding Academic Excellence for Classes 1–10 and +2 (Science & Management)',
    address: 'Shankhamul Road (Near Bridge), Kathmandu 44600, Nepal',
    contactPhone: '+977-1-4412345 / +977-9841234567',
    contactEmail: 'contact@axislearning.edu.np',
    academicYear: '2081/2082 BS (2026-2027)',
    timeZone: 'Asia/Kathmandu',
    googleAppsScriptUrl: '',
    googleAppsScriptApiKey: '',
    enableGoogleSheetsSync: false,
    absenceEmailTemplate: 'Dear {{guardianName}},\n\nThis is an automated notification from Axis Learning Management. Your ward, {{studentName}} (Grade: {{grade}}), was marked ABSENT for the scheduled {{subjectName}} session in batch "{{batchName}}" on {{date}}.\n\nRegular class attendance is vital for conceptual mastery and examination success. If this absence was planned or due to illness, please send a note or contact us at +977-1-4412345.\n\nWarm regards,\nAxis Learning Academic Administration\nKathmandu, Nepal',
    teacherReminderTemplate: 'Dear {{teacherName}},\n\nThis is your monthly academic workflow reminder from Axis Learning. As of {{currentDate}}, you have {{incompleteCount}} unsubmitted attendance session(s) for the month of {{month}}.\n\nPlease sign in to the Axis Learning Management Portal and complete your attendance submissions by the month-end deadline.\n\nPortal: https://axislearning.edu.np/portal\nThank you for your dedication to our students.',
    feeReceiptFooter: 'Thank you for your payment. Axis Learning Tuition & Coaching Centre, Kathmandu, Nepal. Ph: +977-1-4412345. PAN: 601294857.'
  }
};

// Database helper functions
let db: PortalDatabase = initialSeedData as unknown as PortalDatabase;

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('Failed to load DB, initializing with seed data:', err);
    db = initialSeedData as unknown as PortalDatabase;
    saveDb();
  }

  const envSheetsUrl = process.env.GOOGLE_APPS_SCRIPT_URL || process.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  if (envSheetsUrl && (!db.settings.googleAppsScriptUrl || db.settings.googleAppsScriptUrl === '')) {
    db.settings.googleAppsScriptUrl = envSheetsUrl;
    db.settings.enableGoogleSheetsSync = true;
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB to disk:', err);
  }
}

loadDb();

// Authentication & Authorization Middleware
interface AuthRequest extends Request {
  user?: any;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = (req.headers['x-user-id'] as string) || 'USR-001';
  const foundUser = db.users.find(u => u.id === userId && u.isActive);
  
  if (!foundUser) {
    // Fallback to primary admin if not specified
    const defaultUser = db.users[0];
    req.user = defaultUser;
  } else {
    req.user = foundUser;
  }
  next();
}

function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      error: 'Access Denied: Only Super Administrators can perform this action.' 
    });
  }
  next();
}

function logAudit(userId: string, userName: string, role: string, action: string, entityType: string, entityId: string, details: string) {
  const log = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userName,
    userRole: role as any,
    action,
    entityType: entityType as any,
    entityId,
    details,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);
  saveDb();
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Current User / Auth Status
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    user: req.user,
    availableAccounts: db.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      designation: u.designation,
      isActive: u.isActive
    }))
  });
});

app.post('/api/auth/switch', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.users.find(u => u.id === userId && u.isActive);
  if (!user) {
    return res.status(404).json({ error: 'User account not found or deactivated' });
  }
  res.json({ success: true, user });
});

// 2. Dashboard Analytics (Distinct calculations)
app.get('/api/dashboard/stats', authMiddleware, (req: AuthRequest, res: Response) => {
  const distinctActiveStudents = db.students.filter(s => s.status === 'ACTIVE').length;
  const activeTeachers = db.users.filter(u => u.role === 'TEACHER' && u.isActive).length;
  const totalBatches = db.batches.length;
  const totalSubjects = db.subjects.length;

  // Today's attendance calculation (date string in YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = db.sessions.filter(s => s.date === todayStr);

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;

  todaySessions.forEach(sess => {
    sess.records.forEach(r => {
      if (r.status === 'PRESENT') presentCount++;
      else if (r.status === 'ABSENT') absentCount++;
      else if (r.status === 'LATE') lateCount++;
      else if (r.status === 'LEAVE') leaveCount++;
    });
  });

  // Calculate missing attendance sessions for today
  // For each batch, if it has a schedule for today's day of week, check if a session exists
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDay = dayNames[new Date().getDay()];
  const expectedBatchesToday = db.batches.filter(b => b.scheduleDays.includes(todayDay));
  const missingSessions = expectedBatchesToday.filter(b => {
    return !todaySessions.some(s => s.batchId === b.id);
  }).map(b => {
    const teacher = db.users.find(u => u.id === b.primaryTeacherId);
    return {
      batchId: b.id,
      batchName: b.name,
      time: `${b.startTime} - ${b.endTime}`,
      teacherName: teacher ? teacher.name : 'Unassigned',
      grade: b.grade
    };
  });

  // Financial summary
  const totalInvoiced = db.invoices.reduce((acc, inv) => acc + inv.netPayable, 0);
  const totalCollected = db.payments.reduce((acc, pay) => acc + pay.amount, 0);
  const totalOutstanding = db.invoices.reduce((acc, inv) => acc + inv.dueAmount, 0);
  const totalExpenses = db.expenses.reduce((acc, exp) => acc + exp.amount, 0);

  res.json({
    counts: {
      distinctActiveStudents,
      activeTeachers,
      totalBatches,
      totalSubjects,
      todaySessionsRecorded: todaySessions.length,
      missingSessionsCount: missingSessions.length
    },
    todayAttendance: {
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      leave: leaveCount,
      totalMarked: presentCount + absentCount + lateCount + leaveCount
    },
    missingSessions,
    finance: {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalExpenses,
      netBalance: totalCollected - totalExpenses
    },
    recentAnnouncements: db.announcements.slice(0, 3),
    recentAuditLogs: db.auditLogs.slice(0, 5)
  });
});

// 3. Students Management (CRUD, Duplicate detection, CSV Import/Export)
app.get('/api/students', authMiddleware, (req: AuthRequest, res: Response) => {
  const { grade, batchId, status, search } = req.query;
  let result = [...db.students];

  if (grade) {
    result = result.filter(s => s.grade === grade);
  }
  if (batchId) {
    result = result.filter(s => s.batchIds.includes(batchId as string));
  }
  if (status) {
    result = result.filter(s => s.status === status);
  }
  if (search) {
    const q = (search as string).toLowerCase().trim();
    result = result.filter(s => 
      s.fullName.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.guardianName.toLowerCase().includes(q) ||
      s.guardianPhone.includes(q)
    );
  }

  // Teacher role filter: if teacher, they can still view directory or filter
  res.json(result);
});

// Check likely duplicate registration
app.post('/api/students/check-duplicate', authMiddleware, (req: AuthRequest, res: Response) => {
  const { fullName, guardianPhone, guardianEmail, grade } = req.body;
  const matches = db.students.filter(s => {
    const nameMatch = s.fullName.toLowerCase().trim() === (fullName || '').toLowerCase().trim();
    const phoneMatch = guardianPhone && s.guardianPhone && s.guardianPhone.replace(/\D/g, '') === guardianPhone.replace(/\D/g, '');
    const emailMatch = guardianEmail && s.guardianEmail && s.guardianEmail.toLowerCase().trim() === guardianEmail.toLowerCase().trim();
    return nameMatch || phoneMatch || emailMatch;
  });

  res.json({
    isDuplicateLikely: matches.length > 0,
    matches
  });
});

// Create new student
app.post('/api/students', authMiddleware, (req: AuthRequest, res: Response) => {
  const {
    fullName, grade, stream, batchIds, guardianName, guardianPhone,
    guardianEmail, guardianRelation, address, notes
  } = req.body;

  if (!fullName || !grade || !guardianName || !guardianPhone) {
    return res.status(400).json({ error: 'Missing mandatory fields: Full Name, Grade, Guardian Name, and Phone are required.' });
  }

  const nextIdNum = db.students.length + 1;
  const newId = `AX-2026-${String(nextIdNum).padStart(3, '0')}`;

  const newStudent = {
    id: newId,
    fullName: fullName.trim(),
    grade,
    stream: stream || (grade.includes('Science') ? 'Science' : grade.includes('Management') ? 'Management' : 'General'),
    batchIds: Array.isArray(batchIds) ? batchIds : [],
    guardianName: guardianName.trim(),
    guardianPhone: guardianPhone.trim(),
    guardianEmail: (guardianEmail || '').trim(),
    guardianRelation: guardianRelation || 'Guardian',
    address: (address || 'Kathmandu, Nepal').trim(),
    admissionDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE' as const,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.students.push(newStudent);
  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'STUDENT_REGISTERED', 'STUDENT', newId, `Registered new student ${fullName} in ${grade}`);

  res.status(201).json(newStudent);
});

// Update student record
app.put('/api/students/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const index = db.students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const oldRecord = db.students[index];
  const updated = {
    ...oldRecord,
    ...req.body,
    id: oldRecord.id // protect canonical ID
  };

  db.students[index] = updated;
  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'STUDENT_UPDATED', 'STUDENT', id, `Updated student profile for ${updated.fullName}`);

  res.json(updated);
});

// Batch transfer without losing history
app.post('/api/students/:id/transfer-batch', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { targetBatchId, reason } = req.body;

  const student = db.students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const targetBatch = db.batches.find(b => b.id === targetBatchId);
  if (!targetBatch) {
    return res.status(404).json({ error: 'Target batch not found' });
  }

  const oldBatches = [...student.batchIds];
  student.batchIds = [targetBatchId];
  saveDb();

  logAudit(
    req.user.id, req.user.name, req.user.role, 'STUDENT_BATCH_TRANSFERRED', 'STUDENT', id,
    `Transferred ${student.fullName} from batches [${oldBatches.join(', ')}] to ${targetBatch.name}. Reason: ${reason || 'Not specified'}`
  );

  res.json({ success: true, student });
});

// Bulk Import Students from CSV data
app.post('/api/students/bulk-import', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  const { studentsList } = req.body;
  if (!Array.isArray(studentsList) || studentsList.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty students list' });
  }

  let importedCount = 0;
  studentsList.forEach((item: any) => {
    if (item.fullName && item.grade) {
      const nextNum = db.students.length + 1;
      const newId = `AX-2026-${String(nextNum).padStart(3, '0')}`;
      db.students.push({
        id: newId,
        fullName: item.fullName.trim(),
        grade: item.grade,
        stream: item.stream || 'General',
        batchIds: item.batchId ? [item.batchId] : [],
        guardianName: item.guardianName || 'Guardian',
        guardianPhone: item.guardianPhone || '+977-9840000000',
        guardianEmail: item.guardianEmail || '',
        guardianRelation: item.guardianRelation || 'Father',
        address: item.address || 'Kathmandu',
        admissionDate: item.admissionDate || new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        notes: item.notes || 'Imported via CSV',
        createdAt: new Date().toISOString()
      });
      importedCount++;
    }
  });

  saveDb();
  logAudit(req.user.id, req.user.name, req.user.role, 'BULK_IMPORT', 'STUDENT', 'ALL', `Bulk imported ${importedCount} student records`);

  res.json({ success: true, importedCount });
});

// 4. Teachers Management
app.get('/api/teachers', authMiddleware, (req: AuthRequest, res: Response) => {
  // Return teachers list with assigned batches info and monthly submission status
  const teachers = db.users.filter(u => u.role === 'TEACHER' || u.role === 'SUPER_ADMIN').map(u => {
    const assignedBatches = db.batches.filter(b => u.assignedBatchIds?.includes(b.id) || b.primaryTeacherId === u.id);
    
    // Check sessions submitted by this teacher this month
    const currentMonth = new Date().toISOString().substring(0, 7);
    const submittedThisMonth = db.sessions.filter(s => s.teacherId === u.id && s.date.startsWith(currentMonth)).length;

    return {
      ...u,
      assignedBatches: assignedBatches.map(b => ({ id: b.id, name: b.name, grade: b.grade })),
      submittedThisMonth
    };
  });

  res.json(teachers);
});

// Create new Teacher Account (Super Admin only)
app.post('/api/teachers', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  const { name, email, phone, designation, assignedSubjects, assignedBatchIds, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Prevent email duplicate
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const newId = `USR-${String(db.users.length + 1).padStart(3, '0')}`;
  const newTeacher = {
    id: newId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: (role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TEACHER') as any,
    phone: phone || '+977-',
    designation: designation || 'Tuition Faculty',
    assignedSubjects: Array.isArray(assignedSubjects) ? assignedSubjects : [],
    assignedBatchIds: Array.isArray(assignedBatchIds) ? assignedBatchIds : [],
    isActive: true,
    avatarUrl: ''
  };

  db.users.push(newTeacher);
  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'TEACHER_CREATED', 'TEACHER', newId, `Created teacher account for ${name} (${email})`);

  res.status(201).json(newTeacher);
});

// Toggle Teacher Active status
app.patch('/api/teachers/:id/toggle-status', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const teacher = db.users.find(u => u.id === id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  // Prevent deactivating primary director
  if (teacher.id === 'USR-001') {
    return res.status(400).json({ error: 'Cannot deactivate the Founding Director account.' });
  }

  teacher.isActive = !teacher.isActive;
  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'TEACHER_STATUS_TOGGLED', 'TEACHER', id, `Set active status of ${teacher.name} to ${teacher.isActive}`);

  res.json(teacher);
});

// Update Teacher Batch & Subject Assignments
app.put('/api/teachers/:id/assignments', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { assignedBatchIds, assignedSubjects } = req.body;
  const teacher = db.users.find(u => u.id === id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  teacher.assignedBatchIds = Array.isArray(assignedBatchIds) ? assignedBatchIds : [];
  teacher.assignedSubjects = Array.isArray(assignedSubjects) ? assignedSubjects : [];
  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'TEACHER_ASSIGNMENT_UPDATED', 'TEACHER', id, `Updated assignments for ${teacher.name}`);

  res.json(teacher);
});

// 5. Batches, Classes & Timetable
app.get('/api/batches', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json(db.batches);
});

app.get('/api/subjects', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json(db.subjects);
});

app.post('/api/batches', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  const { name, grade, stream, academicYear, primaryTeacherId, subjectIds, scheduleDays, startTime, endTime, room, maxCapacity } = req.body;
  if (!name || !grade || !startTime || !endTime) {
    return res.status(400).json({ error: 'Name, Grade, Start and End time are required.' });
  }

  // Conflict check: Check if primary teacher has another batch at overlapping time on the same days
  const conflicts = db.batches.filter(b => {
    if (b.primaryTeacherId !== primaryTeacherId) return false;
    const commonDays = (scheduleDays || []).filter((d: string) => (b.scheduleDays || []).includes(d));
    if (commonDays.length === 0) return false;
    // Simple time overlap check
    return (startTime < b.endTime && endTime > b.startTime);
  });

  if (conflicts.length > 0) {
    const conflictNames = conflicts.map(c => c.name).join(', ');
    return res.status(409).json({ 
      error: `Timetable conflict detected: Assigned teacher already has overlapping schedule with batch: ${conflictNames}` 
    });
  }

  const newId = `BATCH-${Date.now().toString(36).toUpperCase()}`;
  const newBatch = {
    id: newId,
    name: name.trim(),
    grade,
    stream: stream || 'General',
    academicYear: academicYear || '2081/2082 BS (2026)',
    primaryTeacherId: primaryTeacherId || req.user.id,
    subjectIds: Array.isArray(subjectIds) ? subjectIds : [],
    scheduleDays: Array.isArray(scheduleDays) ? scheduleDays : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    startTime,
    endTime,
    room: room || 'Classroom 1',
    maxCapacity: Number(maxCapacity) || 30
  };

  db.batches.push(newBatch);
  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'BATCH_CREATED', 'BATCH', newId, `Created batch ${name} for ${grade}`);

  res.status(201).json(newBatch);
});

// 6. Session-based Attendance
// Get attendance sessions with multi-criteria filters
app.get('/api/attendance/sessions', authMiddleware, (req: AuthRequest, res: Response) => {
  const { batchId, subjectId, date, teacherId } = req.query;
  let result = [...db.sessions];

  // If user is a teacher, restrict to their batches unless they are admin
  if (req.user.role === 'TEACHER') {
    result = result.filter(s => s.teacherId === req.user.id || req.user.assignedBatchIds?.includes(s.batchId));
  }

  if (batchId) result = result.filter(s => s.batchId === batchId);
  if (subjectId) result = result.filter(s => s.subjectId === subjectId);
  if (date) result = result.filter(s => s.date === date);
  if (teacherId) result = result.filter(s => s.teacherId === teacherId);

  // Sort newest first
  result.sort((a, b) => b.date.localeCompare(a.date));
  res.json(result);
});

// Submit a new Attendance Session (Anti-duplicate protection, validation, and automated absence notification queuing)
app.post('/api/attendance/sessions', authMiddleware, (req: AuthRequest, res: Response) => {
  const { batchId, subjectId, date, startTime, endTime, records } = req.body;

  if (!batchId || !subjectId || !date || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Missing batch, subject, date or records array.' });
  }

  // Teacher permission check: make sure teacher is assigned to this batch or is admin
  if (req.user.role === 'TEACHER') {
    const isAssigned = req.user.assignedBatchIds?.includes(batchId) || 
      db.batches.some(b => b.id === batchId && b.primaryTeacherId === req.user.id);
    if (!isAssigned) {
      return res.status(403).json({ error: 'Permission Denied: You are not assigned to record attendance for this batch.' });
    }
  }

  // Anti-duplicate protection: check if a session already exists for this batch, subject, and date
  const existing = db.sessions.find(s => s.batchId === batchId && s.subjectId === subjectId && s.date === date);
  if (existing) {
    return res.status(409).json({ 
      error: `An attendance session has already been recorded for this batch and subject on ${date}. To modify, please use the Attendance Correction workflow with an audit reason.` 
    });
  }

  const batch = db.batches.find(b => b.id === batchId);
  const subject = db.subjects.find(s => s.id === subjectId);

  const sessionId = `SESS-${date.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const newSession = {
    id: sessionId,
    batchId,
    batchName: batch ? batch.name : 'Unknown Batch',
    subjectId,
    subjectName: subject ? subject.name : 'Unknown Subject',
    date,
    startTime: startTime || batch?.startTime || '06:30',
    endTime: endTime || batch?.endTime || '08:00',
    teacherId: req.user.id,
    teacherName: req.user.name,
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED' as const,
    records: records.map((r: any) => ({
      studentId: r.studentId,
      studentName: r.studentName,
      status: r.status || 'PRESENT',
      remarks: r.remarks || ''
    }))
  };

  db.sessions.push(newSession);

  // Queue Absence Notifications for any ABSENT student
  const absentRecords = newSession.records.filter(r => r.status === 'ABSENT');
  absentRecords.forEach(absent => {
    const student = db.students.find(s => s.id === absent.studentId);
    if (student && student.guardianEmail) {
      const notifId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const messageContent = `Dear ${student.guardianName},\n\nThis is to notify you that your ward ${student.fullName} (ID: ${student.id}) was recorded ABSENT on ${date} for ${newSession.subjectName} in batch "${newSession.batchName}".\n\nPlease reach out to Axis Learning Administration at +977-1-4412345 if you have any questions.\n\nWarm regards,\nAxis Learning, Kathmandu`;

      db.notifications.push({
        id: notifId,
        sessionId,
        studentId: student.id,
        studentName: student.fullName,
        guardianName: student.guardianName,
        guardianEmail: student.guardianEmail,
        guardianPhone: student.guardianPhone,
        batchName: newSession.batchName,
        subjectName: newSession.subjectName,
        date,
        status: 'QUEUED',
        attempts: 0,
        queuedAt: new Date().toISOString(),
        content: messageContent
      });
    }
  });

  saveDb();

  // Mirrored write to Google Sheets / Excel database if configured
  if (db.settings.googleAppsScriptUrl) {
    fetch(db.settings.googleAppsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        apiKey: db.settings.googleAppsScriptApiKey || 'AXIS_KTM_SECURE_KEY_2026',
        action: 'recordAttendance',
        data: {
          sessionId,
          batchId,
          batchName: newSession.batchName,
          subjectName: newSession.subjectName,
          date,
          startTime: newSession.startTime,
          endTime: newSession.endTime,
          teacherName: newSession.teacherName,
          records: newSession.records
        }
      })
    }).catch(err => console.error('Mirrored write to Google Sheets failed:', err));
  }

  logAudit(
    req.user.id, req.user.name, req.user.role, 'ATTENDANCE_SUBMITTED', 'ATTENDANCE', sessionId,
    `Submitted attendance for ${newSession.batchName} (${newSession.subjectName}) on ${date}. Total students: ${newSession.records.length}, Absent: ${absentRecords.length}`
  );

  res.status(201).json({
    session: newSession,
    queuedNotificationsCount: absentRecords.length
  });
});

// Authorized Attendance Correction with mandatory reason & audit tracking
app.put('/api/attendance/sessions/:id/correct', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { records, reason } = req.body;

  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({ error: 'A mandatory explanation reason (at least 5 characters) is required to correct attendance.' });
  }

  const session = db.sessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Attendance session not found.' });
  }

  // Permission: Super Admin can correct any session. Teacher can only correct their own within 48 hours with reason.
  if (req.user.role === 'TEACHER' && session.teacherId !== req.user.id) {
    return res.status(403).json({ error: 'Only Super Admin or the session teacher can correct this attendance.' });
  }

  // Track differences in correction logs
  const oldRecordsMap = new Map(session.records.map(r => [r.studentId, r.status]));
  records.forEach((newRec: any) => {
    const oldStatus = oldRecordsMap.get(newRec.studentId);
    if (oldStatus && oldStatus !== newRec.status) {
      db.correctionLogs.unshift({
        id: `CORR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sessionId: id,
        studentId: newRec.studentId,
        previousStatus: oldStatus,
        newStatus: newRec.status,
        reason: reason.trim(),
        modifiedBy: `${req.user.name} (${req.user.role})`,
        timestamp: new Date().toISOString()
      });
    }
  });

  session.records = records;
  session.isEdited = true;
  session.editReason = reason.trim();
  session.editedBy = req.user.name;
  session.editedAt = new Date().toISOString();

  saveDb();

  logAudit(
    req.user.id, req.user.name, req.user.role, 'ATTENDANCE_CORRECTED', 'ATTENDANCE', id,
    `Corrected attendance for ${session.batchName} on ${session.date}. Reason: ${reason}`
  );

  res.json({ success: true, session });
});

// Attendance Correction Logs
app.get('/api/attendance/correction-logs', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json(db.correctionLogs);
});

// Attendance summary percentages report
app.get('/api/attendance/report', authMiddleware, (req: AuthRequest, res: Response) => {
  const { batchId, startDate, endDate } = req.query;

  let filteredSessions = [...db.sessions];
  if (batchId) filteredSessions = filteredSessions.filter(s => s.batchId === batchId);
  if (startDate) filteredSessions = filteredSessions.filter(s => s.date >= (startDate as string));
  if (endDate) filteredSessions = filteredSessions.filter(s => s.date <= (endDate as string));

  // Compute student-wise statistics
  const studentMap: Record<string, {
    studentId: string;
    studentName: string;
    grade: string;
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
  }> = {};

  filteredSessions.forEach(sess => {
    sess.records.forEach(r => {
      if (!studentMap[r.studentId]) {
        const studentObj = db.students.find(s => s.id === r.studentId);
        studentMap[r.studentId] = {
          studentId: r.studentId,
          studentName: r.studentName,
          grade: studentObj ? studentObj.grade : 'General',
          totalSessions: 0,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0
        };
      }
      studentMap[r.studentId].totalSessions += 1;
      if (r.status === 'PRESENT') studentMap[r.studentId].present += 1;
      else if (r.status === 'ABSENT') studentMap[r.studentId].absent += 1;
      else if (r.status === 'LATE') studentMap[r.studentId].late += 1;
      else if (r.status === 'LEAVE') studentMap[r.studentId].leave += 1;
    });
  });

  const studentReport = Object.values(studentMap).map(s => {
    // Attendance Formula: (Present + (0.5 * Late)) / Total Sessions * 100
    const effectivePresent = s.present + (0.5 * s.late);
    const attendancePercentage = s.totalSessions > 0 
      ? Math.round((effectivePresent / s.totalSessions) * 1000) / 10 
      : 0;

    return {
      ...s,
      attendancePercentage,
      isRepeatedAbsentee: s.absent >= 3
    };
  });

  res.json({
    totalSessionsCount: filteredSessions.length,
    studentReport
  });
});

// 7. Absence Notifications Queue & Email Delivery Tracking
app.get('/api/notifications', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status, studentId } = req.query;
  let result = [...db.notifications];
  if (status) result = result.filter(n => n.status === status);
  if (studentId) result = result.filter(n => n.studentId === studentId);
  result.sort((a, b) => b.queuedAt.localeCompare(a.queuedAt));
  res.json(result);
});

// Retry failed or queued email notifications
app.post('/api/notifications/:id/retry', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });

  // Simulate delivery attempt with genuine outcome tracking
  notif.attempts += 1;
  notif.lastAttemptAt = new Date().toISOString();

  // If email address is valid format, mark SENT, otherwise FAILED
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(notif.guardianEmail)) {
    notif.status = 'SENT';
    notif.sentAt = new Date().toISOString();
    delete notif.failureReason;
  } else {
    notif.status = 'FAILED';
    notif.failureReason = 'Invalid guardian email address format: ' + notif.guardianEmail;
  }

  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'NOTIFICATION_RETRIED', 'ATTENDANCE', id, `Retried email notification for ${notif.studentName}. Status: ${notif.status}`);

  res.json({ success: true, notification: notif });
});

// Process all queued notifications (simulate provider batch dispatch)
app.post('/api/notifications/dispatch-queued', authMiddleware, (req: AuthRequest, res: Response) => {
  const queued = db.notifications.filter(n => n.status === 'QUEUED');
  let dispatched = 0;

  queued.forEach(n => {
    n.attempts += 1;
    n.lastAttemptAt = new Date().toISOString();
    if (n.guardianEmail && n.guardianEmail.includes('@')) {
      n.status = 'SENT';
      n.sentAt = new Date().toISOString();
    } else {
      n.status = 'FAILED';
      n.failureReason = 'Missing or invalid recipient email';
    }
    dispatched++;
  });

  saveDb();

  res.json({ success: true, processedCount: dispatched });
});

// 8. Month-End Teacher Reminders (Asia/Kathmandu timezone aware)
app.get('/api/reminders/logs', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json(db.reminders);
});

// Trigger Month-End Reminder Evaluation (Idempotent job)
app.post('/api/reminders/evaluate', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  const { month } = req.body;
  const targetMonth = month || new Date().toISOString().substring(0, 7); // e.g. "2026-10"

  const teachers = db.users.filter(u => u.role === 'TEACHER' && u.isActive);
  const results: any[] = [];

  teachers.forEach(t => {
    // Check if an idempotent reminder already exists for this teacher, month, and type
    const existingReminder = db.reminders.find(
      r => r.teacherId === t.id && r.month === targetMonth && r.status === 'SENT'
    );

    // Count submitted sessions for this teacher this month
    const submittedCount = db.sessions.filter(
      s => s.teacherId === t.id && s.date.startsWith(targetMonth)
    ).length;

    // A full-time tuition teacher typically conducts ~20 sessions per month
    const expectedThreshold = 10;
    const hasIncomplete = submittedCount < expectedThreshold;

    if (existingReminder) {
      results.push({
        teacherName: t.name,
        status: 'ALREADY_SENT',
        details: `Reminder already sent previously on ${existingReminder.timestamp}`
      });
      return;
    }

    if (hasIncomplete) {
      const incompleteCount = expectedThreshold - submittedCount;
      const remId = `REM-${targetMonth.replace('-', '')}-${t.id}`;
      const newReminder = {
        id: remId,
        teacherId: t.id,
        teacherName: t.name,
        teacherEmail: t.email,
        month: targetMonth,
        reminderType: 'MONTH_END_FINAL' as const,
        status: 'SENT' as const,
        incompleteSessionsCount: incompleteCount,
        timestamp: new Date().toISOString(),
        details: `Sent month-end reminder: ${incompleteCount} expected session submissions missing for ${targetMonth}.`
      };
      db.reminders.unshift(newReminder);
      results.push({
        teacherName: t.name,
        status: 'SENT',
        incompleteCount,
        details: newReminder.details
      });
    } else {
      const remId = `REM-COMP-${targetMonth.replace('-', '')}-${t.id}`;
      const skippedRecord = {
        id: remId,
        teacherId: t.id,
        teacherName: t.name,
        teacherEmail: t.email,
        month: targetMonth,
        reminderType: 'MONTH_END_FINAL' as const,
        status: 'SKIPPED_COMPLETE' as const,
        incompleteSessionsCount: 0,
        timestamp: new Date().toISOString(),
        details: `Attendance verified complete (${submittedCount} sessions submitted). Skipped reminder.`
      };
      db.reminders.unshift(skippedRecord);
      results.push({
        teacherName: t.name,
        status: 'SKIPPED_COMPLETE',
        details: skippedRecord.details
      });
    }
  });

  saveDb();

  logAudit(
    req.user.id, req.user.name, req.user.role, 'REMINDERS_EVALUATED', 'SETTING', targetMonth,
    `Evaluated month-end reminders for ${teachers.length} teachers for month ${targetMonth}.`
  );

  res.json({ success: true, month: targetMonth, results });
});

// 9. Finance Module (Fee Invoices, Payments, Receipts, Expenses)
app.get('/api/finance/invoices', authMiddleware, (req: AuthRequest, res: Response) => {
  const { studentId, status } = req.query;
  let result = [...db.invoices];
  if (studentId) result = result.filter(i => i.studentId === studentId);
  if (status) result = result.filter(i => i.status === status);
  res.json(result);
});

app.get('/api/finance/payments', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json(db.payments);
});

app.post('/api/finance/payments', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  const { invoiceId, amount, paymentMethod, referenceNumber, notes } = req.body;
  const invoice = db.invoices.find(i => i.id === invoiceId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required' });
  }

  const receiptNumber = `AX-REC-${Math.floor(1000 + Math.random() * 9000)}`;
  const payment = {
    id: `PAY-${Date.now()}`,
    receiptNumber,
    invoiceId,
    studentId: invoice.studentId,
    studentName: invoice.studentName,
    amount: numAmount,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: paymentMethod || 'Cash',
    referenceNumber: referenceNumber || '',
    receivedBy: req.user.name,
    notes: notes || ''
  };

  db.payments.unshift(payment);

  // Update Invoice amounts
  invoice.paidAmount += numAmount;
  invoice.dueAmount = Math.max(0, invoice.netPayable - invoice.paidAmount);
  if (invoice.dueAmount === 0) {
    invoice.status = 'PAID';
  } else {
    invoice.status = 'PARTIAL';
  }

  saveDb();

  logAudit(
    req.user.id, req.user.name, req.user.role, 'FEE_PAYMENT_RECORDED', 'FINANCE', payment.id,
    `Recorded payment of NPR ${numAmount} for ${invoice.studentName} (${invoice.invoiceNumber}) via ${paymentMethod}`
  );

  res.status(201).json({ payment, invoice });
});

// Expenses
app.get('/api/finance/expenses', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.expenses);
});

app.post('/api/finance/expenses', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  const { category, amount, description, paymentMethod, receiptNumber } = req.body;
  if (!category || !amount || !description) {
    return res.status(400).json({ error: 'Category, amount and description are required.' });
  }

  const newExpense = {
    id: `EXP-${Date.now()}`,
    category,
    amount: Number(amount),
    expenseDate: new Date().toISOString().split('T')[0],
    description: description.trim(),
    paymentMethod: paymentMethod || 'Cash',
    enteredBy: req.user.name,
    receiptNumber: receiptNumber || ''
  };

  db.expenses.unshift(newExpense);
  saveDb();

  logAudit(
    req.user.id, req.user.name, req.user.role, 'EXPENSE_RECORDED', 'FINANCE', newExpense.id,
    `Recorded expense of NPR ${newExpense.amount} for ${category}: ${description}`
  );

  res.status(201).json(newExpense);
});

// 10. Academic LMS (Homework, Tests, Marks, Announcements)
app.get('/api/lms/assignments', authMiddleware, (req: AuthRequest, res: Response) => {
  const { batchId } = req.query;
  let result = [...db.assignments];
  if (batchId) result = result.filter(a => a.batchId === batchId);
  res.json(result);
});

app.post('/api/lms/assignments', authMiddleware, (req: AuthRequest, res: Response) => {
  const { batchId, subjectId, title, description, dueDate } = req.body;
  const batch = db.batches.find(b => b.id === batchId);
  const subject = db.subjects.find(s => s.id === subjectId);

  const newAssignment = {
    id: `HW-${Date.now()}`,
    batchId,
    batchName: batch ? batch.name : 'Class Batch',
    subjectId,
    subjectName: subject ? subject.name : 'Subject',
    teacherId: req.user.id,
    teacherName: req.user.name,
    title: title.trim(),
    description: description || '',
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    assignedDate: new Date().toISOString().split('T')[0],
    totalSubmissions: 0
  };

  db.assignments.unshift(newAssignment);
  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'ASSIGNMENT_CREATED', 'BATCH', newAssignment.id, `Created assignment ${title} for ${newAssignment.batchName}`);

  res.status(201).json(newAssignment);
});

app.get('/api/lms/test-scores', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json(db.testScores);
});

app.post('/api/lms/test-scores', authMiddleware, (req: AuthRequest, res: Response) => {
  const { testName, batchId, subjectId, fullMarks, passMarks, studentScores } = req.body;
  const newTest = {
    id: `TEST-${Date.now()}`,
    testName: testName.trim(),
    batchId,
    subjectId,
    date: new Date().toISOString().split('T')[0],
    fullMarks: Number(fullMarks) || 50,
    passMarks: Number(passMarks) || 20,
    studentScores: Array.isArray(studentScores) ? studentScores : []
  };

  db.testScores.unshift(newTest);
  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'TEST_SCORES_RECORDED', 'BATCH', newTest.id, `Recorded test scores for ${testName}`);

  res.status(201).json(newTest);
});

// Announcements
app.get('/api/announcements', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json(db.announcements);
});

app.post('/api/announcements', authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, content, targetAudience, targetGrade, isImportant } = req.body;
  const newAnnouncement = {
    id: `ANN-${Date.now()}`,
    title: title.trim(),
    content: content.trim(),
    authorName: req.user.name,
    authorRole: req.user.role,
    targetAudience: targetAudience || 'ALL',
    targetGrade,
    publishedAt: new Date().toISOString(),
    isImportant: Boolean(isImportant)
  };

  db.announcements.unshift(newAnnouncement);
  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'ANNOUNCEMENT_POSTED', 'SETTING', newAnnouncement.id, `Posted announcement: ${title}`);

  res.status(201).json(newAnnouncement);
});

// 11. Audit Logs
app.get('/api/audit-logs', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.auditLogs);
});

// 12. Settings & Portal Backups
app.get('/api/settings', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json(db.settings);
});

app.put('/api/settings', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  db.settings = {
    ...db.settings,
    ...req.body
  };
  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'SETTINGS_UPDATED', 'SETTING', 'PORTAL', 'Updated portal settings and configuration.');

  res.json(db.settings);
});

// Generate Full JSON Backup
app.get('/api/backup/export', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  const backupPayload = {
    version: '1.0.0',
    centre: 'Axis Learning Tuition & Coaching Centre',
    exportedAt: new Date().toISOString(),
    exportedBy: req.user.name,
    data: db
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="axis-portal-backup-${new Date().toISOString().split('T')[0]}.json"`);
  res.send(JSON.stringify(backupPayload, null, 2));
});

// Restore from JSON Backup
app.post('/api/backup/restore', authMiddleware, requireSuperAdmin, (req: AuthRequest, res: Response) => {
  const { backupData } = req.body;
  if (!backupData || !backupData.data || !Array.isArray(backupData.data.users) || !Array.isArray(backupData.data.students)) {
    return res.status(400).json({ error: 'Invalid backup file structure. Mandatory database entities missing.' });
  }

  db = backupData.data;
  saveDb();

  logAudit(req.user.id, req.user.name, req.user.role, 'DATABASE_RESTORED', 'BACKUP', 'PORTAL', `Restored database from backup file dated ${backupData.exportedAt || 'Unknown'}`);

  res.json({ success: true, message: 'Database restored successfully!' });
});

// 13. Google Sheets & Excel Live Database Integration
app.get('/api/sheets/live-status', async (req: Request, res: Response) => {
  const url = db.settings.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) {
    return res.json({ connected: false, message: 'Google Apps Script URL is not configured yet.' });
  }

  try {
    const response = await fetch(url + '?action=ping');
    const data = await response.json();
    return res.json({
      connected: true,
      data,
      url,
      excelDownloadUrl: data.excelDownloadUrl || `${url}?action=getExcelUrl`
    });
  } catch (err: any) {
    return res.json({
      connected: false,
      error: err.message,
      url
    });
  }
});

app.post('/api/sheets/sync-all', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  const url = db.settings.googleAppsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) {
    return res.status(400).json({ error: 'Google Apps Script URL is not configured.' });
  }

  try {
    const syncRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        apiKey: db.settings.googleAppsScriptApiKey || 'AXIS_KTM_SECURE_KEY_2026',
        action: 'syncStudents',
        data: db.students
      })
    });
    const result = await syncRes.json();
    
    logAudit(req.user.id, req.user.name, req.user.role, 'SHEETS_SYNC', 'SETTING', 'SPREADSHEET', 'Synchronized student database with Google Sheets / Excel.');

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to push data to Google Sheets: ' + err.message });
  }
});

// Health & Apps Script Webhook Test endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    app: 'Axis Learning Management Portal',
    time: new Date().toISOString(),
    timeZone: 'Asia/Kathmandu',
    activeStudents: db.students.filter(s => s.status === 'ACTIVE').length,
    activeTeachers: db.users.filter(u => u.isActive).length
  });
});

// Vite Middleware for Development / Static files for Production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Axis Learning Management Portal running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
