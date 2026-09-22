import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Camera,
  Image as ImageIcon,
  CookingPot,
  Sparkles,
  ChevronLeft,
  ChevronDown,
  Globe,
  Smile,
  MapPin,
  Palette,
  Hash,
  HelpCircle,
  Lightbulb,
  Check,
  Search,
  Trash2,
  Plus,
} from 'lucide-react-native';
import { CommunityPost, PostType } from '../../types/community';
import { Recipe } from '../../types/recipe';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: (newPost: CommunityPost) => void;
}

const POST_TYPES: { type: PostType; label: string; icon: any; color: string }[] = [
  { type: 'realization', label: 'Réalisation', icon: Camera, color: '#EA580C' },
  { type: 'tip', label: 'Astuce de Chef', icon: Lightbulb, color: '#EAB308' },
  { type: 'question', label: 'Question / SOS', icon: HelpCircle, color: '#3B82F6' },
  { type: 'general', label: 'Discussion', icon: Sparkles, color: AppColors.primary },
];

const TERROIR_REGIONS = [
  'Sud-Bénin 🇧🇯',
  'Nord-Bénin 🇧🇯',
  'Côte d’Ivoire 🇨🇮',
  'Sénégal 🇸🇳',
  'Togo 🇹🇬',
  'Cameroun 🇨🇲',
  'Mali 🇲🇱',
  'Guinée 🇬🇳',
  'Afrique Centrale 🇨🇬',
  'Diaspora Africaine 🌍',
];

const CULINARY_FEELINGS = [
  { emoji: '😋', text: 'déguste un festin' },
  { emoji: '👨‍🍳', text: 'aux fourneaux' },
  { emoji: '🔥', text: 'reflète le piment fort' },
  { emoji: '✨', text: 'inspiré par le terroir' },
  { emoji: '🍲', text: 'en pleine préparation' },
  { emoji: '🤤', text: 'impatient de goûter' },
  { emoji: '🥰', text: 'amoureux de la bonne bouffe' },
];

