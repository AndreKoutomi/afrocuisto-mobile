import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Heart,
  ChevronRight,
  CookingPot,
  Eye,
  ChevronUp,
  Clock,
} from 'lucide-react-native';
import { CommunityStory } from '../../types/community';
import { useCommunity } from '../../context/CommunityContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';

interface CommunityStoryModalProps {
  visible: boolean;
  stories: CommunityStory[];
  initialIndex: number;
  onClose: () => void;
  onSelectRecipe?: (recipeId: string, recipeName: string) => void;
}

interface StoryViewerItem {
  id: string;
  name: string;
  avatarLetter: string;
  viewedAt: string;
  hasLiked: boolean;
}

const ALL_POTENTIAL_VIEWERS: StoryViewerItem[] = [
  { id: 'v1', name: 'Chef Mariam', avatarLetter: 'M', viewedAt: 'Il y a 3 min', hasLiked: true },
  { id: 'v2', name: 'Mireille D.', avatarLetter: 'M', viewedAt: 'Il y a 10 min', hasLiked: true },
  { id: 'v3', name: 'Koffi A.', avatarLetter: 'K', viewedAt: 'Il y a 18 min', hasLiked: false },
  { id: 'v4', name: 'Aïcha Traoré', avatarLetter: 'A', viewedAt: 'Il y a 35 min', hasLiked: true },
  { id: 'v5', name: 'Yao Mensah', avatarLetter: 'Y', viewedAt: 'Il y a 1h', hasLiked: false },
  { id: 'v6', name: 'Mama Sika', avatarLetter: 'S', viewedAt: 'Il y a 1h', hasLiked: true },
  { id: 'v7', name: 'Sékou T.', avatarLetter: 'S', viewedAt: 'Il y a 2h', hasLiked: false },
  { id: 'v8', name: 'Fatou Ndiaye', avatarLetter: 'F', viewedAt: 'Il y a 3h', hasLiked: true },
  { id: 'v9', name: 'Ousmane B.', avatarLetter: 'O', viewedAt: 'Il y a 4h', hasLiked: false },
  { id: 'v10', name: 'Ablanvi K.', avatarLetter: 'A', viewedAt: 'Il y a 5h', hasLiked: true },
];

