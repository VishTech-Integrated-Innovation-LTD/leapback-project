import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

// --------------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------------

export type UserRole = 'chief_admin' | 'admin' | 'staff';


// Shape of the decoded JWT payload - matches what the backend encodes on login
interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  exp: number;   // expiry timestamp - used to check if token is still valid
}

// The logged-in user object stored in Zustand state
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Shape of the auth store
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isTokenValid: () => boolean;
}

// --------------------------------------------------------------------------------
// AUTH STORE
// persist middleware saves state to localStorage automatically
// so the user stays logged in across page refreshes
// --------------------------------------------------------------------------------
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Called after a successful login API response
      // Stores the token and user info in state and localStorage
      login: (token: string, user: AuthUser) => {
        localStorage.setItem('token', token);
        set({ token, user, isAuthenticated: true });
      },

      // Clears all auth state - called on logout or 401 response
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false });
      },

      // Returns true only if:
      //   1. A token exists
      //   2. It hasn't expired
      //   3. It contains a `role` field
      // Checks if the stored JWT is still valid (not expired)
      // Used by ProtectedRoute to decide whether to redirect to login
      isTokenValid: () => {
        const token = get().token;
        if (!token) return false;

        try {
          const decoded = jwtDecode<JwtPayload>(token);
          // exp is in seconds, Date.now() is in milliseconds
          const notExpired = decoded.exp * 1000 > Date.now();
          const hasRole = Boolean(decoded.role);
          return notExpired && hasRole;
        } catch {
          // If decoding fails the token is malformed - treat as invalid
          return false;
        }
      },
    }),
    {
      name: 'leapback-auth',   // localStorage key
      // Only persist token and user - isAuthenticated is derived
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);