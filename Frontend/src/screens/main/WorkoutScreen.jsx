import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import {
  Flame,
  Clock,
  Trophy,
  Play,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
} from "lucide-react-native";

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

import AsyncStorage from '@react-native-async-storage/async-storage';

import API_URL from "../config/api";
import {
  addToSyncQueue,
  updateCachedDashboardField,
} from "../../services/OfflineStorage";
import { useCustomAlert } from "../../context/CustomAlertContext";
import { useTheme } from "../../context/ThemeContext";
import AILoadingModal from "../../components/AILoadingModal";
import StaggerCard from "../../components/StaggerCard";
import PressableCard from "../../components/PressableCard";
import SkeletonCard from "../../components/SkeletonCard";
import { getStyles } from "./WorkoutScreen.styles";
const logoGreen = "#10B981";

const pushNotificationIfAllowed = async (newNotif, setNotifications) => {
  if (!setNotifications) return;
  try {
    const stored = await AsyncStorage.getItem('@ms_notification_preferences');
    const prefs = stored ? JSON.parse(stored) : { habitReminders: true, motivationalUpdates: true, personalizedAlerts: true };
    const category = newNotif.category;
    if ((category === 'hydration' || category === 'meal') && prefs.habitReminders === false) return;
    if ((category === 'workout' || category === 'achievement') && prefs.motivationalUpdates === false) return;
    if (category === 'smart' && prefs.personalizedAlerts === false) return;
    setNotifications(prev => [newNotif, ...prev]);
  } catch (e) {
    setNotifications(prev => [newNotif, ...prev]);
  }
};

