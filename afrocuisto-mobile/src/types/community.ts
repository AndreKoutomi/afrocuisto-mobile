export interface PostComment {
  id: string;
  postId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorRole?: string | null;
  content: string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
}

export type PostType = 'realization' | 'tip' | 'question' | 'challenge' | 'general';

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar?: string | null;
  authorRole?: 'Chef Étoilé' | 'Terroir Master' | 'Gourmet Passionné' | 'Grand-Mère Cordon Bleu' | 'Cuisinier Amateur' | string;
  authorCountry?: string; // e.g. "🇧🇯 Bénin", "🇨🇮 Côte d'Ivoire", "🇸🇳 Sénégal"
  content: string;
  imageUrl?: string | null;
  recipeId?: string | null;
  recipeName?: string | null;
  recipeImage?: string | null;
  region?: string | null;
  type?: PostType;
  tags?: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
  comments?: PostComment[];
}

export interface PlacedStorySticker {
  id: string;
  content: string;
  isEmoji?: boolean;
  x: number; // Position X en pourcentage (0 à 100)
  y: number; // Position Y en pourcentage (0 à 100)
  scale?: number;
}

export interface PlacedStoryText {
  id: string;
  text: string;
  textColor: string;
  textBg: boolean;
  fontIndex: number;
  x: number; // Position X en pourcentage (0 à 100)
  y: number; // Position Y en pourcentage (0 à 100)
  scale?: number;
}

export interface CommunityStory {
  id: string;
  authorName: string;
  authorAvatar?: string | null;
  title: string;
  caption?: string;
  imageUrl: string;
  videoBadge?: boolean;
  recipeName?: string;
  recipeId?: string;
  isLive?: boolean;
  isViewed?: boolean;
  duration?: number; // en secondes
  viewsCount?: number;
  likesCount?: number;
  isLiked?: boolean;
  placedStickers?: PlacedStorySticker[];
  placedText?: PlacedStoryText | null;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  deadline: string;
  participantsCount: number;
  totalVotes: number;
  prizeText: string;
  bannerImage: string;
  isParticipating?: boolean;
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  postsCount: number;
  emoji: string;
  gradientLight: [string, string];
  gradientDark: [string, string];
  borderLight: string;
  borderDark: string;
  isJoined?: boolean;
}

export interface CommunityStats {
  totalMembers: number;
  totalPosts: number;
  totalRecipes: number;
  onlineNow: number;
}
