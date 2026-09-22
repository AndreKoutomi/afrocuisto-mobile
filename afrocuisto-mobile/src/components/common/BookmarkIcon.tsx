import React, { forwardRef, useImperativeHandle, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

export interface BookmarkIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface BookmarkIconProps {
  size?: number;
  color?: string;
  autoAnimate?: boolean;
}

export const BookmarkIcon = forwardRef<BookmarkIconHandle, BookmarkIconProps>(
  ({ size = 28, color = "currentColor", autoAnimate = false }, ref) => {
    const scaleY = useSharedValue(1);
    const scaleX = useSharedValue(1);

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
    };

    const stopAnimation = () => {
      scaleY.value = withTiming(1, { duration: 150 });
      scaleX.value = withTiming(1, { duration: 150 });
    };

    useImperativeHandle(ref, () => ({
      startAnimation,
      stopAnimation,
    }));

    useEffect(() => {
      if (autoAnimate) {
        startAnimation();
      }
    }, [autoAnimate]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scaleY: scaleY.value },
        { scaleX: scaleX.value },
      ],
    }));

    return (
      <Animated.View style={[styles.container, animatedStyle]}>
        <Svg
          height={size}
          width={size}
          viewBox="0 0 24 24"
          fill="none"
        >
          <Path
            d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    );
  }
);

BookmarkIcon.displayName = "BookmarkIcon";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});