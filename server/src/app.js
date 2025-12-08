const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Import faculty and student data
const { facultyData, studentsData } = require('./data/facultyData');
const { generateDates } = require('./generateFacultySheets');

const app = express();
const PORT = process.env.PORT || 3000;

// Directory to store attendance sheets
const SHEETS_DIR = path.join(__dirname, '../attendance_sheets');
if (!fs.existsSync(SHEETS_DIR)) {
  fs.mkdirSync(SHEETS_DIR, { recursive: true });
}

// Get filename for a faculty's sheet
function getFacultySheetPath(faculty) {
  const fileName = `${faculty.id}_${faculty.semester.replace('-', '_')}_${faculty.subject.replace(/\s+/g, '_')}.xlsx`;
  return {
    fileName,
    filePath: path.join(SHEETS_DIR, fileName)
  };
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));
// Serve attendance sheets for download
app.use('/sheets', express.static(SHEETS_DIR));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only Excel files are allowed'));
    }
    cb(null, true);
  }
});

// =====================================================
// FACULTY AUTHENTICATION ROUTES
// =====================================================

// Get list of faculty (without passwords)
app.get('/api/faculty/list', (req, res) => {
  const publicFacultyList = facultyData.map(f => ({
    id: f.id,
    name: f.name,
    semester: f.semester,
    subject: f.subject,
    department: f.department
  }));
  
  res.json({
    success: true,
    data: publicFacultyList
  });
});

// Faculty login
app.post('/api/faculty/login', (req, res) => {
  const { facultyId, password } = req.body;
  
  const faculty = facultyData.find(f => f.id === facultyId);
  
  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: 'Faculty not found'
    });
  }
  
  if (faculty.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password'
    });
  }
  
  // Return faculty info (without password)
  res.json({
    success: true,
    message: 'Login successful',
    faculty: {
      id: faculty.id,
      name: faculty.name,
      semester: faculty.semester,
      subject: faculty.subject,
      department: faculty.department
    }
  });
});

// Get students for a semester
app.get('/api/students/:semester', (req, res) => {
  const semester = req.params.semester;
  const students = studentsData[semester] || [];
  
  res.json({
    success: true,
    semester: semester,
    data: students
  });
});

// Get attendance data from faculty's sheet for a specific date
app.get('/api/attendance/load/:facultyId/:date', (req, res) => {
  try {
    const { facultyId, date } = req.params;
    const faculty = facultyData.find(f => f.id === facultyId);
    
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    
    const { filePath, fileName } = getFacultySheetPath(faculty);
    
    if (!fs.existsSync(filePath)) {
      return res.json({
        success: true,
        exists: false,
        message: 'Sheet not found. Run generateFacultySheets.js first.',
        attendance: {}
      });
    }
    
    // Read the sheet
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    // Find the date column and extract attendance
    const attendance = {};
    data.forEach(row => {
      const rollNo = row['Roll No'];
      if (rollNo && row[date] !== undefined) {
        attendance[rollNo] = row[date] || '';
      }
    });
    
    res.json({
      success: true,
      exists: true,
      date: date,
      attendance: attendance,
      fileName: fileName
    });
    
  } catch (error) {
    console.error('Error loading attendance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save attendance data - update the exact cells in the sheet
app.post('/api/attendance/save', (req, res) => {
  try {
    const { facultyId, date, attendance } = req.body;
    
    const faculty = facultyData.find(f => f.id === facultyId);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    
    const { filePath, fileName } = getFacultySheetPath(faculty);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sheet not found. Run generateFacultySheets.js first.' 
      });
    }
    
    // Read existing workbook
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to array of arrays to find column index
    const sheetData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = sheetData[0];
    
    // Find the date column index
    const dateColIndex = headers.indexOf(date);
    if (dateColIndex === -1) {
      return res.status(400).json({ 
        success: false, 
        message: `Date column "${date}" not found in sheet. Valid dates: Dec 08 - Apr 30` 
      });
    }
    
    // Find Roll No column index
    const rollNoColIndex = headers.indexOf('Roll No');
    
    // Update attendance for each student
    attendance.forEach(att => {
      // Find the row for this student
      for (let i = 1; i < sheetData.length; i++) {
        if (sheetData[i][rollNoColIndex] === att.rollNo) {
          // Update the attendance cell
          sheetData[i][dateColIndex] = att.status; // 'P' or 'A'
          
          // Recalculate totals
          let present = 0, absent = 0, total = 0;
          for (let j = 3; j < headers.length - 3; j++) { // Skip first 3 and last 3 columns
            const val = sheetData[i][j];
            if (val === 'P') { present++; total++; }
            else if (val === 'A') { absent++; total++; }
          }
          
          // Update totals (last 3 columns)
          const totalPresentIdx = headers.indexOf('Total Present');
          const totalAbsentIdx = headers.indexOf('Total Absent');
          const percentageIdx = headers.indexOf('Percentage');
          
          if (totalPresentIdx !== -1) sheetData[i][totalPresentIdx] = present;
          if (totalAbsentIdx !== -1) sheetData[i][totalAbsentIdx] = absent;
          if (percentageIdx !== -1) sheetData[i][percentageIdx] = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : '0%';
          
          break;
        }
      }
    });
    
    // Create new worksheet from updated data
    const newWorksheet = xlsx.utils.aoa_to_sheet(sheetData);
    
    // Preserve column widths
    newWorksheet['!cols'] = worksheet['!cols'];
    
    // Replace the worksheet
    workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;
    
    // Save the file
    xlsx.writeFile(workbook, filePath);
    
    res.json({
      success: true,
      message: `Attendance saved for ${date}`,
      fileName: fileName,
      sheetUrl: `/sheets/${fileName}`,
      updatedCount: attendance.length
    });
    
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving attendance',
      error: error.message
    });
  }
});

