import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Recipe } from '../../types/recipe';
import { PopularDishCard } from './PopularDishCard';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const REGIONS = [
  { id: 'sud', label: 'Sud-Bénin', match: ['Sud-Bénin', 'Sud', 'Littoral', 'Ouémé', 'Atlantique'] },
  { id: 'nord', label: 'Nord-Bénin', match: ['Nord-Bénin', 'Nord', 'Borgou', 'Atacora', 'Alibori', 'Donga'] },
  { id: 'centre', label: 'Centre & Zou', match: ['Centre', 'Zou', 'Collines'] },
  { id: 'national', label: 'National', match: ['National', 'Tout le Bénin'] },
];

interface RegionalDishesGridProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
}

export const RegionalDishesGrid: React.FC<RegionalDishesGridProps> = ({
  recipes,
  onSelectRecipe,
}) => {
  const { isDark } = useTheme();
  const [selectedRegionId, setSelectedRegionId] = useState<string>('sud');

  const selectedRegion = useMemo(() => {
    return REGIONS.find(r => r.id === selectedRegionId) || REGIONS[0];
  }, [selectedRegionId]);

  const regionalRecipes = useMemo(() => {
    const matched = recipes.filter(r => {
      const reg = (r.region || '').toLowerCase();
      return selectedRegion.match.some(m => reg.includes(m.toLowerCase()));
    });
    return matched.length >= 2 ? matched : recipes.slice(0, 6);
  }, [recipes, selectedRegion]);

  const handleRegionChange = (newRegionId: string) => {
    if (newRegionId === selectedRegionId) return;

    // Transition fluide native garantie sans aucun artefact de transparence
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedRegionId(newRegionId);
  };

  return (
    <View style={styles.container}>
      {/* 1. Header de la section */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <MapPin size={18} color={AppColors.primary} />
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
          >
            Spécialités par Région
          </Text>
        </View>
      </View>

      {/* 2. Rail de sélection dynamique des régions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.regionRail}
      >
        {REGIONS.map(reg => {
          const isSelected = reg.id === selectedRegionId;
          return (
            <TouchableOpacity
              key={reg.id}
              style={[
                styles.regionPill,
                isSelected
                  ? styles.activeRegionPill
                  : [
                      styles.inactiveRegionPill,
                      {
                        backgroundColor: isDark ? '#211F1D' : '#FFFFFF',
                        borderColor: isDark ? '#2E2C29' : '#EFECE6',
                      },
                    ],
              ]}
              activeOpacity={0.8}
              onPress={() => handleRegionChange(reg.id)}
            >
              <Text
                style={[
                  styles.regionPillText,
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
                {reg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. Vertical Grid à 2 Colonnes (Cartes 100% nettes et opaques) */}
      <View style={styles.gridContainer}>
        {regionalRecipes.map(recipe => (
          <View key={recipe.id} style={styles.gridColumn}>
            <PopularDishCard
              recipe={recipe}
              isGrid={true}
              onPress={() => onSelectRecipe(recipe)}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  regionRail: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  regionPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeRegionPill: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  inactiveRegionPill: {},
  regionPillText: {
    fontSize: 12.5,
  },
  gridContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  gridColumn: {
    width: '48.5%',
    marginBottom: 10,
  },
});
