// Settings for the Idea Stock Exchange Android app.
//
// Mirrors the philosophy of ios/project.yml: keep the build description in plain
// text, don't commit IDE-generated artifacts. Open this directory in Android
// Studio (Iguana 2023.2.1+) and let it sync, or build from the CLI with
// `./gradlew :app:assembleDebug`.

pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "IdeaStockExchange"
include(":app")
