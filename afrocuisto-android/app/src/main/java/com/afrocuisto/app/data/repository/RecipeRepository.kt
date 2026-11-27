package com.afrocuisto.app.data.repository

import coil.Coil
import coil.request.ImageRequest
import com.afrocuisto.app.BuildConfig
import com.afrocuisto.app.data.model.Ingredient
import com.afrocuisto.app.data.model.Recipe
import com.afrocuisto.app.data.network.NetworkMonitor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.util.concurrent.TimeUnit

@Serializable
data class HomeSection(
    val id: String,
    val title: String,
    val sectionType: String = "recipes",
    val itemIds: List<String> = emptyList(),
    val orderIndex: Int = 0,
    val isActive: Boolean = true
)

data class AppNotificationItem(
    val id: String,
    val title: String,
    val body: String,
    val actionRoute: String? = null,
    val createdAt: String = ""
)

data class FavoriteAddedEvent(
    val recipeId: String,
    val recipeName: String,
    val recipeImage: String,
    val eventId: Long = System.nanoTime()
)

class RecipeRepository {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val json = Json { ignoreUnknownKeys = true }
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val _recipes = sharedRecipes
    val recipes: Flow<List<Recipe>> = sharedRecipes.asStateFlow()

    private val _homeSections = sharedHomeSections
    val homeSections: Flow<List<HomeSection>> = sharedHomeSections.asStateFlow()

    private val _notifications = MutableStateFlow<List<AppNotificationItem>>(emptyList())
    val notifications: Flow<List<AppNotificationItem>> = _notifications.asStateFlow()

    private val _favoriteIds = sharedFavoriteIds
    val favoriteIds: Flow<Set<String>> = sharedFavoriteIds.asStateFlow()

    val favoriteAddedEvents: Flow<FavoriteAddedEvent?> = sharedFavoriteAddedEvent.asStateFlow()

    fun consumeFavoriteAddedEvent() {
        sharedFavoriteAddedEvent.value = null
    }

    init {
        refreshFromSupabaseAsync()
    }

    fun refreshFromSupabaseAsync() {
        scope.launch {
            refreshFromSupabase()
        }
    }

    suspend fun refreshFromSupabase() = withContext(Dispatchers.IO) {
        if (!NetworkMonitor.isOnline.value) return@withContext
        val baseUrl = BuildConfig.SUPABASE_URL.trimEnd('/')
        val anonKey = BuildConfig.SUPABASE_ANON_KEY
        if (baseUrl.isBlank() || anonKey.isBlank()) return@withContext

        runCatching {
            fetchJsonArray("$baseUrl/rest/v1/recipes?select=*&order=name.asc", anonKey)?.let { arr ->
                val parsed = arr.mapNotNull { el -> runCatching { parseRecipe(el.jsonObject) }.getOrNull() }
                if (parsed.isNotEmpty()) {
                    _recipes.value = parsed
                    persistRecipes(parsed)
                }
            }
        }

        runCatching {
            fetchJsonArray("$baseUrl/rest/v1/home_sections?select=*&is_active=eq.true&order=order_index.asc", anonKey)?.let { arr ->
                val sections = arr.mapNotNull { el ->
                    runCatching {
                        val obj = el.jsonObject
                        HomeSection(
                            id = obj["id"]?.jsonPrimitive?.contentOrNull.orEmpty(),
                            title = obj["title"]?.jsonPrimitive?.contentOrNull.orEmpty(),
                            sectionType = obj["section_type"]?.jsonPrimitive?.contentOrNull ?: "recipes",
                            itemIds = obj["item_ids"]?.jsonArray?.mapNotNull { it.jsonPrimitive.contentOrNull } ?: emptyList(),
                            orderIndex = obj["order_index"]?.jsonPrimitive?.intOrNull ?: 0,
                            isActive = obj["is_active"]?.jsonPrimitive?.booleanOrNull ?: true
                        )
                    }.getOrNull()
                }
                _homeSections.value = sections
                persistHomeSections(sections)
            }
        }

        runCatching {
            fetchJsonArray("$baseUrl/rest/v1/app_notifications?select=*&is_active=eq.true&order=created_at.desc", anonKey)?.let { arr ->
                val remoteItems = arr.mapNotNull { el ->
                    runCatching {
                        val obj = el.jsonObject
                        AppNotificationItem(
                            id = obj["id"]?.jsonPrimitive?.contentOrNull.orEmpty(),
                            title = obj["title"]?.jsonPrimitive?.contentOrNull.orEmpty(),
                            body = obj["body"]?.jsonPrimitive?.contentOrNull.orEmpty(),
                            actionRoute = obj["action_route"]?.jsonPrimitive?.contentOrNull,
                            createdAt = obj["created_at"]?.jsonPrimitive?.contentOrNull.orEmpty()
                        )
                    }.getOrNull()
                }
                _notifications.value = remoteItems
                AppNotificationCenter.syncRemoteNotifications(remoteItems)
            }
        }
    }

