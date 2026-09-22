import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Lock, Plus } from 'lucide-react-native';
import { CommunityGroup } from '../../types/community';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { BouncyPressable } from '../common/BouncyPressable';

interface CommunityGroupsRailProps {
  groups: CommunityGroup[];
  onJoinGroup: (group: CommunityGroup) => void;
  onPressGroup: (group: CommunityGroup) => void;
  showAll?: boolean;
}

const SUGGESTED_GROUPS: CommunityGroup[] = [
  {
    id: 'grp_1',
    name: 'Mamans Cuisinières',
    description: 'Échanges entre mamans passionnées',
    membersCount: 12400,
    postsCount: 890,
    emoji: '👩‍🍳',
    gradientLight: ['#FFF1ED', '#FFE4DC'],
    gradientDark: ['#381A12', '#26120D'],
    borderLight: '#FFD3C7',
    borderDark: '#4A231A',
    isJoined: true,
  },
  {
    id: 'grp_2',
    name: 'Pâtes & Wɔ̌ Lovers',
    description: 'Spécialistes des pâtes africaines',
    membersCount: 8900,
    postsCount: 560,
    emoji: '🍝',
    gradientLight: ['#FEF9E7', '#FDEEAD'],
    gradientDark: ['#35290F', '#241B08'],
    borderLight: '#FDE68A',
    borderDark: '#483714',
    isJoined: false,
  },
  {
    id: 'grp_3',
    name: 'Street Food Afrique',
    description: 'Snacks, alloco, brochettes & co',
    membersCount: 15200,
    postsCount: 1200,
    emoji: '🌭',
    gradientLight: ['#FFF7EE', '#FFEDD6'],
    gradientDark: ['#3A1F0D', '#261306'],
    borderLight: '#FED7AA',
    borderDark: '#4E2A12',
    isJoined: true,
  },
  {
    id: 'grp_4',
    name: 'Poissons & Fruits de Mer',
    description: 'Recettes marines & grillades',
    membersCount: 6700,
    postsCount: 340,
    emoji: '🐟',
    gradientLight: ['#F0F9FF', '#E0F2FE'],
    gradientDark: ['#0E2638', '#081824'],
    borderLight: '#BAE6FD',
    borderDark: '#163852',
    isJoined: false,
  },
  {
    id: 'grp_5',
    name: 'Boissons & Douceurs',
    description: 'Jus, cocktails, desserts maison',
    membersCount: 5400,
    postsCount: 280,
    emoji: '🍹',
    gradientLight: ['#FDF2F8', '#FCE7F3'],
    gradientDark: ['#361226', '#240B1A'],
    borderLight: '#FBCFE8',
    borderDark: '#4A1935',
    isJoined: false,
  },
];

export const CommunityGroupsRail: React.FC<CommunityGroupsRailProps> = ({
  groups = SUGGESTED_GROUPS,
  onJoinGroup,
  onPressGroup,
  showAll = true,
}) => {
  const { isDark } = useTheme();

  const renderGroupCard = ({ item }: { item: CommunityGroup }) => {
    const cardBorderColor = isDark ? item.borderDark : item.borderLight;
    const cardGradient = isDark ? item.gradientDark : item.gradientLight;

    return (
      <TouchableOpacity
        style={styles.cardTouchWrapper}
        activeOpacity={0.84}
        onPress={() => onPressGroup(item)}
      >
        <LinearGradient
          colors={cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              borderColor: cardBorderColor,
            },
          ]}
        >
          <View style={styles.emojiWrapper}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>

          <View style={styles.textGroup}>
            <Text
              style={[
                styles.groupName,
                { color: isDark ? '#FFFFFF' : '#1C1917' },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[
                styles.groupDesc,
                { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' },
              ]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={11} color={isDark ? '#E2E8F0' : '#73706B'} />
              <Text
                style={[
                  styles.statText,
                  { color: isDark ? '#E2E8F0' : '#73706B' },
                ]}
              >
                {formatNumber(item.membersCount)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statText,
                  { color: isDark ? '#E2E8F0' : '#73706B' },
                ]}
              >
                {formatNumber(item.postsCount)} posts
              </Text>
            </View>
          </View>

          <BouncyPressable
            onPress={(e) => {
              e.stopPropagation();
              onJoinGroup(item);
            }}
            style={[
              styles.joinBtn,
              {
                backgroundColor: item.isJoined
                  ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)')
                  : AppColors.primary,
                borderColor: item.isJoined
                  ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')
                  : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.joinBtnText,
                {
                  color: item.isJoined
                    ? (isDark ? '#E2E8F0' : '#73706B')
                    : '#FFFFFF',
                },
              ]}
            >
              {item.isJoined ? 'Rejoint' : 'Rejoindre'}
            </Text>
          </BouncyPressable>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleGroup}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
          >
            Groupes suggérés
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              { color: isDark ? '#A8A29E' : '#73706B' },
            ]}
          >
            Rejoignez des passionnés près de chez vous
          </Text>
        </View>
      </View>

      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderGroupCard}
        contentContainerStyle={styles.listContent}
        decelerationRate="fast"
      />

      {showAll && (
        <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.8}>
          <View style={styles.seeAllInner}>
            <Plus size={14} color={AppColors.primary} />
            <Text style={styles.seeAllText}>Voir tous les groupes</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  titleGroup: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 4,
  },
  cardTouchWrapper: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    width: 200,
    height: 170,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.2,
  },
  emojiWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emoji: {
    fontSize: 24,
  },
  textGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 2,
  },
  groupName: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  groupDesc: {
    fontSize: 10.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 10,
    fontWeight: '700',
  },
  joinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  joinBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  seeAllBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 83, 42, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 83, 42, 0.2)',
  },
  seeAllInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
});