import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Moon,
  Heart,
  ShoppingBag,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  LogIn,
  Edit3,
  Share2,
  Bell,
  Check,
  X,
  Utensils,
  MapPin,
  Bookmark,
  CheckCircle2,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRecipes } from '../context/RecipeContext';
import { useShopping } from '../context/ShoppingContext';
import { AppColors } from '../theme/colors';
import { ShimmerSkeleton } from '../components/common/ShimmerSkeleton';
import { BouncyPressable } from '../components/common/BouncyPressable';
import { AnimatedScreenWrapper } from '../components/common/AnimatedScreenWrapper';

// Options d'avatars sobres et élégants
const AVATAR_PALETTES = [
  { id: 'terracotta', label: 'Terre Cuite', color: '#EA580C', bg: '#FFEDD5' },
  { id: 'saffron', label: 'Safran', color: '#D97706', bg: '#FEF3C7' },
  { id: 'emerald', label: 'Émeraude', color: '#059669', bg: '#D1FAE5' },
  { id: 'indigo', label: 'Indigo', color: '#4F46E5', bg: '#E0E7FF' },
  { id: 'charcoal', label: 'Anthracite', color: '#374151', bg: '#F3F4F6' },
];

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, logout, login, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { favorites } = useRecipes();
  const { totalCount } = useShopping();

  const [pageLoading, setPageLoading] = useState(false);

  // Modale d'édition
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editRegion, setEditRegion] = useState(user?.region || 'Bénin');
  const [selectedPaletteId, setSelectedPaletteId] = useState(user?.avatarUrl || 'terracotta');

  // Préférences
  const [dietPref, setDietPref] = useState('traditional');
  const [servingsDefault, setServingsDefault] = useState(4);
  const [pushNotifications, setPushNotifications] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        setEditName(user.name);
        setEditBio(user.bio || '');
        setEditRegion(user.region || 'Bénin');
        setSelectedPaletteId(user.avatarUrl || 'terracotta');
      }
    }, [user])
  );

  const handleSaveProfile = async () => {
    await updateUser({
      name: editName,
      bio: editBio,
      region: editRegion,
      avatarUrl: selectedPaletteId,
    });
    setIsEditModalVisible(false);
    Alert.alert('Profil mis à jour', 'Vos modifications ont bien été enregistrées.');
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          'Découvrez AfroCuisto, l\'application culinaire de référence pour explorer la gastronomie africaine authentique.',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleLogin = () => {
    navigation.navigate('Onboarding');
  };

  const activePalette = AVATAR_PALETTES.find((p) => p.id === user?.avatarUrl) || AVATAR_PALETTES[0];
  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'CU';

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
        {/* Barre supérieure épurée avec bouton Retour */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={[
              styles.navIconButton,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                borderColor: isDark ? '#374151' : 'rgba(0,0,0,0.08)',
              },
            ]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Retour"
          >
            <ChevronLeft
              size={22}
              color={isDark ? '#FFFFFF' : AppColors.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navIconButton,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                borderColor: isDark ? '#374151' : 'rgba(0,0,0,0.08)',
              },
            ]}
            onPress={handleShareApp}
            activeOpacity={0.7}
            accessibilityLabel="Partager"
          >
            <Share2 size={18} color={isDark ? '#E5E7EB' : '#374151'} />
          </TouchableOpacity>
        </View>

        {pageLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingHeader}>
              <ShimmerSkeleton width={80} height={80} borderRadius={40} />
              <ShimmerSkeleton width={160} height={20} borderRadius={6} style={{ marginTop: 12 }} />
              <ShimmerSkeleton width={200} height={14} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
            <ShimmerSkeleton width="100%" height={80} borderRadius={16} style={{ marginTop: 20 }} />
            <ShimmerSkeleton width="100%" height={240} borderRadius={16} style={{ marginTop: 20 }} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Carte Identité Profil */}
            <View style={styles.identitySection}>
              <View style={styles.avatarContainer}>
                <View
                  style={[
                    styles.avatarCircle,
                    {
                      backgroundColor: user ? activePalette.bg : isDark ? '#2E2C29' : '#F3F4F6',
                      borderColor: user ? activePalette.color : isDark ? '#374151' : '#E5E7EB',
                    },
                  ]}
                >
                  {user ? (
                    <Text style={[styles.avatarInitials, { color: activePalette.color }]}>
                      {userInitials}
                    </Text>
                  ) : (
                    <User size={36} color="#9CA3AF" />
                  )}
                </View>
              </View>

              <Text style={[styles.userName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {user ? user.name : 'Mode Invité'}
              </Text>

              <Text style={[styles.userEmail, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {user ? user.email : 'Connectez-vous pour personnaliser vos préférences'}
              </Text>

              {user?.bio && (
                <Text style={[styles.userBio, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                  {user.bio}
                </Text>
              )}

              {user?.region && (
                <View
                  style={[
                    styles.locationTag,
                    {
                      backgroundColor: isDark ? '#2E2C29' : '#F3F4F6',
                    },
                  ]}
                >
                  <MapPin size={12} color={AppColors.primary} />
                  <Text style={[styles.locationText, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                    {user.region}
                  </Text>
                </View>
              )}
            </View>

            {/* Barre d'activités & Métriques */}
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
                    borderColor: isDark ? '#2E2C29' : '#E5E7EB',
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Favorites')}
              >
                <View style={[styles.statIconWrap, { backgroundColor: isDark ? '#3B1A1A' : '#FEE2E2' }]}>
                  <Heart size={18} color="#EF4444" />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {favorites.length}
                  </Text>
                  <Text style={styles.statLabel}>Favoris</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
                    borderColor: isDark ? '#2E2C29' : '#E5E7EB',
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Market')}
              >
                <View style={[styles.statIconWrap, { backgroundColor: isDark ? '#3B2A1A' : '#FFEDD5' }]}>
                  <ShoppingBag size={18} color={AppColors.primary} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {totalCount}
                  </Text>
                  <Text style={styles.statLabel}>Ingrédients</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* SECTIONS DE NAVIGATION & PARAMÈTRES (STYLE ÉDITORIAL STRUCTURÉ) */}

            {/* Section 1 : CUISINE & ACTIVITÉ */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionHeader}>CUISINE & ACTIVITÉ</Text>
              <View
                style={[
                  styles.groupCard,
                  {
                    backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
                    borderColor: isDark ? '#2E2C29' : '#E5E7EB',
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.rowItem}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Favorites')}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIconCircle, { backgroundColor: isDark ? '#2E2C29' : '#F9FAFB' }]}>
                      <Bookmark size={16} color={AppColors.primary} />
                    </View>
                    <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      Recettes sauvegardées
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.badgeCount}>{favorites.length}</Text>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>

                <View style={[styles.rowDivider, { backgroundColor: isDark ? '#2E2C29' : '#F3F4F6' }]} />

                <TouchableOpacity
                  style={styles.rowItem}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Market')}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIconCircle, { backgroundColor: isDark ? '#2E2C29' : '#F9FAFB' }]}>
                      <ShoppingBag size={16} color={AppColors.primary} />
                    </View>
                    <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      Liste d'ingrédients du marché
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.badgeCount}>{totalCount}</Text>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 2 : PRÉFÉRENCES CULINAIRES */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionHeader}>PRÉFÉRENCES CULINAIRES</Text>
              <View
                style={[
                  styles.groupCard,
                  {
                    backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
                    borderColor: isDark ? '#2E2C29' : '#E5E7EB',
                  },
                ]}
              >
                {/* Régime Sélectionneur */}
                <View style={styles.preferenceBlock}>
                  <View style={styles.prefBlockHeader}>
                    <Utensils size={16} color={AppColors.primary} />
                    <Text style={[styles.prefBlockTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      Régime alimentaire
                    </Text>
                  </View>
                  <View style={styles.chipRow}>
                    {[
                      { id: 'traditional', label: 'Traditionnel' },
                      { id: 'veg', label: 'Végétarien' },
                      { id: 'spicy', label: 'Épicé' },
                    ].map((chip) => {
                      const isSelected = dietPref === chip.id;
                      return (
                        <TouchableOpacity
                          key={chip.id}
                          style={[
                            styles.chipPill,
                            {
                              backgroundColor: isSelected
                                ? AppColors.primary
                                : isDark
                                ? '#2E2C29'
                                : '#F3F4F6',
                            },
                          ]}
                          onPress={() => setDietPref(chip.id)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isSelected ? '#FFFFFF' : isDark ? '#D1D5DB' : '#374151',
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {chip.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={[styles.rowDivider, { backgroundColor: isDark ? '#2E2C29' : '#F3F4F6' }]} />

                {/* Nombre de portions */}
                <View style={styles.rowItemControl}>
                  <View>
                    <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      Portions par défaut
                    </Text>
                    <Text style={styles.rowSubtitle}>Ajuste les quantités d'ingrédients</Text>
                  </View>
                  <View style={[styles.segmentControl, { backgroundColor: isDark ? '#2E2C29' : 'rgba(0,0,0,0.04)' }]}>
                    {[2, 4, 6].map((num) => {
                      const isSelected = servingsDefault === num;
                      return (
                        <TouchableOpacity
                          key={num}
                          style={[
                            styles.segmentButton,
                            isSelected && { backgroundColor: AppColors.primary },
                          ]}
                          onPress={() => setServingsDefault(num)}
                        >
                          <Text
                            style={[
                              styles.segmentText,
                              { color: isSelected ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280' },
                            ]}
                          >
                            {num} pers.
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* Section 3 : APPLICATION & PARAMÈTRES */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionHeader}>APPLICATION & PARAMÈTRES</Text>
              <View
                style={[
                  styles.groupCard,
                  {
                    backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
                    borderColor: isDark ? '#2E2C29' : '#E5E7EB',
                  },
                ]}
              >
                {/* Mode Sombre */}
                <View style={styles.rowItemControl}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIconCircle, { backgroundColor: isDark ? '#2E2C29' : '#F9FAFB' }]}>
                      <Moon size={16} color={AppColors.primary} />
                    </View>
                    <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      Mode Sombre
                    </Text>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: '#E5E7EB', true: AppColors.primary }}
                  />
                </View>

                <View style={[styles.rowDivider, { backgroundColor: isDark ? '#2E2C29' : '#F3F4F6' }]} />

                {/* Notifications */}
                <View style={styles.rowItemControl}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIconCircle, { backgroundColor: isDark ? '#2E2C29' : '#F9FAFB' }]}>
                      <Bell size={16} color={AppColors.primary} />
                    </View>
                    <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      Notifications Push
                    </Text>
                  </View>
                  <Switch
                    value={pushNotifications}
                    onValueChange={setPushNotifications}
                    trackColor={{ false: '#E5E7EB', true: AppColors.primary }}
                  />
                </View>

                <View style={[styles.rowDivider, { backgroundColor: isDark ? '#2E2C29' : '#F3F4F6' }]} />

                {/* UI Lab */}
                <TouchableOpacity
                  style={styles.rowItem}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('AnimationLab')}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIconCircle, { backgroundColor: isDark ? '#2E2C29' : '#F9FAFB' }]}>
                      <Sparkles size={16} color={AppColors.primary} />
                    </View>
                    <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      Laboratoire d'Animations (UI Lab)
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <View style={[styles.rowDivider, { backgroundColor: isDark ? '#2E2C29' : '#F3F4F6' }]} />

                {/* Sécurité */}
                <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIconCircle, { backgroundColor: isDark ? '#2E2C29' : '#F9FAFB' }]}>
                      <ShieldCheck size={16} color="#059669" />
                    </View>
                    <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      Confidentialité & Données
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bouton de Connexion / Déconnexion */}
            <View style={styles.actionSection}>
              {user ? (
                <BouncyPressable onPress={handleLogout}>
                  <View
                    style={[
                      styles.logoutButton,
                      {
                        backgroundColor: isDark ? '#2D1B1B' : '#FEF2F2',
                        borderColor: isDark ? '#4B2525' : '#FEE2E2',
                      },
                    ]}
                  >
                    <LogOut size={16} color="#DC2626" />
                    <Text style={styles.logoutButtonText}>Se déconnecter</Text>
                  </View>
                </BouncyPressable>
              ) : (
                <BouncyPressable onPress={handleLogin}>
                  <View style={styles.loginButton}>
                    <LogIn size={16} color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>Se connecter à un compte</Text>
                  </View>
                </BouncyPressable>
              )}
            </View>

            {/* Versioning */}
            <View style={styles.footerInfo}>
              <Text style={styles.versionText}>AfroCuisto Mobile v1.2.0</Text>
              <Text style={styles.subVersionText}>Conçu pour la gastronomie africaine authentique</Text>
            </View>
          </ScrollView>
        )}
      </AnimatedScreenWrapper>

      {/* MODALE D'ÉDITION DU PROFIL (DESIGN PRO & ÉPURÉ) */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
              },
            ]}
          >
            <View style={styles.modalTopBar}>
              <Text style={[styles.modalHeading, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Édition du profil
              </Text>
              <TouchableOpacity
                style={styles.closeIconButton}
                onPress={() => setIsEditModalVisible(false)}
              >
                <X size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalFormContent}>
              {/* Sélecteur de palette de couleurs pour l'avatar */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                  Thème visuel de l'avatar
                </Text>
                <View style={styles.paletteRow}>
                  {AVATAR_PALETTES.map((pal) => {
                    const isSelected = selectedPaletteId === pal.id;
                    return (
                      <TouchableOpacity
                        key={pal.id}
                        style={[
                          styles.paletteCircle,
                          { backgroundColor: pal.bg, borderColor: pal.color },
                          isSelected && styles.paletteCircleActive,
                        ]}
                        onPress={() => setSelectedPaletteId(pal.id)}
                      >
                        <Text style={[styles.paletteInitials, { color: pal.color }]}>
                          {userInitials}
                        </Text>
                        {isSelected && (
                          <View style={[styles.checkBadge, { backgroundColor: pal.color }]}>
                            <Check size={8} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Nom */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                  Nom complet
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: isDark ? '#2E2C29' : '#F9FAFB',
                      color: isDark ? '#FFFFFF' : '#111827',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Saisissez votre nom"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Bio */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                  Bio ou phrase d'accroche
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: isDark ? '#2E2C29' : '#F9FAFB',
                      color: isDark ? '#FFFFFF' : '#111827',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      height: 72,
                      textAlignVertical: 'top',
                    },
                  ]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Décrivez votre passion culinaire..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              {/* Région */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                  Région ou Pays de référence
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: isDark ? '#2E2C29' : '#F9FAFB',
                      color: isDark ? '#FFFFFF' : '#111827',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                    },
                  ]}
                  value={editRegion}
                  onChangeText={setEditRegion}
                  placeholder="Ex: Bénin, Côte d'Ivoire, Sénégal..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Bouton Sauvegarder */}
              <TouchableOpacity
                style={styles.saveActionButton}
                activeOpacity={0.85}
                onPress={handleSaveProfile}
              >
                <CheckCircle2 size={18} color="#FFFFFF" />
                <Text style={styles.saveActionButtonText}>Enregistrer les modifications</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  navIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainer: {
    padding: 20,
  },
  loadingHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  identitySection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  userBio: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 14,
  },
  editProfileButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrap: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: '#8C8A87',
    fontWeight: '500',
  },
  sectionGroup: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C8A87',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowItemControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 11,
    color: '#8C8A87',
    marginTop: 2,
  },
  badgeCount: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  rowDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  preferenceBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  prefBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefBlockTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  chipText: {
    fontSize: 12,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    padding: 3,
    borderRadius: 12,
    gap: 4,
  },
  segmentButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionSection: {
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    gap: 2,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C8A87',
  },
  subVersionText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeIconButton: {
    padding: 4,
  },
  modalFormContent: {
    gap: 16,
    paddingBottom: 20,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  paletteCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  paletteCircleActive: {
    transform: [{ scale: 1.08 }],
  },
  paletteInitials: {
    fontSize: 14,
    fontWeight: '800',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  saveActionButton: {
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  saveActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
