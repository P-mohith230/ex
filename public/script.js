// =====================================================
// Student Attendance Management System - Client Script
// =====================================================

// Global state
let attendanceData = [];
let filteredData = [];
let attendanceDates = [];
let isUnlocked = false;

// HARDCODED UNLOCK KEY (as per requirements)
const UNLOCK_KEY = 'ATTENDANCE_ADMIN';

// API Base URL
const API_BASE = 'http://localhost:3000';

// =====================================================
// Initialization
// =====================================================

window.addEventListener('DOMContentLoaded', () => {
    // Check session storage for unlock status
    const unlockStatus = sessionStorage.getItem('attendanceUnlocked');
    if (unlockStatus === 'true') {
        isUnlocked = true;
    }

    // Add Enter key listener for passcode input
    const passcodeInput = document.getElementById('passcodeInput');
    if (passcodeInput) {
        passcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                verifyPasscode();
            }
        });
    }
});

// =====================================================
// Message Display
// =====================================================

function showMessage(message, type = 'success') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// =====================================================
// File Upload
// =====================================================

async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        showMessage('Please select an Excel file first', 'error');
        return;
    }

    // Validate file type
    const validTypes = ['.xlsx', '.xls'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(fileExt)) {
        showMessage('Please upload a valid Excel file (.xlsx or .xls)', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('attendanceFile', file);

    try {
        showMessage('Uploading and processing file...', 'success');

        const response = await fetch(`${API_BASE}/api/upload-attendance`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            attendanceData = result.data;
            attendanceDates = result.dates || [];
            filteredData = [...attendanceData];
            // Reset unlock status when new data is loaded
            isUnlocked = false;
            sessionStorage.removeItem('attendanceUnlocked');
            showFilterSection();
            renderTable();
            updateStats();
            showMessage(result.message, 'success');
        } else {
            showMessage(result.message || 'Error uploading file', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showMessage('Error connecting to server. Make sure the server is running.', 'error');
    }
}

// =====================================================
// Load Mock Data (for testing)
// =====================================================

async function loadMockData() {
    try {
        showMessage('Loading demo data...', 'success');

        const response = await fetch(`${API_BASE}/api/mock-attendance`);
        const result = await response.json();

        if (result.success) {
            attendanceData = result.data;
            attendanceDates = result.dates || [];
            filteredData = [...attendanceData];
            // Reset unlock status when new data is loaded
            isUnlocked = false;
            sessionStorage.removeItem('attendanceUnlocked');
            showFilterSection();
            renderTable();
            updateStats();
            showMessage(result.message, 'success');
        } else {
            showMessage('Error loading demo data', 'error');
        }
    } catch (error) {
        console.error('Load mock data error:', error);
        showMessage('Error connecting to server. Make sure the server is running on port 3000.', 'error');
    }
}

// =====================================================
// Statistics Update
// =====================================================

function updateStats() {
    const statsContainer = document.getElementById('statsContainer');
    
    if (attendanceData.length === 0) {
        statsContainer.style.display = 'none';
        return;
    }

    statsContainer.style.display = 'flex';

    const total = attendanceData.length;
    
    // For date-wise data, calculate average attendance
    if (attendanceDates && attendanceDates.length > 0) {
        let totalPresent = 0;
        let totalAbsent = 0;
        attendanceData.forEach(student => {
            totalPresent += student.TotalPresent || 0;
            totalAbsent += student.TotalAbsent || 0;
        });
        
        document.getElementById('totalCount').textContent = total + ' Students';
        document.getElementById('presentCount').textContent = totalPresent;
        document.getElementById('absentCount').textContent = totalAbsent;
    } else {
        const present = attendanceData.filter(s => s.AttendanceStatus === 'Present').length;
        const absent = attendanceData.filter(s => s.AttendanceStatus === 'Absent').length;
        
        document.getElementById('totalCount').textContent = total;
        document.getElementById('presentCount').textContent = present;
        document.getElementById('absentCount').textContent = absent;
    }
}

// =====================================================
// Table Rendering
// =====================================================

function renderTable() {
    const container = document.getElementById('tableContainer');
    const unlockBtn = document.getElementById('unlockBtn');
    const dataToRender = filteredData.length > 0 || attendanceData.length === 0 ? filteredData : attendanceData;

    if (attendanceData.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <div class="icon">📊</div>
                <p>No data loaded. Please upload an Excel file or click "Load Demo Data" to get started.</p>
            </div>
        `;
        unlockBtn.style.display = 'none';
        return;
    }

    // Show/update unlock button
    unlockBtn.style.display = 'inline-block';
    if (isUnlocked) {
        unlockBtn.textContent = '🔓 Absence Reasons Unlocked';
        unlockBtn.className = 'unlock-btn unlocked';
    } else {
        unlockBtn.textContent = '🔒 View Absence Reasons';
        unlockBtn.className = 'unlock-btn';
    }

    // Check if no results after filtering
    if (dataToRender.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <div class="icon">🔍</div>
                <p>No matching records found. Try adjusting your filters.</p>
            </div>
        `;
        return;
    }

    // Check if date-wise data exists
    const hasDateData = attendanceDates && attendanceDates.length > 0;

    // Build table HTML
    let tableHTML = `
        <div style="overflow-x: auto; max-width: 100%;">
        <table>
            <thead>
                <tr>
                    <th style="position: sticky; left: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); z-index: 2;">Roll No</th>
                    <th style="position: sticky; left: 100px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); z-index: 2;">Student Name</th>
    `;

    // Add date columns if date-wise data exists
    if (hasDateData) {
        // Show limited dates for display, with scroll
        attendanceDates.forEach(date => {
            tableHTML += `<th style="min-width: 50px; font-size: 0.7rem;">${date}</th>`;
        });
        tableHTML += `
                    <th style="background: #28a745; color: white;">Present</th>
                    <th style="background: #dc3545; color: white;">Absent</th>
                    <th style="background: #17a2b8; color: white;">%</th>
        `;
    }

    tableHTML += `
                    <th>Absence Reason</th>
                    <th>Parent Contacted</th>
                </tr>
            </thead>
            <tbody>
    `;

    dataToRender.forEach(student => {
        let absenceReason = '';
        let reasonClass = 'locked-content';

        if (isUnlocked) {
            try {
                absenceReason = decodeBase64(student.AbsenceReason);
                reasonClass = 'unlocked-content';
            } catch (e) {
                absenceReason = student.AbsenceReason;
                reasonClass = 'unlocked-content';
            }
        } else {
            absenceReason = '[CONFIDENTIAL]';
            reasonClass = 'locked-content';
        }

        const parentContactedText = student.ParentContacted ? 'Yes ✓' : 'No';
        const parentClass = student.ParentContacted ? 'parent-yes' : 'parent-no';

        tableHTML += `
            <tr>
                <td style="position: sticky; left: 0; background: white; z-index: 1;"><strong>${student.StudentRollNo}</strong></td>
                <td style="position: sticky; left: 100px; background: white; z-index: 1;">${student.StudentName}</td>
        `;

        // Add date-wise attendance cells
        if (hasDateData && student.dateAttendance) {
            attendanceDates.forEach(date => {
                const status = student.dateAttendance[date] || '-';
                const cellClass = status === 'P' ? 'status-present' : (status === 'A' ? 'status-absent' : '');
                tableHTML += `<td class="${cellClass}" style="text-align: center; font-weight: bold;">${status}</td>`;
            });
            tableHTML += `
                <td style="text-align: center; font-weight: bold; color: #28a745;">${student.TotalPresent}</td>
                <td style="text-align: center; font-weight: bold; color: #dc3545;">${student.TotalAbsent}</td>
                <td style="text-align: center; font-weight: bold; color: #17a2b8;">${student.Percentage}</td>
            `;
        }

        tableHTML += `
                <td class="${reasonClass}">${absenceReason}</td>
                <td class="${parentClass}">${parentContactedText}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
        </div>
    `;

    container.innerHTML = tableHTML;
}

// =====================================================
// Base64 Decoding
// =====================================================

function decodeBase64(encodedString) {
    try {
        return atob(encodedString);
    } catch (e) {
        console.error('Base64 decode error:', e);
        return encodedString;
    }
}

// =====================================================
// Modal Handling
// =====================================================

function showUnlockModal() {
    if (isUnlocked) {
        showMessage('Absence reasons are already unlocked for this session.', 'success');
        return;
    }

    const modal = document.getElementById('unlockModal');
    const errorMessage = document.getElementById('errorMessage');
    const passcodeInput = document.getElementById('passcodeInput');
    
    modal.style.display = 'block';
    errorMessage.style.display = 'none';
    passcodeInput.value = '';
    passcodeInput.focus();
}

function closeUnlockModal() {
    const modal = document.getElementById('unlockModal');
    modal.style.display = 'none';
}

// =====================================================
// Passcode Verification
// =====================================================

function verifyPasscode() {
    const passcodeInput = document.getElementById('passcodeInput');
    const errorMessage = document.getElementById('errorMessage');
    const enteredCode = passcodeInput.value.trim();

    if (enteredCode === UNLOCK_KEY) {
        // Correct passcode
        isUnlocked = true;
        sessionStorage.setItem('attendanceUnlocked', 'true');
        closeUnlockModal();
        renderTable();
        showMessage('✅ Access granted! Absence reasons are now visible.', 'success');
    } else {
        // Incorrect passcode
        errorMessage.style.display = 'block';
        passcodeInput.value = '';
        passcodeInput.focus();
    }
}

// =====================================================
// Close modal when clicking outside
// =====================================================

window.onclick = function(event) {
    const modal = document.getElementById('unlockModal');
    if (event.target === modal) {
        closeUnlockModal();
    }
}

// =====================================================
// Keyboard shortcuts
// =====================================================

document.addEventListener('keydown', (e) => {
    // ESC key closes modal
    if (e.key === 'Escape') {
        closeUnlockModal();
    }
});

// =====================================================
// Filter Functions
// =====================================================

function showFilterSection() {
    const filterSection = document.getElementById('filterSection');
    if (filterSection) {
        filterSection.style.display = 'flex';
    }
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredData = attendanceData.filter(student => {
        // Status filter
        const statusMatch = statusFilter === 'all' || student.AttendanceStatus === statusFilter;
        
        // Search filter (by roll no or name)
        const rollNo = String(student.StudentRollNo).toLowerCase();
        const name = student.StudentName.toLowerCase();
        const searchMatch = searchInput === '' || 
                           rollNo.includes(searchInput) || 
                           name.includes(searchInput);

        return statusMatch && searchMatch;
    });

    renderTable();
    updateFilteredStats();
}

function clearFilters() {
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('searchInput').value = '';
    filteredData = [...attendanceData];
    renderTable();
    updateStats();
}

function updateFilteredStats() {
    const statsContainer = document.getElementById('statsContainer');
    
    if (attendanceData.length === 0) {
        statsContainer.style.display = 'none';
        return;
    }

    statsContainer.style.display = 'flex';

    // Show filtered counts
    const total = filteredData.length;
    const present = filteredData.filter(s => s.AttendanceStatus === 'Present').length;
    const absent = filteredData.filter(s => s.AttendanceStatus === 'Absent').length;

    document.getElementById('totalCount').textContent = `${total}/${attendanceData.length}`;
    document.getElementById('presentCount').textContent = present;
    document.getElementById('absentCount').textContent = absent;
}
