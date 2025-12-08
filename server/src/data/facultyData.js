// Faculty Data with Semester Assignments and Passwords
// Each faculty has a unique password to access their attendance dashboard

const facultyData = [
  // 3-2 Semester Faculty - NLP
  {
    id: 'FAC001',
    name: 'Mr. Vikram',
    password: 'vikram123',
    semester: '3-2',
    subject: 'NLP',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC002',
    name: 'Dr. Kiran',
    password: 'kiran123',
    semester: '3-2',
    subject: 'NLP',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC003',
    name: 'Ms. Prasanna',
    password: 'prasanna123',
    semester: '3-2',
    subject: 'NLP',
    department: 'CSE(DS)'
  },
  // 3-2 Semester Faculty - Data Visualization
  {
    id: 'FAC004',
    name: 'Mr. Vishwanath',
    password: 'vishwanath123',
    semester: '3-2',
    subject: 'Data Visualization',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC005',
    name: 'Ms. Annapurna',
    password: 'annapurna123',
    semester: '3-2',
    subject: 'Data Visualization',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC006',
    name: 'Ms. Supraja',
    password: 'supraja123',
    semester: '3-2',
    subject: 'Data Visualization',
    department: 'CSE(DS)'
  },
  // 3-2 Semester Faculty - Predictive Analysis
  {
    id: 'FAC007',
    name: 'Dr. Raghavendra',
    password: 'raghavendra123',
    semester: '3-2',
    subject: 'Predictive Analysis',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC008',
    name: 'Mr. Jeevan Kumar',
    password: 'jeevan123',
    semester: '3-2',
    subject: 'Predictive Analysis',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC009',
    name: 'Ms. Rathi',
    password: 'rathi123',
    semester: '3-2',
    subject: 'Predictive Analysis',
    department: 'CSE(DS)'
  },
  // 3-2 Semester Faculty - CN&IP
  {
    id: 'FAC010',
    name: 'Dr. Karimulla',
    password: 'karimulla123',
    semester: '3-2',
    subject: 'Computer Networks & Internet Protocol',
    department: 'CSE(DS)'
  },
  // 3-2 Semester Faculty - Cryptography & Network Security
  {
    id: 'FAC011',
    name: 'Ms. Arshiya',
    password: 'arshiya123',
    semester: '3-2',
    subject: 'Cryptography & Network Security',
    department: 'CSE(DS)'
  },
  // 3-2 Semester Faculty - Software Project Management
  {
    id: 'FAC012',
    name: 'Ms. Shakeer',
    password: 'shakeer123',
    semester: '3-2',
    subject: 'Software Project Management',
    department: 'CSE(DS)'
  },
  // 3-2 Semester Faculty - Deep Learning
  {
    id: 'FAC013',
    name: 'Dr. Suleman Basha',
    password: 'suleman123',
    semester: '3-2',
    subject: 'Deep Learning',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC014',
    name: 'Dr. Penchala Prasad',
    password: 'penchala123',
    semester: '3-2',
    subject: 'Deep Learning',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC015',
    name: 'Dr. Samunnisa',
    password: 'samunnisa123',
    semester: '3-2',
    subject: 'Deep Learning',
    department: 'CSE(DS)'
  },
  // 4-2 Semester Faculty (keeping existing)
  {
    id: 'FAC016',
    name: 'Dr. Venkat Rao',
    password: 'venkat123',
    semester: '4-2',
    subject: 'Machine Learning',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC017',
    name: 'Prof. Lakshmi Devi',
    password: 'lakshmi123',
    semester: '4-2',
    subject: 'Cloud Computing',
    department: 'CSE(DS)'
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
    name: 'HOD CSE(DS)',
    password: 'hod@cseds',
    role: 'department_admin'
  }
];

// Students data organized by semester
const studentsData = {
  '3-2': [
    { rollNo: '22091A3201', name: 'Rahul Sharma' },
    { rollNo: '22091A3202', name: 'Priya Patel' },
    { rollNo: '22091A3203', name: 'Amit Kumar' },
    { rollNo: '22091A3204', name: 'Sneha Reddy' },
    { rollNo: '22091A3205', name: 'Vikram Singh' },
    { rollNo: '22091A3206', name: 'Kavya Nair' },
    { rollNo: '22091A3207', name: 'Arjun Mehta' },
    { rollNo: '22091A3208', name: 'Deepika Rao' },
    { rollNo: '22091A3209', name: 'Karthik Iyer' },
    { rollNo: '22091A3210', name: 'Ananya Gupta' }
  ],
  '4-2': [
    { rollNo: '21091A3201', name: 'Ravi Teja' },
    { rollNo: '21091A3202', name: 'Meena Kumari' },
    { rollNo: '21091A3203', name: 'Suresh Babu' },
    { rollNo: '21091A3204', name: 'Divya Sharma' },
    { rollNo: '21091A3205', name: 'Naveen Reddy' },
    { rollNo: '21091A3206', name: 'Pooja Singh' },
    { rollNo: '21091A3207', name: 'Rajesh Kumar' },
    { rollNo: '21091A3208', name: 'Swathi Rani' },
    { rollNo: '21091A3209', name: 'Manoj Varma' },
    { rollNo: '21091A3210', name: 'Keerthi Reddy' }
  ]
};

module.exports = { facultyData, studentsData, adminData };
