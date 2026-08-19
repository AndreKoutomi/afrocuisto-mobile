import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Flame,
  Plus,
  X,
  ChefHat,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { MorphIcon, Play as LucidePlay, Pause as LucidePause } from './MorphIcon';
import { useCookingTimer } from '../../context/CookingTimerContext';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';

export const InteractiveTimerPill: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const {
    isRunning,
    isPaused,
    isFinished,
    formattedTime,
    timerSeconds,
    recipeName,
    currentStepIndex,
    totalSteps,
    progressRatio,
    isPillExpanded,
    isPillVisible,
    setIsPillExpanded,
    setIsPillVisible,
    pauseTimer,
    resumeTimer,
    addMinutes,
    stopTimer,
    togglePlayPause,
  } = useCookingTimer();

  const [isMinimized, setIsMinimized] = useState(false);

  const slideAnim = useRef(new Animated.Value(-120)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const minimizeAnim = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;

  const shouldShow = isPillVisible && (isRunning || isPaused || isFinished);

  // Appearance & Dismiss Animation
  useEffect(() => {
    if (shouldShow) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 16,
        tension: 140,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -140,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [shouldShow]);

  // Expansion Animation
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isPillExpanded ? 1 : 0,
      friction: 18,
      tension: 160,
      useNativeDriver: false,
    }).start();
  }, [isPillExpanded]);

  // Minimize (Swipe to reduce) Animation
  useEffect(() => {
    Animated.spring(minimizeAnim, {
      toValue: isMinimized ? 1 : 0,
      friction: 14,
      tension: 180,
      useNativeDriver: false,
    }).start();
  }, [isMinimized]);

  // Pulse animation on the flame icon when running
  useEffect(() => {
    if (isRunning && !isPaused) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, isPaused]);

  // PanResponder to handle Swipe Left / Swipe Right gesture to reduce or expand
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2;
      },
      onPanResponderGrant: () => {
        panX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        panX.setValue(gestureState.dx * 0.7);
      },
      onPanResponderRelease: (_, gestureState) => {
        const isSwipe = Math.abs(gestureState.dx) > 35 || Math.abs(gestureState.vx) > 0.3;

        if (isSwipe) {
          if (isPillExpanded) {
            setIsPillExpanded(false);
          } else {
            setIsMinimized(prev => !prev);
          }
        }

        Animated.spring(panX, {
          toValue: 0,
          friction: 12,
          tension: 200,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(panX, {
          toValue: 0,
          friction: 12,
          tension: 200,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  if (!shouldShow) return null;

  const topOffset = insets.top + (Platform.OS === 'ios' ? 6 : 10);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset,
          transform: [
            { translateY: slideAnim },
            { translateX: panX },
          ],
        },
      ]}
      pointerEvents="box-none"
      {...panResponder.panHandlers}
    >
      {/* 🌟 VUE RÉDUITE (MINI-PILULE ULTRA COMPACTE) */}
      {isMinimized && !isPillExpanded ? (
        <TouchableOpacity
          style={[
            styles.minimizedPillCard,
            {
              backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
              borderColor: isFinished
                ? '#10B981'
                : isDark
                ? '#2E2825'
                : 'rgba(251, 86, 7, 0.3)',
            },
          ]}
          activeOpacity={0.85}
          onPress={() => setIsMinimized(false)}
        >
          {/* Animated Mini Icon */}
          <Animated.View
            style={[
              styles.miniIconBadge,
              {
                backgroundColor: isFinished
                  ? '#10B981'
                  : isPaused
                  ? '#F59E0B'
                  : AppColors.primary,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {isFinished ? (
              <CheckCircle2 size={13} color="#FFFFFF" />
            ) : (
              <Flame size={13} color="#FFFFFF" />
            )}
          </Animated.View>

          {/* Time text */}
          <Text
            style={[
              styles.miniTimeText,
              {
                color: isFinished
                  ? '#15803D'
                  : isDark
                  ? '#FF8C5A'
                  : AppColors.primary,
              },
            ]}
          >
            {formattedTime}
          </Text>

          {/* Quick Play/Pause */}
          {!isFinished && (
            <TouchableOpacity
              style={[
                styles.miniQuickBtn,
                { backgroundColor: isDark ? '#2D2723' : '#F4F0EC' },
              ]}
              onPress={e => {
                e.stopPropagation();
                togglePlayPause();
              }}
              activeOpacity={0.7}
            >
              <MorphIcon
                icon={isPaused ? LucidePlay : LucidePause}
                size={12}
                color={AppColors.primary}
                strokeWidth={2.4}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ) : (
        /* 🌟 VUE NORMALE & DÉPLIÉE */
        <View
          style={[
            styles.pillCard,
            {
              backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
              borderColor: isFinished
                ? '#10B981'
                : isDark
                ? '#2E2825'
                : 'rgba(251, 86, 7, 0.25)',
            },
          ]}
        >
          {/* Progress Bar Top Line */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(progressRatio * 100)}%`,
                  backgroundColor: isFinished ? '#10B981' : AppColors.primary,
                },
              ]}
            />
          </View>

          {/* 1. COLLAPSED VIEW (Header of pill) */}
          <TouchableOpacity
            style={styles.pillHeader}
            activeOpacity={0.88}
            onPress={() => setIsPillExpanded(!isPillExpanded)}
          >
            <View style={styles.pillLeft}>
              {/* Pulsing Icon Badge */}
              <Animated.View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: isFinished
                      ? '#10B981'
                      : isPaused
                      ? '#F59E0B'
                      : AppColors.primary,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                {isFinished ? (
                  <CheckCircle2 size={15} color="#FFFFFF" />
                ) : (
                  <Flame size={15} color="#FFFFFF" />
                )}
              </Animated.View>

              <View style={styles.textColumn}>
                <Text
                  style={[
                    styles.recipeTitle,
                    { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {recipeName}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {isFinished
                    ? 'Cuisson prête !'
                    : isPaused
                    ? 'Minuteur en pause'
                    : totalSteps > 0
                    ? `Étape ${currentStepIndex + 1}/${totalSteps} • Glisser pour réduire`
                    : 'Glisser pour réduire'}
                </Text>
              </View>
            </View>

            <View style={styles.pillRight}>
              {/* Live Time Capsule */}
              <View
                style={[
                  styles.timeCapsule,
                  {
                    backgroundColor: isFinished
                      ? '#DCFCE7'
                      : isDark
                      ? '#26201C'
                      : '#FFF3EE',
                    borderColor: isFinished
                      ? '#86EFAC'
                      : isDark
                      ? '#3D2F28'
                      : '#FFE2D7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timeText,
                    {
                      color: isFinished
                        ? '#15803D'
                        : isDark
                        ? '#FF8C5A'
                        : AppColors.primary,
                    },
                  ]}
                >
                  {formattedTime}
                </Text>
              </View>

              {/* Quick Play/Pause Button with Animated MorphIcon */}
              {!isFinished && (
                <TouchableOpacity
                  style={[
                    styles.quickActionBtn,
                    {
                      backgroundColor: isDark ? '#2D2723' : '#F4F0EC',
                    },
                  ]}
                  onPress={e => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                  activeOpacity={0.7}
                >
                  <MorphIcon
                    icon={isPaused ? LucidePlay : LucidePause}
                    size={15}
                    color={AppColors.primary}
                    strokeWidth={2.4}
                  />
                </TouchableOpacity>
              )}

              {/* Toggle Arrow */}
              <View style={styles.chevronWrap}>
                {isPillExpanded ? (
                  <ChevronUp size={16} color={isDark ? '#A8A29E' : '#78716C'} />
                ) : (
                  <ChevronDown size={16} color={isDark ? '#A8A29E' : '#78716C'} />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* 2. EXPANDED VIEW (Controls & Quick Tweaks) */}
          {isPillExpanded && (
            <View
              style={[
                styles.expandedBody,
                {
                  borderTopColor: isDark ? '#2B2421' : '#F1ECE6',
                },
              ]}
            >
              {/* Quick Time Additions */}
              {!isFinished && (
                <View style={styles.timeButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.timeAdjustmentBtn,
                      {
                        backgroundColor: isDark ? '#26211D' : '#FAF8F5',
                        borderColor: isDark ? '#3D342E' : '#E8E2D9',
                      },
                    ]}
                    onPress={() => addMinutes(1)}
                    activeOpacity={0.75}
                  >
                    <Plus size={13} color={AppColors.primary} />
                    <Text
                      style={[
                        styles.timeAdjustmentText,
                        { color: isDark ? '#E7E5E4' : '#44403C' },
                      ]}
                    >
                      1 min
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.timeAdjustmentBtn,
                      {
                        backgroundColor: isDark ? '#26211D' : '#FAF8F5',
                        borderColor: isDark ? '#3D342E' : '#E8E2D9',
                      },
                    ]}
                    onPress={() => addMinutes(5)}
                    activeOpacity={0.75}
                  >
                    <Plus size={13} color={AppColors.primary} />
                    <Text
                      style={[
                        styles.timeAdjustmentText,
                        { color: isDark ? '#E7E5E4' : '#44403C' },
                      ]}
                    >
                      5 min
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.timeAdjustmentBtn,
                      {
                        backgroundColor: isDark ? '#26211D' : '#FAF8F5',
                        borderColor: isDark ? '#3D342E' : '#E8E2D9',
                      },
                    ]}
                    onPress={() => addMinutes(10)}
                    activeOpacity={0.75}
                  >
                    <Plus size={13} color={AppColors.primary} />
                    <Text
                      style={[
                        styles.timeAdjustmentText,
                        { color: isDark ? '#E7E5E4' : '#44403C' },
                      ]}
                    >
                      10 min
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Bottom Actions Row */}
              <View style={styles.expandedBottomActions}>
                <TouchableOpacity
                  style={[
                    styles.stopPillBtn,
                    {
                      backgroundColor: isDark ? '#2A1815' : '#FEE2E2',
                      borderColor: isDark ? '#4C241E' : '#FECACA',
                    },
                  ]}
                  onPress={stopTimer}
                  activeOpacity={0.8}
                >
                  <X size={14} color="#DC2626" />
                  <Text style={styles.stopPillBtnText}>Arrêter</Text>
                </TouchableOpacity>

                {!isFinished && (
                  <TouchableOpacity
                    style={[
                      styles.mainToggleBtn,
                      {
                        backgroundColor: isPaused ? AppColors.primary : '#44403C',
                      },
                    ]}
                    onPress={togglePlayPause}
                    activeOpacity={0.85}
                  >
                    <MorphIcon
                      icon={isPaused ? LucidePlay : LucidePause}
                      size={16}
                      color="#FFFFFF"
                      strokeWidth={2.4}
                    />
                    <Text style={styles.mainToggleBtnText}>
                      {isPaused ? 'Reprendre' : 'Mettre en pause'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
    alignItems: 'center',
  },
  minimizedPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  miniIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTimeText: {
    fontSize: 12.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  miniQuickBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  progressBarTrack: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  progressBarFill: {
    height: '100%',
  },
  pillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  textColumn: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusSubtitle: {
    fontSize: 11,
    color: '#8C8A87',
    marginTop: 1,
  },
  pillRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeCapsule: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 13.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  quickActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWrap: {
    paddingHorizontal: 2,
  },
  expandedBody: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  timeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeAdjustmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  timeAdjustmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandedBottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stopPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  stopPillBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  mainToggleBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  mainToggleBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
