import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { FiHome, FiUsers, FiAlertTriangle, FiLayers } from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onClose]);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/users', label: 'Users', icon: FiUsers },
    { path: '/issues', label: 'Issues', icon: FiAlertTriangle },
    { path: '/departments', label: 'Departments', icon: FiLayers },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo/Brand */}
        <div className="flex flex-col items-center justify-center h-24 bg-gradient-to-br from-emerald-600 to-emerald-500 shadow">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg mb-2 ring-2 ring-emerald-100">
            <img src="/images/jharkhand-logo.svg" alt="Jharkhand Government" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-white text-lg font-semibold tracking-wide drop-shadow">Jharkhand Admin</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-10 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200 font-medium text-gray-700 ${
                  isActive ? 'bg-emerald-100 text-emerald-700 font-semibold border-l-4 border-emerald-500 shadow' : ''
                }`
              }
              onClick={() => onClose()}
            >
              {(() => {
                const Icon = item.icon;
                return <Icon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;