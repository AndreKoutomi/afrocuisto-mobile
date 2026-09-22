import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CommunityPost,
  CommunityStory,
  PostComment,
  CommunityChallenge,
} from '../types/community';
import {
  CommunityService,
  FALLBACK_POSTS,
  FALLBACK_STORIES,
  FALLBACK_CHALLENGE,
} from '../services/communityService';
import { useAuth } from './AuthContext';

interface CommunityContextType {
  posts: CommunityPost[];
  stories: CommunityStory[];
  challenge: CommunityChallenge | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refreshCommunity: () => Promise<void>;
  createPost: (
    post: Omit<CommunityPost, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'>
  ) => Promise<CommunityPost>;
  toggleLikePost: (postId: string) => Promise<void>;
  toggleBookmarkPost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<PostComment | null>;
  fetchComments: (postId: string) => Promise<PostComment[]>;
  createStory: (story: CommunityStory) => Promise<CommunityStory>;
  deleteStory: (storyId: string) => Promise<void>;
  recordStoryView: (storyId: string) => Promise<void>;
  toggleLikeStory: (storyId: string) => Promise<void>;
  fetchStoryViewers: (
    storyId: string
  ) => Promise<{ id: string; name: string; avatarLetter: string; viewedAt: string; hasLiked: boolean }[]>;
  toggleChallengeParticipation: (challengeId: string) => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>(FALLBACK_POSTS);
  const [stories, setStories] = useState<CommunityStory[]>(FALLBACK_STORIES);
  const [challenge, setChallenge] = useState<CommunityChallenge | null>(FALLBACK_CHALLENGE);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Chargement initial et synchronisation des données
  const loadCommunityData = useCallback(async () => {
    try {
      const [fetchedPosts, fetchedStories, fetchedChallenge] = await Promise.all([
        CommunityService.fetchPosts(user?.id),
        CommunityService.fetchStories(user?.id),
        CommunityService.fetchActiveChallenge(user?.id),
      ]);

      if (fetchedPosts) {
        setPosts(prev => {
          // Conserver les posts temporaires créés récemment (< 30s) qui n'ont pas encore été indexés
          const pendingTemporary = prev.filter(
            p => p.id.startsWith('post_') && !fetchedPosts.some(fp => fp.content === p.content)
          );
          return [...pendingTemporary, ...fetchedPosts];
        });
      }

      if (fetchedStories) {
        setStories(prev => {
          const pendingTemporary = prev.filter(
            s => s.id.startsWith('story_') && !fetchedStories.some(fs => fs.title === s.title)
          );
          return [...pendingTemporary, ...fetchedStories];
        });
      }

      if (fetchedChallenge) setChallenge(fetchedChallenge);
    } catch (err) {
      console.warn('Load community error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCommunityData();

    // Heartbeat de synchronisation automatique toutes les 6 secondes (style Facebook)
    const interval = setInterval(() => {
      loadCommunityData();
    }, 6000);

    return () => clearInterval(interval);
  }, [loadCommunityData]);

  // Écouteur en temps réel (Supabase Realtime WebSockets)
  useEffect(() => {
    const subscription = CommunityService.subscribeToCommunityRealtime({
      onPostChange: async payload => {
        const freshPosts = await CommunityService.fetchPosts(user?.id);
        if (freshPosts) {
          setPosts(prev => {
            const pendingTemporary = prev.filter(
              p => p.id.startsWith('post_') && !freshPosts.some(fp => fp.content === p.content)
            );
            return [...pendingTemporary, ...freshPosts];
          });
        }
      },
      onStoryChange: async payload => {
        const freshStories = await CommunityService.fetchStories(user?.id);
        if (freshStories) {
          setStories(prev => {
            const pendingTemporary = prev.filter(
              s => s.id.startsWith('story_') && !freshStories.some(fs => fs.title === s.title)
            );
            return [...pendingTemporary, ...freshStories];
          });
        }
      },
      onCommentChange: async payload => {
        const freshPosts = await CommunityService.fetchPosts(user?.id);
        if (freshPosts) setPosts(freshPosts);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Pull-to-refresh
  const refreshCommunity = async () => {
    setIsRefreshing(true);
    try {
      await loadCommunityData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Création d'un post (Optimiste + Réseau)
  const createPost = async (
    postData: Omit<CommunityPost, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'>
  ): Promise<CommunityPost> => {
    const authorId = user?.id || '00000000-0000-0000-0000-000000000001';
    const postWithAuthor = {
      ...postData,
      authorName: user?.name || postData.authorName || 'Gourmet AfroCuisto',
      authorAvatar: user?.avatarUrl || postData.authorAvatar || null,
      authorCountry: user?.region || postData.authorCountry || 'Afrique',
    };

    // 1. Ajout optimiste immédiat dans la liste visible
    const optimisticPost: CommunityPost = {
      ...postWithAuthor,
      id: `post_${Date.now()}`,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isBookmarked: false,
      createdAt: 'À l’instant',
      comments: [],
    };
    setPosts(prev => [optimisticPost, ...prev]);

    // 2. Sauvegarde persistante vers Supabase
    const savedPost = await CommunityService.createPost(postWithAuthor, authorId);
    setPosts(prev => [savedPost, ...prev.filter(p => p.id !== optimisticPost.id && p.id !== savedPost.id)]);

    return savedPost;
  };

  // Like optimiste de Post
  const toggleLikePost = async (postId: string) => {
    const target = posts.find(p => p.id === postId);
    if (!target) return;
    const currentlyLiked = !!target.isLiked;

    // Mise à jour optimiste instantanée de l'UI
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              isLiked: !currentlyLiked,
              likesCount: currentlyLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
            }
          : p
      )
    );

    const activeUserId = user?.id || '00000000-0000-0000-0000-000000000001';
    await CommunityService.toggleLikePost(postId, activeUserId, currentlyLiked);
  };

  // Favori optimiste de Post
  const toggleBookmarkPost = async (postId: string) => {
    const target = posts.find(p => p.id === postId);
    if (!target) return;
    const currentlyBookmarked = !!target.isBookmarked;

    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, isBookmarked: !currentlyBookmarked } : p
      )
    );

    const activeUserId = user?.id || '00000000-0000-0000-0000-000000000001';
    await CommunityService.toggleBookmarkPost(postId, activeUserId, currentlyBookmarked);
  };

  // Ajout de commentaire optimiste
  const addComment = async (postId: string, content: string): Promise<PostComment | null> => {
    const authorId = user?.id || '00000000-0000-0000-0000-000000000001';
    const authorName = user?.name || 'Gourmet AfroCuisto';
    const authorAvatar = user?.avatarUrl || null;

    const newComment = await CommunityService.addComment(
      postId,
      authorId,
      content,
      authorName,
      authorAvatar
    );

    if (newComment) {
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                commentsCount: p.commentsCount + 1,
                comments: [newComment, ...(p.comments || []).filter(c => c.id !== newComment.id)],
              }
            : p
        )
      );
    }

    return newComment;
  };

