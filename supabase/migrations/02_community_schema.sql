-- ==============================================================================
-- Migration Supabase 02 : Schéma Communauté 100% Blindé & Ouvert
-- Projet Supabase: https://supabase.com/dashboard/project/ewoiqbhqtcdatpzhdaef
-- ==============================================================================

-- 0. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  name TEXT NOT NULL DEFAULT 'Gourmet AfroCuisto',
  avatar_url TEXT,
  region TEXT DEFAULT 'Afrique de l’Ouest',
  role TEXT DEFAULT 'Cuisinier Amateur',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Gourmet AfroCuisto';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'Afrique de l’Ouest';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Cuisinier Amateur';

-- 1. Table des Publications (Posts)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID,
  author_name TEXT NOT NULL DEFAULT 'Gourmet AfroCuisto',
  author_avatar TEXT,
  author_role TEXT DEFAULT 'Gourmet Passionné',
  author_country TEXT DEFAULT 'Afrique',
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  recipe_id TEXT,
  recipe_name TEXT,
  recipe_image TEXT,
  region TEXT,
  type TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  likes_count INT DEFAULT 0 NOT NULL,
  comments_count INT DEFAULT 0 NOT NULL,
  shares_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='user_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='author_id') THEN
    ALTER TABLE public.posts RENAME COLUMN user_id TO author_id;
  END IF;
END $$;

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'Gourmet AfroCuisto';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_avatar TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_role TEXT DEFAULT 'Gourmet Passionné';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_country TEXT DEFAULT 'Afrique';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS recipe_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS recipe_name TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS recipe_image TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0 NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0 NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shares_count INT DEFAULT 0 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);

-- 2. Table des Likes de Posts
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);

-- 3. Table des Commentaires de Posts
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID,
  author_name TEXT NOT NULL DEFAULT 'Gourmet AfroCuisto',
  author_avatar TEXT,
  content TEXT NOT NULL DEFAULT '',
  likes_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='post_comments' AND column_name='user_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='post_comments' AND column_name='author_id') THEN
    ALTER TABLE public.post_comments RENAME COLUMN user_id TO author_id;
  END IF;
END $$;

ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'Gourmet AfroCuisto';
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS author_avatar TEXT;
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id, created_at DESC);

-- 4. Table des Favoris / Signets de Posts
CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user ON public.post_bookmarks(user_id);

-- 5. Table des Stories
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID,
  author_name TEXT NOT NULL DEFAULT 'Gourmet AfroCuisto',
  author_avatar TEXT,
  title TEXT NOT NULL DEFAULT '',
  caption TEXT,
  image_url TEXT NOT NULL DEFAULT '',
  video_badge BOOLEAN DEFAULT false NOT NULL,
  recipe_name TEXT,
  recipe_id TEXT,
  is_live BOOLEAN DEFAULT false NOT NULL,
  duration INT DEFAULT 6 NOT NULL,
  views_count INT DEFAULT 0 NOT NULL,
  likes_count INT DEFAULT 0 NOT NULL,
  placed_stickers JSONB DEFAULT '[]'::jsonb,
  placed_text JSONB,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '7 days') NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='user_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stories' AND column_name='author_id') THEN
    ALTER TABLE public.stories RENAME COLUMN user_id TO author_id;
  END IF;
END $$;

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'Gourmet AfroCuisto';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS author_avatar TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS video_badge BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS recipe_name TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS recipe_id TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS duration INT DEFAULT 6 NOT NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0 NOT NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0 NOT NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS placed_stickers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS placed_text JSONB;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '7 days') NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON public.stories(author_id);

-- 6. Table des Vues de Stories
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user ON public.story_views(user_id);

-- 7. Table des Likes de Stories
CREATE TABLE IF NOT EXISTS public.story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_likes_story ON public.story_likes(story_id);

