import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
  Animated,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Share2,
  CookingPot,
  Sparkles,
  Award,
  ChevronRight,
  MoreHorizontal,
  Flame,
  CheckCircle2,
  Maximize2,
} from 'lucide-react-native';
import { CommunityPost } from '../../types/community';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';
import { BookmarkIcon, BookmarkIconHandle } from '../common/BookmarkIcon';
import { BookmarkCheckIcon, BookmarkCheckIconHandle } from '../common/BookmarkCheckIcon';

interface CommunityPostCardProps {
  post: CommunityPost;
  onToggleLike: (postId: string) => void;
  onToggleBookmark?: (postId: string) => void;
  onOpenComments: (post: CommunityPost) => void;
  onSelectRecipe?: (recipeId: string, recipeName: string) => void;
  onAuthorPress?: (authorName: string) => void;
  onImagePress?: (post: CommunityPost) => void;
  onPress?: (post: CommunityPost) => void;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
  post,
  onToggleLike,
  onToggleBookmark,
  onOpenComments,
  onSelectRecipe,
  onAuthorPress,
  onImagePress,
  onPress,
}) => {
  const { isDark } = useTheme();
  const [isBookmarkedLocal, setIsBookmarkedLocal] = useState(post.isBookmarked || false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Regarde cette réalisation de ${post.authorName} sur AfroCuisto : "${post.content.slice(0, 100)}..." 🍲\n\nTélécharge l'application AfroCuisto pour découvrir la recette !`,
      });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const bookmarkIconRef = useRef<BookmarkIconHandle>(null);
  const bookmarkCheckIconRef = useRef<BookmarkCheckIconHandle>(null);

  // Animation #4 Double Tap Coeur Like du Laboratoire
  const likeScale = useRef(new Animated.Value(1)).current;
  const floatingHeartScale = useRef(new Animated.Value(0)).current;
  const floatingHeartOpacity = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<any>(null);

  const triggerLikeAnimation = () => {
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
  };

  const handleLikePress = () => {
    triggerLikeAnimation();
    onToggleLike(post.id);
  };

  const triggerHeartBurst = () => {
    floatingHeartScale.setValue(0.3);
    floatingHeartOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(floatingHeartScale, {
        toValue: 1.3,
        friction: 4,
        tension: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.sequence([
        Animated.delay(220),
        Animated.timing(floatingHeartOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    ]).start();
  };

  const handleImagePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap détecté !
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      triggerHeartBurst();
      triggerLikeAnimation();
      if (!post.isLiked) {
        onToggleLike(post.id);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        onImagePress?.(post);
        lastTapRef.current = 0;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const handleBookmark = () => {
    const newBookmarked = !isBookmarkedLocal;
    setIsBookmarkedLocal(newBookmarked);
    if (onToggleBookmark) onToggleBookmark(post.id);
  };

  const getRoleColor = (role?: string | null) => {
    if (!role) return isDark ? '#A8A29E' : '#78716C';
    if (role.includes('Chef')) return AppColors.primary;
    if (role.includes('Terroir')) return '#16A34A';
    if (role.includes('Gourmet')) return '#EA580C';
    return isDark ? '#A8A29E' : '#78716C';
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
          borderColor: isDark ? '#2E2A27' : '#EFECE6',
        },
      ]}
    >
      {/* 1. Header du Post (Auteur + Rôle + Pays + Horodatage + Menu) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorSection}
          activeOpacity={0.8}
          onPress={() => onAuthorPress?.(post.authorName)}
        >
          {post.authorAvatar ? (
            <Image
              source={getImageSource(post.authorAvatar)}
              style={styles.avatarImage}
            />
          ) : (
            <View
              style={[
                styles.avatarCircle,
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
                  styles.avatarLetter,
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

          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text
                style={[
                  styles.authorName,
                  { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                ]}
              >
                {post.authorName}
              </Text>
              {post.authorCountry && (
                <Text style={styles.countryBadge}>{post.authorCountry}</Text>
              )}
            </View>

            <View style={styles.roleTimeRow}>
              {post.authorRole && (
                <View
                  style={[
                    styles.roleBadge,
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
        </TouchableOpacity>

        {/* Bouton Signet / Options */}
        <TouchableOpacity
          style={[
            styles.iconBtn,
            isBookmarkedLocal && {
              backgroundColor: isDark ? 'rgba(255, 83, 42, 0.12)' : 'rgba(255, 83, 42, 0.08)',
              borderRadius: 12,
            },
          ]}
          activeOpacity={0.75}
          onPress={handleBookmark}
        >
          {!isBookmarkedLocal ? (
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

      {/* 2. Contenu textuel (Cliquer ouvre la page de détails) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress?.(post)}
      >
        <Text
          style={[
            styles.content,
            { color: isDark ? '#EBE8E1' : '#2D2B29' },
          ]}
        >
          {post.content}
        </Text>
      </TouchableOpacity>

      {/* 3. Tags & Catégories */}
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

      {/* 4. Image de la réalisation culinaire (Double Tap pour liker) */}
      {post.imageUrl && (
        <TouchableOpacity
          style={styles.imageWrapper}
          activeOpacity={0.95}
          onPress={handleImagePress}
        >
          <Image
            source={getImageSource(post.imageUrl)}
            style={styles.postImage}
            resizeMode="cover"
          />

          {/* Cœur flottant animé lors du Double Tap (#4 Double Tap Heart) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.floatingHeartCenter,
              {
                opacity: floatingHeartOpacity,
                transform: [{ scale: floatingHeartScale }],
              },
            ]}
          >
            <Heart size={72} color="#FFFFFF" fill="#FF532A" strokeWidth={1.5} />
          </Animated.View>

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

      {/* 5. Fiche Recette Liée (Cliquable pour ouvrir la recette) */}
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
          onPress={() => {
            if (onSelectRecipe && post.recipeId) {
              onSelectRecipe(post.recipeId, post.recipeName || '');
            }
          }}
        >
          <View style={styles.recipeLeft}>
            <View style={styles.recipeIconCircle}>
              <CookingPot size={18} color={AppColors.primary} />
            </View>
            <View>
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

      {/* 6. Barre d'actions interactives (Likes, Commentaires, Partage) */}
      <View
        style={[
          styles.actionsBar,
          { borderTopColor: isDark ? '#2E2A27' : '#F0EDE8' },
        ]}
      >
        <View style={styles.actionsLeft}>
          {/* Bouton Like (#4 Double Tap Coeur Like du Lab) */}
          <TouchableOpacity
            style={[
              styles.actionItem,
              post.isLiked && styles.actionItemLiked,
            ]}
            activeOpacity={0.75}
            onPress={handleLikePress}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Heart
                size={20}
                color={post.isLiked ? AppColors.primary : '#8C8A87'}
                fill={post.isLiked ? AppColors.primary : 'transparent'}
              />
            </Animated.View>
            <Text
              style={[
                styles.actionCount,
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
              {post.likesCount}
            </Text>
          </TouchableOpacity>

          {/* Bouton Commentaires */}
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.8}
            onPress={() => onOpenComments(post)}
          >
            <MessageCircle size={19} color="#8C8A87" />
            <Text
              style={[
                styles.actionCount,
                { color: isDark ? '#A8A29E' : '#78716C' },
              ]}
            >
              {post.commentsCount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bouton Partager */}
        <TouchableOpacity
          style={styles.actionItem}
          activeOpacity={0.8}
          onPress={handleShare}
        >
          <Share2 size={18} color="#8C8A87" />
          <Text
            style={[
              styles.actionCount,
              { color: isDark ? '#A8A29E' : '#78716C' },
            ]}
          >
            Partager
          </Text>
        </TouchableOpacity>
      </View>

      {/* 7. Aperçu du dernier commentaire si présent */}
      {post.comments && post.comments.length > 0 && (
        <TouchableOpacity
          style={[
            styles.commentPreviewWrap,
            { backgroundColor: isDark ? '#171513' : '#F9F8F5' },
          ]}
          activeOpacity={0.85}
          onPress={() => onOpenComments(post)}
        >
          <Text
            style={[
              styles.commentPreviewText,
              { color: isDark ? '#A8A29E' : '#78716C' },
            ]}
            numberOfLines={2}
          >
            <Text style={styles.commentAuthorBold}>
              {post.comments[0].authorName} :{' '}
            </Text>
            {post.comments[0].content}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '800',
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 14.5,
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
  roleBadge: {
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
  iconBtn: {
    padding: 6,
  },
  content: {
    fontSize: 14,
    lineHeight: 20.5,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    color: AppColors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  imageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    height: 220,
    marginBottom: 12,
    backgroundColor: '#000000',
  },
  floatingHeartCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  recipeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recipeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 83, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeSublabel: {
    fontSize: 10,
    color: AppColors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recipeTitle: {
    fontSize: 13,
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
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionItemLiked: {
    transform: [{ scale: 1.02 }],
  },
  actionCount: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  commentPreviewWrap: {
    marginTop: 10,
    padding: 8,
    borderRadius: 10,
  },
  commentPreviewText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  commentAuthorBold: {
    fontWeight: '800',
    color: AppColors.primary,
  },
});
