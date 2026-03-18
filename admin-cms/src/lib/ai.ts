/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Connecteur IA pour l'administration. Appelle spécialement les modèles intelligents pour la génération automatique de contenu des recettes.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { CATEGORIES } from '../pages/RecipeForm'; // Importation des catégories de recettes
import { supabase } from '../lib/supabase'; // Importation du client de base de données

const DEFAULT_MODEL = 'gemini-flash-latest'; // Modèle d'intelligence artificielle utilisé par défaut (stable sur Free Tier)

// Structure d'une réponse renvoyée par ce service
export interface AIServiceResponse {
    data?: any; // Les données générées (si succès)
    error?: string; // Le message d'erreur (si échec)
}

/**
 * Service central pour toutes les opérations d'Intelligence Artificielle de l'Admin.
 */
class AIService {

    // Récupère la clé secrète (API Key) pour parler à l'IA
    private getApiKey(provider: 'gemini' | 'openai' | 'anthropic'): string {
        const env = (import.meta as any).env;
        if (provider === 'anthropic') return env.VITE_ANTHROPIC_API_KEY || '';
        if (provider === 'openai') return env.VITE_OPENAI_API_KEY || '';
        if (provider === 'gemini') return env.VITE_GEMINI_API_KEY || '';

        return '';
    }

    // Récupère le nom du modèle IA à utiliser
    private getModel(): string {
        let model = (import.meta as any).env.VITE_AI_MODEL || DEFAULT_MODEL;

        // Vérification si le modèle est supporté
        const isSupported = model.startsWith('gemini') || model.startsWith('gpt') || model.startsWith('claude');
        if (!isSupported) {
            console.warn(`Modèle non supporté (${model}), retour à ${DEFAULT_MODEL}`);
            return DEFAULT_MODEL;
        }
        return model;
    }

