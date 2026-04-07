plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("com.facebook.react")
}

val projectRoot = rootDir.absoluteFile.parentFile.absolutePath

react {
  entryFile =
    file(
      providers.exec {
        workingDir(rootDir)
        commandLine(
          "node",
          "-e",
          "require('expo/scripts/resolveAppEntry')",
          projectRoot,
          "android",
          "absolute"
        )
      }.standardOutput.asText.get().trim()
    )

  reactNativeDir =
    File(
      providers.exec {
        workingDir(rootDir)
        commandLine("node", "--print", "require.resolve('react-native/package.json')")
      }.standardOutput.asText.get().trim()
    ).parentFile.absoluteFile

  hermesCommand =
    File(
      providers.exec {
        workingDir(rootDir)
        commandLine("node", "--print", "require.resolve('react-native/package.json')")
      }.standardOutput.asText.get().trim()
    ).parentFile.absolutePath + "/sdks/hermesc/%OS-BIN%/hermesc"

  codegenDir =
    File(
      providers.exec {
        workingDir(rootDir)
        commandLine(
          "node",
          "--print",
          "require.resolve('@react-native/codegen/package.json', { paths: [require.resolve('react-native/package.json')] })"
        )
      }.standardOutput.asText.get().trim()
    ).parentFile.absoluteFile

  enableBundleCompression =
    (findProperty("android.enableBundleCompression")?.toString()?.toBoolean() ?: false)

  // Use Expo CLI to bundle the app, this ensures the Metro config works correctly with Expo projects.
  cliFile =
    File(
      providers.exec {
        workingDir(rootDir)
        commandLine(
          "node",
          "--print",
          "require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })"
        )
      }.standardOutput.asText.get().trim()
    )
  bundleCommand = "export:embed"

  autolinkLibrariesWithApp()
}

val enableMinifyInReleaseBuilds =
  (findProperty("android.enableMinifyInReleaseBuilds")?.toString()?.toBoolean() ?: false)
val jscFlavor = "io.github.react-native-community:jsc-android:2026004.+"
val isHermesEnabled = (findProperty("hermesEnabled")?.toString()?.toBoolean() ?: true)

android {
  ndkVersion = rootProject.extra["ndkVersion"] as String
  buildToolsVersion = rootProject.extra["buildToolsVersion"] as String
  compileSdk = (rootProject.extra["compileSdkVersion"] as Number).toInt()

  namespace = "com.zenrout.app"
  defaultConfig {
    applicationId = "com.zenrout.app"
    minSdk = (rootProject.extra["minSdkVersion"] as Number).toInt()
    targetSdk = (rootProject.extra["targetSdkVersion"] as Number).toInt()
    versionCode = 1
    versionName = "1.0.0"

    buildConfigField(
      "String",
      "REACT_NATIVE_RELEASE_LEVEL",
      "\"${findProperty("reactNativeReleaseLevel") ?: "stable"}\""
    )
  }

  signingConfigs {
    getByName("debug") {
      storeFile = file("debug.keystore")
      storePassword = "android"
      keyAlias = "androiddebugkey"
      keyPassword = "android"
    }
  }

  buildTypes {
    getByName("debug") {
      signingConfig = signingConfigs.getByName("debug")
    }
    getByName("release") {
      signingConfig = signingConfigs.getByName("debug")
      isShrinkResources =
        findProperty("android.enableShrinkResourcesInReleaseBuilds")
          ?.toString()
          ?.toBoolean() ?: false
      isMinifyEnabled = enableMinifyInReleaseBuilds
      proguardFiles(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro")
      isCrunchPngs =
        findProperty("android.enablePngCrunchInReleaseBuilds")
          ?.toString()
          ?.toBoolean() ?: true
    }
  }

  packaging {
    jniLibs {
      useLegacyPackaging =
        findProperty("expo.useLegacyPackaging")?.toString()?.toBoolean() ?: false
    }
  }

  androidResources {
    ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~"
  }
}

listOf("pickFirsts", "excludes", "merges", "doNotStrip").forEach { prop ->
  val options =
    (findProperty("android.packagingOptions.$prop")?.toString() ?: "")
      .split(",")
      .map { it.trim() }
      .filter { it.isNotEmpty() }

  if (options.isNotEmpty()) {
    println("android.packagingOptions.$prop += $options (${options.size})")
    android.packaging.apply {
      when (prop) {
        "pickFirsts" -> resources.pickFirsts += options
        "excludes" -> resources.excludes += options
        "merges" -> resources.merges += options
        "doNotStrip" -> jniLibs.keepDebugSymbols += options
      }
    }
  }
}

dependencies {
  // The version of react-native is set by the React Native Gradle Plugin.
  implementation("com.facebook.react:react-android")

  val isGifEnabled = (findProperty("expo.gif.enabled")?.toString() ?: "") == "true"
  val isWebpEnabled = (findProperty("expo.webp.enabled")?.toString() ?: "") == "true"
  val isWebpAnimatedEnabled = (findProperty("expo.webp.animated")?.toString() ?: "") == "true"

  if (isGifEnabled) {
    implementation("com.facebook.fresco:animated-gif:${expoLibs.versions.fresco.get()}")
  }

  if (isWebpEnabled) {
    implementation("com.facebook.fresco:webpsupport:${expoLibs.versions.fresco.get()}")
    if (isWebpAnimatedEnabled) {
      implementation("com.facebook.fresco:animated-webp:${expoLibs.versions.fresco.get()}")
    }
  }

  if (isHermesEnabled) {
    implementation("com.facebook.react:hermes-android")
  } else {
    implementation(jscFlavor)
  }
}
