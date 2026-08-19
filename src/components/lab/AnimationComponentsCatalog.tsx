import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
  DimensionValue,
  Platform,
} from 'react-native';
import {
  Heart,
  Star,
  Bookmark,
  Sparkles,
  Flame,
  Check,
  Plus,
  Minus,
  Trash2,
  Share2,
  Clock,
  ThumbsUp,
  Search,
  Eye,
  EyeOff,
  Bell,
  RefreshCw,
  Award,
  Zap,
  Coffee,
  ShoppingBag,
  Sliders,
  ChevronRight,
  ChevronDown,
  Volume2,
  Mic,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react-native';
import { AppColors } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { BouncyPressable } from '../common/BouncyPressable';
import { Checkbox } from '../common/Checkbox';
import { FavoriteIconButton } from '../common/FavoriteIconButton';
import { ShimmerSkeleton } from '../common/ShimmerSkeleton';

// ----------------------------------------------------
// HELPER: Component Preview Card Container
// ----------------------------------------------------
export const CatalogItemCard: React.FC<{
  id: number;
  title: string;
  category: string;
  description: string;
  children: React.ReactNode;
}> = ({ id, title, category, description, children }) => {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.catalogCard,
        {
          backgroundColor: isDark ? '#1F1D1B' : '#FFFFFF',
          borderColor: isDark ? '#2E2C29' : '#ECE8E1',
        },
      ]}
    >
      <View style={styles.catalogCardTop}>
        <View style={styles.badgeIndex}>
          <Text style={styles.badgeIndexText}>#{id}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.catalogCardTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
          >
            {title}
          </Text>
          <Text style={styles.catalogCardCategory}>{category}</Text>
        </View>
      </View>
      <Text style={styles.catalogCardDesc}>{description}</Text>
      <View
        style={[
          styles.previewCanvas,
          { backgroundColor: isDark ? '#171513' : '#F9F8F5' },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

// ----------------------------------------------------
// 1. BUTTONS & CTAs (15 Components)
// ----------------------------------------------------

// 1. Bouncy Spring Primary Button
export const C01_BouncyButton: React.FC = () => {
  const [count, setCount] = useState(0);
  return (
    <BouncyPressable onPress={() => setCount(c => c + 1)}>
      <View style={[styles.demoBtn, { backgroundColor: AppColors.primary }]}>
        <Sparkles size={16} color="#FFF" />
        <Text style={styles.btnTextWhite}>Bouncy Button ({count})</Text>
      </View>
    </BouncyPressable>
  );
};

// 2. Pulse Flame Button
export const C02_PulseFlameButton: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity style={[styles.demoBtn, { backgroundColor: '#FF4500' }]} activeOpacity={0.8}>
        <Flame size={16} color="#FFF" />
        <Text style={styles.btnTextWhite}>Hot Spicy CTA 🔥</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// 3. Shimmer Glow Button
export const C03_ShimmerGlowButton: React.FC = () => {
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.9, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ opacity: glowAnim }}>
      <TouchableOpacity style={[styles.demoBtn, { backgroundColor: '#8B5CF6' }]}>
        <Zap size={16} color="#FFF" />
        <Text style={styles.btnTextWhite}>Glow Shimmer</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// 4. Double Tap Heart Button
export const C04_DoubleTapHeart: React.FC = () => {
  const [liked, setLiked] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const trigger = () => {
    setLiked(!liked);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, friction: 3, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };

  return (
    <TouchableOpacity onPress={trigger} style={styles.iconCenterBtn}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Heart size={28} color={liked ? AppColors.primary : '#A8A29E'} fill={liked ? AppColors.primary : 'transparent'} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// 5. Morphing Check Button
export const C05_MorphingCheckButton: React.FC = () => {
  const [done, setDone] = useState(false);
  return (
    <BouncyPressable onPress={() => setDone(!done)}>
      <View style={[styles.demoBtn, { backgroundColor: done ? '#10B981' : AppColors.primary }]}>
        {done ? <Check size={18} color="#FFF" /> : <Plus size={18} color="#FFF" />}
        <Text style={styles.btnTextWhite}>{done ? 'Ajouté au Frigo !' : 'Ajouter au Frigo'}</Text>
      </View>
    </BouncyPressable>
  );
};

// 6. Ripple Circle Button
export const C06_RippleCircleButton: React.FC = () => {
  const [clicked, setClicked] = useState(0);
  return (
    <BouncyPressable scaleTo={0.88} onPress={() => setClicked(c => c + 1)}>
      <View style={[styles.circleIconBtn, { backgroundColor: '#FFE5DF' }]}>
        <Sparkles size={20} color={AppColors.primary} />
      </View>
    </BouncyPressable>
  );
};

// 7. Outline Bounce Button
export const C07_OutlineBounceButton: React.FC = () => {
  return (
    <BouncyPressable>
      <View style={[styles.demoBtn, { backgroundColor: 'transparent', borderWidth: 2, borderColor: AppColors.primary }]}>
        <Text style={{ color: AppColors.primary, fontWeight: '700' }}>Outline Spring</Text>
      </View>
    </BouncyPressable>
  );
};

// 8. 3D Neumorph Push Button
export const C08_Neumorph3DPush: React.FC = () => {
  const [pushed, setPushed] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => setPushed(true)}
      onPressOut={() => setPushed(false)}
      style={[
        styles.demoBtn,
        {
          backgroundColor: '#F59E0B',
          transform: [{ translateY: pushed ? 4 : 0 }],
          shadowOffset: { width: 0, height: pushed ? 0 : 4 },
          shadowOpacity: pushed ? 0 : 0.3,
          elevation: pushed ? 0 : 4,
        },
      ]}
    >
      <Text style={styles.btnTextWhite}>Effet 3D Pressement</Text>
    </TouchableOpacity>
  );
};

// 9. Floating Speed Dial FAB
export const C09_SpeedDialFAB: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {open && (
        <Animated.View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={[styles.circleSmall, { backgroundColor: '#10B981' }]}><Check size={14} color="#FFF" /></View>
          <View style={[styles.circleSmall, { backgroundColor: '#3B82F6' }]}><Share2 size={14} color="#FFF" /></View>
        </Animated.View>
      )}
      <BouncyPressable onPress={() => setOpen(!open)}>
        <View style={[styles.circleIconBtn, { backgroundColor: AppColors.primary }]}>
          <Plus size={20} color="#FFF" style={{ transform: [{ rotate: open ? '45deg' : '0deg' }] }} />
        </View>
      </BouncyPressable>
    </View>
  );
};

// 10. Swipe To Confirm Mock
export const C10_SwipeConfirmBtn: React.FC = () => {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => setConfirmed(!confirmed)}
      style={[styles.sliderTrack, { backgroundColor: confirmed ? '#10B981' : '#E5E2DC' }]}
    >
      <View style={[styles.sliderThumb, confirmed && { alignSelf: 'flex-end' }]}>
        <ChevronRight size={16} color="#FFF" />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: confirmed ? '#FFF' : '#6B7280' }}>
        {confirmed ? 'Validé avec Succès !' : 'Glisser pour Valider'}
      </Text>
    </TouchableOpacity>
  );
};

// 11. Sound Wave Audio Button
export const C11_SoundWaveBtn: React.FC = () => {
  const [playing, setPlaying] = useState(false);
  return (
    <BouncyPressable onPress={() => setPlaying(!playing)}>
      <View style={[styles.demoBtn, { backgroundColor: playing ? '#059669' : '#374151' }]}>
        <Volume2 size={16} color="#FFF" />
        <Text style={styles.btnTextWhite}>{playing ? 'Lecture Recette...' : 'Écouter la Recette'}</Text>
      </View>
    </BouncyPressable>
  );
};

