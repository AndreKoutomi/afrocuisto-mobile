import { Ingredient } from './ingredient';

export interface Recipe {
  id: string;
  name: string;
  alias?: string | null;
  region: string;
  category: string;
  difficulty: string;
  prepTime: string;
  cookTime: string;
  image: string;
  ingredients: Ingredient[];
  techniqueTitle?: string | null;
  techniqueDescription?: string | null;
  description?: string | null;
  steps: string[];
  diasporaSubstitutes?: string | null;
  suggestedSides?: string[] | null;
  benefits?: string | null;
  pedagogicalNote?: string | null;
  type?: string | null;
  base?: string | null;
  isFeatured?: boolean;
  style?: string | null;
  origineHumaine?: string | null;
  videoUrl?: string | null;
  rating?: number;
}
