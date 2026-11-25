package com.afrocuisto.app.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.afrocuisto.app.data.model.BoutiqueOrder
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

@Serializable
enum class AppNotificationType {
    NEW_RECIPE,
    ORDER_CREATED,
    ORDER_DELIVERED,
    GENERAL
}

@Serializable
data class AppNotification(
    val id: String,
    val title: String,
    val body: String,
    val type: AppNotificationType,
    val recipeId: String? = null,
    val actionRoute: String? = null,
    val createdAtMillis: Long = System.currentTimeMillis(),
    val isRead: Boolean = false
)

object AppNotificationCenter {

    private const val PREFS_NAME = "afrocuisto_notifications_prefs"
    private const val KEY_LOCAL_NOTIFS = "local_notifs_json"
    private const val KEY_READ_IDS = "read_ids"
    private const val KEY_DISMISSED_IDS = "dismissed_ids"

    private val json = Json { ignoreUnknownKeys = true }
    private var prefs: SharedPreferences? = null

    private val localNotifications = MutableStateFlow<List<AppNotification>>(emptyList())
    private val remoteNotifications = MutableStateFlow<List<AppNotification>>(emptyList())
    private val readIds = MutableStateFlow<Set<String>>(emptySet())
    private val dismissedIds = MutableStateFlow<Set<String>>(emptySet())

    private val _notifications = MutableStateFlow<List<AppNotification>>(emptyList())
    val notifications: StateFlow<List<AppNotification>> = _notifications.asStateFlow()

    fun init(context: Context) {
        if (prefs != null) return
        val sp = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs = sp
        sp.getString(KEY_LOCAL_NOTIFS, null)?.let { raw ->
            runCatching { json.decodeFromString<List<AppNotification>>(raw) }
                .getOrNull()
                ?.let { localNotifications.value = it }
        }
        sp.getStringSet(KEY_READ_IDS, null)?.let { readIds.value = it.toSet() }
        sp.getStringSet(KEY_DISMISSED_IDS, null)?.let { dismissedIds.value = it.toSet() }
        rebuild()
    }

    fun syncRemoteNotifications(items: List<AppNotificationItem>) {
        val mapped = items.map { item ->
            val route = item.actionRoute?.trim().orEmpty()
            val recipeId = when {
                route.startsWith("recipe:") -> route.removePrefix("recipe:").trim().ifBlank { null }
                else -> null
            }
            val type = when {
                recipeId != null || route == "recipes" || item.title.contains("recette", ignoreCase = true) ->
                    AppNotificationType.NEW_RECIPE
                else -> AppNotificationType.GENERAL
            }
            AppNotification(
                id = "remote_${item.id}",
                title = item.title,
                body = item.body,
                type = type,
                recipeId = recipeId,
                actionRoute = item.actionRoute,
                createdAtMillis = parseIsoMillis(item.createdAt),
                isRead = readIds.value.contains("remote_${item.id}")
            )
        }
        remoteNotifications.value = mapped
        rebuild()
    }

    fun addOrderCreatedNotification(order: BoutiqueOrder) {
        val count = order.items.sumOf { it.quantity }
        val notif = AppNotification(
            id = "order_created_${order.id}_${System.currentTimeMillis()}",
            title = "Commande ${order.id} confirmée",
            body = "$count article${if (count > 1) "s" else ""} • ${order.deliverySlot} • ${order.address}",
            type = AppNotificationType.ORDER_CREATED,
            actionRoute = "market",
            createdAtMillis = System.currentTimeMillis(),
            isRead = false
        )
        localNotifications.value = listOf(notif) + localNotifications.value
        rebuild()
    }

    fun addOrderDeliveredNotification(order: BoutiqueOrder) {
        val count = order.items.sumOf { it.quantity }
        val notif = AppNotification(
            id = "order_delivered_${order.id}_${System.currentTimeMillis()}",
            title = "Commande ${order.id} livrée !",
            body = "Vos $count article${if (count > 1) "s" else ""} frais ont été livrés à « ${order.address} ». Bonne cuisine !",
            type = AppNotificationType.ORDER_DELIVERED,
            actionRoute = "market",
            createdAtMillis = System.currentTimeMillis(),
            isRead = false
        )
        localNotifications.value = listOf(notif) + localNotifications.value
        rebuild()
    }

    fun markAsRead(id: String) {
        readIds.value = readIds.value + id
        rebuild()
    }

    fun markAllAsRead() {
        readIds.value = readIds.value + _notifications.value.map { it.id }
        rebuild()
    }

    fun dismiss(id: String) {
        dismissedIds.value = dismissedIds.value + id
        localNotifications.value = localNotifications.value.filterNot { it.id == id }
        rebuild()
    }

    private fun rebuild() {
        val dismissed = dismissedIds.value
        val read = readIds.value
        val combined = (localNotifications.value + remoteNotifications.value)
            .filterNot { dismissed.contains(it.id) }
            .map { it.copy(isRead = read.contains(it.id)) }
            .sortedByDescending { it.createdAtMillis }
        _notifications.value = combined
        persistState()
    }

    private fun persistState() {
        val sp = prefs ?: return
        val encodedLocal = runCatching { json.encodeToString(localNotifications.value) }.getOrNull()
        sp.edit().apply {
            if (encodedLocal != null) putString(KEY_LOCAL_NOTIFS, encodedLocal)
            putStringSet(KEY_READ_IDS, readIds.value.toSet())
            putStringSet(KEY_DISMISSED_IDS, dismissedIds.value.toSet())
            apply()
        }
    }

    private fun parseIsoMillis(iso: String): Long {
        if (iso.isBlank()) return System.currentTimeMillis()
        return runCatching {
            val clean = iso.replace("Z", "+0000").replace(Regex("\\.\\d+"), "")
            val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            fmt.parse(clean)?.time ?: System.currentTimeMillis()
        }.getOrDefault(System.currentTimeMillis())
    }
}
