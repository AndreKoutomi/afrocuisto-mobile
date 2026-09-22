import { StorageService } from './storage';
import { AiChefRecipeResult } from '../types/aiChef';

const STORAGE_KEY_GEMINI_API_KEY = 'afrocuisto_gemini_api_key';
const STORAGE_KEY_GEMINI_MODEL = 'afrocuisto_gemini_model';
const DEFAULT_MODEL = 'gemini-2.0-flash';

export interface GeminiChefResponse {
  userTranscript?: string;
  isGuardrail: boolean;
  text?: string;
  recipe?: AiChefRecipeResult;
  reactionEmoji?: string;
  quickSuggestions?: string[];
}

export const GeminiService = {
  /**
   * Récupère la clé API Gemini configurée (Storage ou .env)
   */
  async getApiKey(): Promise<string> {
    try {
      const stored = await StorageService.getItem<string>(STORAGE_KEY_GEMINI_API_KEY, '');
      if (stored && stored.trim().length > 0) {
        return stored.trim();
      }
    } catch (e) {
      console.warn('Erreur lecture clé Gemini storage:', e);
    }

    const envKey = (process.env as any).EXPO_PUBLIC_GEMINI_API_KEY || '';
    return envKey.trim();
  },

  /**
   * Sauvegarde la clé API Gemini dans le stockage local
   */
  async saveApiKey(key: string): Promise<void> {
    await StorageService.setItem(STORAGE_KEY_GEMINI_API_KEY, key.trim());
  },

  /**
   * Supprime la clé API Gemini
   */
  async removeApiKey(): Promise<void> {
    await StorageService.removeItem(STORAGE_KEY_GEMINI_API_KEY);
  },

  /**
   * Récupère le modèle Gemini sélectionné
   */
  async getModel(): Promise<string> {
    const stored = await StorageService.getItem<string>(STORAGE_KEY_GEMINI_MODEL, DEFAULT_MODEL);
    return stored || DEFAULT_MODEL;
  },

  /**
   * Valide une clé API en effectuant un test réel auprès de l'API Google Gemini
   */
  async validateApiKey(key: string): Promise<{ valid: boolean; error?: string }> {
    const trimmed = key.trim();
    if (!trimmed) {
      return { valid: false, error: 'Veuillez saisir une clé API.' };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${trimmed}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });

      if (response.ok) {
        return { valid: true };
      }

      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `Erreur HTTP ${response.status}`;
      return { valid: false, error: msg };
    } catch (e: any) {
      return { valid: false, error: e.message || 'Impossible de joindre le serveur Gemini.' };
    }
  },

  /**
   * Envoie une requête texte ou audio multimodale à Gemini
   */
  async generateChefResponse(options: {
    userText?: string;
    audioBase64?: string;
    audioMimeType?: string;
  }): Promise<GeminiChefResponse> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('AUCUNE_CLE_GEMINI');
    }

    const model = await this.getModel();
    const systemInstruction = `Tu es le Chef IA AfroCuisto, grand maître de la gastronomie béninoise et africaine (Bénin, Togo, Côte d'Ivoire, Sénégal, Cameroun, Nigéria, etc.).

RÈGLES ET DIRECTIVES ABSOLUES :
1. Périmètre strict : Réponds UNIQUEMENT aux demandes culinaires, recettes avec ingrédients donnés, techniques de cuisson du terroir, substitutions et accords de boissons africaines.
2. Si la demande est hors cuisine, renvoie isGuardrail: true et un message bienveillant réorientant vers la cuisine.
3. Si un enregistrement audio est fourni, commence par transcrire fidèlement ce que l'utilisateur a dit dans le champ "userTranscript".
4. Réponds TOUJOURS au format JSON strict avec la structure suivante :
{
  "userTranscript": "Transcription exacte des paroles de l'utilisateur si audio, ou le texte saisi",
  "isGuardrail": false,
  "text": "Texte explicatif si c'est un conseil ou une réponse conversationnelle culinaire",
  "recipe": {
    "dishName": "Nom authentique du plat (ex: Amiwô au Poulet Doré)",
    "region": "Région d'origine (ex: Sud-Bénin 🇧🇯)",
    "category": "Catégorie (ex: Pâtes & Céréales du Terroir)",
    "totalTime": "Temps total (ex: 35 min)",
    "prepTime": "10 min",
    "cookTime": "25 min",
    "difficulty": "Facile" | "Moyen" | "Difficile",
    "servings": "4 pers.",
    "usedIngredients": [
      { "name": "Poulet", "amount": "500g" }
    ],
    "missingIngredients": [
      { "name": "Farine de maïs", "amount": "300g" }
    ],
    "steps": [
      "Étape 1...",
      "Étape 2...",
      "Étape 3..."
    ],
    "suggestedSides": ["Accompagnement 1", "Accompagnement 2"],
    "chefTip": "Astuce secrète du Chef pour réussir la texture ou le goût",
    "wineOrDrinkPairing": "Boisson locale conseillée (ex: Jus de Bissap frais 🌺)"
  },
  "reactionEmoji": "🍲",
  "quickSuggestions": [
    "Question suggérée 1",
    "Question suggérée 2",
    "Question suggérée 3"
  ]
}`;

    const parts: any[] = [];

    // Ajouter l'audio si présent
    if (options.audioBase64) {
      parts.push({
        inlineData: {
          mimeType: options.audioMimeType || 'audio/webm',
          data: options.audioBase64,
        },
      });
      parts.push({
        text: "Écoute cet audio. Transcris précisément ce que dit l'utilisateur sur les ingrédients ou son envie de plat, puis compose la recette ou le conseil culinaire adapté en JSON.",
      });
    } else if (options.userText) {
      parts.push({
        text: options.userText,
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [{ role: 'user', parts }],
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `Erreur API Gemini (${response.status})`;
      throw new Error(msg);
    }

    const result = await response.json();
    const rawContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    try {
      const parsed = JSON.parse(rawContent);
      if (parsed.recipe && !parsed.recipe.id) {
        parsed.recipe.id = `gemini_rec_${Date.now()}`;
      }
      return parsed;
    } catch (parseErr) {
      console.error('Erreur parsing JSON Gemini:', rawContent, parseErr);
      return {
        isGuardrail: false,
        text: rawContent,
        reactionEmoji: '✨',
        quickSuggestions: ['Proposer une autre recette', 'Conseil de cuisson'],
      };
    }
  },
};
