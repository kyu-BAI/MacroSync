import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { Camera, UtensilsCrossed, BotMessageSquare, Home, SportShoe, Settings, Droplets, Footprints, Activity, Bell, User } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import DraggableChatbotButton from '../../components/DraggableChatbotButton';
import API_URL from '../config/api';
import { addToSyncQueue, updateCachedDashboardField } from '../../services/OfflineStorage';


const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const baseColor         = '#F0F4F2';
const clearWhiteHighlight = '#FFFFFF';
const softGreenShadow   = '#AEC2B7';
const logoGreen         = '#4EA685';

// ─── Animated Ring ─────────────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function AnimatedRing({ radius, strokeWidth, pct, color = logoGreen, trackColor = '#D4E2DC', size, children, delay = 0 }) {
  const circumference = 2 * Math.PI * radius;
  const animPct = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animPct, {
      toValue: pct,
      duration: 1000,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const dashoffset = animPct.interpolate({
    inputRange:  [0, 1],
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

// ─── Animated Progress Bar ──────────────────────────────────────────────────
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
    <View style={{ height: 6, backgroundColor: '#D4E2DC', borderRadius: 3, overflow: 'hidden' }}>
      <Animated.View style={{
        height: '100%',
        borderRadius: 3,
        backgroundColor: color,
        width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
      }} />
    </View>
  );
}

// ─── Fade+Slide Card Wrapper ────────────────────────────────────────────────
function FadeCard({ delay = 0, style, children }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function DashboardScreen({ 
  onTabChange, userBaseline, userGoals, dailyNutrition, dailyExercise, 
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
  const styles = getStyles(theme);
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  // ── New Goal Modal (shown when user hits 100% progress) ──
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);

  const NEW_GOAL_OPTIONS = [
    { id: 'fatloss',  label: 'Weight Loss',     desc: 'Burn fat, slim down, and optimize health (Deficit)',   offsetKg: -5 },
    { id: 'maintain', label: 'Maintain Weight',  desc: 'Maintain balance and focus on recomposition (Balance)',  offsetKg:  0  },
    { id: 'muscle',   label: 'Gain Weight',      desc: 'Build muscle mass, gain weight, and build strength (Surplus)',  offsetKg:  +5 },
  ];

  // Water Intake State & Logic
  const consumedGlasses    = globalConsumedGlasses !== undefined ? globalConsumedGlasses : 4;
  const weightKg           = parseFloat(userBaseline?.weight || 70);
  const heightCm           = parseFloat(userBaseline?.height || 170);
  const recommendedWaterMl = (weightKg * 35) + (Math.max(0, heightCm - 150) * 10);
  const targetGlasses      = Math.min(15, Math.max(6, Math.round(recommendedWaterMl / 250)));

  const handleAddGlass = async () => {
    const newAmount = consumedGlasses + 1;
    if (!userId) {
      Alert.alert("Authentication Error", "You must be logged in to log water.");
      return;
    }

    const logWaterAction = async () => {
      // Optimistic UI update
      if (setGlobalConsumedGlasses) setGlobalConsumedGlasses(newAmount);
      if (newAmount === targetGlasses && setNotifications) {
        setNotifications(prev => [{
          id: `n-${Date.now()}`,
          title: 'Hydration Goal Reached! 💧',
          category: 'hydration',
          time: 'Just Now',
          read: false,
          message: 'Great job hitting your AI-recommended water intake for the day! Staying hydrated is essential.'
        }, ...prev]);
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
        console.error("LOG WATER ERROR (falling back to queue):", error);
        await addToSyncQueue({ type: 'LOG_WATER', payload: { user_id: userId, glasses: newAmount } });
        await updateCachedDashboardField(userId, { water: { glasses: newAmount } });
      }
    };

    if (consumedGlasses >= targetGlasses) {
      Alert.alert(
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

  // --- DATA MAPPING ---
  const primaryGoal    = localGoalLabel || (userGoals?.goal === 'muscle' ? 'Build Muscle' : userGoals?.goal === 'maintain' ? 'Maintain Weight' : 'Lose Weight');
  const startingWeight = localStartingWeight !== null ? localStartingWeight : parseFloat(userBaseline?.startingWeight || userBaseline?.weight || 70);
  const goalWeight     = localGoalWeight !== null ? localGoalWeight : parseFloat(userGoals?.goalWeight || 65);
  const currentWeight  = globalLoggedWeight !== null ? globalLoggedWeight : startingWeight;
  const weightChange   = currentWeight - startingWeight;

  const totalDiff   = goalWeight - startingWeight;
  const currentDiff = currentWeight - startingWeight;
  let progressPct   = totalDiff === 0 ? 0 : currentDiff / totalDiff;
  if (progressPct < 0) progressPct = 0;
  if (progressPct > 1) progressPct = 1;

  // Trigger goal-reached modal once when 100% is hit
  useEffect(() => {
    if (progressPct >= 1 && !goalReachedAlertShown) {
      setGoalReachedAlertShown(true);
      setShowNewGoalModal(true);
    }
  }, [progressPct, goalReachedAlertShown]);

  const handleSelectNewGoal = useCallback(async (option) => {
    const newStarting = currentWeight;
    const newGoal     = currentWeight + option.offsetKg;
    setLocalStartingWeight(newStarting);
    setLocalGoalWeight(newGoal);
    setLocalGoalLabel(option.label);
    setGoalReachedAlertShown(false); // allow future re-detection
    setShowNewGoalModal(false);
    // Reset chart history to a flat baseline at the new starting weight
    if (setWeightHistory) {
      setWeightHistory(Array.from({ length: 7 }, () => parseFloat(newStarting.toFixed(1))));
    }

    // Notification
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

    // Persist to backend
    if (isOnline && userId) {
      try {
        // Calculate a target date 90 days in the future as a default target date
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
            goal: option.id, // 'fatloss', 'maintain', or 'muscle'
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
        console.log('NEW GOAL PERSIST ERROR:', e);
      }
    }
  }, [currentWeight, isOnline, userId, userBaseline, setNotifications, onRefreshDashboard]);

  const ringRadius        = 52;
  const ringStroke        = 10;
  const ringCircumference = 2 * Math.PI * ringRadius;

  // Dynamic Macro Calc
  let targetCalories = 2000, targetProtein = 150, targetCarbs = 225, targetFats = 55;
  if (userBaseline?.weight && userBaseline?.height && userBaseline?.age && userGoals?.activityLevel) {
    const w   = parseFloat(userBaseline.weight);
    const h   = parseFloat(userBaseline.height);
    const a   = parseInt(userBaseline.age, 10);
    let bmr   = (10 * w) + (6.25 * h) - (5 * a) + 5;
    let mult  = 1.2;
    if (userGoals.activityLevel === 'moderate') mult = 1.55;
    if (userGoals.activityLevel === 'active')   mult = 1.725;
    let tdee = bmr * mult;
    if (userGoals.goal === 'muscle')  tdee += 300;
    if (userGoals.goal === 'fatloss') tdee -= 500;
    targetCalories = Math.round(tdee);
    targetProtein  = Math.round((targetCalories * 0.30) / 4);
    targetCarbs    = Math.round((targetCalories * 0.45) / 4);
    targetFats     = Math.round((targetCalories * 0.25) / 9);
  }

  const nutrition    = dailyNutrition || { consumedCalories: 0, protein: { current: 0 }, carbs: { current: 0 }, fats: { current: 0 } };
  const caloriesLeft = Math.max(0, targetCalories - nutrition.consumedCalories);
  let nutritionPct   = targetCalories === 0 ? 0 : nutrition.consumedCalories / targetCalories;
  if (nutritionPct < 0) nutritionPct = 0;
  if (nutritionPct > 1) nutritionPct = 1;

  const macros = [
    { label: 'Protein', current: nutrition.protein?.current || 0, target: targetProtein, color: logoGreen,   unit: 'g' },
    { label: 'Carbs',   current: nutrition.carbs?.current   || 0, target: targetCarbs,   color: '#3B82F6',  unit: 'g' },
    { label: 'Fats',    current: nutrition.fats?.current    || 0, target: targetFats,    color: '#EC4899',  unit: 'g' },
  ];

  const exercise     = dailyExercise || { caloriesBurned: 320, activeMinutes: 45, targetMinutes: 60, recentExercise: 'Morning Jog' };
  const estBurnPct   = Math.round((exercise.caloriesBurned / targetCalories) * 100);

  // Chart
  const chartConfig = {
    backgroundGradientFrom: baseColor,
    backgroundGradientTo:   baseColor,
    color: (opacity = 1) => `rgba(33, 51, 42, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: { r: '4', strokeWidth: '2', stroke: logoGreen },
    decimalPlaces: 0,
  };
  // Weight chart data — use the lifted history if available, otherwise seed a flat line
  const fallbackStart = startingWeight;
  const weightDataPoints = weightHistory && weightHistory.length === 7
    ? weightHistory
    : Array.from({ length: 6 }, () => fallbackStart).concat([currentWeight]);
  const weightChartData  = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: weightDataPoints, color: () => logoGreen, strokeWidth: 3 }],
  };

  const handlePressIn  = (id) => setIsPressedBtn(id);
  const handlePressOut = ()   => setIsPressedBtn(null);

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── HEADER ── */}
        <FadeCard delay={0} style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.appName}>MacroSync</Text>
            <Text style={styles.greeting}>Hello, {userProfile?.name || 'User'}!</Text>
            <Text style={styles.subGreeting}>Goal: {primaryGoal}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => onTabChange && onTabChange('NOTIFICATIONS')} style={{ marginRight: 16 }}>
              <Bell color="#1A2B23" size={26} />
              {notifications.some(n => !n.read) && (
                <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E53E3E', borderWidth: 2, borderColor: '#F0F4F2' }} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onTabChange && onTabChange('SETTINGS')} activeOpacity={0.8} style={styles.avatarContainer}>
              <View style={styles.avatarGlass}>
                {userProfile?.profileImage ? (
                  <Image source={{ uri: userProfile.profileImage }} style={styles.avatarImage} />
                ) : (
                  <User color="#4EA685" size={22} strokeWidth={2.5} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </FadeCard>

        {/* ── 1. WEIGHT TRACKING PROGRESS CARD ── */}
        <FadeCard delay={80} style={styles.formCard}>
          <Text style={styles.cardTitle}>Weight Progress</Text>
          <View style={[styles.weightSplitLayout, { alignItems: 'flex-start' }]}>
            {/* Ring */}
            <AnimatedRing size={120} radius={ringRadius} strokeWidth={ringStroke} pct={progressPct} color={logoGreen} delay={200}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#1A2B23' }}>{Math.round(progressPct * 100)}%</Text>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#7FA293', marginTop: 0 }}>TO GOAL</Text>
            </AnimatedRing>

            {/* Stats */}
            <View style={{ flex: 1, marginLeft: 28 }}>
              <View style={styles.statsGrid}>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Starting</Text>
                  <Text style={styles.statValue}>{startingWeight.toFixed(1)} kg</Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Current</Text>
                  <Text style={[styles.statValue, { color: logoGreen }]}>{currentWeight.toFixed(1)} kg</Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Goal</Text>
                  <Text style={styles.statValue}>{goalWeight.toFixed(1)} kg</Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Gain/Loss</Text>
                  <Text style={[styles.statValue, { color: weightChange > 0 ? '#E53E3E' : '#3B82F6' }]}>
                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
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
            {/* Calorie ring */}
            <View style={styles.calorieColumn}>
              <AnimatedRing
                size={120} radius={ringRadius} strokeWidth={ringStroke}
                pct={nutritionPct}
                color={nutrition.consumedCalories > targetCalories ? '#C53030' : logoGreen}
                delay={300}
              >
                <Text style={[styles.calorieBigText, { fontSize: 16 }, nutrition.consumedCalories > targetCalories && { color: '#C53030' }]}>
                  {nutrition.consumedCalories.toLocaleString()}{' '}
                  <Text style={{ fontSize: 12, color: '#7FA293', fontWeight: '800' }}>/ {targetCalories.toLocaleString()}</Text>
                </Text>
                <Text style={styles.calorieSubText}>KCAL EATEN</Text>
              </AnimatedRing>
              {nutrition.consumedCalories > targetCalories && (
                <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 }}>
                  <Text style={{ fontSize: 9, color: '#DC2626', fontWeight: 'bold' }}>OVER LIMIT</Text>
                </View>
              )}
            </View>

            {/* Macro bars */}
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
            <View style={styles.warningBanner}>
              <Text style={styles.warningBannerText}>
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
              { icon: <Activity color="#EC4899" size={24} strokeWidth={2.5} />, val: exercise.caloriesBurned, label: 'Kcal Burned' },
              { icon: <Droplets color={logoGreen}  size={24} strokeWidth={2.5} />, val: `${exercise.activeMinutes}/60`, label: 'Active Mins' },
              { icon: <Footprints color="#3B82F6" size={24} strokeWidth={2.5} />, val: '6.5k', label: 'Steps Today' },
            ].map((item, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' }}>
                <View style={{ marginBottom: 8 }}>{item.icon}</View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A2B23' }}>{item.val}</Text>
                <Text style={{ fontSize: 9, color: '#7FA293', fontWeight: '800', marginTop: 2, textTransform: 'uppercase' }}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 20, paddingHorizontal: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#1A2B23' }}>
                Recent Workout: <Text style={{ color: '#7FA293' }}>{exercise.recentExercise}</Text>
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: logoGreen }}>
                {Math.min(Math.round((exercise.activeMinutes / (exercise.targetMinutes || 60)) * 100), 100)}% Goal
              </Text>
            </View>
            <AnimatedBar pct={Math.min((exercise.activeMinutes / (exercise.targetMinutes || 60)), 1)} color={logoGreen} delay={500} />
          </View>
          {exercise.activeMinutes >= (exercise.targetMinutes || 60) && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningBannerText}>
                ⚡ Daily exercise quota achieved ({exercise.activeMinutes} mins). Excellent work, make sure to rest!
              </Text>
            </View>
          )}
        </FadeCard>

        {/* ── 3.5 HYDRATION ── */}
        <FadeCard delay={320} style={styles.formCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>Hydration Tracking</Text>
            <View style={{ backgroundColor: '#BEE3F8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#3182CE' }}>AI RECOMMENDED</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#1A2B23' }}>
                {consumedGlasses}{' '}
                <Text style={{ fontSize: 16, color: '#7FA293' }}>/ {targetGlasses}</Text>
              </Text>
              <Text style={{ fontSize: 11, color: '#7FA293', fontWeight: '800', marginTop: 2 }}>GLASSES (250ml)</Text>
              <Text style={{ fontSize: 12, color: '#1A2B23', fontWeight: '500', marginTop: 12, lineHeight: 18 }}>
                Your custom daily target is{' '}
                <Text style={{ fontWeight: '700', color: '#3182CE' }}>{(targetGlasses * 250).toLocaleString()}ml</Text>
                {' '}based on your weight ({weightKg}kg) and height ({heightCm}cm).
              </Text>
            </View>

            {/* Vertical water bar */}
            <View style={{ width: 80, alignItems: 'center' }}>
              <View style={{ height: 100, width: 64, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 8, borderWidth: 2, borderColor: '#90CDF4', justifyContent: 'flex-end', overflow: 'hidden' }}>
                <View style={{ height: `${Math.min((consumedGlasses / targetGlasses) * 100, 100)}%`, width: '100%', backgroundColor: '#3182CE', opacity: 0.85 }} />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: '#3182CE', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 16, alignItems: 'center', shadowColor: '#3182CE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}
            onPress={handleAddGlass}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>+ Quick Add Glass</Text>
          </TouchableOpacity>
          {consumedGlasses >= targetGlasses && (
            <View style={[styles.warningBanner, { borderColor: '#BEE3F8', backgroundColor: '#EBF8FF' }]}>
              <Text style={[styles.warningBannerText, { color: '#2B6CB0' }]}>
                💧 Daily hydration target achieved ({consumedGlasses} / {targetGlasses} glasses). Stay balanced and avoid overhydrating.
              </Text>
            </View>
          )}
        </FadeCard>

        {/* ── 4. WEIGHT TREND ANALYTICS ── */}
        <FadeCard delay={400} style={styles.formCard}>
          <View style={styles.analyticsHubHeader}>
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Weight Trend Analytics</Text>
            <Text style={{ fontSize: 10, color: '#7FA293', marginTop: 4, fontWeight: '700' }}>
              This chart is a trend chart tracking your weekly progress.
            </Text>
          </View>

          <View style={styles.glassDivider} />

          <View style={styles.chartContainer}>
            <LineChart
              data={weightChartData}
              width={screenWidth - 76}
              height={160}
              chartConfig={{ ...chartConfig, decimalPlaces: 1 }}
              bezier
              style={{ marginVertical: 4, borderRadius: 16 }}
              withInnerLines={true}
              withOuterLines={false}
              yAxisSuffix=" kg"
              renderDotContent={({ x, y, index, indexData }) => {
                if (index === 0) return null;
                const diff = indexData - weightDataPoints[index - 1];
                const diffColor   = diff > 0 ? '#C53030' : diff < 0 ? '#3B82F6' : '#7FA293';
                const sign        = diff > 0 ? '+' : diff < 0 ? '-' : '';
                const displayValue = `${sign} ${Math.abs(diff).toFixed(1)}`;
                return (
                  <SvgText key={index} x={x + 5} y={y - 14} fill={diffColor} fontSize="10" fontWeight="900" textAnchor="middle">
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
            <Text style={styles.modalSubtitle}>Enter your current weight (kg) below.</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="Enter weight in kg..."
              placeholderTextColor="#AEC2B7"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowWeightModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={async () => {
                const parsed = parseFloat(weightInput);
                if (!isNaN(parsed) && parsed > 0) {
                  // Optimistic UI update
                  if (setGlobalLoggedWeight) setGlobalLoggedWeight(parsed);
                  // Append to persistent chart history (slide window forward)
                  if (setWeightHistory) {
                    setWeightHistory(prev => {
                      const base = prev && prev.length === 7
                        ? prev
                        : Array.from({ length: 6 }, () => startingWeight).concat([currentWeight]);
                      return [...base.slice(1), parseFloat(parsed.toFixed(1))];
                    });
                  }
                  setShowWeightModal(false);
                  if (setNotifications) {
                    setNotifications(prev => [{
                      id: 'w' + Date.now(),
                      title: 'Weight Logged ⚖️',
                      category: 'achievement',
                      time: 'Just Now',
                      read: false,
                      message: `Successfully logged your weight as ${parsed.toFixed(1)} kg. Keep up the great work!`
                    }, ...prev]);
                  }

                  if (!isOnline) {
                    await addToSyncQueue({ type: 'LOG_WEIGHT', payload: { user_id: userId, new_weight: parsed, unit: userBaseline?.unit || 'kg' } });
                    await updateCachedDashboardField(userId, { profile: { currentWeight: parsed } });
                    Alert.alert('📴 Saved Offline', 'Weight saved locally. Will sync when back online.');
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
                      Alert.alert("Error Logging Weight", errData.detail || "Failed to log weight to server.");
                    }
                  } catch (error) {
                    console.log("LOG WEIGHT ERROR:", error);
                    await addToSyncQueue({ type: 'LOG_WEIGHT', payload: { user_id: userId, new_weight: parsed, unit: userBaseline?.unit || 'kg' } });
                    await updateCachedDashboardField(userId, { profile: { currentWeight: parsed } });
                  }
                } else {
                  Alert.alert('Invalid input', 'Please enter a valid number for your weight.');
                }
              }}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── NEW GOAL MODAL (shown on goal completion) ── */}
      <Modal visible={showNewGoalModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: 28 }]}>
            {/* Trophy Header */}
            <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>🏆</Text>
            <Text style={[styles.modalTitle, { fontSize: 22 }]}>Goal Achieved!</Text>
            <Text style={[styles.modalSubtitle, { marginBottom: 24 }]}>
              You've reached your target of {goalWeight.toFixed(1)} kg.{`\n`}Choose your next fitness goal:
            </Text>

            {NEW_GOAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.newGoalOptionBtn}
                onPress={() => handleSelectNewGoal(option)}
                activeOpacity={0.75}
              >
                <Text style={styles.newGoalOptionLabel}>{option.label}</Text>
                <Text style={styles.newGoalOptionDesc}>{option.desc}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalCancel, { marginTop: 12 }]}
              onPress={() => setShowNewGoalModal(false)}
            >
              <Text style={styles.modalCancelText}>Decide Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── FLOATING CHATBOT ── */}
      <DraggableChatbotButton onPress={() => onTabChange && onTabChange('CHATBOT')} />

      {/* ── BOTTOM NAV ── */}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const getStyles = (theme) => StyleSheet.create({
  fullscreenOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    width: screenWidth, height: screenHeight, backgroundColor: baseColor,
  },
  container:    { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 54 : 48, paddingBottom: 115 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, paddingHorizontal: 4, width: '100%',
  },
  headerTextGroup: { flex: 1, paddingRight: 12 },
  appName:     { fontSize: 12, fontWeight: '900', color: logoGreen, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 },
  greeting:    { fontSize: 28, fontWeight: '900', color: '#1A2B23', letterSpacing: -0.5 },
  subGreeting: { fontSize: 13, fontWeight: '700', color: '#7FA293', marginTop: 2 },

  avatarContainer: { borderRadius: 24, borderWidth: 1, borderColor: '#D4E2DC' },
  avatarGlass:     { width: 44, height: 44, borderRadius: 22, backgroundColor: baseColor, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText:      { fontWeight: '900', color: logoGreen, fontSize: 16 },
  avatarImage:     { width: 44, height: 44, borderRadius: 22 },

  // Neumorphic card
  formCard: {
    backgroundColor: baseColor,
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
  },
  cardTitle: { fontSize: 11, color: '#1A2B23', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, fontWeight: '800', marginLeft: 2 },

  // Weight card
  weightSplitLayout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsGrid:     { flex: 1, flexDirection: 'row', flexWrap: 'wrap', marginLeft: 20 },
  statGridItem:  { width: '50%', marginBottom: 10 },
  statLabel:     { fontSize: 10, color: '#7FA293', textTransform: 'uppercase', fontWeight: '800', marginBottom: 2 },
  statValue:     { fontSize: 15, fontWeight: '900', color: '#1A2B23' },

  // Nutrition card
  nutritionRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  calorieColumn:      { marginRight: 18, alignItems: 'center' },
  calorieBigText:     { fontSize: 18, fontWeight: '900', color: '#1A2B23', letterSpacing: -0.5 },
  calorieSubText:     { fontSize: 9, color: '#7FA293', fontWeight: '800' },
  macroColumn:        { flex: 1, justifyContent: 'center' },
  macroRow:           { marginBottom: 10 },
  macroInfo:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  macroLabel:         { fontSize: 12, fontWeight: '800', color: '#1A2B23' },
  macroValue:         { fontSize: 11, color: '#7FA293', fontWeight: '700' },

  // Analytics
  analyticsHubHeader: { marginBottom: 12 },
  glassDivider:       { height: 1, backgroundColor: '#D4E2DC', marginVertical: 14 },
  chartContainer:     { alignItems: 'center', justifyContent: 'center', marginLeft: -15 },

  // Modal
modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: baseColor, borderRadius: 20, padding: 24, shadowColor: softGreenShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: logoGreen, marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#7FA293', textAlign: 'center', marginBottom: 20 },
  modalInput: { width: '100%', backgroundColor: clearWhiteHighlight, borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '600', color: '#1A2B23', marginBottom: 16, borderWidth: 1, borderColor: '#D4E2DC' },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 8 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: clearWhiteHighlight, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#D4E2DC' },
  modalCancelText: { color: '#7FA293', fontWeight: '700', fontSize: 14 },
  modalSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: logoGreen, alignItems: 'center', marginLeft: 8 },
  modalSaveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // New Goal Options (shown on goal completion)
  newGoalOptionBtn: {
    width: '100%',
    backgroundColor: '#EBF5F0',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C6E0D4',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  newGoalOptionLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A2B23',
    marginBottom: 2,
  },
  newGoalOptionDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7FA293',
  },

  // Chatbot FAB
  chatbotFab: {
    position: 'absolute', bottom: 104, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: logoGreen,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#387860', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.6, shadowRadius: 8,
    elevation: 20, zIndex: 100,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderTopColor: '#64D4AA', borderLeftColor: '#64D4AA',
  },

  // Nav bar
  navBarOuterEdge:     { borderWidth: 1, borderColor: '#E2ECE7', position: 'absolute', bottom: 0, left: 0, right: 0, height: 84, backgroundColor: baseColor, paddingHorizontal: 6, paddingBottom: Platform.OS === 'ios' ? 18 : 2 },
  navBarContentRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: '100%', position: 'relative' },
  navTabItem:          { flex: 1.1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  navTabText:          { fontSize: 9, fontWeight: '800', color: '#7FA293', marginTop: 4, textAlign: 'center' },
  centerCameraContainer: { position: 'relative', width: 68, height: '100%', alignItems: 'center', justifyContent: 'center' },
  cameraCircleButton:  { backgroundColor: logoGreen, width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: -20 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningBannerText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
    marginLeft: 6,
    flex: 1,
    lineHeight: 15,
  },
});
