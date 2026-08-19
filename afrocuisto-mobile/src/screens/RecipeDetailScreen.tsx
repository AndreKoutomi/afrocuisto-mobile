import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Share,
  Vibration,
  Animated,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Bookmark,
  Star,
  Clock,
  Flame,
  Users,
  Layers,
  ChefHat,
  Utensils,
  Plus,
  Minus,
  Sparkles,
  Lightbulb,
  BookOpen,
  ShoppingBag,
  Share2,
  Play,
  Pause,
  RotateCcw,
  GlassWater,
  Heart,
  CheckCircle2,
  Activity,
  Award,
  Zap,
  X,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe } from '../types/recipe';
import { useRecipes } from '../context/RecipeContext';
import { useShopping } from '../context/ShoppingContext';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../theme/colors';
import { getImageSource } from '../utils/imageHelper';
import { Checkbox } from '../components/common/Checkbox';
import { AnimatedTabs, AnimatedTabContent } from '../components/common/AnimatedTabs';
import { FavoriteIconButton } from '../components/common/FavoriteIconButton';
import { RecipeDetailSkeleton } from '../components/common/Skeletons';
import { CookModeModal } from '../components/recipe/CookModeModal';
import { scaleQuantity, getNutritionEstimate, getDrinkPairing } from '../utils/recipeScaling';
import { useCookingTimer } from '../context/CookingTimerContext';
import { MorphIcon, Play as LucidePlay, Pause as LucidePause } from '../components/common/MorphIcon';
import { GlowEffect } from '../components/core/glow-effect';
import { RecipeVideoSection } from '../components/recipe/RecipeVideoSection';