// Get attendance sheet info for a faculty
app.get('/api/attendance/sheet/:facultyId', (req, res) => {
  const facultyId = req.params.facultyId;
  const faculty = facultyData.find(f => f.id === facultyId);
  
  if (!faculty) {
    return res.status(404).json({ success: false, message: 'Faculty not found' });
  }
  
  const { fileName, filePath } = getFacultySheetPath(faculty);
  
  if (fs.existsSync(filePath)) {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    res.json({
      success: true,
      exists: true,
      sheetUrl: `/sheets/${fileName}`,
      fileName: fileName,
      data: data
    });
  } else {
    res.json({
      success: true,
      exists: false,
      message: 'No attendance sheet found. Start marking attendance to create one.'
    });
  }
});

// Helper function to encode sensitive data (Base64)
function encodeSensitiveData(data) {
  return Buffer.from(String(data)).toString('base64');
}

// Use generateDates from generateFacultySheets module
const attendanceDates = generateDates();

// Mock data endpoint (for testing without file upload)
app.get('/api/mock-attendance', (req, res) => {
  const students = [
    { rollNo: '23091A3201', name: 'Rahul Sharma' },
    { rollNo: '23091A3202', name: 'Priya Patel' },
    { rollNo: '23091A3210', name: 'Amit Kumar' },
    { rollNo: '23091A3225', name: 'Sneha Reddy' },
    { rollNo: '23091A3250', name: 'Vikram Singh' },
    { rollNo: '23091A3275', name: 'Kavya Nair' },
    { rollNo: '23091A3299', name: 'Arjun Mehta' }
  ];

  const absenceReasons = [
    'Medical - Doctor appointment',
    'Family emergency',
    'Illness - Fever',
    'Personal reasons',
    'Sports competition'
  ];

  const mockData = students.map(student => {
    const dateAttendance = {};
    let presentCount = 0;
    let absentCount = 0;

    // Generate random attendance for each date
    attendanceDates.forEach(date => {
      const isPresent = Math.random() > 0.15; // 85% attendance
      dateAttendance[date] = isPresent ? 'P' : 'A';
      if (isPresent) presentCount++; else absentCount++;
    });

    return {
      StudentRollNo: student.rollNo,
      StudentName: student.name,
      dateAttendance: dateAttendance,
      TotalPresent: presentCount,
      TotalAbsent: absentCount,
      Percentage: ((presentCount / attendanceDates.length) * 100).toFixed(1) + '%',
      AbsenceReason: encodeSensitiveData(
        absentCount > 0 ? absenceReasons[Math.floor(Math.random() * absenceReasons.length)] : 'N/A - No absences'
      ),
      ParentContacted: absentCount > 3
    };
  });

  res.json({
    success: true,
    data: mockData,
    dates: attendanceDates,
    message: 'Mock attendance data loaded successfully (Dec 8 - Apr 30)'
  });
});

// Upload and parse Excel file endpoint
app.post('/api/upload-attendance', upload.single('attendanceFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    // Extract date columns (columns that match date pattern like "08-Dec")
    const firstRow = jsonData[0] || {};
    const datePattern = /^\d{2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/i;
    const dateColumns = Object.keys(firstRow).filter(key => datePattern.test(key));

    // Process data - calculate totals from faculty-filled P/A values
    const processedData = jsonData.map(row => {
      const dateAttendance = {};
      let presentCount = 0;
      let absentCount = 0;
      let filledCount = 0;

      // Extract date-wise attendance (faculty fills P or A)
      dateColumns.forEach(date => {
        const status = String(row[date] || '').toUpperCase().trim();
        if (status === 'P') {
          dateAttendance[date] = 'P';
          presentCount++;
          filledCount++;
        } else if (status === 'A') {
          dateAttendance[date] = 'A';
          absentCount++;
          filledCount++;
        } else {
          dateAttendance[date] = ''; // Keep blank if not filled
        }
      });

      // Calculate percentage based on filled days only
      const percentage = filledCount > 0 
        ? ((presentCount / filledCount) * 100).toFixed(1) + '%' 
        : '0%';

      return {
        StudentRollNo: row.StudentRollNo || row['Roll No'] || row['RollNo'] || 'Unknown',
        StudentName: row.StudentName || row['Student Name'] || row['Name'] || 'Unknown',
        dateAttendance: dateAttendance,
        TotalPresent: presentCount,
        TotalAbsent: absentCount,
        TotalDays: filledCount,
        Percentage: percentage,
        AbsenceReason: encodeSensitiveData(
          row.AbsenceReason || row['Absence Reason'] || row['Reason'] || 'N/A'
        ),
        ParentContacted: row.ParentContacted === 'Yes' || 
                         row['Parent Contacted'] === 'Yes' ||
                         row.ParentContacted === true ||
                         absentCount > 3
      };
    });

    res.json({
      success: true,
      data: processedData,
      dates: dateColumns,
      message: `Attendance data uploaded successfully. ${processedData.length} students, ${dateColumns.length} dates.`
    });

  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing attendance file',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Student Attendance Server is running!`);
  console.log(`========================================`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Mock Data API: http://localhost:${PORT}/api/mock-attendance`);
  console.log(`Upload API: POST http://localhost:${PORT}/api/upload-attendance`);
  console.log(`========================================\n`);
});