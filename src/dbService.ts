import { User, Recipe } from './types';
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
                const recipes: Recipe[] = data.map(r => ({
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
                    ingredients: r.ingredients,
                    steps: r.steps,
                    techniqueTitle: r.technique_title,
                    techniqueDescription: r.technique_description,
                    benefits: r.benefits
                }));
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
        const users = dbService.getUsers();
        const index = users.findIndex(u => u.id === user.id || u.email === user.email);
        if (index > -1) {
            users[index] = user;
        } else {
            users.push(user);
        }
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
        const user = users.find(u => u.id === userId);
        if (!user) return null;

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
    }
};
