import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../screens/config/api";
import { getExerciseMedia } from "../data/exercises_index";
import {
  addToSyncQueue,
  updateCachedDashboardField,
} from "../services/OfflineStorage";

const pushNotificationIfAllowed = async (newNotif, setNotifications) => {
  if (!setNotifications) return;
  try {
    const stored = await AsyncStorage.getItem("@ms_notification_preferences");
    const prefs = stored
      ? JSON.parse(stored)
      : {
          habitReminders: true,
          motivationalUpdates: true,
          personalizedAlerts: true,
        };
    const category = newNotif.category;
    if (
      (category === "hydration" || category === "meal") &&
      prefs.habitReminders === false
    )
      return;
    if (
      (category === "workout" || category === "achievement") &&
      prefs.motivationalUpdates === false
    )
      return;
    if (category === "smart" && prefs.personalizedAlerts === false) return;
    setNotifications((prev) => [newNotif, ...prev]);
  } catch (e) {
    setNotifications((prev) => [newNotif, ...prev]);
  }
};

// Resolves exercise media (GIF + instructions + image) from the exercises dataset
export const enrichTutorialWithDataset = (
  tutorial,
  index = 0,
  intensity = "Moderate",
) => {
  const media = getExerciseMedia(tutorial?.name, index, intensity);
  return {
    ...tutorial,
    gif_url: tutorial?.gif_url || media?.gif_url,
    image_url: tutorial?.image_url || media?.image_url,
    instruction_steps:
      Array.isArray(tutorial?.instruction_steps) &&
      tutorial.instruction_steps.length > 0
        ? tutorial.instruction_steps
        : media?.instruction_steps || [],
    body_part: tutorial?.body_part || media?.body_part,
    target: tutorial?.target || media?.target,
    muscles: tutorial?.muscles || media?.muscles || null,
  };
};

/**
 * Calculates calorie burn using the scientific MET (Metabolic Equivalent of Task) formula:
 * Calories Burned = MET * Weight (kg) * Duration (hours)
 * Light (Core, stretch, yoga) = 3.5 MET
 * Moderate (Bodyweight calisthenics, squats) = 5.5 MET
 * Intense (HIIT, burpees, plyometrics) = 8.0 MET
 */
export const calculateMETCalories = (
  intensity,
  durationStrOrMins,
  weightKg = 70,
) => {
  let mins = 20;
  if (typeof durationStrOrMins === "number") {
    mins = durationStrOrMins;
  } else if (typeof durationStrOrMins === "string") {
    const match = durationStrOrMins.match(/\d+/);
    if (match) mins = parseInt(match[0], 10);
  }
  const safeWeight = Math.max(35, parseFloat(weightKg) || 70);
  const intens = String(intensity || "Moderate").toLowerCase();
  let met = 5.5;
  if (intens.includes("intense") || intens.includes("hiit")) {
    met = 8.0;
  } else if (
    intens.includes("light") ||
    intens.includes("stretch") ||
    intens.includes("recovery")
  ) {
    met = 3.5;
  }
  return Math.round(met * safeWeight * (mins / 60));
};

