import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

val localProps = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) {
        file.inputStream().use { load(it) }
    }
}
val cmsEnvProps = Properties().apply {
    val envFile = rootProject.file("../afrocuisto-admin-cms-main/.env")
    if (envFile.exists()) {
        envFile.inputStream().use { load(it) }
    }
}
val geminiApiKey: String = localProps.getProperty("GEMINI_API_KEY", "").trim()
    .ifEmpty { cmsEnvProps.getProperty("VITE_GEMINI_API_KEY", "").trim() }
    .ifEmpty { System.getenv("GEMINI_API_KEY")?.trim().orEmpty() }
val firebaseOtaUrl: String = localProps.getProperty("FIREBASE_OTA_URL", "").trim()
    .ifEmpty { cmsEnvProps.getProperty("VITE_FIREBASE_OTA_URL", "").trim() }
    .ifEmpty { System.getenv("FIREBASE_OTA_URL")?.trim().orEmpty() }
    .ifEmpty { "https://afrocuisto-app.web.app/ota/version.json" }

val ciVersionCode: Int = project.findProperty("AFROCUISTO_VERSION_CODE")
    ?.toString()?.toIntOrNull() ?: 2
val ciVersionName: String = project.findProperty("AFROCUISTO_VERSION_NAME")
    ?.toString()?.takeIf { it.isNotBlank() } ?: "1.1.0"

android {
    namespace = "com.afrocuisto.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.afrocuisto.app"
        minSdk = 26
        targetSdk = 36
        versionCode = ciVersionCode
        versionName = ciVersionName

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "GEMINI_API_KEY", "\"${geminiApiKey.replace("\"", "\\\"")}\"")
        buildConfigField("String", "FIREBASE_OTA_URL", "\"${firebaseOtaUrl.replace("\"", "\\\"")}\"")
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("release") {
            val keystorePath = project.findProperty("AFROCUISTO_RELEASE_STORE_FILE")?.toString()
            if (!keystorePath.isNullOrBlank() && file(keystorePath).exists()) {
                storeFile = file(keystorePath)
                storePassword = project.findProperty("AFROCUISTO_RELEASE_STORE_PASSWORD")?.toString()
                keyAlias = project.findProperty("AFROCUISTO_RELEASE_KEY_ALIAS")?.toString()
                keyPassword = project.findProperty("AFROCUISTO_RELEASE_KEY_PASSWORD")?.toString()
                enableV1Signing = true
                enableV2Signing = true
            }
        }
    }

    buildTypes {
        release {
            val hasReleaseKeystore = !project.findProperty("AFROCUISTO_RELEASE_STORE_FILE")
                ?.toString().isNullOrBlank() &&
                file(project.findProperty("AFROCUISTO_RELEASE_STORE_FILE").toString()).exists()
            signingConfig = if (hasReleaseKeystore) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.core)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.serialization.json)

    implementation(libs.coil.compose)
    implementation(libs.okhttp)
    implementation(libs.lottie.compose)
    implementation(libs.androidx.datastore.preferences)

    debugImplementation(libs.androidx.compose.ui.tooling)
}
