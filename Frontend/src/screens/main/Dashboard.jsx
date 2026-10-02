// --- IMPORTS ---
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  useWindowDimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Image,
  Animated,
  Easing,
} from "react-native";
import {
  Droplets,
  Footprints,
  Activity,
  Bell,
  Flame,
  Clock,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Target,
} from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

import { useTheme } from "../../context/ThemeContext";
import useDashboard from "../../hooks/useDashboard";
import PressableCard from "../../components/PressableCard";

// --- CONSTANTS & CONFIGURATION ---
const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

// --- LIGHTWEIGHT SUBCOMPONENTS ---

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Dynamic SVG circular metric progress ring
const AnimatedRing = React.memo(function AnimatedRing({
  radius,
  strokeWidth,
  pct,
  color = COLORS.logoGreen,
  trackColor = "#E2E8F0",
  size,
  children,
  delay = 0,
}) {
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
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        {children}
      </View>
    </View>
  );
});

// Horizontal progress bar indicator
const AnimatedBar = React.memo(function AnimatedBar({ pct, color, delay = 0 }) {
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
    <View
      style={{
        height: 6,
        backgroundColor: "#E2E8F0",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          height: "100%",
          borderRadius: 3,
          backgroundColor: color,
          width: animWidth.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
  );
});

// Interactive fluid physics animated water glass readout
const AnimatedWaterGlassBar = React.memo(function AnimatedWaterGlassBar({ consumed, target, waterColor, theme }) {
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
        Animated.timing(waveY, {
          toValue: 1.0,
          duration: 320,
          easing: Easing.out(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(waveY, {
          toValue: -0.6,
          duration: 300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(waveY, {
          toValue: 0.3,
          duration: 260,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(waveY, {
          toValue: -0.1,
          duration: 220,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(waveY, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(waveX, {
          toValue: 1.0,
          duration: 550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(waveX, {
          toValue: -0.5,
          duration: 450,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(waveX, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, [consumed, target]);

  const waveTranslateY = waveY.interpolate({
    inputRange: [-1, 1],
    outputRange: [-5, 5],
  });
  const waveTranslateX = waveX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-18, 18],
  });
  const waveScaleY = waveY.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.85, 1.0, 1.15],
  });
  const liquidTop = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [88, 0],
  });

  return (
    <View style={{ width: 80, alignItems: "center" }}>
      <View
        style={{
          height: 110,
          width: 64,
          position: "relative",
          alignItems: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 4,
            left: 2,
            right: 2,
            bottom: 0,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: theme?.border || COLORS.glassBorder,
            borderBottomWidth: 0,
            overflow: "hidden",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 2,
            right: 2,
            height: 10,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: COLORS.glassRimBorder,
            backgroundColor: COLORS.glassRimBg,
            zIndex: 30,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 6,
            right: 6,
            bottom: 14,
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
            overflow: "hidden",
            backgroundColor: theme?.inputBg || COLORS.waterGlassBg,
            zIndex: 5,
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              top: liquidTop,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: COLORS.waterColor,
              opacity: 1.0,
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                top: -3,
                left: -18,
                right: -18,
                height: 10,
                transform: [
                  { translateY: waveTranslateY },
                  { translateX: waveTranslateX },
                  { scaleY: waveScaleY },
                ],
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 6,
                  backgroundColor: COLORS.waterHighlight,
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                }}
              />
            </Animated.View>
          </Animated.View>
        </View>
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 2,
            right: 2,
            height: 15,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            borderWidth: 2,
            borderColor: COLORS.glassRimBorder,
            backgroundColor: COLORS.glassBottomBg,
            zIndex: 20,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              bottom: 2,
              left: 4,
              right: 4,
              height: 6,
              borderRadius: 6,
              borderWidth: 1.5,
              borderColor: COLORS.glassBottomBorder,
              backgroundColor: COLORS.glassBottomReflect,
            }}
          />
        </View>
      </View>
    </View>
  );
});

// Staggered entry animation wrapper card
const FadeCard = React.memo(function FadeCard({ delay = 0, style, children }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {children}
    </Animated.View>
  );
});



const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// --- MAIN DASHBOARD SCREEN ---

export default function DashboardScreen({
  onTabChange,
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
}) {
  const { theme, isDarkMode } = useTheme();

  // Screen styling (memoized on theme and dark mode)
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Dashboard business logic hook: state, pedometer watcher, calculations & handlers
  const {
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
    chartConfig,
    rollingLabels,
    weightDataPoints,
    maxWeeklyWeight,
    minWeeklyWeight,
    netWeeklyChange,
    weightChartData,
    greetingObj,
    currentDateStr,
    displayName,
    handleAddGlass,
    handleSelectNewGoal,
    handleSaveWeightInput,
    executeWeightSave,
    getGoalProgressColor,
  } = useDashboard({
    userBaseline,
    userGoals,
    dailyNutrition,
    dailyExercise,
    setDailyExercise,
    notifications,
    setNotifications,
    globalLoggedWeight,
    setGlobalLoggedWeight,
    globalConsumedGlasses,
    setGlobalConsumedGlasses,
    userProfile,
    userId,
    onRefreshDashboard,
    isOnline,
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
  });

  const { width: windowWidth } = useWindowDimensions();
  const [chartLayoutWidth, setChartLayoutWidth] = useState(0);

  // Responsive card width constraint (capped cleanly inside the max 680px card)
  const maxAvailableCardWidth = Math.min(windowWidth - 72, 608);
  const chartWidth = Math.max(
    280,
    chartLayoutWidth > 0 ? chartLayoutWidth : maxAvailableCardWidth
  );

  /* remove everything in the screen */
  // return <View style={styles.fullscreenOverlay} />;

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === "android"}
      >
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
              {greetingObj.text}, {displayName}!
            </Text>

            <View style={styles.headerBadgeRow}>
              <View style={styles.goalBadge}>
                <Target
                  size={12}
                  color={COLORS.logoGreen}
                  strokeWidth={2.5}
                  style={styles.goalBadgeIcon}
                />
                <Text style={styles.goalBadgeText}>
                  {primaryGoal}
                </Text>
              </View>

              {currentStreak > 0 && (
                <View style={styles.streakBadge}>
                  <Flame
                    size={12}
                    color={COLORS.orange}
                    strokeWidth={2.5}
                    style={styles.streakBadgeIcon}
                  />
                  <Text style={styles.streakBadgeText}>
                    {currentStreak} Day Streak
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => onTabChange && onTabChange("NOTIFICATIONS")}
              style={{ marginRight: 16 }}
            >
              <Bell color={theme?.textPrimary || "#0F172A"} size={26} />
              {notifications.some((n) => !n.read) && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#EF4444",
                    borderWidth: 2,
                    borderColor: theme?.background || "#F8FAFC",
                  }}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onTabChange && onTabChange("SETTINGS")}
              activeOpacity={0.8}
              style={styles.avatarContainer}
            >
              <View style={styles.avatarGlass}>
                {userProfile?.profileImage && !imageError ? (
                  <Image
                    source={{ uri: userProfile.profileImage }}
                    style={styles.avatarImage}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "900",
                      letterSpacing: 0.5,
                    }}
                  >
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
          <View
            style={[styles.weightSplitLayout, { alignItems: "flex-start" }]}
          >
            <AnimatedRing
              size={120}
              radius={52}
              strokeWidth={10}
              pct={progressPct}
              color={COLORS.logoGreen}
              delay={200}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  color: theme?.textPrimary || "#0F172A",
                }}
              >
                {Math.round(progressPct * 100)}%
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: theme?.textSecondary || "#94A3B8",
                  marginTop: 0,
                }}
              >
                TO GOAL
              </Text>
            </AnimatedRing>

            <View style={{ flex: 1, marginLeft: 28 }}>
              <View style={styles.statsGrid}>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Starting</Text>
                  <Text style={styles.statValue}>
                    {startingWeight.toFixed(1)} {weightUnit}
                  </Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Current</Text>
                  <Text style={[styles.statValue, { color: COLORS.logoGreen }]}>
                    {currentWeight.toFixed(1)} {weightUnit}
                  </Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Goal</Text>
                  <Text style={styles.statValue}>
                    {goalWeight.toFixed(1)} {weightUnit}
                  </Text>
                </View>
                <View style={styles.statGridItem}>
                  <Text style={styles.statLabel}>Gain/Loss</Text>
                  <Text
                    style={[
                      styles.statValue,
                      { color: getGoalProgressColor(weightChange) },
                    ]}
                  >
                    {weightChange > 0 ? "+" : ""}
                    {weightChange.toFixed(1)} {weightUnit}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setWeightInput(currentWeight.toFixed(1));
                  setShowWeightModal(true);
                }}
                style={{
                  backgroundColor: COLORS.logoGreen,
                  paddingVertical: 10,
                  borderRadius: 12,
                  marginTop: 4,
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}
                >
                  + Log Weight
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </FadeCard>

        {/* ── 2. DAILY NUTRITION CARD ── */}
        <FadeCard delay={160} style={styles.formCard}>
          <Text style={styles.cardTitle}>Daily Nutrition</Text>
          <View style={[styles.nutritionRow, { alignItems: "flex-start" }]}>
            <View style={styles.calorieColumn}>
              <AnimatedRing
                size={120}
                radius={52}
                strokeWidth={10}
                pct={nutritionPct}
                color={
                  netCalories2 > targetCalories
                    ? "#EF4444"
                    : COLORS.logoGreen
                }
                delay={300}
              >
                <Text
                  style={[
                    styles.calorieBigText,
                    { fontSize: 16 },
                    netCalories2 > targetCalories && {
                      color: "#EF4444",
                    },
                  ]}
                >
                  {netCalories2.toLocaleString()}{" "}
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme?.textSecondary || "#94A3B8",
                      fontWeight: "800",
                    }}
                  >
                    / {targetCalories.toLocaleString()}
                  </Text>
                </Text>
                <Text style={styles.calorieSubText}>NET KCAL</Text>
              </AnimatedRing>
              {nutrition.consumedCalories > targetCalories && (
                <View style={styles.overLimitBadge}>
                  <Text style={styles.overLimitText}>
                    OVER LIMIT
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.macroColumn,
                { height: 120, justifyContent: "center" },
              ]}
            >
              {macros.map((macro, idx) => {
                const pct = Math.min(macro.current / macro.target, 1);
                return (
                  <View key={idx} style={styles.macroRow}>
                    <View style={styles.macroInfo}>
                      <Text style={styles.macroLabel}>{macro.label}</Text>
                      <Text style={styles.macroValue}>
                        {macro.current}/{macro.target}
                        {macro.unit}
                      </Text>
                    </View>
                    <AnimatedBar
                      pct={pct}
                      color={macro.color}
                      delay={400 + idx * 80}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Eaten − Burned = Net Kcal equation strip ── */}
          {exercise2BurnedCalories > 0 && (
            <View style={styles.equationStrip}>
              <Text style={styles.equationText}>
                <Text style={{ color: isDarkMode ? COLORS.textLight : COLORS.textDark, fontWeight: '800' }}>
                  {(nutrition.consumedCalories || 0).toLocaleString()}
                </Text>
                {' eaten − '}
                <Text style={{ color: COLORS.orange, fontWeight: '800' }}>
                  {exercise2BurnedCalories.toLocaleString()}
                </Text>
                {' burned = '}
                <Text style={{
                  color: netCalories2 > targetCalories ? COLORS.red : netCalories2 === 0 ? COLORS.logoGreen : (isDarkMode ? COLORS.textLight : COLORS.textDark),
                  fontWeight: '900'
                }}>
                  {netCalories2.toLocaleString()} net kcal
                </Text>
              </Text>
            </View>
          )}

          {/* ── Status badges ── */}
          {(() => {
            const isOverGross2 = (nutrition.consumedCalories || 0) > targetCalories;
            const isOverNet2   = netCalories2 > targetCalories;
            const isSaved2     = isOverGross2 && !isOverNet2;
            if (isSaved2) return (
              <View style={styles.exerciseOffsetBanner}>
                <Text style={styles.exerciseOffsetText}>
                  Saved by Exercise! Your workout offset your calorie overage.
                </Text>
              </View>
            );
            if (isOverNet2) return (
              <View style={styles.calorieExceededBanner}>
                <Text style={styles.calorieExceededText}>
                  You have exceeded your net calorie budget ({netCalories2.toLocaleString()} / {targetCalories.toLocaleString()} kcal).
                </Text>
              </View>
            );
            return null;
          })()}
        </FadeCard>

        {/* ── 3. EXERCISE & ACTIVITY ── */}
        <FadeCard delay={240} style={styles.formCard}>
          <Text style={styles.cardTitle}>Activity & Movement</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            {[
              {
                icon: <Flame color="#F97316" size={22} strokeWidth={2.5} />,
                val: exercise.caloriesBurned,
                label: "Kcal Burned",
              },
              {
                icon: <Clock color={COLORS.logoGreen} size={22} strokeWidth={2.5} />,
                val: `${exercise.activeMinutes}/60`,
                label: "Active Mins"
              },
              {
                icon: (
                  <Footprints color="#3B82F6" size={22} strokeWidth={2.5} />
                ),
                val:
                  currentSteps >= 1000
                    ? `${(currentSteps / 1000).toFixed(1)}k`
                    : `${currentSteps}`,
                label: "Steps Today",
              },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={1}
                disabled={true}
                style={{
                  flex: 1,
                  backgroundColor: theme?.inputBg || "#F1F5F9",
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 6,
                  alignItems: "center",
                  marginHorizontal: 4,
                  borderWidth: 1,
                  borderColor: theme?.border || "#E2E8F0",
                }}
              >
                <View style={{ marginBottom: 8 }}>{item.icon}</View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    color: item.textColor || theme?.textPrimary || "#0F172A",
                  }}
                >
                  {item.val}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: item.textColor || theme?.textSecondary || "#94A3B8",
                    fontWeight: "800",
                    marginTop: 2,
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <PressableCard
            scaleDown={0.97}
            onPress={() => onTabChange && onTabChange("WORKOUT")}
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 16,
              backgroundColor: theme?.inputBg || "#F1F5F9",
              borderWidth: 1,
              borderColor: theme?.border || "#E2E8F0",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                <View style={styles.workoutIconBadge}>
                  <Flame color={COLORS.orange} size={18} strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "800",
                      color: theme?.textSecondary || "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    Recent Workout
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                      fontSize: 13,
                      fontWeight: "900",
                      color: theme?.textPrimary || "#0F172A",
                      marginTop: 1,
                    }}
                  >
                    {exercise.recentExercise}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.workoutGoalChip}>
                  <Text style={styles.workoutGoalChipText}>
                    {Math.min(
                      Math.round(
                        (exercise.activeMinutes /
                          (exercise.targetMinutes || 60)) *
                          100,
                      ),
                      100,
                    )}
                    % Goal
                  </Text>
                </View>
                <ChevronRight
                  color={theme?.textSecondary || "#94A3B8"}
                  size={18}
                />
              </View>
            </View>

            <AnimatedBar
              pct={Math.min(
                exercise.activeMinutes / (exercise.targetMinutes || 60),
                1,
              )}
              color={COLORS.orange}
              delay={500}
            />
          </PressableCard>

          {exercise.activeMinutes >= (exercise.targetMinutes || 60) && (
            <View style={styles.exerciseQuotaBanner}>
              <Text style={styles.exerciseQuotaBannerText}>
                Daily exercise quota achieved ({exercise.activeMinutes} mins).
                Excellent work, make sure to rest!
              </Text>
            </View>
          )}
        </FadeCard>

        {/* ── 3.5 HYDRATION ── */}
        <FadeCard delay={320} style={styles.formCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.cardTitle}>Hydration Tracking</Text>
            <View
              style={{
                backgroundColor: theme?.inputBg || "#F1F5F9",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "bold",
                  color: theme?.textSecondary || "#64748B",
                }}
              >
                AI RECOMMENDED
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  color: theme?.textPrimary || "#0F172A",
                }}
              >
                {consumedGlasses}{" "}
                <Text
                  style={{
                    fontSize: 16,
                    color: theme?.textSecondary || "#94A3B8",
                  }}
                >
                  / {targetGlasses}
                </Text>
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: theme?.textSecondary || "#94A3B8",
                  fontWeight: "800",
                  marginTop: 2,
                }}
              >
                GLASSES (250ml)
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: theme?.textPrimary || "#0F172A",
                  fontWeight: "500",
                  marginTop: 12,
                  lineHeight: 18,
                }}
              >
                Your custom daily target is{" "}
                <Text style={{ fontWeight: "700", color: COLORS.waterColor }}>
                  {(targetGlasses * 250).toLocaleString()}ml
                </Text>{" "}
                based on your weight ({weightKg}kg) and height ({heightCm}cm).
              </Text>
            </View>

            <AnimatedWaterGlassBar
              consumed={consumedGlasses}
              target={targetGlasses}
              waterColor={COLORS.waterColor}
              theme={theme}
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: COLORS.waterColor,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              marginTop: 16,
              alignItems: "center",
            }}
            onPress={handleAddGlass}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>
              + Quick Add Glass
            </Text>
          </TouchableOpacity>

          {consumedGlasses >= targetGlasses && (
            <View
              style={[
                styles.warningBanner,
                {
                  borderColor: theme?.border || "#E2E8F0",
                  backgroundColor: theme?.inputBg || "#F8FAFC",
                },
              ]}
            >
              <Text style={[styles.warningBannerText, { color: COLORS.waterColor }]}>
                Daily hydration target achieved ({consumedGlasses} /{" "}
                {targetGlasses} glasses). Stay balanced and avoid overhydrating.
              </Text>
            </View>
          )}
        </FadeCard>

        {/* ── 4. WEIGHT TREND ANALYTICS ── */}
        <FadeCard delay={400} style={styles.formCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text style={styles.cardTitle}>Weight Trend Analytics</Text>
              <Text
                style={{
                  fontSize: 10,
                  color: theme?.textSecondary || "#94A3B8",
                  marginTop: 2,
                  fontWeight: "700",
                }}
              >
                7-Day Weight Trajectory & Delta Points
              </Text>
            </View>

            <View
              style={[
                styles.weeklyDeltaBadge,
                {
                  backgroundColor:
                    parseFloat(netWeeklyChange) < 0
                      ? COLORS.greenAlpha
                      : parseFloat(netWeeklyChange) > 0
                      ? COLORS.redAlpha
                      : isDarkMode
                      ? COLORS.borderDark
                      : COLORS.pillLight,
                  borderColor:
                    parseFloat(netWeeklyChange) < 0
                      ? COLORS.greenAlphaBorder
                      : parseFloat(netWeeklyChange) > 0
                      ? COLORS.redAlphaBorder
                      : isDarkMode
                      ? COLORS.borderDark
                      : COLORS.borderLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.weeklyDeltaText,
                  { color: getGoalProgressColor(parseFloat(netWeeklyChange)) },
                ]}
              >
                7D NET: {parseFloat(netWeeklyChange) > 0 ? "+" : ""}
                {netWeeklyChange} {weightUnit}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 14,
              marginBottom: 4,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: theme?.inputBg || "#F1F5F9",
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 8,
                alignItems: "center",
                marginHorizontal: 3,
                borderWidth: 1,
                borderColor: theme?.border || "#E2E8F0",
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "800",
                  color: theme?.textSecondary || "#94A3B8",
                  textTransform: "uppercase",
                }}
              >
                7D Peak
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "900",
                  color: theme?.textPrimary || "#0F172A",
                  marginTop: 2,
                }}
              >
                {maxWeeklyWeight} {weightUnit}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: theme?.inputBg || "#F1F5F9",
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 8,
                alignItems: "center",
                marginHorizontal: 3,
                borderWidth: 1,
                borderColor: theme?.border || "#E2E8F0",
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "800",
                  color: theme?.textSecondary || "#94A3B8",
                  textTransform: "uppercase",
                }}
              >
                7D Low
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "900",
                  color: theme?.textPrimary || "#0F172A",
                  marginTop: 2,
                }}
              >
                {minWeeklyWeight} {weightUnit}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: theme?.inputBg || "#F1F5F9",
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 8,
                alignItems: "center",
                marginHorizontal: 3,
                borderWidth: 1,
                borderColor: theme?.border || "#E2E8F0",
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "800",
                  color: theme?.textSecondary || "#94A3B8",
                  textTransform: "uppercase",
                }}
              >
                7D Avg
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "900",
                  color: theme?.textPrimary || "#0F172A",
                  marginTop: 2,
                }}
              >
                {(
                  weightDataPoints.reduce((a, b) => a + b, 0) /
                  weightDataPoints.length
                ).toFixed(1)}{" "}
                {weightUnit}
              </Text>
            </View>
          </View>

          <View style={styles.glassDivider} />

          <View
            style={styles.chartContainer}
            onLayout={(e) => {
              const w = Math.floor(e.nativeEvent.layout.width);
              if (w > 0 && Math.abs(w - chartLayoutWidth) > 16) {
                setChartLayoutWidth(w);
              }
            }}
          >
            <LineChart
              data={weightChartData}
              width={chartWidth}
              height={175}
              chartConfig={{
                ...chartConfig,
                fillShadowGradient: COLORS.logoGreen,
                fillShadowGradientOpacity: isDarkMode ? 0.35 : 0.22,
                fillShadowGradientTo: theme?.surface || COLORS.base,
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
                const sign = diff > 0 ? "+" : "";
                const displayValue = `${sign}${diff.toFixed(1)}`;
                const textY = y < 25 ? y + 18 : y - 10;
                return (
                  <SvgText
                    key={index}
                    x={x}
                    y={textY}
                    fill={diffColor}
                    fontSize="10"
                    fontWeight="900"
                    textAnchor="middle"
                  >
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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Log Weight</Text>
            <Text style={styles.modalSubtitle}>
              Enter your current weight ({weightUnit}) below.
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder={`Enter weight in ${weightUnit}...`}
              placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowWeightModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleSaveWeightInput}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── NEW GOAL MODAL ── */}
      <Modal visible={showNewGoalModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { padding: 22, borderRadius: 24 }]}
          >
            {!selectedNewGoalOption ? (
              <>
                <View style={{ alignItems: "center", marginBottom: 16 }}>
                  <View style={styles.goalCelebrationBadge}>
                    <Trophy color={COLORS.logoGreen} size={32} strokeWidth={2.5} />
                  </View>

                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "900",
                      color: theme?.textPrimary || "#0F172A",
                      textAlign: "center",
                      letterSpacing: -0.5,
                    }}
                  >
                    Goal Achieved!
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: theme?.textSecondary || "#94A3B8",
                      textAlign: "center",
                      marginTop: 4,
                      lineHeight: 18,
                    }}
                  >
                    Fantastic progress! You reached your target weight of{" "}
                    <Text style={{ color: COLORS.logoGreen, fontWeight: "800" }}>
                      {goalWeight.toFixed(1)} {weightUnit}
                    </Text>
                    .{`\n`}Select your next goal to stay on track:
                  </Text>
                </View>

                {NEW_GOAL_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.newGoalOptionBtn}
                    onPress={() => {
                      if (option.id === "maintain") {
                        handleSelectNewGoal(option);
                      } else {
                        setSelectedNewGoalOption(option);
                        setWeightChangeKg("5");
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: option.badgeBg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      {option.icon}
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.newGoalOptionLabel}>
                        {option.label}
                      </Text>
                      <Text style={styles.newGoalOptionDesc}>
                        {option.desc}
                      </Text>
                    </View>
                    <ChevronRight
                      color={option.accentColor}
                      size={18}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={{
                    width: "100%",
                    paddingVertical: 13,
                    borderRadius: 14,
                    backgroundColor: theme?.inputBg || "#F1F5F9",
                    alignItems: "center",
                    marginTop: 6,
                    borderWidth: 1.2,
                    borderColor: theme?.border || "#E2E8F0",
                  }}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowNewGoalModal(false);
                    setSelectedNewGoalOption(null);
                    if (setGoalReachedAlertShown) setGoalReachedAlertShown(true);
                  }}
                >
                  <Text
                    style={{
                      color: theme?.textSecondary || "#94A3B8",
                      fontWeight: "800",
                      fontSize: 13,
                      letterSpacing: 0.2,
                    }}
                  >
                    Decide Later
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedNewGoalOption(null)}
                    style={{
                      padding: 8,
                      borderRadius: 12,
                      backgroundColor: theme?.inputBg || "#F1F5F9",
                      marginRight: 12,
                    }}
                  >
                    <ChevronLeft
                      color={theme?.textPrimary || "#0F172A"}
                      size={20}
                    />
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "900",
                      color: theme?.textPrimary || "#0F172A",
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    Set Weight{" "}
                    {selectedNewGoalOption.id === "fatloss" ? "Loss" : "Gain"}{" "}
                    Target
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: theme?.textSecondary || "#94A3B8",
                    marginBottom: 14,
                    lineHeight: 18,
                  }}
                >
                  How many {weightUnit === "lbs" ? "pounds" : "kilograms"} do
                  you want to{" "}
                  <Text
                    style={{
                      color: selectedNewGoalOption.accentColor,
                      fontWeight: "800",
                    }}
                  >
                    {selectedNewGoalOption.id === "fatloss" ? "lose" : "gain"}
                  </Text>{" "}
                  from your achieved weight ({goalWeight.toFixed(1)}{" "}
                  {weightUnit})?
                </Text>

                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: theme?.textSecondary || "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 8,
                  }}
                >
                  Quick Preset Target
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 6,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  {["2", "3", "5", "8", "10"].map((amount) => {
                    const isSelected = weightChangeKg === amount;
                    return (
                      <TouchableOpacity
                        key={amount}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 12,
                          backgroundColor: isSelected
                            ? selectedNewGoalOption.accentColor
                            : theme?.inputBg || "#F1F5F9",
                          borderWidth: 1,
                          borderColor: isSelected
                            ? selectedNewGoalOption.accentColor
                            : theme?.border || "#E2E8F0",
                        }}
                        onPress={() => setWeightChangeKg(amount)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "800",
                            color: isSelected
                              ? "#FFFFFF"
                              : theme?.textPrimary || "#0F172A",
                          }}
                        >
                          {selectedNewGoalOption.id === "fatloss" ? "-" : "+"}
                          {amount} {weightUnit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: theme?.textSecondary || "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 8,
                  }}
                >
                  Or Enter Custom Amount ({weightUnit})
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme?.inputBg || "#F1F5F9",
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderWidth: 1.5,
                    borderColor: theme?.border || "#E2E8F0",
                    marginBottom: 14,
                  }}
                >
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 16,
                      fontWeight: "800",
                      color: theme?.textPrimary || "#0F172A",
                    }}
                    value={weightChangeKg}
                    onChangeText={(val) =>
                      setWeightChangeKg(val.replace(/[^0-9.]/g, ""))
                    }
                    keyboardType="numeric"
                    placeholder={`Enter ${weightUnit}`}
                    placeholderTextColor="#94A3B8"
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: theme?.textSecondary || "#64748B",
                    }}
                  >
                    {weightUnit}
                  </Text>
                </View>

                {(() => {
                  const numKg = parseFloat(weightChangeKg) || 0;
                  const calculatedTarget =
                    selectedNewGoalOption.id === "fatloss"
                      ? Math.max(30, goalWeight - numKg)
                      : goalWeight + numKg;
                  return (
                    <View
                      style={{
                        backgroundColor: selectedNewGoalOption.badgeBg,
                        padding: 12,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: `${selectedNewGoalOption.accentColor}40`,
                        marginBottom: 14,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "800",
                          color: selectedNewGoalOption.accentColor,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          marginBottom: 2,
                        }}
                      >
                        Live Target Preview
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "900",
                          color: theme?.textPrimary || "#0F172A",
                        }}
                      >
                        {goalWeight.toFixed(1)} {weightUnit} ➔ Target:{" "}
                        <Text
                          style={{ color: selectedNewGoalOption.accentColor }}
                        >
                          {calculatedTarget.toFixed(1)} {weightUnit}
                        </Text>
                      </Text>
                    </View>
                  );
                })()}

                <TouchableOpacity
                  style={{
                    width: "100%",
                    paddingVertical: 13,
                    borderRadius: 14,
                    backgroundColor: selectedNewGoalOption.accentColor,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  activeOpacity={0.8}
                  onPress={() => {
                    const numKg = parseFloat(weightChangeKg) || 5;
                    const offsetKg =
                      selectedNewGoalOption.id === "fatloss" ? -numKg : +numKg;
                    const targetWeight =
                      selectedNewGoalOption.id === "fatloss"
                        ? Math.max(30, goalWeight - numKg)
                        : goalWeight + numKg;
                    handleSelectNewGoal({
                      ...selectedNewGoalOption,
                      label: `${selectedNewGoalOption.label} (${selectedNewGoalOption.id === "fatloss" ? "-" : "+"}${numKg}${weightUnit})`,
                      offsetKg,
                      targetWeight,
                    });
                    setSelectedNewGoalOption(null);
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "900",
                      fontSize: 14,
                      letterSpacing: 0.3,
                    }}
                  >
                    Confirm Goal (
                    {selectedNewGoalOption.id === "fatloss" ? "-" : "+"}
                    {parseFloat(weightChangeKg) || 5} kg)
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

// ============================================================================
// --- COMPONENT STYLES & COLOR CONFIGURATION ---
// ============================================================================
const COLORS = {
  // Main Backgrounds
  base: "#F8FAFC",
  bgDark: "#0F172A",

  // Cards & Surfaces
  cardLight: "#FFFFFF",
  cardDark: "#1E293B",
  surfaceLight: "#FFFFFF",
  surfaceDark: "#1E293B",

  // Brand Green & Accents
  logoGreen: "#10B981",
  greenAlpha: "rgba(16, 185, 129, 0.12)",
  greenAlphaSubtle: "rgba(16, 185, 129, 0.06)",
  greenAlphaBorder: "rgba(16, 185, 129, 0.30)",
  greenHighlight: "rgba(16, 185, 129, 0.08)",
  greenHighlightSubtle: "rgba(240, 253, 244, 0.60)",

  // Water & Hydration Accents
  waterColor: "#0EA5E9",
  waterHighlight: "#38BDF8",
  waterTrack: "#E2E8F0",
  waterGlassBg: "rgba(241, 245, 249, 0.35)",

  // Glass & Skeuomorphic Tokens
  glassBorder: "rgba(148, 163, 184, 0.65)",
  glassRimBorder: "rgba(148, 163, 184, 0.75)",
  glassRimBg: "rgba(255, 255, 255, 0.25)",
  glassBottomBg: "rgba(241, 245, 249, 0.70)",
  glassBottomReflect: "rgba(148, 163, 184, 0.30)",
  glassBottomBorder: "rgba(100, 116, 139, 0.50)",

  // Typography
  textDark: "#0F172A",
  textLight: "#F8FAFC",
  textMuted: "#64748B",
  textMutedDark: "#94A3B8",
  textPlaceholder: "#94A3B8",
  textWhite: "#FFFFFF",
  textSlate: "#475569",

  // Borders & Dividers
  borderLight: "#E2E8F0",
  borderDark: "#334155",
  borderDividerLight: "rgba(0, 0, 0, 0.06)",
  inputBorderLight: "#CBD5E1",
  inputBorderDark: "#334155",
  pillLight: "#F1F5F9",

  // Overlays & Accents
  overlay: "rgba(0, 0, 0, 0.65)",
  red: "#EF4444",
  redAlpha: "rgba(239, 68, 68, 0.12)",
  redAlphaBorder: "rgba(239, 68, 68, 0.25)",
  redHighlightSubtle: "rgba(254, 242, 242, 0.50)",
  redHighlightDark: "rgba(239, 68, 68, 0.08)",
  orange: "#F97316",
  orangeAlpha: "rgba(249, 115, 22, 0.12)",
  orangeAlphaBorder: "rgba(249, 115, 22, 0.25)",
  purple: "#8B5CF6",
  purpleAlpha: "rgba(139, 92, 246, 0.12)",
  amber: "#F59E0B",
  amberAlpha: "rgba(245, 158, 11, 0.12)",
  amberHighlightSubtle: "rgba(255, 251, 235, 0.50)",
  amberHighlightDark: "rgba(245, 158, 11, 0.08)",
  amberBorderSubtle: "rgba(252, 211, 77, 0.50)",
  amberBorderDark: "rgba(245, 158, 11, 0.20)",
};

const NEW_GOAL_OPTIONS = [
  {
    id: "fatloss",
    label: "Weight Loss",
    desc: "Burn fat, slim down, and optimize health (Deficit)",
    offsetKg: -5,
    icon: <Flame color={COLORS.orange} size={18} strokeWidth={2.5} />,
    badgeBg: COLORS.orangeAlpha,
    accentColor: COLORS.orange,
  },
  {
    id: "maintain",
    label: "Maintain Weight",
    desc: "Maintain balance and focus on recomposition (Balance)",
    offsetKg: 0,
    icon: <Target color={COLORS.logoGreen} size={18} strokeWidth={2.5} />,
    badgeBg: COLORS.greenAlpha,
    accentColor: COLORS.logoGreen,
  },
  {
    id: "muscle",
    label: "Gain Weight",
    desc: "Build muscle mass, gain weight, and build strength (Surplus)",
    offsetKg: +5,
    icon: <Activity color={COLORS.purple} size={18} strokeWidth={2.5} />,
    badgeBg: COLORS.purpleAlpha,
    accentColor: COLORS.purple,
  },
];

const getStyles = (theme, isDarkMode = false) =>
  StyleSheet.create({
    // --- MAIN SCREEN LAYOUT ---
    // Fullscreen fixed background wrapper
    fullscreenOverlay: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: "100%",
      height: "100%",
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.base,
    },
    // Main screen flex container
    container: {
      flex: 1,
    },
    // ScrollView inner padding & safe margins
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 54 : 48,
      paddingBottom: 85,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },

    // --- HEADER / BRAND SECTION ---
    // Top header bar row containing greeting and avatar
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingHorizontal: 4,
      width: "100%",
    },
    // Header text group wrapper
    headerTextGroup: {
      flex: 1,
      paddingRight: 12,
    },
    // Brand category tag above user greeting
    appName: {
      fontSize: 12,
      fontWeight: "900",
      color: COLORS.logoGreen,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 2,
    },
    // Personalized welcome greeting heading
    greeting: {
      fontSize: 22,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      letterSpacing: -0.5,
    },
    // Sub-greeting motivational or context phrase
    subGreeting: {
      fontSize: 13,
      fontWeight: "700",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      marginTop: 2,
    },

    // --- HEADER BADGES ---
    // Row holding target goal and streak badges
    headerBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      flexWrap: "wrap",
      gap: 6,
    },
    // Primary fitness goal badge tag
    goalBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? COLORS.greenHighlight : COLORS.greenHighlightSubtle,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.greenAlphaBorder,
    },
    // Target icon spacer inside goal badge
    goalBadgeIcon: {
      marginRight: 4,
    },
    // Goal badge label text
    goalBadgeText: {
      fontSize: 11,
      fontWeight: "800",
      color: COLORS.logoGreen,
    },
    // Daily active streak badge
    streakBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.orangeAlpha,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.orangeAlphaBorder,
    },
    // Streak flame icon spacer
    streakBadgeIcon: {
      marginRight: 4,
    },
    // Streak badge label text
    streakBadgeText: {
      fontSize: 11,
      fontWeight: "800",
      color: COLORS.orange,
    },

    // --- USER AVATAR BADGE ---
    // Circular border wrapper around user avatar
    avatarContainer: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Frosted green avatar circle
    avatarGlass: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: COLORS.logoGreen,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    // Initials fallback text inside avatar
    avatarText: {
      fontWeight: "900",
      color: COLORS.textWhite,
      fontSize: 16,
    },
    // Circular profile photo image
    avatarImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },

    // --- FORM CARDS & STATS GRID ---
    // Standard content card container
    formCard: {
      backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.cardLight,
      borderRadius: 20,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      overflow: "hidden",
    },
    // Uppercase card section header label
    cardTitle: {
      fontSize: 11,
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 12,
      fontWeight: "800",
      marginLeft: 2,
    },
    // Split layout for weight circle and stats grid
    weightSplitLayout: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    // Grid container holding metric stat items
    statsGrid: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      marginLeft: 20,
    },
    // Individual stat item wrapper (2 columns)
    statGridItem: {
      width: "50%",
      marginBottom: 10,
    },
    // Uppercase stat label text
    statLabel: {
      fontSize: 10,
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      textTransform: "uppercase",
      fontWeight: "800",
      marginBottom: 2,
    },
    // Bold numerical stat value text
    statValue: {
      fontSize: 15,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
    },

    // --- NUTRITION BREAKDOWN ---
    // Horizontal row pairing calorie ring and macro columns
    nutritionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    // Calorie ring container column
    calorieColumn: {
      marginRight: 18,
      alignItems: "center",
    },
    // Large primary calorie count readout
    calorieBigText: {
      fontSize: 18,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      letterSpacing: -0.5,
    },
    // Small remaining/target calorie subtitle
    calorieSubText: {
      fontSize: 9,
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      fontWeight: "800",
    },
    // Calorie over-limit warning tag
    overLimitBadge: {
      backgroundColor: COLORS.redAlpha,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
    },
    // Over-limit text
    overLimitText: {
      fontSize: 9,
      color: COLORS.red,
      fontWeight: "bold",
    },
    // Net calorie equation banner strip
    equationStrip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? COLORS.borderDark : COLORS.borderDividerLight,
    },
    // Equation description text
    equationText: {
      fontSize: 12,
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      fontWeight: "600",
    },
    // Vertical container holding macro progress bars
    macroColumn: {
      flex: 1,
      justifyContent: "center",
    },
    // Individual macro row wrapper
    macroRow: {
      marginBottom: 10,
    },
    // Row holding macro label name and current/target grams
    macroInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    // Macro label title (e.g. Protein, Carbs, Fat)
    macroLabel: {
      fontSize: 12,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
    },
    // Macro gram readout text
    macroValue: {
      fontSize: 11,
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      fontWeight: "700",
    },

    // --- ANALYTICS & CHARTS ---
    // Header container for analytics chart section
    analyticsHubHeader: {
      marginBottom: 12,
    },
    // Weekly weight delta indicator tag
    weeklyDeltaBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
    },
    // Weekly weight delta readout text
    weeklyDeltaText: {
      fontSize: 11,
      fontWeight: "900",
    },
    // Divider line between card sections
    glassDivider: {
      height: 1,
      backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      marginVertical: 14,
    },
    // Centered wrapper for LineChart
    chartContainer: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      marginTop: 4,
    },

    // --- MODAL DIALOGS ---
    // Large celebratory trophy badge in goal modal
    goalCelebrationBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: COLORS.greenAlpha,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: COLORS.greenAlphaBorder,
      marginBottom: 12,
    },
    // Dimmed modal backdrop overlay
    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    // Modal dialog content container
    modalContent: {
      width: "85%",
      maxWidth: 440,
      alignSelf: "center",
      backgroundColor: isDarkMode ? COLORS.surfaceDark : COLORS.surfaceLight,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1.5,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Modal dialog heading title
    modalTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginBottom: 6,
      textAlign: "center",
    },
    // Modal dialog explanatory subtitle
    modalSubtitle: {
      fontSize: 13,
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      textAlign: "center",
      marginBottom: 20,
      fontWeight: "600",
    },
    // Modal text/numeric input box
    modalInput: {
      width: "100%",
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.cardLight,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      fontWeight: "700",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginBottom: 18,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.inputBorderDark : COLORS.inputBorderLight,
    },
    // Modal action buttons container
    modalButtons: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
      marginTop: 4,
    },
    // Modal cancel button
    modalCancel: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.pillLight,
      alignItems: "center",
      marginRight: 8,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Modal cancel button text
    modalCancelText: {
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      fontWeight: "800",
      fontSize: 14,
    },
    // Modal primary action button (Save / Confirm)
    modalSave: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      backgroundColor: COLORS.logoGreen,
      alignItems: "center",
      marginLeft: 8,
    },
    // Modal primary action button text
    modalSaveText: {
      color: COLORS.textWhite,
      fontWeight: "800",
      fontSize: 14,
    },

    // --- GOAL SELECTION OPTIONS ---
    // Goal selector card button
    newGoalOptionBtn: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.pillLight,
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    // Goal selector primary label
    newGoalOptionLabel: {
      fontSize: 15,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginBottom: 2,
    },
    // Goal selector subtitle description
    newGoalOptionDesc: {
      fontSize: 12,
      fontWeight: "600",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
    },

    // --- FLOATING ACTION, WORKOUT & NOTICES ---
    // Workout percentage goal chip
    workoutGoalChip: {
      backgroundColor: COLORS.orangeAlpha,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 4,
    },
    // Workout goal chip text
    workoutGoalChipText: {
      fontSize: 11,
      fontWeight: "900",
      color: COLORS.orange,
    },
    // Small square workout icon container
    workoutIconBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: COLORS.orangeAlpha,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    // Exercise quota achieved notice banner
    exerciseQuotaBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? COLORS.amberHighlightDark : COLORS.amberHighlightSubtle,
      borderColor: isDarkMode ? COLORS.amberBorderDark : COLORS.amberBorderSubtle,
      borderRadius: 12,
      padding: 10,
      marginTop: 12,
      borderWidth: 1,
    },
    // Exercise quota banner text
    exerciseQuotaBannerText: {
      fontSize: 11,
      color: isDarkMode ? "#FCD34D" : "#D97706",
      fontWeight: "700",
      marginLeft: 6,
      flex: 1,
      lineHeight: 15,
    },
    // Exercise offset success notice
    exerciseOffsetBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? COLORS.greenHighlight : COLORS.greenHighlightSubtle,
      borderColor: COLORS.greenAlphaBorder,
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      marginTop: 0,
    },
    // Exercise offset success text
    exerciseOffsetText: {
      fontSize: 11,
      fontWeight: "700",
      color: isDarkMode ? "#34D399" : "#059669",
      marginLeft: 6,
      flex: 1,
      lineHeight: 15,
    },
    // Calorie limit exceeded alert banner
    calorieExceededBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? COLORS.redHighlightDark : COLORS.redHighlightSubtle,
      borderColor: COLORS.redAlphaBorder,
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      marginTop: 12,
    },
    // Calorie limit exceeded alert text
    calorieExceededText: {
      fontSize: 11,
      fontWeight: "700",
      color: isDarkMode ? "#FCA5A5" : "#DC2626",
      marginLeft: 6,
      flex: 1,
      lineHeight: 15,
    },
    // Floating circular action button for AI chatbot
    chatbotFab: {
      position: "absolute",
      bottom: 104,
      right: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: COLORS.logoGreen,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
    },
    // Cautionary note / banner card
    warningBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.pillLight,
      borderRadius: 12,
      padding: 10,
      marginTop: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Warning banner description text
    warningBannerText: {
      fontSize: 11,
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      fontWeight: "700",
      marginLeft: 6,
      flex: 1,
      lineHeight: 15,
    },
  });


