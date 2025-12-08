/**
 * Generate Individual Attendance Sheets for Each Faculty
 * Creates Excel files with student list and date columns (Dec 8 - Apr 30)
 */

const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { facultyData, studentsData } = require('./data/facultyData');

// Directory to store attendance sheets
const SHEETS_DIR = path.join(__dirname, '../attendance_sheets');

// Ensure directory exists
if (!fs.existsSync(SHEETS_DIR)) {
  fs.mkdirSync(SHEETS_DIR, { recursive: true });
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

// Generate sheet for a single faculty
function generateFacultySheet(faculty) {
  const students = studentsData[faculty.semester] || [];
  const dates = generateDates();
  
  // Create header row
  const headers = ['S.No', 'Roll No', 'Student Name', ...dates, 'Total Present', 'Total Absent', 'Percentage'];
  
  // Create data rows with empty attendance cells
  const data = [headers];
  
  students.forEach((student, index) => {
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
    { wch: 20 },  // Student Name
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
  
  console.log(`✅ Created: ${fileName}`);
  return { fileName, filePath, studentsCount: students.length, datesCount: dates.length };
}

// Generate sheets for all faculty
function generateAllSheets() {
  console.log('\n========================================');
  console.log('Generating Faculty Attendance Sheets');
  console.log('========================================\n');
  console.log(`Output Directory: ${SHEETS_DIR}\n`);
  
  const results = [];
  
  facultyData.forEach(faculty => {
    const result = generateFacultySheet(faculty);
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
  console.log('========================================\n');
  
  // Print table
  console.log('Faculty Sheets:');
  console.log('-'.repeat(80));
  results.forEach(r => {
    console.log(`  ${r.faculty} | ${r.semester} | ${r.subject} | ${r.studentsCount} students`);
  });
  console.log('-'.repeat(80));
  console.log('\nSheets are ready for use!\n');
  
  return results;
}

// Run if called directly
if (require.main === module) {
  generateAllSheets();
}

module.exports = { generateFacultySheet, generateAllSheets, generateDates };
