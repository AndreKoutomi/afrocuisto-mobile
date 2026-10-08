import React from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShimmerSkeleton } from './ShimmerSkeleton';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';

// 1. Skeleton for Popular Dish Card & Grid Cards (Sans bordure grise pour un rendu 100% épuré)
export const RecipeCardSkeleton: React.FC<{ isGrid?: boolean }> = ({ isGrid = false }) => {
  const { isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = Math.min(windowWidth || 390, 412);
  const cardWidth = Math.floor((screenWidth - 32 - 10) / 2);

  return (
    <View
      style={[
        styles.dishCard,
        { width: isGrid ? '100%' : cardWidth },
        isGrid ? styles.gridCard : styles.horizontalCard,
        {
          backgroundColor: isDark ? '#1A1816' : '#F5F3EF',
        },
      ]}
    >
      {/* Image Skeleton */}
      <ShimmerSkeleton
        width="100%"
        height={124}
        borderRadius={12}
      />

      {/* Title lines */}
      <View style={{ gap: 6, marginTop: 8, paddingHorizontal: 4 }}>
        <ShimmerSkeleton width="85%" height={14} borderRadius={5} />
        <ShimmerSkeleton width="60%" height={12} borderRadius={4} />
      </View>

      {/* Meta Pills Row */}
      <View style={styles.metaRow}>
        <ShimmerSkeleton width={60} height={20} borderRadius={8} />
        <ShimmerSkeleton width={45} height={20} borderRadius={8} />
      </View>
    </View>
  );
};

// 2. Skeleton for Featured Figma Carousel Card
export const CarouselSkeleton: React.FC = () => {
  const { width } = useWindowDimensions();
  const { isDark } = useTheme();
  const cardWidth = Math.min(Math.round(width * 0.86), 360);

  return (
    <View style={styles.carouselWrapper}>
      <View
        style={[
          styles.carouselCard,
          {
            width: cardWidth,
            backgroundColor: isDark ? '#1A1816' : '#E8E5DF',
          },
        ]}
      >
        <ShimmerSkeleton width="100%" height={245} borderRadius={28} />
      </View>
    </View>
  );
};

// 3. Full Home Screen Skeleton (Miroir 1:1 de l'écran d'accueil)
export const HomeScreenSkeleton: React.FC = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 135 }}>
      {/* First Choice Guide Skeleton */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 }}>
        <ShimmerSkeleton width={220} height={20} borderRadius={6} style={{ marginBottom: 6 }} />
        <ShimmerSkeleton width={160} height={12} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ flex: 1 }}>
              <ShimmerSkeleton width="100%" height={92} borderRadius={16} />
            </View>
          ))}
        </View>
      </View>

      {/* Featured Section Header */}
      <View style={styles.sectionHeaderSkeleton}>
        <ShimmerSkeleton width={170} height={20} borderRadius={6} />
      </View>

      {/* Featured Carousel Skeleton */}
      <CarouselSkeleton />

      {/* Popular Section Header */}
      <View style={styles.sectionHeaderSkeleton}>
        <ShimmerSkeleton width={160} height={20} borderRadius={6} />
        <ShimmerSkeleton width={60} height={14} borderRadius={4} />
      </View>

      {/* Popular Cards Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalListSkeleton}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={{ paddingVertical: 4 }}>
            <RecipeCardSkeleton />
          </View>
        ))}
      </ScrollView>

      {/* Quick Section Header */}
      <View style={styles.sectionHeaderSkeleton}>
        <ShimmerSkeleton width={180} height={20} borderRadius={6} />
        <ShimmerSkeleton width={60} height={14} borderRadius={4} />
      </View>

      {/* Quick Cards Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalListSkeleton}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={{ paddingVertical: 4 }}>
            <RecipeCardSkeleton />
          </View>
        ))}
      </ScrollView>

      {/* Regional Section Header */}
      <View style={styles.sectionHeaderSkeleton}>
        <ShimmerSkeleton width={180} height={20} borderRadius={6} />
      </View>

      {/* Regional Grid */}
      <RecipeGridSkeleton count={4} />
    </ScrollView>
  );
};

// 4. Full Grid of Skeletons for Recipe Exploration Screen & Favorites
export const RecipeGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.gridItem}>
          <RecipeCardSkeleton isGrid={true} />
        </View>
      ))}
    </View>
  );
};