const ViewerOverlayItem: React.FC<{ x: number; y: number; children: React.ReactNode }> = ({
  x,
  y,
  children,
}) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      onLayout={e => setSize(e.nativeEvent.layout)}
      style={[
        styles.storyViewerOverlayItem,
        {
          left: `${x}%`,
          top: `${y}%`,
          transform: [
            { translateX: size.width > 0 ? -size.width / 2 : 0 },
            { translateY: size.height > 0 ? -size.height / 2 : 0 },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {children}
    </View>
  );
};

export const CommunityStoryModal: React.FC<CommunityStoryModalProps> = ({
  visible,
  stories,
  initialIndex = 0,
  onClose,
  onSelectRecipe,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { recordStoryView, toggleLikeStory, fetchStoryViewers } = useCommunity();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // État de la fenêtre discrète des spectateurs (pour sa propre story)
  const [isViewsSheetVisible, setIsViewsSheetVisible] = useState(false);
  const [activeViewerTab, setActiveViewerTab] = useState<'all' | 'likes'>('all');
  const [dynamicViewers, setDynamicViewers] = useState<StoryViewerItem[]>([]);

  const currentStory = stories[currentIndex] || stories[0];

  // Vérifie si la story affichée appartient à l'utilisateur actif
  const isOwnStory =
    !!currentStory &&
    (currentStory.authorName === 'Vous' ||
      currentStory.authorName.toLowerCase() === 'vous');

  // Métriques individuelles par story
  const currentStoryMetrics = useMemo(() => {
    if (!currentStory) return { views: 0, likes: 0 };
    const hash = currentStory.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const views = currentStory.viewsCount ?? ((hash % 38) + (currentIndex * 11) + 12);
    const likes = currentStory.likesCount ?? Math.max(2, Math.floor(views * 0.35));
    return { views, likes };
  }, [currentStory, currentIndex]);

  // Liste individuelle de spectateurs pour la story actuelle
  const currentStoryViewers = useMemo(() => {
    if (dynamicViewers.length > 0) return dynamicViewers;
    if (!currentStory) return [];
    const hash = currentStory.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const offset = (hash + currentIndex) % (ALL_POTENTIAL_VIEWERS.length - 4);
    return ALL_POTENTIAL_VIEWERS.slice(offset, offset + 5);
  }, [currentStory, currentIndex, dynamicViewers]);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(currentStoryMetrics.likes);

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animation Like ultra-rapide (#4 Double Tap Coeur Like)
  const likeScale = useRef(new Animated.Value(1)).current;
  const floatingHeartScale = useRef(new Animated.Value(0)).current;
  const floatingHeartOpacity = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (visible && currentStory) {
      setCurrentIndex(initialIndex);
      setIsLiked(currentStory.isLiked || false);
      setLikesCount(currentStoryMetrics.likes);
      setIsViewsSheetVisible(false);
      recordStoryView(currentStory.id);
    }
  }, [visible, initialIndex]);

  // Charge les spectateurs réels quand la fenêtre s'ouvre
  useEffect(() => {
    if (isViewsSheetVisible && currentStory && isOwnStory) {
      fetchStoryViewers(currentStory.id).then(viewers => {
        if (viewers && viewers.length > 0) {
          setDynamicViewers(viewers);
        }
      });
    }
  }, [isViewsSheetVisible, currentStory?.id, isOwnStory]);

  // Synchronise les likes quand l'index de story change
  useEffect(() => {
    if (currentStory) {
      setIsLiked(currentStory.isLiked || false);
      setLikesCount(currentStoryMetrics.likes);
    }
  }, [currentIndex, currentStoryMetrics]);

  useEffect(() => {
    if (!visible || !currentStory || isViewsSheetVisible) return;

    progressAnim.setValue(0);
    const duration = (currentStory.duration || 5) * 1000;

    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });

    anim.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    return () => {
      anim.stop();
    };
  }, [currentIndex, visible, isViewsSheetVisible]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsViewsSheetVisible(false);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsViewsSheetVisible(false);
    } else {
      progressAnim.setValue(0);
    }
  };

  // Déclenche l'animation de LIKE rapide #4
  const triggerLikeAnimation = useCallback(() => {
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
  }, [likeScale]);

  // Burst Coeur flottant lors du double-tap sur l'image
  const triggerHeartBurst = useCallback(() => {
    floatingHeartScale.setValue(0.3);
    floatingHeartOpacity.setValue(1);
    Animated.parallel([
      Animated.spring(floatingHeartScale, {
        toValue: 1.35,
        friction: 4,
        tension: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(floatingHeartOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    ]).start();
  }, [floatingHeartScale, floatingHeartOpacity]);

  const toggleLike = useCallback(() => {
    triggerLikeAnimation();
    if (currentStory) {
      toggleLikeStory(currentStory.id);
    }
    setIsLiked(prev => {
      const next = !prev;
      setLikesCount(c => (next ? c + 1 : c - 1));
      return next;
    });
  }, [triggerLikeAnimation, currentStory, toggleLikeStory]);

  const handleImageTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double Tap détecté
      if (!isOwnStory && currentStory) {
        if (!isLiked) {
          setIsLiked(true);
          setLikesCount(c => c + 1);
          toggleLikeStory(currentStory.id);
        }
        triggerLikeAnimation();
        triggerHeartBurst();
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const filteredViewers =
    activeViewerTab === 'likes'
      ? currentStoryViewers.filter(v => v.hasLiked)
      : currentStoryViewers;

  const totalLikesCount = currentStoryViewers.filter(v => v.hasLiked).length;

  if (!visible || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Arrière-plan flouté d'ambiance */}
        <Image
          source={getImageSource(currentStory.imageUrl)}
          style={[styles.blurredBackdrop, { width: screenWidth, height: screenHeight }]}
          blurRadius={30}
          resizeMode="cover"
        />
        <View style={styles.backdropDimmer} />

        {/* Visuel Story Principal au Ratio 4:3 avec Auto-Crop */}
        <View style={styles.storyCenterArea}>
          <TouchableWithoutFeedback onPress={handleImageTap}>
            <View
              style={[
                styles.storyFrame43,
                {
                  width: screenWidth,
                  height: (screenWidth * 3) / 4,
                },
              ]}
            >
              <Image
                source={getImageSource(currentStory.imageUrl)}
                style={styles.storyImage43}
                resizeMode="cover"
              />

              {/* Stickers & Emojis positionnés fidèlement */}
              {currentStory.placedStickers &&
                currentStory.placedStickers.map(stk => (
                  <ViewerOverlayItem key={stk.id} x={stk.x} y={stk.y}>
                    <View
                      style={[
                        styles.viewerStickerBubble,
                        stk.isEmoji && styles.viewerEmojiStickerBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.viewerStickerText,
                          stk.isEmoji && styles.viewerEmojiStickerText,
                        ]}
                      >
                        {stk.content}
                      </Text>
                    </View>
                  </ViewerOverlayItem>
                ))}

              {/* Texte Overlay positionné fidèlement */}
              {currentStory.placedText && (
                <ViewerOverlayItem
                  x={currentStory.placedText.x}
                  y={currentStory.placedText.y}
                >
                  <View
                    style={[
                      styles.viewerTextBox,
                      currentStory.placedText.textBg && styles.viewerTextBoxWithBg,
                    ]}
                  >
                    <Text
                      style={[
                        styles.viewerTextRender,
                        {
                          color: currentStory.placedText.textColor || '#FFFFFF',
                          fontWeight:
                            currentStory.placedText.fontIndex === 2
                              ? '900'
                              : currentStory.placedText.fontIndex === 1
                              ? '600'
                              : '800',
                          fontStyle:
                            currentStory.placedText.fontIndex === 1
                              ? 'italic'
                              : 'normal',
                        },
                      ]}
                    >
                      {currentStory.placedText.text}
                    </Text>
                  </View>
                </ViewerOverlayItem>
              )}

              {/* Recette liée à la Story si présente */}
              {currentStory.recipeName && (
                <View style={styles.attachedRecipeBadgeViewer} pointerEvents="none">
                  <CookingPot size={15} color="#FFFFFF" strokeWidth={2.4} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attachedRecipeBadgeTitleViewer} numberOfLines={1}>
                      {currentStory.recipeName}
                    </Text>
                  </View>
                </View>
              )}

              {/* Animation Coeur Géant Flottant au centre si Double-Tap */}
              {!isOwnStory && (
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
                  <Heart size={84} color="#FFFFFF" fill="#FF532A" />
                </Animated.View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Dégradés supérieurs et inférieurs */}
        <View style={styles.topOverlay} pointerEvents="none" />
        <View style={styles.bottomOverlay} pointerEvents="none" />

        {/* Zone tactile gauche/droite pour naviguer */}
        <View style={styles.touchZones}>
          <TouchableWithoutFeedback onPress={handlePrev}>
            <View style={styles.touchLeft} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={handleNext}>
            <View style={styles.touchRight} />
          </TouchableWithoutFeedback>
        </View>

        {/* Header de Story (Barres de progression + Auteur + Bouton Fermer) */}
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 16) }]}>
          {/* Barres de progression pour chaque story */}
          <View style={styles.progressBarsRow}>
            {stories.map((s, idx) => {
              let fillWidth: any = '0%';
              if (idx < currentIndex) {
                fillWidth = '100%';
              } else if (idx === currentIndex) {
                fillWidth = progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                });
              }

              return (
                <View key={s.id} style={styles.progressBarBackground}>
                  <Animated.View style={[styles.progressBarFill, { width: fillWidth }]} />
                </View>
              );
            })}
          </View>

          {/* Profil Auteur & Close */}
          <View style={styles.authorRow}>
            <View style={styles.authorLeft}>
              <View style={styles.authorAvatar}>
                <Text style={styles.avatarLetter}>
                  {currentStory.authorName.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.authorName}>
                  {isOwnStory ? 'Votre story' : currentStory.authorName}
                </Text>
                <Text style={styles.storySubtitle}>
                  {currentStory.isLive ? '🔴 EN DIRECT' : 'Instant Gourmand'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.8}
              onPress={onClose}
              accessibilityLabel="Fermer la Story"
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenu Inférieur (Titre, Caption, Lien recette & Actions) */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
          {/* Tag Recette si rattachée */}
          {currentStory.recipeName && (
            <TouchableOpacity
              style={styles.recipeLinkBadge}
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                if (onSelectRecipe && currentStory.recipeId) {
                  onSelectRecipe(currentStory.recipeId, currentStory.recipeName || '');
                }
              }}
            >
              <CookingPot size={16} color="#FFFFFF" />
              <Text style={styles.recipeLinkText}>
                Voir la recette : {currentStory.recipeName}
              </Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <Text style={styles.storyTitle}>{currentStory.title}</Text>
          {currentStory.caption && (
            <Text style={styles.storyCaption}>{currentStory.caption}</Text>
          )}

          {/* Actions : Adaptées selon si propre story ou story d'un autre */}
          {isOwnStory ? (
            /* CAS 1 : Propre story -> Bouton VUES individuel uniquement */
            <View style={styles.ownStoryFooterRow}>
              <TouchableOpacity
                style={styles.ownStoryViewsPill}
                activeOpacity={0.85}
                onPress={() => setIsViewsSheetVisible(true)}
              >
                <View style={styles.viewsPillLeft}>
                  <Eye size={17} color="#FFFFFF" />
                  <Text style={styles.viewsPillText}>
                    {currentStoryMetrics.views} vues
                  </Text>
                  <View style={styles.viewsDot} />
                  <Heart size={13} color="#FF532A" fill="#FF532A" />
                  <Text style={styles.viewsLikesCount}>
                    {currentStoryMetrics.likes}
                  </Text>
                </View>
                <ChevronUp size={17} color="rgba(255,255,255,0.75)" />
              </TouchableOpacity>
            </View>
          ) : (
            /* CAS 2 : Story d'un autre -> Bouton LIKE animé uniquement */
            <View style={styles.otherStoryFooterRow}>
              <TouchableOpacity
                style={[
                  styles.reactBtn,
                  isLiked && styles.reactBtnLiked,
                ]}
                activeOpacity={0.8}
                onPress={toggleLike}
              >
                <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                  <Heart
                    size={22}
                    color={isLiked ? AppColors.primary : '#FFFFFF'}
                    fill={isLiked ? AppColors.primary : 'transparent'}
                  />
                </Animated.View>
                <Text
                  style={[
                    styles.reactText,
                    isLiked && { color: AppColors.primary, fontWeight: '800' },
                  ]}
                >
                  {likesCount}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 4. Fenêtre Discrète (Bottom Sheet) : Liste des Vues et Likes de la Story Active */}
        {isOwnStory && (
          <Modal
            visible={isViewsSheetVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setIsViewsSheetVisible(false)}
          >
            <View style={styles.sheetBackdrop}>
              <TouchableWithoutFeedback onPress={() => setIsViewsSheetVisible(false)}>
                <View style={styles.sheetDimmer} />
              </TouchableWithoutFeedback>

              <View
                style={[
                  styles.viewsSheetContainer,
                  { paddingBottom: insets.bottom + 16 },
                ]}
              >
                {/* Poignée de glissement */}
                <View style={styles.sheetHandle} />

                {/* En-tête de la feuille */}
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>Spectateurs du statut</Text>
                    <Text style={styles.sheetSubtitle}>
                      {currentStoryMetrics.views} personnes ont vu ce contenu
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.sheetCloseBtn}
                    activeOpacity={0.8}
                    onPress={() => setIsViewsSheetVisible(false)}
                  >
                    <X size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Onglets de filtrage (Toutes les vues / J'aime) */}
                <View style={styles.sheetTabsRow}>
                  <TouchableOpacity
                    style={[
                      styles.sheetTabBtn,
                      activeViewerTab === 'all' && styles.sheetTabBtnActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setActiveViewerTab('all')}
                  >
                    <Eye
                      size={14}
                      color={activeViewerTab === 'all' ? '#FFFFFF' : '#8C8A87'}
                    />
                    <Text
                      style={[
                        styles.sheetTabText,
                        activeViewerTab === 'all' && styles.sheetTabTextActive,
                      ]}
                    >
                      Toutes les vues ({currentStoryMetrics.views})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sheetTabBtn,
                      activeViewerTab === 'likes' && styles.sheetTabBtnActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setActiveViewerTab('likes')}
                  >
                    <Heart
                      size={13}
                      color={activeViewerTab === 'likes' ? '#FF532A' : '#8C8A87'}
                      fill={activeViewerTab === 'likes' ? '#FF532A' : 'transparent'}
                    />
                    <Text
                      style={[
                        styles.sheetTabText,
                        activeViewerTab === 'likes' && styles.sheetTabTextActive,
                      ]}
                    >
                      J’aime ({currentStoryMetrics.likes})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Liste des spectateurs individuels */}
                <ScrollView
                  style={styles.viewersScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredViewers.map(viewer => (
                    <View key={viewer.id} style={styles.viewerItemRow}>
                      <View style={styles.viewerLeft}>
                        {/* Avatar */}
                        <View style={styles.viewerAvatar}>
                          <Text style={styles.viewerAvatarLetter}>
                            {viewer.avatarLetter}
                          </Text>
                        </View>

                        {/* Nom & Temps */}
                        <View>
                          <Text style={styles.viewerName}>{viewer.name}</Text>
                          <View style={styles.viewerTimeRow}>
                            <Clock size={11} color="#8C8A87" />
                            <Text style={styles.viewerTimeText}>{viewer.viewedAt}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Indicateur de Like */}
                      {viewer.hasLiked && (
                        <View style={styles.viewerLikedBadge}>
                          <Heart size={13} color="#FF532A" fill="#FF532A" />
                          <Text style={styles.viewerLikedText}>Aimé</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  blurredBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  backdropDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 1,
  },
  storyCenterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  storyFrame43: {
    overflow: 'hidden',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storyImage43: {
    width: '100%',
    height: '100%',
  },
  floatingHeartCenter: {
    position: 'absolute',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 6,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 6,
  },
  touchZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 10,
  },
  touchLeft: {
    flex: 1,
    height: '100%',
  },
  touchRight: {
    flex: 2,
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  progressBarsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  storySubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 20,
  },
  recipeLinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 83, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  recipeLinkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  storyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  storyCaption: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ownStoryFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ownStoryViewsPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
  },
  viewsPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewsPillText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  viewsDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  viewsLikesCount: {
    color: '#FF532A',
    fontSize: 13,
    fontWeight: '800',
  },
  otherStoryFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
  },
  reactBtnLiked: {
    backgroundColor: 'rgba(255, 83, 42, 0.25)',
    borderColor: AppColors.primary,
  },
  reactText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  // Bottom Sheet des spectateurs
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetDimmer: {
    flex: 1,
  },
  viewsSheetContainer: {
    backgroundColor: '#1C1917',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#2E2A27',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#57534E',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  sheetSubtitle: {
    color: '#A8A29E',
    fontSize: 12,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#292524',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  sheetTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#292524',
  },
  sheetTabBtnActive: {
    backgroundColor: '#44403C',
  },
  sheetTabText: {
    color: '#8C8A87',
    fontSize: 12,
    fontWeight: '700',
  },
  sheetTabTextActive: {
    color: '#FFFFFF',
  },
  viewersScrollView: {
    maxHeight: 320,
  },
  viewerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2E2A27',
  },
  viewerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF532A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  viewerName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  viewerTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  viewerTimeText: {
    color: '#8C8A87',
    fontSize: 11,
  },
  viewerLikedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 83, 42, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
    viewerLikedText: {
    color: '#FF532A',
    fontSize: 11,
    fontWeight: '800',
  },
  storyViewerOverlayItem: {
    position: 'absolute',
    zIndex: 25,
  },
  viewerStickerBubble: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  viewerEmojiStickerBubble: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  viewerStickerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  viewerEmojiStickerText: {
    fontSize: 48,
  },
  viewerTextBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewerTextBoxWithBg: {
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  viewerTextRender: {
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 28,
  },
  attachedRecipeBadgeViewer: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 83, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: '85%',
    zIndex: 25,
  },
  attachedRecipeBadgeTitleViewer: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
