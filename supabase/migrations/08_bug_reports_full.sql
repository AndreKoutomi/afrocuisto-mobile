-- ==============================================================================
-- Migration 08 : Alignement complet de public.bug_reports avec l'Admin CMS
-- ==============================================================================
-- Aligne les colonnes et statuts de bug_reports sur afrocuisto-admin-cms-main/src/pages/Bugs.tsx
-- et autorise la soumission depuis l'application mobile (utilisateurs connectés et invités).

ALTER TABLE public.bug_reports
  ADD COLUMN IF NOT EXISTS user_name TEXT NOT NULL DEFAULT 'Utilisateur AfroCuisto',
  ADD COLUMN IF NOT EXISTS user_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS steps_to_reproduce TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'Mineur',
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Autre',
  ADD COLUMN IF NOT EXISTS screenshot TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Mise à jour des contraintes status & severity
ALTER TABLE public.bug_reports DROP CONSTRAINT IF EXISTS bug_reports_status_check;
ALTER TABLE public.bug_reports
  ADD CONSTRAINT bug_reports_status_check
  CHECK (status IN ('Nouveau', 'En cours', 'Résolu', 'Fermé', 'open', 'in_progress', 'resolved'));

ALTER TABLE public.bug_reports ALTER COLUMN status SET DEFAULT 'Nouveau';

ALTER TABLE public.bug_reports DROP CONSTRAINT IF EXISTS bug_reports_severity_check;
ALTER TABLE public.bug_reports
  ADD CONSTRAINT bug_reports_severity_check
  CHECK (severity IN ('Bloquant', 'Majeur', 'Mineur', 'Cosmétique'));

-- Normalisation des éventuelles anciennes lignes
UPDATE public.bug_reports SET status = 'Nouveau' WHERE status = 'open';
UPDATE public.bug_reports SET status = 'En cours' WHERE status = 'in_progress';
UPDATE public.bug_reports SET status = 'Résolu' WHERE status = 'resolved';

-- Politiques RLS : insertion autorisée pour les utilisateurs authentifiés (avec leur user_id)
-- et les invités (user_id IS NULL)
DROP POLICY IF EXISTS "bugs_insert_auth" ON public.bug_reports;
CREATE POLICY "bugs_insert_auth" ON public.bug_reports
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "bugs_insert_anon" ON public.bug_reports;
CREATE POLICY "bugs_insert_anon" ON public.bug_reports
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);
