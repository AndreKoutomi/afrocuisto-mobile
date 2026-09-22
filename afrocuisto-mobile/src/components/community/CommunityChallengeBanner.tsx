import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Trophy, Flame, Users, ArrowRight, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CommunityChallenge } from '../../types/community';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';

interface CommunityChallengeBannerProps {
  challenge?: CommunityChallenge | null;
  onPress: () => void;
  onParticipate: () => void;
}

export const CommunityChallengeBanner: React.FC<CommunityChallengeBannerProps> = ({
  challenge,
  onPress,
  onParticipate,
}) => {
  const { isDark } = useTheme();

  if (!challenge) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
            borderColor: isDark ? '#382F2D' : '#FFE8E0',
          },
        ]}
        activeOpacity={0.92}
        onPress={onPress}
      >
        {/* Image de fond avec gradient */}
        <Image
          source={getImageSource(challenge.bannerImage)}
          style={styles.bannerImage}
          resizeMode="cover"
        />

        <LinearGradient
          colors={[
            'rgba(0,0,0,0.1)',
            'rgba(0,0,0,0.6)',
            'rgba(0,0,0,0.92)',
          ]}
          locations={[0.0, 0.4, 1.0]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Badges supérieurs */}
        <View style={styles.topRow}>
          <View style={styles.challengeBadge}>
            <Trophy size={14} color="#FFD700" />
            <Text style={styles.challengeBadgeText}>{challenge.badge}</Text>
          </View>

          <View style={styles.deadlineBadge}>
            <Flame size={13} color="#FF6B4A" />
            <Text style={styles.deadlineText}>{challenge.deadline}</Text>
          </View>
        </View>

        {/* Contenu textuel */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {challenge.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {challenge.subtitle}
          </Text>

          {/* Stats & CTA */}
          <View style={styles.bottomRow}>
            <View style={styles.statsGroup}>
              <View style={styles.statItem}>
                <Users size={14} color="#E5E2DC" />
                <Text style={styles.statText}>
                  {challenge.participantsCount} participants
                </Text>
              </View>

              <View style={styles.dot} />

              <View style={styles.statItem}>
                <Sparkles size={14} color="#FFD700" />
                <Text style={styles.statTextHighlight}>
                  {challenge.prizeText}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.participateBtn}
              activeOpacity={0.85}
              onPress={onParticipate}
            >
              <Text style={styles.participateBtnText}>
                {challenge.isParticipating ? 'Mon plat envoyé ✓' : 'Participer'}
              </Text>
              {!challenge.isParticipating && (
                <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    height: 185,
    justifyContent: 'space-between',
    padding: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  challengeBadgeText: {
    color: '#FFD700',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.4)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 74, 0.4)',
  },
  deadlineText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    zIndex: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#E5E2DC',
    fontSize: 11,
    fontWeight: '600',
  },
  statTextHighlight: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  participateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  participateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
