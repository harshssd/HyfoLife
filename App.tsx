import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, FlatList, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { supabase } from './src/config/supabase';
import { STARTER_HABITS } from './src/data/starterHabits';
import { UserHabit, LogEntry, VisualTheme, HabitGoal, HeatmapDay } from './src/types';

type AppState = 'onboarding' | 'signup' | 'login' | 'habit-selection' | 'dashboard' | 'logging';
import QuickLogModal from './src/components/QuickLogModal';
import HeatmapTile from './src/components/HeatmapTile';
import GoalSettingModal from './src/components/GoalSettingModal';
import { useTheme } from './src/theme/ThemeProvider';
import SettingsThemes from './src/screens/SettingsThemes';

const isCheckinHabit = (habit?: UserHabit | null) => {
  if (!habit) return false;
  return habit.inputMode === 'checkin';
};

const hasMetGoalForToday = (
  habit: UserHabit | null | undefined,
  entriesByHabitMap: Record<string, LogEntry[]>,
  todayEntriesList: LogEntry[],
) => {
  if (!habit || !habit.goalPerDay || habit.goalPerDay <= 0) return false;
  
  // For checkin habits, if goal is 1, check if there's at least one entry today
  if (isCheckinHabit(habit) && habit.goalPerDay === 1) {
    const entries = entriesByHabitMap[habit.id] || todayEntriesList.filter(entry => entry.habit_id === habit.id);
    return entries.some(entry => {
      const entryDate = new Date(entry.logged_at);
      return (
        entryDate.getFullYear() === new Date().getFullYear() &&
        entryDate.getMonth() === new Date().getMonth() &&
        entryDate.getDate() === new Date().getDate()
      );
    });
  }
  
  const minimumMeaningfulGoal = habit.quickIncrement && habit.quickIncrement > 0 ? habit.quickIncrement : 1;
  if (habit.goalPerDay <= minimumMeaningfulGoal) return false;

  const entries = entriesByHabitMap[habit.id] || todayEntriesList.filter(entry => entry.habit_id === habit.id);
  const totalToday = entries.reduce((sum, entry) => {
    const entryDate = new Date(entry.logged_at);
    return (
      entryDate.getFullYear() === new Date().getFullYear() &&
      entryDate.getMonth() === new Date().getMonth() &&
      entryDate.getDate() === new Date().getDate()
    ) ? sum + entry.value : sum;
  }, 0);
  return totalToday >= habit.goalPerDay;
};

