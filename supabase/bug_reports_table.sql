-- ============================================================
-- Table: bug_reports
-- AfroCuisto — Rapport de bugs utilisateurs
-- ============================================================
-- À exécuter dans la console SQL de Supabase
-- (Table Editor > SQL Editor > New Query)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bug_reports (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name   TEXT NOT NULL DEFAULT 'Anonyme',
    user_email  TEXT NOT NULL DEFAULT 'N/A',
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    steps_to_reproduce TEXT,
    severity    TEXT NOT NULL CHECK (severity IN ('Bloquant', 'Majeur', 'Mineur', 'Cosmétique')),
    category    TEXT NOT NULL CHECK (category IN ('Interface', 'Connexion', 'Recettes', 'Communauté', 'Panier', 'Notifications', 'Performance', 'Autre')),
    status      TEXT NOT NULL DEFAULT 'Nouveau' CHECK (status IN ('Nouveau', 'En cours', 'Résolu', 'Fermé')),
    device_info TEXT,
    app_version TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- Activer RLS (Row Level Security)
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs authentifiés peuvent insérer leurs propres rapports
CREATE POLICY "Users can insert bug reports"
    ON public.bug_reports
    FOR INSERT
    WITH CHECK (true);  -- Accepter aussi les rapports anonymes

-- Politique : les admins peuvent tout lire/modifier/supprimer
-- (Ajustez selon votre logique admin, ex: via is_admin dans user_profiles)
CREATE POLICY "Admins can manage bug reports"
    ON public.bug_reports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Index pour les requêtes admin
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON public.bug_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status     ON public.bug_reports (status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity   ON public.bug_reports (severity);

-- Commentaire
COMMENT ON TABLE public.bug_reports IS
    'Rapports de bugs soumis par les utilisateurs de l''application AfroCuisto Mobile.';
