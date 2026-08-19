import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight } from 'lucide-react-native';
import { HomeHeader } from '../components/home/HomeHeader';
import { FigmaRecipeCarousel } from '../components/home/FigmaRecipeCarousel';
import { MagicFridgeCard } from '../components/home/MagicFridgeCard';
import { PopularDishCard } from '../components/home/PopularDishCard';
import { RegionalDishesGrid } from '../components/home/RegionalDishesGrid';
import { CommunityLiveTeaser } from '../components/home/CommunityLiveTeaser';
import { useRecipes } from '../context/RecipeContext';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../theme/colors';
import { Recipe } from '../types/recipe';
import { HomeScreenSkeleton } from '../components/common/Skeletons';
import { AnimatedScreenWrapper } from '../components/common/AnimatedScreenWrapper';
import { useNavigationTransition } from '../context/NavigationTransitionContext';

const QUICK_SEARCH_SUGGESTIONS = ['Gboman', 'Alloco', 'Dja', 'Amiwô', 'Riz au gras', 'Sauce Gombo'];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { recipes, popularRecipes, isLoading, refreshRecipes } = useRecipes();
  const { isDark } = useTheme();
  const { isScreenLoading } = useNavigationTransition();

  // Recherche directe depuis le Header de la Home (sans changement de page)
  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length > 0;

  const showSkeleton = isScreenLoading('Home') || (isLoading && recipes.length === 0);

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  // Filtrage en temps réel (nom, région, catégorie, description)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.region?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [recipes, searchQuery]);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: isDark ? AppColors.backgroundDark : '#FFFFFF',
        },
      ]}
    >
      <AnimatedScreenWrapper>
        {/* 1. Header fixe & interactif avec barre de recherche intégrée */}
        <HomeHeader
          onProfilePress={() => navigation.navigate('Profile')}
          onNotificationPress={() => navigation.navigate('AnimationLab')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
          onAiPress={() => navigation.navigate('AiChef')}
        />

        {showSkeleton ? (
          <HomeScreenSkeleton />
        ) : isSearching ? (
          /* ================= Vue Résultats de recherche sur la Home Page ================= */
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.searchResultsContent}
          >
            {/* Suggestions rapides horizontales */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionChipsScroll}
            >
              {QUICK_SEARCH_SUGGESTIONS.map(s => {
                const isSelected = searchQuery.trim().toLowerCase() === s.toLowerCase();
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.suggestionChip,
                      {
                        backgroundColor: isSelected
                          ? AppColors.primary
                          : isDark
                          ? AppColors.surfaceDark
                          : '#FFF2EE',
                        borderColor: isSelected
                          ? AppColors.primary
                          : isDark
                          ? AppColors.borderDark
                          : '#FFE3D6',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSearchQuery(s)}
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        { color: isSelected ? '#FFFFFF' : AppColors.primary },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {searchResults.length === 0 ? (
              /* Aucun résultat */
              <View style={styles.emptySearch}>
                <Text style={styles.emptyEmoji}>🍲</Text>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                  ]}
                >
                  Aucune recette trouvée
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: isDark ? '#A8A29E' : '#73706B' },
                  ]}
                >
                  Aucun plat ne correspond à "{searchQuery}". Essayez un autre ingrédient ou terme de recherche.
                </Text>
                <TouchableOpacity
                  style={styles.resetSearchBtn}
                  activeOpacity={0.8}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.resetSearchBtnText}>Effacer la recherche</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Résultats en grille 2 colonnes */
              <View>
                <View style={styles.resultsHeaderRow}>
                  <Text
                    style={[
                      styles.searchHintTitle,
                      { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                    ]}
                  >
                    {searchResults.length} recette{searchResults.length > 1 ? 's' : ''} trouvée{searchResults.length > 1 ? 's' : ''}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.clearSearchText}>Effacer</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.gridContainer}>
                  {searchResults.map(recipe => (
                    <View key={recipe.id} style={styles.gridItem}>
                      <PopularDishCard
                        recipe={recipe}
                        isGrid={true}
                        onPress={() => handleRecipePress(recipe)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          /* ================= Vue Principale Home Feed ================= */
          <ScrollView
            style={{ backgroundColor: isDark ? AppColors.backgroundDark : '#FFFFFF' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refreshRecipes}
                tintColor={AppColors.primary}
              />
            }
          >
            {/* 2. Carousel Plats en Vedette (Figma Node 3:8) */}
            <FigmaRecipeCarousel onSelectRecipe={handleRecipePress} />

            {/* 3. Widget Frigo Magique IA */}
            <MagicFridgeCard
              onPress={ingredient =>
                navigation.navigate('AiChef', ingredient ? { initialIngredient: ingredient } : undefined)
              }
            />

            {/* 4. Section "Les Plus Populaires" (Figma Node 10-634) */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                ]}
              >
                Les Plus Populaires
              </Text>
              <TouchableOpacity
                style={[
                  styles.seeAllPill,
                  {
                    backgroundColor: isDark ? 'rgba(255, 83, 42, 0.12)' : '#FFF2EE',
                    borderColor: isDark ? 'rgba(255, 83, 42, 0.25)' : '#FFE3D6',
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('RecipeList')}
              >
                <Text style={styles.seeAllText}>Voir Tout</Text>
                <ChevronRight size={13} color={AppColors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {popularRecipes.map(item => (
                <View key={item.id} style={styles.cardWrapper}>
                  <PopularDishCard
                    recipe={item}
                    onPress={() => handleRecipePress(item)}
                  />
                </View>
              ))}
            </ScrollView>

            {/* 5. Section Dynamique Vertical Grid (2 colonnes) par Région */}
            <RegionalDishesGrid
              recipes={recipes}
              onSelectRecipe={handleRecipePress}
            />

            {/* 6. Teaser Communauté */}
            <CommunityLiveTeaser
              onPress={() => navigation.navigate('Community')}
            />

            <View style={{ height: 80 }} />
          </ScrollView>
        )}
      </AnimatedScreenWrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  // ---- Styles des résultats de recherche ----
  searchResultsContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    paddingTop: 8,
  },
  suggestionChipsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  searchHintTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  clearSearchText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: AppColors.primary,
  },
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetSearchBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  resetSearchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    width: '48%',
  },
  // ---- Styles de la page d'accueil feed ----
  sectionHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  cardWrapper: {
    paddingVertical: 4,
  },
});

