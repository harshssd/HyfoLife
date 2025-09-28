import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { themes } from "../theme/tokens";

export default function SettingsThemes() {
  const { name, setName, theme } = useTheme();
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Experimental Themes</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Switch between different visual themes. Changes apply immediately.
        </Text>
        
        {Object.entries(themes).map(([themeName, themeData]) => (
          <Pressable 
            key={themeName} 
            onPress={() => setName(themeName as any)} 
            style={[
              styles.themeCard, 
              { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: 1,
                ...(name === themeName && {
                  borderColor: theme.colors.accent,
                  borderWidth: 2,
                })
              }
            ]}
          >
            <View style={styles.themeHeader}>
              <Text style={[styles.themeName, { color: theme.colors.text }]}>
                {themeData.name.replace('-', ' ').toUpperCase()}
              </Text>
              {name === themeName && (
                <View style={[styles.selectedBadge, { backgroundColor: theme.colors.accent }]}>
                  <Text style={[styles.selectedText, { color: theme.colors.bg }]}>ACTIVE</Text>
                </View>
              )}
            </View>
            
            <Text style={[styles.themeDescription, { color: theme.colors.textMuted }]}>
              {getThemeDescription(themeName)}
            </Text>
            
            {/* Theme preview */}
            <View style={styles.preview}>
              <View style={[styles.previewCard, { backgroundColor: themeData.colors.surface, borderColor: themeData.colors.border }]}>
                <Text style={[styles.previewText, { color: themeData.colors.text }]}>Sample Card</Text>
                <View style={[styles.previewButton, { backgroundColor: themeData.colors.accent }]}>
                  <Text style={[styles.previewButtonText, { color: themeData.colors.bg }]}>Action</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function getThemeDescription(themeName: string): string {
  switch (themeName) {
    case 'dark-oled':
      return 'Cinematic black with ultra-minimal typography and subtle neon accents. Perfect for OLED displays.';
    case 'dark-glass':
      return 'Frosted glass cards floating on smoky gradients with soft shadows and blur effects.';
    case 'neo-brutal':
      return 'Bold blocks with chunky UI elements and loud accent colors. High contrast and obvious CTAs.';
    default:
      return 'A unique visual experience for habit tracking.';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  themeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeName: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  preview: {
    alignItems: 'center',
  },
  previewCard: {
    width: 120,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  previewButtonText: {
    fontSize: 10,
    fontWeight: '600',
  },
});