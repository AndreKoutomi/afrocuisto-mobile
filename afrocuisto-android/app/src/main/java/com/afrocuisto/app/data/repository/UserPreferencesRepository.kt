package com.afrocuisto.app.data.repository

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

private val Context.afroUserPrefsDataStore by preferencesDataStore(name = "afrocuisto_user_preferences")

enum class AppThemeMode(val id: String, val label: String) {
    SYSTEM("system", "Système"),
    LIGHT("light", "Clair"),
    DARK("dark", "Sombre");

    companion object {
        fun fromId(id: String?): AppThemeMode =
            entries.firstOrNull { it.id == id } ?: SYSTEM
    }
}

enum class AppLanguage(val id: String, val label: String) {
    FR("fr", "Français"),
    EN("en", "English"),
    ES("es", "Español");

    companion object {
        fun fromId(id: String?): AppLanguage =
            entries.firstOrNull { it.id == id } ?: FR
    }
}

enum class SpiceTolerance(val id: String, val label: String, val description: String) {
    MILD("mild", "Doux", "Aromates doux sans piment fort"),
    FRAGRANT("fragrant", "Parfumé", "Épices torréfiées & chaleur légère"),
    SPICY("spicy", "Relevé", "Équilibre traditionnel au piment frais"),
    FIERY("fiery", "Intense", "Piment fort authentique du terroir");

    companion object {
        fun fromId(id: String?): SpiceTolerance =
            entries.firstOrNull { it.id == id } ?: SPICY
    }
}

enum class CulinaryLevel(val id: String, val label: String) {
    BEGINNER("beginner", "Débutant"),
    INTERMEDIATE("intermediate", "Intermédiaire"),
    PASSIONATE("passionate", "Confirmé"),
    CHEF("chef", "Chef du Terroir");

    companion object {
        fun fromId(id: String?): CulinaryLevel =
            entries.firstOrNull { it.id == id } ?: INTERMEDIATE
    }
}

enum class MeasurementMode(val id: String, val label: String) {
    METRIC("metric", "Métrique (g, ml, kg)"),
    HOUSEHOLD("household", "Mesures maison (cuillères, bols)");

    companion object {
        fun fromId(id: String?): MeasurementMode =
            entries.firstOrNull { it.id == id } ?: METRIC
    }
}

data class UserPreferencesState(
    val displayName: String = "Gourmet Afro",
    val roleTitle: String = "Gourmet Passionné",
    val bio: String = "Passionné de gastronomie africaine traditionnelle et créative.",
    val avatarUrl: String = UserPreferencesRepository.AVATAR_PRESETS.first(),
    val favoriteTerroir: String = "Bénin",
    val culinaryLevel: CulinaryLevel = CulinaryLevel.INTERMEDIATE,
    val defaultServings: Int = 4,
    val spiceTolerance: SpiceTolerance = SpiceTolerance.SPICY,
    val measurementMode: MeasurementMode = MeasurementMode.METRIC,
    val diasporaSubstitutesFirst: Boolean = false,
    val keepScreenOnInRecipe: Boolean = true,
    val dietaryTags: Set<String> = emptySet(),
    val cookedRecipeIds: Set<String> = emptySet(),
    val themeMode: AppThemeMode = AppThemeMode.SYSTEM,
    val language: AppLanguage = AppLanguage.FR,
    val carouselAutoScroll: Boolean = true,
    val timerVibrationEnabled: Boolean = true
)

class UserPreferencesRepository(private val context: Context) {

    suspend fun importAvatar(uri: Uri): String? = withContext(Dispatchers.IO) {
        runCatching {
            val resolver = context.contentResolver
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return@withContext null

            var sampleSize = 1
            while (bounds.outWidth / sampleSize > 1200 || bounds.outHeight / sampleSize > 1200) {
                sampleSize *= 2
            }
            val bitmap = resolver.openInputStream(uri)?.use { stream ->
                BitmapFactory.decodeStream(
                    stream,
                    null,
                    BitmapFactory.Options().apply { inSampleSize = sampleSize }
                )
            } ?: return@withContext null

            val avatarDirectory = File(context.filesDir, "profile").apply { mkdirs() }
            val avatarFile = File(avatarDirectory, "avatar_${System.currentTimeMillis()}.jpg")
            FileOutputStream(avatarFile).use { output ->
                if (!bitmap.compress(Bitmap.CompressFormat.JPEG, 88, output)) return@withContext null
            }
            bitmap.recycle()
            avatarDirectory.listFiles()
                ?.filter { it.name.startsWith("avatar_") && it != avatarFile }
                ?.forEach(File::delete)
            avatarFile.toURI().toString()
        }.getOrNull()
    }

