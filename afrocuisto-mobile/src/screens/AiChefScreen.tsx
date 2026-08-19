import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  RotateCcw,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Bot,
  User,
  ChefHat,
  Info,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../theme/colors';
import { AiChefMessage } from '../types/aiChef';
import { AiChefService } from '../services/aiChefService';
import { AiRecipeCard } from '../components/ai/AiRecipeCard';
import { ShimmerSkeleton } from '../components/common/ShimmerSkeleton';
import { BouncyPressable } from '../components/common/BouncyPressable';

// Liste officielle des chips d'ingrédients rapides spécifiée
const QUICK_INGREDIENT_CHIPS = [
  { id: 'poulet', label: '🍗 Poulet', query: 'Poulet' },
  { id: 'poisson', label: '🐟 Poisson', query: 'Poisson' },
  { id: 'tomates', label: '🍅 Tomates', query: 'Tomates' },
  { id: 'plantain', label: '🍌 Plantain', query: 'Plantain' },
  { id: 'oignon', label: '🧅 Oignon', query: 'Oignon' },
  { id: 'gboman', label: '🥬 Gboman', query: 'Gboman' },
  { id: 'igname', label: '🍠 Igname', query: 'Igname' },
];

const INITIAL_WELCOME_MESSAGE: AiChefMessage = {
  id: 'welcome_1',
  sender: 'ai',
  text: 'Bienvenue dans votre Frigo Magique ! 🍲 Dites-moi quels ingrédients vous avez sous la main, et je compose immédiatement une délicieuse recette africaine sur mesure.',
  timestamp: Date.now(),
};

