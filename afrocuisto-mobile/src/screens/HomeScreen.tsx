import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Keyboard,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Zap } from 'lucide-react-native';
import { HomeHeader } from '../components/home/HomeHeader';
import { FirstChoiceGuide } from '../components/home/FirstChoiceGuide';
import { FigmaRecipeCarousel } from '../components/home/FigmaRecipeCarousel';
import { MagicFridgeCard } from '../components/home/MagicFridgeCard';
import { PopularDishCard } from '../components/home/PopularDishCard';
import { DishCategoriesRail } from '../components/home/DishCategoriesRail';
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
  const { recipes, featuredRecipes, popularRecipes, quickRecipes, isLoading, refreshRecipes } = useRecipes();
  const { isDark } = useTheme();
  const { isScreenLoading, triggerScreenLoading } = useNavigationTransition();

  // Recherche avec animation d'ouverture du Header & auto-suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isSearching = searchQuery.trim().length > 0;

  const isNavLoading = isScreenLoading('Home');
  const showSkeleton = isNavLoading || (isLoading && recipes.length === 0);

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
        {/* 1. Header fixe avec animation fluide d'ouverture / fermeture et dropdown menu de suggestions */}
        <HomeHeader
          onProfilePress={() => navigation.navigate('Profile')}
          onNotificationPress={() => navigation.navigate('AnimationLab')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isSearchOpen={isSearchOpen}
          onOpenChange={isOpen => setIsSearchOpen(isOpen)}
          onSearchClear={() => {
            setIsSearchOpen(false);
            setSearchQuery('');
          }}
          onAiPress={() => navigation.navigate('AiChef')}
          onSelectRecipe={handleRecipePress}
          onSelectAiSearch={query =>
            navigation.navigate('AiChef', { initialIngredient: query })
          }
          onSelectCategory={(category: any) =>
            navigation.navigate('CategoryRecipes', { category: typeof category === 'string' ? category : category?.id })
          }
        />

        {/* 2. Backdrop pour fermer la recherche au clic extérieur sans activer les éléments en arrière-plan */}
        {isSearchOpen && (
          <Pressable
            style={styles.searchBackdrop}
            onPress={() => {
              Keyboard.dismiss();
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
          />
        )}

        {showSkeleton ? (
          <HomeScreenSkeleton />
        ) : isSearching ? (
          /* ================= Vue Résultats de recherche sur la Home ================= */
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
                  onPress={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
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
                    onPress={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
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
            scrollEnabled={!isSearchOpen}
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
            {/* 1. Guide du Premier Choix : invitation claire & 3 accès directs */}
            <FirstChoiceGuide
              onSearchPress={() => setIsSearchOpen(true)}
              onMagicFridgePress={() => navigation.navigate('AiChef')}
              onQuickPress={() => navigation.navigate('CategoryRecipes', { category: 'quick' })}
            />

            {/* 2. Section Nouveautés & Coups de Cœur (Carousel) */}
            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                  ]}
                >
                  Sélection & Nouveautés
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Les plats signatures mis en lumière par nos chefs
                </Text>
              </View>
            </View>
            <FigmaRecipeCarousel onSelectRecipe={handleRecipePress} />

            {/* 3. Section "Les Plus Populaires" (Incontournables sans répétition) */}
            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                  ]}
                >
                  Les Plus Populaires
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Les grands classiques de la cuisine béninoise
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.seeAllPill,
                  {
                    backgroundColor: isDark ? 'rgba(255, 83, 42, 0.12)' : '#FFF2EE',
                    borderColor: isDark ? 'rgba(255, 83, 42, 0.25)' : '#FFE3D6',
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  triggerScreenLoading('RecipeList', 1500);
                  navigation.navigate('RecipeList');
                }}
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

            {/* 4. Section Plats Rapides & Express (< 30 min) */}
            {quickRecipes.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <View style={styles.sectionHeader}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Zap size={16} color="#059669" />
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                        ]}
                      >
                        Prêt en moins de 30 min
                      </Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                      Idéal pour cuisiner vite et bien au quotidien
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.seeAllPill,
                      {
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                        borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#D1FAE5',
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('CategoryRecipes', { category: 'quick' })}
                  >
                    <Text style={[styles.seeAllText, { color: '#059669' }]}>Express</Text>
                    <ChevronRight size={13} color="#059669" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {quickRecipes.slice(0, 6).map(item => (
                    <View key={item.id} style={styles.cardWrapper}>
                      <PopularDishCard
                        recipe={item}
                        onPress={() => handleRecipePress(item)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 5. Section Catégories de Plats avec Cartes Illustrées */}
            <DishCategoriesRail
              onSelectCategory={(cat) => {
                navigation.navigate('CategoryRecipes', { category: cat.id });
              }}
            />

            {/* 6. Section Spécialités par Région (Terroirs sans doublons) */}
            <RegionalDishesGrid
              recipes={recipes}
              onSelectRecipe={handleRecipePress}
              excludeIds={[
                ...featuredRecipes.map(r => r.id),
                ...popularRecipes.slice(0, 4).map(r => r.id),
              ]}
            />

            {/* 7. Teaser Communauté */}
            <CommunityLiveTeaser
              onPress={() => navigation.navigate('Community')}
            />

            {/* Marge de défilement généreuse pour ne jamais être masqué par la bottom bar */}
            <View style={{ height: 135 }} />
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
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#8C8A87',
    marginTop: 2,
    fontWeight: '500',
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
  searchBackdrop: {
    ...StyleSheet.absoluteFillObject,
    top: 68,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 900,
  },
});

