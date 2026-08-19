import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';

interface DynamicGreetingProps {
  onSearchPress: () => void;
}

export const DynamicGreeting: React.FC<DynamicGreetingProps> = ({ onSearchPress }) => {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.searchBar,
          {
            backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
            borderColor: isDark ? '#2E2C29' : '#EFECE6',
          },
        ]}
        activeOpacity={0.85}
        onPress={onSearchPress}
      >
        <Search size={18} color={isDark ? '#8C8A87' : '#9CA3AF'} />
        <Text
          style={[
            styles.placeholder,
            { color: isDark ? '#8C8A87' : '#9CA3AF' },
          ]}
        >
          Que voulez-vous cuisiner aujourd'hui ?
        </Text>
        <View style={styles.aiBadge}>
          <Sparkles size={13} color="#FFFFFF" />
          <Text style={styles.aiText}>IA</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  placeholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13.5,
    fontWeight: '500',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
});
