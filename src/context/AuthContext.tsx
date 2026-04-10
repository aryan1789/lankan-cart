import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS_KEY = 'lankacart_users';
const CURRENT_USER_KEY = 'lankacart_current_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const getStoredUsers = (): Record<string, { user: User; password: string }> => {
    try {
      const data = localStorage.getItem(MOCK_USERS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const users = getStoredUsers();
    const record = users[email.toLowerCase()];
    if (record && record.password === password) {
      setUser(record.user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(record.user));
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const users = getStoredUsers();
    const key = email.toLowerCase();
    if (users[key]) {
      setIsLoading(false);
      return false; // already exists
    }
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email: key,
      phone,
    };
    users[key] = { user: newUser, password };
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
