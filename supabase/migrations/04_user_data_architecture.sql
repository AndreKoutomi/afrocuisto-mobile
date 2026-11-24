-- ==============================================================================
-- Migration Supabase 04 : Architecture Complète & Optimisée des Données Utilisateurs
-- Projet Supabase: https://supabase.com/dashboard/project/ewoiqbhqtcdatpzhdaef
-- ==============================================================================
-- Objectifs :
--   1. Unifier `public.profiles` (identité, terroir, niveau, épices, régimes, stats)
--   2. Séparer les préférences applicatives dans `public.user_preferences` (1:1)
--   3. Normaliser favoris (`user_favorites`), plats cuisinés (`user_cooked_recipes`),
--      liste de marché (`user_shopping_items`) et historique Chef IA (`ai_chef_conversations`)
--   4. Maintenir automatiquement les tableaux dénormalisés sur `profiles` via triggers
--   5. Migrer toute donnée héritée de `user_profiles` et exposer une vue compatible
--   6. Durcir les politiques RLS (propriétaire uniquement pour les données privées)
--   7. Fournir des RPC atomiques (`get_my_user_bundle`, `sync_my_preferences`, etc.)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Fonction utilitaire générique updated_at
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. Table canonique `public.profiles`
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT NOT NULL DEFAULT 'Gourmet Afro',
  avatar_url TEXT,
  role_title TEXT NOT NULL DEFAULT 'Gourmet Passionné',
  role TEXT NOT NULL DEFAULT 'Gourmet Passionné',
  bio TEXT NOT NULL DEFAULT 'Passionné de gastronomie africaine traditionnelle et créative.',
  favorite_terroir TEXT NOT NULL DEFAULT 'Bénin',
  region TEXT NOT NULL DEFAULT 'Bénin',
  culinary_level TEXT NOT NULL DEFAULT 'intermediate',
  spice_tolerance TEXT NOT NULL DEFAULT 'spicy',
  dietary_tags TEXT[] NOT NULL DEFAULT '{}',
  dietary_preference TEXT DEFAULT 'Relevé',
  favorite_recipe_ids TEXT[] NOT NULL DEFAULT '{}',
  cooked_recipe_ids TEXT[] NOT NULL DEFAULT '{}',
  is_banned BOOLEAN NOT NULL DEFAULT false,
  last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Gourmet Afro';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_title TEXT NOT NULL DEFAULT 'Gourmet Passionné';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'Gourmet Passionné';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT 'Passionné de gastronomie africaine traditionnelle et créative.';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_terroir TEXT NOT NULL DEFAULT 'Bénin';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'Bénin';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS culinary_level TEXT NOT NULL DEFAULT 'intermediate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spice_tolerance TEXT NOT NULL DEFAULT 'spicy';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dietary_tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dietary_preference TEXT DEFAULT 'Relevé';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_recipe_ids TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cooked_recipe_ids TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Contraintes de domaine sûres (idempotentes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_culinary_level_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_culinary_level_check
      CHECK (culinary_level IN ('beginner', 'intermediate', 'passionate', 'chef'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_spice_tolerance_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_spice_tolerance_check
      CHECK (spice_tolerance IN ('mild', 'fragrant', 'spicy', 'fiery'));
  END IF;
END $$;

-- Synchronisation automatique des colonnes miroirs (role <-> role_title, region <-> favorite_terroir)
CREATE OR REPLACE FUNCTION public.sync_profile_mirror_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.role_title := COALESCE(NULLIF(NEW.role_title, ''), NULLIF(NEW.role, ''), 'Gourmet Passionné');
    NEW.role := NEW.role_title;
    NEW.favorite_terroir := COALESCE(NULLIF(NEW.favorite_terroir, ''), NULLIF(NEW.region, ''), 'Bénin');
    NEW.region := NEW.favorite_terroir;
  ELSE
    IF NEW.role_title IS DISTINCT FROM OLD.role_title AND NULLIF(NEW.role_title, '') IS NOT NULL THEN
      NEW.role := NEW.role_title;
    ELSIF NEW.role IS DISTINCT FROM OLD.role AND NULLIF(NEW.role, '') IS NOT NULL THEN
      NEW.role_title := NEW.role;
    END IF;

    IF NEW.favorite_terroir IS DISTINCT FROM OLD.favorite_terroir AND NULLIF(NEW.favorite_terroir, '') IS NOT NULL THEN
      NEW.region := NEW.favorite_terroir;
    ELSIF NEW.region IS DISTINCT FROM OLD.region AND NULLIF(NEW.region, '') IS NOT NULL THEN
      NEW.favorite_terroir := NEW.region;
    END IF;

    NEW.role_title := COALESCE(NULLIF(NEW.role_title, ''), NULLIF(NEW.role, ''), 'Gourmet Passionné');
    NEW.role := NEW.role_title;
    NEW.favorite_terroir := COALESCE(NULLIF(NEW.favorite_terroir, ''), NULLIF(NEW.region, ''), 'Bénin');
    NEW.region := NEW.favorite_terroir;
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_profile_mirrors ON public.profiles;
CREATE TRIGGER trigger_sync_profile_mirrors
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_mirror_columns();

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_terroir ON public.profiles(favorite_terroir);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_dietary_tags ON public.profiles USING GIN(dietary_tags);
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_recipe_ids ON public.profiles USING GIN(favorite_recipe_ids);

-- ------------------------------------------------------------------------------
-- 2. Table `public.user_preferences` (1:1 avec `public.profiles`)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  default_servings INT NOT NULL DEFAULT 4 CHECK (default_servings BETWEEN 1 AND 20),
  measurement_mode TEXT NOT NULL DEFAULT 'metric' CHECK (measurement_mode IN ('metric', 'household')),
  diaspora_substitutes_first BOOLEAN NOT NULL DEFAULT false,
  keep_screen_on_in_recipe BOOLEAN NOT NULL DEFAULT true,
  theme_mode TEXT NOT NULL DEFAULT 'system' CHECK (theme_mode IN ('system', 'light', 'dark')),
  carousel_auto_scroll BOOLEAN NOT NULL DEFAULT true,
  timer_vibration_enabled BOOLEAN NOT NULL DEFAULT true,
  ai_voice_id TEXT NOT NULL DEFAULT 'ursa',
  language TEXT NOT NULL DEFAULT 'fr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 3. Table `public.user_favorites` + Trigger de synchronisation sur `profiles`
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_created ON public.user_favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_recipe ON public.user_favorites(recipe_id);

CREATE OR REPLACE FUNCTION public.sync_profile_favorites_array()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(NEW.user_id, OLD.user_id);
  UPDATE public.profiles
  SET favorite_recipe_ids = COALESCE(
    (SELECT ARRAY_AGG(recipe_id ORDER BY created_at DESC)
     FROM public.user_favorites
     WHERE user_id = target_user_id),
    '{}'::TEXT[]
  )
  WHERE id = target_user_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_profile_favorites ON public.user_favorites;
CREATE TRIGGER trigger_sync_profile_favorites
  AFTER INSERT OR DELETE ON public.user_favorites
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_favorites_array();

-- ------------------------------------------------------------------------------
-- 4. Table `public.user_cooked_recipes` + Trigger de synchronisation sur `profiles`
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_cooked_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL,
  cooked_count INT NOT NULL DEFAULT 1 CHECK (cooked_count >= 1),
  last_cooked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_user_cooked_user_recent ON public.user_cooked_recipes(user_id, last_cooked_at DESC);

CREATE OR REPLACE FUNCTION public.sync_profile_cooked_array()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(NEW.user_id, OLD.user_id);
  UPDATE public.profiles
  SET cooked_recipe_ids = COALESCE(
    (SELECT ARRAY_AGG(recipe_id ORDER BY last_cooked_at DESC)
     FROM public.user_cooked_recipes
     WHERE user_id = target_user_id),
    '{}'::TEXT[]
  )
  WHERE id = target_user_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_profile_cooked ON public.user_cooked_recipes;
CREATE TRIGGER trigger_sync_profile_cooked
  AFTER INSERT OR UPDATE OR DELETE ON public.user_cooked_recipes
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_cooked_array();

-- ------------------------------------------------------------------------------
-- 5. Table `public.user_shopping_items` (Panier Marché & Archives)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity TEXT NOT NULL DEFAULT '1',
  category TEXT NOT NULL DEFAULT 'Épices & Terroir',
  recipe_name TEXT,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  price NUMERIC(12, 2),
  currency TEXT NOT NULL DEFAULT 'FCFA' CHECK (currency IN ('FCFA', 'EUR')),
  archived_at TIMESTAMPTZ,
  archive_batch_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, client_item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_shopping_active
  ON public.user_shopping_items(user_id, is_checked)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_shopping_archived
  ON public.user_shopping_items(user_id, archived_at DESC)
  WHERE archived_at IS NOT NULL;

DROP TRIGGER IF EXISTS set_user_shopping_items_updated_at ON public.user_shopping_items;
CREATE TRIGGER set_user_shopping_items_updated_at
  BEFORE UPDATE ON public.user_shopping_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 6. Table `public.ai_chef_conversations` (Historique Chef IA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_chef_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_conversation_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nouvelle discussion',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, client_conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_chef_conversations_user_updated
  ON public.ai_chef_conversations(user_id, updated_at DESC);

DROP TRIGGER IF EXISTS set_ai_chef_conversations_updated_at ON public.ai_chef_conversations;
CREATE TRIGGER set_ai_chef_conversations_updated_at
  BEFORE UPDATE ON public.ai_chef_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 7. Migration des données héritées (`user_profiles` -> `profiles` + `user_preferences`)
--    et création d'une vue de compatibilité `public.user_profiles`
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND table_type = 'BASE TABLE'
  ) THEN
    INSERT INTO public.profiles (
      id, email, name, avatar_url, favorite_recipe_ids, created_at, updated_at
    )
    SELECT
      up.id,
      up.email,
      COALESCE(NULLIF(up.name, ''), 'Gourmet Afro'),
      up.avatar,
      COALESCE(up.favorites, '{}'::TEXT[]),
      COALESCE(up.joined_date, timezone('utc'::text, now())),
      COALESCE(up.updated_at, timezone('utc'::text, now()))
    FROM public.user_profiles up
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(NULLIF(public.profiles.email, ''), EXCLUDED.email),
      name = COALESCE(NULLIF(public.profiles.name, ''), EXCLUDED.name),
      avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
      favorite_recipe_ids = CASE
        WHEN COALESCE(array_length(public.profiles.favorite_recipe_ids, 1), 0) = 0
        THEN EXCLUDED.favorite_recipe_ids
        ELSE public.profiles.favorite_recipe_ids
      END;

    INSERT INTO public.user_preferences (user_id, theme_mode, language)
    SELECT
      up.id,
      CASE WHEN COALESCE(up.dark_mode, false) THEN 'dark' ELSE 'system' END,
      COALESCE(NULLIF(up.language, ''), 'fr')
    FROM public.user_profiles up
    ON CONFLICT (user_id) DO NOTHING;

    DROP TABLE public.user_profiles CASCADE;
  END IF;
END $$;

-- Backfill `user_preferences`, `user_favorites` et `user_cooked_recipes` pour les profils existants
INSERT INTO public.user_preferences (user_id)
SELECT p.id FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_favorites (user_id, recipe_id)
SELECT p.id, unnest(p.favorite_recipe_ids)
FROM public.profiles p
WHERE COALESCE(array_length(p.favorite_recipe_ids, 1), 0) > 0
ON CONFLICT (user_id, recipe_id) DO NOTHING;

INSERT INTO public.user_cooked_recipes (user_id, recipe_id)
SELECT p.id, unnest(p.cooked_recipe_ids)
FROM public.profiles p
WHERE COALESCE(array_length(p.cooked_recipe_ids, 1), 0) > 0
ON CONFLICT (user_id, recipe_id) DO NOTHING;

-- Vue de compatibilité lecture seule pour les anciens clients / requêtes CMS
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  p.id,
  p.name,
  p.email,
  COALESCE(pref.language, 'fr') AS language,
  (COALESCE(pref.theme_mode, 'system') = 'dark') AS dark_mode,
  p.created_at AS joined_date,
  p.updated_at,
  p.favorite_recipe_ids AS favorites,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', si.client_item_id,
          'name', si.name,
          'quantity', si.quantity,
          'category', si.category,
          'isChecked', si.is_checked,
          'price', si.price
        )
      )
      FROM public.user_shopping_items si
      WHERE si.user_id = p.id AND si.archived_at IS NULL
    ),
    '[]'::jsonb
  ) AS shopping_list,
  p.avatar_url AS avatar,
  p.favorite_terroir,
  p.culinary_level,
  p.spice_tolerance,
  p.dietary_tags,
  p.cooked_recipe_ids,
  p.is_banned
