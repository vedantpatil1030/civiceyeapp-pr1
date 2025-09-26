import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

const Navbar = ({ onMenuClick }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="text-white focus:outline-none lg:hidden"
            aria-label="Open menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-4">
            <h2 className="text-2xl font-semibold text-white drop-shadow-lg tracking-tight">
              Jharkhand Municipal Admin Dashboard
            </h2>
            <p className="text-emerald-50/90 text-sm">Manage departments, issues and staff</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 active:bg-rose-200 shadow-sm"
            title="Logout"
          >
            <FiLogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;