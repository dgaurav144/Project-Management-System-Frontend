import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const toast = useToast();

  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
      setAuthModalOpen(true);
    };

    window.addEventListener('pulseflow_logout', handleLogoutEvent);

    // Verify session on app mount directly via HTTP-only cookie
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.data.user);
      })
      .catch(() => {
        // Not logged in or expired cookie
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      window.removeEventListener('pulseflow_logout', handleLogoutEvent);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userData } = res.data.data;
      setUser(userData);
      setAuthModalOpen(false);
      toast.success(`Welcome back, ${userData.name}!`);
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err, 'Login failed. Please check your email and password.');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (name, email, password, role = 'user') => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { user: userData } = res.data.data;
      setUser(userData);
      setAuthModalOpen(false);
      toast.success(`Account created! Welcome, ${userData.name}`);
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err, 'Registration failed. Please check your information.');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      localStorage.removeItem('pulseflow_active_project_id');
      localStorage.removeItem('pulseflow_active_project_data');
      localStorage.removeItem('pulseflow_active_board_id');
      localStorage.removeItem('pulseflow_active_board_data');
      toast.info('You have been signed out');
    }
  };

  const quickLogin = async (demoAccount) => {
    return login(demoAccount.email, demoAccount.password);
  };

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuth = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        quickLogin,
        authModalOpen,
        authMode,
        openAuth,
        closeAuth,
        setAuthMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