export const AiChefScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<AiChefMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Animation pour le mode micro / écoute vocale
  const micPulseAnim = useRef(new Animated.Value(1)).current;

  // Lancer l'animation de pulsation du micro
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (isListening) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.25,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      micPulseAnim.setValue(1);
    }
    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [isListening]);

  // Traiter un ingrédient passé en paramètre de navigation
  useEffect(() => {
    if (route.params?.initialIngredient) {
      const ing = route.params.initialIngredient;
      handleProcessQuery(`J'ai ${ing} dans mon frigo`);
    }
  }, [route.params?.initialIngredient]);

  // Scroll automatique vers le bas à chaque nouveau message
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const handleProcessQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isGenerating) return;

    const userMsg: AiChefMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);
    scrollToBottom();

    try {
      const response = await AiChefService.processUserMessage(trimmed);
      const aiMsg: AiChefMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: response.text,
        recipe: response.recipe,
        isGuardrail: response.isGuardrail,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const errorMsg: AiChefMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: "Désolé, une petite coupure est survenue. Veuillez réessayer d'indiquer vos ingrédients.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
      scrollToBottom();
    }
  };

  const handleSend = () => {
    handleProcessQuery(input);
  };

  // Clic sur un quick chip
  const handleChipPress = (chipQuery: string) => {
    if (input.trim().length === 0) {
      setInput(chipQuery);
    } else if (!input.toLowerCase().includes(chipQuery.toLowerCase())) {
      setInput(prev => `${prev.trim()}, ${chipQuery}`);
    }
  };

  // Vider / Réinitialiser la conversation
  const handleReset = () => {
    setMessages([
      {
        ...INITIAL_WELCOME_MESSAGE,
        id: `welcome_${Date.now()}`,
        timestamp: Date.now(),
      },
    ]);
    setInput('');
    setIsGenerating(false);
    setIsListening(false);
  };

  // Bascule Saisie Vocale Micro
  const toggleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      // Simulation intelligente de dictée vocale
      setTimeout(() => {
        setInput(prev =>
          prev ? `${prev}, Poulet et Tomates` : 'Poulet, Tomates fraîches et Plantain'
        );
        setIsListening(false);
      }, 2200);
    } else {
      setIsListening(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: isDark ? AppColors.backgroundDark : '#F9FAFB',
        },
      ]}
      edges={['top', 'left', 'right']}
    >
      {/* 1. En-tête (Header) */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
            borderBottomColor: isDark ? AppColors.borderDark : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        {/* Bouton Retour (←) */}
        <TouchableOpacity
          style={[
            styles.headerBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F4F0',
            },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft
            size={22}
            color={isDark ? AppColors.textDarkPrimary : AppColors.textPrimary}
          />
        </TouchableOpacity>

        {/* Titre & Sous-titre */}
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text
              style={[
                styles.headerTitle,
                { color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary },
              ]}
            >
              🧑‍🍳 Frigo Magique
            </Text>
          </View>
          <Text
            style={[
              styles.headerSubtitle,
              { color: isDark ? AppColors.textDarkSecondary : AppColors.textSecondary },
            ]}
          >
            Assistant AfroCuisto
          </Text>
        </View>

        {/* Bouton Reset / Nouveau */}
        <TouchableOpacity
          style={[
            styles.headerBtn,
            {
              backgroundColor: isDark ? 'rgba(251, 86, 7, 0.12)' : 'rgba(251, 86, 7, 0.08)',
            },
          ]}
          activeOpacity={0.8}
          onPress={handleReset}
          accessibilityLabel="Réinitialiser la discussion"
        >
          <RotateCcw size={18} color={AppColors.primary} strokeWidth={2.3} />
        </TouchableOpacity>
      </View>

      {/* 2. Zone de suggestions rapides (Quick Chips) */}
      <View
        style={[
          styles.quickChipsBar,
          {
            backgroundColor: isDark ? '#181615' : '#FFFFFF',
            borderBottomColor: isDark ? AppColors.borderDark : '#EFECE6',
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          <View style={styles.chipsLabelContainer}>
            <Sparkles size={12} color={AppColors.primary} />
            <Text style={styles.chipsLabel}>Idées :</Text>
          </View>

          {QUICK_INGREDIENT_CHIPS.map(chip => (
            <BouncyPressable
              key={chip.id}
              style={[
                styles.quickChip,
                {
                  backgroundColor: isDark ? '#262422' : '#F5F3EF',
                  borderColor: isDark ? '#383531' : 'rgba(0,0,0,0.06)',
                },
              ]}
              onPress={() => handleChipPress(chip.query)}
            >
              <Text
                style={[
                  styles.quickChipText,
                  {
                    color: isDark ? '#F0EDE6' : AppColors.textPrimary,
                  },
                ]}
              >
                {chip.label}
              </Text>
            </BouncyPressable>
          ))}
        </ScrollView>
      </View>

      {/* 3. Zone de messages & Cartes de résultats IA */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map(msg => {
            const isAi = msg.sender === 'ai';

            // Si c'est un message AI avec une carte recette structurée
            if (isAi && msg.recipe) {
              return (
                <View key={msg.id} style={styles.recipeMessageContainer}>
                  <View style={styles.aiAuthorHeader}>
                    <View style={styles.avatarAi}>
                      <Bot size={15} color="#FFFFFF" strokeWidth={2.4} />
                    </View>
                    <Text
                      style={[
                        styles.aiAuthorName,
                        { color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary },
                      ]}
                    >
                      Chef IA AfroCuisto
                    </Text>
                  </View>

                  <AiRecipeCard recipe={msg.recipe} />
                </View>
              );
            }

            // Messages textes standards (Garde-fous, accueil, ou messages de l'utilisateur)
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isAi ? styles.messageRowLeft : styles.messageRowRight,
                ]}
              >
                {isAi && (
                  <View style={styles.avatarAi}>
                    <Bot size={15} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isAi
                      ? [
                          styles.bubbleAi,
                          {
                            backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
                            borderColor: msg.isGuardrail
                              ? 'rgba(251, 86, 7, 0.4)'
                              : isDark
                              ? AppColors.borderDark
                              : 'rgba(0,0,0,0.06)',
                          },
                        ]
                      : styles.bubbleUser,
                  ]}
                >
                  {msg.isGuardrail && (
                    <View style={styles.guardrailHeader}>
                      <ChefHat size={14} color={AppColors.primary} />
                      <Text style={styles.guardrailTitle}>Expertise Culinaire</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      {
                        color: isAi
                          ? isDark
                            ? '#F8F6F0'
                            : AppColors.textPrimary
                          : '#FFFFFF',
                        fontWeight: isAi ? '500' : '600',
                      },
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>

                {!isAi && (
                  <View style={styles.avatarUser}>
                    <User size={15} color="#FFFFFF" strokeWidth={2.4} />
                  </View>
                )}
              </View>
            );
          })}

          {/* Skeleton pendant la génération IA */}
          {isGenerating && (
            <View style={styles.generatingCardContainer}>
              <View style={styles.aiAuthorHeader}>
                <View style={styles.avatarAi}>
                  <Bot size={15} color="#FFFFFF" strokeWidth={2.4} />
                </View>
                <Text
                  style={[
                    styles.aiAuthorName,
                    { color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary },
                  ]}
                >
                  Chef IA en cours d'élaboration...
                </Text>
              </View>

              <View
                style={[
                  styles.skeletonCard,
                  {
                    backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
                    borderColor: isDark ? AppColors.borderDark : 'rgba(251, 86, 7, 0.15)',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <ShimmerSkeleton width={70} height={22} borderRadius={10} />
                  <ShimmerSkeleton width={60} height={22} borderRadius={10} />
                </View>
                <ShimmerSkeleton width="80%" height={22} borderRadius={6} style={{ marginTop: 8 }} />
                <ShimmerSkeleton width="100%" height={55} borderRadius={12} style={{ marginTop: 8 }} />
                <ShimmerSkeleton width="100%" height={45} borderRadius={12} style={{ marginTop: 6 }} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* 4. Barre de saisie inférieure (Input Bar) */}
        <SafeAreaView
          edges={['bottom']}
          style={[
            styles.inputBarSafeArea,
            {
              backgroundColor: isDark ? AppColors.surfaceDark : '#FFFFFF',
              borderTopColor: isDark ? AppColors.borderDark : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          {isListening && (
            <View style={styles.listeningBanner}>
              <Text style={styles.listeningBannerText}>
                🎙️ Écoute en cours... Dites vos ingrédients
              </Text>
            </View>
          )}

          <View style={styles.inputRow}>
            {/* Bouton Micro 🎙️ */}
            <Animated.View style={{ transform: [{ scale: micPulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.micBtn,
                  isListening
                    ? styles.micBtnActive
                    : {
                        backgroundColor: isDark ? '#262422' : '#F5F3EF',
                        borderColor: isDark ? '#3A3733' : '#EAE7E0',
                      },
                ]}
                activeOpacity={0.8}
                onPress={toggleVoiceInput}
                accessibilityLabel="Saisie vocale"
              >
                {isListening ? (
                  <MicOff size={18} color="#FFFFFF" strokeWidth={2.4} />
                ) : (
                  <Mic
                    size={18}
                    color={isDark ? '#D1CDCA' : '#5A5856'}
                    strokeWidth={2.2}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Champ texte épuré */}
            <TextInput
              style={[
                styles.textInput,
                {
                  color: isDark ? '#FFFFFF' : AppColors.textPrimary,
                  backgroundColor: isDark ? '#121110' : '#F9FAFB',
                  borderColor: isDark ? '#2B2927' : '#E8E5DF',
                },
              ]}
              placeholder="Ex: 2 œufs, tomates, piment..."
              placeholderTextColor="#8C8A87"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isGenerating}
            />

            {/* Bouton d'envoi contrasté avec l'accent de l'app */}
            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  opacity: input.trim().length > 0 && !isGenerating ? 1 : 0.45,
                },
              ]}
              activeOpacity={0.82}
              onPress={handleSend}
              disabled={input.trim().length === 0 || isGenerating}
            >
              <Send size={17} color="#FFFFFF" strokeWidth={2.6} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  quickChipsBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  chipsScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  chipsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 2,
  },
  chipsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.primary,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  recipeMessageContainer: {
    gap: 8,
    marginVertical: 4,
  },
  aiAuthorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 2,
  },
  aiAuthorName: {
    fontSize: 12,
    fontWeight: '800',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 2,
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarAi: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUser: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
  },
  bubbleAi: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: AppColors.primary,
    borderBottomRightRadius: 4,
  },
  guardrailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  guardrailTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: AppColors.primary,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 19.5,
  },
  generatingCardContainer: {
    gap: 8,
    marginVertical: 4,
  },
  skeletonCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.2,
    gap: 8,
  },
  inputBarSafeArea: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  listeningBanner: {
    backgroundColor: 'rgba(251, 86, 7, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    alignSelf: 'center',
  },
  listeningBannerText: {
    color: AppColors.primary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 13.5,
    borderWidth: 1,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
});
