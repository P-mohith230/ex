const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

const ingestAttendanceData = async (attendanceData) => {
    try {
        const { studentId, date, status, absenceReason } = attendanceData;

        // Check if the student exists
        const student = await Student.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }

        // Create a new attendance record
        const attendanceRecord = new Attendance({
            student: studentId,
            date,
            status,
            absenceReason,
        });

        // Save the attendance record to the database
        await attendanceRecord.save();
        return attendanceRecord;
    } catch (error) {
        throw new Error(`Error ingesting attendance data: ${error.message}`);
    }
};

module.exports = {
    ingestAttendanceData,
};