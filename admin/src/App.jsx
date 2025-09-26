import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Issues from './pages/Issues';
import Departments from './pages/Departments';
import DashboardLayout from './components/layout/DashBoardLayout';
import DepartmentDashboard from './pages/DepartmentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import IssueDetails from './pages/IssueDetails';
import MapView from './pages/MapView';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="issues" element={<Issues />} />
            <Route path="issues/:issueId" element={<IssueDetails />} />
            <Route path="map" element={<MapView />} />
            <Route path="departments" element={<Departments />} />
            <Route path="department-dashboard" element={<DepartmentDashboard />} />
          </Route>
          <Route path="/department-dashboard" element={<DepartmentDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;