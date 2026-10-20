import org.jetbrains.compose.desktop.application.dsl.TargetFormat

plugins {
    kotlin("jvm") version "2.1.0"
    id("org.jetbrains.kotlin.plugin.compose") version "2.1.0"
    id("org.jetbrains.compose") version "1.7.3"
}

group = "com.evaplayer"
version = "1.0.0"

dependencies {
    implementation(compose.desktop.currentOs)
    implementation(compose.material3)
    implementation(compose.materialIconsExtended)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-swing:1.9.0")

    // VLC bindings: plays practically every video/audio format (mkv, avi, flac, ...)
    implementation("uk.co.caprica:vlcj:4.8.3")
    implementation("net.java.dev.jna:jna:5.14.0")
    implementation("net.java.dev.jna:jna-platform:5.14.0")
}

compose.desktop {
    application {
        mainClass = "evaplayer.MainKt"

        nativeDistributions {
            targetFormats(TargetFormat.Msi)
            packageName = "EvaPlayer"
            packageVersion = "1.0.0"
            description = "EvaPlayer - video and music player"
            vendor = "Eva"

            // Anything in app-resources/common is copied next to the app (the CI job puts VLC there).
            appResourcesRootDir.set(project.layout.projectDirectory.dir("app-resources"))

            includeAllModules = true

            windows {
                menuGroup = "EvaPlayer"
                shortcut = true
                dirChooser = true
                perUserInstall = true
                iconFile.set(project.file("icons/eva.ico"))
                upgradeUuid = "6f1c2c0e-3b0e-4a39-9d1a-3f0e5b8f7a11"
            }
        }
    }
}
