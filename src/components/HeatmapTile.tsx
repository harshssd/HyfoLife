import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HeatmapDay } from '../types';

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
  const baseColor = getStreakColor(day.streak);
  const clampedPercent = Math.min(day.goalPercent, 100);
  const isComplete = day.goalPercent >= 100;

  const content = (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: baseColor }]}>
      {clampedPercent > 0 && (
        <View
          style={[
            styles.progressRing,
            {
              borderColor: isComplete ? '#f6ad55' : '#2f855a',
              borderWidth: isComplete ? 3 : 2,
            },
          ]}
        />
      )}
      {isComplete && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⭐</Text>
        </View>
      )}
      <Text style={styles.dayText}>{new Date(day.date).getDate()}</Text>
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
