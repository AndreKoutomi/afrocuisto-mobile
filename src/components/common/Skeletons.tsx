import React from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { ShimmerSkeleton } from './ShimmerSkeleton';
import { useTheme } from '../../context/ThemeContext';

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
        height={120}
        borderRadius={10}
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

// 3. Full Home Screen Skeleton (100% Unifié & Épuré)
export const HomeScreenSkeleton: React.FC = () => {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
      {/* Featured Carousel Skeleton */}
      <CarouselSkeleton />

      {/* Magic Fridge Banner Skeleton */}
      <View style={{ paddingHorizontal: 16, marginVertical: 12 }}>
        <ShimmerSkeleton width="100%" height={90} borderRadius={24} />
      </View>

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

// 5. Skeleton for Recipe Detail Screen
export const RecipeDetailSkeleton: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Hero Banner */}
      <ShimmerSkeleton width="100%" height={340} borderRadius={0} />

      {/* Content Sheet */}
      <View
        style={[
          styles.detailSheet,
          {
            backgroundColor: isDark ? '#1A1816' : '#FAF9F6',
          },
        ]}
      >
        <ShimmerSkeleton width={40} height={4} borderRadius={2} style={{ alignSelf: 'center', marginBottom: 16 }} />

        {/* Title & Subtitle */}
        <View style={{ gap: 8 }}>
          <ShimmerSkeleton width="75%" height={26} borderRadius={8} />
          <ShimmerSkeleton width="45%" height={16} borderRadius={6} />
        </View>

        {/* 4 Capsule Stats */}
        <View style={styles.capsulesRow}>
          <ShimmerSkeleton width="22%" height={70} borderRadius={22} />
          <ShimmerSkeleton width="22%" height={70} borderRadius={22} />
          <ShimmerSkeleton width="22%" height={70} borderRadius={22} />
          <ShimmerSkeleton width="22%" height={70} borderRadius={22} />
        </View>

        {/* Story Card */}
        <ShimmerSkeleton width="100%" height={85} borderRadius={20} style={{ marginTop: 14 }} />

        {/* Tabs Switcher */}
        <ShimmerSkeleton width="100%" height={44} borderRadius={22} style={{ marginTop: 14 }} />

        {/* Ingredients list items */}
        <View style={{ gap: 10, marginTop: 16 }}>
          <ShimmerSkeleton width="50%" height={20} borderRadius={6} />
          <ShimmerSkeleton width="100%" height={52} borderRadius={18} />
          <ShimmerSkeleton width="100%" height={52} borderRadius={18} />
          <ShimmerSkeleton width="100%" height={52} borderRadius={18} />
          <ShimmerSkeleton width="100%" height={52} borderRadius={18} />
        </View>
      </View>
    </ScrollView>
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
    height: 250,
  },
  horizontalCard: {
    height: 250,
  },
  gridCard: {
    width: '100%',
    height: 250,
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
  detailSheet: {
    marginTop: -32,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    borderWidth: 0,
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