// 12. Star Rating Particle Button
export const C12_StarRatingBurst: React.FC = () => {
  const [star, setStar] = useState(false);
  return (
    <FavoriteIconButton
      isFavorite={star}
      onToggle={() => setStar(!star)}
      iconType="heart"
      size={44}
      activeColor="#F59E0B"
      inactiveBgColor="#FEF3C7"
      activeBgColor="#FDE68A"
    />
  );
};

// 13. Bookmark Particle Button
export const C13_BookmarkBurst: React.FC = () => {
  const [bm, setBm] = useState(true);
  return (
    <FavoriteIconButton
      isFavorite={bm}
      onToggle={() => setBm(!bm)}
      iconType="bookmark"
      size={44}
      activeColor={AppColors.primary}
    />
  );
};

// 14. Destructive Delete Button
export const C14_DestructiveShakeBtn: React.FC = () => {
  const [clicked, setClicked] = useState(false);
  return (
    <BouncyPressable onPress={() => setClicked(!clicked)}>
      <View style={[styles.demoBtn, { backgroundColor: '#EF4444' }]}>
        <Trash2 size={16} color="#FFF" />
        <Text style={styles.btnTextWhite}>{clicked ? 'Supprimé !' : 'Supprimer'}</Text>
      </View>
    </BouncyPressable>
  );
};

// 15. Magnetic Floating Tag Button
export const C15_MagneticTagBtn: React.FC = () => {
  const [active, setActive] = useState(false);
  return (
    <BouncyPressable onPress={() => setActive(!active)}>
      <View style={[styles.tagPill, active && styles.tagPillActive]}>
        <Text style={[styles.tagPillText, active && { color: '#FFF' }]}>🍲 Sauces Béninoises</Text>
      </View>
    </BouncyPressable>
  );
};

// ----------------------------------------------------
// 2. CHECKBOXES, TOGGLES & SELECTORS (12 Components)
// ----------------------------------------------------

export const C16_RadixPrimaryCheckbox: React.FC = () => {
  const [v, setV] = useState(true);
  return <Checkbox checked={v} onCheckedChange={setV} variant="primary" />;
};

export const C17_RadixSuccessCheckbox: React.FC = () => {
  const [v, setV] = useState(true);
  return <Checkbox checked={v} onCheckedChange={setV} variant="success" />;
};

export const C18_RadixLargeCheckbox: React.FC = () => {
  const [v, setV] = useState(false);
  return <Checkbox checked={v} onCheckedChange={setV} size="lg" />;
};

export const C19_SpringSwitchToggle: React.FC = () => {
  const [on, setOn] = useState(true);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setOn(!on)}
      style={[styles.switchTrack, { backgroundColor: on ? AppColors.primary : '#D1D5DB' }]}
    >
      <View style={[styles.switchThumb, on && { transform: [{ translateX: 20 }] }]} />
    </TouchableOpacity>
  );
};

export const C20_DayNightToggle: React.FC = () => {
  const [dark, setDark] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => setDark(!dark)}
      style={[styles.switchTrack, { backgroundColor: dark ? '#1E1D1B' : '#FEF3C7', width: 56 }]}
    >
      <Text style={{ fontSize: 13 }}>{dark ? '🌙' : '☀️'}</Text>
    </TouchableOpacity>
  );
};

export const C21_RadioRippleDot: React.FC = () => {
  const [sel, setSel] = useState(true);
  return (
    <TouchableOpacity onPress={() => setSel(!sel)} style={styles.radioRing}>
      {sel && <View style={styles.radioDot} />}
    </TouchableOpacity>
  );
};

export const C22_StarRatingPicker: React.FC = () => {
  const [rating, setRating] = useState(4);
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Star size={22} color="#F59E0B" fill={star <= rating ? '#F59E0B' : 'transparent'} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const C23_ChiliSpiceSelector: React.FC = () => {
  const [spice, setSpice] = useState(2);
  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      {[1, 2, 3, 4].map(s => (
        <TouchableOpacity key={s} onPress={() => setSpice(s)}>
          <Flame size={22} color={s <= spice ? '#FF4500' : '#D1D5DB'} fill={s <= spice ? '#FF4500' : 'transparent'} />
        </TouchableOpacity>
      ))}
      <Text style={{ fontSize: 11, fontWeight: '700', marginLeft: 6, color: '#FF4500' }}>Niveau {spice}/4</Text>
    </View>
  );
};

export const C24_PortionStepper: React.FC = () => {
  const [portions, setPortions] = useState(4);
  return (
    <View style={styles.stepperBox}>
      <BouncyPressable onPress={() => setPortions(p => Math.max(1, p - 1))}>
        <View style={styles.stepperBtn}><Minus size={16} color="#000" /></View>
      </BouncyPressable>
      <Text style={styles.stepperVal}>{portions} pers.</Text>
      <BouncyPressable onPress={() => setPortions(p => p + 1)}>
        <View style={styles.stepperBtn}><Plus size={16} color="#000" /></View>
      </BouncyPressable>
    </View>
  );
};

export const C25_SegmentedPill: React.FC = () => {
  const [tab, setTab] = useState('recette');
  return (
    <View style={styles.segTrack}>
      <TouchableOpacity
        onPress={() => setTab('recette')}
        style={[styles.segBtn, tab === 'recette' && styles.segBtnActive]}
      >
        <Text style={[styles.segText, tab === 'recette' && styles.segTextActive]}>Recette</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setTab('avis')}
        style={[styles.segBtn, tab === 'avis' && styles.segBtnActive]}
      >
        <Text style={[styles.segText, tab === 'avis' && styles.segTextActive]}>Avis (18)</Text>
      </TouchableOpacity>
    </View>
  );
};

