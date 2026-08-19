import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { Clock, Star } from 'lucide-react-native';
import { Recipe } from '../../types/recipe';
import { useRecipes } from '../../context/RecipeContext';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';
import { FavoriteIconButton } from '../common/FavoriteIconButton';

interface PopularDishCardProps {
  recipe: Recipe;
  onPress: () => void;
  style?: ViewStyle;
  isGrid?: boolean;
}

export const PopularDishCard: React.FC<PopularDishCardProps> = ({
  recipe,
  onPress,
  style,
  isGrid = false,
}) => {
  const { isFavorite, toggleFavorite } = useRecipes();
  const { isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isFav = isFavorite(recipe.id);

  // Largeur identique à la grille 2 colonnes (16px padding de chaque côté + 10px de gap)
  const screenWidth = Math.min(windowWidth || 390, 412);
  const cardWidth = Math.floor((screenWidth - 32 - 10) / 2);

  const regionText = (recipe.region || 'NATIONAL').toUpperCase();
  const prepTimeText = recipe.prepTime ? `${recipe.prepTime.replace(/[^0-9]/g, '')} min` : '30 min';
  const ratingText = recipe.rating ? recipe.rating.toFixed(1) : '4.8';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: isGrid ? '100%' : cardWidth,
          backgroundColor: isDark ? '#1E1D1B' : '#FFFFFF',
          borderColor: isDark ? '#2E2C29' : 'transparent',
        },
        isGrid && styles.gridCard,
        style,
      ]}
      activeOpacity={0.92}
      onPress={onPress}
    >
      {/* 1. Image Container (with internal rounded clipping) */}
      <View style={[styles.imageContainer, isGrid && styles.gridImageContainer]}>
        <Image
          source={getImageSource(recipe.image)}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Top-Left Region Pill Badge */}
        <View
          style={[
            styles.badgePill,
            {
              backgroundColor: isDark ? 'rgba(28, 26, 24, 0.92)' : 'rgba(255, 255, 255, 0.94)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {regionText}
          </Text>
        </View>

        {/* Top-Right Circular Heart Button with Particles */}
        <View style={styles.heartButtonContainer}>
          <FavoriteIconButton
            isFavorite={isFav}
            onToggle={() => toggleFavorite(recipe.id)}
            size={28}
            iconSize={14}
            iconType="heart"
            activeColor={AppColors.likeRed}
            inactiveColor={isDark ? '#E6E1E5' : '#1D192B'}
            inactiveBgColor={isDark ? 'rgba(232, 222, 248, 0.2)' : 'rgba(255, 255, 255, 0.9)'}
            activeBgColor={isDark ? 'rgba(255, 83, 42, 0.25)' : '#FFE2DC'}
          />
        </View>
      </View>

      {/* 2. Dish Name (Bold, Multi-line wrapping & Centered) */}
      <Text
        style={[
          styles.title,
          { color: isDark ? '#FFFFFF' : '#000000' },
        ]}
        numberOfLines={2}
      >
        {recipe.name.toUpperCase()}
      </Text>

      {/* 3. Description (Compact & well formatted) */}
      <Text
        style={[
          styles.description,
          { color: isDark ? '#B0ACA6' : '#5D5962' },
        ]}
        numberOfLines={2}
      >
        {recipe.description || 'Spécialité culinaire authentique préparée avec des ingrédients frais.'}
      </Text>

      {/* 4. Bottom Pills Row (Prep Time Pill & Rating Pill) */}
      <View style={styles.bottomRow}>
        <View
          style={[
            styles.metaPill,
            {
              backgroundColor: isDark ? '#2C2A28' : '#F6F3EE',
              borderColor: isDark ? '#3A3835' : '#ECE8E1',
            },
          ]}
        >
          <Clock size={11} color={AppColors.primary} strokeWidth={2.4} />
          <Text
            style={[
              styles.metaText,
              { color: isDark ? '#E6E1E5' : '#2C2A28' },
            ]}
          >
            {prepTimeText}
          </Text>
        </View>

        <View
          style={[
            styles.metaPill,
            {
              backgroundColor: isDark ? '#2C2A28' : '#FFF9EE',
              borderColor: isDark ? '#3A3835' : '#FFE8B8',
            },
          ]}
        >
          <Star
            size={11}
            color="#F59E0B"
            fill="#F59E0B"
          />
          <Text
            style={[
              styles.metaText,
              { color: isDark ? '#FFD180' : '#8A5300' },
            ]}
          >
            {ratingText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 8,
    marginVertical: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '100%',
    height: 250,
    borderRadius: 18,
    padding: 8,
    marginVertical: 0,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1D1B',
  },
  gridImageContainer: {
    height: 120,
    borderRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgePill: {
    position: 'absolute',
    top: 7,
    left: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  heartButtonContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 10,
  },
  title: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  description: {
    color: '#49454F',
    fontSize: 9.5,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  metaText: {
    color: '#1D192B',
    fontSize: 9,
    fontWeight: '700',
  },
});
