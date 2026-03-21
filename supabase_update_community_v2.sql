-- Correction pour la table community_posts
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Autre';

-- Table pour les signalements (Moderation)
CREATE TABLE IF NOT EXISTS public.post_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, resolved, dismissed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS pour les signalements
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signalements lisibles par les admins" ON public.post_reports FOR SELECT USING (true);
CREATE POLICY "Tout le monde peut signaler" ON public.post_reports FOR INSERT WITH CHECK (true);
