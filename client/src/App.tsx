import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { Drivers } from './pages/Drivers';
import RoutesPage from './pages/Routes';
import ManagerRoutes from './pages/ManagerRoutes';
import AdminRoutes from './pages/AdminRoutes';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import Notifications from './pages/Notifications';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationCountProvider } from './contexts/NotificationCountContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationCountProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="manager-routes" element={<ManagerRoutes />} />
              <Route path="admin-routes" element={<AdminRoutes />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </NotificationCountProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