export default function App() {
  const { theme } = useTheme();
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
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentLogCache, setRecentLogCache] = useState<Record<string, string>>({});
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [habitEntries, setHabitEntries] = useState<LogEntry[]>([]);
  const [entriesByHabit, setEntriesByHabit] = useState<Record<string, LogEntry[]>>({});
  const [todayEntries, setTodayEntries] = useState<LogEntry[]>([]);
  const [recentEntries, setRecentEntries] = useState<LogEntry[]>([]);
  const [recentEntriesLimit, setRecentEntriesLimit] = useState<'today' | 'week' | 'month' | 'quarter'>('today');
  const [isRecentActivityModalVisible, setIsRecentActivityModalVisible] = useState(false);
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<string | null>(null);
  const [modalEntries, setModalEntries] = useState<LogEntry[]>([]);
  const [modalPage, setModalPage] = useState(0);
  const [hasMoreEntries, setHasMoreEntries] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastLoggedEntry, setLastLoggedEntry] = useState<LogEntry | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [isQuickLogPickerVisible, setIsQuickLogPickerVisible] = useState(false);
  const [isThemeSheetVisible, setIsThemeSheetVisible] = useState(false);
  const [habitGoals, setHabitGoals] = useState<Record<string, HabitGoal | null>>({});
  const [goalModalHabit, setGoalModalHabit] = useState<UserHabit | null>(null);
  const [heatmapData, setHeatmapData] = useState<Record<string, HeatmapDay[]>>({});
  const flameAnimRefs = useRef<Record<string, Animated.Value>>({});

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isRecentActivityModalVisible || !user?.id) return;

    // Reset pagination when filters change
    setModalPage(0);
    setHasMoreEntries(true);
    setModalEntries([]);
    
    fetchModalEntries(user.id, recentEntriesLimit, selectedHabitFilter, 0, true).catch(err => {
      console.error('Error fetching modal entries:', err);
    });
  }, [isRecentActivityModalVisible, recentEntriesLimit, selectedHabitFilter, user?.id]);

  useEffect(() => {
    userHabits.forEach(habit => {
      if (!flameAnimRefs.current[habit.id]) {
        flameAnimRefs.current[habit.id] = new Animated.Value(0);
      }
      const { percent } = getTodayProgress(habit.id);
      if (percent >= 100) {
        Animated.sequence([
          Animated.timing(flameAnimRefs.current[habit.id], {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(flameAnimRefs.current[habit.id], {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  }, [userHabits, habitGoals, entriesByHabit, todayEntries]);

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
          streak: 0, // Will be calculated by loadHabitEntries
          totalLogged: 0, // Will be calculated by loadHabitEntries
          lastLogged: habit.created_at,
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

      const goalMap = await loadHabitGoals(targetUserId);
      setHabitGoals(goalMap);
      await loadHabitEntries(targetUserId, habits, goalMap);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const loadHabitGoals = async (targetUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('habit_goals')
        .select('*')
        .eq('user_id', targetUserId);

      if (error) throw error;

      const goalMap: Record<string, HabitGoal> = {};
      (data ?? []).forEach(goal => {
        goalMap[goal.habit_id] = goal as HabitGoal;
      });

      return goalMap;
    } catch (error) {
      console.error('Error loading habit goals:', error);
      return {};
    }
  };

  const loadHabitEntries = async (targetUserId: string, habits?: UserHabit[], goalMap?: Record<string, HabitGoal | null>) => {
    try {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setTime(endOfToday.getTime() - (29 * 24 * 60 * 60 * 1000));
      thirtyDaysAgo.setHours(0, 0, 0, 0);


      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('logged_at', thirtyDaysAgo.toISOString())
        .order('logged_at', { ascending: false });

      const entries = (data ?? []).map(entry => ({
        ...entry,
        habit: habits?.find(h => h.id === entry.habit_id),
      }));

      const todayEntriesList = entries.filter(entry => {
        const entryDate = new Date(entry.logged_at);
        return isSameDay(entryDate, new Date());
      });

      setHabitEntries(entries);
      setTodayEntries(todayEntriesList);
      setModalEntries(entries);

      const grouped: Record<string, LogEntry[]> = {};
      entries.forEach(entry => {
        if (!grouped[entry.habit_id]) grouped[entry.habit_id] = [];
        grouped[entry.habit_id].push(entry);
      });
      setEntriesByHabit(grouped);

      setRecentEntries(todayEntriesList.slice(0, 4));
      setHeatmapData(buildHeatmap(grouped, habits || userHabits, goalMap || habitGoals, thirtyDaysAgo, endOfToday));

      if (habits) {
        const updatedHabits = habits.map(habit => {
          const habitEntriesForHabit = grouped[habit.id] || [];
          const totalLogged = habitEntriesForHabit.reduce((sum, entry) => sum + entry.value, 0);
          // Sort entries by date ascending (oldest first) for streak calculation
          const sortedEntries = [...habitEntriesForHabit].sort((a, b) => 
            new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
          );
          const streak = calculateStreak(sortedEntries);
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
    setAuthSuccess(null);
  };

  const handleSignUp = async () => {
    if (!authEmail.trim() || !authPassword.trim() || !authUsername.trim()) {
      setAuthError('Please fill in email, username, and password.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      console.log('Attempting signup with:', { email: authEmail.trim(), username: authUsername.trim() });
      
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: {
          data: {
            username: authUsername.trim(),
          },
        },
      });
      
      console.log('Signup response:', { data, error });
      
      if (error) throw error;
      
      if (data.session?.user) {
        // User is immediately signed in (email confirmation disabled)
        setUser(data.session.user);
        resetAuthForm();
        setAppState('habit-selection');
        loadUserHabits(data.session.user.id);
      } else if (data.user && !data.session) {
        // User created but needs email confirmation
        setAuthSuccess('Account created! Please check your email and click the confirmation link to complete signup.');
        setToastMessage('Account created! Please check your email and click the confirmation link to complete signup.');
        // Don't reset form immediately, let user see the success message
        setTimeout(() => {
          resetAuthForm();
          setAppState('login');
        }, 3000); // Wait 3 seconds before switching to login
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

  const logHabit = async (habitId: string, quantity: number = 1, options?: { silent?: boolean; meta?: { durationMinutes?: number }; skipReload?: boolean }) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please log in before tracking habits.');
      setAppState('login');
      return null;
    }

    const cacheKey = `${habitId}-${quantity}-${options?.meta?.durationMinutes ?? ''}`;
    if (!options?.silent && recentLogCache[cacheKey]) {
      return null;
    }

    try {
      setIsLogging(true);
      
      // Insert the habit entry
      const { data, error } = await supabase
        .from('habit_entries')
        .insert({
          habit_id: habitId,
          value: quantity,
          user_id: user.id,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setRecentLogCache(prev => ({ ...prev, [cacheKey]: new Date().toISOString() }));
      
      if (!options?.skipReload) {
      loadUserHabits();
      }

      return data as LogEntry;
    } catch (error) {
      Alert.alert('Error', 'Failed to log habit');
      console.error('Log habit error:', error);
      return null;
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

  const showQuickLogFeedback = (habit: UserHabit, quantity: number, entry?: LogEntry) => {
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
    if (entry) {
      setLastLoggedEntry(entry);
      setUndoVisible(true);
    }
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      setUndoVisible(false);
      toastTimeoutRef.current = null;
    }, 2400);
  };

  const isSameDay = (dateA: Date, dateB: Date) => (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );

  const calculateStreak = (entries: LogEntry[], referenceDate?: Date) => {
    if (!entries.length) return 0;

    let streak = 0;
    let currentDate = referenceDate ? new Date(referenceDate) : new Date();

    for (const entry of entries) {
      const entryDate = new Date(entry.logged_at);

      if (entryDate > currentDate) {
        continue;
      }

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

  const handleUndoLastLog = async () => {
    if (!lastLoggedEntry) return;

    try {
      await supabase
        .from('habit_entries')
        .delete()
        .eq('id', lastLoggedEntry.id);

      setHabitEntries(prev => prev.filter(entry => entry.id !== lastLoggedEntry.id));
      setEntriesByHabit(prev => {
        const updated = { ...prev };
        const list = updated[lastLoggedEntry.habit_id]?.filter(entry => entry.id !== lastLoggedEntry.id) || [];
        updated[lastLoggedEntry.habit_id] = list;
        return updated;
      });
      setRecentEntries(prev => prev.filter(entry => entry.id !== lastLoggedEntry.id));
      setLastLoggedEntry(null);
      setUndoVisible(false);
      loadUserHabits();
    } catch (error) {
      Alert.alert('Error', 'Unable to undo log right now.');
      console.error('Undo error:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await supabase
        .from('habit_entries')
        .delete()
        .eq('id', entryId);

      setHabitEntries(prev => prev.filter(entry => entry.id !== entryId));
      setEntriesByHabit(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].filter(entry => entry.id !== entryId);
        });
        return updated;
      });
      setRecentEntries(prev => prev.filter(entry => entry.id !== entryId));
      loadUserHabits();
    } catch (error) {
      Alert.alert('Error', 'Unable to delete entry right now.');
      console.error('Delete entry error:', error);
    }
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
        {authSuccess && <Text style={styles.successText}>{authSuccess}</Text>}

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

  const longestStreak = userHabits.reduce((max, habit) => Math.max(max, habit.streak || 0), 0);
  const totalHabits = userHabits.length;
  const totalLogs = habitEntries.length;

  const renderDashboardDonut = () => {
    const size = 64;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(todayGoalsSummary.percentComplete, 100)) / 100;
    const strokeDashoffset = circumference - circumference * progress;

    return (
      <View style={styles.donutContainer}>
        <Svg width={size} height={size}>
          <Circle
            stroke="#e2e8f0"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {progress > 0 && (
            <Circle
              stroke="#48bb78"
              fill="none"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </Svg>
      </View>
    );
  };

  const renderDashboard = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent]}>
        <View style={[styles.dashboardHero, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
          <View style={styles.heroTopRow}>
            <View style={styles.dashboardHeroLeft}>
              <Text style={[styles.heroGreeting, { color: theme.colors.textMuted }]}>Hey {user?.user_metadata?.username || 'Hyfo human'} 👋</Text>
              <Text style={[styles.heroHeadline, { color: theme.colors.text }]}>Stay hyperfocused today.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.heroSignOut, { borderColor: theme.colors.border }]} onPress={() => setIsThemeSheetVisible(true)}>
                <Text style={[styles.heroSignOutText, { color: theme.colors.text }]}>Themes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.heroSignOut, { borderColor: theme.colors.border }]} onPress={handleSignOut}>
                <Text style={[styles.heroSignOutText, { color: theme.colors.text }]}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroMetricsRow}>
            <View style={[styles.heroMetricGroup, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border, borderWidth: 1 }]}>
              <View style={styles.heroMetric}>
                <Text style={[styles.heroMetricValue, { color: theme.colors.text }]}>{longestStreak}</Text>
                <Text style={[styles.heroMetricLabel, { color: theme.colors.textMuted }]}>Longest streak</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={[styles.heroMetricValue, { color: theme.colors.text }]}>{totalLogs}</Text>
                <Text style={[styles.heroMetricLabel, { color: theme.colors.textMuted }]}>Entries logged</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={[styles.heroMetricValue, { color: theme.colors.text }]}>{totalHabits}</Text>
                <Text style={[styles.heroMetricLabel, { color: theme.colors.textMuted }]}>Active habits</Text>
              </View>
            </View>
            <View style={styles.heroDonutWrapper}>
              {renderDashboardDonut()}
              <Text
                style={[styles.heroDonutCaption,
                  todayGoalsSummary.total <= 0
                    ? styles.heroDonutCaptionNeutral
                    : todayGoalsSummary.completed >= todayGoalsSummary.total
                      ? styles.heroDonutCaptionComplete
                      : styles.heroDonutCaptionPending,
                , { color: theme.colors.textMuted }]}
              >
                {todayGoalsSummary.total > 0
                  ? `${todayGoalsSummary.completed}/${todayGoalsSummary.total} daily`
                  : 'No goals set'}
              </Text>
            </View>
          </View>

          <View style={styles.heroActionRow}>
            <TouchableOpacity style={[styles.heroCTA, { backgroundColor: theme.colors.accent }]} onPress={() => setAppState('habit-selection')}>
              <Text style={[styles.heroCTAText, { color: '#000' }]}>+ Add habit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.heroSecondaryCTA, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border, borderWidth: 1 }]}
              onPress={() => {
                setRecentEntriesLimit('today');
                setSelectedHabitFilter(null);
                setIsRecentActivityModalVisible(true);
              }}
            >
              <Text style={[styles.heroSecondaryText, { color: theme.colors.text }]}>Recent activity →</Text>
            </TouchableOpacity>
          </View>
        </View>
        
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
          <>
          <View style={styles.habitsList}>
              {userHabits.map((habit) => {
                const lastLogged = habit.lastLogged ? new Date(habit.lastLogged) : null;
                const now = new Date();
                // For checkin habits, check actual entries instead of lastLogged date
                const alreadyLoggedToday = isCheckinHabit(habit) 
                  ? Boolean(entriesByHabit[habit.id]?.some(entry => {
                      const entryDate = new Date(entry.logged_at);
                      return isSameDay(entryDate, now);
                    }))
                  : Boolean(lastLogged && isSameDay(lastLogged, now));
                const alreadyComplete = isCheckinHabit(habit)
                  ? alreadyLoggedToday
                  : hasMetGoalForToday(habit, entriesByHabit, todayEntries);

                return (
              <View key={habit.id} style={[styles.habitRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
                    <View style={styles.habitRowHeader}>
                      <View style={styles.habitTitleGroup}>
                    <Text style={[styles.habitName, { color: theme.colors.text }]}>{habit.name}</Text>
                        <View style={styles.habitFlameRow}>
                          <Animated.Text
                            style={[
                              styles.habitFlame,
                              {
                                transform: [
                                  {
                                    scale: flameAnimRefs.current[habit.id]
                                      ? flameAnimRefs.current[habit.id].interpolate({
                                          inputRange: [0, 1],
                                          outputRange: [1, 1.3],
                                        })
                                      : 1,
                                  },
                                ],
                              },
                            ]}
                          >
                            🔥
                          </Animated.Text>
                          <View style={styles.habitFlameStats}>
                            <Text style={[styles.habitFlameText, { color: theme.colors.warn }]}>{habit.streak} day streak</Text>
                            <Text style={[styles.habitFlameSubtext, { color: theme.colors.textMuted }]}>{habit.totalLogged} total</Text>
                  </View>
                </View>
                </View>
                {alreadyComplete && isCheckinHabit(habit) ? (
                  <View style={[styles.habitLogPillDisabled, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
                    <Text style={[styles.habitLogPillTextDisabled, { color: theme.colors.success }]}>✓ Done</Text>
                  </View>
                ) : (
                <TouchableOpacity
                    style={[styles.habitLogPill, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}
                    onPress={() => setActiveLogHabit(habit)}
                >
                    <Text style={[styles.habitLogPillText, { color: theme.colors.text }]}>Log</Text>
                </TouchableOpacity>
                )}
              </View>

                    {renderGoalModule(habit)}
                    <View style={styles.heatmapWrap}>
                      {renderHeatmapTiles(habit.id)}
          </View>
                  </View>
                );
              })}
            </View>

            <View style={[styles.recentLogsSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
              <View style={styles.recentLogsHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
                <TouchableOpacity onPress={() => setIsRecentActivityModalVisible(true)}>
                  <Text style={[styles.viewAllText, { color: theme.colors.accent }]}>See all</Text>
        </TouchableOpacity>
              </View>
              {recentEntries.length > 0 ? (
                recentEntries.map(entry => (
                  <View key={entry.id} style={[styles.logRow, { borderBottomColor: theme.colors.border }]}>
                    <Text style={[styles.logRowEmoji]}>{entry.habit?.emoji || '📝'}</Text>
                    <View style={styles.logRowInfo}>
                      <Text style={[styles.logRowTitle, { color: theme.colors.text }]}>{entry.habit?.name || 'Habit'}</Text>
                      <Text style={[styles.logRowSubtitle, { color: theme.colors.textMuted }]}>{formatEntrySummary(entry)}</Text>
                    </View>
                    <View style={styles.logRowActions}>
                      <Text style={[styles.logRowTime, { color: theme.colors.textMuted }]}>{new Date(entry.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)} style={[styles.deleteButton, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border, borderWidth: 1 }]}>
                        <Text style={[styles.deleteButtonText, { color: theme.colors.warn }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.recentEmptyText, { color: theme.colors.textMuted }]}>No activity logged today.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderLogging = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, styles.loggingScroll]}>
        <View style={styles.loggingHero}>
          <View style={styles.loggingHeroCopy}>
            <Text style={styles.loggingHeroEyebrow}>Logging hub</Text>
            <Text style={styles.loggingHeroTitle}>Capture today's reps in seconds</Text>
            <Text style={styles.loggingHeroSubtitle}>
              Tap a habit card to quick log. Goals and streaks stay in view so every tap keeps momentum.
            </Text>
          </View>
          <View style={styles.loggingHeroActions}>
            <TouchableOpacity style={styles.loggingPrimaryButton} onPress={() => setAppState('dashboard')}>
              <Text style={styles.loggingPrimaryText}>Back to dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loggingSecondaryButton} onPress={() => setAppState('habit-selection')}>
              <Text style={styles.loggingSecondaryText}>+ Add habit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.loggingSectionHeader}>
          <Text style={styles.loggingSectionTitle}>Quick log habits</Text>
          <Text style={styles.loggingSectionSubtitle}>Tap to open the quick log modal. Disabled cards are done for today.</Text>
        </View>
        
        <View style={styles.quickTapGrid}>
          {userHabits.map((habit) => {
            const lastLogged = habit.lastLogged ? new Date(habit.lastLogged) : null;
            const now = new Date();
            const alreadyLoggedToday = Boolean(lastLogged && isSameDay(lastLogged, now));
            const alreadyComplete = isCheckinHabit(habit)
              ? alreadyLoggedToday
              : hasMetGoalForToday(habit, entriesByHabit, todayEntries);
            const disabled = alreadyComplete && isCheckinHabit(habit);

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
                <View style={styles.quickTapHeader}>
              <Text style={styles.quickTapName}>{habit.name}</Text>
                  <Text style={disabled ? styles.quickTapStatus : styles.quickTapStatusActive}>
                    {disabled ? 'Done' : 'Ready'}
                  </Text>
                </View>
                <Text style={styles.quickTapMeta}>🔥 {habit.streak} day streak • {habit.totalLogged} total</Text>
                <View style={styles.quickTapGoal}>{renderGoalModule(habit, 'compact')}</View>
                <View style={styles.quickTapFooter}>
                  <Text style={styles.quickTapActionText}>
                    {disabled ? 'Come back tomorrow' : 'Tap to log new progress'}
                  </Text>
                  <Text style={styles.quickTapChevron}>→</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const getFilteredRecentEntries = () => {
    return todayEntries.filter(entry => {
      if (selectedHabitFilter && entry.habit_id !== selectedHabitFilter) return false;
      return true;
    });
  };

  const fetchModalEntries = async (
    userId: string,
    window: 'today' | 'week' | 'month' | 'quarter',
    habitId?: string | null,
    page: number = 0,
    reset: boolean = false,
  ) => {
    const pageSize = 25;
    const offset = page * pageSize;
    
    const query = supabase
      .from('habit_entries')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (habitId) {
      query.eq('habit_id', habitId);
    }

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    if (window === 'week') {
      startDate.setDate(startDate.getDate() - 6);
    } else if (window === 'month') {
      startDate.setDate(startDate.getDate() - 29);
    } else if (window === 'quarter') {
      startDate.setDate(startDate.getDate() - 89); // Last 90 days
    }
    query.gte('logged_at', startDate.toISOString());

    const { data, error } = await query;
    if (error) throw error;

    const entries = (data ?? []).map(entry => ({
      ...entry,
      habit: userHabits.find(h => h.id === entry.habit_id),
    }));

    if (reset) {
      setModalEntries(entries);
    } else {
      setModalEntries(prev => [...prev, ...entries]);
    }

    // Check if there are more entries
    setHasMoreEntries(entries.length === pageSize);
    setIsLoadingMore(false);
  };

  const getTodayProgress = (habitId: string) => {
    const goal = habitGoals[habitId];
    if (!goal || goal.target_value <= 0) return { value: 0, target: null, percent: 0, unit: goal?.target_unit };

    const entries = entriesByHabit[habitId] || todayEntries.filter(entry => entry.habit_id === habitId);
    const now = new Date();
    
    let totalValue = 0;
    
    if (goal.period === 'daily') {
      // Calculate today's total
      totalValue = entries.reduce((sum, entry) => {
        const entryDate = new Date(entry.logged_at);
        return isSameDay(entryDate, now) ? sum + entry.value : sum;
      }, 0);
    } else if (goal.period === 'weekly') {
      // Calculate this week's total (Monday to Sunday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      endOfWeek.setHours(23, 59, 59, 999);
      
      totalValue = entries.reduce((sum, entry) => {
        const entryDate = new Date(entry.logged_at);
        return entryDate >= startOfWeek && entryDate <= endOfWeek ? sum + entry.value : sum;
      }, 0);
    } else if (goal.period === 'monthly') {
      // Calculate this month's total
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      totalValue = entries.reduce((sum, entry) => {
        const entryDate = new Date(entry.logged_at);
        return entryDate >= startOfMonth && entryDate <= endOfMonth ? sum + entry.value : sum;
      }, 0);
    }

    const percent = Math.round((totalValue / goal.target_value) * 100);
    return { value: totalValue, target: goal.target_value, percent, unit: goal.target_unit };
  };

  const todayGoalsSummary = useMemo(() => {
    const goalHabits = userHabits.filter(habit => habitGoals[habit.id] && habitGoals[habit.id]!.target_value > 0);
    const completed = goalHabits.filter(habit => {
      const { percent } = getTodayProgress(habit.id);
      return percent >= 100;
    }).length;
    const total = goalHabits.length;
    const percentComplete = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentComplete };
  }, [userHabits, habitGoals, entriesByHabit, todayEntries]);

  const donutCaptionStatusStyle = useMemo(() => {
    if (todayGoalsSummary.total <= 0) return styles.heroDonutCaptionNeutral;
    if (todayGoalsSummary.completed >= todayGoalsSummary.total) return styles.heroDonutCaptionComplete;
    return styles.heroDonutCaptionPending;
  }, [todayGoalsSummary]);

  const renderGoalModule = (habit: UserHabit, size: 'default' | 'compact' = 'default') => {
    const goal = habitGoals[habit.id];
    const containerStyle = [styles.goalModule, size === 'compact' && styles.goalModuleCompact];

    if (!goal || goal.target_value <= 0) {
      return (
        <TouchableOpacity style={containerStyle} onPress={() => setGoalModalHabit(habit)}>
          <Text style={styles.goalModuleAction}>Set goal</Text>
        </TouchableOpacity>
      );
    }

    const { percent, value, target, unit } = getTodayProgress(habit.id);
    const clampedPercent = Math.min(percent, 100);
    const isOverflow = percent >= 100;

    // Get period label
    const periodLabel = goal.period === 'daily' ? 'today' : 
                       goal.period === 'weekly' ? 'this week' : 
                       'this month';

    return (
      <View style={containerStyle}>
        <View style={[styles.goalModuleTrack, size === 'compact' && styles.goalModuleTrackCompact]}>
          <Animated.View
            style={[
              styles.goalModuleFill,
              isOverflow && styles.goalModuleFillOver,
              { width: `${clampedPercent}%` },
            ]}
          />
          {isOverflow && (
            <Animated.View
              style={[styles.goalSparkle, {
                opacity: flameAnimRefs.current[habit.id]
                  ? flameAnimRefs.current[habit.id].interpolate({ inputRange: [0, 1], outputRange: [0, 1] })
                  : 0,
              }]}
            />
          )}
        </View>
        <View style={styles.goalModuleFooter}>
          <View style={styles.goalModuleText}>
            <Text style={styles.goalModuleValue}>
              {Math.round(value)}/{target} {unit}
            </Text>
            <Text style={styles.goalModulePeriod}>
              {periodLabel}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setGoalModalHabit(habit)}>
            <Text style={styles.goalModuleAction}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHabitProgressBar = (habit: UserHabit) => {
    const goal = habitGoals[habit.id];
    if (!goal || goal.period !== 'daily' || goal.target_value <= 0) return null;

    const { percent, value, target, unit } = getTodayProgress(habit.id);
    return (
      <View style={styles.goalContainer}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalLabel}>Daily goal</Text>
          <TouchableOpacity onPress={() => setGoalModalHabit(habit)}>
            <Text style={styles.goalValue}>{value}{unit ? `/${target}${unit}` : `/${target}`}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.goalBarTrack}>
          <View style={[styles.goalBarFill, { width: `${percent}%` }]} />
        </View>
      </View>
    );
  };


const renderRecentActivityModal = () => {
  const filteredEntries = modalEntries;
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
              {(['today', 'week', 'month', 'quarter'] as const).map(window => (
                <TouchableOpacity
                  key={window}
                  style={[styles.filterChip, recentEntriesLimit === window && styles.filterChipActive]}
                  onPress={() => setRecentEntriesLimit(window)}
                >
                  <Text style={[styles.filterChipText, recentEntriesLimit === window && styles.filterChipTextActive]}>
                    {window === 'today' ? 'Today' : window === 'week' ? 'Last 7 days' : window === 'month' ? 'Last 30 days' : 'Last 90 days'}
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
              <>
                {filteredEntries.map(entry => (
                  <View key={entry.id} style={styles.modalLogRow}>
                    <View style={styles.modalLogInfo}>
                      <Text style={styles.modalLogTitle}>{entry.habit?.emoji || '📝'} {entry.habit?.name || 'Habit'}</Text>
                      <Text style={styles.modalLogSubtitle}>{formatEntrySummary(entry)}</Text>
                    </View>
                    <View style={styles.modalLogMeta}>
                      <Text style={styles.modalLogDate}>{new Date(entry.logged_at).toLocaleDateString()}</Text>
                      <Text style={styles.modalLogTime}>{new Date(entry.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)} style={styles.modalDeleteButton}>
                        <Text style={styles.modalDeleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                {hasMoreEntries && (
                  <TouchableOpacity 
                    style={styles.loadMoreButton}
                    onPress={() => {
                      if (isLoadingMore || !user?.id) return;
                      setIsLoadingMore(true);
                      const nextPage = modalPage + 1;
                      setModalPage(nextPage);
                      fetchModalEntries(user.id, recentEntriesLimit, selectedHabitFilter, nextPage, false);
                    }}
                    disabled={isLoadingMore}
                  >
                    <Text style={styles.loadMoreButtonText}>
                      {isLoadingMore ? 'Loading...' : 'Load more entries'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
      </ScrollView>
    </SafeAreaView>
      </Modal>
    );
  };

  const handleQuickLogButtonPress = () => {
    if (userHabits.length === 0) {
      setAppState('habit-selection');
      return;
    }

    if (userHabits.length === 1) {
      setActiveLogHabit(userHabits[0]);
      return;
    }

    setIsQuickLogPickerVisible(true);
  };

  const renderQuickLogPicker = () => (
    <Modal visible={isQuickLogPickerVisible} animationType="fade" transparent onRequestClose={() => setIsQuickLogPickerVisible(false)}>
      <View style={styles.pickerBackdrop}>
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>Quick log</Text>
          <Text style={styles.pickerSubtitle}>Choose a habit to log right away</Text>

          <ScrollView style={{ maxHeight: 320 }}>
            {userHabits.map(habit => {
              const lastLogged = habit.lastLogged ? new Date(habit.lastLogged) : null;
              const now = new Date();
              const alreadyLoggedToday = Boolean(lastLogged && isSameDay(lastLogged, now));
              const alreadyComplete = isCheckinHabit(habit)
                ? alreadyLoggedToday
                : hasMetGoalForToday(habit, entriesByHabit, todayEntries);
              const disabled = alreadyComplete && isCheckinHabit(habit);

              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[styles.pickerRow, disabled && styles.pickerRowDisabled]}
                  onPress={() => {
                    if (disabled) return;
                    setIsQuickLogPickerVisible(false);
                    setActiveLogHabit(habit);
                  }}
                  disabled={disabled}
                >
                  <Text style={styles.pickerEmoji}>{habit.emoji}</Text>
                  <View style={styles.pickerInfo}>
                    <Text style={styles.pickerHabitName}>{habit.name}</Text>
                    {disabled ? (
                      <Text style={styles.pickerHabitMeta}>Logged today</Text>
                    ) : (
                      <Text style={styles.pickerHabitMeta}>{habit.streak} day streak • {habit.totalLogged} total</Text>
                    )}
                    {renderGoalModule(habit, 'compact')}

                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.pickerCancel} onPress={() => setIsQuickLogPickerVisible(false)}>
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const GoalSettingModal = ({
    visible,
    habit,
    goal,
    onClose,
    onSave,
  }: {
    visible: boolean;
    habit: UserHabit | null;
    goal: HabitGoal | null;
    onClose: () => void;
    onSave: (targetValue: number, targetUnit: string, period: HabitGoal['period']) => Promise<void> | void;
  }) => {
    const [targetValue, setTargetValue] = useState(goal?.target_value ?? 50);
    const [targetUnit, setTargetUnit] = useState(goal?.target_unit || habit?.unitLabel || 'reps');
    const [period, setPeriod] = useState<HabitGoal['period']>(goal?.period || 'daily');

    useEffect(() => {
      setTargetValue(goal?.target_value ?? 50);
      setTargetUnit(goal?.target_unit || habit?.unitLabel || 'reps');
      setPeriod(goal?.period || 'daily');
    }, [goal, habit]);

    if (!habit) return null;

    const presets = useMemo(() => {
      const defaults = [10, 25, 50, 100];
      if (habit.quickIncrement && habit.quickIncrement > 1) {
        return [habit.quickIncrement, habit.quickIncrement * 3, habit.quickIncrement * 5, habit.quickIncrement * 10];
      }
      return defaults;
    }, [habit.quickIncrement]);

    const handlePreset = (value: number) => {
      setTargetValue(value);
    };

    const handleSave = () => {
      onSave(targetValue, targetUnit.trim(), period);
    };

    const handleRemove = () => {
      onSave(0, '', period);
    };

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.goalBackdrop}>
            <KeyboardAvoidingView
              style={styles.goalSheetWrapper}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
              <TouchableWithoutFeedback>
                <View style={styles.goalSheet}>
                  <View style={styles.goalSheetHeader}>
                    <Text style={styles.goalSheetTitle}>{habit.emoji} {habit.name}</Text>
                    <TouchableOpacity onPress={onClose}>
                      <Text style={styles.goalSheetClose}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.goalSheetSubtitle}>Set a daily target to unlock progress animations.</Text>

                  <View style={styles.goalNumberEditor}>
                    <Text style={styles.goalNumberLabel}>Target value</Text>
                    <View style={styles.goalNumberRow}>
                      <TouchableOpacity
                        style={styles.goalNumberButton}
                        onPress={() => setTargetValue(Math.max(1, targetValue - (habit.quickIncrement || 1)))}
                      >
                        <Text style={styles.goalNumberButtonText}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        value={String(targetValue)}
                        onChangeText={(text) => setTargetValue(Number(text.replace(/[^0-9.]/g, '') || '0'))}
                        keyboardType="decimal-pad"
                        style={styles.goalNumberInput}
                      />
                      <TouchableOpacity
                        style={styles.goalNumberButton}
                        onPress={() => setTargetValue(targetValue + (habit.quickIncrement || 1))}
                      >
                        <Text style={styles.goalNumberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.goalPresetsRow}>
                    {presets.map(value => (
                      <TouchableOpacity
                        key={value}
                        style={[styles.goalPresetChip, targetValue === value && styles.goalPresetChipActive]}
                        onPress={() => handlePreset(value)}
                      >
                        <Text style={[styles.goalPresetText, targetValue === value && styles.goalPresetTextActive]}>{value}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.goalModalLabel}>Unit</Text>
                  <TextInput
                    value={targetUnit}
                    onChangeText={setTargetUnit}
                    style={styles.goalModalInput}
                  />

                  <Text style={styles.goalModalLabel}>Period</Text>
                  <View style={styles.goalModalChipRow}>
                    {(['daily', 'weekly', 'monthly'] as const).map(value => (
                      <TouchableOpacity
                        key={value}
                        style={[styles.goalModalChip, period === value && styles.goalModalChipActive]}
                        onPress={() => setPeriod(value)}
                      >
                        <Text style={[styles.goalModalChipText, period === value && styles.goalModalChipTextActive]}>
                          {value.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.goalModalSaveButton}
                    onPress={handleSave}
                  >
                    <Text style={styles.goalModalSaveText}>Save goal</Text>
                  </TouchableOpacity>

                  {goal && (
                    <TouchableOpacity
                      style={styles.goalModalDeleteButton}
                      onPress={handleRemove}
                    >
                      <Text style={styles.goalModalDeleteText}>Remove goal</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const handleGoalSave = async (habit: UserHabit, targetValue: number, targetUnit: string, period: HabitGoal['period']) => {
    if (!user) return;

    try {
      const sanitizedUnit = targetUnit.trim().slice(0, 5);
      if (targetValue <= 0 || !sanitizedUnit) {
        await supabase
          .from('habit_goals')
          .delete()
          .eq('user_id', user.id)
          .eq('habit_id', habit.id);

        setHabitGoals(prev => ({ ...prev, [habit.id]: null }));
      } else {
        const payload = {
          habit_id: habit.id,
          user_id: user.id,
          target_value: targetValue,
          target_unit: sanitizedUnit,
          period,
        };

        const existing = habitGoals[habit.id];
        if (existing) {
          const { error } = await supabase
            .from('habit_goals')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', existing.id);

          if (error) throw error;
          setHabitGoals(prev => ({ ...prev, [habit.id]: { ...existing, ...payload } }));
        } else {
          const { data, error } = await supabase
            .from('habit_goals')
            .insert(payload)
            .select()
            .single();

          if (error) throw error;
          setHabitGoals(prev => ({ ...prev, [habit.id]: data as HabitGoal }));
        }
      }

      setGoalModalHabit(null);
    } catch (error) {
      Alert.alert('Error', 'Unable to save goal right now.');
      console.error('Goal save error:', error);
    }
  };

  const buildHeatmap = (
    grouped: Record<string, LogEntry[]>,
    habits: UserHabit[],
    goalMap: Record<string, HabitGoal | null>,
    startDate: Date,
    endDate: Date,
  ) => {
    const result: Record<string, HeatmapDay[]> = {};

    habits.forEach(habit => {
      const days: HeatmapDay[] = [];
      const entries = grouped[habit.id] || [];
      const goal = goalMap[habit.id];

      for (let offset = 0; offset <= 30; offset++) {
        const currentDate = new Date(startDate.getTime() + (offset * 24 * 60 * 60 * 1000));
        const dateString = currentDate.toISOString().split('T')[0];
        const dailyEntries = entries.filter(entry => isSameDay(new Date(entry.logged_at), currentDate));
        const total = dailyEntries.reduce((sum, entry) => sum + entry.value, 0);
        const streak = calculateStreak(entries.filter(entry => new Date(entry.logged_at) <= currentDate), currentDate);
        const target = goal && goal.period === 'daily' ? goal.target_value : null;
        const percent = target ? Math.round((total / target) * 100) : 0;


        days.push({
          date: dateString,
          streak,
          goalPercent: percent,
          value: total,
          target,
        });
      }

      result[habit.id] = days;
    });

    return result;
  };

  const renderHeatmapTiles = (habitId: string) => {
    const days = heatmapData[habitId] || [];
    if (!days.length) return null;

    return days.map(day => (
      <HeatmapTile key={day.date} day={day} size={28} />
    ));
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
      <Modal visible={isThemeSheetVisible} animationType="slide" onRequestClose={() => setIsThemeSheetVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>Experimental Themes</Text>
            <TouchableOpacity onPress={() => setIsThemeSheetVisible(false)}>
              <Text style={{ color: theme.colors.textMuted }}>Close</Text>
            </TouchableOpacity>
          </View>
          <SettingsThemes />
        </SafeAreaView>
      </Modal>
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

          const createdEntry = await logHabit(activeLogHabit.id, valueToLog, { silent: true, meta, skipReload: true });
          if (createdEntry) {
            const enrichedEntry = { ...createdEntry, habit: activeLogHabit } as LogEntry;
            setHabitEntries(prev => [enrichedEntry, ...prev]);
            setEntriesByHabit(prev => {
              const list = prev[activeLogHabit.id] ? [enrichedEntry, ...prev[activeLogHabit.id]] : [enrichedEntry];
              return { ...prev, [activeLogHabit.id]: list };
            });
            setRecentEntries(prev => [enrichedEntry, ...prev].slice(0, 4));
            showQuickLogFeedback(activeLogHabit, valueToLog, enrichedEntry);
          }

          loadUserHabits();
          setActiveLogHabit(null);
        }}
        isLogging={isLogging}
      />
      {toastMessage && (
        <View style={styles.toastContainer} pointerEvents="box-none">
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{toastMessage}</Text>
            {undoVisible && (
              <TouchableOpacity onPress={handleUndoLastLog} style={styles.toastUndoButton}>
                <Text style={styles.toastUndoText}>Undo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      <BottomActionBar
        appState={appState}
        habits={userHabits}
        onNavigateLogging={() => setAppState('logging')}
        onNavigateDashboard={() => setAppState('dashboard')}
        onOpenQuickLog={handleQuickLogButtonPress}
      />
      {renderRecentActivityModal()}
      {renderQuickLogPicker()}
      <GoalSettingModal
        visible={!!goalModalHabit}
        habit={goalModalHabit}
        goal={goalModalHabit ? habitGoals[goalModalHabit.id] || null : null}
        onClose={() => setGoalModalHabit(null)}
        onSave={async (value, unit, period) => {
          if (goalModalHabit) {
            await handleGoalSave(goalModalHabit, value, unit, period);
            setGoalModalHabit(null);
          }
        }}
      />
    </>
  );
}

const BottomActionBar = ({
  appState,
  habits,
  onNavigateLogging,
  onNavigateDashboard,
  onOpenQuickLog,
}: {
  appState: AppState;
  habits: UserHabit[];
  onNavigateLogging: () => void;
  onNavigateDashboard: () => void;
  onOpenQuickLog: () => void;
}) => {
  if (appState === 'dashboard') {
    const quickLogLabel = habits.length === 1 ? `Quick log ${habits[0].emoji}` : 'Quick log';
    return (
      <SafeAreaView style={styles.bottomBarSafeArea}>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomBarSecondary} onPress={onOpenQuickLog}>
            <Text style={styles.bottomBarSecondaryText}>{quickLogLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomBarPrimary} onPress={onNavigateLogging}>
            <Text style={styles.bottomBarPrimaryText}>Open logging hub</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (appState === 'logging') {
    return (
      <SafeAreaView style={styles.bottomBarSafeArea}>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomBarPrimary} onPress={onNavigateDashboard}>
            <Text style={styles.bottomBarPrimaryText}>Back to dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
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
  successText: {
    color: '#38a169',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  habitRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  habitTitleGroup: {
    flex: 1,
  },
  habitFlameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitFlame: {
    fontSize: 24,
  },
  habitFlameStats: {
    justifyContent: 'center',
  },
  habitFlameText: {
    fontSize: 14,
    color: '#dd6b20',
    fontWeight: '700',
  },
  habitFlameSubtext: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
    marginTop: 2,
  },
  habitLogPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#f7fafc',
  },
  habitLogPillDisabled: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c6f6d5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#f0fff4',
  },
  habitLogPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  habitLogPillTextDisabled: {
    color: '#276749',
    fontWeight: '600',
  },
  habitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  habitTextGroup: {
    flex: 1,
    gap: 4,
    marginRight: 12,
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
  quickTapCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  quickTapEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  quickTapName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
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
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toastText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toastUndoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'white',
  },
  toastUndoText: {
    color: '#2d3748',
    fontWeight: '700',
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
  logRowActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fed7d7',
  },
  deleteButtonText: {
    color: '#c53030',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  modalHeader: {
    padding: 16,
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
    padding: 16,
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginRight: 8,
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
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
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
  modalDeleteButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#fed7d7',
  },
  modalDeleteButtonText: {
    color: '#c53030',
    fontWeight: '600',
    fontSize: 12,
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
  bottomBarSafeArea: {
    backgroundColor: 'white',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  bottomBarPrimary: {
    flex: 1,
    backgroundColor: '#4299e1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 12,
  },
  bottomBarPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomBarSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    alignItems: 'center',
  },
  bottomBarSecondaryText: {
    color: '#2d3748',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  pickerSheet: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 4,
  },
  pickerSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  pickerRowDisabled: {
    opacity: 0.5,
  },
  pickerEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  pickerInfo: {
    flex: 1,
  },
  pickerHabitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  pickerHabitMeta: {
    fontSize: 13,
    color: '#718096',
  },
  pickerCancel: {
    marginTop: 16,
    alignItems: 'center',
  },
  pickerCancelText: {
    color: '#e53e3e',
    fontSize: 14,
    fontWeight: '600',
  },
  dashboardHero: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    gap: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dashboardHeroLeft: {
    flex: 1,
    marginRight: 12,
  },
  heroGreeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
    marginTop: 6,
  },
  heroSignOut: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  heroSignOutText: {
    color: '#4a5568',
    fontWeight: '600',
  },
  heroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 18,
  },
  heroMetricGroup: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    justifyContent: 'space-between',
  },
  heroMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  heroMetricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2d3748',
    textAlign: 'center',
  },
  heroMetricLabel: {
    marginTop: 0,
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '600',
    textAlign: 'center',
  },
  heroDonutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDonutCard: {
    width: 96,
    backgroundColor: '#1a202c',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  heroDonutTitle: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5f5',
  },
  heroDonutSubtext: {
    fontSize: 10,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  heroCTA: {
    flex: 1,
    backgroundColor: '#48bb78',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  heroCTAText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  heroSecondaryCTA: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#edf2f7',
    alignItems: 'center',
  },
  heroSecondaryText: {
    color: '#2b6cb0',
    fontWeight: '600',
  },
  heroRightColumn: {
    alignItems: 'flex-end',
    gap: 12,
  },
  goalContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalLabel: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '600',
  },
  goalValue: {
    fontSize: 12,
    color: '#2d3748',
    fontWeight: '600',
  },
  goalBarTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#edf2f7',
    overflow: 'hidden',
  },
  goalBarTrackOver: {
    height: 8,
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#48bb78',
  },
  goalBarFillOver: {
    backgroundColor: '#f6ad55',
    shadowColor: '#f6ad55',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  goalFoot: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalFootText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '600',
  },
  goalActionLink: {
    fontSize: 12,
    color: '#3182ce',
    fontWeight: '600',
  },
  goalBlock: {
    marginTop: 8,
    width: '100%',
  },
  goalBlockCompact: {
    marginTop: 12,
  },
  goalEditText: {
    marginTop: 6,
    fontSize: 12,
    color: '#3182ce',
    fontWeight: '600',
  },
  goalModalContent: {
    padding: 20,
    gap: 16,
  },
  goalModalLabel: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
  },
  goalModalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  goalModalChipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  goalModalChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  goalModalChipActive: {
    backgroundColor: '#4299e1',
    borderColor: '#4299e1',
  },
  goalModalChipText: {
    color: '#2d3748',
    fontWeight: '600',
  },
  goalModalChipTextActive: {
    color: 'white',
  },
  goalModalSaveButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  goalModalSaveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  goalModalDeleteButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  goalModalDeleteText: {
    color: '#e53e3e',
    fontWeight: '600',
  },
  goalEditChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  goalEditChipText: {
    color: '#2b6cb0',
    fontSize: 12,
    fontWeight: '600',
  },
  goalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  goalSheetWrapper: {
    width: '100%',
  },
  goalSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  goalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
  },
  goalSheetClose: {
    fontSize: 20,
    color: '#a0aec0',
  },
  goalSheetSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  goalNumberEditor: {
    gap: 10,
  },
  goalNumberLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  goalNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalNumberButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf2f7',
  },
  goalNumberButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
  },
  goalNumberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 12,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: 'white',
  },
  goalPresetsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  goalPresetChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  goalPresetChipActive: {
    backgroundColor: '#4299e1',
    borderColor: '#4299e1',
  },
  goalPresetText: {
    color: '#2d3748',
    fontWeight: '600',
  },
  goalPresetTextActive: {
    color: 'white',
  },
  heatmapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
    maxWidth: '100%',
  },
  heatmapScroll: {
    marginTop: 8,
  },
  goalModule: {
    marginTop: 6,
    gap: 4,
  },
  goalModuleCompact: {
    marginTop: 8,
  },
  goalModuleTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#edf2f7',
    overflow: 'hidden',
  },
  goalModuleTrackCompact: {
    height: 4,
  },
  goalModuleFill: {
    height: '100%',
    backgroundColor: '#48bb78',
  },
  goalModuleFillOver: {
    backgroundColor: '#f6ad55',
  },
  goalModuleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalModuleText: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  goalModuleValue: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '600',
  },
  goalModulePeriod: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '500',
    marginTop: 2,
  },
  goalModuleAction: {
    fontSize: 12,
    color: '#3182ce',
    fontWeight: '600',
  },
  heatmapWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
    maxWidth: '100%',
  },
  goalSparkle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  heroDonutCaption: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  heroDonutCaptionPending: {
    color: '#63b3ed',
  },
  heroDonutCaptionComplete: {
    color: '#f6ad55',
  },
  heroDonutCaptionNeutral: {
    color: '#a0aec0',
  },
  loggingScroll: {
    paddingBottom: 80,
  },
  loggingHero: {
    backgroundColor: '#f7fafc',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    gap: 16,
  },
  loggingHeroCopy: {
    gap: 8,
  },
  loggingHeroEyebrow: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    color: '#63b3ed',
  },
  loggingHeroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a202c',
  },
  loggingHeroSubtitle: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  loggingHeroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  loggingPrimaryButton: {
    flex: 1,
    backgroundColor: '#48bb78',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loggingPrimaryText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  loggingSecondaryButton: {
    flexBasis: 160,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    backgroundColor: '#fff',
  },
  loggingSecondaryText: {
    color: '#2b6cb0',
    fontWeight: '600',
    fontSize: 14,
  },
  loggingSectionHeader: {
    marginBottom: 16,
    gap: 4,
  },
  loggingSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
  },
  loggingSectionSubtitle: {
    fontSize: 13,
    color: '#4a5568',
  },
  quickTapList: {
    gap: 14,
  },
  quickTapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickTapStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718096',
    textTransform: 'uppercase',
  },
  quickTapStatusActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#48bb78',
    textTransform: 'uppercase',
  },
  quickTapMeta: {
    fontSize: 13,
    color: '#4a5568',
  },
  quickTapGoal: {
    marginTop: 4,
  },
  quickTapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quickTapActionText: {
    fontSize: 13,
    color: '#2b6cb0',
    fontWeight: '600',
  },
  quickTapChevron: {
    fontSize: 18,
    color: '#a0aec0',
  },
  loadMoreButton: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadMoreButtonText: {
    color: '#4299e1',
    fontSize: 16,
    fontWeight: '600',
  },
});