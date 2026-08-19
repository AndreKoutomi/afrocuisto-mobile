import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Sparkles,
  Search,
  Wand2,
  X,
  Layers,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../theme/colors';
import {
  ALL_100_COMPONENTS,
  CatalogItemCard,
} from '../components/lab/AnimationComponentsCatalog';

const CATEGORIES = [
  'Tous',
  'Boutons',
  'Formulaires',
  'Cartes',
  'Squelettes',
  'Inputs',
  'Overlays',
  'Cuisine',
  'Micro-effets',
];

export const AnimationLabScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  // Filter 100 components dynamically
  const filteredComponents = useMemo(() => {
    return ALL_100_COMPONENTS.filter(item => {
      const matchCat =
        selectedCategory === 'Tous' || item.category === selectedCategory;
      const matchSearch =
        search.trim() === '' ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.desc.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, search]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? AppColors.backgroundDark : '#F8F7F4',
        },
      ]}
    >
      {/* Top Fixed Navigation Bar */}
      <View
        style={[
          styles.navBar,
          {
            backgroundColor: isDark ? AppColors.backgroundDark : '#FFFFFF',
            borderBottomColor: isDark ? '#2E2C29' : '#ECE8E1',
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: isDark ? '#211F1D' : '#F5F3EF' },
          ]}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={22} color={isDark ? '#FFFFFF' : AppColors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={[styles.navTitle, { color: isDark ? '#FFFFFF' : AppColors.textPrimary }]}>
            Laboratoire d'Animations
          </Text>
          <Text style={styles.navSubtitle}>Catalogue de 100 Composants</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.themeBtn,
            { backgroundColor: isDark ? '#26201D' : '#FFF2EE' },
          ]}
          onPress={toggleTheme}
        >
          <Sparkles size={18} color={AppColors.primary} />
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Intro Banner */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: isDark ? '#26201D' : '#FFF2EE',
              borderColor: isDark ? '#3D2C27' : '#FFD5CC',
            },
          ]}
        >
          <Wand2 size={24} color={AppColors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: isDark ? '#FFF' : '#732A15' }]}>
              Bibliothèque de 100+ Composants & Micro-interactions
            </Text>
            <Text style={[styles.bannerSubtitle, { color: isDark ? '#D6D3D1' : '#8C8A87' }]}>
              Chaque élément est interactif et prêt à l'emploi dans votre application.
            </Text>
          </View>
        </View>

        {/* Search Input Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? '#211F1D' : '#FFFFFF',
              borderColor: isDark ? '#2E2C29' : '#E5E2DC',
            },
          ]}
        >
          <Search size={18} color="#8C8A87" />
          <TextInput
            placeholder="Rechercher parmi les 100 composants (ex: Bouton, Flamme, Checkbox...)"
            placeholderTextColor="#8C8A87"
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: isDark ? '#FFF' : '#000' }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color="#8C8A87" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills (Horizontal ScrollView) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map(item => {
            const isActive = selectedCategory === item;
            const count =
              item === 'Tous'
                ? ALL_100_COMPONENTS.length
                : ALL_100_COMPONENTS.filter(c => c.category === item).length;

            return (
              <TouchableOpacity
                key={item}
                onPress={() => setSelectedCategory(item)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isActive
                      ? AppColors.primary
                      : isDark
                      ? '#211F1D'
                      : '#FFFFFF',
                    borderColor: isActive
                      ? AppColors.primary
                      : isDark
                      ? '#2E2C29'
                      : '#ECE8E1',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isActive ? '#FFFFFF' : isDark ? '#E5E2DC' : '#374151' },
                  ]}
                >
                  {item} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results Header Count */}
        <View style={styles.resultsInfoRow}>
          <Layers size={16} color={AppColors.primary} />
          <Text style={[styles.resultsCountText, { color: isDark ? '#FFF' : '#374151' }]}>
            {filteredComponents.length} composant{filteredComponents.length > 1 ? 's' : ''} affiché{filteredComponents.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* 100 Components Rendered Dynamically */}
        <View style={styles.cardsGrid}>
          {filteredComponents.map(item => {
            const Comp = item.Component;
            return (
              <CatalogItemCard
                key={item.id}
                id={item.id}
                title={item.title}
                category={item.category}
                description={item.desc}
              >
                <Comp />
              </CatalogItemCard>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  navSubtitle: {
    fontSize: 11,
    color: '#8C8A87',
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  bannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 18,
  },
  bannerSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  categoriesRow: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardsGrid: {
    gap: 12,
  },
});
