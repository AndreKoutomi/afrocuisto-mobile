import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Sparkles, Clock, Star, ChevronRight, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe } from '../../types/recipe';
import { useRecipes } from '../../context/RecipeContext';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';
import { FavoriteIconButton } from '../common/FavoriteIconButton';

interface RelatedDishesSectionProps {
  currentRecipe: Recipe;
  onSelectRecipe: (recipe: Recipe) => void;
  isDark?: boolean;
}

interface ScoredRecipe {
  recipe: Recipe;
  score: number;
  matchReason: string;
}

export const RelatedDishesSection: React.FC<RelatedDishesSectionProps> = ({
  currentRecipe,
  onSelectRecipe,
  isDark: propIsDark,
}) => {
  const { recipes, isFavorite, toggleFavorite } = useRecipes();
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const { width: windowWidth } = useWindowDimensions();

  // Carte adaptée pour carrousel horizontal (entre 185px et 210px selon écran)
  const cardWidth = Math.max(185, Math.min(210, Math.round(windowWidth * 0.48)));

  // Calcul intelligent des plats reliés avec scoring
  const relatedDishes: ScoredRecipe[] = useMemo(() => {
    if (!recipes || recipes.length === 0) return [];

    const otherRecipes = recipes.filter(r => r.id !== currentRecipe.id);
    const scoredList: ScoredRecipe[] = [];

    const currentBase = (currentRecipe.base || '').toLowerCase();
    const currentRegion = (currentRecipe.region || '').toLowerCase();
    const currentCategory = (currentRecipe.category || '').toLowerCase();
    const currentSides = (currentRecipe.suggestedSides || []).map(s => s.toLowerCase());

    otherRecipes.forEach(r => {
      let score = 0;
      let reasons: string[] = [];

      const rName = r.name.toLowerCase();
      const rBase = (r.base || '').toLowerCase();
      const rRegion = (r.region || '').toLowerCase();
      const rCategory = (r.category || '').toLowerCase();

      // 1. Accompagnement explicitement suggéré dans la recette
      const isSuggestedSide = currentSides.some(
        side => rName.includes(side) || side.includes(rName)
      );
      if (isSuggestedSide) {
        score += 15;
        reasons.push('Accord idéal');
      }

      // 2. Même base culinaire (ex: Maïs, Manioc, Riz, Igname)
      if (currentBase && rBase && (currentBase.includes(rBase) || rBase.includes(currentBase))) {
        score += 10;
        reasons.push(`Base ${r.base}`);
      }

      // 3. Même catégorie (ex: Pâtes & Céréales, Sauces, Ragoûts)
      if (currentCategory && rCategory === currentCategory) {
        score += 8;
        if (!reasons.length) reasons.push('Même catégorie');
      }

      // 4. Complémentarité Pâte <-> Sauce
      const isCurrentPate = currentCategory.includes('pâte') || currentCategory.includes('céréale') || currentBase.includes('maïs');
      const isTargetSauce = rCategory.includes('sauce') || rCategory.includes('légume') || rName.includes('sauce');
      const isCurrentSauce = currentCategory.includes('sauce');
      const isTargetPate = rCategory.includes('pâte') || rCategory.includes('céréale');

      if ((isCurrentPate && isTargetSauce) || (isCurrentSauce && isTargetPate)) {
        score += 9;
        if (!reasons.length) reasons.push('Accompagnement savoureux');
      }

      // 5. Même région d'origine
      if (currentRegion && rRegion && (currentRegion.includes(rRegion) || rRegion.includes(currentRegion))) {
        score += 6;
        if (!reasons.length) reasons.push(r.region || 'Même région');
      }

      // 6. Ingrédients clés partagés
      if (currentRecipe.ingredients && r.ingredients) {
        const currentIngNames = currentRecipe.ingredients.map(i => i.name.toLowerCase());
        const matchingIngCount = r.ingredients.filter(i =>
          currentIngNames.some(cIng => cIng.includes(i.name.toLowerCase()) || i.name.toLowerCase().includes(cIng))
        ).length;

        if (matchingIngCount >= 2) {
          score += matchingIngCount * 2;
          if (!reasons.length) reasons.push('Saveurs similaires');
        }
      }

      // Bonus popularité / rating
      if (r.rating) {
        score += r.rating;
      }

      scoredList.push({
        recipe: r,
        score,
        matchReason: reasons[0] || (r.region ? `Cuisine ${r.region}` : 'Recommandé pour vous'),
      });
    });

    // Tri par pertinence décroissante
    scoredList.sort((a, b) => b.score - a.score);

    // Retourner les 6 à 8 meilleures suggestions
    return scoredList.slice(0, 8);
  }, [recipes, currentRecipe]);

  if (relatedDishes.length === 0) {
    return null;
  }

  const renderDishCard = ({ item }: { item: ScoredRecipe }) => {
    const { recipe, matchReason } = item;
    const isFav = isFavorite(recipe.id);
    const prepTimeText = recipe.prepTime ? `${recipe.prepTime.replace(/[^0-9]/g, '')} min` : '30 min';
    const ratingText = recipe.rating ? recipe.rating.toFixed(1) : '4.8';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            width: cardWidth,
            backgroundColor: isDark ? '#1E1D1B' : '#FFFFFF',
            borderColor: isDark ? '#2E2C29' : '#ECE8E1',
          },
        ]}
        activeOpacity={0.88}
        onPress={() => onSelectRecipe(recipe)}
      >
        {/* 1. Image avec tags et bouton favori */}
        <View style={styles.imageWrapper}>
          <Image
            source={getImageSource(recipe.image)}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Dégradé léger pour lisibilité */}
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.6)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Badge Région en haut à gauche */}
          <View
            style={[
              styles.regionBadge,
              {
                backgroundColor: isDark ? 'rgba(20, 18, 16, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Text
              style={[
                styles.regionText,
                { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {(recipe.region || 'AFRIQUE').toUpperCase()}
            </Text>
          </View>

          {/* Bouton Cœur Favori en haut à droite */}
          <View style={styles.favBtnWrap}>
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
              showBorder
              borderColor={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.08)'}
            />
          </View>

          {/* Badge de relation contextuelle en bas de l'image */}
          <View style={styles.reasonBadge}>
            <Sparkles size={10} color="#FBBF24" />
            <Text style={styles.reasonText} numberOfLines={1}>
              {matchReason}
            </Text>
          </View>
        </View>

        {/* 2. Contenu textuel et métadonnées */}
        <View style={styles.cardContent}>
          {/* Titre du plat */}
          <Text
            style={[
              styles.dishTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
            numberOfLines={2}
          >
            {recipe.name}
          </Text>

          {/* Description courte */}
          <Text
            style={[
              styles.dishDesc,
              { color: isDark ? '#A8A29E' : '#73706B' },
            ]}
            numberOfLines={2}
          >
            {recipe.description || 'Spécialité culinaire traditionnelle pleine de saveurs authentiques.'}
          </Text>

          {/* Ligne inférieure : Temps de préparation et Note */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor: isDark ? '#26201D' : '#FFF2EE',
                  borderColor: isDark ? '#3D2C27' : '#FFE5DF',
                },
              ]}
            >
              <Clock size={11} color={AppColors.primary} strokeWidth={2.4} />
              <Text
                style={[
                  styles.metaText,
                  { color: isDark ? '#FFD5CC' : AppColors.primary },
                ]}
              >
                {prepTimeText}
              </Text>
            </View>

            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor: isDark ? '#2B2519' : '#FFFBEB',
                  borderColor: isDark ? '#42371E' : '#FDE68A',
                },
              ]}
            >
              <Star size={11} color="#D97706" fill="#F59E0B" />
              <Text
                style={[
                  styles.metaText,
                  { color: isDark ? '#FDE68A' : '#B45309' },
                ]}
              >
                {ratingText}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* En-tête de section */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark ? '#2E1E1A' : '#FFF0EB',
                borderColor: isDark ? '#4A2A22' : '#FFD5C8',
              },
            ]}
          >
            <Sparkles size={17} color={AppColors.primary} strokeWidth={2.4} />
          </View>
          <View style={styles.titleCol}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
              ]}
            >
              Suggestions de plats
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                { color: isDark ? '#A8A29E' : '#73706B' },
              ]}
            >
              Plats similaires ou accompagnements idéaux
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.countPill,
            {
              backgroundColor: isDark ? '#26201D' : '#FFF2EE',
              borderColor: isDark ? '#3D2C27' : '#FFD5CC',
            },
          ]}
        >
          <Text style={[styles.countPillText, { color: AppColors.primary }]}>
            {relatedDishes.length} plats
          </Text>
        </View>
      </View>

      {/* Carrousel horizontal */}
      <FlatList
        data={relatedDishes}
        keyExtractor={item => `suggested-${item.recipe.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderDishCard}
        contentContainerStyle={styles.listContent}
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
  },
  titleCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 4,
    gap: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    height: 125,
    position: 'relative',
    backgroundColor: '#1E1D1B',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  regionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  regionText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  favBtnWrap: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  reasonBadge: {
    position: 'absolute',
    bottom: 7,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  reasonText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardContent: {
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  dishTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  dishDesc: {
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  metaText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
});
