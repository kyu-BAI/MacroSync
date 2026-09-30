// --- IMPORTS ---
import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import useStepTwoGoals, { ACTIVITY_LEVELS, GOALS, DAYS_OF_WEEK } from "../../hooks/useStepTwoGoals";

// --- LIGHTWEIGHT SUBCOMPONENTS ---

// Activity level segmented card selector
function ActivitySelector({ selectedActivity, onSelect, disabled, styles }) {
  return (
    <View style={styles.segmentedGrid}>
      {ACTIVITY_LEVELS.map((level) => {
        const isSelected = selectedActivity === level.id;
        return (
          <TouchableOpacity
            key={level.id}
            activeOpacity={0.85}
            disabled={disabled}
            onPress={() => onSelect(level.id)}
            style={[styles.gridCard, isSelected ? styles.gridCardActive : styles.gridCardInactive]}
          >
            <View style={[styles.iconWrapper, isSelected ? styles.iconWrapperActive : styles.iconWrapperInactive]}>
              <Ionicons name={level.icon} size={20} color={isSelected ? COLORS.whiteHighlight : COLORS.logoGreen} />
            </View>
            <Text style={[styles.gridTitle, isSelected ? styles.gridTitleActive : styles.gridTitleInactive]}>{level.title}</Text>
            <Text style={styles.gridSubTitle}>{level.subTitle}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Fitness goal segmented card selector
function GoalSelector({ selectedGoal, onSelect, disabled, styles }) {
  return (
    <View style={styles.segmentedGrid}>
      {GOALS.map((goal) => {
        const isSelected = selectedGoal === goal.id;
        return (
          <TouchableOpacity
            key={goal.id}
            activeOpacity={0.85}
            disabled={disabled}
            onPress={() => onSelect(goal.id)}
            style={[styles.gridCard, isSelected ? styles.gridCardActive : styles.gridCardInactive]}
          >
            <View style={[styles.iconWrapper, isSelected ? styles.iconWrapperActive : styles.iconWrapperInactive]}>
              <Ionicons name={goal.icon} size={20} color={isSelected ? COLORS.whiteHighlight : COLORS.logoGreen} />
            </View>
            <Text style={[styles.gridTitle, isSelected ? styles.gridTitleActive : styles.gridTitleInactive]}>{goal.title}</Text>
            <View style={[styles.tagBadge, isSelected ? styles.tagBadgeActive : styles.tagBadgeInactive]}>
              <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{goal.tag}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Calendar modal day picker
function CalendarPickerModal({
  visible,
  currentMonthYearTitle,
  calendarDays,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onClose,
  disabled,
  styles,
}) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalFormCard}>
          {/* Header Row: Month / Year Title with Prev & Next Arrows */}
          <View style={styles.calendarHeaderRow}>
            <TouchableOpacity style={styles.arrowButton} onPress={onPrevMonth} activeOpacity={0.7} disabled={disabled}>
              <Ionicons name="chevron-back" size={20} color={COLORS.logoGreen} />
            </TouchableOpacity>
            <Text style={styles.calendarMonthTitle}>{currentMonthYearTitle}</Text>
            <TouchableOpacity style={styles.arrowButton} onPress={onNextMonth} activeOpacity={0.7} disabled={disabled}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.logoGreen} />
            </TouchableOpacity>
          </View>

          {/* Day of Week Label Header */}
          <View style={styles.weekHeaderRow}>
            {DAYS_OF_WEEK.map((day) => (
              <Text key={day} style={styles.weekDayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Month Days Matrix Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((item) => {
              if (item.isEmpty) {
                return <View key={item.key} style={styles.calendarDayEmpty} />;
              }
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.calendarDayButton,
                    item.isSelected && styles.calendarDaySelected,
                    item.isToday && !item.isSelected && styles.calendarDayToday,
                  ]}
                  disabled={disabled || item.isPast}
                  onPress={() => onSelectDate(item.formattedDate)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      item.isSelected && styles.calendarDayTextSelected,
                      item.isPast && styles.calendarDayTextPast,
                    ]}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Close Calendar Dismiss Button */}
          <TouchableOpacity
            style={[styles.buttonBase, styles.buttonUnpressed, styles.modalDoneButton]}
            onPress={onClose}
            activeOpacity={0.85}
            disabled={disabled}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Form dispatch submit button
function PrimaryButton({ onPress, isLoading, styles }) {
  return (
    <TouchableOpacity activeOpacity={0.85} disabled={isLoading} onPress={onPress} style={[styles.buttonBase, styles.buttonUnpressed]}>
      {isLoading ? <ActivityIndicator size="small" color={COLORS.whiteHighlight} /> : <Text style={styles.buttonText}>Continue</Text>}
    </TouchableOpacity>
  );
}

// --- MAIN STEP TWO SCREEN ---

export default function StepTwoScreen({ onNext, currentWeight, height, weightUnit }) {
  // Theme & screen styling
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Step two goals hook: form state, validations, suggestions & calendar engine
  const {
    form,
    isLoading,
    showCalendar,
    currentMonthYearTitle,
    calendarDays,
    healthyRangeText,
    suggestedDateInfo,
    weightWarningText,
    dateWarningText,
    handleSelectActivity,
    handleSelectGoal,
    handleGoalWeightChange,
    handleTargetDateChange,
    handleApplySuggestedDate,
    handleOpenCalendar,
    handleCloseCalendar,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDate,
    handleContinue,
  } = useStepTwoGoals({ onNext, currentWeight, height, weightUnit });

  const isMaintain = form.selectedGoal === "maintain";

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Status Bar */}
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme?.background || COLORS.base} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header Sector */}
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 2 OF 3</Text>
            <Text style={styles.brandTitle}>Objectives</Text>
            <Text style={styles.brandSubtitle}>
              Define your physical targets and lifestyle profile parameters so MacroSync can calibrate your diet structure.
            </Text>
          </View>

          {/* Main Configuration Card */}
          <View style={styles.formCard}>
            {/* Activity Level Selector */}
            <Text style={styles.sectionInputLabel}>Activity Level</Text>
            <ActivitySelector
              selectedActivity={form.selectedActivity}
              onSelect={handleSelectActivity}
              disabled={isLoading}
              styles={styles}
            />

            {/* Primary Fitness Goal Selector */}
            <Text style={[styles.sectionInputLabel, styles.goalSectionLabel]}>Primary Fitness Goal</Text>
            <GoalSelector selectedGoal={form.selectedGoal} onSelect={handleSelectGoal} disabled={isLoading} styles={styles} />

            {/* Target Weight & Date Controls Section */}
            <View style={styles.targetSection}>
              {/* Target Goal Weight Field */}
              <View style={styles.inputGroup}>
                <View style={styles.rowLabelWrapper}>
                  <Text style={styles.inputLabel}>Target Goal Weight ({form.goalWeightUnit})</Text>
                </View>

                <View style={[styles.flatInputField, isMaintain && styles.flatInputFieldDisabled]}>
                  <TextInput
                    style={[styles.input, isMaintain && styles.inputDisabled]}
                    placeholder={`Enter target weight in ${form.goalWeightUnit}`}
                    placeholderTextColor={theme?.placeholderText || COLORS.textPlaceholder}
                    value={form.goalWeight}
                    onChangeText={handleGoalWeightChange}
                    keyboardType="numeric"
                    editable={!isLoading && !isMaintain}
                  />
                </View>

                {/* Healthy Range Guideline */}
                {Boolean(healthyRangeText) && (
                  <View style={styles.helperRow}>
                    <Ionicons name="information-circle-outline" size={14} color={COLORS.logoGreen} />
                    <Text style={styles.helperText}>{healthyRangeText}</Text>
                  </View>
                )}

                {/* Weight Validation Warning Box */}
                {Boolean(weightWarningText) && (
                  <View style={styles.warningBox}>
                    <Ionicons name="alert-circle-outline" size={14} color={COLORS.dangerRed} />
                    <Text style={styles.warningBoxText}>{weightWarningText}</Text>
                  </View>
                )}
              </View>

              {/* Target Goal Date Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Goal Date</Text>
                <View style={[styles.flatInputField, styles.fieldRow]}>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={theme?.placeholderText || COLORS.textPlaceholder}
                    value={form.targetDate}
                    onChangeText={handleTargetDateChange}
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                  <TouchableOpacity style={styles.calendarIconBtn} disabled={isLoading} onPress={handleOpenCalendar} activeOpacity={0.6}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.logoGreen} />
                  </TouchableOpacity>
                </View>

                {/* Suggested Realistic Date Quick Chip */}
                {Boolean(suggestedDateInfo) && (
                  <TouchableOpacity style={styles.suggestedChip} activeOpacity={0.7} onPress={handleApplySuggestedDate}>
                    <Ionicons name="sparkles-outline" size={14} color={COLORS.logoGreen} />
                    <Text style={styles.suggestedChipText}>
                      Auto-set realistic date: {suggestedDateInfo.formatted} ({suggestedDateInfo.weeks} wks @ 0.5kg/wk)
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Date Validation Warning Box */}
                {Boolean(dateWarningText) && (
                  <View style={styles.warningBox}>
                    <Ionicons name="alert-circle-outline" size={14} color={COLORS.dangerRed} />
                    <Text style={styles.warningBoxText}>{dateWarningText}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Continue Submit Button */}
            <PrimaryButton onPress={handleContinue} isLoading={isLoading} styles={styles} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Calendar Sheet Overlay */}
      <CalendarPickerModal
        visible={showCalendar}
        currentMonthYearTitle={currentMonthYearTitle}
        calendarDays={calendarDays}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onSelectDate={handleSelectDate}
        onClose={handleCloseCalendar}
        disabled={isLoading}
        styles={styles}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// --- COMPONENT STYLES & COLOR CONFIGURATION ---
// ============================================================================
const COLORS = {
  base: "#F8FAFC",
  logoGreen: "#10B981",
  logoGreenPressed: "#059669",
  textDark: "#0F172A",
  textGrey: "#64748B",
  textMuted: "#94A3B8",
  textPlaceholder: "#94A3B8",
  textDisabled: "#CBD5E1",
  borderLight: "#E2E8F0",
  bgPill: "#F1F5F9",
  cardBgLight: "#EBEBEB",
  dangerRed: "#EF4444",
  whiteHighlight: "#FFFFFF",
  overlayDark: "rgba(0, 0, 0, 0.4)",
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
      paddingHorizontal: 20,
      paddingBottom: 30,
      paddingTop: Platform.OS === "ios" ? 30 : 20,
    },

    // --- HEADER / BRAND SECTION ---
    // Header wrapper holding step indicator, title and subtitle
    headerSection: {
      marginBottom: 28,
      alignItems: "center",
      width: "100%",
    },
    // "STEP 2 OF 3" tracking indicator text
    stepIndicator: {
      fontSize: 11,
      fontWeight: "900",
      color: COLORS.logoGreen,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    // Main "Objectives" screen title
    brandTitle: {
      fontSize: 38,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textDark,
      letterSpacing: -0.5,
      marginTop: 4,
    },
    // Subtitle description below the title
    brandSubtitle: {
      fontSize: 13,
      color: theme?.textSecondary || COLORS.textGrey,
      marginTop: 8,
      textAlign: "center",
      lineHeight: 20,
      fontWeight: "700",
      paddingHorizontal: 10,
    },

    // --- FORM CONTAINER CARD ---
    // Rounded card housing all objective parameters
    formCard: {
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 28,
      padding: 20,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
      shadowOpacity: 0,
      elevation: 0,
    },
    // Section label ("ACTIVITY LEVEL", "PRIMARY FITNESS GOAL")
    sectionInputLabel: {
      color: theme?.textPrimary || COLORS.textGrey,
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginLeft: 4,
    },
    // Spacing between activity grid and fitness goal header
    goalSectionLabel: {
      marginTop: 20,
    },

    // --- SEGMENTED 3-COLUMN SELECTION GRID ---
    // Horizontal row holding 3 option cards
    segmentedGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    // Individual option card base shape
    gridCard: {
      width: "31.5%",
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
    },
    // Inactive unselected option card style
    gridCardInactive: {
      backgroundColor: theme?.surface || COLORS.base,
      borderColor: theme?.border || COLORS.borderLight,
      shadowOpacity: 0,
      elevation: 0,
    },
    // Active selected option card style
    gridCardActive: {
      backgroundColor: theme?.cardBg || COLORS.cardBgLight,
      borderColor: COLORS.logoGreen,
      shadowOpacity: 0,
      elevation: 0,
    },
    // Circular icon background container
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    // Inactive circular icon wrapper background
    iconWrapperInactive: {
      backgroundColor: theme?.cardBg || COLORS.bgPill,
    },
    // Active circular icon wrapper background
    iconWrapperActive: {
      backgroundColor: COLORS.logoGreen,
    },
    // Card primary title label ("Sedentary", "Gain Weight", etc.)
    gridTitle: {
      fontSize: 12,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 2,
    },
    // Inactive card title text color
    gridTitleInactive: {
      color: theme?.textPrimary || COLORS.textDark,
    },
    // Active card title text color
    gridTitleActive: {
      color: COLORS.logoGreen,
    },
    // Card secondary subtitle text ("Desk / Minimal", "3-5 Days/Wk")
    gridSubTitle: {
      fontSize: 10,
      color: theme?.textSecondary || COLORS.textMuted,
      fontWeight: "700",
      textAlign: "center",
    },

    // --- TAG BADGE (GOAL CARDS) ---
    // Tiny pill badge on goal cards ("Surplus", "Deficit", "Balance")
    tagBadge: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 8,
      marginTop: 2,
    },
    // Inactive goal pill badge background
    tagBadgeInactive: {
      backgroundColor: theme?.cardBg || COLORS.bgPill,
    },
    // Active goal pill badge background
    tagBadgeActive: {
      backgroundColor: COLORS.logoGreen,
    },
    // Goal pill badge text style
    tagText: {
      fontSize: 9,
      fontWeight: "800",
      color: theme?.textSecondary || COLORS.textGrey,
    },
    // Active goal pill badge text color
    tagTextActive: {
      color: COLORS.whiteHighlight,
    },

    // --- TARGET WEIGHT & DATE SECTION ---
    // Container separating grids from numeric & calendar inputs
    targetSection: {
      marginTop: 12,
      borderTopWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
      paddingTop: 16,
    },
    // Wrapper spacing around each input field
    inputGroup: {
      marginBottom: 18,
    },
    // Label wrapper holding field title
    rowLabelWrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    // Uppercase label above input ("TARGET GOAL WEIGHT", "TARGET GOAL DATE")
    inputLabel: {
      color: theme?.textPrimary || COLORS.textGrey,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    // Input box container (background color and border outline)
    flatInputField: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme?.inputBorder || COLORS.borderLight,
      height: 50,
      justifyContent: "center",
    },
    // Disabled input field state (used when Maintain Weight is active)
    flatInputFieldDisabled: {
      backgroundColor: theme?.cardBg || COLORS.bgPill,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Row layout for calendar date field with trailing icon button
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    // The actual text typed by user inside the input field
    input: {
      flex: 1,
      color: theme?.textPrimary || COLORS.textDark,
      paddingHorizontal: 16,
      height: "100%",
      fontSize: 15,
      fontWeight: "700",
    },
    // Disabled text color inside disabled input
    inputDisabled: {
      color: theme?.textSecondary || COLORS.textMuted,
    },
    // Trailing calendar icon touchable button inside input field
    calendarIconBtn: {
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingRight: 16,
    },

    // --- CALENDAR MODAL OVERLAY ---
    // Fullscreen dark backdrop for calendar modal
    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.overlayDark,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    // Elevated card housing the calendar controls
    modalFormCard: {
      width: "100%",
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Header row containing month title and month navigation arrows
    calendarHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      marginBottom: 20,
    },
    // Large current month & year title
    calendarMonthTitle: {
      fontSize: 17,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textDark,
    },
    // Month prev/next arrow button container
    arrowButton: {
      padding: 8,
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Weekday abbreviations row ("Su", "Mo", "Tu", etc.)
    weekHeaderRow: {
      flexDirection: "row",
      width: "100%",
      marginBottom: 12,
    },
    // Weekday abbreviation column label
    weekDayLabel: {
      flex: 1,
      textAlign: "center",
      color: theme?.textSecondary || COLORS.textMuted,
      fontWeight: "800",
      fontSize: 11,
      textTransform: "uppercase",
    },
    // Day grid container wrapping 7 columns
    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      width: "100%",
      justifyContent: "flex-start",
    },
    // Individual day cell button
    calendarDayButton: {
      width: "14.28%",
      aspectRatio: 1,
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 2,
      borderRadius: 12,
    },
    // Empty spacer slot for day offset alignment
    calendarDayEmpty: {
      width: "14.28%",
      aspectRatio: 1,
      marginVertical: 2,
    },
    // Day number text inside calendar cell
    calendarDayText: {
      color: theme?.textPrimary || COLORS.textDark,
      fontWeight: "700",
      fontSize: 13,
    },
    // Highlighted cell styling for the selected target date
    calendarDaySelected: {
      backgroundColor: COLORS.logoGreen,
      borderRadius: 12,
    },
    // Day text styling when cell is actively selected
    calendarDayTextSelected: {
      color: COLORS.whiteHighlight,
      fontWeight: "900",
    },
    // Border highlight marking today's calendar date
    calendarDayToday: {
      borderWidth: 1.5,
      borderColor: COLORS.logoGreen,
    },
    // Dimmed text color for past non-selectable dates
    calendarDayTextPast: {
      color: COLORS.textDisabled,
    },
    // Top spacing on calendar modal dismiss button
    modalDoneButton: {
      marginTop: 24,
    },

    // --- DYNAMIC SUGGESTIONS & VALIDATION MESSAGES ---
    // Helper guideline row with info icon
    helperRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      paddingHorizontal: 4,
    },
    // Helper guideline descriptive text
    helperText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme?.textSecondary || COLORS.textGrey,
      marginLeft: 5,
    },
    // Interactive suggestion chip container
    suggestedChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme?.cardBg || COLORS.bgPill,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: COLORS.logoGreen,
    },
    // Suggested realistic date highlight text
    suggestedChipText: {
      fontSize: 12,
      fontWeight: "800",
      color: COLORS.logoGreen,
      marginLeft: 6,
    },
    // Validation warning container box
    warningBox: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      paddingHorizontal: 4,
    },
    // Warning error text
    warningBoxText: {
      fontSize: 12,
      fontWeight: "700",
      color: COLORS.dangerRed,
      marginLeft: 5,
    },

    // --- PRIMARY SUBMIT BUTTON ---
    // Primary button baseline dimensions & centering
    buttonBase: {
      paddingVertical: 14,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: 52,
      marginTop: 10,
    },
    // Brand green button background
    buttonUnpressed: {
      backgroundColor: COLORS.logoGreen,
    },
    // Button label typography
    buttonText: {
      color: COLORS.whiteHighlight,
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
  });
