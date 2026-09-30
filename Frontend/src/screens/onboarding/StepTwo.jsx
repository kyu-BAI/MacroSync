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
import useStepTwoGoals, {
  ACTIVITY_LEVELS,
  GOALS,
  DAYS_OF_WEEK,
} from "../../hooks/useStepTwoGoals";

// --- CONFIG & THEME TOKENS ---
const COLORS = {
  base: "#F8FAFC",
  logoGreen: "#10B981",
  textDark: "#0F172A",
  textGrey: "#64748B",
  textMuted: "#94A3B8",
  borderLight: "#E2E8F0",
  bgPill: "#F1F5F9",
  cardBgLight: "#EBEBEB",
  dangerRed: "#EF4444",
  white: "#FFFFFF",
  overlayDark: "rgba(0, 0, 0, 0.4)",
};

// --- SUBCOMPONENTS ---

// 1. Activity level segmented selector (3 columns)
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
              <Ionicons name={level.icon} size={20} color={isSelected ? COLORS.white : COLORS.logoGreen} />
            </View>
            <Text style={[styles.gridTitle, isSelected ? styles.gridTitleActive : styles.gridTitleInactive]}>
              {level.title}
            </Text>
            <Text style={styles.gridSubTitle}>{level.subTitle}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// 2. Fitness goal segmented selector (3 columns)
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
              <Ionicons name={goal.icon} size={20} color={isSelected ? COLORS.white : COLORS.logoGreen} />
            </View>
            <Text style={[styles.gridTitle, isSelected ? styles.gridTitleActive : styles.gridTitleInactive]}>
              {goal.title}
            </Text>
            <View style={[styles.tagBadge, isSelected ? styles.tagBadgeActive : styles.tagBadgeInactive]}>
              <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{goal.tag}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// 3. Calendar modal day picker
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalFormCard}>
          {/* Header: Month / Year with Navigation */}
          <View style={styles.calendarHeaderRow}>
            <TouchableOpacity style={styles.arrowButton} onPress={onPrevMonth} activeOpacity={0.7} disabled={disabled}>
              <Ionicons name="chevron-back" size={20} color={COLORS.logoGreen} />
            </TouchableOpacity>
            <Text style={styles.calendarMonthTitle}>{currentMonthYearTitle}</Text>
            <TouchableOpacity style={styles.arrowButton} onPress={onNextMonth} activeOpacity={0.7} disabled={disabled}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.logoGreen} />
            </TouchableOpacity>
          </View>

          {/* Weekday Abbreviations */}
          <View style={styles.weekHeaderRow}>
            {DAYS_OF_WEEK.map((day) => (
              <Text key={day} style={styles.weekDayLabel}>{day}</Text>
            ))}
          </View>

          {/* Days Matrix */}
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

          {/* Dismiss Button */}
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

// 4. Primary dispatch submit button
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
          <ActivityIndicator size="small" color={COLORS.white} style={styles.buttonSpinner} />
          <Text style={[styles.buttonText, styles.buttonLoadingText]}>Calibrating...</Text>
        </View>
      ) : (
        <Text style={styles.buttonText}>Continue to Regional Availability</Text>
      )}
    </TouchableOpacity>
  );
}

