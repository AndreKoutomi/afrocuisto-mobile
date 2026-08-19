import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Utensils, ShoppingBag, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { AuthLogo } from '../../components/auth/AuthLogo';
import { AuthButton } from '../../components/auth/AuthButton';

const { width } = Dimensions.get('window');

interface SlideItem {
  id: string;
  icon: (isDark: boolean) => React.ReactNode;
  title: string;
  subtitle: string;
}

const SLIDES: SlideItem[] = [
  {
    id: '1',
    icon: () => (
      <View style={[styles.iconCircle, { backgroundColor: '#FFF0EB' }]}>
        <Utensils size={48} color={AppColors.primary} strokeWidth={2.2} />
      </View>
    ),
    title: 'Recettes Authentiques\nd’Afrique',
    subtitle: 'Explorez des centaines de spécialités culinaires africaines avec des étapes claires et détaillées.',
  },
  {
    id: '2',
    icon: () => (
      <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
        <ShoppingBag size={48} color="#D97706" strokeWidth={2.2} />
      </View>
    ),
    title: 'Votre Marché\net Ingrédients',
    subtitle: 'Constituez votre liste de courses et trouvez tous les ingrédients indispensables pour vos plats.',
  },
  {
    id: '3',
    icon: () => (
      <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
        <Sparkles size={48} color="#059669" strokeWidth={2.2} />
      </View>
    ),
    title: 'Votre Chef IA\nPersonnalisé',
    subtitle: 'Obtenez des suggestions de recettes sur mesure selon vos envies et les aliments de votre frigo.',
  },
];

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (width - 48));
    if (index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('Register');
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? AppColors.backgroundDark : '#FFFFFF' },
      ]}
    >
      {/* Top Afrocuisto Logo */}
      <View style={styles.topLogoRow}>
        <AuthLogo size={58} />
      </View>

      {/* Slides Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: width - 48 }]}>
              <View style={styles.illustrationBox}>{item.icon(isDark)}</View>

              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#FFFFFF' : '#111827' },
                ]}
              >
                {item.title}
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? '#9CA3AF' : '#6B7280' },
                ]}
              >
                {item.subtitle}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Pagination Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex
                ? [styles.dotActive, { backgroundColor: AppColors.primary }]
                : [
                    styles.dotInactive,
                    { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                  ],
            ]}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <AuthButton
          title={currentIndex === SLIDES.length - 1 ? 'COMMENCER' : 'SUIVANT'}
          showArrow
          onPress={handleNext}
          style={styles.primaryBtn}
        />

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.secondaryBtnText,
              { color: isDark ? '#D1D5DB' : '#374151' },
            ]}
          >
            Déjà un compte ? <Text style={{ color: AppColors.primary, fontWeight: '700' }}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topLogoRow: {
    alignItems: 'center',
    paddingTop: 16,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  illustrationBox: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
  },
  dotInactive: {
    width: 8,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    width: '100%',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
