import React, { useEffect, useRef, useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Animated,
  Easing,
  View,
} from 'react-native';
import { Heart, Bookmark } from 'lucide-react-native';
import { AppColors } from '../../theme/colors';

interface FavoriteIconButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  iconType?: 'heart' | 'bookmark';
  size?: number;
  iconSize?: number;
  activeColor?: string;
  inactiveColor?: string;
  activeBgColor?: string;
  inactiveBgColor?: string;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  showBorder?: boolean;
}

const PARTICLE_COUNT = 8;
const PARTICLE_COLORS = [
  '#FB5607',
  '#F59E0B',
  '#FF1E00',
  '#FBBF24',
  '#EF4444',
  '#FF7A2A',
  '#F43F5E',
  '#FB923C',
];

export const FavoriteIconButton: React.FC<FavoriteIconButtonProps> = ({
  isFavorite,
  onToggle,
  iconType = 'heart',
  size = 32,
  iconSize = 16,
  activeColor = AppColors.likeRed,
  inactiveColor = '#FFFFFF',
  activeBgColor,
  inactiveBgColor,
  style,
  borderColor,
  showBorder = false,
}) => {
  const [particlesActive, setParticlesActive] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  const burstAnim = useRef(new Animated.Value(0)).current;
  const ringScaleAnim = useRef(new Animated.Value(0)).current;
  const ringOpacityAnim = useRef(new Animated.Value(0)).current;

  const prevFavRef = useRef(isFavorite);

  useEffect(() => {
    // Only trigger burst when becoming favorite (active)
    if (!prevFavRef.current && isFavorite) {
      setParticlesActive(true);
      burstAnim.setValue(0);
      ringScaleAnim.setValue(0.3);
      ringOpacityAnim.setValue(0.8);

      Animated.parallel([
        // Button pop
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.82,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.22,
            friction: 3,
            tension: 250,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 200,
            useNativeDriver: true,
          }),
        ]),
        // Icon pop
        Animated.sequence([
          Animated.timing(iconScaleAnim, {
            toValue: 0.6,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.spring(iconScaleAnim, {
            toValue: 1.35,
            friction: 3.5,
            tension: 220,
            useNativeDriver: true,
          }),
          Animated.spring(iconScaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 200,
            useNativeDriver: true,
          }),
        ]),
        // Particles explosion
        Animated.timing(burstAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Shockwave Ring
        Animated.timing(ringScaleAnim, {
          toValue: 1.6,
          duration: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacityAnim, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setParticlesActive(false);
      });
    } else if (prevFavRef.current && !isFavorite) {
      // Gentle deselect animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.88,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevFavRef.current = isFavorite;
  }, [isFavorite]);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.88,
      duration: 60,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const IconComponent = iconType === 'heart' ? Heart : Bookmark;

  const resolvedBg = isFavorite
    ? activeBgColor || (iconType === 'bookmark' ? '#FFF2EE' : AppColors.likeRed)
    : inactiveBgColor || 'rgba(0, 0, 0, 0.35)';

  const resolvedIconColor = isFavorite
    ? activeColor
    : inactiveColor;

  const resolvedFill = isFavorite
    ? activeColor
    : 'transparent';

  // Calculate burst particles
  const maxDistance = size * 0.75;
  const particleDistance = burstAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxDistance],
  });

  const particleOpacity = burstAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 0.8, 0],
  });

  const particleScale = burstAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.4, 1.2, 0],
  });

  return (
    <View style={[styles.wrapper, { width: size + 20, height: size + 20 }]}>
      {/* Particle Burst Layer */}
      {particlesActive && (
        <>
          {/* Shockwave circle */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shockwaveRing,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: activeColor,
                transform: [{ scale: ringScaleAnim }],
                opacity: ringOpacityAnim,
              },
            ]}
          />

          {/* 8 Radial Particles */}
          {Array.from({ length: PARTICLE_COUNT }).map((_, index) => {
            const angle = (index * (2 * Math.PI)) / PARTICLE_COUNT;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const particleColor = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
            const pSize = index % 2 === 0 ? 5 : 3.5;

            const translateX = Animated.multiply(particleDistance, cos);
            const translateY = Animated.multiply(particleDistance, sin);

            return (
              <Animated.View
                key={index}
                pointerEvents="none"
                style={[
                  styles.particle,
                  {
                    width: pSize,
                    height: pSize,
                    borderRadius: pSize / 2,
                    backgroundColor: particleColor,
                    transform: [
                      { translateX },
                      { translateY },
                      { scale: particleScale },
                    ],
                    opacity: particleOpacity,
                  },
                ]}
              />
            );
          })}
        </>
      )}

      {/* Main Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchArea}
      >
        <Animated.View
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: resolvedBg,
              borderWidth: showBorder ? 1 : 0,
              borderColor: borderColor || 'rgba(255,255,255,0.3)',
              transform: [{ scale: scaleAnim }],
            },
            style,
          ]}
        >
          <Animated.View
            style={{
              transform: [{ scale: iconScaleAnim }],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComponent
              size={iconSize}
              color={resolvedIconColor}
              fill={resolvedFill}
            />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  touchArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  particle: {
    position: 'absolute',
    zIndex: 10,
  },
  shockwaveRing: {
    position: 'absolute',
    borderWidth: 2,
    zIndex: 5,
  },
});
