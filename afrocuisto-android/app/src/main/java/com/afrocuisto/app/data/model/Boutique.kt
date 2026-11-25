package com.afrocuisto.app.data.model

import kotlinx.serialization.Serializable

@Serializable
enum class BoutiqueCategory(val id: String, val label: String) {
    ALL("all", "Tout"),
    VEGETABLES("vegetables", "Légumes"),
    FRUITS("fruits", "Fruits"),
    SPICES("spices", "Épices"),
    GRAINS("grains", "Céréales"),
    OILS("oils", "Huiles"),
    PROTEINS("proteins", "Poissons & Viandes")
}

@Serializable
enum class BoutiqueSort(val id: String, val label: String) {
    POPULAR("popular", "Populaire"),
    PRICE_ASC("price_asc", "Prix ↑"),
    PRICE_DESC("price_desc", "Prix ↓"),
    ORGANIC("organic", "Bio / Terroir")
}

@Serializable
data class BoutiqueProduct(
    val id: String,
    val name: String,
    val subtitle: String,
    val origin: String,
    val category: BoutiqueCategory,
    val unitLabel: String,
    val priceFcfa: Double,
    val rating: Double = 4.8,
    val reviewsCount: Int = 24,
    val isOrganic: Boolean = false,
    val inStock: Boolean = true,
    val culinaryTip: String = "",
    val description: String = "",
    val imageUrl: String = ""
)

@Serializable
data class BoutiqueCartItem(
    val product: BoutiqueProduct,
    val quantity: Int,
    val note: String = ""
) {
    val lineTotalFcfa: Double
        get() = product.priceFcfa * quantity
}

@Serializable
data class BoutiqueOrder(
    val id: String,
    val items: List<BoutiqueCartItem>,
    val subtotalFcfa: Double,
    val deliveryFeeFcfa: Double,
    val totalFcfa: Double,
    val deliverySlot: String,
    val address: String,
    val paymentMethod: String,
    val createdAt: Long = System.currentTimeMillis(),
    val isDelivered: Boolean = false
)
