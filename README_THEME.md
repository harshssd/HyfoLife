Hyfo Life Theme Layer

This app supports runtime theme switching with dark-first concepts. The initial concept implemented is OLED Minimal.

Files

- `src/theme/tokens.ts`: Theme tokens and palettes (`dark-oled`, `dark-glass`, `neo-brutal`).
- `src/theme/ThemeProvider.tsx`: Context provider and `useTheme()` hook.
- `src/lib/animations.ts`: Shared micro-interactions (`pressScale`, `pulseOnce`).
- `src/screens/SettingsThemes.tsx`: Experimental theme switch UI.

Usage

- Use `useTheme()` in components to apply `theme.colors`, `theme.radius`, `theme.spacing`, etc.
- Prefer dark-first surfaces (`bg`, `surface`, `surface2`) and hairline borders (`border`).
- Accents: `accent` for primary actions, `success` for goal met, `warn` for warnings.

Add a New Concept

1. Define a new theme object in `tokens.ts` and add it to `themes`.
2. Use `useTheme()` to drive colors/spacing.
3. Add interaction polish via `pressScale` and `pulseOnce`.

Accessibility

- Target WCAG AA for body text. Use `text` and `textMuted` with sufficient contrast against `surface`.
- Minimum tappable area: 40dp; minimum text size: 12sp.

Performance

- Avoid heavy blur on Android. Use translucency and overlays instead.
- Memoize small tiles/cards in lists (`React.memo`).