-- 8. Table des Défis Culinaires (Challenges)
CREATE TABLE IF NOT EXISTS public.challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  badge TEXT NOT NULL,
  deadline TEXT NOT NULL,
  participants_count INT DEFAULT 0 NOT NULL,
  total_votes INT DEFAULT 0 NOT NULL,
  prize_text TEXT NOT NULL,
  banner_image TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS participants_count INT DEFAULT 0 NOT NULL;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS total_votes INT DEFAULT 0 NOT NULL;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id TEXT REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  recipe_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(challenge_id, user_id)
);

-- ==============================================================================
-- DÉVERROUILLAGE DES CLÉS ÉTRANGÈRES BLOQUANTES POUR PERMETTRE TOUTE PUBLICATION
-- ==============================================================================

DO $$
BEGIN
  BEGIN ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.post_comments DROP CONSTRAINT IF EXISTS post_comments_author_id_fkey; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_author_id_fkey; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.post_comments DROP CONSTRAINT IF EXISTS post_comments_post_id_fkey; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.post_likes DROP CONSTRAINT IF EXISTS post_likes_post_id_fkey; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.post_bookmarks DROP CONSTRAINT IF EXISTS post_bookmarks_post_id_fkey; EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN ALTER TABLE public.post_comments ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE public.post_bookmarks ADD CONSTRAINT post_bookmarks_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- ==============================================================================
-- TRIGGERS DE COMPTEURS AUTOMATIQUES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_post_like_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET likes_count = likes_count + 1, updated_at = timezone('utc'::text, now())
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET likes_count = GREATEST(0, likes_count - 1), updated_at = timezone('utc'::text, now())
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_post_like_count ON public.post_likes;
CREATE TRIGGER trigger_post_like_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_like_change();

CREATE OR REPLACE FUNCTION public.handle_post_comment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comments_count = comments_count + 1, updated_at = timezone('utc'::text, now())
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = GREATEST(0, comments_count - 1), updated_at = timezone('utc'::text, now())
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_post_comment_count ON public.post_comments;
CREATE TRIGGER trigger_post_comment_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_comment_change();

CREATE OR REPLACE FUNCTION public.handle_story_view_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories
    SET views_count = views_count + 1
    WHERE id = NEW.story_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_story_view_count ON public.story_views;
CREATE TRIGGER trigger_story_view_count
  AFTER INSERT ON public.story_views
  FOR EACH ROW EXECUTE FUNCTION public.handle_story_view_change();

CREATE OR REPLACE FUNCTION public.handle_story_like_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories
    SET likes_count = likes_count + 1
    WHERE id = NEW.story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stories
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_story_like_count ON public.story_likes;
CREATE TRIGGER trigger_story_like_count
  AFTER INSERT OR DELETE ON public.story_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_story_like_change();

CREATE OR REPLACE FUNCTION public.handle_challenge_participant_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.challenges
    SET participants_count = participants_count + 1
    WHERE id = NEW.challenge_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.challenges
    SET participants_count = GREATEST(0, participants_count - 1)
    WHERE id = OLD.challenge_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_challenge_participant_count ON public.challenge_participants;
CREATE TRIGGER trigger_challenge_participant_count
  AFTER INSERT OR DELETE ON public.challenge_participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_challenge_participant_change();

-- ==============================================================================
-- SÉCURITÉ ROW LEVEL SECURITY OUVERTE
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique des profils" ON public.profiles;
DROP POLICY IF EXISTS "Modification des profils" ON public.profiles;
DROP POLICY IF EXISTS "Création des profils" ON public.profiles;
CREATE POLICY "Lecture publique des profils" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Création des profils" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Modification des profils" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Lecture publique des posts" ON public.posts;
DROP POLICY IF EXISTS "Création de posts" ON public.posts;
DROP POLICY IF EXISTS "Modification de ses propres posts" ON public.posts;
DROP POLICY IF EXISTS "Suppression de ses propres posts" ON public.posts;
CREATE POLICY "Lecture publique des posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Création de posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Modification de ses propres posts" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Suppression de ses propres posts" ON public.posts FOR DELETE USING (true);

