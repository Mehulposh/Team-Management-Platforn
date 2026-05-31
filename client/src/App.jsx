import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './zustand/authStore.js';

import LoginPage from './pages/Loginpage.jsx';
import RegisterPage from './pages/Registerpage .jsx';
import ForgotPasswordPage from './pages/Forgotpasswordpage.jsx';
import ResetPasswordPage from './pages/Resetpasswordpage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import DashboardPage from './pages/DashboardPage';
import BoardPage from './pages/BoardPage';
import ProjectPage from './pages/ProjectPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ChatPage from './pages/ChatPage';
import SprintPage from './pages/SprintPage';
import SettingsPage from './pages/SettingsPage';
import AppShell from './AppShell.jsx';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e2535', color: '#e8eaf0', border: '1px solid rgba(255,255,255,0.07)', fontSize: '13px' },
          success: { iconTheme: { primary: '#22d3a0', secondary: '#1e2535' } },
          error: { iconTheme: { primary: '#f25c5c', secondary: '#1e2535' } },
        }}
      />
      <Routes>
        {/* Guest routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Authenticated routes */}
        <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="projects/:projectId" element={<ProjectPage />} />
          <Route path="projects/:projectId/board" element={<BoardPage />} />
          <Route path="projects/:projectId/sprints" element={<SprintPage />} />
          <Route path="projects/:projectId/analytics" element={<AnalyticsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}