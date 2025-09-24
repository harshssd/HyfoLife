import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, Modal, FlatList } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from './src/config/supabase';
import { STARTER_HABITS } from './src/data/starterHabits';
import { UserHabit, LogEntry, VisualTheme } from './src/types';
import QuickLogModal from './src/components/QuickLogModal';

// MVP App States
type AppState =
  | 'onboarding'
  | 'login'
  | 'signup'
  | 'habit-selection'
  | 'dashboard'
  | 'logging';

export default function App() {
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [user, setUser] = useState<any>(null);
  const [userHabits, setUserHabits] = useState<UserHabit[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [activeLogHabit, setActiveLogHabit] = useState<UserHabit | null>(null);
  const [visualTheme, setVisualTheme] = useState<VisualTheme>('forest');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentLogCache, setRecentLogCache] = useState<Record<string, string>>({});
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [habitEntries, setHabitEntries] = useState<LogEntry[]>([]);
  const [entriesByHabit, setEntriesByHabit] = useState<Record<string, LogEntry[]>>({});
  const [recentEntries, setRecentEntries] = useState<LogEntry[]>([]);
  const [recentEntriesLimit, setRecentEntriesLimit] = useState<'week' | 'month' | 'all'>('week');
  const [isRecentActivityModalVisible, setIsRecentActivityModalVisible] = useState(false);
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setAppState('dashboard');
        loadUserHabits(session.user.id);
      } else {
        setAppState('onboarding');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAppState('onboarding');
    }
  };

  const loadUserHabits = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('owner_id', targetUserId);
      
      if (error) throw error;
      
      const habits: UserHabit[] = (data ?? []).map(habit => {
        const habitName = habit.name || habit.title || 'Habit';
        const fallbackEmoji = STARTER_HABITS.find(
          h => h.name.toLowerCase() === habitName.toLowerCase()
        )?.emoji || '⭐';
        const starterHabit = STARTER_HABITS.find(
          h => h.name.toLowerCase() === habitName.toLowerCase()
        );

        return {
          id: habit.id,
          name: habitName,
          emoji: habit.emoji || fallbackEmoji,
          alias: habit.alias,
          streak: 0,
          totalLogged: 0,
          lastLogged: habit.last_logged_at || habit.created_at,
          createdAt: habit.created_at,
          unit: habit.unit || starterHabit?.unit,
          unitLabel: habit.goal_unit_label || starterHabit?.displayUnit,
          unitPlural: starterHabit?.displayUnitPlural,
          inputMode: habit.input_mode || starterHabit?.inputMode,
          goalPerDay: habit.goal_per_day || starterHabit?.defaultQuantity,
          quickIncrement: starterHabit?.quickIncrement,
          timerPresets: starterHabit?.timerPresets,
          streakAnimation: starterHabit?.streakAnimation,
        };
      });
      
      setUserHabits(habits);
      await loadHabitEntries(targetUserId, habits);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const loadHabitEntries = async (targetUserId: string, habits?: UserHabit[]) => {
    try {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .order('logged_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const entries = (data ?? []).map(entry => ({
        ...entry,
        habit: habits?.find(h => h.id === entry.habit_id),
      }));

      setHabitEntries(entries);

      const grouped: Record<string, LogEntry[]> = {};
      entries.forEach(entry => {
        if (!grouped[entry.habit_id]) grouped[entry.habit_id] = [];
        grouped[entry.habit_id].push(entry);
      });
      setEntriesByHabit(grouped);

      setRecentEntries(entries.slice(0, 3));

      if (habits) {
        const updatedHabits = habits.map(habit => {
          const habitEntriesForHabit = grouped[habit.id] || [];
          const totalLogged = habitEntriesForHabit.reduce((sum, entry) => sum + entry.value, 0);
          const streak = calculateStreak(habitEntriesForHabit);
          const lastLogged = habitEntriesForHabit[0]?.logged_at || habit.lastLogged;

          return {
            ...habit,
            totalLogged,
            streak,
            lastLogged,
          };
        });

        setUserHabits(updatedHabits);
      }
    } catch (error) {
      console.error('Error loading habit entries:', error);
    }
  };

  const resetAuthForm = () => {
    setAuthEmail('');
    setAuthPassword('');
    setAuthUsername('');
    setAuthError(null);
  };

  const handleSignUp = async () => {
    if (!authEmail.trim() || !authPassword.trim() || !authUsername.trim()) {
      setAuthError('Please fill in email, username, and password.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: {
          data: {
            username: authUsername.trim(),
          },
        },
      });

      if (error) throw error;

      if (data.session?.user) {
        setUser(data.session.user);
        resetAuthForm();
        setAppState('habit-selection');
        loadUserHabits(data.session.user.id);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setAuthError(error.message || 'Unable to sign up right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        resetAuthForm();
        setAppState('dashboard');
        loadUserHabits(data.user.id);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthError(error.message || 'Unable to sign in right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserHabits([]);
      setSelectedHabits([]);
      resetAuthForm();
      setAppState('onboarding');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Unable to sign out right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const createUserHabits = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Log in or sign up before creating habits.');
      setAppState('login');
      return;
    }

    if (selectedHabits.length === 0) return;
    
    setIsLoading(true);
    try {
      const ownedHabitTitles = new Set(
        userHabits.map(habit => habit.name.toLowerCase())
      );

      const habitsToCreate: {
        title: string;
        owner_id: string;
        unit: string;
        goal_unit_label: string;
        goal_per_day?: number;
        input_mode: string;
      }[] = [];

      selectedHabits.forEach(habitId => {
        const starterHabit = STARTER_HABITS.find(h => h.id === habitId);
        const title = starterHabit?.name || habitId;

        if (ownedHabitTitles.has(title.toLowerCase())) {
          return;
        }

        const unit = starterHabit?.unit || 'count';
        const inputMode = starterHabit?.inputMode || 'quantity';

        habitsToCreate.push({
          title,
          owner_id: user.id,
          unit,
          goal_unit_label: unit,
          goal_per_day: starterHabit?.defaultQuantity,
          input_mode: inputMode,
        });
      });

      if (habitsToCreate.length === 0) {
        Alert.alert('All set', 'You already have these habits. Pick new ones to add.');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('habits')
        .insert(habitsToCreate);
      
      if (error) throw error;
      
      setAppState('dashboard');
      loadUserHabits();
      setSelectedHabits([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create habits');
      console.error('Create habits error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logHabit = async (habitId: string, quantity: number = 1, options?: { silent?: boolean; meta?: { durationMinutes?: number } }) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please log in before tracking habits.');
      setAppState('login');
      return;
    }

    const cacheKey = `${habitId}-${quantity}-${options?.meta?.durationMinutes ?? ''}`;
    if (!options?.silent && recentLogCache[cacheKey]) {
      return;
    }

    try {
      setIsLogging(true);
      const { error } = await supabase
        .from('habit_entries')
        .insert({
          habit_id: habitId,
          value: quantity,
          user_id: user.id,
          logged_at: new Date().toISOString(),
        });

      if (error) throw error;

      setRecentLogCache(prev => ({ ...prev, [cacheKey]: new Date().toISOString() }));

      loadUserHabits();
    } catch (error) {
      Alert.alert('Error', 'Failed to log habit');
      console.error('Log habit error:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const clearToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastMessage(null);
  };

  const showQuickLogFeedback = (habit: UserHabit, quantity: number) => {
    let message: string;

    if (habit.inputMode === 'timer' || habit.inputMode === 'duration_min') {
      const hours = Math.floor(quantity / 60);
      const minutes = quantity % 60;
      const formattedDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      message = `${habit.emoji} ${formattedDuration}`;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (habit.inputMode === 'checkin' || habit.inputMode === 'check') {
      message = `${habit.emoji} Logged for today!`;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      const unit = quantity === 1
        ? habit.unitLabel || 'unit'
        : habit.unitPlural || habit.unitLabel || 'units';
      message = `${habit.emoji} ${quantity} ${unit}`;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setToastMessage(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2400);
  };

  const isSameDay = (dateA: Date, dateB: Date) => (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );

  const calculateStreak = (entries: LogEntry[]) => {
    if (!entries.length) return 0;

    let streak = 0;
    let currentDate = new Date();

    for (const entry of entries) {
      const entryDate = new Date(entry.logged_at);

      if (streak === 0) {
        if (isSameDay(entryDate, currentDate)) {
          streak += 1;
          continue;
        }

        const yesterday = new Date(currentDate);
        yesterday.setDate(currentDate.getDate() - 1);
        if (isSameDay(entryDate, yesterday)) {
          streak += 1;
          currentDate = entryDate;
          continue;
        }

        break;
      }

      const previousDay = new Date(currentDate);
      previousDay.setDate(previousDay.getDate() - 1);

      if (isSameDay(entryDate, previousDay)) {
        streak += 1;
        currentDate = entryDate;
      } else if (isSameDay(entryDate, currentDate)) {
        continue;
      } else {
        break;
      }
    }

    return streak;
  };

  const formatEntrySummary = (entry: LogEntry) => {
    const habit = entry.habit;
    const quantity = entry.value;

    if (habit?.inputMode === 'timer' || habit?.inputMode === 'duration_min') {
      const hours = Math.floor(quantity / 60);
      const minutes = quantity % 60;
      const formattedDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      return `${habit?.emoji || '⏱️'} ${formattedDuration}`;
    }

    const unit = quantity === 1
      ? habit?.unitLabel || 'unit'
      : habit?.unitPlural || habit?.unitLabel || 'units';

    return `${habit?.emoji || '✅'} ${quantity} ${unit}`;
  };

  const renderOnboarding = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🌱</Text>
          <Text style={styles.title}>Hyfo Life</Text>
          <Text style={styles.tagline}>Say it. Log it. Grow it.</Text>
        </View>
        
        <View style={styles.explainerCards}>
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>🎙️</Text>
            <Text style={styles.cardTitle}>Voice Logging</Text>
            <Text style={styles.cardText}>Tap mic → say "15 pushups"</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>🔥</Text>
            <Text style={styles.cardTitle}>Streak Tiles</Text>
            <Text style={styles.cardText}>Visual progress like GitHub</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>🌳</Text>
            <Text style={styles.cardTitle}>Growth Visuals</Text>
            <Text style={styles.cardText}>Watch your forest grow</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => setAppState('signup')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderAuthChoice = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Join Hyfo Life</Text>
        <Text style={styles.screenSubtitle}>Create an account or log in to start tracking</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setAppState('signup')}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setAppState('login')}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setAppState('onboarding')}
        >
          <Text style={styles.secondaryButtonText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderAuthForm = (
    mode: 'login' | 'signup',
    title: string,
    primaryAction: () => void,
    toggleText: string,
    toggleMode: 'login' | 'signup',
  ) => (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>{title}</Text>
        <Text style={styles.screenSubtitle}>
          {mode === 'signup'
            ? 'Create your account to start logging habits'
            : 'Welcome back! Log in to view your streaks'}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            value={authEmail}
            onChangeText={setAuthEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            style={styles.input}
            editable={!isLoading}
          />
        </View>

        {mode === 'signup' && (
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              value={authUsername}
              onChangeText={setAuthUsername}
              autoCapitalize="none"
              placeholder="hyfohero"
              style={styles.input}
              editable={!isLoading}
            />
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            value={authPassword}
            onChangeText={setAuthPassword}
            autoCapitalize="none"
            secureTextEntry
            placeholder="••••••••"
            style={styles.input}
            editable={!isLoading}
          />
        </View>

        {authError && <Text style={styles.errorText}>{authError}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={primaryAction}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Please wait…' : title}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            resetAuthForm();
            setAppState(toggleMode);
          }}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>{toggleText}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            resetAuthForm();
            setAppState('onboarding');
          }}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderHabitSelection = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Choose Your Starter Habits</Text>
        <Text style={styles.screenSubtitle}>Pick habits you want to track</Text>
        
        <View style={styles.habitsGrid}>
          {STARTER_HABITS.map((habit) => (
            <TouchableOpacity
              key={habit.id}
              style={[
                styles.habitCard,
                selectedHabits.includes(habit.id) && styles.habitCardSelected
              ]}
              onPress={() => {
                if (selectedHabits.includes(habit.id)) {
                  setSelectedHabits(selectedHabits.filter(id => id !== habit.id));
                } else {
                  setSelectedHabits([...selectedHabits, habit.id]);
                }
              }}
            >
              <Text style={styles.habitEmoji}>{habit.emoji}</Text>
              <Text style={styles.habitName}>{habit.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity 
          style={[styles.primaryButton, selectedHabits.length === 0 && styles.disabledButton]}
          onPress={createUserHabits}
          disabled={selectedHabits.length === 0 || isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating...' : `Create ${selectedHabits.length} Habits`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => {
            setSelectedHabits([]);
            setAppState('dashboard');
          }}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Skip for now → Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderDashboard = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.screenTitle}>Your Habits</Text>
          <View style={styles.dashboardActions}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => setAppState('habit-selection')}
            >
              <Text style={styles.smallButtonText}>+ Habit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.signOutButton, isLoading && styles.disabledButton]}
              onPress={handleSignOut}
              disabled={isLoading}
            >
              <Text style={styles.signOutButtonText}>{isLoading ? '…' : 'Sign Out'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {recentEntries.length > 0 && (
          <View style={styles.recentLogsSection}>
            <View style={styles.recentLogsHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => setIsRecentActivityModalVisible(true)}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            {recentEntries.map(entry => (
              <View key={entry.id} style={styles.logRow}>
                <Text style={styles.logRowEmoji}>{entry.habit?.emoji || '📝'}</Text>
                <View style={styles.logRowInfo}>
                  <Text style={styles.logRowTitle}>{entry.habit?.name || 'Habit'}</Text>
                  <Text style={styles.logRowSubtitle}>{formatEntrySummary(entry)}</Text>
                </View>
                <Text style={styles.logRowTime}>{new Date(entry.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            ))}
          </View>
        )}
        
        {userHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyText}>Create your first habit to get started</Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => setAppState('habit-selection')}
            >
              <Text style={styles.buttonText}>Create Habits</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.habitsList}>
            {userHabits.map((habit) => {
              const isCheckin = habit.inputMode === 'check' || habit.inputMode === 'checkin';
              const lastLogged = habit.lastLogged ? new Date(habit.lastLogged) : null;
              const now = new Date();
              const alreadyLoggedToday = Boolean(
                lastLogged &&
                isSameDay(lastLogged, now)
              );

              return (
                <View key={habit.id} style={styles.habitRow}>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                    <View>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      <Text style={styles.habitStats}>
                        {habit.streak} day streak • {habit.totalLogged} total
                      </Text>
                      {alreadyLoggedToday && (
                        <Text style={styles.habitBadge}>Done for today 🔥</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.logButton, (alreadyLoggedToday && isCheckin) && styles.logButtonDisabled]}
                    onPress={() => {
                      if (alreadyLoggedToday && isCheckin) return;
                      setActiveLogHabit(habit);
                    }}
                    disabled={alreadyLoggedToday && isCheckin}
                  >
                    <Text style={styles.logButtonText}>{alreadyLoggedToday && isCheckin ? 'Completed' : 'Quick Log'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => setAppState('logging')}
        >
          <Text style={styles.floatingButtonText}>+ Log</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderLogging = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Log Your Habits</Text>
        
        <TouchableOpacity
          style={styles.addHabitBanner}
          onPress={() => setAppState('habit-selection')}
        >
          <Text style={styles.addHabitBannerText}>Need another habit? Tap here to add one →</Text>
        </TouchableOpacity>

        <View style={styles.quickTapGrid}>
          {userHabits.map((habit) => {
            const isCheckin = habit.inputMode === 'check' || habit.inputMode === 'checkin';
            const lastLogged = habit.lastLogged ? new Date(habit.lastLogged) : null;
            const now = new Date();
            const alreadyLoggedToday = Boolean(
              lastLogged &&
              lastLogged.getDate() === now.getDate() &&
              lastLogged.getMonth() === now.getMonth() &&
              lastLogged.getFullYear() === now.getFullYear()
            );
            const disabled = alreadyLoggedToday && isCheckin;

            return (
              <TouchableOpacity
                key={habit.id}
                style={[styles.quickTapCard, disabled && styles.quickTapCardDisabled]}
                onPress={() => {
                  if (disabled) return;
                  setActiveLogHabit(habit);
                }}
                disabled={disabled}
              >
                <Text style={styles.quickTapEmoji}>{habit.emoji}</Text>
                <Text style={styles.quickTapName}>{disabled ? `${habit.name} ✔︎` : habit.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => setAppState('dashboard')}
        >
          <Text style={styles.secondaryButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const getFilteredRecentEntries = () => {
    const limitDate = new Date();
    const filterWindow = recentEntriesLimit === 'week'
      ? 7
      : recentEntriesLimit === 'month'
      ? 30
      : null;

    return habitEntries.filter(entry => {
      if (selectedHabitFilter && entry.habit_id !== selectedHabitFilter) return false;
      if (!filterWindow) return true;

      const entryDate = new Date(entry.logged_at);
      const diffMs = Date.now() - entryDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= filterWindow;
    });
  };

  const renderRecentActivityModal = () => {
    const filteredEntries = getFilteredRecentEntries();
    const habitFilters = userHabits.map(habit => ({ id: habit.id, name: habit.name, emoji: habit.emoji }));

    return (
      <Modal visible={isRecentActivityModalVisible} animationType="slide" onRequestClose={() => setIsRecentActivityModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => setIsRecentActivityModalVisible(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.filterRow}>
              {(['week', 'month', 'all'] as const).map(window => (
                <TouchableOpacity
                  key={window}
                  style={[styles.filterChip, recentEntriesLimit === window && styles.filterChipActive]}
                  onPress={() => setRecentEntriesLimit(window)}
                >
                  <Text style={[styles.filterChipText, recentEntriesLimit === window && styles.filterChipTextActive]}>
                    {window === 'week' ? 'Last 7 days' : window === 'month' ? 'Last 30 days' : 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.habitFilterRow}>
              <TouchableOpacity
                style={[styles.habitFilterChip, !selectedHabitFilter && styles.habitFilterChipActive]}
                onPress={() => setSelectedHabitFilter(null)}
              >
                <Text style={[styles.habitFilterText, !selectedHabitFilter && styles.habitFilterTextActive]}>All Habits</Text>
              </TouchableOpacity>
              {habitFilters.map(habit => (
                <TouchableOpacity
                  key={habit.id}
                  style={[styles.habitFilterChip, selectedHabitFilter === habit.id && styles.habitFilterChipActive]}
                  onPress={() => setSelectedHabitFilter(selectedHabitFilter === habit.id ? null : habit.id)}
                >
                  <Text style={[styles.habitFilterText, selectedHabitFilter === habit.id && styles.habitFilterTextActive]}>
                    {habit.emoji} {habit.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredEntries.length === 0 ? (
              <View style={styles.emptyModalState}>
                <Text style={styles.emptyModalText}>No activity in this range.</Text>
              </View>
            ) : (
              filteredEntries.map(entry => (
                <View key={entry.id} style={styles.modalLogRow}>
                  <View style={styles.modalLogInfo}>
                    <Text style={styles.modalLogTitle}>{entry.habit?.emoji || '📝'} {entry.habit?.name || 'Habit'}</Text>
                    <Text style={styles.modalLogSubtitle}>{formatEntrySummary(entry)}</Text>
                  </View>
                  <View style={styles.modalLogMeta}>
                    <Text style={styles.modalLogDate}>{new Date(entry.logged_at).toLocaleDateString()}</Text>
                    <Text style={styles.modalLogTime}>{new Date(entry.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  let content: JSX.Element;
  switch (appState) {
    case 'onboarding':
      content = renderOnboarding();
      break;
    case 'login':
      content = renderAuthForm('login', 'Log In', handleSignIn, "Need an account? Sign up", 'signup');
      break;
    case 'signup':
      content = renderAuthForm('signup', 'Create Account', handleSignUp, 'Already have an account? Log in', 'login');
      break;
    case 'habit-selection':
      content = renderHabitSelection();
      break;
    case 'dashboard':
      content = renderDashboard();
      break;
    case 'logging':
      content = renderLogging();
      break;
    default:
      content = renderOnboarding();
      break;
  }

  return (
    <>
      {content}
      <QuickLogModal
        visible={!!activeLogHabit}
        habit={activeLogHabit}
        onClose={() => setActiveLogHabit(null)}
        onConfirm={async (quantity, meta) => {
          if (!activeLogHabit) return;

          const { inputMode } = activeLogHabit;
          let valueToLog = quantity;

          if ((inputMode === 'timer' || inputMode === 'duration_min') && meta?.durationMinutes) {
            valueToLog = meta.durationMinutes;
          }

          await logHabit(activeLogHabit.id, valueToLog, { silent: true, meta });
          showQuickLogFeedback(activeLogHabit, valueToLog);
          setActiveLogHabit(null);
        }}
        isLogging={isLogging}
      />
      {toastMessage && (
        <View style={styles.toastContainer} pointerEvents="none">
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}
      {renderRecentActivityModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: '#718096',
    textAlign: 'center',
  },
  explainerCards: {
    marginBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4299e1',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#cbd5e0',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 32,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  habitCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  habitCardSelected: {
    backgroundColor: '#4299e1',
  },
  habitEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 32,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dashboardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  smallButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#edf2f7',
  },
  signOutButtonText: {
    color: '#4a5568',
    fontSize: 14,
    fontWeight: '600',
  },
  habitsList: {
    marginBottom: 32,
  },
  habitRow: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitStats: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  logButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4299e1',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickTapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  addHabitBanner: {
    backgroundColor: '#ebf8ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bee3f8',
  },
  addHabitBannerText: {
    color: '#2b6cb0',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickTapCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickTapEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  quickTapName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    maxWidth: '80%',
    alignSelf: 'center',
  },
  toastText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  habitBadge: {
    marginTop: 4,
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '600',
  },
  logButtonDisabled: {
    backgroundColor: '#cbd5e0',
  },
  quickTapCardDisabled: {
    opacity: 0.5,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toastCard: {
    backgroundColor: 'rgba(45, 55, 72, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  toastText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recentLogsSection: {
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  logRowEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  logRowInfo: {
    flex: 1,
  },
  logRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
  },
  logRowSubtitle: {
    fontSize: 13,
    color: '#4a5568',
  },
  logRowTime: {
    fontSize: 12,
    color: '#718096',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  modalHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
  },
  modalClose: {
    color: '#e53e3e',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#edf2f7',
  },
  filterChipActive: {
    backgroundColor: '#4299e1',
  },
  filterChipText: {
    color: '#4a5568',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: 'white',
  },
  habitFilterRow: {
    flexGrow: 0,
  },
  habitFilterChip: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 10,
  },
  habitFilterChipActive: {
    backgroundColor: '#48bb78',
  },
  habitFilterText: {
    color: '#2d3748',
    fontWeight: '600',
  },
  habitFilterTextActive: {
    color: 'white',
  },
  emptyModalState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyModalText: {
    color: '#718096',
  },
  modalLogRow: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  modalLogInfo: {
    flex: 1,
    marginRight: 12,
  },
  modalLogTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  modalLogSubtitle: {
    fontSize: 14,
    color: '#4a5568',
  },
  modalLogMeta: {
    alignItems: 'flex-end',
  },
  modalLogDate: {
    fontSize: 13,
    color: '#4a5568',
  },
  modalLogTime: {
    fontSize: 12,
    color: '#718096',
  },
  recentLogsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAllText: {
    color: '#4299e1',
    fontSize: 14,
    fontWeight: '600',
  },
});