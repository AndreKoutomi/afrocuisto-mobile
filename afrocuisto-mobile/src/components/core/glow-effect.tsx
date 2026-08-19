import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, { Rect, Defs, Filter, FeGaussianBlur, LinearGradient, Stop } from 'react-native-svg';

export interface GlowEffectProps {
  colors?: string[];
  mode?: 'colorShift' | 'rotate' | 'flowHorizontal' | 'static';
  blur?: 'soft' | 'medium' | 'strong' | number;
  duration?: number;
  scale?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * GlowEffect — Halo coloré animé 360° cross-platform (iOS + Android + Web).
 *
 * Technique :
 *   - react-native-svg + feGaussianBlur → vrai flou gaussien 360° sur toutes plateformes.
 *   - N couches SVG statiques (une par couleur) encapsulées dans Animated.View.
 *   - Cross-fade d'opacité entre les couches via RN Animated (pas d'AnimatedStop).
 *   - Évite l'erreur Reanimated "Cannot find host instance" (SVG Stop n'est pas une vue hôte).
 */
export const GlowEffect: React.FC<GlowEffectProps> = ({
  colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F'],
  mode = 'colorShift',
  blur = 'soft',
  duration = 3,
}) => {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  // Un Animated.Value d'opacité par couleur
  const opacities = useRef(
    colors.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setLayout({ width, height });
  };

  // ─── Intensité du flou SVG (stdDeviation) ────────────────────────────────
  const getStdDev = (): number => {
    if (typeof blur === 'number') return blur;
    switch (blur) {
      case 'soft':   return 12;
      case 'medium': return 20;
      case 'strong': return 32;
      default:       return 12;
    }
  };
  const stdDev = getStdDev();

  // Padding autour du SVG pour éviter que le flou soit coupé aux bords
  const pad = stdDev * 2.5;

  // ─── Animation cross-fade séquentielle ───────────────────────────────────
  useEffect(() => {
    if (mode === 'static') return;

    const stepMs = (duration * 1000) / colors.length;

    const steps = colors.map((_, i) => {
      const next = (i + 1) % colors.length;
      return Animated.parallel([
        Animated.timing(opacities[i], {
          toValue: 0,
          duration: stepMs,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacities[next], {
          toValue: 1,
          duration: stepMs,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]);
    });

    const loop = Animated.loop(Animated.sequence(steps));
    loop.start();
    return () => loop.stop();
  }, [duration, colors.length, mode]);

  const { width, height } = layout;
  const svgW = width  + pad * 2;
  const svgH = height + pad * 2;
  const cardRadius = 24;
  const glowOpacity = 0.72;

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
      pointerEvents="none"
    >
      {width > 0 &&
        height > 0 &&
        colors.map((color, i) => {
          const next = colors[(i + 1) % colors.length];

          return (
            <Animated.View
              key={i}
              style={[
                StyleSheet.absoluteFillObject,
                { opacity: opacities[i] },
              ]}
            >
              <Svg
                width={svgW}
                height={svgH}
                style={{
                  position: 'absolute',
                  top: -pad,
                  left: -pad,
                  overflow: 'visible',
                }}
              >
                <Defs>
                  {/* ── Filtre de flou gaussien 360° ─────────────────── */}
                  <Filter
                    id={`glowBlur${i}`}
                    x="-60%"
                    y="-60%"
                    width="220%"
                    height="220%"
                  >
                    <FeGaussianBlur in="SourceGraphic" stdDeviation={stdDev} />
                  </Filter>

                  {/* ── Dégradé bicolore statique ─────────────────────── */}
                  <LinearGradient
                    id={`glowGrad${i}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <Stop offset="0%"   stopColor={color} stopOpacity="1" />
                    <Stop offset="50%"  stopColor={next}  stopOpacity="1" />
                    <Stop offset="100%" stopColor={color} stopOpacity="1" />
                  </LinearGradient>
                </Defs>

                {/* Rectangle avec flou gaussien = halo 360° */}
                <Rect
                  x={pad}
                  y={pad}
                  width={width}
                  height={height}
                  rx={cardRadius}
                  ry={cardRadius}
                  fill={`url(#glowGrad${i})`}
                  filter={`url(#glowBlur${i})`}
                  opacity={glowOpacity}
                />
              </Svg>
            </Animated.View>
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
});
