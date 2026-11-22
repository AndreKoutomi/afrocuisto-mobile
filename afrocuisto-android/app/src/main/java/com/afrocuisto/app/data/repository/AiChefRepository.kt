package com.afrocuisto.app.data.repository

import com.afrocuisto.app.data.model.AiChefIngredient
import com.afrocuisto.app.data.model.AiChefMessage
import com.afrocuisto.app.data.model.AiChefRecipeResult
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class AiChefRepository {

    private val _messages = MutableStateFlow<List<AiChefMessage>>(
        listOf(
            AiChefMessage(
                id = "welcome",
                sender = "ai",
                text = "Bonjour ! Je suis Chef Afro, ton assistant culinaire IA expert en gastronomie africaine. 👨‍🍳✨ Que souhaites-tu cuisiner aujourd'hui ? Tu peux me donner tes ingrédients en frigo ou me poser une question !",
                quickSuggestions = listOf(
                    "J'ai du poulet, de la farine et des tomates 🍅",
                    "Propose-moi un plat rapide en 20 min ⏱️",
                    "Comment réussir mon Amiwô sans grumeaux ?"
                )
            )
        )
    )
    val messages: Flow<List<AiChefMessage>> = _messages.asStateFlow()

    suspend fun sendMessage(userText: String) {
        val userMsg = AiChefMessage(
            id = "user_${System.currentTimeMillis()}",
            sender = "user",
            text = userText
        )
        _messages.value = _messages.value + userMsg

        // Simuler la réflexion et réponse du Chef IA
        delay(1200)

        val aiResponse = when {
            userText.contains("ingrédient", ignoreCase = true) || userText.contains("poulet", ignoreCase = true) || userText.contains("frigo", ignoreCase = true) -> {
                AiChefMessage(
                    id = "ai_${System.currentTimeMillis()}",
                    sender = "ai",
                    text = "Aha ! Avec du poulet et des tomates, je te suggère vivement de préparer un délicieux Amiwô au Poulet Braisé ! Voici la recette sur-mesure adaptée à tes ingrédients :",
                    recipe = AiChefRecipeResult(
                        id = "ai_rec_P02",
                        dishName = "Amiwô au Poulet Braisé Express",
                        region = "Bénin",
                        totalTime = "35 min",
                        difficulty = "Facile",
                        servings = "4 personnes",
                        usedIngredients = listOf(
                            AiChefIngredient("Poulet", "500g"),
                            AiChefIngredient("Purée de tomates", "3 c. à soupe"),
                            AiChefIngredient("Oignons", "2 pièces")
                        ),
                        missingIngredients = listOf(
                            AiChefIngredient("Farine de maïs", "400g")
                        ),
                        steps = listOf(
                            "Faire dorer le poulet assaisonné avec les oignons dans une poêle.",
                            "Préparer le bouillon tomate et y verser la farine de maïs en pluie.",
                            "Servir la pâte rouge bien chaude avec le poulet croustillant."
                        ),
                        chefTip = "Astuce du Chef : Ajoute une pincée de gingembre moulu dans la marinade du poulet !"
                    )
                )
            }
            userText.contains("grumeaux", ignoreCase = true) || userText.contains("amiwô", ignoreCase = true) -> {
                AiChefMessage(
                    id = "ai_${System.currentTimeMillis()}",
                    sender = "ai",
                    text = "Pour réussir ton Amiwô sans aucun grumeau :\n\n1. Verse la farine de maïs très progressivement en pluie fine 🌧️\n2. Remue énergiquement avec un fouet ou une spatule en bois sans t'arrêter 🪵\n3. Maintiens le bouillon bien frémissant mais pas trop bouillonnant !"
                )
            }
            else -> {
                AiChefMessage(
                    id = "ai_${System.currentTimeMillis()}",
                    sender = "ai",
                    text = "Super idée ! La cuisine africaine est riche en saveurs. Veux-tu que je te trouve les meilleures recettes du terroir ou des astuces pour sublimer tes épices ?",
                    quickSuggestions = listOf("Voir les plats phares 🔥", "Proposer une boisson rafraîchissante 🍹")
                )
            }
        }

        _messages.value = _messages.value + aiResponse
    }
}
