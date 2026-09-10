import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { Droplets, Footprints, Activity, Bell, Flame, Clock, Trophy, ChevronRight, ChevronLeft, Target } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Pedometer } from 'expo-sensors';

import API_URL from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToSyncQueue, updateCachedDashboardField } from '../../services/OfflineStorage';
import { useCustomAlert } from '../../context/CustomAlertContext';
import PressableCard from '../../components/PressableCard';
import { getStyles } from './DashboardScreen.styles';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const baseColor = '#F8FAFC';
const logoGreen = '#10B981';
const waterColor = '#0EA5E9';

// Helper for local notification filtering
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


// ============================================================================
// === SECTION 1: HELPER COMPONENTS & ANIMATIONS =============================
// ============================================================================

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function AnimatedRing({ radius, strokeWidth, pct, color = logoGreen, trackColor = '#E2E8F0', size, children, delay = 0 }) {
  const circumference = 2 * Math.PI * radius;
  const animPct = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animPct.setValue(0);
    Animated.timing(animPct, {
      toValue: pct,
      duration: 1000,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const dashoffset = animPct.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference - pct * circumference],
  });

  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cy} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={cx} cy={cy} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

function AnimatedBar({ pct, color, delay = 0 }) {
  const animWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: pct,
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
      <Animated.View style={{
        height: '100%',
        borderRadius: 3,
        backgroundColor: color,
        width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
      }} />
    </View>
  );
}

