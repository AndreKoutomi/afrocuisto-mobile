import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import {
  ChevronLeft,
  Search,
  X,
  Flame,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
} from 'lucide-react-native';
import { useRecipes } from '../context/RecipeContext';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../theme/colors';
import { PopularDishCard } from '../components/home/PopularDishCard';
import { RecipeCardSkeleton, RecipeGridSkeleton } from '../components/common/Skeletons';
import { AnimatedScreenWrapper } from '../components/common/AnimatedScreenWrapper';
import { useNavigationTransition } from '../context/NavigationTransitionContext';
import { Recipe } from '../types/recipe';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'Toutes', icon: '🍽️' },
  { id: 'quick', label: 'Rapides (< 30 min)', icon: '⚡' },
  { id: 'popular', label: 'Populaires', icon: '🔥' },
  { id: 'sauces', label: 'Sauces', icon: '🍲', category: 'Sauces (Nùsúnnú)' },
  { id: 'pates', label: 'Wɔ̌ & Céréales', icon: '🌽', category: 'Pâtes et Céréales (Wɔ̌)' },
  { id: 'street', label: 'Street Food', icon: '🍢', category: 'Street Food & Snacks (Amuse-bouche)' },
  { id: 'resistance', label: 'Grands Plats', icon: '🥘', category: 'Plats de Résistance & Ragoûts' },
  { id: 'drinks', label: 'Boissons & Jus', icon: '🍹', category: 'Boissons & Douceurs' },
];

