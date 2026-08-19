import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Sparkles, ArrowRight, ChefHat } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppColors } from '../../theme/colors';
import { GlowEffect } from '../core/glow-effect';

interface MagicFridgeCardProps {
  onPress: (ingredient?: string) => void;
}

const QUICK_INGREDIENTS = [
  { id: 'tomate', label: '🍅 Tomate', query: 'Tomates fraîches' },
  { id: 'manioc', label: '🥔 Manioc', query: 'Manioc / Farine' },
  { id: 'poisson', label: '🐟 Poisson', query: 'Poisson fumé / frais' },
  { id: 'poulet', label: '🍗 Poulet', query: 'Poulet braisé' },
  { id: 'oignon', label: '🧅 Oignon', query: 'Oignons et ail' },
  { id: 'piment', label: '🌶️ Piment', query: 'Piment rouge' },
  { id: 'plantain', label: '🍌 Plantain', query: 'Bananes plantains' },
];

export const MagicFridgeCard: React.FC<MagicFridgeCardProps> = ({ onPress }) => {
  return (
    // Wrapper externe : fournit l'espace horizontal + le padding vertical
    // pour que le GlowEffect soit visible sur les 4 côtés
    <View style={styles.outerPad}>
      {/* Conteneur relatif : GlowEffect + carte superposés */}
      <View style={styles.glowContainer}>
        {/* Halo coloré animé 360° — rendu AVANT la carte (donc derrière) */}
        <GlowEffect
          colors={['#C026D3', '#7C3AED', '#FF5733', '#F59E0B']}
          mode="colorShift"
          blur="soft"
          duration={3.5}
        />

        {/* Carte Frigo Magique */}
        <LinearGradient
          colors={['#2A1647', '#1D132F', '#2B1713']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* 1. Header Row (Badge + Action Button) */}
          <TouchableOpacity
            style={styles.headerRow}
            activeOpacity={0.88}
            onPress={() => onPress()}
          >
            <View style={styles.badge}>
              <Sparkles size={12} color="#FF9E80" />
              <Text style={styles.badgeText}>FRIGO MAGIQUE IA</Text>
            </View>

            <View style={styles.openPill}>
              <Text style={styles.openText}>Ouvrir</Text>
              <ArrowRight size={12} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          {/* 2. Main Title & Action Prompt */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => onPress()}
            style={styles.textContainer}
          >
            <View style={styles.titleRow}>
              <ChefHat size={18} color="#FFD180" />
              <Text style={styles.title}>Que cuisiner avec vos restes ?</Text>
            </View>
            <Text style={styles.microText}>
              Touchez un ingrédient pour composer une recette instantanée :
            </Text>
          </TouchableOpacity>

          {/* 3. Quick Ingredient Chips (Horizontal Scroll Rail) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {QUICK_INGREDIENTS.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.chip}
                activeOpacity={0.75}
                onPress={() => onPress(item.query)}
              >
                <Text style={styles.chipText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Wrapper externe : espace horizontal identique à l'original
  // + padding vertical pour laisser le glow visible haut/bas
  outerPad: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 0, // retiré (absorbé par paddingVertical)
  },
  // Conteneur relatif sans overflow:hidden → glow peut déborder
  glowContainer: {
    position: 'relative',
    borderRadius: 22,
  },
  card: {
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 158, 128, 0.28)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 158, 128, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 158, 128, 0.25)',
  },
  badgeText: {
    color: '#FFBFA8',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  textContainer: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  microText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
  chipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
