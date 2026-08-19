import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { cookingTimerService, CookingTimerState } from '../services/cookingTimerService';

interface CookingTimerContextType {
  state: CookingTimerState;
  timerSeconds: number;
  formattedTime: string;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  recipeName: string;
  recipeId?: string;
  recipeImage?: any;
  currentStepIndex: number;
  totalSteps: number;
  progressRatio: number;
  isPillExpanded: boolean;
  isPillVisible: boolean;
  setIsPillExpanded: (expanded: boolean) => void;
  setIsPillVisible: (visible: boolean) => void;
  startTimer: (options: {
    durationSeconds: number;
    recipeName?: string;
    recipeId?: string;
    recipeImage?: any;
    currentStepIndex?: number;
    totalSteps?: number;
  }) => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  addMinutes: (minutes: number) => void;
  stopTimer: () => Promise<void>;
  togglePlayPause: () => void;
  updateStep: (stepIndex: number, totalSteps?: number) => void;
}

const CookingTimerContext = createContext<CookingTimerContextType | undefined>(undefined);

export const CookingTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CookingTimerState>(cookingTimerService.getState());
  const [isPillExpanded, setIsPillExpanded] = useState<boolean>(false);
  const [isPillVisible, setIsPillVisible] = useState<boolean>(true);

  useEffect(() => {
    cookingTimerService.requestPermissions();
    const unsubscribe = cookingTimerService.subscribe(newState => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Mode Anti-Verrouillage automatique pendant qu'un minuteur de cuisson décompte
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      activateKeepAwakeAsync('COOKING_TIMER_RUNNING').catch(() => {});
    } else {
      deactivateKeepAwake('COOKING_TIMER_RUNNING').catch(() => {});
    }

    return () => {
      deactivateKeepAwake('COOKING_TIMER_RUNNING').catch(() => {});
    };
  }, [state.isRunning, state.isPaused]);

  const formattedTime = useMemo(() => {
    return cookingTimerService.formatTimer(state.remainingSeconds);
  }, [state.remainingSeconds]);

  const progressRatio = useMemo(() => {
    if (state.totalSeconds <= 0) return 0;
    return Math.max(0, Math.min(1, 1 - state.remainingSeconds / state.totalSeconds));
  }, [state.remainingSeconds, state.totalSeconds]);

  const startTimer = async (options: {
    durationSeconds: number;
    recipeName?: string;
    recipeId?: string;
    recipeImage?: any;
    currentStepIndex?: number;
    totalSteps?: number;
  }) => {
    setIsPillVisible(true);
    await cookingTimerService.startTimer(options);
  };

  const pauseTimer = () => {
    cookingTimerService.pauseTimer();
  };

  const resumeTimer = () => {
    cookingTimerService.resumeTimer();
  };

  const addMinutes = (minutes: number) => {
    cookingTimerService.addSeconds(minutes * 60);
  };

  const stopTimer = async () => {
    setIsPillExpanded(false);
    await cookingTimerService.stopTimer();
  };

  const togglePlayPause = () => {
    if (state.isPaused) {
      cookingTimerService.resumeTimer();
    } else {
      cookingTimerService.pauseTimer();
    }
  };

  const updateStep = (stepIndex: number, totalSteps?: number) => {
    cookingTimerService.updateStep(stepIndex, totalSteps);
  };

  const value: CookingTimerContextType = {
    state,
    timerSeconds: state.remainingSeconds,
    formattedTime,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    isFinished: state.isFinished,
    recipeName: state.recipeName,
    recipeId: state.recipeId,
    recipeImage: state.recipeImage,
    currentStepIndex: state.currentStepIndex,
    totalSteps: state.totalSteps,
    progressRatio,
    isPillExpanded,
    isPillVisible,
    setIsPillExpanded,
    setIsPillVisible,
    startTimer,
    pauseTimer,
    resumeTimer,
    addMinutes,
    stopTimer,
    togglePlayPause,
    updateStep,
  };

  return (
    <CookingTimerContext.Provider value={value}>
      {children}
    </CookingTimerContext.Provider>
  );
};

export const useCookingTimer = (): CookingTimerContextType => {
  const context = useContext(CookingTimerContext);
  if (!context) {
    throw new Error('useCookingTimer must be used within a CookingTimerProvider');
  }
  return context;
};
