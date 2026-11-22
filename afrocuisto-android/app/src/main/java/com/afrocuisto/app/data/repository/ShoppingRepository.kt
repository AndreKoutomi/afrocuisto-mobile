package com.afrocuisto.app.data.repository

import com.afrocuisto.app.data.model.ShoppingItem
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class ShoppingRepository {

    private val _items = MutableStateFlow<List<ShoppingItem>>(
        listOf(
            ShoppingItem("1", "Farine de maïs raffinée", "500g", "Épices & Céréales", "Amiwô au Poulet", false),
            ShoppingItem("2", "Concentré de noix de palme", "1 boîte", "Conserves & Huiles", "Dékoun", true),
            ShoppingItem("3", "Poudre de Kankan (Yaji)", "100g", "Épices du Terroir", "Tchatchanga", false),
            ShoppingItem("4", "Piment rouge frais", "200g", "Légumes", "Amiwô au Poulet", false)
        )
    )
    val items: Flow<List<ShoppingItem>> = _items.asStateFlow()

    fun toggleCheck(id: String) {
        _items.value = _items.value.map {
            if (it.id == id) it.copy(isChecked = !it.isChecked) else it
        }
    }

    fun addItem(name: String, quantity: String, category: String) {
        val newItem = ShoppingItem(
            id = System.currentTimeMillis().toString(),
            name = name,
            quantity = quantity,
            category = category
        )
        _items.value = _items.value + newItem
    }

    fun deleteItem(id: String) {
        _items.value = _items.value.filter { it.id != id }
    }
}
