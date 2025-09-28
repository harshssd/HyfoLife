import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { UserHabit } from '../types';
import { STARTER_HABITS } from '../data/starterHabits';
import { useTheme } from '../theme/ThemeProvider';

type QuickLogModalProps = {
  visible: boolean;
  habit: UserHabit | null;
  onClose: () => void;
  onConfirm: (quantity: number, meta?: { durationMinutes?: number }) => Promise<void> | void;
  isLogging?: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const QuickLogModal: React.FC<QuickLogModalProps> = ({
  visible,
  habit,
  onClose,
  onConfirm,
  isLogging,
}) => {
  const { theme } = useTheme();
  const starterMeta = useMemo(() => {
    if (!habit) return null;
    return STARTER_HABITS.find((starter) => starter.name.toLowerCase() === habit.name.toLowerCase());
  }, [habit]);

  const inputMode = habit?.inputMode || starterMeta?.inputMode || 'counter';
  const defaultQuantity = starterMeta?.defaultQuantity || habit?.goalPerDay || 1;
  const increment = starterMeta?.quickIncrement || habit?.quickIncrement || 1;
  const unitLabel = habit?.unitLabel || starterMeta?.displayUnit || 'unit';
  const timerPresets = [15, 30, 45, 60];
  const displayUnit = quantity === 1 ? (habit?.unitLabel || unitLabel) : (habit?.unitPlural || starterMeta?.displayUnitPlural || `${unitLabel}s`);

  const [quantity, setQuantity] = useState(defaultQuantity);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const counterInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (!visible) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    setQuantity(defaultQuantity);
    if (inputMode === 'timer' || inputMode === 'duration_min') {
      setTimerRunning(false);
      setElapsedSeconds(0);
    } else {
      setElapsedSeconds(0);
      requestAnimationFrame(() => {
        counterInputRef.current?.focus();
      });
    }
  }, [visible, defaultQuantity, inputMode]);

  useEffect(() => {
    if (!visible) return;
    if (inputMode !== 'timer' && inputMode !== 'duration_min') return;

    if (timerRunning) {
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      timerIntervalRef.current = interval;
      return () => {
        clearInterval(interval);
        timerIntervalRef.current = null;
      };
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [timerRunning, visible, inputMode]);

  if (!habit) return null;

  const handleConfirm = async (valueOverride?: number) => {
    if (isLogging) return;

    const resolvedQuantity = valueOverride ?? quantity;
    if (resolvedQuantity <= 0) {
      Alert.alert('Oops', 'Log at least one unit to keep the streak alive.');
      return;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (inputMode === 'timer' || inputMode === 'duration_min') {
      const seconds = timerRunning ? elapsedSeconds : Math.max(elapsedSeconds, defaultQuantity * 60);
      const minutes = Math.max(1, Math.round(seconds / 60));
      await onConfirm(minutes, { durationMinutes: minutes });
      setTimerRunning(false);
      setElapsedSeconds(0);
    } else if (inputMode === 'checkin' || inputMode === 'check') {
      // For checkin habits, always log with value 1
      await onConfirm(1);
    } else {
      await onConfirm(resolvedQuantity);
      setQuantity(defaultQuantity);
    }
  };

  const handleClose = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    onClose();
  };

  const renderCounterControls = () => (
    <View style={styles.counterControls}>
      <TouchableOpacity
        style={[styles.counterButton, quantity <= 1 && styles.counterButtonDisabled]}
        onPress={() => setQuantity((prev) => Math.max(1, prev - increment))}
        disabled={quantity <= increment}
      >
        <Text style={styles.counterButtonText}>−</Text>
      </TouchableOpacity>
      <TextInput
        ref={counterInputRef}
        value={String(quantity)}
        onChangeText={(text) => {
          const numeric = parseInt(text.replace(/[^0-9]/g, ''), 10);
          if (isNaN(numeric)) {
            setQuantity(1);
          } else {
            setQuantity(clamp(numeric, 1, 9999));
          }
        }}
        keyboardType="number-pad"
        style={styles.counterInput}
        autoFocus
        selectTextOnFocus
      />
      <TouchableOpacity
        style={styles.counterButton}
        onPress={() => setQuantity((prev) => prev + increment)}
      >
        <Text style={styles.counterButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTimerControls = () => (
    <View style={styles.timerControls}>
      <TouchableOpacity
        style={[styles.timerToggle, timerRunning && styles.timerToggleActive]}
        onPress={() => setTimerRunning((prev) => !prev)}
      >
        <Text style={styles.timerToggleText}>{timerRunning ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>
      <Text style={styles.timerDisplay}>{formatDuration(elapsedSeconds)}</Text>
      <View style={styles.timerPresets}>
        {timerPresets.map((minutes, index) => (
          <TouchableOpacity
            key={minutes}
            style={[styles.timerPresetButton, index === 0 && styles.timerPresetButtonFirst]}
            onPress={() => {
              setElapsedSeconds(minutes * 60);
              setTimerRunning(false);
            }}
          >
            <Text style={styles.timerPresetText}>{minutes}m</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCheckinControls = () => (
    <View style={styles.checkinControls}>
      <Text style={styles.checkinText}>Tap confirm to mark this habit complete for today.</Text>
      <Text style={styles.checkinSubtext}>You can log again tomorrow.</Text>
    </View>
  );

  const renderControls = () => {
    if (inputMode === 'timer' || inputMode === 'duration_min') return renderTimerControls();
    if (inputMode === 'checkin' || inputMode === 'check') return renderCheckinControls();
    return renderCounterControls();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <KeyboardAvoidingView
            style={styles.sheetWrapper}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <View style={[styles.sheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetEmoji}>{habit.emoji}</Text>
                <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{habit.name}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Text style={[styles.closeButtonText, { color: theme.colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.sheetSubtitle, { color: theme.colors.textMuted }]}>
                {inputMode === 'timer' || inputMode === 'duration_min'
                  ? 'Track your focused time and keep the streak alive.'
                  : inputMode === 'checkin' || inputMode === 'check'
                  ? 'Log once per day and keep the momentum going.'
                  : 'Tap + or enter the amount you completed.'}
              </Text>

              {renderControls()}

              {inputMode !== 'timer' && inputMode !== 'duration_min' && inputMode !== 'checkin' && inputMode !== 'check' && (
                <Text style={[styles.quantityDescriptor, { color: theme.colors.text }] }>
                  {quantity} {displayUnit}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.colors.accent }, isLogging && styles.confirmButtonDisabled]}
                onPress={() => handleConfirm()}
                disabled={isLogging}
              >
                <Text style={styles.confirmButtonText}>
                  {isLogging ? 'Saving…' : 'Log it'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

function formatDuration(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheetWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    borderWidth: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetEmoji: {
    fontSize: 36,
    marginRight: 8,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a202c',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#a0aec0',
  },
  sheetSubtitle: {
    fontSize: 15,
    color: '#4a5568',
    textAlign: 'center',
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  counterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#edf2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    opacity: 0.4,
  },
  counterButtonText: {
    fontSize: 30,
    color: '#2d3748',
  },
  counterInput: {
    width: 80,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    borderBottomWidth: 2,
    borderColor: '#cbd5e0',
    paddingVertical: 4,
  },
  timerControls: {
    alignItems: 'center',
    gap: 12,
  },
  timerToggle: {
    backgroundColor: '#4299e1',
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  timerToggleActive: {
    backgroundColor: '#f56565',
  },
  timerToggleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timerDisplay: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d3748',
  },
  timerPresets: {
    flexDirection: 'row',
    gap: 12,
  },
  timerPresetButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#e6fffa',
  },
  timerPresetText: {
    color: '#2c7a7b',
    fontWeight: '600',
  },
  checkinControls: {
    backgroundColor: '#f0fff4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c6f6d5',
    gap: 8,
  },
  checkinText: {
    textAlign: 'center',
    color: '#276749',
    fontSize: 16,
  },
  checkinSubtext: {
    textAlign: 'center',
    color: '#2f855a',
    fontSize: 13,
  },
  confirmButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  quantityDescriptor: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
  },
});

export default QuickLogModal;