    private object Keys {
        val DISPLAY_NAME = stringPreferencesKey("display_name")
        val ROLE_TITLE = stringPreferencesKey("role_title")
        val BIO = stringPreferencesKey("bio")
        val AVATAR_URL = stringPreferencesKey("avatar_url")
        val FAVORITE_TERROIR = stringPreferencesKey("favorite_terroir")
        val CULINARY_LEVEL = stringPreferencesKey("culinary_level")
        val DEFAULT_SERVINGS = intPreferencesKey("default_servings")
        val SPICE_TOLERANCE = stringPreferencesKey("spice_tolerance")
        val MEASUREMENT_MODE = stringPreferencesKey("measurement_mode")
        val DIASPORA_FIRST = booleanPreferencesKey("diaspora_substitutes_first")
        val KEEP_SCREEN_ON = booleanPreferencesKey("keep_screen_on_in_recipe")
        val DIETARY_TAGS = stringSetPreferencesKey("dietary_tags")
        val COOKED_RECIPE_IDS = stringSetPreferencesKey("cooked_recipe_ids")
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val APP_LANGUAGE = stringPreferencesKey("app_language")
        val CAROUSEL_AUTO_SCROLL = booleanPreferencesKey("carousel_auto_scroll")
        val TIMER_VIBRATION = booleanPreferencesKey("timer_vibration_enabled")
    }

    val preferencesFlow: Flow<UserPreferencesState> = context.afroUserPrefsDataStore.data.map { prefs ->
        UserPreferencesState(
            displayName = prefs[Keys.DISPLAY_NAME]?.takeIf { it.isNotBlank() } ?: "Gourmet Afro",
            roleTitle = prefs[Keys.ROLE_TITLE]?.takeIf { it.isNotBlank() } ?: "Gourmet Passionné",
            bio = prefs[Keys.BIO]?.takeIf { it.isNotBlank() }
                ?: "Passionné de gastronomie africaine traditionnelle et créative.",
            avatarUrl = prefs[Keys.AVATAR_URL]?.takeIf { it.isNotBlank() } ?: AVATAR_PRESETS.first(),
            favoriteTerroir = prefs[Keys.FAVORITE_TERROIR]?.takeIf { it.isNotBlank() } ?: "Bénin",
            culinaryLevel = CulinaryLevel.fromId(prefs[Keys.CULINARY_LEVEL]),
            defaultServings = (prefs[Keys.DEFAULT_SERVINGS] ?: 4).coerceIn(1, 20),
            spiceTolerance = SpiceTolerance.fromId(prefs[Keys.SPICE_TOLERANCE]),
            measurementMode = MeasurementMode.fromId(prefs[Keys.MEASUREMENT_MODE]),
            diasporaSubstitutesFirst = prefs[Keys.DIASPORA_FIRST] ?: false,
            keepScreenOnInRecipe = prefs[Keys.KEEP_SCREEN_ON] ?: true,
            dietaryTags = prefs[Keys.DIETARY_TAGS] ?: emptySet(),
            cookedRecipeIds = prefs[Keys.COOKED_RECIPE_IDS] ?: emptySet(),
            themeMode = AppThemeMode.fromId(prefs[Keys.THEME_MODE]),
            language = AppLanguage.fromId(prefs[Keys.APP_LANGUAGE]),
            carouselAutoScroll = prefs[Keys.CAROUSEL_AUTO_SCROLL] ?: true,
            timerVibrationEnabled = prefs[Keys.TIMER_VIBRATION] ?: true
        )
    }

