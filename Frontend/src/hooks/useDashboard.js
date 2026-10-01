import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Pedometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCustomAlert } from "../context/CustomAlertContext";
import API_URL from "../screens/config/api";
import {
  addToSyncQueue,
  updateCachedDashboardField,
} from "../services/OfflineStorage";

const baseColor = "#F8FAFC";
const logoGreen = "#10B981";

// Helper for local notification filtering
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

export default function useDashboard({
  userBaseline,
  userGoals,
  dailyNutrition,
  dailyExercise,
  setDailyExercise,
  notifications = [],
  setNotifications,
  globalLoggedWeight,
  setGlobalLoggedWeight,
  globalConsumedGlasses,
  setGlobalConsumedGlasses,
  userProfile,
  userId,
  onRefreshDashboard,
  isOnline = true,
  localStartingWeight,
  setLocalStartingWeight,
  localGoalWeight,
  setLocalGoalWeight,
  localGoalLabel,
  setLocalGoalLabel,
  goalReachedAlertShown,
  setGoalReachedAlertShown,
  weightHistory,
  setWeightHistory,
  theme,
  isDarkMode,
}) {
  const { showAlert } = useCustomAlert();

  // State Modals & Inputs
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [imageError, setImageError] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [selectedNewGoalOption, setSelectedNewGoalOption] = useState(null);
  const [weightChangeKg, setWeightChangeKg] = useState("5");
  const [waterRipples, setWaterRipples] = useState([]);

  useEffect(() => {
    setImageError(false);
  }, [userProfile?.profileImage]);

  // Pedometer sensor setup
  const pedometerBaseRef = useRef(null);
  const pedometerSubRef = useRef(null);

  useEffect(() => {
    let active = true;
    const startPedometer = async () => {
      try {
        const { status } = await Pedometer.requestPermissionsAsync();
        if (status !== "granted") return;
        const isAvailable = await Pedometer.isAvailableAsync();
        if (!isAvailable) return;

        pedometerBaseRef.current = null;
        pedometerSubRef.current = Pedometer.watchStepCount((result) => {
          if (!active) return;
          if (pedometerBaseRef.current === null) {
            pedometerBaseRef.current = result.steps;
          }
          const sessionSteps = result.steps - pedometerBaseRef.current;
          if (sessionSteps > 0 && setDailyExercise) {
            setDailyExercise((prev) => {
              const prevBase = prev?._pedometerBase ?? 0;
              const alreadyAdded = prev?._pedometerAdded ?? 0;
              const newAdded = sessionSteps;
              const delta = newAdded - alreadyAdded;
              if (delta <= 0) return prev;
              return {
                ...prev,
                steps: (prev?.steps || 0) + delta,
                caloriesBurned:
                  (prev?.caloriesBurned || 0) + Math.round(delta * 0.04),
                activeMinutes:
                  (prev?.activeMinutes || 0) + Math.round(delta / 100),
                _pedometerBase: prevBase,
                _pedometerAdded: newAdded,
              };
            });
          }
        });
      } catch (err) {
        if (__DEV__) console.log("Pedometer error:", err);
      }
    };

    startPedometer();
    return () => {
      active = false;
      if (pedometerSubRef.current) {
        pedometerSubRef.current.remove();
        pedometerSubRef.current = null;
      }
    };
  }, [setDailyExercise]);

  // Memoized User & Goal Stats
  const weightUnit = userBaseline?.unit || "kg";
  const consumedGlasses =
    globalConsumedGlasses !== undefined ? globalConsumedGlasses : 0;
  const weightKg =
    weightUnit === "lbs"
      ? parseFloat(userBaseline?.weight || 154) / 2.20462
      : parseFloat(userBaseline?.weight || 70);
  const heightCm = parseFloat(userBaseline?.height || 170);

  const recommendedWaterMl = useMemo(() => {
    return weightKg * 35 + Math.max(0, heightCm - 150) * 10;
  }, [weightKg, heightCm]);

  const targetGlasses = useMemo(() => {
    return Math.min(15, Math.max(6, Math.round(recommendedWaterMl / 250)));
  }, [recommendedWaterMl]);

  const currentStreak = userProfile?.streakDays || 0;
  const primaryGoal =
    localGoalLabel ||
    (userGoals?.goal === "muscle" || userGoals?.goal === "Build Muscle"
      ? "Build Muscle"
      : userGoals?.goal === "maintain" || userGoals?.goal === "Maintain Weight"
        ? "Maintain Weight"
        : "Lose Weight");
  const startingWeight =
    localStartingWeight !== null
      ? localStartingWeight
      : parseFloat(userBaseline?.startingWeight || userBaseline?.weight || 70);
  const currentWeight =
    globalLoggedWeight !== null ? globalLoggedWeight : startingWeight;
  const goalWeight =
    localGoalWeight !== null
      ? localGoalWeight
      : parseFloat(
          userGoals?.goalWeight ||
            userBaseline?.targetWeight ||
            userBaseline?.weight ||
            currentWeight ||
            60,
        );
  const weightChange = currentWeight - startingWeight;

  const progressPct = useMemo(() => {
    const totalDiff = goalWeight - startingWeight;
    const currentDiff = currentWeight - startingWeight;
    let pct = totalDiff === 0 ? 0 : currentDiff / totalDiff;
    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;
    return pct;
  }, [goalWeight, startingWeight, currentWeight]);

  // Goal Completion Check
  const activeGoalType =
    userGoals?.goal ||
    (primaryGoal.toLowerCase().includes("muscle") ||
    primaryGoal.toLowerCase().includes("gain")
      ? "muscle"
      : primaryGoal.toLowerCase().includes("maintain")
        ? "maintain"
        : "fatloss");

  const isGoalAchieved = useMemo(() => {
    if (activeGoalType === "maintain") return false;
    if (globalLoggedWeight === null) return false;

    const totalDiff = Math.abs(goalWeight - startingWeight);
    if (totalDiff < 0.5) return false;

    if (Math.abs(currentWeight - startingWeight) < 0.2) return false;

    if (activeGoalType === "muscle") {
      return (
        goalWeight > startingWeight &&
        currentWeight >= goalWeight &&
        currentWeight > startingWeight
      );
    }

    if (activeGoalType === "fatloss") {
      return (
        goalWeight < startingWeight &&
        currentWeight <= goalWeight &&
        currentWeight < startingWeight
      );
    }

    return false;
  }, [globalLoggedWeight, currentWeight, goalWeight, startingWeight, activeGoalType]);

  useEffect(() => {
    if (isGoalAchieved && !goalReachedAlertShown) {
      if (setGoalReachedAlertShown) setGoalReachedAlertShown(true);
      setShowNewGoalModal(true);
    }
  }, [isGoalAchieved, goalReachedAlertShown, setGoalReachedAlertShown]);

  // Water Intake Action
  const handleAddGlass = useCallback(async () => {
    setWaterRipples((prev) => [...prev, Date.now()]);
    const newAmount = consumedGlasses + 1;
    if (!userId) {
      showAlert("Authentication Error", "You must be logged in to log water.");
      return;
    }

    const logWaterAction = async () => {
      if (setGlobalConsumedGlasses) setGlobalConsumedGlasses(newAmount);
      if (newAmount === targetGlasses) {
        await pushNotificationIfAllowed(
          {
            id: `n-${Date.now()}`,
            title: "Hydration Goal Reached!",
            category: "hydration",
            time: "Just Now",
            read: false,
            message:
              "Great job hitting your AI-recommended water intake for the day! Staying hydrated is essential.",
          },
          setNotifications,
        );
      }

      if (!isOnline) {
        await addToSyncQueue({
          type: "LOG_WATER",
          payload: { user_id: userId, glasses: newAmount },
        });
        await updateCachedDashboardField(userId, {
          water: { glasses: newAmount },
        });
        return;
      }

      try {
        const response = await fetch(`${API_URL}/water`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, glasses: newAmount }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to log water on server");
        }
      } catch (error) {
        if (__DEV__) console.error("LOG WATER ERROR:", error);
        await addToSyncQueue({
          type: "LOG_WATER",
          payload: { user_id: userId, glasses: newAmount },
        });
        await updateCachedDashboardField(userId, {
          water: { glasses: newAmount },
        });
      }
    };

    if (consumedGlasses >= targetGlasses) {
      showAlert(
        "Hydration Target Reached",
        "You have already reached your daily water intake quota. Drinking too much water can be harmful. Do you want to log another glass?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log Anyway", onPress: logWaterAction },
        ],
      );
    } else {
      await logWaterAction();
    }
  }, [
    consumedGlasses,
    userId,
    targetGlasses,
    isOnline,
    setGlobalConsumedGlasses,
    setNotifications,
    showAlert,
  ]);

  // Select New Goal Handler
  const handleSelectNewGoal = useCallback(
    async (option) => {
      const achievedWeight = goalWeight;
      if (setGlobalLoggedWeight) setGlobalLoggedWeight(achievedWeight);

      const newStarting = achievedWeight;
      const newGoal =
        option.targetWeight !== undefined
          ? option.targetWeight
          : option.offsetKg !== undefined
            ? achievedWeight + option.offsetKg
            : achievedWeight;

      setLocalStartingWeight(newStarting);
      setLocalGoalWeight(newGoal);
      setLocalGoalLabel(option.label);
      if (setGoalReachedAlertShown) setGoalReachedAlertShown(true);
      setShowNewGoalModal(false);
      setSelectedNewGoalOption(null);

      if (setWeightHistory) {
        setWeightHistory(
          Array.from({ length: 7 }, () => parseFloat(achievedWeight.toFixed(1))),
        );
      }

      if (setNotifications) {
        setNotifications((prev) => [
          {
            id: "ng-" + Date.now(),
            title: "New Goal Set!",
            category: "achievement",
            time: "Just Now",
            read: false,
            message: `Your weight goal has been reset. New target: ${option.label}. Starting from ${newStarting.toFixed(1)} ${weightUnit} → ${newGoal.toFixed(1)} ${weightUnit}. Let's go!`,
          },
          ...prev,
        ]);
      }

      if (isOnline && userId) {
        try {
          const targetDateObj = new Date();
          targetDateObj.setDate(targetDateObj.getDate() + 90);
          const formattedTargetDate = `${String(targetDateObj.getMonth() + 1).padStart(2, "0")}/${String(targetDateObj.getDate()).padStart(2, "0")}/${targetDateObj.getFullYear()}`;

          const response = await fetch(`${API_URL}/save-onboarding`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              age: parseInt(userBaseline?.age || 25, 10),
              weight_kg: achievedWeight,
              height_cm: parseFloat(userBaseline?.height || 170),
              goal: option.id,
              goal_weight: newGoal,
              target_date: formattedTargetDate,
              weight_unit: userBaseline?.unit || "kg",
              starting_weight: achievedWeight,
            }),
          });

          if (response.ok && onRefreshDashboard) {
            onRefreshDashboard();
          }
        } catch (e) {
          if (__DEV__) console.log("NEW GOAL PERSIST ERROR:", e);
        }
      }
    },
    [
      goalWeight,
      weightUnit,
      isOnline,
      userId,
      userBaseline,
      setGlobalLoggedWeight,
      setNotifications,
      onRefreshDashboard,
      setLocalStartingWeight,
      setLocalGoalWeight,
      setLocalGoalLabel,
      setGoalReachedAlertShown,
      setWeightHistory,
    ],
  );

  // Macro Calculation
  const { targetCalories, targetProtein, targetCarbs, targetFats } =
    useMemo(() => {
      let tCal = 2000,
        tProt = 150,
        tCarb = 225,
        tFat = 55;
      if (
        userBaseline?.weight &&
        userBaseline?.height &&
        userBaseline?.age &&
        userGoals?.activityLevel
      ) {
        const w = parseFloat(userBaseline.weight);
        const h = parseFloat(userBaseline.height);
        const a = parseInt(userBaseline.age, 10);
        let bmr = 10 * w + 6.25 * h - 5 * a + 5;
        let mult = 1.2;
        if (userGoals.activityLevel === "moderate") mult = 1.55;
        if (userGoals.activityLevel === "active") mult = 1.725;
        let tdee = bmr * mult;
        if (userGoals.goal === "muscle") tdee += 300;
        if (userGoals.goal === "fatloss") tdee -= 500;
        tCal = Math.round(tdee);
        tProt = Math.round((tCal * 0.3) / 4);
        tCarb = Math.round((tCal * 0.45) / 4);
        tFat = Math.round((tCal * 0.25) / 9);
      }
      return {
        targetCalories: tCal,
        targetProtein: tProt,
        targetCarbs: tCarb,
        targetFats: tFat,
      };
    }, [userBaseline, userGoals]);

  const nutrition = dailyNutrition || {
    consumedCalories: 0,
    protein: { current: 0 },
    carbs: { current: 0 },
    fats: { current: 0 },
  };
  const exercise2BurnedCalories = dailyExercise?.caloriesBurned || 0;
  const netCalories2 = Math.max(
    0,
    (nutrition.consumedCalories || 0) - exercise2BurnedCalories,
  );
  let nutritionPct =
    targetCalories === 0 ? 0 : netCalories2 / targetCalories;
  if (nutritionPct < 0) nutritionPct = 0;
  if (nutritionPct > 1) nutritionPct = 1;

  const macros = [
    {
      label: "Protein",
      current: nutrition.protein?.current || 0,
      target: targetProtein,
      color: logoGreen,
      unit: "g",
    },
    {
      label: "Carbs",
      current: nutrition.carbs?.current || 0,
      target: targetCarbs,
      color: "#F59E0B",
      unit: "g",
    },
    {
      label: "Fats",
      current: nutrition.fats?.current || 0,
      target: targetFats,
      color: "#EC4899",
      unit: "g",
    },
  ];

  const exercise = dailyExercise || {
    caloriesBurned: 320,
    activeMinutes: 45,
    targetMinutes: 60,
    recentExercise: "Morning Jog",
  };
  const currentSteps = dailyExercise?.steps ?? 0;

  // Chart configuration & data
  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: theme?.surface || baseColor,
      backgroundGradientTo: theme?.surface || baseColor,
      color: (opacity = 1) =>
        isDarkMode
          ? `rgba(52, 211, 153, ${opacity})`
          : `rgba(16, 185, 129, ${opacity})`,
      labelColor: (opacity = 1) =>
        isDarkMode
          ? `rgba(148, 163, 184, ${opacity})`
          : `rgba(100, 116, 139, ${opacity})`,
      strokeWidth: 3,
      barPercentage: 0.5,
      useShadowColorFromDataset: false,
      propsForDots: {
        r: "5",
        strokeWidth: "2.5",
        stroke: logoGreen,
        fill: theme?.surface || "#FFFFFF",
      },
      propsForBackgroundLines: {
        strokeDasharray: "4 4",
        stroke: theme?.border || "#E2E8F0",
        strokeWidth: 1,
      },
      decimalPlaces: 1,
    }),
    [theme, isDarkMode],
  );

  const {
    rollingLabels,
    weightDataPoints,
    maxWeeklyWeight,
    minWeeklyWeight,
    netWeeklyChange,
    weightChartData,
  } = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayIndex = new Date().getDay();
    const labels = Array.from({ length: 7 }, (_, i) => {
      const d = (todayIndex - 6 + i + 7) % 7;
      return dayNames[d];
    });

    const fallbackStart = startingWeight;
    const points =
      weightHistory && weightHistory.length === 7
        ? weightHistory
        : Array.from({ length: 6 }, () => fallbackStart).concat([
            currentWeight,
          ]);

    const maxW = Math.max(...points).toFixed(1);
    const minW = Math.min(...points).toFixed(1);
    const netChange = (points[points.length - 1] - points[0]).toFixed(1);

    return {
      rollingLabels: labels,
      weightDataPoints: points,
      maxWeeklyWeight: maxW,
      minWeeklyWeight: minW,
      netWeeklyChange: netChange,
      weightChartData: {
        labels,
        datasets: [{ data: points, color: () => logoGreen, strokeWidth: 3 }],
      },
    };
  }, [startingWeight, weightHistory, currentWeight]);

  const greetingObj = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: "Good Morning" };
    if (hour >= 12 && hour < 18) return { text: "Good Afternoon" };
    return { text: "Good Evening" };
  }, []);

  const currentDateStr = useMemo(() => {
    return new Date()
      .toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
      .toUpperCase();
  }, []);

  const rawName = userProfile?.name || "User";
  const displayName =
    rawName.length > 14 ? `${rawName.substring(0, 12)}...` : rawName;

  const getGoalProgressColor = useCallback(
    (delta) => {
      if (delta === 0) return theme?.textSecondary || "#94A3B8";
      const goalType =
        userGoals?.goal ||
        (primaryGoal.toLowerCase().includes("muscle") ||
        primaryGoal.toLowerCase().includes("gain")
          ? "muscle"
          : primaryGoal.toLowerCase().includes("maintain")
            ? "maintain"
            : "fatloss");

      if (goalType === "muscle") {
        return delta > 0 ? logoGreen : "#EF4444";
      } else if (goalType === "maintain") {
        return Math.abs(delta) <= 1.0 ? logoGreen : "#F59E0B";
      } else {
        return delta < 0 ? logoGreen : "#EF4444";
      }
    },
    [theme, userGoals, primaryGoal],
  );

  const executeWeightSave = useCallback(
    async (parsed) => {
      if (setGlobalLoggedWeight) setGlobalLoggedWeight(parsed);
      const totalDiff = Math.abs(goalWeight - startingWeight);
      const isNewWeightAchieved =
        activeGoalType !== "maintain" &&
        totalDiff >= 0.5 &&
        Math.abs(parsed - startingWeight) >= 0.2 &&
        ((activeGoalType === "muscle" &&
          goalWeight > startingWeight &&
          parsed >= goalWeight) ||
          (activeGoalType === "fatloss" &&
            goalWeight < startingWeight &&
            parsed <= goalWeight));

      if (isNewWeightAchieved) {
        if (setGoalReachedAlertShown) setGoalReachedAlertShown(false);
        setShowNewGoalModal(true);
      } else if (setGoalReachedAlertShown) {
        setGoalReachedAlertShown(false);
      }
      if (setWeightHistory) {
        setWeightHistory((prev) => {
          const base =
            prev && prev.length === 7
              ? [...prev]
              : Array.from({ length: 6 }, () => startingWeight).concat([
                  currentWeight,
                ]);
          base[6] = parseFloat(parsed.toFixed(1));
          return base;
        });
      }
      setShowWeightModal(false);
      await pushNotificationIfAllowed(
        {
          id: "w" + Date.now(),
          title: "Weight Logged",
          category: "achievement",
          time: "Just Now",
          read: false,
          message: `Successfully logged your weight as ${parsed.toFixed(1)} ${weightUnit}. Keep up the great work!`,
        },
        setNotifications,
      );

      if (!isOnline) {
        await addToSyncQueue({
          type: "LOG_WEIGHT",
          payload: {
            user_id: userId,
            new_weight: parsed,
            unit: userBaseline?.unit || "kg",
          },
        });
        await updateCachedDashboardField(userId, {
          profile: { currentWeight: parsed },
        });
        showAlert(
          "Saved Offline",
          "Weight saved locally. Will sync when back online.",
        );
        return;
      }

      try {
        const response = await fetch(`${API_URL}/update-weight`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            new_weight: parsed,
            unit: userBaseline?.unit || "kg",
          }),
        });
        if (response.ok && onRefreshDashboard) {
          onRefreshDashboard();
        } else if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          showAlert(
            "Error Logging Weight",
            errData.detail || "Failed to log weight to server.",
          );
        }
      } catch (error) {
        if (__DEV__) console.log("LOG WEIGHT ERROR:", error);
        await addToSyncQueue({
          type: "LOG_WEIGHT",
          payload: {
            user_id: userId,
            new_weight: parsed,
            unit: userBaseline?.unit || "kg",
          },
        });
        await updateCachedDashboardField(userId, {
          profile: { currentWeight: parsed },
        });
      }
    },
    [
      setGlobalLoggedWeight,
      goalWeight,
      startingWeight,
      activeGoalType,
      setGoalReachedAlertShown,
      setWeightHistory,
      currentWeight,
      weightUnit,
      setNotifications,
      isOnline,
      userId,
      userBaseline?.unit,
      showAlert,
      onRefreshDashboard,
    ],
  );

  const handleSaveWeightInput = useCallback(() => {
    const parsed = parseFloat(weightInput);
    const minVal = weightUnit === "lbs" ? 55 : 25;
    const maxVal = weightUnit === "lbs" ? 660 : 300;
    if (isNaN(parsed) || parsed < minVal || parsed > maxVal) {
      showAlert(
        "Invalid Weight Input",
        `Please enter a realistic weight value between ${minVal} ${weightUnit} and ${maxVal} ${weightUnit}.`,
      );
      return;
    }

    const thresholdJump = weightUnit === "lbs" ? 11.0 : 5.0;
    const weightJump = Math.abs(parsed - currentWeight);
    if (currentWeight > 0 && weightJump >= thresholdJump) {
      showAlert(
        "Unusual Weight Jump",
        `You entered ${parsed.toFixed(1)} ${weightUnit}, which is ${weightJump.toFixed(1)} ${weightUnit} ${parsed > currentWeight ? "higher" : "lower"} than your recent weight (${currentWeight.toFixed(1)} ${weightUnit}). Are you sure?`,
        [
          { text: "Fix Input", style: "cancel" },
          { text: "Yes, Confirm", onPress: () => executeWeightSave(parsed) },
        ],
      );
      return;
    }

    executeWeightSave(parsed);
  }, [
    weightInput,
    weightUnit,
    currentWeight,
    showAlert,
    executeWeightSave,
  ]);

  return {
    // State modals & inputs
    showWeightModal,
    setShowWeightModal,
    weightInput,
    setWeightInput,
    imageError,
    setImageError,
    showNewGoalModal,
    setShowNewGoalModal,
    selectedNewGoalOption,
    setSelectedNewGoalOption,
    weightChangeKg,
    setWeightChangeKg,
    waterRipples,

    // Calculated metrics & data
    weightUnit,
    consumedGlasses,
    targetGlasses,
    recommendedWaterMl,
    weightKg,
    heightCm,
    currentStreak,
    primaryGoal,
    startingWeight,
    currentWeight,
    goalWeight,
    weightChange,
    progressPct,
    activeGoalType,
    isGoalAchieved,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
    nutrition,
    exercise2BurnedCalories,
    netCalories2,
    nutritionPct,
    macros,
    exercise,
    currentSteps,

    // Charting
    chartConfig,
    rollingLabels,
    weightDataPoints,
    maxWeeklyWeight,
    minWeeklyWeight,
    netWeeklyChange,
    weightChartData,

    // Header & identity strings
    greetingObj,
    currentDateStr,
    displayName,

    // Handlers
    handleAddGlass,
    handleSelectNewGoal,
    handleSaveWeightInput,
    executeWeightSave,
    getGoalProgressColor,
  };
}