    // MÉTHODE INTERNE : Envoie une requête à l'IA et récupère la réponse brute
    private async callModel(prompt: string, systemPrompt: string): Promise<string> {
        let model = this.getModel();
        const isOpenAI = model.startsWith('gpt') || model.startsWith('o1');
        const isAnthropic = model.startsWith('claude');
        const isGemini = model.startsWith('gemini');

        // Détection du fournisseur (fallback sur OpenAI si inconnu avec custom Base URL)
        const env = (import.meta as any).env;
        const customBaseUrl = env.VITE_AI_BASE_URL;

        const provider = isAnthropic ? 'anthropic' : (isGemini ? 'gemini' : 'openai');
        const key = this.getApiKey(provider);

        if (!key) throw new Error(`Clé API ${provider.toUpperCase()} manquante. Configurez-la dans le fichier .env (VITE_${provider.toUpperCase()}_API_KEY).`);

        if (isAnthropic) {
            // Logique pour Anthropic (Claude)
            let baseUrl = customBaseUrl?.replace(/\/$/, '') || 'https://api.anthropic.com/v1';
            const endpoint = `${baseUrl}/messages`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': key,
                    'anthropic-version': '2023-06-01',
                    'dangerously-allow-browser': 'true'
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: prompt || "Génère les données demandées." }],
                    temperature: 0.7
                })
            });

            const text = await response.text();
            if (!response.ok) {
                if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
                    throw new Error(`Le serveur Anthropic (ou proxy) a renvoyé du HTML au lieu de JSON (Erreur ${response.status}).`);
                }
                throw new Error(`Erreur Anthropic (${response.status}): ${text}`);
            }
            const json = JSON.parse(text);
            return json.content[0].text;

        } else if (isOpenAI || (customBaseUrl && !isGemini)) {
            // Logique pour les modèles OpenAI ou Custom OpenAI-compatible via Base URL
            let baseUrl = customBaseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1';

            // Détection intelligente : si l'URL ne contient ni /v1 ni /chat, on ajoute /v1 pour les proxies standard
            // Sauf si c'est déjà une URL complète d'endpoint.
            if (!baseUrl.includes('/v1') && !baseUrl.includes('/chat') && !baseUrl.includes('/completions')) {
                baseUrl += '/v1';
            }

            const endpoint = `${baseUrl}/chat/completions`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt || "Génère les données demandées." }
                    ],
                    temperature: 0.7,
                    // Note: On évite response_format car trop de proxies (comme yinli.one) ne le supportent pas correctement ou l'interprètent mal
                })
            });

            const text = await response.text();
            if (!response.ok) {
                if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
                    throw new Error(`Le serveur a renvoyé du HTML (Erreur ${response.status}). Vérifiez votre Base URL : ${endpoint}`);
                }
                throw new Error(`Erreur API (${response.status}): ${text}`);
            }

            try {
                const json = JSON.parse(text);
                // Si la réponse est déjà un objet JSON standard OpenAI
                if (json.choices && json.choices[0] && json.choices[0].message) {
                    return json.choices[0].message.content;
                }
                // Si la réponse est un format inattendu mais JSON
                return text;
            } catch (e) {
                // Si text n'est pas du JSON, c'est peut-être une erreur texte du proxy
                if (text.length > 0 && text.length < 500 && !text.includes('{')) {
                    throw new Error(`Le serveur de l'IA a répondu : "${text}"`);
                }
                throw new Error(`Réponse invalide (non JSON). Début : ${text.slice(0, 100)}...`);
            }

        } else {
            // Logique pour les modèles Google Gemini
            const tryFetch = async (version: string, modelName: string) => {
                let endpoint = '';
                let body: any = {};
                if (customBaseUrl) {
                    const baseUrl = customBaseUrl.replace(/\/$/, '');
                    endpoint = `${baseUrl}/${version}/models/${modelName}:generateContent?key=${key}`;
                } else {
                    endpoint = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${key}`;
                }

                body = {
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nUser request: ${prompt}` }] }],
                    generationConfig: {
                        temperature: 0.8
                    },
                };

                return fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            };

            let response = await tryFetch('v1beta', model);

            // Fallback stable si le modèle spécifique de l'env n'est pas trouvé
            if (response.status === 404 && model !== DEFAULT_MODEL) {
                response = await tryFetch('v1beta', DEFAULT_MODEL);
            }

            const text = await response.text();
            if (!response.ok) {
                if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
                    throw new Error(`L'API Gemini a renvoyé du HTML (Erreur ${response.status}). Vérifiez votre Base URL.`);
                }
                throw new Error(`Erreur API Gemini (${response.status}): ${text}`);
            }

            try {
                const json = JSON.parse(text);
                return json.candidates[0].content.parts[0].text;
            } catch (e) {
                throw new Error('Format de réponse Gemini invalide ou contenu bloqué.');
            }
        }
    }

    // Génère les petits détails d'une recette
    async generateRecipeDetails(recipeName: string): Promise<AIServiceResponse> {
        const systemPrompt = `Tu es un chef expert en cuisine africaine.\nGénère les détails complets pour la recette : "${recipeName}".\nRéponds UNIQUEMENT en JSON valide avec ces clés :\n{\n  \"alias\": \"nom local\",\n  \"region\": \"région d'origine\",\n  \"category\": \"une parmi: ${CATEGORIES.map((c: any) => c.value).join(', ')}\",\n  \"difficulty\": \"Facile, Moyen ou Difficile\",\n  \"prep_time\": \"ex: 15 min\",\n  \"cook_time\": \"ex: 45 min\",\n  \"description\": \"2 phrases d'histoire/culture\",\n  \"technique_title\": \"titre technique\",\n  \"technique_description\": \"2 phrases d'explication\",\n  \"benefits\": \"bienfaits en 1 phrase\",\n  \"style\": \"style de cuisson\",\n  \"type\": \"type de plat\"\n}`;
        try {
            const text = await this.callModel('', systemPrompt);
            return { data: JSON.parse(text) };
        } catch (err: any) {
            return { error: err.message };
        }
    }

    // Génère une recette ENTIÈREMENT remplie (ingrédients, étapes...)
    async generateFullRecipe(dishName: string, context?: string): Promise<AIServiceResponse> {
        const systemPrompt = `Tu es un chef cuisinier expert en cuisine africaine. 
Ton rôle est de générer une fiche recette complète, authentique et détaillée au format JSON.
Le contexte fourni par l'utilisateur est : ${context || "Aucun contexte supplémentaire"}.

Tu DOIS répondre UNIQUEMENT avec un objet JSON valide respectant cette structure exacte :
{
  "name": "Nom du plat",
  "alias": "Nom local ou alternatif",
  "region": "Région ou pays d'origine",
  "category": "Catégorie exacte parmi celles fournies",
  "difficulty": "Facile, Moyen ou Difficile",
  "prep_time": "Temps de préparation (ex: 20 min)",
  "cook_time": "Temps de cuisson (ex: 1h 15min)",
  "description": "Une description riche de 3-4 lignes sur l'histoire et la culture de ce plat",
  "technique_title": "Nom d'une technique clé (ex: Le pilage du mil)",
  "technique_description": "Explication de cette technique en 2-3 phrases",
  "benefits": "Bienfaits nutritionnels ou santé",
  "style": "Style de cuisson (ex: Grillade, Braisé, Mijoté)",
  "type": "Type de plat (ex: Accompagnement, Plat principal)",
  "base": "Ingrédient de base du plat (ex: Manioc, Riz, Mil)",
  "ingredients": [
    { "name": "Nom ingrédient", "quantity": "quantité", "unit": "unité", "category": "Catégorie (ex: Légumes, Viandes, Épices)", "notes": "optionnel" }
  ],
  "steps": [
    { "order": 1, "title": "Titre étape", "description": "Description détaillée de l'étape" }
  ],
  "rating": 4.5,
  "servings": 4
}
Assure-toi que les ingrédients et les étapes sont complets pour assurer la réussite du plat.`;
        try {
            const text = await this.callModel(`Génère la fiche complète pour le plat : ${dishName}`, systemPrompt);
            return { data: this.extractJson(text) };
        } catch (err: any) {
            return { error: err.message };
        }
    }

    // Aide à extraire le JSON proprement même si l'IA ajoute du texte autour
    private extractJson(text: string): any {
        if (!text) throw new Error("Réponse vide de l'IA.");

        // Nettoyage basique des backticks markdown
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        try {
            return JSON.parse(cleaned);
        } catch (e) {
            // Tentative de recherche du premier { et dernier }
            const start = cleaned.indexOf('{');
            const end = cleaned.lastIndexOf('}');
            if (start !== -1 && end !== -1 && end > start) {
                try {
                    return JSON.parse(cleaned.substring(start, end + 1));
                } catch (e2) {
                    console.error("Échec extraction JSON. Texte brut:", text);
                    throw new Error("L'IA a renvoyé un format JSON corrompu.");
                }
            }
            throw new Error(`L'IA n'a pas renvoyé de JSON valide. Réponse reçue : ${text.slice(0, 50)}...`);
        }
    }

    // Suggère des sections de plats pour animer la page d'accueil
    async suggestSections(catalogContext: string, goal: string): Promise<AIServiceResponse> {
        const systemPrompt = `Expert UX Cuisine. Analyse ce catalogue de recettes et propose une section thématique pertinente.
Catalogue actuel : ${catalogContext}
Objectif : ${goal}

Réponds avec un JSON :
{
  "theme": "titre de la section",
  "explanation": "pourquoi cette section est pertinente"
}`;
        try {
            const text = await this.callModel('', systemPrompt);
            return { data: JSON.parse(text) };
        } catch (err: any) {
            return { error: err.message };
        }
    }

    // Récupère quelques recettes au hasard pour donner des idées à l'IA
    async getSampleRecipes(count: number): Promise<{ id: string; name: string }[]> {
        const { data, error } = await supabase
            .from('recipes')
            .select('id, name, category')
            .order('name')
            .limit(count);
        if (error) throw new Error(error.message);
        return data.map((r: any) => ({ id: r.id, name: `${r.name} (${r.category})` }));
    }

    // Crée une section entière de l'accueil
    async generateSection(type: string, theme: string, recipes: { id: string; name: string }[]): Promise<AIServiceResponse> {
        const catalogContext = recipes.map(r => `ID: ${r.id} | Nom: ${r.name}`).join('\n');
        const systemPrompt = `Tu es un expert UX pour l'app AfroCuisto. Ton rôle est de créer une section attractive pour la page d'accueil de l'application mobile.
Type de section : "${type}"
Thème/Objectif : "${theme}"

Catalogue disponible (Choisis UNIQUEMENT parmi ces IDs) :
${catalogContext}

Réponds avec un objet JSON PUR ayant EXACTEMENT cette structure :
{
  "title": "Titre accrocheur (ex: Spécialités Épicées)",
  "subtitle": "Un sous-titre invitant à la découverte",
  "type": "${type}",
  "page": "home",
  "recipe_ids": ["id1", "id2", "id3"], 
  "reasoning": "Explication courte du choix des plats"
}

IMPORTANT : Ne mets aucun texte avant ou après le JSON. Retourne entre 3 et 8 IDs de recettes pertinents.`;
        try {
            const text = await this.callModel('Génère le JSON de la section maintenant.', systemPrompt);
            return { data: this.extractJson(text) };
        } catch (err: any) {
            console.error('AI Generation error:', err);
            return { error: err.message };
        }
    }
}

// On exporte une instance déjà prête à l'emploi
export const aiService = new AIService();
