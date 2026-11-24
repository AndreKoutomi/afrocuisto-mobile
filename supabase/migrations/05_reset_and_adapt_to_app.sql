-- ==============================================================================
-- AfroCuisto — Réinitialisation & Schéma Canonique (Android App + Admin CMS)
-- Projet Supabase : ewoiqbhqtcdatpzhdaef
-- ==============================================================================

-- 1. Suppression des anciennes tables et vues héritées
DROP VIEW IF EXISTS public.user_profiles_compat CASCADE;

DROP TABLE IF EXISTS
  public.challenge_participants,
  public.challenges,
  public.story_likes,
  public.story_views,
  public.stories,
  public.post_bookmarks,
  public.post_reports,
  public.post_views,
  public.post_comments,
  public.post_likes,
  public.post_reactions,
  public.community_posts,
  public.posts,
  public.user_active_sessions,
  public.user_fcm_tokens,
  public.user_favorites,
  public.user_cooked_recipes,
  public.user_shopping_items,
  public.user_preferences,
  public.ai_chef_conversations,
  public.app_notifications,
  public.app_releases,
  public.orders,
  public.products,
  public.merchants,
  public.push_notifications,
  public.dish_suggestions,
  public.reviews,
  public.home_sections,
  public.waitlist,
  public.bug_reports,
  public.admins,
  public.user_profiles,
  public.profiles,
  public.recipes
CASCADE;

-- 2. Fonction utilitaire updated_at sécurisée
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 3. PROFILS & PRÉFÉRENCES UTILISATEUR (100 % alignés sur AfroCuisto Android)
-- ==============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT 'Gourmet Afro',
  role_title TEXT NOT NULL DEFAULT 'Gourmet Passionné',
  bio TEXT NOT NULL DEFAULT 'Passionné de cuisine africaine traditionnelle et créative.',
  avatar_url TEXT,
  favorite_terroir TEXT NOT NULL DEFAULT 'Bénin',
  cooked_recipe_ids TEXT[] NOT NULL DEFAULT '{}',
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  default_servings INTEGER NOT NULL DEFAULT 4 CHECK (default_servings BETWEEN 1 AND 20),
  diaspora_substitutes_first BOOLEAN NOT NULL DEFAULT false,
  keep_screen_on_in_recipe BOOLEAN NOT NULL DEFAULT true,
  theme_mode TEXT NOT NULL DEFAULT 'system' CHECK (theme_mode IN ('system', 'light', 'dark')),
  carousel_auto_scroll BOOLEAN NOT NULL DEFAULT true,
  timer_vibration_enabled BOOLEAN NOT NULL DEFAULT true,
  ai_voice_id TEXT NOT NULL DEFAULT 'Aoede',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Création automatique du profil + préférences à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), 'Gourmet Afro')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. CATALOGUE DE RECETTES & FAVORIS
-- ==============================================================================

CREATE TABLE public.recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  alias TEXT,
  region TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'Facile',
  prep_time TEXT NOT NULL DEFAULT '15 min',
  cook_time TEXT NOT NULL DEFAULT '30 min',
  image TEXT NOT NULL DEFAULT '',
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  technique_title TEXT,
  technique_description TEXT,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  diaspora_substitutes TEXT,
  suggested_sides JSONB DEFAULT '[]'::jsonb,
  benefits TEXT,
  pedagogical_note TEXT,
  type TEXT,
  base TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  style TEXT,
  origine_humaine TEXT,
  video_url TEXT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 4.80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_recipes_category ON public.recipes (category);
CREATE INDEX idx_recipes_region ON public.recipes (region);
CREATE INDEX idx_recipes_featured ON public.recipes (is_featured) WHERE is_featured = true;

CREATE TRIGGER trg_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_favorites (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, recipe_id)
);

-- ==============================================================================
-- 5. MON MARCHÉ (Liste de courses, prix, devise & archives)
-- ==============================================================================

CREATE TABLE public.user_shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT NOT NULL DEFAULT '1',
  category TEXT NOT NULL DEFAULT 'Épices & Terroir',
  recipe_name TEXT,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  price NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'FCFA' CHECK (currency IN ('FCFA', 'EUR')),
  archived_at TIMESTAMPTZ,
  archive_batch_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_shopping_user_active ON public.user_shopping_items (user_id, archived_at);

CREATE TRIGGER trg_shopping_updated_at
  BEFORE UPDATE ON public.user_shopping_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 6. COMMUNAUTÉ (Posts, réactions, commentaires, signets, signalements)
-- ==============================================================================

CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  author_role TEXT DEFAULT 'Gourmet Passionné',
  author_country TEXT DEFAULT 'Bénin',
  content TEXT NOT NULL,
  image_url TEXT,
  recipe_id TEXT REFERENCES public.recipes(id) ON DELETE SET NULL,
  recipe_name TEXT,
  recipe_image TEXT,
  region TEXT,
  type TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] NOT NULL DEFAULT '{}',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  reaction_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_community_posts_created ON public.community_posts (created_at DESC);

