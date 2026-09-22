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
  Volume2,
  VolumeX,
  ArrowRight,
  Flame,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../theme/colors';
import { AiChefMessage, AiChefRecipeResult } from '../types/aiChef';
import { AiChefService } from '../services/aiChefService';
import { StorageService } from '../services/storage';
import { AiRecipeCard } from '../components/ai/AiRecipeCard';
import { expressiveVoiceService } from '../services/expressiveVoiceService';
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

const STORAGE_KEY_AI_CHEF_MESSAGES = 'afrocuisto_ai_chef_messages';

const INITIAL_WELCOME_MESSAGE: AiChefMessage = {
  id: 'welcome_1',
  sender: 'ai',
  text: 'Bienvenue dans votre Frigo Magique ! 🍲 Dites-moi quels ingrédients vous avez sous la main ou maintenez le bouton micro pour parler, et je compose immédiatement une délicieuse recette africaine sur mesure.',
  timestamp: Date.now(),
  reactionEmoji: '👋',
  quickSuggestions: [
    'Poulet, tomates et plantains',
    'Poisson fumé et légumes gboman',
    'Que faire avec de l’igname ?',
  ],
};

const THINKING_MESSAGES = [
  '🧑‍🍳 Le Chef IA analyse votre demande...',
  '🎙️ Écoute attentive de vos ingrédients...',
  '🌿 Sélection des épices et herbes du terroir...',
  '🍲 Composition de la recette africaine idéale...',
  '✨ Ajustement des temps de cuisson et astuces...',
];

