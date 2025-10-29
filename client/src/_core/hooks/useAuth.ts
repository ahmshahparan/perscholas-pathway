// OAuth removed - using admin_users authentication only
// This hook is kept as a stub to avoid breaking imports

export function useAuth() {
  return {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    refresh: () => Promise.resolve(),
    logout: () => Promise.resolve(),
  };
}