CREATE TRIGGER trg_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  author_role TEXT,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_post_comments_post ON public.post_comments (post_id, created_at ASC);

CREATE TABLE public.post_reactions (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.post_bookmarks (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. CHEF IA, NOTIFICATIONS, MISES À JOUR & ADMIN CMS
-- ==============================================================================

CREATE TABLE public.ai_chef_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Discussion Chef IA',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_ai_chef_user ON public.ai_chef_conversations (user_id, updated_at DESC);

CREATE TRIGGER trg_ai_chef_updated_at
  BEFORE UPDATE ON public.ai_chef_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_route TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.app_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL DEFAULT 'beta' CHECK (channel IN ('beta', 'production')),
  version_code INTEGER NOT NULL,
  version_name TEXT NOT NULL,
  apk_url TEXT NOT NULL,
  release_notes TEXT NOT NULL DEFAULT '',
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.home_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'recipes',
  item_ids TEXT[] NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.dish_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  dish_name TEXT NOT NULL,
  region TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  app_version TEXT,
  device_info TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  platform TEXT DEFAULT 'android',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipe_id TEXT REFERENCES public.recipes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) — activé sur 100 % des tables
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chef_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Profiles : lecture publique (pour communauté), écriture propriétaire uniquement
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- User preferences : strictement privé au propriétaire
CREATE POLICY "user_prefs_select_own" ON public.user_preferences
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "user_prefs_insert_own" ON public.user_preferences
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "user_prefs_update_own" ON public.user_preferences
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Recipes, Home sections, App notifications, App releases : lecture publique
CREATE POLICY "recipes_select_public" ON public.recipes
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "home_sections_select_public" ON public.home_sections
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "app_notifications_select_public" ON public.app_notifications
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "app_releases_select_public" ON public.app_releases
  FOR SELECT TO anon, authenticated USING (true);

-- User favorites : strictement privé au propriétaire
CREATE POLICY "favorites_select_own" ON public.user_favorites
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "favorites_insert_own" ON public.user_favorites
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "favorites_delete_own" ON public.user_favorites
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- User shopping items : strictement privé au propriétaire
CREATE POLICY "shopping_select_own" ON public.user_shopping_items
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "shopping_insert_own" ON public.user_shopping_items
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "shopping_update_own" ON public.user_shopping_items
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "shopping_delete_own" ON public.user_shopping_items
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Community posts & comments : lecture publique, écriture authentifiée par auteur
CREATE POLICY "posts_select_public" ON public.community_posts
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "posts_insert_auth" ON public.community_posts
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = author_id);
CREATE POLICY "posts_update_own" ON public.community_posts
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);
CREATE POLICY "posts_delete_own" ON public.community_posts
  FOR DELETE TO authenticated USING ((select auth.uid()) = author_id);

CREATE POLICY "comments_select_public" ON public.post_comments
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "comments_insert_auth" ON public.post_comments
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = author_id);
CREATE POLICY "comments_delete_own" ON public.post_comments
  FOR DELETE TO authenticated USING ((select auth.uid()) = author_id);

-- Reactions & Bookmarks : lecture publique des réactions, écriture propriétaire
CREATE POLICY "reactions_select_public" ON public.post_reactions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reactions_insert_own" ON public.post_reactions
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "reactions_update_own" ON public.post_reactions
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "reactions_delete_own" ON public.post_reactions
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE POLICY "bookmarks_select_own" ON public.post_bookmarks
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "bookmarks_insert_own" ON public.post_bookmarks
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "bookmarks_delete_own" ON public.post_bookmarks
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Reports : insertion authentifiée, lecture limitée au rapporteur
CREATE POLICY "reports_select_own" ON public.post_reports
  FOR SELECT TO authenticated USING ((select auth.uid()) = reporter_id);
CREATE POLICY "reports_insert_auth" ON public.post_reports
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = reporter_id);

-- AI Chef conversations : strictement privé au propriétaire
CREATE POLICY "ai_chef_select_own" ON public.ai_chef_conversations
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "ai_chef_insert_own" ON public.ai_chef_conversations
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "ai_chef_update_own" ON public.ai_chef_conversations
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "ai_chef_delete_own" ON public.ai_chef_conversations
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Suggestions, Bugs, Waitlist, Reviews
CREATE POLICY "suggestions_insert_public" ON public.dish_suggestions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "suggestions_select_own" ON public.dish_suggestions
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

CREATE POLICY "bugs_insert_auth" ON public.bug_reports
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "bugs_select_own" ON public.bug_reports
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

CREATE POLICY "waitlist_insert_public" ON public.waitlist
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reviews_insert_auth" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Admins : lecture propre uniquement (gestion via service_role côté CMS)
CREATE POLICY "admins_select_own" ON public.admins
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
