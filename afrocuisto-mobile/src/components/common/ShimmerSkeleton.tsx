import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, DimensionValue, ViewStyle, StyleProp, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ShimmerSkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { isDark } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const isWeb = Platform.OS === 'web';
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.90,
          duration: 240,
          useNativeDriver: !isWeb,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 240,
          useNativeDriver: !isWeb,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#332F2B' : '#E8E5DF',
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});