function AnimatedWaterGlassBar({ consumed, target, waterColor, theme }) {
  const pctRatio = Math.min(consumed / target, 1);
  const fillAnim = useRef(new Animated.Value(pctRatio)).current;
  const waveY = useRef(new Animated.Value(0)).current;
  const waveX = useRef(new Animated.Value(0)).current;
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: pctRatio,
      duration: 900,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    }).start();

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    waveY.setValue(0);
    waveX.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(waveY, { toValue: 1.0, duration: 320, easing: Easing.out(Easing.sin), useNativeDriver: false }),
        Animated.timing(waveY, { toValue: -0.6, duration: 300, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(waveY, { toValue: 0.3, duration: 260, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(waveY, { toValue: -0.1, duration: 220, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(waveY, { toValue: 0, duration: 180, easing: Easing.out(Easing.sin), useNativeDriver: false }),
      ]),
      Animated.sequence([
        Animated.timing(waveX, { toValue: 1.0, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(waveX, { toValue: -0.5, duration: 450, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(waveX, { toValue: 0, duration: 280, easing: Easing.out(Easing.sin), useNativeDriver: false }),
      ]),
    ]).start();
  }, [consumed, target]);

  const waveTranslateY = waveY.interpolate({ inputRange: [-1, 1], outputRange: [-5, 5] });
  const waveTranslateX = waveX.interpolate({ inputRange: [-1, 1], outputRange: [-18, 18] });
  const waveScaleY     = waveY.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.85, 1.0, 1.15] });
  const liquidTop      = fillAnim.interpolate({ inputRange: [0, 1], outputRange: [88, 0] });

  return (
    <View style={{ width: 80, alignItems: 'center' }}>
      <View style={{ height: 110, width: 64, position: 'relative', alignItems: 'center' }}>
        <View style={{
          position: 'absolute', top: 4, left: 2, right: 2, bottom: 0,
          borderRadius: 6, borderWidth: 2,
          borderColor: theme?.border ? theme.border : 'rgba(148, 163, 184, 0.65)',
          borderBottomWidth: 0, overflow: 'hidden',
        }} />
        <View style={{
          position: 'absolute', top: 0, left: 2, right: 2, height: 10,
          borderRadius: 10, borderWidth: 2,
          borderColor: 'rgba(148, 163, 184, 0.75)',
          backgroundColor: 'rgba(255, 255, 255, 0.25)', zIndex: 30,
        }} />
        <View style={{
          position: 'absolute', top: 8, left: 6, right: 6, bottom: 14,
          borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
          overflow: 'hidden', backgroundColor: theme?.inputBg || 'rgba(241, 245, 249, 0.35)', zIndex: 5,
        }}>
          <Animated.View style={{
            position: 'absolute', top: liquidTop, left: 0, right: 0, bottom: 0,
            backgroundColor: waterColor || '#0EA5E9', opacity: 1.0,
          }}>
            <Animated.View style={{
              position: 'absolute', top: -3, left: -18, right: -18, height: 10,
              transform: [{ translateY: waveTranslateY }, { translateX: waveTranslateX }, { scaleY: waveScaleY }],
            }}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: '#38BDF8', borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
            </Animated.View>
          </Animated.View>
        </View>
        <View style={{
          position: 'absolute', bottom: 0, left: 2, right: 2, height: 15,
          borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderWidth: 2,
          borderColor: 'rgba(148, 163, 184, 0.75)', backgroundColor: 'rgba(241, 245, 249, 0.7)', zIndex: 20, overflow: 'hidden',
        }}>
          <View style={{ position: 'absolute', bottom: 2, left: 4, right: 4, height: 6, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(100, 116, 139, 0.5)', backgroundColor: 'rgba(148, 163, 184, 0.3)' }} />
        </View>
      </View>
    </View>
  );
}

function FadeCard({ delay = 0, style, children }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, delay, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
}


// ============================================================================
// === SECTION 2: UTILITIES & MEMOIZED CALCULATIONS ===========================
// ============================================================================

const NEW_GOAL_OPTIONS = [
  {
    id: 'fatloss',
    label: 'Weight Loss',
    desc: 'Burn fat, slim down, and optimize health (Deficit)',
    offsetKg: -5,
    icon: <Flame color="#F97316" size={18} strokeWidth={2.5} />,
    badgeBg: 'rgba(249, 115, 22, 0.12)',
    accentColor: '#F97316',
  },
  {
    id: 'maintain',
    label: 'Maintain Weight',
    desc: 'Maintain balance and focus on recomposition (Balance)',
    offsetKg: 0,
    icon: <Target color={logoGreen} size={18} strokeWidth={2.5} />,
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    accentColor: logoGreen,
  },
  {
    id: 'muscle',
    label: 'Gain Weight',
    desc: 'Build muscle mass, gain weight, and build strength (Surplus)',
    offsetKg: +5,
    icon: <Activity color="#8B5CF6" size={18} strokeWidth={2.5} />,
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    accentColor: '#8B5CF6',
  },
];

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};


// ============================================================================
// === SECTION 3: MAIN COMPONENT & STATE HANDLERS =============================
// ============================================================================

export default function DashboardScreen({ 
  onTabChange, userBaseline, userGoals, dailyNutrition, dailyExercise, setDailyExercise,
  notifications = [], setNotifications, 
  globalLoggedWeight, setGlobalLoggedWeight, 
  globalConsumedGlasses, setGlobalConsumedGlasses,
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
}) {
  const { theme, isDarkMode } = useTheme();
  const { showAlert } = useCustomAlert();
  const styles = getStyles(theme);

  // State Modals & Inputs
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [imageError, setImageError] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [selectedNewGoalOption, setSelectedNewGoalOption] = useState(null);
  const [weightChangeKg, setWeightChangeKg] = useState('5');
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
        if (status !== 'granted') return;
        const isAvailable = await Pedometer.isAvailableAsync();
        if (!isAvailable) return;

        pedometerBaseRef.current = null;
        pedometerSubRef.current = Pedometer.watchStepCount(result => {
          if (!active) return;
          if (pedometerBaseRef.current === null) {
            pedometerBaseRef.current = result.steps;
          }
          const sessionSteps = result.steps - pedometerBaseRef.current;
          if (sessionSteps > 0 && setDailyExercise) {
            setDailyExercise(prev => {
              const prevBase = prev?._pedometerBase ?? 0;
              const alreadyAdded = prev?._pedometerAdded ?? 0;
              const newAdded = sessionSteps;
              const delta = newAdded - alreadyAdded;
              if (delta <= 0) return prev;
              return {
                ...prev,
                steps: (prev?.steps || 0) + delta,
                caloriesBurned: (prev?.caloriesBurned || 0) + Math.round(delta * 0.04),
                activeMinutes: (prev?.activeMinutes || 0) + Math.round(delta / 100),
                _pedometerBase: prevBase,
                _pedometerAdded: newAdded,
              };
            });
          }
        });
      } catch (err) {
        if (__DEV__) console.log('Pedometer error:', err);
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
  }, []);

  // Memoized User & Goal Stats
  const weightUnit      = userBaseline?.unit || 'kg';
  const consumedGlasses = globalConsumedGlasses !== undefined ? globalConsumedGlasses : 0;
  const weightKg        = weightUnit === 'lbs' ? (parseFloat(userBaseline?.weight || 154) / 2.20462) : parseFloat(userBaseline?.weight || 70);
  const heightCm        = parseFloat(userBaseline?.height || 170);

  const recommendedWaterMl = useMemo(() => {
    return (weightKg * 35) + (Math.max(0, heightCm - 150) * 10);
  }, [weightKg, heightCm]);

  const targetGlasses = useMemo(() => {
    return Math.min(15, Math.max(6, Math.round(recommendedWaterMl / 250)));
  }, [recommendedWaterMl]);

  const currentStreak  = userProfile?.streakDays || 0;
  const primaryGoal    = localGoalLabel || (userGoals?.goal === 'muscle' ? 'Build Muscle' : userGoals?.goal === 'maintain' ? 'Maintain Weight' : 'Lose Weight');
  const startingWeight = localStartingWeight !== null ? localStartingWeight : parseFloat(userBaseline?.startingWeight || userBaseline?.weight || 70);
  const currentWeight  = globalLoggedWeight !== null ? globalLoggedWeight : startingWeight;
  const goalWeight     = localGoalWeight !== null ? localGoalWeight : parseFloat(userGoals?.goalWeight || userBaseline?.targetWeight || userBaseline?.weight || currentWeight || 60);
  const weightChange   = currentWeight - startingWeight;

  const progressPct = useMemo(() => {
    const totalDiff = goalWeight - startingWeight;
    const currentDiff = currentWeight - startingWeight;
    let pct = totalDiff === 0 ? 0 : currentDiff / totalDiff;
    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;
    return pct;
  }, [goalWeight, startingWeight, currentWeight]);

  // Goal Completion Check
  const activeGoalType = userGoals?.goal || (primaryGoal.toLowerCase().includes('muscle') || primaryGoal.toLowerCase().includes('gain') ? 'muscle' : primaryGoal.toLowerCase().includes('maintain') ? 'maintain' : 'fatloss');
  
  const isGoalAchieved = useMemo(() => {
    if (globalLoggedWeight === null) return false;
    if (Math.abs(currentWeight - goalWeight) <= 0.1 || currentWeight === goalWeight) return true;
    if (activeGoalType === 'muscle' && currentWeight >= goalWeight) return true;
    if (activeGoalType === 'fatloss' && currentWeight <= goalWeight) return true;
    if (activeGoalType === 'maintain' && Math.abs(currentWeight - goalWeight) <= 0.2) return true;
    return false;
  }, [globalLoggedWeight, currentWeight, goalWeight, activeGoalType]);

  useEffect(() => {
    if (isGoalAchieved && !goalReachedAlertShown) {
      if (setGoalReachedAlertShown) setGoalReachedAlertShown(true);
      setShowNewGoalModal(true);
    }
  }, [isGoalAchieved, goalReachedAlertShown, setGoalReachedAlertShown]);

  // Water Intake Action
  const handleAddGlass = async () => {
    setWaterRipples((prev) => [...prev, Date.now()]);
    const newAmount = consumedGlasses + 1;
    if (!userId) {
      showAlert("Authentication Error", "You must be logged in to log water.");
      return;
    }

    const logWaterAction = async () => {
      if (setGlobalConsumedGlasses) setGlobalConsumedGlasses(newAmount);
      if (newAmount === targetGlasses) {
        await pushNotificationIfAllowed({
          id: `n-${Date.now()}`,
          title: 'Hydration Goal Reached! 💧',
          category: 'hydration',
          time: 'Just Now',
          read: false,
          message: 'Great job hitting your AI-recommended water intake for the day! Staying hydrated is essential.'
        }, setNotifications);
      }

      if (!isOnline) {
        await addToSyncQueue({ type: 'LOG_WATER', payload: { user_id: userId, glasses: newAmount } });
        await updateCachedDashboardField(userId, { water: { glasses: newAmount } });
        return;
      }

      try {
        const response = await fetch(`${API_URL}/water`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, glasses: newAmount }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to log water on server');
        }
      } catch (error) {
        if (__DEV__) console.error("LOG WATER ERROR:", error);
        await addToSyncQueue({ type: 'LOG_WATER', payload: { user_id: userId, glasses: newAmount } });
        await updateCachedDashboardField(userId, { water: { glasses: newAmount } });
      }
    };

    if (consumedGlasses >= targetGlasses) {
      showAlert(
        "Hydration Target Reached 💧",
        "You have already reached your daily water intake quota. Drinking too much water can be harmful. Do you want to log another glass?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log Anyway", onPress: logWaterAction }
        ]
      );
    } else {
      await logWaterAction();
    }
  };

  // Select New Goal Handler
  const handleSelectNewGoal = useCallback(async (option) => {
    const newStarting = currentWeight;
    const newGoal     = currentWeight + option.offsetKg;
    setLocalStartingWeight(newStarting);
    setLocalGoalWeight(newGoal);
    setLocalGoalLabel(option.label);
    setGoalReachedAlertShown(false);
    setShowNewGoalModal(false);

    if (setWeightHistory) {
      setWeightHistory(Array.from({ length: 7 }, () => parseFloat(newStarting.toFixed(1))));
    }

    if (setNotifications) {
      setNotifications(prev => [{
        id: 'ng-' + Date.now(),
        title: '🎯 New Goal Set!',
        category: 'achievement',
        time: 'Just Now',
        read: false,
        message: `Your weight goal has been reset. New target: ${option.label}. Starting from ${newStarting.toFixed(1)} kg → ${newGoal.toFixed(1)} kg. Let's go!`
      }, ...prev]);
    }

    if (isOnline && userId) {
      try {
        const targetDateObj = new Date();
        targetDateObj.setDate(targetDateObj.getDate() + 90);
        const formattedTargetDate = `${String(targetDateObj.getMonth() + 1).padStart(2, '0')}/${String(targetDateObj.getDate()).padStart(2, '0')}/${targetDateObj.getFullYear()}`;

        const response = await fetch(`${API_URL}/save-onboarding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            age: parseInt(userBaseline?.age || 25, 10),
            weight_kg: newStarting,
            height_cm: parseFloat(userBaseline?.height || 170),
            goal: option.id,
            goal_weight: newGoal,
            target_date: formattedTargetDate,
            weight_unit: userBaseline?.unit || 'kg',
            starting_weight: newStarting
          }),
        });

        if (response.ok && onRefreshDashboard) {
          onRefreshDashboard();
        }
      } catch (e) {
        if (__DEV__) console.log('NEW GOAL PERSIST ERROR:', e);
      }
    }
  }, [currentWeight, isOnline, userId, userBaseline, setNotifications, onRefreshDashboard, setLocalStartingWeight, setLocalGoalWeight, setLocalGoalLabel, setGoalReachedAlertShown, setWeightHistory]);

  // Macro Calculation
  const { targetCalories, targetProtein, targetCarbs, targetFats } = useMemo(() => {
    let tCal = 2000, tProt = 150, tCarb = 225, tFat = 55;
    if (userBaseline?.weight && userBaseline?.height && userBaseline?.age && userGoals?.activityLevel) {
      const w  = parseFloat(userBaseline.weight);
      const h  = parseFloat(userBaseline.height);
      const a  = parseInt(userBaseline.age, 10);
      let bmr  = (10 * w) + (6.25 * h) - (5 * a) + 5;
      let mult = 1.2;
      if (userGoals.activityLevel === 'moderate') mult = 1.55;
      if (userGoals.activityLevel === 'active')   mult = 1.725;
      let tdee = bmr * mult;
      if (userGoals.goal === 'muscle')  tdee += 300;
      if (userGoals.goal === 'fatloss') tdee -= 500;
      tCal  = Math.round(tdee);
      tProt = Math.round((tCal * 0.30) / 4);
      tCarb = Math.round((tCal * 0.45) / 4);
      tFat  = Math.round((tCal * 0.25) / 9);
    }
    return { targetCalories: tCal, targetProtein: tProt, targetCarbs: tCarb, targetFats: tFat };
  }, [userBaseline, userGoals]);

  const nutrition    = dailyNutrition || { consumedCalories: 0, protein: { current: 0 }, carbs: { current: 0 }, fats: { current: 0 } };
  let nutritionPct   = targetCalories === 0 ? 0 : nutrition.consumedCalories / targetCalories;
  if (nutritionPct < 0) nutritionPct = 0;
  if (nutritionPct > 1) nutritionPct = 1;

  const macros = [
    { label: 'Protein', current: nutrition.protein?.current || 0, target: targetProtein, color: logoGreen,   unit: 'g' },
    { label: 'Carbs',   current: nutrition.carbs?.current   || 0, target: targetCarbs,   color: '#F59E0B',  unit: 'g' },
    { label: 'Fats',    current: nutrition.fats?.current    || 0, target: targetFats,    color: '#EC4899',  unit: 'g' },
  ];

  const exercise     = dailyExercise || { caloriesBurned: 320, activeMinutes: 45, targetMinutes: 60, recentExercise: 'Morning Jog' };
  const currentSteps = dailyExercise?.steps ?? 0;

  // Chart configuration & data
  const chartConfig = useMemo(() => ({
    backgroundGradientFrom: theme?.surface || baseColor,
    backgroundGradientTo:   theme?.surface || baseColor,
    color: (opacity = 1) => isDarkMode ? `rgba(52, 211, 153, ${opacity})` : `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: { r: '5', strokeWidth: '2.5', stroke: logoGreen, fill: theme?.surface || '#FFFFFF' },
    propsForBackgroundLines: { strokeDasharray: '4 4', stroke: theme?.border || '#E2E8F0', strokeWidth: 1 },
    decimalPlaces: 1,
  }), [theme, isDarkMode]);

  const { rollingLabels, weightDataPoints, maxWeeklyWeight, minWeeklyWeight, netWeeklyChange, weightChartData } = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIndex = new Date().getDay();
    const labels = Array.from({ length: 7 }, (_, i) => {
      const d = (todayIndex - 6 + i + 7) % 7;
      return dayNames[d];
    });

    const fallbackStart = startingWeight;
    const points = weightHistory && weightHistory.length === 7
      ? weightHistory
      : Array.from({ length: 6 }, () => fallbackStart).concat([currentWeight]);

    const maxW = Math.max(...points).toFixed(1);
    const minW = Math.min(...points).toFixed(1);
    const netChange = (points[points.length - 1] - points[0]).toFixed(1);

    return {
      rollingLabels: labels,
      weightDataPoints: points,
      maxWeeklyWeight: maxW,
      minWeeklyWeight: minW,
      netWeeklyChange: netChange,
      weightChartData: { labels, datasets: [{ data: points, color: () => logoGreen, strokeWidth: 3 }] },
    };
  }, [startingWeight, weightHistory, currentWeight]);

  const greetingObj = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good Morning', emoji: '🌅' };
    if (hour >= 12 && hour < 18) return { text: 'Good Afternoon', emoji: '☀️' };
    return { text: 'Good Evening', emoji: '🌙' };
  }, []);

  const currentDateStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  }, []);

  const rawName = userProfile?.name || 'User';
  const displayName = rawName.length > 14 ? `${rawName.substring(0, 12)}...` : rawName;

  const getGoalProgressColor = useCallback((delta) => {
    if (delta === 0) return theme?.textSecondary || '#94A3B8';
    const goalType = userGoals?.goal || (primaryGoal.toLowerCase().includes('muscle') || primaryGoal.toLowerCase().includes('gain') ? 'muscle' : primaryGoal.toLowerCase().includes('maintain') ? 'maintain' : 'fatloss');
    
    if (goalType === 'muscle') {
      return delta > 0 ? logoGreen : '#EF4444';
    } else if (goalType === 'maintain') {
      return Math.abs(delta) <= 1.0 ? logoGreen : '#F59E0B';
    } else {
      return delta < 0 ? logoGreen : '#EF4444';
    }
  }, [theme, userGoals, primaryGoal]);

  const executeWeightSave = async (parsed) => {
    if (setGlobalLoggedWeight) setGlobalLoggedWeight(parsed);
    if (setGoalReachedAlertShown) setGoalReachedAlertShown(false);
    if (setWeightHistory) {
      setWeightHistory(prev => {
        const base = prev && prev.length === 7
          ? [...prev]
          : Array.from({ length: 6 }, () => startingWeight).concat([currentWeight]);
        base[6] = parseFloat(parsed.toFixed(1));
        return base;
      });
    }
    setShowWeightModal(false);
    await pushNotificationIfAllowed({
      id: 'w' + Date.now(),
      title: 'Weight Logged ⚖️',
      category: 'achievement',
      time: 'Just Now',
      read: false,
      message: `Successfully logged your weight as ${parsed.toFixed(1)} ${weightUnit}. Keep up the great work!`
    }, setNotifications);

    if (!isOnline) {
      await addToSyncQueue({ type: 'LOG_WEIGHT', payload: { user_id: userId, new_weight: parsed, unit: userBaseline?.unit || 'kg' } });
      await updateCachedDashboardField(userId, { profile: { currentWeight: parsed } });
      showAlert('📴 Saved Offline', 'Weight saved locally. Will sync when back online.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/update-weight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, new_weight: parsed, unit: userBaseline?.unit || 'kg' })
      });
      if (response.ok && onRefreshDashboard) {
        onRefreshDashboard();
      } else if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        showAlert("Error Logging Weight", errData.detail || "Failed to log weight to server.");
      }
    } catch (error) {
      if (__DEV__) console.log("LOG WEIGHT ERROR:", error);
      await addToSyncQueue({ type: 'LOG_WEIGHT', payload: { user_id: userId, new_weight: parsed, unit: userBaseline?.unit || 'kg' } });
      await updateCachedDashboardField(userId, { profile: { currentWeight: parsed } });
    }
  };

  const handleSaveWeightInput = () => {
    const parsed = parseFloat(weightInput);
    const minVal = weightUnit === 'lbs' ? 55 : 25;
    const maxVal = weightUnit === 'lbs' ? 660 : 300;
    if (isNaN(parsed) || parsed < minVal || parsed > maxVal) {
      showAlert("Invalid Weight Input ⚠️", `Please enter a realistic weight value between ${minVal} ${weightUnit} and ${maxVal} ${weightUnit}.`);
      return;
    }

    const thresholdJump = weightUnit === 'lbs' ? 11.0 : 5.0;
    const weightJump = Math.abs(parsed - currentWeight);
    if (currentWeight > 0 && weightJump >= thresholdJump) {
      showAlert(
        "Unusual Weight Jump ⚖️",
        `You entered ${parsed.toFixed(1)} ${weightUnit}, which is ${weightJump.toFixed(1)} ${weightUnit} ${parsed > currentWeight ? 'higher' : 'lower'} than your recent weight (${currentWeight.toFixed(1)} ${weightUnit}). Are you sure?`,
        [
          { text: "Fix Input", style: "cancel" },
          { text: "Yes, Confirm", onPress: () => executeWeightSave(parsed) }
        ]
      );
      return;
    }

    executeWeightSave(parsed);
  };


