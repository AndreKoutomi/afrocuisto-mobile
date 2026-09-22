import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { User, Bell, Search, Sparkles, X } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { Recipe } from '../../types/recipe';
import { SearchSuggestionsDropdown } from './SearchSuggestionsDropdown';

interface HomeHeaderProps {
  onProfilePress: () => void;
  onNotificationPress: () => void;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  onSearchClear?: () => void;
  isSearchOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onAiPress?: () => void;
  onSelectRecipe?: (recipe: Recipe) => void;
  onSelectAiSearch?: (query: string) => void;
  onSelectCategory?: (category: string) => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onProfilePress,
  onNotificationPress,
  searchQuery = '',
  onSearchChange,
  onSearchClear,
  isSearchOpen,
  onOpenChange,
  onFocus,
  onBlur,
  onAiPress,
  onSelectRecipe,
  onSelectAiSearch,
  onSelectCategory,
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Use isSearchOpen prop directly (controlled by parent) instead of internal state
  const isOpen = isSearchOpen ?? searchQuery.length > 0;

  const searchProgress = useSharedValue(isOpen ? 1 : 0);

  const userName = user?.name ? user.name.split(' ')[0] : 'André';

  // Animate searchProgress when isOpen changes (controlled by parent)
  useEffect(() => {
    if (isOpen) {
      searchProgress.value = withTiming(1, {
        duration: 160,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      searchProgress.value = withTiming(
        0,
        {
          duration: 130,
          easing: Easing.in(Easing.cubic),
        }
      );
    }
  }, [isOpen]);

  // Synchronisation si searchQuery est modifié depuis l'extérieur (ouvrir la recherche si du texte)
  useEffect(() => {
    if (searchQuery.length > 0 && !isOpen) {
      onOpenChange?.(true);
    }
  }, [searchQuery, isOpen, onOpenChange]);

  const handleOpenSearch = () => {
    // 1. Déclencher l'animation UI thread immédiatement (0ms de latence)
    searchProgress.value = withTiming(1, {
      duration: 160,
      easing: Easing.out(Easing.cubic),
    });
    onOpenChange?.(true);

    // 2. Sur Android, différer le focus du clavier après l'animation pour éviter le blocage synchrone du thread UI
    const focusDelay = Platform.OS === 'android' ? 160 : 30;
    setTimeout(() => {
      inputRef.current?.focus();
    }, focusDelay);
  };

  const handleCloseSearch = () => {
    Keyboard.dismiss();
    onSearchClear?.();
    onSearchChange?.('');
    searchProgress.value = withTiming(
      0,
      {
        duration: 130,
        easing: Easing.in(Easing.cubic),
      },
      () => {
        onOpenChange?.(false);
      }
    );
  };

  const handleFocus = () => {
    setIsInputFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsInputFocused(false);
    onBlur?.();
  };

  // Styles animés synchronisés pour le contenu classique du Header
  const headerContentAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(searchProgress.value, [0, 0.5, 1], [1, 0.3, 0], 'clamp');
    const translateX = interpolate(searchProgress.value, [0, 1], [0, -15], 'clamp');
    const scale = interpolate(searchProgress.value, [0, 1], [1, 0.96], 'clamp');

    return {
      opacity,
      transform: [{ translateX }, { scale }],
    };
  });

  // Styles animés synchronisés pour la barre de recherche dépliée
  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(searchProgress.value, [0, 0.3, 1], [0, 0.7, 1], 'clamp');
    const translateX = interpolate(searchProgress.value, [0, 1], [25, 0], 'clamp');
    const scale = interpolate(searchProgress.value, [0, 1], [0.94, 1], 'clamp');

