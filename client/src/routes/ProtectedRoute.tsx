import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// --------------------------------------------------------------------------------
// PROTECTED ROUTE
// Wraps all routes that require authentication
// If the token is missing or expired, redirects to the login page
// Usage in AppRouter: wrap any route with <ProtectedRoute> as the element
// --------------------------------------------------------------------------------
const ProtectedRoute = () => {
  const isTokenValid = useAuthStore((state) => state.isTokenValid);

  if (!isTokenValid()) {
    // replace prevents the protected route from being added to browser history
    // so pressing Back after a redirect doesn't loop back to a broken page
    return <Navigate to="/" replace />;
  }

  // Outlet renders the child route component
  return <Outlet />;
};

export default ProtectedRoute;