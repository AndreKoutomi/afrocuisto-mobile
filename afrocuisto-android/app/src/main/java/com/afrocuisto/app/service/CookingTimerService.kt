package com.afrocuisto.app.service

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.PowerManager
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.ServiceCompat
import com.afrocuisto.app.MainActivity
import com.afrocuisto.app.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Locale
import kotlin.math.ceil

data class TimerState(
    val isRunning: Boolean = false,
    val isCompleted: Boolean = false,
    val recipeId: String = "",
    val recipeName: String = "",
    val stepTitle: String = "",
    val totalSeconds: Int = 0,
    val remainingSeconds: Int = 0,
    val targetEndWallMillis: Long = 0L,
    val targetEndElapsedMillis: Long = 0L
) {
    val isActive: Boolean
        get() = isRunning || remainingSeconds > 0 || isCompleted

    val progressFraction: Float
        get() {
            if (totalSeconds <= 0) return 0f
            return (remainingSeconds.toFloat() / totalSeconds.toFloat()).coerceIn(0f, 1f)
        }

    val formattedTime: String
        get() {
            val clamped = remainingSeconds.coerceAtLeast(0)
            val h = clamped / 3600
            val m = (clamped % 3600) / 60
            val s = clamped % 60
            return if (h > 0) {
                String.format(Locale.US, "%d:%02d:%02d", h, m, s)
            } else {
                String.format(Locale.US, "%02d:%02d", m, s)
            }
        }
}