export const DEFAULT_WORKOUT_ROUTINES = [
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
        muscles: { primary: ["Quadriceps", "Glutes"], secondary: ["Hamstrings", "Core"] },
      },
      {
        name: "Incline Pushup",
        target: "3 Sets x 10 Reps",
        setup: "Hands on wall or bench.",
        form: "Lower chest to 45°; press up.",
        muscles: { primary: ["Chest", "Triceps"], secondary: ["Shoulders", "Core"] },
      },
      {
        name: "Standing High Knees",
        target: "3 Sets x 30 Secs",
        setup: "Stand tall, drive knee up.",
        form: "Pump arms and land softly.",
        muscles: { primary: ["Hip Flexors", "Core"], secondary: ["Quads", "Calves"] },
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
        muscles: { primary: ["Full Body", "Cardio"], secondary: ["Shoulders", "Calves"] },
      },
      {
        name: "Mountain Climbers",
        target: "4 Sets x 40 Secs",
        setup: "High plank, wrists under shoulders.",
        form: "Drive knees forward quickly.",
        muscles: { primary: ["Core", "Hip Flexors"], secondary: ["Chest", "Triceps"] },
      },
      {
        name: "Walking Lunges",
        target: "3 Sets x 14 Reps",
        setup: "Step forward, bend knees 90°.",
        form: "Push forward into next step.",
        muscles: { primary: ["Quadriceps", "Glutes"], secondary: ["Hamstrings", "Balance"] },
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
        muscles: { primary: ["Core", "Transverse Abs"], secondary: ["Shoulders", "Glutes"] },
      },
      {
        name: "Standard Pushups",
        target: "4 Sets x 15 Reps",
        setup: "High plank, hands shoulder-width.",
        form: "Lower chest to floor; push up.",
        muscles: { primary: ["Chest", "Triceps"], secondary: ["Shoulders", "Core"] },
      },
      {
        name: "Russian Twists",
        target: "4 Sets x 20 Reps",
        setup: "Sit back 45° with feet up.",
        form: "Twist torso side to side.",
        muscles: { primary: ["Obliques", "Core"], secondary: ["Hip Flexors", "Lower Back"] },
      },
    ],
  },
];

export const INTENSITY_TIERS = ["All", "Light", "Moderate", "Intense"];

