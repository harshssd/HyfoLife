import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HeatmapDay } from '../types';
import { useTheme } from '../theme/ThemeProvider';

interface HeatmapTileProps {
  day: HeatmapDay;
  size?: number;
  onPress?: (day: HeatmapDay) => void;
}

const HeatmapTile: React.FC<HeatmapTileProps> = ({ day, size = 18, onPress }) => {
  const { theme } = useTheme();
  
  // Map streak intensity to heatmap colors (0-4 scale)
  const intensity = Math.min(4, Math.max(0, Math.floor(day.streak / 3)));
  const colorMap = [theme.colors.heat0, theme.colors.heat1, theme.colors.heat2, theme.colors.heat3, theme.colors.heat4];
  const baseColor = colorMap[intensity];
  
  const goalPct = Math.min(day.goalPercent, 100) / 100;
  const isComplete = day.goalPercent >= 100;

  const content = (
    <View style={[styles.tile, { 
      width: size, 
      height: size, 
      backgroundColor: baseColor,
      borderColor: theme.colors.border,
      borderWidth: 1
    }]}>
      {/* Goal wedge (top-right corner) */}
      {goalPct > 0 && (
        <View style={{
          position: "absolute", 
          right: 0, 
          top: 0, 
          width: 0, 
          height: 0,
          borderLeftWidth: size * 0.6, 
          borderTopWidth: size * 0.6,
          borderLeftColor: "transparent",
          borderTopColor: isComplete ? theme.colors.success : theme.colors.accent,
          opacity: Math.max(0.3, goalPct)
        }} />
      )}
      
      {/* Day number - only show if there's activity */}
      {day.streak > 0 && (
        <Text style={[styles.dayText, { color: theme.colors.text }]}>
          {new Date(day.date).getDate()}
        </Text>
      )}
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

const styles = StyleSheet.create({
  tile: {
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  dayText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#EDEDED',
  },
});

export default HeatmapTile;
