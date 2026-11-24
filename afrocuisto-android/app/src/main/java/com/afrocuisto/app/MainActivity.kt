package com.afrocuisto.app

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.hardware.display.DisplayManager
import android.os.Build
import android.os.Bundle
import android.view.Display
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
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
import com.afrocuisto.app.data.repository.UserPreferencesRepository
import com.afrocuisto.app.data.repository.UserPreferencesState
import com.afrocuisto.app.service.CookingTimerService
import com.afrocuisto.app.ui.navigation.NavGraph
import com.afrocuisto.app.ui.theme.AfrocuistoTheme

class MainActivity : ComponentActivity() {

    private var deepLinkRecipeId by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        CookingTimerService.ensureHydrated(this)
        deepLinkRecipeId = intent?.getStringExtra(CookingTimerService.EXTRA_RECIPE_ID)
            ?.takeIf { it.isNotBlank() }

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

            DisposableEffect(useDarkTheme) {
                enableEdgeToEdge(
                    statusBarStyle = if (useDarkTheme) {
                        SystemBarStyle.dark(Color.TRANSPARENT)
                    } else {
                        SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
                    },
                    navigationBarStyle = if (useDarkTheme) {
                        SystemBarStyle.dark(Color.TRANSPARENT)
                    } else {
                        SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
                    }
                )
                onDispose {}
            }

            AfrocuistoTheme(darkTheme = useDarkTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NavGraph(
                        userPreferencesRepository = userPreferencesRepository,
                        externalRecipeId = deepLinkRecipeId,
                        onExternalRecipeConsumed = { deepLinkRecipeId = null }
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
