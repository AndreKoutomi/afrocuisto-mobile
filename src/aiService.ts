/**
 * ============================================================================
 * EXPLICATION DU FICHIER POUR LES DÉBUTANTS
 * ============================================================================
 * Rôle principal : Service d'Intelligence Artificielle. Se connecte aux API de Google Gemini ou Anthropic Claude pour générer des recommandations culinaires personnalisées et intelligentes aux utilisateurs.
 * 
 * Conseils de lecture :
 * - Cherchez les mots-clés "function" ou "const" pour voir les actions définies.
 * - Le mot "return" suivi de balises HTML (ex: <div>) indique un élément visuel (Composant React).
 * - "import" en haut signifie qu'on utilise des outils d'autres fichiers pour s'aider.
 * ============================================================================
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Recipe } from "./types";

const GEMINI_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env.GEMINI_API_KEY as string);
const ANTHROPIC_KEY = (import.meta as any).env.VITE_ANTHROPIC_API_KEY || (process.env.ANTHROPIC_API_KEY as string);
const AI_MODEL = (import.meta as any).env.VITE_AI_MODEL || "gemini-1.5-flash";

const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

export async function getAIRecipeRecommendation(recipes: Recipe[], userName: string): Promise<string> {
    const prompt = `
      Tu es l'assistant culinaire expert d'AfroCuisto, une application dédiée à la cuisine béninoise et africaine.
      
      Voici la liste des plats disponibles :
      ${recipes.map(r => `- ${r.name} (${r.region}) : ${r.description}`).join('\n')}
      
      L'utilisateur s'appelle ${userName}.
      
      Choisis un plat du jour parmi cette liste de manière intelligente et originale. 
      Explique ton choix en une seule phrase courte et chaleureuse (maximum 150 caractères). 
      Le ton doit être invitant et mettre en valeur la culture béninoise.
      Donne uniquement la phrase de recommandation.
    `;

    try {
        if (AI_MODEL.startsWith("claude") && ANTHROPIC_KEY) {
            // Utilisation d'Anthropic Claude
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": ANTHROPIC_KEY,
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-direct-browser-access": "true"
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    max_tokens: 150,
                    messages: [
                        { role: "user", content: prompt }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Anthropic Error: ${errorData.error?.message || response.statusText}`);
            }
            const json = await response.json();
            return json.content[0].text.trim();
        } else if (genAI) {
            // Utilisation de Gemini
            const model = genAI.getGenerativeModel({ model: AI_MODEL.includes("gemini") ? AI_MODEL : "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        }

        throw new Error("Aucun modèle ou clé API configurés correctement.");
    } catch (error) {
        console.error("AI Error:", error);
        return "Découvrez notre spécialité du jour sélectionnée pour vous !";
    }
}
