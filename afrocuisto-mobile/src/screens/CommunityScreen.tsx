import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Plus,
  Sparkles,
} from 'lucide-react-native';
import {
  CommunityPost,
  CommunityStory,
  CommunityChallenge,
} from '../types/community';
import { Recipe } from '../types/recipe';
import { useTheme } from '../context/ThemeContext';
import { useRecipes } from '../context/RecipeContext';
import { useCommunity } from '../context/CommunityContext';
import { AppColors } from '../theme/colors';
import { AnimatedScreenWrapper } from '../components/common/AnimatedScreenWrapper';
import { CommunityStoriesRail } from '../components/community/CommunityStoriesRail';
import { CommunityStoryModal } from '../components/community/CommunityStoryModal';
import { CommunityChallengeBanner } from '../components/community/CommunityChallengeBanner';
import { CommunityPostCard } from '../components/community/CommunityPostCard';
import { CommentsModal } from '../components/community/CommentsModal';
import { CreatePostModal } from '../components/community/CreatePostModal';
import { WhatsAppStoryCreator } from '../components/community/WhatsAppStoryCreator';
import { PostImageModal } from '../components/community/PostImageModal';
import { MyStoriesManagerModal } from '../components/community/MyStoriesManagerModal';

export const CommunityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const { recipes } = useRecipes();
  const {
    posts,
    stories,
    challenge,
    isRefreshing,
    refreshCommunity,
    createPost,
    toggleLikePost,
    toggleBookmarkPost,
    addComment,
    createStory,
    deleteStory,
    toggleChallengeParticipation,
  } = useCommunity();

  // Modales state
  const [activeStoryPlaylist, setActiveStoryPlaylist] = useState<{
    stories: CommunityStory[];
    initialIndex: number;
  } | null>(null);
  const [selectedImagePost, setSelectedImagePost] = useState<CommunityPost | null>(null);
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isWhatsAppStoryCreatorVisible, setIsWhatsAppStoryCreatorVisible] = useState(false);
  const [isMyStoriesManagerVisible, setIsMyStoriesManagerVisible] = useState(false);

  const userStories = stories.filter(
    s => s.authorName === 'Vous' || s.authorName.toLowerCase() === 'vous'
  );

  const handleDeleteUserStory = useCallback((storyId: string) => {
    deleteStory(storyId);
  }, [deleteStory]);

  const handleRefresh = useCallback(() => {
    refreshCommunity();
  }, [refreshCommunity]);

  const handleToggleLike = useCallback((postId: string) => {
    toggleLikePost(postId);
  }, [toggleLikePost]);

  const handleToggleBookmark = useCallback((postId: string) => {
    toggleBookmarkPost(postId);
  }, [toggleBookmarkPost]);

  const handleAddComment = useCallback(async (postId: string, commentText: string) => {
    const newComment = await addComment(postId, commentText);
    if (newComment) {
      setCommentPost(prev =>
        prev && prev.id === postId
          ? {
              ...prev,
              commentsCount: prev.commentsCount + 1,
              comments: [newComment, ...(prev.comments || [])],
            }
          : prev
      );
    }
  }, [addComment]);

  const handlePostCreated = useCallback((newPost: CommunityPost) => {
    createPost(newPost);
  }, [createPost]);

  const handleStoryPublished = useCallback((newStory: CommunityStory) => {
    createStory(newStory);
  }, [createStory]);

  const handleSelectRecipe = useCallback(
    (recipeId: string, recipeName: string) => {
      const found = recipes.find(
        r =>
          r.id === recipeId ||
          r.name.toLowerCase() === recipeName.toLowerCase() ||
          r.name.toLowerCase().includes(recipeName.toLowerCase())
      );
      if (found) {
        navigation.navigate('RecipeDetail', { recipe: found });
      } else {
        navigation.navigate('RecipeList', { search: recipeName });
      }
    },
    [recipes, navigation]
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        },
      ]}
    >
      <AnimatedScreenWrapper>
        {/* 1. Header Communauté */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text
              style={[
                styles.headerTitle,
                { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
              ]}
            >
              Communauté AfroCuisto
            </Text>
            <View style={styles.membersOnlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.membersOnlineText}>1.4k gourmets en ligne</Text>
            </View>
          </View>

          {/* Bouton Publier / Partager */}
          <TouchableOpacity
            style={styles.createBtn}
            activeOpacity={0.85}
            onPress={() => setIsCreateModalVisible(true)}
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={3} />
            <Text style={styles.createBtnText}>Partager</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Rail des Stories Fixe (ne défile pas avec le flux) */}
        <View
          style={[
            styles.fixedStoriesContainer,
            {
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              borderBottomColor: isDark ? '#262220' : '#EFECE6',
            },
          ]}
        >
          <CommunityStoriesRail
            stories={stories}
            onSelectStoryGroup={(groupStories, startIndex = 0) =>
              setActiveStoryPlaylist({ stories: groupStories, initialIndex: startIndex })
            }
            onOpenMyStoriesManager={() => setIsMyStoriesManagerVisible(true)}
            onAddStory={() => setIsWhatsAppStoryCreatorVisible(true)}
          />
        </View>

        {/* 3. Flux Principal de Publications (Défilable) */}
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.mainListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={AppColors.primary}
              colors={[AppColors.primary]}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Bannière Défi de la semaine */}
              <CommunityChallengeBanner
                challenge={challenge}
                onPress={() => {}}
                onParticipate={() => setIsCreateModalVisible(true)}
              />

              <View style={styles.feedSectionHeader}>
                <Text
                  style={[
                    styles.feedTitle,
                    { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                  ]}
                >
                  Fil d’actualité & Partages
                </Text>
                <Text style={styles.feedCountText}>
                  {posts.length} publication{posts.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <CommunityPostCard
              post={item}
              onToggleLike={handleToggleLike}
              onToggleBookmark={handleToggleBookmark}
              onOpenComments={post => setCommentPost(post)}
              onSelectRecipe={handleSelectRecipe}
              onImagePress={post => setSelectedImagePost(post)}
              onPress={post =>
                navigation.navigate('PostDetail', {
                  post,
                  onToggleLike: handleToggleLike,
                  onToggleBookmark: handleToggleBookmark,
                  onAddComment: handleAddComment,
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Sparkles size={40} color={AppColors.primary} />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                ]}
              >
                Aucune publication trouvée
              </Text>
              <Text style={styles.emptySubtitle}>
                Soyez le premier à partager une réalisation ou une astuce !
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                activeOpacity={0.85}
                onPress={() => setIsCreateModalVisible(true)}
              >
                <Plus size={16} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.emptyCreateBtnText}>Partager mon plat</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* 3. Modales Interactives */}
        {/* Visualiseur de Photo de Post plein écran avec ratio préservé */}
        <PostImageModal
          visible={!!selectedImagePost}
          post={selectedImagePost}
          onClose={() => setSelectedImagePost(null)}
          onSelectRecipe={handleSelectRecipe}
          onToggleLike={handleToggleLike}
          onOpenComments={post => setCommentPost(post)}
        />

        {/* Visualiseur de Story plein écran avec playlist groupée */}
        {activeStoryPlaylist !== null && (
          <CommunityStoryModal
            visible={activeStoryPlaylist !== null}
            stories={activeStoryPlaylist.stories}
            initialIndex={activeStoryPlaylist.initialIndex}
            onClose={() => setActiveStoryPlaylist(null)}
            onSelectRecipe={handleSelectRecipe}
          />
        )}

        {/* Gestionnaire de Statuts Dédié (Style WhatsApp "Mon statut") */}
        <MyStoriesManagerModal
          visible={isMyStoriesManagerVisible}
          userStories={userStories}
          onClose={() => setIsMyStoriesManagerVisible(false)}
          onViewStory={(story, idx) => {
            setIsMyStoriesManagerVisible(false);
            setActiveStoryPlaylist({ stories: userStories, initialIndex: idx });
          }}
          onAddNewStory={() => {
            setIsMyStoriesManagerVisible(false);
            setIsWhatsAppStoryCreatorVisible(true);
          }}
          onDeleteStory={handleDeleteUserStory}
        />

        {/* Créateur de Story WhatsApp Dédié */}
        <WhatsAppStoryCreator
          visible={isWhatsAppStoryCreatorVisible}
          onClose={() => setIsWhatsAppStoryCreatorVisible(false)}
          onPublishStory={handleStoryPublished}
        />

        {/* Comments Modal */}
        <CommentsModal
          visible={!!commentPost}
          post={commentPost}
          onClose={() => setCommentPost(null)}
          onAddComment={handleAddComment}
        />

        {/* Create Post Modal */}
        <CreatePostModal
          visible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onPostCreated={handlePostCreated}
        />
      </AnimatedScreenWrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  membersOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  membersOnlineText: {
    fontSize: 11,
    color: '#8C8A87',
    fontWeight: '600',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: 18,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  fixedStoriesContainer: {
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  mainListContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  feedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 12,
  },
  feedTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  feedCountText: {
    fontSize: 11.5,
    color: '#8C8A87',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#8C8A87',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    marginTop: 8,
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

