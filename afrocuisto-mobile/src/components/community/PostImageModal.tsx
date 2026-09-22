import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Animated,
  StatusBar,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Heart, MessageCircle, Share2, CookingPot, ChevronRight } from 'lucide-react-native';
import { CommunityPost } from '../../types/community';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';

interface PostImageModalProps {
  visible: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onSelectRecipe?: (recipeId: string, recipeName: string) => void;
  onToggleLike?: (postId: string) => void;
  onOpenComments?: (post: CommunityPost) => void;
}

export const PostImageModal: React.FC<PostImageModalProps> = ({
  visible,
  post,
  onClose,
  onSelectRecipe,
  onToggleLike,
  onOpenComments,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (visible) {
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.94);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `Découvre la création culinaire de ${post.authorName} sur AfroCuisto : "${post.content.slice(0, 100)}..." 🍲\n\nTélécharge l'application AfroCuisto !`,
      });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  if (!visible || !post || !post.imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
            backgroundColor: isDark
              ? 'rgba(18, 17, 16, 0.96)'
              : 'rgba(255, 255, 255, 0.97)',
          },
        ]}
      >
        {/* Fond d'arrière-plan intégral cliquable pour fermer */}
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
        />

        {/* 1. Header supérieur (Auteur + Bouton Fermer) */}
        <View
          style={[
            styles.topBar,
            {
              paddingTop: Math.max(insets.top, 16) + 8,
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.authorGroup}>
            {post.authorAvatar ? (
              <Image
                source={getImageSource(post.authorAvatar)}
                style={[
                  styles.authorAvatar,
                  {
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(0,0,0,0.1)',
                  },
                ]}
              />
            ) : (
              <View style={styles.authorLetterCircle}>
                <Text style={styles.authorLetter}>
                  {post.authorName.charAt(0)}
                </Text>
              </View>
            )}
            <View>
              <Text
                style={[
                  styles.authorName,
                  { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {post.authorName}
              </Text>
              <Text
                style={[
                  styles.postMeta,
                  { color: isDark ? '#A8A29E' : '#787571' },
                ]}
              >
                {post.region ? `${post.region} • ` : ''}
                {post.createdAt}
              </Text>
            </View>
          </View>

          {/* Bouton de fermeture */}
          <TouchableOpacity
            style={[
              styles.closeBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.06)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
            activeOpacity={0.8}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X
              size={20}
              color={isDark ? '#FFFFFF' : '#1E1D1D'}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>

        {/* 2. Zone centrale d'affichage de l'image (Tout tap ferme la vue) */}
        <Pressable
          style={styles.imageContainer}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.imageWrapper,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
            pointerEvents="none"
          >
            <Image
              source={getImageSource(post.imageUrl)}
              style={[
                styles.fullImage,
                {
                  width: screenWidth,
                  height: screenHeight * 0.58,
                },
              ]}
              resizeMode="contain"
            />
          </Animated.View>
        </Pressable>

        {/* 3. Footer inférieur (Description, Recette liée & Actions) */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 12,
              backgroundColor: isDark
                ? 'rgba(26, 24, 22, 0.94)'
                : 'rgba(255, 255, 255, 0.96)',
              borderTopColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.07)',
            },
          ]}
        >
          {/* Texte de la publication */}
          {post.content && (
            <Text
              style={[
                styles.postContent,
                { color: isDark ? '#EBE8E1' : '#2D2B29' },
              ]}
              numberOfLines={3}
            >
              {post.content}
            </Text>
          )}

          {/* Recette liée si présente */}
          {post.recipeName && (
            <TouchableOpacity
              style={[
                styles.linkedRecipeCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 83, 42, 0.15)'
                    : '#FFF2EE',
                  borderColor: isDark
                    ? 'rgba(255, 83, 42, 0.35)'
                    : '#FFE3D6',
                },
              ]}
              activeOpacity={0.85}
              onPress={() => {
                handleClose();
                if (onSelectRecipe && post.recipeId) {
                  onSelectRecipe(post.recipeId, post.recipeName || '');
                }
              }}
            >
              <View style={styles.recipeLeft}>
                <View style={styles.recipeIconCircle}>
                  <CookingPot size={15} color={AppColors.primary} />
                </View>
                <View style={styles.recipeTextWrap}>
                  <Text style={styles.recipeSublabel}>Voir la recette</Text>
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
              <ChevronRight
                size={16}
                color={isDark ? '#FFFFFF' : AppColors.textPrimary}
              />
            </TouchableOpacity>
          )}

          {/* Actions rapides */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={() => onToggleLike?.(post.id)}
            >
              <Heart
                size={22}
                color={
                  post.isLiked
                    ? AppColors.primary
                    : isDark
                    ? '#FFFFFF'
                    : '#5C5854'
                }
                fill={post.isLiked ? AppColors.primary : 'transparent'}
              />
              <Text
                style={[
                  styles.actionText,
                  {
                    color: post.isLiked
                      ? AppColors.primary
                      : isDark
                      ? '#FFFFFF'
                      : '#5C5854',
                    fontWeight: post.isLiked ? '800' : '600',
                  },
                ]}
              >
                {post.likesCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={() => {
                handleClose();
                onOpenComments?.(post);
              }}
            >
              <MessageCircle
                size={22}
                color={isDark ? '#FFFFFF' : '#5C5854'}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: isDark ? '#FFFFFF' : '#5C5854' },
                ]}
              >
                {post.commentsCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={handleShare}
            >
              <Share2 size={21} color={isDark ? '#FFFFFF' : '#5C5854'} />
              <Text
                style={[
                  styles.actionText,
                  { color: isDark ? '#FFFFFF' : '#5C5854' },
                ]}
              >
                Partager
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
  },
  authorLetterCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  postMeta: {
    fontSize: 11.5,
    marginTop: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    maxWidth: '100%',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    gap: 12,
    zIndex: 10,
  },
  postContent: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  linkedRecipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  recipeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recipeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 83, 42, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeTextWrap: {
    flex: 1,
  },
  recipeSublabel: {
    color: AppColors.primary,
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recipeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
  },
});
