import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../../lib/api';
export type UserRole = 'admin' | 'recruiter' | 'candidate';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_URL = 'http://localhost:5000/api';



api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url;

    const isAuthRoute =
      requestUrl?.includes('/auth/signin') ||
      requestUrl?.includes('/auth/signup');

    if (status === 401 && !isAuthRoute) {
      const currentPath = window.location.pathname;

      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('email');
      localStorage.removeItem('name');

      if (currentPath !== '/signin') {
        window.location.href = '/signin';
      }
    }

    return Promise.reject(error);
  }
);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeRole = (role: string): UserRole => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'admin') return 'admin';
    if (roleLower === 'recruiter') return 'recruiter';
    if (roleLower === 'candidate') return 'candidate';
    return 'candidate'; 
  };

  const fetchUserProfile = async (role: string, userId: string): Promise<User | null> => {
    try {
      let userData: User;
      const normalizedRole = normalizeRole(role);

      if (role === 'ADMIN' || normalizedRole === 'admin') {
        const email = localStorage.getItem('email') || '';
        const name = localStorage.getItem('name') || 'Admin User';
        userData = {
          id: userId,
          email,
          name,
          role: 'admin'
        };
      } else if (role === 'RECRUITER' || normalizedRole === 'recruiter') {
        const email = localStorage.getItem('email') || '';
        const name = localStorage.getItem('name') || 'Recruiter';
        userData = {
          id: userId,
          email,
          name,
          role: 'recruiter'
        };
      } else {
        const response = await api.get('/candidate/profile');
        userData = {
          id: response.data.userId,
          email: response.data.email,
          name: response.data.name,
          role: 'candidate'
        };
      }

      return userData;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const userId = localStorage.getItem('userId');

      if (token && role && userId) {
        const userData = await fetchUserProfile(role, userId);
        if (userData) {
          setUser(userData);
        } else {
          logout();
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/signin', {
        email,
        password
      });

      const { token, userId, role } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('role', role);
      localStorage.setItem('email', email);

      const userData = await fetchUserProfile(role, userId);

      if (userData) {
        setUser(userData);
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('email');

      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  };

  const signup = async (name: string, email: string, password: string, phone: string) => {
    try {
      const response = await api.post('/auth/signup', {
        name,
        email,
        password,
        phone
      });

      const { token, userId, role } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('role', role);
      localStorage.setItem('email', email);
      localStorage.setItem('name', name);

      const userData = await fetchUserProfile(role, userId);

      if (userData) {
        setUser(userData);
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('email');
      localStorage.removeItem('name');

      if (error.response?.status === 409) {
        throw new Error('Email already exists');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Signup failed. Please try again.');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { api };
