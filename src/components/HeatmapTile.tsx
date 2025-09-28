import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HeatmapDay } from '../types';
import { useTheme } from '../theme/ThemeProvider';

interface HeatmapTileProps {
  day: HeatmapDay;
  size?: number;
  onPress?: (day: HeatmapDay) => void;
}

const streakColorBands = [
  { threshold: 0, color: '#e2e8f0' },
  { threshold: 1, color: '#c6f6d5' },
  { threshold: 4, color: '#68d391' },
  { threshold: 7, color: '#f6ad55' },
  { threshold: 14, color: '#e53e3e' },
];

const HeatmapTile: React.FC<HeatmapTileProps> = ({ day, size = 24, onPress }) => {
  const { theme } = useTheme();
  const [glow, setGlow] = useState(false);

  const intensityIndex = useMemo(() => {
    if (day.streak >= 14) return 4;
    if (day.streak >= 7) return 3;
    if (day.streak >= 4) return 2;
    if (day.streak >= 1) return 1;
    return 0;
  }, [day.streak]);

  const colorMap = [theme.colors.heat0, theme.colors.heat1, theme.colors.heat2, theme.colors.heat3, theme.colors.heat4];
  const baseColor = colorMap[intensityIndex];
  const clampedPercent = Math.min(day.goalPercent, 100);
  const isComplete = day.goalPercent >= 100;

  const content = (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          backgroundColor: baseColor,
          borderColor: glow ? theme.colors.accent : theme.colors.border,
          shadowColor: glow ? theme.colors.accent : 'transparent',
        },
      ]}
    >
      {clampedPercent > 0 && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.45,
            borderTopWidth: size * 0.45,
            borderLeftColor: 'transparent',
            borderTopColor: isComplete ? theme.colors.success : theme.colors.accent,
            opacity: Math.max(0.3, clampedPercent / 100),
          }}
        />
      )}
      <Text style={[styles.dayText, { color: theme.colors.textMuted }]}>{new Date(day.date).getDate()}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => onPress(day)}
        onLongPress={() => setGlow(true)}
        delayLongPress={160}
        onPressOut={() => setGlow(false)}
        activeOpacity={0.85}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

function getStreakColor(streak: number) {
  let color = streakColorBands[0].color;
  for (const band of streakColorBands) {
    if (streak >= band.threshold) {
      color = band.color;
    } else {
      break;
    }
  }
  return color;
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressRing: {
    position: 'absolute',
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
    borderRadius: 6,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 2,
  },
  badgeText: {
    fontSize: 10,
  },
  dayText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1a202c',
  },
});

export default HeatmapTile;
