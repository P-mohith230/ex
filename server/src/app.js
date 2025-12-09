const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Import faculty and student data
const { facultyData, studentsData, adminData } = require('./data/facultyData');
const { generateDates } = require('./generateFacultySheets');

// Function to load subjects data (reload from file each time)
function loadSubjects() {
  const subjectsDataPath = path.join(__dirname, 'subjectsData.js');
  delete require.cache[require.resolve('./subjectsData')];
  return require('./subjectsData');
}

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
  console.log('👥 Faculty list request received');
  // Get unique faculty by ID (deduplicate)
  const uniqueFacultyMap = new Map();
  
  facultyData.forEach(f => {
    if (!uniqueFacultyMap.has(f.id)) {
      uniqueFacultyMap.set(f.id, {
        id: f.id,
        name: f.name,
        department: f.department
      });
    }
  });
  
  const publicFacultyList = Array.from(uniqueFacultyMap.values());
  
  res.json({
    success: true,
    data: publicFacultyList
  });
});

// Get full faculty list with subjects and semesters (for admin pages)
app.get('/api/faculty/full-list', (req, res) => {
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

// =====================================================
// ADMIN ROUTES
// =====================================================

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { adminId, password } = req.body;
  console.log('Admin login attempt:', { adminId, passwordLength: password?.length });
  console.log('Available admin accounts:', adminData.map(a => ({ id: a.id, name: a.name })));
  
  const admin = adminData.find(a => a.id === adminId);
  
  if (!admin) {
    console.log('Admin not found:', adminId);
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }
  
  if (admin.password !== password) {
    console.log('Invalid password for admin:', adminId);
    return res.status(401).json({
      success: false,
      message: 'Invalid password'
    });
  }
  
  console.log('Admin login successful:', { id: admin.id, name: admin.name, role: admin.role });
  res.json({
    success: true,
    message: 'Login successful',
    admin: {
      id: admin.id,
      name: admin.name,
      role: admin.role
    }
  });
});

