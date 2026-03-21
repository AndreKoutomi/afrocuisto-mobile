-- =====================================================================
-- SCRIPT CORRECTIF : Relations manquantes entre community_posts et user_profiles
-- Exécuter dans l'éditeur SQL Supabase
-- =====================================================================

-- 1. Vérifier si la foreign key existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'community_posts_user_id_fkey'
        AND table_name = 'community_posts'
    ) THEN
        ALTER TABLE public.community_posts 
        ADD CONSTRAINT community_posts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Foreign key ajoutée avec succès.';
    ELSE
        RAISE NOTICE 'Foreign key déjà existante.';
    END IF;
END;
$$;

-- 2. S'assurer que toutes les colonnes nécessaires existent
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Autre';

-- 3. Synchroniser le cache PostgREST (nécessaire après ajout de FK)
SELECT pg_notify('pgrst', 'reload schema');
