import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface GlowingEdgeBorderProps {
  children: React.ReactNode;
  borderRadius?: number;
  borderWidth?: number;
  glowIntensity?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  isDark?: boolean;
}

/**
 * Composant de bordure lumineuse dynamique 'Glowing Edge' (façon Apple Intelligence / Gemini Glow).
 * Utilise des calques de forme vectoriels, des dégradés multi-couleurs et l'animation de trim-path (strokeDashoffset).
 */
export const GlowingEdgeBorder: React.FC<GlowingEdgeBorderProps> = ({
  children,
  borderRadius = 24,
  borderWidth = 2.5,
  glowIntensity = 1,
  duration = 3200,
  style,
  isDark = true,
}) => {
  const [layout, setLayout] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const progress = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  useEffect(() => {
    // Animation continue en boucle infinie (trim path & rotation)
    const animLoop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animLoop.start();
    rotateLoop.start();

    return () => {
      animLoop.stop();
      rotateLoop.stop();
    };
  }, [duration]);

  const { width, height } = layout;
  // Calcul précis du périmètre du rectangle arrondi
  const straightLength = 2 * (Math.max(0, width - 2 * borderRadius) + Math.max(0, height - 2 * borderRadius));
  const cornerLength = 2 * Math.PI * borderRadius;
  const perimeter = Math.max(100, straightLength + cornerLength);

  // Longueur du faisceau lumineux voyageur (trim path)
  const beamLength = Math.max(120, perimeter * 0.42);
  const strokeDasharray = `${beamLength} ${perimeter - beamLength}`;

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -perimeter],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.wrapper, style]} onLayout={handleLayout}>
      {width > 0 && height > 0 && (
        <>
          {/* Calque 1 : Halo diffus extérieur pour l'effet de lueur (Glow Blur Spread) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="edgeGlowGradOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#00D2FF" stopOpacity="0.9" />
                  <Stop offset="25%" stopColor="#7928CA" stopOpacity="0.95" />
                  <Stop offset="50%" stopColor="#FF0080" stopOpacity="1" />
                  <Stop offset="75%" stopColor="#FB5607" stopOpacity="0.95" />
                  <Stop offset="88%" stopColor="#FFBE0B" stopOpacity="0.95" />
                  <Stop offset="100%" stopColor="#00F260" stopOpacity="0.9" />
                </LinearGradient>
              </Defs>
              {/* Ombre portée diffuse externe */}
              <AnimatedRect
                x={borderWidth / 2}
                y={borderWidth / 2}
                width={width - borderWidth}
                height={height - borderWidth}
                rx={borderRadius}
                ry={borderRadius}
                fill="none"
                stroke="url(#edgeGlowGradOuter)"
                strokeWidth={borderWidth * 2.8}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                opacity={isDark ? 0.7 * glowIntensity : 0.5 * glowIntensity}
              />
            </Svg>
          </View>

          {/* Calque 2 : Contour lumineux net et éclatant (Crisp Trim-Path Beam) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="edgeGlowGradCore" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#38BDF8" />
                  <Stop offset="20%" stopColor="#A855F7" />
                  <Stop offset="45%" stopColor="#EC4899" />
                  <Stop offset="65%" stopColor="#FB5607" />
                  <Stop offset="82%" stopColor="#FACC15" />
                  <Stop offset="100%" stopColor="#34D399" />
                </LinearGradient>
              </Defs>
              {/* Ligne de contour vive en trim-path */}
              <AnimatedRect
                x={borderWidth / 2}
                y={borderWidth / 2}
                width={width - borderWidth}
                height={height - borderWidth}
                rx={borderRadius}
                ry={borderRadius}
                fill="none"
                stroke="url(#edgeGlowGradCore)"
                strokeWidth={borderWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </>
      )}

      {/* Contenu enfant (Carte Assistant Chef) */}
      <View style={{ borderRadius, overflow: 'hidden', width: '100%' }}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    borderRadius: 24,
    shadowColor: '#FB5607',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
});
