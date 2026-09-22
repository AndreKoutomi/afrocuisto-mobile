import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Send,
  Type,
  Smile,
  CookingPot,
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Palette,
  Sparkles,
  Check,
  ChevronRight,
  Flame,
  Search,
  Trash2,
  Image as ImageIcon,
  Plus,
} from 'lucide-react-native';
import { CommunityStory, PlacedStorySticker, PlacedStoryText } from '../../types/community';
import { Recipe } from '../../types/recipe';
import { DraggableStoryElement } from './DraggableStoryElement';
import { useRecipes } from '../../context/RecipeContext';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';

export interface StoryPhotoItem {
  id: string;
  name: string;
  img: string;
  tag: string;
  isDevicePhoto?: boolean;
}

// Presets de photos culinaires haute qualité pour le créateur de story
const STORY_PHOTO_PRESETS: StoryPhotoItem[] = [
  { id: 'amiwo', name: 'Amiwô Poulet', img: 'amiwo_poulet_1772192535717.png', tag: 'Amiwô' },
  { id: 'atassi', name: 'Atassi Terroir', img: 'atassi_1772192610097.png', tag: 'Atassi' },
  { id: 'agoun', name: 'Agoun Igname', img: 'agoun_igname_1772192553037.png', tag: 'Agoun' },
  { id: 'gboman', name: 'Sauce Gboman', img: 'gboman_1772192977053.png', tag: 'Gboman' },
  { id: 'gombo', name: 'Sauce Gombo', img: 'fevi_gombo_1772193101830.png', tag: 'Gombo' },
  { id: 'ablo', name: 'Ablo & Piment', img: 'ablo_1772192776472.png', tag: 'Ablo' },
  { id: 'goussi', name: 'Sauce Egoussi', img: 'goussi_1772194027152.png', tag: 'Goussi' },
  { id: 'couscous', name: 'Couscous Royal', img: 'couscous_poulet.png', tag: 'Couscous' },
  { id: 'gingembre', name: 'Jus de Gingembre', img: 'jus-de-gingembre.jpg', tag: 'Boissons' },
  { id: 'degue', name: 'Dèguè Gourmand', img: 'degue.jpg', tag: 'Desserts' },
];

// Palettes de fonds pour le mode "Statut Texte WhatsApp"
const TEXT_STATUS_GRADIENTS: { name: string; colors: [string, string] }[] = [
  { name: 'Emerald WhatsApp', colors: ['#005C4B', '#025144'] },
  { name: 'Afro Spicy', colors: ['#FB5607', '#E04800'] },
  { name: 'Royal Terroir', colors: ['#7C2D12', '#431407'] },
  { name: 'Deep Purple', colors: ['#4C1D95', '#2E1065'] },
  { name: 'Midnight Blue', colors: ['#1E3A8A', '#0F172A'] },
  { name: 'Sunny Gold', colors: ['#D97706', '#B45309'] },
  { name: 'Tropical Green', colors: ['#047857', '#064E3B'] },
  { name: 'Ruby Hot', colors: ['#BE123C', '#881337'] },
];

// Stickers culinaires & terroir
const STICKERS_CATEGORIES = [
  {
    title: '🔥 Spécialités & Moments',
    stickers: [
      '🔥 En direct des fourneaux',
      '🧑‍🍳 Secret de Chef',
      '🌶️ Piment Doux',
      '🌶️🌶️ 100% Piquant !',
      '🍲 Fait Maison avec Amour',
      '✨ 100% Terroir',
      '😋 Un délice absolu !',
      '👑 Recette d’Or',
      '🍌 Alloco Chaud',
      '🍗 Poulet Braisé Doré',
    ],
  },
  {
    title: '📍 Pays & Villes d’Afrique',
    stickers: [
      '📍 Cotonou, Bénin 🇧🇯',
      '📍 Abidjan, Côte d’Ivoire 🇨🇮',
      '📍 Dakar, Sénégal 🇸🇳',
      '📍 Lomé, Togo 🇹🇬',
      '📍 Douala, Cameroun 🇨🇲',
      '📍 Bamako, Mali 🇲🇱',
      '📍 Libreville, Gabon 🇬🇦',
      '📍 Brazzaville, Congo 🇨🇬',
    ],
  },
  {
    title: 'Émojis Gourmands',
    stickers: ['🥘', '🍲', '🍗', '🌶️', '🍌', '🧅', '🧄', '🥗', '🍹', '🥥', '🥜', '🏆', '👑', '✨', '🤤', '😋', '🧑‍🍳', '🔥'],
  },
];

