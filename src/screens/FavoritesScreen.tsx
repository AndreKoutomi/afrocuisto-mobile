import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Heart, UtensilsCrossed } from 'lucide-react-native';
import { useRecipes } from '../context/RecipeContext';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../theme/colors';
import { PopularDishCard } from '../components/home/PopularDishCard';
import { RecipeGridSkeleton } from '../components/common/Skeletons';
import { AnimatedScreenWrapper } from '../components/common/AnimatedScreenWrapper';
import { useNavigationTransition } from '../context/NavigationTransitionContext';

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { recipes, favorites, isLoading } = useRecipes();
  const { isDark } = useTheme();
  const { isScreenLoading } = useNavigationTransition();

  const favoriteRecipes = recipes.filter(r => favorites.includes(r.id));
  const showSkeleton = isScreenLoading('Favorites') || (isLoading && recipes.length === 0);

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Heart size={20} color={AppColors.primary} fill={AppColors.primary} />
          </View>
          <View>
            <Text
              style={[
                styles.headerTitle,
                { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
              ]}
            >
              Mes Recettes Favorites
            </Text>
            <Text style={styles.headerSubtitle}>
              {favoriteRecipes.length} plat{favoriteRecipes.length > 1 ? 's' : ''} enregistré{favoriteRecipes.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {showSkeleton ? (
        <RecipeGridSkeleton count={4} />
      ) : favoriteRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Heart size={44} color="#A8A29E" />
          </View>
          <Text
            style={[
              styles.emptyTitle,
              { color: isDark ? '#FFFFFF' : '#1E1D1D' },
            ]}
          >
            Aucun favori pour le moment
          </Text>
          <Text style={styles.emptyDesc}>
            Appuyez sur l'icône cœur sur les cartes de plats pour les retrouver facilement ici.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Recipes')}
          >
            <UtensilsCrossed size={16} color="#FFFFFF" />
            <Text style={styles.browseBtnText}>Explorer les recettes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favoriteRecipes}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <PopularDishCard
                recipe={item}
                isGrid={true}
                onPress={() => navigation.navigate('RecipeDetail', { recipe: item })}
              />
            </View>
          )}
        />
      )}
      </AnimatedScreenWrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 83, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8C8A87',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#8C8A87',
    textAlign: 'center',
    lineHeight: 18,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItem: {
    width: '48.5%',
  },
});
