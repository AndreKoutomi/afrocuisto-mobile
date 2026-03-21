-- Table: community_posts
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE, -- Relié au créateur du post
    title TEXT,
    content TEXT,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: post_likes
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE, -- Relié à l'utilisateur qui a dis LIKE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- Table: post_comments (Si vous avez besoin des commentaires dans le futur)
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE, -- Relié à l'auteur du commentaire
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fonction Trigger pour incrémenter/décrémenter les likes_count
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Affecter le Trigger
DROP TRIGGER IF EXISTS update_likes_count_trigger ON public.post_likes;
CREATE TRIGGER update_likes_count_trigger
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE PROCEDURE public.update_likes_count();

-- Table: post_views
CREATE TABLE IF NOT EXISTS public.post_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- On utilise TEXT pour permettre "anonymous"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id)
);

-- Fonction Trigger pour incrémenter views_count
CREATE OR REPLACE FUNCTION public.update_views_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.community_posts SET views_count = views_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Affecter le Trigger views
DROP TRIGGER IF EXISTS update_views_count_trigger ON public.post_views;
CREATE TRIGGER update_views_count_trigger
AFTER INSERT ON public.post_views
FOR EACH ROW EXECUTE PROCEDURE public.update_views_count();

-- RLS (Row Level Security) pour autoriser l'accès depuis l'application
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture publique de tout le flux communautaire
CREATE POLICY "Flux communautaire lisible par tous" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Likes lisibles par tous" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Vues lisibles par tous" ON public.post_views FOR SELECT USING (true);

-- Permettre à n'importe quel utilisateur d'insérer des vues 
CREATE POLICY "Creation de views" ON public.post_views FOR INSERT WITH CHECK (true);

-- Permettre à n'importe quel utilisateur authentifié d'insérer (Puisqu'on envoie directemet depuis l'app)
CREATE POLICY "Creation de posts" ON public.community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Modification de posts" ON public.community_posts FOR UPDATE USING (true);
CREATE POLICY "Suppression de posts" ON public.community_posts FOR DELETE USING (true);

-- Pareil pour les likes
CREATE POLICY "Ajout like" ON public.post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Retrait like" ON public.post_likes FOR DELETE USING (true);
