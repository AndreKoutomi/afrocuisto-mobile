import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile } from '../types/user';
import { StorageService } from './storage';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: UserProfile | null;
  needsEmailVerification?: boolean;
}

// Convertit les erreurs Supabase en messages clairs et compréhensibles en français
export const formatAuthError = (error: any): string => {
  if (!error) return 'Une erreur inattendue est survenue.';
  const msg = typeof error === 'string' ? error : error.message || '';

  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Adresse e-mail ou mot de passe incorrect.';
  }
  if (msg.includes('User already registered') || msg.includes('already exists')) {
    return 'Un compte existe déjà avec cette adresse e-mail.';
  }
  if (msg.includes('Password should be at least') || msg.includes('weak_password')) {
    return 'Le mot de passe doit comporter au moins 6 caractères.';
  }
  if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Veuillez confirmer votre adresse e-mail avant de vous connecter.';
  }
  if (msg.includes('Token has expired') || msg.includes('otp_expired')) {
    return 'Le code de vérification a expiré. Veuillez en demander un nouveau.';
  }
  if (msg.includes('Invalid token') || msg.includes('invalid_otp')) {
    return 'Code OTP incorrect. Veuillez vérifier les 6 chiffres saisis.';
  }
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
    return 'Trop de tentatives en peu de temps. Veuillez patienter un instant.';
  }
  if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
    return 'Erreur de connexion réseau. Veuillez vérifier votre connexion Internet.';
  }

  return msg || 'Une erreur est survenue lors de l’opération.';
};

