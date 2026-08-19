import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Heart, MessageCircle, Share2, Plus } from 'lucide-react-native';
import { CommunityPost } from '../types/community';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../theme/colors';
import { CommunityScreenSkeleton } from '../components/common/Skeletons';
import { AnimatedScreenWrapper } from '../components/common/AnimatedScreenWrapper';
import { useNavigationTransition } from '../context/NavigationTransitionContext';

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    authorName: 'Mireille D.',
    content: 'J’ai testé la recette d’Amiwo au poulet braisé ce midi ! Un régal absolu avec la sauce pimentée maison. 🌶️🍗',
    recipeName: 'Amiwo au Poulet',
    likesCount: 24,
    commentsCount: 5,
    isLiked: false,
    createdAt: 'Il y a 2h',
  },
  {
    id: 'post_2',
    authorName: 'Koffi A.',
    content: 'Atassi réussi du premier coup grâce aux conseils de cuisson sur les haricots ! La communauté AfroCuisto assure 🍲🔥',
    recipeName: 'Atassi Complet',
    likesCount: 18,
    commentsCount: 3,
    isLiked: true,
    createdAt: 'Il y a 5h',
  },
];

export const CommunityScreen: React.FC = () => {
  const { isDark } = useTheme();
  const { isScreenLoading } = useNavigationTransition();
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);

  const showSkeleton = isScreenLoading('Community');

  const toggleLike = (id: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      )
    );
  };

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
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
          >
            Communauté AfroCuisto
          </Text>
          <TouchableOpacity style={styles.postBtn}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.postBtnText}>Publier</Text>
          </TouchableOpacity>
        </View>

        {showSkeleton ? (
          <CommunityScreenSkeleton />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.postCard,
                  {
                    backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
                    borderColor: isDark ? '#2E2C29' : '#EFECE6',
                  },
                ]}
              >
                <View style={styles.postHeader}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.avatarLetter}>
                      {item.authorName.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.authorName,
                        { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                      ]}
                    >
                      {item.authorName}
                    </Text>
                    <Text style={styles.postTime}>{item.createdAt}</Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.postContent,
                    { color: isDark ? '#E5E2DC' : '#3D3B39' },
                  ]}
                >
                  {item.content}
                </Text>

                {item.recipeName && (
                  <View
                    style={[
                      styles.recipeTag,
                      {
                        backgroundColor: isDark ? '#26201D' : '#FFF2EE',
                        borderColor: isDark ? '#3D2C27' : '#FFD5CC',
                      },
                    ]}
                  >
                    <Text style={styles.recipeTagText}>🍲 {item.recipeName}</Text>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => toggleLike(item.id)}
                  >
                    <Heart
                      size={18}
                      color={item.isLiked ? AppColors.primary : '#8C8A87'}
                      fill={item.isLiked ? AppColors.primary : 'transparent'}
                    />
                    <Text
                      style={[
                        styles.actionCount,
                        item.isLiked && { color: AppColors.primary, fontWeight: '700' },
                      ]}
                    >
                      {item.likesCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn}>
                    <MessageCircle size={18} color="#8C8A87" />
                    <Text style={styles.actionCount}>{item.commentsCount}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn}>
                    <Share2 size={18} color="#8C8A87" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  postBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    gap: 14,
  },
  postCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  postTime: {
    fontSize: 11,
    color: '#8C8A87',
  },
  postContent: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 10,
  },
  recipeTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 83, 42, 0.09)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  recipeTagText: {
    color: AppColors.primary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontSize: 12,
    color: '#8C8A87',
    fontWeight: '600',
  },
});
