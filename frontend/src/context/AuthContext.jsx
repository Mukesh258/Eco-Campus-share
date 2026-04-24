import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../api/services";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem("ecoShareAuth");
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync with localStorage
  useEffect(() => {
    if (auth) {
      localStorage.setItem("ecoShareAuth", JSON.stringify(auth));
    } else {
      localStorage.removeItem("ecoShareAuth");
    }
  }, [auth]);

  // Listen for global logout event (from axios interceptor)
  useEffect(() => {
    const handleLogout = () => {
      setAuth(null);
    };

    window.addEventListener("auth-logout", handleLogout);
    return () => window.removeEventListener("auth-logout", handleLogout);
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.login(credentials);
      setAuth(data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.register(payload);
      setAuth(data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuth(null);
    setError(null);
  };

  const value = {
    auth,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!auth?.token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