export const C26_MultiTagFilter: React.FC = () => {
  const [sel, setSel] = useState(['rapide']);
  const toggle = (t: string) => {
    setSel(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  };
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {['⚡ Rapide', '🔥 Populaire', '🥬 Vegan'].map(tag => (
        <TouchableOpacity
          key={tag}
          onPress={() => toggle(tag)}
          style={[styles.tagSmall, sel.includes(tag) && { backgroundColor: AppColors.primary, borderColor: AppColors.primary }]}
        >
          <Text style={[styles.tagSmallText, sel.includes(tag) && { color: '#FFF' }]}>{tag}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const C27_CookingTimerToggle: React.FC = () => {
  const [running, setRunning] = useState(false);
  return (
    <BouncyPressable onPress={() => setRunning(!running)}>
      <View style={[styles.timerBadge, running && { backgroundColor: '#DC2626' }]}>
        <Clock size={15} color="#FFF" />
        <Text style={styles.btnTextWhite}>{running ? 'Chrono: 25:00 ⏳' : 'Lancer Minuteur ⏰'}</Text>
      </View>
    </BouncyPressable>
  );
};

// ----------------------------------------------------
// 3. CARDS & SURFACES (12 Components)
// ----------------------------------------------------

export const C28_AccordionStepCard: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity onPress={() => setOpen(!open)} style={styles.cardHeaderRow}>
        <Text style={{ fontWeight: '700', fontSize: 13 }}>Étape 1 : Préparation de la sauce</Text>
        <ChevronDown size={18} color="#6B7280" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>
      {open && (
        <Text style={{ fontSize: 12, color: '#4B5563', marginTop: 6, lineHeight: 16 }}>
          Écraser les tomates, les oignons et les piments frais avec un soupçon de gingembre.
        </Text>
      )}
    </View>
  );
};

export const C29_TiltHoverCard: React.FC = () => {
  return (
    <BouncyPressable scaleTo={0.96}>
      <View style={[styles.cardContainer, { backgroundColor: '#FFF2EE', borderColor: '#FFD5CC' }]}>
        <Text style={{ fontWeight: '800', color: AppColors.primary }}>🍲 Amiwo au Poulet Braisé</Text>
        <Text style={{ fontSize: 11, color: '#8C8A87', marginTop: 2 }}>Plat traditionnel du Sud-Bénin • 45 min</Text>
      </View>
    </BouncyPressable>
  );
};

export const C30_ChefSpecialBadgeCard: React.FC = () => {
  return (
    <View style={[styles.cardContainer, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
      <Award size={28} color="#F59E0B" />
      <View>
        <Text style={{ fontWeight: '700', fontSize: 13 }}>Recommandation du Chef ⭐</Text>
        <Text style={{ fontSize: 11, color: '#6B7280' }}>Accompagnez ce plat avec du piment vert</Text>
      </View>
    </View>
  );
};

export const C31_SwipeableMockCard: React.FC = () => {
  return (
    <View style={[styles.cardContainer, { borderLeftWidth: 4, borderLeftColor: '#10B981' }]}>
      <Text style={{ fontWeight: '700' }}>✓ Ingrédient acheté</Text>
      <Text style={{ fontSize: 11, color: '#6B7280' }}>500g de farine de maïs blanc</Text>
    </View>
  );
};

export const C32_GlassmorphismCard: React.FC = () => {
  return (
    <View style={[styles.cardContainer, { backgroundColor: 'rgba(255, 83, 42, 0.08)', borderColor: 'rgba(255, 83, 42, 0.2)' }]}>
      <Text style={{ fontWeight: '800', color: AppColors.primary }}>✨ Carte Glassmorphism</Text>
      <Text style={{ fontSize: 11, color: '#4B5563' }}>Effet verre dépoli moderne avec reflets</Text>
    </View>
  );
};

export const C33_SecretRecipeFlipCard: React.FC = () => {
  const [flipped, setFlipped] = useState(false);
  return (
    <TouchableOpacity onPress={() => setFlipped(!flipped)} style={[styles.cardContainer, { alignItems: 'center' }]}>
      <Text style={{ fontSize: 20 }}>{flipped ? '🧂' : '🔒'}</Text>
      <Text style={{ fontWeight: '700', fontSize: 12, marginTop: 4 }}>
        {flipped ? 'Secret : Ajouter une pincée de sel gemme (Kànwun) !' : 'Toucher pour révéler l’astuce secrète'}
      </Text>
    </TouchableOpacity>
  );
};

export const C34_VoucherScratchCard: React.FC = () => {
  const [revealed, setRevealed] = useState(false);
  return (
    <TouchableOpacity onPress={() => setRevealed(true)} style={[styles.cardContainer, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
      <Text style={{ fontWeight: '800', color: '#92400E' }}>
        {revealed ? '🎁 CODE PROMO : AFROCHEF20 (-20%)' : '🎟️ Grattez pour débloquer votre réduction'}
      </Text>
    </TouchableOpacity>
  );
};

export const C35_StoryBubbleRing: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {['Mireille', 'Koffi', 'Aïcha'].map((name, i) => (
        <View key={name} style={{ alignItems: 'center', gap: 4 }}>
          <View style={[styles.storyRing, i === 0 && { borderColor: AppColors.primary }]}>
            <View style={styles.storyAvatar}><Text style={{ fontSize: 11 }}>👩‍🍳</Text></View>
          </View>
          <Text style={{ fontSize: 10, fontWeight: '600' }}>{name}</Text>
        </View>
      ))}
    </View>
  );
};

export const C36_StatsPillCard: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={styles.miniStat}><Text style={styles.miniStatVal}>🔥 420</Text><Text style={styles.miniStatLbl}>kcal</Text></View>
      <View style={styles.miniStat}><Text style={styles.miniStatVal}>⏱️ 35</Text><Text style={styles.miniStatLbl}>min</Text></View>
      <View style={styles.miniStat}><Text style={styles.miniStatVal}>⚡ Facile</Text><Text style={styles.miniStatLbl}>niveau</Text></View>
    </View>
  );
};

export const C37_HolographicBanner: React.FC = () => {
  return (
    <View style={[styles.cardContainer, { backgroundColor: '#483578' }]}>
      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>⭐ Recette de la Semaine</Text>
      <Text style={{ color: '#E9D5FF', fontSize: 11 }}>Sélectionnée par le Chef Antigravity</Text>
    </View>
  );
};

export const C38_PriceTagPop: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={styles.priceTag}><Text style={styles.priceTagText}>2 500 FCFA</Text></View>
      <Text style={{ fontSize: 12, color: '#6B7280' }}>Ingrédients complets</Text>
    </View>
  );
};

export const C39_DeliveryStatusCard: React.FC = () => {
  return (
    <View style={[styles.cardContainer, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
      <View style={styles.pulsingGreenDot} />
      <Text style={{ fontWeight: '600', fontSize: 12 }}>Marché Tokpa : Épices fraîches disponibles</Text>
    </View>
  );
};

// ----------------------------------------------------
// 4. LOADERS, PROGRESS & SKELETONS (14 Components)
// ----------------------------------------------------

export const C40_ShimmerPulsedBox: React.FC = () => <ShimmerSkeleton width="100%" height={50} borderRadius={12} />;
export const C41_ShimmerAvatar: React.FC = () => <ShimmerSkeleton width={50} height={50} borderRadius={25} />;
export const C42_ShimmerTextLines: React.FC = () => (
  <View style={{ gap: 6, width: '100%' }}>
    <ShimmerSkeleton width="80%" height={14} borderRadius={4} />
    <ShimmerSkeleton width="50%" height={12} borderRadius={4} />
  </View>
);

export const C43_ProgressBarStriped: React.FC = () => {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: '70%', backgroundColor: AppColors.primary }]} />
    </View>
  );
};

export const C44_CookingPotSpinLoader: React.FC = () => {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' })
    ).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <RefreshCw size={24} color={AppColors.primary} />
    </Animated.View>
  );
};

export const C45_BouncingIngredientsLoader: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Text style={{ fontSize: 20 }}>🍅</Text>
      <Text style={{ fontSize: 20 }}>🧅</Text>
      <Text style={{ fontSize: 20 }}>🌶️</Text>
      <Text style={{ fontSize: 20 }}>🌽</Text>
    </View>
  );
};

export const C46_StepWizardProgress: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepNum}>1</Text></View>
      <View style={[styles.stepLine, styles.stepLineActive]} />
      <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepNum}>2</Text></View>
      <View style={styles.stepLine} />
      <View style={styles.stepDot}><Text style={styles.stepNumInactive}>3</Text></View>
    </View>
  );
};

export const C47_CalorieGaugeRing: React.FC = () => {
  return (
    <View style={styles.gaugeRing}>
      <Text style={{ fontWeight: '800', fontSize: 12, color: AppColors.primary }}>75%</Text>
    </View>
  );
};

export const C48_PulsingRadarBeacon: React.FC = () => {
  return (
    <View style={styles.radarWrapper}>
      <View style={styles.radarPulse} />
      <View style={styles.radarCenter} />
    </View>
  );
};

export const C49_HourglassCountdown: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontSize: 18 }}>⏳</Text>
      <Text style={{ fontWeight: '700', fontSize: 13 }}>Temps de mijotage : 18 min restantes</Text>
    </View>
  );
};

