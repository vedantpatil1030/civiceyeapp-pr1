import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
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
          <h2 className="text-2xl font-bold text-white ml-4 drop-shadow-lg tracking-wide">
            Welcome to Municipal Admin Dashboard
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white rounded-full px-3 py-1 shadow">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white">
              M
            </div>
            <span className="text-gray-800 font-semibold text-base"></span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md text-base font-semibold shadow transition duration-200"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;