import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Clock,
  Flame,
  CheckCircle2,
  ShoppingCart,
  Bookmark,
  Star,
  ChefHat,
  Sparkles,
  Utensils,
  Plus,
  Check,
  Share2,
} from 'lucide-react-native';
import { AiChefRecipeResult } from '../../types/aiChef';
import { useTheme } from '../../context/ThemeContext';
import { useRecipes } from '../../context/RecipeContext';
import { useShopping } from '../../context/ShoppingContext';
import { AppColors } from '../../theme/colors';
import { Recipe } from '../../types/recipe';

interface AiRecipeCardProps {
  recipe: AiChefRecipeResult;
}

export const AiRecipeCard: React.FC<AiRecipeCardProps> = ({ recipe }) => {
  const { isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useRecipes();
  const { addIngredients } = useShopping();

  const isSaved = isFavorite(recipe.id);
  const [addedToCart, setAddedToCart] = useState(false);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Facile':
        return AppColors.difficultyEasy;
      case 'Difficile':
        return AppColors.difficultyHard;
      default:
        return AppColors.difficultyMedium;
    }
  };

  const handleSaveRecipe = async () => {
    await toggleFavorite(recipe.id);
  };

  const handleAddMissingToCart = async () => {
    if (addedToCart || recipe.missingIngredients.length === 0) return;

    // Convert to Recipe format expected by ShoppingContext
    const minimalRecipe: Recipe = {
      id: recipe.id,
      name: recipe.dishName,
      region: recipe.region,
      category: recipe.category || 'Recette IA',
      difficulty: recipe.difficulty,
      prepTime: recipe.prepTime || recipe.totalTime,
      cookTime: recipe.cookTime || '20 min',
      image: '',
      ingredients: recipe.missingIngredients.map(ing => ({
        name: ing.name,
        quantity: ing.amount || null,
      })),
      steps: recipe.steps,
    };

    await addIngredients(minimalRecipe);
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
    }, 3500);
  };

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
          borderColor: isDark ? AppColors.borderDark : 'rgba(251, 86, 7, 0.14)',
          shadowColor: isDark ? '#000000' : AppColors.primary,
        },
      ]}
    >
      {/* 1. Header Badges: Time, Difficulty & Region */}
      <View style={styles.topBadgeRow}>
        <View style={styles.badgeGroup}>
          <View
            style={[
              styles.timeBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(251, 86, 7, 0.18)'
                  : 'rgba(251, 86, 7, 0.10)',
              },
            ]}
          >
            <Clock size={12} color={AppColors.primary} strokeWidth={2.4} />
            <Text style={styles.timeBadgeText}>{recipe.totalTime}</Text>
          </View>

          <View
            style={[
              styles.diffBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : '#F5F4F0',
                borderColor: getDifficultyColor(recipe.difficulty),
              },
            ]}
          >
            <Flame
              size={11}
              color={getDifficultyColor(recipe.difficulty)}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.diffBadgeText,
                { color: getDifficultyColor(recipe.difficulty) },
              ]}
            >
              {recipe.difficulty}
            </Text>
          </View>
        </View>

        <View style={styles.regionBadge}>
          <Text style={styles.regionText}>{recipe.region}</Text>
        </View>
      </View>

      {/* 2. Main Title */}
      <View style={styles.titleSection}>
        <Text
          style={[
            styles.dishTitle,
            { color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary },
          ]}
        >
          {recipe.dishName}
        </Text>
        {recipe.category && (
          <Text style={styles.categorySub}>{recipe.category}</Text>
        )}
      </View>

      {/* 3. Section Ingrédients: Utilisés ✅ vs Manquants / Placard 🛒 */}
      <View style={styles.ingredientsSection}>
        <Text
          style={[
            styles.sectionHeader,
            { color: isDark ? AppColors.textDarkSecondary : AppColors.textSecondary },
          ]}
        >
          INGRÉDIENTS
        </Text>

        <View style={styles.ingredientsContainer}>
          {/* Utilisés */}
          {recipe.usedIngredients.length > 0 && (
            <View style={styles.ingredientGroup}>
              <View style={styles.groupHeader}>
                <CheckCircle2 size={13} color="#22C55E" strokeWidth={2.5} />
                <Text style={[styles.groupTitle, { color: '#22C55E' }]}>
                  Dans votre frigo ({recipe.usedIngredients.length})
                </Text>
              </View>
              <View style={styles.chipsWrapper}>
                {recipe.usedIngredients.map((ing, idx) => (
                  <View
                    key={`used_${idx}`}
                    style={[
                      styles.ingChip,
                      {
                        backgroundColor: isDark
                          ? 'rgba(34, 197, 94, 0.12)'
                          : 'rgba(34, 197, 94, 0.08)',
                        borderColor: isDark
                          ? 'rgba(34, 197, 94, 0.3)'
                          : 'rgba(34, 197, 94, 0.25)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ingChipText,
                        { color: isDark ? '#86EFAC' : '#15803D' },
                      ]}
                    >
                      {ing.name} {ing.amount ? `(${ing.amount})` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Manquants / Placard */}
          {recipe.missingIngredients.length > 0 && (
            <View style={[styles.ingredientGroup, { marginTop: 8 }]}>
              <View style={styles.groupHeader}>
                <ShoppingCart size={13} color={AppColors.primary} strokeWidth={2.4} />
                <Text
                  style={[
                    styles.groupTitle,
                    { color: AppColors.primary },
                  ]}
                >
                  À compléter / placard ({recipe.missingIngredients.length})
                </Text>
              </View>
              <View style={styles.chipsWrapper}>
                {recipe.missingIngredients.map((ing, idx) => (
                  <View
                    key={`missing_${idx}`}
                    style={[
                      styles.ingChip,
                      {
                        backgroundColor: isDark
                          ? 'rgba(251, 86, 7, 0.12)'
                          : 'rgba(251, 86, 7, 0.08)',
                        borderColor: isDark
                          ? 'rgba(251, 86, 7, 0.3)'
                          : 'rgba(251, 86, 7, 0.22)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ingChipText,
                        { color: isDark ? '#FED7AA' : AppColors.primaryDark },
                      ]}
                    >
                      {ing.name} {ing.amount ? `(${ing.amount})` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 4. Étapes courtes numérotées */}
      <View style={styles.stepsSection}>
        <Text
          style={[
            styles.sectionHeader,
            { color: isDark ? AppColors.textDarkSecondary : AppColors.textSecondary },
          ]}
        >
          ÉTAPES DE PRÉPARATION (EXPRESS)
        </Text>

        <View style={styles.stepsList}>
          {recipe.steps.map((step, idx) => (
            <View key={`step_${idx}`} style={styles.stepItem}>
              <View
                style={[
                  styles.stepNumberBadge,
                  {
                    backgroundColor: isDark
                      ? AppColors.surfaceDark
                      : 'rgba(251, 86, 7, 0.12)',
                    borderColor: AppColors.primary,
                  },
                ]}
              >
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <Text
                style={[
                  styles.stepText,
                  { color: isDark ? '#F5F3EF' : AppColors.textPrimary },
                ]}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 5. Suggestions d'accompagnements */}
      {recipe.suggestedSides && recipe.suggestedSides.length > 0 && (
        <View style={styles.sidesSection}>
          <View style={styles.sidesHeaderRow}>
            <Utensils size={13} color={AppColors.accentGold} />
            <Text style={styles.sidesHeaderTitle}>Accompagnements conseillés :</Text>
          </View>
          <View style={styles.chipsWrapper}>
            {recipe.suggestedSides.map((side, idx) => (
              <View
                key={`side_${idx}`}
                style={[
                  styles.sideChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(245, 158, 11, 0.14)'
                      : '#FFFBEB',
                    borderColor: isDark
                      ? 'rgba(245, 158, 11, 0.35)'
                      : 'rgba(245, 158, 11, 0.3)',
                  },
                ]}
              >
                <Text style={styles.sideChipText}>{side}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 6. Astuce du Chef */}
      {recipe.chefTip && (
        <View
          style={[
            styles.tipBox,
            {
              backgroundColor: isDark ? '#1F1D1B' : '#F9F8F6',
              borderColor: isDark ? '#33302C' : '#E8E5DF',
            },
          ]}
        >
          <Sparkles size={14} color={AppColors.primary} />
          <Text
            style={[
              styles.tipText,
              { color: isDark ? AppColors.textDarkSecondary : '#666360' },
            ]}
          >
            <Text style={{ fontWeight: '700', color: AppColors.primary }}>
              Astuce du Chef :{' '}
            </Text>
            {recipe.chefTip}
          </Text>
        </View>
      )}

      {/* 7. Deux Boutons d'Action au Bas de la Carte */}
      <View style={styles.actionsFooter}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.saveBtn,
            isSaved && styles.saveBtnActive,
            {
              borderColor: isSaved
                ? AppColors.primary
                : isDark
                ? AppColors.borderDark
                : '#E2DFD8',
            },
          ]}
          activeOpacity={0.82}
          onPress={handleSaveRecipe}
        >
          <Star
            size={16}
            color={isSaved ? AppColors.starGold : isDark ? '#D6D3CD' : '#4A4846'}
            fill={isSaved ? AppColors.starGold : 'none'}
          />
          <Text
            style={[
              styles.actionBtnText,
              {
                color: isSaved
                  ? AppColors.primary
                  : isDark
                  ? '#F0EDE6'
                  : AppColors.textPrimary,
                fontWeight: isSaved ? '800' : '600',
              },
            ]}
          >
            {isSaved ? 'Sauvegardée' : 'Sauvegarder'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.cartBtn,
            addedToCart && styles.cartBtnDone,
          ]}
          activeOpacity={0.85}
          onPress={handleAddMissingToCart}
        >
          {addedToCart ? (
            <>
              <Check size={16} color="#FFFFFF" strokeWidth={2.8} />
              <Text style={styles.cartBtnText}>Ajouté !</Text>
            </>
          ) : (
            <>
              <ShoppingCart size={16} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.cartBtnText}>Ajouter manquants</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.2,
    marginVertical: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    gap: 14,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: AppColors.primary,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  diffBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  regionBadge: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  regionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C8A87',
  },
  titleSection: {
    gap: 2,
  },
  dishTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 23,
  },
  categorySub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C8A87',
  },
  sectionHeader: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  ingredientsSection: {
    gap: 4,
  },
  ingredientsContainer: {
    gap: 6,
  },
  ingredientGroup: {
    gap: 6,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  groupTitle: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  ingChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepsSection: {
    gap: 8,
  },
  stepsList: {
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '900',
    color: AppColors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  sidesSection: {
    gap: 6,
    paddingTop: 2,
  },
  sidesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sidesHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: AppColors.accentGold,
  },
  sideChip: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  sideChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  actionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  saveBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
  },
  saveBtnActive: {
    backgroundColor: 'rgba(251, 86, 7, 0.08)',
  },
  actionBtnText: {
    fontSize: 12.5,
  },
  cartBtn: {
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  cartBtnDone: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
  },
  cartBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
