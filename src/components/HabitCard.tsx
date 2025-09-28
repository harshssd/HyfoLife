import React from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { pressScale, pulseOnce } from "../lib/animations";

type Props = {
  title: string;
  emoji: string;
  streakDays: number;           // e.g., 7
  goalPct: number;              // 0..1, can exceed for overflow display
  onQuickLog?: () => void;
  onOpen?: () => void;
  type: "counter" | "timer" | "checkin";
};

export default function HabitCard({ title, emoji, streakDays, goalPct, onQuickLog, onOpen, type }: Props) {
  const { theme } = useTheme();
  const { v, onPressIn, onPressOut, style } = pressScale();
  const goal = Math.min(goalPct, 1);

  const goalPulse = pulseOnce(200);
  const reached = goalPct >= 1;

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onQuickLog}>
      <Animated.View style={[{ 
        backgroundColor: theme.colors.surface, 
        borderRadius: theme.radius.md, 
        padding: theme.spacing(4), 
        borderWidth: 1, 
        borderColor: theme.colors.border 
      }, style]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: theme.font.h2, color: theme.colors.text }}>{emoji} {title}</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>🔥 {streakDays}</Text>
            <View style={{ marginTop: 6, width: 64, height: 6, borderRadius: 4, backgroundColor: theme.colors.surface2 }}>
              <View style={{ width: `${goal * 100}%`, height: 6, borderRadius: 4, backgroundColor: reached ? theme.colors.success : theme.colors.accent }} />
            </View>
          </View>
        </View>

        {/* Goal ring badge */}
        <View style={{ marginTop: theme.spacing(3), flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
            {type === "timer" ? "Timer / Log" : type === "checkin" ? "Check in" : "Quick +1"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{
              width: 26, height: 26, borderRadius: 13,
              borderWidth: 2, borderColor: reached ? theme.colors.success : theme.colors.accent,
              backgroundColor: theme.colors.overlay, alignItems: "center", justifyContent: "center"
            }}>
              <Text style={{ color: theme.colors.text, fontSize: 11 }}>{Math.round(goalPct * 100)}%</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}