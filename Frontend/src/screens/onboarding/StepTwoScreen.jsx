import React, { useState } from 'react';
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
  StatusBar
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
  bgPill: '#E4ECE8',
  
  // Custom Premium Error/Warning Colors
  warningRed: '#C53030',
  warningRedDark: '#9B2C2C',
  warningRedText: '#742A2A',
  warningRedBg: '#FFF5F5',
  warningRedBorder: '#FED7D7'
};

export default function StepTwoScreen({ onNext, currentWeight, height }) {
  // --- Form Controls States ---
  const [selectedActivity, setSelectedActivity] = useState('moderate');
  const [selectedGoal, setSelectedGoal] = useState('muscle');
  const [goalWeight, setGoalWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  
  // --- Unit & Modal Flow Interface States ---
  const [goalWeightUnit, setGoalWeightUnit] = useState('kg'); // 'kg' | 'lbs'
  const [showCalendar, setShowCalendar] = useState(false);
  const [navDate, setNavDate] = useState(new Date());

  // --- NEW: Premium Safety Warning Modal States ---
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningTitle, setWarningTitle] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  // --- Dispatch Handlers Interactivity ---
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- Static Structural Mappings Configuration Arrays ---
  const activityLevels = [
    { id: 'sedentary', title: 'Sedentary', icon: 'bicycle-outline', subTitle: 'Desk / Minimal' },
    { id: 'moderate', title: 'Moderate', icon: 'fitness-outline', subTitle: '3–5 Days/Wk' },
    { id: 'active', title: 'Active', icon: 'flame-outline', subTitle: 'Heavy/Intense' }
  ];

  const goals = [
    { id: 'muscle', title: 'Muscle Gain', icon: 'barbell-outline', tag: 'Hypertrophy' },
    { id: 'fatloss', title: 'Weight Loss', icon: 'trending-down-outline', tag: 'Deficit' },
    { id: 'maintain', title: 'Maintain Weight', icon: 'refresh-outline', tag: 'Balance' }
  ];

  // ==========================================
  // LOCAL WARNING UTILITY DISPATCHER
  // ==========================================
  const triggerSafetyWarning = (title, message) => {
    setWarningTitle(title);
    setWarningMessage(message);
    setWarningVisible(true);
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

    const enteredWeightNum = parseFloat(goalWeight);
    if (isNaN(enteredWeightNum) || enteredWeightNum <= 0) {
      triggerSafetyWarning("Invalid Input", "Please enter a realistic numeric weight calculation metric entry.");
      return;
    }

    // Dynamic conversion pipeline to baseline Metrics standard internally (kg)
    const targetWeightInKg = goalWeightUnit === 'lbs' ? enteredWeightNum * 0.45359237 : enteredWeightNum;

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

    for (let day = 1; day <= totalDays; day++) {
      const formattedDate = `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
      const isSelected = targetDate === formattedDate;

      dayButtons.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[styles.calendarDayButton, isSelected && styles.calendarDaySelected]}
          disabled={isLoading}
          onPress={() => {
            setTargetDate(formattedDate);
            setShowCalendar(false);
          }}
        >
          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
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
                  <Text style={styles.inputLabel}>Target Goal Weight</Text>
                  <View style={styles.togglePillContainer}>
                    <TouchableOpacity 
                      style={[styles.toggleBtn, goalWeightUnit === 'kg' && styles.toggleBtnActive]}
                      onPress={() => setGoalWeightUnit('kg')}
                    >
                      <Text style={[styles.toggleBtnText, goalWeightUnit === 'kg' && styles.toggleBtnTextActive]}>kg</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.toggleBtn, goalWeightUnit === 'lbs' && styles.toggleBtnActive]}
                      onPress={() => setGoalWeightUnit('lbs')}
                    >
                      <Text style={[styles.toggleBtnText, goalWeightUnit === 'lbs' && styles.toggleBtnTextActive]}>lbs</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.neumorphicInputInset}>
                  <TextInput 
                    style={styles.input}
                    placeholder={goalWeightUnit === 'kg' ? "e.g. 70" : "e.g. 155"}
                    placeholderTextColor={CONFIG.textMuted}
                    value={goalWeight}
                    onChangeText={setGoalWeight}
                    keyboardType="numeric"
                    editable={!isLoading}
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

      {/* NEW HYBRID-NEUMORPHIC SAFETY COMPLIANCE WARNING SHEET OVERLAY */}
      <Modal visible={warningVisible} transparent={true} animationType="fade" onRequestClose={() => setWarningVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.warningModalCard}>
            
            {/* Top-Right Dismiss Icon */}
            <TouchableOpacity style={styles.warningCloseButton} onPress={() => setWarningVisible(false)}>
              <Ionicons name="close" size={22} color={CONFIG.warningRedDark} />
            </TouchableOpacity>
            
            <View style={styles.warningIconContainer}>
              <Ionicons name="warning-outline" size={32} color={CONFIG.warningRed} />
            </View>

            <Text style={styles.warningTitleText}>{warningTitle}</Text>
            <Text style={styles.warningMessageText}>{warningMessage}</Text>

            <TouchableOpacity 
              style={[styles.buttonBase, styles.warningDismissButton]} 
              onPress={() => setWarningVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Acknowledge</Text>
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
  calendarIconBtn: { 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingRight: 16 
  },
  
  // --- Overlay Overrides Custom Modal Sheets Systems ---
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(26, 32, 44, 0.4)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
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

  // --- STYLIZED PREMIUM SAFETY WARNING LAYOUT MATRIX ---
  warningModalCard: {
    width: '100%',
    backgroundColor: CONFIG.baseColor,
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    shadowColor: CONFIG.warningRed,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 2,
    borderColor: CONFIG.clearWhiteHighlight,
    position: 'relative'
  },
  warningCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 4
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: CONFIG.warningRedBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: CONFIG.warningRedBorder,
  },
  warningTitleText: {
    fontSize: 20,
    fontWeight: '900',
    color: CONFIG.warningRedDark,
    marginBottom: 8,
    textAlign: 'center'
  },
  warningMessageText: {
    fontSize: 13,
    color: CONFIG.warningRedText,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 6,
    marginBottom: 24,
  },
  warningDismissButton: {
    backgroundColor: CONFIG.warningRed,
    width: '100%',
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