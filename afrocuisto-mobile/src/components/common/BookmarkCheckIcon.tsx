import React, { forwardRef, useImperativeHandle, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

export interface BookmarkCheckIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface BookmarkCheckIconProps {
  size?: number;
  color?: string;
  fill?: string;
  autoAnimate?: boolean;
}

export const BookmarkCheckIcon = forwardRef<
  BookmarkCheckIconHandle,
  BookmarkCheckIconProps
>(({ size = 28, color = "currentColor", fill = "none", autoAnimate = true }, ref) => {
  const scaleY = useSharedValue(1);
  const scaleX = useSharedValue(1);
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0.7);

  const startAnimation = () => {
    // scaleY: [1, 1.3, 0.9, 1.05, 1] over 600ms
    scaleY.value = withSequence(
      withTiming(1.3, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(0.9, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(1.05, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) })
    );

    // scaleX: [1, 0.9, 1.1, 0.95, 1] over 600ms
    scaleX.value = withSequence(
      withTiming(0.9, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(1.1, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(0.95, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) })
    );

    // Checkmark animation: opacity [0, 1] + scale pop
    checkOpacity.value = 0;
    checkScale.value = 0.6;
    checkOpacity.value = withDelay(
      120,
      withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) })
    );
    checkScale.value = withDelay(
      120,
      withSequence(
        withTiming(1.2, { duration: 180, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 100, easing: Easing.out(Easing.ease) })
      )
    );
  };

  const stopAnimation = () => {
    scaleY.value = withTiming(1, { duration: 150 });
    scaleX.value = withTiming(1, { duration: 150 });
    checkOpacity.value = withTiming(1, { duration: 150 });
    checkScale.value = withTiming(1, { duration: 150 });
  };

  useImperativeHandle(ref, () => ({
    startAnimation,
    stopAnimation,
  }));

  useEffect(() => {
    if (autoAnimate) {
      startAnimation();
    } else {
      checkOpacity.value = 1;
      checkScale.value = 1;
    }
  }, [autoAnimate]);

  const bookmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: scaleY.value },
      { scaleX: scaleX.value },
    ],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, bookmarkAnimatedStyle]}>
      <Svg
        height={size}
        width={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        {/* Bookmark Path */}
        <Path
          d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={fill}
        />
        {/* Checkmark Path */}
        <Path
          d="m9 10 2 2 4-4"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
});

BookmarkCheckIcon.displayName = "BookmarkCheckIcon";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});