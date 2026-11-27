package com.afrocuisto.app.ui.screens.profile

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.afrocuisto.app.R
import com.afrocuisto.app.data.repository.AuthSessionState
import com.afrocuisto.app.data.repository.BugReportRepository
import com.afrocuisto.app.data.repository.BugSeverity
import com.afrocuisto.app.data.repository.BugSubmitResult
import com.afrocuisto.app.data.repository.UserPreferencesState
import com.afrocuisto.app.ui.components.rememberAfroHaptics
import com.afrocuisto.app.ui.components.rememberKeyboardDismisser
import com.afrocuisto.app.ui.i18n.tr
import com.afrocuisto.app.ui.theme.AccentEmerald
import com.afrocuisto.app.ui.theme.AfroOrange
import com.afrocuisto.app.ui.theme.ExpressivePillShape
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private fun severityDotColor(severity: BugSeverity): Color = when (severity) {
    BugSeverity.BLOQUANT -> Color(0xFFEF4444)
    BugSeverity.MAJEUR -> Color(0xFFF97316)
    BugSeverity.MINEUR -> Color(0xFFF59E0B)
    BugSeverity.COSMETIQUE -> Color(0xFF38BDF8)
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun BugReportSubPage(
    bugReportRepository: BugReportRepository,
    userPrefs: UserPreferencesState,
    authSession: AuthSessionState,
    isDark: Boolean,
    canvasColor: Color,
    cardColor: Color,
    subtleSurfaceColor: Color,
    borderColor: Color,
    titleColor: Color,
    bodyColor: Color,
    mutedColor: Color,
    onReportSubmitted: (String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val dismissKeyboard = rememberKeyboardDismisser()
    val haptics = rememberAfroHaptics()

    val recentReports by bugReportRepository.submittedReports.collectAsState(initial = emptyList())
    val deviceInfo = remember { bugReportRepository.buildDeviceInfo() }
    val appVersion = remember { bugReportRepository.buildAppVersion() }

    var title by remember { mutableStateOf("") }
    var category by remember { mutableStateOf(BugReportRepository.CATEGORIES.first()) }
    var severity by remember { mutableStateOf(BugSeverity.MINEUR) }
    var description by remember { mutableStateOf("") }
    var steps by remember { mutableStateOf("") }
    var contactEmail by remember(authSession.email) { mutableStateOf(authSession.email) }

    var screenshotUri by remember { mutableStateOf<Uri?>(null) }
    var screenshotDataUri by remember { mutableStateOf<String?>(null) }
    var isEncodingScreenshot by remember { mutableStateOf(false) }

    var isSubmitting by remember { mutableStateOf(false) }
    var submitSuccess by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            screenshotUri = uri
            isEncodingScreenshot = true
            errorMessage = null
            coroutineScope.launch {
                screenshotDataUri = bugReportRepository.encodeScreenshotDataUri(uri)
                isEncodingScreenshot = false
                if (screenshotDataUri == null) {
                    screenshotUri = null
                    errorMessage = "Impossible de lire cette image. Choisissez un autre fichier."
                }
            }
        }
    }

    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = titleColor,
        unfocusedTextColor = titleColor,
        focusedBorderColor = AfroOrange,
        unfocusedBorderColor = borderColor,
        focusedContainerColor = subtleSurfaceColor,
        unfocusedContainerColor = subtleSurfaceColor,
        focusedLabelColor = AfroOrange,
        unfocusedLabelColor = mutedColor
    )

    // 1. Form Card
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = cardColor),
        border = BorderStroke(1.dp, borderColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    text = tr("Décrivez le problème rencontré", "Describe the issue", "Describe el problema encontrado"),
                    fontSize = 15.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = titleColor
                )
                Text(
                    text = tr(
                        "Votre rapport est transmis directement au tableau de suivi AfroCuisto.",
                        "Your report is sent directly to the AfroCuisto tracking board.",
                        "Tu informe se envía directamente al panel de seguimiento de AfroCuisto."
                    ),
                    fontSize = 12.sp,
                    color = mutedColor
                )
            }

            // Title
            OutlinedTextField(
                value = title,
                onValueChange = {
                    title = it
                    errorMessage = null
                    submitSuccess = false
                },
                label = { Text("Titre du bug *", fontSize = 12.5.sp) },
                placeholder = {
                    Text(
                        "Ex : Le minuteur se coupe en arrière-plan",
                        fontSize = 13.sp,
                        color = mutedColor
                    )
                },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                shape = RoundedCornerShape(20.dp),
                colors = fieldColors,
                modifier = Modifier.fillMaxWidth()
            )

            // Category chips
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Section concernée",
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = titleColor
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    BugReportRepository.CATEGORIES.forEach { item ->
                        val selected = item == category
                        Surface(
                            shape = ExpressivePillShape,
                            color = if (selected) AfroOrange else subtleSurfaceColor,
                            border = BorderStroke(1.dp, if (selected) AfroOrange else borderColor),
                            modifier = Modifier
                                .clip(ExpressivePillShape)
                                .clickable {
                                    haptics.selectionTick()
                                    category = item
                                    submitSuccess = false
                                }
                        ) {
                            Text(
                                text = item,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (selected) Color.White else bodyColor,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                            )
                        }
                    }
                }
            }

            // Severity selector
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Gravité du bug",
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = titleColor
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    BugSeverity.entries.forEach { sev ->
                        val selected = sev == severity
                        val dotColor = severityDotColor(sev)
                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = if (selected) dotColor.copy(alpha = if (isDark) 0.22f else 0.12f) else subtleSurfaceColor,
                            border = BorderStroke(1.dp, if (selected) dotColor else borderColor),
                            modifier = Modifier
                                .clip(RoundedCornerShape(18.dp))
                                .clickable {
                                    haptics.selectionTick()
                                    severity = sev
                                    submitSuccess = false
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(dotColor)
                                )
                                Text(
                                    text = sev.label,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (selected) titleColor else bodyColor
                                )
                            }
                        }
                    }
                }
                Text(
                    text = severity.hint,
                    fontSize = 11.5.sp,
                    color = mutedColor
                )
            }

            // Description
            OutlinedTextField(
                value = description,
                onValueChange = {
                    description = it
                    errorMessage = null
                    submitSuccess = false
                },
                label = { Text("Description détaillée *", fontSize = 12.5.sp) },
                placeholder = {
                    Text(
                        "Expliquez ce qui s'est passé et ce que vous attendiez...",
                        fontSize = 13.sp,
                        color = mutedColor
                    )
                },
                minLines = 3,
                maxLines = 6,
                shape = RoundedCornerShape(22.dp),
                colors = fieldColors,
                modifier = Modifier.fillMaxWidth()
            )

            // Steps to reproduce
            OutlinedTextField(
                value = steps,
                onValueChange = {
                    steps = it
                    submitSuccess = false
                },
                label = { Text("Étapes pour reproduire (optionnel)", fontSize = 12.5.sp) },
                placeholder = {
                    Text(
                        "1. Ouvrir la recette...\n2. Appuyer sur...",
                        fontSize = 13.sp,
                        color = mutedColor
                    )
                },
                minLines = 2,
                maxLines = 5,
                shape = RoundedCornerShape(22.dp),
                colors = fieldColors,
                modifier = Modifier.fillMaxWidth()
            )

            // Contact Email
            if (!authSession.isAuthenticated) {
                OutlinedTextField(
                    value = contactEmail,
                    onValueChange = { contactEmail = it },
                    label = { Text("E-mail de contact (optionnel)", fontSize = 12.5.sp) },
                    placeholder = {
                        Text(
                            "Pour être informé du correctif",
                            fontSize = 13.sp,
                            color = mutedColor
                        )
                    },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Done
                    ),
                    shape = RoundedCornerShape(20.dp),
                    colors = fieldColors,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Screenshot picker & preview
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Capture d'écran (optionnel)",
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = titleColor
                )

                if (screenshotUri == null) {
                    Surface(
                        shape = RoundedCornerShape(22.dp),
                        color = subtleSurfaceColor,
                        border = BorderStroke(1.dp, borderColor),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(22.dp))
                            .clickable(enabled = !isSubmitting) {
                                haptics.navigationTap()
                                imagePickerLauncher.launch("image/*")
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(AfroOrange.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_gallery_linear),
                                    contentDescription = null,
                                    tint = AfroOrange,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Joindre une capture d'écran",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = titleColor
                                )
                                Text(
                                    text = "Aide l'équipe à identifier le problème plus vite",
                                    fontSize = 11.5.sp,
                                    color = mutedColor
                                )
                            }
                        }
                    }
                } else {
                    Surface(
                        shape = RoundedCornerShape(22.dp),
                        color = subtleSurfaceColor,
                        border = BorderStroke(1.dp, borderColor),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(modifier = Modifier.fillMaxWidth()) {
                            AsyncImage(
                                model = screenshotUri,
                                contentDescription = "Capture d'écran jointe",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(170.dp)
                                    .clip(RoundedCornerShape(22.dp))
                            )
                            if (isEncodingScreenshot) {
                                Box(
                                    modifier = Modifier
                                        .matchParentSize()
                                        .background(Color.Black.copy(alpha = 0.45f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator(
                                        color = AfroOrange,
                                        modifier = Modifier.size(28.dp),
                                        strokeWidth = 2.5.dp
                                    )
                                }
                            }
                            Surface(
                                shape = CircleShape,
                                color = Color.Black.copy(alpha = 0.68f),
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(10.dp)
                                    .size(30.dp)
                                    .clip(CircleShape)
                                    .clickable {
                                        screenshotUri = null
                                        screenshotDataUri = null
                                    }
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Retirer la capture",
                                        tint = Color.White,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Error message
            AnimatedVisibility(
                visible = errorMessage != null,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = Color(0xFFEF4444).copy(alpha = if (isDark) 0.18f else 0.10f),
                    border = BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.35f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = errorMessage.orEmpty(),
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (isDark) Color(0xFFFCA5A5) else Color(0xFFDC2626),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
                    )
                }
            }

            // Submit Button
            val buttonBg by animateColorAsState(
                targetValue = when {
                    submitSuccess -> AccentEmerald
                    isSubmitting || isEncodingScreenshot -> AfroOrange.copy(alpha = 0.6f)
                    else -> AfroOrange
                },
                animationSpec = tween(260),
                label = "bugSubmitButtonBg"
            )

            Button(
                onClick = {
                    if (isSubmitting || isEncodingScreenshot) return@Button
                    dismissKeyboard()
                    errorMessage = null
                    isSubmitting = true
                    coroutineScope.launch {
                        val effectiveName = userPrefs.displayName
                            .ifBlank { authSession.displayName }
                            .ifBlank { "Utilisateur AfroCuisto" }
                        val effectiveEmail = contactEmail.ifBlank { authSession.email }
                        val result = bugReportRepository.submitBugReport(
                            title = title,
                            description = description,
                            stepsToReproduce = steps,
                            severity = severity,
                            category = category,
                            userName = effectiveName,
                            userEmail = effectiveEmail,
                            screenshotDataUri = screenshotDataUri,
                            session = authSession
                        )
                        isSubmitting = false
                        when (result) {
                            is BugSubmitResult.Success -> {
                                haptics.actionSuccess()
                                submitSuccess = true
                                title = ""
                                description = ""
                                steps = ""
                                screenshotUri = null
                                screenshotDataUri = null
                                onReportSubmitted(result.message)
                                delay(2400L)
                                submitSuccess = false
                            }
                            is BugSubmitResult.Error -> {
                                haptics.destructiveTick()
                                errorMessage = result.message
                            }
                        }
                    }
                },
                enabled = !isSubmitting && !isEncodingScreenshot,
                shape = RoundedCornerShape(28.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = buttonBg,
                    contentColor = Color.White,
                    disabledContainerColor = buttonBg,
                    disabledContentColor = Color.White
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                AnimatedContent(
                    targetState = when {
                        submitSuccess -> "success"
                        isSubmitting -> "loading"
                        else -> "idle"
                    },
                    transitionSpec = { fadeIn(tween(180)) togetherWith fadeOut(tween(140)) },
                    label = "bugSubmitBtnContent"
                ) { state ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        when (state) {
                            "loading" -> {
                                CircularProgressIndicator(
                                    color = Color.White,
                                    modifier = Modifier.size(18.dp),
                                    strokeWidth = 2.2.dp
                                )
                                Text(
                                    text = "Envoi en cours...",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                            "success" -> {
                                Icon(
                                    imageVector = Icons.Filled.CheckCircle,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(19.dp)
                                )
                                Text(
                                    text = "Rapport envoyé avec succès !",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 14.sp
                                )
                            }
                            else -> {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_solar_send_linear),
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = "Envoyer le rapport de bug",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Auto-collected Diagnostic Info Card
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = cardColor),
        border = BorderStroke(1.dp, borderColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Informations techniques jointes",
                fontSize = 14.sp,
                fontWeight = FontWeight.ExtraBold,
                color = titleColor
            )
            Text(
                text = "Appareil : $deviceInfo",
                fontSize = 12.sp,
                color = bodyColor
            )
            Text(
                text = "Version : AfroCuisto $appVersion",
                fontSize = 12.sp,
                color = bodyColor
            )
            if (authSession.isAuthenticated && authSession.email.isNotBlank()) {
                Text(
                    text = "Compte : ${authSession.email}",
                    fontSize = 12.sp,
                    color = mutedColor
                )
            }
        }
    }

    // 3. Recent local reports
    if (recentReports.isNotEmpty()) {
        val dateFormatter = remember { SimpleDateFormat("dd MMM yyyy · HH:mm", Locale.FRENCH) }
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = cardColor),
            border = BorderStroke(1.dp, borderColor),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Vos signalements récents",
                    fontSize = 14.5.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = titleColor
                )
                recentReports.forEach { report ->
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = canvasColor,
                        border = BorderStroke(1.dp, borderColor),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = report.title,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = titleColor,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(Modifier.height(2.dp))
                                Text(
                                    text = "${report.category} · ${report.severity} · ${dateFormatter.format(Date(report.createdAtMs))}",
                                    fontSize = 11.sp,
                                    color = mutedColor,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            Spacer(Modifier.width(8.dp))
                            Surface(
                                shape = ExpressivePillShape,
                                color = AfroOrange.copy(alpha = 0.14f)
                            ) {
                                Text(
                                    text = report.status,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = AfroOrange,
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
