export default {
  expo: {
    name: "HyfoLife",
    slug: "hyfo-life",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    runtimeVersion: {
      policy: "appVersion" // ties OTA updates to appVersion; bump on native changes
    },
    updates: {
      url: "https://u.expo.dev/a495bb40-11be-40bc-ad8a-ea4be9d711ac"
    },
    extra: {
      eas: {
        projectId: "a495bb40-11be-40bc-ad8a-ea4be9d711ac"
      }
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hyfolife.app",
      buildNumber: "1",
      infoPlist: {
        NSMicrophoneUsageDescription: "This app needs access to microphone for voice recording and speech recognition.",
        NSSpeechRecognitionUsageDescription: "This app uses speech recognition to convert your speech to text for logging habits."
      }
    },
    android: {
      package: "com.hyfolife.app",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.INTERNET"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    }
  }
};
