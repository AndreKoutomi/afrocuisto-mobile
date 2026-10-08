import { Recipe } from '../types/recipe';
import localRecipesData from '../../assets/data/recipes_data.json';

// Notes réalistes et diversifiées par recette
const RECIPE_RATINGS: Record<string, number> = {
  P01: 4.7, // Wô (Pâte blanche)
  P02: 4.9, // Amiwô (Pâte rouge)
  P03: 4.8, // Agoun (Igname pilée)
  P04: 4.6, // Télibô Wô
  P05: 4.5, // Akassa
  P06: 4.9, // Ablo
  P07: 4.6, // Piron
  P11: 4.8, // Atassi
  P13: 4.7, // Kom
  P14: 4.8, // Couscous
  P15: 4.7, // Spaghetti Africain
  S01: 4.9, // Gboman
  S02: 4.6, // Adémè
  S03: 4.9, // Févi (Sauce Gombo)
  S05: 4.8, // Dékoun (Sauce graine)
  S06: 4.7, // Azin Nùsúnnú
  S12: 4.8, // Man-Tindjan
  S17: 4.7, // Goussi
  S08: 4.6, // Tchiayo
  R01: 4.8, // Dakouin
  R02: 4.7, // Toubani
  R03: 4.6, // Adôwè
  R04: 4.5, // Abobo
  V03: 4.9, // Tchatchanga
  V10: 4.8, // Vatido
  A03: 4.9, // Talé-Talé
  A06: 4.7, // Amon Soja
  A01: 4.8, // Yovo-Doko
  A02: 4.7, // Ata
  B06: 4.8, // Akpan
  B01: 4.6, // Adoyo
  B03: 4.7, // Tchoukoutou
  B07: 4.9, // Dèguè
  P09: 4.8, // Wassa-Wassa
  J01: 4.9, // Jus de Bissap
  J02: 4.8, // Jus de Baobab
  J03: 4.9, // Jus d'Ananas
  J04: 4.7, // Jus de Tamarin
  J05: 4.8, // Jus de Mangue
  J06: 4.8, // Jus de Corossol
  J07: 4.9, // Jus de Passion
  J08: 4.8, // Jus de Gingembre
};

// Plats phares réservés au carrousel "Nouveautés & Sélections du Chef"
// (Dékoun, Dakouin, Atassi, Tchatchanga)
const FEATURED_RECIPE_IDS = ['S05', 'R01', 'P11', 'V03'];

export const RecipeService = {
  getRecipes(): Recipe[] {
    try {
      const data = localRecipesData as any[];
      return data.map((r: any, index: number) => {
        const id = r.id || `RECIPE_${index}`;
        // Note personnalisée ou calculée de manière déterministe entre 4.5 et 4.9
        const computedRating =
          RECIPE_RATINGS[id] ?? (4.5 + (index % 5) * 0.1);

        return {
          id,
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
          isFeatured: Boolean(r.isFeatured || FEATURED_RECIPE_IDS.includes(id)),
          style: r.style || null,
          origineHumaine: r.origineHumaine || null,
          videoUrl: r.videoUrl || null,
          rating: Math.round(computedRating * 10) / 10,
        };
      });
    } catch (e) {
      console.error('Failed to load local recipes:', e);
      return [];
    }
  },
};
