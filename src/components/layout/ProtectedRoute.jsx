import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — blocks unauthenticated access.
 * Pass `allowedRoles` array to restrict by role e.g. ['admin','manager'].
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0618' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl animate-pulse"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 0 24px rgba(124,58,237,0.5)' }} />
          <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const isManager = user?.role === 'admin' || user?.role === 'manager';
    return <Navigate to={isManager ? '/manager' : '/caregiver'} replace />;
  }

  return children;
};

export default ProtectedRoute;