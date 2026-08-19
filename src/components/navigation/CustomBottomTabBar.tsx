import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Keyboard } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { useShopping } from '../../context/ShoppingContext';
import { AppColors } from '../../theme/colors';
import { useNavigationTransition } from '../../context/NavigationTransitionContext';

// 1. Exact Home Icon from Figma
const HomeFigmaIcon = ({ color = '#000000', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15C14.4477 21 14 20.5523 14 20V15C14 14.4477 13.5523 14 13 14H11C10.4477 14 10 14.4477 10 15V20C10 20.5523 9.55228 21 9 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 2. Exact Recipe Document with Chef Hat Icon from Figma
const RecipeFigmaIcon = ({ color = '#000000', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Chef Hat on top-left */}
    <Path
      d="M3 7C2.5 5.5 4 4 5.5 4.5C6.5 3 8.5 3 9.5 4.5C10.5 3.5 12 4.5 11.5 6C12 7.5 10.5 8.5 9 8.5H4C3 8.5 2.5 7.5 3 7Z"
      fill={color}
    />
    {/* Document sheet */}
    <Path
      d="M8 8.5V4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H8C6.89543 20 6 19.1046 6 18V9"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 11H16M10 15H14"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
    />
  </Svg>
);

// 3. Exact Heart Icon from Figma
const HeartFigmaIcon = ({ color = '#000000', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 4. Exact Shopping Basket Icon from Figma
const BasketFigmaIcon = ({ color = '#000000', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9H18L17 19C17 20.1046 16.1046 21 15 21H9C7.89543 21 7 20.1046 7 19L6 9Z"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.5 9L12 3.5L15.5 9"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 13V17M14 13V17"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
    />
  </Svg>
);

// 5. Exact Community Users Icon from Figma
const CommunityFigmaIcon = ({ color = '#000000', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="8" r="3.5" stroke={color} strokeWidth={2.4} />
    <Path
      d="M3 19C3 15.6863 5.68629 13 9 13C12.3137 13 15 15.6863 15 19"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
    />
    <Circle cx="17.5" cy="8.5" r="2.5" stroke={color} strokeWidth={2.3} />
    <Path
      d="M17.5 13.5C19.433 13.5 21 15.067 21 17"
      stroke={color}
      strokeWidth={2.3}
      strokeLinecap="round"
    />
  </Svg>
);

const AnimatedTabItem: React.FC<{
  tab: { name: string; label: string; Icon: any };
  isFocused: boolean;
  isDark: boolean;
  totalCount: number;
  onPress: () => void;
}> = ({ tab, isFocused, isDark, totalCount, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isFocused) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.90,
          duration: 70,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 280,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [isFocused]);

  const iconColor = isFocused ? '#FFFFFF' : (isDark ? '#8C8A87' : '#79747E');

  return (
    <TouchableOpacity
      style={styles.tabItem}
      activeOpacity={isFocused ? 1 : 0.75}
      onPress={isFocused ? undefined : onPress}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          isFocused && styles.activePill,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <tab.Icon color={iconColor} size={22} />

        {/* Shopping Badge on Courses */}
        {tab.name === 'Market' && totalCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {totalCount > 99 ? '99+' : totalCount}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Label with optimized typography and active primary tint */}
      <Text
        style={[
          styles.label,
          {
            color: isFocused
              ? AppColors.primary
              : isDark
              ? '#A8A29E'
              : '#79747E',
            fontWeight: isFocused ? '800' : '600',
          },
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

export const CustomBottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { totalCount } = useShopping();
  const { triggerScreenLoading } = useNavigationTransition();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 20);

  useEffect(() => {
    // 1. Listeners clavier natifs (iOS & Android)
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    // 2. Listeners de focus Web (Mobile Web & Desktop Web)
    let removeWebListeners: (() => void) | undefined;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleFocusIn = (e: FocusEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            (target as any).isContentEditable)
        ) {
          setKeyboardVisible(true);
        }
      };

      const handleFocusOut = () => {
        setKeyboardVisible(false);
      };

      window.addEventListener('focusin', handleFocusIn);
      window.addEventListener('focusout', handleFocusOut);

      removeWebListeners = () => {
        window.removeEventListener('focusin', handleFocusIn);
        window.removeEventListener('focusout', handleFocusOut);
      };
    }

    return () => {
      showSub.remove();
      hideSub.remove();
      removeWebListeners?.();
    };
  }, []);

  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors?.[focusedRoute.key];
  const focusedOptions = focusedDescriptor?.options;

  const tabBarStyle = focusedOptions?.tabBarStyle as any;
  const isTabBarHiddenByOption = tabBarStyle?.display === 'none' || (Array.isArray(tabBarStyle) && tabBarStyle.some((s: any) => s?.display === 'none'));

  // Masquer la barre si le clavier est actif ou si l'écran le demande explicitement
  if (
    isKeyboardVisible ||
    isTabBarHiddenByOption
  ) {
    return null;
  }

  const tabs = [
    { name: 'Home', label: 'Accueil', Icon: HomeFigmaIcon },
    { name: 'Recipes', label: 'Recettes', Icon: RecipeFigmaIcon },
    { name: 'Favorites', label: 'Favoris', Icon: HeartFigmaIcon },
    { name: 'Market', label: 'Courses', Icon: BasketFigmaIcon },
    { name: 'Community', label: 'Communauté', Icon: CommunityFigmaIcon },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#181614' : '#FFFFFF',
          borderColor: isDark ? '#2E2C29' : '#EDE8E1',
          paddingBottom: bottomInset,
          height: 60 + bottomInset,
        },
      ]}
    >
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          if (isFocused) {
            return;
          }

          triggerScreenLoading(tab.name);
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[index]?.key || tab.name,
            canPreventDefault: true,
          });

          if (!event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };

        return (
          <AnimatedTabItem
            key={tab.name}
            tab={tab}
            isFocused={isFocused}
            isDark={isDark}
            totalCount={totalCount}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 4,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 100,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  iconWrapper: {
    width: 56,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  activePill: {
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 6,
    backgroundColor: AppColors.primary,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
});
