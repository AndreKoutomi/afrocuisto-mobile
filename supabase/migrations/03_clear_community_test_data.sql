-- ==============================================================================
-- Migration Supabase 03: Suppression Complète des Données de Test de la Communauté
-- Projet Supabase: https://supabase.com/dashboard/project/ewoiqbhqtcdatpzhdaef
-- ==============================================================================

-- 1. Suppression des données des tables d'interactions
TRUNCATE TABLE public.story_views CASCADE;
TRUNCATE TABLE public.story_likes CASCADE;
TRUNCATE TABLE public.post_likes CASCADE;
TRUNCATE TABLE public.post_comments CASCADE;
TRUNCATE TABLE public.post_bookmarks CASCADE;
TRUNCATE TABLE public.challenge_participants CASCADE;

-- 2. Suppression des publications et stories de test
TRUNCATE TABLE public.stories CASCADE;
TRUNCATE TABLE public.posts CASCADE;

-- 3. Suppression des profils de test (conserve les vrais utilisateurs inscrits)
DELETE FROM public.profiles
WHERE id IN (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777',
  '00000000-0000-0000-0000-000000000001'
)
OR email LIKE '%@afrocuisto.app';

