import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, ViewStyle, View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline, Polygon } from 'react-native-svg';

export type IconNodeItem = [tag: string, attrs: Record<string, any>];
export type IconNode = IconNodeItem[];

// Vector definitions compliant with Lucide icon data
export const Play: IconNode = [
  ['polygon', { points: '6 3 20 12 6 21 6 3' }],
];

export const Pause: IconNode = [
  ['rect', { x: '6', y: '4', width: '4', height: '16', rx: '1' }],
  ['rect', { x: '14', y: '4', width: '4', height: '16', rx: '1' }],
];

export const Menu: IconNode = [
  ['line', { x1: '4', y1: '6', x2: '20', y2: '6' }],
  ['line', { x1: '4', y1: '12', x2: '20', y2: '12' }],
  ['line', { x1: '4', y1: '18', x2: '20', y2: '18' }],
];

export const X: IconNode = [
  ['line', { x1: '18', y1: '6', x2: '6', y2: '18' }],
  ['line', { x1: '6', y1: '6', x2: '18', y2: '18' }],
];

export interface MorphIconProps {
  icon?: IconNode | any;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  style?: StyleProp<ViewStyle>;
}

/**
 * MorphIcon avec physique de ressort fluide (Spring Physics) et morphing Play / Pause
 * 100% autonome, zéro dépendance à des modules externes .mjs, garanti sans crash.
 */
export const MorphIcon: React.FC<MorphIconProps> = ({
  icon = Play,
  size = 24,
  color = '#FFFFFF',
  strokeWidth = 2.4,
  style,
}) => {
  const numericSize = typeof size === 'number' ? size : parseFloat(size) || 24;
  const numericStroke = typeof strokeWidth === 'number' ? strokeWidth : parseFloat(strokeWidth) || 2.4;

  const [activeIcon, setActiveIcon] = useState<any>(icon);
  const [outgoingIcon, setOutgoingIcon] = useState<any>(null);

  const anim = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (icon !== activeIcon) {
      setOutgoingIcon(activeIcon);
      setActiveIcon(icon);
      anim.setValue(0);

      Animated.spring(anim, {
        toValue: 1,
        friction: 12,
        tension: 190,
        useNativeDriver: true,
      }).start(() => {
        setOutgoingIcon(null);
      });
    }
  }, [icon]);

  // Spring animations: Rotation 90° + Scale pop + Opacity crossfade
  const scaleIn = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.55, 1.22, 1],
  });

  const rotateIn = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  const opacityIn = anim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.8, 1],
  });

  const scaleOut = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.65, 0.25],
  });

  const rotateOut = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const opacityOut = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0.2, 0],
  });

  const renderNodes = (data: any) => {
    if (!data) return null;
    if (Array.isArray(data)) {
      return data.map(([tag, attrs], idx) => {
        const key = `${tag}-${idx}`;
        const nodeProps = {
          ...attrs,
          stroke: color,
          strokeWidth: numericStroke,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
          fill: tag === 'polygon' || tag === 'rect' ? color : 'none',
        };

        if (tag === 'polygon') return <Polygon key={key} points={attrs.points} {...nodeProps} />;
        if (tag === 'rect') return <Rect key={key} x={attrs.x} y={attrs.y} width={attrs.width} height={attrs.height} rx={attrs.rx || '1'} ry={attrs.ry || '1'} {...nodeProps} />;
        if (tag === 'line') return <Line key={key} x1={attrs.x1} y1={attrs.y1} x2={attrs.x2} y2={attrs.y2} {...nodeProps} />;
        if (tag === 'circle') return <Circle key={key} cx={attrs.cx} cy={attrs.cy} r={attrs.r} {...nodeProps} />;
        if (tag === 'path') return <Path key={key} d={attrs.d} {...nodeProps} />;
        return null;
      });
    }

    if (typeof data === 'function') {
      const IconComponent = data;
      return <IconComponent size={numericSize} color={color} />;
    }

    return null;
  };

  return (
    <View
      style={[
        styles.container,
        { width: numericSize, height: numericSize },
        style,
      ]}
    >
      {outgoingIcon && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.centered,
            {
              opacity: opacityOut,
              transform: [{ scale: scaleOut }, { rotate: rotateOut }],
            },
          ]}
          pointerEvents="none"
        >
          <Svg width={numericSize} height={numericSize} viewBox="0 0 24 24" fill="none">
            {renderNodes(outgoingIcon)}
          </Svg>
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.centered,
          {
            width: numericSize,
            height: numericSize,
            opacity: outgoingIcon ? opacityIn : 1,
            transform: outgoingIcon ? [{ scale: scaleIn }, { rotate: rotateIn }] : [],
          },
        ]}
      >
        <Svg width={numericSize} height={numericSize} viewBox="0 0 24 24" fill="none">
          {renderNodes(activeIcon)}
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
