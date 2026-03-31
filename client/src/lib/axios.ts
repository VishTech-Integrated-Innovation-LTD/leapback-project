import axios from 'axios';

// --------------------------------------------------------------------------------
// AXIOS INSTANCE
// Central HTTP client for all API calls - never import axios directly in pages
// Backend URL reads from .env so switching between dev and prod needs no code change
// --------------------------------------------------------------------------------

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,   // 15 seconds - avoids hanging requests on slow connections
});

// --------------------------------------------------------------------------------
// REQUEST INTERCEPTOR
// Automatically attaches the JWT token to every outgoing request
// Staff never has to manually set Authorization headers anywhere in the app
// --------------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    // Read token from localStorage - set there on login by the auth store
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------------------------------------------------------------
// RESPONSE INTERCEPTOR
// Handles 401 responses globally - if the token is expired or invalid,
// clear local storage and redirect to login automatically
// Staff won't get stuck on a broken state after a session expires
// --------------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login page if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;