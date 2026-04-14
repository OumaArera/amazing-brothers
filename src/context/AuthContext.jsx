import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createData } from '../utils/api';

const AuthContext = createContext(null);

const TOKEN_REFRESH_INTERVAL_MS = 25 * 60 * 1000; 

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setPermissions(null);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('permissions');
  }, []);

  // Load auth data from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAccess = localStorage.getItem('access_token');
    const storedRefresh = localStorage.getItem('refresh_token');
    const storedPermissions = localStorage.getItem('permissions');

    if (storedUser && storedAccess && storedRefresh) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
      setPermissions(storedPermissions ? JSON.parse(storedPermissions) : null);
    }
    setLoading(false);
  }, []);

  // Setup token refresh every 25 minutes
  useEffect(() => {
    if (!refreshToken) return;

    const refreshAccessToken = async () => {
      try {
        const response = await createData('refresh/token/', { refresh: refreshToken });
        if (response?.access) {
          setAccessToken(response.access);
          localStorage.setItem('access_token', response.access);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    };

    const refreshInterval = setInterval(refreshAccessToken, TOKEN_REFRESH_INTERVAL_MS);
    return () => clearInterval(refreshInterval);
  }, [refreshToken, logout]);

  const login = useCallback((userData, tokens, userPermissions = null) => {
    setUser(userData);
    setAccessToken(tokens.access);
    setRefreshToken(tokens.refresh);
    setPermissions(userPermissions);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('permissions', JSON.stringify(userPermissions));
  }, []);

  const value = {
    user,
    accessToken,
    refreshToken,
    permissions,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};