export const RecipeDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const recipe: Recipe = route.params?.recipe;

  const { isFavorite, toggleFavorite } = useRecipes();
  const { addIngredients } = useShopping();
  const { isDark } = useTheme();

  const [pageLoading, setPageLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'nutrition'>('ingredients');
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [addedToCart, setAddedToCart] = useState(false);

  // Advanced Cooking State
  const [servings, setServings] = useState<number>(4);
  const [isCookModeVisible, setIsCookModeVisible] = useState(false);
  const [isCustomServingsModalOpen, setIsCustomServingsModalOpen] = useState(false);
  const [customServingsInput, setCustomServingsInput] = useState<string>('4');

  const handleOpenCustomServingsModal = () => {
    setCustomServingsInput(servings.toString());
    setIsCustomServingsModalOpen(true);
  };

  const handleAdjustCustomServings = (delta: number) => {
    const current = parseInt(customServingsInput, 10) || servings || 4;
    const next = Math.max(1, Math.min(50, current + delta));
    setCustomServingsInput(next.toString());
  };

  const handleConfirmCustomServings = () => {
    const parsed = parseInt(customServingsInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setServings(Math.min(parsed, 50));
    }
    setIsCustomServingsModalOpen(false);
  };

  // Global Foreground Cooking Timer Integration
  const {
    timerSeconds: globalTimerSeconds,
    formattedTime: globalFormattedTime,
    isRunning: isGlobalTimerRunning,
    isPaused: isGlobalTimerPaused,
    recipeId: activeTimerRecipeId,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useCookingTimer();

  const isThisRecipeTimer = isGlobalTimerRunning && activeTimerRecipeId === recipe?.id;

  const defaultCookTimeMinutes = (() => {
    const rawCook = recipe?.cookTime || '30 min';
    const num = parseInt(rawCook.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 30 : num;
  })();

  const handleToggleInPageTimer = () => {
    if (isThisRecipeTimer) {
      if (isGlobalTimerPaused) {
        resumeTimer();
      } else {
        pauseTimer();
      }
    } else {
      startTimer({
        durationSeconds: defaultCookTimeMinutes * 60,
        recipeName: recipe.name,
        recipeId: recipe.id,
        recipeImage: recipe.image,
        currentStepIndex: 0,
        totalSteps: recipe.steps?.length || 0,
      });
    }
  };

  const handleResetInPageTimer = () => {
    stopTimer();
  };

  // 🌟 Animation d'onde de lueur pulsée multidirectionnelle façon Gemini Live pour Assistant Chef
  const geminiWaveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(geminiWaveAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: false,
        }),
        Animated.timing(geminiWaveAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Injection CSS pour le web (OpenUI / Expo Web) - Effet de vague multidirectionnelle Gemini Live
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'assistant-chef-glow-style';
      let style = document.getElementById(styleId) as HTMLStyleElement;
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = `
        @keyframes geminiWaveMulti {
          0%, 100% {
            box-shadow: 
              0 0 14px 2px rgba(235, 87, 87, 0.28),
              0 0 28px 6px rgba(251, 86, 7, 0.2),
              0 0 45px 10px rgba(245, 158, 11, 0.12);
          }
          50% {
            box-shadow: 
              0 0 26px 8px rgba(235, 87, 87, 0.65),
              0 0 50px 16px rgba(251, 86, 7, 0.45),
              0 0 72px 24px rgba(245, 158, 11, 0.28);
          }
        }
        .assistant-chef-glow {
          animation: geminiWaveMulti 2.2s ease-in-out infinite !important;
          border-radius: 24px !important;
        }
      `;
    }
  }, []);

  if (!recipe) return null;
  const isFav = isFavorite(recipe.id);

  if (pageLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
          },
        ]}
      >
        <RecipeDetailSkeleton />
      </View>
    );
  }

  const selectedIngredientIndexes = Object.keys(checkedIngredients)
    .map(Number)
    .filter(idx => !!checkedIngredients[idx]);
  const selectedCount = selectedIngredientIndexes.length;

  const toggleIngredientCheck = (index: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleStepComplete = (index: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const servingsRatio = servings / 4;

  const handleAddAllToCart = async () => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return;
    // Map with scaled quantities
    const scaledIngredients = recipe.ingredients.map(ing => ({
      ...ing,
      quantity: scaleQuantity(ing.quantity, servingsRatio),
    }));
    await addIngredients({ ...recipe, ingredients: scaledIngredients });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleAddSelectedToCart = async () => {
    if (selectedCount === 0 || !recipe.ingredients) return;
    const selectedList = selectedIngredientIndexes
      .map(idx => recipe.ingredients[idx])
      .filter(Boolean)
      .map(ing => ({
        ...ing,
        quantity: scaleQuantity(ing.quantity, servingsRatio),
      }));
    await addIngredients(recipe, selectedList);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleShareRecipe = async () => {
    try {
      const ingList = (recipe.ingredients || [])
        .map(i => {
          const scaled = scaleQuantity(i.quantity, servingsRatio);
          const cleanUnit = i.unit && !scaled.toLowerCase().endsWith(i.unit.toLowerCase()) ? i.unit : '';
          const qtyText = [scaled, cleanUnit].filter(Boolean).join(' ');
          return `• ${i.name}${qtyText ? ` : ${qtyText}` : ''}`.trim();
        })
        .join('\n');

      const stepsList = (recipe.steps || [])
        .map((s, i) => `${i + 1}. ${s}`)
        .join('\n');

      const message = `🍲 Recette AfroCuisto : ${recipe.name} (${recipe.region})\n` +
        `⏱ Prépa : ${recipe.prepTime} | Cuisson : ${recipe.cookTime} | Pour : ${servings} personnes\n\n` +
        `🛒 Ingrédients :\n${ingList}\n\n` +
        `👨🏾‍🍳 Préparation :\n${stepsList}\n\n` +
        `Découvrez plus de recettes authentiques sur AfroCuisto !`;

      await Share.share({
        title: recipe.name,
        message,
      });
    } catch (error) {
      console.warn('Share error', error);
    }
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Parsing numbers & units for characteristic capsules
  const rawPrep = recipe.prepTime || '20 min';
  const prepNumber = rawPrep.replace(/[^0-9]/g, '') || '20';
  const prepUnit = rawPrep.toLowerCase().includes('h') ? 'heures' : 'mins';

  const rawCook = recipe.cookTime || '30 min';
  const cookNumber = rawCook.replace(/[^0-9]/g, '') || '30';
  const cookUnit = rawCook.toLowerCase().includes('h') ? 'heures' : 'mins';

  const difficultyVal = recipe.difficulty || 'Moyen';
  const ratingVal = recipe.rating ? recipe.rating.toFixed(1) : '4.8';

  const nutrition = getNutritionEstimate(recipe);
  const drinkPairing = getDrinkPairing(recipe);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Hero Image Banner & Header Actions */}
        <View style={styles.heroWrapper}>
          <Image
            source={getImageSource(recipe.image)}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.3)']}
            locations={[0.0, 0.5, 1.0]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top Bar Buttons (scrolls with the page) */}
          <View
            style={[
              styles.floatingHeader,
              { top: insets.top + (Platform.OS === 'ios' ? 8 : 12) },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.circleActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(30, 28, 26, 0.90)' : 'rgba(255, 255, 255, 0.92)',
                  borderColor: isDark ? '#2E2C29' : 'rgba(255, 255, 255, 0.6)',
                },
              ]}
              activeOpacity={0.85}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft
                size={22}
                color={isDark ? '#FFFFFF' : AppColors.textPrimary}
                strokeWidth={2.4}
              />
            </TouchableOpacity>

            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={[
                  styles.circleActionBtn,
                  {
                    backgroundColor: isDark ? 'rgba(30, 28, 26, 0.90)' : 'rgba(255, 255, 255, 0.92)',
                    borderColor: isDark ? '#2E2C29' : 'rgba(255, 255, 255, 0.6)',
                  },
                ]}
                activeOpacity={0.85}
                onPress={handleShareRecipe}
              >
                <Share2
                  size={19}
                  color={isDark ? '#FFFFFF' : AppColors.textPrimary}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>

              <FavoriteIconButton
                isFavorite={isFav}
                onToggle={() => toggleFavorite(recipe.id)}
                size={44}
                iconSize={20}
                iconType="bookmark"
                activeColor={AppColors.primary}
                inactiveColor={isDark ? '#FFFFFF' : AppColors.textPrimary}
                activeBgColor={isDark ? 'rgba(46, 32, 28, 0.95)' : '#FFF2EE'}
                inactiveBgColor={isDark ? 'rgba(30, 28, 26, 0.90)' : 'rgba(255, 255, 255, 0.92)'}
                showBorder
                borderColor={
                  isFav
                    ? isDark
                      ? '#5A352B'
                      : '#FFD5CC'
                    : isDark
                    ? '#2E2C29'
                    : 'rgba(255, 255, 255, 0.6)'
                }
              />
            </View>
          </View>
        </View>

        {/* 3. Main Overlapping Content Sheet */}
        <View
          style={[
            styles.contentCard,
            {
              backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
            },
          ]}
        >
          {/* Centered Drag Indicator */}
          <View
            style={[
              styles.dragIndicator,
              { backgroundColor: isDark ? '#2E2C29' : '#E2DFD8' },
            ]}
          />

          {/* Header Row: Title, Subtitle, and Star Rating Badge */}
          <View style={styles.headerRow}>
            <View style={styles.titleCol}>
              <Text
                style={[
                  styles.recipeTitle,
                  { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                ]}
              >
                {recipe.name}
              </Text>
              <Text
                style={[
                  styles.recipeSubtitle,
                  { color: isDark ? '#A8A29E' : '#73706B' },
                ]}
              >
                {recipe.region ? `${recipe.region} • ` : ''}
                {recipe.category || 'Recette Traditionnelle'}
              </Text>
            </View>

            {/* Rating Badge (Golden Amber) */}
            <View style={styles.ratingBadge}>
              <Star size={15} color="#D97706" fill="#F59E0B" />
              <Text style={styles.ratingText}>{ratingVal}</Text>
            </View>
          </View>

          {/* 4. Four Characteristic Stat Badges */}
          <View style={styles.statsRow}>
            {/* Stat 1: Préparation */}
            <View
              style={[
                styles.statCapsule,
                {
                  backgroundColor: isDark ? '#26201D' : '#FFF2EE',
                  borderColor: isDark ? '#3D2C27' : '#FFE5DF',
                },
              ]}
            >
              <View
                style={[
                  styles.statIconCircle,
                  { backgroundColor: isDark ? '#1C1A18' : '#FFFFFF' },
                ]}
              >
                <Clock size={18} color={AppColors.primary} />
              </View>
              <Text
                style={[
                  styles.statValue,
                  { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                ]}
              >
                {prepNumber}
              </Text>
              <Text
                style={[
                  styles.statUnit,
                  { color: isDark ? '#A8A29E' : '#8C8A87' },
                ]}
              >
                {prepUnit}
              </Text>
            </View>

            {/* Stat 2: Cuisson */}
            <View
              style={[
                styles.statCapsule,
                {
                  backgroundColor: isDark ? '#26201D' : '#FFF2EE',
                  borderColor: isDark ? '#3D2C27' : '#FFE5DF',
                },
              ]}
            >
              <View
                style={[
                  styles.statIconCircle,
                  { backgroundColor: isDark ? '#1C1A18' : '#FFFFFF' },
                ]}
              >
                <Flame size={18} color={AppColors.primary} />
              </View>
              <Text
                style={[
                  styles.statValue,
                  { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                ]}
              >
                {cookNumber}
              </Text>
              <Text
                style={[
                  styles.statUnit,
                  { color: isDark ? '#A8A29E' : '#8C8A87' },
                ]}
              >
                {cookUnit}
              </Text>
            </View>

            {/* Stat 3: Portions */}
            <View
              style={[
                styles.statCapsule,
                {
                  backgroundColor: isDark ? '#26201D' : '#FFF2EE',
                  borderColor: isDark ? '#3D2C27' : '#FFE5DF',
                },
              ]}
            >
              <View
                style={[
                  styles.statIconCircle,
                  { backgroundColor: isDark ? '#1C1A18' : '#FFFFFF' },
                ]}
              >
                <Users size={18} color={AppColors.primary} />
              </View>
              <Text
                style={[
                  styles.statValue,
                  { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                ]}
              >
                {servings}
              </Text>
              <Text
                style={[
                  styles.statUnit,
                  { color: isDark ? '#A8A29E' : '#8C8A87' },
                ]}
              >
                pers.
              </Text>
            </View>

            {/* Stat 4: Niveau */}
            <View
              style={[
                styles.statCapsule,
                {
                  backgroundColor: isDark ? '#26201D' : '#FFF2EE',
                  borderColor: isDark ? '#3D2C27' : '#FFE5DF',
                },
              ]}
            >
              <View
                style={[
                  styles.statIconCircle,
                  { backgroundColor: isDark ? '#1C1A18' : '#FFFFFF' },
                ]}
              >
                <Layers size={18} color={AppColors.primary} />
              </View>
              <Text
                style={[
                  styles.statValue,
                  { fontSize: 11, color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {difficultyVal}
              </Text>
              <Text
                style={[
                  styles.statUnit,
                  { color: isDark ? '#A8A29E' : '#8C8A87' },
                ]}
              >
                Niveau
              </Text>
            </View>
          </View>

          {/* 🌟 BANNIÈRE ASSISTANT CHEF — GlowEffect diffus sur les 4 côtés */}
          {/*
            Architecture :
            - outerPad : ajoute de l'espace pour que le glow soit visible en haut/bas
            - assistantChefGlowContainer : position:relative, overflow:visible
            - GlowEffect : absolute, top/left/right/bottom négatifs => dépasse vers l'extérieur
            - TouchableOpacity : rendu après GlowEffect dans le DOM => par-dessus
          */}
          <View style={styles.assistantChefOuterPad}>
            <View style={styles.assistantChefGlowContainer}>
              <GlowEffect
                colors={['#FF5733', '#33FF57', '#3357FF', '#F1C40F']}
                mode="colorShift"
                blur="soft"
                duration={3}
                scale={0.9}
              />
              <TouchableOpacity
                style={styles.cookModeHeroBanner}
                onPress={() => setIsCookModeVisible(true)}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={isDark ? ['#381E15', '#24140E'] : ['#FFF7ED', '#FFEDD5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.cookModeLeft}>
                  <View style={styles.cookModeIconWrap}>
                    <ChefHat size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.cookModeTextCol}>
                    <View style={styles.cookModeBadgeRow}>
                      <Text style={styles.cookModeBadge}>ASSISTANT CHEF</Text>
                      <Sparkles size={13} color="#EA580C" />
                    </View>
                    <Text
                      style={[
                        styles.cookModeTitle,
                        { color: isDark ? '#FFFFFF' : '#7C2D12' },
                      ]}
                    >
                      Lancer le Mode Cuisine
                    </Text>
                    <Text style={styles.cookModeSubtitle}>
                      Guide pas-à-pas en plein écran & minuteur mains-libres
                    </Text>
                  </View>
                </View>

                <View style={styles.cookModePlayPill}>
                  <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. Description & Histoire culinaire */}
          {recipe.description && (
            <View
              style={[
                styles.storyCard,
                {
                  backgroundColor: isDark ? '#211F1D' : '#FAF8F5',
                  borderColor: isDark ? '#2E2C29' : '#ECE8E1',
                },
              ]}
            >
              <View style={styles.storyHeader}>
                <BookOpen size={16} color={AppColors.primary} />
                <Text style={[styles.storyTitle, { color: AppColors.primary }]}>
                  À propos de ce plat
                </Text>
              </View>
              <Text
                style={[
                  styles.storyBodyText,
                  { color: isDark ? '#D6D3D1' : '#57534E' },
                ]}
              >
                {recipe.description}
              </Text>
            </View>
          )}

          {/* 6. Secrets du Chef */}
          {recipe.techniqueTitle && (
            <View
              style={[
                styles.tipCard,
                {
                  backgroundColor: isDark ? '#26201D' : '#FFF2EE',
                  borderColor: isDark ? '#3D2C27' : '#FFDCD3',
                },
              ]}
            >
              <View style={styles.tipHeader}>
                <Sparkles size={16} color={AppColors.primary} />
                <Text style={[styles.tipTitle, { color: AppColors.primary }]}>
                  {recipe.techniqueTitle}
                </Text>
              </View>
              <Text
                style={[
                  styles.tipBody,
                  { color: isDark ? '#D6D3D1' : '#49454F' },
                ]}
              >
                {recipe.techniqueDescription}
              </Text>
            </View>
          )}

          {/* 7. Substituts en Diaspora */}
          {recipe.diasporaSubstitutes && (
            <View
              style={[
                styles.tipCard,
                {
                  backgroundColor: isDark ? '#26201D' : '#FEF3C7',
                  borderColor: isDark ? '#3D2C27' : '#FDE68A',
                },
              ]}
            >
              <View style={styles.tipHeader}>
                <Lightbulb size={16} color="#B45309" />
                <Text style={[styles.tipTitle, { color: '#92400E' }]}>
                  Astuce pour la Diaspora
                </Text>
              </View>
              <Text
                style={[
                  styles.tipBody,
                  { color: isDark ? '#D6D3D1' : '#78350F' },
                ]}
              >
                {recipe.diasporaSubstitutes}
              </Text>
            </View>
          )}

          {/* 8. Sélecteur d'onglets Ingrédients / Préparation / Nutrition */}
          <AnimatedTabs
            activeTab={activeTab}
            onTabChange={key => setActiveTab(key as any)}
            tabs={[
              {
                key: 'ingredients',
                label: 'Ingrédients',
                count: recipe.ingredients?.length || 0,
              },
              {
                key: 'steps',
                label: 'Étapes',
                count: recipe.steps?.length || 0,
              },
              {
                key: 'nutrition',
                label: 'Nutrition & Accords',
              },
            ]}
          />

          {/* 9. Contenu animé des onglets */}
          <AnimatedTabContent tabKey={activeTab}>
            {activeTab === 'ingredients' ? (
              <View style={styles.tabSection}>
                {/* 🎚 SÉLECTEUR DE PORTIONS INTELLIGENT */}
                <View
                  style={[
                    styles.portionControlCard,
                    {
                      backgroundColor: isDark ? '#211F1D' : '#F9F8F6',
                      borderColor: isDark ? '#2E2C29' : '#ECE8E1',
                    },
                  ]}
                >
                  <View style={styles.portionLeft}>
                    <Text
                      style={[
                        styles.portionTitle,
                        { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                      ]}
                    >
                      Portions adaptées
                    </Text>
                    <Text style={styles.portionSubtitle}>
                      {servings === 4
                        ? 'Quantités de base pour 4 personnes'
                        : `Ingrédients recalculés pour ${servings} personnes`}
                    </Text>
                  </View>

                  {/* Buttons 2, 4, 6 pers + Custom '+' button */}
                  <View style={styles.portionPillsRow}>
                    {[2, 4, 6].map(p => {
                      const isSelected = servings === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.portionPill,
                            isSelected && styles.portionPillActive,
                            {
                              backgroundColor: isSelected
                                ? AppColors.primary
                                : isDark
                                ? '#2D2925'
                                : '#FFFFFF',
                              borderColor: isSelected
                                ? AppColors.primary
                                : isDark
                                ? '#3D3833'
                                : '#E5E7EB',
                            },
                          ]}
                          onPress={() => setServings(p)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.portionPillText,
                              {
                                color: isSelected
                                  ? '#FFFFFF'
                                  : isDark
                                  ? '#D1D5DB'
                                  : '#374151',
                              },
                            ]}
                          >
                            {p}p
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Bouton '+' pour personnaliser le nombre de personnes */}
                    {(() => {
                      const isCustomActive = ![2, 4, 6].includes(servings);
                      return (
                        <TouchableOpacity
                          style={[
                            styles.portionPill,
                            isCustomActive && styles.portionPillActive,
                            {
                              backgroundColor: isCustomActive
                                ? AppColors.primary
                                : isDark
                                ? '#2D2925'
                                : '#FFFFFF',
                              borderColor: isCustomActive
                                ? AppColors.primary
                                : isDark
                                ? '#3D3833'
                                : '#E5E7EB',
                              minWidth: 42,
                            },
                          ]}
                          onPress={handleOpenCustomServingsModal}
                          activeOpacity={0.8}
                          accessibilityLabel="Personnaliser les portions"
                        >
                          {isCustomActive ? (
                            <Text
                              style={[
                                styles.portionPillText,
                                {
                                  color: '#FFFFFF',
                                },
                              ]}
                            >
                              {servings}p
                            </Text>
                          ) : (
                            <Plus
                              size={15}
                              strokeWidth={2.6}
                              color={isDark ? '#D1D5DB' : '#374151'}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                </View>

                {/* Header Action Row */}
                <View style={styles.ingredientsHeaderRow}>
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                    ]}
                  >
                    Ingrédients nécessaires ({recipe.ingredients?.length || 0})
                  </Text>
                  <TouchableOpacity
                    style={styles.addCartLink}
                    activeOpacity={0.7}
                    onPress={handleAddAllToCart}
                  >
                    <Plus size={14} color={AppColors.primary} />
                    <Text style={styles.addCartLinkText}>
                      {addedToCart ? '✓ Ajoutés !' : 'Tout ajouter'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Ingredients List with Scaled Quantities */}
                {recipe.ingredients?.map((ing, idx) => {
                  const isChecked = !!checkedIngredients[idx];
                  const scaledQty = scaleQuantity(ing.quantity, servingsRatio);
                  const cleanUnit = ing.unit && !scaledQty.toLowerCase().endsWith(ing.unit.toLowerCase()) ? ing.unit : '';
                  const amountText = [scaledQty, cleanUnit].filter(Boolean).join(' ');

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.ingredientItem,
                        {
                          backgroundColor: isDark
                            ? isChecked
                              ? '#2C1E1A'
                              : '#211F1D'
                            : isChecked
                            ? '#FFF5F2'
                            : '#FFFFFF',
                          borderColor: isDark
                            ? isChecked
                              ? '#4D2C22'
                              : '#2E2C29'
                            : isChecked
                            ? '#FFD5CC'
                            : '#ECE6F0',
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => toggleIngredientCheck(idx)}
                    >
                      <View style={styles.ingredientLeft}>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleIngredientCheck(idx)}
                          variant="primary"
                          size="md"
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.ingredientName,
                              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                              isChecked && {
                                color: isDark ? '#A8A29E' : '#9CA3AF',
                                textDecorationLine: 'line-through',
                              },
                            ]}
                          >
                            {ing.name}
                          </Text>
                          {ing.note && (
                            <Text style={styles.ingredientNoteText}>{ing.note}</Text>
                          )}
                        </View>
                      </View>

                      {amountText.length > 0 && (
                        <View
                          style={[
                            styles.amountPill,
                            {
                              backgroundColor: isDark ? '#2E2C29' : '#FFF2EE',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.amountText,
                              { color: isDark ? '#FFFFFF' : AppColors.primaryDark },
                            ]}
                          >
                            {amountText}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : activeTab === 'steps' ? (
              <View style={styles.tabSection}>
                {/* ⏱ MINUTEUR DE CUISINE RAPIDE INTÉGRÉ */}
                <View
                  style={[
                    styles.inPageTimerCard,
                    {
                      backgroundColor: isDark ? '#1F1B18' : '#FFF7F2',
                      borderColor: isDark ? '#3D2D24' : '#FED7AA',
                    },
                  ]}
                >
                  <View style={styles.inPageTimerLeft}>
                    <View style={styles.inPageTimerIconCircle}>
                      <Clock size={16} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={[styles.inPageTimerTitle, { color: isDark ? '#FFFFFF' : '#7C2D12' }]}>
                        Minuteur de Cuisson
                      </Text>
                      <Text style={styles.inPageTimerCountdown}>
                        {isThisRecipeTimer ? globalFormattedTime : formatTimer(defaultCookTimeMinutes * 60)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inPageTimerBtns}>
                    <TouchableOpacity
                      style={[
                        styles.inPageTimerPlayBtn,
                        { backgroundColor: isThisRecipeTimer && !isGlobalTimerPaused ? '#EA580C' : AppColors.primary },
                      ]}
                      onPress={handleToggleInPageTimer}
                      activeOpacity={0.85}
                    >
                      <MorphIcon
                        icon={isThisRecipeTimer && !isGlobalTimerPaused ? LucidePause : LucidePlay}
                        size={15}
                        color="#FFFFFF"
                        strokeWidth={2.4}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.inPageTimerResetBtn,
                        {
                          backgroundColor: isDark ? '#2A2622' : '#FFFFFF',
                          borderColor: isDark ? '#3E3933' : '#E5E7EB',
                        },
                      ]}
                      onPress={handleResetInPageTimer}
                      activeOpacity={0.8}
                    >
                      <RotateCcw size={14} color={isDark ? '#D1D5DB' : '#4B5563'} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.stepsHeaderRow}>
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                    ]}
                  >
                    Guide pas à pas ({recipe.steps?.length || 0} étapes)
                  </Text>
                </View>

                {recipe.steps?.map((stepText, idx) => {
                  const isStepDone = !!completedSteps[idx];

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.stepCard,
                        {
                          backgroundColor: isDark ? '#211F1D' : '#FFFFFF',
                          borderColor: isDark ? '#2E2C29' : '#ECE6F0',
                        },
                        isStepDone && styles.stepCardDone,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => toggleStepComplete(idx)}
                    >
                      <View style={styles.stepHeader}>
                        <View
                          style={[
                            styles.stepBadge,
                            { backgroundColor: AppColors.primary },
                            isStepDone && { backgroundColor: '#22C55E' },
                          ]}
                        >
                          <Text style={styles.stepBadgeText}>
                            {isStepDone ? '✓' : `${idx + 1}`}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.stepTitle,
                            { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                          ]}
                        >
                          Étape {idx + 1}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.stepDescription,
                          { color: isDark ? '#D6D3D1' : '#49454F' },
                          isStepDone && styles.checkedText,
                        ]}
                      >
                        {stepText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              /* TAB NUTRITION & ACCORDS CULINAIRES (NOUVEAU) */
              <View style={styles.tabSection}>
                {/* 1. Carte Macros & Énergie */}
                <View
                  style={[
                    styles.nutritionCard,
                    {
                      backgroundColor: isDark ? '#211F1D' : '#FFFFFF',
                      borderColor: isDark ? '#2E2C29' : '#ECE6F0',
                    },
                  ]}
                >
                  <View style={styles.nutritionHeader}>
                    <View style={styles.nutritionTitleRow}>
                      <Activity size={18} color={AppColors.primary} />
                      <Text
                        style={[
                          styles.nutritionHeading,
                          { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                        ]}
                      >
                        Valeurs Nutritionnelles
                      </Text>
                    </View>
                    <View style={styles.nutriScoreBadge}>
                      <Award size={13} color="#FFFFFF" />
                      <Text style={styles.nutriScoreText}>Score {nutrition.score}</Text>
                    </View>
                  </View>
                  <Text style={styles.nutritionSubtitle}>
                    Estimations moyennes par portion de {recipe.name}
                  </Text>

                  {/* 4 Macro Capsules */}
                  <View style={styles.macroGrid}>
                    <View style={[styles.macroBox, { backgroundColor: isDark ? '#291E19' : '#FFF7ED' }]}>
                      <Flame size={16} color="#EA580C" />
                      <Text style={[styles.macroVal, { color: isDark ? '#FFFFFF' : '#9A3412' }]}>
                        {nutrition.calories}
                      </Text>
                      <Text style={styles.macroLabel}>Calories</Text>
                    </View>

                    <View style={[styles.macroBox, { backgroundColor: isDark ? '#192621' : '#ECFDF5' }]}>
                      <Zap size={16} color="#059669" />
                      <Text style={[styles.macroVal, { color: isDark ? '#FFFFFF' : '#065F46' }]}>
                        {nutrition.proteins} g
                      </Text>
                      <Text style={styles.macroLabel}>Protéines</Text>
                    </View>

                    <View style={[styles.macroBox, { backgroundColor: isDark ? '#262419' : '#FEFCE8' }]}>
                      <Utensils size={16} color="#CA8A04" />
                      <Text style={[styles.macroVal, { color: isDark ? '#FFFFFF' : '#854D0E' }]}>
                        {nutrition.carbs} g
                      </Text>
                      <Text style={styles.macroLabel}>Glucides</Text>
                    </View>

                    <View style={[styles.macroBox, { backgroundColor: isDark ? '#231B26' : '#FAF5FF' }]}>
                      <Heart size={16} color="#9333EA" />
                      <Text style={[styles.macroVal, { color: isDark ? '#FFFFFF' : '#6B21A8' }]}>
                        {nutrition.fiber} g
                      </Text>
                      <Text style={styles.macroLabel}>Fibres</Text>
                    </View>
                  </View>
                </View>

                {/* 2. Accord Boisson Traditionnelle */}
                <View
                  style={[
                    styles.pairingCard,
                    {
                      backgroundColor: isDark ? '#1C1A18' : '#FAF8F5',
                      borderColor: isDark ? '#2E2C29' : '#ECE8E1',
                    },
                  ]}
                >
                  <View style={styles.pairingHeader}>
                    <Text style={styles.pairingEmoji}>{drinkPairing.iconEmoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pairingBadge, { color: AppColors.primary }]}>
                        ACCORD BOISSON IDÉAL
                      </Text>
                      <Text
                        style={[
                          styles.pairingTitle,
                          { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                        ]}
                      >
                        {drinkPairing.name}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.pairingDesc,
                      { color: isDark ? '#D6D3D1' : '#57534E' },
                    ]}
                  >
                    {drinkPairing.desc}
                  </Text>
                </View>

                {/* 3. Accompagnements Suggérés */}
                {recipe.suggestedSides && recipe.suggestedSides.length > 0 && (
                  <View
                    style={[
                      styles.sidesCard,
                      {
                        backgroundColor: isDark ? '#211F1D' : '#FFFFFF',
                        borderColor: isDark ? '#2E2C29' : '#ECE8E1',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sidesTitle,
                        { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                      ]}
                    >
                      Accompagnements Authentiques Recommandés
                    </Text>
                    <View style={styles.sidesPillsRow}>
                      {recipe.suggestedSides.map((side, sIdx) => (
                        <View
                          key={sIdx}
                          style={[
                            styles.sidePill,
                            {
                              backgroundColor: isDark ? '#2C2723' : '#FFF2EE',
                              borderColor: isDark ? '#3E3731' : '#FFD5CC',
                            },
                          ]}
                        >
                          <Text style={[styles.sidePillText, { color: AppColors.primary }]}>
                            {side}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </AnimatedTabContent>

          {/* 10. Section Vidéo YouTube In-App Intelligente (en bas de page) */}
          <RecipeVideoSection recipe={recipe} isDark={isDark} />
        </View>
      </ScrollView>

      {/* 11. Barre d'action inférieure flottante */}
      {selectedCount > 0 && (
        <View
          style={[
            styles.bottomActionBar,
            {
              backgroundColor: isDark ? '#1C1A18' : '#FFFFFF',
              borderTopColor: isDark ? '#2E2C29' : '#ECE8E1',
              paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 6 : 10),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryActionButton}
            activeOpacity={0.88}
            onPress={handleAddSelectedToCart}
          >
            <ShoppingBag size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>
              {addedToCart
                ? (selectedCount === 1 ? 'Ingrédient ajouté aux courses !' : 'Ingrédients ajoutés aux courses !')
                : selectedCount === 1
                ? 'Ajouter 1 ingrédient aux courses'
                : `Ajouter les ${selectedCount} ingrédients aux courses`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL DU MODE CUISINE ASSISTÉ PAS-À-PAS */}
      <CookModeModal
        visible={isCookModeVisible}
        onClose={() => setIsCookModeVisible(false)}
        recipe={recipe}
        servings={servings}
        isDark={isDark}
      />

      {/* MODALE DE PERSONNALISATION DU NOMBRE DE PERSONNES */}
      <Modal
        visible={isCustomServingsModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCustomServingsModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.customServingsModalBackdrop}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsCustomServingsModalOpen(false)}
          />
          <View
            style={[
              styles.customServingsModalCard,
              {
                backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
                borderColor: isDark ? '#332F2B' : '#ECE8E1',
              },
            ]}
          >
            <View style={styles.customServingsHeader}>
              <View
                style={[
                  styles.customServingsIconCircle,
                  { backgroundColor: isDark ? '#2D2925' : '#FFF5EE' },
                ]}
              >
                <Users size={20} color={AppColors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.customServingsTitle,
                    { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                  ]}
                >
                  Nombre de convives
                </Text>
                <Text style={styles.customServingsSubtitle}>
                  Ajustez les portions pour recalculer les ingrédients
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCustomServingsModalOpen(false)}
                style={styles.customServingsCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            {/* Stepper + Saisie numérique */}
            <View style={styles.customServingsInputRow}>
              <TouchableOpacity
                style={[
                  styles.customServingsStepBtn,
                  {
                    backgroundColor: isDark ? '#2D2925' : '#F3F4F6',
                    borderColor: isDark ? '#3D3833' : '#E5E7EB',
                  },
                ]}
                onPress={() => handleAdjustCustomServings(-1)}
                activeOpacity={0.7}
              >
                <Minus size={18} color={isDark ? '#FFFFFF' : '#1F2937'} />
              </TouchableOpacity>

              <View
                style={[
                  styles.customServingsInputWrap,
                  {
                    backgroundColor: isDark ? '#282522' : '#F9FAFB',
                    borderColor: AppColors.primary,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.customServingsTextInput,
                    { color: isDark ? '#FFFFFF' : '#111827' },
                  ]}
                  value={customServingsInput}
                  onChangeText={txt => {
                    const cleaned = txt.replace(/[^0-9]/g, '');
                    setCustomServingsInput(cleaned);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  autoFocus
                  textAlign="center"
                />
                <Text style={styles.customServingsUnitLabel}>
                  {(parseInt(customServingsInput, 10) || 0) > 1 ? 'personnes' : 'personne'}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.customServingsStepBtn,
                  {
                    backgroundColor: isDark ? '#2D2925' : '#F3F4F6',
                    borderColor: isDark ? '#3D3833' : '#E5E7EB',
                  },
                ]}
                onPress={() => handleAdjustCustomServings(1)}
                activeOpacity={0.7}
              >
                <Plus size={18} color={isDark ? '#FFFFFF' : '#1F2937'} />
              </TouchableOpacity>
            </View>

            {/* Raccourcis rapides */}
            <View style={styles.customServingsPresetsRow}>
              {[1, 3, 5, 8, 10, 12].map(preset => {
                const isCurrent = customServingsInput === preset.toString();
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.customServingsPresetChip,
                      isCurrent && {
                        backgroundColor: AppColors.primary,
                        borderColor: AppColors.primary,
                      },
                      !isCurrent && {
                        backgroundColor: isDark ? '#2A2724' : '#F3F4F6',
                        borderColor: isDark ? '#3D3833' : '#E5E7EB',
                      },
                    ]}
                    onPress={() => setCustomServingsInput(preset.toString())}
                  >
                    <Text
                      style={[
                        styles.customServingsPresetText,
                        {
                          color: isCurrent
                            ? '#FFFFFF'
                            : isDark
                            ? '#D1D5DB'
                            : '#4B5563',
                        },
                      ]}
                    >
                      {preset}p
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.customServingsActionsRow}>
              <TouchableOpacity
                style={[
                  styles.customServingsCancelBtn,
                  {
                    borderColor: isDark ? '#3D3833' : '#E5E7EB',
                  },
                ]}
                onPress={() => setIsCustomServingsModalOpen(false)}
              >
                <Text
                  style={[
                    styles.customServingsCancelText,
                    { color: isDark ? '#9CA3AF' : '#6B7280' },
                  ]}
                >
                  Annuler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.customServingsApplyBtn}
                onPress={handleConfirmCustomServings}
                activeOpacity={0.85}
              >
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.customServingsApplyText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  floatingHeader: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  heroWrapper: {
    width: '100%',
    height: 340,
    backgroundColor: '#1E1D1B',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  contentCard: {
    flex: 1,
    marginTop: -32,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleCol: {
    flex: 1,
    gap: 4,
  },
  recipeTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  recipeSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    color: '#92400E',
    fontSize: 13.5,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 18,
    marginBottom: 16,
  },
  statCapsule: {
    flex: 1,
    borderRadius: 26,
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  statUnit: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  assistantChefOuterPad: {
    // Espace pour que le halo GlowEffect soit visible en dehors de la carte
    paddingVertical: 14,
    marginBottom: 4,
  },
  assistantChefGlowContainer: {
    position: 'relative',
    borderRadius: 24,
    // overflow:visible est le défaut => le glow déborde sur les 4 côtés
  },
  cookModeHeroBanner: {
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cookModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cookModeIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  cookModeTextCol: {
    flex: 1,
    gap: 2,
  },
  cookModeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cookModeBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: 0.6,
  },
  cookModeTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cookModeSubtitle: {
    fontSize: 11.5,
    color: '#8C8A87',
    fontWeight: '500',
  },
  cookModePlayPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  portionControlCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  portionLeft: {
    flex: 1,
    gap: 2,
  },
  portionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  portionSubtitle: {
    fontSize: 11,
    color: '#8C8A87',
    fontWeight: '500',
  },
  portionPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  portionPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionPillActive: {
    backgroundColor: AppColors.primary,
  },
  portionPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  customServingsModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customServingsModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    gap: 18,
  },
  customServingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customServingsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customServingsTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  customServingsSubtitle: {
    fontSize: 12,
    color: '#8C8A87',
    marginTop: 2,
  },
  customServingsCloseBtn: {
    padding: 4,
  },
  customServingsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  customServingsStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customServingsInputWrap: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  customServingsTextInput: {
    fontSize: 22,
    fontWeight: '800',
    padding: 0,
    margin: 0,
    minWidth: 40,
    textAlign: 'center',
  },
  customServingsUnitLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#8C8A87',
    marginTop: -2,
  },
  customServingsPresetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  customServingsPresetChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customServingsPresetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customServingsActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  customServingsCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customServingsCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  customServingsApplyBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  customServingsApplyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  inPageTimerCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inPageTimerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inPageTimerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inPageTimerTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  inPageTimerCountdown: {
    fontSize: 18,
    fontWeight: '900',
    color: AppColors.primary,
    fontVariant: ['tabular-nums'],
  },
  inPageTimerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inPageTimerPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inPageTimerResetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  storyBodyText: {
    fontSize: 12.5,
    lineHeight: 19,
  },
  tipCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  tipBody: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  tabSection: {
    gap: 10,
    marginTop: 6,
  },
  ingredientsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  stepsHeaderRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  addCartLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addCartLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  ingredientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ingredientName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  ingredientNoteText: {
    fontSize: 11,
    color: '#8C8A87',
    marginTop: 1,
  },
  amountPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amountText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  stepCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  stepCardDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: 38,
  },
  checkedText: {
    color: AppColors.primaryDark,
  },
  nutritionCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nutritionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nutritionHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  nutritionSubtitle: {
    fontSize: 12,
    color: '#8C8A87',
  },
  nutriScoreBadge: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  nutriScoreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  macroBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  macroVal: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  macroLabel: {
    fontSize: 10,
    color: '#8C8A87',
    fontWeight: '600',
  },
  pairingCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  pairingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pairingEmoji: {
    fontSize: 26,
  },
  pairingBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  pairingTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  pairingDesc: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  sidesCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  sidesTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  sidesPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sidePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  sidePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  primaryActionButton: {
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
