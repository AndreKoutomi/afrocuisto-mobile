import { GeminiService } from './geminiService';

/**
 * Service de synthèse vocale ultra-expressive (Gemini Live Audio & PCM Web Audio)
 */

export interface SpeechOptions {
  text: string;
  voiceName?: 'Aoede' | 'Fenrir' | 'Kore' | 'Puck' | 'Charon';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class ExpressiveVoiceService {
  private currentAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private isSpeaking: boolean = false;

  /**
   * Convertit une chaîne Base64 en Uint8Array
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Convertit des données brutes PCM 24kHz (retournées par Gemini Live) en Blob WAV standard
   */
  private pcmToWavBlob(pcmData: Uint8Array, sampleRate = 24000, numChannels = 1): Blob {
    const buffer = new ArrayBuffer(44 + pcmData.byteLength);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // 1. En-tête RIFF
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.byteLength, true);
    writeString(8, 'WAVE');

    // 2. Format Chunk "fmt "
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 pour PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate (24000 Hz)
    view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
    view.setUint16(32, numChannels * 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample (16 bits)

    // 3. Data Chunk "data"
    writeString(36, 'data');
    view.setUint32(40, pcmData.byteLength, true);

    // 4. Copie des échantillons PCM
    new Uint8Array(buffer, 44).set(pcmData);

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Arrête immédiatement toute lecture audio en cours
   */
  public stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }

    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch (e) {}
      this.currentSourceNode = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.isSpeaking = false;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Nettoie et prépare le texte pour une élocution fluide et conviviale
   */
  public cleanTextForSpeech(text: string): string {
    return text
      .replace(/#+\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/_{1,2}/g, '')
      .replace(/`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/•\s+/g, ', ')
      .replace(/🍲|👨‍🍳|🥘|✨|💡|🌶️|🍹|🍗|🐟|🍌|🧅|🥬|🍠/g, '')
      .trim();
  }

  /**
   * Synthétise et joue la voix avec le modèle Gemini Live Audio ultra-expressif
   */
  public async speak(options: SpeechOptions): Promise<void> {
    this.stop();
    this.isSpeaking = true;
    if (options.onStart) options.onStart();

    const cleanText = this.cleanTextForSpeech(options.text);
    const apiKey = await GeminiService.getApiKey();

    if (apiKey) {
      try {
        const success = await this.playGeminiLiveAudio(cleanText, apiKey, options);
        if (success) return;
      } catch (err) {
        console.warn('Erreur lors de la génération Gemini Live Audio, bascule sur la voix système:', err);
      }
    }

    // Fallback optimisé avec voix système
    this.fallbackBrowserSpeech(cleanText, options);
  }

  /**
   * Appel de l'API Gemini 2.0 avec sortie AUDIO native (Voix Gemini Live)
   */
  private async playGeminiLiveAudio(
    text: string,
    apiKey: string,
    options: SpeechOptions
  ): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const selectedVoice = options.voiceName || 'Aoede'; // Voix très expressive et chaleureuse

    const promptText = `Tu es le Chef IA AfroCuisto en mode vocal direct (Gemini Live).
Lis ce texte avec une intonation extrêmement vivante, chaleureuse, naturelle, communicative et passionnée de gastronomie africaine :

"${text}"`;

    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: selectedVoice,
            },
          },
        },
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn('Gemini Audio API Error:', response.status, err);
      return false;
    }

    const data = await response.json();
    const candidatePart = data.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData && p.inlineData.data
    );

    if (!candidatePart || !candidatePart.inlineData?.data) {
      console.warn('Aucune donnée audio dans la réponse Gemini:', data);
      return false;
    }

    const rawBase64 = candidatePart.inlineData.data;
    const mimeType = candidatePart.inlineData.mimeType || 'audio/pcm;rate=24000';

    // 1. Si format PCM, convertir en WAV standard pour lecture universelle
    let audioUrl = '';
    if (mimeType.includes('pcm') || mimeType.includes('raw')) {
      const pcmBytes = this.base64ToUint8Array(rawBase64);
      const wavBlob = this.pcmToWavBlob(pcmBytes, 24000, 1);
      audioUrl = URL.createObjectURL(wavBlob);
    } else {
      audioUrl = `data:${mimeType};base64,${rawBase64}`;
    }

    // 2. Jouer l'élément Audio HTML5
    const audio = new Audio(audioUrl);
    this.currentAudio = audio;

    return new Promise<boolean>((resolve) => {
      audio.onended = () => {
        this.isSpeaking = false;
        this.currentAudio = null;
        if (options.onEnd) options.onEnd();
        resolve(true);
      };

      audio.onerror = (err) => {
        console.warn('Erreur lecture fichier Audio Gemini:', err);
        this.isSpeaking = false;
        this.currentAudio = null;
        if (options.onError) options.onError(err);
        resolve(false);
      };

      audio.play().then(() => {
        resolve(true);
      }).catch((playErr) => {
        console.warn('Audio play() rejected:', playErr);
        resolve(false);
      });
    });
  }

  /**
   * Fallback navigateur au cas où aucune clé Gemini n'est présente
   */
  private fallbackBrowserSpeech(text: string, options: SpeechOptions) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isSpeaking = false;
      if (options.onEnd) options.onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.06;

    const voices = window.speechSynthesis.getVoices();
    const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));
    if (frenchVoices.length > 0) {
      // Rechercher les voix enhanced / naturelles
      const best = frenchVoices.find(v =>
        v.name.toLowerCase().includes('google') ||
        v.name.toLowerCase().includes('enhanced') ||
        v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('thomas') ||
        v.name.toLowerCase().includes('paul')
      );
      if (best) utterance.voice = best;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (err) => {
      this.isSpeaking = false;
      if (options.onError) options.onError(err);
      if (options.onEnd) options.onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const expressiveVoiceService = new ExpressiveVoiceService();
