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

import { GoogleGenerativeAI } from "@google/generative-ai"; // Importation de l'outil Google Gemini
import { Recipe } from "./types"; // Importation de la définition d'une Recette

// Récupération des clés API (mots de passe pour parler aux serveurs IA)
const GEMINI_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env.GEMINI_API_KEY as string);
const ANTHROPIC_KEY = (import.meta as any).env.VITE_ANTHROPIC_API_KEY || (process.env.ANTHROPIC_API_KEY as string);
const AI_MODEL = (import.meta as any).env.VITE_AI_MODEL || "gemini-1.5-flash";

// Création d'une instance (un objet) pour communiquer avec Google Gemini
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

/**
 * Fonction qui demande à l'IA de suggérer un plat du jour.
 * @param recipes Liste de toutes les recettes
 * @param userName Nom de l'utilisateur
 * @returns La recommandation sous forme de texte
 */
export async function getAIRecipeRecommendation(recipes: Recipe[], userName: string): Promise<string> {
    // Le "prompt" est l'instruction détaillée qu'on donne à l'IA
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

    // Check if any API key is configured
    if (!GEMINI_KEY && !ANTHROPIC_KEY) {
        // No API key configured - return default message silently
        return "Découvrez notre spécialité du jour sélectionnée pour vous !";
    }

    try {
        // Si le modèle configuré est Claude (Anthropic)
        if (AI_MODEL.startsWith("claude") && ANTHROPIC_KEY) {
            // Appel à l'API Anthropic
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

            // En cas d'erreur de réponse du serveur
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Anthropic Error: ${errorData.error?.message || response.statusText}`);
            }
            // Lecture du résultat JSON
            const json = await response.json();
            return json.content[0].text.trim();
        } else if (genAI) {
            // Sinon, si Gemini est disponible, on l'utilise
            const model = genAI.getGenerativeModel({ model: AI_MODEL.includes("gemini") ? AI_MODEL : "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text(); // On retourne le texte généré par Gemini
        }

        // Si aucun service n'est prêt
        throw new Error("Aucun modèle ou clé API configurés correctement.");
    } catch (error) {
        // S'il y a un plantage, on affiche l'erreur en rouge dans la console
        console.error("AI Error:", error);
        // On renvoie un message par défaut pour que l'app ne s'arrête pas
        return "Découvrez notre spécialité du jour sélectionnée pour vous !";
    }
}
