// ============================================================
// NEW FILE: src/router/RoleRoute.tsx
// A route guard that checks the user's role before rendering.
// Redirects to /dashboard if the role isn't allowed.
//
// Usage in AppRouter:
//   <Route element={<RoleRoute allowed={['chief_admin', 'admin']} />}>
//     <Route path="/invoices" element={<InvoicesPage />} />
//   </Route>
// ============================================================

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore }     from '../stores/authStore';  
import type { UserRole }    from '../stores/authStore';

interface RoleRouteProps {
    allowed:    UserRole[];
    redirectTo?: string;
}

const RoleRoute = ({ allowed, redirectTo = '/dashboard' }: RoleRouteProps) => {
    const user = useAuthStore((s) => s.user);

    // Not logged in at all — let ProtectedRoute handle this,
    // but guard here too just in case
    if (!user) return <Navigate to="/" replace />;

    if (!allowed.includes(user.role)) {
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
};

export default RoleRoute;
