import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Mock user type for now - will be replaced with Supabase types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'superadmin' | 'admin' | 'user';
  avatar?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demo purposes - replace with Supabase when connected
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@sporthub.com',
    fullName: 'Super Admin',
    role: 'superadmin',
    createdAt: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('sporthub_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock authentication - replace with Supabase
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const foundUser = MOCK_USERS.find(u => u.email === email);
      if (foundUser && password.length >= 6) {
        setUser(foundUser);
        localStorage.setItem('sporthub_user', JSON.stringify(foundUser));
        return { error: null };
      }
      
      // For demo: create user on the fly
      if (password.length >= 6) {
        const newUser: User = {
          id: Date.now().toString(),
          email,
          fullName: email.split('@')[0],
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        setUser(newUser);
        localStorage.setItem('sporthub_user', JSON.stringify(newUser));
        return { error: null };
      }
      
      return { error: 'Credenciales inválidas' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      // Mock registration - replace with Supabase
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (MOCK_USERS.find(u => u.email === email)) {
        return { error: 'Este email ya está registrado' };
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        email,
        fullName,
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      
      MOCK_USERS.push(newUser);
      setUser(newUser);
      localStorage.setItem('sporthub_user', JSON.stringify(newUser));
      return { error: null };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('sporthub_user');
  };

  const resetPassword = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Mock - replace with Supabase
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, resetPassword }}>
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
