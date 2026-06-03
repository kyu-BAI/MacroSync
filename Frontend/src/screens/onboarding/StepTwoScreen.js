import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

export default function StepTwoScreen({ onNext, currentWeight, height }) {
  const [selectedActivity, setSelectedActivity] = useState('moderate');
  const [selectedGoal, setSelectedGoal] = useState('muscle');
  const [goalWeight, setGoalWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [navDate, setNavDate] = useState(new Date());

  const activityLevels = [
    { id: 'sedentary', title: 'Sedentary', desc: 'Desk job, minimal traditional exercise' },
    { id: 'moderate', title: 'Moderately Active', desc: 'Moving or working out 3–5 days a week' },
    { id: 'active', title: 'Highly Active', desc: 'Heavy sports or intense physical labor daily' }
  ];

  const goals = [
    { id: 'muscle', title: 'Build Muscle', desc: 'Focus on hypertrophy and protein intake' },
    { id: 'fatloss', title: 'Lose Fat', desc: 'Caloric deficit with balanced macros' },
    { id: 'maintain', title: 'Maintain Weight', desc: 'Optimize current body composition' }
  ];

  // --- Health Guard Validation Engine (100% Untouched) ---
  const handleContinue = async () => {
    if (isLoading) return; 

    // Strict validation interceptor to ensure the user inputs all required target goals
    if (!goalWeight.trim() || !targetDate.trim()) {
      Alert.alert(
        "Missing Fields", 
        "Please specify your goal weight and select a target date before continuing to the next step."
      );
      return;
    }

    const targetWeightNum = parseFloat(goalWeight);
    if (isNaN(targetWeightNum) || targetWeightNum <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid weight number.");
      return;
    }

    const heightInMeters = height / 100;
    const projectedBmi = targetWeightNum / (heightInMeters * heightInMeters);

    if (projectedBmi < 18.5) {
      Alert.alert(
        "Unsafe Target Weight",
        `A goal weight of ${targetWeightNum}kg drops your BMI to ${projectedBmi.toFixed(1)} (Underweight). Please set a safer weight target.`
      );
      return;
    }

    if (projectedBmi >= 30.0) {
      Alert.alert(
        "Unrealistic Target Weight",
        `A goal weight of ${targetWeightNum}kg pushes your BMI to ${projectedBmi.toFixed(1)} (Obese). Let's aim for a healthier target.`
      );
      return;
    }

    // Pass chosen metrics upstream cleanly through navigation callback transitions
    onNext({
      activityLevel: selectedActivity,
      goal: selectedGoal,
      goalWeight: targetWeightNum,
      targetDate: targetDate.trim()
    });
  };

  // --- Premium Calendar UI Logic (Fixed Grid Alignment Architecture - 100% Untouched) ---
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const changeMonth = (direction) => {
    const newDate = new Date(navDate.getFullYear(), navDate.getMonth() + direction, 1);
    setNavDate(newDate);
  };

  const renderCalendarDays = () => {
    const year = navDate.getFullYear();
    const month = navDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const dayButtons = [];

    // 1. Render empty spacing slots for the initial leading week
    for (let i = 0; i < firstDayIndex; i++) {
      dayButtons.push(<View key={`empty-start-${i}`} style={styles.calendarDayEmpty} />);
    }

    // 2. Render actual day selection elements
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
          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>{day}</Text>
        </TouchableOpacity>
      );
    }

    // 3. Render trailing blank components to complete a clean 7-column matrix row block layout
    const totalRenderedSlots = firstDayIndex + totalDays;
    const remainingSlots = totalRenderedSlots % 7 === 0 ? 0 : 7 - (totalRenderedSlots % 7);
    
    for (let j = 0; j < remainingSlots; j++) {
      dayButtons.push(<View key={`empty-end-${j}`} style={styles.calendarDayEmpty} />);
    }

    return dayButtons;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={baseColor} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 2 OF 3</Text>
            <Text style={styles.brandTitle}>Primary Goal</Text>
            <Text style={styles.brandSubtitle}>What is your main objective? We will tailor your MacroSync plans around this.</Text>
          </View>

          {/* Form Card Container */}
          <View style={styles.formCard}>
            
            {/* ACTIVITY LEVEL TRACKING SYSTEM SELECTION MATRIX */}
            <Text style={styles.sectionInputLabel}>Activity Level</Text>
            {activityLevels.map((level) => {
              const isSelected = selectedActivity === level.id;
              return (
                <TouchableOpacity
                  key={level.id}
                  activeOpacity={0.9}
                  disabled={isLoading}
                  onPress={() => setSelectedActivity(level.id)}
                  style={[styles.goalCardBase, isSelected ? styles.goalCardActive : styles.goalCardInactive]}
                >
                  <Text style={[styles.goalTitle, isSelected ? styles.goalTitleActive : styles.goalTitleInactive]}>
                    {level.title}
                  </Text>
                  <Text style={[styles.goalDesc, isSelected ? styles.goalDescActive : styles.goalDescInactive]}>
                    {level.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* INTERACTIVE FITNESS OBJECTIVE PRIMARY GOAL SELECTION */}
            <Text style={[styles.sectionInputLabel, { marginTop: 12 }]}>Primary Fitness Goal</Text>
            {goals.map((goal) => {
              const isActive = selectedGoal === goal.id;
              return (
                <TouchableOpacity 
                  key={goal.id}
                  activeOpacity={0.9}
                  disabled={isLoading}
                  onPress={() => setSelectedGoal(goal.id)}
                  style={[styles.goalCardBase, isActive ? styles.goalCardActive : styles.goalCardInactive]}
                >
                  <Text style={[styles.goalTitle, isActive ? styles.goalTitleActive : styles.goalTitleInactive]}>
                    {goal.title}
                  </Text>
                  <Text style={[styles.goalDesc, isActive ? styles.goalDescActive : styles.goalDescInactive]}>
                    {goal.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.targetSection}>
              {/* Target Goal Weight Input Slot */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Goal Weight (kg)</Text>
                <View style={styles.neumorphicInputInset}>
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g. 70"
                    placeholderTextColor="#7FA293"
                    value={goalWeight}
                    onChangeText={setGoalWeight}
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Target Date Input Slot */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Date</Text>
                <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
                  <TextInput 
                    style={styles.input}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor="#7FA293"
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
                    <Ionicons name="calendar-outline" size={22} color={logoGreen} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* INTERACTIVE NAVIGATION BUTTON */}
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
                  Continue
                </Text>
              )}
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- HIGH-INTENSITY CALENDAR MODAL WITH STABLE CORE GRIDDING --- */}
      <Modal visible={showCalendar} transparent={true} animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalFormCard}>
            
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(-1)} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={20} color={logoGreen} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>{months[navDate.getMonth()]} {navDate.getFullYear()}</Text>
              <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(1)} activeOpacity={0.7}>
                <Ionicons name="chevron-forward" size={20} color={logoGreen} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekHeaderRow}>
              {daysOfWeek.map((day) => (
                <Text key={day} style={styles.weekDayLabel}>{day}</Text>
              ))}
            </View>

            {/* Stable Layout Grid Container wrapper */}
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

// Intensified Hybrid Neumorphic Color Design Matrix Tokens
const baseColor = '#F0F4F2';           
const clearWhiteHighlight = '#FFFFFF';    
const softGreenShadow = '#AEC2B7';      

// Logo Branding Metrics
const logoGreen = '#4EA685';        
const logoDarkShadow = '#37745D';   
const logoLightHighlight = '#65D8AD'; 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: baseColor },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24, 
    paddingBottom: 30,
    paddingTop: Platform.OS === 'ios' ? 40 : 30,
  },
  headerSection: { marginBottom: 35, alignItems: 'center', width: '100%' },
  stepIndicator: { fontSize: 12, fontWeight: '900', color: logoGreen, letterSpacing: 2, textTransform: 'uppercase' },
  brandTitle: { fontSize: 42, fontWeight: '900', color: '#21332A', letterSpacing: -0.5, marginTop: 6 },
  brandSubtitle: { fontSize: 14, color: '#556B60', marginTop: 10, textAlign: 'center', lineHeight: 22, fontWeight: '700' },
  
  formCard: {
    backgroundColor: baseColor,
    borderRadius: 40, 
    padding: 24,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 14, height: 14 }, 
    shadowOpacity: 1,
    shadowRadius: 16, 
    elevation: 12,    
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
  },

  /* --- SECTORS HEAD LABEL SYSTEM --- */
  sectionInputLabel: {
    color: '#41544B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 6,
  },

  /* --- GOAL CARD SELECTION SYSTEM MATRICES --- */
  goalCardBase: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  goalCardInactive: {
    backgroundColor: baseColor,
    borderColor: '#E1E9E5',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 3,
  },
  goalCardActive: {
    backgroundColor: '#E4ECE8',
    borderColor: logoGreen,
    shadowColor: logoGreen,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  goalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  goalTitleInactive: { color: '#21332A' },
  goalTitleActive: { color: logoGreen },
  goalDesc: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  goalDescInactive: { color: '#7FA293' },
  goalDescActive: { color: '#41544B' },

  /* --- DATA ENTRY SLOTS STYLE MATRIX --- */
  targetSection: { marginTop: 8, borderTopWidth: 1.5, borderColor: '#D4E2DC', paddingTop: 20 },
  inputGroup: { marginBottom: 22 },
  inputLabel: { color: '#41544B', fontSize: 11, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 6 },
  neumorphicInputInset: {
    backgroundColor: baseColor,
    borderRadius: 24, 
    borderWidth: 1.5, 
    borderColor: '#D4E2DC',
    shadowColor: logoGreen,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.35, 
    shadowRadius: 5,
    height: 54, 
    justifyContent: 'center',
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { flex: 1, color: '#1A2B23', paddingHorizontal: 18, height: '100%', fontSize: 16, fontWeight: '700' },
  calendarIconBtn: { height: '100%', justifyContent: 'center', alignItems: 'center', paddingRight: 18 },

  /* --- STABILIZED CALENDAR MODAL INTERFACES --- */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 32, 44, 0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalFormCard: {
    width: '100%',
    backgroundColor: baseColor,
    borderRadius: 36, 
    padding: 24,
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 10, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
  },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 },
  calendarMonthTitle: { fontSize: 18, fontWeight: '900', color: '#21332A', letterSpacing: -0.2 },
  arrowButton: { 
    padding: 10, 
    backgroundColor: baseColor, 
    borderRadius: 16, 
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 3, height: 3 }, 
    shadowOpacity: 1, 
    shadowRadius: 4, 
    elevation: 2 
  },
  weekHeaderRow: { flexDirection: 'row', width: '100%', marginBottom: 16 },
  weekDayLabel: { flex: 1, textAlign: 'center', color: '#7FA293', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  calendarGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    width: '100%', 
    justifyContent: 'flex-start',
  },
  calendarDayButton: { 
    width: '14.28%', 
    aspectRatio: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginVertical: 4, 
    borderRadius: 14 
  },
  calendarDayEmpty: { 
    width: '14.28%', 
    aspectRatio: 1, 
    marginVertical: 4 
  },
  calendarDayText: { color: '#1A2B23', fontWeight: '700', fontSize: 14 },
  calendarDaySelected: { backgroundColor: logoGreen, borderRadius: 14 },
  calendarDayTextSelected: { color: '#FFFFFF', fontWeight: '900' },

  /* --- BUTTON MATRIX --- */
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 54,
    marginTop: 16,
  },
  buttonUnpressed: {
    backgroundColor: '#53B28E', 
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: logoLightHighlight,
    borderLeftColor: logoLightHighlight,
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.95,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonPressed: {
    backgroundColor: '#3E836A', 
    borderWidth: 1.5,
    borderColor: logoDarkShadow,
    transform: [{ translateY: 2 }], 
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5, textShadowColor: logoDarkShadow, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  buttonTextPressed: { color: '#9EDEC4' }
});