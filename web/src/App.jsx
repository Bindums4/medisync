import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import PublicLayout from './components/PublicLayout';
import AppLayout from './components/AppLayout';
import Landing from './pages/Landing';
import Doctors from './pages/Doctors';
import DoctorPage from './pages/DoctorPage';
import Auth from './pages/Auth';
import Symptoms from './pages/Symptoms';
import Profile from './pages/Profile';
import AppointmentView from './pages/AppointmentView';
import PatientDashboard from './pages/patient/Dashboard';
import PatientAppointments from './pages/patient/Appointments';
import Records from './pages/patient/Records';
import Reminders from './pages/patient/Reminders';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import Availability from './pages/doctor/Availability';
import AdminDashboard from './pages/admin/Dashboard';
import AdminDoctors from './pages/admin/Doctors';
import AdminUsers from './pages/admin/Users';
import AdminAppointments from './pages/admin/Appointments';

function ByRole({ patient, doctor, admin }) {
  const { user } = useAuth();
  return { patient, doctor, admin }[user.role] || <Navigate to="/app" replace />;
}
function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorPage />} />
        <Route path="/symptoms" element={<Symptoms />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
      </Route>
      <Route path="/app" element={<Private><AppLayout /></Private>}>
        <Route index element={<ByRole patient={<PatientDashboard />} doctor={<DoctorDashboard />} admin={<AdminDashboard />} />} />
        <Route path="appointments" element={<ByRole patient={<PatientAppointments />} doctor={<DoctorAppointments />} admin={<AdminAppointments />} />} />
        <Route path="appointments/:id" element={<AppointmentView />} />
        <Route path="records" element={<ByRole patient={<Records />} />} />
        <Route path="reminders" element={<ByRole patient={<Reminders />} />} />
        <Route path="symptoms" element={<Symptoms inApp />} />
        <Route path="availability" element={<ByRole doctor={<Availability />} />} />
        <Route path="doctors" element={<ByRole admin={<AdminDoctors />} />} />
        <Route path="users" element={<ByRole admin={<AdminUsers />} />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
