import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Camera,
  Plus,
  Eye,
  Trash2,
  Share2,
  CookingPot,
  Play,
  Sparkles,
  Heart,
  Clock,
} from 'lucide-react-native';
import { CommunityStory } from '../../types/community';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';

interface MyStoriesManagerModalProps {
  visible: boolean;
  userStories: CommunityStory[];
  onClose: () => void;
  onViewStory: (story: CommunityStory, index: number) => void;
  onAddNewStory: () => void;
  onDeleteStory: (storyId: string) => void;
}

export const MyStoriesManagerModal: React.FC<MyStoriesManagerModalProps> = ({
  visible,
  userStories,
  onClose,
  onViewStory,
  onAddNewStory,
  onDeleteStory,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [storyToDelete, setStoryToDelete] = useState<CommunityStory | null>(null);

  const handleConfirmDelete = (story: CommunityStory) => {
    setStoryToDelete(story);
  };

  const handleShareStory = async (story: CommunityStory) => {
    try {
      await Share.share({
        message: `Regarde mon statut culinaire sur AfroCuisto : "${story.title}" 🍲\n\nTélécharge l'application AfroCuisto !`,
      });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: isDark ? AppColors.backgroundDark : '#F8F7F4',
          },
        ]}
        edges={['top', 'left', 'right']}
      >
        {/* 1. Header Navigation WhatsApp Style */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
              borderBottomColor: isDark ? '#262220' : '#EFECE6',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                backgroundColor: isDark ? '#262220' : '#F5F3EF',
                borderColor: isDark ? '#3D3834' : '#E8E4DC',
              },
            ]}
            activeOpacity={0.8}
            onPress={onClose}
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
            >
              Mes statuts
            </Text>
            <Text style={styles.headerSubtitle}>
              {userStories.length} publication{userStories.length > 1 ? 's' : ''} • Visible 24h
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* 2. Liste des stories de l'utilisateur */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Bannière explicative style WhatsApp */}
          <View
            style={[
              styles.infoBanner,
              {
                backgroundColor: isDark ? '#24201E' : '#FFF6F2',
                borderColor: isDark ? '#3D322E' : '#FFE2D6',
              },
            ]}
          >
            <Clock size={16} color={AppColors.primary} />
            <Text
              style={[
                styles.infoBannerText,
                { color: isDark ? '#D6D3CD' : '#7C2D12' },
              ]}
            >
              Vos stories restent visibles auprès de toute la communauté pendant 24 heures.
            </Text>
          </View>

          {userStories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Sparkles size={48} color={AppColors.primary} />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                ]}
              >
                Aucun statut actif
              </Text>
              <Text style={styles.emptySubtitle}>
                Partagez votre première réalisation culinaire ou astuce avec la communauté AfroCuisto !
              </Text>
              <TouchableOpacity
                style={styles.emptyCtaBtn}
                activeOpacity={0.85}
                onPress={onAddNewStory}
              >
                <Camera size={18} color="#FFFFFF" />
                <Text style={styles.emptyCtaText}>Créer un statut</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.storiesListWrap}>
              {userStories.map((story, index) => {
                const hash = story.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                const viewsCount = story.viewsCount ?? ((hash % 35) + (index * 9) + 7);
                const likesCount = story.likesCount ?? Math.max(1, Math.floor(viewsCount * 0.3));

                return (
                  <View
                    key={story.id}
                    style={[
                      styles.storyCard,
                      {
                        backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
                        borderColor: isDark ? '#2E2A27' : '#EFECE6',
                      },
                    ]}
                  >
                    {/* Miniature 4:3 Cliquable pour lecture */}
                    <TouchableOpacity
                      style={styles.thumbnailWrap}
                      activeOpacity={0.88}
                      onPress={() => onViewStory(story, index)}
                    >
                      <Image
                        source={getImageSource(story.imageUrl)}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                      <View style={styles.playIconOverlay}>
                        <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                      </View>
                    </TouchableOpacity>

                    {/* Informations de la story */}
                    <TouchableOpacity
                      style={styles.storyMetaWrap}
                      activeOpacity={0.8}
                      onPress={() => onViewStory(story, index)}
                    >
                      <Text
                        style={[
                          styles.storyTitleText,
                          { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                        ]}
                        numberOfLines={1}
                      >
                        {story.title || 'Statut gourmand'}
                      </Text>

                      {story.caption ? (
                        <Text
                          style={[
                            styles.storyCaptionText,
                            { color: isDark ? '#A8A29E' : '#78716C' },
                          ]}
                          numberOfLines={1}
                        >
                          {story.caption}
                        </Text>
                      ) : null}

                      {/* Recette rattachée */}
                      {story.recipeName && (
                        <View style={styles.recipeTagPill}>
                          <CookingPot size={11} color={AppColors.primary} />
                          <Text style={styles.recipeTagText} numberOfLines={1}>
                            {story.recipeName}
                          </Text>
                        </View>
                      )}

                      {/* Statistiques de vues et de likes */}
                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Eye size={13} color="#8C8A87" />
                          <Text style={styles.statText}>{viewsCount} vues</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Heart size={13} color={AppColors.primary} fill={AppColors.primary} />
                          <Text style={styles.statText}>{likesCount}</Text>
                        </View>
                        <Text style={styles.timeAgoText}>• Publié récemment</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Actions : Supprimer & Partager */}
                    <View style={styles.actionsColumn}>
                      <TouchableOpacity
                        style={[
                          styles.actionIconBtn,
                          {
                            backgroundColor: isDark ? '#262220' : '#F5F3EF',
                          },
                        ]}
                        activeOpacity={0.75}
                        onPress={() => handleShareStory(story)}
                      >
                        <Share2 size={16} color={isDark ? '#D6D3CD' : '#4A4846'} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionIconBtn,
                          styles.deleteIconBtn,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => handleConfirmDelete(story)}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* 3. Bouton Flottant WhatsApp pour ajouter un nouveau statut */}
        <View
          style={[
            styles.fabContainer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <TouchableOpacity
            style={styles.whatsappCameraFab}
            activeOpacity={0.88}
            onPress={onAddNewStory}
          >
            <Camera size={24} color="#FFFFFF" strokeWidth={2.3} />
            <Text style={styles.fabLabel}>Nouveau statut</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Fenêtre de Confirmation Personnalisée Stylisée AfroCuisto */}
        <ConfirmationModal
          visible={storyToDelete !== null}
          title="Supprimer la story"
          message="Êtes-vous sûr de vouloir supprimer cette story ? Cette action est irréversible."
          type="destructive"
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={() => {
            if (storyToDelete) {
              onDeleteStory(storyToDelete.id);
              setStoryToDelete(null);
            }
          }}
          onCancel={() => setStoryToDelete(null)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
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
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#8C8A87',
    marginTop: 1,
  },
  headerSpacer: {
    width: 38,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8C8A87',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 19,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    marginTop: 10,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  storiesListWrap: {
    gap: 12,
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnailWrap: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  storyMetaWrap: {
    flex: 1,
    gap: 3,
  },
  storyTitleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  storyCaptionText: {
    fontSize: 12,
  },
  recipeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 83, 42, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  recipeTagText: {
    color: AppColors.primary,
    fontSize: 10.5,
    fontWeight: '700',
    maxWidth: 160,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#8C8A87',
    fontWeight: '600',
  },
  timeAgoText: {
    fontSize: 10.5,
    color: '#8C8A87',
  },
  actionsColumn: {
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    pointerEvents: 'box-none',
  },
  whatsappCameraFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669', // Emerald WhatsApp
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