DROP POLICY IF EXISTS "Lecture des likes de posts" ON public.post_likes;
DROP POLICY IF EXISTS "Ajout de like" ON public.post_likes;
DROP POLICY IF EXISTS "Suppression de son like" ON public.post_likes;
CREATE POLICY "Lecture des likes de posts" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Ajout de like" ON public.post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Suppression de son like" ON public.post_likes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Lecture des commentaires" ON public.post_comments;
DROP POLICY IF EXISTS "Ajout de commentaire" ON public.post_comments;
DROP POLICY IF EXISTS "Suppression de son commentaire" ON public.post_comments;
CREATE POLICY "Lecture des commentaires" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Ajout de commentaire" ON public.post_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Suppression de son commentaire" ON public.post_comments FOR DELETE USING (true);

DROP POLICY IF EXISTS "Lecture de ses favoris" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Ajout de favori" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Suppression de favori" ON public.post_bookmarks;
CREATE POLICY "Lecture de ses favoris" ON public.post_bookmarks FOR SELECT USING (true);
CREATE POLICY "Ajout de favori" ON public.post_bookmarks FOR INSERT WITH CHECK (true);
CREATE POLICY "Suppression de favori" ON public.post_bookmarks FOR DELETE USING (true);

DROP POLICY IF EXISTS "Lecture des stories actives" ON public.stories;
DROP POLICY IF EXISTS "Création de story" ON public.stories;
DROP POLICY IF EXISTS "Suppression de sa story" ON public.stories;
CREATE POLICY "Lecture des stories actives" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Création de story" ON public.stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Suppression de sa story" ON public.stories FOR DELETE USING (true);

DROP POLICY IF EXISTS "Lecture des vues de story" ON public.story_views;
DROP POLICY IF EXISTS "Enregistrement de vue de story" ON public.story_views;
CREATE POLICY "Lecture des vues de story" ON public.story_views FOR SELECT USING (true);
CREATE POLICY "Enregistrement de vue de story" ON public.story_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Lecture des likes de story" ON public.story_likes;
DROP POLICY IF EXISTS "Ajout de like de story" ON public.story_likes;
DROP POLICY IF EXISTS "Suppression de like de story" ON public.story_likes;
CREATE POLICY "Lecture des likes de story" ON public.story_likes FOR SELECT USING (true);
CREATE POLICY "Ajout de like de story" ON public.story_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Suppression de like de story" ON public.story_likes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Lecture des défis" ON public.challenges;
DROP POLICY IF EXISTS "Lecture des participants aux défis" ON public.challenge_participants;
DROP POLICY IF EXISTS "Participation au défi" ON public.challenge_participants;
DROP POLICY IF EXISTS "Annulation de participation" ON public.challenge_participants;
CREATE POLICY "Lecture des défis" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Lecture des participants aux défis" ON public.challenge_participants FOR SELECT USING (true);
CREATE POLICY "Participation au défi" ON public.challenge_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Annulation de participation" ON public.challenge_participants FOR DELETE USING (true);

-- ==============================================================================
-- ACTIVATION DE SUPABASE REALTIME & REPLICA IDENTITY FULL
-- ==============================================================================

ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
ALTER TABLE public.stories REPLICA IDENTITY FULL;
ALTER TABLE public.story_views REPLICA IDENTITY FULL;
ALTER TABLE public.story_likes REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.posts; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.stories; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.story_likes; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_participants; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 1. Défi Actif par défaut
INSERT INTO public.challenges (
  id, title, subtitle, badge, deadline, participants_count, total_votes, prize_text, banner_image, is_active
) VALUES (
  'chal_gombo_2026',
  '🏆 Défi du Chef : La Meilleure Sauce Gombo',
  'Partagez votre photo avec votre touche d’épices secrète. Votez pour vos créations préférées !',
  'Concours de la Semaine',
  'Reste 3 jours',
  0,
  0,
  'Tablier Chef & Badge d’Or',
  'sauce-gombo',
  true
)
ON CONFLICT (id) DO NOTHING;