export const C50_LiveGreenDot: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={styles.pulsingGreenDot} />
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981' }}>Chef en Ligne & Disponible</Text>
    </View>
  );
};

export const C51_BadgeNotificationPop: React.FC = () => {
  return (
    <View style={{ position: 'relative', width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
      <Bell size={22} color="#000" />
      <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>3</Text></View>
    </View>
  );
};

export const C52_EcoBioBadge: React.FC = () => {
  return (
    <View style={styles.ecoPill}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#065F46' }}>🌱 Ingrédients 100% Bio & Locaux</Text>
    </View>
  );
};

export const C53_HalalOrganicBadge: React.FC = () => {
  return (
    <View style={[styles.ecoPill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E40AF' }}>✓ Viande Fraîche Certifiée</Text>
    </View>
  );
};

// ----------------------------------------------------
// 5. INPUTS, SEARCH & TEXT EFFECTS (12 Components)
// ----------------------------------------------------

export const C54_AnimatedSearchInput: React.FC = () => {
  const [val, setVal] = useState('');
  return (
    <View style={styles.inputBox}>
      <Search size={16} color="#8C8A87" />
      <TextInput
        placeholder="Rechercher un plat (ex: Atassi, Igname...)"
        value={val}
        onChangeText={setVal}
        style={{ flex: 1, fontSize: 12, padding: 0 }}
      />
    </View>
  );
};

export const C55_PasswordEyeInput: React.FC = () => {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.inputBox}>
      <TextInput
        placeholder="Code secret cuisinier"
        secureTextEntry={!show}
        defaultValue="Afrocuisto2026"
        style={{ flex: 1, fontSize: 12, padding: 0 }}
      />
      <TouchableOpacity onPress={() => setShow(!show)}>
        {show ? <EyeOff size={16} color="#8C8A87" /> : <Eye size={16} color="#8C8A87" />}
      </TouchableOpacity>
    </View>
  );
};

export const C56_MicVoiceSearch: React.FC = () => {
  const [rec, setRec] = useState(false);
  return (
    <BouncyPressable onPress={() => setRec(!rec)}>
      <View style={[styles.micBtn, rec && { backgroundColor: '#EF4444' }]}>
        <Mic size={18} color="#FFF" />
        <Text style={styles.btnTextWhite}>{rec ? 'Écoute vocale en cours...' : 'Recherche Vocale 🎙️'}</Text>
      </View>
    </BouncyPressable>
  );
};

export const C57_OTP4DigitBoxes: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {['5', '8', '2', ''].map((n, i) => (
        <View key={i} style={[styles.otpBox, i === 3 && styles.otpBoxActive]}>
          <Text style={{ fontWeight: '800', fontSize: 16 }}>{n}</Text>
        </View>
      ))}
    </View>
  );
};

export const C58_SliderPortionCustom: React.FC = () => {
  return (
    <View style={{ width: '100%', gap: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280' }}>Ajuster le nombre de convives (4)</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '50%', backgroundColor: '#F59E0B' }]} />
      </View>
    </View>
  );
};

export const C59_TypewriterMockText: React.FC = () => {
  return (
    <Text style={{ fontWeight: '700', fontSize: 13, color: AppColors.primary }}>
      "Quel ingrédient as-tu dans ton frigo ?" 💡
    </Text>
  );
};

export const C60_TextHighlightGradient: React.FC = () => {
  return (
    <View style={{ backgroundColor: '#FEF08A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' }}>
      <Text style={{ fontWeight: '700', fontSize: 12, color: '#854D0E' }}>🔥 Ingrédient Clé : Piment vert écrasé</Text>
    </View>
  );
};

export const C61_QuickQuantityAdd: React.FC = () => {
  const [q, setQ] = useState(1);
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 5, 10].map(v => (
        <TouchableOpacity key={v} onPress={() => setQ(v)} style={[styles.qtyBtn, q === v && styles.qtyBtnActive]}>
          <Text style={[styles.qtyBtnText, q === v && { color: '#FFF' }]}>+{v}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const C62_IngredientPillRemovable: React.FC = () => {
  const [visible, setVisible] = useState(true);
  if (!visible) return <Text style={{ fontSize: 11, color: '#8C8A87' }}>Ingrédient retiré (cliquez pour restaurer)</Text>;
  return (
    <TouchableOpacity onPress={() => setVisible(false)} style={styles.tagRemovable}>
      <Text style={{ fontSize: 12, fontWeight: '600' }}>🍅 Tomates fraîches (x3)</Text>
      <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '800', marginLeft: 4 }}>✕</Text>
    </TouchableOpacity>
  );
};

export const C63_CookingTempDial: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 20 }}>🌡️</Text>
      <View>
        <Text style={{ fontWeight: '700', fontSize: 12 }}>Température de friture : 180°C</Text>
        <Text style={{ fontSize: 10, color: '#10B981' }}>Idéal pour des Allocos croustillants</Text>
      </View>
    </View>
  );
};

export const C64_NutritionMacroBadge: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <View style={[styles.macroPill, { backgroundColor: '#E0E7FF' }]}><Text style={styles.macroText}>Protéines 28g</Text></View>
      <View style={[styles.macroPill, { backgroundColor: '#FEF3C7' }]}><Text style={styles.macroText}>Glucides 45g</Text></View>
    </View>
  );
};

export const C65_VoiceWaveformEffect: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {[14, 24, 32, 18, 28, 12, 22].map((h, i) => (
        <View key={i} style={[styles.waveBar, { height: h }]} />
      ))}
    </View>
  );
};

// ----------------------------------------------------
// 6. OVERLAYS, MODALS & TOASTS (10 Components)
// ----------------------------------------------------

export const C66_ToastSuccessSlide: React.FC = () => {
  const [show, setShow] = useState(false);
  return (
    <View style={{ width: '100%', gap: 8 }}>
      <BouncyPressable onPress={() => setShow(!show)}>
        <View style={[styles.demoBtn, { backgroundColor: '#10B981' }]}>
          <Text style={styles.btnTextWhite}>Afficher Toast Succès</Text>
        </View>
      </BouncyPressable>
      {show && (
        <View style={styles.toastSuccess}>
          <ShieldCheck size={16} color="#FFF" />
          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Recette enregistrée dans vos Favoris !</Text>
        </View>
      )}
    </View>
  );
};

export const C67_ToastWarningSlide: React.FC = () => {
  return (
    <View style={[styles.toastSuccess, { backgroundColor: '#F59E0B' }]}>
      <AlertCircle size={16} color="#FFF" />
      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Attention : Plat très épicé ! 🌶️</Text>
    </View>
  );
};

export const C68_TooltipBubble: React.FC = () => {
  return (
    <View style={styles.tooltipBox}>
      <Text style={{ fontSize: 11, color: '#FFF', fontWeight: '600' }}>💡 Astuce : Cuire à feu doux pour préserver les arômes</Text>
    </View>
  );
};

export const C69_ConfettiCelebration: React.FC = () => {
  const [done, setDone] = useState(false);
  return (
    <BouncyPressable onPress={() => setDone(!done)}>
      <View style={[styles.demoBtn, { backgroundColor: '#8B5CF6' }]}>
        <Text style={styles.btnTextWhite}>{done ? '🎉 Félicitations Chef ! 🎉' : 'Valider la recette cuisinée'}</Text>
      </View>
    </BouncyPressable>
  );
};

export const C70_BackToTopRocket: React.FC = () => {
  return (
    <View style={styles.rocketBtn}>
      <Text style={{ fontSize: 16 }}>🚀</Text>
      <Text style={{ fontSize: 10, fontWeight: '700', color: AppColors.primary }}>Haut</Text>
    </View>
  );
};

