import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';

interface DraggableStoryElementProps {
  initialX: number; // En pourcentage (0 à 100)
  initialY: number; // En pourcentage (0 à 100)
  containerWidth: number;
  containerHeight: number;
  onPositionChange: (x: number, y: number) => void;
  onTap?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
}

export const DraggableStoryElement: React.FC<DraggableStoryElementProps> = ({
  initialX,
  initialY,
  containerWidth,
  containerHeight,
  onPositionChange,
  onTap,
  onLongPress,
  children,
}) => {
  const [posX, setPosX] = useState(initialX);
  const [posY, setPosY] = useState(initialY);
  const [isDragging, setIsDragging] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const startPosRef = useRef({ x: initialX, y: initialY });
  const pressTimerRef = useRef<any>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    setPosX(initialX);
    setPosY(initialY);
  }, [initialX, initialY]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setDimensions({ width, height });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState: PanResponderGestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        startPosRef.current = { x: posX, y: posY };
        setIsDragging(true);
        isLongPressRef.current = false;

        Animated.spring(scaleAnim, {
          toValue: 1.08,
          friction: 4,
          tension: 200,
          useNativeDriver: false,
        }).start();

        // Détection de Long Press
        pressTimerRef.current = setTimeout(() => {
          isLongPressRef.current = true;
          if (onLongPress) {
            onLongPress();
          }
        }, 600);
      },
      onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
        if (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6) {
          if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
            pressTimerRef.current = null;
          }
        }

        if (containerWidth > 0 && containerHeight > 0) {
          const deltaXPercent = (gestureState.dx / containerWidth) * 100;
          const deltaYPercent = (gestureState.dy / containerHeight) * 100;

          // Borner pour rester dans les limites du cadre de story (5% à 95%)
          const newX = Math.min(Math.max(startPosRef.current.x + deltaXPercent, 8), 92);
          const newY = Math.min(Math.max(startPosRef.current.y + deltaYPercent, 8), 92);

          setPosX(newX);
          setPosY(newY);
        }
      },
      onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
        setIsDragging(false);

        if (pressTimerRef.current) {
          clearTimeout(pressTimerRef.current);
          pressTimerRef.current = null;
        }

        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 200,
          useNativeDriver: false,
        }).start();

        // Calcul final de la position
        if (containerWidth > 0 && containerHeight > 0) {
          const deltaXPercent = (gestureState.dx / containerWidth) * 100;
          const deltaYPercent = (gestureState.dy / containerHeight) * 100;

          const finalX = Math.min(Math.max(startPosRef.current.x + deltaXPercent, 8), 92);
          const finalY = Math.min(Math.max(startPosRef.current.y + deltaYPercent, 8), 92);

          onPositionChange(finalX, finalY);
        }

        // Tap simple si pas de déplacement significatif et pas de long press
        if (
          !isLongPressRef.current &&
          Math.abs(gestureState.dx) < 6 &&
          Math.abs(gestureState.dy) < 6
        ) {
          if (onTap) {
            onTap();
          }
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        if (pressTimerRef.current) {
          clearTimeout(pressTimerRef.current);
          pressTimerRef.current = null;
        }
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      onLayout={handleLayout}
      style={[
        styles.draggableContainer,
        {
          left: `${posX}%`,
          top: `${posY}%`,
          transform: [
            { translateX: dimensions.width > 0 ? -dimensions.width / 2 : 0 },
            { translateY: dimensions.height > 0 ? -dimensions.height / 2 : 0 },
            { scale: scaleAnim },
          ],
          zIndex: isDragging ? 99 : 30,
        },
      ]}
    >
      <View
        style={[
          styles.contentWrapper,
          isDragging && styles.contentWrapperDragging,
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  draggableContainer: {
    position: 'absolute',
  },
  contentWrapper: {
    borderRadius: 14,
  },
  contentWrapperDragging: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
});

