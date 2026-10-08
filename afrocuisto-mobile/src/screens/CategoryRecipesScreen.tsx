import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Zap,
  ChefHat,
  Fish,
  GlassWater,
  Wheat,
  Soup,
  Flame,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe } from '../types/recipe';
import { useRecipes } from '../context/RecipeContext';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../theme/colors';
import { PopularDishCard } from '../components/home/PopularDishCard';
import { AnimatedScreenWrapper } from '../components/common/AnimatedScreenWrapper';
import { RecipeCardSkeleton } from '../components/common/Skeletons';
import { getRecipeDurationInfo } from '../utils/recipeScaling';

const DISH_CATEGORIES = [
  {
    id: 'sauces',
    name: 'Sauces & Ragoûts',
    shortName: 'Sauces',
    icon: Soup,
    gradientLight: ['#FFF1ED', '#FFE4DC'],
    gradientDark: ['#381A12', '#26120D'],
    borderLight: '#FFD3C7',
    borderDark: '#4A231A',
    iconColor: '#EA580C',
    categoryFilter: 'Sauces (Nùsúnnú)',
  },
  {
    id: 'pates',
    name: 'Pâtes & Céréales (Wɔ̌)',
    shortName: 'Pâtes & Wɔ̌',
    icon: Wheat,
    gradientLight: ['#FEF9E7', '#FDEEAD'],
    gradientDark: ['#35290F', '#241B08'],
    borderLight: '#FDE68A',
    borderDark: '#483714',
    iconColor: '#D97706',
    categoryFilter: 'Pâtes et Céréales (Wɔ̌)',
  },
  {
    id: 'resistance',
    name: 'Plats de Résistance',
    shortName: 'Grands Plats',
    icon: ChefHat,
    gradientLight: ['#FFF1F3', '#FFE4E8'],
    gradientDark: ['#3A161C', '#260D12'],
    borderLight: '#FECDD3',
    borderDark: '#4E1E26',
    iconColor: '#E11D48',
    categoryFilter: 'Plats de Résistance & Ragoûts',
  },
  {
    id: 'street',
    name: 'Street Food & Snacks',
    shortName: 'Street Food',
    icon: Flame,
    gradientLight: ['#FFF7EE', '#FFEDD6'],
    gradientDark: ['#3A1F0D', '#261306'],
    borderLight: '#FED7AA',
    borderDark: '#4E2A12',
    iconColor: '#F97316',
    categoryFilter: 'Street Food & Snacks (Amuse-bouche)',
  },
  {
    id: 'poissons',
    name: 'Poissons & Mer',
    shortName: 'Poissons',
    icon: Fish,
    gradientLight: ['#F0F9FF', '#E0F2FE'],
    gradientDark: ['#0E2638', '#081824'],
    borderLight: '#BAE6FD',
    borderDark: '#163852',
    iconColor: '#0284C7',
    categoryFilter: 'Poissons & Fruits de mer',
  },
  {
    id: 'drinks',
    name: 'Boissons & Douceurs',
    shortName: 'Boissons',
    icon: GlassWater,
    gradientLight: ['#FDF2F8', '#FCE7F3'],
    gradientDark: ['#361226', '#240B1A'],
    borderLight: '#FBCFE8',
    borderDark: '#4A1935',
    iconColor: '#DB2777',
    categoryFilter: 'Boissons & Douceurs',
  },
  {
    id: 'quick',
    name: 'Express (< 30 min)',
    shortName: 'Express',
    icon: Zap,
    gradientLight: ['#FEFCE8', '#FEF9C3'],
    gradientDark: ['#352F0D', '#231F07'],
    borderLight: '#FEF08A',
    borderDark: '#484013',
    iconColor: '#CA8A04',
    isQuick: true,
  },
];

