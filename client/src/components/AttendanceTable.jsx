import React, { useEffect, useState } from 'react';
import { fetchAttendanceData } from '../services/api';
import ContentLockIndicator from './ContentLockIndicator';

const AttendanceTable = () => {
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAttendanceData = async () => {
            try {
                const data = await fetchAttendanceData();
                setAttendanceRecords(data);
            } catch (error) {
                console.error('Error fetching attendance data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAttendanceData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <table>
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Absence Reason</th>
                    <th>Content Lock</th>
                </tr>
            </thead>
            <tbody>
                {attendanceRecords.map((record) => (
                    <tr key={record.id}>
                        <td>{record.studentName}</td>
                        <td>{record.date}</td>
                        <td>{record.status}</td>
                        <td>{record.absenceReason || 'N/A'}</td>
                        <td>
                            <ContentLockIndicator isLocked={record.isLocked} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default AttendanceTable;