class CookingTimerService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var tickerJob: Job? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        ensureChannels()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        ensureChannels()

        if (intent == null) {
            // Process restarted by START_STICKY while app was closed: restore persisted timer
            restoreFromPrefsAndResumeIfNeeded()
            return START_STICKY
        }

        when (intent.action) {
            ACTION_START -> {
                val recipeId = intent.getStringExtra(EXTRA_RECIPE_ID).orEmpty()
                val recipeName = intent.getStringExtra(EXTRA_RECIPE_NAME) ?: "Recette AfroCuisto"
                val stepTitle = intent.getStringExtra(EXTRA_STEP_TITLE) ?: "Cuisson en cours"
                val seconds = intent.getIntExtra(EXTRA_SECONDS, 600).coerceAtLeast(5)
                handleStart(recipeId, recipeName, stepTitle, seconds)
            }
            ACTION_PAUSE -> handlePause()
            ACTION_RESUME -> handleResume()
            ACTION_ADD_MINUTE -> {
                val delta = intent.getIntExtra(EXTRA_DELTA_SECONDS, 60)
                handleAddSeconds(delta)
            }
            ACTION_REFRESH -> handleRefreshNotification()
            ACTION_EXPIRED_ALARM -> handleAlarmExpiredCheck()
            ACTION_STOP -> handleStop()
        }

        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Keep foreground service, Status Bar Chronometer chip & Notification card alive when app is swiped away
        val state = _timerState.value
        if (state.isActive) {
            persistState(state)
            if (state.isRunning && state.remainingSeconds > 0) {
                scheduleCompletionAlarm(state.targetEndElapsedMillis)
                postForegroundOrNotify(state)
            }
        }
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        tickerJob?.cancel()
        releaseWakeLock()
        serviceScope.cancel()
        super.onDestroy()
    }

    private fun handleStart(recipeId: String, recipeName: String, stepTitle: String, seconds: Int) {
        cancelCompletionAlarm()
        val nowWall = System.currentTimeMillis()
        val nowElapsed = SystemClock.elapsedRealtime()
        val durationMs = seconds * 1000L

        val newState = TimerState(
            isRunning = true,
            isCompleted = false,
            recipeId = recipeId,
            recipeName = recipeName,
            stepTitle = stepTitle,
            totalSeconds = seconds,
            remainingSeconds = seconds,
            targetEndWallMillis = nowWall + durationMs,
            targetEndElapsedMillis = nowElapsed + durationMs
        )
        _timerState.value = newState
        persistState(newState)
        acquireWakeLock(durationMs + 15_000L)
        scheduleCompletionAlarm(newState.targetEndElapsedMillis)

        // Cancel any previous completion alert
        getNotificationManager().cancel(COMPLETED_NOTIFICATION_ID)
        postForegroundOrNotify(newState)
        startMonotonicTicker()
    }

    private fun handlePause() {
        val current = _timerState.value
        if (!current.isRunning) return

        tickerJob?.cancel()
        cancelCompletionAlarm()
        releaseWakeLock()

        val exactRemaining = computeRemainingSeconds(current.targetEndElapsedMillis)
        val pausedState = current.copy(
            isRunning = false,
            isCompleted = false,
            remainingSeconds = exactRemaining,
            targetEndWallMillis = 0L,
            targetEndElapsedMillis = 0L
        )
        _timerState.value = pausedState
        persistState(pausedState)
        postForegroundOrNotify(pausedState)
    }

    private fun handleResume() {
        val current = _timerState.value
        if (current.isRunning || current.remainingSeconds <= 0) return

        val nowWall = System.currentTimeMillis()
        val nowElapsed = SystemClock.elapsedRealtime()
        val durationMs = current.remainingSeconds * 1000L

        val resumedState = current.copy(
            isRunning = true,
            isCompleted = false,
            targetEndWallMillis = nowWall + durationMs,
            targetEndElapsedMillis = nowElapsed + durationMs
        )
        _timerState.value = resumedState
        persistState(resumedState)
        acquireWakeLock(durationMs + 15_000L)
        scheduleCompletionAlarm(resumedState.targetEndElapsedMillis)
        postForegroundOrNotify(resumedState)
        startMonotonicTicker()
    }

    private fun handleAddSeconds(deltaSeconds: Int) {
        val current = _timerState.value
        if (!current.isActive) return

        if (current.isCompleted || current.remainingSeconds <= 0) {
            // Restart 1-minute extra cooking from completed state
            val extra = deltaSeconds.coerceAtLeast(60)
            handleStart(
                recipeId = current.recipeId,
                recipeName = current.recipeName,
                stepTitle = current.stepTitle,
                seconds = extra
            )
            return
        }

        val newRemaining = (current.remainingSeconds + deltaSeconds).coerceAtLeast(5)
        val newTotal = maxOf(current.totalSeconds + deltaSeconds, newRemaining)

        if (current.isRunning) {
            val nowWall = System.currentTimeMillis()
            val nowElapsed = SystemClock.elapsedRealtime()
            val durationMs = newRemaining * 1000L
            val updated = current.copy(
                totalSeconds = newTotal,
                remainingSeconds = newRemaining,
                targetEndWallMillis = nowWall + durationMs,
                targetEndElapsedMillis = nowElapsed + durationMs
            )
            _timerState.value = updated
            persistState(updated)
            acquireWakeLock(durationMs + 15_000L)
            scheduleCompletionAlarm(updated.targetEndElapsedMillis)
            postForegroundOrNotify(updated)
            startMonotonicTicker()
        } else {
            val updated = current.copy(
                totalSeconds = newTotal,
                remainingSeconds = newRemaining
            )
            _timerState.value = updated
            persistState(updated)
            postForegroundOrNotify(updated)
        }
    }

    private fun handleRefreshNotification() {
        val current = _timerState.value
        if (current.isActive) {
            postForegroundOrNotify(current)
        }
    }

    private fun handleAlarmExpiredCheck() {
        val current = _timerState.value
        if (current.isRunning) {
            val rem = computeRemainingSeconds(current.targetEndElapsedMillis)
            if (rem <= 0) {
                completeTimer(current)
            }
        } else {
            restoreFromPrefsAndResumeIfNeeded()
        }
    }

    private fun handleStop() {
        tickerJob?.cancel()
        cancelCompletionAlarm()
        releaseWakeLock()
        clearPersistedState()
        _timerState.value = TimerState()
        getNotificationManager().cancel(LIVE_NOTIFICATION_ID)
        getNotificationManager().cancel(COMPLETED_NOTIFICATION_ID)
        runCatching { stopForeground(STOP_FOREGROUND_REMOVE) }
        stopSelf()
    }

    private fun startMonotonicTicker() {
        tickerJob?.cancel()
        tickerJob = serviceScope.launch {
            var lastProgressSyncSec = _timerState.value.remainingSeconds
            while (true) {
                val state = _timerState.value
                if (!state.isRunning) break

                val rem = computeRemainingSeconds(state.targetEndElapsedMillis)
                if (rem != state.remainingSeconds) {
                    val next = state.copy(remainingSeconds = rem)
                    _timerState.value = next

                    if (rem <= 0) {
                        completeTimer(next)
                        break
                    }

                    // Native Status Bar Chronometer ticks every second autonomously via setWhen();
                    // sync the notification ProgressStyle bar smoothly every 5 seconds without rate-limit churn.
                    if (lastProgressSyncSec - rem >= 5) {
                        lastProgressSyncSec = rem
                        runCatching {
                            getNotificationManager().notify(
                                LIVE_NOTIFICATION_ID,
                                buildLiveTimerNotification(next)
                            )
                        }
                    }
                }
                delay(250L)
            }
        }
    }

    private fun completeTimer(state: TimerState) {
        tickerJob?.cancel()
        cancelCompletionAlarm()
        releaseWakeLock()

        val completed = state.copy(
            isRunning = false,
            isCompleted = true,
            remainingSeconds = 0,
            targetEndWallMillis = 0L,
            targetEndElapsedMillis = 0L
        )
        _timerState.value = completed
        persistState(completed)

        triggerCompletionVibration()

        runCatching {
            stopForeground(STOP_FOREGROUND_REMOVE)
            getNotificationManager().cancel(LIVE_NOTIFICATION_ID)
            getNotificationManager().notify(
                COMPLETED_NOTIFICATION_ID,
                buildCompletedNotification(completed)
            )
        }
    }

    private fun restoreFromPrefsAndResumeIfNeeded() {
        val restored = readPersistedState(this)
        if (!restored.isActive) {
            stopSelf()
            return
        }
        _timerState.value = restored
        if (restored.isRunning) {
            val rem = computeRemainingSeconds(restored.targetEndElapsedMillis)
            if (rem <= 0) {
                completeTimer(restored)
            } else {
                val synced = restored.copy(remainingSeconds = rem)
                _timerState.value = synced
                acquireWakeLock(rem * 1000L + 15_000L)
                postForegroundOrNotify(synced)
                startMonotonicTicker()
            }
        } else if (!restored.isCompleted && restored.remainingSeconds > 0) {
            postForegroundOrNotify(restored)
        }
    }

    private fun computeRemainingSeconds(targetEndElapsedMillis: Long): Int {
        val diffMs = targetEndElapsedMillis - SystemClock.elapsedRealtime()
        if (diffMs <= 0L) return 0
        return ceil(diffMs / 1000.0).toInt()
    }

    private fun postForegroundOrNotify(state: TimerState) {
        val notification = buildLiveTimerNotification(state)
        if (Build.VERSION.SDK_INT >= 36) {
            Log.d(
                TAG,
                "Posting Live Update timer: running=${state.isRunning}, rem=${state.remainingSeconds}s, " +
                    "promotable=${notification.hasPromotableCharacteristics()}"
            )
        }
        runCatching {
            val fgType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            } else {
                0
            }
            ServiceCompat.startForeground(this, LIVE_NOTIFICATION_ID, notification, fgType)
        }.onFailure {
            runCatching { getNotificationManager().notify(LIVE_NOTIFICATION_ID, notification) }
        }
    }

    /**
     * Builds an Android 16 / 17 Live Update Promoted Ongoing Notification:
     * - Displays a native live countdown Chronometer chip directly in the Android Status Bar
     *   (like the native Android 17 Clock app) via setUsesChronometer(true) + setChronometerCountDown(true) + setWhen()
     * - Renders a dynamic ProgressStyle card in the notification shade & lock screen with Pause/Resume, +1 min & Stop actions
     */
    private fun buildLiveTimerNotification(state: TimerState): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_RECIPE_ID, state.recipeId)
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this,
            100,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val toggleIntent = Intent(this, CookingTimerService::class.java).apply {
            action = if (state.isRunning) ACTION_PAUSE else ACTION_RESUME
        }
        val togglePendingIntent = PendingIntent.getService(
            this,
            101,
            toggleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val addMinIntent = Intent(this, CookingTimerService::class.java).apply {
            action = ACTION_ADD_MINUTE
            putExtra(EXTRA_DELTA_SECONDS, 60)
        }
        val addMinPendingIntent = PendingIntent.getService(
            this,
            102,
            addMinIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, CookingTimerService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            103,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = state.recipeName.ifBlank { "Minuteur AfroCuisto" }
        val subtitle = if (state.isRunning) {
            state.stepTitle.ifBlank { "Cuisson en cours" }
        } else {
            "En pause (${state.formattedTime}) • ${state.stepTitle.ifBlank { "Cuisson" }}"
        }

        val builder = Notification.Builder(this, CHANNEL_LIVE_ID)
            .setSmallIcon(R.drawable.ic_status_stopwatch)
            .setContentTitle(title)
            .setContentText(subtitle)
            .setContentIntent(contentPendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setAutoCancel(false)
            .setCategory(Notification.CATEGORY_STOPWATCH)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setColor(AFRO_ORANGE_ARGB)
            .setColorized(false) // Required for Android 16/17 Live Update promotion

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)
        }

        // Native Status Bar Chronometer configuration
        if (state.isRunning && state.targetEndWallMillis > System.currentTimeMillis()) {
            builder
                .setWhen(state.targetEndWallMillis)
                .setShowWhen(true)
                .setUsesChronometer(true)
                .setChronometerCountDown(true)
        } else {
            builder
                .setShowWhen(false)
                .setUsesChronometer(false)
            if (Build.VERSION.SDK_INT >= 36) {
                builder.setShortCriticalText(state.formattedTime)
            }
        }

        // Android 16 / 17 Live Updates: ProgressStyle + requestPromotedOngoing
        val total = state.totalSeconds.coerceAtLeast(1)
        val elapsed = (total - state.remainingSeconds).coerceIn(0, total)
        if (Build.VERSION.SDK_INT >= 36) {
            val progressStyle = Notification.ProgressStyle()
                .setStyledByProgress(false)
                .addProgressSegment(
                    Notification.ProgressStyle.Segment(total)
                        .setColor(AFRO_ORANGE_ARGB)
                )
                .setProgress(elapsed)
            builder.setStyle(progressStyle)
        } else {
            builder.setProgress(total, elapsed, false)
        }

        // Request Android 16/17 Live Update status bar chip & top drawer promotion
        val promotionExtras = Bundle().apply {
            putBoolean(EXTRA_REQUEST_PROMOTED_ONGOING, true)
        }
        builder.addExtras(promotionExtras)
        runCatching {
            builder.javaClass
                .getMethod("setRequestPromotedOngoing", Boolean::class.javaPrimitiveType)
                .invoke(builder, true)
        }

        // Interactive Actions on the Dynamic Notification Card
        builder.addAction(
            Notification.Action.Builder(
                null,
                if (state.isRunning) "Pause" else "Reprendre",
                togglePendingIntent
            ).build()
        )
        builder.addAction(
            Notification.Action.Builder(
                null,
                "+1 min",
                addMinPendingIntent
            ).build()
        )
        builder.addAction(
            Notification.Action.Builder(
                null,
                "Arrêter",
                stopPendingIntent
            ).build()
        )

        return builder.build()
    }

    private fun buildCompletedNotification(state: TimerState): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_RECIPE_ID, state.recipeId)
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this,
            200,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val addMinIntent = Intent(this, CookingTimerService::class.java).apply {
            action = ACTION_ADD_MINUTE
            putExtra(EXTRA_DELTA_SECONDS, 60)
        }
        val addMinPendingIntent = PendingIntent.getService(
            this,
            201,
            addMinIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val dismissIntent = Intent(this, CookingTimerService::class.java).apply {
            action = ACTION_STOP
        }
        val dismissPendingIntent = PendingIntent.getService(
            this,
            202,
            dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return Notification.Builder(this, CHANNEL_ALARM_ID)
            .setSmallIcon(R.drawable.ic_status_stopwatch)
            .setContentTitle("Cuisson terminée • ${state.recipeName}")
            .setContentText("${state.stepTitle} — Votre plat est prêt à être servi.")
            .setContentIntent(contentPendingIntent)
            .setDeleteIntent(dismissPendingIntent)
            .setAutoCancel(true)
            .setCategory(Notification.CATEGORY_ALARM)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setColor(AFRO_ORANGE_ARGB)
            .addAction(Notification.Action.Builder(null, "+1 min", addMinPendingIntent).build())
            .addAction(Notification.Action.Builder(null, "Terminer", dismissPendingIntent).build())
            .build()
    }

    private fun ensureChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getNotificationManager()

            val liveChannel = NotificationChannel(
                CHANNEL_LIVE_ID,
                "Minuteur en direct (Barre de statut)",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Affiche le compte à rebours en direct dans la barre de statut et le panneau de notifications"
                setSound(null, null)
                enableVibration(false)
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            val alarmChannel = NotificationChannel(
                CHANNEL_ALARM_ID,
                "Alerte de fin de cuisson",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alerte sonore et vibration lorsque le minuteur de cuisine atteint zéro"
                enableVibration(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            manager.createNotificationChannel(liveChannel)
            manager.createNotificationChannel(alarmChannel)
        }
    }

    private fun scheduleCompletionAlarm(targetEndElapsedMillis: Long) {
        runCatching {
            val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val expiredIntent = Intent(this, CookingTimerService::class.java).apply {
                action = ACTION_EXPIRED_ALARM
            }
            val pending = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                PendingIntent.getForegroundService(
                    this,
                    301,
                    expiredIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            } else {
                PendingIntent.getService(
                    this,
                    301,
                    expiredIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            }
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                targetEndElapsedMillis,
                pending
            )
        }
    }

    private fun cancelCompletionAlarm() {
        runCatching {
            val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val expiredIntent = Intent(this, CookingTimerService::class.java).apply {
                action = ACTION_EXPIRED_ALARM
            }
            val pending = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                PendingIntent.getForegroundService(
                    this,
                    301,
                    expiredIntent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
            } else {
                PendingIntent.getService(
                    this,
                    301,
                    expiredIntent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
            }
            if (pending != null) {
                alarmManager.cancel(pending)
            }
        }
    }

    private fun acquireWakeLock(timeoutMs: Long) {
        runCatching {
            releaseWakeLock()
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AfroCuisto::CookingTimerWakeLock").apply {
                setReferenceCounted(false)
                acquire(timeoutMs.coerceAtMost(4 * 3600 * 1000L))
            }
        }
    }

    private fun releaseWakeLock() {
        runCatching {
            wakeLock?.let {
                if (it.isHeld) it.release()
            }
            wakeLock = null
        }
    }

    private fun triggerCompletionVibration() {
        if (!com.afrocuisto.app.data.repository.UserPreferencesRepository.isTimerVibrationEnabled(this)) {
            return
        }
        runCatching {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vm.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
            vibrator.vibrate(
                VibrationEffect.createWaveform(longArrayOf(0, 350, 180, 350, 180, 500), -1)
            )
        }
    }

    private fun getNotificationManager(): NotificationManager =
        getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    private fun persistState(state: TimerState) {
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
            .putBoolean(KEY_IS_RUNNING, state.isRunning)
            .putBoolean(KEY_IS_COMPLETED, state.isCompleted)
            .putString(KEY_RECIPE_ID, state.recipeId)
            .putString(KEY_RECIPE_NAME, state.recipeName)
            .putString(KEY_STEP_TITLE, state.stepTitle)
            .putInt(KEY_TOTAL_SECONDS, state.totalSeconds)
            .putInt(KEY_REMAINING_SECONDS, state.remainingSeconds)
            .putLong(KEY_END_WALL_MS, state.targetEndWallMillis)
            .putLong(KEY_END_ELAPSED_MS, state.targetEndElapsedMillis)
            .apply()
    }

    private fun clearPersistedState() {
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().clear().apply()
    }

    companion object {
        private const val TAG = "CookingTimerService"
        private const val AFRO_ORANGE_ARGB = 0xFFFB5607.toInt()
        private const val EXTRA_REQUEST_PROMOTED_ONGOING = "android.requestPromotedOngoing"

        const val CHANNEL_LIVE_ID = "afrocuisto_live_timer_v2"
        const val CHANNEL_ALARM_ID = "afrocuisto_timer_alarm_v2"
        const val LIVE_NOTIFICATION_ID = 1001
        const val COMPLETED_NOTIFICATION_ID = 1002

        const val ACTION_START = "com.afrocuisto.app.timer.START"
        const val ACTION_PAUSE = "com.afrocuisto.app.timer.PAUSE"
        const val ACTION_RESUME = "com.afrocuisto.app.timer.RESUME"
        const val ACTION_ADD_MINUTE = "com.afrocuisto.app.timer.ADD_MINUTE"
        const val ACTION_REFRESH = "com.afrocuisto.app.timer.REFRESH"
        const val ACTION_EXPIRED_ALARM = "com.afrocuisto.app.timer.EXPIRED_ALARM"
        const val ACTION_STOP = "com.afrocuisto.app.timer.STOP"

        const val EXTRA_RECIPE_ID = "extra_recipe_id"
        const val EXTRA_RECIPE_NAME = "extra_recipe_name"
        const val EXTRA_STEP_TITLE = "extra_step_title"
        const val EXTRA_SECONDS = "extra_seconds"
        const val EXTRA_DELTA_SECONDS = "extra_delta_seconds"

        private const val PREFS_NAME = "afrocuisto_cooking_timer_prefs"
        private const val KEY_IS_RUNNING = "is_running"
        private const val KEY_IS_COMPLETED = "is_completed"
        private const val KEY_RECIPE_ID = "recipe_id"
        private const val KEY_RECIPE_NAME = "recipe_name"
        private const val KEY_STEP_TITLE = "step_title"
        private const val KEY_TOTAL_SECONDS = "total_seconds"
        private const val KEY_REMAINING_SECONDS = "remaining_seconds"
        private const val KEY_END_WALL_MS = "end_wall_ms"
        private const val KEY_END_ELAPSED_MS = "end_elapsed_ms"

        private val _timerState = MutableStateFlow(TimerState())
        val timerState: StateFlow<TimerState> = _timerState.asStateFlow()

        /**
         * Restores persisted timer state into memory when the Activity starts up after app closure.
         */
        fun ensureHydrated(context: Context) {
            if (_timerState.value.isActive) return
            val restored = readPersistedState(context)
            if (!restored.isActive) return
            if (restored.isRunning) {
                val nowWall = System.currentTimeMillis()
                val diffWallSec = ceil((restored.targetEndWallMillis - nowWall) / 1000.0).toInt()
                if (diffWallSec <= 0) {
                    _timerState.value = restored.copy(isRunning = false, isCompleted = true, remainingSeconds = 0)
                } else {
                    val nowElapsed = SystemClock.elapsedRealtime()
                    val synced = restored.copy(
                        remainingSeconds = diffWallSec,
                        targetEndElapsedMillis = nowElapsed + diffWallSec * 1000L
                    )
                    _timerState.value = synced
                    refreshNotification(context)
                }
            } else {
                _timerState.value = restored
            }
        }

        private fun readPersistedState(context: Context): TimerState {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val total = prefs.getInt(KEY_TOTAL_SECONDS, 0)
            if (total <= 0) return TimerState()
            val isRunning = prefs.getBoolean(KEY_IS_RUNNING, false)
            val isCompleted = prefs.getBoolean(KEY_IS_COMPLETED, false)
            val endWall = prefs.getLong(KEY_END_WALL_MS, 0L)
            var endElapsed = prefs.getLong(KEY_END_ELAPSED_MS, 0L)
            var rem = prefs.getInt(KEY_REMAINING_SECONDS, 0)

            if (isRunning && endWall > 0L) {
                val wallDiffMs = endWall - System.currentTimeMillis()
                rem = if (wallDiffMs > 0L) ceil(wallDiffMs / 1000.0).toInt() else 0
                endElapsed = SystemClock.elapsedRealtime() + wallDiffMs.coerceAtLeast(0L)
            }

            return TimerState(
                isRunning = isRunning && rem > 0,
                isCompleted = isCompleted || (isRunning && rem <= 0),
                recipeId = prefs.getString(KEY_RECIPE_ID, "").orEmpty(),
                recipeName = prefs.getString(KEY_RECIPE_NAME, "").orEmpty(),
                stepTitle = prefs.getString(KEY_STEP_TITLE, "").orEmpty(),
                totalSeconds = total,
                remainingSeconds = rem.coerceAtLeast(0),
                targetEndWallMillis = endWall,
                targetEndElapsedMillis = endElapsed
            )
        }

        fun start(
            context: Context,
            recipeName: String,
            stepTitle: String,
            seconds: Int,
            recipeId: String = ""
        ) {
            val intent = Intent(context, CookingTimerService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_RECIPE_ID, recipeId)
                putExtra(EXTRA_RECIPE_NAME, recipeName)
                putExtra(EXTRA_STEP_TITLE, stepTitle)
                putExtra(EXTRA_SECONDS, seconds)
            }
            runCatching {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            }
        }

        fun pause(context: Context) {
            val intent = Intent(context, CookingTimerService::class.java).apply {
                action = ACTION_PAUSE
            }
            runCatching { context.startService(intent) }
        }

        fun resume(context: Context) {
            val intent = Intent(context, CookingTimerService::class.java).apply {
                action = ACTION_RESUME
            }
            runCatching {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            }
        }

        fun addSeconds(context: Context, deltaSeconds: Int = 60) {
            val intent = Intent(context, CookingTimerService::class.java).apply {
                action = ACTION_ADD_MINUTE
                putExtra(EXTRA_DELTA_SECONDS, deltaSeconds)
            }
            runCatching {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            }
        }

        fun refreshNotification(context: Context) {
            val intent = Intent(context, CookingTimerService::class.java).apply {
                action = ACTION_REFRESH
            }
            runCatching { context.startService(intent) }
        }

        fun stop(context: Context) {
            val intent = Intent(context, CookingTimerService::class.java).apply {
                action = ACTION_STOP
            }
            runCatching { context.startService(intent) }
        }
    }
}
