import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Login'));
const FarmerDashboard = lazy(() => import('./pages/farmer/FarmerDashboard'));
const ProduceRegistration = lazy(() => import('./pages/farmer/ProduceRegistration'));
const CentreSelection = lazy(() => import('./pages/farmer/CentreSelection'));
const SlotBooking = lazy(() => import('./pages/farmer/SlotBooking'));
const DigitalToken = lazy(() => import('./pages/farmer/DigitalToken'));
const LiveQueue = lazy(() => import('./pages/farmer/LiveQueue'));
const ProcurementProgress = lazy(() => import('./pages/farmer/ProcurementProgress'));
const PaymentStatus = lazy(() => import('./pages/farmer/PaymentStatus'));
const FarmerNotifications = lazy(() => import('./pages/farmer/Notifications'));
const FarmerProfile = lazy(() => import('./pages/farmer/Profile'));
const OfficerDashboard = lazy(() => import('./pages/officer/OfficerDashboard'));
const OfficerQueue = lazy(() => import('./pages/officer/LiveQueueManagement'));
const OfficerProcurement = lazy(() => import('./pages/officer/ProcurementManagement'));
const OfficerFarmers = lazy(() => import('./pages/officer/FarmerManagement'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CentreMonitoring = lazy(() => import('./pages/admin/CentreMonitoring'));
const AdminSlots = lazy(() => import('./pages/admin/SlotManagement'));
const PaymentMonitoring = lazy(() => import('./pages/admin/PaymentMonitoring'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Reports = lazy(() => import('./pages/admin/Reports'));

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
      <p className="text-gray-500">Loading...</p>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Farmer Routes */}
        <Route path="/farmer" element={<ProtectedRoute roles={['FARMER']}><FarmerDashboard /></ProtectedRoute>} />
        <Route path="/farmer/produce" element={<ProtectedRoute roles={['FARMER']}><ProduceRegistration /></ProtectedRoute>} />
        <Route path="/farmer/centres" element={<ProtectedRoute roles={['FARMER']}><CentreSelection /></ProtectedRoute>} />
        <Route path="/farmer/slots" element={<ProtectedRoute roles={['FARMER']}><SlotBooking /></ProtectedRoute>} />
        <Route path="/farmer/token" element={<ProtectedRoute roles={['FARMER']}><DigitalToken /></ProtectedRoute>} />
        <Route path="/farmer/queue" element={<ProtectedRoute roles={['FARMER']}><LiveQueue /></ProtectedRoute>} />
        <Route path="/farmer/procurement" element={<ProtectedRoute roles={['FARMER']}><ProcurementProgress /></ProtectedRoute>} />
        <Route path="/farmer/payment" element={<ProtectedRoute roles={['FARMER']}><PaymentStatus /></ProtectedRoute>} />
        <Route path="/farmer/notifications" element={<ProtectedRoute roles={['FARMER']}><FarmerNotifications /></ProtectedRoute>} />
        <Route path="/farmer/profile" element={<ProtectedRoute roles={['FARMER']}><FarmerProfile /></ProtectedRoute>} />

        {/* Officer Routes */}
        <Route path="/officer" element={<ProtectedRoute roles={['OFFICER']}><OfficerDashboard /></ProtectedRoute>} />
        <Route path="/officer/queue" element={<ProtectedRoute roles={['OFFICER']}><OfficerQueue /></ProtectedRoute>} />
        <Route path="/officer/procurement" element={<ProtectedRoute roles={['OFFICER']}><OfficerProcurement /></ProtectedRoute>} />
        <Route path="/officer/farmers" element={<ProtectedRoute roles={['OFFICER']}><OfficerFarmers /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/centres" element={<ProtectedRoute roles={['ADMIN']}><CentreMonitoring /></ProtectedRoute>} />
        <Route path="/admin/slots" element={<ProtectedRoute roles={['ADMIN']}><AdminSlots /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute roles={['ADMIN']}><PaymentMonitoring /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['ADMIN']}><Analytics /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN']}><Reports /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppRoutes />
      </LanguageProvider>
    </AuthProvider>
  );
}