// --- MAIN STEP TWO SCREEN ---
export default function StepTwoScreen({
  onNext,
  onBack,
  currentWeight,
  height,
  weightUnit,
  initialGoals,
}) {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Hook handles all goal state, validations, and date logic
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
  } = useStepTwoGoals({ onNext, currentWeight, height, weightUnit, initialGoals });

  return (
    <SafeAreaView style={styles.container}>
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
            {Boolean(onBack) && (
              <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={22} color={theme?.textPrimary || COLORS.textDark} />
              </TouchableOpacity>
            )}
            <Text style={styles.stepIndicator}>STEP 2 OF 4</Text>
            <Text style={styles.brandTitle}>Objectives</Text>
            <Text style={styles.brandSubtitle}>
              Define your physical targets and lifestyle profile parameters so MacroSync can calibrate your diet structure.
            </Text>
          </View>

          {/* Main Card */}
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
            <GoalSelector
              selectedGoal={form.selectedGoal}
              onSelect={handleSelectGoal}
              disabled={isLoading}
              styles={styles}
            />

            {/* Target Weight & Date Controls */}
            <View style={styles.targetSection}>
              {/* Target Goal Weight Field */}
              <View style={styles.inputGroup}>
                <View style={styles.rowLabelWrapper}>
                  <Text style={styles.inputLabel}>Target Goal Weight ({form.goalWeightUnit})</Text>
                </View>

                <View style={styles.flatInputField}>
                  <TextInput
                    style={styles.input}
                    placeholder={`Enter target weight in ${form.goalWeightUnit}`}
                    placeholderTextColor={theme?.placeholderText || COLORS.textMuted}
                    value={form.goalWeight}
                    onChangeText={handleGoalWeightChange}
                    keyboardType="decimal-pad"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                {/* Healthy Range Guideline */}
                {Boolean(healthyRangeText) && (
                  <View style={styles.helperRow}>
                    <Ionicons name="information-circle-outline" size={14} color={COLORS.logoGreen} />
                    <Text style={styles.helperText}>{healthyRangeText}</Text>
                  </View>
                )}

                {/* Weight Validation Warning */}
                {Boolean(weightWarningText) && (
                  <View style={styles.warningBox}>
                    <Ionicons name="alert-circle-outline" size={14} color={COLORS.dangerRed} style={{ marginTop: 1 }} />
                    <Text style={styles.warningBoxText}>{weightWarningText}</Text>
                  </View>
                )}
              </View>

              {/* Target Goal Date Field */}
              <View style={styles.inputGroup}>
                <View style={styles.rowLabelWrapper}>
                  <Text style={styles.inputLabel}>Target Goal Date</Text>
                </View>
                <View style={[styles.flatInputField, styles.fieldRow]}>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={theme?.placeholderText || COLORS.textMuted}
                    value={form.targetDate}
                    onChangeText={handleTargetDateChange}
                    keyboardType="numeric"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.calendarIconBtn}
                    disabled={isLoading}
                    onPress={handleOpenCalendar}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="calendar-outline" size={20} color={COLORS.logoGreen} />
                  </TouchableOpacity>
                </View>

                {/* Suggested Realistic Date Quick Chip */}
                {Boolean(suggestedDateInfo) && (
                  <TouchableOpacity style={styles.suggestedChip} activeOpacity={0.7} onPress={handleApplySuggestedDate}>
                    <Ionicons name="sparkles" size={13} color={COLORS.logoGreen} />
                    <Text style={styles.suggestedChipText} numberOfLines={1}>
                      {suggestedDateInfo.label}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Date Validation Warning */}
                {Boolean(dateWarningText) && (
                  <View style={styles.warningBox}>
                    <Ionicons name="alert-circle-outline" size={14} color={COLORS.dangerRed} style={{ marginTop: 1 }} />
                    <Text style={styles.warningBoxText}>{dateWarningText}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <PrimaryButton onPress={handleContinue} isLoading={isLoading} styles={styles} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Calendar Modal */}
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

// --- COMPONENT STYLES ---
const getStyles = (theme, isDarkMode = false) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.background || COLORS.base,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingBottom: 30,
      paddingTop: Platform.OS === "ios" ? 30 : 20,
    },
    headerSection: {
      marginBottom: 24,
      alignItems: "flex-start",
      width: "100%",
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    stepIndicator: {
      fontSize: 11,
      fontWeight: "900",
      color: COLORS.logoGreen,
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    brandTitle: {
      fontSize: 34,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textDark,
      letterSpacing: -0.5,
      marginTop: 2,
    },
    brandSubtitle: {
      fontSize: 13.5,
      color: theme?.textSecondary || COLORS.textGrey,
      marginTop: 8,
      lineHeight: 20,
      fontWeight: "600",
    },
    formCard: {
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.2 : 0.035,
      shadowRadius: 8,
      elevation: 1,
    },
    sectionInputLabel: {
      color: theme?.textPrimary || COLORS.textGrey,
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginLeft: 4,
    },
    goalSectionLabel: {
      marginTop: 20,
    },
    // Segmented Grid Cards
    segmentedGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    gridCard: {
      width: "31.5%",
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
    },
    gridCardInactive: {
      backgroundColor: theme?.surface || COLORS.base,
      borderColor: theme?.border || COLORS.borderLight,
    },
    gridCardActive: {
      backgroundColor: theme?.cardBg || COLORS.cardBgLight,
      borderColor: COLORS.logoGreen,
    },
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    iconWrapperInactive: {
      backgroundColor: theme?.cardBg || COLORS.bgPill,
    },
    iconWrapperActive: {
      backgroundColor: COLORS.logoGreen,
    },
    gridTitle: {
      fontSize: 12,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 2,
    },
    gridTitleInactive: {
      color: theme?.textPrimary || COLORS.textDark,
    },
    gridTitleActive: {
      color: COLORS.logoGreen,
    },
    gridSubTitle: {
      fontSize: 10,
      color: theme?.textSecondary || COLORS.textMuted,
      fontWeight: "700",
      textAlign: "center",
    },
    // Goal Tag Badge
    tagBadge: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 6,
      marginTop: 2,
    },
    tagBadgeInactive: {
      backgroundColor: theme?.cardBg || COLORS.bgPill,
    },
    tagBadgeActive: {
      backgroundColor: COLORS.logoGreen,
    },
    tagText: {
      fontSize: 9,
      fontWeight: "800",
      color: theme?.textSecondary || COLORS.textGrey,
    },
    tagTextActive: {
      color: COLORS.white,
    },
    // Form Inputs
    targetSection: {
      marginTop: 20,
    },
    inputGroup: {
      marginBottom: 18,
    },
    rowLabelWrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    inputLabel: {
      color: theme?.textPrimary || COLORS.textGrey,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    flatInputField: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme?.inputBorder || COLORS.borderLight,
      height: 50,
      justifyContent: "center",
    },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    input: {
      flex: 1,
      color: theme?.textPrimary || COLORS.textDark,
      paddingHorizontal: 16,
      height: "100%",
      fontSize: 15,
      fontWeight: "700",
    },
    calendarIconBtn: {
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingRight: 16,
    },
    // Calendar Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.overlayDark,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalFormCard: {
      width: "100%",
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
    },
    calendarHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      marginBottom: 20,
    },
    calendarMonthTitle: {
      fontSize: 17,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textDark,
    },
    arrowButton: {
      padding: 8,
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
    },
    weekHeaderRow: {
      flexDirection: "row",
      width: "100%",
      marginBottom: 12,
    },
    weekDayLabel: {
      flex: 1,
      textAlign: "center",
      color: theme?.textSecondary || COLORS.textMuted,
      fontWeight: "800",
      fontSize: 11,
      textTransform: "uppercase",
    },
    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      width: "100%",
      justifyContent: "flex-start",
    },
    calendarDayButton: {
      width: "14.28%",
      aspectRatio: 1,
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 2,
      borderRadius: 8,
    },
    calendarDayEmpty: {
      width: "14.28%",
      aspectRatio: 1,
      marginVertical: 2,
    },
    calendarDayText: {
      color: theme?.textPrimary || COLORS.textDark,
      fontWeight: "700",
      fontSize: 13,
    },
    calendarDaySelected: {
      backgroundColor: COLORS.logoGreen,
      borderRadius: 8,
    },
    calendarDayTextSelected: {
      color: COLORS.white,
      fontWeight: "900",
    },
    calendarDayToday: {
      borderWidth: 1.5,
      borderColor: COLORS.logoGreen,
    },
    calendarDayTextPast: {
      color: COLORS.textMuted,
    },
    modalDoneButton: {
      marginTop: 24,
    },
    // Helpers & Alerts
    helperRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      paddingHorizontal: 4,
    },
    helperText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme?.textSecondary || COLORS.textGrey,
      marginLeft: 5,
    },
    suggestedChip: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.14)" : "rgba(16, 185, 129, 0.08)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 8,
    },
    suggestedChipText: {
      fontSize: 11.5,
      fontWeight: "800",
      color: COLORS.logoGreen,
      marginLeft: 5,
    },
    warningBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: 6,
      paddingHorizontal: 4,
    },
    warningBoxText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "700",
      color: COLORS.dangerRed,
      marginLeft: 5,
      lineHeight: 16,
    },
    // Primary Button
    buttonBase: {
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      marginTop: 10,
    },
    buttonUnpressed: {
      backgroundColor: COLORS.logoGreen,
    },
    buttonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    buttonLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    buttonSpinner: {
      marginRight: 8,
    },
    buttonLoadingText: {
      opacity: 0.95,
    },
  });

