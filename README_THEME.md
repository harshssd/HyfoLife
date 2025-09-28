# Hyfo Life - OLED Minimal Theme Implementation

## Overview

This implementation adds a comprehensive theme system to Hyfo Life with the **OLED Minimal** design concept as the primary theme. The system supports multiple themes and provides a runtime theme switching capability.

## Theme System Architecture

### Core Files

- **`src/theme/tokens.ts`** - Theme definitions and design tokens
- **`src/theme/ThemeProvider.tsx`** - React context provider for theme management
- **`src/lib/animations.ts`** - Shared animation utilities
- **`src/screens/SettingsThemes.tsx`** - Theme switching interface

### Available Themes

1. **OLED Minimal** (`dark-oled`) - Default theme
   - Cinematic black (#000000) background
   - Ultra-minimal typography
   - Teal accent (#29E3D7) with subtle glow effects
   - Hairline borders (1px) and large headings
   - Perfect for OLED displays

2. **Glass Dark** (`dark-glass`)
   - Frosted glass cards on smoky gradients
   - Deep purple→navy gradient background
   - Glass cards with 8–12% blur effects
   - Soft shadows and subtle noise texture

3. **Neo-Brutal** (`neo-brutal`)
   - Bold blocks with chunky UI elements
   - Charcoal base with loud accent colors
   - Lime (#B4FF39), magenta (#FF4DD8), cyan (#3CF2FF) accents
   - High contrast and obvious CTAs

## Design Tokens

Each theme includes:

```typescript
{
  colors: {
    bg: string,           // Background color
    surface: string,      // Card/surface color
    surface2: string,     // Secondary surface
    text: string,         // Primary text
    textMuted: string,    // Secondary text
    border: string,       // Border color
    accent: string,       // Primary accent
    warn: string,         // Warning color
    success: string,      // Success color
    heat0-4: string,      // Heatmap intensity colors
    overlay: string,      // Overlay color
    glow: string         // Glow effect color
  },
  radius: { sm, md, lg, xl },
  spacing: (n: number) => n * 4,
  font: { h1, h2, body, small },
  duration: { fast, normal, slow },
  z: { card, modal, toast }
}
```

## Component Updates

### HeatmapTile
- **Goal wedge overlay** in top-right corner
- **Streak intensity** mapped to 5-level color scale
- **OLED-optimized** sizing (18px default)
- **Theme-aware** colors and borders

### QuickLogModal
- **Slide-up animation** from bottom
- **OLED styling** with dark surfaces
- **Glow effects** on primary CTA
- **Theme-aware** controls and inputs

### Dashboard
- **Minimal header** with streak/goal summary
- **Theme switching** button (🎨) in header
- **OLED-optimized** layout and spacing
- **Dark-first** design approach

### HabitCard (New Component)
- **Press animations** with scale effects
- **Goal progress** with ring indicators
- **Streak display** with flame emoji
- **Theme-aware** styling throughout

## Usage

### Using Themes in Components

```typescript
import { useTheme } from '../theme/ThemeProvider';

function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <View style={{ 
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.radius.md,
      padding: theme.spacing(4)
    }}>
      <Text style={{ color: theme.colors.text }}>
        Themed content
      </Text>
    </View>
  );
}
```

### Theme Switching

Users can switch themes via:
1. **Dashboard header** - Tap the 🎨 button
2. **Theme settings modal** - Select from available themes
3. **Runtime switching** - Changes apply immediately

### Adding New Themes

1. **Define theme** in `src/theme/tokens.ts`:
```typescript
export const myNewTheme = {
  ...base,
  name: "my-new-theme",
  colors: {
    bg: "#000000",
    surface: "#111111",
    // ... other colors
  }
};
```

2. **Add to themes object**:
```typescript
export const themes: Record<ThemeName, Theme> = {
  "dark-oled": darkOLED,
  "dark-glass": darkGlass,
  "neo-brutal": neoBrutal,
  "my-new-theme": myNewTheme  // Add here
};
```

3. **Update ThemeName type**:
```typescript
export type ThemeName = "dark-oled" | "dark-glass" | "neo-brutal" | "my-new-theme";
```

## Performance Considerations

- **Memoized theme context** to prevent unnecessary re-renders
- **Native driver animations** for smooth 60fps performance
- **Optimized heatmap rendering** with minimal DOM nodes
- **Theme-aware component memoization** where appropriate

## Accessibility

- **WCAG AA contrast** compliance for body text
- **Minimum 12sp text size** for readability
- **40dp minimum hit areas** for touch targets
- **High contrast** theme options available

## Testing

The implementation has been tested for:
- ✅ **Compilation** - No TypeScript errors
- ✅ **Runtime** - Expo development server starts successfully
- ✅ **Theme switching** - Runtime theme changes work
- ✅ **Component integration** - All existing features preserved
- ✅ **Performance** - Smooth animations and interactions

## Future Enhancements

- **Persistent theme storage** using AsyncStorage
- **System theme detection** (light/dark mode)
- **Custom theme creation** interface
- **Animation preferences** (reduce motion support)
- **Theme-specific icons** and illustrations