  // Récupération des commentaires
  const fetchComments = async (postId: string): Promise<PostComment[]> => {
    return await CommunityService.fetchComments(postId);
  };

  // Création de story optimiste
  const createStory = async (story: CommunityStory): Promise<CommunityStory> => {
    const authorId = user?.id || '00000000-0000-0000-0000-000000000001';
    const published = await CommunityService.createStory(story, authorId);
    setStories(prev => [published, ...prev.filter(s => s.id !== published.id)]);
    return published;
  };

  // Suppression de story optimiste
  const deleteStory = async (storyId: string) => {
    setStories(prev => prev.filter(s => s.id !== storyId));
    const activeUserId = user?.id || '00000000-0000-0000-0000-000000000001';
    await CommunityService.deleteStory(storyId, activeUserId);
  };

  // Enregistrement de vue de story
  const recordStoryView = async (storyId: string) => {
    setStories(prev =>
      prev.map(s =>
        s.id === storyId
          ? {
              ...s,
              isViewed: true,
              viewsCount: (s.viewsCount || 0) + (s.isViewed ? 0 : 1),
            }
          : s
      )
    );

    const activeUserId = user?.id || '00000000-0000-0000-0000-000000000001';
    await CommunityService.recordStoryView(storyId, activeUserId);
  };

  // Like de story optimiste
  const toggleLikeStory = async (storyId: string) => {
    const target = stories.find(s => s.id === storyId);
    if (!target) return;
    const currentlyLiked = !!target.isLiked;

    setStories(prev =>
      prev.map(s =>
        s.id === storyId
          ? {
              ...s,
              isLiked: !currentlyLiked,
              likesCount: currentlyLiked ? Math.max(0, (s.likesCount || 0) - 1) : (s.likesCount || 0) + 1,
            }
          : s
      )
    );

    const activeUserId = user?.id || '00000000-0000-0000-0000-000000000001';
    await CommunityService.toggleLikeStory(storyId, activeUserId, currentlyLiked);
  };

  // Récupération des spectateurs d'une story
  const fetchStoryViewers = async (storyId: string) => {
    return await CommunityService.fetchStoryViewers(storyId);
  };

  // Participation optimiste au défi
  const toggleChallengeParticipation = async (challengeId: string) => {
    if (!challenge) return;
    const currentlyParticipating = !!challenge.isParticipating;

    setChallenge(prev =>
      prev
        ? {
            ...prev,
            isParticipating: !currentlyParticipating,
            participantsCount: currentlyParticipating
              ? Math.max(0, prev.participantsCount - 1)
              : prev.participantsCount + 1,
          }
        : null
    );

    const activeUserId = user?.id || '00000000-0000-0000-0000-000000000001';
    await CommunityService.toggleChallengeParticipation(
      challengeId,
      activeUserId,
      currentlyParticipating
    );
  };

  return (
    <CommunityContext.Provider
      value={{
        posts,
        stories,
        challenge,
        isLoading,
        isRefreshing,
        refreshCommunity,
        createPost,
        toggleLikePost,
        toggleBookmarkPost,
        addComment,
        fetchComments,
        createStory,
        deleteStory,
        recordStoryView,
        toggleLikeStory,
        fetchStoryViewers,
        toggleChallengeParticipation,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};