export const C71_QRCodeShareReveal: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity onPress={() => setOpen(!open)} style={[styles.cardContainer, { alignItems: 'center' }]}>
      <Text style={{ fontWeight: '700', fontSize: 12 }}>{open ? '📲 QR Code Prêt à scanner' : 'Partager la recette via QR Code'}</Text>
      {open && <Text style={{ fontSize: 28, marginTop: 4 }}>🏁</Text>}
    </TouchableOpacity>
  );
};

export const C72_BottomSheetHandleMock: React.FC = () => {
  return (
    <View style={styles.sheetHandleBox}>
      <View style={styles.sheetBar} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280' }}>Glisser vers le haut pour les détails</Text>
    </View>
  );
};

export const C73_TrophyUnlockBanner: React.FC = () => {
  return (
    <View style={[styles.cardContainer, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
      <Text style={{ fontSize: 24 }}>🏆</Text>
      <View>
        <Text style={{ fontWeight: '800', color: '#065F46', fontSize: 12 }}>Badge Débloqué : Maître de l'Atassi</Text>
        <Text style={{ fontSize: 10, color: '#047857' }}>Vous avez cuisiné 5 recettes béninoises !</Text>
      </View>
    </View>
  );
};

export const C74_CookingHelpModal: React.FC = () => {
  return (
    <View style={[styles.cardContainer, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
      <HelpCircle size={18} color={AppColors.primary} />
      <Text style={{ fontSize: 12, fontWeight: '600' }}>Besoin d’aide pour doser les épices ? Demander à l’IA</Text>
    </View>
  );
};

export const C75_TrendingFlameBadge: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <TrendingUp size={16} color="#EF4444" />
      <Text style={{ fontWeight: '800', fontSize: 12, color: '#EF4444' }}>Tendance #1 : Djenkoumé au Poulet</Text>
    </View>
  );
};

// ----------------------------------------------------
// 7. CULINARY MICRO-EFFECTS (10 Components)
// ----------------------------------------------------

export const C76_SteamRisingEffect: React.FC = () => {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 14 }}>♨️ ♨️</Text>
      <Text style={{ fontSize: 22 }}>🍲</Text>
      <Text style={{ fontSize: 10, fontWeight: '700', color: AppColors.primary }}>Servi très chaud</Text>
    </View>
  );
};

export const C77_PepperGrinderEffect: React.FC = () => {
  const [spices, setSpices] = useState(3);
  return (
    <TouchableOpacity onPress={() => setSpices(s => s + 1)} style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>🧂 ✨</Text>
      <Text style={{ fontSize: 11, fontWeight: '700' }}>Moudre du poivre noir ({spices} tours)</Text>
    </TouchableOpacity>
  );
};

export const C78_OilSizzleDrop: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontSize: 20 }}>🍳 🫧</Text>
      <Text style={{ fontSize: 11, fontWeight: '600' }}>Huile à bonne température</Text>
    </View>
  );
};

export const C79_GrillSparksFire: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontSize: 20 }}>🥩 🔥</Text>
      <Text style={{ fontSize: 11, fontWeight: '600' }}>Braisage au feu de bois</Text>
    </View>
  );
};

export const C80_ChefHatTilt: React.FC = () => {
  const [tilted, setTilted] = useState(false);
  return (
    <TouchableOpacity onPress={() => setTilted(!tilted)} style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 24, transform: [{ rotate: tilted ? '20deg' : '0deg' }] }}>👨‍🍳</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', marginTop: 2 }}>Salutation du Chef</Text>
    </TouchableOpacity>
  );
};

export const C81_IngredientFlyToCart: React.FC = () => {
  const [added, setAdded] = useState(false);
  return (
    <BouncyPressable onPress={() => setAdded(!added)}>
      <View style={[styles.demoBtn, { backgroundColor: added ? '#10B981' : AppColors.primary }]}>
        <ShoppingBag size={16} color="#FFF" />
        <Text style={styles.btnTextWhite}>{added ? 'Dans le Panier !' : 'Vol vers Panier 🛍️'}</Text>
      </View>
    </BouncyPressable>
  );
};

export const C82_CocktailShakerMotion: React.FC = () => {
  const [shake, setShake] = useState(false);
  return (
    <TouchableOpacity onPress={() => setShake(!shake)} style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22, transform: [{ rotate: shake ? '-15deg' : '0deg' }] }}>🍹 🧊</Text>
      <Text style={{ fontSize: 11, fontWeight: '700' }}>Secouer le Jus de Bissap Frais</Text>
    </TouchableOpacity>
  );
};

export const C83_ForkKnifeBiteMask: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontSize: 20 }}>🍽️ 😋</Text>
      <Text style={{ fontSize: 11, fontWeight: '700' }}>Dégustation prête !</Text>
    </View>
  );
};

export const C84_SpicyMeterGauge: React.FC = () => {
  return (
    <View style={{ width: '100%', gap: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>Indice Piquant : Fort (7/10)</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '70%', backgroundColor: '#DC2626' }]} />
      </View>
    </View>
  );
};

export const C85_CoffeeSteamBreathe: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Coffee size={20} color="#78350F" />
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#78350F' }}>Café Touba aux épices</Text>
    </View>
  );
};

// ----------------------------------------------------
// 8. ADDITIONAL 15 ADVANCED MICRO-COMPONENTS (86 to 100)
// ----------------------------------------------------

export const C86_ThumbsUpBurst: React.FC = () => {
  const [liked, setLiked] = useState(false);
  return (
    <BouncyPressable onPress={() => setLiked(!liked)}>
      <View style={[styles.demoBtn, { backgroundColor: liked ? '#3B82F6' : '#9CA3AF' }]}>
        <ThumbsUp size={16} color="#FFF" />
        <Text style={styles.btnTextWhite}>{liked ? 'Recommandé !' : 'Recommander'}</Text>
      </View>
    </BouncyPressable>
  );
};

export const C87_PulseMarketBasket: React.FC = () => {
  return (
    <View style={[styles.circleIconBtn, { backgroundColor: '#ECFDF5' }]}>
      <ShoppingBag size={20} color="#10B981" />
    </View>
  );
};

export const C88_InteractiveFilterSlider: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Sliders size={18} color={AppColors.primary} />
      <Text style={{ fontSize: 12, fontWeight: '700' }}>Filtres Recettes Avancés</Text>
    </View>
  );
};

export const C89_CalorieCountPill: React.FC = () => {
  return (
    <View style={styles.caloriePill}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC2626' }}>🔥 380 kcal / portion</Text>
    </View>
  );
};

export const C90_CookingDifficultyPill: React.FC = () => {
  return (
    <View style={[styles.caloriePill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>👨‍🍳 Niveau : Intermédiaire</Text>
    </View>
  );
};

export const C91_BudgetFriendlyBadge: React.FC = () => {
  return (
    <View style={[styles.caloriePill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669' }}>💰 Budget : Économique</Text>
    </View>
  );
};

export const C92_OrganicFarmBadge: React.FC = () => {
  return (
    <View style={[styles.caloriePill, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: '#B45309' }}>🌾 Céréales Locales du Zou</Text>
    </View>
  );
};

export const C93_RecipeTimeCountdownBadge: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Clock size={16} color={AppColors.primary} />
      <Text style={{ fontSize: 12, fontWeight: '700' }}>Préparation : 15 min | Cuisson : 30 min</Text>
    </View>
  );
};

export const C94_VerifiedChefAvatarBadge: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={styles.verifiedAvatar}><Text>👨‍🍳</Text></View>
      <View>
        <Text style={{ fontWeight: '800', fontSize: 12 }}>Chef Dossou</Text>
        <Text style={{ fontSize: 10, color: '#10B981' }}>✓ Recette Certifiée Afrocuisto</Text>
      </View>
    </View>
  );
};

