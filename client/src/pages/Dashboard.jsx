import React, { useEffect, useState } from 'react';
import AttendanceTable from '../components/AttendanceTable';
import { fetchAttendanceData } from '../services/api';

const Dashboard = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getAttendanceData = async () => {
            try {
                const data = await fetchAttendanceData();
                setAttendanceData(data);
            } catch (error) {
                console.error('Error fetching attendance data:', error);
            } finally {
                setLoading(false);
            }
        };

        getAttendanceData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Student Attendance Dashboard</h1>
            <AttendanceTable data={attendanceData} />
        </div>
    );
};

export default Dashboard;