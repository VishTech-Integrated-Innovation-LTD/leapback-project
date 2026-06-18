// ============================================================
// Updated to read from Zustand authStore 
// ============================================================

import { useAuthStore }   from '../stores/authStore';     
import { getPermissions } from '../utils/permissions';
import type { Permissions, UserRole } from '../utils/permissions';

export type { Permissions, UserRole };

export const usePermissions = (): Permissions => {
    const user = useAuthStore((s) => s.user);
    const role = (user?.role ?? 'staff') as UserRole;
    return getPermissions(role);
};
