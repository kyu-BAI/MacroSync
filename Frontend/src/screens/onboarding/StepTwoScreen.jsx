import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCustomAlert } from '../../context/CustomAlertContext';

// ==========================================
// SYSTEM COLOR SCHEME ENVIRONMENT DESIGN SYSTEM
// ==========================================
const CONFIG = {
  baseColor: '#F8FAFC',
  logoGreen: '#10B981',
  textDark: '#0F172A',
  textGrey: '#64748B',
  textMuted: '#94A3B8',
  borderLight: '#E2E8F0',
  borderItem: '#E2E8F0',
  bgPill: '#F1F5F9'
};

import { useTheme } from '../../context/ThemeContext';

export default function StepTwoScreen({ onNext, currentWeight, height, weightUnit }) {
  const { showAlert } = useCustomAlert();
  const { theme } = useTheme();
  const isDarkMode = false;
  const styles = getStyles(theme, false);
  // --- Form Controls States ---
  const [selectedActivity, setSelectedActivity] = useState('moderate');
  const [selectedGoal, setSelectedGoal] = useState('muscle');
  const [goalWeight, setGoalWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  
  // --- Unit & Modal Flow Interface States ---
  const [goalWeightUnit, setGoalWeightUnit] = useState('kg');
  const [showCalendar, setShowCalendar] = useState(false);
  const [navDate, setNavDate] = useState(new Date());



  // --- Dispatch Handlers Interactivity ---
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Maintain Weight Auto-Fill Logic
  useEffect(() => {
    if (selectedGoal === 'maintain' && currentWeight) {
      const displayWeight = goalWeightUnit === 'lbs' ? (currentWeight * 2.20462).toFixed(1) : currentWeight.toFixed(1);
      setGoalWeight(displayWeight.toString());
    }
  }, [selectedGoal, goalWeightUnit, currentWeight]);

  // Helper: Reliable date parser for MM/DD/YYYY
  const parseMMDDYYYY = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return null;
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2020) return null;
    const d = new Date(year, month - 1, day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // --- Dynamic Suggestions & Live Validation Engine ---
  const getHealthyRangeText = () => {
    if (!height || isNaN(parseFloat(height))) return null;
    const heightInMeters = parseFloat(height) / 100;
    if (heightInMeters <= 0) return null;

    const minKg = 18.5 * (heightInMeters * heightInMeters);
    const maxKg = 24.9 * (heightInMeters * heightInMeters);

    if (goalWeightUnit === 'lbs') {
      const minLbs = Math.round(minKg * 2.20462);
      const maxLbs = Math.round(maxKg * 2.20462);
      return `Recommended healthy range: ${minLbs} – ${maxLbs} lbs (BMI 18.5–24.9)`;
    } else {
      return `Recommended healthy range: ${minKg.toFixed(1)} – ${maxKg.toFixed(1)} kg (BMI 18.5–24.9)`;
    }
  };

  const getSuggestedDateInfo = () => {
    const curW = (currentWeight && !isNaN(parseFloat(currentWeight)) && parseFloat(currentWeight) > 0) ? parseFloat(currentWeight) : 70;
    if (!goalWeight || selectedGoal === 'maintain') return null;
    const enteredNum = parseFloat(goalWeight);
    if (isNaN(enteredNum) || enteredNum <= 0) return null;
    const targetKg = goalWeightUnit === 'lbs' ? enteredNum * 0.45359237 : enteredNum;
    const weightDiffKg = Math.abs(targetKg - curW);
    if (weightDiffKg < 0.1) return null;

    const weeksNeeded = Math.max(2, Math.ceil(weightDiffKg / 0.5));
    const suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + (weeksNeeded * 7));

    const month = String(suggestedDate.getMonth() + 1).padStart(2, '0');
    const day = String(suggestedDate.getDate()).padStart(2, '0');
    const year = suggestedDate.getFullYear();

    return {
      formatted: `${month}/${day}/${year}`,
      weeks: weeksNeeded,
      kgDiff: weightDiffKg.toFixed(1)
    };
  };

  const getWeightValidationWarning = () => {
    const curW = (currentWeight && !isNaN(parseFloat(currentWeight)) && parseFloat(currentWeight) > 0) ? parseFloat(currentWeight) : 70;
    if (!goalWeight || selectedGoal === 'maintain') return null;
    const enteredNum = parseFloat(goalWeight);
    if (isNaN(enteredNum) || enteredNum <= 0) return null;

    const targetKg = goalWeightUnit === 'lbs' ? enteredNum * 0.45359237 : enteredNum;
    const currentDisplay = goalWeightUnit === 'lbs' ? (curW * 2.20462).toFixed(1) : curW.toFixed(1);

    if (selectedGoal === 'fatloss' && targetKg >= curW) {
      return `Target weight must be lower than your current weight (${currentDisplay} ${goalWeightUnit}).`;
    }
    if (selectedGoal === 'muscle' && targetKg <= curW) {
      return `Target weight must be higher than your current weight (${currentDisplay} ${goalWeightUnit}).`;
    }

    if (height) {
      const heightMeters = parseFloat(height) / 100;
      if (heightMeters > 0) {
        const bmi = targetKg / (heightMeters * heightMeters);
        if (bmi < 18.5) {
          return `Target weight sets BMI to ${bmi.toFixed(1)} (underweight marker < 18.5).`;
        }
        if (bmi >= 30.0) {
          return `Target weight sets BMI to ${bmi.toFixed(1)} (obesity marker ≥ 30.0).`;
        }
      }
    }
    return null;
  };

  const getDateValidationWarning = () => {
    const curW = (currentWeight && !isNaN(parseFloat(currentWeight)) && parseFloat(currentWeight) > 0) ? parseFloat(currentWeight) : 70;
    if (!goalWeight || selectedGoal === 'maintain') return null;
    const enteredNum = parseFloat(goalWeight);
    if (isNaN(enteredNum) || enteredNum <= 0) return null;
    const targetKg = goalWeightUnit === 'lbs' ? enteredNum * 0.45359237 : enteredNum;

    if (targetDate && targetDate.trim()) {
      const targetDateObj = parseMMDDYYYY(targetDate.trim());
      if (targetDateObj) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (targetDateObj <= today) {
          return "Target date must be at least 1 day in the future.";
        }
        const msDiff = targetDateObj.getTime() - today.getTime();
        const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24));
        const weeksDiff = daysDiff / 7;
        const weightDiffKg = Math.abs(targetKg - curW);

        if (selectedGoal !== 'maintain' && weightDiffKg >= 0.5) {
          if (daysDiff < 7) {
            return `Target date is too soon! Weight ${selectedGoal === 'fatloss' ? 'loss' : 'gain'} requires at least 7 days (1 week).`;
          }
          if (weeksDiff > 0) {
            const weeklyChange = weightDiffKg / weeksDiff;
            if (selectedGoal === 'fatloss' && weeklyChange > 1.2) {
              return `Target date is too soon! Losing ${weightDiffKg.toFixed(1)}kg in ${daysDiff} day(s) exceeds safe 1.2kg/wk rate.`;
            }
            if (selectedGoal === 'muscle' && weeklyChange > 0.8) {
              return `Target date is too soon! Gaining ${weightDiffKg.toFixed(1)}kg in ${daysDiff} day(s) exceeds safe 0.8kg/wk rate.`;
            }
          }
        }
      }
    }
    return null;
  };

  const healthyRangeText = getHealthyRangeText();
  const suggestedDateInfo = getSuggestedDateInfo();
  const weightWarningText = getWeightValidationWarning();
  const dateWarningText = getDateValidationWarning();

  // --- Static Structural Mappings Configuration Arrays ---
  const activityLevels = [
    { id: 'sedentary', title: 'Sedentary', icon: 'bicycle-outline', subTitle: 'Desk / Minimal' },
    { id: 'moderate', title: 'Moderate', icon: 'fitness-outline', subTitle: '3–5 Days/Wk' },
    { id: 'active', title: 'Active', icon: 'flame-outline', subTitle: 'Heavy/Intense' }
  ];

  const goals = [
    { id: 'muscle', title: 'Gain Weight', icon: 'barbell-outline', tag: 'Surplus' },
    { id: 'fatloss', title: 'Weight Loss', icon: 'trending-down-outline', tag: 'Deficit' },
    { id: 'maintain', title: 'Maintain Weight', icon: 'refresh-outline', tag: 'Balance' }
  ];

  // ==========================================
  // LOCAL WARNING UTILITY DISPATCHER
  // ==========================================
  const triggerSafetyWarning = (title, message) => {
    showAlert(title, message);
  };

  // ==========================================
  // BUSINESS ENGINE SUBMISSION CONTROLLER
  // ==========================================
  const handleContinue = async () => {
    if (isLoading) return;

    if (!goalWeight.trim() || !targetDate.trim()) {
      triggerSafetyWarning(
        "Missing Fields",
        "Please specify your target goal weight and select a milestone target date before continuing to the next step."
      );
      return;
    }

    // 1. Validate & Parse Date Format MM/DD/YYYY reliably across React Native engines
    const targetDateObj = parseMMDDYYYY(targetDate.trim());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!targetDateObj) {
      triggerSafetyWarning("Invalid Date", "Please enter the date in valid MM/DD/YYYY format.");
      return;
    }

    if (targetDateObj <= today) {
      triggerSafetyWarning("Invalid Date", "Target date must be at least 1 day in the future.");
      return;
    }

    const enteredWeightNum = parseFloat(goalWeight);
    if (isNaN(enteredWeightNum) || enteredWeightNum <= 0) {
      triggerSafetyWarning("Invalid Input", "Please enter a valid numeric target weight.");
      return;
    }

    // Dynamic conversion pipeline to baseline Metrics standard internally (kg)
    const targetWeightInKg = goalWeightUnit === 'lbs' ? enteredWeightNum * 0.45359237 : enteredWeightNum;
    const curW = (currentWeight && !isNaN(parseFloat(currentWeight)) && parseFloat(currentWeight) > 0) ? parseFloat(currentWeight) : 70;

    // 3. Validate Goal Direction Logic (Loss vs Gain vs Maintain)
    if (selectedGoal === 'fatloss' && targetWeightInKg >= curW) {
      triggerSafetyWarning("Goal Mismatch", "For weight loss, your target weight must be lower than your current weight.");
      return;
    }
    if (selectedGoal === 'muscle' && targetWeightInKg <= curW) {
      triggerSafetyWarning("Goal Mismatch", "For gaining weight, your target weight must be higher than your current weight.");
      return;
    }
    if (selectedGoal === 'maintain' && Math.abs(targetWeightInKg - curW) > 0.5) {
      triggerSafetyWarning("Goal Mismatch", "For maintaining weight, your target weight must equal your current weight.");
      return;
    }

    // 4. Safe Rate & 7-Day Minimum Duration Validation
    const msDiff = targetDateObj.getTime() - today.getTime();
    const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24));
    const weeksDiff = daysDiff / 7;
    const weightDiffKg = Math.abs(targetWeightInKg - curW);
    const weeklyChange = weeksDiff > 0 ? weightDiffKg / weeksDiff : 0;

    if (selectedGoal !== 'maintain' && weightDiffKg >= 0.5) {
      if (daysDiff < 7) {
        triggerSafetyWarning(
          "Target Date Too Soon",
          `Weight ${selectedGoal === 'fatloss' ? 'loss' : 'gain'} goals require at least 1 week (7 days) for safe, healthy progress. Tomorrow is too soon to change ${weightDiffKg.toFixed(1)} kg. Please select a date at least 7 days from today or tap the suggested realistic date.`
        );
        return;
      }
      if (weeklyChange > 1.2 && selectedGoal === 'fatloss') {
        triggerSafetyWarning("Aggressive Goal", "This goal requires losing more than 1.2kg per week, which is medically unsafe. Please select a later date for sustainable results.");
        return;
      }
      if (weeklyChange > 0.8 && selectedGoal === 'muscle') {
        triggerSafetyWarning("Aggressive Goal", "This goal requires gaining more than 0.8kg per week, which is medically unsafe. Please select a later date for sustainable results.");
        return;
      }
    }

    // --- Critical Clinical Medical Guard-Rail System Verification ---
    if (height) {
      const heightInMeters = parseFloat(height) / 100;
      const targetBmi = targetWeightInKg / (heightInMeters * heightInMeters);

      if (targetBmi < 18.5) {
        triggerSafetyWarning(
          "Safety Weight Restriction",
          `The target weight specified sets your expected BMI target at ${targetBmi.toFixed(1)}, dropping below medically recommended health markers (< 18.5).\n\nPlease calibrate a sustainable baseline fitness target weight.`
        );
        return;
      }

      if (targetBmi >= 30.0) {
        triggerSafetyWarning(
          "Safety Weight Restriction",
          `The target weight specified sets your potential BMI threshold at ${targetBmi.toFixed(1)}, crossing into critical health risk markers (BMI ≥ 30.0).\n\nPlease aim for a healthier weight strategy.`
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      await onNext({
        activityLevel: selectedActivity,
        goal: selectedGoal,
        goalWeight: targetWeightInKg,
        targetDate: targetDate.trim()
      });
    } catch (err) {
      console.log("Form Dispatch Fail: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // PREMIUM CALENDAR RENDERING ENGINE
  // ==========================================
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const changeMonth = (direction) => {
    setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() + direction, 1));
  };

  const renderCalendarDays = () => {
    const year = navDate.getFullYear();
    const month = navDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const dayButtons = [];

    for (let i = 0; i < firstDayIndex; i++) {
      dayButtons.push(<View key={`empty-start-${i}`} style={styles.calendarDayEmpty} />);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate < today;
      const isToday = cellDate.getTime() === today.getTime();
      
      const formattedDate = `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
      const isSelected = targetDate === formattedDate;

      dayButtons.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.calendarDayButton, 
            isSelected && styles.calendarDaySelected,
            isToday && !isSelected && styles.calendarDayToday
          ]}
          disabled={isLoading || isPast}
          onPress={() => {
            setTargetDate(formattedDate);
            setShowCalendar(false);
          }}
        >
          <Text style={[
            styles.calendarDayText, 
            isSelected && styles.calendarDayTextSelected,
            isPast && styles.calendarDayTextPast
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    const totalRenderedSlots = firstDayIndex + totalDays;
    const remainingSlots = totalRenderedSlots % 7 === 0 ? 0 : 7 - (totalRenderedSlots % 7);
    for (let j = 0; j < remainingSlots; j++) {
      dayButtons.push(<View key={`empty-end-${j}`} style={styles.calendarDayEmpty} />);
    }

    return dayButtons;
  };

  // ==========================================
  // CORE LAYOUT MATRIX COMPONENT SECTION RENDER
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={CONFIG.baseColor} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* CONTENT: TOP REGIONAL TITLES ELEMENT */}
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 2 OF 3</Text>
            <Text style={styles.brandTitle}>Objectives</Text>
            <Text style={styles.brandSubtitle}>
              Define your physical targets and lifestyle profile parameters so MacroSync can calibrate your diet structure.
            </Text>
          </View>

          {/* MAIN CONFIGURATION PANEL MAPPING HUB */}
          <View style={styles.formCard}>
            
            {/* GRID LAYER BLOCK: ACTIVITY LEVELS SELECTION MATRIX */}
            <Text style={styles.sectionInputLabel}>Activity Level</Text>
            <View style={styles.segmentedGrid}>
              {activityLevels.map((level) => {
                const isSelected = selectedActivity === level.id;
                return (
                  <TouchableOpacity
                    key={level.id}
                    activeOpacity={0.85}
                    disabled={isLoading}
                    onPress={() => setSelectedActivity(level.id)}
                    style={[styles.gridCard, isSelected ? styles.gridCardActive : styles.gridCardInactive]}
                  >
                    <View style={[styles.iconWrapper, isSelected ? styles.iconWrapperActive : styles.iconWrapperInactive]}>
                      <Ionicons name={level.icon} size={20} color={isSelected ? '#FFFFFF' : CONFIG.logoGreen} />
                    </View>
                    <Text style={[styles.gridTitle, isSelected ? styles.gridTitleActive : styles.gridTitleInactive]}>
                      {level.title}
                    </Text>
                    <Text style={styles.gridSubTitle}>{level.subTitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* GRID LAYER BLOCK: PRIMARY COHESIVE OBJECTIVE SELECTION PANELS */}
            <Text style={[styles.sectionInputLabel, { marginTop: 20 }]}>Primary Fitness Goal</Text>
            <View style={styles.segmentedGrid}>
              {goals.map((goal) => {
                const isSelected = selectedGoal === goal.id;
                return (
                  <TouchableOpacity
                    key={goal.id}
                    activeOpacity={0.85}
                    disabled={isLoading}
                    onPress={() => setSelectedGoal(goal.id)}
                    style={[styles.gridCard, isSelected ? styles.gridCardActive : styles.gridCardInactive]}
                  >
                    <View style={[styles.iconWrapper, isSelected ? styles.iconWrapperActive : styles.iconWrapperInactive]}>
                      <Ionicons name={goal.icon} size={20} color={isSelected ? '#FFFFFF' : CONFIG.logoGreen} />
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

            {/* LOWER FORM LAYERS: TARGET WEIGHT NUMERICS ENTRY CONTROLS & DATES PIPELINE */}
            <View style={styles.targetSection}>
              
              {/* TARGET WEIGHT FIELD LAYER AREA */}
              <View style={styles.inputGroup}>
                <View style={styles.rowLabelWrapper}>
                  <Text style={styles.inputLabel}>Target Goal Weight ({goalWeightUnit})</Text>
                </View>

                <View style={[styles.flatInputField, selectedGoal === 'maintain' && styles.flatInputFieldDisabled]}>
                  <TextInput 
                    style={[styles.input, selectedGoal === 'maintain' && styles.inputDisabled]}
                    placeholder={`Enter target weight in ${goalWeightUnit}`}
                    placeholderTextColor={CONFIG.textMuted}
                    value={goalWeight}
                    onChangeText={setGoalWeight}
                    keyboardType="numeric"
                    editable={!isLoading && selectedGoal !== 'maintain'}
                  />
                </View>

                {healthyRangeText && (
                  <View style={styles.helperRow}>
                    <Ionicons name="information-circle-outline" size={14} color={CONFIG.logoGreen} />
                    <Text style={styles.helperText}>{healthyRangeText}</Text>
                  </View>
                )}

                {weightWarningText && (
                  <View style={styles.warningBox}>
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                    <Text style={styles.warningBoxText}>{weightWarningText}</Text>
                  </View>
                )}
              </View>

              {/* TARGET CALENDAR CHRONO SECTOR AREA INPUT GROUP */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Goal Date</Text>
                <View style={[styles.flatInputField, styles.fieldRow]}>
                  <TextInput 
                    style={styles.input}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={CONFIG.textMuted}
                    value={targetDate}
                    onChangeText={setTargetDate}
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.calendarIconBtn}
                    disabled={isLoading}
                    onPress={() => setShowCalendar(true)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="calendar-outline" size={20} color={CONFIG.logoGreen} />
                  </TouchableOpacity>
                </View>

                {suggestedDateInfo && (
                  <TouchableOpacity
                    style={styles.suggestedChip}
                    activeOpacity={0.7}
                    onPress={() => setTargetDate(suggestedDateInfo.formatted)}
                  >
                    <Ionicons name="sparkles-outline" size={14} color={CONFIG.logoGreen} />
                    <Text style={styles.suggestedChipText}>
                      Auto-set realistic date: {suggestedDateInfo.formatted} ({suggestedDateInfo.weeks} wks @ 0.5kg/wk)
                    </Text>
                  </TouchableOpacity>
                )}

                {dateWarningText && (
                  <View style={styles.warningBox}>
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                    <Text style={styles.warningBoxText}>{dateWarningText}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* ACTION FOOTER LAYER: NAVIGATION SUBMISSION CONTROLLER DISPATCH */}
            <TouchableOpacity 
              activeOpacity={1}
              disabled={isLoading}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleContinue}
              style={[
                styles.buttonBase,
                isPressed ? styles.buttonPressed : styles.buttonUnpressed
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={'#FFFFFF'} />
              ) : (
                <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
                  Continue
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CORE MODAL CALENDAR SHEET OVERLAY LAYER */}
      <Modal visible={showCalendar} transparent={true} animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalFormCard}>
            
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(-1)} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={20} color={CONFIG.logoGreen} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>{months[navDate.getMonth()]} {navDate.getFullYear()}</Text>
              <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(1)} activeOpacity={0.7}>
                <Ionicons name="chevron-forward" size={20} color={CONFIG.logoGreen} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekHeaderRow}>
              {daysOfWeek.map((day) => (
                <Text key={day} style={styles.weekDayLabel}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {renderCalendarDays()}
            </View>

            <TouchableOpacity 
              style={[styles.buttonBase, styles.buttonUnpressed, { marginTop: 24 }]} 
              onPress={() => setShowCalendar(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>



    </SafeAreaView>
  );
}

// ==========================================
// STYLE SHEET DEFINITIONS DESIGN SYSTEM TOKENS
// ==========================================
const getStyles = (theme) => StyleSheet.create({
  // --- Structural Architecture Framework Bases ---
  container: { 
    flex: 1, 
    backgroundColor: theme?.background || CONFIG.baseColor 
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 30, 
    paddingTop: Platform.OS === 'ios' ? 30 : 20 
  },
  headerSection: { 
    marginBottom: 28, 
    alignItems: 'center', 
    width: '100%' 
  },
  stepIndicator: { 
    fontSize: 11, 
    fontWeight: '900', 
    color: CONFIG.logoGreen, 
    letterSpacing: 2, 
    textTransform: 'uppercase' 
  },
  brandTitle: { 
    fontSize: 38, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A', 
    letterSpacing: -0.5, 
    marginTop: 4 
  },
  brandSubtitle: { 
    fontSize: 13, 
    color: theme?.textSecondary || CONFIG.textGrey, 
    marginTop: 8, 
    textAlign: 'center', 
    lineHeight: 20, 
    fontWeight: '700', 
    paddingHorizontal: 10 
  },
  
  // --- Main Panel Surfacings Cards UI Architecture Layers ---
  formCard: {
    backgroundColor: theme?.surface || CONFIG.baseColor,
    borderRadius: 28, 
    padding: 20,
    borderWidth: 1.5,
    borderColor: theme?.border || CONFIG.borderItem,
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionInputLabel: { 
    color: theme?.textPrimary || '#64748B', 
    fontSize: 11, 
    fontWeight: '800', 
    marginBottom: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 1.2, 
    marginLeft: 4 
  },
  
  // --- Grids Matrix Layout Systems & Badging Parameters Nodes ---
  segmentedGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  gridCard: { 
    width: '31.5%', 
    borderRadius: 20, 
    paddingVertical: 14, 
    paddingHorizontal: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1.5 
  },
  gridCardInactive: { 
    backgroundColor: theme?.surface || CONFIG.baseColor, 
    borderColor: theme?.border || CONFIG.borderItem, 
    shadowOpacity: 0,
    elevation: 0,
  },
  gridCardActive: { 
    backgroundColor: theme?.cardBg || '#EBEBEB', 
    borderColor: CONFIG.logoGreen, 
    shadowOpacity: 0,
    elevation: 0,
  },
  iconWrapper: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8 
  },
  iconWrapperInactive: { 
    backgroundColor: theme?.cardBg || '#F1F5F9' 
  },
  iconWrapperActive: { 
    backgroundColor: CONFIG.logoGreen 
  },
  gridTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    textAlign: 'center', 
    marginBottom: 2 
  },
  gridTitleInactive: { 
    color: theme?.textPrimary || '#0F172A' 
  },
  gridTitleActive: { 
    color: CONFIG.logoGreen 
  },
  gridSubTitle: { 
    fontSize: 10, 
    color: theme?.textSecondary || CONFIG.textMuted, 
    fontWeight: '700', 
    textAlign: 'center' 
  },
  tagBadge: { 
    paddingVertical: 2, 
    paddingHorizontal: 6, 
    borderRadius: 8, 
    marginTop: 2 
  },
  tagBadgeInactive: { 
    backgroundColor: theme?.cardBg || '#F1F5F9' 
  },
  tagBadgeActive: { 
    backgroundColor: CONFIG.logoGreen 
  },
  tagText: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: theme?.textSecondary || '#64748B' 
  },
  tagTextActive: { 
    color: '#FFFFFF' 
  },
  
  // --- Form Controls Inputs & Segmented Buttons Switch Panels Row Items ---
  targetSection: { 
    marginTop: 12, 
    borderTopWidth: 1.5, 
    borderColor: CONFIG.borderLight, 
    paddingTop: 16 
  },
  inputGroup: { 
    marginBottom: 18 
  },
  rowLabelWrapper: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8, 
    paddingHorizontal: 4 
  },
  inputLabel: { 
    color: theme?.textPrimary || '#64748B', 
    fontSize: 11, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 1.2 
  },
  togglePillContainer: { 
    flexDirection: 'row', 
    backgroundColor: theme?.cardBg || CONFIG.bgPill, 
    borderRadius: 12, 
    padding: 3, 
    borderWidth: 1, 
    borderColor: theme?.border || CONFIG.borderLight 
  },
  toggleBtn: { 
    paddingVertical: 4, 
    paddingHorizontal: 10, 
    borderRadius: 9 
  },
  toggleBtnActive: { 
    backgroundColor: CONFIG.logoGreen 
  },
  toggleBtnText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: theme?.textSecondary || CONFIG.textGrey 
  },
  toggleBtnTextActive: { 
    color: '#FFFFFF' 
  },
  flatInputField: {
    backgroundColor: theme?.inputBg || CONFIG.baseColor,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || CONFIG.borderLight,
    height: 50,
    justifyContent: 'center',
  },
  flatInputFieldDisabled: {
    backgroundColor: theme?.cardBg || '#F1F5F9',
    borderColor: theme?.border || '#E2E8F0',
  },
  fieldRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  input: { 
    flex: 1, 
    color: theme?.textPrimary || CONFIG.textDark, 
    paddingHorizontal: 16, 
    height: '100%', 
    fontSize: 15, 
    fontWeight: '700' 
  },
  inputDisabled: {
    color: theme?.textSecondary || CONFIG.textMuted,
  },
  calendarIconBtn: { 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingRight: 16 
  },
  
  // --- Overlay Overrides Custom Modal Sheets Systems ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalFormCard: {
    width: '100%',
    backgroundColor: theme?.surface || CONFIG.baseColor,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: theme?.border || CONFIG.borderItem,
  },
  calendarHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%', 
    marginBottom: 20 
  },
  calendarMonthTitle: { 
    fontSize: 17, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A' 
  },
  arrowButton: { 
    padding: 8, 
    backgroundColor: theme?.surface || CONFIG.baseColor, 
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: theme?.border || CONFIG.borderLight, 
  },
  weekHeaderRow: { 
    flexDirection: 'row', 
    width: '100%', 
    marginBottom: 12 
  },
  weekDayLabel: { 
    flex: 1, 
    textAlign: 'center', 
    color: theme?.textSecondary || CONFIG.textMuted, 
    fontWeight: '800', 
    fontSize: 11, 
    textTransform: 'uppercase' 
  },
  calendarGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    width: '100%', 
    justifyContent: 'flex-start' 
  },
  calendarDayButton: { 
    width: '14.28%', 
    aspectRatio: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginVertical: 2, 
    borderRadius: 12 
  },
  calendarDayEmpty: { 
    width: '14.28%', 
    aspectRatio: 1, 
    marginVertical: 2 
  },
  calendarDayText: { 
    color: theme?.textPrimary || CONFIG.textDark, 
    fontWeight: '700', 
    fontSize: 13 
  },
  calendarDaySelected: { 
    backgroundColor: CONFIG.logoGreen, 
    borderRadius: 12 
  },
  calendarDayTextSelected: { 
    color: '#FFFFFF', 
    fontWeight: '900' 
  },
  calendarDayToday: {
    borderWidth: 1.5,
    borderColor: CONFIG.logoGreen,
  },
  calendarDayTextPast: {
    color: '#CBD5E1',
  },
  
  // --- Operational Lower Buttons Triggers Elements Base Setup ---
  buttonBase: { 
    paddingVertical: 14, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
    height: 52, 
    marginTop: 10 
  },
  buttonUnpressed: {
    backgroundColor: CONFIG.logoGreen,
    borderRadius: 20,
  },
  buttonPressed: { 
    backgroundColor: '#059669',
    opacity: 0.85,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 15, 
    fontWeight: '800', 
    letterSpacing: 0.5, 
  },
  buttonTextPressed: { 
    color: '#E2E8F0' 
  },

  // --- Dynamic Suggestions & Validation Styles ---
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme?.textSecondary || CONFIG.textGrey,
    marginLeft: 5,
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme?.cardBg || '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: CONFIG.logoGreen,
  },
  suggestedChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: CONFIG.logoGreen,
    marginLeft: 6,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  warningBoxText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 5,
  },
});