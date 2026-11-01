import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setCurrentUserId, getCurrentUserId } from '../services/api';

interface AuthContextType {
  user: User | null;
  availableAccounts: any[];
  isLoading: boolean;
  isSuperAdmin: boolean;
  switchAccount: (userId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  logout: () => void;
  publicViewMode: boolean;
  setPublicViewMode: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [publicViewMode, setPublicViewMode] = useState<boolean>(false);

  const fetchAuth = async () => {
    try {
      setIsLoading(true);
      const res = await api.getMe();
      setUser(res.user);
      setAvailableAccounts(res.availableAccounts);
    } catch (err) {
      console.error('Failed to load user auth:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth();
  }, []);

  const switchAccount = async (userId: string) => {
    try {
      setIsLoading(true);
      const res = await api.switchAccount(userId);
      setUser(res.user);
      setCurrentUserId(userId);
      setPublicViewMode(false);
    } catch (err) {
      console.error('Failed to switch account:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setPublicViewMode(true);
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        availableAccounts,
        isLoading,
        isSuperAdmin,
        switchAccount,
        refreshAuth: fetchAuth,
        logout,
        publicViewMode,
        setPublicViewMode
      }}
    >
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
