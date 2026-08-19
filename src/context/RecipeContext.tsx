import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe } from '../types/recipe';
import { RecipeService } from '../services/recipeService';
import { StorageService } from '../services/storage';

interface RecipeContextType {
  recipes: Recipe[];
  featuredRecipes: Recipe[];
  popularRecipes: Recipe[];
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

  const featuredRecipes = recipes.filter(r => r.isFeatured);
  const popularRecipes = recipes.slice(0, 8);

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        featuredRecipes: featuredRecipes.length > 0 ? featuredRecipes : recipes.slice(0, 5),
        popularRecipes,
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
