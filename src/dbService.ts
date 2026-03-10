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

import { User, Recipe } from './types';
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
        const cached = localStorage.getItem(REMOTE_RECIPES_KEY);
        if (cached) {
            return JSON.parse(cached);
        }

        throw new Error('Internet connection required for initial data load.');
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
    // Auth Configuration (Supabase)
    async signUp(email: string, password: string, name: string) {
        if (!supabase) throw new Error("Serveur indisponible");
        const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password: password.trim(),
            options: { data: { full_name: name.trim() } }
        });
        if (error) throw error;
        return data;
    },

    async signIn(email: string, password: string) {
        if (!supabase) throw new Error("Serveur indisponible");
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password.trim()
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // User Management (Local Sync Fallback for Favorites/Settings)
    getUsers: (): User[] => {
        const data = localStorage.getItem(USERS_KEY);
        return data ? JSON.parse(data) : [];
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
        const data = localStorage.getItem(CURRENT_USER_KEY);
        return data ? JSON.parse(data) : null;
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
        } catch (err) {
            return { success: false, error: `Email Error: ${(err).message}` };
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
            // 1. Update Supabase Auth display name
            await supabase.auth.updateUser({
                data: { full_name: user.name }
            });
            // 2. Upsert a user_profiles row for custom fields
            const { error } = await supabase
                .from('user_profiles')
                .upsert([{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    language: user.settings?.language ?? 'fr',
                    unit_system: user.settings?.unitSystem ?? 'metric',
                    dark_mode: user.settings?.darkMode ?? false,
                    updated_at: new Date().toISOString(),
                    joined_date: user.joinedDate,
                    favorites: user.favorites || [],
                    shopping_list: user.shoppingList || [],
                    avatar: user.avatar
                }], { onConflict: 'id' });
            if (error) {
                console.warn('user_profiles upsert failed:', error.message);
            }
        } catch (err) {
            console.error('syncUserToCloud error:', err);
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
                    joinedDate: data.joined_date,
                    favorites: data.favorites || [],
                    shoppingList: data.shopping_list || [],
                    avatar: data.avatar,
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

            return sessionData;
        } catch (e) {
            console.error('Failed to recreate ghost account:', e);
            throw e;
        }
    },

    async sendEmail(to_email: string, to_name: string, otp_code: string): Promise<boolean> {
        try {
            // Using EmailJS REST API (Free service)
            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_afrocuisto';
            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_otp';
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'user_dummy_key';

            // If we have dummy keys, we just simulate success in console
            if (publicKey === 'user_dummy_key') {
                console.log(`[SIMULATION] Code OTP pour ${to_email}: ${otp_code}`);
                return true;
            }

            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    template_id: templateId,
                    user_id: publicKey,
                    template_params: {
                        to_email,
                        to_name,
                        otp_code,
                        app_name: 'AfroCuisto'
                    }
                })
            });

            if (!response.ok) {
                const text = await response.text();
                // Check if EmailJS blocked it due to spam protections (testing the same email repeatedly)
                if (text.toLowerCase().includes("limit") || text.toLowerCase().includes("spam")) {
                    throw new Error("ERR_SPAM");
                }
                throw new Error("EmailJS Error: " + text);
            }

            return true;
        } catch (err: any) {
            console.error('Email sending failed:', err.message);
            // Re-throw so the UI can adapt (e.g., bypass OTP for spam)
            throw err;
        }
    }
};

