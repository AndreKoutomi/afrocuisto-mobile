package com.afrocuisto.app

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.hardware.display.DisplayManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.Display
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.afrocuisto.app.data.repository.AppThemeMode
import com.afrocuisto.app.data.repository.AuthRepository
import com.afrocuisto.app.data.repository.UserPreferencesRepository
import com.afrocuisto.app.data.repository.UserPreferencesState
import com.afrocuisto.app.service.CookingTimerService
import com.afrocuisto.app.ui.navigation.NavGraph
import com.afrocuisto.app.ui.theme.AfrocuistoTheme

class MainActivity : ComponentActivity() {

    private var deepLinkRecipeId by mutableStateOf<String?>(null)
    private var oauthCallbackUri by mutableStateOf<Uri?>(null)

    private val startupPermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { _ ->
        // Results are persisted by the Android OS permission controller
    }

    private fun requestStartupPermissionsIfNeeded() {
        val prefs = getSharedPreferences("afrocuisto_startup_prefs", Context.MODE_PRIVATE)
        if (prefs.getBoolean("startup_permissions_requested", false)) return

        val required = buildList {
            add(Manifest.permission.RECORD_AUDIO)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        val missing = required.filter { perm ->
            ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED
        }

        prefs.edit().putBoolean("startup_permissions_requested", true).apply()
        if (missing.isNotEmpty()) {
            startupPermissionsLauncher.launch(missing.toTypedArray())
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        CookingTimerService.ensureHydrated(this)
        deepLinkRecipeId = intent?.getStringExtra(CookingTimerService.EXTRA_RECIPE_ID)
            ?.takeIf { it.isNotBlank() }
        if (AuthRepository.isOAuthCallbackUri(intent?.data)) {
            oauthCallbackUri = intent?.data
        }

        requestPeakRefreshRate()
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT)
        )
        setContent {
            val userPreferencesRepository = remember { UserPreferencesRepository(applicationContext) }
            val userPrefs by userPreferencesRepository.preferencesFlow.collectAsState(
                initial = UserPreferencesState()
            )
            val systemDark = isSystemInDarkTheme()
            val useDarkTheme = when (userPrefs.themeMode) {
                AppThemeMode.LIGHT -> false
                AppThemeMode.DARK -> true
                AppThemeMode.SYSTEM -> systemDark
            }
            var forceDarkSystemBars by remember { mutableStateOf(true) }
            val effectiveDarkSystemBars = useDarkTheme || forceDarkSystemBars

            DisposableEffect(effectiveDarkSystemBars) {
                enableEdgeToEdge(
                    statusBarStyle = if (effectiveDarkSystemBars) {
                        SystemBarStyle.dark(Color.TRANSPARENT)
                    } else {
                        SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
                    },
                    navigationBarStyle = if (effectiveDarkSystemBars) {
                        SystemBarStyle.dark(Color.TRANSPARENT)
                    } else {
                        SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
                    }
                )
                onDispose {}
            }

            AfrocuistoTheme(
                darkTheme = useDarkTheme,
                forceDarkSystemBars = forceDarkSystemBars
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NavGraph(
                        userPreferencesRepository = userPreferencesRepository,
                        externalRecipeId = deepLinkRecipeId,
                        onExternalRecipeConsumed = { deepLinkRecipeId = null },
                        externalOAuthUri = oauthCallbackUri,
                        onExternalOAuthConsumed = { oauthCallbackUri = null },
                        onForceDarkSystemBarsChange = { forceDarkSystemBars = it },
                        onReadyForPermissions = { requestStartupPermissionsIfNeeded() }
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val targetId = intent.getStringExtra(CookingTimerService.EXTRA_RECIPE_ID)
            ?.takeIf { it.isNotBlank() }
        if (targetId != null) {
            deepLinkRecipeId = targetId
        }
        if (AuthRepository.isOAuthCallbackUri(intent.data)) {
            oauthCallbackUri = intent.data
        }
    }

    private fun requestPeakRefreshRate() {
        val displayManager = getSystemService(Context.DISPLAY_SERVICE) as? DisplayManager ?: return
        val display = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            this.display ?: displayManager.getDisplay(Display.DEFAULT_DISPLAY)
        } else {
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay
        } ?: return

        val bestMode = display.supportedModes.maxByOrNull { it.refreshRate } ?: return
        val params = window.attributes
        params.preferredDisplayModeId = bestMode.modeId
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            params.preferredRefreshRate = bestMode.refreshRate
        }
        window.attributes = params
    }
}
