package com.afrocuisto.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class ShoppingItem(
    val id: String = "",
    val name: String = "",
    val quantity: String = "1",
    val category: String = "Épices & Terroir",
    val recipeName: String? = null,
    val isChecked: Boolean = false
)
