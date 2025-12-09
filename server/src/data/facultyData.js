// Faculty Data with Semester Assignments and Passwords
// Each faculty has a unique password to access their attendance dashboard

const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const facultyData = [
  {
    "id": "FAC001",
    "name": "Mr. Vikram",
    "password": "vikram123",
    "semester": "3-2",
    "subject": "NLP",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC002",
    "name": "Dr. Kiran",
    "password": "kiran123",
    "semester": "3-2",
    "subject": "NLP",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC003",
    "name": "Ms. Prasanna",
    "password": "prasanna123",
    "semester": "3-2",
    "subject": "NLP",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC004",
    "name": "Mr. Vishwanath",
    "password": "vishwanath123",
    "semester": "3-2",
    "subject": "Data Visualization",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC005",
    "name": "Ms. Annapurna",
    "password": "annapurna123",
    "semester": "3-2",
    "subject": "Data Visualization",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC006",
    "name": "Ms. Supraja",
    "password": "supraja123",
    "semester": "3-2",
    "subject": "Data Visualization",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC007",
    "name": "Dr. Raghavendra",
    "password": "raghavendra123",
    "semester": "3-2",
    "subject": "Predictive Analysis",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC008",
    "name": "Mr. Jeevan Kumar",
    "password": "jeevan123",
    "semester": "3-2",
    "subject": "Predictive Analysis",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC009",
    "name": "Ms. Rathi",
    "password": "rathi123",
    "semester": "3-2",
    "subject": "Predictive Analysis",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC010",
    "name": "Dr. Karimulla",
    "password": "karimulla123",
    "semester": "3-2",
    "subject": "Computer Networks & Internet Protocol",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC011",
    "name": "Ms. Arshiya",
    "password": "arshiya123",
    "semester": "3-2",
    "subject": "Cryptography & Network Security",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC012",
    "name": "Ms. Shakeer",
    "password": "shakeer123",
    "semester": "3-2",
    "subject": "Software Project Management",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC013",
    "name": "Dr. Suleman Basha",
    "password": "suleman123",
    "semester": "3-2",
    "subject": "Deep Learning",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC014",
    "name": "Dr. Penchala Prasad",
    "password": "penchala123",
    "semester": "3-2",
    "subject": "Deep Learning",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC015",
    "name": "Dr. Samunnisa",
    "password": "samunnisa123",
    "semester": "3-2",
    "subject": "Deep Learning",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC016",
    "name": "Dr. Venkat Rao",
    "password": "venkat123",
    "semester": "4-2",
    "subject": "Machine Learning",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC017",
    "name": "Prof. Lakshmi Devi",
    "password": "lakshmi123",
    "semester": "4-2",
    "subject": "Cloud Computing",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC019",
    "name": "Srinath",
    "password": "srinath@123",
    "semester": "2-2",
    "subject": "Data Engineering",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC007",
    "name": "Dr. Raghavendra",
    "password": "raghavendra123",
    "semester": "2-2",
    "subject": "Data Engineering",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC020",
    "name": "K. Ranga Swami",
    "password": "rangaswami@123",
    "semester": "2-2",
    "subject": "Data Engineering",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC001",
    "name": "Mr. Vikram",
    "password": "vikram123",
    "semester": "4-2",
    "subject": "AI",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC019",
    "name": "Srinath",
    "password": "srinath@123",
    "semester": "2-2",
    "subject": "DBMS",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC012",
    "name": "Ms. Shakeer",
    "password": "shakeer123",
    "semester": "2-2",
    "subject": "DBMS",
    "department": "CSE(DS)"
  },
  {
    "id": "FAC010",
    "name": "Dr. Karimulla",
    "password": "karimulla123",
    "semester": "2-2",
    "subject": "Optimization Techniques",
    "department": "CSE(DS)"
  }
];

// Admin credentials
const adminData = [
  {
    id: 'ADMIN001',
    name: 'System Administrator',
    password: 'admin@2025',
    role: 'super_admin'
  },
  {
    id: 'ADMIN002',
    name: 'HOD OF CSEDS',
    password: 'hod@cseds',
    role: 'department_admin'
  }
];

// Load students from Excel file
function loadStudentsFromExcel() {
  try {
    const excelPath = path.join(__dirname, '../../attendance_sheets/RGMCET - Automation.xlsx');
    
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

// Assign 70 students to each faculty randomly
function assignStudentsToFaculty() {
  const allStudents = loadStudentsFromExcel();
  const studentsData = {};
  
  // Shuffle students for random distribution
  const shuffledStudents = shuffleArray(allStudents);
  
  let studentIndex = 0;
  
  facultyData.forEach(faculty => {
    const semester = faculty.semester;
    
    // Initialize semester array if not exists
    if (!studentsData[semester]) {
      studentsData[semester] = [];
    }
    
    // Assign 70 students to this faculty
    const facultyStudents = [];
    for (let i = 0; i < 70 && studentIndex < shuffledStudents.length; i++) {
      facultyStudents.push(shuffledStudents[studentIndex]);
      studentIndex++;
    }
    
    // If we run out of students, loop back
    while (facultyStudents.length < 70 && shuffledStudents.length > 0) {
      facultyStudents.push(shuffledStudents[studentIndex % shuffledStudents.length]);
      studentIndex++;
    }
    
    // Add to semester data (combine all faculty students for semester view)
    studentsData[semester] = studentsData[semester].concat(facultyStudents);
  });
  
  // Remove duplicates per semester
  Object.keys(studentsData).forEach(semester => {
    const unique = [  {
    id: 'FAC018',
    name: 'Dr. Raghavendra',
    password: 'raghavendra123',
    semester: '2-2',
    subject: 'data engineering',
    department: 'CSE(DS)'
  }
,

];
    const seen = new Set();
    studentsData[semester].forEach(student => {
      if (!seen.has(student.rollNo)) {
        seen.add(student.rollNo);
        unique.push(student);
      }
    });
    studentsData[semester] = unique;
  });
  
  return studentsData;
}

// Generate students data
const studentsData = assignStudentsToFaculty();

module.exports = { facultyData, studentsData, adminData };
