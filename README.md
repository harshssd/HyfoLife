# 🌱 Hyfo Life MVP

**Say it. Log it. Grow it.**

A minimal habit tracking app focused on voice logging and visual progress.

## 🎯 MVP Features

### ✅ Implemented
- **Onboarding Flow**: Logo + tagline + explainer cards
- **Starter Habits**: Coffee ☕, Pushups 💪, Water 💧, Focused Work ⏳, Gym 🏋️
- **Habit Selection**: Choose which habits to track
- **Quick Logging**: Tap to log habits instantly
- **Dashboard**: View habits with streaks and totals
- **Supabase Integration**: Real backend with authentication

### 🚧 Coming Next
- **Voice Logging**: Natural language parsing
- **Visual Themes**: Forest, Aquarium, Beast growth
- **Streak Heatmap**: GitHub-style calendar
- **Sharing**: Export streak images

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator or Android Emulator

### Installation
```bash
cd HyfoLife
npm install
```

### Run the App
```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## 🏗️ Project Structure

```
src/
├── config/
│   └── supabase.ts          # Supabase configuration
├── data/
│   └── starterHabits.ts     # Starter habits and patterns
├── types/
│   └── index.ts            # TypeScript types
└── utils/
    └── logParser.ts        # Natural language parsing
```

## 🎨 MVP Flow

### 1. Onboarding
- Logo + "Say it. Log it. Grow it."
- 3 explainer cards (Voice, Streaks, Growth)
- Get Started button

### 2. Habit Selection
- Choose from 5 starter habits
- Skip option for zero friction
- Create habits in Supabase

### 3. Dashboard
- List of user habits
- Streak counts and totals
- Quick log buttons
- Floating + Log button

### 4. Logging
- Quick tap cards for each habit
- Instant feedback
- Back to dashboard

## 🔧 Configuration

### Supabase Setup
The app uses the same Supabase configuration as the Flutter app:
- **URL**: `https://iogxtdeurvperjzrjhsl.supabase.co`
- **Tables**: `habits`, `entries`, `users`
- **Auth**: Magic link authentication

### Environment Variables
```bash
# Create .env file
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 Testing

### Manual Testing
1. **Onboarding**: Test flow and skip options
2. **Habit Selection**: Select/deselect habits
3. **Authentication**: Test magic link flow
4. **Logging**: Test quick tap logging
5. **Dashboard**: Verify habit display and stats

### Natural Language Parser
```typescript
import { parseLogInput } from './src/utils/logParser';

// Test inputs
parseLogInput('15 pushups');     // { habitId: 'pushups', quantity: 15 }
parseLogInput('coffee x2');     // { habitId: 'coffee', quantity: 2 }
parseLogInput('water');          // { habitId: 'water', quantity: 1 }
parseLogInput('gym');            // { habitId: 'gym', quantity: 1 }
```

## 📱 Deployment

### Expo Build
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Build for Web
expo build:web
```

### App Store / Play Store
1. Build production app
2. Submit to stores
3. Configure Supabase production environment

## 🎯 Next Steps

### Week 1: Core MVP
- [ ] Voice logging with microphone
- [ ] Natural language parsing
- [ ] Visual feedback animations
- [ ] Basic streak calculations

### Week 2: Visual Themes
- [ ] Forest growth visualization
- [ ] Aquarium theme
- [ ] Beast evolution theme
- [ ] Theme selection

### Week 3: Advanced Features
- [ ] GitHub-style heatmap
- [ ] Streak reminders
- [ ] Sharing functionality
- [ ] Analytics dashboard

### Week 4: Polish & Launch
- [ ] Performance optimization
- [ ] User testing
- [ ] App store submission
- [ ] Marketing materials

## 🤝 Contributing

This is an MVP focused on rapid iteration. Key principles:
- **Minimal**: Only essential features
- **Fast**: Quick feedback loops
- **Visual**: Engaging user experience
- **Voice**: Unique logging method

## 📄 License

MIT License - Feel free to use and modify!