export const RecipeListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { recipes, isLoading } = useRecipes();
  const { isDark } = useTheme();
  const { isScreenLoading } = useNavigationTransition();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'quick'>('default');

  const showSkeleton = isScreenLoading('Recipes') || (isLoading && recipes.length === 0);

  // Focus automatique du champ de recherche quand on vient de la Home (param autoFocusSearch)
  const route = useRoute<any>();
  const searchInputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.autoFocusSearch) {
        const timer = setTimeout(() => searchInputRef.current?.focus(), 300);
        // Consommer le paramètre pour ne pas refocaliser à chaque retour sur l'écran
        navigation.setParams({ autoFocusSearch: undefined });
        return () => clearTimeout(timer);
      }
    }, [route.params?.autoFocusSearch, navigation])
  );

  // Extract unique regions dynamically
  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach(r => {
      if (r.region && r.region.trim()) {
        set.add(r.region.trim());
      }
    });
    return Array.from(set);
  }, [recipes]);

  // Featured recipes (featured flag or rating >= 4.7)
  const featuredRecipes = useMemo(() => {
    return recipes.filter(r => r.isFeatured || (r.rating && r.rating >= 4.7)).slice(0, 6);
  }, [recipes]);

  // Quick recipes (<= 30 min)
  const quickRecipes = useMemo(() => {
    return recipes.filter(r => {
      const minutes = parseInt(r.prepTime?.replace(/[^0-9]/g, '') || '0', 10);
      return minutes > 0 && minutes <= 30;
    }).slice(0, 6);
  }, [recipes]);

  // Filtered & Sorted recipe list
  const filteredRecipes = useMemo(() => {
    let list = recipes.filter(r => {
      // Search term
      const matchesSearch =
        !search.trim() ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.region?.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(search.toLowerCase()));

      // Category filter
      let matchesCategory = true;
      if (activeCategory === 'quick') {
        const minutes = parseInt(r.prepTime?.replace(/[^0-9]/g, '') || '0', 10);
        matchesCategory = minutes > 0 && minutes <= 30;
      } else if (activeCategory === 'popular') {
        matchesCategory = (r.rating && r.rating >= 4.6) || false;
      } else if (activeCategory !== 'all') {
        const catObj = CATEGORY_FILTERS.find(c => c.id === activeCategory);
        if (catObj?.category) {
          matchesCategory = r.category === catObj.category;
        }
      }

      // Region filter
      let matchesRegion = true;
      if (selectedRegion) {
        matchesRegion = r.region?.toLowerCase() === selectedRegion.toLowerCase();
      }

      return matchesSearch && matchesCategory && matchesRegion;
    });

    // Sorting
    if (sortBy === 'rating') {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'quick') {
      list = [...list].sort((a, b) => {
        const tA = parseInt(a.prepTime?.replace(/[^0-9]/g, '') || '999', 10);
        const tB = parseInt(b.prepTime?.replace(/[^0-9]/g, '') || '999', 10);
        return tA - tB;
      });
    }

    return list;
  }, [recipes, search, activeCategory, selectedRegion, sortBy]);

  const isFiltering = search.trim().length > 0 || activeCategory !== 'all' || selectedRegion !== null;

  const handleSelectRecipe = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  const handleResetFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setSelectedRegion(null);
    setSortBy('default');
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: isDark ? AppColors.backgroundDark : '#F8F7F4',
        },
      ]}
    >
      <AnimatedScreenWrapper>
        {/* 1. Header Page Title with Back Button */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: isDark ? '#211F1D' : '#FFFFFF',
                borderColor: isDark ? '#2E2C29' : '#E8E4DC',
              },
            ]}
            activeOpacity={0.7}
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
        )}
        <View style={styles.headerTitleGroup}>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
          >
            Découvrir les Recettes
          </Text>
        </View>
      </View>

      {/* 2. Search Bar */}
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
              borderColor: isDark ? '#2E2C29' : '#E8E4DC',
            },
          ]}
        >
          <Search size={18} color="#8C8A87" />
          <TextInput
            ref={searchInputRef}
            placeholder="Rechercher une recette, un ingrédient, pays..."
            placeholderTextColor="#8C8A87"
            value={search}
            onChangeText={setSearch}
            style={[
              styles.input,
              { color: isDark ? '#FFFFFF' : '#1E1D1D' },
            ]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color="#8C8A87" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. Main Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showSkeleton ? (
          <RecipeGridSkeleton count={6} />
        ) : isFiltering ? (
          <View style={styles.resultsSection}>
            {/* Filter status row with reset & sorters */}
            <View style={styles.resultsHeader}>
              <View>
                <Text
                  style={[
                    styles.resultsCount,
                    { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                  ]}
                >
                  {filteredRecipes.length} résultat{filteredRecipes.length > 1 ? 's' : ''}
                </Text>
                {selectedRegion && (
                  <Text style={styles.regionFilterBadge}>
                    Région : {selectedRegion}
                  </Text>
                )}
              </View>

              <View style={styles.sortGroup}>
                <TouchableOpacity
                  style={[
                    styles.sortBtn,
                    sortBy === 'rating' && styles.sortBtnActive,
                    { borderColor: isDark ? '#2E2C29' : '#E8E4DC' },
                  ]}
                  onPress={() => setSortBy(sortBy === 'rating' ? 'default' : 'rating')}
                >
                  <Text
                    style={[
                      styles.sortBtnText,
                      sortBy === 'rating' && styles.sortBtnTextActive,
                      { color: sortBy === 'rating' ? '#FFFFFF' : isDark ? '#A8A29E' : '#73706B' },
                    ]}
                  >
                    ★ Notées
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortBtn,
                    sortBy === 'quick' && styles.sortBtnActive,
                    { borderColor: isDark ? '#2E2C29' : '#E8E4DC' },
                  ]}
                  onPress={() => setSortBy(sortBy === 'quick' ? 'default' : 'quick')}
                >
                  <Text
                    style={[
                      styles.sortBtnText,
                      sortBy === 'quick' && styles.sortBtnTextActive,
                      { color: sortBy === 'quick' ? '#FFFFFF' : isDark ? '#A8A29E' : '#73706B' },
                    ]}
                  >
                    ⚡ Rapides
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleResetFilters} style={styles.resetBtn}>
                  <Text style={styles.resetBtnText}>Effacer</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Empty state */}
            {filteredRecipes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🍲</Text>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                  ]}
                >
                  Aucune recette trouvée
                </Text>
                <Text style={[styles.emptySubtitle, { color: isDark ? '#A8A29E' : '#73706B' }]}>
                  Essayez avec un autre mot-clé ou réinitialisez vos filtres.
                </Text>
                <TouchableOpacity style={styles.emptyResetBtn} onPress={handleResetFilters}>
                  <Text style={styles.emptyResetBtnText}>Voir toutes les recettes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {filteredRecipes.map(recipe => (
                  <View key={recipe.id} style={styles.gridItem}>
                    <PopularDishCard
                      recipe={recipe}
                      isGrid={true}
                      onPress={() => handleSelectRecipe(recipe)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Dynamic Mode: Explore Mode with Curated Sections */
          <View>
            {/* Section A: Coups de Cœur & Tendances (Horizontal Carousel) */}
            {featuredRecipes.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Sparkles size={18} color={AppColors.primary} />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                      ]}
                    >
                      Coups de Cœur & Tendances
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
                    onPress={() => setActiveCategory('popular')}
                  >
                    <Text style={styles.seeAllText}>Voir tout</Text>
                    <ChevronRight size={13} color={AppColors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {featuredRecipes.map(recipe => (
                    <View key={recipe.id} style={styles.carouselCardWrapper}>
                      <PopularDishCard
                        recipe={recipe}
                        onPress={() => handleSelectRecipe(recipe)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section B: Régions & Terroirs (Interactive Region Chips) */}
            {uniqueRegions.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <MapPin size={18} color={AppColors.primary} />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                      ]}
                    >
                      Spécialités par Terroir
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.regionScrollContent}
                >
                  {uniqueRegions.map(region => (
                    <TouchableOpacity
                      key={region}
                      style={[
                        styles.regionChip,
                        {
                          backgroundColor: isDark ? '#211F1D' : '#FFFFFF',
                          borderColor: isDark ? '#2E2C29' : '#E8E4DC',
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedRegion(region)}
                    >
                      <Text style={styles.regionChipFlag}>🌍</Text>
                      <Text
                        style={[
                          styles.regionChipText,
                          { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                        ]}
                      >
                        {region}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section C: Prêt en moins de 30 minutes */}
            {quickRecipes.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Clock size={18} color={AppColors.primary} />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                      ]}
                    >
                      Prêt en moins de 30 min
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
                    onPress={() => setActiveCategory('quick')}
                  >
                    <Text style={styles.seeAllText}>Voir tout</Text>
                    <ChevronRight size={13} color={AppColors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {quickRecipes.map(recipe => (
                    <View key={recipe.id} style={styles.carouselCardWrapper}>
                      <PopularDishCard
                        recipe={recipe}
                        onPress={() => handleSelectRecipe(recipe)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section D: Tout le Répertoire (Vertical 2-column Grid) */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Flame size={18} color={AppColors.primary} />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                    ]}
                  >
                    Toutes les Recettes ({recipes.length})
                  </Text>
                </View>
              </View>

              <View style={styles.gridContainer}>
                {recipes.map(recipe => (
                  <View key={recipe.id} style={styles.gridItem}>
                    <PopularDishCard
                      recipe={recipe}
                      isGrid={true}
                      onPress={() => handleSelectRecipe(recipe)}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      </AnimatedScreenWrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 12,
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
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleGroup: {
    flex: 1,
    gap: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF2EE',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
  },
  filterPillsWrapper: {
    marginBottom: 12,
  },
  filterPillsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  pillActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  pillInactive: {
    backgroundColor: '#FFFFFF',
  },
  pillIcon: {
    fontSize: 14,
  },
  pillLabel: {
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
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
  horizontalScrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  carouselCardWrapper: {
    marginRight: 2,
  },
  regionScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  regionChipFlag: {
    fontSize: 14,
  },
  regionChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  gridItem: {
    width: '48%',
  },
  resultsSection: {
    paddingHorizontal: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '800',
  },
  regionFilterBadge: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  sortGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortBtnActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sortBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  emptyContainer: {
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
    marginBottom: 18,
    lineHeight: 18,
  },
  emptyResetBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
