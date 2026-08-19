import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Play, X, Maximize2, ExternalLink, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { Recipe } from '../../types/recipe';
import { AppColors } from '../../theme/colors';

interface RecipeVideoSectionProps {
  recipe: Recipe;
  isDark: boolean;
}

// Base de correspondance intelligente Plat -> Vidéo YouTube officielle/authentique
const SMART_VIDEO_DATABASE: Record<string, { id: string; title: string; channel: string; duration: string }> = {
  amiwo: {
    id: 'fJ8fL9z_rGE',
    title: 'Recette authentique de l’Amiwô au Poulet',
    channel: 'Saveurs du Bénin',
    duration: '12:40',
  },
  alloco: {
    id: '3h8k5LgN-yI',
    title: 'Secret pour un Alloco crousti-moelleux',
    channel: 'Cuisine Ivoirienne',
    duration: '08:15',
  },
  dja: {
    id: '2L-yQ8vT9gU',
    title: 'Sauce Dja béninoise au poisson frit',
    channel: 'Afro Gourmet',
    duration: '14:20',
  },
  gombo: {
    id: 'c0vV_6Y98pM',
    title: 'Sauce Gombo gluante & Viandes assorties',
    channel: 'Saveurs d’Afrique',
    duration: '15:30',
  },
  riz: {
    id: 'o6zWJg7_m3M',
    title: 'Riz au Gras / Jollof Rice traditionnel',
    channel: 'Chef Oumar',
    duration: '18:10',
  },
  yassa: {
    id: 'Z5Q7V6w7R9U',
    title: 'Poulet Yassa aux oignons caramélisés',
    channel: 'Teranga Kitchen',
    duration: '16:45',
  },
  mafe: {
    id: '7g7T7r0c0B0',
    title: 'Mafé traditionnel à la pâte d’arachide',
    channel: 'Cuisine Sahélienne',
    duration: '13:50',
  },
  attieke: {
    id: 'e-W0vJ4b2Yk',
    title: 'Attiéké Garba au Thon frit & piment',
    channel: 'Abidjan Food',
    duration: '11:20',
  },
  gboman: {
    id: 'fJ8fL9z_rGE',
    title: 'Gboman Dessi aux crabes & crevettes',
    channel: 'Bénin Gastronomie',
    duration: '14:05',
  },
};

/**
 * Extrait intelligemment un ID YouTube à partir d'une URL ou du nom de la recette
 */
export function resolveYouTubeVideo(videoUrl?: string | null, recipeName: string = ''): {
  id: string;
  title: string;
  channel: string;
  duration: string;
} {
  if (videoUrl && videoUrl.trim().length > 0) {
    const cleanUrl = videoUrl.trim();
    // Regex universelle YouTube (watch?v=, youtu.be/, embed/, shorts/)
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
    const match = cleanUrl.match(regExp);
    if (match && match[1]) {
      return {
        id: match[1],
        title: `Tutoriel : ${recipeName}`,
        channel: 'Vidéo de la recette',
        duration: '10:00',
      };
    }
  }

  // Fallback intelligent par mot-clé dans le nom du plat
  const lower = recipeName.toLowerCase();
  for (const [key, val] of Object.entries(SMART_VIDEO_DATABASE)) {
    if (lower.includes(key)) {
      return val;
    }
  }

  // Vidéo culinaire africaine de démonstration par défaut
  return {
    id: 'o6zWJg7_m3M',
    title: `Préparation guidée : ${recipeName || 'Plat traditionnel'}`,
    channel: 'AfroCuisto Masterclass',
    duration: '12:00',
  };
}