export const CategoryRecipesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { recipes, isLoading } = useRecipes();
  const { isDark } = useTheme();

  const categoryParam = route.params?.category;
  const rawId = (
    typeof categoryParam === 'string'
      ? categoryParam
      : categoryParam?.id || ''
  ).toLowerCase().trim();

  // Forçage du skeleton de chargement à 1.5 secondes sur la navigation
  const [isForcedLoading, setIsForcedLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsForcedLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const showSkeleton = isForcedLoading || (isLoading && recipes.length === 0);

  // Résolution robuste de la catégorie sélectionnée (support des alias express, quick, etc.)
  const activeCategory = useMemo(() => {
    // 1. Recherche par identifiant exact
    const exact = DISH_CATEGORIES.find(c => c.id.toLowerCase() === rawId);
    if (exact) return exact;

    // 2. Recherche par alias rapide / express / 30 min
    if (
      rawId === 'express' ||
      rawId === 'quick' ||
      rawId === 'quick_express' ||
      rawId.includes('express') ||
      rawId.includes('rapide') ||
      rawId.includes('30 min') ||
      rawId.includes('30min') ||
      rawId.includes('< 30') ||
      rawId.includes('30')
    ) {
      return DISH_CATEGORIES.find(c => c.isQuick) || DISH_CATEGORIES[0];
    }

    // 3. Recherche par nom ou filtre
    if (rawId) {
      const match = DISH_CATEGORIES.find(c => {
        const name = c.name.toLowerCase();
        const short = c.shortName.toLowerCase();
        const filter = (c.categoryFilter || '').toLowerCase();
        return (
          name.includes(rawId) ||
          rawId.includes(name) ||
          short.includes(rawId) ||
          rawId.includes(short) ||
          (filter && (filter.includes(rawId) || rawId.includes(filter)))
        );
      });
      if (match) return match;
    }

    // 4. Catégorie par défaut (jamais d'écran blanc ni de null)
    return DISH_CATEGORIES.find(c => c.isQuick) || DISH_CATEGORIES[0];
  }, [rawId]);

  const filteredRecipes = useMemo(() => {
    if (activeCategory.isQuick) {
      return recipes.filter(r => {
        const { totalMinutes } = getRecipeDurationInfo(r.prepTime, r.cookTime);
        return totalMinutes > 0 && totalMinutes <= 30;
      });
    } else if (activeCategory.categoryFilter) {
      return recipes.filter(r => {
        const rCat = (r.category || '').toLowerCase();
        const target = activeCategory.categoryFilter!.toLowerCase();
        const rName = (r.name || '').toLowerCase();
        return (
          rCat.includes(target) ||
          target.includes(rCat) ||
          (activeCategory.id === 'poissons' &&
            (rName.includes('poisson') || rName.includes('crabe') || rName.includes('crevette')))
        );
      });
    }
    return [];
  }, [recipes, activeCategory]);

  const handleRecipePress = useCallback((recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  }, [navigation]);

  const IconComponent = activeCategory.icon;
  const gradient = isDark ? activeCategory.gradientDark : activeCategory.gradientLight;

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? AppColors.backgroundDark : '#F8F7F4' },
      ]}
    >
      <AnimatedScreenWrapper style={styles.wrapper}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { backgroundColor: isDark ? AppColors.backgroundDark : '#F8F7F4' },
          ]}
        >
          {/* Header avec gradient et icône de catégorie */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[gradient?.[0] || '#FB5607', gradient?.[1] || '#FF7A00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View
              style={[
                styles.headerContent,
                { paddingTop: (insets.top > 0 ? insets.top : 24) + 6 },
              ]}
            >
              {/* Back Button */}
              <TouchableOpacity
                style={[
                  styles.backButton,
                  {
                    backgroundColor: isDark ? 'rgba(30, 28, 26, 0.90)' : 'rgba(255, 255, 255, 0.92)',
                    borderColor: isDark ? '#2E2C29' : 'rgba(255, 255, 255, 0.6)',
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Retour"
                accessibilityRole="button"
              >
                <ChevronLeft
                  size={22}
                  color={isDark ? '#FFFFFF' : AppColors.textPrimary}
                  strokeWidth={2.4}
                />
              </TouchableOpacity>

              {/* Category Info */}
              <View style={styles.categoryHeader}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.32)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <IconComponent size={28} color={activeCategory.iconColor} strokeWidth={2.2} />
                </View>
                <View style={styles.categoryTextGroup}>
                  <Text
                    style={[
                      styles.categoryTitle,
                      { color: isDark ? '#FFFFFF' : '#1C1917' },
                    ]}
                  >
                    {activeCategory.name}
                  </Text>
                  <Text
                    style={[
                      styles.categorySubtitle,
                      { color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(28, 25, 23, 0.7)' },
                    ]}
                  >
                    {filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recipes Content Area */}
          <View style={styles.contentContainer}>
            {showSkeleton ? (
              <View style={styles.gridContainer}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <View key={i} style={styles.gridItem}>
                    <RecipeCardSkeleton isGrid={true} />
                  </View>
                ))}
              </View>
            ) : filteredRecipes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🍲</Text>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                  ]}
                >
                  Aucune recette pour l'instant
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: isDark ? '#A8A29E' : '#73706B' },
                  ]}
                >
                  Revenez plus tard pour découvrir de nouvelles spécialités {activeCategory.name.toLowerCase()}.
                </Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {filteredRecipes.map(recipe => (
                  <View key={recipe.id} style={styles.gridItem}>
                    <PopularDishCard
                      recipe={recipe}
                      isGrid={true}
                      onPress={() => handleRecipePress(recipe)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </AnimatedScreenWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 135,
  },
  heroSection: {
    position: 'relative',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    paddingBottom: 22,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 14,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryTextGroup: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  categorySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
  },
});