// ============================================================================
// === SECTION 4: MAIN SCREEN UI RENDER =======================================
// ============================================================================

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── HEADER ── */}
        <FadeCard delay={0} style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.appName}>{currentDateStr} • MACROSYNC</Text>
            <Text 
              numberOfLines={1} 
              adjustsFontSizeToFit={true} 
              minimumFontScale={0.85} 
              style={styles.greeting}
            >
              {greetingObj.text}, {displayName}! {greetingObj.emoji}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 6 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.10)',
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)',
              }}>
                <Target size={12} color={logoGreen} strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: logoGreen }}>
                  {primaryGoal}
                </Text>
              </View>

              {currentStreak > 0 && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: isDarkMode ? 'rgba(249, 115, 22, 0.16)' : 'rgba(249, 115, 22, 0.10)',
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.2)',
                }}>
                  <Flame size={12} color="#F97316" strokeWidth={2.5} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#F97316' }}>
                    {currentStreak} Day Streak
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => onTabChange && onTabChange('NOTIFICATIONS')} style={{ marginRight: 16 }}>
              <Bell color={theme?.textPrimary || '#0F172A'} size={26} />
              {notifications.some(n => !n.read) && (
                <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: theme?.background || '#F8FAFC' }} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onTabChange && onTabChange('SETTINGS')} activeOpacity={0.8} style={styles.avatarContainer}>
              <View style={styles.avatarGlass}>
                {userProfile?.profileImage && !imageError ? (
                  <Image 
                    source={{ uri: userProfile.profileImage }} 
                    style={styles.avatarImage} 
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900", letterSpacing: 0.5 }}>
                    {getInitials(userProfile?.name || displayName)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </FadeCard>

        {/* ── 1. WEIGHT TRACKING PROGRESS CARD ── */}
        <FadeCard delay={80} style={styles.formCard}>
          <Text style={styles.cardTitle}>Weight Progress</Text>
          <View style={[styles.weightSplitLayout, { alignItems: 'flex-start' }]}>
            <AnimatedRing size={120} radius={52} strokeWidth={10} pct={progressPct} color={logoGreen} delay={200}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: theme?.textPrimary || '#0F172A' }}>{Math.round(progressPct * 100)}%</Text>
              <Text style={{ fontSize: 10, fontWeight: '800', color: theme?.textSecondary || '#94A3B8', marginTop: 0 }}>TO GOAL</Text>
            </AnimatedRing>

            <View style={{ flex: 1, marginLeft: 28 }}>
              <View style={styles.statsGrid}>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Starting</Text>
                  <Text style={styles.statValue}>{startingWeight.toFixed(1)} {weightUnit}</Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Current</Text>
                  <Text style={[styles.statValue, { color: logoGreen }]}>{currentWeight.toFixed(1)} {weightUnit}</Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Goal</Text>
                  <Text style={styles.statValue}>{goalWeight.toFixed(1)} {weightUnit}</Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Gain/Loss</Text>
                  <Text style={[styles.statValue, { color: getGoalProgressColor(weightChange) }]}>
                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} {weightUnit}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => { setWeightInput(currentWeight.toFixed(1)); setShowWeightModal(true); }}
                style={{ backgroundColor: logoGreen, paddingVertical: 10, borderRadius: 12, marginTop: 4, width: '100%', alignItems: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>+ Log Weight</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FadeCard>

        {/* ── 2. DAILY NUTRITION CARD ── */}
        <FadeCard delay={160} style={styles.formCard}>
          <Text style={styles.cardTitle}>Daily Nutrition</Text>
          <View style={[styles.nutritionRow, { alignItems: 'flex-start' }]}>
            <View style={styles.calorieColumn}>
              <AnimatedRing
                size={120} radius={52} strokeWidth={10}
                pct={nutritionPct}
                color={nutrition.consumedCalories > targetCalories ? '#EF4444' : logoGreen}
                delay={300}
              >
                <Text style={[styles.calorieBigText, { fontSize: 16 }, nutrition.consumedCalories > targetCalories && { color: '#EF4444' }]}>
                  {nutrition.consumedCalories.toLocaleString()}{' '}
                  <Text style={{ fontSize: 12, color: theme?.textSecondary || '#94A3B8', fontWeight: '800' }}>/ {targetCalories.toLocaleString()}</Text>
                </Text>
                <Text style={styles.calorieSubText}>KCAL EATEN</Text>
              </AnimatedRing>
              {nutrition.consumedCalories > targetCalories && (
                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 }}>
                  <Text style={{ fontSize: 9, color: '#EF4444', fontWeight: 'bold' }}>OVER LIMIT</Text>
                </View>
              )}
            </View>

            <View style={[styles.macroColumn, { height: 120, justifyContent: 'center' }]}>
              {macros.map((macro, idx) => {
                const pct = Math.min(macro.current / macro.target, 1);
                return (
                  <View key={idx} style={styles.macroRow}>
                    <View style={styles.macroInfo}>
                      <Text style={styles.macroLabel}>{macro.label}</Text>
                      <Text style={styles.macroValue}>{macro.current}/{macro.target}{macro.unit}</Text>
                    </View>
                    <AnimatedBar pct={pct} color={macro.color} delay={400 + idx * 80} />
                  </View>
                );
              })}
            </View>
          </View>

          {nutrition.consumedCalories >= targetCalories && (
            <View style={[
              styles.warningBanner,
              {
                backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 242, 242, 0.5)',
                borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(252, 165, 165, 0.5)',
              }
            ]}>
              <Text style={[styles.warningBannerText, { color: isDarkMode ? '#FCA5A5' : '#DC2626' }]}>
                ⚠️ You have reached or exceeded your daily calorie quota ({nutrition.consumedCalories} / {targetCalories} kcal).
              </Text>
            </View>
          )}
        </FadeCard>

        {/* ── 3. EXERCISE & ACTIVITY ── */}
        <FadeCard delay={240} style={styles.formCard}>
          <Text style={styles.cardTitle}>Activity & Movement</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            {[
              { icon: <Flame color="#F97316" size={22} strokeWidth={2.5} />, val: exercise.caloriesBurned, label: 'Kcal Burned' },
              { icon: <Clock color={logoGreen} size={22} strokeWidth={2.5} />, val: `${exercise.activeMinutes}/60`, label: 'Active Mins' },
              { 
                icon: <Footprints color="#3B82F6" size={22} strokeWidth={2.5} />, 
                val: currentSteps >= 1000 ? `${(currentSteps / 1000).toFixed(1)}k` : `${currentSteps}`, 
                label: 'Steps Today',
              },
            ].map((item, i) => (
              <TouchableOpacity 
                key={i} 
                activeOpacity={1}
                disabled={true}
                style={{
                  flex: 1,
                  backgroundColor: theme?.inputBg || '#F1F5F9',
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 6,
                  alignItems: 'center',
                  marginHorizontal: 4,
                  borderWidth: 1,
                  borderColor: theme?.border || '#E2E8F0',
                }}
              >
                <View style={{ marginBottom: 8 }}>{item.icon}</View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: theme?.textPrimary || '#0F172A' }}>{item.val}</Text>
                <Text style={{ fontSize: 9, color: theme?.textSecondary || '#94A3B8', fontWeight: '800', marginTop: 2, textTransform: 'uppercase' }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <PressableCard
            scaleDown={0.97}
            onPress={() => onTabChange && onTabChange('WORKOUT')}
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 16,
              backgroundColor: theme?.inputBg || '#F1F5F9',
              borderWidth: 1,
              borderColor: theme?.border || '#E2E8F0',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 10,
                  backgroundColor: 'rgba(249, 115, 22, 0.15)',
                  alignItems: 'center', justifyContent: 'center', marginRight: 10,
                }}>
                  <Flame color="#F97316" size={18} strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme?.textSecondary || '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Recent Workout
                  </Text>
                  <Text 
                    numberOfLines={1} 
                    ellipsizeMode="tail" 
                    style={{ fontSize: 13, fontWeight: '900', color: theme?.textPrimary || '#0F172A', marginTop: 1 }}
                  >
                    {exercise.recentExercise}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.12)',
                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 4,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#F97316' }}>
                    {Math.min(Math.round((exercise.activeMinutes / (exercise.targetMinutes || 60)) * 100), 100)}% Goal
                  </Text>
                </View>
                <ChevronRight color={theme?.textSecondary || '#94A3B8'} size={18} />
              </View>
            </View>

            <AnimatedBar pct={Math.min((exercise.activeMinutes / (exercise.targetMinutes || 60)), 1)} color="#F97316" delay={500} />
          </PressableCard>

          {exercise.activeMinutes >= (exercise.targetMinutes || 60) && (
            <View style={[
              styles.warningBanner,
              {
                backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 251, 235, 0.5)',
                borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(252, 211, 77, 0.5)',
              }
            ]}>
              <Text style={[styles.warningBannerText, { color: isDarkMode ? '#FCD34D' : '#D97706' }]}>
                ⚡ Daily exercise quota achieved ({exercise.activeMinutes} mins). Excellent work, make sure to rest!
              </Text>
            </View>
          )}
        </FadeCard>

        {/* ── 3.5 HYDRATION ── */}
        <FadeCard delay={320} style={styles.formCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>Hydration Tracking</Text>
            <View style={{ backgroundColor: theme?.inputBg || '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme?.textSecondary || '#64748B' }}>AI RECOMMENDED</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: theme?.textPrimary || '#0F172A' }}>
                {consumedGlasses}{' '}
                <Text style={{ fontSize: 16, color: theme?.textSecondary || '#94A3B8' }}>/ {targetGlasses}</Text>
              </Text>
              <Text style={{ fontSize: 11, color: theme?.textSecondary || '#94A3B8', fontWeight: '800', marginTop: 2 }}>GLASSES (250ml)</Text>
              <Text style={{ fontSize: 12, color: theme?.textPrimary || '#0F172A', fontWeight: '500', marginTop: 12, lineHeight: 18 }}>
                Your custom daily target is{' '}
                <Text style={{ fontWeight: '700', color: waterColor }}>{(targetGlasses * 250).toLocaleString()}ml</Text>
                {' '}based on your weight ({weightKg}kg) and height ({heightCm}cm).
              </Text>
            </View>

            <AnimatedWaterGlassBar
              consumed={consumedGlasses}
              target={targetGlasses}
              waterColor={waterColor}
              theme={theme}
            />
          </View>

          <TouchableOpacity
            style={{ backgroundColor: waterColor, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 16, alignItems: 'center' }}
            onPress={handleAddGlass}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>+ Quick Add Glass</Text>
          </TouchableOpacity>

          {consumedGlasses >= targetGlasses && (
            <View style={[styles.warningBanner, { borderColor: theme?.border || '#E2E8F0', backgroundColor: theme?.inputBg || '#F8FAFC' }]}>
              <Text style={[styles.warningBannerText, { color: waterColor }]}>
                💧 Daily hydration target achieved ({consumedGlasses} / {targetGlasses} glasses). Stay balanced and avoid overhydrating.
              </Text>
            </View>
          )}
        </FadeCard>

        {/* ── 4. WEIGHT TREND ANALYTICS ── */}
        <FadeCard delay={400} style={styles.formCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.cardTitle}>Weight Trend Analytics</Text>
              <Text style={{ fontSize: 10, color: theme?.textSecondary || '#94A3B8', marginTop: 2, fontWeight: '700' }}>
                7-Day Weight Trajectory & Delta Points
              </Text>
            </View>

            <View style={{
              backgroundColor: getGoalProgressColor(parseFloat(netWeeklyChange)) === logoGreen ? 'rgba(16, 185, 129, 0.12)' : getGoalProgressColor(parseFloat(netWeeklyChange)) === '#EF4444' ? 'rgba(239, 68, 68, 0.12)' : (theme?.inputBg || '#F1F5F9'),
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
              borderColor: getGoalProgressColor(parseFloat(netWeeklyChange)) === logoGreen ? 'rgba(16, 185, 129, 0.25)' : getGoalProgressColor(parseFloat(netWeeklyChange)) === '#EF4444' ? 'rgba(239, 68, 68, 0.25)' : (theme?.border || '#E2E8F0'),
            }}>
              <Text style={{
                fontSize: 11, fontWeight: '900',
                color: getGoalProgressColor(parseFloat(netWeeklyChange)),
              }}>
                7D NET: {parseFloat(netWeeklyChange) > 0 ? '+' : ''}{netWeeklyChange} {weightUnit}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 4 }}>
            <View style={{ flex: 1, backgroundColor: theme?.inputBg || '#F1F5F9', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', marginHorizontal: 3, borderWidth: 1, borderColor: theme?.border || '#E2E8F0' }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: theme?.textSecondary || '#94A3B8', textTransform: 'uppercase' }}>7D Peak</Text>
              <Text style={{ fontSize: 13, fontWeight: '900', color: theme?.textPrimary || '#0F172A', marginTop: 2 }}>{maxWeeklyWeight} {weightUnit}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme?.inputBg || '#F1F5F9', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', marginHorizontal: 3, borderWidth: 1, borderColor: theme?.border || '#E2E8F0' }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: theme?.textSecondary || '#94A3B8', textTransform: 'uppercase' }}>7D Low</Text>
              <Text style={{ fontSize: 13, fontWeight: '900', color: theme?.textPrimary || '#0F172A', marginTop: 2 }}>{minWeeklyWeight} {weightUnit}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme?.inputBg || '#F1F5F9', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', marginHorizontal: 3, borderWidth: 1, borderColor: theme?.border || '#E2E8F0' }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: theme?.textSecondary || '#94A3B8', textTransform: 'uppercase' }}>7D Avg</Text>
              <Text style={{ fontSize: 13, fontWeight: '900', color: theme?.textPrimary || '#0F172A', marginTop: 2 }}>
                {(weightDataPoints.reduce((a, b) => a + b, 0) / weightDataPoints.length).toFixed(1)} {weightUnit}
              </Text>
            </View>
          </View>

          <View style={styles.glassDivider} />

          <View style={styles.chartContainer}>
            <LineChart
              data={weightChartData}
              width={screenWidth - 76}
              height={180}
              chartConfig={{
                ...chartConfig,
                fillShadowGradient: logoGreen,
                fillShadowGradientOpacity: isDarkMode ? 0.35 : 0.22,
                fillShadowGradientTo: theme?.surface || baseColor,
                fillShadowGradientToOpacity: 0.05,
              }}
              bezier
              style={{ marginVertical: 4, borderRadius: 16 }}
              withInnerLines={true}
              withOuterLines={false}
              yAxisSuffix={` ${weightUnit}`}
              renderDotContent={({ x, y, index, indexData }) => {
                if (index === 0) return null;
                const diff = indexData - weightDataPoints[index - 1];
                if (Math.abs(diff) < 0.05) return null;
                const diffColor = getGoalProgressColor(diff);
                const sign      = diff > 0 ? '+' : '';
                const displayValue = `${sign}${diff.toFixed(1)}`;
                const textY = y < 25 ? y + 18 : y - 10;
                return (
                  <SvgText key={index} x={x} y={textY} fill={diffColor} fontSize="10" fontWeight="900" textAnchor="middle">
                    {displayValue}
                  </SvgText>
                );
              }}
            />
          </View>
        </FadeCard>

      </ScrollView>

      {/* ── WEIGHT MODAL ── */}
      <Modal visible={showWeightModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Weight</Text>
            <Text style={styles.modalSubtitle}>Enter your current weight ({weightUnit}) below.</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder={`Enter weight in ${weightUnit}...`}
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowWeightModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveWeightInput}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── NEW GOAL MODAL ── */}
      <Modal visible={showNewGoalModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 22, borderRadius: 24 }]}>
            {!selectedNewGoalOption ? (
              <>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{
                    width: 64, height: 64, borderRadius: 32,
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1.5, borderColor: 'rgba(16, 185, 129, 0.3)', marginBottom: 12,
                  }}>
                    <Trophy color={logoGreen} size={32} strokeWidth={2.5} />
                  </View>
                  
                  <Text style={{ fontSize: 22, fontWeight: '900', color: theme?.textPrimary || '#0F172A', textAlign: 'center', letterSpacing: -0.5 }}>
                    Goal Achieved! 🎉
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme?.textSecondary || '#94A3B8', textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                    Fantastic progress! You reached your target weight of <Text style={{ color: logoGreen, fontWeight: '800' }}>{goalWeight.toFixed(1)} {weightUnit}</Text>.{`\n`}Select your next goal to stay on track:
                  </Text>
                </View>

                {NEW_GOAL_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.newGoalOptionBtn}
                    onPress={() => {
                      if (option.id === 'maintain') {
                        handleSelectNewGoal(option);
                      } else {
                        setSelectedNewGoalOption(option);
                        setWeightChangeKg('5');
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 12,
                      backgroundColor: option.badgeBg, alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    }}>
                      {option.icon}
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.newGoalOptionLabel}>{option.label}</Text>
                      <Text style={styles.newGoalOptionDesc}>{option.desc}</Text>
                    </View>
                    <ChevronRight color={option.accentColor} size={18} strokeWidth={2.5} />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={{
                    width: '100%', paddingVertical: 13, borderRadius: 14,
                    backgroundColor: theme?.inputBg || '#F1F5F9', alignItems: 'center', marginTop: 6,
                    borderWidth: 1.2, borderColor: theme?.border || '#E2E8F0',
                  }}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowNewGoalModal(false);
                    setSelectedNewGoalOption(null);
                  }}
                >
                  <Text style={{ color: theme?.textSecondary || '#94A3B8', fontWeight: '800', fontSize: 13, letterSpacing: 0.2 }}>
                    Decide Later
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <TouchableOpacity 
                    onPress={() => setSelectedNewGoalOption(null)}
                    style={{ padding: 8, borderRadius: 12, backgroundColor: theme?.inputBg || '#F1F5F9', marginRight: 12 }}
                  >
                    <ChevronLeft color={theme?.textPrimary || '#0F172A'} size={20} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: theme?.textPrimary || '#0F172A', flex: 1 }} numberOfLines={1}>
                    Set Weight {selectedNewGoalOption.id === 'fatloss' ? 'Loss' : 'Gain'} Target
                  </Text>
                </View>

                <Text style={{ fontSize: 13, fontWeight: '600', color: theme?.textSecondary || '#94A3B8', marginBottom: 14, lineHeight: 18 }}>
                  How many {weightUnit === 'lbs' ? 'pounds' : 'kilograms'} do you want to <Text style={{ color: selectedNewGoalOption.accentColor, fontWeight: '800' }}>{selectedNewGoalOption.id === 'fatloss' ? 'lose' : 'gain'}</Text> from your current weight ({currentWeight.toFixed(1)} {weightUnit})?
                </Text>

                <Text style={{ fontSize: 11, fontWeight: '800', color: theme?.textSecondary || '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Quick Preset Target
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  {['2', '3', '5', '8', '10'].map((amount) => {
                    const isSelected = weightChangeKg === amount;
                    return (
                      <TouchableOpacity
                        key={amount}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
                          backgroundColor: isSelected ? selectedNewGoalOption.accentColor : (theme?.inputBg || '#F1F5F9'),
                          borderWidth: 1,
                          borderColor: isSelected ? selectedNewGoalOption.accentColor : (theme?.border || '#E2E8F0')
                        }}
                        onPress={() => setWeightChangeKg(amount)}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '800', color: isSelected ? '#FFFFFF' : (theme?.textPrimary || '#0F172A') }}>
                          {selectedNewGoalOption.id === 'fatloss' ? '-' : '+'}{amount} {weightUnit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={{ fontSize: 11, fontWeight: '800', color: theme?.textSecondary || '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Or Enter Custom Amount ({weightUnit})
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: theme?.inputBg || '#F1F5F9', borderRadius: 14,
                  paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5,
                  borderColor: theme?.border || '#E2E8F0', marginBottom: 14
                }}>
                  <TextInput
                    style={{ flex: 1, fontSize: 16, fontWeight: '800', color: theme?.textPrimary || '#0F172A' }}
                    value={weightChangeKg}
                    onChangeText={(val) => setWeightChangeKg(val.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    placeholder={`Enter ${weightUnit}`}
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: theme?.textSecondary || '#64748B' }}>{weightUnit}</Text>
                </View>

                {(() => {
                  const numKg = parseFloat(weightChangeKg) || 0;
                  const calculatedTarget = selectedNewGoalOption.id === 'fatloss' 
                    ? Math.max(30, currentWeight - numKg) 
                    : (currentWeight + numKg);
                  return (
                    <View style={{
                      backgroundColor: selectedNewGoalOption.badgeBg, padding: 12, borderRadius: 14,
                      borderWidth: 1, borderColor: `${selectedNewGoalOption.accentColor}40`, marginBottom: 14
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: selectedNewGoalOption.accentColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                        Live Target Preview
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: theme?.textPrimary || '#0F172A' }}>
                        {currentWeight.toFixed(1)} {weightUnit} ➔ Target: <Text style={{ color: selectedNewGoalOption.accentColor }}>{calculatedTarget.toFixed(1)} {weightUnit}</Text>
                      </Text>
                    </View>
                  );
                })()}

                <TouchableOpacity
                  style={{
                    width: '100%', paddingVertical: 13, borderRadius: 14,
                    backgroundColor: selectedNewGoalOption.accentColor, alignItems: 'center', justifyContent: 'center',
                  }}
                  activeOpacity={0.8}
                  onPress={() => {
                    const numKg = parseFloat(weightChangeKg) || 5;
                    const offsetKg = selectedNewGoalOption.id === 'fatloss' ? -numKg : +numKg;
                    handleSelectNewGoal({
                      ...selectedNewGoalOption,
                      label: `${selectedNewGoalOption.label} (${selectedNewGoalOption.id === 'fatloss' ? '-' : '+'}${numKg}kg)`,
                      offsetKg
                    });
                    setSelectedNewGoalOption(null);
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14, letterSpacing: 0.3 }}>
                    Confirm Goal ({selectedNewGoalOption.id === 'fatloss' ? '-' : '+'}{parseFloat(weightChangeKg) || 5} kg)
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}
