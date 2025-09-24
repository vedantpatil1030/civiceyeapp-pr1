import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';

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
    {
      path: '/',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0H7m6 0v6m0 0h6m-6 0H7" /></svg>
      ),
    },
    {
      path: '/users',
      label: 'Users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
      ),
    },
    {
      path: '/issues',
      label: 'Issues',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      ),
    },
    {
      path: '/departments',
      label: 'Departments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3v6a1 1 0 001 1h4a1 1 0 001-1v-6h3a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1z" /></svg>
      ),
    },
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
        <div className="flex flex-col items-center justify-center h-24 bg-gradient-to-br from-blue-600 to-purple-600 shadow">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg mb-2">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </div>
          <h1 className="text-white text-lg font-bold tracking-wide drop-shadow"></h1>
        </div>

        {/* Navigation */}
        <nav className="mt-10 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 font-medium text-gray-700 ${
                  isActive ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-500 shadow' : ''
                }`
              }
              onClick={() => onClose()}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;