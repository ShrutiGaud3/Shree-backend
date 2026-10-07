import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setToken as persistToken, getToken } from "../api/client.js";

const AuthContext = createContext(null);
const USER_KEY = "shree_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  const saveSession = (data) => {
    persistToken(data.token);
    const { token: _t, ...rest } = data;
    setUser(rest);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      saveSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      saveSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    persistToken(null);
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isLoggedIn: Boolean(user && getToken()),
      isAdmin: Boolean(user?.isAdmin),
      login,
      register,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
