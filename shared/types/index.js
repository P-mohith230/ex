export type AttendanceRecord = {
    studentId: string;
    date: string;
    status: 'present' | 'absent' | 'late';
    absenceReason?: string;
};

export type Student = {
    id: string;
    name: string;
    email: string;
    attendanceRecords: AttendanceRecord[];
};

export type ContentLock = {
    id: string;
    reason: string;
    isLocked: boolean;
};