const TEXT_COLORS = ['#FFFFFF', '#FFE600', '#FB5607', '#22C55E', '#38BDF8', '#EC4899', '#A855F7', '#000000'];

const FONT_STYLES = [
  { id: 'modern', label: 'Moderne', fontWeight: '800' as const, fontStyle: 'normal' as const },
  { id: 'serif', label: 'Élégant', fontWeight: '600' as const, fontStyle: 'italic' as const },
  { id: 'bold', label: 'Impact', fontWeight: '900' as const, fontStyle: 'normal' as const },
];

interface PlacedSticker {
  id: string;
  content: string;
  x: number;
  y: number;
  isEmoji?: boolean;
}

interface WhatsAppStoryCreatorProps {
  visible: boolean;
  onClose: () => void;
  onPublishStory: (newStory: CommunityStory) => void;
}

export const WhatsAppStoryCreator: React.FC<WhatsAppStoryCreatorProps> = ({
  visible,
  onClose,
  onPublishStory,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { recipes } = useRecipes();
  const { isDark } = useTheme();

  // Mode principal : 'media' (photo/galerie) ou 'text' (statut texte WhatsApp)
  const [mode, setMode] = useState<'media' | 'text'>('media');

  // État Media
  const [photosList, setPhotosList] = useState<StoryPhotoItem[]>(STORY_PHOTO_PRESETS);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('auto');
  const [isFrontCamera, setIsFrontCamera] = useState(false);

  // État Texte sur Photo (Overlay WhatsApp Text)
  const [overlayText, setOverlayText] = useState('');
  const [overlayTextPosition, setOverlayTextPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isEditingOverlayText, setIsEditingOverlayText] = useState(false);
  const [overlayTextColor, setOverlayTextColor] = useState('#FFFFFF');
  const [overlayTextBg, setOverlayTextBg] = useState(true);
  const [overlayFontIndex, setOverlayFontIndex] = useState(0);

  // État Statut Texte (Mode plein écran avec fond)
  const [textStatusContent, setTextStatusContent] = useState('');
  const [gradientIndex, setGradientIndex] = useState(0);
  const [textStatusFontIndex, setTextStatusFontIndex] = useState(0);

  // Stickers placés sur l'image (positions X, Y en pourcentage de 0 à 100)
  const [placedStickers, setPlacedStickers] = useState<PlacedStorySticker[]>([]);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);

  // Recette liée à la Story
  const [attachedRecipe, setAttachedRecipe] = useState<Recipe | null>(null);
  const [isRecipePickerOpen, setIsRecipePickerOpen] = useState(false);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');

  // Légende & Publication
  const [caption, setCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Animation Shutter flash
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Gestion dynamique de l'élévation du clavier pour la légende
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const keyboardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      setIsKeyboardVisible(true);
      Animated.timing(keyboardAnim, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 180,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, e => {
      setIsKeyboardVisible(false);
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e?.duration || 250 : 180,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardAnim]);

  // Accès stockage photos de l'appareil (via Permission & Auto-crop 4:3)
  const handlePickFromDeviceGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Accès aux photos requis',
          'Veuillez autoriser l’accès à votre galerie pour ajouter vos créations culinaires à vos Stories AfroCuisto.',
          [{ text: 'Compris' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3], // Cadrage automatique 4:3
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newPhotoItem: StoryPhotoItem = {
          id: `device_photo_${Date.now()}`,
          name: 'Votre Réalisation',
          img: asset.uri,
          tag: 'Galerie',
          isDevicePhoto: true,
        };

        setPhotosList(prev => [newPhotoItem, ...prev]);
        setSelectedPhotoIndex(0);
        setMode('media');
        triggerShutterFlash();
      }
    } catch (err) {
      console.log('Error selecting device photo:', err);
      Alert.alert('Erreur', 'Impossible de charger la photo depuis votre appareil.');
    }
  };

  // Prise de photo directe avec la caméra du téléphone (via Permission & Auto-crop 4:3)
  const handleTakePhotoWithCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Accès caméra requis',
          'Veuillez autoriser l’accès à la caméra pour photographier vos plats et les ajouter directement à vos Stories AfroCuisto.',
          [{ text: 'Compris' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3], // Cadrage automatique 4:3
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newPhotoItem: StoryPhotoItem = {
          id: `camera_photo_${Date.now()}`,
          name: 'Photo Instantanée',
          img: asset.uri,
          tag: 'Caméra',
          isDevicePhoto: true,
        };

        setPhotosList(prev => [newPhotoItem, ...prev]);
        setSelectedPhotoIndex(0);
        setMode('media');
        triggerShutterFlash();
      }
    } catch (err) {
      console.log('Error launching camera:', err);
      Alert.alert('Erreur', 'Impossible d’ouvrir la caméra sur votre appareil.');
    }
  };

  // Réinitialisation lors de l'ouverture
  const handleResetState = useCallback(() => {
    setMode('media');
    setSelectedPhotoIndex(0);
    setOverlayText('');
    setOverlayTextPosition({ x: 50, y: 50 });
    setIsEditingOverlayText(false);
    setTextStatusContent('');
    setPlacedStickers([]);
    setAttachedRecipe(null);
    setCaption('');
    setIsStickerDrawerOpen(false);
    setIsRecipePickerOpen(false);
    setIsPublishing(false);
  }, []);

  const triggerShutterFlash = () => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleAddSticker = (stickerContent: string) => {
    const isEmoji = stickerContent.length <= 4 && !stickerContent.includes(' ');
    const newSticker: PlacedStorySticker = {
      id: `stk_${Date.now()}_${Math.random()}`,
      content: stickerContent,
      x: 35 + Math.random() * 30,
      y: 30 + Math.random() * 30,
      isEmoji,
    };
    setPlacedStickers(prev => [...prev, newSticker]);
    setIsStickerDrawerOpen(false);
  };

  const handleRemoveSticker = (id: string) => {
    setPlacedStickers(prev => prev.filter(s => s.id !== id));
  };

  const handlePublish = () => {
    if (mode === 'text' && !textStatusContent.trim()) {
      Alert.alert('Statut vide', 'Veuillez saisir du texte pour votre story.');
      return;
    }

    setIsPublishing(true);

    const activePhoto = photosList[selectedPhotoIndex] || photosList[0];
    const currentGradient = TEXT_STATUS_GRADIENTS[gradientIndex];

    const titleText =
      mode === 'text'
        ? textStatusContent.trim().split('\n')[0].slice(0, 45)
        : overlayText.trim()
        ? overlayText.trim()
        : attachedRecipe
        ? `Instant : ${attachedRecipe.name}`
        : `${activePhoto.name} 🌶️`;

    const fullCaption =
      caption.trim() ||
      (mode === 'text' ? textStatusContent.trim() : `Partage en direct d’AfroCuisto ✨`);

    const newStory: CommunityStory = {
      id: `story_user_${Date.now()}`,
      authorName: 'Vous',
      authorAvatar: null,
      title: titleText,
      caption: fullCaption,
      imageUrl: mode === 'text' ? activePhoto.img : activePhoto.img,
      videoBadge: false,
      isLive: false,
      isViewed: false,
      duration: 6,
      recipeId: attachedRecipe?.id,
      recipeName: attachedRecipe?.name,
      viewsCount: 1,
      likesCount: 0,
      placedStickers: mode === 'media' && placedStickers.length > 0 ? placedStickers : undefined,
      placedText:
        mode === 'media' && overlayText.trim().length > 0
          ? {
              id: `text_${Date.now()}`,
              text: overlayText.trim(),
              textColor: overlayTextColor,
              textBg: overlayTextBg,
              fontIndex: overlayFontIndex,
              x: overlayTextPosition.x,
              y: overlayTextPosition.y,
            }
          : null,
    };

    setTimeout(() => {
      onPublishStory(newStory);
      setIsPublishing(false);
      handleResetState();
      onClose();
    }, 450);
  };

  const activePhoto = photosList[selectedPhotoIndex] || photosList[0];
  const currentGradient = TEXT_STATUS_GRADIENTS[gradientIndex].colors;
  const currentFont = FONT_STYLES[mode === 'text' ? textStatusFontIndex : overlayFontIndex];

  const filteredRecipes = recipes.filter(r =>
    r.name.toLowerCase().includes(recipeSearchQuery.trim().toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        handleResetState();
        onClose();
      }}
      statusBarTranslucent
    >
      <View style={styles.fullscreenContainer}>
        {/* Flash Effect on shutter */}
        <Animated.View
          pointerEvents="none"
          style={[styles.shutterFlash, { opacity: flashAnim }]}
        />

        {/* 1. Zone Centrale : Canvas Photo ou Fond Statut Texte */}
        {mode === 'media' ? (
          <View style={styles.canvasContainer}>
            {/* Arrière-plan flouté d'ambiance avec tap pour fermer le clavier */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={StyleSheet.absoluteFillObject}>
                <Image
                  source={getImageSource(activePhoto.img)}
                  style={[
                    styles.blurredBackdrop,
                    {
                      width: screenWidth,
                      height: screenHeight,
                    },
                  ]}
                  blurRadius={30}
                  resizeMode="cover"
                />
                <View style={styles.backdropDimmer} />
              </View>
            </TouchableWithoutFeedback>

            {/* Cadre de l'image de Story imposé au Ratio 4:3 avec Auto-Crop */}
            <View style={styles.storyCenterContainer}>
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
                  source={getImageSource(activePhoto.img)}
                  style={[
                    styles.storyCanvasImage43,
                    {
                      transform: [{ scaleX: isFrontCamera ? -1 : 1 }],
                    },
                  ]}
                  resizeMode="cover"
                />

                {/* Badge Ratio 4:3 Auto-Crop */}
                <View style={styles.ratioIndicatorBadge}>
                  <Text style={styles.ratioIndicatorText}>4:3 Auto-Crop</Text>
                </View>

                {/* Overlays / Stickers positionnables par glisser-déposer */}
                {placedStickers.map(stk => (
                  <DraggableStoryElement
                    key={stk.id}
                    initialX={stk.x}
                    initialY={stk.y}
                    containerWidth={screenWidth}
                    containerHeight={(screenWidth * 3) / 4}
                    onPositionChange={(newX, newY) => {
                      setPlacedStickers(prev =>
                        prev.map(item =>
                          item.id === stk.id ? { ...item, x: newX, y: newY } : item
                        )
                      );
                    }}
                    onLongPress={() => handleRemoveSticker(stk.id)}
                  >
                    <View
                      style={[
                        styles.stickerBubble,
                        stk.isEmoji && styles.emojiStickerBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stickerText,
                          stk.isEmoji && styles.emojiStickerText,
                        ]}
                      >
                        {stk.content}
                      </Text>
                    </View>
                  </DraggableStoryElement>
                ))}

                {/* Sticker Recette Liée si attachée */}
                {attachedRecipe && (
                  <View style={styles.attachedRecipeBadgeCanvas}>
                    <CookingPot size={18} color="#FFFFFF" strokeWidth={2.4} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.attachedRecipeBadgeTitle} numberOfLines={1}>
                        {attachedRecipe.name}
                      </Text>
                      <Text style={styles.attachedRecipeBadgeSubtitle}>
                        Recette AfroCuisto rattachée
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setAttachedRecipe(null)}
                      style={styles.removeRecipeBtn}
                    >
                      <X size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Overlay Texte utilisateur positionnable par glisser-déposer */}
                {overlayText.trim().length > 0 && !isEditingOverlayText ? (
                  <DraggableStoryElement
                    initialX={overlayTextPosition.x}
                    initialY={overlayTextPosition.y}
                    containerWidth={screenWidth}
                    containerHeight={(screenWidth * 3) / 4}
                    onPositionChange={(newX, newY) => {
                      setOverlayTextPosition({ x: newX, y: newY });
                    }}
                    onTap={() => setIsEditingOverlayText(true)}
                  >
                    <View
                      style={[
                        styles.overlayTextBox,
                        overlayTextBg && styles.overlayTextBoxWithBg,
                      ]}
                    >
                      <Text
                        style={[
                          styles.overlayTextRender,
                          {
                            color: overlayTextColor,
                            fontWeight: currentFont.fontWeight,
                            fontStyle: currentFont.fontStyle,
                          },
                        ]}
                      >
                        {overlayText}
                      </Text>
                    </View>
                  </DraggableStoryElement>
                ) : null}
              </View>
            </View>

            {/* Dégradés d'ombrage pour lisibilité WhatsApp */}
            <LinearGradient
              colors={['rgba(0,0,0,0.65)', 'transparent']}
              style={styles.topGradient}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.bottomGradient}
              pointerEvents="none"
            />
          </View>
        ) : (
          /* Mode Statut Texte WhatsApp */
          <LinearGradient
            colors={currentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.textStatusCanvas, { width: screenWidth, height: screenHeight }]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.textStatusContent}
            >
              <TextInput
                value={textStatusContent}
                onChangeText={setTextStatusContent}
                placeholder="Tapez votre statut ou astuce du jour..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                multiline
                maxLength={240}
                style={[
                  styles.textStatusInput,
                  {
                    fontWeight: currentFont.fontWeight,
                    fontStyle: currentFont.fontStyle,
                  },
                ]}
                autoFocus
              />
            </KeyboardAvoidingView>
          </LinearGradient>
        )}

        {/* 2. Top WhatsApp Navigation & Tools Bar (Harmonieux et aéré) */}
        <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 14) }]}>
          {/* Bouton Fermer */}
          <TouchableOpacity
            style={styles.circleIconButton}
            activeOpacity={0.8}
            onPress={() => {
              handleResetState();
              onClose();
            }}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Sélecteur de Mode Photo / Texte (Pill capsule centrale) */}
          <View style={styles.modeToggleGroup}>
            <TouchableOpacity
              style={[
                styles.modeToggleBtn,
                mode === 'media' && styles.modeToggleBtnActive,
              ]}
              onPress={() => setMode('media')}
            >
              <Camera size={13} color={mode === 'media' ? '#FFFFFF' : 'rgba(255,255,255,0.7)'} />
              <Text
                style={[
                  styles.modeToggleText,
                  mode === 'media' && styles.modeToggleTextActive,
                ]}
              >
                Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeToggleBtn,
                mode === 'text' && styles.modeToggleBtnActive,
              ]}
              onPress={() => setMode('text')}
            >
              <Type size={13} color={mode === 'text' ? '#FFFFFF' : 'rgba(255,255,255,0.7)'} />
              <Text
                style={[
                  styles.modeToggleText,
                  mode === 'text' && styles.modeToggleTextActive,
                ]}
              >
                Texte
              </Text>
            </TouchableOpacity>
          </View>

          {/* Outils WhatsApp (Haut Droite - Épuré et accessible) */}
          <View style={styles.topToolsRow}>
            {mode === 'media' ? (
              <>
                {/* Importer depuis la Galerie */}
                <TouchableOpacity
                  style={styles.circleIconButton}
                  activeOpacity={0.8}
                  onPress={handlePickFromDeviceGallery}
                  accessibilityLabel="Importer une photo depuis l'appareil"
                >
                  <ImageIcon size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Stickers & Emojis */}
                <TouchableOpacity
                  style={[
                    styles.circleIconButton,
                    isStickerDrawerOpen && styles.circleIconButtonActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setIsStickerDrawerOpen(true)}
                  accessibilityLabel="Ajouter des stickers"
                >
                  <Smile size={19} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Texte T sur photo */}
                <TouchableOpacity
                  style={[
                    styles.circleIconButton,
                    overlayText.trim().length > 0 && styles.circleIconButtonActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setIsEditingOverlayText(true)}
                  accessibilityLabel="Ajouter du texte"
                >
                  <Type size={19} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Palette de fond en mode Texte */}
                <TouchableOpacity
                  style={styles.circleIconButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    setGradientIndex(prev => (prev + 1) % TEXT_STATUS_GRADIENTS.length)
                  }
                >
                  <Palette size={19} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Style de police en mode Texte */}
                <TouchableOpacity
                  style={styles.circleIconButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    setTextStatusFontIndex(prev => (prev + 1) % FONT_STYLES.length)
                  }
                >
                  <Type size={19} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* 3. Barre Latérale Droite Harmonisée (Recette / Flash / Flip Caméra) */}
        {mode === 'media' && (
          <View style={[styles.rightToolsSidebar, { top: insets.top + (Platform.OS === 'ios' ? 60 : 66) }]}>
            {/* Lier une recette */}
            <TouchableOpacity
              style={[
                styles.sidebarToolBtn,
                attachedRecipe && styles.sidebarToolBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setIsRecipePickerOpen(true)}
              accessibilityLabel="Lier une recette"
            >
              <CookingPot size={19} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>

            {/* Contrôle du Flash */}
            <TouchableOpacity
              style={styles.sidebarToolBtn}
              activeOpacity={0.8}
              onPress={() => {
                setFlashMode(prev =>
                  prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'
                );
                triggerShutterFlash();
              }}
              accessibilityLabel="Contrôle du flash"
            >
              {flashMode === 'off' ? (
                <ZapOff size={19} color="#FFFFFF" />
              ) : (
                <Zap size={19} color={flashMode === 'on' ? '#FFE600' : '#FFFFFF'} />
              )}
            </TouchableOpacity>

            {/* Flip Caméra */}
            <TouchableOpacity
              style={styles.sidebarToolBtn}
              activeOpacity={0.8}
              onPress={() => {
                setIsFrontCamera(prev => !prev);
                triggerShutterFlash();
              }}
              accessibilityLabel="Retourner la caméra"
            >
              <RefreshCw size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* 4. Barre Inférieure WhatsApp (Galerie Rapide + Légende + Bouton Send Vert - Élevée au dessus du clavier) */}
        <Animated.View
          style={[
            styles.bottomBar,
            {
              bottom: keyboardAnim,
              paddingBottom: isKeyboardVisible
                ? (Platform.OS === 'ios' ? 10 : 12)
                : insets.bottom + (Platform.OS === 'ios' ? 12 : 16),
            },
          ]}
        >
          {/* Galerie de sélection rapide de photos culinaires + Accès appareil (masquée si clavier actif pour préserver la vue) */}
          {mode === 'media' && !isKeyboardVisible && (
            <View style={styles.galleryStripWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScrollContent}
              >
                {/* Bouton de Prise Directe Caméra */}
                <TouchableOpacity
                  style={styles.deviceCameraPickerTile}
                  activeOpacity={0.8}
                  onPress={handleTakePhotoWithCamera}
                >
                  <View style={styles.deviceCameraIconCircle}>
                    <Camera size={18} color="#FFFFFF" strokeWidth={2.2} />
                    <View style={styles.deviceCameraPlusMini}>
                      <Plus size={10} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  </View>
                  <Text style={styles.deviceCameraText}>Caméra</Text>
                </TouchableOpacity>

                {/* Bouton d'importation depuis la galerie appareil */}
                <TouchableOpacity
                  style={styles.deviceGalleryPickerTile}
                  activeOpacity={0.8}
                  onPress={handlePickFromDeviceGallery}
                >
                  <View style={styles.deviceGalleryIconCircle}>
                    <ImageIcon size={18} color="#FFFFFF" strokeWidth={2.2} />
                    <View style={styles.deviceGalleryPlusMini}>
                      <Plus size={10} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  </View>
                  <Text style={styles.deviceGalleryText}>Galerie</Text>
                </TouchableOpacity>

                {/* Liste des photos utilisateur et presets */}
                {photosList.map((item, idx) => {
                  const isSelected = selectedPhotoIndex === idx;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.galleryThumbItem,
                        isSelected && styles.galleryThumbItemSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedPhotoIndex(idx);
                        triggerShutterFlash();
                      }}
                    >
                      <Image
                        source={getImageSource(item.img)}
                        style={styles.galleryThumbImage}
                      />
                      {item.isDevicePhoto && (
                        <View style={styles.devicePhotoTag}>
                          <Text style={styles.devicePhotoTagText}>PERSO</Text>
                        </View>
                      )}
                      {isSelected && (
                        <View style={styles.selectedThumbCheck}>
                          <Check size={10} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Ligne d'audience WhatsApp ("Mon Statut") - masquée si clavier actif */}
          {!isKeyboardVisible && (
            <View style={styles.audienceRow}>
              <View style={styles.audiencePill}>
                <View style={styles.audienceGreenDot} />
                <Text style={styles.audienceText}>
                  Statut (Tout AfroCuisto • 24h)
                </Text>
              </View>
            </View>
          )}

          {/* Zone de saisie de légende + Bouton d'envoi WhatsApp */}
          <View style={styles.captionActionRow}>
            <View style={styles.captionInputContainer}>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Ajouter une légende..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={styles.captionInput}
                maxLength={120}
              />
            </View>

            {/* Bouton Envoyer Statut WhatsApp Vert / Emerald */}
            <TouchableOpacity
              style={[
                styles.whatsappSendFab,
                isPublishing && styles.whatsappSendFabLoading,
              ]}
              activeOpacity={0.85}
              onPress={handlePublish}
              disabled={isPublishing}
            >
              <Send size={22} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 5. Modal d'édition du texte Superposé (Overlay Text Editor) */}
        {isEditingOverlayText && (
          <Modal visible={isEditingOverlayText} transparent animationType="fade">
            <View style={styles.overlayTextEditorModal}>
              <View
                style={[
                  styles.overlayTextEditorHeader,
                  { paddingTop: insets.top + 10 },
                ]}
              >
                <TouchableOpacity
                  style={styles.overlayEditorDoneBtn}
                  onPress={() => setIsEditingOverlayText(false)}
                >
                  <Text style={styles.overlayEditorDoneText}>Terminé</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.overlayEditorCenter}>
                <TextInput
                  value={overlayText}
                  onChangeText={setOverlayText}
                  placeholder="Tapez votre texte..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  style={[
                    styles.overlayEditorInput,
                    {
                      color: overlayTextColor,
                      fontWeight: currentFont.fontWeight,
                      fontStyle: currentFont.fontStyle,
                    },
                    overlayTextBg && { backgroundColor: 'rgba(0,0,0,0.65)' },
                  ]}
                  multiline
                  autoFocus
                />
              </View>

              {/* Barre de couleurs & options */}
              <View style={[styles.overlayEditorBottomTools, { paddingBottom: insets.bottom + 20 }]}>
                {/* Toggle fond de texte */}
                <TouchableOpacity
                  style={[
                    styles.overlayToolToggle,
                    overlayTextBg && { backgroundColor: AppColors.primary },
                  ]}
                  onPress={() => setOverlayTextBg(prev => !prev)}
                >
                  <Text style={styles.overlayToolToggleText}>Fond</Text>
                </TouchableOpacity>

                {/* Toggle Police */}
                <TouchableOpacity
                  style={styles.overlayToolToggle}
                  onPress={() =>
                    setOverlayFontIndex(prev => (prev + 1) % FONT_STYLES.length)
                  }
                >
                  <Text style={styles.overlayToolToggleText}>
                    {FONT_STYLES[overlayFontIndex].label}
                  </Text>
                </TouchableOpacity>

                {/* Palette de couleurs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.colorPaletteRow}>
                    {TEXT_COLORS.map(c => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c },
                          overlayTextColor === c && styles.colorCircleSelected,
                        ]}
                        onPress={() => setOverlayTextColor(c)}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* 6. Tiroir de Stickers & Emojis */}
        {isStickerDrawerOpen && (
          <Modal
            visible={isStickerDrawerOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setIsStickerDrawerOpen(false)}
          >
            <View style={styles.drawerBackdrop}>
              <TouchableOpacity
                style={styles.drawerDismissZone}
                activeOpacity={1}
                onPress={() => setIsStickerDrawerOpen(false)}
              />
              <View style={[styles.drawerSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <View style={styles.drawerHandleBar} />
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Stickers & Émojis Culinaires</Text>
                  <TouchableOpacity onPress={() => setIsStickerDrawerOpen(false)}>
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.drawerScroll}
                  contentContainerStyle={styles.drawerScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {STICKERS_CATEGORIES.map((cat, idx) => (
                    <View key={idx} style={styles.stickerCatSection}>
                      <Text style={styles.stickerCatTitle}>{cat.title}</Text>
                      <View style={styles.stickersGrid}>
                        {cat.stickers.map((stk, sIdx) => (
                          <TouchableOpacity
                            key={sIdx}
                            style={styles.stickerChip}
                            activeOpacity={0.8}
                            onPress={() => handleAddSticker(stk)}
                          >
                            <Text style={styles.stickerChipText}>{stk}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* 7. Modal pour lier une recette d'AfroCuisto */}
        {isRecipePickerOpen && (
          <Modal
            visible={isRecipePickerOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setIsRecipePickerOpen(false)}
          >
            <View style={styles.drawerBackdrop}>
              <TouchableOpacity
                style={styles.drawerDismissZone}
                activeOpacity={1}
                onPress={() => setIsRecipePickerOpen(false)}
              />
              <View style={[styles.drawerSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <View style={styles.drawerHandleBar} />
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Lier une Recette à la Story</Text>
                  <TouchableOpacity onPress={() => setIsRecipePickerOpen(false)}>
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Recherche de Recette */}
                <View style={styles.recipeSearchWrap}>
                  <Search size={16} color="rgba(255,255,255,0.6)" />
                  <TextInput
                    value={recipeSearchQuery}
                    onChangeText={setRecipeSearchQuery}
                    placeholder="Rechercher une recette à lier..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    style={styles.recipeSearchInput}
                  />
                </View>

                <ScrollView
                  style={styles.recipeListScroll}
                  contentContainerStyle={styles.recipeListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredRecipes.map(recipe => (
                    <TouchableOpacity
                      key={recipe.id}
                      style={styles.recipeItemRow}
                      activeOpacity={0.8}
                      onPress={() => {
                        setAttachedRecipe(recipe);
                        setIsRecipePickerOpen(false);
                      }}
                    >
                      <Image
                        source={getImageSource(recipe.image)}
                        style={styles.recipeItemThumb}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recipeItemName}>{recipe.name}</Text>
                        <Text style={styles.recipeItemMeta}>
                          {recipe.region || 'Terroir'} • {recipe.cookTime || '25 min'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
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
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  shutterFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
  },
  canvasContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  blurredBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backdropDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  storyCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  storyFrame43: {
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderRadius: 8,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  storyCanvasImage43: {
    width: '100%',
    height: '100%',
  },
  ratioIndicatorBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 5,
  },
  ratioIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  placedOverlayTextContainer: {
    position: 'absolute',
    top: '38%',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 15,
  },
  overlayTextBoxWithBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  storyCanvasImage: {
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  textStatusCanvas: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  textStatusContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStatusInput: {
    color: '#FFFFFF',
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 36,
    width: '100%',
    padding: 10,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 50,
  },
  circleIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIconButtonActive: {
    backgroundColor: AppColors.primary,
  },
  modeToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 3,
    gap: 4,
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  modeToggleBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  modeToggleText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
  },
  topToolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightToolsSidebar: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    gap: 12,
    zIndex: 45,
  },
  sidebarToolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarToolBtnActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 50,
  },
  galleryStripWrapper: {
    marginBottom: 10,
  },
  galleryScrollContent: {
    gap: 8,
  },
  deviceCameraPickerTile: {
    width: 60,
    height: 52,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderWidth: 1.5,
    borderColor: '#22C55E',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginRight: 2,
  },
  deviceCameraIconCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceCameraPlusMini: {
    position: 'absolute',
    bottom: -3,
    right: -5,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceCameraText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  deviceGalleryPickerTile: {
    width: 60,
    height: 52,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 83, 42, 0.18)',
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginRight: 2,
  },
  deviceGalleryIconCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceGalleryPlusMini: {
    position: 'absolute',
    bottom: -3,
    right: -5,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceGalleryText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  devicePhotoTag: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  devicePhotoTagText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
  },
  galleryThumbItem: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  galleryThumbItemSelected: {
    borderColor: '#25D366',
    transform: [{ scale: 1.05 }],
  },
  galleryThumbImage: {
    width: '100%',
    height: '100%',
  },
  selectedThumbCheck: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audienceRow: {
    marginBottom: 8,
  },
  audiencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  audienceGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#25D366',
  },
  audienceText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  captionActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  captionInputContainer: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  captionInput: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  whatsappSendFab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00A884', // WhatsApp green signature
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00A884',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  whatsappSendFabLoading: {
    opacity: 0.7,
  },
  placedStickerWrap: {
    position: 'absolute',
    zIndex: 30,
  },
  stickerBubble: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emojiStickerBubble: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  stickerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emojiStickerText: {
    fontSize: 48,
  },
  attachedRecipeBadgeCanvas: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 35,
  },
  attachedRecipeBadgeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  attachedRecipeBadgeSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  removeRecipeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTextContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 30,
    maxWidth: '85%',
  },
  overlayTextBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  overlayTextRender: {
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 28,
  },
  overlayTextEditorModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'space-between',
  },
  overlayTextEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  overlayEditorDoneBtn: {
    backgroundColor: '#00A884',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  overlayEditorDoneText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  overlayEditorCenter: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayEditorInput: {
    fontSize: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    width: '100%',
  },
  overlayEditorBottomTools: {
    paddingHorizontal: 20,
    gap: 14,
  },
  overlayToolToggle: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  overlayToolToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.2 }],
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  drawerDismissZone: {
    flex: 1,
  },
  drawerSheet: {
    backgroundColor: '#1E1D1B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#2E2A27',
  },
  drawerHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  drawerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  drawerScroll: {
    flexShrink: 1,
  },
  drawerScrollContent: {
    paddingBottom: 16,
  },
  stickerCatSection: {
    marginBottom: 18,
  },
  stickerCatTitle: {
    color: '#A8A29E',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  stickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stickerChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  stickerChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  recipeSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2A2724',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 14,
  },
  recipeSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  recipeListScroll: {
    flexShrink: 1,
  },
  recipeListContent: {
    paddingBottom: 16,
  },
  recipeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  recipeItemThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  recipeItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  recipeItemMeta: {
    color: '#8C8A87',
    fontSize: 11.5,
    marginTop: 2,
  },
});
