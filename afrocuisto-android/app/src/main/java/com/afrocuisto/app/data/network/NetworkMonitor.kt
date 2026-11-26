package com.afrocuisto.app.data.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Collections

/**
 * Single source of truth for device network connectivity across AfroCuisto.
 * Uses [ConnectivityManager.NetworkCallback] to track validated internet access in real time.
 */
object NetworkMonitor {

    private val _isOnline = MutableStateFlow(true)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    private val validatedNetworks: MutableSet<Network> =
        Collections.synchronizedSet(mutableSetOf())

    @Volatile
    private var initialized = false
    private var connectivityManager: ConnectivityManager? = null

    fun init(context: Context) {
        if (initialized) return
        synchronized(this) {
            if (initialized) return
            val cm = context.applicationContext
                .getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                ?: return
            connectivityManager = cm

            _isOnline.value = checkCurrentConnectivity(cm)

            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()

            runCatching {
                cm.registerNetworkCallback(request, object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) {
                        val caps = cm.getNetworkCapabilities(network)
                        if (isNetworkValidated(caps)) {
                            validatedNetworks.add(network)
                        }
                        updateState(cm)
                    }

                    override fun onCapabilitiesChanged(
                        network: Network,
                        networkCapabilities: NetworkCapabilities
                    ) {
                        if (isNetworkValidated(networkCapabilities)) {
                            validatedNetworks.add(network)
                        } else {
                            validatedNetworks.remove(network)
                        }
                        updateState(cm)
                    }

                    override fun onLost(network: Network) {
                        validatedNetworks.remove(network)
                        updateState(cm)
                    }

                    override fun onUnavailable() {
                        validatedNetworks.clear()
                        _isOnline.value = false
                    }
                })
            }

            initialized = true
        }
    }

    private fun updateState(cm: ConnectivityManager) {
        _isOnline.value = validatedNetworks.isNotEmpty() || checkCurrentConnectivity(cm)
    }

    private fun checkCurrentConnectivity(cm: ConnectivityManager): Boolean {
        val active = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(active) ?: return false
        return isNetworkValidated(caps)
    }

    private fun isNetworkValidated(caps: NetworkCapabilities?): Boolean {
        if (caps == null) return false
        val hasInternet = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        val isValidated = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        return hasInternet && isValidated
    }
}