    return {
      opacity,
      transform: [{ translateX }, { scale }],
    };
  });

  // Styles animés synchronisés pour le Dropdown Menu attaché
  const dropdownAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(searchProgress.value, [0.2, 1], [0, 1], 'clamp');
    const translateY = interpolate(searchProgress.value, [0.1, 1], [-12, 0], 'clamp');
    const scale = interpolate(searchProgress.value, [0.1, 1], [0.96, 1], 'clamp');

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? AppColors.backgroundDark : '#FFFFFF',
        },
      ]}
    >
      <View style={styles.headerRowWrapper}>
        {/* 1. Header classique (Avatar + Salutation + Actions Recherche & Notification) */}
        <Animated.View
          style={[styles.topRow, headerContentAnimatedStyle]}
          pointerEvents={isOpen ? 'none' : 'auto'}
        >
          <TouchableOpacity
            style={styles.profileBtn}
            activeOpacity={0.8}
            onPress={onProfilePress}
          >
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: isDark ? 'rgba(251, 86, 7, 0.18)' : '#FFF5F0',
                  borderColor: isDark ? 'rgba(251, 86, 7, 0.35)' : 'rgba(251, 86, 7, 0.22)',
                },
              ]}
            >
              <User
                size={22}
                color={isDark ? AppColors.primaryLight : AppColors.primary}
              />
            </View>
            <View>
              <Text
                style={[
                  styles.greetingText,
                  { color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary },
                ]}
              >
                Salut, {userName}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Boutons d'actions à droite : Search (à gauche) + Notification Bell */}
          <View style={styles.actionsRow}>
            {/* Bouton Recherche déclencheur */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isDark ? AppColors.surfaceDark : '#FFF5F0',
                  borderColor: isDark ? AppColors.borderDark : 'rgba(251, 86, 7, 0.20)',
                },
              ]}
              activeOpacity={0.8}
              onPress={handleOpenSearch}
              accessibilityLabel="Ouvrir la recherche"
            >
              <Search
                size={20}
                color={AppColors.primary}
                strokeWidth={2.3}
              />
            </TouchableOpacity>

            {/* Bouton Notification */}
            <TouchableOpacity
              style={[
                styles.notifBtn,
                {
                  backgroundColor: isDark ? AppColors.surfaceDark : AppColors.primary,
                  borderColor: isDark ? AppColors.borderDark : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
              activeOpacity={0.8}
              onPress={onNotificationPress}
              accessibilityLabel="Notifications"
            >
              <Bell
                size={20}
                color={isDark ? AppColors.primaryLight : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 2. Barre de recherche animée dépliante qui couvre tout le Header */}
        <Animated.View
          style={[
            styles.expandedSearchWrapper,
            searchBarAnimatedStyle,
            {
              backgroundColor: isDark ? AppColors.surfaceDark : '#F8F7F4',
              borderColor: isInputFocused
                ? AppColors.primary
                : isDark
                ? AppColors.borderDark
                : 'rgba(251, 86, 7, 0.22)',
            },
          ]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          {/* Icône Loupe gauche */}
          <View style={styles.searchIconWrap}>
            <Search size={18} color={AppColors.primary} strokeWidth={2.4} />
          </View>

          {/* Champ de saisie interactif */}
          <TextInput
            ref={inputRef}
            value={searchQuery}
            onChangeText={onSearchChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Gboman, Alloco, Dja, Sauce Gombo..."
            placeholderTextColor={isDark ? AppColors.textDarkSecondary : AppColors.textSecondary}
            selectionColor={AppColors.primary}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={[
              styles.searchInput,
              { color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary },
            ]}
          />

          {/* Bouton IA si vide */}
          {searchQuery.length === 0 && onAiPress && (
            <TouchableOpacity
              style={styles.aiTag}
              activeOpacity={0.8}
              onPress={onAiPress}
            >
              <Sparkles size={11} color="#FFFFFF" />
              <Text style={styles.aiTagText}>IA</Text>
            </TouchableOpacity>
          )}

          {/* Bouton Fermeture / Reset (X) */}
          <TouchableOpacity
            onPress={handleCloseSearch}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[
              styles.closeSearchBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              },
            ]}
            activeOpacity={0.7}
            accessibilityLabel="Fermer la recherche"
          >
            <X
              size={17}
              color={isDark ? AppColors.textDarkPrimary : AppColors.textPrimary}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* 3. Dropdown Menu de suggestions - TOUJOURS MONTÉ pour éviter les bugs de hooks lors de l'animation */}
      <Animated.View
        style={[
          styles.dropdownAnchor,
          dropdownAnimatedStyle,
          // Cacher du layout quand fermé (opacity 0 + pointerEvents none)
          { pointerEvents: isOpen ? 'auto' : 'none' },
        ]}
      >
        <SearchSuggestionsDropdown
          searchQuery={searchQuery}
          onSelectRecipe={recipe => {
            handleCloseSearch();
            onSelectRecipe?.(recipe);
          }}
          onSelectAiSearch={query => {
            handleCloseSearch();
            onSelectAiSearch?.(query);
          }}
          onSelectCategory={category => {
            handleCloseSearch();
            onSelectCategory?.(category);
          }}
          onSelectSuggestionText={text => {
            onSearchChange?.(text);
          }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    position: 'relative',
    zIndex: 9999,
  },
  headerRowWrapper: {
    position: 'relative',
    height: 48,
    justifyContent: 'center',
    zIndex: 9999,
  },
  dropdownAnchor: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    zIndex: 99999,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  greetingText: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  expandedSearchWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1.2,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 4,
    margin: 0,
  },
  closeSearchBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  aiTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
