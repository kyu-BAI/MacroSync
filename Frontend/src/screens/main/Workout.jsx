// --- IMPORTS ---
import React, { useMemo } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Modal,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import {
  Flame,
  Clock,
  Trophy,
  Play,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
} from "lucide-react-native";

import { useCustomAlert } from "../../context/CustomAlertContext";
import { useTheme } from "../../context/ThemeContext";
import useWorkout, {
  calculateMETCalories,
} from "../../hooks/useWorkout";

import LoadingModal from "../../components/LoadingModal";
import StaggerCard from "../../components/StaggerCard";
import PressableCard from "../../components/PressableCard";
import SkeletonCard from "../../components/SkeletonCard";

// --- CONSTANTS & CONFIGURATION ---
const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

// --- MAIN WORKOUT SCREEN ---

export default function WorkoutScreen({
  onTabChange,
  userId,
  onRefreshDashboard,
  isOnline = true,
  dailyExercise,
  setDailyExercise,
  setNotifications,
  userGoals,
  userBaseline,
}) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();

  // Screen styling (memoized on theme and dark mode)
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Workout business logic hook: routines, timers, countdowns & completions
  const {
    currentWeightKg,
    selectedIntensity,
    setSelectedIntensity,
    intensityTiers,
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
    handleNextWithCountdown,
    filteredWorkouts,
  } = useWorkout({
    userId,
    userBaseline,
    dailyExercise,
    setDailyExercise,
    setNotifications,
    onRefreshDashboard,
    isOnline,
    showAlert,
  });

  /* remove everything in the screen */
  // return <View style={styles.fullscreenOverlay} />;

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* ── WORKOUT TUTORIAL PLAYER (FULL SCREEN MODAL) ── */}
      <Modal
        visible={activeRoutine !== null}
        transparent={false}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={handleExitWorkout}
      >
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />
        {Boolean(activeRoutine) && (
          <View style={styles.playerModalRoot}>
            <View style={styles.playerWrapper}>
              {/* PLAYER HEADER AREA */}
            <View style={styles.playerHeaderRow}>
              <TouchableOpacity
                style={styles.playerBackNeuButton}
                activeOpacity={0.8}
                onPress={handleExitWorkout}
              >
                <ArrowLeft color={COLORS.logoGreen} size={20} strokeWidth={2.5} />
              </TouchableOpacity>
              <View style={styles.playerHeaderCenterText}>
                <Text style={styles.playerRoutineSubTitle}>
                  {activeRoutine.title}
                </Text>
                <Text style={styles.playerStepIndicator}>
                  Exercise {currentStepIndex + 1} of{" "}
                  {activeRoutine.tutorials.length}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.restTimerHeaderBadge}
                onPress={() => handleStartRestTimer(45)}
                activeOpacity={0.7}
              >
                <Clock color={COLORS.logoGreen} size={18} />
              </TouchableOpacity>
            </View>

            {/* PROGRESS BAR TRACK */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${((currentStepIndex + 1) / activeRoutine.tutorials.length) * 100}%`,
                  },
                ]}
              />
            </View>

            {/* PLAYER MAIN EXERCISE CARD VIEWPORT */}
            <View style={styles.playerMainCard}>
              {/* TUTORIAL STATUS PILL */}
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <View
                  style={[
                    styles.liveActivityBadge,
                    { position: "relative", top: 0, left: 0 },
                  ]}
                >
                  <View style={styles.pulseDot} />
                  <Text style={styles.liveBadgeText}>
                    {isTimerRunning
                      ? `REST TIMER: 00:${restTimer < 10 ? "0" : ""}${restTimer}`
                      : "TUTORIAL GUIDE ACTIVE"}
                  </Text>
                </View>
              </View>

              {/* EXERCISE TITLE */}
              <Text style={styles.playerExerciseTitle}>
                {activeRoutine.tutorials[currentStepIndex].name}
              </Text>

              {/* MUSCLE TARGET CHIPS */}
              {(() => {
                const step = activeRoutine.tutorials[currentStepIndex];
                const muscles = step.muscles;
                const hasMuscles = muscles && (muscles.primary?.length || muscles.secondary?.length);
                const hasLegacy = step.body_part;
                if (!hasMuscles && !hasLegacy) return null;
                return (
                  <View style={{ marginBottom: 10 }}>
                    {/* Primary muscles */}
                    {(hasMuscles ? muscles.primary : [step.body_part]).filter(Boolean).length > 0 && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 5, marginBottom: 4 }}>
                        <Text style={styles.primaryMuscleLabel}>Primary</Text>
                        {(hasMuscles ? muscles.primary : [step.body_part]).map((m, i) => (
                          <View key={i} style={styles.primaryMuscleChip}>
                            <Text style={styles.primaryMuscleText}>{m}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {/* Secondary muscles */}
                    {hasMuscles && muscles.secondary?.length > 0 && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 5 }}>
                        <Text style={styles.secondaryMuscleLabel}>Secondary</Text>
                        {muscles.secondary.map((m, i) => (
                          <View key={i} style={styles.secondaryMuscleChip}>
                            <Text style={styles.secondaryMuscleText}>{m}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()}

              <View style={styles.playerTargetMetricRow}>
                <View style={styles.targetMetricChipBox}>
                  <Trophy
                    color="#FFFFFF"
                    size={14}
                    fill="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.targetMetricChipText}>
                    {activeRoutine.tutorials[currentStepIndex].target ||
                      activeRoutine.tutorials[currentStepIndex].sets ||
                      ""}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.targetMetricChipBox,
                    { backgroundColor: isTimerRunning ? COLORS.amber : COLORS.blue },
                  ]}
                  onPress={() =>
                    isTimerRunning
                      ? setIsTimerRunning(false)
                      : handleStartRestTimer(45)
                  }
                  activeOpacity={0.8}
                >
                  <Clock color="#FFFFFF" size={14} style={{ marginRight: 6 }} />
                  <Text style={styles.targetMetricChipText}>
                    {isTimerRunning ? `Rest: ${restTimer}s` : "45s Rest Timer"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.playerGlassDivider} />

              {/* 🎥 EXERCISE ANIMATED GIF & HD IMAGE from exercises-dataset */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.instructionsTextScroll}
              >
                {(() => {
                  const currentTut = activeRoutine.tutorials[currentStepIndex];
                  const hasMedia = currentTut?.gif_url || currentTut?.image_url;
                  if (!hasMedia) return null;

                  const displayUri =
                    mediaType === "image" || mediaLoadError
                      ? currentTut.image_url || currentTut.gif_url
                      : currentTut.gif_url || currentTut.image_url;

                  return (
                    <View style={{ alignItems: "center", marginBottom: 14 }}>
                      <View style={styles.mediaContainerBox}>
                        {/* Loading Spinner overlay while media buffers */}
                        {isMediaLoading && (
                          <View style={styles.mediaLoadingOverlay}>
                            <ActivityIndicator size="large" color={COLORS.logoGreen} />
                            <Text style={styles.mediaLoadingText}>
                              Loading Exercise Tutorial...
                            </Text>
                          </View>
                        )}

                        <ExpoImage
                          source={{ uri: displayUri }}
                          placeholder={{ uri: currentTut.image_url }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="contain"
                          cachePolicy="memory-disk"
                          transition={200}
                          autoplay={true}
                          onLoadStart={() => setIsMediaLoading(true)}
                          onLoad={() => setIsMediaLoading(false)}
                          onError={() => {
                            setIsMediaLoading(false);
                            setMediaLoadError(true);
                          }}
                        />
                      </View>

                      {/* Interactive Media Control Bar */}
                      <View style={styles.mediaControlsRow}>
                        <Text style={styles.mediaTypeLabel}>
                          {mediaType === "gif" && !mediaLoadError
                            ? "Animated GIF"
                            : "HD Diagram"}{" "}
                          · Gym Visual
                        </Text>
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => {
                              setMediaType("gif");
                              setMediaLoadError(false);
                              setIsMediaLoading(true);
                            }}
                            style={[
                              styles.mediaToggleBtn,
                              mediaType === "gif" && !mediaLoadError
                                ? styles.mediaToggleBtnActive
                                : styles.mediaToggleBtnInactive,
                            ]}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.mediaToggleBtnText,
                                mediaType === "gif" && !mediaLoadError
                                  ? styles.mediaToggleBtnTextActive
                                  : styles.mediaToggleBtnTextInactive,
                              ]}
                            >
                              Loop GIF
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setMediaType("image");
                              setIsMediaLoading(true);
                            }}
                            style={[
                              styles.mediaToggleBtn,
                              mediaType === "image" || mediaLoadError
                                ? styles.mediaToggleBtnActive
                                : styles.mediaToggleBtnInactive,
                            ]}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.mediaToggleBtnText,
                                mediaType === "image" || mediaLoadError
                                  ? styles.mediaToggleBtnTextActive
                                  : styles.mediaToggleBtnTextInactive,
                              ]}
                            >
                              HD Still
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* STEP-BY-STEP INSTRUCTIONS from exercises dataset */}
                {Array.isArray(
                  activeRoutine.tutorials[currentStepIndex].instruction_steps,
                ) &&
                activeRoutine.tutorials[currentStepIndex].instruction_steps.length > 0 ? (
                  <View style={styles.instructionsContainerCard}>
                    <Text
                      style={[
                        styles.instructionSectionTitleLabel,
                        { color: COLORS.logoGreen, marginBottom: 10 },
                      ]}
                    >
                      Step-by-Step Tutorial:
                    </Text>
                    {activeRoutine.tutorials[
                      currentStepIndex
                    ].instruction_steps.map((step, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          marginBottom: 10,
                        }}
                      >
                        <View style={styles.instructionStepNumberCircle}>
                          <Text style={styles.instructionStepNumberText}>
                            {idx + 1}
                          </Text>
                        </View>
                        <Text style={[styles.instructionParagraphText, { flex: 1 }]}>
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  // Fallback to setup/form text if no dataset steps
                  <>
                    {activeRoutine.tutorials[currentStepIndex].setup ? (
                      <View style={styles.instructionsContainerCard}>
                        <Text
                          style={[
                            styles.instructionSectionTitleLabel,
                            { color: COLORS.logoGreen, marginBottom: 6 },
                          ]}
                        >
                          How to Set Up:
                        </Text>
                        <Text style={styles.instructionParagraphText}>
                          {activeRoutine.tutorials[currentStepIndex].setup}
                        </Text>
                      </View>
                    ) : null}
                    {activeRoutine.tutorials[currentStepIndex].form ? (
                      <View style={styles.instructionsContainerCard}>
                        <Text
                          style={[
                            styles.instructionSectionTitleLabel,
                            { color: COLORS.blue, marginBottom: 6 },
                          ]}
                        >
                          Proper Execution Form:
                        </Text>
                        <Text style={styles.instructionParagraphText}>
                          {activeRoutine.tutorials[currentStepIndex].form}
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}
              </ScrollView>
            </View>

            {/* DOCKED FULL-WIDTH BOTTOM ACTION BUTTONS */}
            <View style={styles.playerControlActionRow}>
              {currentStepIndex > 0 && (
                <TouchableOpacity
                  style={styles.playerSecondaryNeuActionBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setCurrentStepIndex(currentStepIndex - 1);
                    setIsMediaLoading(true);
                    setMediaLoadError(false);
                  }}
                >
                  <RotateCcw
                    color={isDarkMode ? COLORS.textMutedDark : COLORS.textMuted}
                    size={16}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.playerSecondaryActionBtnText}>
                    Previous
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.playerPrimaryActionBtn,
                  { flex: currentStepIndex === 0 ? 1 : 1.3 },
                ]}
                activeOpacity={0.8}
                onPress={handleNextWithCountdown}
              >
                <CheckCircle2
                  color="#FFFFFF"
                  size={16}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.playerPrimaryActionBtnText}>
                  {currentStepIndex === activeRoutine.tutorials.length - 1
                    ? "Complete Workout"
                    : "Next Exercise Step"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      </Modal>

      {/* ── NEXT EXERCISE COUNTDOWN OVERLAY ── */}
      <Modal
        visible={countdownActive}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setCountdownActive(false);
          setCountdown(3);
          pendingNextStep.current = null;
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            // Tap anywhere to skip countdown
            setCountdownActive(false);
            setCountdown(3);
            if (pendingNextStep.current) {
              pendingNextStep.current();
              pendingNextStep.current = null;
            }
          }}
          style={styles.countdownOverlay}
        >
          {/* REST label */}
          <Text style={styles.countdownRestLabel}>Rest</Text>

          {/* Big countdown number */}
          <Text
            style={[
              styles.countdownNumberText,
              {
                fontSize: countdown <= 3 ? 72 : 96,
                color: countdown <= 3 ? COLORS.logoGreen : COLORS.textWhite,
                lineHeight: countdown <= 3 ? 80 : 104,
              },
            ]}
          >
            {countdown === 0 ? "GO!" : countdown}
          </Text>

          <Text style={styles.countdownSecondsUnitText}>seconds</Text>

          {/* Next exercise name preview */}
          {activeRoutine?.tutorials?.[currentStepIndex + 1] && (
            <View style={styles.countdownNextPreviewCard}>
              <Text style={styles.countdownUpNextBadge}>Up Next</Text>
              <Text style={styles.countdownNextExerciseTitle}>
                {activeRoutine.tutorials[currentStepIndex + 1].name}
              </Text>
              {activeRoutine.tutorials[currentStepIndex + 1].target && (
                <Text style={styles.countdownNextTargetText}>
                  {activeRoutine.tutorials[currentStepIndex + 1].target}
                </Text>
              )}
            </View>
          )}

          <Text style={styles.countdownSkipTipText}>Tap anywhere to skip rest</Text>
        </TouchableOpacity>
      </Modal>

      {/* STANDARD ROUTINES SELECTION HUB LIST VIEW */}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === "android"}
        refreshControl={
          <RefreshControl
            refreshing={isGeneratingWorkout}
            onRefresh={handleRegenerateWorkouts}
            tintColor={COLORS.logoGreen}
            colors={[COLORS.logoGreen]}
          />
        }
      >
        {/* HEADER BRANDING SECTION */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.appName}>MacroSync</Text>
            <Text style={styles.greeting}>Daily Home Workouts</Text>
            <Text style={styles.subGreeting}>
              Zero-equipment home workout routines
            </Text>
          </View>
        </View>

        {/* OVER-EXERCISING / ACTIVE RECOVERY SMART ALERT BANNER */}
        {((dailyExercise?.caloriesBurned || 0) >= 500 ||
          (dailyExercise?.activeMinutes || 0) >= 60) && (
          <View style={styles.recoveryAlertCard}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <View style={styles.recoveryAlertIconBadge}>
                <Flame color="#FFFFFF" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recoveryAlertTitle}>
                  Active Recovery Recommended
                </Text>
                <Text style={styles.recoveryAlertDesc}>
                  Great effort today! You burned{" "}
                  {dailyExercise?.caloriesBurned || 0} kcal across{" "}
                  {dailyExercise?.activeMinutes || 0} active minutes. Consider
                  taking a light rest or stretching day tomorrow to prevent
                  overtraining.
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
                  selectedIntensity === tier
                    ? styles.filterChipActive
                    : styles.filterChipInactive,
                ]}
                onPress={() => setSelectedIntensity(tier)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        selectedIntensity === tier
                          ? "#FFFFFF"
                          : isDarkMode
                          ? COLORS.textLight
                          : COLORS.textDark,
                    },
                  ]}
                >
                  {tier}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* WORKOUT PLAN CARD LISTINGS */}
        <Text style={styles.sectionLabelTitle}>
          Your Tailored Home Routines
        </Text>

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
            <StaggerCard key={workout.id} index={staggerIndex}>
              <PressableCard
                style={styles.workoutFormCard}
                onPress={() => handleStartTutorialEngine(workout)}
                scaleDown={0.97}
              >
                <View style={styles.workoutHeaderRow}>
                  <View style={styles.workoutTitleContainer}>
                    <Text style={styles.workoutMainTitle}>{workout.title}</Text>
                    <Text style={styles.workoutDescriptionText}>
                      {workout.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.glassDivider} />

                {/* QUICK METRICS TILES */}
                <View style={styles.workoutMetricsSummaryGrid}>
                  <View style={styles.metricItemBox}>
                    <View style={styles.metricClockIconBadge}>
                      <Clock color={COLORS.blue} size={13} />
                    </View>
                    <View style={styles.metricTextColumn}>
                      <Text style={styles.metricTileLabel} numberOfLines={1}>
                        Duration
                      </Text>
                      <Text
                        style={[styles.metricTileValue, { color: COLORS.blue }]}
                        numberOfLines={1}
                      >
                        {workout.duration}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricItemBox}>
                    <View style={styles.metricFlameIconBadge}>
                      <Flame color={COLORS.orange} size={13} />
                    </View>
                    <View style={styles.metricTextColumn}>
                      <Text
                        style={styles.metricTileLabel}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {currentWeightKg
                          ? `Burn (${Math.round(currentWeightKg)}kg)`
                          : "Est. Burn"}
                      </Text>
                      <Text
                        style={[styles.metricTileValue, { color: COLORS.orange }]}
                        numberOfLines={1}
                      >
                        {workout?.caloriesBurn ||
                          calculateMETCalories(
                            workout?.intensity,
                            workout?.duration,
                            currentWeightKg,
                          )}{" "}
                        kcal
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricItemBox}>
                    <View style={styles.metricTrophyIconBadge}>
                      <Trophy color={COLORS.amber} size={13} />
                    </View>
                    <View style={styles.metricTextColumn}>
                      <Text style={styles.metricTileLabel} numberOfLines={1}>
                        Intensity
                      </Text>
                      <Text
                        style={[styles.metricTileValue, { color: COLORS.amber }]}
                        numberOfLines={1}
                      >
                        {workout?.intensity}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* EXERCISE STEPS PREVIEW */}
                {Array.isArray(workout.tutorials) &&
                  workout.tutorials.length > 0 && (
                    <View style={styles.stepsPreviewContainer}>
                      <View style={styles.stepsPreviewHeaderRow}>
                        <View style={styles.stepsPreviewBadge}>
                          <Text style={styles.stepsPreviewBadgeText}>
                            Animated GIF Tutorials
                          </Text>
                        </View>
                        <Text style={styles.stepsPreviewCountText}>
                          {workout.tutorials.length}{" "}
                          {workout.tutorials.length === 1
                            ? "exercise"
                            : "exercises"}
                        </Text>
                      </View>
                      <Text
                        style={styles.stepPreviewItemName}
                        numberOfLines={2}
                      >
                        {workout.tutorials.map((tut) => tut.name).join("  •  ")}
                      </Text>
                    </View>
                  )}

                {/* LAUNCH BUTTON */}
                <TouchableOpacity
                  style={styles.startWorkoutActionButton}
                  activeOpacity={0.8}
                  onPress={() => handleStartTutorialEngine(workout)}
                >
                  <Play
                    color="#FFFFFF"
                    size={14}
                    fill="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.startWorkoutButtonText}>
                    Begin Active Routine
                  </Text>
                </TouchableOpacity>
              </PressableCard>
            </StaggerCard>
          );
        })}
      </ScrollView>

      {/* UIverse Inspired AI Customization Loading Modal */}
      <LoadingModal
        visible={isGeneratingWorkout || loading}
        type="workout"
        title="Customizing Workout Routine"
        subtitle="Vita AI is calculating optimal home exercises"
      />
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
  greenAlphaSubtle: "rgba(16, 185, 129, 0.08)",
  greenAlphaBorder: "rgba(16, 185, 129, 0.30)",
  greenHighlight: "rgba(16, 185, 129, 0.08)",

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
  inputBorderLight: "#CBD5E1",
  inputBorderDark: "#334155",
  pillLight: "#F1F5F9",

  // Overlays & Accents
  overlay: "rgba(0, 0, 0, 0.65)",
  red: "#EF4444",
  orange: "#F97316",
  orangeAlpha: "rgba(249, 115, 22, 0.12)",
  purple: "#8B5CF6",
  purpleAlpha: "rgba(139, 92, 246, 0.13)",
  purpleAlphaBorder: "rgba(139, 92, 246, 0.30)",
  purpleAlphaText: "rgba(139, 92, 246, 0.70)",
  blue: "#0EA5E9",
  blueAlpha: "rgba(14, 165, 233, 0.12)",
  amber: "#F59E0B",
  amberAlpha: "rgba(245, 158, 11, 0.12)",
  amberBorder: "rgba(245, 158, 11, 0.30)",
  amberHighlightDark: "rgba(245, 158, 11, 0.14)",
  amberHighlightLight: "rgba(245, 158, 11, 0.08)",
};

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
    // Main flex container
    container: {
      flex: 1,
    },
    // ScrollView inner padding & safe margins
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 54 : 48,
      paddingBottom: 135,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },

    // --- HEADER / BRAND SECTION ---
    // Top header bar row containing greeting and title
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
    // Top app category tag
    appName: {
      fontSize: 12,
      fontWeight: "900",
      color: COLORS.logoGreen,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 2,
    },
    // Main screen heading title
    greeting: {
      fontSize: 28,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      letterSpacing: -0.5,
    },
    // Subtitle description below the heading
    subGreeting: {
      fontSize: 13,
      fontWeight: "700",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      marginTop: 2,
    },

    // --- FORM CARDS & INTENSITY SELECTORS ---
    // Standard content card container
    formCard: {
      backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.cardLight,
      borderRadius: 24,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
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
    // Filter chip buttons horizontal row
    filterButtonGroupRow: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    // Individual filter chip button container
    filterChipButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: isDarkMode ? COLORS.surfaceDark : COLORS.surfaceLight,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Inactive filter chip button state
    filterChipInactive: {
      backgroundColor: isDarkMode ? COLORS.surfaceDark : COLORS.surfaceLight,
    },
    // Active selected filter chip button state
    filterChipActive: {
      backgroundColor: COLORS.logoGreen,
      borderWidth: 1.5,
      borderColor: COLORS.logoGreen,
    },
    // Filter chip button label text
    filterChipText: {
      fontSize: 12,
      fontWeight: "800",
    },
    // Section label title text
    sectionLabelTitle: {
      fontSize: 14,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginBottom: 12,
      marginLeft: 4,
      letterSpacing: -0.2,
    },

    // --- RECOVERY ALERT BANNER ---
    // Active recovery recommended alert card
    recoveryAlertCard: {
      backgroundColor: isDarkMode ? COLORS.amberHighlightDark : COLORS.amberHighlightLight,
      borderColor: COLORS.amberBorder,
      borderWidth: 1,
      borderRadius: 24,
      padding: 18,
      marginBottom: 16,
    },
    // Recovery icon badge container
    recoveryAlertIconBadge: {
      backgroundColor: COLORS.amber,
      padding: 8,
      borderRadius: 12,
      marginRight: 12,
      marginTop: 2,
    },
    // Recovery alert banner title text
    recoveryAlertTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: COLORS.amber,
      marginBottom: 2,
    },
    // Recovery alert banner description text
    recoveryAlertDesc: {
      fontSize: 12,
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      lineHeight: 17,
    },

    // --- WORKOUT LIST CARDS ---
    // Individual routine card container
    workoutFormCard: {
      backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.cardLight,
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Header row inside routine card
    workoutHeaderRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    // Routine title container wrapper
    workoutTitleContainer: {
      flex: 1,
    },
    // Routine title text
    workoutMainTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginBottom: 6,
      lineHeight: 20,
    },
    // Routine short description text
    workoutDescriptionText: {
      fontSize: 13,
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      fontWeight: "600",
      lineHeight: 18,
    },
    // Divider line between card sections
    glassDivider: {
      height: 1,
      backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      marginVertical: 12,
    },
    // Row holding metrics tiles
    workoutMetricsSummaryGrid: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 2,
    },
    // Individual metric icon and label box
    metricItemBox: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
      paddingRight: 4,
    },
    // Column holding metric label and value
    metricTextColumn: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
    },
    // Duration clock icon badge
    metricClockIconBadge: {
      backgroundColor: COLORS.blueAlpha,
      borderRadius: 8,
      padding: 5,
      marginRight: 6,
      flexShrink: 0,
    },
    // Burn flame icon badge
    metricFlameIconBadge: {
      backgroundColor: COLORS.orangeAlpha,
      borderRadius: 8,
      padding: 5,
      marginRight: 6,
      flexShrink: 0,
    },
    // Intensity trophy icon badge
    metricTrophyIconBadge: {
      backgroundColor: COLORS.amberAlpha,
      borderRadius: 8,
      padding: 5,
      marginRight: 6,
      flexShrink: 0,
    },
    // Metric label title text
    metricTileLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      letterSpacing: 0.1,
    },
    // Metric numerical value text
    metricTileValue: {
      fontSize: 12.5,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginTop: 1,
    },
    // Steps preview container
    stepsPreviewContainer: {
      marginTop: 12,
      marginBottom: 2,
      gap: 6,
    },
    // Header row holding badge and exercise count
    stepsPreviewHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    // Animated tutorial tag chip
    stepsPreviewBadge: {
      backgroundColor: COLORS.greenAlpha,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: COLORS.greenAlphaBorder,
      alignSelf: "flex-start",
    },
    // Animated tutorial tag text
    stepsPreviewBadgeText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: COLORS.logoGreen,
      letterSpacing: 0.2,
    },
    // Steps count text
    stepsPreviewCountText: {
      fontSize: 11,
      fontWeight: "700",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
    },
    // Individual step name text in card preview
    stepPreviewItemName: {
      fontSize: 11.5,
      lineHeight: 16,
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      fontWeight: "500",
    },
    // Primary action button to begin routine
    startWorkoutActionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.logoGreen,
      paddingVertical: 12,
      marginTop: 14,
      borderRadius: 16,
    },
    // Begin routine button text
    startWorkoutButtonText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#FFFFFF",
    },

    // --- WORKOUT PLAYER MODAL STYLES ---
    // Fullscreen backdrop behind player modal on wide monitors
    playerModalRoot: {
      flex: 1,
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.base,
      width: "100%",
      height: "100%",
    },
    // Centered mobile container for workout player (Pattern 1)
    playerWrapper: {
      flex: 1,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
      paddingHorizontal: 0,
      paddingTop: Platform.OS === "ios" ? 54 : (StatusBar.currentHeight || 24) + 8,
      paddingBottom: 0,
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.base,
      borderLeftWidth: Platform.OS === "web" ? 1 : 0,
      borderRightWidth: Platform.OS === "web" ? 1 : 0,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Header navigation row in player
    playerHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 12,
      width: "100%",
    },
    // Circular back button in player
    playerBackNeuButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: isDarkMode ? COLORS.surfaceDark : COLORS.surfaceLight,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Rest timer trigger icon badge in player header
    restTimerHeaderBadge: {
      backgroundColor: COLORS.greenAlpha,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    // Centered title text group in player
    playerHeaderCenterText: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 12,
    },
    // Routine subtitle text in player
    playerRoutineSubTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      textAlign: "center",
      textTransform: "uppercase",
    },
    // Exercise step index indicator text (e.g. Exercise 1 of 3)
    playerStepIndicator: {
      fontSize: 17,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginTop: 1,
    },
    // Progress bar track behind fill
    progressBarTrack: {
      height: 4,
      backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      width: "100%",
      marginBottom: 12,
    },
    // Progress bar animated green fill
    progressBarFill: {
      height: "100%",
      backgroundColor: COLORS.logoGreen,
      borderRadius: 2,
    },
    // Main card container in player
    playerMainCard: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 0,
    },
    // Pulsing live indicator pill
    liveActivityBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? COLORS.surfaceDark : "rgba(255, 255, 255, 0.85)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Pulsing green dot inside badge
    pulseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: COLORS.logoGreen,
      marginRight: 6,
    },
    // Live badge status text
    liveBadgeText: {
      fontSize: 9,
      fontWeight: "900",
      color: COLORS.logoGreen,
      letterSpacing: 0.5,
    },
    // Active exercise heading title in player
    playerExerciseTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginTop: 4,
      marginBottom: 8,
      textAlign: "center",
    },
    // Primary muscle section label
    primaryMuscleLabel: {
      fontSize: 9,
      fontWeight: "800",
      color: COLORS.purpleAlphaText,
      textTransform: "uppercase",
      letterSpacing: 1,
      alignSelf: "center",
      marginRight: 2,
    },
    // Primary muscle pill chip
    primaryMuscleChip: {
      backgroundColor: COLORS.purpleAlpha,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: COLORS.purpleAlphaBorder,
    },
    // Primary muscle pill text
    primaryMuscleText: {
      fontSize: 10,
      fontWeight: "700",
      color: COLORS.purple,
      textTransform: "capitalize",
    },
    // Secondary muscle section label
    secondaryMuscleLabel: {
      fontSize: 9,
      fontWeight: "800",
      color: COLORS.greenAlphaBorder,
      textTransform: "uppercase",
      letterSpacing: 1,
      alignSelf: "center",
      marginRight: 2,
    },
    // Secondary muscle pill chip
    secondaryMuscleChip: {
      backgroundColor: COLORS.greenAlphaSubtle,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: COLORS.greenAlphaBorder,
    },
    // Secondary muscle pill text
    secondaryMuscleText: {
      fontSize: 10,
      fontWeight: "700",
      color: COLORS.logoGreen,
      textTransform: "capitalize",
    },
    // Row holding target metric chips in player
    playerTargetMetricRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 10,
    },
    // Target chip pill (e.g. 3 Sets x 12 Reps)
    targetMetricChipBox: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.logoGreen,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
    },
    // Target chip text
    targetMetricChipText: {
      fontSize: 12,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    // Divider line inside player viewport
    playerGlassDivider: {
      height: 1,
      backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      marginVertical: 14,
    },
    // ScrollView for tutorial instructions
    instructionsTextScroll: {
      flex: 1,
      paddingHorizontal: 2,
    },
    // Media viewport box for GIF or image
    mediaContainerBox: {
      width: "100%",
      height: Math.min(screenHeight * 0.36, 290),
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.base,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      position: "relative",
    },
    // Media buffering loading overlay
    mediaLoadingOverlay: {
      position: "absolute",
      zIndex: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.60)" : "rgba(255, 255, 255, 0.70)",
      width: "100%",
      height: "100%",
    },
    // Media buffering text
    mediaLoadingText: {
      fontSize: 11,
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      marginTop: 8,
      fontWeight: "600",
    },
    // Media controls toggle bar row
    mediaControlsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 8,
    },
    // Media type label text
    mediaTypeLabel: {
      fontSize: 10,
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
    },
    // Media toggle button pill
    mediaToggleBtn: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 10,
    },
    // Active media toggle button
    mediaToggleBtnActive: {
      backgroundColor: COLORS.logoGreen,
    },
    // Inactive media toggle button
    mediaToggleBtnInactive: {
      backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Active media toggle button text
    mediaToggleBtnText: {
      fontSize: 10,
      fontWeight: "700",
    },
    // Active toggle text color
    mediaToggleBtnTextActive: {
      color: "#FFFFFF",
    },
    // Inactive toggle text color
    mediaToggleBtnTextInactive: {
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
    },
    // Instructions container card
    instructionsContainerCard: {
      backgroundColor: isDarkMode ? COLORS.surfaceDark : COLORS.surfaceLight,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Instruction section header label
    instructionSectionTitleLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4,
    },
    // Circular numbered step indicator
    instructionStepNumberCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: COLORS.logoGreen,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
      marginTop: 1,
      flexShrink: 0,
    },
    // Number text inside circle
    instructionStepNumberText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800",
    },
    // Instruction text paragraph
    instructionParagraphText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      lineHeight: 19,
    },
    // Bottom docked control bar in player
    playerControlActionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: Platform.OS === "ios" ? 34 : 20,
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.base,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Secondary "Previous" action button
    playerSecondaryNeuActionBtn: {
      flex: 0.7,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDarkMode ? COLORS.surfaceDark : COLORS.surfaceLight,
      paddingVertical: 14,
      borderRadius: 16,
      marginRight: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Secondary button label text
    playerSecondaryActionBtnText: {
      fontSize: 13,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
    },
    // Primary action button in player (Complete / Next)
    playerPrimaryActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.logoGreen,
      paddingVertical: 14,
      borderRadius: 16,
    },
    // Primary action button text
    playerPrimaryActionBtnText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#FFFFFF",
    },

    // --- COUNTDOWN OVERLAY STYLES ---
    // Fullscreen dimmed countdown overlay
    countdownOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.88)",
      alignItems: "center",
      justifyContent: "center",
    },
    // Rest label above countdown
    countdownRestLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: COLORS.logoGreen,
      letterSpacing: 4,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    // Big numerical countdown readout
    countdownNumberText: {
      fontWeight: "900",
      letterSpacing: -2,
    },
    // Seconds unit label
    countdownSecondsUnitText: {
      fontSize: 13,
      color: "rgba(255, 255, 255, 0.40)",
      fontWeight: "600",
      marginTop: 6,
    },
    // Next exercise preview card in countdown overlay
    countdownNextPreviewCard: {
      marginTop: 32,
      paddingHorizontal: 24,
      paddingVertical: 14,
      backgroundColor: "rgba(255, 255, 255, 0.07)",
      borderRadius: 18,
      alignItems: "center",
      maxWidth: 290,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.10)",
    },
    // Up next badge in preview card
    countdownUpNextBadge: {
      fontSize: 10,
      fontWeight: "800",
      color: COLORS.logoGreen,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 8,
    },
    // Next exercise name text
    countdownNextExerciseTitle: {
      fontSize: 19,
      fontWeight: "900",
      color: "#FFFFFF",
      textAlign: "center",
      lineHeight: 24,
    },
    // Next target text
    countdownNextTargetText: {
      fontSize: 12,
      fontWeight: "600",
      color: "rgba(255, 255, 255, 0.50)",
      marginTop: 6,
    },
    // Skip rest tip text
    countdownSkipTipText: {
      marginTop: 36,
      fontSize: 11,
      color: "rgba(255, 255, 255, 0.25)",
      fontWeight: "500",
      letterSpacing: 0.5,
    },
  });
