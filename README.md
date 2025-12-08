# Student Attendance App

This project is a full-stack web application designed to handle student attendance data ingestion and display. It includes a content-locking mechanism for managing absence reasons.

## Features

- **Attendance Tracking**: Record and display student attendance records.
- **Absence Reason Management**: Enter and manage reasons for student absences with a content-locking feature.
- **Dashboard**: View overall attendance statistics and detailed student information.

## Project Structure

```
student-attendance-app
├── client                # React frontend
│   ├── public
│   │   └── index.html    # Main HTML file
│   ├── src
│   │   ├── components     # React components
│   │   │   ├── AttendanceTable.jsx
│   │   │   ├── AbsenceReasonModal.jsx
│   │   │   └── ContentLockIndicator.jsx
│   │   ├── pages          # Application pages
│   │   │   ├── Dashboard.jsx
│   │   │   └── StudentDetails.jsx
│   │   ├── services       # API service functions
│   │   │   └── api.js
│   │   ├── App.jsx        # Main application component
│   │   └── index.js       # Entry point for React app
│   └── package.json       # Client dependencies and scripts
├── server                 # Node.js backend
│   ├── src
│   │   ├── controllers     # Request handlers
│   │   │   ├── attendanceController.js
│   │   │   └── lockController.js
│   │   ├── models          # Database models
│   │   │   ├── Student.js
│   │   │   ├── Attendance.js
│   │   │   └── ContentLock.js
│   │   ├── routes          # API routes
│   │   │   ├── attendanceRoutes.js
│   │   │   └── lockRoutes.js
│   │   ├── middleware      # Middleware functions
│   │   │   ├── auth.js
│   │   │   └── lockValidator.js
│   │   ├── services        # Business logic services
│   │   │   ├── dataIngestionService.js
│   │   │   └── lockService.js
│   │   ├── config          # Configuration files
│   │   │   └── database.js
│   │   └── app.js          # Main entry point for the server
│   └── package.json        # Server dependencies and scripts
├── shared                 # Shared code between client and server
│   └── types
│       └── index.js
└── README.md              # Project documentation
```

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd student-attendance-app
   ```

2. **Install dependencies**:
   - For the client:
     ```
     cd client
     npm install
     ```
   - For the server:
     ```
     cd server
     npm install
     ```

3. **Run the application**:
   - Start the server:
     ```
     cd server
     npm start
     ```
   - Start the client:
     ```
     cd client
     npm start
     ```

## Usage

- Access the application in your web browser at `http://localhost:3000`.
- Use the dashboard to view attendance statistics and manage student records.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.