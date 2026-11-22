package com.afrocuisto.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.afrocuisto.app.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TimerState(
    val isRunning: Boolean = false,
    val recipeName: String = "",
    val stepTitle: String = "",
    val totalSeconds: Int = 0,
    val remainingSeconds: Int = 0
) {
    val formattedTime: String
        get() {
            val m = remainingSeconds / 60
            val s = remainingSeconds % 60
            return String.format("%02d:%02d", m, s)
        }
}

class CookingTimerService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + Job())
    private var timerJob: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val recipeName = intent.getStringExtra(EXTRA_RECIPE_NAME) ?: "Recette"
                val stepTitle = intent.getStringExtra(EXTRA_STEP_TITLE) ?: "Étape de cuisson"
                val seconds = intent.getIntExtra(EXTRA_SECONDS, 600)
                startTimer(recipeName, stepTitle, seconds)
            }
            ACTION_PAUSE -> pauseTimer()
            ACTION_RESUME -> resumeTimer()
            ACTION_STOP -> stopTimer()
        }
        return START_STICKY
    }

    private fun startTimer(recipeName: String, stepTitle: String, seconds: Int) {
        createNotificationChannel()

        _timerState.value = TimerState(
            isRunning = true,
            recipeName = recipeName,
            stepTitle = stepTitle,
            totalSeconds = seconds,
            remainingSeconds = seconds
        )

        startForeground(NOTIFICATION_ID, buildNotification(_timerState.value))

        timerJob?.cancel()
        timerJob = serviceScope.launch {
            while (_timerState.value.remainingSeconds > 0 && _timerState.value.isRunning) {
                delay(1000)
                val newRemaining = _timerState.value.remainingSeconds - 1
                _timerState.value = _timerState.value.copy(remainingSeconds = newRemaining)
                updateNotification(_timerState.value)
            }
            if (_timerState.value.remainingSeconds == 0) {
                _timerState.value = _timerState.value.copy(isRunning = false)
                updateNotification(_timerState.value, isCompleted = true)
            }
        }
    }

    private fun pauseTimer() {
        _timerState.value = _timerState.value.copy(isRunning = false)
        timerJob?.cancel()
        updateNotification(_timerState.value)
    }

    private fun resumeTimer() {
        if (_timerState.value.remainingSeconds > 0) {
            _timerState.value = _timerState.value.copy(isRunning = true)
            timerJob?.cancel()
            timerJob = serviceScope.launch {
                while (_timerState.value.remainingSeconds > 0 && _timerState.value.isRunning) {
                    delay(1000)
                    val newRemaining = _timerState.value.remainingSeconds - 1
                    _timerState.value = _timerState.value.copy(remainingSeconds = newRemaining)
                    updateNotification(_timerState.value)
                }
            }
        }
    }

    private fun stopTimer() {
        timerJob?.cancel()
        _timerState.value = TimerState()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Chronomètre de Cuisson AfroCuisto",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Pastille chronomètre interactive pour les étapes de recettes"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(state: TimerState, isCompleted: Boolean = false): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = if (isCompleted) {
            "🎉 Cuisson Terminée ! • ${state.recipeName}"
        } else {
            "⏱ ${state.formattedTime} • ${state.recipeName}"
        }

        val text = if (isCompleted) {
            "Votre plat est prêt à être dégusté."
        } else {
            state.stepTitle
        }

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pendingIntent)
            .setOngoing(state.isRunning)
            .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
            .setPriority(NotificationCompat.PRIORITY_HIGH)

        return builder.build()
    }

    private fun updateNotification(state: TimerState, isCompleted: Boolean = false) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(state, isCompleted))
    }

    companion object {
        const val CHANNEL_ID = "afrocuisto_timer_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START = "com.afrocuisto.app.timer.START"
        const val ACTION_PAUSE = "com.afrocuisto.app.timer.PAUSE"
        const val ACTION_RESUME = "com.afrocuisto.app.timer.RESUME"
        const val ACTION_STOP = "com.afrocuisto.app.timer.STOP"

        const val EXTRA_RECIPE_NAME = "extra_recipe_name"
        const val EXTRA_STEP_TITLE = "extra_step_title"
        const val EXTRA_SECONDS = "extra_seconds"

        private val _timerState = MutableStateFlow(TimerState())
        val timerState: StateFlow<TimerState> = _timerState.asStateFlow()

        fun start(context: Context, recipeName: String, stepTitle: String, seconds: Int) {
            val intent = Intent(context, CookingTimerService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_RECIPE_NAME, recipeName)
                putExtra(EXTRA_STEP_TITLE, stepTitle)
                putExtra(EXTRA_SECONDS, seconds)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, CookingTimerService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
