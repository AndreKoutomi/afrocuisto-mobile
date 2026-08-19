import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Vibration,
  Platform,
  Share,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing as ReaEasing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  PartyPopper,
  Share2,
  Smartphone,
} from 'lucide-react-native';
import { MorphIcon, Play as LucidePlay, Pause as LucidePause } from '../common/MorphIcon';
import { Recipe } from '../../types/recipe';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';
import { useCookingTimer } from '../../context/CookingTimerContext';
import { useKitchenAccessibility } from '../../hooks/useKitchenAccessibility';

interface CookModeModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe;
  servings: number;
  isDark: boolean;
}

export const CookModeModal: React.FC<CookModeModalProps> = ({
  visible,
  onClose,
  recipe,
  servings,
  isDark,
}) => {
  const insets = useSafeAreaInsets();
  const steps = recipe.steps || [];
  const totalSteps = steps.length;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [isCelebration, setIsCelebration] = useState(false);
  // Contrôle si le Modal natif est mounté (permet l'animation de fermeture avant unmount)
  const [isModalMounted, setIsModalMounted] = useState(false);

  // ─── Valeurs d'animation Reanimated ────────────────────────────────────────
  const translateY = useSharedValue(80);  // Entre par le bas
  const opacity    = useSharedValue(0);
  const scale      = useSharedValue(0.96);

  // Animation d'ouverture
  const animateOpen = useCallback(() => {
    translateY.value = withSpring(0, {
      damping: 24,
      stiffness: 300,
      mass: 0.8,
      overshootClamping: false,
    });
    opacity.value = withTiming(1, {
      duration: 180,
      easing: ReaEasing.out(ReaEasing.cubic),
    });
    scale.value = withSpring(1, {
      damping: 26,
      stiffness: 320,
      mass: 0.7,
    });
  }, []);

  // Animation de fermeture (avant unmount)
  const animateClose = useCallback((onDone: () => void) => {
    translateY.value = withTiming(60, {
      duration: 160,
      easing: ReaEasing.in(ReaEasing.cubic),
    });
    opacity.value = withTiming(0, {
      duration: 140,
      easing: ReaEasing.in(ReaEasing.quad),
    });
    scale.value = withTiming(0.96, {
      duration: 140,
      easing: ReaEasing.in(ReaEasing.quad),
    }, () => runOnJS(onDone)());
  }, []);

  // Déclenchement selon visible
  useEffect(() => {
    if (visible) {
      // Réinitialise les valeurs avant l'animation d'entrée
      translateY.value = 80;
      opacity.value = 0;
      scale.value = 0.96;
      setIsModalMounted(true);
      // Léger délai pour laisser le Modal se monter sur Android
      const t = setTimeout(animateOpen, Platform.OS === 'android' ? 50 : 20);
      return () => clearTimeout(t);
    } else {
      animateClose(() => setIsModalMounted(false));
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));


  const {
    timerSeconds,
    formattedTime,
    isRunning: isTimerRunning,
    isPaused: isTimerPaused,
    recipeId: activeTimerRecipeId,
    startTimer,
    pauseTimer,
    resumeTimer,
    addMinutes,
    stopTimer,
    updateStep,
  } = useCookingTimer();

  const isThisRecipeTimer = isTimerRunning && activeTimerRecipeId === recipe.id;

  // Default timer parsed from recipe
  const defaultTimerSeconds = (() => {
    const rawCook = recipe.cookTime || '15 min';
    const num = parseInt(rawCook.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 900 : num * 60;
  })();

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (visible) {
      setCurrentStepIndex(0);
      setIsCelebration(false);
    }
  }, [visible]);

  const toggleStepDone = (idx: number) => {
    setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleNext = () => {
    setCompletedSteps(prev => ({ ...prev, [currentStepIndex]: true }));

    if (currentStepIndex < totalSteps - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      updateStep(nextIdx, totalSteps);
    } else {
      setIsCelebration(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      updateStep(prevIdx, totalSteps);
    }
  };

  const handleToggleTimer = () => {
    if (isThisRecipeTimer) {
      if (isTimerPaused) {
        resumeTimer();
      } else {
        pauseTimer();
      }
    } else {
      startTimer({
        durationSeconds: defaultTimerSeconds,
        recipeName: recipe.name,
        recipeId: recipe.id,
        recipeImage: recipe.image,
        currentStepIndex,
        totalSteps,
      });
    }
  };

  const handleResetTimer = () => {
    stopTimer();
  };

  const handleAdd5Min = () => {
    if (isThisRecipeTimer) {
      addMinutes(5);
    } else {
      startTimer({
        durationSeconds: defaultTimerSeconds + 300,
        recipeName: recipe.name,
        recipeId: recipe.id,
        recipeImage: recipe.image,
        currentStepIndex,
        totalSteps,
      });
    }
  };

  const handleCloseModal = () => {
    stopTimer(); // Auto-stop service when closing cooking session
    onClose();
  };

  const handleShareResult = async () => {
    try {
      await Share.share({
        title: `J'ai cuisiné ${recipe.name} sur AfroCuisto !`,
        message: `👩🏾‍🍳 Je viens de réussir la recette traditionnelle de « ${recipe.name} » (${recipe.region}) avec AfroCuisto ! Un régal pour ${servings} personnes.`,
      });
    } catch (e) {
      console.warn('Share error', e);
    }
  };

  const currentStepText = steps[currentStepIndex] || 'Bonne préparation !';
  const isCurrentStepDone = !!completedSteps[currentStepIndex];
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  // 🌟 Assistance Cuisine Intelligente (Keep Screen On, Touches Volume ±, Capteurs)
  useKitchenAccessibility({
    isActive: visible && isModalMounted,
    currentStepIndex,
    totalSteps,
    currentStepText,
    onNextStep: handleNext,
    onPrevStep: handlePrev,
  });

  // Garde : si Modal pas mounté ET pas visible, ne pas rendre
  if (!visible && !isModalMounted) return null;

  const modalBody = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#121110' : '#FAF8F5',
          paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 12),
        },
      ]}
    >
      {/* 1. Top Header Bar (Fixed at top) */}
      <View style={styles.topBar}>
        <View style={styles.recipeSnippet}>
          <Image
            source={getImageSource(recipe.image)}
            style={styles.snippetImage}
            resizeMode="cover"
          />
          <View style={styles.snippetTextWrap}>
            <Text
              style={[styles.snippetTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}
              numberOfLines={1}
            >
              {recipe.name}
            </Text>
            <Text style={styles.snippetSubtitle}>
              Mode Chef • {servings} personnes
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.closeBtn,
            {
              backgroundColor: isDark ? '#262422' : '#FFFFFF',
              borderColor: isDark ? '#383531' : '#E5E7EB',
            },
          ]}
          onPress={handleCloseModal}
          activeOpacity={0.8}
        >
          <X size={20} color={isDark ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
      </View>

      {!isCelebration ? (
        <View style={styles.contentFlexWrapper}>
          {/* Hands-Free Accessibility Helper Badge */}
          <View style={styles.handsFreeBadgeRow}>
            <View
              style={[
                styles.handsFreeBadge,
                {
                  backgroundColor: isDark ? '#1F1B18' : '#FFF7F2',
                  borderColor: isDark ? '#3D2D24' : '#FFDCD3',
                },
              ]}
            >
              <Smartphone size={12} color={AppColors.primary} />
              <Text style={[styles.handsFreeBadgeText, { color: isDark ? '#E5E7EB' : '#7C2D12' }]}>
                Touches Volume ± pour passer l'étape • Écran maintenu allumé
              </Text>
            </View>
          </View>

          {/* 2. Step Progress Bar & Indicators */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.stepIndicatorText, { color: AppColors.primary }]}>
                Étape {currentStepIndex + 1} sur {totalSteps}
              </Text>
              <Text style={styles.percentText}>
                {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressSegment,
                    {
                      backgroundColor:
                        i <= currentStepIndex
                          ? AppColors.primary
                          : isDark
                          ? '#2A2724'
                          : '#E5E7EB',
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* 3. Main Scrollable Step Content (Strictly bound to available height) */}
          <ScrollView
            style={styles.stepScrollView}
            contentContainerStyle={styles.stepScroll}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Step Card (Extra large and easy to read hands-free) */}
            <View
              style={[
                styles.stepCard,
                {
                  backgroundColor: isDark ? '#1C1A18' : '#FFFFFF',
                  borderColor: isDark ? '#2E2C29' : '#EDE8E1',
                },
              ]}
            >
              <View style={styles.stepCardHeader}>
                <View style={styles.stepPill}>
                  <ChefHat size={16} color="#FFFFFF" />
                  <Text style={styles.stepPillText}>Étape {currentStepIndex + 1}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.checkToggle,
                    isCurrentStepDone && styles.checkToggleDone,
                  ]}
                  onPress={() => toggleStepDone(currentStepIndex)}
                  activeOpacity={0.8}
                >
                  <CheckCircle2
                    size={18}
                    color={isCurrentStepDone ? '#FFFFFF' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.checkToggleText,
                      isCurrentStepDone && { color: '#FFFFFF' },
                    ]}
                  >
                    {isCurrentStepDone ? 'Complétée' : 'À faire'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.stepBigInstruction,
                  { color: isDark ? '#F3F4F6' : '#1F2937' },
                ]}
              >
                {currentStepText}
              </Text>
            </View>

            {/* Interactive Kitchen Timer Capsule */}
            <View
              style={[
                styles.timerBox,
                {
                  backgroundColor: isDark ? '#1F1B18' : '#FFF7F2',
                  borderColor: isDark ? '#3D2D24' : '#FED7AA',
                },
              ]}
            >
              <View style={styles.timerTopRow}>
                <View style={styles.timerTitleWrap}>
                  <Clock size={18} color={AppColors.primary} />
                  <Text style={[styles.timerTitle, { color: AppColors.primary }]}>
                    Minuteur de Cuisine (Premier Plan)
                  </Text>
                </View>
                <Text style={[styles.timerDisplay, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {isThisRecipeTimer ? formattedTime : formatTimer(defaultTimerSeconds)}
                </Text>
              </View>

              {/* Timer Action Buttons */}
              <View style={styles.timerActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.timerControlBtn,
                    { backgroundColor: isThisRecipeTimer && !isTimerPaused ? '#EA580C' : AppColors.primary },
                  ]}
                  onPress={handleToggleTimer}
                  activeOpacity={0.85}
                >
                  <MorphIcon
                    icon={isThisRecipeTimer && !isTimerPaused ? LucidePause : LucidePlay}
                    size={16}
                    color="#FFFFFF"
                    strokeWidth={2.4}
                  />
                  <Text style={styles.timerBtnText}>
                    {isThisRecipeTimer && !isTimerPaused
                      ? 'Pause'
                      : isThisRecipeTimer && isTimerPaused
                      ? 'Reprendre'
                      : 'Démarrer'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.timerSecondaryBtn,
                    {
                      backgroundColor: isDark ? '#2A2622' : '#FFFFFF',
                      borderColor: isDark ? '#3E3933' : '#E5E7EB',
                    },
                  ]}
                  onPress={handleResetTimer}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={15} color={isDark ? '#D1D5DB' : '#4B5563'} />
                  <Text style={[styles.timerSecBtnText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                    Reset
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.timerPresetBtn,
                    {
                      backgroundColor: isDark ? '#2A2622' : '#FFFFFF',
                      borderColor: isDark ? '#3E3933' : '#E5E7EB',
                    },
                  ]}
                  onPress={handleAdd5Min}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.timerPresetText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    +5 min
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Chef Tip Reminder */}
            {recipe.techniqueTitle && (
              <View
                style={[
                  styles.miniTipCard,
                  {
                    backgroundColor: isDark ? '#1C1A18' : '#FAF8F5',
                    borderColor: isDark ? '#2E2C29' : '#ECE8E1',
                  },
                ]}
              >
                <View style={styles.miniTipHeader}>
                  <Sparkles size={15} color={AppColors.primary} />
                  <Text style={[styles.miniTipTitle, { color: AppColors.primary }]}>
                    Astuce du Chef : {recipe.techniqueTitle}
                  </Text>
                </View>
                {recipe.techniqueDescription && (
                  <Text
                    style={[
                      styles.miniTipBody,
                      { color: isDark ? '#9CA3AF' : '#4B5563' },
                    ]}
                  >
                    {recipe.techniqueDescription}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* 4. Bottom Controls (Anchored & Fixed at viewport bottom) */}
          <View
            style={[
              styles.bottomControls,
              {
                backgroundColor: isDark ? '#181614' : '#FFFFFF',
                borderTopColor: isDark ? '#2E2C29' : '#EDE8E1',
                paddingBottom: bottomInset,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.navBtnPrev,
                {
                  backgroundColor: isDark ? '#262422' : '#F3F4F6',
                  opacity: currentStepIndex === 0 ? 0.4 : 1,
                },
              ]}
              disabled={currentStepIndex === 0}
              onPress={handlePrev}
              activeOpacity={0.8}
            >
              <ChevronLeft size={20} color={isDark ? '#FFFFFF' : '#374151'} />
              <Text
                style={[
                  styles.navBtnPrevText,
                  { color: isDark ? '#FFFFFF' : '#374151' },
                ]}
              >
                Précédent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navBtnNext,
                currentStepIndex === totalSteps - 1 && styles.navBtnFinish,
              ]}
              onPress={handleNext}
              activeOpacity={0.88}
            >
              <Text style={styles.navBtnNextText}>
                {currentStepIndex === totalSteps - 1
                  ? 'Terminer la recette 🎉'
                  : 'Étape suivante'}
              </Text>
              {currentStepIndex !== totalSteps - 1 && (
                <ChevronRight size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Celebration View (Scrollable to prevent overflow on small viewports) */
        <ScrollView
          contentContainerStyle={[
            styles.celebrationScroll,
            { paddingBottom: bottomInset + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.celebrationCard}>
            <View style={styles.celebrationBadge}>
              <PartyPopper size={42} color="#FFFFFF" />
            </View>

            <Text style={[styles.celebrationHeading, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              Bravo, Chef ! 🎉
            </Text>
            <Text style={[styles.celebrationSub, { color: isDark ? '#A8A29E' : '#6B7280' }]}>
              Votre plat « {recipe.name} » est prêt à être dégusté chaud et savouré pour {servings} personnes.
            </Text>

            <View style={styles.celebrationActions}>
              <TouchableOpacity
                style={styles.shareCookBtn}
                onPress={handleShareResult}
                activeOpacity={0.85}
              >
                <Share2 size={18} color="#FFFFFF" />
                <Text style={styles.shareCookBtnText}>Partager ma réussite</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.finishCloseBtn,
                  {
                    backgroundColor: isDark ? '#262422' : '#F3F4F6',
                  },
                ]}
                onPress={handleCloseModal}
                activeOpacity={0.8}
              >
                <Text style={[styles.finishCloseBtnText, { color: isDark ? '#FFFFFF' : '#374151' }]}>
                  Retour à la fiche recette
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );

  // Sur le Web, on utilise une vue absoluteFill pour rester confiné au frame de l'appareil (sans déborder sur le body/document)
  if (Platform.OS === 'web') {
    if (!visible && !isModalMounted) return null;
    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.webModalWrapper,
          { backgroundColor: isDark ? '#121110' : '#FAF8F5' },
          animatedStyle,
        ]}
      >
        {modalBody}
      </Animated.View>
    );
  }

  // Sur Mobile natif (iOS / Android) — Modal natif + animation Reanimated interne
  //
  // transparent={true}  → évite le flash blanc natif Android avant que Reanimated
  //                       n'applique opacity:0. Le fond est géré par l'Animated.View.
  // presentationStyle   → ignoré sur Android (fullScreen requis sur iOS uniquement)
  return (
    <Modal
      visible={isModalMounted}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          { flex: 1, backgroundColor: isDark ? '#121110' : '#FAF8F5' },
          animatedStyle,
        ]}
      >
        {modalBody}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  webModalWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    flex: 1,
    height: '100%',
    maxHeight: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  contentFlexWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  recipeSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  snippetImage: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  snippetTextWrap: {
    flex: 1,
  },
  snippetTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  snippetSubtitle: {
    fontSize: 11.5,
    color: '#8C8A87',
    fontWeight: '600',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepIndicatorText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  percentText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8C8A87',
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 4,
    height: 5,
  },
  progressSegment: {
    flex: 1,
    borderRadius: 2.5,
  },
  stepScrollView: {
    flex: 1,
    width: '100%',
  },
  stepScroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
    gap: 14,
  },
  handsFreeBadgeRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  handsFreeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  handsFreeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  stepCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepPill: {
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stepPillText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  checkToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  checkToggleDone: {
    backgroundColor: '#22C55E',
  },
  checkToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  stepBigInstruction: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  timerBox: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  timerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  timerDisplay: {
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  timerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  timerBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  timerSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  timerSecBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  timerPresetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPresetText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  miniTipCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  miniTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniTipTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  miniTipBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  navBtnPrev: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
  },
  navBtnPrevText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  navBtnNext: {
    flex: 1,
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  navBtnFinish: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
  },
  navBtnNextText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  celebrationScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  celebrationCard: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    gap: 14,
  },
  celebrationBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  celebrationHeading: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  celebrationSub: {
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  celebrationActions: {
    width: '100%',
    gap: 10,
    marginTop: 14,
  },
  shareCookBtn: {
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  shareCookBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  finishCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
  },
  finishCloseBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