// Get all faculty sheets data for admin
app.get('/api/admin/all-sheets', (req, res) => {
  console.log('📊 Admin all-sheets request received');
  try {
    const sheetsData = {};
    let totalStudents = 0;
    let totalSheets = 0;
    
    facultyData.forEach(faculty => {
      const { filePath, fileName } = getFacultySheetPath(faculty);
      
      // Create unique key using faculty id, semester, and subject
      const key = `${faculty.id}_${faculty.semester}_${faculty.subject}`;
      
      if (fs.existsSync(filePath)) {
        totalSheets++;
        const workbook = xlsx.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        // Store full row data for date-specific analysis
        sheetsData[key] = {
          fileName,
          students: data, // Store complete row data with all date columns
          facultyInfo: {
            id: faculty.id,
            name: faculty.name,
            semester: faculty.semester,
            subject: faculty.subject
          }
        };
        
        totalStudents += data.length;
      } else {
        sheetsData[key] = {
          fileName: null,
          students: [],
          facultyInfo: {
            id: faculty.id,
            name: faculty.name,
            semester: faculty.semester,
            subject: faculty.subject
          }
        };
      }
    });
    
    res.json({
      success: true,
      totalSheets,
      totalStudents,
      data: sheetsData
    });
    
  } catch (error) {
    console.error('Error loading sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading attendance data',
      error: error.message
    });
  }
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

// Get students assigned to a specific faculty from their attendance sheet
app.get('/api/students/faculty/:facultyId', (req, res) => {
  try {
    const facultyId = req.params.facultyId;
    const { semester, subject } = req.query;
    
    // Find the specific faculty entry
    let faculty;
    if (semester && subject) {
      faculty = facultyData.find(f => 
        f.id === facultyId && f.semester === semester && f.subject === subject
      );
    } else {
      faculty = facultyData.find(f => f.id === facultyId);
    }
    
    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Faculty not found' 
      });
    }
    
    const { filePath } = getFacultySheetPath(faculty);
    
    // Check if sheet exists
    if (!fs.existsSync(filePath)) {
      return res.json({
        success: false,
        message: 'Attendance sheet not found. Please contact admin to generate sheets.',
        data: []
      });
    }
    
    // Read the Excel sheet and extract student list
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetData = xlsx.utils.sheet_to_json(worksheet);
    
    // Extract students (Roll No and Name columns)
    const students = sheetData.map(row => ({
      rollNo: row['Roll No'] || row['RollNo'] || '',
      name: row['Name'] || row['Student Name'] || ''
    })).filter(s => s.rollNo && s.name); // Filter out empty rows
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
    
  } catch (error) {
    console.error('Error reading faculty sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading attendance sheet',
      error: error.message
    });
  }
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
  const { semester, subject } = req.query;
  
  // If semester and subject are provided, find the specific faculty entry
  let faculty;
  if (semester && subject) {
    faculty = facultyData.find(f => 
      f.id === facultyId && f.semester === semester && f.subject === subject
    );
  } else {
    // Fallback to first match (backward compatibility)
    faculty = facultyData.find(f => f.id === facultyId);
  }
  
  if (!faculty) {
    return res.status(404).json({ 
      success: false, 
      message: 'Faculty not found',
      details: { facultyId, semester, subject }
    });
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

// Generate Combined Report API
// Generate combined attendance report for a specific subject
app.post('/api/admin/generate-subject-report', (req, res) => {
  try {
    console.log('📊 Received subject report generation request:', req.body);
    const { semester, subject } = req.body;
    
    if (!semester || !subject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Semester and subject are required' 
      });
    }

    // Find all faculty teaching this subject in this semester
    const subjectFaculty = facultyData.filter(f => 
      f.semester === semester && f.subject === subject
    );
    
    console.log(`Found ${subjectFaculty.length} faculty teaching ${subject} in ${semester}`);
    
    if (subjectFaculty.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No faculty found teaching ${subject} in ${semester}`
      });
    }

    // Collect all student data from all faculty teaching this subject
    const allStudentData = {};
    let totalClassesConducted = 0;
    const dateColumns = new Set();

    subjectFaculty.forEach(faculty => {
      const { filePath, fileName } = getFacultySheetPath(faculty);
      console.log(`Checking faculty ${faculty.name} file: ${fileName}`);
      
      if (fs.existsSync(filePath)) {
        try {
          const facultyWorkbook = xlsx.readFile(filePath);
          const worksheet = facultyWorkbook.Sheets[facultyWorkbook.SheetNames[0]];
          const data = xlsx.utils.sheet_to_json(worksheet);
          console.log(`Read ${data.length} students from ${faculty.name}'s sheet`);
          
          if (data.length > 0) {
            // Get all date columns from this sheet
            const headers = Object.keys(data[0]);
            const dates = headers.filter(h => 
              !['Roll No', 'Student Name', 'Total Present', 'Total Absent', 'Percentage'].includes(h)
            );
            dates.forEach(date => dateColumns.add(date));
            
            // Process each student
            data.forEach(student => {
              const rollNo = student['Roll No'];
              const studentName = student['Student Name'];
              
              if (!rollNo) return;
              
              // Initialize student data if not exists
              if (!allStudentData[rollNo]) {
                allStudentData[rollNo] = {
                  'Roll No': rollNo,
                  'Student Name': studentName,
                  attendance: {},
                  totalPresent: 0,
                  totalAbsent: 0
                };
              }
              
              // Add attendance data from this faculty
              dates.forEach(date => {
                const status = student[date];
                if (status === 'P') {
                  allStudentData[rollNo].attendance[date] = 'P';
                  allStudentData[rollNo].totalPresent++;
                } else if (status === 'A') {
                  allStudentData[rollNo].attendance[date] = 'A';
                  allStudentData[rollNo].totalAbsent++;
                } else if (status) {
                  allStudentData[rollNo].attendance[date] = status;
                }
              });
            });
          }
        } catch (error) {
          console.error(`Error reading sheet for ${faculty.name}:`, error.message);
        }
      }
    });

    // Calculate total classes conducted (unique dates)
    totalClassesConducted = dateColumns.size;
    console.log(`Total unique classes conducted: ${totalClassesConducted}`);

    if (Object.keys(allStudentData).length === 0) {
      return res.status(404).json({
        success: false,
        message: `No attendance data found for ${subject}`
      });
    }

    // Convert to array and calculate statistics - SIMPLIFIED FORMAT
    const reportData = Object.values(allStudentData).map(student => {
      const totalClassesConducted = student.totalPresent + student.totalAbsent;
      const percentage = totalClassesConducted > 0 
        ? parseFloat(((student.totalPresent / totalClassesConducted) * 100).toFixed(2))
        : 0;
      
      return {
        'Roll No': student['Roll No'],
        'Student Name': student['Student Name'],
        'Classes Conducted': totalClassesConducted,
        'Classes Attended': student.totalPresent,
        'Attendance Percentage': percentage + '%'
      };
    });

    // Sort by roll number
    reportData.sort((a, b) => {
      const rollA = a['Roll No'].toString();
      const rollB = b['Roll No'].toString();
      return rollA.localeCompare(rollB);
    });

    console.log(`Generated consolidated report with ${reportData.length} students`);

    // Create workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(reportData);
    
    // Set column widths
    const colWidths = [
      { wch: 15 }, // Roll No
      { wch: 30 }, // Student Name
      { wch: 20 }, // Classes Conducted
      { wch: 20 }, // Classes Attended
      { wch: 22 }  // Attendance Percentage
    ];
    worksheet['!cols'] = colWidths;
    
    // Add worksheet
    const sheetName = `${semester}_${subject}`.substring(0, 31).replace(/[:\\\/?\*\[\]]/g, '_');
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    console.log(`✅ Buffer generated: ${buffer.length} bytes`);
    
    // Set response headers
    const fileName = `${subject.replace(/\s+/g, '_')}_${semester}_Combined_Report_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    console.log('📥 Sending file to client:', fileName);
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Error generating subject report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report: ' + error.message
    });
  }
});

app.post('/api/admin/generate-combined-report', (req, res) => {
  try {
    console.log('Received report generation request:', req.body);
    const { semesters } = req.body;
    
    if (!semesters || semesters.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please select at least one semester' 
      });
    }

    // Create a new workbook
    const workbook = xlsx.utils.book_new();
    let totalSheetsCreated = 0;

    // Process each semester
    semesters.forEach(semester => {
      console.log(`Processing semester: ${semester}`);
      // Get faculty for this semester
      const semesterFaculty = facultyData.filter(f => f.semester === semester);
      
      console.log(`Found ${semesterFaculty.length} faculty for semester ${semester}`);
      
      if (semesterFaculty.length === 0) {
        console.log(`No faculty found for semester ${semester}`);
        return;
      }

      // Create a separate sheet for each faculty in this semester
      semesterFaculty.forEach(faculty => {
        const { filePath, fileName } = getFacultySheetPath(faculty);
        console.log(`Checking file: ${fileName}`);
        
        if (fs.existsSync(filePath)) {
          try {
            console.log(`Reading file: ${fileName}`);
            const facultyWorkbook = xlsx.readFile(filePath);
            const worksheet = facultyWorkbook.Sheets[facultyWorkbook.SheetNames[0]];
            const data = xlsx.utils.sheet_to_json(worksheet);
            console.log(`Read ${data.length} rows from ${fileName}`);
            
            if (data.length > 0) {
              // Create a new worksheet for this faculty
              const newWorksheet = xlsx.utils.json_to_sheet(data);
              
              // Set column widths
              const headers = Object.keys(data[0]);
              const colWidths = headers.map(header => ({
                wch: Math.min(Math.max(header.length, 10), 25)
              }));
              newWorksheet['!cols'] = colWidths;
              
              // Create a clean sheet name (max 31 chars for Excel)
              let sheetName = `${semester}_${faculty.name}`;
              if (sheetName.length > 31) {
                sheetName = `${semester}_${faculty.id}`;
              }
              // Remove invalid characters
              sheetName = sheetName.replace(/[:\\\/\?\*\[\]]/g, '_');
              
              console.log(`Creating sheet: ${sheetName}`);
              
              // Add worksheet to workbook
              xlsx.utils.book_append_sheet(workbook, newWorksheet, sheetName);
              totalSheetsCreated++;
            }
          } catch (error) {
            console.error(`Error reading sheet for ${faculty.id}:`, error.message);
          }
        } else {
          console.log(`File not found: ${fileName}`);
        }
      });
    });

    // Check if any data was added
    console.log(`Total sheets created: ${totalSheetsCreated}`);
    console.log(`Workbook sheet names: ${workbook.SheetNames.join(', ')}`);
    
    if (workbook.SheetNames.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance data found for selected semesters'
      });
    }

    console.log('Generating Excel buffer...');
    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    console.log(`Buffer size: ${buffer.length} bytes`);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Combined_Attendance_Report_${Date.now()}.xlsx"`);
    
    console.log('Sending file to client...');
    // Send file
    res.send(buffer);
    console.log('Report sent successfully!');
    
  } catch (error) {
    console.error('Error generating combined report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
});

