import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, MessageSquare, BookOpen, Wifi } from 'lucide-react-native';
import { CommunityStats } from '../../types/community';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';

interface CommunityStatsCardProps {
  stats: CommunityStats;
}

const STAT_ITEMS = [
  { key: 'totalMembers', label: 'Membres', icon: Users, color: '#EA580C', gradient: ['#FFF7ED', '#FFEDD5'] },
  { key: 'totalPosts', label: 'Publications', icon: MessageSquare, color: '#7C3AED', gradient: ['#F5F3FF', '#EDE9FE'] },
  { key: 'totalRecipes', label: 'Recettes partagées', icon: BookOpen, color: '#22C55E', gradient: ['#F0FDF4', '#DCFCE7'] },
  { key: 'onlineNow', label: 'En ligne', icon: Wifi, color: '#F59E0B', gradient: ['#FFFAEB', '#FEF3C7'] },
] as const;

export const CommunityStatsCard: React.FC<CommunityStatsCardProps> = ({ stats }) => {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {STAT_ITEMS.map((item, index) => {
          const value = stats[item.key as keyof CommunityStats];
          const cardGradient: [string, string] = isDark
            ? ['#262220', '#1C1917']
            : [item.gradient[0], item.gradient[1]];

          const borderColor = isDark
            ? item.color.replace('58', '7A').replace('22', '4A').replace('C5', 'A5').replace('9E', 'C0')
            : item.color.replace('58', 'A0').replace('22', '86').replace('C5', 'E7').replace('9E', 'D9');

          return (
            <View key={item.key} style={styles.statCard}>
              <LinearGradient
                colors={cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.statInner,
                  { borderColor },
                ]}
              >
                <View style={styles.iconWrapper}>
                  <item.icon size={18} color={item.color} strokeWidth={2.2} />
                </View>
                <View style={styles.valueWrap}>
                  <Text
                    style={[
                      styles.value,
                      { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                    ]}
                  >
                    {formatNumber(value)}
                  </Text>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? 'rgba(255,255,255,0.7)' : '#73706B' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </View>
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
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
  },
  statInner: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  valueWrap: {
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
  },
});