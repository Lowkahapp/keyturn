import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import ListProperty from './pages/ListProperty';
import OwnerDashboard from './pages/OwnerDashboard';
import ScoutDashboard from './pages/ScoutDashboard';
import Chat from './pages/Chat';
import VisitSchedule from './pages/VisitSchedule';
import Agreement from './pages/Agreement';
import Payment from './pages/Payment';
import Login from './pages/Login';
import Transactions from './pages/Transactions';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.user_type)) return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/property/:id"   element={<PropertyDetail />} />
        <Route path="/list-property"  element={<ProtectedRoute roles={['owner','admin']}><ListProperty /></ProtectedRoute>} />
        <Route path="/owner"          element={<ProtectedRoute roles={['owner','admin']}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/scout"          element={<ProtectedRoute roles={['scout']}><ScoutDashboard /></ProtectedRoute>} />
        <Route path="/chat"           element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chat/:roomId"   element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/visits"         element={<ProtectedRoute><VisitSchedule /></ProtectedRoute>} />
        <Route path="/transactions"   element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/agreement/:id"  element={<ProtectedRoute><Agreement /></ProtectedRoute>} />
        <Route path="/payment/:type/:id" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/admin"          element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="*"               element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}