FROM public.profiles p
LEFT JOIN public.user_preferences pref ON pref.user_id = p.id;

-- ------------------------------------------------------------------------------
-- 8. Trigger d'inscription `handle_new_user()` enrichi
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_terroir TEXT;
  v_level TEXT;
  v_spice TEXT;
  v_dietary_tags TEXT[] := '{}';
  v_dietary_pref TEXT;
  v_avatar TEXT;
BEGIN
  v_name := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'name'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(COALESCE(new.email, 'gourmet'), '@', 1)
  );

  v_terroir := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'region'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'favorite_terroir'), ''),
    'Bénin'
  );

  v_level := CASE
    WHEN new.raw_user_meta_data->>'culinary_level' IN ('beginner', 'intermediate', 'passionate', 'chef')
    THEN new.raw_user_meta_data->>'culinary_level'
    ELSE 'intermediate'
  END;

  v_spice := CASE
    WHEN new.raw_user_meta_data->>'spice_tolerance' IN ('mild', 'fragrant', 'spicy', 'fiery')
    THEN new.raw_user_meta_data->>'spice_tolerance'
    ELSE 'spicy'
  END;

  IF (new.raw_user_meta_data ? 'dietary_tags')
     AND jsonb_typeof(new.raw_user_meta_data->'dietary_tags') = 'array' THEN
    SELECT COALESCE(ARRAY_AGG(elem), '{}'::TEXT[])
    INTO v_dietary_tags
    FROM jsonb_array_elements_text(new.raw_user_meta_data->'dietary_tags') AS elem;
  END IF;

  v_dietary_pref := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'dietary_preference'), ''),
    'Relevé'
  );

  v_avatar := NULLIF(trim(new.raw_user_meta_data->>'avatar_url'), '');

  INSERT INTO public.profiles (
    id,
    email,
    name,
    avatar_url,
    role_title,
    role,
    favorite_terroir,
    region,
    culinary_level,
    spice_tolerance,
    dietary_tags,
    dietary_preference
  ) VALUES (
    new.id,
    new.email,
    v_name,
    v_avatar,
    'Gourmet Passionné',
    'Gourmet Passionné',
    v_terroir,
    v_terroir,
    v_level,
    v_spice,
    v_dietary_tags,
    v_dietary_pref
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    name = CASE
      WHEN public.profiles.name IS NULL OR public.profiles.name = '' OR public.profiles.name = 'Gourmet Afro'
      THEN EXCLUDED.name
      ELSE public.profiles.name
    END,
    favorite_terroir = COALESCE(NULLIF(EXCLUDED.favorite_terroir, ''), public.profiles.favorite_terroir),
    region = COALESCE(NULLIF(EXCLUDED.region, ''), public.profiles.region),
    culinary_level = COALESCE(EXCLUDED.culinary_level, public.profiles.culinary_level),
    spice_tolerance = COALESCE(EXCLUDED.spice_tolerance, public.profiles.spice_tolerance),
    dietary_tags = CASE
      WHEN COALESCE(array_length(EXCLUDED.dietary_tags, 1), 0) > 0 THEN EXCLUDED.dietary_tags
      ELSE public.profiles.dietary_tags
    END,
    dietary_preference = COALESCE(EXCLUDED.dietary_preference, public.profiles.dietary_preference),
    updated_at = timezone('utc'::text, now());

  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 9. Sécurité Row Level Security (RLS) stricte sur les données utilisateurs
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cooked_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chef_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles : lecture publique (communauté), écriture strictement réservée au propriétaire
DROP POLICY IF EXISTS "Lecture publique des profils" ON public.profiles;
DROP POLICY IF EXISTS "Création des profils" ON public.profiles;
DROP POLICY IF EXISTS "Modification des profils" ON public.profiles;
DROP POLICY IF EXISTS "Les profils sont consultables par tous les utilisateurs connectés" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Suppression de son propre profil" ON public.profiles;

CREATE POLICY "Lecture publique des profils"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Création de son propre profil"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Modification de son propre profil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Suppression de son propre profil"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- User Preferences : strictement privé au propriétaire
DROP POLICY IF EXISTS "user_preferences_owner_all" ON public.user_preferences;
CREATE POLICY "user_preferences_owner_all"
  ON public.user_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Favorites : strictement privé au propriétaire
DROP POLICY IF EXISTS "user_favorites_owner_all" ON public.user_favorites;
CREATE POLICY "user_favorites_owner_all"
  ON public.user_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Cooked Recipes : strictement privé au propriétaire
DROP POLICY IF EXISTS "user_cooked_owner_all" ON public.user_cooked_recipes;
CREATE POLICY "user_cooked_owner_all"
  ON public.user_cooked_recipes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Shopping Items : strictement privé au propriétaire
DROP POLICY IF EXISTS "user_shopping_owner_all" ON public.user_shopping_items;
CREATE POLICY "user_shopping_owner_all"
  ON public.user_shopping_items FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AI Chef Conversations : strictement privé au propriétaire
DROP POLICY IF EXISTS "ai_chef_conversations_owner_all" ON public.ai_chef_conversations;
CREATE POLICY "ai_chef_conversations_owner_all"
  ON public.ai_chef_conversations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 10. Fonctions RPC atomiques pour synchronisation mobile en 1 requête
-- ------------------------------------------------------------------------------

-- A. Récupérer tout le bundle utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_my_user_bundle()
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_profile JSONB;
  v_prefs JSONB;
  v_favorites JSONB;
  v_cooked JSONB;
  v_shopping JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Garantir l'existence des lignes de base
  INSERT INTO public.user_preferences (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.profiles
  SET last_active_at = timezone('utc'::text, now())
  WHERE id = v_uid;

  SELECT to_jsonb(p.*) INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_uid;

  SELECT to_jsonb(pref.*) INTO v_prefs
  FROM public.user_preferences pref
  WHERE pref.user_id = v_uid;

  SELECT COALESCE(jsonb_agg(f.recipe_id ORDER BY f.created_at DESC), '[]'::jsonb)
  INTO v_favorites
  FROM public.user_favorites f
  WHERE f.user_id = v_uid;

  SELECT COALESCE(jsonb_agg(c.recipe_id ORDER BY c.last_cooked_at DESC), '[]'::jsonb)
  INTO v_cooked
  FROM public.user_cooked_recipes c
  WHERE c.user_id = v_uid;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.client_item_id,
        'name', s.name,
        'quantity', s.quantity,
        'category', s.category,
        'recipeName', s.recipe_name,
        'isChecked', s.is_checked,
        'price', s.price,
        'currency', s.currency,
        'archivedAt', CASE WHEN s.archived_at IS NOT NULL THEN (EXTRACT(EPOCH FROM s.archived_at) * 1000)::BIGINT ELSE NULL END,
        'archiveBatchLabel', s.archive_batch_label
      )
      ORDER BY s.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_shopping
  FROM public.user_shopping_items s
  WHERE s.user_id = v_uid;

  RETURN jsonb_build_object(
    'profile', COALESCE(v_profile, '{}'::jsonb),
    'preferences', COALESCE(v_prefs, '{}'::jsonb),
    'favorites', v_favorites,
    'cooked_recipes', v_cooked,
    'shopping_items', v_shopping
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Synchroniser profil culinaire + préférences applicatives
CREATE OR REPLACE FUNCTION public.sync_my_preferences(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_dietary TEXT[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_payload ? 'dietary_tags' AND jsonb_typeof(p_payload->'dietary_tags') = 'array' THEN
    SELECT COALESCE(ARRAY_AGG(elem), '{}'::TEXT[])
    INTO v_dietary
    FROM jsonb_array_elements_text(p_payload->'dietary_tags') AS elem;
  END IF;

  UPDATE public.profiles
  SET
    name = COALESCE(NULLIF(trim(p_payload->>'display_name'), ''), name),
    role_title = COALESCE(NULLIF(trim(p_payload->>'role_title'), ''), role_title),
    bio = COALESCE(p_payload->>'bio', bio),
    avatar_url = COALESCE(NULLIF(trim(p_payload->>'avatar_url'), ''), avatar_url),
    favorite_terroir = COALESCE(NULLIF(trim(p_payload->>'favorite_terroir'), ''), favorite_terroir),
    culinary_level = CASE
      WHEN p_payload->>'culinary_level' IN ('beginner', 'intermediate', 'passionate', 'chef')
      THEN p_payload->>'culinary_level'
      ELSE culinary_level
    END,
    spice_tolerance = CASE
      WHEN p_payload->>'spice_tolerance' IN ('mild', 'fragrant', 'spicy', 'fiery')
      THEN p_payload->>'spice_tolerance'
      ELSE spice_tolerance
    END,
    dietary_tags = COALESCE(v_dietary, dietary_tags),
    last_active_at = timezone('utc'::text, now())
  WHERE id = v_uid;

  INSERT INTO public.user_preferences (
    user_id,
    default_servings,
    measurement_mode,
    diaspora_substitutes_first,
    keep_screen_on_in_recipe,
    theme_mode,
    carousel_auto_scroll,
    timer_vibration_enabled,
    ai_voice_id,
    language
  ) VALUES (
    v_uid,
    LEAST(20, GREATEST(1, COALESCE((p_payload->>'default_servings')::INT, 4))),
    CASE WHEN p_payload->>'measurement_mode' IN ('metric', 'household') THEN p_payload->>'measurement_mode' ELSE 'metric' END,
    COALESCE((p_payload->>'diaspora_substitutes_first')::BOOLEAN, false),
    COALESCE((p_payload->>'keep_screen_on_in_recipe')::BOOLEAN, true),
    CASE WHEN p_payload->>'theme_mode' IN ('system', 'light', 'dark') THEN p_payload->>'theme_mode' ELSE 'system' END,
    COALESCE((p_payload->>'carousel_auto_scroll')::BOOLEAN, true),
    COALESCE((p_payload->>'timer_vibration_enabled')::BOOLEAN, true),
    COALESCE(NULLIF(trim(p_payload->>'ai_voice_id'), ''), 'ursa'),
    COALESCE(NULLIF(trim(p_payload->>'language'), ''), 'fr')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    default_servings = LEAST(20, GREATEST(1, COALESCE((p_payload->>'default_servings')::INT, public.user_preferences.default_servings))),
    measurement_mode = CASE
      WHEN p_payload->>'measurement_mode' IN ('metric', 'household') THEN p_payload->>'measurement_mode'
      ELSE public.user_preferences.measurement_mode
    END,
    diaspora_substitutes_first = COALESCE((p_payload->>'diaspora_substitutes_first')::BOOLEAN, public.user_preferences.diaspora_substitutes_first),
    keep_screen_on_in_recipe = COALESCE((p_payload->>'keep_screen_on_in_recipe')::BOOLEAN, public.user_preferences.keep_screen_on_in_recipe),
    theme_mode = CASE
      WHEN p_payload->>'theme_mode' IN ('system', 'light', 'dark') THEN p_payload->>'theme_mode'
      ELSE public.user_preferences.theme_mode
    END,
    carousel_auto_scroll = COALESCE((p_payload->>'carousel_auto_scroll')::BOOLEAN, public.user_preferences.carousel_auto_scroll),
    timer_vibration_enabled = COALESCE((p_payload->>'timer_vibration_enabled')::BOOLEAN, public.user_preferences.timer_vibration_enabled),
    ai_voice_id = COALESCE(NULLIF(trim(p_payload->>'ai_voice_id'), ''), public.user_preferences.ai_voice_id),
    language = COALESCE(NULLIF(trim(p_payload->>'language'), ''), public.user_preferences.language);

  RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Basculer un favori
CREATE OR REPLACE FUNCTION public.toggle_my_favorite(p_recipe_id TEXT)
RETURNS TEXT[] AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_exists BOOLEAN;
  v_result TEXT[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_favorites
    WHERE user_id = v_uid AND recipe_id = p_recipe_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.user_favorites
    WHERE user_id = v_uid AND recipe_id = p_recipe_id;
  ELSE
    INSERT INTO public.user_favorites (user_id, recipe_id)
    VALUES (v_uid, p_recipe_id)
    ON CONFLICT (user_id, recipe_id) DO NOTHING;
  END IF;

  SELECT COALESCE(favorite_recipe_ids, '{}'::TEXT[])
  INTO v_result
  FROM public.profiles
  WHERE id = v_uid;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Marquer une recette comme cuisinée
CREATE OR REPLACE FUNCTION public.mark_recipe_cooked(p_recipe_id TEXT)
RETURNS TEXT[] AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_result TEXT[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_cooked_recipes (user_id, recipe_id, cooked_count, last_cooked_at)
  VALUES (v_uid, p_recipe_id, 1, timezone('utc'::text, now()))
  ON CONFLICT (user_id, recipe_id) DO UPDATE SET
    cooked_count = public.user_cooked_recipes.cooked_count + 1,
    last_cooked_at = timezone('utc'::text, now());

  SELECT COALESCE(cooked_recipe_ids, '{}'::TEXT[])
  INTO v_result
  FROM public.profiles
  WHERE id = v_uid;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Synchroniser le panier marché complet (actifs + archivés)
CREATE OR REPLACE FUNCTION public.sync_my_shopping_items(p_items JSONB)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_item JSONB;
  v_ids TEXT[] := '{}';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_array');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_ids := array_append(v_ids, v_item->>'id');

    INSERT INTO public.user_shopping_items (
      user_id,
      client_item_id,
      name,
      quantity,
      category,
      recipe_name,
      is_checked,
      price,
      currency,
      archived_at,
      archive_batch_label
    ) VALUES (
      v_uid,
      v_item->>'id',
      COALESCE(NULLIF(trim(v_item->>'name'), ''), 'Article'),
      COALESCE(NULLIF(trim(v_item->>'quantity'), ''), '1'),
      COALESCE(NULLIF(trim(v_item->>'category'), ''), 'Épices & Terroir'),
      NULLIF(trim(v_item->>'recipeName'), ''),
      COALESCE((v_item->>'isChecked')::BOOLEAN, false),
      NULLIF(v_item->>'price', '')::NUMERIC(12, 2),
      CASE WHEN v_item->>'currency' IN ('FCFA', 'EUR') THEN v_item->>'currency' ELSE 'FCFA' END,
      CASE
        WHEN NULLIF(v_item->>'archivedAt', '') IS NOT NULL
        THEN to_timestamp((v_item->>'archivedAt')::DOUBLE PRECISION / 1000.0)
        ELSE NULL
      END,
      NULLIF(trim(v_item->>'archiveBatchLabel'), '')
    )
    ON CONFLICT (user_id, client_item_id) DO UPDATE SET
      name = EXCLUDED.name,
      quantity = EXCLUDED.quantity,
      category = EXCLUDED.category,
      recipe_name = EXCLUDED.recipe_name,
      is_checked = EXCLUDED.is_checked,
      price = EXCLUDED.price,
      currency = EXCLUDED.currency,
      archived_at = EXCLUDED.archived_at,
      archive_batch_label = EXCLUDED.archive_batch_label;
  END LOOP;

  DELETE FROM public.user_shopping_items
  WHERE user_id = v_uid
    AND NOT (client_item_id = ANY(v_ids));

  RETURN jsonb_build_object('ok', true, 'count', COALESCE(array_length(v_ids, 1), 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.get_my_user_bundle() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_my_preferences(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_my_favorite(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_recipe_cooked(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_my_shopping_items(JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_my_user_bundle() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_my_preferences(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_my_favorite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_recipe_cooked(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_my_shopping_items(JSONB) TO authenticated;
