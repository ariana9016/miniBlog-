import React, { createContext, useEffect, useState, useCallback } from 'react';
import { getMe, login as loginApi, logout as logoutApi, register as registerApi } from '../services/auth';

export const AuthContext = createContext({ user: null, loading: true });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const res = await getMe();
      setUser(res.user);
    } catch (error) {
      if (error.response?.data?.banned) {
        // Handle banned user case - force logout
        alert(error.response.data.message);
        setUser(null);
        // Clear any stored tokens/cookies
        await logoutApi().catch(() => {});
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (payload) => {
    try {
      const res = await loginApi(payload);
      setUser(res.user);
      return res.user;
    } catch (error) {
      if (error.response?.data?.banned) {
        // Handle banned user case
        alert(error.response.data.message);
        setUser(null);
        throw error;
      }
      throw error;
    }
  };

  const register = async (payload) => {
    const res = await registerApi(payload);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