export const AiChefScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<AiChefMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Animations pour le mode micro / ondes sonores
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const soundWaveAnim1 = useRef(new Animated.Value(6)).current;
  const soundWaveAnim2 = useRef(new Animated.Value(14)).current;
  const soundWaveAnim3 = useRef(new Animated.Value(20)).current;
  const soundWaveAnim4 = useRef(new Animated.Value(10)).current;

  // Références d'enregistrement audio natif / web
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<any>(null);

  // 1. Charger l'historique des conversations
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      try {
        const stored = await StorageService.getItem<AiChefMessage[] | null>(
          STORAGE_KEY_AI_CHEF_MESSAGES,
          null
        );
        if (isMounted && stored && Array.isArray(stored) && stored.length > 0) {
          setMessages(stored);
        }
      } catch (e) {
        console.error('Erreur initialisation AI Chef:', e);
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };
    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Sauvegarder automatiquement les messages à chaque mise à jour
  useEffect(() => {
    if (isLoaded) {
      StorageService.setItem(STORAGE_KEY_AI_CHEF_MESSAGES, messages);
    }
  }, [messages, isLoaded]);

  // Rotation des messages de réflexion du Chef pendant la génération
  useEffect(() => {
    let timer: any = null;
    if (isGenerating) {
      setThinkingIndex(0);
      timer = setInterval(() => {
        setThinkingIndex(prev => (prev + 1) % THINKING_MESSAGES.length);
      }, 650);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGenerating]);

  // Animation de pulsation du micro et ondes audio en direct
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let waveLoop: Animated.CompositeAnimation | null = null;

    if (isListening) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.25,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      waveLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(soundWaveAnim1, { toValue: 22, duration: 300, useNativeDriver: false }),
            Animated.timing(soundWaveAnim1, { toValue: 6, duration: 300, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(soundWaveAnim2, { toValue: 26, duration: 250, useNativeDriver: false }),
            Animated.timing(soundWaveAnim2, { toValue: 10, duration: 250, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(soundWaveAnim3, { toValue: 28, duration: 350, useNativeDriver: false }),
            Animated.timing(soundWaveAnim3, { toValue: 8, duration: 350, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(soundWaveAnim4, { toValue: 20, duration: 280, useNativeDriver: false }),
            Animated.timing(soundWaveAnim4, { toValue: 6, duration: 280, useNativeDriver: false }),
          ]),
        ])
      );
      waveLoop.start();
    } else {
      micPulseAnim.setValue(1);
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
      if (waveLoop) waveLoop.stop();
    };
  }, [isListening]);

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  useEffect(() => {
    if (isLoaded) {
      scrollToBottom();
    }
  }, [isLoaded]);

  /**
   * Traite une demande texte saisie par l'utilisateur
   */
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
    setLiveTranscript('');
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
        reactionEmoji: response.reactionEmoji,
        quickSuggestions: response.quickSuggestions,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: AiChefMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: e.message === 'AUCUNE_CLE_GEMINI'
          ? "Veuillez configurer votre clé API Gemini pour poser des questions complexes."
          : "Désolé, une coupure est survenue. Veuillez réessayer d'indiquer vos ingrédients.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
      scrollToBottom();
    }
  };

  /**
   * Traite un enregistrement audio réel
   */
  const handleProcessAudioBlob = async (audioBlob: Blob, spokenTextFallback?: string) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setLiveTranscript('');
    scrollToBottom();

    try {
      // 1. Convertir le blob audio réel en Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      const mimeType = audioBlob.type || 'audio/webm';
      try {
        const response = await AiChefService.processAudioMessage({
          audioBase64,
          audioMimeType: mimeType,
        });

        const userText = response.userTranscript || spokenTextFallback || '🎤 [Demande vocale]';
        const userMsg: AiChefMessage = {
          id: `user_${Date.now()}`,
          sender: 'user',
          text: userText,
          timestamp: Date.now(),
        };

        const aiMsg: AiChefMessage = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: response.text,
          recipe: response.recipe,
          isGuardrail: response.isGuardrail,
          reactionEmoji: response.reactionEmoji,
          quickSuggestions: response.quickSuggestions,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMsg, aiMsg]);
      } catch (geminiAudioErr) {
        if (spokenTextFallback && spokenTextFallback.trim().length > 1) {
          await handleProcessQuery(spokenTextFallback);
        } else {
          const errorMsg: AiChefMessage = {
            id: `err_${Date.now()}`,
            sender: 'ai',
            text: "Je n'ai pas pu bien entendre votre enregistrement. Veuillez vous rapprocher du micro et réessayer.",
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      }
    } catch (e: any) {
      console.error('Erreur traitement audio:', e);
      if (spokenTextFallback && spokenTextFallback.trim().length > 1) {
        await handleProcessQuery(spokenTextFallback);
      } else {
        const errorMsg: AiChefMessage = {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: "Je n'ai pas pu bien entendre votre enregistrement. Assurez-vous d'avoir autorisé le microphone ou réessayez.",
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setIsGenerating(false);
      scrollToBottom();
    }
  };

  /**
   * Démarrer le véritable enregistrement microphone
   */
  const startRecording = async () => {
    if (typeof window === 'undefined') return;

    try {
      audioChunksRef.current = [];
      setLiveTranscript('');
      setRecordingDuration(0);

      // 1. Demande d'accès au micro réel
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        Alert.alert('Microphone non disponible', 'Votre navigateur ne supporte pas l’accès direct au micro.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Initialiser MediaRecorder
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsListening(true);

      // Timer de durée d'enregistrement
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // 3. Lancer en parallèle la reconnaissance vocale pour sous-titres en direct (si dispo)
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'fr-FR';
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              current += event.results[i][0].transcript;
            }
            if (current.trim().length > 0) {
              setLiveTranscript(current);
            }
          };

          speechRecognitionRef.current = recognition;
          recognition.start();
        } catch (srErr) {
          console.warn('SpeechRecognition non actif:', srErr);
        }
      }
    } catch (err: any) {
      console.error('Erreur accès microphone:', err);
      Alert.alert(
        'Accès au Microphone',
        'Veuillez autoriser l’accès au microphone dans votre navigateur pour parler au Chef IA.'
      );
      setIsListening(false);
    }
  };

  /**
   * Arrêter le véritable enregistrement microphone
   */
  const stopRecording = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || 'audio/webm',
        });

        // Arrêter les pistes audio
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Si l'enregistrement contient des données réelles
        if (audioBlob.size > 200) {
          handleProcessAudioBlob(audioBlob, liveTranscript);
        } else if (liveTranscript && liveTranscript.trim().length > 1) {
          handleProcessQuery(liveTranscript);
        } else {
          Alert.alert(
            'Enregistrement trop court',
            'Aucun son n’a été capturé. Maintenez le bouton micro pour parler distinctement.'
          );
        }
      };

      mediaRecorderRef.current.stop();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    setIsListening(false);
  };

  const toggleVoiceInput = () => {
    if (!isListening) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  // Traiter un ingrédient passé en paramètre de navigation
  useEffect(() => {
    if (isLoaded && route.params?.initialIngredient) {
      const ing = route.params.initialIngredient;
      handleProcessQuery(`J'ai ${ing} dans mon frigo`);
      navigation.setParams({ initialIngredient: undefined });
    }
  }, [isLoaded, route.params?.initialIngredient]);

  const handleSend = () => {
    handleProcessQuery(input);
  };

  const handleChipPress = (chipQuery: string) => {
    handleProcessQuery(chipQuery);
  };

  // Vider la discussion
  const handleReset = () => {
    const executeReset = async () => {
      expressiveVoiceService.stop();
      const initial: AiChefMessage[] = [
        {
          ...INITIAL_WELCOME_MESSAGE,
          id: `welcome_${Date.now()}`,
          timestamp: Date.now(),
        },
      ];
      setMessages(initial);
      await StorageService.setItem(STORAGE_KEY_AI_CHEF_MESSAGES, initial);
      setInput('');
      setLiveTranscript('');
      setIsGenerating(false);
      setIsListening(false);
      setSpeakingMessageId(null);
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm("Voulez-vous vraiment effacer l'historique de votre discussion avec le Frigo Magique ?")) {
        executeReset();
      }
    } else {
      Alert.alert(
        'Effacer la discussion',
        'Voulez-vous vraiment effacer l’historique de votre Frigo Magique ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Effacer',
            style: 'destructive',
            onPress: executeReset,
          },
        ]
      );
    }
  };

  // Lecture audio expressive (Voix Gemini Live / Naturelle)
  const handleToggleSpeak = (msgId: string, textToSpeak: string) => {
    if (speakingMessageId === msgId) {
      expressiveVoiceService.stop();
      setSpeakingMessageId(null);
      return;
    }

    expressiveVoiceService.speak({
      text: textToSpeak,
      onStart: () => setSpeakingMessageId(msgId),
      onEnd: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
      {/* 1. En-tête (Header) avec Reset */}
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
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? AppColors.textDarkPrimary : AppColors.textPrimary },
            ]}
          >
            🧑‍🍳 Frigo Magique IA
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: isDark ? AppColors.textDarkSecondary : AppColors.textSecondary },
            ]}
          >
            Chef Gastronomique AfroCuisto
          </Text>
        </View>

        {/* Bouton Reset 🔄 */}
        <TouchableOpacity
          style={[
            styles.headerBtn,
            {
              backgroundColor: isDark ? 'rgba(251, 86, 7, 0.12)' : 'rgba(251, 86, 7, 0.08)',
            },
          ]}
          activeOpacity={0.8}
          onPress={handleReset}
          accessibilityLabel="Effacer la discussion"
        >
          <RotateCcw size={18} color={AppColors.primary} strokeWidth={2.3} />
        </TouchableOpacity>
      </View>

      {/* 2. Suggestions rapides du placard (Quick Chips) */}
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
              onPress={() => handleChipPress(`J'ai ${chip.query} dans mon frigo`)}
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

      {/* 3. Zone de messages conversationnels & Cartes de recettes */}
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
            const isSpeakingThis = speakingMessageId === msg.id;

            // Message avec recette IA structurée
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
                      Chef IA AfroCuisto {msg.reactionEmoji || '✨'}
                    </Text>
                  </View>

                  <AiRecipeCard
                    recipe={msg.recipe}
                    onAskVariation={r =>
                      handleProcessQuery(
                        `Propose-moi une autre variante avec ${r.usedIngredients.map(i => i.name).join(', ')}`
                      )
                    }
                  />

                  {/* Suggestions interactives */}
                  {msg.quickSuggestions && msg.quickSuggestions.length > 0 && (
                    <View style={styles.suggestionRow}>
                      <Text
                        style={[
                          styles.suggestionHint,
                          { color: isDark ? '#A8A29E' : '#73706B' },
                        ]}
                      >
                        Suggestions de questions :
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.suggestionChipsContent}
                      >
                        {msg.quickSuggestions.map((sug, sIdx) => (
                          <TouchableOpacity
                            key={`sug_${sIdx}`}
                            style={[
                              styles.suggestionPill,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(251, 86, 7, 0.12)'
                                  : '#FFF2EE',
                                borderColor: isDark
                                  ? 'rgba(251, 86, 7, 0.3)'
                                  : '#FFE3D6',
                              },
                            ]}
                            activeOpacity={0.75}
                            onPress={() => handleProcessQuery(sug)}
                          >
                            <Text style={styles.suggestionPillText}>{sug}</Text>
                            <ArrowRight size={11} color={AppColors.primary} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              );
            }

            // Message standard
            return (
              <View key={msg.id} style={styles.messageBlock}>
                <View
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
                    {isAi && (
                      <View style={styles.aiBubbleHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <ChefHat size={13} color={AppColors.primary} />
                          <Text style={styles.guardrailTitle}>
                            {msg.isGuardrail ? 'Expertise Culinaire' : 'Chef IA AfroCuisto'}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.listenInlineBtn}
                          onPress={() => handleToggleSpeak(msg.id, msg.text || '')}
                          accessibilityLabel="Écouter le message"
                        >
                          {isSpeakingThis ? (
                            <VolumeX size={13} color={AppColors.primary} />
                          ) : (
                            <Volume2 size={13} color={AppColors.primary} />
                          )}
                          <Text style={styles.listenInlineText}>
                            {isSpeakingThis ? 'Arrêter' : 'Écouter'}
                          </Text>
                        </TouchableOpacity>
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

                {/* Suggestions interactives */}
                {isAi && msg.quickSuggestions && msg.quickSuggestions.length > 0 && (
                  <View style={[styles.suggestionRow, { marginLeft: 36 }]}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.suggestionChipsContent}
                    >
                      {msg.quickSuggestions.map((sug, sIdx) => (
                        <TouchableOpacity
                          key={`sug_txt_${sIdx}`}
                          style={[
                            styles.suggestionPill,
                            {
                              backgroundColor: isDark
                                ? 'rgba(251, 86, 7, 0.12)'
                                : '#FFF2EE',
                              borderColor: isDark
                                ? 'rgba(251, 86, 7, 0.3)'
                                : '#FFE3D6',
                              },
                            ]}
                          activeOpacity={0.75}
                          onPress={() => handleProcessQuery(sug)}
                        >
                          <Text style={styles.suggestionPillText}>{sug}</Text>
                          <ArrowRight size={11} color={AppColors.primary} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            );
          })}

          {/* Animation de réflexion du Chef pendant l'analyse IA */}
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
                  {THINKING_MESSAGES[thinkingIndex]}
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
                  <ShimmerSkeleton width={80} height={22} borderRadius={10} />
                  <ShimmerSkeleton width={70} height={22} borderRadius={10} />
                </View>
                <ShimmerSkeleton width="85%" height={22} borderRadius={6} style={{ marginTop: 8 }} />
                <ShimmerSkeleton width="100%" height={55} borderRadius={12} style={{ marginTop: 8 }} />
                <ShimmerSkeleton width="100%" height={45} borderRadius={12} style={{ marginTop: 6 }} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* 4. Barre de saisie audio réelle & texte */}
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
          {/* Bannière d'écoute vocale en direct avec visualiseur d'ondes & chrono */}
          {isListening && (
            <View
              style={[
                styles.listeningBanner,
                {
                  backgroundColor: isDark ? '#2D160D' : '#FFF0EB',
                  borderColor: isDark ? '#5A2A1A' : '#FED7AA',
                },
              ]}
            >
              <View style={styles.waveGroup}>
                <Animated.View style={[styles.waveBar, { height: soundWaveAnim1 }]} />
                <Animated.View style={[styles.waveBar, { height: soundWaveAnim2 }]} />
                <Animated.View style={[styles.waveBar, { height: soundWaveAnim3 }]} />
                <Animated.View style={[styles.waveBar, { height: soundWaveAnim4 }]} />
              </View>
              <Text style={styles.durationBadge}>
                {formatDuration(recordingDuration)}
              </Text>
              <Text style={styles.listeningBannerText} numberOfLines={1}>
                {liveTranscript || '🎙️ Enregistrement réel... Parlez pour décrire vos ingrédients'}
              </Text>
            </View>
          )}

          <View style={styles.inputRow}>
            {/* Bouton Micro Réel 🎙️ */}
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
                accessibilityLabel={isListening ? "Arrêter l'enregistrement" : 'Enregistrer votre voix'}
              >
                {isListening ? (
                  <MicOff size={19} color="#FFFFFF" strokeWidth={2.4} />
                ) : (
                  <Mic
                    size={19}
                    color={isDark ? '#F5F3EF' : AppColors.primary}
                    strokeWidth={2.4}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Champ texte */}
            <TextInput
              style={[
                styles.textInput,
                {
                  color: isDark ? '#FFFFFF' : AppColors.textPrimary,
                  backgroundColor: isDark ? '#121110' : '#F9FAFB',
                  borderColor: isDark ? '#2B2927' : '#E8E5DF',
                },
              ]}
              placeholder="Dites vos ingrédients ou posez une question..."
              placeholderTextColor="#8C8A87"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isGenerating}
            />

            {/* Bouton d'envoi */}
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
  headerTitle: {
    fontSize: 16,
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
    gap: 16,
  },
  messageBlock: {
    gap: 6,
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
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    gap: 4,
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
  aiBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  guardrailTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: AppColors.primary,
  },
  listenInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 86, 7, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  listenInlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.primary,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  suggestionRow: {
    gap: 4,
    marginTop: 4,
  },
  suggestionHint: {
    fontSize: 10.5,
    fontWeight: '600',
    marginLeft: 4,
  },
  suggestionChipsContent: {
    gap: 6,
    paddingVertical: 2,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: AppColors.primary,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  waveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 20,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: AppColors.primary,
  },
  durationBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  listeningBannerText: {
    flex: 1,
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 13,
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
