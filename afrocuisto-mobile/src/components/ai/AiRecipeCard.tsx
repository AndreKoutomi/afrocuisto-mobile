import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import {
  Clock,
  Flame,
  CheckCircle2,
  ShoppingCart,
  Star,
  Sparkles,
  Utensils,
  Check,
  Timer,
  Volume2,
  VolumeX,
  GlassWater,
  Share2,
} from 'lucide-react-native';
import { AiChefRecipeResult } from '../../types/aiChef';
import { useTheme } from '../../context/ThemeContext';
import { useRecipes } from '../../context/RecipeContext';
import { useShopping } from '../../context/ShoppingContext';
import { AppColors } from '../../theme/colors';
import { Recipe } from '../../types/recipe';
import { cookingTimerService } from '../../services/cookingTimerService';
import { expressiveVoiceService } from '../../services/expressiveVoiceService';

interface AiRecipeCardProps {
  recipe: AiChefRecipeResult;
  onSpeak?: (text: string) => void;
  onAskVariation?: (recipe: AiChefRecipeResult) => void;
}

export const AiRecipeCard: React.FC<AiRecipeCardProps> = ({
  recipe,
  onSpeak,
  onAskVariation,
}) => {
  const { isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useRecipes();
  const { addIngredients } = useShopping();

  const isSaved = isFavorite(recipe.id);
  const [addedToCart, setAddedToCart] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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

  // Lancer le minuteur de cuisson avec cookingTimerService
  const handleStartTimer = async () => {
    try {
      // Extraire le nombre de minutes depuis cookTime ou totalTime
      const rawTime = recipe.cookTime || recipe.totalTime;
      const numMatch = rawTime.match(/\d+/);
      const minutes = numMatch ? parseInt(numMatch[0], 10) : 25;
      const durationSeconds = minutes * 60;

      await cookingTimerService.startTimer({
        durationSeconds,
        recipeName: recipe.dishName,
        recipeId: recipe.id,
        currentStepIndex: 0,
        totalSteps: recipe.steps.length,
      });

      setTimerStarted(true);
      if (Platform.OS !== 'web') {
        Alert.alert('⏱️ Minuteur Démarré', `Minuteur de cuisson réglé sur ${minutes} minutes.`);
      }
      setTimeout(() => {
        setTimerStarted(false);
      }, 5000);
    } catch (e) {
      console.error('Erreur démarrage minuteur:', e);
    }
  };

  // Lecture audio expressive de la recette (Voix Gemini Live / Naturelle)
  const handleReadRecipe = () => {
    if (isSpeaking) {
      expressiveVoiceService.stop();
      setIsSpeaking(false);
      return;
    }

    const stepsText = recipe.steps.map((s, idx) => `Étape ${idx + 1} : ${s}`).join('. ');
    const chefNarration = `Ah, voici une excellente recette du terroir pour vous régaler : ${recipe.dishName}, spécialité de ${recipe.region} ! Temps de préparation : ${recipe.totalTime}. ${stepsText}. Et pour finir, mon astuce de chef : ${recipe.chefTip || 'Cuisinez avec passion et régalez-vous !'}`;

    expressiveVoiceService.speak({
      text: chefNarration,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
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

      {/* 2. Main Title & Quick Audio button */}
      <View style={styles.titleSection}>
        <View style={{ flex: 1 }}>
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

        <TouchableOpacity
          style={[
            styles.voicePillBtn,
            isSpeaking && styles.voicePillBtnActive,
            {
              backgroundColor: isDark
                ? isSpeaking ? AppColors.primary : 'rgba(255,255,255,0.08)'
                : isSpeaking ? AppColors.primary : '#F5F3EF',
            },
          ]}
          onPress={handleReadRecipe}
          accessibilityLabel="Écouter la recette"
        >
          {isSpeaking ? (
            <VolumeX size={14} color="#FFFFFF" strokeWidth={2.5} />
          ) : (
            <Volume2 size={14} color={AppColors.primary} strokeWidth={2.5} />
          )}
          <Text
            style={[
              styles.voicePillText,
              { color: isSpeaking ? '#FFFFFF' : AppColors.primary },
            ]}
          >
            {isSpeaking ? 'Stop' : 'Écouter'}
          </Text>
        </TouchableOpacity>
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

      {/* 5b. Accord Boisson Locale */}
      {recipe.wineOrDrinkPairing && (
        <View
          style={[
            styles.drinkPairingBox,
            {
              backgroundColor: isDark ? 'rgba(234, 88, 12, 0.10)' : '#FFF7ED',
              borderColor: isDark ? 'rgba(234, 88, 12, 0.28)' : '#FFEDD5',
            },
          ]}
        >
          <GlassWater size={14} color="#EA580C" />
          <Text
            style={[
              styles.drinkPairingText,
              { color: isDark ? '#FED7AA' : '#9A3412' },
            ]}
          >
            <Text style={{ fontWeight: '700' }}>Accord Boisson du Terroir : </Text>
            {recipe.wineOrDrinkPairing}
          </Text>
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

      {/* 7. Barre d'Actions Intelligentes (Minuteur, Sauvegarde, Panier) */}
      <View style={styles.actionsFooter}>
        {/* Minuteur */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.timerBtn,
            timerStarted && styles.timerBtnActive,
            {
              borderColor: timerStarted
                ? '#16A34A'
                : isDark
                ? AppColors.borderDark
                : '#E2DFD8',
            },
          ]}
          activeOpacity={0.82}
          onPress={handleStartTimer}
        >
          <Timer
            size={15}
            color={timerStarted ? '#16A34A' : AppColors.primary}
            strokeWidth={2.4}
          />
          <Text
            style={[
              styles.actionBtnText,
              {
                color: timerStarted
                  ? '#16A34A'
                  : isDark
                  ? '#F0EDE6'
                  : AppColors.textPrimary,
                fontWeight: timerStarted ? '800' : '600',
              },
            ]}
          >
            {timerStarted ? 'Chrono lancé !' : 'Minuteur'}
          </Text>
        </TouchableOpacity>

        {/* Sauvegarder */}
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
            size={15}
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

        {/* Panier */}
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
              <Check size={15} color="#FFFFFF" strokeWidth={2.8} />
              <Text style={styles.cartBtnText}>Ajouté !</Text>
            </>
          ) : (
            <>
              <ShoppingCart size={15} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.cartBtnText}>Courses</Text>
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
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  diffBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  regionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  regionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#73706B',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  dishTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  categorySub: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
    marginTop: 2,
  },
  voicePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  voicePillBtnActive: {
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  voicePillText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  ingredientsSection: {
    gap: 6,
  },
  sectionHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  ingredientsContainer: {
    gap: 6,
  },
  ingredientGroup: {
    gap: 5,
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
  drinkPairingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  drinkPairingText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
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
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 13,
    gap: 5,
  },
  timerBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
  },
  timerBtnActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  saveBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
  },
  saveBtnActive: {
    backgroundColor: 'rgba(251, 86, 7, 0.08)',
  },
  actionBtnText: {
    fontSize: 11.5,
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
    fontSize: 11.5,
    fontWeight: '800',
  },
});
