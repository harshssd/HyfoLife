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
    // updates and extra.eas will be set by eas init
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hyfolife.app",
      buildNumber: "1"
    },
    android: {
      package: "com.hyfolife.app",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: "./assets/favicon.png"
    }
  }
};
