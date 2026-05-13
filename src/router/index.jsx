import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

import AdminLayout      from '../layouts/AdminLayout';
import StudentLayout    from '../layouts/StudentLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';

// Admin pages
import AdminLogin       from '../pages/admin/Login';
import AdminDashboard   from '../pages/admin/Dashboard';
import StudentsPage     from '../pages/admin/Students';
import FeesPage         from '../pages/admin/Fees';
import InstallmentsPage from '../pages/admin/Installments';
import PaymentsPage     from '../pages/admin/Payments';
import SettingsPage     from '../pages/admin/Settings';
import AdminNotices     from '../pages/admin/Notices';
import AdminAnalytics   from '../pages/admin/Analytics';
import CommunicatePage  from '../pages/admin/Communicate';
import AdminChangePassword from '../pages/admin/ChangePassword';

// Student pages
import StudentLogin     from '../pages/student/Login';
import StudentDashboard from '../pages/student/Dashboard';
import PaymentPage      from '../pages/student/Payment';
import HistoryPage      from '../pages/student/History';
import StudentNotices   from '../pages/student/Notices';
import ChangePassword  from '../pages/student/ChangePassword';

// Super Admin pages
import SuperAdminLogin     from '../pages/superadmin/Login';
import SuperAdminDashboard from '../pages/superadmin/Dashboard';
import SuperAdminSchools   from '../pages/superadmin/Schools';
import SuperAdminAnalytics from '../pages/superadmin/Analytics';
import SuperAdminPayments  from '../pages/superadmin/Payments';
import SuperAdminCredits   from '../pages/superadmin/Credits';

// Public pages
import PublicPaymentPage   from '../pages/PublicPayment';

// ── Guards ────────────────────────────────────────────────────────────────────
function RequireAdmin({ children }) {
  const { token, role, user } = useAuthStore.getState();
  if (!token || role !== 'admin') return <Navigate to="/" replace />;
  if (user?.mustChangePassword && window.location.pathname !== '/admin/change-password') {
    return <Navigate to="/admin/change-password" replace />;
  }
  return children;
}

function RequireStudent({ children }) {
  const { token, role, user } = useAuthStore.getState();
  if (!token || role !== 'student') return <Navigate to="/student" replace />;
  if (user?.mustChangePassword && window.location.pathname !== '/student/change-password') {
    return <Navigate to="/student/change-password" replace />;
  }
  return children;
}

function RequireSuperAdmin({ children }) {
  const { token, role } = useAuthStore.getState();
  if (!token || role !== 'superadmin') return <Navigate to="/superadmin" replace />;
  return children;
}

function RedirectIfAuthed() {
  const { token, role, user } = useAuthStore.getState();
  if (token && role === 'admin') {
    if (user?.mustChangePassword) return <Navigate to="/admin/change-password" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (token && role === 'student') return <Navigate to="/student/dashboard" replace />;
  return <AdminLogin />;
}

function RedirectStudentIfAuthed() {
  const { token, role, user } = useAuthStore.getState();
  if (token && role === 'student') {
    if (user?.mustChangePassword) return <Navigate to="/student/change-password" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return <StudentLogin />;
}

function RedirectSuperAdminIfAuthed() {
  const { token, role } = useAuthStore.getState();
  if (token && role === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />;
  return <SuperAdminLogin />;
}

export const router = createBrowserRouter([
  // Root: redirect to appropriate login
  { path: '/', element: <RedirectIfAuthed /> },
  { path: '/student', element: <RedirectStudentIfAuthed /> },
  { path: '/superadmin', element: <RedirectSuperAdminIfAuthed /> },
  
  // Public
  { path: '/pay', element: <PublicPaymentPage /> },

  // Admin routes
  {
    path: '/admin',
    element: <RequireAdmin><AdminLayout /></RequireAdmin>,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'students',  element: <StudentsPage /> },
      { path: 'fees',      element: <FeesPage /> },
      { path: 'installments', element: <InstallmentsPage /> },
      { path: 'payments',  element: <PaymentsPage /> },
      { path: 'notices',      element: <AdminNotices /> },
      { path: 'analytics',   element: <AdminAnalytics /> },
      { path: 'communicate', element: <CommunicatePage /> },
      { path: 'settings',    element: <SettingsPage /> },
    ],
  },
  {
    path: '/admin/change-password',
    element: <AdminChangePassword />,
  },

  // Student routes
  {
    path: '/student',
    element: <RequireStudent><StudentLayout /></RequireStudent>,
    children: [
      { path: 'dashboard',      element: <StudentDashboard /> },
      { path: 'notices',        element: <StudentNotices /> },
      { path: 'payment/:feeId', element: <PaymentPage /> },
      { path: 'history',        element: <HistoryPage /> },
    ],
  },
  {
    path: '/student/change-password',
    element: <ChangePassword />,
  },

  // Super Admin routes
  {
    path: '/superadmin',
    element: <RequireSuperAdmin><SuperAdminLayout /></RequireSuperAdmin>,
    children: [
      { path: 'dashboard', element: <SuperAdminDashboard /> },
      { path: 'schools',   element: <SuperAdminSchools /> },
      { path: 'analytics', element: <SuperAdminAnalytics /> },
      { path: 'payments',  element: <SuperAdminPayments /> },
      { path: 'credits',   element: <SuperAdminCredits /> },
    ],
  },

  // 404
  { path: '*', element: <Navigate to="/" replace /> },
]);