const FACEBOOK_GRADIENTS: [string, string][] = [
  ['#EA580C', '#C2410C'],
  ['#E11D48', '#BE123C'],
  ['#7C3AED', '#6D28D9'],
  ['#059669', '#047857'],
  ['#0284C7', '#0369A1'],
  ['#D97706', '#B45309'],
  ['#1E293B', '#0F172A'],
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostCreated,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { recipes } = useRecipes();

  // Contenu du post
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<PostType>('realization');
  const [selectedRegion, setSelectedRegion] = useState('Sud-Bénin 🇧🇯');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<{ emoji: string; text: string } | null>(null);
  const [selectedGradientIndex, setSelectedGradientIndex] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Modales & Sheets secondaires
  const [activeSheet, setActiveSheet] = useState<'none' | 'types' | 'regions' | 'recipes' | 'feelings'>('none');
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const inputRef = useRef<TextInput>(null);

  if (!visible) return null;

  const handleClose = () => {
    if (content.trim().length > 0 || selectedImage || selectedRecipe) {
      setIsDiscardConfirmOpen(true);
    } else {
      handleResetForm();
      onClose();
    }
  };

  const handleResetForm = () => {
    setContent('');
    setSelectedType('realization');
    setSelectedRegion('Sud-Bénin 🇧🇯');
    setSelectedImage(null);
    setSelectedRecipe(null);
    setSelectedFeeling(null);
    setSelectedGradientIndex(null);
    setTagInput('');
    setActiveSheet('none');
  };

  // Sélection de photo depuis la galerie de l'appareil
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Accès aux photos requis',
          'Veuillez autoriser l’accès à votre galerie pour ajouter une photo à votre publication.',
          [{ text: 'Compris' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setSelectedGradientIndex(null); // Les photos désactivent le fond coloré
      }
    } catch (err) {
      console.log('Error picking post image:', err);
      Alert.alert('Erreur', 'Impossible de charger la photo sélectionnée.');
    }
  };

  const handlePublish = () => {
    if (!content.trim() && !selectedImage && !selectedRecipe) {
      Alert.alert('Publication vide', 'Veuillez saisir du texte ou ajouter une photo.');
      return;
    }

    const authorName = user?.name || 'Chef Gourmet';

    // Composition des tags
    const generatedTags = tagInput
      ? tagInput.split(' ').map(t => t.replace('#', '')).filter(Boolean)
      : [selectedType === 'realization' ? 'FaitMaison' : 'AstuceTerroir'];

    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      authorName,
      authorRole: 'Gourmet Passionné',
      authorCountry: selectedRegion,
      content: content.trim(),
      type: selectedType,
      imageUrl: selectedImage || (selectedRecipe ? selectedRecipe.image : null),
      recipeId: selectedRecipe ? selectedRecipe.id : null,
      recipeName: selectedRecipe ? selectedRecipe.name : null,
      recipeImage: selectedRecipe ? selectedRecipe.image : null,
      region: selectedRecipe?.region || selectedRegion,
      tags: generatedTags,
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: true,
      isBookmarked: false,
      createdAt: 'À l’instant',
      comments: [],
    };

    onPostCreated(newPost);
    handleResetForm();
    onClose();
  };

  const currentTypeObj = POST_TYPES.find(p => p.type === selectedType) || POST_TYPES[0];
  const isPublishEnabled = content.trim().length > 0 || selectedImage !== null || selectedRecipe !== null;
  const isGradientActive = selectedGradientIndex !== null && !selectedImage;

  const filteredRecipes = recipes.filter(r =>
    r.name.toLowerCase().includes(recipeSearchQuery.trim().toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SafeAreaView
        style={[
          styles.safeContainer,
          {
            backgroundColor: isDark ? AppColors.backgroundDark : '#FFFFFF',
          },
        ]}
        edges={['top', 'left', 'right']}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flexOne}
        >
          {/* 1. Header Facebook Style */}
          <View
            style={[
              styles.fbHeader,
              {
                borderBottomColor: isDark ? '#262220' : '#EFECE6',
                backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
              },
            ]}
          >
            <TouchableOpacity
              style={styles.fbHeaderBackBtn}
              activeOpacity={0.8}
              onPress={handleClose}
            >
              <ChevronLeft size={24} color={isDark ? '#FFFFFF' : AppColors.textPrimary} />
            </TouchableOpacity>

            <Text
              style={[
                styles.fbHeaderTitle,
                { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
              ]}
            >
              Créer une publication
            </Text>

            <TouchableOpacity
              style={[
                styles.fbPublishBtn,
                {
                  backgroundColor: isPublishEnabled ? AppColors.primary : isDark ? '#2E2A27' : '#E5E0D8',
                },
              ]}
              disabled={!isPublishEnabled}
              activeOpacity={0.85}
              onPress={handlePublish}
            >
              <Text
                style={[
                  styles.fbPublishBtnText,
                  {
                    color: isPublishEnabled ? '#FFFFFF' : isDark ? '#8C8A87' : '#9E9B97',
                  },
                ]}
              >
                Publier
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. Zone Scrollable Principale */}
          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Profil Utilisateur & Sélecteurs de Pilules Facebook */}
            <View style={styles.authorRow}>
              {/* Avatar avec badge */}
              <View style={styles.avatarWrap}>
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: AppColors.primary },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {(user?.name || 'V').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.avatarOnlineDot} />
              </View>

              {/* Nom & Pilules d'Audience et de Type */}
              <View style={styles.authorPillsColumn}>
                <View style={styles.authorNameRow}>
                  <Text
                    style={[
                      styles.authorNameText,
                      { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                    ]}
                  >
                    {user?.name || 'Vous'}
                  </Text>
                  {selectedFeeling && (
                    <Text
                      style={[
                        styles.feelingMetaText,
                        { color: isDark ? '#A8A29E' : '#78716C' },
                      ]}
                      numberOfLines={1}
                    >
                      est {selectedFeeling.emoji} {selectedFeeling.text}
                    </Text>
                  )}
                </View>

                {/* Pilules de configuration (Audience + Type + Terroir) */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillsScrollRow}
                >
                  {/* Pilule Audience Public */}
                  <View
                    style={[
                      styles.metaPill,
                      {
                        backgroundColor: isDark ? '#262220' : '#F0EFEA',
                        borderColor: isDark ? '#3D3834' : '#E2DFD7',
                      },
                    ]}
                  >
                    <Globe size={11} color={isDark ? '#D6D3CD' : '#57534E'} />
                    <Text
                      style={[
                        styles.metaPillText,
                        { color: isDark ? '#D6D3CD' : '#57534E' },
                      ]}
                    >
                      Public
                    </Text>
                  </View>

                  {/* Pilule Type de publication */}
                  <TouchableOpacity
                    style={[
                      styles.metaPill,
                      styles.metaPillClickable,
                      {
                        backgroundColor: isDark ? '#262220' : '#F0EFEA',
                        borderColor: isDark ? '#3D3834' : '#E2DFD7',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setActiveSheet('types')}
                  >
                    <Text style={{ fontSize: 11 }}>{currentTypeObj.label}</Text>
                    <ChevronDown size={11} color={isDark ? '#D6D3CD' : '#57534E'} />
                  </TouchableOpacity>

                  {/* Pilule Terroir / Région */}
                  <TouchableOpacity
                    style={[
                      styles.metaPill,
                      styles.metaPillClickable,
                      {
                        backgroundColor: isDark ? '#262220' : '#F0EFEA',
                        borderColor: isDark ? '#3D3834' : '#E2DFD7',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setActiveSheet('regions')}
                  >
                    <MapPin size={11} color={AppColors.primary} />
                    <Text
                      style={[
                        styles.metaPillText,
                        { color: isDark ? '#D6D3CD' : '#57534E' },
                      ]}
                    >
                      {selectedRegion}
                    </Text>
                    <ChevronDown size={11} color={isDark ? '#D6D3CD' : '#57534E'} />
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>

            {/* Zone de Texte Facebook (Avec ou sans fond dégradé) */}
            {isGradientActive ? (
              <LinearGradient
                colors={FACEBOOK_GRADIENTS[selectedGradientIndex!]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCanvas}
              >
                <TextInput
                  ref={inputRef}
                  value={content}
                  onChangeText={setContent}
                  placeholder="À quoi pensez-vous, Chef ?"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  multiline
                  style={styles.gradientInput}
                  autoFocus
                />
              </LinearGradient>
            ) : (
              <TextInput
                ref={inputRef}
                value={content}
                onChangeText={setContent}
                placeholder={
                  selectedType === 'realization'
                    ? "Partagez votre plat, vos astuces et vos secrets de cuisson..."
                    : selectedType === 'tip'
                    ? "Quelle est votre astuce culinaire secrète à transmettre ?"
                    : "Posez votre question ou demandez conseil à la communauté..."
                }
                placeholderTextColor={isDark ? '#8C8A87' : '#9E9B97'}
                multiline
                style={[
                  styles.standardInput,
                  {
                    color: isDark ? '#FFFFFF' : '#1E1D1D',
                    fontSize: content.length < 80 ? 17 : 15,
                  },
                ]}
                autoFocus
              />
            )}

            {/* 3. Carte Photo Attachée (Si sélectionnée) */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={getImageSource(selectedImage)}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeMediaBtn}
                  activeOpacity={0.85}
                  onPress={() => setSelectedImage(null)}
                >
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* 4. Carte Recette Attachée (Si liée) */}
            {selectedRecipe && (
              <View
                style={[
                  styles.recipeAttachedCard,
                  {
                    backgroundColor: isDark ? '#1C1917' : '#FFF9F6',
                    borderColor: isDark ? '#2E2A27' : '#FFD9CC',
                  },
                ]}
              >
                <Image
                  source={getImageSource(selectedRecipe.image)}
                  style={styles.recipeAttachedThumb}
                  resizeMode="cover"
                />
                <View style={styles.recipeAttachedMeta}>
                  <View style={styles.recipeTagBadge}>
                    <CookingPot size={11} color={AppColors.primary} />
                    <Text style={styles.recipeTagText}>RECETTE RATTACHÉE</Text>
                  </View>
                  <Text
                    style={[
                      styles.recipeAttachedName,
                      { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedRecipe.name}
                  </Text>
                  <Text style={styles.recipeAttachedSub}>
                    {selectedRecipe.region || 'Terroir Africain'} • {selectedRecipe.prepTime || '30 min'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.removeRecipeBtn}
                  activeOpacity={0.8}
                  onPress={() => setSelectedRecipe(null)}
                >
                  <X size={15} color="#8C8A87" />
                </TouchableOpacity>
              </View>
            )}

            {/* 5. Sélecteur de fonds dégradés (Statuts Facebook) */}
            {!selectedImage && (
              <View style={styles.gradientPickerRow}>
                <TouchableOpacity
                  style={[
                    styles.gradientThumbDefault,
                    selectedGradientIndex === null && styles.gradientThumbSelected,
                    { borderColor: isDark ? '#3D3834' : '#E2DFD7' },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedGradientIndex(null)}
                >
                  <Palette size={14} color={isDark ? '#D6D3CD' : '#57534E'} />
                </TouchableOpacity>

                {FACEBOOK_GRADIENTS.map((colors, idx) => {
                  const isSelected = selectedGradientIndex === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => setSelectedGradientIndex(idx)}
                    >
                      <LinearGradient
                        colors={colors}
                        style={[
                          styles.gradientThumbItem,
                          isSelected && styles.gradientThumbSelected,
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 6. Champ Hashtags */}
            <View
              style={[
                styles.hashtagRow,
                {
                  backgroundColor: isDark ? '#1C1917' : '#F7F6F2',
                  borderColor: isDark ? '#2E2A27' : '#EFECE6',
                },
              ]}
            >
              <Hash size={15} color={AppColors.primary} />
              <TextInput
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Ajouter des hashtags (#FaitMaison #SauceDja...)"
                placeholderTextColor={isDark ? '#8C8A87' : '#9E9B97'}
                style={[
                  styles.hashtagInput,
                  { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                ]}
              />
            </View>
          </ScrollView>

          {/* 3. Barre d'outils Facebook "Ajouter à votre publication" */}
          <View
            style={[
              styles.fbBottomBar,
              {
                backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
                borderTopColor: isDark ? '#262220' : '#EFECE6',
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <Text
              style={[
                styles.fbBottomBarLabel,
                { color: isDark ? '#D6D3CD' : AppColors.textPrimary },
              ]}
            >
              Ajouter à votre publication
            </Text>

            <View style={styles.fbToolsIconsRow}>
              {/* Photo / Vidéo */}
              <TouchableOpacity
                style={styles.fbToolBtn}
                activeOpacity={0.8}
                onPress={handlePickImage}
              >
                <ImageIcon size={22} color="#45BD62" />
              </TouchableOpacity>

              {/* Lier une recette */}
              <TouchableOpacity
                style={styles.fbToolBtn}
                activeOpacity={0.8}
                onPress={() => setActiveSheet('recipes')}
              >
                <CookingPot size={22} color="#F7931A" />
              </TouchableOpacity>

              {/* Humeur / Activité */}
              <TouchableOpacity
                style={styles.fbToolBtn}
                activeOpacity={0.8}
                onPress={() => setActiveSheet('feelings')}
              >
                <Smile size={22} color="#F7B125" />
              </TouchableOpacity>

              {/* Région / Terroir */}
              <TouchableOpacity
                style={styles.fbToolBtn}
                activeOpacity={0.8}
                onPress={() => setActiveSheet('regions')}
              >
                <MapPin size={22} color="#1877F2" />
              </TouchableOpacity>

              {/* Type de post */}
              <TouchableOpacity
                style={styles.fbToolBtn}
                activeOpacity={0.8}
                onPress={() => setActiveSheet('types')}
              >
                <Sparkles size={22} color={AppColors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* 4. Bottom Sheet : Sélection de Recette */}
        {activeSheet === 'recipes' && (
          <Modal
            visible
            transparent
            animationType="slide"
            onRequestClose={() => setActiveSheet('none')}
          >
            <View style={styles.modalSheetBackdrop}>
              <TouchableOpacity
                style={styles.flexOne}
                activeOpacity={1}
                onPress={() => setActiveSheet('none')}
              />
              <View
                style={[
                  styles.sheetContentContainer,
                  {
                    backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
                    borderTopColor: isDark ? '#2E2A27' : '#EFECE6',
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <Text
                    style={[
                      styles.sheetTitle,
                      { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                    ]}
                  >
                    Lier une recette AfroCuisto
                  </Text>
                  <TouchableOpacity
                    style={styles.sheetCloseIcon}
                    onPress={() => setActiveSheet('none')}
                  >
                    <X size={18} color="#8C8A87" />
                  </TouchableOpacity>
                </View>

                {/* Recherche de recette */}
                <View
                  style={[
                    styles.recipeSearchWrap,
                    {
                      backgroundColor: isDark ? '#262220' : '#F5F3EF',
                      borderColor: isDark ? '#3D3834' : '#E8E4DC',
                    },
                  ]}
                >
                  <Search size={16} color="#8C8A87" />
                  <TextInput
                    value={recipeSearchQuery}
                    onChangeText={setRecipeSearchQuery}
                    placeholder="Rechercher une recette (ex: Amiwô, Atassi...)"
                    placeholderTextColor={isDark ? '#8C8A87' : '#9E9B97'}
                    style={[
                      styles.recipeSearchInput,
                      { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                    ]}
                  />
                </View>

                <ScrollView style={styles.sheetListScroll}>
                  {filteredRecipes.map(r => {
                    const isSelected = selectedRecipe?.id === r.id;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[
                          styles.recipeItemRow,
                          {
                            borderBottomColor: isDark ? '#2E2A27' : '#F0ECE4',
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(255, 83, 42, 0.15)'
                                : '#FFF5F0'
                              : 'transparent',
                          },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedRecipe(r);
                          setActiveSheet('none');
                        }}
                      >
                        <Image
                          source={getImageSource(r.image)}
                          style={styles.recipeItemThumb}
                          resizeMode="cover"
                        />
                        <View style={styles.recipeItemMeta}>
                          <Text
                            style={[
                              styles.recipeItemName,
                              { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                            ]}
                          >
                            {r.name}
                          </Text>
                          <Text style={styles.recipeItemSub}>
                            {r.region || 'Terroir'} • {r.prepTime || '25 min'}
                          </Text>
                        </View>
                        {isSelected && <Check size={18} color={AppColors.primary} strokeWidth={2.5} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* 5. Bottom Sheet : Sélection de Terroir / Région */}
        {activeSheet === 'regions' && (
          <Modal
            visible
            transparent
            animationType="slide"
            onRequestClose={() => setActiveSheet('none')}
          >
            <View style={styles.modalSheetBackdrop}>
              <TouchableOpacity
                style={styles.flexOne}
                activeOpacity={1}
                onPress={() => setActiveSheet('none')}
              />
              <View
                style={[
                  styles.sheetContentContainer,
                  {
                    backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
                    borderTopColor: isDark ? '#2E2A27' : '#EFECE6',
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <Text
                    style={[
                      styles.sheetTitle,
                      { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                    ]}
                  >
                    Sélectionner votre région / terroir
                  </Text>
                  <TouchableOpacity
                    style={styles.sheetCloseIcon}
                    onPress={() => setActiveSheet('none')}
                  >
                    <X size={18} color="#8C8A87" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.sheetListScroll}>
                  {TERROIR_REGIONS.map(reg => {
                    const isSelected = selectedRegion === reg;
                    return (
                      <TouchableOpacity
                        key={reg}
                        style={[
                          styles.regionItemRow,
                          {
                            borderBottomColor: isDark ? '#2E2A27' : '#F0ECE4',
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(255, 83, 42, 0.15)'
                                : '#FFF5F0'
                              : 'transparent',
                          },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedRegion(reg);
                          setActiveSheet('none');
                        }}
                      >
                        <MapPin size={16} color={isSelected ? AppColors.primary : '#8C8A87'} />
                        <Text
                          style={[
                            styles.regionItemText,
                            {
                              color: isSelected
                                ? AppColors.primary
                                : isDark
                                ? '#FFFFFF'
                                : '#1E1D1D',
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {reg}
                        </Text>
                        {isSelected && <Check size={18} color={AppColors.primary} strokeWidth={2.5} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* 6. Bottom Sheet : Sélection de Type de Publication */}
        {activeSheet === 'types' && (
          <Modal
            visible
            transparent
            animationType="slide"
            onRequestClose={() => setActiveSheet('none')}
          >
            <View style={styles.modalSheetBackdrop}>
              <TouchableOpacity
                style={styles.flexOne}
                activeOpacity={1}
                onPress={() => setActiveSheet('none')}
              />
              <View
                style={[
                  styles.sheetContentContainer,
                  {
                    backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
                    borderTopColor: isDark ? '#2E2A27' : '#EFECE6',
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <Text
                    style={[
                      styles.sheetTitle,
                      { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                    ]}
                  >
                    Type de publication
                  </Text>
                  <TouchableOpacity
                    style={styles.sheetCloseIcon}
                    onPress={() => setActiveSheet('none')}
                  >
                    <X size={18} color="#8C8A87" />
                  </TouchableOpacity>
                </View>

                <View style={styles.sheetListPadding}>
                  {POST_TYPES.map(pt => {
                    const isSelected = selectedType === pt.type;
                    const IconComp = pt.icon;
                    return (
                      <TouchableOpacity
                        key={pt.type}
                        style={[
                          styles.typeItemRow,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? '#3D241C'
                                : '#FFF0EA'
                              : isDark
                              ? '#262220'
                              : '#F7F6F2',
                            borderColor: isSelected
                              ? AppColors.primary
                              : isDark
                              ? '#38322E'
                              : '#E8E4DC',
                          },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedType(pt.type);
                          setActiveSheet('none');
                        }}
                      >
                        <View
                          style={[
                            styles.typeItemIconCircle,
                            { backgroundColor: `${pt.color}20` },
                          ]}
                        >
                          <IconComp size={18} color={pt.color} />
                        </View>
                        <Text
                          style={[
                            styles.typeItemText,
                            {
                              color: isSelected
                                ? AppColors.primary
                                : isDark
                                ? '#FFFFFF'
                                : '#1E1D1D',
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {pt.label}
                        </Text>
                        {isSelected && <Check size={18} color={AppColors.primary} strokeWidth={2.5} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* 7. Bottom Sheet : Humeur / Activité Culinaire */}
        {activeSheet === 'feelings' && (
          <Modal
            visible
            transparent
            animationType="slide"
            onRequestClose={() => setActiveSheet('none')}
          >
            <View style={styles.modalSheetBackdrop}>
              <TouchableOpacity
                style={styles.flexOne}
                activeOpacity={1}
                onPress={() => setActiveSheet('none')}
              />
              <View
                style={[
                  styles.sheetContentContainer,
                  {
                    backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
                    borderTopColor: isDark ? '#2E2A27' : '#EFECE6',
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <Text
                    style={[
                      styles.sheetTitle,
                      { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                    ]}
                  >
                    Comment vous sentez-vous ?
                  </Text>
                  <TouchableOpacity
                    style={styles.sheetCloseIcon}
                    onPress={() => setActiveSheet('none')}
                  >
                    <X size={18} color="#8C8A87" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.sheetListScroll}>
                  {CULINARY_FEELINGS.map(f => {
                    const isSelected = selectedFeeling?.text === f.text;
                    return (
                      <TouchableOpacity
                        key={f.text}
                        style={[
                          styles.feelingItemRow,
                          {
                            borderBottomColor: isDark ? '#2E2A27' : '#F0ECE4',
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(255, 83, 42, 0.15)'
                                : '#FFF5F0'
                              : 'transparent',
                          },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedFeeling(isSelected ? null : f);
                          setActiveSheet('none');
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                        <Text
                          style={[
                            styles.feelingItemText,
                            {
                              color: isSelected
                                ? AppColors.primary
                                : isDark
                                ? '#FFFFFF'
                                : '#1E1D1D',
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {f.text}
                        </Text>
                        {isSelected && <Check size={18} color={AppColors.primary} strokeWidth={2.5} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Confirmation Personnalisée Stylisée d'abandon */}
        <ConfirmationModal
          visible={isDiscardConfirmOpen}
          title="Abandonner la publication ?"
          message="Si vous quittez maintenant, vos modifications seront perdues."
          type="warning"
          confirmText="Abandonner"
          cancelText="Continuer"
          onConfirm={() => {
            setIsDiscardConfirmOpen(false);
            handleResetForm();
            onClose();
          }}
          onCancel={() => setIsDiscardConfirmOpen(false)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  fbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fbHeaderBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  fbPublishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  fbPublishBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  authorPillsColumn: {
    flex: 1,
    gap: 5,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  authorNameText: {
    fontSize: 15,
    fontWeight: '800',
  },
  feelingMetaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillsScrollRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  metaPillClickable: {
    paddingRight: 7,
  },
  metaPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  standardInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingVertical: 8,
    lineHeight: 24,
  },
  gradientCanvas: {
    minHeight: 180,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gradientInput: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000000',
    maxHeight: 280,
  },
  imagePreview: {
    width: '100%',
    height: 240,
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeAttachedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  recipeAttachedThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  recipeAttachedMeta: {
    flex: 1,
    gap: 2,
  },
  recipeTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeTagText: {
    color: AppColors.primary,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  recipeAttachedName: {
    fontSize: 14,
    fontWeight: '800',
  },
  recipeAttachedSub: {
    fontSize: 11,
    color: '#8C8A87',
  },
  removeRecipeBtn: {
    padding: 6,
  },
  gradientPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  gradientThumbDefault: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientThumbItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  gradientThumbSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  hashtagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  hashtagInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  fbBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fbBottomBarLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  fbToolsIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fbToolBtn: {
    padding: 4,
  },
  // Bottom Sheet Modal
  modalSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContentContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '75%',
    borderTopWidth: 1,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8C8A87',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sheetCloseIcon: {
    padding: 4,
  },
  sheetListScroll: {
    maxHeight: 320,
  },
  sheetListPadding: {
    gap: 8,
    paddingVertical: 6,
  },
  recipeSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  recipeSearchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  recipeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
    borderRadius: 8,
  },
  recipeItemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  recipeItemMeta: {
    flex: 1,
    gap: 2,
  },
  recipeItemName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  recipeItemSub: {
    fontSize: 11,
    color: '#8C8A87',
  },
  regionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
    borderRadius: 8,
  },
  regionItemText: {
    flex: 1,
    fontSize: 14,
  },
  typeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  typeItemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeItemText: {
    flex: 1,
    fontSize: 14,
  },
  feelingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
    borderRadius: 8,
  },
  feelingItemText: {
    flex: 1,
    fontSize: 14,
  },
});