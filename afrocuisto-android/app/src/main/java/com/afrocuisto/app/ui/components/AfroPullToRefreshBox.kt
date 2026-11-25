package com.afrocuisto.app.ui.components

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.isAfroDarkTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Pull-to-refresh unifié AfroCuisto (Material3) avec retour haptique et indicateur brandé.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AfroPullToRefreshBox(
    onRefresh: suspend () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val isDark = isAfroDarkTheme()
    val colorScheme = MaterialTheme.colorScheme
    val haptics = rememberAfroHaptics()
    val coroutineScope = rememberCoroutineScope()
    val pullState = rememberPullToRefreshState()
    var isRefreshing by remember { mutableStateOf(false) }

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = {
            if (isRefreshing) return@PullToRefreshBox
            haptics.selectionTick()
            coroutineScope.launch {
                isRefreshing = true
                try {
                    onRefresh()
                    delay(320L)
                } finally {
                    isRefreshing = false
                }
            }
        },
        state = pullState,
        modifier = modifier,
        indicator = {
            PullToRefreshDefaults.Indicator(
                state = pullState,
                isRefreshing = isRefreshing,
                modifier = Modifier.align(Alignment.TopCenter),
                containerColor = if (isDark) colorScheme.surfaceVariant else Color.White,
                color = AfroOrange
            )
        }
    ) {
        content()
    }
}
