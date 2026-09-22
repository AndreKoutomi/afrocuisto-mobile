import { supabase, isSupabaseConfigured } from './supabase';
import {
  CommunityPost,
  CommunityStory,
  PostComment,
  CommunityChallenge,
} from '../types/community';
import { StorageService } from './storage';
import { toValidUuid } from '../utils/uuidHelper';

export const FALLBACK_STORIES: CommunityStory[] = [];

export const FALLBACK_CHALLENGE: CommunityChallenge = {
  id: 'chal_gombo_2026',
  title: '🏆 Défi du Chef : La Meilleure Sauce Gombo',
  subtitle: 'Partagez votre photo avec votre touche d’épices secrète. Votez pour vos créations préférées !',
  badge: 'Concours de la Semaine',
  deadline: 'Reste 3 jours',
  participantsCount: 0,
  totalVotes: 0,
  prizeText: 'Tablier Chef & Badge d’Or',
  bannerImage: 'sauce-gombo',
  isParticipating: false,
};

export const FALLBACK_POSTS: CommunityPost[] = [];

export const CommunityService = {
  // S'assure qu'un profil existe dans public.profiles pour l'auteur
  async ensureProfile(
    userId: string,
    name?: string,
    avatarUrl?: string | null,
    region?: string
  ): Promise<string> {
    const validUuid = toValidUuid(userId);
    if (!isSupabaseConfigured()) return validUuid;

    try {
      await supabase.from('profiles').upsert(
        {
          id: validUuid,
          name: name || 'Gourmet AfroCuisto',
          avatar_url: avatarUrl || null,
          region: region || 'Afrique',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: false }
      );
    } catch (err) {
      console.warn('ensureProfile warning:', err);
    }
    return validUuid;
  },

  // 1. Récupération des publications (Posts)
  async fetchPosts(currentUserId?: string): Promise<CommunityPost[]> {
    if (!isSupabaseConfigured()) {
      return await StorageService.getItem<CommunityPost[]>('afrocuisto_posts', FALLBACK_POSTS);
    }

    try {
      const userUuid = currentUserId ? toValidUuid(currentUserId) : undefined;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_likes (
            user_id
          ),
          post_bookmarks (
            user_id
          ),
          post_comments (
            id,
            author_name,
            author_avatar,
            content,
            likes_count,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('Error fetching Supabase posts:', error);
        return await StorageService.getItem<CommunityPost[]>('afrocuisto_posts', FALLBACK_POSTS);
      }

      const formatted: CommunityPost[] = data.map((p: any) => {
        const isLiked = userUuid
          ? (p.post_likes || []).some((l: any) => l.user_id === userUuid)
          : false;
        const isBookmarked = userUuid
          ? (p.post_bookmarks || []).some((b: any) => b.user_id === userUuid)
          : false;

        const mappedComments: PostComment[] = (p.post_comments || []).map((c: any) => ({
          id: c.id,
          postId: p.id,
          authorName: c.author_name || 'Gourmet',
          authorAvatar: c.author_avatar || undefined,
          content: c.content,
          likesCount: c.likes_count || 0,
          createdAt: formatTimeAgo(c.created_at),
        }));

        return {
          id: p.id,
          authorName: p.author_name || 'Chef AfroCuisto',
          authorAvatar: p.author_avatar || null,
          authorRole: p.author_role || 'Gourmet Passionné',
          authorCountry: p.author_country || p.region || 'Afrique',
          content: p.content || '',
          imageUrl: p.image_url || null,
          recipeId: p.recipe_id || null,
          recipeName: p.recipe_name || null,
          recipeImage: p.recipe_image || null,
          region: p.region || null,
          type: p.type || 'general',
          tags: p.tags || [],
          likesCount: p.likes_count || 0,
          commentsCount: p.comments_count || mappedComments.length || 0,
          sharesCount: p.shares_count || 0,
          isLiked,
          isBookmarked,
          createdAt: formatTimeAgo(p.created_at),
          comments: mappedComments,
        };
      });

      await StorageService.setItem('afrocuisto_posts', formatted);
      return formatted;
    } catch (err) {
      console.warn('Posts fetch exception:', err);
      return await StorageService.getItem<CommunityPost[]>('afrocuisto_posts', FALLBACK_POSTS);
    }
  },

  // 2. Création d'une nouvelle publication
  async createPost(
    post: Omit<CommunityPost, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'>,
    authorId: string
  ): Promise<CommunityPost> {
    const authorUuid = await this.ensureProfile(
      authorId,
      post.authorName,
      post.authorAvatar,
      post.authorCountry
    );

    const tempId = `post_${Date.now()}`;
    const newPost: CommunityPost = {
      ...post,
      id: tempId,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isBookmarked: false,
      createdAt: 'À l’instant',
      comments: [],
    };

    if (!isSupabaseConfigured()) {
      const current = await StorageService.getItem<CommunityPost[]>('afrocuisto_posts', FALLBACK_POSTS);
      const updated = [newPost, ...current];
      await StorageService.setItem('afrocuisto_posts', updated);
      return newPost;
    }

    try {
      // 1. Tenter l'insertion complète avec colonnes enrichies
      const payload: any = {
        author_id: authorUuid,
        author_name: post.authorName || 'Gourmet AfroCuisto',
        author_avatar: post.authorAvatar || null,
        author_role: post.authorRole || 'Gourmet Passionné',
        author_country: post.authorCountry || 'Afrique',
        content: post.content || '',
        image_url: post.imageUrl || null,
        recipe_id: post.recipeId || null,
        recipe_name: post.recipeName || null,
        recipe_image: post.recipeImage || null,
        region: post.region || null,
        type: post.type || 'general',
        tags: post.tags || [],
      };

      let { data, error } = await supabase
        .from('posts')
        .insert(payload)
        .select('*')
        .single();

      // 2. Si une colonne manque dans une ancienne structure, réessayer avec colonnes minimales
      if (error) {
        console.warn('Full insert failed, retrying with core columns:', error.message);
        const corePayload: any = {
          author_id: authorUuid,
          content: post.content || '',
          image_url: post.imageUrl || null,
          recipe_id: post.recipeId || null,
          recipe_name: post.recipeName || null,
          recipe_image: post.recipeImage || null,
          region: post.region || null,
          type: post.type || 'general',
          tags: post.tags || [],
        };

        const retry = await supabase
          .from('posts')
          .insert(corePayload)
          .select('*')
          .single();

        data = retry.data;
        error = retry.error;
      }

      if (error || !data) {
        console.error('Error inserting post in Supabase:', error);
        const current = await StorageService.getItem<CommunityPost[]>('afrocuisto_posts', []);
        await StorageService.setItem('afrocuisto_posts', [newPost, ...current]);
        return newPost;
      }

      const created: CommunityPost = {
        id: data.id,
        authorName: data.author_name || post.authorName,
        authorAvatar: data.author_avatar || post.authorAvatar,
        authorRole: data.author_role || post.authorRole || 'Gourmet Passionné',
        authorCountry: data.author_country || post.authorCountry,
        content: data.content || '',
        imageUrl: data.image_url || null,
        recipeId: data.recipe_id || null,
        recipeName: data.recipe_name || null,
        recipeImage: data.recipe_image || null,
        region: data.region || null,
        type: data.type || 'general',
        tags: data.tags || [],
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isLiked: false,
        isBookmarked: false,
        createdAt: 'À l’instant',
        comments: [],
      };

      const current = await StorageService.getItem<CommunityPost[]>('afrocuisto_posts', []);
      await StorageService.setItem('afrocuisto_posts', [
        created,
        ...current.filter(p => p.id !== created.id),
      ]);

      return created;
    } catch (err) {
      console.error('Post creation exception:', err);
      return newPost;
    }
  },

  // 3. Like / Unlike d'une publication
  async toggleLikePost(postId: string, userId: string, currentlyLiked: boolean): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      const userUuid = await this.ensureProfile(userId);
      if (currentlyLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .match({ post_id: postId, user_id: userUuid });
      } else {
        await supabase.from('post_likes').insert({
          post_id: postId,
          user_id: userUuid,
        });
      }
    } catch (err) {
      console.warn('Toggle like error:', err);
    }
  },

  // 4. Bookmark / Unbookmark d'une publication
  async toggleBookmarkPost(postId: string, userId: string, currentlyBookmarked: boolean): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      const userUuid = await this.ensureProfile(userId);
      if (currentlyBookmarked) {
        await supabase
          .from('post_bookmarks')
          .delete()
          .match({ post_id: postId, user_id: userUuid });
      } else {
        await supabase.from('post_bookmarks').insert({
          post_id: postId,
          user_id: userUuid,
        });
      }
    } catch (err) {
      console.warn('Toggle bookmark error:', err);
    }
  },

  // 5. Récupération des commentaires d'une publication
  async fetchComments(postId: string): Promise<PostComment[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((c: any) => ({
        id: c.id,
        postId: c.post_id,
        authorName: c.author_name || 'Gourmet',
        authorAvatar: c.author_avatar || undefined,
        content: c.content,
        likesCount: c.likes_count || 0,
        createdAt: formatTimeAgo(c.created_at),
      }));
    } catch (err) {
      console.warn('Fetch comments error:', err);
      return [];
    }
  },

  // 6. Ajout d'un commentaire
  async addComment(
    postId: string,
    authorId: string,
    content: string,
    authorName?: string,
    authorAvatar?: string | null
  ): Promise<PostComment | null> {
    const authorUuid = await this.ensureProfile(authorId, authorName, authorAvatar);

    if (!isSupabaseConfigured()) {
      return {
        id: `c_${Date.now()}`,
        postId,
        authorName: authorName || 'Vous',
        authorAvatar: authorAvatar || undefined,
        content,
        createdAt: 'À l’instant',
      };
    }

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          author_id: authorUuid,
          author_name: authorName || 'Vous',
          author_avatar: authorAvatar || null,
          content: content.trim(),
        })
        .select('*')
        .single();

      if (error || !data) {
        console.warn('Add comment insert error:', error);
        return {
          id: `c_${Date.now()}`,
          postId,
          authorName: authorName || 'Vous',
          authorAvatar: authorAvatar || undefined,
          content,
          createdAt: 'À l’instant',
        };
      }

      return {
        id: data.id,
        postId: data.post_id,
        authorName: data.author_name || authorName || 'Vous',
        authorAvatar: data.author_avatar || authorAvatar || undefined,
        content: data.content,
        likesCount: 0,
        createdAt: 'À l’instant',
      };
    } catch (err) {
      console.warn('Add comment error:', err);
      return null;
    }
  },

  // 7. Récupération des Stories actives (< 7 jours)
  async fetchStories(currentUserId?: string): Promise<CommunityStory[]> {
    if (!isSupabaseConfigured()) {
      return await StorageService.getItem<CommunityStory[]>('afrocuisto_stories', FALLBACK_STORIES);
    }

    try {
      const userUuid = currentUserId ? toValidUuid(currentUserId) : undefined;

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          story_views (
            user_id
          ),
          story_likes (
            user_id
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('Error fetching Supabase stories:', error);
        return await StorageService.getItem<CommunityStory[]>('afrocuisto_stories', FALLBACK_STORIES);
      }

      const formatted: CommunityStory[] = data.map((s: any) => {
        const isViewed = userUuid
          ? (s.story_views || []).some((v: any) => v.user_id === userUuid)
          : false;
        const isLiked = userUuid
          ? (s.story_likes || []).some((l: any) => l.user_id === userUuid)
          : false;

        return {
          id: s.id,
          authorName: s.author_name || 'Chef Gourmet',
          authorAvatar: s.author_avatar || null,
          title: s.title,
          caption: s.caption,
          imageUrl: s.image_url,
          videoBadge: s.video_badge,
          recipeName: s.recipe_name,
          recipeId: s.recipe_id,
          isLive: s.is_live,
          duration: s.duration || 6,
          viewsCount: s.views_count || 0,
          likesCount: s.likes_count || 0,
          isViewed,
          isLiked,
          placedStickers: s.placed_stickers || [],
          placedText: s.placed_text || null,
        };
      });

      await StorageService.setItem('afrocuisto_stories', formatted);
      return formatted;
    } catch (err) {
      console.warn('Stories fetch exception:', err);
      return await StorageService.getItem<CommunityStory[]>('afrocuisto_stories', FALLBACK_STORIES);
    }
  },

  // 8. Création d'une nouvelle Story
  async createStory(story: CommunityStory, authorId: string): Promise<CommunityStory> {
    const authorUuid = await this.ensureProfile(authorId, story.authorName, story.authorAvatar);

    if (!isSupabaseConfigured()) {
      const current = await StorageService.getItem<CommunityStory[]>('afrocuisto_stories', FALLBACK_STORIES);
      const updated = [story, ...current];
      await StorageService.setItem('afrocuisto_stories', updated);
      return story;
    }

    try {
      const payload: any = {
        author_id: authorUuid,
        author_name: story.authorName || 'Gourmet AfroCuisto',
        author_avatar: story.authorAvatar || null,
        title: story.title,
        caption: story.caption || null,
        image_url: story.imageUrl,
        video_badge: story.videoBadge || false,
        recipe_name: story.recipeName || null,
        recipe_id: story.recipeId || null,
        is_live: story.isLive || false,
        duration: story.duration || 6,
        placed_stickers: story.placedStickers || [],
        placed_text: story.placedText || null,
      };

      let { data, error } = await supabase
        .from('stories')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.warn('Full story insert failed, retrying core columns:', error.message);
        const corePayload: any = {
          author_id: authorUuid,
          title: story.title,
          caption: story.caption || null,
          image_url: story.imageUrl,
          video_badge: story.videoBadge || false,
          recipe_name: story.recipeName || null,
          recipe_id: story.recipeId || null,
          is_live: story.isLive || false,
          duration: story.duration || 6,
        };
        const retry = await supabase.from('stories').insert(corePayload).select('*').single();
        data = retry.data;
        error = retry.error;
      }

      if (error || !data) {
        console.warn('Error inserting story in Supabase:', error);
        return story;
      }

      const created: CommunityStory = {
        id: data.id,
        authorName: data.author_name || story.authorName,
        authorAvatar: data.author_avatar || story.authorAvatar,
        title: data.title,
        caption: data.caption,
        imageUrl: data.image_url,
        videoBadge: data.video_badge,
        recipeName: data.recipe_name,
        recipeId: data.recipe_id,
        isLive: data.is_live,
        duration: data.duration,
        viewsCount: 1,
        likesCount: 0,
        isViewed: false,
        isLiked: false,
        placedStickers: data.placed_stickers || [],
        placedText: data.placed_text || null,
      };

      const current = await StorageService.getItem<CommunityStory[]>('afrocuisto_stories', []);
      await StorageService.setItem('afrocuisto_stories', [
        created,
        ...current.filter(s => s.id !== created.id),
      ]);

      return created;
    } catch (err) {
      console.warn('Story creation exception:', err);
      return story;
    }
  },

  // 9. Suppression d'une Story
  async deleteStory(storyId: string, authorId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const current = await StorageService.getItem<CommunityStory[]>('afrocuisto_stories', FALLBACK_STORIES);
      const updated = current.filter(s => s.id !== storyId);
      await StorageService.setItem('afrocuisto_stories', updated);
      return;
    }

    try {
      const authorUuid = toValidUuid(authorId);
      await supabase.from('stories').delete().match({ id: storyId, author_id: authorUuid });
    } catch (err) {
      console.warn('Delete story error:', err);
    }
  },

  // 10. Enregistrement d'une vue de Story
  async recordStoryView(storyId: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      const userUuid = await this.ensureProfile(userId);
      await supabase.from('story_views').upsert(
        { story_id: storyId, user_id: userUuid },
        { onConflict: 'story_id,user_id', ignoreDuplicates: true }
      );
    } catch (err) {
      console.warn('Story view recording error:', err);
    }
  },

  // 11. Like / Unlike d'une Story
  async toggleLikeStory(storyId: string, userId: string, currentlyLiked: boolean): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      const userUuid = await this.ensureProfile(userId);
      if (currentlyLiked) {
        await supabase
          .from('story_likes')
          .delete()
          .match({ story_id: storyId, user_id: userUuid });
      } else {
        await supabase.from('story_likes').insert({
          story_id: storyId,
          user_id: userUuid,
        });
      }
    } catch (err) {
      console.warn('Story like error:', err);
    }
  },

  // 12. Récupération des spectateurs et likers d'une story
  async fetchStoryViewers(
    storyId: string
  ): Promise<{ id: string; name: string; avatarLetter: string; viewedAt: string; hasLiked: boolean }[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('story_views')
        .select(`
          created_at,
          profiles:user_id (
            id,
            name
          )
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return [];
      }

      const { data: likesData } = await supabase
        .from('story_likes')
        .select('user_id')
        .eq('story_id', storyId);

      const likerIds = new Set((likesData || []).map((l: any) => l.user_id));

      return data.map((v: any) => {
        const userObj = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
        const name = userObj?.name || 'Gourmet AfroCuisto';
        return {
          id: userObj?.id || Math.random().toString(),
          name,
          avatarLetter: name.charAt(0).toUpperCase(),
          viewedAt: formatTimeAgo(v.created_at),
          hasLiked: likerIds.has(v.user_id),
        };
      });
    } catch (err) {
      console.warn('Fetch story viewers error:', err);
      return [];
    }
  },

  // 13. Récupération du Défi actif
  async fetchActiveChallenge(currentUserId?: string): Promise<CommunityChallenge> {
    if (!isSupabaseConfigured()) {
      return FALLBACK_CHALLENGE;
    }

    try {
      const userUuid = currentUserId ? toValidUuid(currentUserId) : undefined;

      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error || !data) return FALLBACK_CHALLENGE;

      let isParticipating = false;
      if (userUuid) {
        const { data: partData } = await supabase
          .from('challenge_participants')
          .select('id')
          .match({ challenge_id: data.id, user_id: userUuid })
          .maybeSingle();
        isParticipating = !!partData;
      }

      return {
        id: data.id,
        title: data.title,
        subtitle: data.subtitle,
        badge: data.badge,
        deadline: data.deadline,
        participantsCount: data.participants_count || 0,
        totalVotes: data.total_votes || 0,
        prizeText: data.prize_text,
        bannerImage: data.banner_image,
        isParticipating,
      };
    } catch (err) {
      console.warn('Fetch challenge error:', err);
      return FALLBACK_CHALLENGE;
    }
  },

  // 14. Participation à un défi
  async toggleChallengeParticipation(
    challengeId: string,
    userId: string,
    currentlyParticipating: boolean
  ): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      const userUuid = await this.ensureProfile(userId);
      if (currentlyParticipating) {
        await supabase
          .from('challenge_participants')
          .delete()
          .match({ challenge_id: challengeId, user_id: userUuid });
      } else {
        await supabase.from('challenge_participants').insert({
          challenge_id: challengeId,
          user_id: userUuid,
        });
      }
    } catch (err) {
      console.warn('Challenge participation error:', err);
    }
  },

  // 15. Abonnement WebSockets en temps réel
  subscribeToCommunityRealtime(callbacks: {
    onPostChange?: (payload: any) => void;
    onStoryChange?: (payload: any) => void;
    onCommentChange?: (payload: any) => void;
  }) {
    if (!isSupabaseConfigured()) {
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel('afrocuisto_community_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        payload => callbacks.onPostChange?.(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stories' },
        payload => callbacks.onStoryChange?.(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments' },
        payload => callbacks.onCommentChange?.(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        payload => callbacks.onPostChange?.(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'story_likes' },
        payload => callbacks.onStoryChange?.(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'story_views' },
        payload => callbacks.onStoryChange?.(payload)
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};

function formatTimeAgo(isoString?: string): string {
  if (!isoString) return 'À l’instant';
  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now.getTime() - past.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'À l’instant';
  if (diffMinutes < 60) return `Il y a ${diffMinutes}m`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  return `Il y a ${diffDays}j`;
}