export const AuthService = {
  // Inscription d'un nouvel utilisateur
  async signUp(name: string, email: string, password: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      // Fallback local sécurisé si la clé anon n'est pas encore saisie
      const localUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        avatarUrl: 'terracotta',
        favoriteRecipeIds: [],
        bio: 'Passionné de gastronomie africaine et de cuisine authentique 🍲',
        region: 'Bénin (Cotonou)',
        dietaryPreference: 'Traditionnel & Épicé',
      };
      await StorageService.setItem('afrocuisto_user', localUser);
      return { success: true, user: localUser, needsEmailVerification: false };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        return { success: false, error: formatAuthError(error) };
      }

      const user = data.user;
      if (!user) {
        return { success: false, error: 'Impossible de créer le compte.' };
      }

      // Si l'email nécessite confirmation
      const needsEmailVerification = !data.session && !user.confirmed_at;

      // Création / vérification du profil
      const profile = await this.getProfile(user.id, {
        name: name.trim(),
        email: user.email || email.trim(),
      });

      return {
        success: true,
        user: profile,
        needsEmailVerification,
      };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err) };
    }
  },

  // Connexion email / mot de passe
  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      // Mode de secours
      const localUser: UserProfile = {
        id: 'user_andre',
        name: email.split('@')[0] || 'Chef Gourmet',
        email: email.trim(),
        avatarUrl: 'terracotta',
        favoriteRecipeIds: [],
        bio: 'Passionné de gastronomie béninoise et ouest-africaine 🍲',
        region: 'Bénin (Cotonou)',
        dietaryPreference: 'Traditionnel & Épicé',
      };
      await StorageService.setItem('afrocuisto_user', localUser);
      return { success: true, user: localUser };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: formatAuthError(error) };
      }

      if (!data.user) {
        return { success: false, error: 'Utilisateur introuvable.' };
      }

      const profile = await this.getProfile(data.user.id, {
        name: data.user.user_metadata?.name || email.split('@')[0],
        email: data.user.email || email.trim(),
      });

      return { success: true, user: profile };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err) };
    }
  },

  // Vérification de code OTP (Confirmation d'inscription ou mot de passe oublié)
  async verifyOtp(
    email: string,
    token: string,
    type: 'signup' | 'recovery' | 'email' = 'email'
  ): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      const stored = await StorageService.getItem<UserProfile | null>('afrocuisto_user', null);
      return { success: true, user: stored };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type,
      });

      if (error) {
        return { success: false, error: formatAuthError(error) };
      }

      if (!data.user) {
        return { success: true };
      }

      const profile = await this.getProfile(data.user.id, {
        name: data.user.user_metadata?.name || email.split('@')[0],
        email: data.user.email || email.trim(),
      });

      return { success: true, user: profile };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err) };
    }
  },

  // Renvoi d'un code OTP
  async resendOtp(email: string, type: 'signup' | 'email_change' = 'signup'): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resend({
        type,
        email: email.trim(),
      });

      if (error) {
        return { success: false, error: formatAuthError(error) };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err) };
    }
  },

  // Envoi de l'email de réinitialisation de mot de passe
  async resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        return { success: false, error: formatAuthError(error) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err) };
    }
  },

  // Mise à jour du mot de passe
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: formatAuthError(error) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err) };
    }
  },

  // Déconnexion
  async signOut(): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Sign out error:', e);
    } finally {
      await StorageService.removeItem('afrocuisto_user');
    }
  },

  // Récupération du profil depuis la table profiles
  async getProfile(
    userId: string,
    fallbackData?: { name?: string; email?: string }
  ): Promise<UserProfile> {
    const defaultProfile: UserProfile = {
      id: userId,
      name: fallbackData?.name || 'Chef Gourmet',
      email: fallbackData?.email || '',
      avatarUrl: 'terracotta',
      favoriteRecipeIds: [],
      bio: 'Passionné de gastronomie africaine et de cuisine authentique 🍲',
      region: 'Bénin (Cotonou)',
      dietaryPreference: 'Traditionnel & Épicé',
    };

    if (!isSupabaseConfigured()) {
      const stored = await StorageService.getItem<UserProfile | null>('afrocuisto_user', null);
      return stored || defaultProfile;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        // Si le profil n'existe pas encore, on tente de le créer
        if (fallbackData?.name && fallbackData?.email) {
          await supabase.from('profiles').upsert({
            id: userId,
            name: fallbackData.name,
            email: fallbackData.email,
            avatar_url: 'terracotta',
            bio: defaultProfile.bio,
            region: defaultProfile.region,
            dietary_preference: defaultProfile.dietaryPreference,
          });
        }
        await StorageService.setItem('afrocuisto_user', defaultProfile);
        return defaultProfile;
      }

      const formatted: UserProfile = {
        id: data.id,
        name: data.name || defaultProfile.name,
        email: data.email || defaultProfile.email,
        avatarUrl: data.avatar_url || 'terracotta',
        favoriteRecipeIds: data.favorite_recipe_ids || [],
        bio: data.bio || defaultProfile.bio,
        region: data.region || defaultProfile.region,
        dietaryPreference: data.dietary_preference || defaultProfile.dietaryPreference,
      };

      await StorageService.setItem('afrocuisto_user', formatted);
      return formatted;
    } catch (err) {
      console.warn('Error fetching Supabase profile:', err);
      const stored = await StorageService.getItem<UserProfile | null>('afrocuisto_user', null);
      return stored || defaultProfile;
    }
  },

  // Mise à jour du profil utilisateur
  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      if (isSupabaseConfigured()) {
        const payload: Record<string, any> = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;
        if (data.bio !== undefined) payload.bio = data.bio;
        if (data.region !== undefined) payload.region = data.region;
        if (data.dietaryPreference !== undefined) payload.dietary_preference = data.dietaryPreference;
        if (data.favoriteRecipeIds !== undefined) payload.favorite_recipe_ids = data.favoriteRecipeIds;

        await supabase.from('profiles').update(payload).eq('id', userId);
      }

      const current = await StorageService.getItem<UserProfile | null>('afrocuisto_user', null);
      const updated = { ...(current || { id: userId, name: '', email: '', favoriteRecipeIds: [] }), ...data };
      await StorageService.setItem('afrocuisto_user', updated);
      return updated as UserProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      return null;
    }
  },
};

