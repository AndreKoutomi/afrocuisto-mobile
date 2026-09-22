import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Video, Sparkles } from 'lucide-react-native';
import { CommunityStory } from '../../types/community';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';

export interface AuthorStoryGroup {
  id: string;
  authorName: string;
  authorAvatar?: string | null;
  isLive?: boolean;
  hasUnviewed?: boolean;
  stories: CommunityStory[];
  latestStory: CommunityStory;
}

interface CommunityStoriesRailProps {
  stories: CommunityStory[];
  onSelectStoryGroup: (groupStories: CommunityStory[], startIndex?: number) => void;
  onOpenMyStoriesManager: () => void;
  onAddStory: () => void;
}

export const CommunityStoriesRail: React.FC<CommunityStoriesRailProps> = ({
  stories,
  onSelectStoryGroup,
  onOpenMyStoriesManager,
  onAddStory,
}) => {
  const { isDark } = useTheme();

  // Regroupement des stories par auteur (style WhatsApp / Instagram)
  const { userStories, authorGroups } = useMemo(() => {
    const userList: CommunityStory[] = [];
    const map = new Map<string, CommunityStory[]>();

    stories.forEach(story => {
      if (
        story.authorName === 'Vous' ||
        story.authorName.toLowerCase() === 'vous'
      ) {
        userList.push(story);
      } else {
        const list = map.get(story.authorName) || [];
        list.push(story);
        map.set(story.authorName, list);
      }
    });

    const groups: AuthorStoryGroup[] = [];
    map.forEach((authorStories, authorName) => {
      const latestStory = authorStories[0];
      const hasUnviewed = authorStories.some(s => !s.isViewed);
      const isLive = authorStories.some(s => s.isLive);
      groups.push({
        id: `grp_${authorName}`,
        authorName,
        authorAvatar: latestStory.authorAvatar,
        isLive,
        hasUnviewed,
        stories: authorStories,
        latestStory,
      });
    });

    return { userStories: userList, authorGroups: groups };
  }, [stories]);

  const latestUserStory = userStories[0];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Cercle Utilisateur : Votre instant (Combiné avec toutes vos stories) */}
        {userStories.length === 0 ? (
          // Cas 0 stories : Bouton Créer avec bordure pointillée
          <TouchableOpacity
            style={styles.storyItem}
            activeOpacity={0.85}
            onPress={onAddStory}
          >
            <View
              style={[
                styles.myStoryCircle,
                {
                  backgroundColor: isDark ? '#262220' : '#F5F3EF',
                  borderColor: isDark ? '#3D3834' : '#E8E4DC',
                },
              ]}
            >
              <View style={styles.myStoryPlusBadge}>
                <Plus size={14} color="#FFFFFF" strokeWidth={3} />
              </View>
              <Sparkles size={20} color={AppColors.primary} />
            </View>
            <Text
              style={[
                styles.storyAuthorName,
                { color: isDark ? '#D6D3CD' : '#4A4846' },
              ]}
              numberOfLines={1}
            >
              Votre instant
            </Text>
          </TouchableOpacity>
        ) : (
          // Cas 1+ stories : Cercle combiné -> Ouvre la gestion des statuts WhatsApp
          <TouchableOpacity
            style={styles.storyItem}
            activeOpacity={0.88}
            onPress={onOpenMyStoriesManager}
          >
            <LinearGradient
              colors={[AppColors.primary, '#FF7A00', '#FFAA00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientRing}
            >
              <View
                style={[
                  styles.avatarWrapper,
                  {
                    backgroundColor: isDark ? '#121110' : '#FFFFFF',
                  },
                ]}
              >
                <Image
                  source={getImageSource(latestUserStory.imageUrl)}
                  style={styles.storyImage}
                  resizeMode="cover"
                />

                {/* Badge compteur de stories de l'utilisateur (ex: 2) */}
                {userStories.length > 1 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{userStories.length}</Text>
                  </View>
                )}

                {/* Bouton (+) pour ajouter une nouvelle story */}
                <TouchableOpacity
                  style={styles.myStoryPlusSmallBadge}
                  activeOpacity={0.8}
                  onPress={onAddStory}
                >
                  <Plus size={11} color="#FFFFFF" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <Text
              style={[
                styles.storyAuthorName,
                {
                  color: isDark ? '#FFFFFF' : '#1E1D1D',
                  fontWeight: '700',
                },
              ]}
              numberOfLines={1}
            >
              Votre story {userStories.length > 1 ? `(${userStories.length})` : ''}
            </Text>
          </TouchableOpacity>
        )}

        {/* 2. Groupes de stories des autres auteurs (1 cercle par auteur, combiné) */}
        {authorGroups.map(group => {
          const isViewed = !group.hasUnviewed;
          const count = group.stories.length;

          return (
            <TouchableOpacity
              key={group.id}
              style={styles.storyItem}
              activeOpacity={0.88}
              onPress={() => onSelectStoryGroup(group.stories, 0)}
            >
              <LinearGradient
                colors={
                  isViewed
                    ? isDark
                      ? ['#3D3834', '#2E2A27']
                      : ['#D6D1C7', '#C4BDB1']
                    : group.isLive
                    ? ['#DC2626', '#EA580C', '#F59E0B']
                    : [AppColors.primary, '#FF7A00', '#FFAA00']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientRing}
              >
                <View
                  style={[
                    styles.avatarWrapper,
                    {
                      backgroundColor: isDark ? '#121110' : '#FFFFFF',
                    },
                  ]}
                >
                  <Image
                    source={getImageSource(group.latestStory.imageUrl)}
                    style={styles.storyImage}
                    resizeMode="cover"
                  />

                  {/* Badge multi-stories si plusieurs stories par auteur */}
                  {count > 1 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{count}</Text>
                    </View>
                  )}

                  {group.latestStory.videoBadge && (
                    <View style={styles.videoBadge}>
                      <Video size={10} color="#FFFFFF" />
                    </View>
                  )}

                  {group.isLive && (
                    <View style={styles.liveTagBadge}>
                      <Text style={styles.liveTagText}>LIVE</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>

              <Text
                style={[
                  styles.storyAuthorName,
                  {
                    color: isDark
                      ? isViewed
                        ? '#8C8A87'
                        : '#FFFFFF'
                      : isViewed
                      ? '#787571'
                      : '#1E1D1D',
                    fontWeight: isViewed ? '500' : '700',
                  },
                ]}
                numberOfLines={1}
              >
                {group.authorName}
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
    paddingVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: 'center',
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  myStoryCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  myStoryPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AppColors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myStoryPlusSmallBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  gradientRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    padding: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  countBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTagBadge: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
  },
  storyAuthorName: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 70,
  },
});