// 5. Skeleton for Recipe Detail Screen (Structure miroir 1:1 de RecipeDetailScreen)
export const RecipeDetailSkeleton: React.FC = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={styles.detailSkeletonContainer}
      accessibilityRole="progressbar"
      accessibilityLabel="Chargement des détails de la recette..."
      accessibilityLiveRegion="polite"
      aria-busy={true}
      aria-live="polite"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* 1. Hero Banner avec boutons d'actions flottants */}
        <View style={styles.detailHeroWrapper}>
          <ShimmerSkeleton width="100%" height={340} borderRadius={0} />

          {/* Floating Header Actions matching real screen */}
          <View
            style={[
              styles.detailFloatingHeader,
              { top: insets.top + (Platform.OS === 'ios' ? 8 : 12) },
            ]}
          >
            {/* Bouton retour */}
            <ShimmerSkeleton width={44} height={44} borderRadius={22} />

            {/* Actions droite : Partager + Favoris */}
            <View style={styles.detailHeaderRightActions}>
              <ShimmerSkeleton width={44} height={44} borderRadius={22} />
              <ShimmerSkeleton width={44} height={44} borderRadius={22} />
            </View>
          </View>
        </View>

        {/* 2. Fiche de contenu principale superposée */}
        <View
          style={[
            styles.detailSheet,
            {
              backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
            },
          ]}
        >
          {/* Indicateur de poignée centré */}
          <ShimmerSkeleton
            width={40}
            height={4}
            borderRadius={2}
            style={{ alignSelf: 'center', marginBottom: 16 }}
          />

          {/* En-tête : Titre, Sous-titre & Badge de note */}
          <View style={styles.detailHeaderRow}>
            <View style={{ flex: 1, gap: 8 }}>
              <ShimmerSkeleton width="78%" height={26} borderRadius={8} />
              <ShimmerSkeleton width="48%" height={16} borderRadius={6} />
            </View>
            <ShimmerSkeleton width={56} height={30} borderRadius={20} />
          </View>

          {/* 4 Capsules statistiques (Préparation, Cuisson, Portions, Niveau) */}
          <View style={styles.detailStatsRow}>
            {[1, 2, 3, 4].map(idx => (
              <View
                key={idx}
                style={[
                  styles.detailStatCapsule,
                  {
                    backgroundColor: isDark ? '#26201D' : '#FFF2EE',
                    borderColor: isDark ? '#3D2C27' : '#FFE5DF',
                  },
                ]}
              >
                <ShimmerSkeleton width={38} height={38} borderRadius={19} />
                <ShimmerSkeleton width={30} height={14} borderRadius={4} style={{ marginTop: 6 }} />
                <ShimmerSkeleton width={26} height={10} borderRadius={3} style={{ marginTop: 3 }} />
              </View>
            ))}
          </View>

          {/* Bannière Assistant Chef Mode Cuisine */}
          <View style={styles.detailChefBannerWrap}>
            <View
              style={[
                styles.detailChefBanner,
                {
                  backgroundColor: isDark ? '#2B1A14' : '#FFF5ED',
                  borderColor: isDark ? '#3D241C' : '#FFEDD5',
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <ShimmerSkeleton width={44} height={44} borderRadius={22} />
                <View style={{ flex: 1, gap: 5 }}>
                  <ShimmerSkeleton width={90} height={10} borderRadius={4} />
                  <ShimmerSkeleton width="80%" height={15} borderRadius={6} />
                  <ShimmerSkeleton width="92%" height={11} borderRadius={4} />
                </View>
              </View>
              <ShimmerSkeleton width={36} height={36} borderRadius={18} />
            </View>
          </View>

          {/* Histoire & Description culinaire */}
          <View
            style={[
              styles.detailStoryCard,
              {
                backgroundColor: isDark ? '#211F1D' : '#FAF8F5',
                borderColor: isDark ? '#2E2C29' : '#ECE8E1',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <ShimmerSkeleton width={18} height={18} borderRadius={4} />
              <ShimmerSkeleton width={120} height={14} borderRadius={5} />
            </View>
            <ShimmerSkeleton width="100%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
            <ShimmerSkeleton width="88%" height={13} borderRadius={4} />
          </View>

          {/* Sélecteur d'onglets (3 onglets) */}
          <View
            style={[
              styles.detailTabsContainer,
              { backgroundColor: isDark ? '#211F1D' : '#F2EFE9' },
            ]}
          >
            <ShimmerSkeleton width="31%" height={38} borderRadius={20} />
            <ShimmerSkeleton width="31%" height={38} borderRadius={20} />
            <ShimmerSkeleton width="31%" height={38} borderRadius={20} />
          </View>

          {/* Carte de contrôle des portions */}
          <View
            style={[
              styles.detailPortionCard,
              {
                backgroundColor: isDark ? '#211F1D' : '#F9F8F6',
                borderColor: isDark ? '#2E2C29' : '#ECE8E1',
              },
            ]}
          >
            <View style={{ gap: 4, flex: 1 }}>
              <ShimmerSkeleton width={110} height={14} borderRadius={5} />
              <ShimmerSkeleton width={160} height={11} borderRadius={4} />
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <ShimmerSkeleton width={32} height={28} borderRadius={14} />
              <ShimmerSkeleton width={32} height={28} borderRadius={14} />
              <ShimmerSkeleton width={32} height={28} borderRadius={14} />
            </View>
          </View>

          {/* Ligne d'en-tête de section des ingrédients */}
          <View style={styles.detailSectionHeaderRow}>
            <ShimmerSkeleton width={170} height={18} borderRadius={6} />
            <ShimmerSkeleton width={85} height={16} borderRadius={6} />
          </View>

          {/* Liste des ingrédients avec cases à cocher et quantités */}
          <View style={{ gap: 10, marginTop: 12 }}>
            {[1, 2, 3, 4, 5].map(idx => (
              <View
                key={idx}
                style={[
                  styles.detailIngredientItem,
                  {
                    backgroundColor: isDark ? '#211F1D' : '#FFFFFF',
                    borderColor: isDark ? '#2E2C29' : '#ECE6F0',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <ShimmerSkeleton width={22} height={22} borderRadius={6} />
                  <View style={{ gap: 4, flex: 1 }}>
                    <ShimmerSkeleton width={idx % 2 === 0 ? '65%' : '80%'} height={15} borderRadius={5} />
                    <ShimmerSkeleton width={idx % 2 === 0 ? '40%' : '30%'} height={11} borderRadius={4} />
                  </View>
                </View>
                <ShimmerSkeleton width={52} height={24} borderRadius={12} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// 6. Skeleton for Shopping / Market Screen
export const MarketScreenSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <View style={styles.marketContainer}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.marketRow,
            {
              backgroundColor: isDark ? '#1A1816' : '#F5F3EF',
            },
          ]}
        >
          <ShimmerSkeleton width={22} height={22} borderRadius={6} />
          <View style={{ flex: 1, gap: 6 }}>
            <ShimmerSkeleton width="65%" height={15} borderRadius={4} />
            <ShimmerSkeleton width="35%" height={11} borderRadius={4} />
          </View>
          <ShimmerSkeleton width={20} height={20} borderRadius={10} />
        </View>
      ))}
    </View>
  );
};

// 7. Skeleton for Community Screen
export const CommunityScreenSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <View style={styles.communityContainer}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.communityCard,
            {
              backgroundColor: isDark ? '#1A1816' : '#F5F3EF',
            },
          ]}
        >
          {/* User Header */}
          <View style={styles.communityHeader}>
            <ShimmerSkeleton width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, gap: 4 }}>
              <ShimmerSkeleton width={120} height={14} borderRadius={4} />
              <ShimmerSkeleton width={70} height={10} borderRadius={3} />
            </View>
          </View>

          {/* Post content & Image */}
          <ShimmerSkeleton width="90%" height={16} borderRadius={4} style={{ marginTop: 10 }} />
          <ShimmerSkeleton width="100%" height={180} borderRadius={18} style={{ marginTop: 10 }} />

          {/* Actions */}
          <View style={styles.communityActions}>
            <ShimmerSkeleton width={60} height={24} borderRadius={12} />
            <ShimmerSkeleton width={60} height={24} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

// 8. Skeleton for AI Chef Recipe Generation
export const AiChefSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.aiChefCard,
        {
          backgroundColor: isDark ? '#1A1816' : '#F5F3EF',
        },
      ]}
    >
      <ShimmerSkeleton width="100%" height={180} borderRadius={20} />
      <View style={{ gap: 10, marginTop: 14 }}>
        <ShimmerSkeleton width="75%" height={22} borderRadius={6} />
        <ShimmerSkeleton width="45%" height={14} borderRadius={5} />
        <ShimmerSkeleton width="100%" height={50} borderRadius={12} style={{ marginTop: 6 }} />
      </View>

      <View style={{ gap: 8, marginTop: 16 }}>
        <ShimmerSkeleton width="50%" height={16} borderRadius={5} />
        <ShimmerSkeleton width="100%" height={38} borderRadius={12} />
        <ShimmerSkeleton width="100%" height={38} borderRadius={12} />
        <ShimmerSkeleton width="100%" height={38} borderRadius={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dishCard: {
    borderRadius: 18,
    borderWidth: 0,
    padding: 8,
    justifyContent: 'space-between',
    elevation: 0,
    height: 274,
  },
  horizontalCard: {
    height: 274,
  },
  gridCard: {
    width: '100%',
    height: 274,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  carouselWrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  carouselCard: {
    height: 245,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 0,
  },
  homeHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sectionHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 12,
  },
  horizontalListSkeleton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailSkeletonContainer: {
    flex: 1,
  },
  detailHeroWrapper: {
    width: '100%',
    height: 340,
    position: 'relative',
    backgroundColor: '#1E1D1B',
  },
  detailFloatingHeader: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  detailHeaderRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailSheet: {
    marginTop: -32,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 18,
    marginBottom: 16,
  },
  detailStatCapsule: {
    flex: 1,
    borderRadius: 26,
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  detailChefBannerWrap: {
    paddingVertical: 14,
    marginBottom: 4,
  },
  detailChefBanner: {
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  detailStoryCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginVertical: 10,
  },
  detailTabsContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    marginVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailPortionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIngredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  capsulesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  marketContainer: {
    padding: 16,
    gap: 10,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 0,
    gap: 12,
    marginBottom: 8,
  },
  communityContainer: {
    padding: 16,
    gap: 16,
  },
  communityCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 0,
    marginBottom: 12,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  communityActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  aiChefCard: {
    padding: 18,
    borderRadius: 26,
    borderWidth: 0,
    marginHorizontal: 16,
    marginVertical: 12,
  },
});
