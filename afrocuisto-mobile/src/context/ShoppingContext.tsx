import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShoppingItem } from '../types/shopping';
import { Recipe } from '../types/recipe';
import { Ingredient } from '../types/ingredient';
import { StorageService } from '../services/storage';

interface ShoppingContextType {
  items: ShoppingItem[];
  addIngredients: (recipe: Recipe, selectedIngredients?: Ingredient[]) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  totalCount: number;
}

const ShoppingContext = createContext<ShoppingContextType | undefined>(undefined);

export const ShoppingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    (async () => {
      const stored = await StorageService.getItem<ShoppingItem[]>('afrocuisto_shopping_list', []);
      setItems(stored);
    })();
  }, []);

  const saveItems = async (newItems: ShoppingItem[]) => {
    setItems(newItems);
    await StorageService.setItem('afrocuisto_shopping_list', newItems);
  };

  const addIngredients = async (recipe: Recipe, selectedIngredients?: Ingredient[]) => {
    const listToUse =
      selectedIngredients && selectedIngredients.length > 0
        ? selectedIngredients
        : recipe.ingredients;

    if (!listToUse || listToUse.length === 0) return;

    const newEntries: ShoppingItem[] = listToUse.map(ing => ({
      id: `${recipe.id}_${ing.name}_${Math.random().toString(36).substring(2, 7)}`,
      name: ing.name,
      quantity: ing.quantity || null,
      unit: ing.unit || null,
      recipeName: recipe.name,
      isChecked: false,
    }));
    await saveItems([...items, ...newEntries]);
  };

  const toggleItem = async (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    );
    await saveItems(updated);
  };

  const removeItem = async (id: string) => {
    const updated = items.filter(item => item.id !== id);
    await saveItems(updated);
  };

  const clearCompleted = async () => {
    const updated = items.filter(item => !item.isChecked);
    await saveItems(updated);
  };

  return (
    <ShoppingContext.Provider
      value={{
        items,
        addIngredients,
        toggleItem,
        removeItem,
        clearCompleted,
        totalCount: items.length,
      }}
    >
      {children}
    </ShoppingContext.Provider>
  );
};

export const useShopping = () => {
  const context = useContext(ShoppingContext);
  if (!context) {
    throw new Error('useShopping must be used within a ShoppingProvider');
  }
  return context;
};