// =====================================================
// SUBJECTS MANAGEMENT ROUTES
// =====================================================

// Get subjects list for a semester
app.get('/api/subjects/list', (req, res) => {
  try {
    const { semester } = req.query;
    
    console.log('Get subjects list request for semester:', semester);
    
    // Reload subjects from file to get latest data
    const subjects = loadSubjects();
    console.log('Available subjects:', subjects);
    
    if (!semester) {
      console.log('Semester parameter missing');
      return res.status(400).json({
        success: false,
        message: 'Semester is required'
      });
    }
    
    const subjectsList = subjects[semester] || [];
    console.log('Returning subjects for', semester, ':', subjectsList);
    
    res.json({
      success: true,
      data: subjectsList
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects: ' + error.message
    });
  }
});

// Create a new subject
app.post('/api/subjects/create', (req, res) => {
  try {
    const { semester, subject } = req.body;
    
    console.log('Create subject request:', { semester, subject });
    
    // Reload subjects from file to get latest data
    const subjects = loadSubjects();
    console.log('Current subjects:', subjects);
    
    if (!semester || !subject) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Semester and subject name are required'
      });
    }
    
    // Check if subject already exists
    if (subjects[semester] && subjects[semester].includes(subject)) {
      console.log('Subject already exists');
      return res.status(400).json({
        success: false,
        message: 'Subject already exists for this semester'
      });
    }
    
    // Add subject to the list
    if (!subjects[semester]) {
      subjects[semester] = [];
    }
    subjects[semester].push(subject);
    
    console.log('Updated subjects:', subjects);
    
    // Save to file
    const subjectsDataPath = path.join(__dirname, 'subjectsData.js');
    const fileContent = `// Store subjects organized by semester
const subjects = ${JSON.stringify(subjects, null, 2)};

module.exports = subjects;
`;
    
    console.log('Writing to file:', subjectsDataPath);
    fs.writeFileSync(subjectsDataPath, fileContent, 'utf8');
    console.log('File written successfully');
    
    res.json({
      success: true,
      message: 'Subject created successfully',
      data: subjects[semester]
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating subject: ' + error.message
    });
  }
});

