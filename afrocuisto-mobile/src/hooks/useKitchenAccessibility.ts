import { useEffect, useRef } from 'react';
import { Platform, DeviceEventEmitter } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Accelerometer } from 'expo-sensors';

export interface UseKitchenAccessibilityProps {
  isActive: boolean;
  currentStepIndex?: number;
  totalSteps?: number;
  currentStepText?: string;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  onRepeatStep?: () => void;
  onLiftOrTilt?: () => void;
}

export const useKitchenAccessibility = ({
  isActive,
  onNextStep,
  onPrevStep,
  onRepeatStep,
  onLiftOrTilt,
}: UseKitchenAccessibilityProps) => {
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

  // 2. Interception des Touches Physiques (Accessibility Service Events)
  useEffect(() => {
    if (!isActive) return;

    const subNext = DeviceEventEmitter.addListener('ON_KITCHEN_NEXT_STEP', () => {
      if (onNextStep) onNextStep();
    });

    const subPrev = DeviceEventEmitter.addListener('ON_KITCHEN_PREV_STEP', () => {
      if (onPrevStep) onPrevStep();
    });

    const subRepeat = DeviceEventEmitter.addListener('ON_KITCHEN_REPEAT_STEP', () => {
      if (onRepeatStep) onRepeatStep();
    });

    return () => {
      subNext.remove();
      subPrev.remove();
      subRepeat.remove();
    };
  }, [isActive, onNextStep, onPrevStep, onRepeatStep]);

  // 3. Capteur de Mouvement / Détection de Prise en Main (Accelerometer)
  useEffect(() => {
    if (!isActive || Platform.OS === 'web') return;

    Accelerometer.setUpdateInterval(400);
    const sub = Accelerometer.addListener(data => {
      const gForce = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      const now = Date.now();

      // Détection d'un mouvement franc de soulèvement
      if (gForce > 1.8 && now - lastLiftTime.current > 3500) {
        lastLiftTime.current = now;
        if (onLiftOrTilt) {
          onLiftOrTilt();
        }
      }
    });

    return () => {
      sub.remove();
    };
  }, [isActive, onLiftOrTilt]);

  return {};
};
