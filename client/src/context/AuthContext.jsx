import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("mq_token"));
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("mq_token", token);
    } else {
      localStorage.removeItem("mq_token");
    }
  }, [token]);

  // Load user profile on mount or token change
  useEffect(() => {
    if (!token) {
      setUser(null);
      setWorkspace(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .getMe()
      .then((data) => {
        setUser(data.user);
        setWorkspace(data.workspace);
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    setWorkspace(data.workspace);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.register({ name, email, password });
    setToken(data.token);
    setUser(data.user);
    setWorkspace(data.workspace);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setWorkspace(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      workspace,
      loading,
      login,
      register,
      logout,
      setWorkspace,
    }),
    [token, user, workspace, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
