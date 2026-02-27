'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('techwiser_user');
    if (storedUser) {
      setTimeout(() => setUser(JSON.parse(storedUser)), 0);
    }
    setTimeout(() => setIsLoading(false), 0);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          const mockUser = {
            id: 'user_' + Date.now(),
            email,
            name: email.split('@')[0],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
          };
          setUser(mockUser);
          localStorage.setItem('techwiser_user', JSON.stringify(mockUser));
          resolve();
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  };

  const signup = async (email: string, password: string, name: string) => {
    // Simulate API call
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (email && password && name) {
          const mockUser = {
            id: 'user_' + Date.now(),
            email,
            name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
          };
          setUser(mockUser);
          localStorage.setItem('techwiser_user', JSON.stringify(mockUser));
          resolve();
        } else {
          reject(new Error('Invalid data'));
        }
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('techwiser_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      isAuthenticated: !!user,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
