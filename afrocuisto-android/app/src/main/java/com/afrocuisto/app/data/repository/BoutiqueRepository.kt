package com.afrocuisto.app.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.afrocuisto.app.data.model.BoutiqueCartItem
import com.afrocuisto.app.data.model.BoutiqueCategory
import com.afrocuisto.app.data.model.BoutiqueOrder
import com.afrocuisto.app.data.model.BoutiqueProduct
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class BoutiqueRepository {

    val products: StateFlow<List<BoutiqueProduct>> = sharedProducts.asStateFlow()
    val cart: StateFlow<List<BoutiqueCartItem>> = sharedCart.asStateFlow()
    val orders: StateFlow<List<BoutiqueOrder>> = sharedOrders.asStateFlow()

    fun addToCart(product: BoutiqueProduct, delta: Int = 1, note: String = "") {
        if (!product.inStock || delta <= 0) return
        val cleanNote = note.trim()
        val current = sharedCart.value.toMutableList()
        val idx = current.indexOfFirst { it.product.id == product.id }
        if (idx >= 0) {
            val existing = current[idx]
            current[idx] = existing.copy(
                quantity = (existing.quantity + delta).coerceAtMost(25),
                note = if (cleanNote.isNotEmpty()) cleanNote else existing.note
            )
        } else {
            current.add(
                BoutiqueCartItem(
                    product = product,
                    quantity = delta.coerceAtMost(25),
                    note = cleanNote
                )
            )
        }
        sharedCart.value = current
        persistCart()
    }

    fun updateQuantity(productId: String, newQuantity: Int) {
        if (newQuantity <= 0) {
            removeFromCart(productId)
            return
        }
        sharedCart.value = sharedCart.value.map {
            if (it.product.id == productId) it.copy(quantity = newQuantity.coerceAtMost(25)) else it
        }
        persistCart()
    }

    fun removeFromCart(productId: String) {
        sharedCart.value = sharedCart.value.filterNot { it.product.id == productId }
        persistCart()
    }

    fun clearCart() {
        sharedCart.value = emptyList()
        persistCart()
    }

    fun placeOrder(
        deliverySlot: String,
        address: String,
        paymentMethod: String
    ): BoutiqueOrder? {
        val currentCart = sharedCart.value
        if (currentCart.isEmpty()) return null
        val subtotal = currentCart.sumOf { it.lineTotalFcfa }
        val deliveryFee = STANDARD_DELIVERY_FEE_FCFA
        val order = BoutiqueOrder(
            id = "CMD-${(1000..9999).random()}",
            items = currentCart,
            subtotalFcfa = subtotal,
            deliveryFeeFcfa = deliveryFee,
            totalFcfa = subtotal + deliveryFee,
            deliverySlot = deliverySlot,
            address = address.trim(),
            paymentMethod = paymentMethod
        )
        sharedOrders.value = listOf(order) + sharedOrders.value
        sharedCart.value = emptyList()
        persistCart()
        persistOrders()
        AppNotificationCenter.addOrderCreatedNotification(order)
        return order
    }

    fun markOrderDelivered(orderId: String) {
        var deliveredOrder: BoutiqueOrder? = null
        sharedOrders.value = sharedOrders.value.map { order ->
            if (order.id == orderId && !order.isDelivered) {
                order.copy(isDelivered = true).also { deliveredOrder = it }
            } else {
                order
            }
        }
        if (deliveredOrder != null) {
            persistOrders()
            AppNotificationCenter.addOrderDeliveredNotification(deliveredOrder!!)
        }
    }

    companion object {
        const val STANDARD_DELIVERY_FEE_FCFA = 1_000.0
        private const val PREFS_NAME = "afrocuisto_boutique_prefs"
        private const val KEY_CART = "boutique_cart_json"
        private const val KEY_ORDERS = "boutique_orders_json"

        private val json = Json { ignoreUnknownKeys = true }
        private var prefs: SharedPreferences? = null

        private val sharedCart = MutableStateFlow<List<BoutiqueCartItem>>(emptyList())
        private val sharedOrders = MutableStateFlow<List<BoutiqueOrder>>(emptyList())

        fun init(context: Context) {
            if (prefs != null) return
            val sp = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs = sp
            sp.getString(KEY_CART, null)?.let { raw ->
                runCatching { json.decodeFromString<List<BoutiqueCartItem>>(raw) }
                    .getOrNull()
                    ?.let { sharedCart.value = it }
            }
            sp.getString(KEY_ORDERS, null)?.let { raw ->
                runCatching { json.decodeFromString<List<BoutiqueOrder>>(raw) }
                    .getOrNull()
                    ?.let { sharedOrders.value = it }
            }
        }

        private fun persistCart() {
            val encoded = runCatching { json.encodeToString(sharedCart.value) }.getOrNull() ?: return
            prefs?.edit()?.putString(KEY_CART, encoded)?.apply()
        }

        private fun persistOrders() {
            val encoded = runCatching { json.encodeToString(sharedOrders.value) }.getOrNull() ?: return
            prefs?.edit()?.putString(KEY_ORDERS, encoded)?.apply()
        }

        private val sharedProducts = MutableStateFlow(
            listOf(
                BoutiqueProduct(
                    id = "bout_gombo",
                    name = "Gombo Frais du Terroir",
                    subtitle = "Jeunes gombos croquants récoltés le matin",
                    origin = "Vallée de l'Ouémé",
                    category = BoutiqueCategory.VEGETABLES,
                    unitLabel = "500 g",
                    priceFcfa = 950.0,
                    rating = 4.9,
                    reviewsCount = 68,
                    isOrganic = true,
                    culinaryTip = "Idéal pour votre Sauce Gombo (Févi) ou Dékoun.",
                    description = "Gombos frais sélectionnés à la main, tendres et riches en fibres naturelles pour des sauces onctueuses.",
                    imageUrl = "https://images.unsplash.com/photo-1622205313162-be1d5712a43c?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_tomates",
                    name = "Tomates Grappes Mûres",
                    subtitle = "Charnues et parfumées pour sauces rouges",
                    origin = "Sud-Bénin",
                    category = BoutiqueCategory.VEGETABLES,
                    unitLabel = "1 kg",
                    priceFcfa = 1100.0,
                    rating = 4.8,
                    reviewsCount = 94,
                    isOrganic = true,
                    culinaryTip = "Parfaites pour la base tomatée de l'Amiwô et de la Sauce Monyo.",
                    description = "Tomates rouges cueillies à pleine maturité, offrant un équilibre naturel entre douceur et acidité.",
                    imageUrl = "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_piment",
                    name = "Piment Habanero Frais",
                    subtitle = "Arôme fruité et piquant authentique",
                    origin = "Cotonou & Abomey",
                    category = BoutiqueCategory.VEGETABLES,
                    unitLabel = "250 g",
                    priceFcfa = 650.0,
                    rating = 4.9,
                    reviewsCount = 52,
                    culinaryTip = "À écraser avec oignon et gingembre pour une pimentade maison.",
                    description = "Piments frais rigoureusement triés pour parfumer vos grillades, poissons braisés et sauces.",
                    imageUrl = "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_gboman",
                    name = "Feuilles de Gboman Fraîches",
                    subtitle = "Épinards africains lavés et bottelés",
                    origin = "Porto-Novo",
                    category = BoutiqueCategory.VEGETABLES,
                    unitLabel = "1 botte",
                    priceFcfa = 500.0,
                    rating = 4.7,
                    reviewsCount = 41,
                    isOrganic = true,
                    culinaryTip = "Blanchir 2 minutes avant d'incorporer dans la sauce légumes.",
                    description = "Feuilles vertes tendres cultivées en maraîchage local sans pesticides de synthèse.",
                    imageUrl = "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_plantain",
                    name = "Bananes Plantain Mûres",
                    subtitle = "Chair dorée et sucrée pour Alloco",
                    origin = "Allada",
                    category = BoutiqueCategory.FRUITS,
                    unitLabel = "1,2 kg",
                    priceFcfa = 1350.0,
                    rating = 4.9,
                    reviewsCount = 112,
                    culinaryTip = "Couper en dés biseautés et frire à 175°C jusqu'à dorure caramélisée.",
                    description = "Bananes plantain mûres à point, parfaites pour vos accompagnements d'Alloco ou grillées.",
                    imageUrl = "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_mangue",
                    name = "Mangues Kent Juteuses",
                    subtitle = "Sans fibres, sucrées et parfumées",
                    origin = "Natitingou",
                    category = BoutiqueCategory.FRUITS,
                    unitLabel = "1 kg (3 pcs)",
                    priceFcfa = 1500.0,
                    rating = 4.9,
                    reviewsCount = 87,
                    isOrganic = true,
                    culinaryTip = "Délicieuses en jus frais pressé ou en salade exotique.",
                    description = "Variété Kent récoltée à maturité sur l'arbre pour une chair fondante et sucrée.",
                    imageUrl = "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_ananas",
                    name = "Ananas Pain de Sucre",
                    subtitle = "Douceur exceptionnelle, cœur tendre",
                    origin = "Plateau d'Allada",
                    category = BoutiqueCategory.FRUITS,
                    unitLabel = "1 pièce (~1,4 kg)",
                    priceFcfa = 1200.0,
                    rating = 4.9,
                    reviewsCount = 135,
                    isOrganic = true,
                    culinaryTip = "À associer au gingembre et à la menthe pour un jus tonique.",
                    description = "L'ananas emblématique du Bénin, célèbre pour sa chair blanche très sucrée et peu acide.",
                    imageUrl = "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_bissap",
                    name = "Fleurs d'Hibiscus (Bissap)",
                    subtitle = "Calices rouges entiers séchés au soleil",
                    origin = "Nord-Bénin",
                    category = BoutiqueCategory.SPICES,
                    unitLabel = "250 g",
                    priceFcfa = 1000.0,
                    rating = 4.9,
                    reviewsCount = 74,
                    isOrganic = true,
                    culinaryTip = "Infuser 15 min avec menthe fraîche et fleur d'oranger.",
                    description = "Fleurs d'hibiscus sabdariffa séchées naturellement, riches en antioxydants.",
                    imageUrl = "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_kankan",
                    name = "Poudre de Kankan (Yaji)",
                    subtitle = "Tourteau d'arachide torréfié aux épices",
                    origin = "Parakou",
                    category = BoutiqueCategory.SPICES,
                    unitLabel = "150 g",
                    priceFcfa = 1100.0,
                    rating = 4.8,
                    reviewsCount = 63,
                    culinaryTip = "Indispensable pour enrober les brochettes Tchatchanga Suya.",
                    description = "Mélange artisanal d'arachide grillée, gingembre, clou de girofle et piment doux.",
                    imageUrl = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_gingembre",
                    name = "Gingembre Frais Fermier",
                    subtitle = "Rhizomes charnus et très aromatiques",
                    origin = "Bénin",
                    category = BoutiqueCategory.SPICES,
                    unitLabel = "400 g",
                    priceFcfa = 700.0,
                    rating = 4.8,
                    reviewsCount = 49,
                    isOrganic = true,
                    culinaryTip = "Mixer avec ail frais pour la marinade de vos volailles et poissons.",
                    description = "Gingembre jeune récolté localement, idéal en cuisine comme en infusion Gnamakoudji.",
                    imageUrl = "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_afitin",
                    name = "Afitin / Soumbala Artisanal",
                    subtitle = "Graines de néré fermentées traditionnelles",
                    origin = "Abomey",
                    category = BoutiqueCategory.SPICES,
                    unitLabel = "200 g",
                    priceFcfa = 900.0,
                    rating = 4.9,
                    reviewsCount = 58,
                    isOrganic = true,
                    culinaryTip = "Apporte une profondeur umami authentique aux sauces légumes et gombo.",
                    description = "Condiment fermenté naturel préparé selon le savoir-faire traditionnel béninois.",
                    imageUrl = "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_farine_mais",
                    name = "Farine de Maïs Fine (Amiwô)",
                    subtitle = "Mouture extra-fine tamisée pour pâtes",
                    origin = "Zou",
                    category = BoutiqueCategory.GRAINS,
                    unitLabel = "1 kg",
                    priceFcfa = 1200.0,
                    rating = 4.8,
                    reviewsCount = 81,
                    culinaryTip = "Verser en pluie fine dans le bouillon frémissant pour une pâte sans grumeaux.",
                    description = "Farine de maïs blanc sélectionnée et moulue finement pour Amiwô et Wô.",
                    imageUrl = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_gari",
                    name = "Gari Fin Blanc du Bénin",
                    subtitle = "Semoule de manioc torréfiée croquante",
                    origin = "Savalou",
                    category = BoutiqueCategory.GRAINS,
                    unitLabel = "1 kg",
                    priceFcfa = 1100.0,
                    rating = 4.9,
                    reviewsCount = 104,
                    culinaryTip = "Parfait en accompagnement du Haricot (Abobo) ou délayé bien frais.",
                    description = "Gari artisanal de Savalou, grain fin et léger, torréfié au feu de bois.",
                    imageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_zomi",
                    name = "Huile de Palme Rouge Zomi",
                    subtitle = "Première pression artisanale non raffinée",
                    origin = "Pobè",
                    category = BoutiqueCategory.OILS,
                    unitLabel = "75 cl",
                    priceFcfa = 1950.0,
                    rating = 4.9,
                    reviewsCount = 92,
                    isOrganic = true,
                    culinaryTip = "Sublime le Dékoun, l'Atassi et les sauces traditionnelles.",
                    description = "Huile rouge parfumée issue de noix de palme fraîches, riche en bêta-carotène.",
                    imageUrl = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_poisson_fume",
                    name = "Poisson Fumé Kpanman",
                    subtitle = "Fumage traditionnel au bois aromatique",
                    origin = "Lac Nokoué",
                    category = BoutiqueCategory.PROTEINS,
                    unitLabel = "400 g",
                    priceFcfa = 2800.0,
                    rating = 4.8,
                    reviewsCount = 67,
                    culinaryTip = "Effeuiller et ajouter en fin de cuisson dans votre sauce graine ou légume.",
                    description = "Poisson d'eau douce fumé lentement pour une saveur boisée incomparable.",
                    imageUrl = "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80"
                ),
                BoutiqueProduct(
                    id = "bout_crevettes",
                    name = "Crevettes Séchées Entières",
                    subtitle = "Séchage naturel, calibre supérieur",
                    origin = "Ouidah",
                    category = BoutiqueCategory.PROTEINS,
                    unitLabel = "200 g",
                    priceFcfa = 2400.0,
                    rating = 4.9,
                    reviewsCount = 76,
                    culinaryTip = "Moudre une poignée pour relever instantanément vos bouillons et sauces.",
                    description = "Crevettes de lagune séchées au soleil, idéales entières ou en poudre.",
                    imageUrl = "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80"
                )
            )
        )
    }
}
