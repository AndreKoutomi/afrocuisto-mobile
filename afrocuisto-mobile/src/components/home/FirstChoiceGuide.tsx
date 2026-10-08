import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, Sparkles, Zap, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';

interface FirstChoiceGuideProps {
  onSearchPress: () => void;
  onMagicFridgePress: () => void;
  onQuickPress: () => void;
}

export const FirstChoiceGuide: React.FC<FirstChoiceGuideProps> = ({
  onSearchPress,
  onMagicFridgePress,
  onQuickPress,
}) => {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Titre d'invitation chaleureux */}
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
          ]}
        >
          Que veux-tu cuisiner aujourd’hui ?
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: isDark ? '#A8A29E' : '#78716C' },
          ]}
        >
          Choisis ton point de départ pour trouver la recette idéale
        </Text>
      </View>

      {/* 3 Choix d'action directs et lisibles */}
      <View style={styles.choicesRow}>
        {/* 1. Chercher un plat */}
        <TouchableOpacity
          style={[
            styles.choiceCard,
            {
              backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
              borderColor: isDark ? '#2E2B27' : '#F0ECE4',
            },
          ]}
          activeOpacity={0.85}
          onPress={onSearchPress}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? 'rgba(255, 83, 42, 0.15)' : '#FFF1ED' },
            ]}
          >
            <Search size={18} color={AppColors.primary} strokeWidth={2.5} />
          </View>
          <Text
            style={[
              styles.choiceTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
            numberOfLines={1}
          >
            Chercher un plat
          </Text>
          <Text
            style={[
              styles.choiceDesc,
              { color: isDark ? '#8C8A87' : '#7A7570' },
            ]}
            numberOfLines={1}
          >
            Par nom ou région
          </Text>
        </TouchableOpacity>

        {/* 2. Cuisiner avec mes ingrédients */}
        <TouchableOpacity
          style={[
            styles.choiceCard,
            {
              backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
              borderColor: isDark ? '#2E2B27' : '#F0ECE4',
            },
          ]}
          activeOpacity={0.85}
          onPress={onMagicFridgePress}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' },
            ]}
          >
            <Sparkles size={18} color="#D97706" strokeWidth={2.5} />
          </View>
          <Text
            style={[
              styles.choiceTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
            numberOfLines={1}
          >
            Mes ingrédients
          </Text>
          <Text
            style={[
              styles.choiceDesc,
              { color: isDark ? '#8C8A87' : '#7A7570' },
            ]}
            numberOfLines={1}
          >
            Frigo Magique IA
          </Text>
        </TouchableOpacity>

        {/* 3. Trouver une recette rapide */}
        <TouchableOpacity
          style={[
            styles.choiceCard,
            {
              backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
              borderColor: isDark ? '#2E2B27' : '#F0ECE4',
            },
          ]}
          activeOpacity={0.85}
          onPress={onQuickPress}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' },
            ]}
          >
            <Zap size={18} color="#059669" strokeWidth={2.5} />
          </View>
          <Text
            style={[
              styles.choiceTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
            numberOfLines={1}
          >
            Recette rapide
          </Text>
          <Text
            style={[
              styles.choiceDesc,
              { color: isDark ? '#8C8A87' : '#7A7570' },
            ]}
            numberOfLines={1}
          >
            Express &lt; 30 min
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  choicesRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  choiceCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  choiceTitle: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  choiceDesc: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
