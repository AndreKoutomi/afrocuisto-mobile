import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Share,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  Send,
  CookingPot,
  Award,
  Sparkles,
  ChevronRight,
  Maximize2,
  X,
} from 'lucide-react-native';
import { CommunityPost, PostComment } from '../types/community';
import { useTheme } from '../context/ThemeContext';
import { useRecipes } from '../context/RecipeContext';
import { AppColors } from '../theme/colors';
import { getImageSource } from '../utils/imageHelper';
import { BookmarkIcon, BookmarkIconHandle } from '../components/common/BookmarkIcon';
import { BookmarkCheckIcon, BookmarkCheckIconHandle } from '../components/common/BookmarkCheckIcon';
import { PostImageModal } from '../components/community/PostImageModal';

export const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { recipes } = useRecipes();

  const initialPost: CommunityPost = route.params?.post;
  const onToggleLikeParam = route.params?.onToggleLike;
  const onToggleBookmarkParam = route.params?.onToggleBookmark;
  const onAddCommentParam = route.params?.onAddComment;

  const [post, setPost] = useState<CommunityPost>(initialPost);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isComposerVisible, setIsComposerVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});

  const scrollViewRef = useRef<ScrollView>(null);
  const bookmarkIconRef = useRef<BookmarkIconHandle>(null);
  const bookmarkCheckIconRef = useRef<BookmarkCheckIconHandle>(null);
  const likeScale = useRef(new Animated.Value(1)).current;

  const isBookmarked = post?.isBookmarked || false;

  const handleToggleLike = useCallback(() => {
    if (!post) return;
    const newIsLiked = !post.isLiked;
    const newLikesCount = newIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);

    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.45,
        duration: 85,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(likeScale, {
        toValue: 1,
        friction: 4,
        tension: 240,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    setPost(prev => ({
      ...prev,
      isLiked: newIsLiked,
      likesCount: newLikesCount,
    }));

    if (onToggleLikeParam) {
      onToggleLikeParam(post.id);
    }
  }, [post, onToggleLikeParam, likeScale]);

  const handleToggleBookmark = useCallback(() => {
    if (!post) return;
    const newIsBookmarked = !isBookmarked;

    setPost(prev => ({
      ...prev,
      isBookmarked: newIsBookmarked,
    }));

    if (onToggleBookmarkParam) {
      onToggleBookmarkParam(post.id);
    }
  }, [post, isBookmarked, onToggleBookmarkParam]);

  const openComposer = (targetAuthor?: string) => {
    if (targetAuthor) {
      setReplyingTo(targetAuthor);
      setCommentText(`@${targetAuthor} `);
    } else {
      setReplyingTo(null);
      setCommentText('');
    }
    setIsComposerVisible(true);
  };

  const handleSendComment = useCallback(() => {
    if (!commentText.trim() || !post) return;

    const newComment: PostComment = {
      id: `c_${Date.now()}`,
      postId: post.id,
      authorName: 'Vous',
      content: commentText.trim(),
      createdAt: 'À l’instant',
      likesCount: 0,
    };

    setPost(prev => ({
      ...prev,
      commentsCount: prev.commentsCount + 1,
      comments: [newComment, ...(prev.comments || [])],
    }));

    if (onAddCommentParam) {
      onAddCommentParam(post.id, commentText.trim());
    }

    setCommentText('');
    setIsComposerVisible(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, [commentText, post, onAddCommentParam]);

  const handleToggleCommentLike = (commentId: string) => {
    setLikedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `Regarde cette publication de ${post.authorName} sur AfroCuisto : "${post.content.slice(0, 120)}..." 🍲\n\nTélécharge l'application AfroCuisto !`,
      });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const handleSelectRecipe = (recipeId?: string | null, recipeName?: string | null) => {
    if (!recipeId && !recipeName) return;
    const found = recipes.find(
      r =>
        (recipeId && r.id === recipeId) ||
        (recipeName && r.name.toLowerCase() === recipeName.toLowerCase()) ||
        (recipeName && r.name.toLowerCase().includes(recipeName.toLowerCase()))
    );
    if (found) {
      navigation.navigate('RecipeDetail', { recipe: found });
    } else if (recipeName) {
      navigation.navigate('RecipeList', { search: recipeName });
    }
  };

  const getRoleColor = (role?: string | null) => {
    if (!role) return isDark ? '#A8A29E' : '#78716C';
    if (role.includes('Chef')) return AppColors.primary;
    if (role.includes('Terroir')) return '#16A34A';
    if (role.includes('Gourmet')) return '#EA580C';
    return isDark ? '#A8A29E' : '#78716C';
  };

  if (!post) return null;

  const comments = post.comments || [];

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        },
      ]}
      edges={['top', 'left', 'right']}
    >
      {/* 1. Header Navigation de la page */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: isDark ? '#262220' : '#EFECE6',
            backgroundColor: isDark ? AppColors.backgroundDark : '#FFFFFF',
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.headerBackBtn,
            {
              backgroundColor: isDark ? '#262220' : '#F5F3EF',
              borderColor: isDark ? '#3D3834' : '#E8E4DC',
            },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft
            size={22}
            color={isDark ? '#FFFFFF' : AppColors.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
            numberOfLines={1}
          >
            Publication de {post.authorName}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.headerShareBtn,
            {
              backgroundColor: isDark ? '#262220' : '#F5F3EF',
              borderColor: isDark ? '#3D3834' : '#E8E4DC',
            },
          ]}
          activeOpacity={0.8}
          onPress={handleShare}
        >
          <Share2
            size={18}
            color={isDark ? '#FFFFFF' : AppColors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* 2. ScrollView avec le corps du post et les commentaires */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vue Page du Post (Style Facebook intégré) */}
        <View style={styles.postPageSection}>
          {/* Header de l'auteur */}
          <View style={styles.authorRow}>
            <View style={styles.authorLeft}>
              {post.authorAvatar ? (
                <Image
                  source={getImageSource(post.authorAvatar)}
                  style={styles.authorAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.authorAvatarCircle,
                    {
                      backgroundColor: post.authorRole?.includes('Chef')
                        ? AppColors.primary
                        : isDark
                        ? '#2E2A27'
                        : '#FFE4D6',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.authorAvatarLetter,
                      {
                        color: post.authorRole?.includes('Chef')
                              ? '#FFFFFF'
                              : AppColors.primary,
                      },
                    ]}
                  >
                    {post.authorName.charAt(0)}
                  </Text>
                </View>
              )}

              <View style={styles.authorMeta}>
                <View style={styles.nameCountryRow}>
                  <Text
                    style={[
                      styles.authorNameText,
                      { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                    ]}
                  >
                    {post.authorName}
                  </Text>
                  {post.authorCountry && (
                    <Text style={styles.countryBadge}>
                      {post.authorCountry}
                    </Text>
                  )}
                </View>

                <View style={styles.roleTimeRow}>
                  {post.authorRole && (
                    <View
                      style={[
                        styles.rolePill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                        },
                      ]}
                    >
                      <Award size={10} color={getRoleColor(post.authorRole)} />
                      <Text
                        style={[
                          styles.roleText,
                          { color: getRoleColor(post.authorRole) },
                        ]}
                      >
                        {post.authorRole}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.timeText}>• {post.createdAt}</Text>
                </View>
              </View>
            </View>

            {/* Signet Bookmark */}
            <TouchableOpacity
              style={[
                styles.bookmarkBtn,
                isBookmarked && {
                  backgroundColor: isDark
                    ? 'rgba(255, 83, 42, 0.12)'
                    : 'rgba(255, 83, 42, 0.08)',
                  borderRadius: 12,
                },
              ]}
              activeOpacity={0.75}
              onPress={handleToggleBookmark}
            >
              {!isBookmarked ? (
                <BookmarkIcon
                  key="unbookmarked"
                  ref={bookmarkIconRef}
                  size={20}
                  color={isDark ? '#A8A29E' : '#8C8A87'}
                  autoAnimate={false}
                />
              ) : (
                <BookmarkCheckIcon
                  key="bookmarked"
                  ref={bookmarkCheckIconRef}
                  size={20}
                  color={AppColors.primary}
                  fill="rgba(255, 83, 42, 0.15)"
                  autoAnimate={true}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Texte complet de la publication */}
          <Text
            style={[
              styles.postContentText,
              { color: isDark ? '#EBE8E1' : '#2D2B29' },
            ]}
          >
            {post.content}
          </Text>

          {/* Tags / Hashtags */}
          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {post.tags.map((tag, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tagPill,
                    {
                      backgroundColor: isDark ? '#262220' : '#F5F3EF',
                      borderColor: isDark ? '#3D3834' : '#E8E4DC',
                    },
                  ]}
                >
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Photo de la réalisation culinaire */}
          {post.imageUrl && (
            <TouchableOpacity
              style={styles.imageWrap}
              activeOpacity={0.92}
              onPress={() => setIsImageModalVisible(true)}
            >
              <Image
                source={getImageSource(post.imageUrl)}
                style={styles.postImage}
                resizeMode="cover"
              />
              {post.region && (
                <View style={styles.imageRegionBadge}>
                  <Text style={styles.imageRegionText}>{post.region}</Text>
                </View>
              )}
              <View style={styles.expandBadge}>
                <Maximize2 size={13} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          )}

          {/* Recette liée si présente */}
          {post.recipeName && (
            <TouchableOpacity
              style={[
                styles.linkedRecipeCard,
                {
                  backgroundColor: isDark ? '#24201E' : '#FFF6F2',
                  borderColor: isDark ? '#3D322E' : '#FFE2D6',
                },
              ]}
              activeOpacity={0.85}
              onPress={() => handleSelectRecipe(post.recipeId, post.recipeName)}
            >
              <View style={styles.recipeLeft}>
                <View style={styles.recipeIconCircle}>
                  <CookingPot size={18} color={AppColors.primary} />
                </View>
                <View style={styles.recipeTextWrap}>
                  <Text style={styles.recipeSublabel}>Recette AfroCuisto rattachée</Text>
                  <Text
                    style={[
                      styles.recipeTitle,
                      { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {post.recipeName}
                  </Text>
                </View>
              </View>
              <View style={styles.recipeArrowCircle}>
                <ChevronRight size={16} color={AppColors.primary} />
              </View>
            </TouchableOpacity>
          )}

          {/* Résumé des réactions et partages */}
          <View
            style={[
              styles.statsSummaryRow,
              { borderBottomColor: isDark ? '#262220' : '#F0EDE8' },
            ]}
          >
            <View style={styles.statsLeft}>
              <View style={styles.heartMiniCircle}>
                <Heart size={10} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <Text
                style={[
                  styles.statsCountText,
                  { color: isDark ? '#A8A29E' : '#78716C' },
                ]}
              >
                {post.likesCount} réaction{post.likesCount > 1 ? 's' : ''}
              </Text>
            </View>

            <Text
              style={[
                styles.statsCountText,
                { color: isDark ? '#A8A29E' : '#78716C' },
              ]}
            >
              {post.commentsCount} commentaire{post.commentsCount > 1 ? 's' : ''} •{' '}
              {post.sharesCount || 0} partage{(post.sharesCount || 0) > 1 ? 's' : ''}
            </Text>
          </View>

          {/* Barre d'actions Facebook-style */}
          <View
            style={[
              styles.actionBar,
              { borderBottomColor: isDark ? '#262220' : '#F0EDE8' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionBtn,
                post.isLiked && styles.actionBtnLiked,
              ]}
              activeOpacity={0.75}
              onPress={handleToggleLike}
            >
              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                <Heart
                  size={20}
                  color={
                    post.isLiked
                      ? AppColors.primary
                      : isDark
                      ? '#A8A29E'
                      : '#78716C'
                  }
                  fill={post.isLiked ? AppColors.primary : 'transparent'}
                />
              </Animated.View>
              <Text
                style={[
                  styles.actionBtnText,
                  {
                    color: post.isLiked
                      ? AppColors.primary
                      : isDark
                      ? '#A8A29E'
                      : '#78716C',
                    fontWeight: post.isLiked ? '800' : '600',
                  },
                ]}
              >
                J’aime
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.75}
              onPress={() => openComposer()}
            >
              <MessageCircle
                size={20}
                color={isDark ? '#A8A29E' : '#78716C'}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? '#A8A29E' : '#78716C' },
                ]}
              >
                Commenter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.75}
              onPress={handleShare}
            >
              <Share2
                size={19}
                color={isDark ? '#A8A29E' : '#78716C'}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? '#A8A29E' : '#78716C' },
                ]}
              >
                Partager
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Commentaires intégrée à la page */}
        <View style={styles.commentsSection}>
          <View style={styles.commentsHeaderRow}>
            <Text
              style={[
                styles.commentsSectionTitle,
                { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
              ]}
            >
              Commentaires ({comments.length})
            </Text>
            <Text style={styles.commentsFilterText}>Les plus récents ▾</Text>
          </View>

          {comments.length === 0 ? (
            <View style={styles.emptyCommentsContainer}>
              <Sparkles size={32} color={AppColors.primary} />
              <Text
                style={[
                  styles.emptyCommentsTitle,
                  { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                ]}
              >
                Aucun commentaire pour l'instant
              </Text>
              <Text style={styles.emptyCommentsSubtitle}>
                Soyez le premier à donner votre avis ou poser une question à {post.authorName} !
              </Text>
            </View>
          ) : (
            comments.map(comment => {
              const isCommentLiked = likedComments[comment.id] || false;
              return (
                <View key={comment.id} style={styles.commentItem}>
                  {/* Avatar du commentateur */}
                  <View
                    style={[
                      styles.commentAvatarCircle,
                      {
                        backgroundColor: isDark ? '#2E2A27' : '#FFE4D6',
                      },
                    ]}
                  >
                    <Text style={styles.commentAvatarLetter}>
                      {comment.authorName.charAt(0)}
                    </Text>
                  </View>

                  {/* Bulle de commentaire */}
                  <View style={styles.commentBubbleWrap}>
                    <View
                      style={[
                        styles.commentBubble,
                        {
                          backgroundColor: isDark ? '#1F1C1A' : '#F4F2EE',
                          borderColor: isDark ? '#2E2A27' : '#E8E5DF',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.commentAuthorName,
                          { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                        ]}
                      >
                        {comment.authorName}
                      </Text>
                      <Text
                        style={[
                          styles.commentContentText,
                          { color: isDark ? '#E5E2DC' : '#33312E' },
                        ]}
                      >
                        {comment.content}
                      </Text>
                    </View>

                    {/* Actions sous le commentaire */}
                    <View style={styles.commentActionsRow}>
                      <Text style={styles.commentTimeText}>
                        {comment.createdAt}
                      </Text>

                      <TouchableOpacity
                        onPress={() => handleToggleCommentLike(comment.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Text
                          style={[
                            styles.commentActionBtnText,
                            isCommentLiked && {
                              color: AppColors.primary,
                              fontWeight: '800',
                            },
                          ]}
                        >
                          J’aime {isCommentLiked ? '(1)' : ''}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => openComposer(comment.authorName)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Text style={styles.commentActionBtnText}>
                          Répondre
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 3. Barre déclencheur de commentaire fixe en bas de la page */}
      <View
        style={[
          styles.triggerBarContainer,
          {
            backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
            borderTopColor: isDark ? AppColors.borderDark : '#EFECE6',
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.triggerBar,
            {
              backgroundColor: isDark ? '#262220' : '#F5F3EF',
              borderColor: isDark ? '#3D3834' : '#E8E4DC',
            },
          ]}
          activeOpacity={0.85}
          onPress={() => openComposer()}
        >
          <View
            style={[
              styles.userMiniAvatar,
              { backgroundColor: isDark ? '#38322E' : '#FFE4D6' },
            ]}
          >
            <Text style={styles.userMiniAvatarText}>V</Text>
          </View>
          <Text
            style={[
              styles.triggerPlaceholder,
              { color: isDark ? '#8C8A87' : '#A8A29E' },
            ]}
            numberOfLines={1}
          >
            Écrire un commentaire pour {post.authorName}...
          </Text>
          <View style={styles.triggerSendBtn}>
            <Send size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. Modal de Rédaction de Commentaire (Vue Plein Écran Supérieure - Clavier en dessous garanti) */}
      <Modal
        visible={isComposerVisible}
        animationType="slide"
        onRequestClose={() => setIsComposerVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.composerSafeArea,
            {
              backgroundColor: isDark ? '#141210' : '#FFFFFF',
            },
          ]}
        >
          {/* Header du Composeur */}
          <View
            style={[
              styles.composerTopNav,
              {
                borderBottomColor: isDark ? '#262220' : '#EFECE6',
              },
            ]}
          >
            <TouchableOpacity
              style={styles.composerCancelBtn}
              activeOpacity={0.75}
              onPress={() => setIsComposerVisible(false)}
            >
              <Text
                style={[
                  styles.composerCancelText,
                  { color: isDark ? '#A8A29E' : '#78716C' },
                ]}
              >
                Annuler
              </Text>
            </TouchableOpacity>

            <View style={styles.composerNavCenter}>
              <Text
                style={[
                  styles.composerNavTitle,
                  { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                ]}
              >
                Nouveau commentaire
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.composerSubmitBtn,
                {
                  backgroundColor: commentText.trim()
                    ? AppColors.primary
                    : isDark
                    ? '#262220'
                    : '#ECEAE4',
                },
              ]}
              disabled={!commentText.trim()}
              activeOpacity={0.8}
              onPress={handleSendComment}
            >
              <Text
                style={[
                  styles.composerSubmitBtnText,
                  {
                    color: commentText.trim()
                      ? '#FFFFFF'
                      : isDark
                      ? '#5C5854'
                      : '#A8A29E',
                  },
                ]}
              >
                Publier
              </Text>
              <Send
                size={13}
                color={
                  commentText.trim()
                    ? '#FFFFFF'
                    : isDark
                    ? '#5C5854'
                    : '#A8A29E'
                }
              />
            </TouchableOpacity>
          </View>

          {/* Corps de rédaction dans la partie supérieure de l'écran */}
          <ScrollView
            style={styles.composerBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Info sur le destinataire */}
            <View
              style={[
                styles.composerTargetCard,
                {
                  backgroundColor: isDark ? '#1E1B18' : '#F7F5F0',
                  borderColor: isDark ? '#302B26' : '#E8E4DC',
                },
              ]}
            >
              <Text
                style={[
                  styles.composerTargetLabel,
                  { color: isDark ? '#A8A29E' : '#78716C' },
                ]}
              >
                {replyingTo ? 'En réponse à ' : 'En réponse à la publication de '}
                <Text style={{ fontWeight: '800', color: AppColors.primary }}>
                  {replyingTo || post.authorName}
                </Text>
              </Text>
            </View>

            {/* Auteur actuel */}
            <View style={styles.composerAuthorRow}>
              <View
                style={[
                  styles.userMiniAvatar,
                  { backgroundColor: isDark ? '#38322E' : '#FFE4D6' },
                ]}
              >
                <Text style={styles.userMiniAvatarText}>V</Text>
              </View>
              <Text
                style={[
                  styles.composerAuthorName,
                  { color: isDark ? '#D6D3CD' : '#4A4744' },
                ]}
              >
                Vous commentez publiquement
              </Text>
            </View>

            {/* Zone de saisie textuelle spacieuse */}
            <TextInput
              style={[
                styles.composerFullTextInput,
                {
                  color: isDark ? '#FFFFFF' : '#1E1D1D',
                  backgroundColor: isDark ? '#1C1917' : '#F9F8F5',
                  borderColor: isDark ? '#2E2A27' : '#E8E5DF',
                },
              ]}
              placeholder="Écrivez votre commentaire ou astuce culinaire..."
              placeholderTextColor={isDark ? '#78716C' : '#A8A29E'}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              autoFocus
              maxLength={400}
            />

            {/* Compteur de caractères */}
            <View style={styles.composerMetaRow}>
              <Text
                style={[
                  styles.composerCharCount,
                  { color: isDark ? '#78716C' : '#8C8A87' },
                ]}
              >
                {commentText.length} / 400 caractères
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Visualiseur de Photo plein écran */}
      <PostImageModal
        visible={isImageModalVisible}
        post={post}
        onClose={() => setIsImageModalVisible(false)}
        onSelectRecipe={handleSelectRecipe}
        onToggleLike={handleToggleLike}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerShareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  postPageSection: {
    paddingTop: 14,
    paddingBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  authorAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarLetter: {
    fontSize: 18,
    fontWeight: '800',
  },
  authorMeta: {
    flex: 1,
  },
  nameCountryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorNameText: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  countryBadge: {
    fontSize: 12,
  },
  roleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: '#8C8A87',
  },
  bookmarkBtn: {
    padding: 6,
  },
  postContentText: {
    fontSize: 15.5,
    lineHeight: 23,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  tagPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    color: AppColors.primary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  imageWrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    height: 250,
    marginBottom: 14,
    backgroundColor: '#000000',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageRegionBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  imageRegionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  expandBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  linkedRecipeCard: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  recipeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recipeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 83, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeTextWrap: {
    flex: 1,
  },
  recipeSublabel: {
    fontSize: 10,
    color: AppColors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recipeTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 1,
  },
  recipeArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 83, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSummaryRow: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heartMiniCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBar: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionBtnLiked: {
    transform: [{ scale: 1.02 }],
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  commentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  commentsFilterText: {
    fontSize: 12,
    color: '#8C8A87',
    fontWeight: '600',
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyCommentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyCommentsSubtitle: {
    fontSize: 12.5,
    color: '#8C8A87',
    textAlign: 'center',
    maxWidth: 260,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  commentAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarLetter: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.primary,
  },
  commentBubbleWrap: {
    flex: 1,
  },
  commentBubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
  },
  commentAuthorName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  commentContentText: {
    fontSize: 13,
    lineHeight: 18.5,
  },
  commentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  commentTimeText: {
    fontSize: 11,
    color: '#8C8A87',
  },
  commentActionBtnText: {
    fontSize: 11.5,
    color: '#8C8A87',
    fontWeight: '700',
  },
  triggerBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  triggerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
  },
  userMiniAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMiniAvatarText: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  triggerPlaceholder: {
    flex: 1,
    fontSize: 13,
  },
  triggerSendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerSafeArea: {
    flex: 1,
  },
  composerTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  composerCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  composerCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  composerNavCenter: {
    flex: 1,
    alignItems: 'center',
  },
  composerNavTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  composerSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  composerSubmitBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  composerBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  composerTargetCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  composerTargetLabel: {
    fontSize: 12.5,
  },
  composerAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  composerAuthorName: {
    fontSize: 13,
    fontWeight: '600',
  },
  composerFullTextInput: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15.5,
    lineHeight: 22,
    minHeight: 140,
    maxHeight: 220,
    textAlignVertical: 'top',
  },
  composerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
  },
  composerCharCount: {
    fontSize: 12,
    fontWeight: '600',
  },
});
