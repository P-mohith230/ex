// Script to generate sample attendance Excel file with date-wise columns
const xlsx = require('xlsx');
const path = require('path');

// Generate dates from Dec 8, 2024 to April 30, 2025
function generateDates(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    // Skip Sundays (0) - optional, remove if you want all days
    if (current.getDay() !== 0) {
      const day = current.getDate().toString().padStart(2, '0');
      const month = current.toLocaleString('en-US', { month: 'short' });
      dates.push(`${day}-${month}`);
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Generate dates from Dec 8 to April 30
const attendanceDates = generateDates('2024-12-08', '2025-04-30');

// Sample student data
const students = [
  { StudentRollNo: '23091A3201', StudentName: 'Rahul Sharma' },
  { StudentRollNo: '23091A3202', StudentName: 'Priya Patel' },
  { StudentRollNo: '23091A3210', StudentName: 'Amit Kumar' },
  { StudentRollNo: '23091A3215', StudentName: 'Deepika Rao' },
  { StudentRollNo: '23091A3225', StudentName: 'Sneha Reddy' },
  { StudentRollNo: '23091A3230', StudentName: 'Karthik Iyer' },
  { StudentRollNo: '23091A3245', StudentName: 'Ananya Gupta' },
  { StudentRollNo: '23091A3250', StudentName: 'Vikram Singh' },
  { StudentRollNo: '23091A3275', StudentName: 'Kavya Nair' },
  { StudentRollNo: '23091A3299', StudentName: 'Arjun Mehta' }
];

// Absence reasons for random assignment
const absenceReasons = [
  'Medical - Doctor appointment',
  'Family emergency',
  'Illness - Fever',
  'Personal reasons',
  'Sports competition',
  'Religious ceremony',
  'Travel - Out of station',
  'Medical - Hospital visit'
];

// Generate attendance data with BLANK cells for faculty to fill
const sampleData = students.map(student => {
  const row = {
    StudentRollNo: student.StudentRollNo,
    StudentName: student.StudentName
  };
  
  // Add BLANK cells for each date - faculty will fill P or A
  attendanceDates.forEach(date => {
    row[date] = ''; // Empty - faculty enters P or A
  });
  
  // Summary columns - will be calculated after faculty fills data
  row['Total Present'] = '';
  row['Total Absent'] = '';
  row['Percentage'] = '';
  
  // These remain for admin to fill if needed
  row['AbsenceReason'] = '';
  row['ParentContacted'] = '';
  
  return row;
});

// Create workbook and worksheet
const workbook = xlsx.utils.book_new();
const worksheet = xlsx.utils.json_to_sheet(sampleData);

// Set column widths
const colWidths = [
  { wch: 14 },  // StudentRollNo
  { wch: 18 },  // StudentName
];
// Add width for each date column
attendanceDates.forEach(() => colWidths.push({ wch: 8 }));
// Add width for summary columns
colWidths.push({ wch: 12 }); // Total Present
colWidths.push({ wch: 12 }); // Total Absent
colWidths.push({ wch: 10 }); // Percentage
colWidths.push({ wch: 35 }); // AbsenceReason
colWidths.push({ wch: 15 }); // ParentContacted

worksheet['!cols'] = colWidths;

// Add worksheet to workbook
xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance Dec-Apr');

// Save the file
const outputPath = path.join(__dirname, '..', 'Attendance_Template_Dec_Apr.xlsx');
xlsx.writeFile(workbook, outputPath);

console.log('✅ Sample Excel file created successfully!');
console.log(`📁 Location: ${outputPath}`);
console.log(`📊 Records: ${sampleData.length} students`);
console.log(`📅 Date columns: ${attendanceDates.length} days (Dec 8 - Apr 30)`);
console.log(`📋 Total columns: ${Object.keys(sampleData[0]).length}`);
