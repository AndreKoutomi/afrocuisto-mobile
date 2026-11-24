package com.afrocuisto.app.data.repository

import android.content.Context
import android.util.Log
import com.afrocuisto.app.data.model.AiChefConversationHistory
import com.afrocuisto.app.data.model.AiChefIngredient
import com.afrocuisto.app.data.model.AiChefMessage
import com.afrocuisto.app.data.model.AiChefRecipeResult
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean

class AiChefRepository(context: Context? = null) {

    companion object {
        private const val TAG = "AiChefRepository"
        private const val INTERACTIONS_URL =
            "https://generativelanguage.googleapis.com/v1/interactions"
        private val CHAT_THINKING_MODELS = listOf(
            "gemini-4-hydrogen",
            "gemini-3.5-flash-lite"
        )

        private const val STRICT_CULINARY_SYSTEM_PROMPT = """
Tu es Chef Afro, l'assistant culinaire exclusif d'AfroCuisto, expert en gastronomie africaine et cuisine du quotidien.
RÈGLES IMPÉRATIVES :
1. Domaine strictement culinaire : tu réponds UNIQUEMENT aux questions liées à la cuisine, aux recettes, ingrédients, techniques de cuisson, épices, nutrition alimentaire, accords boissons, conservation ou organisation de repas.
2. Si la question est hors-sujet (programmation, politique, finance, maths, sport, actualité, etc.), réponds uniquement avec une ouverture polie commençant par "### Hors domaine culinaire" expliquant que Frigo Magique est exclusivement dédié à la cuisine, puis propose 3 idées culinaires concrètes.
3. Ouverture et structure obligatoires pour toute réponse culinaire en français :
   - Commence TOUJOURS par un titre clair `### Nom du plat ou sujet culinaire` suivi d'une phrase d'ouverture chaleureuse et précise.
   - Enchaîne avec des sections bien ordonnées :
     `#### Ingrédients clés` (puces `- **Nom** : quantité`)
     `#### Préparation étape par étape` (étapes numérotées `1. **Action** : détail précis`)
     `> **Astuce du Chef** : conseil technique concret`
     `> **Accord conseillé** : boisson ou accompagnement idéal`
4. Réponses complètes, précises sur les quantités, temps et textures, en français soigné, sans aucun emoji.
"""
    }

    private val json = Json { ignoreUnknownKeys = true }

    private val historyPreferences = context?.applicationContext?.getSharedPreferences("ai_chef_history", Context.MODE_PRIVATE)
    private val _conversationHistory = MutableStateFlow(loadConversationHistory())
    val conversationHistory: StateFlow<List<AiChefConversationHistory>> = _conversationHistory.asStateFlow()

    private val _messages = MutableStateFlow<List<AiChefMessage>>(emptyList())
    val messages: Flow<List<AiChefMessage>> = _messages.asStateFlow()

    private val _isThinking = MutableStateFlow(false)
    val isThinking: Flow<Boolean> = _isThinking.asStateFlow()

    private val _isStreaming = MutableStateFlow(false)
    val isStreaming: Flow<Boolean> = _isStreaming.asStateFlow()

    private val cancelRequested = AtomicBoolean(false)
    private var previousInteractionId: String? = null

    fun resetConversation() {
        archiveCurrentConversation()
        cancelRequested.set(true)
        previousInteractionId = null
        _isThinking.value = false
        _isStreaming.value = false
        _messages.value = emptyList()
    }

    fun restoreConversation(conversation: AiChefConversationHistory) {
        cancelRequested.set(true)
        previousInteractionId = null
        _isThinking.value = false
        _isStreaming.value = false
        _messages.value = conversation.messages
    }

    private fun archiveCurrentConversation() {
        val completedMessages = _messages.value.filter { !it.isThinkingActive && !it.isStreaming }
        val firstPrompt = completedMessages.firstOrNull { it.sender == "user" }?.text?.trim().orEmpty()
        if (firstPrompt.isBlank() || completedMessages.none { it.sender == "ai" }) return
        val now = System.currentTimeMillis()
        val updated = listOf(
            AiChefConversationHistory(
                id = "conversation_$now",
                title = firstPrompt.take(72),
                updatedAt = now,
                messages = completedMessages
            )
        ) + _conversationHistory.value
        _conversationHistory.value = updated.take(30)
        runCatching { historyPreferences?.edit()?.putString("conversations", json.encodeToString(_conversationHistory.value))?.apply() }
    }

    private fun loadConversationHistory(): List<AiChefConversationHistory> = runCatching {
        val saved = historyPreferences?.getString("conversations", null) ?: return emptyList()
        json.decodeFromString<List<AiChefConversationHistory>>(saved)
    }.getOrDefault(emptyList())

    fun cancelGeneration() {
        cancelRequested.set(true)
        _isThinking.value = false
        _isStreaming.value = false
        _messages.value = _messages.value.map { msg ->
            if (msg.isThinkingActive || msg.isStreaming) {
                msg.copy(
                    isThinkingActive = false,
                    isStreaming = false,
                    text = msg.text.orEmpty().ifBlank { "Génération interrompue." }
                )
            } else {
                msg
            }
        }
    }

    fun liveGreeting(persona: String = "Chef Afro"): String =
        "Salut ! Je suis Chef Afro en direct. Dis-moi ce que tu as dans ton frigo ou ce qui te ferait plaisir à cuisiner."

    /**
     * Records a completed real-time WebSocket turn (`gemini-3.8-live`) into the conversation
     * feed and returns any matching catalog recipe card.
     */
    fun recordLiveTurn(userText: String, aiText: String): AiChefRecipeResult? {
        val cleanUser = userText.trim()
        val cleanAi = aiText.trim()
        val now = System.currentTimeMillis()
        val updated = _messages.value.toMutableList()

        if (cleanUser.isNotEmpty()) {
            updated += AiChefMessage(
                id = "live_ws_user_$now",
                sender = "user",
                text = cleanUser
            )
        }

        val offTopic = isOffTopicQuery(cleanUser)
        val matched = if (offTopic) null else matchCatalogRecipe("$cleanUser $cleanAi", "Chef Afro", strictMatch = true)

        if (cleanAi.isNotEmpty()) {
            updated += AiChefMessage(
                id = "live_ws_ai_${now + 1}",
                sender = "ai",
                text = cleanAi,
                recipe = matched,
                audioSpoken = true
            )
        }

        _messages.value = updated
        return matched
    }

    /**
     * Full thinking + progressive streaming chat turn:
     * 1. Appends user message + live AI placeholder in Thinking state.
     * 2. Uses Gemini 4 Hydrogen (`gemini-4-hydrogen`) Interactions SSE streaming with reasoning summaries
     *    when a valid API key is present, and seamlessly falls back to the complete culinary reasoning
     *    & progressive streaming engine locally.
     */
    suspend fun sendMessage(
        userText: String,
        mode: String = "Chat",
        persona: String = "Chef Afro",
        apiKey: String = ""
    ): AiChefMessage? {
        val cleaned = userText.trim()
        if (cleaned.isEmpty()) return null

        cancelRequested.set(false)
        val now = System.currentTimeMillis()
        val userMsg = AiChefMessage(
            id = "user_$now",
            sender = "user",
            text = cleaned
        )
        val aiMsgId = "ai_${now + 1}"
        val placeholderAi = AiChefMessage(
            id = aiMsgId,
            sender = "ai",
            text = "",
            thoughtSummary = "",
            isThinkingActive = true,
            isStreaming = false
        )

        _messages.value = _messages.value + userMsg + placeholderAi
        _isThinking.value = true
        _isStreaming.value = false

        val offTopic = isOffTopicQuery(cleaned)
        val matchedRecipe = if (offTopic) null else matchCatalogRecipe(cleaned, persona)

        try {
            // If off-topic, enforce strict culinary guardrail immediately with crisp reasoning trace
            if (!offTopic && apiKey.isNotBlank()) {
                val streamedFromCloud = tryStreamGeminiThinkingResponse(
                    aiMsgId = aiMsgId,
                    userText = cleaned,
                    mode = mode,
                    persona = persona,
                    apiKey = apiKey,
                    matchedRecipe = matchedRecipe
                )
                if (streamedFromCloud) {
                    return _messages.value.lastOrNull { it.id == aiMsgId }
                }
            }

            // Local rich culinary thinking + progressive token-by-token streaming engine
            val blueprint = buildStructuredCulinaryBlueprint(
                cleaned = cleaned,
                mode = mode,
                persona = persona,
                isOffTopic = offTopic
            )

            streamLocalThinkingAndAnswer(
                aiMsgId = aiMsgId,
                blueprint = blueprint
            )
            return _messages.value.lastOrNull { it.id == aiMsgId }
        } catch (ce: CancellationException) {
            throw ce
        } finally {
            _isThinking.value = false
            _isStreaming.value = false
        }
    }

