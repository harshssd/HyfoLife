import React, { memo } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { pressScale, pulseOnce } from '../lib/animations';

type Props = {
  title: string;
  emoji: string;
  streakDays: number;
  goalPct: number;
  onQuickLog?: () => void;
  onOpen?: () => void;
  type: 'counter' | 'timer' | 'checkin';
};

function HabitCardImpl({ title, emoji, streakDays, goalPct, onQuickLog, onOpen, type }: Props) {
  const { theme } = useTheme();
  const { onPressIn, onPressOut, style } = pressScale();
  const goal = Math.min(goalPct, 1);
  const reached = goalPct >= 1;
  const pulse = pulseOnce(200);

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onQuickLog} onLongPress={onOpen} delayLongPress={120}>
      <Animated.View
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            padding: theme.spacing(5),
            borderWidth: 1,
            borderColor: theme.colors.border,
          },
          style,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: theme.font.h2, color: theme.colors.text }}>{emoji} {title}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>🔥 {streakDays}</Text>
            <View style={{ marginTop: 6, width: 78, height: 6, borderRadius: 4, backgroundColor: theme.colors.surface2 }}>
              <Animated.View style={[{ width: `${goal * 100}%`, height: 6, borderRadius: 4, backgroundColor: reached ? theme.colors.success : theme.colors.accent }, reached && pulse.style]} />
            </View>
          </View>
        </View>

        <View style={{ marginTop: theme.spacing(3), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
            {type === 'timer' ? 'Timer / Log' : type === 'checkin' ? 'Check in' : 'Quick +1'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                borderWidth: 2,
                borderColor: reached ? theme.colors.success : theme.colors.accent,
                backgroundColor: theme.colors.overlay,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: reached ? theme.colors.glow || theme.colors.accent : 'transparent',
                shadowOpacity: reached ? 1 : 0,
                shadowRadius: reached ? 8 : 0,
              }}
            >
              <Text style={{ color: theme.colors.text, fontSize: 11 }}>{Math.round(goalPct * 100)}%</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const HabitCard = memo(HabitCardImpl);
export default HabitCard;

