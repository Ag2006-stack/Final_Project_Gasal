import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('auth_user_cache');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user_cache');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:unauthorized', logout);
    return () => window.removeEventListener('auth:unauthorized', logout);
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    authApi
      .me(controller.signal)
      .then(({ data }) => {
        const verifiedUser = data?.user || data;
        setUser(verifiedUser);
        localStorage.setItem('auth_user_cache', JSON.stringify(verifiedUser));
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && err.status === 401) {
          logout();
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [token, logout]);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user_cache', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user_cache', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token),
        isAdmin: user?.role === 'admin',
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}