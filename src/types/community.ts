export interface PostComment {
  id: string;
  postId: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  imageUrl?: string | null;
  recipeId?: string | null;
  recipeName?: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
}
