import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { AppColors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
  icon?: (props: { color: string; size: number }) => React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  style,
}) => {
  const { isDark } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const activeIndex = Math.max(
    0,
    tabs.findIndex(t => t.key === activeTab)
  );

  const animValue = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: activeIndex,
      friction: 20,
      tension: 180,
      useNativeDriver: false,
    }).start();
  }, [activeIndex]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const padding = 4;
  const availableWidth = containerWidth > 0 ? containerWidth - padding * 2 : 0;
  const tabWidth = tabs.length > 0 && availableWidth > 0 ? availableWidth / tabs.length : 0;

  const translateX = animValue.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * tabWidth),
  });

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.tabContainer,
        {
          backgroundColor: isDark ? '#211F1D' : '#F2EFE9',
        },
        style,
      ]}
    >
      {/* Sliding Active Pill Indicator */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              width: tabWidth,
              backgroundColor: AppColors.primary,
              transform: [{ translateX }],
            },
          ]}
        />
      )}

      {/* Tab Triggers */}
      {tabs.map((tab, idx) => {
        const isActive = tab.key === activeTab;
        const countText = tab.count !== undefined ? ` (${tab.count})` : '';

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabTrigger}
            activeOpacity={0.75}
            onPress={() => onTabChange(tab.key)}
          >
            {tab.icon && (
              <View style={styles.iconWrapper}>
                {tab.icon({
                  size: 16,
                  color: isActive
                    ? '#FFFFFF'
                    : isDark
                    ? '#8C8A87'
                    : '#73706B',
                })}
              </View>
            )}
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive
                    ? '#FFFFFF'
                    : isDark
                    ? '#A8A29E'
                    : '#73706B',
                  fontWeight: isActive ? '800' : '600',
                },
              ]}
            >
              {tab.label}
              {countText}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

interface AnimatedTabContentProps {
  children: React.ReactNode;
  tabKey: string;
}

export const AnimatedTabContent: React.FC<AnimatedTabContentProps> = ({
  children,
  tabKey,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(8);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 18,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tabKey]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    marginVertical: 12,
    position: 'relative',
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 20,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  tabTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    zIndex: 2,
    gap: 6,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
});