    suspend fun updateIdentity(
        displayName: String,
        roleTitle: String,
        bio: String,
        favoriteTerroir: String,
        avatarUrl: String
    ) {
        context.afroUserPrefsDataStore.edit { prefs ->
            prefs[Keys.DISPLAY_NAME] = displayName.trim().ifBlank { "Gourmet Afro" }
            prefs[Keys.ROLE_TITLE] = roleTitle.trim().ifBlank { "Gourmet Passionné" }
            prefs[Keys.BIO] = bio.trim()
            prefs[Keys.FAVORITE_TERROIR] = favoriteTerroir.trim().ifBlank { "Bénin" }
            prefs[Keys.AVATAR_URL] = avatarUrl.trim().ifBlank { AVATAR_PRESETS.first() }
        }
    }

    suspend fun setFavoriteTerroir(terroir: String) {
        context.afroUserPrefsDataStore.edit { it[Keys.FAVORITE_TERROIR] = terroir }
    }

    suspend fun setCulinaryLevel(level: CulinaryLevel) {
        context.afroUserPrefsDataStore.edit { it[Keys.CULINARY_LEVEL] = level.id }
    }

    suspend fun setDefaultServings(servings: Int) {
        context.afroUserPrefsDataStore.edit {
            it[Keys.DEFAULT_SERVINGS] = servings.coerceIn(1, 20)
        }
    }

    suspend fun setSpiceTolerance(tolerance: SpiceTolerance) {
        context.afroUserPrefsDataStore.edit { it[Keys.SPICE_TOLERANCE] = tolerance.id }
    }

    suspend fun setMeasurementMode(mode: MeasurementMode) {
        context.afroUserPrefsDataStore.edit { it[Keys.MEASUREMENT_MODE] = mode.id }
    }

    suspend fun setDiasporaSubstitutesFirst(enabled: Boolean) {
        context.afroUserPrefsDataStore.edit { it[Keys.DIASPORA_FIRST] = enabled }
    }

    suspend fun setKeepScreenOnInRecipe(enabled: Boolean) {
        context.afroUserPrefsDataStore.edit { it[Keys.KEEP_SCREEN_ON] = enabled }
    }

    suspend fun toggleDietaryTag(tag: String) {
        context.afroUserPrefsDataStore.edit { prefs ->
            val current = prefs[Keys.DIETARY_TAGS] ?: emptySet()
            prefs[Keys.DIETARY_TAGS] = if (tag in current) current - tag else current + tag
        }
    }

    suspend fun markRecipeCooked(recipeId: String) {
        if (recipeId.isBlank()) return
        context.afroUserPrefsDataStore.edit { prefs ->
            val current = prefs[Keys.COOKED_RECIPE_IDS] ?: emptySet()
            prefs[Keys.COOKED_RECIPE_IDS] = current + recipeId
        }
    }

    suspend fun setThemeMode(mode: AppThemeMode) {
        context.afroUserPrefsDataStore.edit { it[Keys.THEME_MODE] = mode.id }
    }

    suspend fun setLanguage(language: AppLanguage) {
        context.afroUserPrefsDataStore.edit { it[Keys.APP_LANGUAGE] = language.id }
    }

    suspend fun setCarouselAutoScroll(enabled: Boolean) {
        context.afroUserPrefsDataStore.edit { it[Keys.CAROUSEL_AUTO_SCROLL] = enabled }
    }