// Delete a subject
app.post('/api/subjects/delete', (req, res) => {
  try {
    const { semester, subject } = req.body;
    
    console.log('Delete subject request:', { semester, subject });
    
    if (!semester || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Semester and subject are required'
      });
    }
    
    // Reload subjects from file
    const subjects = loadSubjects();
    
    // Check if subject exists
    if (!subjects[semester] || !subjects[semester].includes(subject)) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Remove subject from the list
    subjects[semester] = subjects[semester].filter(s => s !== subject);
    
    // Save subjects to file
    const subjectsDataPath = path.join(__dirname, 'subjectsData.js');
    const fileContent = `// Store subjects organized by semester
const subjects = ${JSON.stringify(subjects, null, 2)};

module.exports = subjects;
`;
    fs.writeFileSync(subjectsDataPath, fileContent, 'utf8');
    
    console.log('Subject deleted successfully');
    
    // Now remove all faculty assignments for this subject
    const facultyToRemove = facultyData.filter(f => 
      f.semester === semester && f.subject === subject
    );
    
    console.log(`Found ${facultyToRemove.length} faculty assignments to remove`);
    
    // Remove faculty entries and delete their Excel files
    facultyToRemove.forEach(faculty => {
      // Delete the attendance sheet file if it exists
      const fileName = `${faculty.id}_${semester.replace('-', '_')}_${subject.replace(/\s+/g, '_')}.xlsx`;
      const filePath = path.join(SHEETS_DIR, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted attendance sheet: ${fileName}`);
      }
    });
    
    // Filter out all faculty with this subject and semester
    const originalLength = facultyData.length;
    for (let i = facultyData.length - 1; i >= 0; i--) {
      if (facultyData[i].semester === semester && facultyData[i].subject === subject) {
        facultyData.splice(i, 1);
      }
    }
    
    console.log(`Removed ${originalLength - facultyData.length} faculty entries`);
    
    // Update facultyData.js file
    const facultyDataPath = path.join(__dirname, 'data/facultyData.js');
    let facultyFileContent = fs.readFileSync(facultyDataPath, 'utf8');
    
    // Find the start and end of the facultyData array
    const arrayStart = facultyFileContent.indexOf('const facultyData = [');
    const arrayEnd = facultyFileContent.indexOf('];', arrayStart) + 2;
    
    if (arrayStart === -1 || arrayEnd === -1) {
      throw new Error('Could not find facultyData array in file');
    }
    
    const facultyArrayStr = JSON.stringify(facultyData, null, 2);
    const before = facultyFileContent.substring(0, arrayStart);
    const after = facultyFileContent.substring(arrayEnd);
    const newFacultyFileContent = before + `const facultyData = ${facultyArrayStr};` + after;
    
    fs.writeFileSync(facultyDataPath, newFacultyFileContent, 'utf8');
    
    res.json({
      success: true,
      message: `Subject and ${facultyToRemove.length} associated faculty assignment(s) deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting subject: ' + error.message
    });
  }
});

