import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import StudentDetails from './pages/StudentDetails';
import AttendanceTable from './components/AttendanceTable';
import AbsenceReasonModal from './components/AbsenceReasonModal';
import ContentLockIndicator from './components/ContentLockIndicator';

const App = () => {
  return (
    <Router>
      <div>
        <ContentLockIndicator />
        <Switch>
          <Route path="/" exact component={Dashboard} />
          <Route path="/students/:id" component={StudentDetails} />
          <Route path="/attendance" component={AttendanceTable} />
          <Route path="/absence-reason" component={AbsenceReasonModal} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;