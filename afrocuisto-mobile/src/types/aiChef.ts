export interface AiChefIngredient {
  name: string;
  amount?: string;
}

export interface AiChefRecipeResult {
  id: string;
  dishName: string;
  region: string;
  category?: string;
  totalTime: string;
  prepTime?: string;
  cookTime?: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  servings?: string;
  usedIngredients: AiChefIngredient[];
  missingIngredients: AiChefIngredient[];
  steps: string[];
  suggestedSides: string[];
  chefTip?: string;
}

export interface AiChefMessage {
  id: string;
  sender: 'ai' | 'user';
  text?: string;
  recipe?: AiChefRecipeResult;
  isGuardrail?: boolean;
  timestamp?: number;
}
