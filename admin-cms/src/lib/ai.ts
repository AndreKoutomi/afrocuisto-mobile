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
        // 1. Priorité à la clé globale du projet (configurée par le dev)
        const globalKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (globalKey) return globalKey;
        // 2. Repli sur la clé de l'utilisateur (localStorage)
        return localStorage.getItem('gemini_api_key') || '';
    }

    // ---------------------------------------------------------------------
    // 2️⃣ Gestion du modèle (Gemini ou OpenAI)
    // ---------------------------------------------------------------------
    /** Retourne le modèle actuellement sélectionné (stocké en localStorage) */
    private getModel(): string {
        return localStorage.getItem('gemini_model') || DEFAULT_MODEL;
    }

    /** Permet de changer le modèle depuis l'UI (ex. via Settings) */
    setModel(modelId: string) {
        localStorage.setItem('gemini_model', modelId);
    }

    // ---------------------------------------------------------------------
    // 3️⃣ Méthode générique d'appel IA (supporte Gemini et OpenAI)
    // ---------------------------------------------------------------------
    private async callModel(prompt: string, systemPrompt: string): Promise<string> {
        const key = this.getApiKey();
        if (!key) throw new Error('Clé API manquante');
        const model = this.getModel();
        const isGemini = model.startsWith('gemini');
        const endpoint = isGemini
            ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
            : 'https://api.openai.com/v1/chat/completions';
        const body = isGemini
            ? {
                contents: [{ parts: [{ text: systemPrompt }, { text: prompt }] }],
                generationConfig: { temperature: 0.8, responseMimeType: 'application/json' },
            }
            : {
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.8,
            };
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (!isGemini) {
            // @ts-ignore - dynamic addition of Authorization header for OpenAI
            (headers as any)['Authorization'] = `Bearer ${key}`;
        }
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Erreur API (${response.status}): ${err}`);
        }
        const json = await response.json();
        if (isGemini) {
            return json.candidates[0].content.parts[0].text;
        } else {
            return json.choices[0].message.content;
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

    async suggestSections(catalogContext: string, goal: string): Promise<AIServiceResponse> {
        const systemPrompt = `Expert UX Cuisine. Analyse ce catalogue et propose une section thématique pour l'objectif : "${goal}".\nCatalogue :\n${catalogContext}\n\nRéponds en JSON :\n{\n  \"title\": \"titre\",\n  \"subtitle\": \"sous-titre\",\n  \"type\": \"dynamic_carousel | horizontal_list | vertical_list_1 | featured\",\n  \"recipe_ids\": [\"id1\", \"id2\", \"...\"],\n  \"reasoning\": \"pourquoi ces choix ?\"\n}`;
        try {
            const text = await this.callModel('', systemPrompt);
            return { data: JSON.parse(text) };
        } catch (err: any) {
            return { error: err.message };
        }
    }

    /** Retourne un petit échantillon de recettes (nom + catégorie) pour le wizard */
    async getSampleRecipes(count: number): Promise<string[]> {
        const { data, error } = await supabase
            .from('recipes')
            .select('id, name, category')
            .order('popularity', { ascending: false })
            .limit(count);
        if (error) throw new Error(error.message);
        return data.map((r: any) => `${r.name} (${r.category})`);
    }
    async generateSection(type: string, theme: string, recipes: string[]): Promise<AIServiceResponse> {
        const systemPrompt = `You are an expert UX designer for African cuisine apps. Create a section of type "${type}" with the theme "${theme}". Include the following recipes: ${recipes.join(', ')}. Return ONLY a valid JSON with keys: title, subtitle, type, recipe_ids (array of IDs), reasoning, page (optional).`;
        try {
            const text = await this.callModel('', systemPrompt);
            return { data: JSON.parse(text) };
        } catch (err: any) {
            return { error: err.message };
        }
    }
}

export const aiService = new AIService();
