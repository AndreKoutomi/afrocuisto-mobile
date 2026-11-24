package com.afrocuisto.app.ui.components

import androidx.compose.animation.core.AnimationState
import androidx.compose.animation.core.DecayAnimationSpec
import androidx.compose.animation.core.animateDecay
import androidx.compose.animation.core.exponentialDecay
import androidx.compose.foundation.gestures.FlingBehavior
import androidx.compose.foundation.gestures.ScrollScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import kotlin.math.abs

/**
 * 120fps-tuned exponential decay fling behavior for buttery, long-glide momentum scrolling
 * across LazyColumn, LazyRow, LazyVerticalGrid, and verticalScroll containers.
 */
private class SmoothExponentialFlingBehavior(
    private val decaySpec: DecayAnimationSpec<Float>
) : FlingBehavior {
    override suspend fun ScrollScope.performFling(initialVelocity: Float): Float {
        if (abs(initialVelocity) <= 1f) return initialVelocity

        var velocityLeft = initialVelocity
        var lastValue = 0f
        val animationState = AnimationState(
            initialValue = 0f,
            initialVelocity = initialVelocity
        )

        animationState.animateDecay(decaySpec) {
            val delta = value - lastValue
            val consumed = scrollBy(delta)
            lastValue = value
            velocityLeft = this.velocity
            if (abs(delta - consumed) > 0.5f) {
                cancelAnimation()
            }
        }
        return velocityLeft
    }
}

/**
 * Returns a remembered [FlingBehavior] with low-friction C-infinity exponential decay
 * calibrated for 120Hz displays.
 */
@Composable
fun rememberSmoothFlingBehavior(
    frictionMultiplier: Float = 0.65f
): FlingBehavior {
    val decaySpec = remember(frictionMultiplier) {
        exponentialDecay<Float>(
            frictionMultiplier = frictionMultiplier,
            absVelocityThreshold = 0.1f
        )
    }
    return remember(decaySpec) {
        SmoothExponentialFlingBehavior(decaySpec)
    }
}