    suspend fun setTimerVibrationEnabled(enabled: Boolean) {
        // Mirror to lightweight SharedPreferences too so ForegroundService can read synchronously without blocking
        context.getSharedPreferences(SYNC_PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(SYNC_KEY_TIMER_VIBRATION, enabled)
            .apply()
        context.afroUserPrefsDataStore.edit { it[Keys.TIMER_VIBRATION] = enabled }
    }

    suspend fun applyRemoteBundle(
        displayName: String?,
        roleTitle: String?,
        bio: String?,
        avatarUrl: String?,
        favoriteTerroir: String?,
        culinaryLevel: CulinaryLevel?,
        spiceTolerance: SpiceTolerance?,
        dietaryTags: Set<String>?,
        cookedRecipeIds: Set<String>?,
        defaultServings: Int?,
        measurementMode: MeasurementMode?,
        diasporaSubstitutesFirst: Boolean?,
        keepScreenOnInRecipe: Boolean?,
        themeMode: AppThemeMode?,
        carouselAutoScroll: Boolean?,
        timerVibrationEnabled: Boolean?
    ) {
        timerVibrationEnabled?.let { enabled ->
            context.getSharedPreferences(SYNC_PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(SYNC_KEY_TIMER_VIBRATION, enabled)
                .apply()
        }
        context.afroUserPrefsDataStore.edit { prefs ->
            displayName?.takeIf { it.isNotBlank() }?.let { prefs[Keys.DISPLAY_NAME] = it }
            roleTitle?.takeIf { it.isNotBlank() }?.let { prefs[Keys.ROLE_TITLE] = it }
            bio?.let { prefs[Keys.BIO] = it }
            avatarUrl?.takeIf { it.isNotBlank() }?.let { prefs[Keys.AVATAR_URL] = it }
            favoriteTerroir?.takeIf { it.isNotBlank() }?.let { prefs[Keys.FAVORITE_TERROIR] = it }
            culinaryLevel?.let { prefs[Keys.CULINARY_LEVEL] = it.id }
            spiceTolerance?.let { prefs[Keys.SPICE_TOLERANCE] = it.id }
            dietaryTags?.let { prefs[Keys.DIETARY_TAGS] = it }
            cookedRecipeIds?.let { prefs[Keys.COOKED_RECIPE_IDS] = it }
            defaultServings?.let { prefs[Keys.DEFAULT_SERVINGS] = it.coerceIn(1, 20) }
            measurementMode?.let { prefs[Keys.MEASUREMENT_MODE] = it.id }
            diasporaSubstitutesFirst?.let { prefs[Keys.DIASPORA_FIRST] = it }
            keepScreenOnInRecipe?.let { prefs[Keys.KEEP_SCREEN_ON] = it }
            themeMode?.let { prefs[Keys.THEME_MODE] = it.id }
            carouselAutoScroll?.let { prefs[Keys.CAROUSEL_AUTO_SCROLL] = it }
            timerVibrationEnabled?.let { prefs[Keys.TIMER_VIBRATION] = it }
        }
    }

    suspend fun resetCulinaryPreferences() {
        context.getSharedPreferences(SYNC_PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(SYNC_KEY_TIMER_VIBRATION, true)
            .apply()
        context.afroUserPrefsDataStore.edit { prefs ->
            prefs.remove(Keys.DEFAULT_SERVINGS)
            prefs.remove(Keys.SPICE_TOLERANCE)
            prefs.remove(Keys.MEASUREMENT_MODE)
            prefs.remove(Keys.DIASPORA_FIRST)
            prefs.remove(Keys.KEEP_SCREEN_ON)
            prefs.remove(Keys.DIETARY_TAGS)
            prefs.remove(Keys.CAROUSEL_AUTO_SCROLL)
            prefs.remove(Keys.TIMER_VIBRATION)
            prefs.remove(Keys.THEME_MODE)
        }
    }

    companion object {
        private const val SYNC_PREFS_NAME = "afrocuisto_sync_flags"
        private const val SYNC_KEY_TIMER_VIBRATION = "timer_vibration_enabled"

        fun isTimerVibrationEnabled(context: Context): Boolean =
            context.getSharedPreferences(SYNC_PREFS_NAME, Context.MODE_PRIVATE)
                .getBoolean(SYNC_KEY_TIMER_VIBRATION, true)

        val TERROIR_OPTIONS = listOf(
            "Bénin",
            "Togo",
            "Sénégal",
            "Côte d'Ivoire",
            "Cameroun",
            "Mali",
            "Niger",
            "Nigeria",
            "Congo"
        )

        val ROLE_OPTIONS = listOf(
            "Gourmet Passionné",
            "Cuisinier du Terroir",
            "Ambassadeur Diaspora",
            "Maître des Sauces",
            "Chef Créatif"
        )

        val DIETARY_OPTIONS = listOf(
            "Halal",
            "Sans porc",
            "Pescétarien",
            "Végétal",
            "Sans arachide",
            "Peu salé"
        )

        val AVATAR_PRESETS = listOf(
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
            "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80",
            "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80"
        )
    }
}