export default function useWorkout({
  userId,
  userBaseline,
  dailyExercise,
  setDailyExercise,
  setNotifications,
  onRefreshDashboard,
  isOnline = true,
  showAlert,
}) {
  const currentWeightKg = useMemo(() => {
    return parseFloat(userBaseline?.weight || userBaseline?.startingWeight || 70);
  }, [userBaseline]);

  const [selectedIntensity, setSelectedIntensity] = useState("All");

  // --- TUTORIAL ENGINE NAVIGATION STATES ---
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mediaType, setMediaType] = useState("gif"); // 'gif' | 'image'
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaLoadError, setMediaLoadError] = useState(false);

  // --- REST TIMER STATE ---
  const [restTimer, setRestTimer] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // --- NEXT-EXERCISE COUNTDOWN STATE ---
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const pendingNextStep = useRef(null);

  // --- AI RECOMMENDATION SYSTEM STATE ---
  const [workoutRoutines, setWorkoutRoutines] = useState(DEFAULT_WORKOUT_ROUTINES);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);

  // Rest Timer Interval
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => prev - 1);
      }, 1000);
    } else if (restTimer === 0) {
      setIsTimerRunning(false);
      showAlert?.("Rest Period Complete!", "Ready for your next set or exercise step?");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, restTimer, showAlert]);

  const handleStartRestTimer = useCallback((seconds = 45) => {
    setRestTimer(seconds);
    setIsTimerRunning(true);
  }, []);

  // Derive rest time from routine intensity or explicit restTime field
  const getRestSeconds = useCallback((routine) => {
    if (routine?.restTime) return parseInt(routine.restTime) || 45;
    const intensity = (routine?.intensity || "").toLowerCase();
    if (intensity === "light") return 30;
    if (intensity === "intense") return 60;
    return 45; // Moderate default
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!countdownActive) return;
    if (countdown <= 0) {
      setCountdownActive(false);
      setCountdown(3);
      if (pendingNextStep.current) {
        pendingNextStep.current();
        pendingNextStep.current = null;
      }
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdownActive, countdown]);

  const handleRegenerateWorkouts = useCallback(async () => {
    setIsGeneratingWorkout(true);
    try {
      const res = await fetch(`${API_URL}/workouts/recommend/${userId || "default"}`, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setWorkoutRoutines(data);
        }
        const todayStr = new Date().toISOString().split("T")[0];
        const cacheKey = `ms_workouts_cache_${userId || "default"}`;
        await AsyncStorage.setItem(
          cacheKey,
          JSON.stringify({
            userId,
            date: todayStr,
            workouts: data,
          }),
        );
        showAlert?.(
          "AI Workouts Customized",
          "Your personalized home routines have been regenerated with AI!",
        );
      }
    } catch (err) {
      if (__DEV__) console.warn("REGENERATE WORKOUT ERROR:", err);
      showAlert?.(
        "Customization Error",
        "Failed to customize workouts. Please check your network connection.",
      );
    } finally {
      setIsGeneratingWorkout(false);
    }
  }, [userId, showAlert]);

  // Load cached routines or fetch silent in background
  useEffect(() => {
    const loadCachedOrFetchWorkouts = async () => {
      try {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // 1. Check local user-scoped cache first
        const cacheKey = `ms_workouts_cache_${userId || "default"}`;
        const cachedRaw = await AsyncStorage.getItem(cacheKey);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (
            String(parsed.userId) === String(userId) &&
            Array.isArray(parsed.workouts) &&
            parsed.workouts.length > 0
          ) {
            setWorkoutRoutines(parsed.workouts);
            setIsLoadingWorkouts(false);
            if (parsed.date === todayStr) return; // Fresh cache
          }
        }
        // 2. Fetch fresh data silently in background
        const res = await fetch(`${API_URL}/workouts/recommend/${userId || "default"}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setWorkoutRoutines(data);
          }
          await AsyncStorage.setItem(
            cacheKey,
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

  const handleStartTutorialEngine = useCallback((routine) => {
    if (!routine) return;

    let tutorials = routine.tutorials;
    if (!Array.isArray(tutorials) || tutorials.length === 0) {
      tutorials = [
        {
          name: "Jumping Jacks",
          target: "3 Sets x 45 Seconds",
          setup: "Stand tall in an open area with knees slightly bent and core engaged.",
          form: "Maintain steady breathing. Jump feet out while raising arms overhead.",
        },
        {
          name: "Bodyweight Squat",
          target: "4 Sets x 12 Reps",
          setup: "Position your feet shoulder-width apart, spine aligned and chest open.",
          form: "Inhale as you lower down, press firmly through your heels to return up, squeezing target muscles.",
        },
        {
          name: "Plank Hold",
          target: "2 Sets x 60 Seconds",
          setup: "Lower down onto your yoga mat or clean floor, keeping hands aligned with shoulders.",
          form: "Hold steady isometric tension, breathing slowly into your diaphragm.",
        },
      ];
    }

    const enrichedTutorials = tutorials.map((tut, idx) =>
      enrichTutorialWithDataset(tut, idx, routine.intensity),
    );

    setActiveRoutine({
      ...routine,
      tutorials: enrichedTutorials,
      caloriesBurn: routine.caloriesBurn || routine.caloriesBurned || 200,
    });
    setCurrentStepIndex(0);
    setMediaType("gif");
    setIsMediaLoading(true);
    setMediaLoadError(false);
  }, []);

  const handleExitWorkout = useCallback(() => {
    showAlert?.(
      "End Workout Early?",
      "Are you sure you want to exit? Your current workout progress will not be logged.",
      [
        {
          text: "Keep Going",
          style: "cancel",
        },
        {
          text: "Quit Workout",
          style: "destructive",
          onPress: () => setActiveRoutine(null),
        },
      ],
    );
  }, [showAlert]);

  const handleNextStep = useCallback(async () => {
    if (!activeRoutine) return;

    if (currentStepIndex < activeRoutine?.tutorials?.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setIsMediaLoading(true);
      setMediaLoadError(false);
    } else {
      if (!userId) {
        showAlert?.("Authentication Error", "You must be logged in to log workouts.");
        return;
      }

      const workoutDuration = parseInt(activeRoutine.duration) || 15;
      const workoutSteps = workoutDuration * 100;
      const routineBurn = activeRoutine?.caloriesBurn
        ? activeRoutine.caloriesBurn
        : calculateMETCalories(activeRoutine?.intensity, workoutDuration, currentWeightKg);

      const newExercise = {
        caloriesBurned: (dailyExercise?.caloriesBurned || 0) + routineBurn,
        activeMinutes: (dailyExercise?.activeMinutes || 0) + workoutDuration,
        steps: (dailyExercise?.steps || 0) + workoutSteps,
        targetSteps: dailyExercise?.targetSteps || 10000,
        recentExercise: activeRoutine?.title || "Workout",
      };

      if (setDailyExercise) {
        setDailyExercise((prev) => ({
          ...prev,
          ...newExercise,
        }));
      }

      if (activeRoutine) {
        await pushNotificationIfAllowed(
          {
            id: `n-${Date.now()}`,
            title: "Workout Completed!",
            category: "workout",
            time: "Just Now",
            read: false,
            message: `Motivational update: Awesome job! You burned ${routineBurn} calories completing "${activeRoutine.title}".`,
          },
          setNotifications,
        );
      }

      const workoutPayload = {
        id: Date.now().toString(),
        user_id: userId,
        name: activeRoutine.title,
        calories_burned: routineBurn,
        active_minutes: workoutDuration,
      };

      if (!isOnline) {
        await addToSyncQueue({ type: "LOG_WORKOUT", payload: workoutPayload });
        if (newExercise) {
          await updateCachedDashboardField(userId, { exercise: newExercise });
        }
        showAlert?.(
          "Workout Complete! (Offline)",
          `Awesome work! You crushed "${activeRoutine?.title}". Since you are offline, it was saved locally and will sync later.`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null) }],
        );
        return;
      }

      try {
        const response = await fetch(`${API_URL}/workouts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workoutPayload),
        });

        if (!response.ok) {
          throw new Error("Failed to log workout on server");
        }

        if (onRefreshDashboard) {
          onRefreshDashboard();
        }

        showAlert?.(
          "Workout Complete!",
          `Awesome work! You crushed "${activeRoutine?.title}" and logged ${activeRoutine?.caloriesBurn} kcal into MacroSync!`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null) }],
        );
      } catch (error) {
        if (__DEV__) console.warn("LOG WORKOUT API ERROR (falling back to queue):", error);
        await addToSyncQueue({ type: "LOG_WORKOUT", payload: workoutPayload });
        if (newExercise) {
          await updateCachedDashboardField(userId, { exercise: newExercise });
        }
        showAlert?.(
          "Workout Saved Locally",
          `Could not reach the server. "${activeRoutine?.title}" has been saved locally and will sync later.`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null) }],
        );
      }
    }
  }, [
    activeRoutine,
    currentStepIndex,
    userId,
    currentWeightKg,
    dailyExercise,
    setDailyExercise,
    setNotifications,
    isOnline,
    onRefreshDashboard,
    showAlert,
  ]);

  const handleNextWithCountdown = useCallback(() => {
    if (currentStepIndex >= (activeRoutine?.tutorials?.length || 0) - 1) {
      handleNextStep();
      return;
    }
    pendingNextStep.current = handleNextStep;
    setCountdown(getRestSeconds(activeRoutine));
    setCountdownActive(true);
  }, [currentStepIndex, activeRoutine, handleNextStep, getRestSeconds]);

  const filteredWorkouts = useMemo(() => {
    return workoutRoutines.filter((workout) => {
      return (
        selectedIntensity === "All" || workout?.intensity === selectedIntensity
      );
    });
  }, [workoutRoutines, selectedIntensity]);

  return {
    currentWeightKg,
    selectedIntensity,
    setSelectedIntensity,
    intensityTiers: INTENSITY_TIERS,
    activeRoutine,
    setActiveRoutine,
    currentStepIndex,
    setCurrentStepIndex,
    mediaType,
    setMediaType,
    isMediaLoading,
    setIsMediaLoading,
    mediaLoadError,
    setMediaLoadError,
    restTimer,
    isTimerRunning,
    setIsTimerRunning,
    countdownActive,
    setCountdownActive,
    countdown,
    setCountdown,
    pendingNextStep,
    workoutRoutines,
    isLoadingWorkouts,
    loading,
    isGeneratingWorkout,
    handleStartRestTimer,
    handleRegenerateWorkouts,
    handleStartTutorialEngine,
    handleExitWorkout,
    handleNextStep,
    handleNextWithCountdown,
    filteredWorkouts,
  };
}