export const C95_AudioGuidePill: React.FC = () => {
  return (
    <View style={[styles.demoBtn, { backgroundColor: '#4B5563', paddingVertical: 8 }]}>
      <Volume2 size={15} color="#FFF" />
      <Text style={[styles.btnTextWhite, { fontSize: 11 }]}>Guide Audio Pas-à-Pas (03:45)</Text>
    </View>
  );
};

export const C96_CommunityLiveBadge: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={styles.pulsingGreenDot} />
      <Text style={{ fontSize: 11, fontWeight: '800', color: '#EF4444' }}>LIVE : 142 cuisiniers en direct</Text>
    </View>
  );
};

export const C97_RecipeSharePill: React.FC = () => {
  return (
    <BouncyPressable>
      <View style={[styles.demoBtn, { backgroundColor: '#3B82F6', paddingVertical: 8 }]}>
        <Share2 size={15} color="#FFF" />
        <Text style={[styles.btnTextWhite, { fontSize: 11 }]}>Partager sur WhatsApp</Text>
      </View>
    </BouncyPressable>
  );
};

export const C98_DownloadOfflinePill: React.FC = () => {
  return (
    <BouncyPressable>
      <View style={[styles.demoBtn, { backgroundColor: '#059669', paddingVertical: 8 }]}>
        <Check size={15} color="#FFF" />
        <Text style={[styles.btnTextWhite, { fontSize: 11 }]}>Disponible Hors-Ligne</Text>
      </View>
    </BouncyPressable>
  );
};