// Assign faculty to an existing subject
app.post('/api/admin/assign-faculty', (req, res) => {
  try {
    const { semester, subject, facultyIds, newFaculty } = req.body;
    
    console.log('Assign faculty request:', { semester, subject, facultyIds, newFaculty });
    
    if (!semester || !subject || !facultyIds || facultyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Read the current facultyData.js file
    const facultyDataPath = path.join(__dirname, 'data/facultyData.js');
    let facultyFileContent = fs.readFileSync(facultyDataPath, 'utf8');
    
    const newFacultyEntries = [];
    
    // First, add any completely new faculty members
    if (newFaculty && newFaculty.length > 0) {
      newFaculty.forEach(faculty => {
        const newEntry = {
          id: faculty.id,
          name: faculty.name,
          password: faculty.password,
          semester: semester,
          subject: subject,
          department: faculty.department
        };
        
        newFacultyEntries.push(newEntry);
        facultyData.push(newEntry);
        
        // Generate Excel sheet for this new faculty
        const dates = generateDates();
        const students = [];
        
        const sheetData = students.map(student => {
          const row = {
            'Roll No': student.rollNo,
            'Student Name': student.name
          };
          dates.forEach(date => {
            row[date] = '';
          });
          row['Total Present'] = 0;
          row['Total Absent'] = 0;
          row['Percentage'] = '0%';
          return row;
        });
        
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(sheetData);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance');
        
        const fileName = `${faculty.id}_${semester.replace('-', '_')}_${subject.replace(/\s+/g, '_')}.xlsx`;
        const filePath = path.join(SHEETS_DIR, fileName);
        
        xlsx.writeFile(workbook, filePath);
        console.log(`Created sheet for new faculty: ${fileName}`);
      });
    }
    
    // Now handle existing faculty assignments
    facultyIds.forEach(facultyId => {
      // Skip if this is a newly created faculty (already handled above)
      if (newFaculty && newFaculty.some(nf => nf.id === facultyId)) {
        return;
      }
      
      const existingFaculty = facultyData.find(f => f.id === facultyId);
      
      if (existingFaculty) {
        // Add new entry for existing faculty with new subject
        const newEntry = {
          id: existingFaculty.id,
          name: existingFaculty.name,
          password: existingFaculty.password,
          semester: semester,
          subject: subject,
          department: existingFaculty.department
        };
        
        newFacultyEntries.push(newEntry);
        facultyData.push(newEntry);
        
        // Generate Excel sheet
        const dates = generateDates();
        const students = [];
        
        const sheetData = students.map(student => {
          const row = {
            'Roll No': student.rollNo,
            'Student Name': student.name
          };
          dates.forEach(date => {
            row[date] = '';
          });
          row['Total Present'] = 0;
          row['Total Absent'] = 0;
          row['Percentage'] = '0%';
          return row;
        });
        
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(sheetData);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance');
        
        const fileName = `${existingFaculty.id}_${semester.replace('-', '_')}_${subject.replace(/\s+/g, '_')}.xlsx`;
        const filePath = path.join(SHEETS_DIR, fileName);
        
        xlsx.writeFile(workbook, filePath);
        console.log(`Created sheet: ${fileName}`);
      }
    });
    
    // Write updated faculty data back to file
    const facultyArrayStr = JSON.stringify(facultyData, null, 2);
    const newFileContent = facultyFileContent.replace(
      /const facultyData = \[[\s\S]*?\];/,
      `const facultyData = ${facultyArrayStr};`
    );
    
    fs.writeFileSync(facultyDataPath, newFileContent, 'utf8');
    
    res.json({
      success: true,
      message: `Faculty assigned to subject successfully. Created ${newFacultyEntries.length} new entries.`
    });
  } catch (error) {
    console.error('Error assigning faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning faculty to subject'
    });
  }
});

