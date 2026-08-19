import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, ChevronRight } from 'lucide-react-native';
import { AppColors } from '../../theme/colors';

interface CommunityLiveTeaserProps {
  onPress: () => void;
}

export const CommunityLiveTeaser: React.FC<CommunityLiveTeaserProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={onPress}
      >
        <View style={styles.left}>
          <View style={styles.iconCircle}>
            <Users size={20} color={AppColors.primary} />
          </View>
          <View>
            <Text style={styles.title}>Communauté des Gourmets</Text>
            <Text style={styles.subtitle}>
              Partagez vos photos et astuces de cuisine
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 83, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1D1D',
  },
  subtitle: {
    fontSize: 11.5,
    color: '#8C8A87',
    marginTop: 2,
  },
});
