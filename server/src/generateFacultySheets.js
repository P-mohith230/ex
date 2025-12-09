/**
 * Generate Individual Attendance Sheets for Each Faculty
 * Creates Excel files with student list and date columns (Dec 8 - Apr 30)
 * Each faculty gets exactly 70 randomly assigned students
 */

const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Directory to store attendance sheets
const SHEETS_DIR = path.join(__dirname, '../attendance_sheets');

// Ensure directory exists
if (!fs.existsSync(SHEETS_DIR)) {
  fs.mkdirSync(SHEETS_DIR, { recursive: true });
}

// Load students from Excel file
function loadStudentsFromExcel() {
  try {
    const excelPath = path.join(SHEETS_DIR, 'RGMCET - Automation.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.warn('Excel file not found, using dummy data');
      return getFallbackStudents();
    }

    const workbook = xlsx.readFile(excelPath);
    const worksheet = workbook.Sheets['Sheet1'];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Skip header row and convert to student objects
    const students = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] && row[2]) { // HTNO and Name exist
        students.push({
          rollNo: String(row[1]).trim(),
          name: String(row[2]).trim()
        });
      }
    }
    
    console.log(`✓ Loaded ${students.length} students from Excel file`);
    return students;
  } catch (error) {
    console.error('Error loading students from Excel:', error.message);
    return getFallbackStudents();
  }
}

// Fallback students if Excel can't be loaded
function getFallbackStudents() {
  const students = [];
  for (let i = 1; i <= 210; i++) {
    students.push({
      rollNo: `23091A32${String(i).padStart(2, '0')}`,
      name: `Student ${i}`
    });
  }
  return students;
}

// Shuffle array function (Fisher-Yates shuffle)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate dates from Dec 8 to Apr 30 (excluding Sundays)
function generateDates() {
  const dates = [];
  const current = new Date('2024-12-08');
  const end = new Date('2025-04-30');
  
  while (current <= end) {
    if (current.getDay() !== 0) { // Skip Sundays
      const day = current.getDate().toString().padStart(2, '0');
      const month = current.toLocaleString('en-US', { month: 'short' });
      dates.push(`${day}-${month}`);
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Generate sheet for a single faculty with exactly 70 students
function generateFacultySheet(faculty, assignedStudents) {
  const dates = generateDates();
  
  // Create header row
  const headers = ['S.No', 'Roll No', 'Student Name', ...dates, 'Total Present', 'Total Absent', 'Percentage'];
  
  // Create data rows with empty attendance cells
  const data = [headers];
  
  assignedStudents.forEach((student, index) => {
    const row = [
      index + 1,                    // S.No
      student.rollNo,               // Roll No
      student.name,                 // Student Name
      ...dates.map(() => ''),       // Empty cells for each date
      0,                            // Total Present
      0,                            // Total Absent
      '0%'                          // Percentage
    ];
    data.push(row);
  });
  
  // Create workbook and worksheet
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  
  // Set column widths
  const colWidths = [
    { wch: 5 },   // S.No
    { wch: 15 },  // Roll No
    { wch: 25 },  // Student Name
    ...dates.map(() => ({ wch: 8 })),  // Date columns
    { wch: 12 },  // Total Present
    { wch: 12 },  // Total Absent
    { wch: 10 }   // Percentage
  ];
  worksheet['!cols'] = colWidths;
  
  // Add worksheet to workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  
  // Generate filename
  const fileName = `${faculty.id}_${faculty.semester.replace('-', '_')}_${faculty.subject.replace(/\s+/g, '_')}.xlsx`;
  const filePath = path.join(SHEETS_DIR, fileName);
  
  // Write file
  xlsx.writeFile(workbook, filePath);
  
  console.log(`✅ Created: ${fileName} (${assignedStudents.length} students)`);
  return { fileName, filePath, studentsCount: assignedStudents.length, datesCount: dates.length };
}

// Generate sheets for all faculty
function generateAllSheets() {
  console.log('\n========================================');
  console.log('Generating Faculty Attendance Sheets');
  console.log('========================================\n');
  console.log(`Output Directory: ${SHEETS_DIR}\n`);
  
  // Load faculty data
  const { facultyData } = require('./data/facultyData');
  
  // Load all students from Excel
  const allStudents = loadStudentsFromExcel();
  console.log(`Total students available: ${allStudents.length}\n`);
  
  // Shuffle students for random distribution
  const shuffledStudents = shuffleArray(allStudents);
  
  const results = [];
  let studentIndex = 0;
  
  facultyData.forEach(faculty => {
    // Assign exactly 70 students to this faculty
    const facultyStudents = [];
    
    for (let i = 0; i < 70; i++) {
      if (studentIndex >= shuffledStudents.length) {
        studentIndex = 0; // Loop back if we run out
      }
      facultyStudents.push(shuffledStudents[studentIndex]);
      studentIndex++;
    }
    
    const result = generateFacultySheet(faculty, facultyStudents);
    results.push({
      faculty: faculty.name,
      semester: faculty.semester,
      subject: faculty.subject,
      ...result
    });
  });
  
  console.log('\n========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`Total Sheets Created: ${results.length}`);
  console.log(`Date Range: Dec 08 to Apr 30 (excluding Sundays)`);
  console.log(`Total Date Columns: ${results[0]?.datesCount || 0}`);
  console.log(`Students per Faculty: 70`);
  console.log('========================================\n');
  
  // Print table
  console.log('Faculty Sheets:');
  console.log('-'.repeat(90));
  results.forEach(r => {
    console.log(`  ${r.faculty.padEnd(30)} | ${r.semester} | ${r.subject.padEnd(30)} | ${r.studentsCount} students`);
  });
  console.log('-'.repeat(90));
  console.log('\n✓ All sheets generated successfully!\n');
  
  return results;
}

// Run if called directly
if (require.main === module) {
  generateAllSheets();
}

module.exports = { generateFacultySheet, generateAllSheets, generateDates };
