import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/user';
import { StorageService } from '../services/storage';

interface AuthContextType {
  user: UserProfile | null;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  login: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>({
    id: 'user_andre',
    name: 'André',
    email: 'andre@afrocuisto.app',
    avatarUrl: null,
    favoriteRecipeIds: [],
    bio: 'Passionné de gastronomie béninoise et ouest-africaine 🍲',
    region: 'Bénin (Cotonou)',
    dietaryPreference: 'Traditionnel & Épicé',
  });

  useEffect(() => {
    (async () => {
      const stored = await StorageService.getItem<UserProfile | null>('afrocuisto_user', null);
      if (stored) setUser(stored);
    })();
  }, []);

  const updateUser = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    await StorageService.setItem('afrocuisto_user', updated);
  };

  const logout = async () => {
    setUser(null);
    await StorageService.removeItem('afrocuisto_user');
  };

  const login = async () => {
    const defaultUser: UserProfile = {
      id: 'user_andre',
      name: 'André',
      email: 'andre@afrocuisto.app',
      avatarUrl: null,
      favoriteRecipeIds: [],
      bio: 'Passionné de gastronomie béninoise et ouest-africaine 🍲',
      region: 'Bénin (Cotonou)',
      dietaryPreference: 'Traditionnel & Épicé',
    };
    setUser(defaultUser);
    await StorageService.setItem('afrocuisto_user', defaultUser);
  };

  return (
    <AuthContext.Provider value={{ user, updateUser, logout, login }}>
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
