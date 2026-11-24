package com.afrocuisto.app.data.repository

import com.afrocuisto.app.data.model.Ingredient
import com.afrocuisto.app.data.model.MarketCurrency
import com.afrocuisto.app.data.model.ShoppingItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ShoppingRepository {

    val items: StateFlow<List<ShoppingItem>> = sharedItems.asStateFlow()
    val archivedItems: StateFlow<List<ShoppingItem>> = sharedArchivedItems.asStateFlow()
    val currency: StateFlow<MarketCurrency> = sharedCurrency.asStateFlow()

    fun toggleCurrency() {
        sharedCurrency.value = if (sharedCurrency.value == MarketCurrency.FCFA) {
            MarketCurrency.EUR
        } else {
            MarketCurrency.FCFA
        }
    }

    fun toggleCheck(id: String) {
        sharedItems.value = sharedItems.value.map {
            if (it.id == id) it.copy(isChecked = !it.isChecked) else it
        }
    }

    fun setAllChecked(checked: Boolean) {
        sharedItems.value = sharedItems.value.map { it.copy(isChecked = checked) }
    }

    fun updateItemPrice(id: String, price: Double?) {
        val cleanPrice = price?.takeIf { it > 0.0 }
        sharedItems.value = sharedItems.value.map {
            if (it.id == id) it.copy(price = cleanPrice) else it
        }
    }

    fun updateItemDetails(
        id: String,
        name: String,
        quantity: String,
        category: String,
        price: Double?
    ) {
        val trimmedName = name.trim()
        if (trimmedName.isBlank()) return
        val cleanPrice = price?.takeIf { it > 0.0 }
        sharedItems.value = sharedItems.value.map {
            if (it.id == id) {
                it.copy(
                    name = trimmedName,
                    quantity = quantity.trim().ifBlank { "1" },
                    category = category.ifBlank { "Épices & Terroir" },
                    price = cleanPrice
                )
            } else {
                it
            }
        }
    }

    fun addItem(
        name: String,
        quantity: String,
        category: String,
        recipeName: String? = null,
        price: Double? = null
    ) {
        val trimmedName = name.trim()
        if (trimmedName.isBlank()) return
        val newItem = ShoppingItem(
            id = "item_${System.nanoTime()}",
            name = trimmedName,
            quantity = quantity.trim().ifBlank { "1" },
            category = category.ifBlank { "Épices & Terroir" },
            recipeName = recipeName,
            isChecked = false,
            price = price?.takeIf { it > 0.0 }
        )
        sharedItems.value = listOf(newItem) + sharedItems.value
    }

    /**
     * Adds or updates a batch of checked recipe ingredients in the shared market cart.
     * Returns the number of ingredients added/updated.
     */
    fun addRecipeIngredients(
        recipeName: String,
        recipeCategory: String,
        entries: List<Pair<Ingredient, String>>
    ): Int {
        if (entries.isEmpty()) return 0

        val current = sharedItems.value.toMutableList()
        val updatedOrNew = mutableListOf<ShoppingItem>()

        entries.forEach { (ingredient, scaledQuantity) ->
            val cleanName = ingredient.name.trim()
            if (cleanName.isBlank()) return@forEach

            val cleanQty = scaledQuantity.trim().ifBlank { "1" }
            val inferredCategory = inferIngredientCategory(cleanName, recipeCategory)

            val existingIndex = current.indexOfFirst { existing ->
                existing.name.equals(cleanName, ignoreCase = true) &&
                    (existing.recipeName == null ||
                        existing.recipeName.equals(recipeName, ignoreCase = true) ||
                        recipeName.contains(existing.recipeName, ignoreCase = true))
            }

            if (existingIndex >= 0) {
                val existing = current.removeAt(existingIndex)
                updatedOrNew.add(
                    existing.copy(
                        quantity = cleanQty,
                        category = inferredCategory,
                        recipeName = recipeName,
                        isChecked = false
                    )
                )
            } else {
                updatedOrNew.add(
                    ShoppingItem(
                        id = "recipe_${System.nanoTime()}_${cleanName.hashCode()}",
                        name = cleanName,
                        quantity = cleanQty,
                        category = inferredCategory,
                        recipeName = recipeName,
                        isChecked = false
                    )
                )
            }
        }

        sharedItems.value = updatedOrNew + current
        return updatedOrNew.size
    }

    fun deleteItem(id: String) {
        sharedItems.value = sharedItems.value.filter { it.id != id }
    }

    fun clearCheckedItems() {
        sharedItems.value = sharedItems.value.filterNot { it.isChecked }
    }

    /**
     * Archives all currently checked (purchased) items into the purchase archive history.
     * Returns the number of archived items.
     */
    fun archiveCheckedItems(): Int {
        val toArchive = sharedItems.value.filter { it.isChecked }
        if (toArchive.isEmpty()) return 0

        val now = System.currentTimeMillis()
        val batchLabel = formatArchiveBatchLabel(now)
        val stamped = toArchive.map {
            it.copy(
                isChecked = true,
                archivedAt = now,
                archiveBatchLabel = batchLabel
            )
        }

        sharedArchivedItems.value = stamped + sharedArchivedItems.value
        sharedItems.value = sharedItems.value.filterNot { it.isChecked }
        return stamped.size
    }

    /**
     * Archives a single item immediately (marks it purchased and moves it to archives).
     */
    fun archiveSingleItem(id: String) {
        val target = sharedItems.value.firstOrNull { it.id == id } ?: return
        val now = System.currentTimeMillis()
        val stamped = target.copy(
            isChecked = true,
            archivedAt = now,
            archiveBatchLabel = formatArchiveBatchLabel(now)
        )
        sharedArchivedItems.value = listOf(stamped) + sharedArchivedItems.value
        sharedItems.value = sharedItems.value.filterNot { it.id == id }
    }

    /**
     * Restores an archived item back into the active market list as un-checked (to buy again).
     */
    fun restoreArchivedItem(id: String) {
        val target = sharedArchivedItems.value.firstOrNull { it.id == id } ?: return
        val restored = target.copy(
            id = "restored_${System.nanoTime()}",
            isChecked = false,
            archivedAt = null,
            archiveBatchLabel = null
        )
        sharedItems.value = listOf(restored) + sharedItems.value
        sharedArchivedItems.value = sharedArchivedItems.value.filterNot { it.id == id }
    }

    /**
     * Restores an entire archive batch back to the active market list.
     */
    fun restoreArchiveBatch(batchLabel: String): Int {
        val matching = sharedArchivedItems.value.filter { it.archiveBatchLabel == batchLabel }
        if (matching.isEmpty()) return 0
        val restored = matching.map {
            it.copy(
                id = "restored_${System.nanoTime()}_${it.name.hashCode()}",
                isChecked = false,
                archivedAt = null,
                archiveBatchLabel = null
            )
        }
        sharedItems.value = restored + sharedItems.value
        sharedArchivedItems.value = sharedArchivedItems.value.filterNot { it.archiveBatchLabel == batchLabel }
        return restored.size
    }

    fun deleteArchivedItem(id: String) {
        sharedArchivedItems.value = sharedArchivedItems.value.filterNot { it.id == id }
    }

    fun clearArchives() {
        sharedArchivedItems.value = emptyList()
    }

    fun replaceAllFromRemote(
        active: List<ShoppingItem>,
        archived: List<ShoppingItem>,
        currency: MarketCurrency
    ) {
        sharedItems.value = active
        sharedArchivedItems.value = archived
        sharedCurrency.value = currency
    }

    companion object {
        private val sharedCurrency = MutableStateFlow(MarketCurrency.FCFA)

        private val sharedItems = MutableStateFlow(
            listOf(
                ShoppingItem("1", "Farine de maïs raffinée", "500 g", "Céréales & Féculents", "Amiwô au Poulet Braisé", false, 1200.0),
                ShoppingItem("2", "Concentré de noix de palme", "1 boîte", "Huiles & Conserves", "Dékoun", true, 1800.0),
                ShoppingItem("3", "Poudre de Kankan (Yaji)", "100 g", "Épices & Terroir", "Tchatchanga", false, 750.0),
                ShoppingItem("4", "Piment rouge frais", "200 g", "Légumes & Frais", "Amiwô au Poulet Braisé", false, 500.0)
            )
        )

        private val sharedArchivedItems = MutableStateFlow(
            listOf(
                ShoppingItem(
                    id = "arch_1",
                    name = "Poulet fermier découpé",
                    quantity = "1,2 kg",
                    category = "Viandes & Poissons",
                    recipeName = "Amiwô au Poulet Braisé",
                    isChecked = true,
                    price = 4500.0,
                    archivedAt = System.currentTimeMillis() - 86_400_000L,
                    archiveBatchLabel = "Courses d'hier"
                ),
                ShoppingItem(
                    id = "arch_2",
                    name = "Fleurs d'hibiscus (Bissap)",
                    quantity = "250 g",
                    category = "Épices & Terroir",
                    recipeName = "Jus de Bissap à la Menthe",
                    isChecked = true,
                    price = 1000.0,
                    archivedAt = System.currentTimeMillis() - 86_400_000L,
                    archiveBatchLabel = "Courses d'hier"
                )
            )
        )

        private fun formatArchiveBatchLabel(timestampMs: Long): String {
            val fmt = SimpleDateFormat("dd MMM • HH:mm", Locale.FRENCH)
            return "Achat du ${fmt.format(Date(timestampMs))}"
        }

        private fun inferIngredientCategory(name: String, fallbackCategory: String): String {
            val n = name.lowercase()
            return when {
                listOf("poulet", "viande", "bœuf", "boeuf", "poisson", "crabe", "crevette", "mouton", "agneau", "oeuf", "œuf").any { it in n } ->
                    "Viandes & Poissons"
                listOf("oignon", "tomate", "gombo", "piment", "ail", "gingembre", "plantain", "igname", "manioc", "feuille", "légume", "citron").any { it in n } ->
                    "Légumes & Frais"
                listOf("huile", "palme", "concentré", "purée", "sauce", "bouillon").any { it in n } ->
                    "Huiles & Conserves"
                listOf("farine", "riz", "haricot", "semoule", "maïs", "mil", "sorgho", "couscous", "attiéké", "gari").any { it in n } ->
                    "Céréales & Féculents"
                else -> fallbackCategory.ifBlank { "Épices & Terroir" }
            }
        }
    }
}
