import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface CookingTimerState {
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  targetEndTime: number | null;
  recipeName: string;
  recipeId?: string;
  recipeImage?: any;
  currentStepIndex: number;
  totalSteps: number;
}

type Listener = (state: CookingTimerState) => void;

const NOTIFICATION_IDENTIFIER = 'afrocuisto-kitchen-timer';
const NOTIFICATION_CHANNEL_ID = 'kitchen-timer';

// Configure foreground presentation behavior
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    console.warn('SetNotificationHandler error:', err);
  }
}

class CookingTimerService {
  private state: CookingTimerState = {
    isRunning: false,
    isPaused: false,
    isFinished: false,
    remainingSeconds: 0,
    totalSeconds: 0,
    targetEndTime: null,
    recipeName: 'Cuisine AfroCuisto',
    currentStepIndex: 0,
    totalSteps: 0,
  };

  private listeners: Set<Listener> = new Set();
  private intervalId: any = null;
  private notificationIntervalId: any = null;
  private webNotification: any = null;
  private hasRequestedPermissions = false;

  constructor() {
    this.initNotifications();
  }

  public async initNotifications() {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
          name: 'Chronomètre Cuisine & Cuisson',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FB5607',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          sound: undefined,
          enableVibrate: false,
          showBadge: true,
        });
      } catch (err) {
        console.warn('Erreur initialisation canal Android:', err);
      }
    }
  }

  public async requestPermissions(): Promise<boolean> {
    if (this.hasRequestedPermissions) return true;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          this.hasRequestedPermissions = true;
          return true;
        }
        if (Notification.permission !== 'denied') {
          const res = await Notification.requestPermission();
          const granted = res === 'granted';
          if (granted) this.hasRequestedPermissions = true;
          return granted;
        }
      }
      return false;
    }

    try {
      await this.initNotifications();
      const { status: existingStatus, granted: alreadyGranted } = await Notifications.getPermissionsAsync();
      if (alreadyGranted || existingStatus === 'granted') {
        this.hasRequestedPermissions = true;
        return true;
      }

      const { status, granted } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {},
      });

      const isOk = granted || status === 'granted';
      if (isOk) this.hasRequestedPermissions = true;
      return isOk;
    } catch (err) {
      console.warn('Erreur demande permissions notifications:', err);
      return false;
    }
  }

  public getState(): CookingTimerState {
    return { ...this.state };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach(listener => listener(currentState));
  }

  public formatTimer(totalSec: number): string {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * Lance ou réinitialise le minuteur de cuisine avec le service de premier plan
   */
  public async startTimer(options: {
    durationSeconds: number;
    recipeName?: string;
    recipeId?: string;
    recipeImage?: any;
    currentStepIndex?: number;
    totalSteps?: number;
  }) {
    const {
      durationSeconds,
      recipeName = 'Cuisine AfroCuisto',
      recipeId,
      recipeImage,
      currentStepIndex = 0,
      totalSteps = 0,
    } = options;

    if (durationSeconds <= 0) return;

    // Reset previous timer state if running
    this.clearIntervals();
    await this.dismissNotification();

    const now = Date.now();
    const targetEndTime = now + durationSeconds * 1000;

    this.state = {
      isRunning: true,
      isPaused: false,
      isFinished: false,
      remainingSeconds: durationSeconds,
      totalSeconds: durationSeconds,
      targetEndTime,
      recipeName,
      recipeId,
      recipeImage,
      currentStepIndex,
      totalSteps,
    };

    this.notify();

    // Demande immédiate des permissions si non accordées
    await this.requestPermissions();

    // Démarre l'intervalle de décompte haute précision
    this.startIntervals();

    // Publie immédiatement la notification persistante
    await this.updatePersistentNotification();
  }

  public pauseTimer() {
    if (!this.state.isRunning || this.state.isPaused) return;

    this.clearIntervals();
    this.state.isPaused = true;
    this.state.targetEndTime = null;
    this.notify();
    this.updatePersistentNotification();
  }

  public resumeTimer() {
    if (!this.state.isRunning || !this.state.isPaused) return;

    if (this.state.remainingSeconds <= 0) {
      this.finishTimer();
      return;
    }

    const now = Date.now();
    this.state.targetEndTime = now + this.state.remainingSeconds * 1000;
    this.state.isPaused = false;
    this.notify();

    this.startIntervals();
    this.updatePersistentNotification();
  }

  public addSeconds(seconds: number) {
    if (!this.state.isRunning) return;

    const newRemaining = Math.max(1, this.state.remainingSeconds + seconds);
    const newTotal = Math.max(newRemaining, this.state.totalSeconds + (seconds > 0 ? seconds : 0));

    this.state.remainingSeconds = newRemaining;
    this.state.totalSeconds = newTotal;

    if (!this.state.isPaused) {
      this.state.targetEndTime = Date.now() + newRemaining * 1000;
    }

    this.notify();
    this.updatePersistentNotification();
  }

  public updateStep(stepIndex: number, totalSteps?: number) {
    this.state.currentStepIndex = stepIndex;
    if (totalSteps !== undefined) {
      this.state.totalSteps = totalSteps;
    }
    this.notify();
    if (this.state.isRunning) {
      this.updatePersistentNotification();
    }
  }

  /**
   * Arrête immédiatement le service, annule la notification persistante et libère les ressources
   */
  public async stopTimer() {
    this.clearIntervals();
    await this.dismissNotification();

    this.state = {
      isRunning: false,
      isPaused: false,
      isFinished: false,
      remainingSeconds: 0,
      totalSeconds: 0,
      targetEndTime: null,
      recipeName: 'Cuisine AfroCuisto',
      currentStepIndex: 0,
      totalSteps: 0,
    };

    this.notify();
  }

  private startIntervals() {
    this.clearIntervals();

    // 1. Horloge haute précision 500ms
    this.intervalId = setInterval(() => {
      if (!this.state.isRunning || this.state.isPaused || !this.state.targetEndTime) {
        return;
      }

      const diffMs = this.state.targetEndTime - Date.now();
      const remaining = Math.max(0, Math.ceil(diffMs / 1000));

      if (remaining !== this.state.remainingSeconds) {
        this.state.remainingSeconds = remaining;
        this.notify();
      }

      if (remaining <= 0) {
        this.finishTimer();
      }
    }, 500);

    // 2. Mise à jour de la notification persistante toutes les 1.5s
    this.notificationIntervalId = setInterval(() => {
      if (this.state.isRunning && !this.state.isPaused && this.state.remainingSeconds > 0) {
        this.updatePersistentNotification();
      }
    }, 1500);
  }

  private clearIntervals() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.notificationIntervalId) {
      clearInterval(this.notificationIntervalId);
      this.notificationIntervalId = null;
    }
  }

  private async finishTimer() {
    this.clearIntervals();
    this.state.remainingSeconds = 0;
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.state.isFinished = true;
    this.notify();

    // Vibrations haptiques de fin de cuisson
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate([0, 500, 200, 500, 200, 800]);
      } catch (e) {
        // Ignorer
      }
    } else {
      this.playWebAlertSound();
    }

    // Afficher la notification finale
    await this.showCompletionNotification();
  }

  private playWebAlertSound() {
    if (typeof window !== 'undefined' && (window as any).AudioContext) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } catch (err) {
        // Optionnel
      }
    }
  }

  /**
   * Met à jour la notification persistante de premier plan (barre d'état Android & Live update)
   */
  private async updatePersistentNotification() {
    if (!this.state.isRunning && !this.state.isPaused) return;

    const timeStr = this.formatTimer(this.state.remainingSeconds);
    const stepStr =
      this.state.totalSteps > 0
        ? ` • Étape ${this.state.currentStepIndex + 1}/${this.state.totalSteps}`
        : '';
    const statusPrefix = this.state.isPaused ? '⏸ En pause' : '⏱ Décompte';
    const title = `⏱ ${timeStr} • ${this.state.recipeName}`;
    const body = `${statusPrefix}${stepStr}`;

    // Cas Navigateur Web
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          this.webNotification = new Notification(title, {
            body,
            tag: NOTIFICATION_IDENTIFIER,
            renotify: false,
            icon: '/assets/icon.png',
            silent: true,
          } as any);
        } catch (err) {
          // Ignorer
        }
      }
      return;
    }

    // Cas Android / iOS Natif
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_IDENTIFIER,
        content: {
          title,
          body,
          subtitle: this.state.recipeName,
          categoryIdentifier: 'stopwatch',
          data: {
            recipeId: this.state.recipeId,
            recipeName: this.state.recipeName,
            isCookingTimer: true,
          },
          sound: false,
          priority: Notifications.AndroidNotificationPriority.MAX,
          sticky: true,
          autoDismiss: false,
          color: '#FB5607',
        },
        trigger: {
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      });
    } catch (err) {
      console.warn('Erreur mise à jour notification Android:', err);
    }
  }

  private async showCompletionNotification() {
    await this.dismissNotification();

    const title = `🔔 Minuteur terminé ! • AfroCuisto`;
    const body = `👩🏾‍🍳 Votre plat « ${this.state.recipeName} » est prêt ! Bon appétit !`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            tag: `${NOTIFICATION_IDENTIFIER}-done`,
            icon: '/assets/icon.png',
            requireInteraction: true,
          } as any);
        } catch (e) {}
      }
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${NOTIFICATION_IDENTIFIER}-done`,
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 200, 500],
          color: '#FB5607',
        },
        trigger: {
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      });
    } catch (err) {
      console.warn('Erreur notification fin de cuisson:', err);
    }
  }

  private async dismissNotification() {
    if (Platform.OS === 'web') {
      if (this.webNotification) {
        try {
          this.webNotification.close();
        } catch (e) {}
        this.webNotification = null;
      }
      return;
    }

    try {
      await Notifications.dismissNotificationAsync(NOTIFICATION_IDENTIFIER);
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);
    } catch (err) {
      // Ignorer
    }
  }
}

export const cookingTimerService = new CookingTimerService();
