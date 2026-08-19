import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Animated,
  Easing,
} from 'react-native';
import { Check, Minus } from 'lucide-react-native';
import { AppColors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'success';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  activeColor?: string;
  checkColor?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onCheckedChange,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  activeColor,
  checkColor = '#FFFFFF',
}) => {
  const { isDark } = useTheme();

  const isChecked = checked === true;
  const isIndeterminate = checked === 'indeterminate';
  const hasValue = isChecked || isIndeterminate;

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(hasValue ? 1 : 0)).current;
  const bgAnim = useRef(new Animated.Value(hasValue ? 1 : 0)).current;

  useEffect(() => {
    if (hasValue) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.88,
            duration: 70,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3.5,
            tension: 220,
            useNativeDriver: false,
          }),
        ]),
        Animated.spring(checkAnim, {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: false,
        }),
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(checkAnim, {
          toValue: 0,
          duration: 120,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [hasValue]);

  // Size definitions
  const sizeMap = {
    sm: { box: 16, icon: 11, radius: 4, stroke: 3 },
    md: { box: 20, icon: 13.5, radius: 6, stroke: 3 },
    lg: { box: 24, icon: 16, radius: 7, stroke: 3.2 },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Variant color definition
  const getFillColor = () => {
    if (activeColor) return activeColor;
    switch (variant) {
      case 'success':
        return AppColors.accentGreen;
      case 'default':
        return isDark ? '#E5E7EB' : '#1F2937';
      case 'primary':
      default:
        return AppColors.primary;
    }
  };

  const fillColor = getFillColor();
  const uncheckedBorderColor = isDark ? '#4B5563' : '#D1D5DB';
  const uncheckedBg = isDark ? '#1C1A18' : '#FFFFFF';

  const animatedBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [uncheckedBg, fillColor],
  });

  const animatedBorder = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [uncheckedBorderColor, fillColor],
  });

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 1.25, 1],
  });

  const checkOpacity = checkAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.6, 1],
  });

  const handlePress = () => {
    if (disabled || !onCheckedChange) return;
    onCheckedChange(!isChecked);
  };

  const handlePressIn = () => {
    if (disabled) return;
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 60,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onCheckedChange}
    >
      <Animated.View
        style={[
          styles.box,
          {
            width: currentSize.box,
            height: currentSize.box,
            borderRadius: currentSize.radius,
            backgroundColor: animatedBg,
            borderColor: animatedBorder,
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        <Animated.View
          style={{
            transform: [{ scale: checkScale }],
            opacity: checkOpacity,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isIndeterminate ? (
            <Minus
              size={currentSize.icon}
              color={checkColor}
              strokeWidth={currentSize.stroke}
            />
          ) : (
            <Check
              size={currentSize.icon}
              color={variant === 'default' && !isDark ? '#FFFFFF' : checkColor}
              strokeWidth={currentSize.stroke}
            />
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
