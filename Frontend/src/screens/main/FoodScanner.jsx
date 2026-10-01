import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
  StatusBar,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import { CameraView } from "expo-camera";
import {
  X,
  Zap,
  ZapOff,
  CheckCircle2,
  Scan,
  Utensils,
  Upload,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Minus,
  Plus,
} from "lucide-react-native";
import useFoodScanner from "../../hooks/useFoodScanner";
import { useCustomAlert } from "../../context/CustomAlertContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

const { height: screenHeight } = Dimensions.get("window");

const MEAL_TYPE_COLORS = {
  Breakfast: "#F59E0B",
  Lunch: "#10B981",
  Snack: "#0EA5E9",
  Dinner: "#8B5CF6",
};

export default function FoodScannerScreen({
  onTabChange,
  onLogMeal,
  userId,
  userProfile,
  dailyNutrition,
}) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const { language, translateMealTitle } = useLanguage();
  const styles = getStyles(theme, isDarkMode);

  const {
    permission,
    requestPermission,
    flashMode,
    setFlashMode,
    isScanning,
    analysisResult,
    capturedImage,
    selectedMealType,
    setSelectedMealType,
    portionScale,
    customGramsInput,
    setCustomGramsInput,
    scanInfo,
    showTipsCard,
    setShowTipsCard,
    handleDismissTipsCard,
    cameraRef,
    pulseAnim,
    scanLineAnim,
    handleCapture,
    handleUploadImage,
    resetScan,
    baseWeightGrams,
    currentGrams,
    scaledCalories,
    scaledProtein,
    scaledCarbs,
    scaledFats,
    scaledWeight,
    handleStepGrams,
    handleMultiplierPress,
    handleLogFood,
  } = useFoodScanner({
    userId,
    userProfile,
    dailyNutrition,
    onLogMeal,
    onTabChange,
    showAlert,
  });

  /* remove everything in the screen */
  // return <View style={styles.container} />;

  // Camera permissions loading state
  if (!permission) {
    return (
      <View style={[styles.container, styles.centerLoaderContainer]}>
        <ActivityIndicator size="large" color={COLORS.logoGreen} />
        <Text style={styles.permissionLoadingText}>
          Loading camera permissions...
        </Text>
      </View>
    );
  }

  // Camera permissions denied / request state
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Utensils color={COLORS.logoGreen} size={48} style={{ marginBottom: 20 }} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to scan food and analyze macronutrients.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeButtonAbsolute}
          onPress={() => onTabChange?.("DASHBOARD")}
          activeOpacity={0.7}
        >
          <X color={isDarkMode ? COLORS.white : COLORS.textPrimaryLight} size={24} />
        </TouchableOpacity>
      </View>
    );
  }

  // Split-screen Layout: Photo Top, Nutritional Breakdown & Portion Controls Bottom
  if (analysisResult && capturedImage) {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />

        {/* Full captured image preview on top viewport with floating close button */}
        <View style={styles.imagePreviewHeader}>
          <Image
            source={{ uri: capturedImage }}
            style={styles.imagePreviewFill}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.floatingCloseBtn}
            onPress={resetScan}
            activeOpacity={0.8}
          >
            <X color={COLORS.white} size={20} />
          </TouchableOpacity>
        </View>

        {/* Scrollable nutrition and portion adjustment sheet */}
        <ScrollView
          style={styles.resultsSheetScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsSheetContent}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === "android"}
        >
          {/* Header Title & Match Confidence Badge */}
          <View style={styles.resultTitleRow}>
            <View style={styles.aiBadge}>
              <Scan color={COLORS.logoGreen} size={14} style={{ marginRight: 4 }} />
              <Text style={styles.aiBadgeText}>AI Vision Match</Text>
            </View>
            <Text style={styles.confidenceText}>
              {analysisResult.confidence}% match
            </Text>
          </View>

          <Text style={styles.foodName}>
            {translateMealTitle(analysisResult.name, language)}
          </Text>
          {scaledWeight ? (
            <Text style={styles.portionText}>
              Estimated Portion: {scaledWeight}g (AI Base ~{baseWeightGrams}g)
            </Text>
          ) : null}

          {/* ── PORTION WEIGHT (GRAMS INPUT & STEPPER) ── */}
          <Text style={styles.subTitleLabel}>Adjust Portion Weight (Grams)</Text>

          <View style={styles.gramInputCard}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => handleStepGrams(-25)}
              activeOpacity={0.7}
            >
              <Minus color={isDarkMode ? "#CBD5E1" : "#475569"} size={18} />
            </TouchableOpacity>

            <View style={styles.gramInputWrapper}>
              <TextInput
                style={styles.gramTextInput}
                value={customGramsInput}
                onChangeText={(val) => {
                  const clean = val.replace(/[^0-9.]/g, "");
                  setCustomGramsInput(clean);
                }}
                keyboardType="numeric"
                selectTextOnFocus={true}
                placeholder={String(baseWeightGrams)}
                placeholderTextColor={COLORS.textSecondaryDark}
              />
              <Text style={styles.gramSuffixText}>grams</Text>
            </View>

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => handleStepGrams(25)}
              activeOpacity={0.7}
            >
              <Plus color={isDarkMode ? "#CBD5E1" : "#475569"} size={18} />
            </TouchableOpacity>
          </View>

          {/* Quick Multipliers Row */}
          <View style={styles.portionScaleRow}>
            {[0.5, 1.0, 1.5, 2.0].map((scale) => {
              const targetGrams = Math.round(baseWeightGrams * scale);
              const isActive = Math.abs(currentGrams - targetGrams) < 2;
              return (
                <TouchableOpacity
                  key={scale}
                  style={[
                    styles.scaleChip,
                    isActive && styles.scaleChipActive,
                  ]}
                  onPress={() => handleMultiplierPress(scale)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.scaleChipText,
                      isActive && styles.scaleChipTextActive,
                    ]}
                  >
                    {scale}x ({targetGrams}g)
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── MEAL TYPE SELECTOR ── */}
          <Text style={styles.subTitleLabel}>Log to Meal Category</Text>
          <View style={styles.mealTypeRow}>
            {["Breakfast", "Lunch", "Snack", "Dinner"].map((type) => {
              const activeColor = MEAL_TYPE_COLORS[type];
              const isActive = selectedMealType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeChip,
                    isActive
                      ? {
                          backgroundColor: `${activeColor}20`,
                          borderColor: activeColor,
                          borderWidth: 1.5,
                        }
                      : { backgroundColor: theme?.cardBg || COLORS.cardBgLight },
                  ]}
                  onPress={() => setSelectedMealType(type)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.mealTypeChipText,
                      isActive
                        ? { color: activeColor, fontWeight: "900" }
                        : {
                            color:
                              theme?.textSecondary ||
                              COLORS.textSecondaryLight,
                          },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── MACRO BREAKDOWN GRID ── */}
          <View style={styles.macroCardGrid}>
            <View style={styles.macroCard}>
              <Text style={[styles.macroValue, { color: COLORS.orange }]}>
                {scaledCalories}
              </Text>
              <Text style={styles.macroLabel}>Kcal</Text>
            </View>
            <View
              style={[
                styles.macroCard,
                {
                  borderLeftWidth: 1,
                  borderColor: theme?.border || COLORS.borderLight,
                },
              ]}
            >
              <Text style={[styles.macroValue, { color: COLORS.logoGreen }]}>
                {scaledProtein}g
              </Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View
              style={[
                styles.macroCard,
                {
                  borderLeftWidth: 1,
                  borderColor: theme?.border || COLORS.borderLight,
                },
              ]}
            >
              <Text style={[styles.macroValue, { color: COLORS.amber }]}>
                {scaledCarbs}g
              </Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View
              style={[
                styles.macroCard,
                {
                  borderLeftWidth: 1,
                  borderColor: theme?.border || COLORS.borderLight,
                },
              ]}
            >
              <Text style={[styles.macroValue, { color: COLORS.pink }]}>
                {scaledFats}g
              </Text>
              <Text style={styles.macroLabel}>Fats</Text>
            </View>
          </View>

          {/* Confirm Log Button */}
          <TouchableOpacity
            style={styles.logButton}
            onPress={handleLogFood}
            activeOpacity={0.8}
          >
            <CheckCircle2
              color={COLORS.white}
              size={18}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.logButtonText}>
              Log {selectedMealType} ({scaledCalories} kcal)
            </Text>
          </TouchableOpacity>

          {/* Retake Photo Button */}
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={resetScan}
            activeOpacity={0.7}
          >
            <Text style={styles.retakeButtonText}>Retake Photo</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        hidden={false}
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      {/* ── HEADER AREA ── */}
      <View style={styles.headerArea}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => onTabChange?.("DASHBOARD")}
          activeOpacity={0.7}
        >
          <X color={COLORS.textSecondaryLight} size={24} />
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitle}>AI Food Scanner</Text>

          {/* REMAINING SCAN COUNT BADGE */}
          <View
            style={[
              styles.scanBadgePill,
              scanInfo.isPremium
                ? styles.premiumBadgePill
                : scanInfo.remaining <= 1
                ? styles.warningBadgePill
                : styles.normalBadgePill,
            ]}
          >
            {scanInfo.isPremium ? (
              <Sparkles
                color={COLORS.purple}
                size={11}
                style={{ marginRight: 4 }}
              />
            ) : (
              <Zap
                color={scanInfo.remaining <= 1 ? COLORS.warning : COLORS.logoGreen}
                size={11}
                style={{ marginRight: 4 }}
              />
            )}
            <Text
              style={[
                styles.scanBadgeText,
                scanInfo.isPremium
                  ? styles.premiumBadgeText
                  : scanInfo.remaining <= 1
                  ? styles.warningBadgeText
                  : styles.normalBadgeText,
              ]}
            >
              {scanInfo.isPremium
                ? "Unlimited Scans"
                : `${scanInfo.remaining} / 5 Scans Left Today`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => setFlashMode(flashMode === "off" ? "on" : "off")}
          activeOpacity={0.7}
        >
          {flashMode === "on" ? (
            <Zap color={COLORS.logoGreen} size={24} />
          ) : (
            <ZapOff color={COLORS.textSecondaryLight} size={24} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── BOUNDED CAMERA VIEWFINDER AREA ── */}
      <View style={styles.cameraContainer}>
        {!capturedImage && (
          <CameraView
            style={styles.camera}
            facing="back"
            enableTorch={flashMode === "on"}
            ref={cameraRef}
          />
        )}
        {Boolean(capturedImage) && (
          <Image
            source={{ uri: capturedImage }}
            style={styles.capturedOverlayImage}
            resizeMode="cover"
            fadeDuration={0}
          />
        )}

        {/* Viewfinder Target Framing & Minimalist Scanning Beam */}
        <View
          style={[styles.viewfinderContainer, { zIndex: 20 }]}
          pointerEvents="none"
        >
          <View style={styles.viewfinderBox}>
            <View
              style={[
                styles.corner,
                styles.topLeft,
                capturedImage && { borderColor: COLORS.logoGreen },
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.topRight,
                capturedImage && { borderColor: COLORS.logoGreen },
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.bottomLeft,
                capturedImage && { borderColor: COLORS.logoGreen },
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.bottomRight,
                capturedImage && { borderColor: COLORS.logoGreen },
              ]}
            />
            {isScanning && (
              <Animated.View
                style={[
                  styles.scanningLine,
                  { transform: [{ translateY: scanLineAnim }] },
                ]}
              />
            )}
          </View>
        </View>
      </View>

      {/* ── SCANNING GUIDELINES & DAILY QUOTA NOTICE ── */}
      {showTipsCard && !isScanning && (
        <View style={styles.visualTipsCard}>
          <View style={styles.tipsHeaderRow}>
            <View style={styles.tipsIconBg}>
              <Lightbulb color={COLORS.amber} size={15} />
            </View>
            <Text style={styles.tipsCardTitle}>Scanning Tips & Limit Notice</Text>
            <TouchableOpacity
              onPress={handleDismissTipsCard}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeTipsBtn}
            >
              <X color={COLORS.textSecondaryDark} size={14} />
            </TouchableOpacity>
          </View>

          <Text style={styles.tipsBulletPoint}>
            • Align food in good lighting inside the frame for best accuracy.
          </Text>

          <View style={styles.warningAlertBox}>
            <AlertTriangle
              color={COLORS.amber}
              size={14}
              style={{ marginRight: 6, marginTop: 1 }}
            />
            <Text style={styles.warningAlertText}>
              <Text style={{ fontWeight: "900", color: "#D97706" }}>Important:</Text>{" "}
              Every scan attempt (including blurry or non-food photos) deducts 1
              count from your 5 daily free scans.
            </Text>
          </View>
        </View>
      )}

      {!showTipsCard && !isScanning && (
        <TouchableOpacity
          style={styles.reopenTipsBtn}
          onPress={() => setShowTipsCard(true)}
          activeOpacity={0.7}
        >
          <Lightbulb color={COLORS.logoGreen} size={13} style={{ marginRight: 5 }} />
          <Text style={styles.reopenTipsText}>Scan Tips & Limit Info</Text>
        </TouchableOpacity>
      )}

      {/* ── BOTTOM CONTROLS & SHUTTER BAR ── */}
      <View style={styles.bottomControlsArea}>
        <Text style={styles.instructionText}>
          {isScanning
            ? "Analyzing macronutrients..."
            : "Align food within the frame"}
        </Text>
        <View style={styles.shutterContainer}>
          {/* Gallery Upload Button */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleUploadImage}
            disabled={isScanning}
            activeOpacity={0.7}
          >
            <Upload color={COLORS.logoGreen} size={22} />
          </TouchableOpacity>

          {/* Main Camera Shutter Button */}
          <TouchableOpacity
            style={styles.shutterOuter}
            onPress={handleCapture}
            disabled={isScanning}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.shutterInner,
                isScanning && { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {isScanning && (
                <ActivityIndicator color={COLORS.white} size="small" />
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// --- CENTRALIZED COLOR PALETTE ---
const COLORS = {
  logoGreen: "#10B981", // Primary theme emerald green accent
  baseColor: "#F8FAFC", // Fallback background color
  cardBgLight: "#F1F5F9", // Card fill for light theme
  cardBgDark: "#1E293B", // Card fill for dark theme
  surfaceLight: "#FFFFFF", // Elevated surface background light
  surfaceDark: "#1E293B", // Elevated surface background dark
  borderLight: "#E2E8F0", // Hairline border light
  borderDark: "#334155", // Hairline border dark
  textPrimaryLight: "#0F172A", // Primary high-contrast text light
  textPrimaryDark: "#F8FAFC", // Primary high-contrast text dark
  textSecondaryLight: "#64748B", // Subdued slate text light
  textSecondaryDark: "#94A3B8", // Subdued slate text dark
  warning: "#EF4444", // Red warning color
  purple: "#8B5CF6", // Premium purple accent
  amber: "#F59E0B", // Caution and carbs amber
  pink: "#EC4899", // Dietary fats pink accent
  orange: "#F97316", // Calorie orange accent
  blue: "#0EA5E9", // Accent sky blue
  black: "#000000", // Viewfinder pure black
  white: "#FFFFFF", // Pure white icon and text
};

// --- STYLESHEET DEFINITION ---
const getStyles = (theme, isDarkMode = false) =>
  StyleSheet.create({
    // Root container filling the entire device viewport
    container: {
      flex: 1,
      backgroundColor: theme?.background || COLORS.baseColor,
    },
    // Center aligned container for permission loader
    centerLoaderContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    // Subtitle text indicating camera permission loading status
    permissionLoadingText: {
      marginTop: 10,
      color: COLORS.textSecondaryLight,
    },
    // Top header row housing navigation, title, quota badge, and torch button
    headerArea: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: Platform.OS === "ios" ? 60 : 40,
      paddingHorizontal: 24,
      marginBottom: 14,
    },
    // Center alignment container for screen title and remaining scan badge
    headerTitleCenter: {
      alignItems: "center",
    },
    // Main bold title of the screen
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme?.textPrimary || COLORS.textSecondaryLight,
    },
    // Pill capsule badge indicating user's remaining AI scans
    scanBadgePill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 4,
    },
    // Standard green tint for regular remaining scans
    normalBadgePill: {
      backgroundColor: isDarkMode
        ? "rgba(16, 185, 129, 0.16)"
        : "rgba(16, 185, 129, 0.10)",
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(16, 185, 129, 0.2)",
    },
    // Red tint for low remaining scans quota alert
    warningBadgePill: {
      backgroundColor: isDarkMode
        ? "rgba(239, 68, 68, 0.16)"
        : "rgba(254, 242, 242, 1)",
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(239, 68, 68, 0.35)"
        : "rgba(252, 165, 165, 0.8)",
    },
    // Purple gradient capsule for premium unlimited users
    premiumBadgePill: {
      backgroundColor: isDarkMode
        ? "rgba(139, 92, 246, 0.16)"
        : "rgba(245, 243, 255, 1)",
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(139, 92, 246, 0.35)"
        : "rgba(221, 214, 254, 0.8)",
    },
    // Typography style for remaining scans badge counter
    scanBadgeText: {
      fontSize: 11,
      fontWeight: "800",
    },
    // Green text color for normal scan counter
    normalBadgeText: {
      color: COLORS.logoGreen,
    },
    // Red text color for critical quota warning
    warningBadgeText: {
      color: COLORS.warning,
    },
    // Purple text color for premium unlimited tier
    premiumBadgeText: {
      color: COLORS.purple,
    },
    // Circular header action buttons for exit and flashlight
    headerIconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme?.surface || COLORS.surfaceLight,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
      shadowOpacity: 0,
      elevation: 0,
    },
    // Rounded camera viewfinder boundary clipping overflow
    cameraContainer: {
      flex: 1,
      marginHorizontal: 24,
      borderRadius: 32,
      overflow: "hidden",
      backgroundColor: COLORS.black,
      position: "relative",
      shadowOpacity: 0,
      elevation: 0,
      marginBottom: 14,
    },
    // Active camera viewport rendering live camera feed
    camera: {
      width: "100%",
      height: "100%",
      zIndex: 1,
    },
    // Frozen overlay image representing the captured frame during analysis
    capturedOverlayImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
      zIndex: 10,
    },
    // Absolute position container centering the square target viewfinder
    viewfinderContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 20,
    },
    // Square framing reticle guiding user to center the meal
    viewfinderBox: {
      width: 280,
      height: 280,
      position: "relative",
      overflow: "hidden",
    },
    // Common corner border bracket styling
    corner: {
      position: "absolute",
      width: 36,
      height: 36,
      borderColor: COLORS.white,
    },
    // Top-left reticle bracket
    topLeft: {
      top: 0,
      left: 0,
      borderTopWidth: 3.5,
      borderLeftWidth: 3.5,
      borderTopLeftRadius: 14,
    },
    // Top-right reticle bracket
    topRight: {
      top: 0,
      right: 0,
      borderTopWidth: 3.5,
      borderRightWidth: 3.5,
      borderTopRightRadius: 14,
    },
    // Bottom-left reticle bracket
    bottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 3.5,
      borderLeftWidth: 3.5,
      borderBottomLeftRadius: 14,
    },
    // Bottom-right reticle bracket
    bottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 3.5,
      borderRightWidth: 3.5,
      borderBottomRightRadius: 14,
    },
    // Green laser beam animating across the reticle during scanning
    scanningLine: {
      position: "absolute",
      top: 0,
      left: 4,
      right: 4,
      height: 2.5,
      backgroundColor: COLORS.logoGreen,
      borderRadius: 2,
      shadowColor: COLORS.logoGreen,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.8,
      shadowRadius: 6,
      elevation: 4,
    },
    // Information card presenting scanning guidelines and quota details
    visualTipsCard: {
      marginHorizontal: 24,
      marginBottom: 12,
      backgroundColor: theme?.surface || COLORS.surfaceLight,
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
      shadowOpacity: 0,
      elevation: 0,
    },
    // Header row within tips card
    tipsHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    // Circular icon background for tips lightbulb
    tipsIconBg: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDarkMode
        ? "rgba(245, 158, 11, 0.18)"
        : "rgba(245, 158, 11, 0.12)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    // Title of the scanning tips notice card
    tipsCardTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: theme?.textPrimary || COLORS.textPrimaryLight,
      flex: 1,
    },
    // Touch target for closing tips card
    closeTipsBtn: {
      padding: 4,
    },
    // Guidance bullet text inside tips card
    tipsBulletPoint: {
      fontSize: 12,
      color: theme?.textSecondary || COLORS.textSecondaryLight,
      lineHeight: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    // Caution box explaining scan deduction rules
    warningAlertBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: isDarkMode
        ? "rgba(245, 158, 11, 0.12)"
        : "rgba(254, 243, 199, 0.4)",
      borderRadius: 12,
      padding: 8,
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(245, 158, 11, 0.25)"
        : "rgba(253, 230, 138, 0.7)",
    },
    // Body text inside quota caution box
    warningAlertText: {
      flex: 1,
      fontSize: 11,
      color: theme?.textSecondary || "#475569",
      lineHeight: 15,
      fontWeight: "600",
    },
    // Small pill button allowing re-opening tips when dismissed
    reopenTipsBtn: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: theme?.surface || COLORS.surfaceLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Text inside reopen tips button
    reopenTipsText: {
      fontSize: 12,
      fontWeight: "700",
      color: COLORS.logoGreen,
    },
    // Bottom bar containing instructions, gallery picker, and shutter button
    bottomControlsArea: {
      paddingBottom: Platform.OS === "ios" ? 40 : 24,
      alignItems: "center",
      paddingHorizontal: 24,
    },
    // Real-time instruction label above the camera shutter
    instructionText: {
      color: theme?.textPrimary || COLORS.textSecondaryLight,
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 14,
    },
    // Container row placing shutter button and gallery selector
    shutterContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      position: "relative",
      height: 76,
    },
    // Left circular button to select existing photo from user's gallery
    galleryButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme?.surface || COLORS.surfaceLight,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
      shadowOpacity: 0,
      elevation: 0,
      position: "absolute",
      left: "20%",
    },
    // Outer circular boundary ring for main capture shutter
    shutterOuter: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 4,
      borderColor: COLORS.logoGreen,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.cardBgLight,
    },
    // Inner filled animated circle that pulses when analysis begins
    shutterInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: COLORS.logoGreen,
      alignItems: "center",
      justifyContent: "center",
    },
    // Top image preview container in split-screen analysis mode
    imagePreviewHeader: {
      height: "40%",
      width: "100%",
      backgroundColor: COLORS.black,
      position: "relative",
    },
    // Fill style for captured image preview
    imagePreviewFill: {
      flex: 1,
    },
    // Floating translucent close button over the preview photo
    floatingCloseBtn: {
      position: "absolute",
      top: 40,
      left: 20,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    // Bottom scrollable sheet containing nutritional stats and adjustment inputs
    resultsSheetScroll: {
      flex: 1,
      backgroundColor: theme?.surface || COLORS.surfaceLight,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      marginTop: -28,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },
    // Padding inside nutrition results bottom sheet
    resultsSheetContent: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
    },
    // Header row above identified food title
    resultTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    // Pill badge denoting AI computer vision recognition
    aiBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode
        ? "rgba(16, 185, 129, 0.16)"
        : "rgba(16, 185, 129, 0.10)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(16, 185, 129, 0.2)",
    },
    // Text style inside AI Vision Match badge
    aiBadgeText: {
      color: COLORS.logoGreen,
      fontSize: 12,
      fontWeight: "700",
    },
    // Confidence percentage text
    confidenceText: {
      color: COLORS.textSecondaryDark,
      fontSize: 12,
      fontWeight: "600",
    },
    // Large prominent heading displaying identified meal name
    foodName: {
      fontSize: 24,
      fontWeight: "800",
      color: theme?.textPrimary || COLORS.textPrimaryLight,
      marginBottom: 12,
    },
    // Sub-label indicating estimated portion in grams
    portionText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme?.textSecondary || COLORS.textSecondaryDark,
      marginTop: -14,
      marginBottom: 20,
    },
    // Section sub-heading label in uppercase
    subTitleLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: theme?.textSecondary || COLORS.textSecondaryLight,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
      marginTop: 4,
    },
    // Card wrapping manual grams input and stepper buttons
    gramInputCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor:
        theme?.cardBg || (isDarkMode ? COLORS.cardBgDark : COLORS.cardBgLight),
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
      borderWidth: 1.2,
      borderColor:
        theme?.border || (isDarkMode ? COLORS.borderDark : COLORS.borderLight),
    },
    // Plus and minus stepper buttons for grams incrementation
    stepperButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        theme?.surface || (isDarkMode ? COLORS.borderDark : COLORS.surfaceLight),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Wrapper centering numeric grams input and suffix label
    gramInputWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    // Direct editable numeric text field for meal weight
    gramTextInput: {
      fontSize: 22,
      fontWeight: "900",
      color: COLORS.logoGreen,
      textAlign: "center",
      paddingHorizontal: 4,
      paddingVertical: 2,
      minWidth: 60,
    },
    // Suffix indicator displaying 'grams'
    gramSuffixText: {
      fontSize: 14,
      fontWeight: "800",
      color: theme?.textSecondary || COLORS.textSecondaryLight,
      marginLeft: 4,
    },
    // Row holding fast portion multiplier chips (0.5x, 1.0x, etc.)
    portionScaleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    // Inactive chip for portion scaling factor
    scaleChip: {
      flex: 1,
      paddingVertical: 10,
      marginHorizontal: 3,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme?.cardBg || COLORS.cardBgLight,
      borderWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Active highlighted state for portion scaling chip
    scaleChipActive: {
      backgroundColor: isDarkMode
        ? "rgba(16, 185, 129, 0.18)"
        : "rgba(16, 185, 129, 0.12)",
      borderColor: COLORS.logoGreen,
      borderWidth: 1.5,
    },
    // Label text inside portion scaling chips
    scaleChipText: {
      fontSize: 12,
      fontWeight: "800",
      color: theme?.textSecondary || COLORS.textSecondaryLight,
    },
    // Active emerald text on selected portion chip
    scaleChipTextActive: {
      color: COLORS.logoGreen,
      fontWeight: "900",
    },
    // Row holding Breakfast, Lunch, Snack, Dinner selector chips
    mealTypeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    // Individual meal category chip
    mealTypeChip: {
      flex: 1,
      paddingVertical: 10,
      marginHorizontal: 3,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Category title text inside meal selector chip
    mealTypeChipText: {
      fontSize: 12,
      fontWeight: "800",
    },
    // 4-column card grid summarizing scaled macronutrient breakdown
    macroCardGrid: {
      flexDirection: "row",
      backgroundColor: theme?.cardBg || COLORS.baseColor,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme?.border || COLORS.cardBgLight,
      paddingVertical: 16,
      marginBottom: 24,
    },
    // Individual column tile for each macro metric
    macroCard: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    // Value readout for calories, protein, carbs, or fats
    macroValue: {
      fontSize: 20,
      fontWeight: "800",
      color: theme?.textPrimary || COLORS.textPrimaryLight,
      marginBottom: 4,
    },
    // Sub-label identifying nutrient type
    macroLabel: {
      fontSize: 12,
      color: theme?.textSecondary || COLORS.textSecondaryDark,
      fontWeight: "600",
    },
    // Primary green button to submit and log the analyzed meal
    logButton: {
      flexDirection: "row",
      backgroundColor: COLORS.logoGreen,
      height: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    // Bold white text inside primary log button
    logButtonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: "700",
    },
    // Clean secondary button to discard and retake photo
    retakeButton: {
      height: 56,
      alignItems: "center",
      justifyContent: "center",
    },
    // Subdued text inside retake photo action
    retakeButtonText: {
      color: theme?.textSecondary || COLORS.textSecondaryDark,
      fontSize: 16,
      fontWeight: "600",
    },
    // Centered permissions denial prompt screen
    permissionContainer: {
      flex: 1,
      backgroundColor: theme?.background || COLORS.baseColor,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    // Heading requesting camera access authorization
    permissionTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme?.textPrimary || COLORS.textPrimaryLight,
      marginBottom: 12,
    },
    // Educational text explaining why camera is required
    permissionText: {
      fontSize: 15,
      color: theme?.textSecondary || COLORS.textSecondaryLight,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 30,
    },
    // Primary button to trigger system permissions dialog
    permissionButton: {
      backgroundColor: COLORS.logoGreen,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 16,
    },
    // Text inside grant permission action
    permissionButtonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: "700",
    },
    // Absolute position top-left exit button on permissions prompt
    closeButtonAbsolute: {
      position: "absolute",
      top: 50,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme?.surface || COLORS.surfaceLight,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  });
