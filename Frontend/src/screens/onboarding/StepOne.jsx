// --- IMPORTS ---
import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import useStepOneBaseline from "../../hooks/useStepOneBaseline";

// --- LIGHTWEIGHT SUBCOMPONENTS ---

// Dynamic BMI monitor display panel
function BmiPanel({ bmi, styles }) {
  return (
    <View style={styles.bmiPanelRecess}>
      {bmi.val ? (
        <View style={styles.bmiContentCenter}>
          <Text style={styles.bmiLabel}>Estimated BMI</Text>
          <Text style={styles.bmiNumber}>{bmi.val}</Text>
          <Text style={[styles.bmiCategory, styles[bmi.styleKey]]}>
            {bmi.cat}
          </Text>
        </View>
      ) : (
        <Text style={styles.bmiPlaceholder}>
          Enter weight and height configuration parameters to calculate baseline BMI values.
        </Text>
      )}
    </View>
  );
}

// Form dispatch submit button
function PrimaryButton({ onPress, isLoading, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isLoading}
      onPress={onPress}
      style={[styles.buttonBase, styles.buttonUnpressed]}
    >
      {isLoading ? (
        <View style={styles.buttonLoadingRow}>
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonSpinner} />
          <Text style={[styles.buttonText, styles.buttonLoadingText]}>Processing...</Text>
        </View>
      ) : (
        <Text style={styles.buttonText}>Continue to Objectives</Text>
      )}
    </TouchableOpacity>
  );
}

// --- MAIN STEP ONE SCREEN ---

export default function StepOneScreen({ onNext, initialBaseline }) {
  // Theme & screen styling
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Baseline metrics hook: form state, conversions, BMI engine & submit handler
  const {
    form,
    bmi,
    isLoading,
    handleAgeChange,
    handleWeightChange,
    handleHeightFtChange,
    handleHeightInChange,
    handleNextStep,
  } = useStepOneBaseline({ onNext, initialBaseline });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Status Bar */}
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme?.background || COLORS.base}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Sector */}
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 1 OF 4</Text>
            <Text style={styles.brandTitle}>Your Baseline</Text>
            <Text style={styles.brandSubtitle}>
              Let's establish your starting metrics so we can track your progress and personalize your daily nutrition.
            </Text>
          </View>

          {/* Central Card System */}
          <View style={styles.formCard}>
            {/* Age Metric Field */}
            <View style={styles.inputGroup}>
              <View style={styles.rowLabelWrapper}>
                <Text style={styles.inputLabel}>Age</Text>
              </View>
              <View style={styles.flatInputField}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your age"
                  placeholderTextColor={theme?.placeholderText || COLORS.textPlaceholder}
                  value={form.age}
                  onChangeText={handleAgeChange}
                  keyboardType="numeric"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Height Metric Field (Split ft/in) */}
            <View style={styles.inputGroup}>
              <View style={styles.rowLabelWrapper}>
                <Text style={styles.inputLabel}>Height (ft/in)</Text>
              </View>
              <View style={styles.splitInputRow}>
                <View style={[styles.flatInputField, styles.splitInputLeft]}>
                  <TextInput
                    style={styles.input}
                    placeholder="ft"
                    placeholderTextColor={theme?.placeholderText || COLORS.textPlaceholder}
                    value={form.heightFt}
                    onChangeText={handleHeightFtChange}
                    keyboardType="numeric"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                <View style={[styles.flatInputField, styles.splitInputRight]}>
                  <TextInput
                    style={styles.input}
                    placeholder="in"
                    placeholderTextColor={theme?.placeholderText || COLORS.textPlaceholder}
                    value={form.heightIn}
                    onChangeText={handleHeightInChange}
                    keyboardType="numeric"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>
            </View>

            {/* Weight Metric Field */}
            <View style={styles.inputGroup}>
              <View style={styles.rowLabelWrapper}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
              </View>
              <View style={styles.flatInputField}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter weight in kg"
                  placeholderTextColor={theme?.placeholderText || COLORS.textPlaceholder}
                  value={form.weight}
                  onChangeText={handleWeightChange}
                  keyboardType="numeric"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Dynamic Real-Time BMI Monitor */}
            <BmiPanel bmi={bmi} styles={styles} />

            {/* Continue Submit Button */}
            <PrimaryButton
              onPress={handleNextStep}
              isLoading={isLoading}
              styles={styles}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================================
// --- COMPONENT STYLES & COLOR CONFIGURATION ---
// ============================================================================
const COLORS = {
  base: "#F8FAFC",
  whiteHighlight: "#FFFFFF",
  logoGreen: "#10B981",
  textDark: "#0F172A",
  textMuted: "#64748B",
  textPlaceholder: "#94A3B8",
  borderLight: "#E2E8F0",
  bgPill: "#F1F5F9",
};

