import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { themes } from '../theme/tokens';

export default function SettingsThemes() {
  const { name, setName, theme } = useTheme() as any;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 16 }}>
      <Text style={{ color: theme.colors.text, fontSize: 22, marginBottom: 12 }}>Experimental Themes</Text>
      {Object.keys(themes).map((n) => (
        <Pressable
          key={n}
          onPress={() => setName(n as any)}
          style={{
            padding: 14,
            backgroundColor: n === name ? theme.colors.surface2 : theme.colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: theme.colors.text }}>{n}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