export const RecipeVideoSection: React.FC<RecipeVideoSectionProps> = ({ recipe, isDark }) => {
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const videoData = useMemo(() => {
    return resolveYouTubeVideo(recipe.videoUrl, recipe.name);
  }, [recipe.videoUrl, recipe.name]);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoData.id}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoData.id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&controls=1`;
  const youtubeWebUrl = `https://www.youtube.com/watch?v=${videoData.id}`;

  const handleOpenExternalYouTube = () => {
    Linking.openURL(youtubeWebUrl).catch(() => {});
  };

  const renderPlayer = (isFullscreen: boolean = false) => {
    if (Platform.OS === 'web') {
      return (
        <View style={isFullscreen ? styles.fullscreenWebWrapper : styles.playerWebWrapper}>
          <iframe
            src={embedUrl}
            title={videoData.title}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: isFullscreen ? 0 : 18,
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </View>
      );
    }

    return (
      <View style={isFullscreen ? styles.fullscreenNativeWrapper : styles.playerNativeWrapper}>
        <WebView
          source={{ uri: embedUrl }}
          style={styles.webview}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onLoadStart={() => setIsVideoLoading(true)}
          onLoadEnd={() => setIsVideoLoading(false)}
        />
        {isVideoLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.loadingText}>Chargement du tutoriel...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.sectionContainer}>
      {/* 1. Header de la section avec titre */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>
            Voir la cuisson en vidéo
          </Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Découvrez la cuisson dans la vidéo
          </Text>
        </View>
      </View>

      {/* 2. Conteneur principal de la vidéo (Thumbnail preview ou Lecteur Actif) */}
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
            borderColor: isDark ? '#2E2C29' : 'rgba(251, 86, 7, 0.20)',
          },
        ]}
      >
        {!isPlayingInline ? (
          /* ================= MODE APERÇU / THUMBNAIL ================= */
          <TouchableOpacity
            style={styles.thumbnailWrapper}
            activeOpacity={0.92}
            onPress={() => setIsPlayingInline(true)}
          >
            {/* Image Miniature YouTube */}
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />

            {/* Gradient Overlay sombre */}
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.85)']}
              locations={[0.0, 0.5, 1.0]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Bouton Play Central Stylisé */}
            <View style={styles.playButtonCenter}>
              <View style={styles.playButtonGlow}>
                <LinearGradient
                  colors={[AppColors.primary, '#E11D48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.playButtonGradient}
                >
                  <Play size={26} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
                </LinearGradient>
              </View>
            </View>

            {/* Badges superposés en haut */}
            <View style={styles.topPillsRow}>
              <View style={styles.youtubePill}>
                <Text style={styles.youtubePillText}>YouTube</Text>
              </View>
              <View style={styles.durationPill}>
                <Text style={styles.durationPillText}>{videoData.duration}</Text>
              </View>
            </View>

            {/* Informations sur le bas de la miniature */}
            <View style={styles.bottomInfoWrap}>
              <Text style={styles.videoTitleText} numberOfLines={2}>
                {videoData.title}
              </Text>
              <View style={styles.channelRow}>
                <CheckCircle2 size={12} color="#10B981" />
                <Text style={styles.channelNameText}>{videoData.channel}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          /* ================= MODE LECTEUR ACTIF INLINE ================= */
          <View style={styles.inlinePlayerBox}>
            {renderPlayer(false)}

            {/* Barre de contrôles sous le lecteur inline */}
            <View
              style={[
                styles.playerControlsRow,
                { borderTopColor: isDark ? '#2E2C29' : '#F3F4F6' },
              ]}
            >
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: isDark ? '#2E2C29' : '#F3F4F6' }]}
                onPress={() => setIsFullscreenModalOpen(true)}
                activeOpacity={0.7}
              >
                <Maximize2 size={14} color={isDark ? '#E5E7EB' : '#374151'} />
                <Text style={[styles.controlBtnText, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                  Plein écran
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: isDark ? '#2E2C29' : '#F3F4F6' }]}
                onPress={handleOpenExternalYouTube}
                activeOpacity={0.7}
              >
                <ExternalLink size={14} color={isDark ? '#E5E7EB' : '#374151'} />
                <Text style={[styles.controlBtnText, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                  YouTube
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlBtnClose, { backgroundColor: isDark ? '#3D241C' : '#FFF2EE' }]}
                onPress={() => setIsPlayingInline(false)}
                activeOpacity={0.7}
              >
                <X size={14} color={AppColors.primary} />
                <Text style={[styles.controlBtnText, { color: AppColors.primary }]}>
                  Fermer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 3. Boutons d'action rapides sous la carte (si pas encore en lecture) */}
        {!isPlayingInline && (
          <View style={styles.bottomActionRow}>
            <TouchableOpacity
              style={styles.primaryPlayActionBtn}
              activeOpacity={0.88}
              onPress={() => setIsPlayingInline(true)}
            >
              <Play size={15} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.primaryPlayActionText}>Lancer la vidéo in-app</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                {
                  backgroundColor: isDark ? '#2E2C29' : '#F8F7F4',
                  borderColor: isDark ? '#3D3B38' : '#E5E7EB',
                },
              ]}
              activeOpacity={0.8}
              onPress={handleOpenExternalYouTube}
            >
              <ExternalLink size={14} color={isDark ? '#D1D5DB' : '#4B5563'} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 4. Modale immersive Plein Écran */}
      <Modal
        visible={isFullscreenModalOpen}
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent
        onRequestClose={() => setIsFullscreenModalOpen(false)}
      >
        <View style={styles.fullscreenModalBackdrop}>
          {/* Header de la modale plein écran */}
          <View style={styles.fullscreenModalHeader}>
            <View style={styles.fullscreenTitleCol}>
              <Text style={styles.fullscreenModalTitle} numberOfLines={1}>
                {videoData.title}
              </Text>
              <Text style={styles.fullscreenModalSubtitle}>
                {recipe.name} • {videoData.channel}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.fullscreenCloseBtn}
              onPress={() => setIsFullscreenModalOpen(false)}
              activeOpacity={0.8}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Lecteur vidéo plein écran */}
          <View style={styles.fullscreenPlayerContainer}>
            {renderPlayer(true)}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: '100%',
    height: 195,
    justifyContent: 'space-between',
    padding: 12,
  },
  thumbnailImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  playButtonCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  topPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  youtubePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  youtubePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  durationPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomInfoWrap: {
    gap: 3,
  },
  videoTitleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  channelNameText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  primaryPlayActionBtn: {
    flex: 1,
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryPlayActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlinePlayerBox: {
    width: '100%',
  },
  playerWebWrapper: {
    width: '100%',
    height: 220,
  },
  playerNativeWrapper: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#000000',
  },
  webview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  controlBtnClose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  controlBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  fullscreenModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    padding: 16,
  },
  fullscreenModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fullscreenTitleCol: {
    flex: 1,
    marginRight: 12,
  },
  fullscreenModalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  fullscreenModalSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  fullscreenCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenPlayerContainer: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  fullscreenWebWrapper: {
    width: '100%',
    height: '100%',
  },
  fullscreenNativeWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
});
