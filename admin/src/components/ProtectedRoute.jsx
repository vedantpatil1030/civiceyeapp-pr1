import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  // TEMPORARY: Authentication bypass for development
  // TODO: REMOVE THIS BEFORE PRODUCTION
  return children;

  // Original authentication logic (commented out temporarily)
  /*
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
  */
};

export default ProtectedRoute;