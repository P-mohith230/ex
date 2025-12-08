import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Adjust the URL as needed

export const fetchAttendanceData = async () => {
    try {
        const response = await axios.get(`${API_URL}/attendance`);
        return response.data;
    } catch (error) {
        console.error('Error fetching attendance data:', error);
        throw error;
    }
};

export const submitAbsenceReason = async (studentId, reason) => {
    try {
        const response = await axios.post(`${API_URL}/attendance/absence`, { studentId, reason });
        return response.data;
    } catch (error) {
        console.error('Error submitting absence reason:', error);
        throw error;
    }
};

export const fetchContentLockStatus = async (studentId) => {
    try {
        const response = await axios.get(`${API_URL}/lock/${studentId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching content lock status:', error);
        throw error;
    }
};