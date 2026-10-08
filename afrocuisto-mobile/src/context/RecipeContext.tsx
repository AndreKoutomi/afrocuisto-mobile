import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Recipe } from '../types/recipe';
import { RecipeService } from '../services/recipeService';
import { StorageService } from '../services/storage';
import { getRecipeDurationInfo } from '../utils/durationHelper';

interface RecipeContextType {
  recipes: Recipe[];
  featuredRecipes: Recipe[];
  popularRecipes: Recipe[];
  quickRecipes: Recipe[];
  favorites: string[];
  isLoading: boolean;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isFavorite: (recipeId: string) => boolean;
  refreshRecipes: () => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    const loadedRecipes = RecipeService.getRecipes();
    const storedFavs = await StorageService.getItem<string[]>('afrocuisto_favorites', []);
    setRecipes(loadedRecipes);
    setFavorites(storedFavs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleFavorite = async (recipeId: string) => {
    let nextFavs: string[];
    if (favorites.includes(recipeId)) {
      nextFavs = favorites.filter(id => id !== recipeId);
    } else {
      nextFavs = [...favorites, recipeId];
    }
    setFavorites(nextFavs);
    await StorageService.setItem('afrocuisto_favorites', nextFavs);
  };

  const isFavorite = (recipeId: string) => favorites.includes(recipeId);

  // 1. Plats en vedette (Carrousel / Nouveautés & Coups de cœur)
  const featuredRecipes = useMemo(() => {
    const list = recipes.filter(r => r.isFeatured);
    return list.length > 0 ? list : recipes.slice(0, 4);
  }, [recipes]);

  // 2. Plats populaires (Incontournables) - Exclusion stricte des plats du carrousel pour éviter les répétitions
  const popularRecipes = useMemo(() => {
    const featuredIds = new Set(featuredRecipes.map(r => r.id));
    return recipes.filter(r => !featuredIds.has(r.id)).slice(0, 8);
  }, [recipes, featuredRecipes]);

  // 3. Plats rapides & express (Temps total <= 30 min)
  const quickRecipes = useMemo(() => {
    return recipes.filter(r => {
      const { totalMinutes } = getRecipeDurationInfo(r.prepTime, r.cookTime);
      return totalMinutes > 0 && totalMinutes <= 30;
    });
  }, [recipes]);

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        featuredRecipes,
        popularRecipes,
        quickRecipes,
        favorites,
        isLoading,
        toggleFavorite,
        isFavorite,
        refreshRecipes: loadData,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};
