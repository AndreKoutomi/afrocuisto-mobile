import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types/user';
import { StorageService } from '../services/storage';
import { AuthService, AuthResponse } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: UserProfile | null;
  session: any | null;
  loading: boolean;
  initialLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResponse>;
  verifyOtp: (email: string, token: string, fromReset?: boolean) => Promise<AuthResponse>;
  resendOtp: (email: string, type?: 'signup' | 'email_change') => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  login: () => Promise<void>; // Compatibilité ascendante
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initialisation de la session et synchronisation Supabase
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured()) {
          // Récupère la session active de Supabase
          const { data } = await supabase.auth.getSession();
          if (data.session && mounted) {
            setSession(data.session);
            const profile = await AuthService.getProfile(data.session.user.id, {
              name: data.session.user.user_metadata?.name,
              email: data.session.user.email,
            });
            setUser(profile);
          } else if (mounted) {
            const stored = await StorageService.getItem<UserProfile | null>('afrocuisto_user', null);
            setUser(stored);
          }
        } else {
          // Mode local si Supabase non encore configuré
          const stored = await StorageService.getItem<UserProfile | null>('afrocuisto_user', null);
          if (stored && mounted) {
            setUser(stored);
          } else if (mounted) {
            // Utilisateur par défaut pour la démo
            const defaultUser: UserProfile = {
              id: 'user_andre',
              name: 'André',
              email: 'andre@afrocuisto.app',
              avatarUrl: 'terracotta',
              favoriteRecipeIds: [],
              bio: 'Passionné de gastronomie béninoise et ouest-africaine 🍲',
              region: 'Bénin (Cotonou)',
              dietaryPreference: 'Traditionnel & Épicé',
            };
            setUser(defaultUser);
            await StorageService.setItem('afrocuisto_user', defaultUser);
          }
        }
      } catch (err) {
        console.warn('Auth init error:', err);
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    };

    initAuth();

    // Écouteur en temps réel de changement d'état d'authentification Supabase
    let authListener: any = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);

        if (event === 'SIGNED_IN' && newSession?.user) {
          const profile = await AuthService.getProfile(newSession.user.id, {
            name: newSession.user.user_metadata?.name,
            email: newSession.user.email,
          });
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        } else if (event === 'USER_UPDATED' && newSession?.user) {
          const profile = await AuthService.getProfile(newSession.user.id);
          setUser(profile);
        }
      });
      authListener = data.subscription;
    }

    return () => {
      mounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  // Connexion
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const response = await AuthService.signIn(email, password);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  // Inscription
  const signUp = async (name: string, email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const response = await AuthService.signUp(name, email, password);
      if (response.success && response.user && !response.needsEmailVerification) {
        setUser(response.user);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  // Vérification OTP
  const verifyOtp = async (email: string, token: string, fromReset = false): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const type = fromReset ? 'recovery' : 'signup';
      const response = await AuthService.verifyOtp(email, token, type);
      if (response.success && response.user && !fromReset) {
        setUser(response.user);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  // Renvoi de code OTP
  const resendOtp = async (email: string, type: 'signup' | 'email_change' = 'signup') => {
    return await AuthService.resendOtp(email, type);
  };

  // Envoi réinitialisation mot de passe
  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      return await AuthService.resetPasswordForEmail(email);
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour mot de passe
  const updatePassword = async (newPassword: string) => {
    setLoading(true);
    try {
      return await AuthService.updatePassword(newPassword);
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour du profil utilisateur
  const updateUser = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await AuthService.updateProfile(user.id, data);
    if (updated) {
      setUser(updated);
    }
  };

  // Rechargement du profil
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const profile = await AuthService.getProfile(user.id);
    setUser(profile);
  }, [user?.id]);

  // Déconnexion
  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  // Méthode de connexion rapide de compatibilité
  const login = async () => {
    const defaultUser: UserProfile = {
      id: 'user_andre',
      name: 'André',
      email: 'andre@afrocuisto.app',
      avatarUrl: 'terracotta',
      favoriteRecipeIds: [],
      bio: 'Passionné de gastronomie béninoise et ouest-africaine 🍲',
      region: 'Bénin (Cotonou)',
      dietaryPreference: 'Traditionnel & Épicé',
    };
    setUser(defaultUser);
    await StorageService.setItem('afrocuisto_user', defaultUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        initialLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        verifyOtp,
        resendOtp,
        sendPasswordReset,
        updatePassword,
        updateUser,
        logout,
        login,
        refreshProfile,
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
