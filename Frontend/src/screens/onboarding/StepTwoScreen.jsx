import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ==========================================
// SYSTEM COLOR SCHEME ENVIRONMENT DESIGN SYSTEM
// ==========================================
const CONFIG = {
  baseColor: '#F0F4F2',
  clearWhiteHighlight: '#FFFFFF',
  softGreenShadow: '#AEC2B7',
  logoGreen: '#4EA685',
  logoDarkShadow: '#37745D',
  logoLightHighlight: '#65D8AD',
  textDark: '#1A2B23',
  textGrey: '#556B60',
  textMuted: '#7FA293',
  borderLight: '#D4E2DC',
  borderItem: '#E1E9E5',
  bgPill: '#E4ECE8'
};

export default function StepTwoScreen({ onNext, currentWeight, height, weightUnit }) {
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
    Alert.alert(
      title,
      message,
      [{ text: "Acknowledge", fontWeight: '800' }]
    );
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

    // 1. Validate Date Format MM/DD/YYYY
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!dateRegex.test(targetDate.trim())) {
      triggerSafetyWarning("Invalid Date", "Please enter the date in MM/DD/YYYY format.");
      return;
    }

    // 2. Validate Date is in the future
    const targetDateObj = new Date(targetDate.trim());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDateObj < today) {
      triggerSafetyWarning("Invalid Date", "Target date cannot be in the past.");
      return;
    }

    const enteredWeightNum = parseFloat(goalWeight);
    if (isNaN(enteredWeightNum) || enteredWeightNum <= 0) {
      triggerSafetyWarning("Invalid Input", "Please enter a realistic numeric weight calculation metric entry.");
      return;
    }

    // Dynamic conversion pipeline to baseline Metrics standard internally (kg)
    const targetWeightInKg = goalWeightUnit === 'lbs' ? enteredWeightNum * 0.45359237 : enteredWeightNum;

    // 3. Validate Goal Logic (Loss vs Gain vs Maintain)
    if (selectedGoal === 'fatloss' && targetWeightInKg >= currentWeight) {
      triggerSafetyWarning("Goal Mismatch", "For weight loss, your target weight must be lower than your current weight.");
      return;
    }
    if (selectedGoal === 'muscle' && targetWeightInKg <= currentWeight) {
      triggerSafetyWarning("Goal Mismatch", "For gaining weight, your target weight must be higher than your current weight.");
      return;
    }
    if (selectedGoal === 'maintain' && Math.abs(targetWeightInKg - currentWeight) > 0.5) {
      triggerSafetyWarning("Goal Mismatch", "For maintaining weight, your target weight must equal your current weight.");
      return;
    }

    // 4. Safe Rate Validation
    const weeksDiff = (targetDateObj - today) / (1000 * 60 * 60 * 24 * 7);
    const weightDiffKg = Math.abs(targetWeightInKg - currentWeight);

    if (weeksDiff > 0 && weightDiffKg > 0) {
      const weeklyChange = weightDiffKg / weeksDiff;
      if (selectedGoal === 'fatloss' && weeklyChange > 1.2) {
        triggerSafetyWarning("Aggressive Goal", "This goal requires losing more than 1kg per week, which is medically unsafe. Please select a later date for sustainable results.");
        return;
      }
      if (selectedGoal === 'muscle' && weeklyChange > 0.8) {
        triggerSafetyWarning("Aggressive Goal", "This goal requires gaining more than 0.5kg per week, which is medically unsafe. Please select a later date for sustainable results.");
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
                  <Text style={styles.inputLabel}>Target Goal Weight (kg)</Text>
                </View>

                <View style={[styles.neumorphicInputInset, selectedGoal === 'maintain' && styles.neumorphicInputDisabled]}>
                  <TextInput 
                    style={[styles.input, selectedGoal === 'maintain' && styles.inputDisabled]}
                    placeholder="Enter target weight in kg"
                    placeholderTextColor={CONFIG.textMuted}
                    value={goalWeight}
                    onChangeText={setGoalWeight}
                    keyboardType="numeric"
                    editable={!isLoading && selectedGoal !== 'maintain'}
                  />
                </View>
              </View>

              {/* TARGET CALENDAR CHRONO SECTOR AREA INPUT GROUP */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Goal Date</Text>
                <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
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
                <ActivityIndicator size="small" color={CONFIG.clearWhiteHighlight} />
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
const styles = StyleSheet.create({
  // --- Structural Architecture Framework Bases ---
  container: { 
    flex: 1, 
    backgroundColor: CONFIG.baseColor 
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
    color: '#21332A', 
    letterSpacing: -0.5, 
    marginTop: 4 
  },
  brandSubtitle: { 
    fontSize: 13, 
    color: CONFIG.textGrey, 
    marginTop: 8, 
    textAlign: 'center', 
    lineHeight: 20, 
    fontWeight: '700', 
    paddingHorizontal: 10 
  },
  
  // --- Main Panel Surfacings Cards UI Architecture Layers ---
  formCard: {
    backgroundColor: CONFIG.baseColor,
    borderRadius: 36, 
    padding: 20,
    shadowColor: CONFIG.softGreenShadow,
    shadowOffset: { width: 12, height: 12 }, 
    shadowOpacity: 1,
    shadowRadius: 14, 
    elevation: 10,    
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: CONFIG.clearWhiteHighlight,
    borderLeftColor: CONFIG.clearWhiteHighlight,
  },
  sectionInputLabel: { 
    color: '#41544B', 
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
    backgroundColor: CONFIG.baseColor, 
    borderColor: CONFIG.borderItem, 
    shadowColor: CONFIG.softGreenShadow, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 0.6, 
    shadowRadius: 4, 
    elevation: 2 
  },
  gridCardActive: { 
    backgroundColor: '#E2EFEA', 
    borderColor: CONFIG.logoGreen, 
    shadowColor: CONFIG.logoGreen, 
    shadowOffset: { width: -1, height: -1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3 
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
    backgroundColor: '#E4ECE8' 
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
    color: '#21332A' 
  },
  gridTitleActive: { 
    color: CONFIG.logoGreen 
  },
  gridSubTitle: { 
    fontSize: 10, 
    color: CONFIG.textMuted, 
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
    backgroundColor: '#E4ECE8' 
  },
  tagBadgeActive: { 
    backgroundColor: CONFIG.logoGreen 
  },
  tagText: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: '#556B60' 
  },
  tagTextActive: { 
    color: CONFIG.clearWhiteHighlight 
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
    color: '#41544B', 
    fontSize: 11, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 1.2 
  },
  togglePillContainer: { 
    flexDirection: 'row', 
    backgroundColor: CONFIG.bgPill, 
    borderRadius: 12, 
    padding: 3, 
    borderWidth: 1, 
    borderColor: CONFIG.borderLight 
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
    color: CONFIG.textGrey 
  },
  toggleBtnTextActive: { 
    color: CONFIG.clearWhiteHighlight 
  },
  neumorphicInputInset: {
    backgroundColor: CONFIG.baseColor,
    borderRadius: 20, 
    borderWidth: 1.5, 
    borderColor: CONFIG.borderLight,
    shadowColor: CONFIG.logoGreen,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.35, 
    shadowRadius: 5,
    height: 50, 
    justifyContent: 'center',
  },
  neumorphicInputDisabled: {
    backgroundColor: '#E4ECE8',
    borderColor: '#D4E2DC',
    shadowOpacity: 0.1,
  },
  fieldRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  input: { 
    flex: 1, 
    color: CONFIG.textDark, 
    paddingHorizontal: 16, 
    height: '100%', 
    fontSize: 15, 
    fontWeight: '700' 
  },
  inputDisabled: {
    color: CONFIG.textMuted,
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
    backgroundColor: CONFIG.baseColor,
    borderRadius: 32, 
    padding: 20,
    shadowColor: CONFIG.logoDarkShadow,
    shadowOffset: { width: 10, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: CONFIG.clearWhiteHighlight,
    borderLeftColor: CONFIG.clearWhiteHighlight,
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
    color: '#21332A' 
  },
  arrowButton: { 
    padding: 8, 
    backgroundColor: CONFIG.baseColor, 
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: CONFIG.borderLight, 
    shadowColor: CONFIG.softGreenShadow, 
    shadowOffset: { width: 2, height: 2 }, 
    shadowOpacity: 1, 
    shadowRadius: 3, 
    elevation: 2 
  },
  weekHeaderRow: { 
    flexDirection: 'row', 
    width: '100%', 
    marginBottom: 12 
  },
  weekDayLabel: { 
    flex: 1, 
    textAlign: 'center', 
    color: CONFIG.textMuted, 
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
    color: CONFIG.textDark, 
    fontWeight: '700', 
    fontSize: 13 
  },
  calendarDaySelected: { 
    backgroundColor: CONFIG.logoGreen, 
    borderRadius: 12 
  },
  calendarDayTextSelected: { 
    color: CONFIG.clearWhiteHighlight, 
    fontWeight: '900' 
  },
  calendarDayToday: {
    borderWidth: 1.5,
    borderColor: CONFIG.logoGreen,
  },
  calendarDayTextPast: {
    color: '#AEC2B7',
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
    backgroundColor: '#53B28E', 
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: CONFIG.logoLightHighlight,
    borderLeftColor: CONFIG.logoLightHighlight,
    shadowColor: CONFIG.logoDarkShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.95,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonPressed: { 
    backgroundColor: '#3E836A', 
    borderWidth: 1.5, 
    borderColor: CONFIG.logoDarkShadow, 
    transform: [{ translateY: 2 }] 
  },
  buttonText: { 
    color: CONFIG.clearWhiteHighlight, 
    fontSize: 15, 
    fontWeight: '800', 
    letterSpacing: 0.5, 
    textShadowColor: CONFIG.logoDarkShadow, 
    textShadowOffset: { width: 0, height: 1 }, 
    textShadowRadius: 2 
  },
  buttonTextPressed: { 
    color: '#9EDEC4' 
  }
});