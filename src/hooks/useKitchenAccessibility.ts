import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform, DeviceEventEmitter } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import * as Brightness from 'expo-brightness';
import { Accelerometer } from 'expo-sensors';

export interface UseKitchenAccessibilityProps {
  isActive: boolean;
  currentStepIndex?: number;
  totalSteps?: number;
  currentStepText?: string;
  autoReadStep?: boolean;
  isSimmering?: boolean;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  onRepeatStep?: () => void;
  onLiftOrTilt?: () => void;
}

export const useKitchenAccessibility = ({
  isActive,
  currentStepIndex = 0,
  totalSteps = 1,
  currentStepText = '',
  autoReadStep = true,
  isSimmering = false,
  onNextStep,
  onPrevStep,
  onRepeatStep,
  onLiftOrTilt,
}: UseKitchenAccessibilityProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(autoReadStep);
  const previousBrightness = useRef<number | null>(null);
  const lastLiftTime = useRef<number>(0);

  // 1. Anti-Verrouillage de l'écran (Keep Screen On / WAKE_LOCK)
  useEffect(() => {
    if (isActive) {
      activateKeepAwakeAsync('AFROCUISTO_COOK_MODE').catch(err => {
        console.log('KeepAwake error:', err);
      });
    } else {
      deactivateKeepAwake('AFROCUISTO_COOK_MODE').catch(() => {});
    }

    return () => {
      deactivateKeepAwake('AFROCUISTO_COOK_MODE').catch(() => {});
    };
  }, [isActive]);

  // 2. Luminosité Adaptative Cuisine (Contre les reflets & Économie en mijotage)
  useEffect(() => {
    if (Platform.OS === 'web' || !isActive) return;

    let mounted = true;
    const applyBrightness = async () => {
      try {
        const { status } = await Brightness.requestPermissionsAsync();
        if (status !== 'granted' || !mounted) return;

        if (previousBrightness.current === null) {
          previousBrightness.current = await Brightness.getBrightnessAsync();
        }

        // Si mijotage prolongé : 35% de luminosité (économie batterie), sinon 100% (anti-reflets plan de travail)
        const targetBrightness = isSimmering ? 0.35 : 1.0;
        await Brightness.setBrightnessAsync(targetBrightness);
      } catch (e) {
        // Fallback silencieux si non supporté sur l'émulateur
      }
    };

    applyBrightness();

    return () => {
      mounted = false;
      if (previousBrightness.current !== null && Platform.OS !== 'web') {
        Brightness.setBrightnessAsync(previousBrightness.current).catch(() => {});
        previousBrightness.current = null;
      }
    };
  }, [isActive, isSimmering]);

  // 3. Synthèse Vocale Automatique (TTS)
  const speakStep = useCallback((textToSpeak?: string) => {
    const raw = textToSpeak || currentStepText;
    if (!raw || raw.trim().length === 0) return;

    const formattedSpeech = `Étape ${currentStepIndex + 1} sur ${totalSteps}. ${raw}`;

    try {
      Speech.stop();
      setIsSpeaking(true);
      Speech.speak(formattedSpeech, {
        language: 'fr-FR',
        pitch: 1.0,
        rate: 0.92, // Rythme posé pour compréhension aisée en cuisine
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (e) {
      console.warn('Speech error:', e);
      setIsSpeaking(false);
    }
  }, [currentStepIndex, totalSteps, currentStepText]);

  const stopSpeaking = useCallback(() => {
    try {
      Speech.stop();
      setIsSpeaking(false);
    } catch (e) {
      // Ignorer
    }
  }, []);

  const toggleTts = useCallback(() => {
    setIsTtsEnabled(prev => {
      const next = !prev;
      if (!next) {
        stopSpeaking();
      } else {
        speakStep();
      }
      return next;
    });
  }, [speakStep, stopSpeaking]);

  // Déclenchement automatique de la lecture vocale au changement d'étape
  useEffect(() => {
    if (isActive && isTtsEnabled && currentStepText) {
      speakStep(currentStepText);
    }
    return () => {
      stopSpeaking();
    };
  }, [isActive, currentStepIndex, isTtsEnabled]);

  // 4. Interception des Touches Physiques (Accessibility Service Events)
  useEffect(() => {
    if (!isActive) return;

    const subNext = DeviceEventEmitter.addListener('ON_KITCHEN_NEXT_STEP', () => {
      if (onNextStep) onNextStep();
    });

    const subPrev = DeviceEventEmitter.addListener('ON_KITCHEN_PREV_STEP', () => {
      if (onPrevStep) onPrevStep();
    });

    const subRepeat = DeviceEventEmitter.addListener('ON_KITCHEN_REPEAT_STEP', () => {
      if (onRepeatStep) {
        onRepeatStep();
      } else {
        speakStep();
      }
    });

    return () => {
      subNext.remove();
      subPrev.remove();
      subRepeat.remove();
    };
  }, [isActive, onNextStep, onPrevStep, onRepeatStep, speakStep]);

  // 5. Capteur de Mouvement / Détection de Prise en Main (Accelerometer / Lift to Speak)
  useEffect(() => {
    if (!isActive || Platform.OS === 'web') return;

    Accelerometer.setUpdateInterval(400);
    const sub = Accelerometer.addListener(data => {
      const gForce = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      const now = Date.now();

      // Détection d'un mouvement franc de soulèvement (ex: téléphone ramassé sur le plan de travail)
      if (gForce > 1.8 && now - lastLiftTime.current > 3500) {
        lastLiftTime.current = now;
        if (onLiftOrTilt) {
          onLiftOrTilt();
        } else if (isTtsEnabled) {
          speakStep();
        }
      }
    });

    return () => {
      sub.remove();
    };
  }, [isActive, isTtsEnabled, onLiftOrTilt, speakStep]);

  return {
    isSpeaking,
    isTtsEnabled,
    toggleTts,
    speakStep,
    stopSpeaking,
  };
};
