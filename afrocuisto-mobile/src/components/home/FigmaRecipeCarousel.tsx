import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { Clock, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe } from '../../types/recipe';
import { useRecipes } from '../../context/RecipeContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';
import { FavoriteIconButton } from '../common/FavoriteIconButton';

interface FigmaRecipeCarouselProps {
  onSelectRecipe: (recipe: Recipe) => void;
}

export const FigmaRecipeCarousel: React.FC<FigmaRecipeCarouselProps> = ({ onSelectRecipe }) => {
  const { featuredRecipes, isFavorite, toggleFavorite } = useRecipes();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { width: windowWidth } = useWindowDimensions();

  // Clamper la largeur pour s'adapter au conteneur mobile/webview (ex: WebDeviceFrame max 412px)
  const [containerWidth, setContainerWidth] = useState(() => Math.min(windowWidth || Dimensions.get('window').width, 412));

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const layoutWidth = e.nativeEvent.layout.width;
    if (layoutWidth > 0 && Math.abs(layoutWidth - containerWidth) > 2) {
      setContainerWidth(layoutWidth);
    }
  };

  const cardWidth = Math.round(containerWidth * 0.86);
  const cardSpacing = Math.max(8, Math.round((containerWidth - cardWidth) / 2));
  const snapInterval = cardWidth + 16;

  useEffect(() => {
    if (featuredRecipes.length <= 1) return;
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % featuredRecipes.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeIndex, featuredRecipes.length]);

  const renderCard = ({ item: recipe, index }: { item: Recipe; index: number }) => {
    const isFav = isFavorite(recipe.id);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            width: cardWidth,
            marginLeft: index === 0 ? cardSpacing : 8,
            marginRight: index === featuredRecipes.length - 1 ? cardSpacing : 8,
          },
        ]}
        activeOpacity={0.92}
        onPress={() => onSelectRecipe(recipe)}
      >
        {/* Conteneur intérieur avec arrondi propre pour isoler le clipping de l'ombre */}
        <View style={styles.cardInner}>
          <Image
            source={getImageSource(recipe.image)}
            style={styles.cardImage}
            resizeMode="cover"
          />

          {/* Dégradé immersif */}
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.15)',
              'transparent',
              'rgba(0,0,0,0.65)',
              'rgba(0,0,0,0.95)',
            ]}
            locations={[0.0, 0.35, 0.70, 1.0]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Header de la carte */}
          <View style={styles.cardHeader}>
            <View style={styles.regionBadge}>
              <Text style={styles.regionText}>
                {(recipe.region || 'NATIONAL').toUpperCase()}
              </Text>
            </View>

            <View style={styles.favBtnWrapper}>
              <FavoriteIconButton
                isFavorite={isFav}
                onToggle={() => toggleFavorite(recipe.id)}
                size={38}
                iconSize={18}
                iconType="heart"
                activeColor="#FFFFFF"
                inactiveColor="#FFFFFF"
                activeBgColor={AppColors.likeRed}
                inactiveBgColor="rgba(0,0,0,0.35)"
                showBorder
                borderColor="rgba(255,255,255,0.30)"
              />
            </View>
          </View>

          {/* Contenu inférieur */}
          <View style={styles.cardBottom}>
            <Text style={styles.recipeTitle} numberOfLines={2}>
              {recipe.name.toUpperCase()}
            </Text>

            <Text style={styles.recipeDesc} numberOfLines={2}>
              {recipe.description || 'Une délicieuse spécialité culinaire préparée avec des ingrédients authentiques.'}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock size={15} color="#FFFFFF" />
                <Text style={styles.metaText}>{recipe.prepTime} prep.</Text>
              </View>

              <View style={styles.metaItem}>
                <Star size={15} color={AppColors.starGold} fill={AppColors.starGold} />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (featuredRecipes.length === 0) return null;

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <FlatList
        ref={flatListRef}
        data={featuredRecipes}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: snapInterval,
          offset: snapInterval * index,
          index,
        })}
        contentContainerStyle={styles.listContent}
        onMomentumScrollEnd={ev => {
          const index = Math.round(ev.nativeEvent.contentOffset.x / snapInterval);
          setActiveIndex(Math.max(0, Math.min(index, featuredRecipes.length - 1)));
        }}
        renderItem={renderCard}
      />

      {/* Indicateurs de pagination Figma */}
      <View style={styles.paginationRow}>
        {featuredRecipes.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  listContent: {
    paddingVertical: 14, // Espace vertical pour laisser rayonner l'ombre sans coupure
  },
  card: {
    height: 245,
    borderRadius: 28,
    backgroundColor: '#1E1D1B',
    // Ombre douce immersive sans overflow:hidden sur le parent
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  cardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardHeader: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  regionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  favBtnWrapper: {
    marginRight: -8,
    marginTop: -8,
  },
  cardBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
  },
  recipeTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.2,
    lineHeight: 23,
  },
  recipeDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  activeDot: {
    width: 28,
    backgroundColor: '#FF1E00',
  },
  inactiveDot: {
    width: 7,
    backgroundColor: '#D9D9D9',
  },
});