    /**
     * Streams real reasoning (`thought_summary`) and progressive response tokens (`text`)
     * from `gemini-4-hydrogen` via the Interactions API SSE endpoint.
     */
    private suspend fun tryStreamGeminiThinkingResponse(
        aiMsgId: String,
        userText: String,
        mode: String,
        persona: String,
        apiKey: String,
        matchedRecipe: AiChefRecipeResult?
    ): Boolean {
        val startTime = System.currentTimeMillis()
        var thinkingEndTime = 0L
        val thoughtBuffer = StringBuilder()
        val textBuffer = StringBuilder()
        var receivedAnyText = false

        val personaDirective = when (persona) {
            "Rapide <20m" -> "Privilégie une recette express prête en 15 à 20 minutes maximum."
            "Tradition" -> "Mets l'accent sur le savoir-faire traditionnel africain, les gestes authentiques et les saveurs du terroir."
            else -> "Adopte le ton bienveillant, précis et inspirant d'un chef africain moderne."
        }
        val modeDirective = if (mode.equals("Frigo", ignoreCase = true)) {
            "L'utilisateur te liste le contenu de son frigo : propose une recette complète optimisée autour de ces ingrédients."
        } else {
            "Réponds de façon complète et structurée à sa demande culinaire."
        }

        val success = withContext(Dispatchers.IO) {
            for (modelName in CHAT_THINKING_MODELS) {
                if (cancelRequested.get()) return@withContext false
                var conn: HttpURLConnection? = null
                try {
                    val payload = buildJsonObject {
                        put("model", modelName)
                        put("input", userText)
                        put("system_instruction", "$STRICT_CULINARY_SYSTEM_PROMPT\nContexte : $personaDirective $modeDirective")
                        previousInteractionId?.let { put("previous_interaction_id", it) }
                        put("stream", true)
                        put(
                            "generation_config",
                            buildJsonObject {
                                put("thinking_level", "low")
                                put("thinking_summaries", "auto")
                            }
                        )
                    }

                    conn = (URL(INTERACTIONS_URL).openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        connectTimeout = 9000
                        readTimeout = 25000
                        doOutput = true
                        setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                        setRequestProperty("Accept", "text/event-stream")
                        setRequestProperty("x-goog-api-key", apiKey)
                        setRequestProperty("Api-Revision", "2026-05-20")
                    }

                    OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(payload.toString()) }

                    val status = conn.responseCode
                    if (status !in 200..299) {
                        val err = conn.errorStream?.bufferedReader()?.use { it.readText() }
                        Log.w(TAG, "Gemini thinking stream ($modelName) HTTP $status: ${err?.take(220)}")
                        if (status == 503 || status == 429) {
                            continue
                        }
                        return@withContext false
                    }

                    BufferedReader(InputStreamReader(conn.inputStream, Charsets.UTF_8)).use { reader ->
                        var line: String?
                        while (reader.readLine().also { line = it } != null) {
                            if (cancelRequested.get()) break
                            val raw = line?.trim().orEmpty()
                            if (!raw.startsWith("data:")) continue
                            val dataJson = raw.removePrefix("data:").trim()
                            if (dataJson.isEmpty() || dataJson == "[DONE]") continue

                            val eventObj = try {
                                json.parseToJsonElement(dataJson).jsonObject
                            } catch (_: Throwable) {
                                continue
                            }

                            val eventType = eventObj["event_type"]?.jsonPrimitive?.contentOrNull.orEmpty()
                            when (eventType) {
                                "interaction.created" -> {
                                    eventObj["interaction"]?.jsonObject?.get("id")?.jsonPrimitive?.contentOrNull?.let {
                                        previousInteractionId = it
                                    }
                                }
                                "step.delta" -> {
                                    val delta = eventObj["delta"]?.jsonObject ?: continue
                                    val deltaType = delta["type"]?.jsonPrimitive?.contentOrNull.orEmpty()
                                    when (deltaType) {
                                        "thought_summary" -> {
                                            val piece = delta["text"]?.jsonPrimitive?.contentOrNull
                                                ?: delta["summary"]?.jsonPrimitive?.contentOrNull
                                                ?: continue
                                            thoughtBuffer.append(piece)
                                            updateAiMessage(aiMsgId) { msg ->
                                                msg.copy(
                                                    thoughtSummary = thoughtBuffer.toString().trim(),
                                                    isThinkingActive = true,
                                                    isStreaming = false
                                                )
                                            }
                                        }
                                        "text" -> {
                                            val piece = delta["text"]?.jsonPrimitive?.contentOrNull ?: continue
                                            if (!receivedAnyText) {
                                                receivedAnyText = true
                                                thinkingEndTime = System.currentTimeMillis()
                                                _isThinking.value = false
                                                _isStreaming.value = true
                                            }
                                            textBuffer.append(piece)
                                            updateAiMessage(aiMsgId) { msg ->
                                                msg.copy(
                                                    text = textBuffer.toString(),
                                                    thoughtSummary = thoughtBuffer.toString().trim()
                                                        .ifBlank { "Analyse des ingrédients, techniques de cuisson et structuration d'une réponse culinaire complète." },
                                                    thinkingDurationMs = (thinkingEndTime - startTime).coerceAtLeast(600L),
                                                    isThinkingActive = false,
                                                    isStreaming = true
                                                )
                                            }
                                        }
                                    }
                                }
                                "interaction.completed" -> {
                                    eventObj["interaction"]?.jsonObject?.get("id")?.jsonPrimitive?.contentOrNull?.let {
                                        previousInteractionId = it
                                    }
                                }
                            }
                        }
                    }
                    if (receivedAnyText) {
                        Log.d(TAG, "Streamed culinary reasoning response via $modelName")
                        return@withContext true
                    }
                } catch (ce: CancellationException) {
                    throw ce
                } catch (t: Throwable) {
                    Log.w(TAG, "Gemini thinking stream ($modelName) failed: ${t.message}")
                } finally {
                    conn?.disconnect()
                }
            }
            false
        }

