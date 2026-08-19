import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';

export interface MoodFilter {
  id: string;
  label: string;
  emoji: string;
  category?: string;
  maxMinutes?: number;
}

export const kMoodFilters: MoodFilter[] = [
  { id: 'all', label: 'Tout explorer', emoji: '✨' },
  { id: 'quick', label: '< 30 min', emoji: '⏱️', maxMinutes: 30 },
  { id: 'sauces', label: 'Sauces', emoji: '🍲', category: 'Sauces (Nùsúnnú)' },
  { id: 'pates', label: 'Wɔ̌ & Céréales', emoji: '🌽', category: 'Pâtes et Céréales (Wɔ̌)' },
  { id: 'street', label: 'Street Food', emoji: '🍢', category: 'Street Food & Snacks (Amuse-bouche)' },
  { id: 'plats', label: 'Grands Plats', emoji: '🥘', category: 'Plats de Résistance & Ragoûts' },
  { id: 'drinks', label: 'Jus & Douceurs', emoji: '🍹', category: 'Boissons & Douceurs' },
];

interface QuickMoodRailProps {
  activeMoodId: string;
  onSelectMood: (id: string) => void;
}

export const QuickMoodRail: React.FC<QuickMoodRailProps> = ({
  activeMoodId,
  onSelectMood,
}) => {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Flame size={18} color={AppColors.primary} />
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
          >
            Vos Envies du Moment
          </Text>
        </View>

        {activeMoodId !== 'all' && (
          <TouchableOpacity onPress={() => onSelectMood('all')}>
            <Text style={styles.resetText}>Réinitialiser</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {kMoodFilters.map(filter => {
          const isSelected = filter.id === activeMoodId;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.pill,
                isSelected
                  ? styles.activePill
                  : [
                      styles.inactivePill,
                      {
                        backgroundColor: isDark ? '#211F1D' : '#FFFFFF',
                        borderColor: isDark ? '#2E2C29' : '#EFECE6',
                      },
                    ],
              ]}
              activeOpacity={0.8}
              onPress={() => onSelectMood(filter.id)}
            >
              <Text style={styles.emoji}>{filter.emoji}</Text>
              <Text
                style={[
                  styles.pillLabel,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : isDark
                      ? '#FBF9F5'
                      : '#1E1D1D',
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  activePill: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  inactivePill: {},
  emoji: {
    fontSize: 14,
  },
  pillLabel: {
    fontSize: 13,
  },
});
