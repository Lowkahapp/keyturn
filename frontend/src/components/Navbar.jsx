import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, PlusSquare, MessageCircle, User, LogOut, ClipboardList, MapPin } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Key<span className="text-primary">Turn</span></span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-primary font-medium text-sm transition-colors">
              Find Home
            </Link>
            {user?.user_type === 'owner' && (
              <Link to="/list-property" className="text-gray-600 hover:text-primary font-medium text-sm transition-colors">
                List Property
              </Link>
            )}
            {user?.user_type === 'scout' && (
              <Link to="/scout" className="text-gray-600 hover:text-primary font-medium text-sm transition-colors">
                My Tasks
              </Link>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/chat" className="relative p-2 text-gray-500 hover:text-primary transition-colors">
                  <MessageCircle size={20} />
                </Link>
                <Link to="/transactions" className="p-2 text-gray-500 hover:text-primary transition-colors">
                  <ClipboardList size={20} />
                </Link>
                {user.user_type === 'owner' && (
                  <Link to="/owner" className="p-2 text-gray-500 hover:text-primary transition-colors">
                    <User size={20} />
                  </Link>
                )}
                <Link to="/list-property" className="btn-primary text-sm py-2 px-4 hidden md:block">
                  + List Property
                </Link>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2 px-5">
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