        if (success) {
            val finalText = textBuffer.toString().trim()
            val guardrail = finalText.contains("Hors domaine culinaire", ignoreCase = true)
            updateAiMessage(aiMsgId) { msg ->
                msg.copy(
                    text = finalText,
                    thoughtSummary = thoughtBuffer.toString().trim()
                        .ifBlank { "Analyse culinaire AfroCuisto : sélection des proportions, étapes ordonnées et accords." },
                    thinkingDurationMs = if (thinkingEndTime > 0L) {
                        (thinkingEndTime - startTime).coerceAtLeast(650L)
                    } else {
                        1100L
                    },
                    isThinkingActive = false,
                    isStreaming = false,
                    isGuardrail = guardrail,
                    recipe = if (guardrail) null else matchedRecipe,
                    quickSuggestions = if (guardrail) {
                        listOf(
                            "Poulet, tomates et oignons",
                            "Comment réussir l'Amiwô sans grumeaux ?",
                            "Repas express en 15 min"
                        )
                    } else {
                        emptyList()
                    }
                )
            }
        }
        return success
    }

    private suspend fun streamLocalThinkingAndAnswer(
        aiMsgId: String,
        blueprint: StructuredCulinaryBlueprint
    ) {
        val thinkStart = System.currentTimeMillis()
        val thoughtBuilder = StringBuilder()

        // Phase 1: Progressive Thinking / Reasoning trace
        for ((index, stepLine) in blueprint.thinkingSteps.withIndex()) {
            if (cancelRequested.get()) return
            if (index > 0) thoughtBuilder.append("\n")
            thoughtBuilder.append("• ").append(stepLine)
            updateAiMessage(aiMsgId) { msg ->
                msg.copy(
                    thoughtSummary = thoughtBuilder.toString(),
                    isThinkingActive = true,
                    isStreaming = false
                )
            }
            delay(410L)
        }

        if (cancelRequested.get()) return
        val thinkingDuration = (System.currentTimeMillis() - thinkStart).coerceAtLeast(950L)

        // Transition from Thinking -> Progressive Streaming
        _isThinking.value = false
        _isStreaming.value = true
        updateAiMessage(aiMsgId) { msg ->
            msg.copy(
                thoughtSummary = thoughtBuilder.toString(),
                thinkingDurationMs = thinkingDuration,
                isThinkingActive = false,
                isStreaming = true
            )
        }

        // Phase 2: Smooth progressive word-group reveal (natural Gemini streaming cadence)
        val fullText = blueprint.structuredText
        val tokens = tokenizePreservingFormatting(fullText)
        val revealed = StringBuilder()
        var idx = 0
        while (idx < tokens.size) {
            if (cancelRequested.get()) return
            val batchCount = if (tokens[idx].contains("\n")) 1 else 2
            repeat(batchCount) {
                if (idx < tokens.size) {
                    revealed.append(tokens[idx])
                    idx++
                }
            }
            updateAiMessage(aiMsgId) { msg ->
                msg.copy(
                    text = revealed.toString(),
                    isThinkingActive = false,
                    isStreaming = true
                )
            }
            val pauseMs = when {
                revealed.endsWith("\n\n") -> 75L
                revealed.endsWith("\n") -> 48L
                else -> 26L
            }
            delay(pauseMs)
        }

        if (cancelRequested.get()) return
        _isStreaming.value = false
        updateAiMessage(aiMsgId) { msg ->
            msg.copy(
                text = fullText,
                thoughtSummary = thoughtBuilder.toString(),
                thinkingDurationMs = thinkingDuration,
                isThinkingActive = false,
                isStreaming = false,
                isGuardrail = blueprint.isGuardrail,
                recipe = blueprint.recipe,
                quickSuggestions = blueprint.quickSuggestions
            )
        }
    }

    private fun tokenizePreservingFormatting(text: String): List<String> {
        val tokens = mutableListOf<String>()
        val regex = Regex("\\S+\\s*|\\n+")
        for (m in regex.findAll(text)) {
            tokens += m.value
        }
        return tokens
    }

    private fun updateAiMessage(id: String, transform: (AiChefMessage) -> AiChefMessage) {
        _messages.value = _messages.value.map { msg ->
            if (msg.id == id) transform(msg) else msg
        }
    }

    /**
     * Voice-optimized conversational turn used when Gemini Live WebSocket falls back
     * (e.g. offline or restricted key): tries ultra-fast cloud streaming first, then uses
     * context-aware multi-turn culinary reasoning across African & everyday dishes.
     */
    suspend fun sendLiveMessage(
        userText: String,
        persona: String = "Chef Afro",
        apiKey: String = ""
    ): AiChefMessage {
        val cleaned = userText.trim()
        val historySnapshot = _messages.value
        val userMsg = AiChefMessage(
            id = "live_user_${System.currentTimeMillis()}",
            sender = "user",
            text = cleaned
        )
        _messages.value = historySnapshot + userMsg
        _isThinking.value = true

        try {
            val offTopic = isOffTopicQuery(cleaned)
            if (!offTopic && apiKey.isNotBlank()) {
                val cloudOralText = tryQuickLiveOralCloudReply(cleaned, apiKey)
                if (!cloudOralText.isNullOrBlank()) {
                    val matched = matchCatalogRecipe("$cleaned $cloudOralText", persona, strictMatch = true)
                    val aiMsg = AiChefMessage(
                        id = "live_ai_${System.currentTimeMillis()}",
                        sender = "ai",
                        text = cloudOralText,
                        recipe = matched,
                        audioSpoken = true
                    )
                    _messages.value = _messages.value + aiMsg
                    return aiMsg
                }
            }

            delay(180L)
            val aiResponse = buildLiveVoiceResponse(
                cleaned = cleaned,
                persona = persona,
                previousMessages = historySnapshot
            )
            _messages.value = _messages.value + aiResponse
            return aiResponse
        } finally {
            _isThinking.value = false
        }
    }

    private suspend fun tryQuickLiveOralCloudReply(userText: String, apiKey: String): String? =
        withContext(Dispatchers.IO) {
            var conn: HttpURLConnection? = null
            try {
                val oralPrompt = """
Tu es Chef Afro en conversation vocale directe (mode Gemini Live).
Réponds en français parlé naturel, chaleureux et précis en 2 à 3 phrases courtes maximum, sans aucun Markdown, sans listes à puces et sans emojis.
Reste exclusivement dans le domaine de la cuisine, des recettes et des ingrédients.
""".trimIndent()
                val payload = buildJsonObject {
                    put("model", "gemini-3.5-flash-lite")
                    put("input", userText)
                    put("system_instruction", oralPrompt)
                    previousInteractionId?.let { put("previous_interaction_id", it) }
                }

                conn = (URL(INTERACTIONS_URL).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 4200
                    readTimeout = 7500
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                    setRequestProperty("x-goog-api-key", apiKey)
                    setRequestProperty("Api-Revision", "2026-05-20")
                }

                OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(payload.toString()) }
                if (conn.responseCode !in 200..299) return@withContext null

                val body = conn.inputStream.bufferedReader().use { it.readText() }
                val root = json.parseToJsonElement(body).jsonObject
                root["id"]?.jsonPrimitive?.contentOrNull?.let { previousInteractionId = it }

                val outputs = root["outputs"] ?: root["steps"]
                val rawText = body.let {
                    Regex("\"text\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"")
                        .findAll(it)
                        .lastOrNull()
                        ?.groupValues
                        ?.getOrNull(1)
                        ?.replace("\\n", " ")
                        ?.replace("\\\"", "\"")
                        ?.replace(Regex("[*#`>_]"), "")
                        ?.trim()
                }
                if (!rawText.isNullOrBlank() && outputs != null) rawText else rawText
            } catch (_: Throwable) {
                null
            } finally {
                conn?.disconnect()
            }
        }

    private fun isOffTopicQuery(text: String): Boolean {
        val lower = text.lowercase()
        val culinarySignals = listOf(
            "cuisin", "recette", "plat", "ingrédient", "ingredient", "frigo", "manger", "repas",
            "dîner", "diner", "déjeuner", "dejeuner", "petit-déjeuner", "sauce", "poulet", "viande",
            "boeuf", "bœuf", "poisson", "crabe", "crevette", "riz", "haricot", "gombo", "tomate",
            "oignon", "piment", "épice", "epice", "huile", "palme", "arachide", "amiw", "atassi",
            "dékoun", "dekoun", "suya", "bissap", "menthe", "boisson", "jus", "dessert", "gâteau",
            "gateau", "cuire", "cuisson", "four", "poêle", "marmite", "bouillon", "farine", "maïs",
            "mais", "manioc", "igname", "banane", "plantain", "alloco", "attieke", "attiéké",
            "yassa", "mafé", "mafe", "thiéboudienne", "ndolé", "fufu", "foufou", "kankan", "menu",
            "calorie", "nutrition", "végétarien", "vegetarien", "rapide", "min", "grumeau",
            "conserver", "congeler", "mariner", "braiser", "griller", "frire", "sel", "sucre",
            "ail", "gingembre", "citron", "salade", "soupe", "potage", "brochette", "œuf", "oeuf",
            "bonjour", "salut", "bonsoir", "merci", "chef", "astuce", "conseil", "remplacer"
        )
        if (culinarySignals.any { lower.contains(it) }) return false

        val offTopicSignals = listOf(
            "python", "javascript", "kotlin", "code", "programme", "algorithme", "bug", "html", "sql",
            "politique", "président", "election", "élection", "guerre", "bourse", "bitcoin", "crypto",
            "football", "match", "coupe du monde", "météo", "meteo", "voiture", "moteur",
            "mathématique", "équation", "equation", "physique", "histoire de france", "géographie",
            "film", "série", "musique", "chanson", "poème", "dissertation", "cv", "lettre de motivation"
        )
        return offTopicSignals.any { lower.contains(it) }
    }

    private fun matchCatalogRecipe(
        cleaned: String,
        persona: String,
        strictMatch: Boolean = false
    ): AiChefRecipeResult? {
        val lower = cleaned.lowercase()
        return when {
            lower.contains("gombo") || lower.contains("crabe") || lower.contains("palme") || lower.contains("dékoun") || lower.contains("dekoun") -> dekounRecipe()
            lower.contains("atassi") || (lower.contains("haricot") && lower.contains("riz")) -> atassiRecipe()
            lower.contains("brochette") || lower.contains("suya") || lower.contains("tchatchanga") || lower.contains("kankan") -> suyaRecipe()
            lower.contains("bissap") || lower.contains("hibiscus") -> bissapRecipe()
            lower.contains("amiw") || (!strictMatch && lower.contains("poulet") && lower.contains("tomate")) -> amiwRecipe()
            !strictMatch && (lower.contains("rapide") || lower.contains("15 min") || persona == "Rapide <20m") -> atassiRecipe()
            else -> null
        }
    }

    private data class StructuredCulinaryBlueprint(
        val thinkingSteps: List<String>,
        val structuredText: String,
        val recipe: AiChefRecipeResult? = null,
        val isGuardrail: Boolean = false,
        val quickSuggestions: List<String> = emptyList()
    )

    private fun buildStructuredCulinaryBlueprint(
        cleaned: String,
        mode: String,
        persona: String,
        isOffTopic: Boolean
    ): StructuredCulinaryBlueprint {
        if (isOffTopic) {
            return StructuredCulinaryBlueprint(
                thinkingSteps = listOf(
                    "Vérification du sujet demandé par rapport au périmètre gastronomique AfroCuisto.",
                    "Demande détectée hors domaine culinaire -> préparation d'une redirection polie vers la cuisine."
                ),
                structuredText = """
### Hors domaine culinaire
Je suis **Chef Afro**, l'assistant exclusivement dédié à la **cuisine**, aux **recettes africaines**, aux **techniques culinaires** et aux idées repas à partir de votre frigo. Je ne traite donc pas les sujets extérieurs à la gastronomie.

#### Ce que je peux préparer avec vous dès maintenant
- **Recette sur mesure** : donnez-moi 2 ou 3 ingrédients présents dans votre cuisine.
- **Technique de cuisson** : réussir une pâte sans grumeaux, doser le piment ou sublimer une sauce.
- **Organisation express** : un dîner complet prêt en 15 à 20 minutes ou une boisson maison.
                """.trimIndent(),
                recipe = null,
                isGuardrail = true,
                quickSuggestions = listOf(
                    "Poulet, tomates et oignons",
                    "Comment réussir l'Amiwô sans grumeaux ?",
                    "Repas express en 15 min"
                )
            )
        }

        val lower = cleaned.lowercase()
        val forceFrigo = mode.equals("Frigo", ignoreCase = true)

        return when {
            lower.contains("grumeau") || (lower.contains("comment") && lower.contains("amiw") && !forceFrigo) -> {
                StructuredCulinaryBlueprint(
                    thinkingSteps = listOf(
                        "Identification de la technique demandée : maîtrise de la pâte rouge béninoise (Amiwô).",
                        "Contrôle de la température du bouillon et du ratio liquide / farine de maïs pour éviter tout grumeau.",
                        "Organisation des gestes clés dans l'ordre chronologique avec astuce de finition."
                    ),
                    structuredText = """
### Réussir l'Amiwô parfaitement lisse et sans grumeaux
Le secret d'un Amiwô velouté repose sur trois paramètres : un bouillon bien filtré, une température frémissante (jamais bouillante à gros bouillons) et une incorporation progressive en pluie fine.

#### Proportions de référence (4 pers. • 35 min)
- **Bouillon de poulet filtré & tomaté** : 1,1 L bien assaisonné
- **Farine de maïs fine** : 400 g (ou polenta très fine en diaspora)
- **Huile d'arachide parfumée** : 2 c. à soupe

#### Méthode étape par étape
1. **Filtrer et tempérer le bouillon** : retirez les morceaux d'oignons et baissez sur feu doux-moyen dès les premiers frémissements.
2. **Délayer à froid (option sécurité)** : prélevez 150 ml de bouillon tiède pour y délayer 3 c. à soupe de farine avant de reverser le tout, cela crée une base liante anti-grumeaux.
3. **Verser en pluie continue** : saupoudrez le reste de farine d'une main tout en fouettant énergiquement en cercles de l'autre main.
4. **Travailler à la spatule en bois** : dès que la pâte épaissit, écrasez-la fermement contre les parois de la marmite pendant 3 minutes.
5. **Étuver à couvert** : baissez au minimum, couvrez hermétiquement et laissez cuire 15 minutes à la vapeur douce.

> **Astuce du Chef** : Ajoutez une cuillère d'huile rouge ou d'huile d'arachide chaude sur la pâte avant de couvrir pour obtenir une brillance et une souplesse dignes des grandes tables béninoises.
> **Accord conseillé** : Poulet braisé aux épices, pimentade fraîche (Yébessessi) et Jus de Bissap glacé.
                    """.trimIndent(),
                    recipe = amiwRecipe()
                )
            }
            lower.contains("gombo") || lower.contains("crabe") || lower.contains("poisson") || lower.contains("palme") || lower.contains("sauce") -> {
                StructuredCulinaryBlueprint(
                    thinkingSteps = listOf(
                        "Analyse des ingrédients maritimes et végétaux détectés (gombo, poisson fumé, base sauce).",
                        "Sélection de la recette traditionnelle la plus harmonieuse : Dékoun (Sauce Graine aux Crabes).",
                        "Vérification de l'ordre d'incorporation pour préserver la texture fondante du gombo."
                    ),
                    structuredText = """
### Dékoun — Sauce Graine aux Crabes & Poisson Fumé
Une sauce onctueuse et profondément aromatique du golfe du Bénin, où la richesse de la noix de palme enveloppe le fumé du poisson et la fraîcheur du gombo.

#### Ingrédients clés (4 pers. • 25 min de prépa)
- **Concentré de noix de palme** : 400 g dilué dans 1 L d'eau tiède
- **Poisson fumé (Kpanman ou maquereau)** : 200 g effeuillé et désarêté
- **Crabes frais nettoyés** : 6 pièces coupées en deux
- **Gombo frais** : 100 g finement tranché
- **Aromates** : 2 c. à soupe de crevettes séchées moulues, 1 oignon, ail, gingembre, 1 piment entier

#### Préparation étape par étape
1. **Préparer la base de palme** : délayez la pâte de noix de palme dans l'eau tiède, filtrez finement et portez à ébullition 20 minutes jusqu'à ce qu'un léger voile d'huile rouge remonte en surface.
2. **Infuser les arômes** : ajoutez l'oignon émincé, l'ail, le gingembre râpé et la poudre de crevettes séchées.
3. **Mijoter les protéines** : incorporez les crabes et le poisson fumé puis laissez frémir 15 minutes à feu moyen pour concentrer le fumet.
4. **Ajouter le gombo en fin de cuisson** : versez le gombo tranché et le piment entier, puis poursuivez 8 minutes à découvert pour lier la sauce sans la rendre trop gluante.

> **Astuce du Chef** : Ne couvrez jamais totalement la marmite après avoir ajouté le gombo ; une légère évaporation garantit une sauce veloutée et brillante.
> **Accord conseillé** : Pâte de maïs blanche (Wô), riz vapeur ou foufou d'igname.
                    """.trimIndent(),
                    recipe = dekounRecipe()
                )
            }
            lower.contains("haricot") || lower.contains("riz") || lower.contains("oeuf") || lower.contains("œuf") || lower.contains("atassi") || lower.contains("rapide") || lower.contains("15 min") || lower.contains("20 min") || persona == "Rapide <20m" -> {
                StructuredCulinaryBlueprint(
                    thinkingSteps = listOf(
                        "Détection d'une recherche de repas complet, équilibré et rapide à préparer.",
                        "Association riz + haricots inspirée de l'Atassi béninois avec cuisson optimisée.",
                        "Structuration des quantités, du timing exact et de la sauce Fritou express."
                    ),
                    structuredText = """
### Atassi Complet Royale Express
Un grand classique béninois réconfortant, complet en protéines et prêt rapidement grâce à la cuisson conjointe du riz dans l'eau parfumée des haricots.

#### Ingrédients clés (4 pers. • 15 min de prépa)
- **Haricots œil noir ou rouges (pré-cuits)** : 300 g avec leur eau de cuisson
- **Riz long grain parfumé** : 300 g rincé à l'eau claire
- **Base friture (Fritou)** : 3 tomates, 2 oignons rouges, ail, gingembre, 4 c. à soupe d'huile
- **Garniture royale** : 2 à 4 œufs durs et morceaux de bœuf ou poulet dorés

#### Préparation étape par étape
1. **Parfumer l'eau de cuisson** : portez les haricots et leur jus à frémissement avec une pincée de sel et une pointe de bicarbonate (ou potasse naturelle) pour une belle couleur ambrée.
2. **Cuire le riz par absorption** : versez le riz rincé dans la même casserole, couvrez bien et laissez étuver 15 minutes à feu doux jusqu'à absorption complète.
3. **Monter la sauce Fritou express** : faites revenir oignons, ail et tomates mixées dans l'huile bien chaude 10 minutes à feu vif jusqu'à réduction brillante et parfumée.
4. **Dresser chaud** : servez l'Atassi fumant nappé de sauce Fritou, entouré des quartiers d'œufs durs et de viande dorée.

> **Astuce du Chef** : Laissez reposer l'Atassi 5 minutes hors du feu sous couvercle avant d'égrainer à la fourchette : les grains restent parfaitement détachés.
> **Accord conseillé** : Gari saupoudré, piment noir (Shito) et rondelles de bananes plantains frites (Alloco).
                    """.trimIndent(),
                    recipe = atassiRecipe()
                )
            }
            lower.contains("brochette") || lower.contains("viande") || lower.contains("boeuf") || lower.contains("bœuf") || lower.contains("grill") || lower.contains("arachide") || lower.contains("suya") -> {
                StructuredCulinaryBlueprint(
                    thinkingSteps = listOf(
                        "Analyse de la demande autour des grillades épicées et de la viande de bœuf.",
                        "Sélection de la marinade sèche au Kankan (Yaji) pour une saisie juteuse et parfumée.",
                        "Calibrage précis du temps de grillade pour garder la viande tendre."
                    ),
                    structuredText = """
### Brochettes Tchatchanga Suya façon Terroir
Des lamelles de bœuf ultra-tendres enrobées d'une croûte parfumée de poudre d'arachide torréfiée aux épices (Kankan), saisies à feu vif.

#### Ingrédients clés (4 pers. • 30 min)
- **Filet ou rumsteck de bœuf** : 600 g taillé en fines lamelles contre le sens des fibres
- **Poudre de Kankan (Yaji)** : 4 c. à soupe (arachide grillée moulue, gingembre, clou de girofle, piment doux)
- **Huile d'arachide** : 3 c. à soupe
- **Garniture fraîche** : 2 oignons rouges en rondelles fines, 1 citron vert, tomates cerises

#### Préparation étape par étape
1. **Préparer les pics** : faites tremper les brochettes en bois 15 minutes dans l'eau froide pour éviter qu'elles ne brûlent sur le gril.
2. **Enfiler et huiler** : montez la viande en accordéon sur les pics puis badigeonnez généreusement d'huile d'arachide.
3. **Enrober au Kankan** : pressez chaque brochette dans la poudre d'épices pour former une croûte homogène et laissez reposer 15 minutes.
4. **Saisir à feu très vif** : grillez 3 minutes par face sur barbecue, plancha ou grill bien fumant, en badigeonnant d'un voile d'huile à mi-cuisson.

> **Astuce du Chef** : Saupoudrez une toute dernière pincée de Kankan et pressez un filet de citron vert juste au moment de servir pour réveiller toutes les épices.
> **Accord conseillé** : Oignons rouges crus, chou finement émincé et Jus de Bissap bien glacé.
                    """.trimIndent(),
                    recipe = suyaRecipe()
                )
            }
            lower.contains("bissap") || lower.contains("menthe") || lower.contains("boisson") || lower.contains("jus") || lower.contains("hibiscus") -> {
                StructuredCulinaryBlueprint(
                    thinkingSteps = listOf(
                        "Identification d'une demande de boisson maison rafraîchissante.",
                        "Ajustement du temps d'infusion des calices d'hibiscus pour éviter toute amertume.",
                        "Équilibrage sucre / menthe fraîche / fleur d'oranger."
                    ),
                    structuredText = """
### Jus de Bissap Rubis à la Menthe Fraîche
Une infusion glacée d'hibiscus intense, florale et désaltérante, équilibrée par la fraîcheur de la menthe et une touche d'agrumes.

#### Ingrédients clés (6 verres • 10 min de prépa)
- **Fleurs d'hibiscus séchées (Bissap)** : 100 g rincées à l'eau froide
- **Eau filtrée** : 1,5 L
- **Menthe fraîche** : 1 beau bouquet lavé
- **Sucre de canne ou miel** : 120 à 150 g selon votre goût
- **Parfum signature** : 1 c. à café d'eau de fleur d'oranger et 1 morceau de gingembre écrasé

#### Préparation étape par étape
1. **Rincer les fleurs** : passez rapidement les calices d'hibiscus sous l'eau fraîche pour ôter les impuretés.
2. **Infuser sans surcuire** : portez l'eau à ébullition, ajoutez le bissap et le gingembre, puis laissez frémir 12 à 15 minutes maximum.
3. **Parfumer hors du feu** : coupez le feu, plongez le bouquet de menthe fraîche et laissez infuser 15 minutes à couvert.
4. **Filtrer et glacer** : filtrez finement au chinois, sucrez pendant que l'infusion est tiède, ajoutez la fleur d'oranger et placez au frais au moins 3 heures.

> **Astuce du Chef** : Évitez de faire bouillir la menthe : l'infusion hors du feu préserve tout son croquant aromatique sans note amère.
> **Accord conseillé** : Parfait avec des brochettes Suya, de l'Alloco ou un Amiwô au poulet braisé.
                    """.trimIndent(),
                    recipe = bissapRecipe()
                )
            }
            lower.contains("piment") || lower.contains("épice") || lower.contains("epice") -> {
                StructuredCulinaryBlueprint(
                    thinkingSteps = listOf(
                        "Analyse de la question technique sur la maîtrise du piment et des épices.",
                        "Sélection des méthodes de cuisson douce et d'équilibrage des saveurs.",
                        "Rédaction d'un guide clair et directement applicable en cuisine."
                    ),
                    structuredText = """
### Maîtriser le piment et les épices sans brûler le plat
Le piment frais (habanero ou pili-pili) apporte un parfum fruité exceptionnel lorsqu'on contrôle la libération de sa capsaïcine.

#### Trois niveaux de dosage maîtrisés
- **Parfum doux (sans piquant)** : déposez 1 piment frais **entier et intact** dans la sauce les 10 dernières minutes, sans jamais le percer.
- **Chaleur équilibrée** : retirez les graines et les membranes blanches internes (là où se concentre 80 % de la force) avant de hacher la chair.
- **Pimentade servie à part** : écrasez piment frais, oignon, ail et un filet d'huile chaude dans un bol séparé pour laisser chaque convive doser.

#### Rattraper une sauce trop piquante
1. **Adoucir par le gras végétal** : incorporez 1 à 2 c. à soupe de pâte d'arachide, de lait de coco ou un filet d'huile neutre qui enrobent la capsaïcine.
2. **Équilibrer par l'acidité** : quelques gouttes de jus de citron vert ou de tomate fraîche cassent immédiatement la sensation de brûlure.
3. **Absorber l'excès** : laissez mijoter une demi-pomme de terre ou un morceau d'igname 10 minutes dans la sauce avant de le retirer.

> **Astuce du Chef** : Torréfiez toujours vos épices sèches (gingembre, poivre long, clou de girofle) 30 secondes à sec avant de les moudre pour décupler leur arôme.
                    """.trimIndent(),
                    recipe = null
                )
            }
            else -> {
                StructuredCulinaryBlueprint(
                    thinkingSteps = listOf(
                        "Lecture des ingrédients et envies culinaires : \"$cleaned\".",
                        "Sélection d'une recette afro-culinaire complète, accessible et savoureuse (Amiwô au Poulet Braisé).",
                        "Structuration ordonnée : ouverture, proportions, étapes numérotées et astuce du Chef."
                    ),
                    structuredText = """
### Amiwô au Poulet Braisé — Proposition sur mesure
À partir de vos éléments, voici une recette complète, généreuse et parfumée alliant un poulet bien doré à une pâte de maïs tomatée ultra-fondante.

#### Ingrédients clés (4 pers. • 35 min)
- **Poulet découpé** : 500 g à 1 kg (cuisses ou pilons)
- **Tomates fraîches mixées** : 3 c. à soupe bien parfumées
- **Oignons rouges & ail** : 2 oignons émincés + 2 gousses d'ail
- **Farine de maïs fine** : 400 g (ou polenta très fine)
- **Assaisonnement** : gingembre frais râpé, sel, poivre, 1 piment entier non percé

#### Préparation étape par étape
1. **Mariner et cuire la volaille** : assaisonnez le poulet avec ail, gingembre, sel et oignons, puis faites cuire 20 minutes dans 1,2 L d'eau pour obtenir un bouillon concentré.
2. **Braiser le poulet** : égouttez les morceaux (gardez le bouillon filtré) et faites-les dorer au four ou à la poêle jusqu'à obtenir une peau croustillante.
3. **Infuser la base rouge** : ajoutez la purée de tomates et 2 c. à soupe d'huile au bouillon filtré, puis laissez frémir 8 minutes.
4. **Monter l'Amiwô** : versez la farine de maïs en pluie fine tout en remuant énergiquement à la spatule en bois, puis étuvez 15 minutes à feu très doux sous couvercle.

> **Astuce du Chef** : Ajoutez une pointe de gingembre frais râpé dans le bouillon juste avant d'incorporer la farine pour une note chaude inoubliable.
> **Accord conseillé** : Sauce piment fraîche (Yébessessi) et Jus de Bissap glacé à la menthe.
                    """.trimIndent(),
                    recipe = amiwRecipe()
                )
            }
        }
    }

    private fun buildLiveVoiceResponse(
        cleaned: String,
        persona: String,
        previousMessages: List<AiChefMessage> = emptyList()
    ): AiChefMessage {
        val id = "live_ai_${System.currentTimeMillis()}"
        if (isOffTopicQuery(cleaned)) {
            return AiChefMessage(
                id = id,
                sender = "ai",
                isGuardrail = true,
                text = "Je suis ton Chef Afro, dédié uniquement à la cuisine ! Dis-moi plutôt quels ingrédients tu as sous la main ou quel plat te ferait plaisir."
            )
        }

        val lower = cleaned.lowercase()
        val lastAiMsg = previousMessages.lastOrNull { it.sender == "ai" }
        val lastContextLower = (lastAiMsg?.text.orEmpty() + " " + lastAiMsg?.recipe?.dishName.orEmpty()).lowercase()

        // 1. Multi-turn conversational follow-ups ("et ensuite ?", "combien de temps ?", "étape suivante", "par quoi remplacer")
        val isNextStepFollowUp = lower.contains("ensuite") || lower.contains("après") || lower.contains("apres") ||
            lower.contains("prochaine étape") || lower.contains("première étape") || lower.contains("on commence") ||
            lower.contains("comment on fait") || lower == "oui" || lower == "vas-y" || lower == "ok"
        if (isNextStepFollowUp && lastContextLower.isNotBlank()) {
            val followUpText = when {
                lastContextLower.contains("yassa") -> "Commence par faire mariner ton poulet avec quatre gros oignons émincés, du jus de citron vert, de l'ail et une cuillère de moutarde pendant trente minutes, puis saisis les morceaux à feu vif pour bien les caraméliser."
                lastContextLower.contains("mafé") || lastContextLower.contains("arachide") -> "Fais d'abord dorer la viande dans un filet d'huile chaude, ajoute oignon, ail et concentré de tomate, puis délaye trois belles cuillères de pâte d'arachide dans l'eau tiède avant de laisser mijoter à feu doux vingt-cinq minutes."
                lastContextLower.contains("alloco") || lastContextLower.contains("plantain") -> "Coupe les bananes plantains bien mûres en biseaux réguliers, sale légèrement et plonge-les dans une huile à feu moyen-vif jusqu'à ce qu'elles soient bien dorées et fondantes à cœur."
                lastContextLower.contains("dékoun") || lastContextLower.contains("gombo") -> "Dilue le concentré de noix de palme dans un litre d'eau tiède, porte à frémissement quinze minutes avec oignon et gingembre, puis ajoute le poisson fumé et enfin le gombo tranché huit minutes à découvert."
                lastContextLower.contains("atassi") || lastContextLower.contains("haricot") -> "Porte tes haricots pré-cuits et leur jus parfumé à frémissement, verse le riz lavé directement dedans et laisse cuire à couvert quinze minutes à feu très doux pendant que tu prépares la petite friture de tomates."
                lastContextLower.contains("suya") || lastContextLower.contains("brochette") -> "Badigeonne tes lamelles de bœuf d'un voile d'huile d'arachide, presse-les généreusement dans le mélange d'épices Kankan et saisis-les trois minutes par face sur une poêle ou un gril très chaud."
                lastContextLower.contains("amiw") -> "Fais frémir ton bouillon de poulet tomaté bien filtré, puis verse la farine de maïs en pluie fine d'une main tout en remuant énergiquement à la spatule de l'autre, avant d'étuver quinze minutes à feu doux."
                else -> "Pour démarrer, fais chauffer un filet d'huile à feu moyen, fais suer tes oignons émincés avec ail et gingembre frais pendant trois minutes, puis saisis ton ingrédient principal pour bien concentrer les sucs."
            }
            return AiChefMessage(id = id, sender = "ai", text = followUpText, recipe = lastAiMsg?.recipe, audioSpoken = true)
        }

        if (lower.contains("combien de temps") || lower.contains("durée") || lower.contains("température")) {
            val timingReply = when {
                lastContextLower.contains("suya") || lastContextLower.contains("brochette") -> "Compte exactement trois à quatre minutes par face à feu très vif pour garder le cœur de la viande juteux et tendre."
                lastContextLower.contains("atassi") -> "Quinze minutes à feu doux sous couvercle suffisent dès que le riz a absorbé le bouillon des haricots, plus cinq minutes de repos hors du feu."
                lastContextLower.contains("yassa") -> "Après la saisie, laisse confire les oignons et le poulet à couvert pendant vingt-cinq minutes à feu doux pour une sauce bien fondante."
                else -> "Compte environ quinze à vingt minutes à feu moyen-doux en surveillant la réduction de la sauce pour que les arômes restent bien concentrés."
            }
            return AiChefMessage(id = id, sender = "ai", text = timingReply, recipe = lastAiMsg?.recipe, audioSpoken = true)
        }

        // 2. Greetings & Courtesies
        return when {
            (lower.contains("bonjour") || lower.contains("salut") || lower.contains("bonsoir") || lower.contains("coucou")) && lower.length < 36 -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Salut ! Ravi de cuisiner avec toi en direct. Dis-moi quels ingrédients tu as sous la main ou quel plat te donne envie aujourd'hui !",
                    audioSpoken = true
                )
            }
            lower.contains("merci") || lower.contains("super") || lower.contains("parfait") || lower.contains("génial") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Avec grand plaisir ! Dis-moi si tu veux passer à l'étape suivante, ajuster l'assaisonnement ou trouver un accompagnement.",
                    audioSpoken = true
                )
            }
            // 3. Broad African & Everyday Culinary Repertoire
            lower.contains("yassa") || (lower.contains("poulet") && (lower.contains("citron") || lower.contains("moutarde"))) -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Un Poulet Yassa sénégalais, quel régal ! Marine le poulet avec beaucoup d'oignons émincés, du jus de citron vert, un trait de moutarde et de l'ail, fais dorer la volaille puis laisse compoter les oignons vingt minutes à feu doux. Veux-tu les proportions exactes ?",
                    audioSpoken = true
                )
            }
            lower.contains("mafé") || lower.contains("mafe") || lower.contains("pâte d'arachide") || (lower.contains("arachide") && !lower.contains("brochette")) -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Pour un Mafé bien onctueux, saisis d'abord ta viande avec oignon, ail et concentré de tomate, puis incorpore la pâte d'arachide délayée dans un bouillon chaud. Laisse mijoter à feu doux jusqu'à ce qu'une fine huile parfumée remonte en surface !",
                    audioSpoken = true
                )
            }
            lower.contains("thiéb") || lower.contains("thieb") || lower.contains("jollof") || lower.contains("riz gras") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Le secret d'un Thiéboudienne ou d'un Jollof parfumé, c'est de bien cuire la base de tomate concentrée, oignon et ail avant de mouiller au bouillon, puis de cuire le riz cassé ou long grain à la vapeur douce sous couvercle hermétique.",
                    audioSpoken = true
                )
            }
            lower.contains("alloco") || lower.contains("plantain") || lower.contains("banane") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Avec des bananes plantains bien mûres, prépare un Alloco doré et caramélisé, accompagné d'une petite sauce pimentée aux oignons rouges ou d'œufs durs ! Tu as aussi du poisson ou des œufs avec ?",
                    audioSpoken = true
                )
            }
            lower.contains("attiéké") || lower.contains("attieke") || lower.contains("garba") || lower.contains("manioc") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "L'attiéké est sublime réchauffé deux minutes à la vapeur avec un filet d'huile, servi avec du poisson braisé ou frit et une salade fraîche tomates, oignons et citron vert !",
                    audioSpoken = true
                )
            }
            lower.contains("ndolé") || lower.contains("ndole") || lower.contains("épinard") || lower.contains("epinard") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Excellente idée ! Tu peux préparer un Ndolé camerounais aux arachides fraîches mixées — ou en version diaspora avec des épinards fondus, de l'ail, du gingembre et des crevettes ou du bœuf mijoté.",
                    audioSpoken = true
                )
            }
            lower.contains("igname") || lower.contains("foufou") || lower.contains("fufu") || lower.contains("kédjenou") || lower.contains("kedjenou") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "L'igname bouillie ou en foufou s'accorde merveilleusement avec un Kédjenou de poulet cuit à l'étouffée sans eau ajoutée, juste avec tomates, oignons, gingembre et feuilles de laurier !",
                    audioSpoken = true
                )
            }
            lower.contains("oeuf") || lower.contains("œuf") || lower.contains("omelette") -> {
                if (lower.contains("riz") || lower.contains("haricot")) {
                    AiChefMessage(
                        id = id,
                        sender = "ai",
                        text = "Riz, haricots et œufs, c'est le trio royal pour un Atassi béninois express ! Cuis le riz dans le jus des haricots et sers avec les œufs et une petite sauce tomate aux oignons.",
                        recipe = atassiRecipe(),
                        audioSpoken = true
                    )
                } else {
                    AiChefMessage(
                        id = id,
                        sender = "ai",
                        text = "Avec des œufs, fais une omelette façon kiosque africain : fais fondre tomates fraîches, oignon rouge, piment doux et ciboule à la poêle avant de verser les œufs battus bien mousseux. Prêt en six minutes !",
                        audioSpoken = true
                    )
                }
            }
            lower.contains("pâte") || lower.contains("spaghetti") || lower.contains("macaroni") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Tu peux préparer des spaghettis sautés façon street-food ouest-africaine : une réduction parfumée d'oignons, ail, gingembre, concentré de tomate et poivron dans laquelle tu enlaces les pâtes al dente !",
                    audioSpoken = true
                )
            }
            lower.contains("piment") || lower.contains("piquant") || lower.contains("épice") || lower.contains("epice") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Pour parfumer ton plat sans le brûler, dépose le piment frais entier dans la sauce les dix dernières minutes sans le percer. Tu auras tout son arôme fruité avec une chaleur très douce !",
                    audioSpoken = true
                )
            }
            lower.contains("grumeau") || lower.contains("amiw") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Pour un Amiwô lisse sans aucun grumeau, verse la farine de maïs en pluie fine dans le bouillon frémissant tout en fouettant sans t'arrêter, puis écrase la pâte à la spatule en bois et laisse étuver quinze minutes à feu doux.",
                    recipe = amiwRecipe(),
                    audioSpoken = true
                )
            }
            lower.contains("gombo") || lower.contains("crabe") || lower.contains("palme") || lower.contains("dékoun") || lower.contains("dekoun") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Avec du gombo ou du poisson fumé, prépare un Dékoun onctueux ! Astuce de chef : ajoute le gombo tranché seulement les huit dernières minutes à découvert pour garder une texture veloutée.",
                    recipe = dekounRecipe(),
                    audioSpoken = true
                )
            }
            lower.contains("poisson") || lower.contains("thon") || lower.contains("crevette") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Avec du poisson, fais une marinade express ail, gingembre râpé, citron vert et filet d'huile, puis braise-le à la poêle ou au four douze minutes avec une fondue de tomates et d'oignons !",
                    audioSpoken = true
                )
            }
            lower.contains("haricot") || lower.contains("atassi") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Les haricots sont parfaits pour un Atassi Complet Royale ! Cuis le riz directement dans l'eau parfumée des haricots pour lui donner sa belle robe ambrée et un goût inimitable.",
                    recipe = atassiRecipe(),
                    audioSpoken = true
                )
            }
            lower.contains("brochette") || lower.contains("boeuf") || lower.contains("bœuf") || lower.contains("viande") || lower.contains("suya") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Belle idée carnivore ! Taille la viande en fines lamelles, enrobe-la d'épices Kankan à l'arachide grillée et saisis trois minutes par face à feu vif avec un trait de citron vert au service.",
                    recipe = suyaRecipe(),
                    audioSpoken = true
                )
            }
            lower.contains("bissap") || lower.contains("menthe") || lower.contains("boisson") || lower.contains("jus") || lower.contains("gingembre") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Pour une boisson maison ultra fraîche, infuse des fleurs de bissap douze minutes avec une pointe de gingembre, puis ajoute le bouquet de menthe hors du feu et quelques gouttes de fleur d'oranger avant de glacer !",
                    recipe = bissapRecipe(),
                    audioSpoken = true
                )
            }
            lower.contains("poulet") && (lower.contains("tomate") || lower.contains("oignon")) -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Poulet, tomates et oignons, c'est la base idéale pour un Amiwô au poulet braisé ou un poulet mijoté au gingembre frais ! Tu préfères l'accompagner de riz, de pâte de maïs ou de plantains ?",
                    recipe = amiwRecipe(),
                    audioSpoken = true
                )
            }
            lower.contains("rapide") || lower.contains("express") || lower.contains("20 min") || lower.contains("15 min") || lower.contains("soir") -> {
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Pour un dîner prêt en quinze minutes chrono, je te conseille soit un Atassi riz-haricots express, soit un sauté de légumes et œufs parfumés au gingembre. Qu'est-ce que tu as dans ton frigo ?",
                    recipe = atassiRecipe(),
                    audioSpoken = true
                )
            }
            else -> {
                // Dynamic ingredient-aware conversational reply (never blindly forces Amiwô!)
                val shortSubject = cleaned.take(55).trimEnd('.', '?', '!')
                AiChefMessage(
                    id = id,
                    sender = "ai",
                    text = "Très intéressant autour de « $shortSubject » ! Je te propose de faire revenir une base aromatique oignon, ail et gingembre frais à feu moyen, puis d'y mijoter tes ingrédients dix à quinze minutes pour lier les saveurs. Dis-moi quels accompagnements ou épices tu as sous la main pour qu'on affine la recette ensemble !",
                    audioSpoken = true
                )
            }
        }
    }

    private fun amiwRecipe() = AiChefRecipeResult(
        id = "P02",
        dishName = "Amiwô au Poulet Braisé",
        region = "Bénin",
        totalTime = "35 min",
        difficulty = "Moyen",
        servings = "4 personnes",
        usedIngredients = listOf(
            AiChefIngredient("Poulet", "500g"),
            AiChefIngredient("Tomates fraîches", "3 c. à soupe"),
            AiChefIngredient("Oignons", "2 pièces")
        ),
        missingIngredients = listOf(
            AiChefIngredient("Farine de maïs", "400g")
        ),
        steps = listOf(
            "Faire mariner et dorer le poulet avec oignons, ail et gingembre.",
            "Infuser le bouillon de tomate et verser la farine de maïs en pluie.",
            "Laisser étuver à feu doux puis servir chaud avec le poulet braisé."
        ),
        chefTip = "Ajoute une pointe de gingembre frais râpé dans le bouillon juste avant d'incorporer la farine."
    )

    private fun dekounRecipe() = AiChefRecipeResult(
        id = "S05",
        dishName = "Dékoun (Sauce Graine aux Crabes)",
        region = "Togo & Bénin",
        totalTime = "25 min",
        difficulty = "Moyen",
        servings = "4 personnes",
        usedIngredients = listOf(
            AiChefIngredient("Poisson fumé", "200g"),
            AiChefIngredient("Gombo tranché", "100g")
        ),
        missingIngredients = listOf(
            AiChefIngredient("Noix de palme", "400g")
        ),
        steps = listOf(
            "Diluer le concentré de palme dans l'eau tiède et porter à ébullition.",
            "Incorporer les crabes, le poisson fumé et le gombo puis mijoter 20 min."
        ),
        chefTip = "Laisse la sauce frémir à découvert en fin de cuisson pour obtenir une texture veloutée."
    )

    private fun atassiRecipe() = AiChefRecipeResult(
        id = "P11",
        dishName = "Atassi Complet Royale",
        region = "Bénin",
        totalTime = "15 min",
        difficulty = "Facile",
        servings = "4 personnes",
        usedIngredients = listOf(
            AiChefIngredient("Riz long grain", "300g"),
            AiChefIngredient("Haricots", "300g")
        ),
        missingIngredients = listOf(
            AiChefIngredient("Sauce Fritou", "150ml")
        ),
        steps = listOf(
            "Cuire ensemble le riz et les haricots pré-cuits à feu doux.",
            "Servir accompagné de la sauce friture pimentée et des œufs durs."
        ),
        chefTip = "Utilise l'eau de cuisson des haricots pour cuire le riz et obtenir une belle couleur dorée."
    )

    private fun suyaRecipe() = AiChefRecipeResult(
        id = "V03",
        dishName = "Tchatchanga Suya Brochettes",
        region = "Niger & Bénin",
        totalTime = "30 min",
        difficulty = "Facile",
        servings = "4 personnes",
        usedIngredients = listOf(
            AiChefIngredient("Bœuf ou agneau", "600g"),
            AiChefIngredient("Oignons rouges", "2 pièces")
        ),
        missingIngredients = listOf(
            AiChefIngredient("Poudre de Kankan (Yaji)", "4 c. à soupe")
        ),
        steps = listOf(
            "Enfiler les lamelles de viande huilées sur des pics.",
            "Enrober de poudre d'arachide épicée et saisir 3 min par face."
        ),
        chefTip = "Passe un léger filet de jus de citron juste avant de servir pour réveiller les épices."
    )

    private fun bissapRecipe() = AiChefRecipeResult(
        id = "J01",
        dishName = "Jus de Bissap à la Menthe",
        region = "Sénégal",
        totalTime = "10 min",
        difficulty = "Facile",
        servings = "6 verres",
        usedIngredients = listOf(
            AiChefIngredient("Fleurs d'hibiscus", "100g"),
            AiChefIngredient("Menthe fraîche", "1 bouquet")
        ),
        missingIngredients = emptyList(),
        steps = listOf(
            "Infuser les fleurs d'hibiscus et la menthe 15 min dans l'eau bouillante.",
            "Filtrer, sucrer légèrement et servir bien glacé."
        ),
        chefTip = "Quelques gouttes de fleur d'oranger subliment la fraîcheur de la menthe."
    )
}
