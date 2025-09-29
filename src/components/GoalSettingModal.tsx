import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { HabitGoal, UserHabit } from '../types';

interface GoalSettingModalProps {
  visible: boolean;
  habit: UserHabit | null;
  goal: HabitGoal | null;
  onClose: () => void;
  onSave: (value: number, unit: string, period: HabitGoal['period']) => Promise<void>;
}

const GoalSettingModal: React.FC<GoalSettingModalProps> = ({
  visible,
  habit,
  goal,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const [targetValue, setTargetValue] = useState('1');
  const [targetUnit, setTargetUnit] = useState('');
  const [period, setPeriod] = useState<HabitGoal['period']>('daily');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && habit) {
      // Initialize with existing goal or defaults
      if (goal) {
        setTargetValue(goal.target_value.toString());
        setTargetUnit(goal.target_unit);
        setPeriod(goal.period);
      } else {
        setTargetValue(habit.goalPerDay?.toString() || '1');
        setTargetUnit(habit.unitLabel || 'unit');
        setPeriod('daily');
      }
    }
  }, [visible, habit, goal]);

  const handleSave = async () => {
    const value = parseFloat(targetValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Invalid Goal', 'Please enter a valid target value greater than 0.');
      return;
    }

    if (!targetUnit.trim()) {
      Alert.alert('Invalid Unit', 'Please enter a unit for your goal.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(value, targetUnit.trim(), period);
    } catch (error) {
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await onSave(0, '', 'daily'); // This will delete the goal
            } catch (error) {
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  if (!visible || !habit) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}> 
        <View style={[styles.header, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}> 
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelButtonText, { color: theme.colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Set Goal</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
            <Text style={[styles.saveButtonText, { color: theme.colors.accent }, isSaving && styles.saveButtonTextDisabled]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.content, { backgroundColor: theme.colors.bg }]}> 
          <View style={styles.habitInfo}>
            <Text style={styles.habitEmoji}>{habit.emoji}</Text>
            <Text style={[styles.habitName, { color: theme.colors.text }]}>{habit.name}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Goal Period</Text>
            <View style={styles.periodButtons}>
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface2 }, period === p && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.periodButtonText, { color: theme.colors.text }, period === p && { color: '#000' }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Target Value</Text>
            <TextInput
              style={[styles.valueInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text }]}
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="numeric"
              placeholder="Enter target value"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Unit</Text>
            <TextInput
              style={[styles.unitInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text }]}
              value={targetUnit}
              onChangeText={setTargetUnit}
              placeholder="Enter unit (max 5 chars)"
              placeholderTextColor={theme.colors.textMuted}
              maxLength={5}
            />
          </View>

          {goal && (
            <TouchableOpacity style={[styles.deleteButton, { backgroundColor: theme.colors.overlay, borderColor: theme.colors.border }]} onPress={handleDelete}>
              <Text style={[styles.deleteButtonText, { color: theme.colors.warn }]}>Delete Goal</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveButton: {
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  habitEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  habitName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  periodButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  periodButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  valueInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  unitInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  deleteButton: {
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#dc2626',
  },
});

export default GoalSettingModal;