export const C99_SecretIngredientGlow: React.FC = () => {
  return (
    <View style={[styles.cardContainer, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
      <Text style={{ fontWeight: '800', color: '#B45309', fontSize: 12 }}>✨ Touche Finale du Chef</Text>
      <Text style={{ fontSize: 11, color: '#78350F' }}>Arroser d’une cuillère d’huile rouge fumante au moment de servir.</Text>
    </View>
  );
};

export const C100_UltimateMasterChefCard: React.FC = () => {
  return (
    <View style={[styles.cardContainer, { backgroundColor: '#483578', borderColor: '#6D28D9', padding: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 24 }}>🎖️</Text>
        <View>
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Grand Maître Cuisto 2026</Text>
          <Text style={{ color: '#DDD6FE', fontSize: 11 }}>100+ micro-animations prêtes à l’emploi !</Text>
        </View>
      </View>
    </View>
  );
};

// ----------------------------------------------------
// COMPLETE LIST OF 100 COMPONENTS METADATA
// ----------------------------------------------------
export const ALL_100_COMPONENTS = [
  { id: 1, title: 'Bouton Rebond Élastique', category: 'Boutons', desc: 'Animation de ressort dynamique à la pression', Component: C01_BouncyButton },
  { id: 2, title: 'Bouton Pulsation Flamme', category: 'Boutons', desc: 'Respiration continue pour actions urgentes/chaudes', Component: C02_PulseFlameButton },
  { id: 3, title: 'Bouton Shimmer Glow', category: 'Boutons', desc: 'Lueur luminescente périodique', Component: C03_ShimmerGlowButton },
  { id: 4, title: 'Double Tap Coeur Like', category: 'Boutons', desc: 'Pop-in élastique et agrandissement au toucher', Component: C04_DoubleTapHeart },
  { id: 5, title: 'Bouton Morphing Valider', category: 'Boutons', desc: 'Transition fluide du plus vers la coche validée', Component: C05_MorphingCheckButton },
  { id: 6, title: 'Bouton Onde Circulaire', category: 'Boutons', desc: 'Cercle interactif avec micro-rebond', Component: C06_RippleCircleButton },
  { id: 7, title: 'Bouton Contour Ressort', category: 'Boutons', desc: 'Style minimaliste avec retour haptique visuel', Component: C07_OutlineBounceButton },
  { id: 8, title: 'Bouton Pression 3D', category: 'Boutons', desc: 'Enfoncement physique avec ombrage dynamique', Component: C08_Neumorph3DPush },
  { id: 9, title: 'FAB Menu Flottant (Speed Dial)', category: 'Boutons', desc: 'Déploiement en arc des actions rapides', Component: C09_SpeedDialFAB },
  { id: 10, title: 'Bouton Glisser pour Confirmer', category: 'Boutons', desc: 'Glissière anti-erreur avec validation', Component: C10_SwipeConfirmBtn },
  { id: 11, title: 'Bouton Guide Vocal Audio', category: 'Boutons', desc: 'Indicateur de lecture audio actif', Component: C11_SoundWaveBtn },
  { id: 12, title: 'Bouton Étoile Favori Particules', category: 'Boutons', desc: 'Salve de particules dorées', Component: C12_StarRatingBurst },
  { id: 13, title: 'Bouton Signet Particules', category: 'Boutons', desc: 'Salve de particules orange Afrocuisto', Component: C13_BookmarkBurst },
  { id: 14, title: 'Bouton Supprimer Destructif', category: 'Boutons', desc: 'Confirmation visuelle immédiate rouge', Component: C14_DestructiveShakeBtn },
  { id: 15, title: 'Pilule Filtre Magnétique', category: 'Boutons', desc: 'Sélection d’étiquette avec rebond', Component: C15_MagneticTagBtn },

  { id: 16, title: 'Checkbox Radix Primaire', category: 'Formulaires', desc: 'Coche élastique avec rebond Spring', Component: C16_RadixPrimaryCheckbox },
  { id: 17, title: 'Checkbox Radix Émeraude', category: 'Formulaires', desc: 'Variante verte de succès', Component: C17_RadixSuccessCheckbox },
  { id: 18, title: 'Grande Checkbox (Taille LG)', category: 'Formulaires', desc: 'Idéale pour les personnes âgées / gros doigts', Component: C18_RadixLargeCheckbox },
  { id: 19, title: 'Switch Toggle iOS Fluide', category: 'Formulaires', desc: 'Interrupteur à glissement amorti', Component: C19_SpringSwitchToggle },
  { id: 20, title: 'Toggle Jour / Nuit Solaire', category: 'Formulaires', desc: 'Basculement Thème Clair/Sombre avec icône', Component: C20_DayNightToggle },
  { id: 21, title: 'Bouton Radio Point Expansif', category: 'Formulaires', desc: 'Sélection unique avec onde concentrique', Component: C21_RadioRippleDot },
  { id: 22, title: 'Sélecteur d’Étoiles Avis', category: 'Formulaires', desc: 'Notation interactive 1 à 5 étoiles', Component: C22_StarRatingPicker },
  { id: 23, title: 'Jauge Piment / Épices', category: 'Formulaires', desc: 'Sélection du niveau de piment (1 à 4 flammes)', Component: C23_ChiliSpiceSelector },
  { id: 24, title: 'Stepper Portions / Convives', category: 'Formulaires', desc: 'Incrémentation souple du nombre de personnes', Component: C24_PortionStepper },
  { id: 25, title: 'Pill Segmentée Glissante', category: 'Formulaires', desc: 'Boutons radios connectés avec fond actif', Component: C25_SegmentedPill },
  { id: 26, title: 'Filtre Multi-Tags Actifs', category: 'Formulaires', desc: 'Tags cumulables avec changement de couleur', Component: C26_MultiTagFilter },
  { id: 27, title: 'Bouton Minuteur de Cuisson', category: 'Formulaires', desc: 'Chronomètre interactif avec alerte', Component: C27_CookingTimerToggle },

  { id: 28, title: 'Carte Accordéon Étape', category: 'Cartes', desc: 'Déroulement fluide des détails de cuisson', Component: C28_AccordionStepCard },
  { id: 29, title: 'Carte Recette avec Rebond', category: 'Cartes', desc: 'Micro-zoom et compression au toucher', Component: C29_TiltHoverCard },
  { id: 30, title: 'Badge Conseil du Chef', category: 'Cartes', desc: 'Mise en avant stylisée avec trophée', Component: C30_ChefSpecialBadgeCard },
  { id: 31, title: 'Carte Ingrédient Checké', category: 'Cartes', desc: 'Indicateur latéral vert de validation', Component: C31_SwipeableMockCard },
  { id: 32, title: 'Carte Glassmorphism Dépolie', category: 'Cartes', desc: 'Effet de transparence raffiné', Component: C32_GlassmorphismCard },
  { id: 33, title: 'Carte Recette Secrète Révélable', category: 'Cartes', desc: 'Dévoilement interactif de l’astuce magique', Component: C33_SecretRecipeFlipCard },
  { id: 34, title: 'Ticket Promo à Gratter', category: 'Cartes', desc: 'Découverte ludique d’un code de réduction', Component: C34_VoucherScratchCard },
  { id: 35, title: 'Cercles Stories Cuisiniers', category: 'Cartes', desc: 'Anneaux dégradés façon réseaux sociaux', Component: C35_StoryBubbleRing },
  { id: 36, title: 'Capsules Statistiques Calories', category: 'Cartes', desc: 'Indicateurs nutritionnels compacts', Component: C36_StatsPillCard },
  { id: 37, title: 'Bannière Holographique', category: 'Cartes', desc: 'Mise en avant premium de la recette phare', Component: C37_HolographicBanner },
  { id: 38, title: 'Étiquette Prix Flottante', category: 'Cartes', desc: 'Badge de coût estimatif du plat', Component: C38_PriceTagPop },
  { id: 39, title: 'Carte Disponibilité Marché', category: 'Cartes', desc: 'Indicateur en temps réel de stock frais', Component: C39_DeliveryStatusCard },

  { id: 40, title: 'Squelette Shimmer Rectangle', category: 'Squelettes', desc: 'Pulsation douce sans bordure parasite', Component: C40_ShimmerPulsedBox },
  { id: 41, title: 'Squelette Shimmer Avatar Rond', category: 'Squelettes', desc: 'Placeholder pour photo de profil ou chef', Component: C41_ShimmerAvatar },
  { id: 42, title: 'Squelette Lignes de Texte', category: 'Squelettes', desc: 'Prévisualisation de paragraphe de recette', Component: C42_ShimmerTextLines },
  { id: 43, title: 'Barre de Progression Linéaire', category: 'Squelettes', desc: 'Avancement de préparation de recette', Component: C43_ProgressBarStriped },
  { id: 44, title: 'Loader Marmite Tournante', category: 'Squelettes', desc: 'Rotation 360° fluide continue', Component: C44_CookingPotSpinLoader },
  { id: 45, title: 'Loader Ingrédients Rebonds', category: 'Squelettes', desc: 'Légumes et condiments animés', Component: C45_BouncingIngredientsLoader },
  { id: 46, title: 'Fil d’Ariane Étapes Wizard', category: 'Squelettes', desc: 'Numérotation 1-2-3 connectée', Component: C46_StepWizardProgress },
  { id: 47, title: 'Anneau Jauge Circulaire', category: 'Squelettes', desc: 'Pourcentage de cuisson ou nutriments', Component: C47_CalorieGaugeRing },
  { id: 48, title: 'Balise Radar Ondes', category: 'Squelettes', desc: 'Onde concentrique de géolocalisation d’épicerie', Component: C48_PulsingRadarBeacon },
  { id: 49, title: 'Minuteur Sablier Dynamique', category: 'Squelettes', desc: 'Décompte temps réel de mijotage', Component: C49_HourglassCountdown },
  { id: 50, title: 'Pastille Chef En Ligne', category: 'Squelettes', desc: 'Point vert clignotant de présence', Component: C50_LiveGreenDot },
  { id: 51, title: 'Badge Cloche Notification', category: 'Squelettes', desc: 'Compteur numérique avec pop', Component: C51_BadgeNotificationPop },
  { id: 52, title: 'Badge Bio & Écologique', category: 'Squelettes', desc: 'Label vert de traçabilité locale', Component: C52_EcoBioBadge },
  { id: 53, title: 'Badge Viande Certifiée', category: 'Squelettes', desc: 'Garantie de qualité bouchère', Component: C53_HalalOrganicBadge },

  { id: 54, title: 'Champ Recherche Animé', category: 'Inputs', desc: 'Barre de saisie avec icône loupe', Component: C54_AnimatedSearchInput },
  { id: 55, title: 'Champ Mot de Passe avec Œil', category: 'Inputs', desc: 'Masquer / Démasquer le code secret', Component: C55_PasswordEyeInput },
  { id: 56, title: 'Bouton Micro Recherche Vocale', category: 'Inputs', desc: 'Enregistrement vocal interactif', Component: C56_MicVoiceSearch },
  { id: 57, title: 'Cases Code OTP 4 Chiffres', category: 'Inputs', desc: 'Validation SMS / code cuisinier', Component: C57_OTP4DigitBoxes },
  { id: 58, title: 'Slider Glissant Portion Convives', category: 'Inputs', desc: 'Réglage rapide du nombre de personnes', Component: C58_SliderPortionCustom },
  { id: 59, title: 'Texte Effet Machine à Écrire', category: 'Inputs', desc: 'Invitation dynamique à cuisiner', Component: C59_TypewriterMockText },
  { id: 60, title: 'Surlignage Dégradé Ingrédient Clé', category: 'Inputs', desc: 'Mise en valeur fluo des secrets de recette', Component: C60_TextHighlightGradient },
  { id: 61, title: 'Sélecteur Rapide Quantité (+1, +2...)', category: 'Inputs', desc: 'Boutons d’ajout direct au panier', Component: C61_QuickQuantityAdd },
  { id: 62, title: 'Pilule Ingrédient Retirable (✕)', category: 'Inputs', desc: 'Suppression facile d’un allergène', Component: C62_IngredientPillRemovable },
  { id: 63, title: 'Thermomètre Température Friture', category: 'Inputs', desc: 'Indicateur idéal pour Allocos croustillants', Component: C63_CookingTempDial },
  { id: 64, title: 'Badges Macros Protéines & Glucides', category: 'Inputs', desc: 'Répartition énergétique du plat', Component: C64_NutritionMacroBadge },
  { id: 65, title: 'Spectre Sonore Onde Vocale', category: 'Inputs', desc: 'Barres oscillantes de lecture audio', Component: C65_VoiceWaveformEffect },

  { id: 66, title: 'Toast Notification Succès', category: 'Overlays', desc: 'Bannière de confirmation déroulante', Component: C66_ToastSuccessSlide },
  { id: 67, title: 'Toast Notification Piment Fort', category: 'Overlays', desc: 'Alerte piquant orange pour l’utilisateur', Component: C67_ToastWarningSlide },
  { id: 68, title: 'Bulle Infobulle Astuce Cuisson', category: 'Overlays', desc: 'Conseil contextuel noir mat', Component: C68_TooltipBubble },
  { id: 69, title: 'Célébration Confettis Chef', category: 'Overlays', desc: 'Fête après avoir terminé la recette', Component: C69_ConfettiCelebration },
  { id: 70, title: 'Bouton Fusée Retour en Haut', category: 'Overlays', desc: 'Remontée immédiate fluide', Component: C70_BackToTopRocket },
  { id: 71, title: 'Partage Recette par QR Code', category: 'Overlays', desc: 'Transmission rapide entre téléphones', Component: C71_QRCodeShareReveal },
  { id: 72, title: 'Barre de Poignée BottomSheet', category: 'Overlays', desc: 'Tirette de panneau rétractable', Component: C72_BottomSheetHandleMock },
  { id: 73, title: 'Bannière Trophée Débloqué', category: 'Overlays', desc: 'Gamification et récompense culinaire', Component: C73_TrophyUnlockBanner },
  { id: 74, title: 'Dialogue Aide & Épices', category: 'Overlays', desc: 'Assistance instantanée par l’IA', Component: C74_CookingHelpModal },
  { id: 75, title: 'Badge Tendance Recette #1', category: 'Overlays', desc: 'Plat le plus cuisiné de la journée', Component: C75_TrendingFlameBadge },

  { id: 76, title: 'Vapeur Fumante sur Plat Chaud', category: 'Cuisine', desc: 'Effet de plat fraîchement mijoté', Component: C76_SteamRisingEffect },
  { id: 77, title: 'Moulin à Poivre Épices', category: 'Cuisine', desc: 'Assaisonnement interactif au clic', Component: C77_PepperGrinderEffect },
  { id: 78, title: 'Bulles de Friture à l’Huile', category: 'Cuisine', desc: 'Crépitement de cuisson pour beignets', Component: C78_OilSizzleDrop },
  { id: 79, title: 'Étincelles de Braise Poulet', category: 'Cuisine', desc: 'Ambiance grillade au feu de bois', Component: C79_GrillSparksFire },
  { id: 80, title: 'Toque de Chef Inclinable', category: 'Cuisine', desc: 'Salutation respectueuse du chef cuisinier', Component: C80_ChefHatTilt },
  { id: 81, title: 'Vol d’Ingrédient vers Panier', category: 'Cuisine', desc: 'Ajout spectaculaire dans la liste de courses', Component: C81_IngredientFlyToCart },
  { id: 82, title: 'Shaker Cocktail Bissap Frais', category: 'Cuisine', desc: 'Mélange dynamique de glace et sirop', Component: C82_CocktailShakerMotion },
  { id: 83, title: 'Dégustation Fourchette & Couteau', category: 'Cuisine', desc: 'Service à table prêt à savourer', Component: C83_ForkKnifeBiteMask },
  { id: 84, title: 'Jauge Piment Scoville', category: 'Cuisine', desc: 'Intensité du piment rouge de Cotonou', Component: C84_SpicyMeterGauge },
  { id: 85, title: 'Tasse Café Touba Fumant', category: 'Cuisine', desc: 'Boisson tonique aux grains de selim', Component: C85_CoffeeSteamBreathe },

  { id: 86, title: 'Bouton Pouce Recommander', category: 'Micro-effets', desc: 'Vote communautaire d’approbation', Component: C86_ThumbsUpBurst },
  { id: 87, title: 'Panier Courses Pulsant', category: 'Micro-effets', desc: 'Rappel d’ingrédients en attente', Component: C87_PulseMarketBasket },
  { id: 88, title: 'Curseurs de Filtre Cuisine', category: 'Micro-effets', desc: 'Paramétrage temps et budget', Component: C88_InteractiveFilterSlider },
  { id: 89, title: 'Pastille Calories / Portion', category: 'Micro-effets', desc: 'Suivi diététique précis', Component: C89_CalorieCountPill },
  { id: 90, title: 'Pastille Difficulté Recette', category: 'Micro-effets', desc: 'Indicateur Facile / Intermédiaire / Expert', Component: C90_CookingDifficultyPill },
  { id: 91, title: 'Badge Budget Économique', category: 'Micro-effets', desc: 'Plat accessible à petit prix', Component: C91_BudgetFriendlyBadge },
  { id: 92, title: 'Badge Céréales Terroir du Zou', category: 'Micro-effets', desc: 'Origine et terroir béninois certifiés', Component: C92_OrganicFarmBadge },
  { id: 93, title: 'Temps Prep vs Cuisson', category: 'Micro-effets', desc: 'Détail chronologique de préparation', Component: C93_RecipeTimeCountdownBadge },
  { id: 94, title: 'Avatar Chef Certifié', category: 'Micro-effets', desc: 'Badge officiel de cuisinier professionnel', Component: C94_VerifiedChefAvatarBadge },
  { id: 95, title: 'Pilule Podcast Audio Recette', category: 'Micro-effets', desc: 'Lecteur audio compact pour cuisiner les mains libres', Component: C95_AudioGuidePill },
  { id: 96, title: 'Indicateur Cuisiniers en Ligne', category: 'Micro-effets', desc: 'Compteur live de passionnés en cuisine', Component: C96_CommunityLiveBadge },
  { id: 97, title: 'Bouton Partage WhatsApp', category: 'Micro-effets', desc: 'Envoi direct de la fiche recette aux amis', Component: C97_RecipeSharePill },
  { id: 98, title: 'Badge Mode Hors-Ligne', category: 'Micro-effets', desc: 'Recette sauvegardée sans connexion internet', Component: C98_DownloadOfflinePill },
  { id: 99, title: 'Encadré Huile Rouge Fumante', category: 'Micro-effets', desc: 'L’art de la touche finale béninoise', Component: C99_SecretIngredientGlow },
  { id: 100, title: 'Carte Maître Cuisto 2026', category: 'Micro-effets', desc: 'Le récapitulatif ultime de toutes les micro-interactions', Component: C100_UltimateMasterChefCard },
];

const styles = StyleSheet.create({
  catalogCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  catalogCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeIndex: {
    backgroundColor: '#FFF2EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: AppColors.primary,
  },
  catalogCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  catalogCardCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8C8A87',
    textTransform: 'uppercase',
  },
  catalogCardDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  previewCanvas: {
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  btnTextWhite: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  iconCenterBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF2EE',
  },
  circleIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTrack: {
    width: '100%',
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 8,
  },
  sliderThumb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagPillActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
  },
  radioRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.primary,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  segTrack: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 3,
  },
  segBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  segBtnActive: {
    backgroundColor: '#FFF',
  },
  segText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  segTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  tagSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  tagSmallText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  cardContainer: {
    width: '100%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStat: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  miniStatVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  miniStatLbl: {
    fontSize: 9,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  priceTag: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priceTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: AppColors.primary,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  stepLineActive: {
    backgroundColor: AppColors.primary,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  stepNumInactive: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  gaugeRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPulse: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 83, 42, 0.25)',
  },
  radarCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: AppColors.primary,
  },
  pulsingGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  ecoPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
  },
  micBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#374151',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  otpBox: {
    width: 36,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: AppColors.primary,
    backgroundColor: '#FFF2EE',
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  qtyBtnActive: {
    backgroundColor: AppColors.primary,
  },
  qtyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagRemovable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  macroPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  macroText: {
    fontSize: 11,
    fontWeight: '700',
  },
  waveBar: {
    width: 4,
    backgroundColor: AppColors.primary,
    borderRadius: 2,
  },
  toastSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    width: '100%',
  },
  tooltipBox: {
    backgroundColor: '#1E1D1B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  rocketBtn: {
    alignItems: 'center',
    backgroundColor: '#FFF2EE',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD5CC',
  },
  sheetHandleBox: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  sheetBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  caloriePill: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  verifiedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF2EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
