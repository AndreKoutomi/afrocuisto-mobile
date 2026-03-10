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

import { CATEGORIES } from '../pages/RecipeForm';
import { supabase } from '../lib/supabase';

const DEFAULT_MODEL = 'gemini-1.5-flash';

export interface AIServiceResponse {
    data?: any;
    error?: string;
}

/**
 * Centralisation des appels IA pour l'administration.
 * Cette classe permet de basculer facilement entre les modèles et de gérer les clés API.
 */
class AIService {
    // ---------------------------------------------------------------------
    // 1️⃣ Gestion de la clé API
    // ---------------------------------------------------------------------
    private getApiKey(): string {
        // Priorité absolue au localStorage pour la personnalisation utilisateur
        const userKey = localStorage.getItem('gemini_api_key');
        if (userKey) return userKey;

        // Repli sur la clé globale
        return (import.meta as any).env.VITE_GEMINI_API_KEY || '';
    }

    async testKey(key: string, model: string, baseUrl?: string): Promise<{ success: boolean; message: string }> {
        const isOpenAI = model.startsWith('gpt');
        try {
            if (isOpenAI) {
                const endpoint = `${baseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1'}/chat/completions`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model,
                        messages: [{ role: 'user', content: 'Say hi' }],
                        max_tokens: 5
                    })
                });
                if (!response.ok) {
                    const err = await response.text();
                    return { success: false, message: `Erreur OpenAI: ${response.status} - ${err}` };
                }
                return { success: true, message: 'Connexion OpenAI réussie !' };
            } else {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'hi' }] }],
                        generationConfig: { maxOutputTokens: 5 }
                    })
                });
                if (!response.ok) {
                    const err = await response.text();
                    return { success: false, message: `Erreur Gemini: ${response.status} - ${err}` };
                }
                return { success: true, message: 'Connexion Gemini réussie !' };
            }
        } catch (err: any) {
            return { success: false, message: `Erreur de connexion: ${err.message}` };
        }
    }

    // ---------------------------------------------------------------------
    // 2️⃣ Gestion du modèle (Gemini Only)
    // ---------------------------------------------------------------------
    private getModel(): string {
        let model = localStorage.getItem('gemini_model') || (import.meta as any).env.VITE_AI_MODEL || DEFAULT_MODEL;

        // Allow Gemini and GPT models
        const isSupported = model.startsWith('gemini') || model.startsWith('gpt');
        if (!isSupported) {
            console.warn(`Modèle non supporté (${model}), retour à ${DEFAULT_MODEL}`);
            return DEFAULT_MODEL;
        }
        return model;
    }

    setModel(modelId: string) {
        localStorage.setItem('gemini_model', modelId);
    }

    // ---------------------------------------------------------------------
    // 3️⃣ Méthode d'appel Gemini
    // ---------------------------------------------------------------------
    private async callModel(prompt: string, systemPrompt: string): Promise<string> {
        const key = this.getApiKey();
        if (!key) throw new Error('Clé API manquante. Configurez-la dans les Réglages.');

        let model = this.getModel();
        const isOpenAI = model.startsWith('gpt');
        const customBaseUrl = localStorage.getItem('ai_base_url');

        if (isOpenAI) {
            const endpoint = `${customBaseUrl?.replace(/\/$/, '') || 'https://api.openai.com/v1'}/chat/completions`;
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
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Erreur OpenAI (${response.status}): ${err}`);
            }

            const json = await response.json();
            return json.choices[0].message.content;
        } else {
            // Logic for Google Gemini
            const tryFetch = async (version: string, modelName: string) => {
                const endpoint = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${key}`;
                const body = {
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nUser request: ${prompt}` }] }],
                    generationConfig: {
                        temperature: 0.8,
                        responseMimeType: 'application/json'
                    },
                };
                return fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            };

            // Tentative 1: v1beta avec le modèle sélectionné
            let response = await tryFetch('v1beta', model);

            // Fallback 1: Si 404, tenter v1
            if (response.status === 404) {
                response = await tryFetch('v1', model);
            }

            // Fallback 2: Si toujours 404 et ce n'est pas le défaut, forcer le défaut
            if (response.status === 404 && model !== DEFAULT_MODEL) {
                console.warn(`Modèle ${model} non trouvé, repli sur ${DEFAULT_MODEL}`);
                response = await tryFetch('v1beta', DEFAULT_MODEL);
            }

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Erreur API Gemini (${response.status}): ${err}`);
            }

            const json = await response.json();
            try {
                return json.candidates[0].content.parts[0].text;
            } catch (e) {
                throw new Error('Format de réponse Gemini invalide ou contenu bloqué.');
            }
        }
    }

    // ---------------------------------------------------------------------
    // 4️⃣ Méthodes métier existantes, ré‑écrites avec callModel
    // ---------------------------------------------------------------------
    async generateRecipeDetails(recipeName: string): Promise<AIServiceResponse> {
        const systemPrompt = `Tu es un chef expert en cuisine africaine.\nGénère les détails complets pour la recette : "${recipeName}".\nRéponds UNIQUEMENT en JSON valide avec ces clés :\n{\n  \"alias\": \"nom local\",\n  \"region\": \"région d'origine\",\n  \"category\": \"une parmi: ${CATEGORIES.map((c: any) => c.value).join(', ')}\",\n  \"difficulty\": \"Facile, Moyen ou Difficile\",\n  \"prep_time\": \"ex: 15 min\",\n  \"cook_time\": \"ex: 45 min\",\n  \"description\": \"2 phrases d'histoire/culture\",\n  \"technique_title\": \"titre technique\",\n  \"technique_description\": \"2 phrases d'explication\",\n  \"benefits\": \"bienfaits en 1 phrase\",\n  \"style\": \"style de cuisson\",\n  \"type\": \"type de plat\"\n}`;
        try {
            const text = await this.callModel('', systemPrompt);
            return { data: JSON.parse(text) };
        } catch (err: any) {
            return { error: err.message };
        }
    }

    /**
     * Génère une recette COMPLÈTE avec toutes les métadonnées, ingrédients et étapes,
     * en parfait alignement avec le schéma du formulaire RecipeForm.
     */
    async generateFullRecipe(dishName: string, context?: string): Promise<AIServiceResponse> {
        const systemPrompt = `Tu es un chef cuisinier expert en cuisine africaine (principalement de l'Afrique de l'Ouest et du Centre), auteur de livres de cuisine et consultant culinaire.

Tu dois générer une fiche recette EXTRÊMEMENT DÉTAILLÉE et AUTHENTIQUE pour le plat : "${dishName}"${context ? `\nContexte supplémentaire : ${context}` : ''}.

RÉPONDS UNIQUEMENT EN JSON VALIDE avec EXACTEMENT cette structure (sans markdown, sans balises de code) :
{
  "name": "Nom officiel du plat",
  "alias": "Nom en langue locale (Fon, Yoruba, Dioula, etc.)",
  "region": "Région/Pays d'origine précis (ex: Bénin Sud, Côte d'Ivoire, Sénégal)",
  "category": "EXACTEMENT une de ces valeurs: Pâtes et Céréales (Wɔ̌) | Sauces (Nùsúnnú) | Plats de Résistance & Ragoûts | Protéines & Grillades | Street Food & Snacks (Amuse-bouche) | Boissons & Douceurs | Condiments & Accompagnements",
  "difficulty": "EXACTEMENT une de ces valeurs: Très Facile | Facile | Intermédiaire | Moyen | Difficile | Très Difficile",
  "prep_time": "Durée réaliste ex: 20 min",
  "cook_time": "Durée réaliste ex: 1h 30min",
  "type": "Type de plat ex: Plat principal, Entrée, Dessert, Boisson, Sauce d'accompagnement",
  "style": "Mode de cuisson ex: Mijoté, Braisé, Frit, Vapeur, Grillé",
  "base": "Ingrédient principal ex: Igname, Poulet, Maïs, Manioc",
  "origine_humaine": "Groupe ethnique/culturel d'origine ex: Fon, Yoruba, Baoulé, Wolof",
  "description": "Paragraphe riche de 3-4 phrases sur l'histoire culturelle, l'origine du plat, son importance dans la société et sa saveur caractéristique.",
  "technique_title": "Titre court de la technique clé ex: La fermentation du dawadawa",
  "technique_description": "2-3 phrases décrivant la technique clé qui différencie ce plat et le rend authentique.",
  "benefits": "1-2 phrases sur les bienfaits nutritionnels et santé du plat.",
  "ingredients": [
    {
      "name": "Nom de l'ingrédient",
      "quantity": "quantité numérique ou descriptive",
      "unit": "unité de mesure (g, kg, cl, L, pièce, c. à soupe, c. à café, tasse, etc.)",
      "notes": "note optionnelle ex: finement haché, en poudre, à température ambiante",
      "category": "EXACTEMENT un de: Viandes & Poissons | Légumes & Tubercules | Épices & Aromates | Céréales & Légumineuses | Huiles & Condiments | Autres"
    }
  ],
  "steps": [
    {
      "order": 1,
      "title": "Titre court de l'étape",
      "description": "Instructions précises et détaillées pour réaliser cette étape, avec les temps et températures si nécessaire. Minimum 2 phrases."
    }
  ],
  "rating": 4.5,
  "servings": 4
}

RÈGLES D'OR:
- Les ingrédients doivent être AUTHENTIQUES et disponibles en Afrique de l'Ouest.
- Génère entre 8 et 18 ingrédients selon la complexité du plat.
- Génère entre 5 et 10 étapes de préparation claires et détaillées.
- Respecte STRICTEMENT les catégories et difficultés imposées.
- La description doit être inspirante et culturellement précise.
- Retourne du JSON pur, sans aucun commentaire ni balise markdown.`;

        try {
            const text = await this.callModel(`Génère la fiche complète pour: ${dishName}`, systemPrompt);
            const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return { data: parsed };
        } catch (err: any) {
            return { error: err.message };
        }
    }

    async suggestSections(catalogContext: string, goal: string): Promise<AIServiceResponse> {
        const systemPrompt = `Expert UX Cuisine. Analyse ce catalogue et propose une section thématique pour l'objectif : "${goal}".\nCatalogue :\n${catalogContext}\n\nRéponds en JSON :\n{\n  \"title\": \"titre\",\n  \"subtitle\": \"sous-titre\",\n  \"type\": \"dynamic_carousel | horizontal_list | vertical_list_1 | featured\",\n  \"recipe_ids\": [\"id1\", \"id2\", \"...\"],\n  \"reasoning\": \"pourquoi ces choix ?\"\n}`;
        try {
            const text = await this.callModel('', systemPrompt);
            return { data: JSON.parse(text) };
        } catch (err: any) {
            return { error: err.message };
        }
    }

    /** Retourne un échantillon de recettes (id + nom) pour le wizard */
    async getSampleRecipes(count: number): Promise<{ id: string; name: string }[]> {
        const { data, error } = await supabase
            .from('recipes')
            .select('id, name, category')
            .order('name') // popularity n'existe pas, on utilise name
            .limit(count);
        if (error) throw new Error(error.message);
        return data.map((r: any) => ({ id: r.id, name: `${r.name} (${r.category})` }));
    }

    async generateSection(type: string, theme: string, recipes: { id: string; name: string }[]): Promise<AIServiceResponse> {
        const catalogContext = recipes.map(r => `ID: ${r.id} | Nom: ${r.name}`).join('\n');
        const systemPrompt = `You are an expert UX designer for an African cuisine app called "AfroCuisto".
Your goal is to create a compelling content section for the admin dashboard.

SECTION TYPE: ${type}
THEME: ${theme}

AVAILABLE RECIPES (PICK FROM THESE):
${catalogContext}

REQUIRED JSON STRUCTURE:
{
  "title": "A catchy title in French",
  "subtitle": "An inviting subtitle in French",
  "type": "${type}",
  "recipe_ids": ["selected_id_1", "selected_id_2"],
  "reasoning": "Brief explanation in French",
  "page": "home or explorer"
}

IMPORTANT:
- Use only IDs from the catalog above.
- The title and subtitle must be in French.
- Return ONLY the JSON object.`;

        try {
            const text = await this.callModel('Generate the section JSON now.', systemPrompt);
            // Nettoyage au cas où l'IA ajoute des balises markdown ```json
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return { data: JSON.parse(cleanedText) };
        } catch (err: any) {
            console.error('AI Generation error:', err);
            return { error: err.message };
        }
    }
}

export const aiService = new AIService();
