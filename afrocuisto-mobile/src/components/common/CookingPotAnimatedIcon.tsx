import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

export interface CookingPotIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface CookingPotAnimatedIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  autoPlay?: boolean;
  repeatDelay?: number;
  style?: StyleProp<ViewStyle>;
}

export const CookingPotAnimatedIcon = forwardRef<
  CookingPotIconHandle,
  CookingPotAnimatedIconProps
>(
  (
    {
      size = 24,
      color = '#FFFFFF',
      strokeWidth = 2,
      autoPlay = true,
      repeatDelay = 1400,
      style,
    },
    ref
  ) => {
    const lidRotate = useSharedValue(0);
    const potScale = useSharedValue(1);

    const runAnimation = () => {
      // 1. Animation du couvercle qui vibre / saute sous la vapeur : [0, -14, 14, -10, 10, -6, 6, 0]
      const lidSequence = withSequence(
        withTiming(-14, { duration: 110, easing: Easing.inOut(Easing.ease) }),
        withTiming(14, { duration: 110, easing: Easing.inOut(Easing.ease) }),
        withTiming(-10, { duration: 110, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration: 110, easing: Easing.inOut(Easing.ease) }),
        withTiming(-6, { duration: 110, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 110, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 110, easing: Easing.inOut(Easing.ease) }),
        withDelay(repeatDelay, withTiming(0, { duration: 20 }))
      );

      // 2. Animation de la marmite (légère pulsation de cuisson : 1 -> 1.08 -> 1)
      const potSequence = withSequence(
        withTiming(1.08, { duration: 440, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 440, easing: Easing.inOut(Easing.ease) }),
        withDelay(repeatDelay, withTiming(1, { duration: 20 }))
      );

      if (autoPlay) {
        lidRotate.value = withRepeat(lidSequence, -1, false);
        potScale.value = withRepeat(potSequence, -1, false);
      } else {
        lidRotate.value = lidSequence;
        potScale.value = potSequence;
      }
    };

    const stopAnimation = () => {
      cancelAnimation(lidRotate);
      cancelAnimation(potScale);
      lidRotate.value = withTiming(0, { duration: 120 });
      potScale.value = withTiming(1, { duration: 120 });
    };

    useImperativeHandle(ref, () => ({
      startAnimation: runAnimation,
      stopAnimation,
    }));

    useEffect(() => {
      if (autoPlay) {
        runAnimation();
      }
      return () => {
        cancelAnimation(lidRotate);
        cancelAnimation(potScale);
      };
    }, [autoPlay, repeatDelay]);

    // Style animé pour la marmite
    const potAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: potScale.value }],
    }));

    // Style animé pour le couvercle
    const lidAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: -1 },
        { rotate: `${lidRotate.value}deg` },
        { translateY: 1 },
      ],
    }));

    return (
      <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
        {/* Marmite (Base) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            potAnimatedStyle,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M2 12h20"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>

        {/* Couvercle (Lid animé) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            lidAnimatedStyle,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="m4 8 16-4"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </View>
    );
  }
);

CookingPotAnimatedIcon.displayName = 'CookingPotAnimatedIcon';
