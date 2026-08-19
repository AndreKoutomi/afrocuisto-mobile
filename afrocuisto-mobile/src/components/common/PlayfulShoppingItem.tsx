import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Trash2 } from 'lucide-react-native';
import { ShoppingItem } from '../../types/shopping';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { Checkbox } from './Checkbox';

interface PlayfulShoppingItemProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

// Generate a playful squiggly / wavy SVG path based on dynamic text width
const createWavyPath = (width: number, midY: number = 8, amplitude: number = 2.5, wavelength: number = 10): string => {
  if (width <= 0) return '';
  let d = `M 0,${midY}`;
  let x = 0;
  let up = true;

  while (x < width) {
    const nextX = Math.min(x + wavelength, width);
    const midX = (x + nextX) / 2;
    const ctrlY = up ? midY - amplitude : midY + amplitude;
    d += ` Q ${midX},${ctrlY} ${nextX},${midY}`;
    x = nextX;
    up = !up;
  }
  return d;
};

export const PlayfulShoppingItem: React.FC<PlayfulShoppingItemProps> = ({
  item,
  onToggle,
  onRemove,
}) => {
  const { isDark } = useTheme();
  const [textWidth, setTextWidth] = useState(0);

  const isChecked = item.isChecked;
  const progressAnim = useRef(new Animated.Value(isChecked ? 1 : 0)).current;
  const rowScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isChecked) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(rowScaleAnim, {
            toValue: 0.98,
            duration: 80,
            useNativeDriver: false,
          }),
          Animated.spring(rowScaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 200,
            useNativeDriver: false,
          }),
        ]),
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.bezier(0.2, 0.8, 0.25, 1),
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }
  }, [isChecked]);

  const onTextLayout = (e: LayoutChangeEvent) => {
    const measuredWidth = e.nativeEvent.layout.width;
    if (measuredWidth > 0 && Math.abs(measuredWidth - textWidth) > 1) {
      setTextWidth(measuredWidth);
    }
  };

  const amountText = [item.quantity, item.unit].filter(Boolean).join(' ');

  // Interpolated animated width for the strikethrough wave reveal
  const animatedClipWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, textWidth + 8],
  });

  const animatedTextOpacity = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.55],
  });

  const wavyPath = createWavyPath(textWidth + 8, 8, 2.5, 9);

  return (
    <Animated.View style={{ transform: [{ scale: rowScaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onToggle(item.id)}
        style={[
          styles.itemRow,
          {
            backgroundColor: isDark
              ? isChecked
                ? '#1A1817'
                : '#1F1D1B'
              : isChecked
              ? '#FBF9F7'
              : '#FFFFFF',
            borderColor: isDark
              ? isChecked
                ? '#282624'
                : '#2E2C29'
              : isChecked
              ? '#EFECE6'
              : '#E5E2DC',
          },
        ]}
      >
        {/* Radix Animated Checkbox */}
        <Checkbox
          checked={isChecked}
          onCheckedChange={() => onToggle(item.id)}
          variant="primary"
          size="md"
        />

        {/* Text Container with Animated Playful Wavy Strikethrough */}
        <View style={styles.itemInfo}>
          <View style={styles.textWrapper}>
            <Animated.Text
              onLayout={onTextLayout}
              style={[
                styles.itemName,
                {
                  color: isDark ? '#FBF9F5' : '#1E1D1D',
                  opacity: animatedTextOpacity,
                },
              ]}
            >
              {item.name}
              {amountText.length > 0 && (
                <Text style={styles.amountSuffix}> ({amountText})</Text>
              )}
            </Animated.Text>

            {/* Playful SVG Wavy Strikethrough Overlay */}
            {textWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.strikethroughContainer,
                  { width: animatedClipWidth },
                ]}
              >
                <Svg width={textWidth + 12} height={16} viewBox={`0 0 ${textWidth + 12} 16`}>
                  <Path
                    d={wavyPath}
                    fill="none"
                    stroke={AppColors.primary}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Animated.View>
            )}
          </View>

          {item.recipeName && (
            <Text style={styles.recipeTag} numberOfLines={1}>
              Pour: {item.recipeName}
            </Text>
          )}
        </View>

        {/* Remove item button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          activeOpacity={0.7}
          onPress={() => onRemove(item.id)}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  textWrapper: {
    alignSelf: 'flex-start',
    position: 'relative',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  amountSuffix: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8C8A87',
  },
  strikethroughContainer: {
    position: 'absolute',
    left: -2,
    top: '50%',
    marginTop: -8,
    height: 16,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  recipeTag: {
    fontSize: 11,
    color: '#8C8A87',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
});
