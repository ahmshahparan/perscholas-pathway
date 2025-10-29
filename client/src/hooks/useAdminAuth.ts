import { useState, useEffect } from "react";

const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USERNAME_KEY = "admin_username";
const ADMIN_ROLE_KEY = "admin_role";

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    }
    return null;
  });

  const [username, setUsername] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ADMIN_USERNAME_KEY);
    }
    return null;
  });

  const [role, setRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ADMIN_ROLE_KEY);
    }
    return null;
  });

  const login = (newToken: string, newUsername: string, newRole?: string) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
    localStorage.setItem(ADMIN_USERNAME_KEY, newUsername);
    if (newRole) {
      localStorage.setItem(ADMIN_ROLE_KEY, newRole);
      setRole(newRole);
    }
    setToken(newToken);
    setUsername(newUsername);
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USERNAME_KEY);
    localStorage.removeItem(ADMIN_ROLE_KEY);
    setToken(null);
    setUsername(null);
    setRole(null);
  };

  const isAuthenticated = !!token;

  return {
    token,
    username,
    role,
    isAuthenticated,
    login,
    logout,
  };
}