const getStyles = (theme, isDarkMode = false) =>
  StyleSheet.create({
    // --- MAIN SCREEN LAYOUT ---
    // Entire full-screen background
    container: {
      flex: 1,
      backgroundColor: theme?.background || COLORS.base,
    },
    // ScrollView inner padding & vertical centering
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 16,
    },

    // --- HEADER / BRAND SECTION ---
    // Header wrapper holding step indicator, title and subtitle
    headerSection: {
      marginBottom: 28,
      alignItems: "center",
      width: "100%",
    },
    // "STEP 1 OF 4" tracking indicator text
    stepIndicator: {
      fontSize: 11,
      fontWeight: "900",
      color: COLORS.logoGreen,
      letterSpacing: 2,
      textTransform: "uppercase",
      textAlign: "center",
      marginBottom: 4,
    },
    // Main "Your Baseline" screen title
    brandTitle: {
      fontSize: 36,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textDark,
      letterSpacing: -0.5,
      marginTop: 2,
      textAlign: "center",
    },
    // Subtitle description below the title
    brandSubtitle: {
      fontSize: 13.5,
      color: theme?.textSecondary || COLORS.textMuted,
      marginTop: 8,
      textAlign: "center",
      lineHeight: 20,
      fontWeight: "600",
    },

    // --- FORM CONTAINER CARD ---
    // The rounded card containing all baseline metric fields
    formCard: {
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 18,
      padding: 24,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.2 : 0.035,
      shadowRadius: 8,
      elevation: 1,
    },

    // --- INPUT FIELDS (AGE, HEIGHT & WEIGHT) ---
    // Wrapper spacing around each input field
    inputGroup: {
      marginBottom: 22,
    },
    // Label wrapper holding field title
    rowLabelWrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    // Uppercase label above input ("AGE", "HEIGHT (FT/IN)", "WEIGHT (KG)")
    inputLabel: {
      color: theme?.textPrimary || "#64748B",
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    // Horizontal row for splitting height into feet and inches
    splitInputRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    // Left half of split input (feet)
    splitInputLeft: {
      flex: 1,
      marginRight: 10,
    },
    // Right half of split input (inches)
    splitInputRight: {
      flex: 1,
    },
    // Input box container (background color and border outline)
    flatInputField: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme?.inputBorder || COLORS.borderLight,
    },
    // The actual text typed by user inside the input field
    input: {
      flex: 1,
      color: theme?.textPrimary || COLORS.textDark,
      paddingHorizontal: 18,
      paddingVertical: 15,
      fontSize: 16,
      fontWeight: "700",
    },

    // --- REAL-TIME BMI MONITOR ---
    // Recessed background panel holding BMI metric readout
    bmiPanelRecess: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderRadius: 12,
      padding: 20,
      marginTop: 6,
      marginBottom: 10,
      borderWidth: 1.5,
      borderColor: theme?.inputBorder || COLORS.borderLight,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 110,
    },
    // Vertical centering layout for BMI readout
    bmiContentCenter: {
      alignItems: "center",
      justifyContent: "center",
    },
    // "ESTIMATED BMI" header label
    bmiLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: theme?.textSecondary || COLORS.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    // Large BMI numeric score text
    bmiNumber: {
      fontSize: 38,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textDark,
      marginVertical: 4,
    },
    // BMI category classification font
    bmiCategory: {
      fontSize: 15,
      fontWeight: "800",
    },
    // Category colors
    bmiCategoryNormal: {
      color: COLORS.logoGreen,
    },
    bmiCategoryUnderweight: {
      color: COLORS.logoGreen,
    },
    bmiCategoryOverweight: {
      color: theme?.textSecondary || COLORS.textMuted,
    },
    bmiCategoryObese: {
      color: theme?.textSecondary || COLORS.textMuted,
    },
    // Instructions placeholder text when BMI metrics are incomplete
    bmiPlaceholder: {
      color: theme?.textSecondary || COLORS.textPlaceholder,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 20,
    },

    // --- SUBMISSION BUTTON ("CONTINUE") ---
    // Common dimensions and centering for submit button
    buttonBase: {
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      marginTop: 16,
    },
    // Default "Continue" button background color
    buttonUnpressed: {
      backgroundColor: COLORS.logoGreen,
      borderRadius: 14,
    },
    // "Continue" button text color & font
    buttonText: {
      color: COLORS.whiteHighlight,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    // Row holding spinner and loading text
    buttonLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    // Spinner spacing next to loading text
    buttonSpinner: {
      marginRight: 8,
    },
    // Loading text style
    buttonLoadingText: {
      opacity: 0.95,
    },
  });
