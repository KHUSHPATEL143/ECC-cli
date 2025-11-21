import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedEmail = localStorage.getItem('userEmail');
    const storedIsAdmin = localStorage.getItem('isAdmin');

    if (storedAuth === 'true' && storedEmail) {
      setUser({
        email: storedEmail,
        isAuthenticated: true,
        isAdmin: storedIsAdmin === 'true',
      });
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('isAdmin', String(userData.isAdmin));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};