    private fun fetchJsonArray(url: String, anonKey: String): JsonArray? {
        val request = Request.Builder()
            .url(url)
            .addHeader("apikey", anonKey)
            .addHeader("Authorization", "Bearer $anonKey")
            .addHeader("Accept", "application/json")
            .get()
            .build()
        httpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return null
            val body = response.body?.string().orEmpty()
            if (body.isBlank()) return null
            return json.parseToJsonElement(body).jsonArray
        }
    }

    private fun parseRecipe(obj: JsonObject): Recipe {
        val ingredients = obj["ingredients"]?.takeIf { it is JsonArray }?.jsonArray?.mapNotNull { item ->
            runCatching {
                val ing = item.jsonObject
                Ingredient(
                    name = ing["name"]?.jsonPrimitive?.contentOrNull.orEmpty(),
                    amount = ing["amount"]?.jsonPrimitive?.contentOrNull.orEmpty(),
                    unit = ing["unit"]?.jsonPrimitive?.contentOrNull.orEmpty(),
                    isOptional = ing["isOptional"]?.jsonPrimitive?.booleanOrNull ?: false,
                    substitute = ing["substitute"]?.jsonPrimitive?.contentOrNull
                )
            }.getOrNull()
        } ?: emptyList()

        val steps = obj["steps"]?.takeIf { it is JsonArray }?.jsonArray?.mapNotNull { el ->
            when (el) {
                is JsonObject -> {
                    val title = el["title"]?.jsonPrimitive?.contentOrNull?.trim().orEmpty()
                    val desc = el["description"]?.jsonPrimitive?.contentOrNull?.trim().orEmpty()
                    listOf(title, desc).filter { it.isNotBlank() }.joinToString(" : ").takeIf { it.isNotBlank() }
                }
                else -> runCatching { el.jsonPrimitive.contentOrNull }.getOrNull()
            }
        } ?: emptyList()

        val sides = obj["suggested_sides"]?.takeIf { it is JsonArray }?.jsonArray?.mapNotNull {
            it.jsonPrimitive.contentOrNull
        }

        return Recipe(
            id = obj["id"]?.jsonPrimitive?.contentOrNull.orEmpty(),
            name = obj["name"]?.jsonPrimitive?.contentOrNull.orEmpty(),
            alias = obj["alias"]?.jsonPrimitive?.contentOrNull,
            region = obj["region"]?.jsonPrimitive?.contentOrNull.orEmpty(),
            category = obj["category"]?.jsonPrimitive?.contentOrNull.orEmpty(),
            difficulty = obj["difficulty"]?.jsonPrimitive?.contentOrNull ?: "Facile",
            prepTime = obj["prep_time"]?.jsonPrimitive?.contentOrNull ?: "15 min",
            cookTime = obj["cook_time"]?.jsonPrimitive?.contentOrNull ?: "30 min",
            image = obj["image"]?.jsonPrimitive?.contentOrNull.orEmpty(),
            ingredients = ingredients,
            techniqueTitle = obj["technique_title"]?.jsonPrimitive?.contentOrNull,
            techniqueDescription = obj["technique_description"]?.jsonPrimitive?.contentOrNull,
            description = obj["description"]?.jsonPrimitive?.contentOrNull,
            steps = steps,
            diasporaSubstitutes = obj["diaspora_substitutes"]?.jsonPrimitive?.contentOrNull,
            suggestedSides = sides,
            benefits = obj["benefits"]?.jsonPrimitive?.contentOrNull,
            pedagogicalNote = obj["pedagogical_note"]?.jsonPrimitive?.contentOrNull,
            type = obj["type"]?.jsonPrimitive?.contentOrNull,
            base = obj["base"]?.jsonPrimitive?.contentOrNull,
            isFeatured = obj["is_featured"]?.jsonPrimitive?.booleanOrNull ?: false,
            style = obj["style"]?.jsonPrimitive?.contentOrNull,
            origineHumaine = obj["origine_humaine"]?.jsonPrimitive?.contentOrNull,
            videoUrl = obj["video_url"]?.jsonPrimitive?.contentOrNull,
            rating = obj["rating"]?.jsonPrimitive?.doubleOrNull ?: 4.8
        )
    }

    fun getRecipeById(id: String): Recipe? {
        return _recipes.value.find { it.id == id }
    }

    fun toggleFavorite(recipeId: String) {
        val current = _favoriteIds.value.toMutableSet()
        val added = !current.contains(recipeId)
        if (!added) {
            current.remove(recipeId)
        } else {
            current.add(recipeId)
        }
        _favoriteIds.value = current
        persistFavorites()
        if (added) {
            preloadRecipeImage(recipeId)
            val recipe = _recipes.value.find { it.id == recipeId }
            if (recipe != null) {
                sharedFavoriteAddedEvent.value = FavoriteAddedEvent(
                    recipeId = recipe.id,
                    recipeName = recipe.name,
                    recipeImage = recipe.image
                )
            }
        }
    }

    fun isFavorite(recipeId: String): Boolean {
        return _favoriteIds.value.contains(recipeId)
    }

    fun currentFavorites(): Set<String> = _favoriteIds.value

    fun setFavorites(ids: Set<String>) {
        _favoriteIds.value = ids
        persistFavorites()
        ids.forEach(::preloadRecipeImage)
    }

    private fun preloadRecipeImage(recipeId: String) {
        val ctx = appContextRef ?: return
        val imageUrl = _recipes.value.find { it.id == recipeId }?.image?.takeIf { it.isNotBlank() } ?: return
        runCatching {
            val request = ImageRequest.Builder(ctx)
                .data(imageUrl)
                .build()
            Coil.imageLoader(ctx).enqueue(request)
        }
    }

    companion object {
        private const val PREFS_NAME = "afrocuisto_recipe_prefs"
        private const val KEY_FAVORITES = "favorite_recipe_ids"
        private const val RECIPES_CACHE_FILE = "afrocuisto_recipes_cache.json"
        private const val SECTIONS_CACHE_FILE = "afrocuisto_home_sections_cache.json"
        private val cacheJson = Json { ignoreUnknownKeys = true }
        private var appContextRef: android.content.Context? = null
        private var favPrefs: android.content.SharedPreferences? = null
        private val sharedRecipes = MutableStateFlow<List<Recipe>>(getMockRecipes())
        private val sharedHomeSections = MutableStateFlow<List<HomeSection>>(emptyList())
        private val sharedFavoriteIds = MutableStateFlow<Set<String>>(emptySet())
        private val sharedFavoriteAddedEvent = MutableStateFlow<FavoriteAddedEvent?>(null)

        fun init(context: android.content.Context) {
            if (favPrefs != null) return
            val appCtx = context.applicationContext
            appContextRef = appCtx
            val sp = appCtx.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
            favPrefs = sp
            sp.getStringSet(KEY_FAVORITES, null)?.let { saved ->
                if (sharedFavoriteIds.value.isEmpty()) {
                    sharedFavoriteIds.value = saved.toSet()
                }
            }
            loadCachedCatalog(appCtx)
        }

        private fun loadCachedCatalog(context: android.content.Context) {
            runCatching {
                val recipesFile = File(context.filesDir, RECIPES_CACHE_FILE)
                if (recipesFile.exists()) {
                    val decoded = cacheJson.decodeFromString<List<Recipe>>(recipesFile.readText())
                    if (decoded.isNotEmpty()) {
                        sharedRecipes.value = decoded
                    }
                }
            }
            runCatching {
                val sectionsFile = File(context.filesDir, SECTIONS_CACHE_FILE)
                if (sectionsFile.exists()) {
                    val decoded = cacheJson.decodeFromString<List<HomeSection>>(sectionsFile.readText())
                    if (decoded.isNotEmpty()) {
                        sharedHomeSections.value = decoded
                    }
                }
            }
        }

        private fun persistRecipes(recipes: List<Recipe>) {
            val ctx = appContextRef ?: return
            runCatching {
                File(ctx.filesDir, RECIPES_CACHE_FILE).writeText(cacheJson.encodeToString(recipes))
            }
        }

        private fun persistHomeSections(sections: List<HomeSection>) {
            val ctx = appContextRef ?: return
            runCatching {
                File(ctx.filesDir, SECTIONS_CACHE_FILE).writeText(cacheJson.encodeToString(sections))
            }
        }

        private fun persistFavorites() {
            favPrefs?.edit()?.putStringSet(KEY_FAVORITES, sharedFavoriteIds.value.toSet())?.apply()
        }

        fun getMockRecipes(): List<Recipe> = listOf(
            Recipe(
                id = "P02",
                name = "Amiwô au Poulet Braisé",
                alias = "Pâte Rouge Béninoise",
                region = "Bénin",
                category = "Pâtes & Céréales",
                difficulty = "Moyen",
                prepTime = "20 min",
                cookTime = "40 min",
                image = "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80",
                ingredients = listOf(
                    Ingredient(name = "Farine de maïs raffinée", amount = "500", unit = "g"),
                    Ingredient(name = "Poulet entier découpé", amount = "1", unit = "kg"),
                    Ingredient(name = "Purée de tomates fraîches", amount = "3", unit = "c. à soupe"),
                    Ingredient(name = "Oignons rouges hachés", amount = "2", unit = "moyens"),
                    Ingredient(name = "Piment rouge frais pilé", amount = "1", unit = "c. à café"),
                    Ingredient(name = "Huile végétale d'arachide", amount = "100", unit = "ml")
                ),
                techniqueTitle = "La Clé de la Pâte Rouge (Amiwô)",
                techniqueDescription = "Infuser le bouillon assaisonné avec la tomate et les épices avant d'y verser la farine en pluie fine.",
                description = "Symbole incontournable des festivités au Bénin, l'Amiwô est une pâte parfumée à la tomate et au bouillon de poulet garnie de volaille braisée.",
                steps = listOf(
                    "Faire mariner le poulet avec oignons, ail, gingembre et sel pendant 30 min.",
                    "Faire bouillir le poulet dans une marmite jusqu'à cuisson complète. Réserver le bouillon filtré.",
                    "Faire frire ou braiser les morceaux de poulet au four jusqu'à dorure dorée.",
                    "Dans le bouillon bouillant assaisonné à la tomate, verser la farine de maïs en pluie tout en remuant vigoureusement avec un spatula de bois.",
                    "Laisser mijoter à feu doux 15 min sous couvercle, puis dresser avec le poulet et la pimentade."
                ),
                diasporaSubstitutes = "Remplacer la farine de maïs locale par de la polenta très fine ou de la farine de maïs PAN blanche.",
                suggestedSides = listOf("Sauce Piment Pili-Pili", "Jus de Bissap Glacé"),
                benefits = "Riche en glucides complexes énergétiques et en protéines de haute valeur biologique.",
                isFeatured = true,
                rating = 4.9,
                videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            ),
            Recipe(
                id = "S05",
                name = "Dékoun (Sauce Graine aux Crabes)",
                alias = "Sauce Noix de Palme",
                region = "Togo & Bénin",
                category = "Sauces & Potages",
                difficulty = "Moyen",
                prepTime = "25 min",
                cookTime = "50 min",
                image = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80",
                ingredients = listOf(
                    Ingredient(name = "Concentré de noix de palme", amount = "400", unit = "g"),
                    Ingredient(name = "Crabes frais nettoyés", amount = "6", unit = "pièces"),
                    Ingredient(name = "Poisson fumé (Kpanman)", amount = "200", unit = "g"),
                    Ingredient(name = "Crevettes séchées moulues", amount = "2", unit = "c. à soupe"),
                    Ingredient(name = "Gombo frais tranché", amount = "100", unit = "g")
                ),
                description = "Une sauce riche, onctueuse et réconfortante extraite des graines de palme fraîches, sublimée par des crabes de lagune et poissons fumés.",
                steps = listOf(
                    "Diluer la pâte de noix de palme dans l'eau chaude et filtrer.",
                    "Porter à ébullition dans un pot en terre cuite pendant 25 min jusqu'à apparition d'une fine couche d'huile rouge.",
                    "Ajouter les crabes, le poisson fumé et le gombo.",
                    "Laisser mijoter 20 min à feu doux."
                ),
                isFeatured = true,
                rating = 4.8
            ),
            Recipe(
                id = "P11",
                name = "Atassi Complet Royale",
                alias = "Riz & Haricots",
                region = "Bénin",
                category = "Pâtes & Céréales",
                difficulty = "Facile",
                prepTime = "15 min",
                cookTime = "45 min",
                image = "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80",
                ingredients = listOf(
                    Ingredient(name = "Haricots rouges ou œil noir", amount = "300", unit = "g"),
                    Ingredient(name = "Riz parfumé long grain", amount = "300", unit = "g"),
                    Ingredient(name = "Sauce friture Fritou", amount = "200", unit = "ml"),
                    Ingredient(name = "Oeufs durs", amount = "2", unit = "pièces"),
                    Ingredient(name = "Viande de bœuf frite", amount = "250", unit = "g")
                ),
                description = "Le plat réconfortant béninois par excellence, mêlant riz tendre et haricots onctueux accompagnés d'une friture relevée et d'œufs bouillis.",
                steps = listOf(
                    "Cuire les haricots jusqu'à tendreté partielle.",
                    "Ajouter le riz dans la même eau de cuisson des haricots avec une pincée de potasse naturelle.",
                    "Couvrir et laisser étuver à petit feu.",
                    "Servir chaud avec la friture piquante, la viande frite et les œufs."
                ),
                isFeatured = true,
                rating = 4.8
            ),
            Recipe(
                id = "V03",
                name = "Tchatchanga Suya Brochettes",
                alias = "Viande Grillée Épicée",
                region = "Niger & Bénin",
                category = "Grillades & Viandes",
                difficulty = "Facile",
                prepTime = "30 min",
                cookTime = "15 min",
                image = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
                ingredients = listOf(
                    Ingredient(name = "Filet de bœuf ou d'agneau", amount = "600", unit = "g"),
                    Ingredient(name = "Poudre de Kankan (Yaji)", amount = "4", unit = "c. à soupe"),
                    Ingredient(name = "Oignons rouges tranchés", amount = "2", unit = "pièces"),
                    Ingredient(name = "Huile d'arachide", amount = "3", unit = "c. à soupe")
                ),
                description = "Des brochettes de viande de bœuf tendre enrobées de poudre de tourteau d'arachide épicée (Kankan) grillées au feu de bois.",
                steps = listOf(
                    "Couper la viande en fines lamelles.",
                    "Enfiler sur des pics en bois et badigeonner d'huile.",
                    "Rouler généreusement dans la poudre de Kankan.",
                    "Griller sur le barbecue très chaud 3 min par face."
                ),
                isFeatured = true,
                rating = 4.9
            ),
            Recipe(
                id = "J01",
                name = "Jus de Bissap à la Menthe",
                alias = "Infusion d'Hibiscus",
                region = "Sénégal & Afrique de l'Ouest",
                category = "Boissons & Cocktails",
                difficulty = "Facile",
                prepTime = "10 min",
                cookTime = "15 min",
                image = "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80",
                ingredients = listOf(
                    Ingredient(name = "Fleurs d'hibiscus séchées (Bissap)", amount = "100", unit = "g"),
                    Ingredient(name = "Feuilles de menthe fraîche", amount = "1", unit = "bouquet"),
                    Ingredient(name = "Sucre de canne ou miel", amount = "150", unit = "g"),
                    Ingredient(name = "Arôme Fleur d'oranger ou vanille", amount = "1", unit = "c. à café")
                ),
                description = "Boisson rafraîchissante et antioxydante préparée à partir de fleurs rouges d'hibiscus infusées avec de la menthe fraîche.",
                steps = listOf(
                    "Rincer rapidement les fleurs de bissap à l'eau froide.",
                    "Porter 1.5L d'eau à ébullition avec les fleurs et la menthe pendant 15 min.",
                    "Filtrer finement à la passoire.",
                    "Sucrer et parfumer, puis placer au réfrigérateur au moins 3 heures."
                ),
                isFeatured = false,
                rating = 4.9
            ),
            Recipe(
                id = "M04",
                name = "Mafé au Poulet & Arachide",
                alias = "Tiga Dèguè Na",
                region = "Sénégal & Mali",
                category = "Sauces & Potages",
                difficulty = "Facile",
                prepTime = "20 min",
                cookTime = "40 min",
                image = "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80",
                ingredients = listOf(
                    Ingredient(name = "Poulet fermier découpé", amount = "800", unit = "g"),
                    Ingredient(name = "Pâte d'arachide pure non sucrée", amount = "180", unit = "g"),
                    Ingredient(name = "Purée de tomates fraîches", amount = "3", unit = "c. à soupe"),
                    Ingredient(name = "Patate douce & carottes", amount = "350", unit = "g"),
                    Ingredient(name = "Oignons, ail & gingembre", amount = "2", unit = "pièces")
                ),
                techniqueTitle = "Onctuosité de la Sauce Arachide",
                techniqueDescription = "Délayer la pâte d'arachide hors du feu dans un peu de bouillon tiède avant de la laisser mijoter doucement jusqu'à remontée d'une fine huile dorée.",
                description = "Grand classique ouest-africain au poulet fondant mijoté dans une sauce veloutée au beurre d'arachide, tomates et légumes racines.",
                steps = listOf(
                    "Faire dorer les morceaux de poulet avec oignons, ail et concentré de tomate.",
                    "Délayer la pâte d'arachide dans l'eau tiède puis verser sur le poulet.",
                    "Ajouter patate douce et carottes en gros morceaux puis mijoter 30 min à feu doux.",
                    "Servir bien chaud sur un lit de riz blanc parfumé."
                ),
                diasporaSubstitutes = "Utiliser du beurre de cacahuète 100 % pur sans sucre ni huile ajoutée.",
                suggestedSides = listOf("Riz blanc parfumé", "Jus de Bissap Glacé"),
                isFeatured = true,
                rating = 4.9
            )
        )
    }
}
