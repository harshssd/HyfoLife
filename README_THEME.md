Hyfo Life — Theme system (OLED Minimal v1)

Overview
- Dark-first theme tokens defined in `src/theme/tokens.ts` with three presets: `dark-oled` (default), `dark-glass`, `neo-brutal`.
- Runtime theme context in `src/theme/ThemeProvider.tsx` with `useTheme()` hook.
- Shared micro-interactions in `src/lib/animations.ts`.
- Settings screen to switch themes at runtime: `src/screens/SettingsThemes.tsx`.

Key Files
- `src/theme/tokens.ts`: Scales for radius, spacing, z-index, durations, fonts; color palettes per theme.
- `src/theme/ThemeProvider.tsx`: Context provider and hook.
- `src/lib/animations.ts`: `pressScale`, `pulseOnce` helpers using React Native Animated.

How to use in components
```tsx
import { useTheme } from '../theme/ThemeProvider';

function Example() {
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.bg }}>
      <Text style={{ color: theme.colors.text }}>Hello</Text>
    </View>
  );
}
```

Add a new concept/theme
1) Extend tokens in `src/theme/tokens.ts`:
```ts
export const cyberNeon = { ...base, name: 'cyber-neon', colors: { /* ... */ } };
export type ThemeName = 'dark-oled' | 'dark-glass' | 'neo-brutal' | 'cyber-neon';
export const themes = { 'dark-oled': darkOLED, 'dark-glass': darkGlass, 'neo-brutal': neoBrutal, 'cyber-neon': cyberNeon };
```
2) Consume via `useTheme()`; avoid hard-coded colors.
3) Keep accessible contrast; target WCAG AA for body text.

Design concept implemented: OLED Minimal
- Solid blacks, hairline borders, teal accent `#29E3D7`, amber warn `#FFB020`.
- Goal-met pulse (200ms), subtle glow.
- Heatmap tiles include goal wedge overlay.

Performance/Platform Notes
- Avoid heavy blur on Android.
- Memoize frequently-rendered items; use `Animated` with `useNativeDriver`.
- Defer non-critical animations until after first paint.

