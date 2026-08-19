export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  favoriteRecipeIds: string[];
  bio?: string;
  region?: string;
  dietaryPreference?: string;
}
