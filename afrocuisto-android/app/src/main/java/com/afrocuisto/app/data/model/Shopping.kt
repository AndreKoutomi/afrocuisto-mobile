package com.afrocuisto.app.data.model

import kotlinx.serialization.Serializable

@Serializable
enum class MarketCurrency(val symbol: String, val label: String) {
    FCFA("FCFA", "Franc CFA"),
    EUR("€", "Euro")
}

@Serializable
data class ShoppingItem(
    val id: String = "",
    val name: String = "",
    val quantity: String = "1",
    val category: String = "Épices & Terroir",
    val recipeName: String? = null,
    val isChecked: Boolean = false,
    val price: Double? = null,
    val archivedAt: Long? = null,
    val archiveBatchLabel: String? = null
)