const getExerciseSource = (exerciseName) => {
  if (!exerciseName) return null;
  const name = exerciseName.toLowerCase();
  
  // Custom local GIF / image assets can be added to Frontend/assets/workouts/ and required here:
  // if (name.includes('wall')) return require('../../assets/workouts/wall_pushups.gif');

  if (name.includes('push') || name.includes('wall')) {
    return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80';
  }
  if (name.includes('squat')) {
    return 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=600&q=80';
  }
  if (name.includes('plank') || name.includes('core') || name.includes('hold')) {
    return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80';
  }
  if (name.includes('jack') || name.includes('jump') || name.includes('cardio') || name.includes('burpee')) {
    return 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&w=600&q=80';
  }
  if (name.includes('lunge')) {
    return 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80';
};

const DEFAULT_WORKOUT_ROUTINES = [
  {
    id: "w-light-default",
    title: "Full Body Bodyweight Burn",
    intensity: "Light",
    duration: 20,
    caloriesBurn: 150,
    description: "Light full-body burn.",
    badgeText: "BEGINNER FRIENDLY",
    tutorials: [
      {
        name: "Bodyweight Squat",
        target: "3 Sets x 12 Reps",
        setup: "Feet shoulder-width apart.",
        form: "Sit back into heels; stand up.",
      },
      {
        name: "Incline Pushup",
        target: "3 Sets x 10 Reps",
        setup: "Hands on wall or bench.",
        form: "Lower chest to 45°; press up.",
      },
      {
        name: "Standing High Knees",
        target: "3 Sets x 30 Secs",
        setup: "Stand tall, drive knee up.",
        form: "Pump arms and land softly.",
      },
    ],
  },
  {
    id: "w-mod-default",
    title: "HIIT Power Circuit",
    intensity: "Moderate",
    duration: 30,
    caloriesBurn: 280,
    description: "HIIT cardio & calorie burn.",
    badgeText: "MOST POPULAR",
    tutorials: [
      {
        name: "Jumping Jacks",
        target: "4 Sets x 45 Secs",
        setup: "Feet together, arms down.",
        form: "Jump out and raise arms overhead.",
      },
      {
        name: "Mountain Climbers",
        target: "4 Sets x 40 Secs",
        setup: "High plank, wrists under shoulders.",
        form: "Drive knees forward quickly.",
      },
      {
        name: "Walking Lunges",
        target: "3 Sets x 14 Reps",
        setup: "Step forward, bend knees 90°.",
        form: "Push forward into next step.",
      },
    ],
  },
  {
    id: "w-int-default",
    title: "Core & Strength Sculpt",
    intensity: "Intense",
    duration: 40,
    caloriesBurn: 420,
    description: "Intense core & muscle sculpt.",
    badgeText: "HIGH CALORIE BURN",
    tutorials: [
      {
        name: "Plank Hold",
        target: "4 Sets x 60 Secs",
        setup: "Elbows on floor under shoulders.",
        form: "Hold straight line; brace core.",
      },
      {
        name: "Standard Pushups",
        target: "4 Sets x 15 Reps",
        setup: "High plank, hands shoulder-width.",
        form: "Lower chest to floor; push up.",
      },
      {
        name: "Russian Twists",
        target: "4 Sets x 20 Reps",
        setup: "Sit back 45° with feet up.",
        form: "Twist torso side to side.",
      },
    ],
  },
];

export default function WorkoutScreen({
  onTabChange,
  userId,
  onRefreshDashboard,
  isOnline = true,
  dailyExercise,
  setDailyExercise,
  setNotifications,
  userGoals,
  userBaseline
}) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [selectedIntensity, setSelectedIntensity] = useState("All");

  // --- TUTORIAL ENGINE NAVIGATION STATES ---
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // --- REST TIMER STATE ---
  const [restTimer, setRestTimer] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => prev - 1);
      }, 1000);
    } else if (restTimer === 0) {
      setIsTimerRunning(false);
      showAlert("Rest Period Complete! ⏱️", "Ready for your next set or exercise step?");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, restTimer]);

  const handleStartRestTimer = (seconds = 45) => {
    setRestTimer(seconds);
    setIsTimerRunning(true);
  };

  const intensityTiers = ['All', 'Light', 'Moderate', 'Intense'];

  // --- AI RECOMMENDATION SYSTEM STATE ---
  const [workoutRoutines, setWorkoutRoutines] = useState(DEFAULT_WORKOUT_ROUTINES);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);

  const handleRegenerateWorkouts = useCallback(async () => {
    setIsGeneratingWorkout(true);
    try {
      const res = await fetch(`${API_URL}/workouts/recommend/${userId || 'default'}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setWorkoutRoutines(data);
        }
        const todayStr = new Date().toISOString().split("T")[0];
        await AsyncStorage.setItem(
          "ms_workouts_cache",
          JSON.stringify({
            userId,
            date: todayStr,
            workouts: data,
          }),
        );
        showAlert(
          "AI Workouts Customized",
          "Your personalized home routines have been regenerated with AI!",
        );
      }
    } catch (err) {
      if (__DEV__) console.warn("REGENERATE WORKOUT ERROR:", err);
      showAlert('Customization Error', 'Failed to customize workouts. Please check your network connection.');
    } finally {
      setIsGeneratingWorkout(false);
    }
  }, [userId]);

  useEffect(() => {
    const loadCachedOrFetchWorkouts = async () => {
      try {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // 1. Check local cache first — shows real data instantly
        const cachedRaw = await AsyncStorage.getItem("ms_workouts_cache");
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (String(parsed.userId) === String(userId) && Array.isArray(parsed.workouts) && parsed.workouts.length > 0) {
            setWorkoutRoutines(parsed.workouts);
            setIsLoadingWorkouts(false);
            if (parsed.date === todayStr) return; // Fresh cache — no network needed
          }
        }
        // 2. Fetch fresh data silently in background
        const res = await fetch(
          `${API_URL}/workouts/recommend/${userId || "default"}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setWorkoutRoutines(data);
          }
          await AsyncStorage.setItem(
            "ms_workouts_cache",
            JSON.stringify({
              userId,
              date: todayStr,
              workouts: data,
            }),
          );
        }
      } catch (err) {
        if (__DEV__) console.log("WORKOUT SILENT BG FETCH ERROR:", err);
      } finally {
        setIsLoadingWorkouts(false);
      }
    };

    if (userId) {
      loadCachedOrFetchWorkouts();
    } else {
      setIsLoadingWorkouts(false);
      setLoading(false);
    }
  }, [userId]);

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);

  const handleStartTutorialEngine = (routine) => {
    if (!routine) return;

    let tutorials = routine.tutorials;
    if (!Array.isArray(tutorials) || tutorials.length === 0) {
      const rTitle = routine.title || 'Home Workout';
      tutorials = [
        {
          name: `${rTitle} - Warm-up & Prep`,
          target: "3 Sets x 45 Seconds",
          setup: "Stand tall in an open area with knees slightly bent and core engaged.",
          form: "Maintain steady breathing. Keep movements smooth, controlled, and engage your core throughout."
        },
        {
          name: `${rTitle} - Main Power Set`,
          target: "4 Sets x 12 Reps",
          setup: "Position your feet shoulder-width apart, spine aligned and chest open.",
          form: "Inhale as you lower down, press firmly through your heels to return up, squeezing target muscles at the top."
        },
        {
          name: `${rTitle} - Burnout & Cool-down`,
          target: "2 Sets x 60 Seconds",
          setup: "Lower down onto your yoga mat or clean floor, keeping hands aligned with shoulders.",
          form: "Hold steady isometric tension, breathing slowly into your diaphragm to regulate heart rate."
        }
      ];
    }

    setActiveRoutine({
      ...routine,
      tutorials,
      caloriesBurn: routine.caloriesBurn || routine.caloriesBurned || 200
    });
    setCurrentStepIndex(0);
  };

  const handleExitWorkout = () => {
    showAlert(
      "End Workout Early?",
      "Are you sure you want to exit? Your current workout progress will not be logged.",
      [
        {
          text: "Keep Going",
          style: "cancel"
        },
        {
          text: "Quit Workout",
          style: "destructive",
          onPress: () => setActiveRoutine(null)
        }
      ]
    );
  };

  const handleNextStep = async () => {
    if (currentStepIndex < activeRoutine?.tutorials?.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      if (!userId) {
        showAlert("Authentication Error", "You must be logged in to log workouts.");
        return;
      }

      // Optimistic UI updates
      const workoutDuration = parseInt(activeRoutine.duration) || 15;
      const workoutSteps = workoutDuration * 100;
      const newExercise = {
        caloriesBurned: ((dailyExercise?.caloriesBurned || 0) + (activeRoutine?.caloriesBurn || 0)),
        activeMinutes: ((dailyExercise?.activeMinutes || 0) + workoutDuration),
        steps: ((dailyExercise?.steps || 0) + workoutSteps),
        targetSteps: dailyExercise?.targetSteps || 10000,
        recentExercise: activeRoutine?.title || 'Workout'
      };

      if (setDailyExercise) {
        setDailyExercise(prev => ({
          ...prev,
          ...newExercise
        }));
      }

      if (activeRoutine) {
        await pushNotificationIfAllowed({
          id: `n-${Date.now()}`,
          title: 'Workout Completed! 🏋️‍♂️',
          category: 'workout',
          time: 'Just Now',
          read: false,
          message: `Motivational update: Awesome job! You burned ${activeRoutine.caloriesBurn} calories completing "${activeRoutine.title}".`
        }, setNotifications);
      }

      const workoutPayload = {
        id: Date.now().toString(),
        user_id: userId,
        name: activeRoutine.title,
        calories_burned: activeRoutine.caloriesBurn,
        active_minutes: workoutDuration
      };

      if (!isOnline) {
        await addToSyncQueue({ type: 'LOG_WORKOUT', payload: workoutPayload });
        if (newExercise) {
          await updateCachedDashboardField(userId, { exercise: newExercise });
        }
        showAlert(
          "Workout Complete! (Offline)",
          `Awesome work! You crushed "${activeRoutine?.title}". Since you are offline, it was saved locally and will sync later.`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null) }]
        );
        return;
      }

      try {
        const response = await fetch(`${API_URL}/workouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workoutPayload),
        });

        if (!response.ok) {
          throw new Error('Failed to log workout on server');
        }

        if (onRefreshDashboard) {
          onRefreshDashboard();
        }

        showAlert(
          "Workout Complete!",
          `Awesome work! You crushed "${activeRoutine?.title}" and logged ${activeRoutine?.caloriesBurn} kcal into MacroSync!`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null) }]
        );
      } catch (error) {
        if (__DEV__) console.warn("LOG WORKOUT API ERROR (falling back to queue):", error);
        await addToSyncQueue({ type: 'LOG_WORKOUT', payload: workoutPayload });
        if (newExercise) {
          await updateCachedDashboardField(userId, { exercise: newExercise });
        }
        showAlert(
          "Workout Saved Locally",
          `Could not reach the server. "${activeRoutine?.title}" has been saved locally and will sync later.`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null) }]
        );
      }
    }
  };

  const filteredWorkouts = workoutRoutines.filter(workout => {
    return selectedIntensity === 'All' || workout.intensity === selectedIntensity;
  });



  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />
      
      {/* ── WORKOUT TUTORIAL PLAYER (FULL SCREEN MODAL) ── */}
      <Modal 
        visible={activeRoutine !== null} 
        transparent={false} 
        animationType="slide" 
        onRequestClose={handleExitWorkout}
      >
        {Boolean(activeRoutine) && (
          <View style={styles.playerWrapper}>
            {/* PLAYER HEADER AREA */}
            <View style={styles.playerHeaderRow}>
              <TouchableOpacity 
                style={styles.playerBackNeuButton}
                activeOpacity={0.8}
                onPress={handleExitWorkout}
              >
                <ArrowLeft color={logoGreen} size={20} strokeWidth={2.5} />
              </TouchableOpacity>
              <View style={styles.playerHeaderCenterText}>
                <Text style={styles.playerRoutineSubTitle}>{activeRoutine.title}</Text>
                <Text style={styles.playerStepIndicator}>Exercise {currentStepIndex + 1} of {activeRoutine.tutorials.length}</Text>
              </View>
              <TouchableOpacity 
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}
                onPress={() => handleStartRestTimer(45)}
                activeOpacity={0.7}
              >
                <Clock color={logoGreen} size={18} />
              </TouchableOpacity>
            </View>

            {/* PROGRESS BAR TRACK */}
            <View style={{ height: 4, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', width: '100%', marginBottom: 12 }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: logoGreen, 
                width: `${((currentStepIndex + 1) / activeRoutine.tutorials.length) * 100}%`,
                borderRadius: 2 
              }} />
            </View>

            {/* PLAYER MAIN EXERCISE CARD VIEWPORT */}
            <View style={styles.playerMainCard}>
              
              {/* TUTORIAL STATUS PILL */}
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <View style={[styles.liveActivityBadge, { position: 'relative', top: 0, left: 0 }]}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.liveBadgeText}>
                    {isTimerRunning ? `REST TIMER: 00:${restTimer < 10 ? '0' : ''}${restTimer}` : 'TUTORIAL GUIDE ACTIVE'}
                  </Text>
                </View>
              </View>

              {/* EXERCISE TITLE & METRIC SCORES */}
              <Text style={[styles.playerExerciseTitle, { textAlign: 'center', fontSize: 22, fontWeight: '900', marginBottom: 10 }]}>
                {activeRoutine.tutorials[currentStepIndex].name}
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <View style={styles.targetMetricChipBox}>
                  <Trophy color="#FFFFFF" size={14} fill="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.targetMetricChipText}>{activeRoutine.tutorials[currentStepIndex].target}</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.targetMetricChipBox, { backgroundColor: isTimerRunning ? '#F59E0B' : '#0EA5E9' }]}
                  onPress={() => isTimerRunning ? setIsTimerRunning(false) : handleStartRestTimer(45)}
                  activeOpacity={0.8}
                >
                  <Clock color="#FFFFFF" size={14} style={{ marginRight: 6 }} />
                  <Text style={styles.targetMetricChipText}>
                    {isTimerRunning ? `Rest: ${restTimer}s` : '⏱️ 45s Rest Timer'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.playerGlassDivider} />

              {/* EXPANDED INSTRUCTION MANUAL TEXTS */}
              <ScrollView showsVerticalScrollIndicator={false} style={styles.instructionsTextScroll}>
                <View style={{
                  backgroundColor: theme?.surface || (isDarkMode ? '#1E293B' : '#F8FAFC'),
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1.2,
                  borderColor: theme?.border || (isDarkMode ? '#334155' : '#E2E8F0')
                }}>
                  <Text style={[styles.instructionSectionTitleLabel, { color: logoGreen, marginBottom: 6 }]}>How to Set Up:</Text>
                  <Text style={styles.instructionParagraphText}>{activeRoutine.tutorials[currentStepIndex].setup}</Text>
                </View>
                
                <View style={{
                  backgroundColor: theme?.surface || (isDarkMode ? '#1E293B' : '#F8FAFC'),
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1.2,
                  borderColor: theme?.border || (isDarkMode ? '#334155' : '#E2E8F0')
                }}>
                  <Text style={[styles.instructionSectionTitleLabel, { color: '#0EA5E9', marginBottom: 6 }]}>Proper Execution Form:</Text>
                  <Text style={styles.instructionParagraphText}>{activeRoutine.tutorials[currentStepIndex].form}</Text>
                </View>
              </ScrollView>

              <View style={styles.playerGlassDivider} />

              {/* CONTROLS TOGGLE HUB BUTTONS */}
              <View style={styles.playerControlActionRow}>
                {currentStepIndex > 0 && (
                  <TouchableOpacity 
                    style={styles.playerSecondaryNeuActionBtn} 
                    activeOpacity={0.8}
                    onPress={() => setCurrentStepIndex(currentStepIndex - 1)}
                  >
                    <RotateCcw color={theme?.textSecondary || "#64748B"} size={16} style={{ marginRight: 4 }} />
                    <Text style={styles.playerSecondaryActionBtnText}>Previous</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={[styles.playerPrimaryActionBtn, { flex: currentStepIndex === 0 ? 1 : 1.3 }]} 
                  activeOpacity={0.8}
                  onPress={handleNextStep}
                >
                  <CheckCircle2 color="#FFFFFF" size={16} style={{ marginRight: 6 }} />
                  <Text style={styles.playerPrimaryActionBtnText}>
                    {currentStepIndex === activeRoutine.tutorials.length - 1 ? 'Complete Workout' : 'Next Exercise Step'}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        )}
      </Modal>

      {/* STANDARD ROUTINES SELECTION HUB LIST VIEW */}
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER BRANDING SECTION */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.appName}>MacroSync</Text>
            <Text style={styles.greeting}>Daily Home Workouts</Text>
            <Text style={styles.subGreeting}>Zero-equipment home workout routines</Text>
          </View>
        </View>

        {/* OVER-EXERCISING / ACTIVE RECOVERY SMART ALERT BANNER */}
        {((dailyExercise?.caloriesBurned || 0) >= 500 || (dailyExercise?.activeMinutes || 0) >= 60) && (
          <View style={[styles.formCard, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)', borderWidth: 1, marginBottom: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ backgroundColor: '#F59E0B', padding: 8, borderRadius: 12, marginRight: 12, marginTop: 2 }}>
                <Flame color="#FFFFFF" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#F59E0B', marginBottom: 2 }}>
                  Active Recovery Recommended 🧘
                </Text>
                <Text style={{ fontSize: 12, color: theme?.textSecondary || '#64748B', lineHeight: 17 }}>
                  Great effort today! You burned {dailyExercise?.caloriesBurned || 0} kcal across {dailyExercise?.activeMinutes || 0} active minutes. Consider taking a light rest or stretching day tomorrow to prevent overtraining.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* WORKOUT INTENSITY FILTER CHOICES */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Exercise Intensity Preferences</Text>

          <View style={styles.filterButtonGroupRow}>
            {intensityTiers.map((tier) => (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.filterChipButton, 
                  selectedIntensity === tier ? styles.filterChipActive : styles.filterChipInactive
                ]}
                onPress={() => setSelectedIntensity(tier)}
              >
                <Text style={[
                  styles.filterChipText, 
                  { color: selectedIntensity === tier ? '#FFFFFF' : (theme?.textPrimary || '#0F172A') }
                ]}>
                  {tier}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* WORKOUT PLAN CARD LISTINGS */}
        <Text style={styles.sectionLabelTitle}>Your Tailored Home Routines</Text>

        {/* Skeleton placeholders while loading */}
        {isLoadingWorkouts && workoutRoutines.length === 0 && (
          <View style={{ gap: 14, marginBottom: 16 }}>
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={`skel-${i}`} height={140} borderRadius={20} />
            ))}
          </View>
        )}

        {filteredWorkouts.map((workout, staggerIndex) => {
          if (!workout) return null;
          return (
            <StaggerCard
              key={workout.id}
              index={staggerIndex}
            >
            <PressableCard
              style={styles.workoutFormCard}
              onPress={() => handleStartTutorialEngine(workout)}
              scaleDown={0.97}
            >
              <View style={styles.workoutHeaderRow}>
                <View style={styles.workoutTitleContainer}>
                  <Text style={styles.workoutMainTitle}>{workout.title}</Text>
                  <Text style={styles.workoutDescriptionText}>{workout.description}</Text>
                </View>
              </View>

              <View style={styles.glassDivider} />

              {/* QUICK METRICS TILES */}
              <View style={styles.workoutMetricsSummaryGrid}>
                <View style={styles.metricItemBox}>
                  <View style={{ backgroundColor: "rgba(14, 165, 233, 0.12)", borderRadius: 8, padding: 5, marginRight: 8 }}>
                    <Clock color={"#0EA5E9"} size={13} />
                  </View>
                  <View>
                    <Text style={styles.metricTileLabel}>Duration</Text>
                    <Text style={[styles.metricTileValue, { color: "#0EA5E9" }]}>
                      {workout.duration}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.metricItemBox}>
                  <View style={{ backgroundColor: "rgba(249, 115, 22, 0.12)", borderRadius: 8, padding: 5, marginRight: 8 }}>
                    <Flame color={"#F97316"} size={13} />
                  </View>
                  <View>
                    <Text style={styles.metricTileLabel}>Est. Burn</Text>
                    <Text style={[styles.metricTileValue, { color: "#F97316" }]}>
                      {workout?.caloriesBurn ?? workout?.caloriesBurned} kcal
                    </Text>
                  </View>
                </View>

                <View style={styles.metricItemBox}>
                  <View style={{ backgroundColor: "rgba(245, 158, 11, 0.12)", borderRadius: 8, padding: 5, marginRight: 8 }}>
                    <Trophy color={"#F59E0B"} size={13} />
                  </View>
                  <View>
                    <Text style={styles.metricTileLabel}>Intensity</Text>
                    <Text style={[styles.metricTileValue, { color: "#F59E0B" }]}>
                      {workout?.intensity}
                    </Text>
                  </View>
                </View>
              </View>

              {/* LAUNCH BUTTON */}
              <TouchableOpacity 
                style={styles.startWorkoutActionButton} 
                activeOpacity={0.8}
                onPress={() => handleStartTutorialEngine(workout)}
              >
                <Play color="#FFFFFF" size={14} fill="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.startWorkoutButtonText}>Begin Active Routine</Text>
              </TouchableOpacity>
            </PressableCard>
            </StaggerCard>
          );
        })}

      </ScrollView>

      {/* UIverse Inspired AI Customization Loading Modal */}
      <AILoadingModal
        visible={isGeneratingWorkout || loading}
        type="workout"
        title="Customizing Workout Routine"
        subtitle="Vita AI is calculating optimal home exercises"
      />
    </View>
  );
}
