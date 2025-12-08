const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Route to record attendance
router.post('/attendance', attendanceController.recordAttendance);

// Route to get attendance records
router.get('/attendance', attendanceController.getAttendanceRecords);

// Route to get attendance for a specific student
router.get('/attendance/:studentId', attendanceController.getAttendanceByStudentId);

module.exports = router;