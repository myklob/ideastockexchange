import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');

    if (token) {
      // Fetch full user data from API to get votedArguments
      authAPI.getCurrentUser()
        .then((response) => {
          if (response.success) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        })
        .catch((err) => {
          console.error('Failed to fetch user:', err);
          // Fall back to stored user if API fails
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      if (response.success) {
        // Fetch full user data including votedArguments
        const userResponse = await authAPI.getCurrentUser();
        if (userResponse.success) {
          setUser(userResponse.data);
          localStorage.setItem('user', JSON.stringify(userResponse.data));
        } else {
          setUser(response.data.user);
        }
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      if (response.success) {
        // Fetch full user data including votedArguments
        const userResponse = await authAPI.getCurrentUser();
        if (userResponse.success) {
          setUser(userResponse.data);
          localStorage.setItem('user', JSON.stringify(userResponse.data));
        } else {
          setUser(response.data.user);
        }
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