// Remove faculty assignment
app.post('/api/admin/remove-faculty-assignment', (req, res) => {
  try {
    const { facultyId, subject, semester } = req.body;
    
    console.log('Remove faculty assignment request:', { facultyId, subject, semester });
    
    if (!facultyId || !subject || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Faculty ID, subject, and semester are required'
      });
    }
    
    // Find the index of the faculty entry to remove
    const indexToRemove = facultyData.findIndex(f => 
      f.id === facultyId && f.subject === subject && f.semester === semester
    );
    
    if (indexToRemove === -1) {
      return res.status(404).json({
        success: false,
        message: 'Faculty assignment not found'
      });
    }
    
    // Remove the faculty entry
    facultyData.splice(indexToRemove, 1);
    
    // Delete the attendance sheet file if it exists
    const fileName = `${facultyId}_${semester.replace('-', '_')}_${subject.replace(/\s+/g, '_')}.xlsx`;
    const filePath = path.join(SHEETS_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted attendance sheet: ${fileName}`);
    }
    
    // Update facultyData.js file
    const facultyDataPath = path.join(__dirname, 'data/facultyData.js');
    let facultyFileContent = fs.readFileSync(facultyDataPath, 'utf8');
    
    // Find the start and end of the facultyData array
    const arrayStart = facultyFileContent.indexOf('const facultyData = [');
    const arrayEnd = facultyFileContent.indexOf('];', arrayStart) + 2;
    
    if (arrayStart === -1 || arrayEnd === -1) {
      throw new Error('Could not find facultyData array in file');
    }
    
    const facultyArrayStr = JSON.stringify(facultyData, null, 2);
    const before = facultyFileContent.substring(0, arrayStart);
    const after = facultyFileContent.substring(arrayEnd);
    const newFileContent = before + `const facultyData = ${facultyArrayStr};` + after;
    
    fs.writeFileSync(facultyDataPath, newFileContent, 'utf8');
    
    res.json({
      success: true,
      message: 'Faculty assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing faculty assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing faculty assignment: ' + error.message
    });
  }
});

// Add Subject API - Assigns a new subject to faculty members
app.post('/api/admin/add-subject', (req, res) => {
  try {
    const { semester, subject, facultyIds, newFaculty } = req.body;
    
    console.log('Add subject request:', { semester, subject, facultyIds, newFaculty });
    
    if (!semester || !subject || !facultyIds || facultyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Read the current facultyData.js file
    const facultyDataPath = path.join(__dirname, 'data/facultyData.js');
    let facultyFileContent = fs.readFileSync(facultyDataPath, 'utf8');
    
    // Generate unique faculty IDs for new assignments
    let nextFacultyNumber = facultyData.length + 1;
    const newFacultyEntries = [];
    
    // First, add any completely new faculty members
    if (newFaculty && newFaculty.length > 0) {
      newFaculty.forEach(faculty => {
        const newEntry = {
          id: faculty.id,
          name: faculty.name,
          password: faculty.password,
          semester: semester,
          subject: subject,
          department: faculty.department
        };
        
        newFacultyEntries.push(newEntry);
        facultyData.push(newEntry);
        
        // Generate Excel sheet for this new faculty
        const dates = generateDates();
        const students = [];
        
        const sheetData = students.map(student => {
          const row = {
            'Roll No': student.rollNo,
            'Student Name': student.name
          };
          dates.forEach(date => {
            row[date] = '';
          });
          row['Total Present'] = 0;
          row['Total Absent'] = 0;
          row['Percentage'] = '0%';
          return row;
        });
        
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(sheetData);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance');
        
        const fileName = `${faculty.id}_${semester.replace('-', '_')}_${subject.replace(/\s+/g, '_')}.xlsx`;
        const filePath = path.join(SHEETS_DIR, fileName);
        
        xlsx.writeFile(workbook, filePath);
        console.log(`Created Excel sheet for new faculty: ${fileName}`);
      });
    }
    
    // Then handle existing faculty assignments
    facultyIds.forEach(facultyId => {
      // Skip if this is a newly created faculty (already handled above)
      if (newFaculty && newFaculty.some(nf => nf.id === facultyId)) {
        return;
      }
      
      // Find existing faculty
      const existingFaculty = facultyData.find(f => f.id === facultyId);
      
      if (existingFaculty) {
        // Create new faculty entry with same person but different subject
        const newId = `FAC${String(nextFacultyNumber).padStart(3, '0')}`;
        nextFacultyNumber++;
        
        const newEntry = {
          id: newId,
          name: existingFaculty.name,
          password: existingFaculty.password,
          semester: semester,
          subject: subject,
          department: existingFaculty.department
        };
        
        newFacultyEntries.push(newEntry);
        facultyData.push(newEntry);
        
        // Generate Excel sheet for this faculty-subject combination
        const dates = generateDates();
        const students = []; // Empty initially, will be populated via Add Students
        
        const sheetData = students.map(student => {
          const row = {
            'Roll No': student.rollNo,
            'Student Name': student.name
          };
          dates.forEach(date => {
            row[date] = '';
          });
          row['Total Present'] = 0;
          row['Total Absent'] = 0;
          row['Percentage'] = '0%';
          return row;
        });
        
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(sheetData);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance');
        
        const fileName = `${newId}_${semester.replace('-', '_')}_${subject.replace(/\s+/g, '_')}.xlsx`;
        const filePath = path.join(SHEETS_DIR, fileName);
        
        xlsx.writeFile(workbook, filePath);
        console.log(`Created Excel sheet: ${fileName}`);
      }
    });
    
    // Append new entries to facultyData.js
    const newEntriesCode = newFacultyEntries.map(entry => `  {
    id: '${entry.id}',
    name: '${entry.name}',
    password: '${entry.password}',
    semester: '${entry.semester}',
    subject: '${entry.subject}',
    department: '${entry.department}'
  }`).join(',\n');
    
    // Insert before the closing bracket of facultyData array
    const insertPosition = facultyFileContent.lastIndexOf('];');
    if (insertPosition !== -1) {
      const beforeClosing = facultyFileContent.substring(0, insertPosition);
      const afterClosing = facultyFileContent.substring(insertPosition);
      
      // Add comma if there are existing entries
      const needsComma = beforeClosing.trim().endsWith('}');
      facultyFileContent = beforeClosing + (needsComma ? ',\n' : '') + newEntriesCode + '\n' + afterClosing;
      
      fs.writeFileSync(facultyDataPath, facultyFileContent, 'utf8');
      console.log('Updated facultyData.js');
    }
    
    res.json({
      success: true,
      message: `Subject "${subject}" assigned to ${facultyIds.length} faculty member(s)`,
      newEntries: newFacultyEntries
    });
    
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding subject',
      error: error.message
    });
  }
});

// Add Students API - Adds students to a faculty's subject
app.post('/api/admin/add-students', (req, res) => {
  try {
    const { semester, subject, facultyId, students } = req.body;
    
    console.log('Add students request:', { semester, subject, facultyId, studentCount: students.length });
    
    if (!semester || !subject || !facultyId || !students || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Find the faculty
    const faculty = facultyData.find(f => f.id === facultyId && f.semester === semester && f.subject === subject);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty assignment not found'
      });
    }
    
    // Get the Excel file path
    const { filePath, fileName } = getFacultySheetPath(faculty);
    
    let workbook;
    let existingData = [];
    
    // Read existing file or create new one
    if (fs.existsSync(filePath)) {
      workbook = xlsx.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      existingData = xlsx.utils.sheet_to_json(worksheet);
      console.log(`Existing sheet has ${existingData.length} students`);
    } else {
      workbook = xlsx.utils.book_new();
      console.log('Creating new sheet');
    }
    
    // Generate dates
    const dates = generateDates();
    
    // Merge new students with existing data
    students.forEach(newStudent => {
      // Check if student already exists
      const exists = existingData.find(s => s['Roll No'] === newStudent.rollNo);
      
      if (!exists) {
        const row = {
          'Roll No': newStudent.rollNo,
          'Student Name': newStudent.name
        };
        dates.forEach(date => {
          row[date] = '';
        });
        row['Total Present'] = 0;
        row['Total Absent'] = 0;
        row['Percentage'] = '0%';
        
        existingData.push(row);
      }
    });
    
    // Create new worksheet
    const worksheet = xlsx.utils.json_to_sheet(existingData);
    
    // Update or create workbook
    if (workbook.SheetNames.length > 0) {
      workbook.Sheets[workbook.SheetNames[0]] = worksheet;
    } else {
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    }
    
    // Save file
    xlsx.writeFile(workbook, filePath);
    console.log(`Updated ${fileName} with ${students.length} new students`);
    
    res.json({
      success: true,
      message: `Successfully added ${students.length} student(s) to ${subject}`,
      totalStudents: existingData.length
    });
    
  } catch (error) {
    console.error('Error adding students:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding students',
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