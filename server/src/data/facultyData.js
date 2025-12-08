// Faculty Data with Semester Assignments and Passwords
// Each faculty has a unique password to access their attendance dashboard

const facultyData = [
  {
    id: 'FAC001',
    name: 'Dr. Ramesh Kumar',
    password: 'ramesh123',
    semester: '3-2',
    subject: 'Data Structures',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC002',
    name: 'Prof. Sunitha Reddy',
    password: 'sunitha123',
    semester: '3-2',
    subject: 'Database Management',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC003',
    name: 'Dr. Venkat Rao',
    password: 'venkat123',
    semester: '4-2',
    subject: 'Machine Learning',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC004',
    name: 'Prof. Lakshmi Devi',
    password: 'lakshmi123',
    semester: '4-2',
    subject: 'Cloud Computing',
    department: 'CSE(DS)'
  },
  {
    id: 'FAC005',
    name: 'Dr. Srinivas Murthy',
    password: 'srinivas123',
    semester: '3-2',
    subject: 'Computer Networks',
    department: 'CSE(DS)'
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

module.exports = { facultyData, studentsData };
