/**
 * Full copyable source of AxisBackend.gs for the Settings View
 */
export const AXIS_APPS_SCRIPT_SOURCE = `/**
 * AXIS LEARNING MANAGEMENT PORTAL - GOOGLE APPS SCRIPT BACKEND & EXCEL DATABASE
 * 
 * Free-tier Google Sheets & Excel database backend for Axis Learning (Butwal Shitalnagar, Nepal)
 * 
 * Capabilities:
 * - Live Google Sheets / Excel database engine (reads & writes all portal entities)
 * - doGet(e): ?action=getAllData returns complete normalized database in JSON for Vercel/Web clients
 * - doGet(e): ?action=getExcelUrl returns direct Microsoft Excel (.xlsx) download link
 * - doPost(e): concurrency control via LockService.getScriptLock(10000) (prevents write collisions)
 * - Automated absence notification emails to guardians via MailApp.sendEmail (100 free/day on @gmail.com)
 * - Automated Month-End Teacher Reminder triggers (Asia/Butwal Shitalnagar timezone)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheets (or upload your existing Excel file to Google Drive and open as Google Sheets).
 * 2. Click "Extensions" -> "Apps Script".
 * 3. Delete existing code, paste this entire file, and click Save (Floppy disk icon).
 * 4. Run initializeDatabase() once from the editor to build all tables with bold header rows.
 * 5. Run installScheduledTriggers() to schedule automated 25th & month-end teacher reminders.
 * 6. Click "Deploy" -> "New deployment" -> Select type "Web app".
 *    - Description: "Axis Learning Portal API"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone"
 * 7. Copy the Web App URL (e.g. https://script.google.com/macros/s/.../exec).
 * 8. Set this URL as VITE_GOOGLE_APPS_SCRIPT_URL on Vercel or in Portal Settings!
 */

var CONFIG = {
  API_KEY: 'AXIS_KTM_SECURE_KEY_2026',
  CENTRE_NAME: 'Axis Learning Tuition & Coaching Centre',
  PHONE: '+977-1-4412345',
  EMAIL: 'contact@axislearning.edu.np',
  TIMEZONE: 'Asia/Butwal Shitalnagar'
};

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';

    if (action === 'getAllData') {
      var data = readAllDatabaseData(ss);
      return createJsonResponse({
        success: true,
        data: data,
        time: new Date().toISOString()
      });
    }

    if (action === 'getExcelUrl') {
      var excelUrl = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=xlsx';
      return createJsonResponse({
        success: true,
        excelDownloadUrl: excelUrl,
        spreadsheetUrl: ss.getUrl()
      });
    }

    return createJsonResponse({
      status: 'ONLINE',
      service: 'Axis Learning Management Portal (Excel & Google Sheets Database)',
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      excelDownloadUrl: 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=xlsx',
      time: new Date().toISOString(),
      timezone: CONFIG.TIMEZONE
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: 'Lock timeout: The spreadsheet is currently busy processing another write operation. Please retry.'
    });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: 'No POST payload received.' });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;
    var result;

    switch (action) {
      case 'ping':
        result = { status: 'ONLINE', time: new Date().toISOString() };
        break;
      case 'recordAttendance':
        result = handleRecordAttendance(data);
        break;
      case 'createStudent':
        result = handleCreateStudent(data);
        break;
      case 'syncStudents':
        result = handleSyncStudents(data);
        break;
      case 'recordPayment':
        result = handleRecordPayment(data);
        break;
      case 'recordExpense':
        result = handleRecordExpense(data);
        break;
      case 'sendAbsenceNotice':
        result = handleSendAbsenceNotice(data);
        break;
      case 'runMonthEndReminders':
        result = runMonthEndRemindersJob();
        break;
      default:
        return createJsonResponse({ success: false, error: 'Unsupported action: ' + action });
    }

    return createJsonResponse({
      success: true,
      result: result
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

function readAllDatabaseData(ss) {
  var getRows = function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];
    var headers = values[0];
    var results = [];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        var key = String(headers[c]).replace(/\\s+/g, '');
        obj[key] = row[c];
      }
      results.push(obj);
    }
    return results;
  };

  return {
    students: getRows('Students'),
    teachers: getRows('Teachers'),
    batches: getRows('Batches'),
    attendanceSessions: getRows('AttendanceSessions'),
    attendanceRecords: getRows('AttendanceRecords'),
    invoices: getRows('FeeInvoices'),
    payments: getRows('FeePayments'),
    expenses: getRows('Expenses'),
    auditLogs: getRows('AuditLogs')
  };
}

function initializeDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var schemas = {
    'Students': ['ID', 'FullName', 'Grade', 'Stream', 'Batches', 'GuardianName', 'GuardianPhone', 'GuardianEmail', 'GuardianRelation', 'Address', 'AdmissionDate', 'Status', 'Notes', 'CreatedAt'],
    'Teachers': ['ID', 'Name', 'Email', 'Role', 'Phone', 'Designation', 'AssignedSubjects', 'AssignedBatches', 'IsActive'],
    'Batches': ['BatchID', 'BatchName', 'Grade', 'Stream', 'AcademicYear', 'PrimaryTeacherID', 'ScheduleDays', 'StartTime', 'EndTime', 'Room', 'MaxCapacity'],
    'AttendanceSessions': ['SessionID', 'BatchID', 'BatchName', 'SubjectName', 'Date', 'StartTime', 'EndTime', 'TeacherName', 'SubmittedAt', 'IsEdited', 'EditReason', 'Status'],
    'AttendanceRecords': ['RecordID', 'SessionID', 'StudentID', 'StudentName', 'Status', 'Remarks', 'Date'],
    'FeeInvoices': ['InvoiceID', 'InvoiceNumber', 'StudentID', 'StudentName', 'Grade', 'Month', 'TuitionFee', 'Discount', 'NetPayable', 'PaidAmount', 'DueAmount', 'Status'],
    'FeePayments': ['PaymentID', 'ReceiptNumber', 'InvoiceID', 'StudentName', 'Amount', 'Date', 'PaymentMethod', 'ReferenceNumber', 'ReceivedBy'],
    'Expenses': ['ExpenseID', 'Category', 'Amount', 'Date', 'Description', 'PaymentMethod', 'EnteredBy', 'ReceiptNumber'],
    'AuditLogs': ['LogID', 'UserID', 'UserName', 'Role', 'Action', 'EntityType', 'EntityID', 'Details', 'Timestamp']
  };

  for (var sheetName in schemas) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    var headers = schemas[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
}

function handleRecordAttendance(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sessSheet = ss.getSheetByName('AttendanceSessions');
  var recSheet = ss.getSheetByName('AttendanceRecords');

  if (!sessSheet || !recSheet) {
    initializeDatabase();
    sessSheet = ss.getSheetByName('AttendanceSessions');
    recSheet = ss.getSheetByName('AttendanceRecords');
  }

  sessSheet.appendRow([
    data.sessionId,
    data.batchId,
    data.batchName,
    data.subjectName,
    data.date,
    data.startTime,
    data.endTime,
    data.teacherName,
    new Date().toISOString(),
    false,
    '',
    'SUBMITTED'
  ]);

  if (data.records && data.records.length > 0) {
    var rows = data.records.map(function(r) {
      return [
        'REC-' + Utilities.getUuid(),
        data.sessionId,
        r.studentId,
        r.studentName,
        r.status,
        r.remarks || '',
        data.date
      ];
    });
    recSheet.getRange(recSheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  return { sessionId: data.sessionId, totalRecords: data.records.length };
}

function handleCreateStudent(s) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Students');
  if (!sheet) {
    initializeDatabase();
    sheet = ss.getSheetByName('Students');
  }

  sheet.appendRow([
    s.id,
    s.fullName,
    s.grade,
    s.stream || 'General',
    Array.isArray(s.batchIds) ? s.batchIds.join('; ') : (s.batchIds || ''),
    s.guardianName,
    s.guardianPhone,
    s.guardianEmail || '',
    s.guardianRelation || 'Guardian',
    s.address || 'Butwal Shitalnagar',
    s.admissionDate || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd'),
    s.status || 'ACTIVE',
    s.notes || '',
    new Date().toISOString()
  ]);

  return { studentId: s.id };
}

function handleRecordPayment(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('FeePayments');
  if (!sheet) {
    initializeDatabase();
    sheet = ss.getSheetByName('FeePayments');
  }

  sheet.appendRow([
    data.paymentId,
    data.receiptNumber,
    data.invoiceId,
    data.studentName,
    data.amount,
    data.paymentDate,
    data.paymentMethod,
    data.referenceNumber || '',
    data.receivedBy
  ]);

  return { paymentId: data.paymentId, receiptNumber: data.receiptNumber };
}

function handleRecordExpense(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Expenses');
  if (!sheet) {
    initializeDatabase();
    sheet = ss.getSheetByName('Expenses');
  }

  sheet.appendRow([
    data.id || ('EXP-' + Date.now()),
    data.category,
    data.amount,
    data.expenseDate || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd'),
    data.description,
    data.paymentMethod,
    data.enteredBy,
    data.receiptNumber || ''
  ]);

  return { expenseId: data.id };
}

function handleSendAbsenceNotice(data) {
  if (!data.guardianEmail || data.guardianEmail.indexOf('@') === -1) {
    return { status: 'FAILED', reason: 'Invalid or missing guardian email' };
  }

  var subject = 'Absence Alert: ' + data.studentName + ' - ' + CONFIG.CENTRE_NAME;
  var body = 'Dear ' + (data.guardianName || 'Guardian') + ',\\n\\n' +
    'This is an automated notification from Axis Learning Management Portal.\\n\\n' +
    'Your ward, ' + data.studentName + ', was marked ABSENT for ' + data.subjectName + ' (' + data.batchName + ') on ' + data.date + '.\\n\\n' +
    'Consistent attendance is essential for academic progress. If this absence was pre-arranged or if you have questions, please reach out to our office.\\n\\n' +
    'Axis Learning Tuition & Coaching Centre\\n' +
    'Contact: ' + CONFIG.PHONE + ' | ' + CONFIG.EMAIL + '\\n' +
    'Butwal Shitalnagar, Nepal';

  try {
    MailApp.sendEmail({
      to: data.guardianEmail,
      subject: subject,
      body: body
    });
    return { status: 'SENT', timestamp: new Date().toISOString() };
  } catch (err) {
    return { status: 'FAILED', error: err.toString() };
  }
}

function handleSyncStudents(students) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Students');
  if (!sheet) {
    initializeDatabase();
    sheet = ss.getSheetByName('Students');
  }
  
  if (!Array.isArray(students) || students.length === 0) return { count: 0 };

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }

  var rows = students.map(function(s) {
    return [
      s.id,
      s.fullName,
      s.grade,
      s.stream || 'General',
      Array.isArray(s.batchIds) ? s.batchIds.join('; ') : (s.batchIds || ''),
      s.guardianName,
      s.guardianPhone,
      s.guardianEmail || '',
      s.guardianRelation || 'Guardian',
      s.address || 'Butwal Shitalnagar',
      s.admissionDate,
      s.status,
      s.notes || '',
      s.createdAt || new Date().toISOString()
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return { syncedCount: rows.length };
}

function runMonthEndRemindersJob() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var teacherSheet = ss.getSheetByName('Teachers');
  var sessSheet = ss.getSheetByName('AttendanceSessions');

  if (!teacherSheet || !sessSheet) return { error: 'Sheets not found' };

  var teachers = teacherSheet.getDataRange().getValues();
  var sessions = sessSheet.getDataRange().getValues();

  var now = new Date();
  var currentMonthStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM');
  var results = [];

  for (var i = 1; i < teachers.length; i++) {
    var teacherName = teachers[i][1];
    var teacherEmail = teachers[i][2];
    var isActive = teachers[i][8];

    if (!isActive || !teacherEmail || teacherEmail.indexOf('@') === -1) continue;

    var submittedCount = 0;
    for (var j = 1; j < sessions.length; j++) {
      var sessTeacher = sessions[j][7];
      var sessDate = String(sessions[j][4]);
      if (sessTeacher === teacherName && sessDate.indexOf(currentMonthStr) === 0) {
        submittedCount++;
      }
    }

    var expectedSessions = 10;
    if (submittedCount < expectedSessions) {
      var missing = expectedSessions - submittedCount;
      var subject = 'Monthly Attendance Reminder: ' + missing + ' Sessions Missing (' + currentMonthStr + ')';
      var body = 'Dear ' + teacherName + ',\\n\\n' +
        'This is a friendly month-end reminder from Axis Learning Management.\\n\\n' +
        'Our records indicate you have ' + submittedCount + ' submitted sessions out of ~' + expectedSessions + ' expected for ' + currentMonthStr + '.\\n' +
        'Please complete and submit your class attendance records in the portal before month-end closure.\\n\\n' +
        'Warm regards,\\nAcademic Administration';

      try {
        MailApp.sendEmail(teacherEmail, subject, body);
        results.push({ teacher: teacherName, status: 'REMINDER_SENT', missing: missing });
      } catch (err) {
        results.push({ teacher: teacherName, status: 'FAILED', error: err.toString() });
      }
    }
  }

  return { month: currentMonthStr, results: results };
}

function installScheduledTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'runMonthEndRemindersJob') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('runMonthEndRemindersJob')
    .timeBased()
    .onMonthDay(25)
    .atHour(17)
    .inTimezone(CONFIG.TIMEZONE)
    .create();

  ScriptApp.newTrigger('runMonthEndRemindersJob')
    .timeBased()
    .onMonthDay(28)
    .atHour(18)
    .inTimezone(CONFIG.TIMEZONE)
    .create();
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Axis Learning Portal')
    .addItem('Initialize All Database Tables', 'initializeDatabase')
    .addItem('Install Month-End Reminder Triggers', 'installScheduledTriggers')
    .addItem('Test Run Reminders Job', 'runMonthEndRemindersJob')
    .addToUi();
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
