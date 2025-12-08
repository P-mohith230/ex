import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import AttendanceTable from '../components/AttendanceTable';
import AbsenceReasonModal from '../components/AbsenceReasonModal';
import ContentLockIndicator from '../components/ContentLockIndicator';

const StudentDetails = () => {
    const { studentId } = useParams();
    const [student, setStudent] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lockStatus, setLockStatus] = useState(false);

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                const response = await api.get(`/students/${studentId}`);
                setStudent(response.data);
                setAttendanceRecords(response.data.attendanceRecords);
                setLockStatus(response.data.lockStatus);
            } catch (error) {
                console.error('Error fetching student details:', error);
            }
        };

        fetchStudentDetails();
    }, [studentId]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            {student && (
                <h1>{student.name}'s Attendance Details</h1>
            )}
            <ContentLockIndicator isLocked={lockStatus} />
            <AttendanceTable records={attendanceRecords} />
            <button onClick={handleOpenModal}>Add Absence Reason</button>
            {isModalOpen && (
                <AbsenceReasonModal onClose={handleCloseModal} studentId={studentId} />
            )}
        </div>
    );
};

export default StudentDetails;