import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { ThemeName } from "../theme/tokens";

export default function SettingsThemes() {
  const { name, setName, theme } = useTheme();
  const items: { key: ThemeName; label: string }[] = [
    { key: "night-vigilante", label: "Night Vigilante" },
    { key: "scarlet-speedster", label: "Scarlet Speedster" },
    { key: "panther-guardian", label: "Panther Guardian" },
    { key: "web-slinger", label: "Web Slinger" },
    { key: "man-of-steel", label: "Man of Steel" },
    { key: "amazon-warrior", label: "Amazon Warrior" },
    // Moved legacy neo-brutal to the bottom with a hero-style name
    { key: "neo-brutal", label: "Titan Brutalist" },
  ];
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 16 }}>
      <Text style={{ color: theme.colors.text, fontSize: 22, marginBottom: 12 }}>Hero Skins (Experimental)</Text>
      {items.map(({ key, label }) => (
        <Pressable
          key={key}
          onPress={() => setName(key)}
          style={{
            padding: 14,
            backgroundColor: key === name ? theme.colors.surface2 : theme.colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: theme.colors.text }}>{label}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{key}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

