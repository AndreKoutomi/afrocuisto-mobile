import { Recipe } from '../types/recipe';
import localRecipesData from '../../assets/data/recipes_data.json';

export const RecipeService = {
  getRecipes(): Recipe[] {
    try {
      const data = localRecipesData as any[];
      return data.map((r: any) => ({
        id: r.id || String(Math.random()),
        name: r.name || 'Plat Africain',
        alias: r.alias || null,
        region: r.region || 'Bénin',
        category: r.category || 'Plats Traditionnels',
        difficulty: r.difficulty || 'Facile',
        prepTime: r.prepTime || '25 min',
        cookTime: r.cookTime || '35 min',
        image: r.image || 'images/amiwo_poulet_1772192535717.png',
        ingredients: Array.isArray(r.ingredients)
          ? r.ingredients.map((ing: any) => ({
              name: typeof ing === 'string' ? ing : (ing.name || ing.item || 'Ingrédient'),
              quantity: ing.quantity || ing.amount || null,
              unit: ing.unit || null,
              note: ing.note || null,
            }))
          : [],
        techniqueTitle: r.techniqueTitle || null,
        techniqueDescription: r.techniqueDescription || null,
        description: r.description || null,
        steps: Array.isArray(r.steps) ? r.steps : [],
        diasporaSubstitutes: r.diasporaSubstitutes || null,
        suggestedSides: r.suggestedSides || null,
        benefits: r.benefits || null,
        pedagogicalNote: r.pedagogicalNote || null,
        type: r.type || null,
        base: r.base || null,
        isFeatured: Boolean(r.isFeatured || r.id === 'P02' || r.id === 'P06' || r.id === 'S01'),
        style: r.style || null,
        origineHumaine: r.origineHumaine || null,
        videoUrl: r.videoUrl || null,
        rating: 4.8,
      }));
    } catch (e) {
      console.error('Failed to load local recipes:', e);
      return [];
    }
  }
};
