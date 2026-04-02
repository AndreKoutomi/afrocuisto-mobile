/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Service de gestion des données. Agit comme un pont intermédiaire entre l'application (le frontend) et Supabase (la base de données en nuage). Il contient toutes les requêtes (sauvegarde, connexion, déconnexion, récupération de recettes).
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { User, Recipe, Product, CommunityPost, PostComment } from './types';
import type { DishSuggestionPayload } from './components/DishSuggestionForm';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
    const url = import.meta.env.VITE_SUPABASE_URL || 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTc5OTEsImV4cCI6MjA4Nzc5Mzk5MX0.VN3pnUz2pO5nQ4DUZ8_Ml1OAwg_jIUh3mwn-pvrtyh8';

    if (!url || !key) return null;
    try {
        return createClient(url, key);
    } catch (e) {
        console.error('Supabase init failed:', e);
        return null;
    }
}

const supabase = getSupabase();

const USERS_KEY = 'afrocuisto_users';
const CURRENT_USER_KEY = 'afrocuisto_current_user';
const REMOTE_RECIPES_KEY = 'afrocuisto_remote_recipes';

export const dbService = {
    supabase, // Expose for realtime sub
    // Recipe Sync
    async getRemoteRecipes(): Promise<Recipe[]> {
        try {
            if (!supabase) {
                console.warn('Supabase not configured');
                throw new Error('Supabase client not initialized');
            }
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .order('name');

            if (error) throw error;

            if (data) {
                const recipes: Recipe[] = data.map(r => {
                    // ── Normalize ingredients ──────────────────────────────
                    // Legacy format: [{item, amount}]
                    // AI format:     [{name, quantity, unit, notes, category}]
                    let ingredients: { item: string; amount: string }[] | undefined;
                    if (Array.isArray(r.ingredients)) {
                        ingredients = r.ingredients.map((ing: any) => {
                            if (ing && typeof ing === 'object') {
                                if ('item' in ing) {
                                    // Already legacy format
                                    return { item: ing.item || '', amount: ing.amount || '' };
                                } else if ('name' in ing) {
                                    // AI format → convert
                                    const amount = [ing.quantity, ing.unit]
                                        .filter(Boolean).join(' ');
                                    return {
                                        item: ing.name || '',
                                        amount: amount || ing.notes || '',
                                    };
                                }
                            }
                            return { item: String(ing), amount: '' };
                        });
                    }

                    // ── Normalize steps ────────────────────────────────────
                    // Legacy format: string[]
                    // AI format:     [{order, title, description}]
                    let steps: string[] | undefined;
                    if (Array.isArray(r.steps)) {
                        steps = r.steps.map((s: any) => {
                            if (typeof s === 'string') return s;
                            if (s && typeof s === 'object') {
                                const parts = [];
                                if (s.title) parts.push(`**${s.title}**`);
                                if (s.description) parts.push(s.description);
                                return parts.join(' — ') || String(s);
                            }
                            return String(s);
                        });
                    }

                    return {
                        id: r.id,
                        name: r.name,
                        alias: r.alias,
                        base: r.base,
                        type: r.type,
                        style: r.style,
                        region: r.region,
                        category: r.category,
                        difficulty: r.difficulty,
                        prepTime: r.prep_time,
                        cookTime: r.cook_time,
                        image: r.image,
                        description: r.description,
                        ingredients,
                        steps,
                        techniqueTitle: r.technique_title,
                        techniqueDescription: r.technique_description,
                        benefits: r.benefits,
                        videoUrl: r.video_url,
                        origine_humaine: r.origine_humaine,
                    };
                });
                // Cache locally for offline use
                localStorage.setItem(REMOTE_RECIPES_KEY, JSON.stringify(recipes));
                return recipes;
            }
        } catch (err) {
            console.error('Remote sync error:', err);
        }

        // Fallback to local storage if offline/error
        try {
            const cached = localStorage.getItem(REMOTE_RECIPES_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            console.error('Error parsing cached recipes:', e);
            localStorage.removeItem(REMOTE_RECIPES_KEY);
        }

        throw new Error('Internet connection required for initial data load.');
    },

    async getRemoteMerchants(): Promise<any[]> {
        const REMOTE_MERCHANTS_KEY = 'afrocuisto_remote_merchants';
        try {
            if (!supabase) return [];
            const { data, error } = await supabase
                .from('merchants')
                .select('*')
                .order('name');

            if (error) throw error;
            if (data) {
                localStorage.setItem(REMOTE_MERCHANTS_KEY, JSON.stringify(data));
                return data;
            }
        } catch (err) {
            console.error('Merchants sync error:', err);
        }
        try {
            const cached = localStorage.getItem(REMOTE_MERCHANTS_KEY);
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            return [];
        }
    },

    async getRemoteSections(): Promise<any[]> {
        const REMOTE_SECTIONS_KEY = 'afrocuisto_remote_sections';
        try {
            if (!supabase) return [];
            const { data, error } = await supabase
                .from('home_sections')
                .select('*')
                .order('order_index');

            if (error) {
                if (error.code === '42P01') {
                    // Table doesn't exist, return empty
                    return [];
                }
                throw error;
            }
            if (data) {
                localStorage.setItem(REMOTE_SECTIONS_KEY, JSON.stringify(data));
                return data;
            }
        } catch (err) {
            console.error('Sections sync error:', err);
        }
        const cached = localStorage.getItem(REMOTE_SECTIONS_KEY);
        return cached ? JSON.parse(cached) : [];
    },

    async getRemoteProducts(): Promise<Product[]> {
        const REMOTE_PRODUCTS_KEY = 'afrocuisto_remote_products';
        try {
            if (!supabase) return [];
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (error) {
                if (error.code === '42P01') return [];
                throw error;
            }
            if (data) {
                localStorage.setItem(REMOTE_PRODUCTS_KEY, JSON.stringify(data));
                return data;
            }
        } catch (err) {
            console.error('Products sync error:', err);
        }
        try {
            const cached = localStorage.getItem(REMOTE_PRODUCTS_KEY);
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            return [];
        }
    },

    // ── Email/Password Auth ─────────────────────────────────────────────────
    async signUp(email: string, password: string, name: string, phone?: string) {
        if (!supabase) throw new Error("Serveur indisponible");

        // Use the Admin API to create the user with auto-confirmation.
        // This is necessary because we already verified the email manually via EmailJS OTP,
        // and we want to bypass the native Supabase "Email not confirmed" block.
        const url = import.meta.env.VITE_SUPABASE_URL || 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
        const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNzk5MSwiZXhwIjoyMDg3NzkzOTkxfQ.7tYsh8vXStkJqhk4T-IA6rYgONJ7evPEFbbpfHR1fDc';
        const adminClient = createClient(url, serviceKey);

        const { data: adminData, error: createError } = await adminClient.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password: password.trim(),
            email_confirm: true, // Bypass verification!
            user_metadata: {
                full_name: name.trim(),
                phone: phone ? phone.trim() : null,
                role: 'user' // Explicitly separate clients/app users
            }
        });

        if (createError) throw createError;

        // The user is created and confirmed, now we immediately sign them in
        // to return the standard session object to the app (just like original signUp).
        const { data: sessionData, error: signError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password.trim()
        });

        if (signError) throw signError;

        return sessionData;
    },

    async signIn(email: string, password: string) {
        if (!supabase) throw new Error("Serveur indisponible");
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password.trim()
        });
        if (error) throw error;

        // Check Ban Status
        if (data.user?.user_metadata?.banned) {
            await supabase.auth.signOut();
            dbService.setCurrentUser(null);
            throw new Error("account_disabled");
        }

        return data;
    },

    /** Sign in with phone number + password (no OTP required) */
    async signInWithPhonePassword(phone: string, password: string) {
        if (!supabase) throw new Error("Serveur indisponible");
        const { data, error } = await supabase.auth.signInWithPassword({
            phone: phone.trim(),
            password: password.trim()
        });
        if (error) throw error;

        // Check Ban Status
        if (data.user?.user_metadata?.banned) {
            await supabase.auth.signOut();
            dbService.setCurrentUser(null);
            throw new Error("account_disabled");
        }

        return data;
    },

    /** Detect whether a string looks like a phone number */
    isPhoneNumber(value: string): boolean {
        const cleaned = value.replace(/[\s\-\.\(\)]/g, '');
        // Must be mostly digits, optionally starting with +
        return /^\+?[0-9]{7,15}$/.test(cleaned);
    },

    async signOut(scope: 'local' | 'global' | 'others' = 'global') {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut({ scope });
        if (error) throw error;
    },

    // ── Single-Device Session Management ────────────────────────────────────
    /** Generate or retrieve a persistent unique device ID for this browser/device */
    getOrCreateDeviceId(): string {
        const DEVICE_KEY = 'afrocuisto_device_id';
        let deviceId = localStorage.getItem(DEVICE_KEY);
        if (!deviceId) {
            deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            localStorage.setItem(DEVICE_KEY, deviceId);
        }
        return deviceId;
    },

    /** Register this device as the authoritative active session for the user */
    async registerActiveSession(userId: string, deviceId: string): Promise<void> {
        try {
            if (!supabase) return;
            await supabase
                .from('user_active_sessions')
                .upsert([{
                    user_id: userId,
                    device_id: deviceId,
                    updated_at: new Date().toISOString()
                }], { onConflict: 'user_id' });
        } catch (err) {
            console.warn('registerActiveSession error:', err);
        }
    },

    /** Returns whether another device has claimed this user's session */
    async checkActiveSession(userId: string, deviceId: string): Promise<{ hasConflict: boolean; existingDeviceId: string | null }> {
        try {
            if (!supabase) return { hasConflict: false, existingDeviceId: null };
            const { data, error } = await supabase
                .from('user_active_sessions')
                .select('device_id')
                .eq('user_id', userId)
                .maybeSingle();
            if (error || !data) return { hasConflict: false, existingDeviceId: null };
            return {
                hasConflict: data.device_id !== deviceId,
                existingDeviceId: data.device_id
            };
        } catch (err) {
            console.warn('checkActiveSession error:', err);
            return { hasConflict: false, existingDeviceId: null };
        }
    },

    /** Remove active session record on logout or account deletion */
    async clearActiveSession(userId: string): Promise<void> {
        try {
            if (!supabase) return;
            await supabase
                .from('user_active_sessions')
                .delete()
                .eq('user_id', userId);
        } catch (err) {
            console.warn('clearActiveSession error:', err);
        }
    },

    // ── Phone Auth (SMS OTP via Supabase) ───────────────────────────────────
    /** Normalize a phone number to E.164 format (e.g. +22901234567) */
    formatPhone(raw: string): string {
        let cleaned = raw.replace(/[\s\-\.\(\)]/g, '');
        // If starts with a single 0, prepend Bénin country code (+229)
        // Users can always type the full +XXX prefix themselves
        if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
            cleaned = '+229' + cleaned.slice(1);
        }
        if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
        return cleaned;
    },

    /** Send OTP via SMS — works for both signup and sign-in on Supabase */
    async sendPhoneOtp(phone: string) {
        if (!supabase) throw new Error('Serveur indisponible');
        const { error } = await supabase.auth.signInWithOtp({
            phone,
            options: { channel: 'sms' }
        });
        if (error) throw error;
    },

    /** Verify the SMS OTP token received by the user */
    async verifyPhoneOtp(phone: string, token: string) {
        if (!supabase) throw new Error('Serveur indisponible');
        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms'
        });
        if (error) throw error;
        return data;
    },

    /** Start a phone number update explicitly (triggers an SMS if configured) */
    async updateUserPhone(phone: string) {
        if (!supabase) throw new Error("Serveur indisponible");
        const { data, error } = await supabase.auth.updateUser({ phone });
        if (error) throw error;
        return data;
    },

    /** Verify the new phone number change with the OTP */
    async verifyUserPhoneChange(phone: string, token: string) {
        if (!supabase) throw new Error("Serveur indisponible");
        const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'phone_change' });
        if (error) throw error;
        return data;
    },

    // ── OAuth (Google, Facebook) ────────────────────────────────────────────
    async signInWithGoogle() {
        if (!supabase) throw new Error('Serveur indisponible');
        // Use the current page origin as redirect — works for web & Capacitor webview
        const redirectTo = window.location.origin || 'http://localhost:3000';
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
                queryParams: { prompt: 'select_account', access_type: 'offline' },
                skipBrowserRedirect: false,
            }
        });
        if (error) throw error;
        // Open the OAuth URL in a new tab/window if it was returned (fallback)
        if (data?.url) {
            window.location.href = data.url;
        }
    },


    // ── User Management (Local Sync Fallback for Favorites/Settings) ────────
    getUsers: (): User[] => {
        try {
            const data = localStorage.getItem(USERS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    saveUser: (user: User) => {
        try {
            const users = dbService.getUsers();
            const index = users.findIndex(u => u.id === user.id || u.email === user.email);
            if (index > -1) {
                users[index] = user;
            } else {
                users.push(user);
            }
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        } catch (err) {
            console.error('LocalStorage save error:', err);
            // Si le quota est dépassé, on essaie de sauvegarder uniquement le user actuel sans photo si nécessaire
            // ou on laisse le cloud gérer
        }
    },

    getCurrentUser: (): User | null => {
        try {
            const data = localStorage.getItem(CURRENT_USER_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Corrupt user data in localStorage:', e);
            localStorage.removeItem(CURRENT_USER_KEY);
            return null;
        }
    },

    setCurrentUser: (user: User | null) => {
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            dbService.saveUser(user); // Ensure global list is updated
        } else {
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    },

    // Favorites Management
    toggleFavorite: (userId: string, recipeId: string): User | null => {
        const users = dbService.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return null;

        const favIndex = user.favorites.indexOf(recipeId);
        if (favIndex > -1) {
            user.favorites.splice(favIndex, 1);
        } else {
            user.favorites.push(recipeId);
        }

        dbService.saveUser(user);
        const currentUser = dbService.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            dbService.setCurrentUser(user);
        }
        return user;
    },

    // Dynamic Querying (Simulation)
    getFavorites: (user: User, allRecipes: Recipe[]): Recipe[] => {
        return allRecipes.filter(r => user.favorites.includes(r.id));
    },

    updateAvatar: (userId: string, avatarData: string): User | null => {
        const users = dbService.getUsers();
        // Chercher par ID ou par Email pour être plus robuste
        const user = users.find(u => u.id === userId);
        if (!user) {
            // Tentative via le current user si l'id match
            const current = dbService.getCurrentUser();
            if (current && current.id === userId) {
                current.avatar = avatarData;
                dbService.setCurrentUser(current);
                return current;
            }
            return null;
        }

        user.avatar = avatarData;
        dbService.saveUser(user);

        const currentUser = dbService.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            dbService.setCurrentUser(user);
        }
        return user;
    },

    updateShoppingList: (userId: string, shoppingList: any[]): User | null => {
        const users = dbService.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return null;

        user.shoppingList = shoppingList;
        dbService.saveUser(user);

        const currentUser = dbService.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            dbService.setCurrentUser(user);
        }
        return user;
    },

    // Review & Feedback
    async submitReview(review: { recipe_id: string; recipe_name: string; user_id: string; user_name: string; rating: number; comment: string }): Promise<boolean> {
        try {
            if (!supabase) return false;
            const { error } = await supabase
                .from('reviews')
                .insert([review]);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Submit review error:', err);
            return false;
        }
    },

    // --- Dish Suggestion Fallback (Email) ---
    async sendDishSuggestionEmail(dish: any): Promise<{ success: boolean; error?: string }> {
        try {
            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_k3w11sm';
            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_huya44j';
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '5bxF5hiV8eLRjESo4';

            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    template_id: templateId,
                    user_id: publicKey,
                    template_params: {
                        to_name: "André Koutomi",
                        message: `NOUVELLE SUGGESTION : ${dish.name}\nIngrédients: ${dish.ingredients}\nDescription: ${dish.description}\nPar: ${dish.submitter_name || "Anonyme"} (${dish.submitter_email || "N/A"})`,
                        otp_code: "NOTICE: Suggestion Recue",
                        dish_name: dish.name,
                    }
                })
            });

            if (!response.ok) {
                const text = await response.text();
                return { success: false, error: `EmailJS Error: ${text}` };
            }
            return { success: true };
        } catch (err: any) {
            return { success: false, error: `Email Error: ${err.message}` };
        }
    },

    // --- OTP Cross-Device Email Sending ---
    async sendEmail(toEmail: string, toName: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
        try {
            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_k3w11sm';
            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_huya44j';
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '5bxF5hiV8eLRjESo4';

            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    template_id: templateId,
                    user_id: publicKey,
                    template_params: {
                        to_name: toName || toEmail.split('@')[0],
                        to_email: toEmail,
                        message: "Alerte de sécurité AfroCuisto. Quelqu'un essaye de se connecter à votre compte depuis un nouvel appareil. Utilisez le code ci-dessous pour approuver la connexion et déconnecter l'appareil précédent.",
                        otp_code: otpCode,
                    }
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`EmailJS Error: ${text}`);
            }
            return { success: true };
        } catch (err: any) {
            console.error('Cross-device OTP email failed:', err);
            throw err;
        }
    },

    async submitDishSuggestion(dish: any): Promise<{ success: boolean; error?: string }> {
        try {
            if (!supabase) return { success: false, error: 'Supabase client not initialized' };

            const fullPayload = {
                name: dish.name.trim(),
                ingredients: dish.ingredients.trim(),
                description: dish.description.trim(),
                region: dish.region?.trim() || null,
                category: dish.category?.trim() || null,
                cooking_time: dish.cooking_time?.trim() || null,
                submitter_name: dish.submitter_name?.trim() || null,
                submitter_email: dish.submitter_email?.trim() || null,
            };

            const { error: insertError } = await supabase.from('dish_suggestions').insert([fullPayload]);

            if (insertError) {
                if (insertError.code === '42P01' || insertError.code === 'PGRST205' || insertError.message?.includes('cache')) {
                    console.warn('Table missing, using email fallback...');
                    return await this.sendDishSuggestionEmail(dish);
                }

                if (insertError.code === 'PGRST204' || insertError.message?.includes('column')) {
                    const minimalPayload = {
                        name: dish.name.trim(),
                        ingredients: dish.ingredients.trim(),
                        description: dish.description.trim()
                    };
                    const { error: minError } = await supabase.from('dish_suggestions').insert([minimalPayload]);
                    if (!minError) return { success: true };
                }
                return { success: false, error: insertError.message };
            }
            return { success: true };
        } catch (err) {
            console.error('Submission failed, trying last resort fallback:', err);
            return await this.sendDishSuggestionEmail(dish);
        }
    },

    // Save full user profile to Supabase (user_profiles table) if available
    async syncUserToCloud(user: User): Promise<void> {
        try {
            if (!supabase) return;
            
            // 1. Upsert la ligne de profil d'abord (Données réelles)
            const { error: upsertError } = await supabase
                .from('user_profiles')
                .upsert([{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    language: user.settings?.language ?? 'fr',
                    unit_system: user.settings?.unitSystem ?? 'metric',
                    dark_mode: user.settings?.darkMode ?? false,
                    phone: user.phone || null,
                    updated_at: new Date().toISOString(),
                    joined_date: user.joinedDate,
                    favorites: user.favorites || [],
                    shopping_list: user.shoppingList || [],
                    saved_posts: user.savedPosts || [],
                    following: user.following || [],
                    avatar: user.avatar || null,
                    is_admin: user.is_admin ?? false
                }], { onConflict: 'id' });

            if (upsertError) {
                console.warn('user_profiles upsert failed:', upsertError.message);
            }

            // 2. Mettre à jour Supabase Auth seulement si nécessaire (déclenche onAuthStateChange)
            const { data: { user: curAuthUser } } = await supabase.auth.getUser();
            if (curAuthUser?.user_metadata?.full_name !== user.name) {
                await supabase.auth.updateUser({
                    data: { full_name: user.name }
                });
            }
        } catch (err) {
            console.error('syncUserToCloud error:', err);
        }
    },

    /** Register or update FCM token for the current user (or guest) */
    async saveUserFCMToken(userId: string | null, token: string, platform: string = 'android'): Promise<void> {
        try {
            if (!supabase || !token) return;

            const data: any = {
                token: token,
                platform: platform,
                updated_at: new Date().toISOString()
            };

            if (userId) {
                data.user_id = userId;
            }

            const { error } = await supabase
                .from('user_fcm_tokens')
                .upsert([data], { onConflict: 'token' });

            if (error) {
                console.warn('saveUserFCMToken failed:', error.message);
            }
        } catch (err) {
            console.error('saveUserFCMToken error:', err);
        }
    },

    async getRemoteUserProfile(userId: string): Promise<Partial<User> | null> {
        try {
            if (!supabase) return null;
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                return {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone || undefined,
                    joinedDate: data.joined_date,
                    favorites: data.favorites || [],
                    shoppingList: data.shopping_list || [],
                    savedPosts: data.saved_posts || [],
                    following: data.following || [],
                    avatar: data.avatar,
                    is_admin: data.is_admin ?? false,
                    settings: {
                        darkMode: data.dark_mode ?? false,
                        language: data.language ?? 'fr',
                        unitSystem: data.unit_system ?? 'metric'
                    }
                };
            }
            return null;
        } catch (err) {
            console.error('getRemoteUserProfile error:', err);
            return null;
        }
    },

    async deleteAccount(userId: string): Promise<boolean> {
        try {
            if (!supabase) return false;

            // 1. DELETE CLOUD DATA (Identity)
            await supabase.from('user_profiles').delete().eq('id', userId);
            await supabase.from('reviews').delete().eq('user_id', userId);

            // 2. HARD DELETE FROM AUTH (SUPREME DELETION)
            // Warning: For prototype convenience, using Admin Service Key clientside.
            // Move to an edge function or secure backend before full production!
            try {
                const url = import.meta.env.VITE_SUPABASE_URL || 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
                const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNzk5MSwiZXhwIjoyMDg3NzkzOTkxfQ.7tYsh8vXStkJqhk4T-IA6rYgONJ7evPEFbbpfHR1fDc';
                const adminClient = createClient(url, serviceKey);
                await adminClient.auth.admin.deleteUser(userId);
            } catch (e) {
                console.warn('Admin delete failed:', e);
            }

            // 3. FORCE GLOBAL SIGN OUT
            await supabase.auth.signOut({ scope: 'global' });

            // 4. BRUTAL PURGE OF ALL STORAGE
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.includes('sb-') || key.includes('supabase') || key.includes('afrocuisto'))) {
                    localStorage.removeItem(key);
                }
            }
            sessionStorage.clear();

            return true;
        } catch (err) {
            console.error('CRITICAL account deletion failure:', err);
            return false;
        }
    },

    async recreateGhostAccount(email: string, password: string, name: string): Promise<any> {
        try {
            // Utilisé pour recréer directement sans trigger de mail, car l'API Supabase bloque 
            // les envois d'emails de signup successifs pour la même adresse (Spam / Rate Limit 429)
            const url = import.meta.env.VITE_SUPABASE_URL || 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
            const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNzk5MSwiZXhwIjoyMDg3NzkzOTkxfQ.7tYsh8vXStkJqhk4T-IA6rYgONJ7evPEFbbpfHR1fDc';
            const adminClient = createClient(url, serviceKey);

            // 1. Fetch & Delete the blocked/broken ghost account
            const { data: usersData } = await adminClient.auth.admin.listUsers();
            const user = (usersData?.users as any[])?.find(u => u.email === email);
            if (user) {
                await adminClient.auth.admin.deleteUser(user.id);
            }

            // 2. Recreate cleanly, WITH auto-confirmation to BYPASS the missing email issue
            const { error: createError } = await adminClient.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: { full_name: name }
            });
            if (createError) throw createError;

            // 3. Immediately log in to generate the required session for the frontend
            const { data: sessionData, error: signError } = await supabase!.auth.signInWithPassword({
                email: email,
                password: password
            });
            if (signError) throw signError;

            // Check Ban Status
            if (sessionData.user?.user_metadata?.banned) {
                await supabase!.auth.signOut();
                dbService.setCurrentUser(null);
                throw new Error("account_disabled");
            }

            return sessionData;
        } catch (e) {
            console.error('Failed to recreate ghost account:', e);
            throw e;
        }
    },

    async adminForceConfirmEmail(email: string): Promise<boolean> {
        try {
            const url = import.meta.env.VITE_SUPABASE_URL || 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
            const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNzk5MSwiZXhwIjoyMDg3NzkzOTkxfQ.7tYsh8vXStkJqhk4T-IA6rYgONJ7evPEFbbpfHR1fDc';
            const adminClient = createClient(url, serviceKey);

            const { data: usersData } = await adminClient.auth.admin.listUsers();
            const user = (usersData?.users as any[])?.find(u => u.email === email);
            if (user && !user.email_confirmed_at) {
                // Update the user to confirm the email unconditionally
                const { error } = await adminClient.auth.admin.updateUserById(user.id, {
                    email_confirm: true
                });
                if (error) throw error;
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to auto-confirm email:', e);
            return false;
        }
    },

    async adminUpdateUserPhone(userId: string, phone: string): Promise<boolean> {
        try {
            const url = import.meta.env.VITE_SUPABASE_URL || 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
            const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNzk5MSwiZXhwIjoyMDg3NzkzOTkxfQ.7tYsh8vXStkJqhk4T-IA6rYgONJ7evPEFbbpfHR1fDc';
            const adminClient = createClient(url, serviceKey);

            // Directly update the user's phone, skipping SMS verification
            const { error } = await adminClient.auth.admin.updateUserById(userId, {
                phone: phone,
                phone_confirm: true,
                user_metadata: { phone: phone }
            });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Failed to update phone as admin:', e);
            throw e;
        }
    },



    // --- Order Management ---
    async createOrder(orderData: any): Promise<{ data: any; error: any }> {
        if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                ...orderData,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        return { data, error };
    },

    async getUserOrders(userId: string): Promise<any[]> {
        try {
            if (!supabase) return [];
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                if (error.code === '42P01') return []; // Table may not exist yet
                throw error;
            }
            return data || [];
        } catch (err) {
            console.error('Error fetching user orders:', err);
            return [];
        }
    },

    async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
        if (!supabase) return false;
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId);
        if (error) {
            console.error('Error updating order status:', error);
            return false;
        }
        return true;
    },

    // --- Image Upload to Supabase Storage ---
    async uploadPostImage(base64DataUrl: string, userId: string): Promise<string | null> {
        try {
            if (!supabase) return null;

            // If it's already a public URL, no need to upload
            if (base64DataUrl.startsWith('http')) {
                return base64DataUrl;
            }

            // Convert base64 to Blob
            if (!base64DataUrl.includes(',')) {
                console.warn('Invalid image data provided to uploadPostImage');
                return null;
            }

            const [meta, data] = base64DataUrl.split(',');
            const mimeMatch = meta.match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const ext = mime.split('/')[1] || 'jpg';

            try {
                const byteString = atob(data);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                const blob = new Blob([ab], { type: mime });

                const fileName = `${userId}/${Date.now()}.${ext}`;

                const { data: uploadData, error } = await supabase.storage
                    .from('community-images')
                    .upload(fileName, blob, { contentType: mime, upsert: false });

                if (error) {
                    console.warn('Storage upload failed, using base64 fallback:', error.message);
                    return null;
                }

                const { data: urlData } = supabase.storage
                    .from('community-images')
                    .getPublicUrl(uploadData.path);

                return urlData.publicUrl;
            } catch (e) {
                console.error('Binary conversion failed:', e);
                return null;
            }
        } catch (err) {
            console.error('uploadPostImage error:', err);
            return null;
        }
    },

    // --- Community Management ---
    async getCommunityPosts(currentUserId?: string, page: number = 0, pageSize: number = 10): Promise<CommunityPost[]> {
        if (!supabase) return [];

        try {
            const start = page * pageSize;
            const end = start + pageSize - 1;

            // Requête sans jointure FK pour éviter les erreurs de cache Supabase
            const { data: posts, error } = await supabase
                .from('community_posts')
                .select('*')
                .order('created_at', { ascending: false })
                .range(start, end);

            if (error) throw error;
            if (!posts || posts.length === 0) return [];

            // Récupérer les profils séparément (jointure manuelle pour robustesse)
            const userIds = [...new Set(posts.map((p: any) => p.user_id).filter(Boolean))];
            const postIds = posts.map((p: any) => p.id);
            let profilesMap: Record<string, { name: string; avatar?: string }> = {};

            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('user_profiles')
                    .select('id, name, avatar')
                    .in('id', userIds);
                if (profiles) {
                    profiles.forEach((p: any) => { profilesMap[p.id] = { name: p.name, avatar: p.avatar }; });
                }
            }

            // Récupérer les VRAIS compteurs (en cas de désynchronisation de la colonne counters)
            const [commentsRes, likesRes] = await Promise.all([
                supabase.from('post_comments').select('post_id').in('post_id', postIds),
                supabase.from('post_likes').select('post_id').in('post_id', postIds)
            ]);

            const commentsCountMap: Record<string, number> = {};
            commentsRes.data?.forEach(c => { commentsCountMap[c.post_id] = (commentsCountMap[c.post_id] || 0) + 1; });

            const likesCountMap: Record<string, number> = {};
            likesRes.data?.forEach(l => { likesCountMap[l.post_id] = (likesCountMap[l.post_id] || 0) + 1; });

            // Récupérer les likes de l'utilisateur connecté
            let userLikes: string[] = [];
            if (currentUserId) {
                const { data: likes } = await supabase
                    .from('post_likes')
                    .select('post_id')
                    .eq('user_id', currentUserId)
                    .in('post_id', postIds);
                if (likes) userLikes = likes.map((l: any) => l.post_id);
            }

            const finalPosts = posts.map((p: any) => ({
                id: p.id,
                user_id: p.user_id,
                author_name: profilesMap[p.user_id]?.name || 'Utilisateur',
                author_avatar: profilesMap[p.user_id]?.avatar,
                title: p.title,
                content: p.content,
                image_url: p.image_url,
                category: p.category,
                created_at: p.created_at,
                likes_count: likesCountMap[p.id] || p.likes_count || 0,
                comments_count: commentsCountMap[p.id] || p.comments_count || 0,
                views_count: p.views_count || 0,
                is_liked: userLikes.includes(p.id)
            }));
            
            // Offline Cache: Only cache the first page
            if (page === 0) {
                localStorage.setItem('afrocuisto_community_posts_cache', JSON.stringify(finalPosts));
            }
            return finalPosts;
        } catch (err) {
            console.error('Error fetching community posts:', err);
            // Fallback to cache
            if (page === 0) {
                try {
                    const cached = localStorage.getItem('afrocuisto_community_posts_cache');
                    if (cached) return JSON.parse(cached);
                } catch (e) {
                   // cache read failed
                }
            }
            return [];
        }
    },

    async createPost(post: Partial<CommunityPost>): Promise<CommunityPost | null> {
        if (!supabase) return null;

        try {
            const userObj: any = {
                id: post.user_id,
                name: post.author_name,
                avatar: post.author_avatar,
                joinedDate: new Date().toISOString()
            };
            await this.syncUserToCloud(userObj).catch(e => console.error('Pre-post sync error:', e));

            const { data, error } = await supabase
                .from('community_posts')
                .insert([{
                    user_id: post.user_id,
                    title: post.title || '',
                    content: post.content || '',
                    image_url: post.image_url,
                    category: post.category || 'Autre',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) {
                console.error('CRITICAL: Supabase post creation failed:', error.message, error.details);
                throw new Error(`Erreur Supabase: ${error.message} (${error.details || ''})`);
            }

            return {
                ...data,
                author_name: post.author_name,
                author_avatar: post.author_avatar,
                likes_count: 0,
                comments_count: 0,
                views_count: 0,
                is_liked: false
            } as CommunityPost;
        } catch (err: any) {
            console.error('Unexpected error in createPost:', err);
            throw err;
        }
    },

    async updateCommunityPost(postId: string, userId: string, updates: Partial<CommunityPost>): Promise<boolean> {
        if (!supabase || postId.startsWith('local_')) return false;

        const { error } = await supabase
            .from('community_posts')
            .update({
                title: updates.title,
                content: updates.content,
                image_url: updates.image_url,
                category: updates.category
            })
            .eq('id', postId)
            .eq('user_id', userId);

        if (error) {
            console.error('Update post failed:', error.message);
            return false;
        }
        return true;
    },

    /** Real-time subscription helper for community posts */
    subscribeToCommunityUpdates(callback: (payload: any) => void) {
        if (!supabase) return null;
        return supabase
            .channel('community_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, callback)
            .subscribe();
    },

    async deleteCommunityPost(postId: string, userId: string): Promise<boolean> {
        if (!supabase || postId.startsWith('local_')) return false;

        const { error } = await supabase
            .from('community_posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', userId);

        if (error) {
            console.error('Delete post failed:', error.message);
            return false;
        }
        return true;
    },

    async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
        if (!supabase) return { liked: false, count: 0 };
        try {
            // Check if already liked
            const { data: existing, error: errSelect } = await supabase
                .from('post_likes')
                .select('*')
                .eq('post_id', postId)
                .eq('user_id', userId)
                .maybeSingle();

            if (errSelect && errSelect.code !== 'PGRST116') {
                throw errSelect;
            }

            if (existing) {
                await supabase.from('post_likes').delete().eq('id', existing.id);
                return { liked: false, count: -1 };
            } else {
                await supabase.from('post_likes').insert([{ post_id: postId, user_id: userId }]);
                return { liked: true, count: 1 };
            }
        } catch (err) {
            console.warn('Supabase toggleLike failed:', err);
            return { liked: false, count: 0 };
        }
    },

    async incrementViewCount(postId: string, userId?: string): Promise<boolean> {
        if (!supabase) return false;
        try {
            // Let's call supabase directly. We'll fire and forget.
            const { error } = await supabase.from('post_views').insert([{
                post_id: postId,
                user_id: userId || 'anonymous'
            }]);
            return !error;
        } catch (e) {
            return false;
        }
    },

    async getComments(postId: string): Promise<PostComment[]> {
        const cacheKey = `afrocuisto_comments_cache_${postId}`;
        if (!supabase) {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) return JSON.parse(cached);
            } catch(e) {}
            return [];
        }
        
        try {
            const { data, error } = await supabase
                .from('post_comments')
                .select(`
                    *,
                    author:user_profiles ( name )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            
            const mapped = (data || []).map(c => ({
                id: c.id,
                post_id: c.post_id,
                user_id: c.user_id,
                author_name: c.author?.name || 'Utilisateur',
                author_avatar: c.author?.avatar,
                content: c.content,
                created_at: c.created_at
            }));

            localStorage.setItem(cacheKey, JSON.stringify(mapped));
            return mapped;
        } catch (err) {
            console.error('getComments error:', err);
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) return JSON.parse(cached);
            } catch(e) {}
            return [];
        }
    },

    async addComment(postId: string, userId: string, content: string): Promise<PostComment | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('post_comments')
            .insert([{
                post_id: postId,
                user_id: userId,
                content,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) return null;
        return data;
    },

    // --- Authentication Flow Extension ---
    async sendResetPasswordEmail(email: string): Promise<{ data: any; error: any }> {
        if (!supabase) return { data: null, error: { message: "Supabase not connected" } };
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
    },

    async updatePassword(password: string): Promise<{ data: any; error: any }> {
        if (!supabase) return { data: null, error: { message: "Supabase not connected" } };
        return await supabase.auth.updateUser({ password });
    },

    // --- Admin Community Management ---

    async adminGetAllPosts(): Promise<CommunityPost[]> {
        try {
            if (!supabase) return [];
            const { data, error } = await supabase
                .from('community_posts')
                .select('*, user_profiles(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(p => ({
                ...p,
                author_name: (p.user_profiles as any)?.name || 'Anonyme',
                author_avatar: (p.user_profiles as any)?.avatar
            }));
        } catch (err) {
            console.error('adminGetAllPosts error:', err);
            return [];
        }
    },

    async adminGetAllComments(): Promise<any[]> {
        try {
            if (!supabase) return [];
            const { data, error } = await supabase
                .from('post_comments')
                .select('*, user_profiles(name), community_posts(title)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(c => ({
                ...c,
                author_name: (c.user_profiles as any)?.name || 'Anonyme',
                post_title: (c.community_posts as any)?.title || 'Post sans titre'
            }));
        } catch (err) {
            console.error('adminGetAllComments error:', err);
            return [];
        }
    },

    async adminGetAllUsers(): Promise<User[]> {
        try {
            if (!supabase) return [];
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('joined_date', { ascending: false });

            if (error) throw error;
            return (data || []).map(d => ({
                id: d.id,
                name: d.name,
                email: d.email,
                phone: d.phone,
                avatar: d.avatar,
                is_admin: d.is_admin,
                joinedDate: d.joined_date,
                favorites: d.favorites || [],
                shoppingList: d.shopping_list || [],
                settings: { darkMode: d.dark_mode, language: d.language, unitSystem: d.unit_system }
            } as User));
        } catch (err) {
            console.error('adminGetAllUsers error:', err);
            return [];
        }
    },

    async adminDeletePost(postId: string): Promise<boolean> {
        try {
            if (!supabase) return false;
            const { error } = await supabase.from('community_posts').delete().eq('id', postId);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('adminDeletePost error:', err);
            return false;
        }
    },

    async adminDeleteComment(commentId: string): Promise<boolean> {
        try {
            if (!supabase) return false;
            const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('adminDeleteComment error:', err);
            return false;
        }
    },

    async adminToggleUserBan(userId: string, is_banned: boolean): Promise<boolean> {
        try {
            const url = import.meta.env.VITE_SUPABASE_URL || 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
            const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNzk5MSwiZXhwIjoyMDg3NzkzOTkxfQ.7tYsh8vXStkJqhk4T-IA6rYgONJ7evPEFbbpfHR1fDc';
            const adminClient = createClient(url, serviceKey);

            const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
                user_metadata: { banned: is_banned }
            });
            if (authError) throw authError;
            return true;
        } catch (err) {
            console.error('adminToggleUserBan error:', err);
            return false;
        }
    },

    async adminGetCommunityStats(): Promise<any> {
        try {
            if (!supabase) return { totalPosts: 0, totalComments: 0, totalUsers: 0, totalLikes: 0, totalViews: 0 };

            const [postsCount, commentsCount, usersCount, likesCount] = await Promise.all([
                supabase.from('community_posts').select('*', { count: 'exact', head: true }),
                supabase.from('post_comments').select('*', { count: 'exact', head: true }),
                supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
                supabase.from('post_likes').select('*', { count: 'exact', head: true })
            ]);

            // For total views, we could sum views_count in community_posts
            const { data: viewsData } = await supabase.from('community_posts').select('views_count');
            const totalViews = (viewsData || []).reduce((acc, curr) => acc + (curr.views_count || 0), 0);

            return {
                totalPosts: postsCount.count || 0,
                totalComments: commentsCount.count || 0,
                totalUsers: usersCount.count || 0,
                totalLikes: likesCount.count || 0,
                totalViews: totalViews || 0
            };
        } catch (err) {
            console.error('adminGetCommunityStats error:', err);
            return { totalPosts: 0, totalComments: 0, totalUsers: 0, totalLikes: 0, totalViews: 0 };
        }
    },

    async adminGetAllReports(): Promise<any[]> {
        if (!supabase) return [];
        try {
            const { data, error } = await supabase
                .from('post_reports')
                .select(`
                    *,
                    reporter:user_profiles!post_reports_user_id_fkey(name, email),
                    post:community_posts(content, image_url, author_name)
                `)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Fetch reports failed:', err);
            return [];
        }
    },

    async adminDeleteReport(reportId: string): Promise<boolean> {
        if (!supabase) return false;
        try {
            const { error } = await supabase.from('post_reports').delete().eq('id', reportId);
            return !error;
        } catch (err) {
            return false;
        }
    },

    async adminUpdateSection(sectionId: string, updates: any): Promise<boolean> {
        if (!supabase) return false;
        try {
            const { error } = await supabase.from('home_sections').update(updates).eq('id', sectionId);
            return !error;
        } catch (err) {
            return false;
        }
    },

    async adminDeleteSection(sectionId: string): Promise<boolean> {
        if (!supabase) return false;
        try {
            const { error } = await supabase.from('home_sections').delete().eq('id', sectionId);
            return !error;
        } catch (err) {
            return false;
        }
    },

    async adminCreateSection(section: any): Promise<boolean> {
        if (!supabase) return false;
        try {
            const { error } = await supabase.from('home_sections').insert([section]);
            return !error;
        } catch (err) {
            return false;
        }
    }
};
