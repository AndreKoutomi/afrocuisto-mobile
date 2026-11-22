-- ==============================================================================
-- Migration Supabase: Authentification & Profils Utilisateurs AfroCuisto
-- Projet Supabase: https://supabase.com/dashboard/project/ewoiqbhqtcdatpzhdaef
-- ==============================================================================

-- 1. Création de la table des profils publics liée à auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT DEFAULT 'terracotta',
  bio TEXT DEFAULT 'Passionné de gastronomie africaine et de cuisine authentique 🍲',
  region TEXT DEFAULT 'Bénin (Cotonou)',
  dietary_preference TEXT DEFAULT 'Traditionnel & Épicé',
  favorite_recipe_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour accélérer les recherches par email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Activation des Politiques de Sécurité Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique 1: Tout le monde peut voir les profils publics (pour la communauté et les stories)
CREATE POLICY "Les profils sont consultables par tous les utilisateurs connectés"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique 2: Un utilisateur ne peut insérer que son propre profil
CREATE POLICY "Les utilisateurs peuvent créer leur propre profil"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Politique 3: Un utilisateur ne peut modifier que son propre profil
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Fonction & Trigger PostgreSQL pour créer automatiquement le profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Récupération du nom saisi dans les métadonnées (ou fallback sur l'email)
  user_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  INSERT INTO public.profiles (
    id,
    name,
    email,
    avatar_url,
    bio,
    region,
    dietary_preference,
    favorite_recipe_ids
  ) VALUES (
    new.id,
    user_name,
    new.email,
    'terracotta',
    'Passionné de gastronomie africaine et de cuisine authentique 🍲',
    'Bénin (Cotonou)',
    'Traditionnel & Épicé',
    '{}'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = CASE WHEN profiles.name IS NULL OR profiles.name = '' THEN EXCLUDED.name ELSE profiles.name END,
    updated_at = timezone('utc'::text, now());

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencheur sur la table auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Fonction de mise à jour automatique du champ updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

