import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HeatmapDay } from '../types';
import { useTheme } from '../theme/ThemeProvider';

interface HeatmapTileProps {
  day: HeatmapDay;
  size?: number;
  onPress?: (day: HeatmapDay) => void;
}

const streakBands = [0, 1, 4, 7, 14];

const HeatmapTile: React.FC<HeatmapTileProps> = ({ day, size = 24, onPress }) => {
  const { theme } = useTheme();
  const intensity = getIntensityFromStreak(day.streak);
  const colorMap = [theme.colors.heat0, theme.colors.heat1, theme.colors.heat2, theme.colors.heat3, theme.colors.heat4];
  const baseColor = colorMap[intensity];
  const clampedPercent = Math.min(day.goalPercent, 100);
  const isComplete = day.goalPercent >= 100;

  const content = (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: baseColor, borderColor: theme.colors.border }]}> 
      {clampedPercent > 0 && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.5,
            borderTopWidth: size * 0.5,
            borderLeftColor: 'transparent',
            borderTopColor: isComplete ? theme.colors.success : theme.colors.accent,
            opacity: Math.max(0.35, clampedPercent / 100),
          }}
        />
      )}
      {isComplete && (
        <View style={[styles.badge, { backgroundColor: theme.colors.surface }]}> 
          <Text style={[styles.badgeText]}>⭐</Text>
        </View>
      )}
      <Text style={[styles.dayText, { color: theme.colors.text }]}>{new Date(day.date).getDate()}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={() => onPress(day)} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

function getIntensityFromStreak(streak: number) {
  let idx = 0;
  for (let i = 0; i < streakBands.length; i++) {
    if (streak >= streakBands[i]) idx = i;
    else break;
  }
  return Math.max(0, Math.min(idx, 4));
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
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

export default memo(HeatmapTile);
