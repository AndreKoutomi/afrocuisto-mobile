import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
  Layout,
} from 'react-native-reanimated';
import {
  Sparkles,
  Utensils,
  Globe,
  Video,
  Flame,
  Zap,
  ChevronRight,
  CookingPot,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRecipes } from '../../context/RecipeContext';
import { AppColors } from '../../theme/colors';
import { Recipe } from '../../types/recipe';

function useDebounce<T>(value: T, delay: number = 80): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface SearchActionItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  badge?: string;
  tag?: string;
  type: 'recipe' | 'ai' | 'category' | 'region' | 'video';
  data?: any;
}

interface SearchSuggestionsDropdownProps {
  searchQuery: string;
  onSelectRecipe: (recipe: Recipe) => void;
  onSelectAiSearch: (query: string) => void;
  onSelectCategory?: (category: string) => void;
  onSelectSuggestionText?: (text: string) => void;
}

export const SearchSuggestionsDropdown: React.FC<SearchSuggestionsDropdownProps> = ({
  searchQuery,
  onSelectRecipe,
  onSelectAiSearch,
  onSelectCategory,
  onSelectSuggestionText,
}) => {
  const { isDark } = useTheme();
  const { recipes } = useRecipes();
  const debouncedQuery = useDebounce(searchQuery, 150);

  // Suggestions par défaut
  const defaultActions: SearchActionItem[] = useMemo(
    () => [
      {
        id: 'ai_fridge',
        label: 'Composer avec le Frigo Magique',
        description: 'Dites vos ingrédients au Chef IA',
        icon: <Sparkles size={16} color={AppColors.primary} />,
        badge: 'IA',
        tag: 'Assistant',
        type: 'ai',
      },
      {
        id: 'quick_express',
        label: 'Plats Express (< 30 min)',
        description: 'Idéal pour cuisiner rapidement',
        icon: <Zap size={16} color="#EAB308" />,
        badge: 'Rapide',
        tag: 'Filtre',
        type: 'category',
        data: 'express',
      },
      {
        id: 'popular_amiwo',
        label: 'Amiwô au Poulet Doré',
        description: 'Pâtes rouges du terroir béninois',
        icon: <Utensils size={16} color="#EA580C" />,
        badge: 'Sud-Bénin',
        tag: 'Populaire',
        type: 'recipe',
        data: recipes.find(r => r.name.toLowerCase().includes('amiw')) || recipes[0],
      },
      {
        id: 'popular_alloco',
        label: 'Alloco & Sauce Dja',
        description: 'Bananes plantains frites crousti-moelleuses',
        icon: <Flame size={16} color="#DC2626" />,
        badge: 'Street Food',
        tag: 'Tendance',
        type: 'recipe',
        data: recipes.find(r => r.name.toLowerCase().includes('alloco')) || recipes[1],
      },
      {
        id: 'explore_regions',
        label: 'Spécialités Régionales & Terroirs',
        description: 'Découvrez les recettes par régions',
        icon: <Globe size={16} color="#2563EB" />,
        badge: 'Terroir',
        tag: 'Découverte',
        type: 'region',
      },
      {
        id: 'explore_videos',
        label: 'Vidéos & Tutos de Préparation',
        description: 'Regardez les gestes des chefs en vidéo',
        icon: <Video size={16} color="#9333EA" />,
        badge: 'Tutos',
        tag: 'Vidéo',
        type: 'video',
      },
    ],
    [recipes]
  );

  // Suggestions filtrées en temps réel
  const filteredActions: SearchActionItem[] = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();

    if (!q) {
      return defaultActions;
    }

    const items: SearchActionItem[] = [];

    // 1. Suggestion Chef IA pour le mot-clé
    items.push({
      id: `ai_query_${q}`,
      label: `Demander au Chef IA pour "${debouncedQuery.trim()}"`,
      description: 'Générer une recette personnalisée avec cet ingrédient',
      icon: <Sparkles size={16} color={AppColors.primary} />,
      badge: 'Chef IA',
      tag: 'Génération',
      type: 'ai',
      data: debouncedQuery.trim(),
    });

    // 2. Recherche parmi les recettes réelles
    const matchingRecipes = recipes.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.region?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.ingredients?.some(i => i.name.toLowerCase().includes(q))
    );

    matchingRecipes.slice(0, 5).forEach(recipe => {
      items.push({
        id: `recipe_${recipe.id}`,
        label: recipe.name,
        description: `${recipe.region || 'Terroir'} • ${recipe.prepTime || recipe.cookTime || '25 min'} • ${recipe.difficulty || 'Facile'}`,
        icon: <CookingPot size={16} color="#EA580C" />,
        badge: recipe.category || 'Plat',
        tag: recipe.difficulty,
        type: 'recipe',
        data: recipe,
      });
    });

    // 3. Suggestions complémentaires si peu de résultats
    if (matchingRecipes.length === 0) {
      const gboman = recipes.find(r => r.name.toLowerCase().includes('gboman'));
      if (gboman) {
        items.push({
          id: 'suggest_gboman',
          label: gboman.name,
          description: 'Feuilles fraîches et poissons fumés',
          icon: <Utensils size={16} color="#16A34A" />,
          badge: 'Feuilles',
          tag: 'Suggestion',
          type: 'recipe',
          data: gboman,
        });
      }
    }

    return items;
  }, [debouncedQuery, recipes, defaultActions]);

  const handleActionClick = (action: SearchActionItem) => {
    Keyboard.dismiss();

    if (action.type === 'ai') {
      onSelectAiSearch(action.data || searchQuery || 'Ingrédients du frigo');
    } else if (action.type === 'recipe' && action.data) {
      onSelectRecipe(action.data);
    } else if (action.type === 'category') {
      if (onSelectCategory) onSelectCategory(action.data || action.label);
    } else {
      if (onSelectSuggestionText) onSelectSuggestionText(action.label);
    }
  };

  return (
    <View
      style={[
        styles.dropdownContainer,
        {
          backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
          borderColor: isDark ? AppColors.borderDark : 'rgba(0,0,0,0.08)',
        },
      ]}
    >
      <View style={styles.dropdownHeader}>
        <Text
          style={[
            styles.dropdownHeaderText,
            { color: isDark ? '#A8A29E' : '#73706B' },
          ]}
        >
          {debouncedQuery ? 'Suggestions & Recettes trouvées' : 'Raccourcis & Suggestions Populaires'}
        </Text>
        {debouncedQuery.length > 0 && (
          <Text style={styles.resultsCountBadge}>
            {filteredActions.length} résultat{filteredActions.length > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <ScrollView
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        bounces={true}
        overScrollMode="always"
        style={[
          styles.actionsList,
          Platform.OS === 'web' ? ({ overflowY: 'auto' } as any) : null,
        ]}
        contentContainerStyle={styles.actionsListContent}
      >
        {filteredActions.map((action, index) => (
          <Animated.View
            key={action.id}
            entering={FadeIn.delay(index * 15).duration(110)}
            layout={Layout.springify().damping(20).stiffness(340)}
          >
            <TouchableOpacity
              style={[
                styles.actionItem,
                {
                  backgroundColor: isDark ? '#1C1A18' : '#FAF9F6',
                  borderColor: isDark ? '#2B2826' : 'rgba(0,0,0,0.04)',
                },
              ]}
              activeOpacity={0.75}
              onPress={() => handleActionClick(action)}
            >
              <View style={styles.actionLeft}>
                <View
                  style={[
                    styles.actionIconBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(251, 86, 7, 0.08)',
                    },
                  ]}
                >
                  {action.icon}
                </View>

                <View style={styles.actionTextGroup}>
                  <Text
                    style={[
                      styles.actionLabel,
                      { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {action.label}
                  </Text>
                  {action.description ? (
                    <Text
                      style={[
                        styles.actionDescription,
                        { color: isDark ? '#A8A29E' : '#78716C' },
                      ]}
                      numberOfLines={1}
                    >
                      {action.description}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.actionRight}>
                {action.badge ? (
                  <View
                    style={[
                      styles.tagBadge,
                      {
                        backgroundColor:
                          action.type === 'ai'
                            ? 'rgba(251, 86, 7, 0.14)'
                            : isDark
                            ? 'rgba(255,255,255,0.06)'
                            : '#F0EEE9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagBadgeText,
                        {
                          color:
                            action.type === 'ai'
                              ? AppColors.primary
                              : isDark
                              ? '#D6D3CD'
                              : '#57534E',
                        },
                      ]}
                    >
                      {action.badge}
                    </Text>
                  </View>
                ) : null}

                <ChevronRight
                  size={14}
                  color={isDark ? '#73706B' : '#A8A29E'}
                  strokeWidth={2.4}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    maxHeight: 380,
    zIndex: 9999,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  dropdownHeaderText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  resultsCountBadge: {
    fontSize: 10.5,
    fontWeight: '800',
    color: AppColors.primary,
  },
  actionsList: {
    maxHeight: 330,
  },
  actionsListContent: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 13,
    borderWidth: 1,
    gap: 10,
  },
  actionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextGroup: {
    flex: 1,
    gap: 1,
  },
  actionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  actionDescription: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  tagBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
});
