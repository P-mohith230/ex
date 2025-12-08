const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// Record attendance for a student
exports.recordAttendance = async (req, res) => {
    const { studentId, date, status, absenceReason } = req.body;

    try {
        const attendanceRecord = new Attendance({
            student: studentId,
            date,
            status,
            absenceReason
        });

        await attendanceRecord.save();
        res.status(201).json({ message: 'Attendance recorded successfully', attendanceRecord });
    } catch (error) {
        res.status(500).json({ message: 'Error recording attendance', error });
    }
};

// Retrieve attendance records for a student
exports.getAttendanceRecords = async (req, res) => {
    const { studentId } = req.params;

    try {
        const records = await Attendance.find({ student: studentId }).populate('student');
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving attendance records', error });
    }
};

// Retrieve all attendance records
exports.getAllAttendanceRecords = async (req, res) => {
    try {
        const records = await Attendance.find().populate('student');
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving attendance records', error });
    }
};