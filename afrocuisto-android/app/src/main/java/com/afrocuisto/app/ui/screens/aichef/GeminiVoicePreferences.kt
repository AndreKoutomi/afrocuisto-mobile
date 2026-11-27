package com.afrocuisto.app.ui.screens.aichef

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.afrocuisto.app.BuildConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.geminiVoiceDataStore by preferencesDataStore(name = "gemini_live_voice_prefs")

enum class GeminiVoiceGender {
    FEMALE,
    MALE
}

/**
 * Curated Gemini Live voice profiles inspired by Google Gemini Live's official voice roster.
 * Each profile maps to:
 * - Native Gemini 3.8 Expressive TTS voice & conversational French style direction (cloud HD mode)
 * - Best-matching Google Speech Services Neural/Network fr-FR speaker + organic prosody (instant mode)
 */
data class GeminiLiveVoiceProfile(
    val id: String,
    val displayName: String,
    val tagline: String,
    val gender: GeminiVoiceGender,
    val geminiApiVoice: String,
    val geminiStylePrompt: String,
    val preferredGoogleVoiceTokens: List<String>,
    val speechRate: Float,
    val pitch: Float,
    val accentColorHex: Long
)

object GeminiVoiceCatalog {
    val voices: List<GeminiLiveVoiceProfile> = listOf(
        GeminiLiveVoiceProfile(
            id = "ursa",
            displayName = "Ursa",
            tagline = "Chaleureuse & douce",
            gender = GeminiVoiceGender.FEMALE,
            geminiApiVoice = "Aoede",
            geminiStylePrompt = "Speak in natural, warm, conversational French like Google Gemini Live: relaxed, smiling, fluid human pacing with gentle breath and effortless warmth.",
            preferredGoogleVoiceTokens = listOf("vlf", "frc", "fra"),
            speechRate = 0.99f,
            pitch = 1.01f,
            accentColorHex = 0xFF60A5FA
        ),
        GeminiLiveVoiceProfile(
            id = "dipper",
            displayName = "Dipper",
            tagline = "Vive & engagée",
            gender = GeminiVoiceGender.MALE,
            geminiApiVoice = "Puck",
            geminiStylePrompt = "Speak in lively, engaging, friendly conversational French like Google Gemini Live: bright, curious, expressive with smooth natural intonation.",
            preferredGoogleVoiceTokens = listOf("frd", "frb", "vlg"),
            speechRate = 1.02f,
            pitch = 0.96f,
            accentColorHex = 0xFF38BDF8
        ),
        GeminiLiveVoiceProfile(
            id = "lyra",
            displayName = "Lyra",
            tagline = "Lumineuse & fluide",
            gender = GeminiVoiceGender.FEMALE,
            geminiApiVoice = "Zephyr",
            geminiStylePrompt = "Speak in bright, crisp, airy conversational French like Google Gemini Live: clear, enthusiastic, modern and effortless.",
            preferredGoogleVoiceTokens = listOf("frc", "vlf", "fra"),
            speechRate = 1.01f,
            pitch = 1.04f,
            accentColorHex = 0xFF818CF8
        ),
        GeminiLiveVoiceProfile(
            id = "pegasus",
            displayName = "Pegasus",
            tagline = "Profonde & posée",
            gender = GeminiVoiceGender.MALE,
            geminiApiVoice = "Charon",
            geminiStylePrompt = "Speak in deep, calm, reassuring conversational French like Google Gemini Live: warm baritone, measured storytelling pace, confident and comforting.",
            preferredGoogleVoiceTokens = listOf("frb", "frd"),
            speechRate = 0.96f,
            pitch = 0.91f,
            accentColorHex = 0xFF3B82F6
        ),
        GeminiLiveVoiceProfile(
            id = "orbit",
            displayName = "Orbit",
            tagline = "Claire & précise",
            gender = GeminiVoiceGender.FEMALE,
            geminiApiVoice = "Kore",
            geminiStylePrompt = "Speak in composed, articulate, friendly conversational French like Google Gemini Live: clear culinary mentor tone with natural rhythm.",
            preferredGoogleVoiceTokens = listOf("fra", "vlf", "frc"),
            speechRate = 0.98f,
            pitch = 0.98f,
            accentColorHex = 0xFF2DD4BF
        ),
        GeminiLiveVoiceProfile(
            id = "vega",
            displayName = "Vega",
            tagline = "Expressive & solaire",
            gender = GeminiVoiceGender.MALE,
            geminiApiVoice = "Fenrir",
            geminiStylePrompt = "Speak in warm, charismatic, expressive French like Google Gemini Live: passionate chef energy with natural conversational cadence.",
            preferredGoogleVoiceTokens = listOf("frd", "frb"),
            speechRate = 1.01f,
            pitch = 0.93f,
            accentColorHex = 0xFFF59E0B
        )
    )

    fun byId(id: String): GeminiLiveVoiceProfile =
        voices.firstOrNull { it.id == id } ?: voices.first()
}

class GeminiVoicePreferences(private val context: Context) {
    private val keyVoiceId = stringPreferencesKey("selected_voice_id")
    private val keyApiKey = stringPreferencesKey("gemini_api_key_override")

    val selectedVoiceId: Flow<String> = context.geminiVoiceDataStore.data.map { prefs ->
        prefs[keyVoiceId] ?: GeminiVoiceCatalog.voices.first().id
    }

    val customApiKey: Flow<String> = context.geminiVoiceDataStore.data.map { prefs ->
        prefs[keyApiKey]?.trim().orEmpty()
    }

    val effectiveApiKey: Flow<String> = context.geminiVoiceDataStore.data.map { prefs ->
        val stored = prefs[keyApiKey]?.trim().orEmpty()
        if (stored.isNotEmpty()) stored else BuildConfig.GEMINI_API_KEY.trim()
    }

    suspend fun setSelectedVoice(voiceId: String) {
        context.geminiVoiceDataStore.edit { it[keyVoiceId] = voiceId }
    }

    suspend fun setCustomApiKey(apiKey: String) {
        context.geminiVoiceDataStore.edit { it[keyApiKey] = apiKey.trim() }
    }
}
