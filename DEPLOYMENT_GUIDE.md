# 🚀 Hyfo Life Deployment Guide

This guide walks you through setting up a complete Dev → Beta → Prod pipeline for Hyfo Life using Expo Application Services (EAS).

## 📋 Prerequisites

- Expo account (free at [expo.dev](https://expo.dev))
- Apple Developer account (for iOS)
- Google Play Console account (for Android)
- Physical device for testing

## 🔧 Setup Steps

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
# Enter your Expo email/username and password
```

### 3. Initialize EAS Project
```bash
eas init
# This will:
# - Create a new EAS project
# - Update your app.config.js with project ID
# - Set up EAS configuration
```

### 4. Update Configuration
After `eas init`, update these values in your `app.config.js`:

```javascript
// Replace these with your actual values:
bundleIdentifier: "com.yourcompany.hyfolife",  // iOS bundle ID
package: "com.yourcompany.hyfolife",           // Android package name
ascAppId: "YOUR_APP_STORE_CONNECT_APP_ID"     // From App Store Connect
```

## 🏗️ Build Profiles Explained

### Development Build (Dev Client)
- **Purpose**: Internal team testing with native modules
- **Features**: Fast JS updates, development tools
- **Distribution**: Internal only

### Beta Build
- **Purpose**: External testers, near-production
- **Features**: Production-like app, OTA updates
- **Distribution**: TestFlight, Play Console internal testing

### Production Build
- **Purpose**: Public release
- **Features**: Store-ready app
- **Distribution**: App Store, Google Play Store

## 🚀 Daily Workflow

### Development (Internal Team)

#### First Time Setup - Create Dev Client
```bash
# Build development client (iOS)
eas build -p ios --profile development

# Build development client (Android)
eas build -p android --profile development
```

#### Daily Development - Push JS Updates
```bash
# Make your code changes
git add .
git commit -m "Add new features"

# Push update to dev testers
eas update --branch dev --message "New features added"
```

### Beta Testing

#### Create Beta Build
```bash
# Build beta version (iOS)
eas build -p ios --profile beta

# Build beta version (Android)
eas build -p android --profile beta
```

#### Submit to Stores
```bash
# Submit to TestFlight (iOS)
eas submit -p ios --profile beta

# Submit to Play Console (Android)
eas submit -p android --profile beta
```

#### Push Beta Updates
```bash
# Push OTA update to beta testers
eas update --branch beta --message "Bug fixes"
```

### Production Release

#### Create Production Build
```bash
# Build production version (iOS)
eas build -p ios --profile production

# Build production version (Android)
eas build -p android --profile production
```

#### Submit to Stores
```bash
# Submit to App Store (iOS)
eas submit -p ios --profile production

# Submit to Play Store (Android)
eas submit -p android --profile production
```

#### Push Production Updates
```bash
# Push OTA update to all users
eas update --branch production --message "Performance improvements"
```

## 📱 Testing

### Development Client
1. Install dev client on physical device
2. Test all app functionality
3. Verify features work as expected

### Beta/Production
1. Install beta/production build
2. Test thoroughly
3. Verify all features work as expected

## 🔄 Version Management

### When to Rebuild (Native Changes)
- Add/remove native modules
- Change permissions
- Update native dependencies
- Change app configuration

### When to Use OTA Updates (JS Changes)
- UI improvements
- Bug fixes
- Feature additions
- Performance optimizations

### Version Bumping
```bash
# Update version in app.config.js
version: "1.0.1"  # iOS
buildNumber: "2"  # iOS
versionCode: 2    # Android
```

## 🛠️ Troubleshooting

### Build Issues
- **iOS**: Check Apple Developer account and certificates
- **Android**: Verify Google Play Console setup
- **Both**: Ensure EAS project is properly configured

### Update Issues
- **Not updating**: Check channel matches (`dev`/`beta`/`production`)
- **Runtime errors**: Rebuild after native changes
- **Permission issues**: Update app.config.js permissions

## 📊 Monitoring

### EAS Dashboard
- View build status: [expo.dev](https://expo.dev)
- Monitor update distribution
- Check crash reports

### TestFlight/Play Console
- Monitor beta tester feedback
- Track crash reports
- Review app store reviews

## 🎯 Best Practices

### Development
- Test thoroughly on multiple devices
- Use development client for rapid iteration
- Keep dev branch stable for team testing

### Beta
- Test thoroughly before promoting to beta
- Gather feedback from external testers
- Fix critical bugs before production

### Production
- Test final build thoroughly
- Monitor app store reviews
- Push OTA updates for non-critical fixes

## 📞 Support

- **EAS Documentation**: [docs.expo.dev/eas](https://docs.expo.dev/eas/)
- **Expo Discord**: [discord.gg/expo](https://discord.gg/expo)
- **GitHub Issues**: Report bugs in your repository

---

## 🚀 Quick Commands Reference

```bash
# Development
eas build -p ios --profile development
eas build -p android --profile development
eas update --branch dev --message "Feature update"

# Beta
eas build -p ios --profile beta
eas build -p android --profile beta
eas submit -p ios --profile beta
eas submit -p android --profile beta
eas update --branch beta --message "Beta fix"

# Production
eas build -p ios --profile production
eas build -p android --profile production
eas submit -p ios --profile production
eas submit -p android --profile production
eas update --branch production --message "Production update"
```

This pipeline gives you:
- ✅ Professional development workflow
- ✅ Fast iteration with OTA updates
- ✅ Professional beta testing
- ✅ Smooth production releases
- ✅ Easy maintenance and updates
