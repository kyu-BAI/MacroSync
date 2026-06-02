import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

export default function StepTwoScreen({ onNext, currentWeight,height }) {
  const [selectedGoal, setSelectedGoal] = useState('muscle');
  const [goalWeight, setGoalWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Manages safe submission lifecycle state
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [navDate, setNavDate] = useState(new Date());

  const goals = [
    { id: 'muscle', title: 'Build Muscle', desc: 'Focus on hypertrophy and protein intake' },
    { id: 'fatloss', title: 'Lose Fat', desc: 'Caloric deficit with balanced macros' },
    { id: 'maintain', title: 'Maintain Weight', desc: 'Optimize current body composition' }
  ];

  // --- Health Guard Validation Engine ---
  const handleContinue = async () => {
    if (isLoading) return; // Secure double-submit intercept guard

    if (!goalWeight || !targetDate) {
      Alert.alert("Missing Fields", "Please specify your goal weight and a target date before continuing.");
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

    onNext();
  };

  // --- Premium Calendar UI Logic ---
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

    for (let i = 0; i < firstDayIndex; i++) {
      dayButtons.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
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
          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>{day}</Text>
        </TouchableOpacity>
      );
    }

    return dayButtons;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 2 OF 3</Text>
            <Text style={styles.brandTitle}>Primary Goal</Text>
            <Text style={styles.brandSubtitle}>What is your main objective? We will tailor your MacroSync plans around this.</Text>
          </View>

          {/* --- MAIN FORM CONTAINER CARD --- */}
          <View style={styles.formSectionShadowWhite}>
            <View style={[styles.formSectionShadowDark, styles.formSection]}>
              
              {/* Interactive Dynamic Goal Selection Cards */}
              {goals.map((goal) => {
                const isActive = selectedGoal === goal.id;
                return (
                  <View key={goal.id} style={isActive ? styles.goalCardActiveWrap : styles.goalCardInactiveWrap}>
                    <TouchableOpacity 
                      activeOpacity={0.9}
                      disabled={isLoading}
                      onPress={() => setSelectedGoal(goal.id)}
                      style={[styles.goalCardInner, isActive && styles.goalCardInnerActive]}
                    >
                      <Text style={[styles.goalTitle, isActive && { color: accentColor }]}>{goal.title}</Text>
                      <Text style={styles.goalDesc}>{goal.desc}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              <View style={styles.targetSection}>
                <Text style={styles.inputLabel}>Target Goal Weight (kg)</Text>
                <View style={styles.inputContainer}>
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g. 70"
                    placeholderTextColor="#A4B0BE"
                    value={goalWeight}
                    onChangeText={setGoalWeight}
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                </View>

                <Text style={styles.inputLabel}>Target Date</Text>
                <View style={[styles.inputContainer, styles.dateInputWrapper]}>
                  <TextInput 
                    style={styles.dateInputText}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor="#A4B0BE"
                    value={targetDate}
                    onChangeText={setTargetDate}
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    style={styles.calendarIconBtn} 
                    disabled={isLoading}
                    onPress={() => setShowCalendar(true)}
                  >
                    <Ionicons name="calendar-outline" size={22} color={accentColor} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* --- UNIFIED SINGLE-TAP NEUMORPHIC PROGRESS BUTTON --- */}
              <View style={isPressed || isLoading ? styles.buttonPressedContainer : styles.btnShadowWhite}>
                <View style={isPressed || isLoading ? null : styles.btnShadowDark}>
                  <TouchableOpacity 
                    activeOpacity={1}
                    disabled={isLoading}
                    onPressIn={() => setIsPressed(true)}
                    onPressOut={() => setIsPressed(false)}
                    onPress={handleContinue}
                    style={[
                      styles.buttonBaseLayout, 
                      isPressed || isLoading ? styles.buttonInnerPressed : styles.buttonInnerUnpressed
                    ]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={isPressed ? styles.buttonTextPressed : styles.buttonText}>
                        Continue →
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- PREMIUM CALENDAR MODAL --- */}
      <Modal visible={showCalendar} transparent={true} animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardShadowWhite}>
            <View style={[styles.modalCardShadowDark, styles.calendarCard]}>
              
              <View style={styles.calendarHeaderRow}>
                <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(-1)}>
                  <Ionicons name="chevron-back" size={20} color={accentColor} />
                </TouchableOpacity>
                <Text style={styles.calendarMonthTitle}>{months[navDate.getMonth()]} {navDate.getFullYear()}</Text>
                <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(1)}>
                  <Ionicons name="chevron-forward" size={20} color={accentColor} />
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

              <View style={styles.btnShadowWhite}>
                <View style={styles.btnShadowDark}>
                  <TouchableOpacity 
                    style={styles.buttonInner} 
                    onPress={() => setShowCalendar(false)}
                  >
                    <Text style={styles.buttonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Option 1 Global Shared Brand Theme Constants
const baseColor = '#E4E9F0';    
const lightShadow = '#FFFFFF';  
const darkShadow = '#A6B4C5';   
const accentColor = '#148F77'; 
const darkTextBlue = '#1A2332'; 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: baseColor },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 30 },
  headerSection: { marginBottom: 40, alignItems: 'center', width: '100%' },
  stepIndicator: { fontSize: 11, fontWeight: '800', color: accentColor, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  brandTitle: { fontSize: 40, fontWeight: '800', color: darkTextBlue, letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 14, color: '#657786', marginTop: 12, textAlign: 'center', lineHeight: 22, fontWeight: '500', paddingHorizontal: 20 },
  
  /* --- OUTSIDE CONTAINER CARD SHADOWS --- */
  formSection: { padding: 26, borderRadius: 36, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' },
  formSectionShadowWhite: { borderRadius: 36, backgroundColor: baseColor, shadowColor: lightShadow, shadowOffset: { width: -7, height: -7 }, shadowOpacity: 1.0, shadowRadius: 8, margin: 10 },
  formSectionShadowDark: { backgroundColor: baseColor, shadowColor: darkShadow, shadowOffset: { width: 7, height: 7 }, shadowOpacity: 1.0, shadowRadius: 10, borderRadius: 36, elevation: 8 },
  
  /* --- UNPRSED GOAL CARDS EXTENDED SHADOWS --- */
  goalCardInactiveWrap: { 
    borderRadius: 18, 
    backgroundColor: baseColor, 
    shadowColor: lightShadow, 
    shadowOffset: { width: -5, height: -5 }, 
    shadowOpacity: 1.0, 
    shadowRadius: 6, 
    marginBottom: 18,
    marginHorizontal: 6, 
  },
  goalCardActiveWrap: { 
    borderRadius: 18, 
    backgroundColor: baseColor, 
    shadowColor: darkShadow, 
    shadowOffset: { width: 1, height: 1 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 2, 
    marginBottom: 18,
    marginHorizontal: 6,
  },
  goalCardInner: { 
    paddingVertical: 20, 
    paddingHorizontal: 22, 
    borderRadius: 18, 
    backgroundColor: baseColor, 
    shadowColor: darkShadow, 
    shadowOffset: { width: 5, height: 5 }, 
    shadowOpacity: 0.85, 
    shadowRadius: 8, 
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)', 
  },
  goalCardInnerActive: { 
    backgroundColor: '#D9E1EC', 
    shadowColor: lightShadow, 
    shadowOffset: { width: -2, height: -2 }, 
    shadowOpacity: 1.0, 
    shadowRadius: 4, 
    elevation: 0, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.7)' 
  },
  goalTitle: { fontSize: 16, fontWeight: '800', color: darkTextBlue, marginBottom: 5 },
  goalDesc: { fontSize: 13, color: '#657786', fontWeight: '500', lineHeight: 18 },
  
  /* --- FORM DATA FIELDS AND TEXT BOX VALUES --- */
  targetSection: { marginTop: 8, marginBottom: 16, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.6)', paddingTop: 24 },
  inputLabel: { color: '#657786', fontSize: 11, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 },
  inputContainer: { backgroundColor: '#D9E1EC', borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  input: { color: darkTextBlue, paddingHorizontal: 18, paddingVertical: 16, fontSize: 15, fontWeight: '500' },
  
  /* --- CALENDAR SYSTEM INNER ELEMENTS --- */
  dateInputWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateInputText: { flex: 1, color: darkTextBlue, paddingHorizontal: 18, paddingVertical: 16, fontSize: 15, fontWeight: '500' },
  calendarIconBtn: { padding: 16, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 32, 44, 0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalCardShadowWhite: { width: '100%', borderRadius: 36, backgroundColor: baseColor, shadowColor: lightShadow, shadowOffset: { width: -8, height: -8 }, shadowOpacity: 1.0, shadowRadius: 10 },
  modalCardShadowDark: { width: '100%', backgroundColor: baseColor, shadowColor: darkShadow, shadowOffset: { width: 8, height: 8 }, shadowOpacity: 1.0, shadowRadius: 12, borderRadius: 36, elevation: 10 },
  calendarCard: { padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
  calendarMonthTitle: { fontSize: 18, fontWeight: '800', color: darkTextBlue, letterSpacing: -0.2 },
  arrowButton: { padding: 8, backgroundColor: baseColor, borderRadius: 12, shadowColor: darkShadow, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 3, elevation: 2 },
  weekHeaderRow: { flexDirection: 'row', width: '100%', marginBottom: 10 },
  weekDayLabel: { flex: 1, textAlign: 'center', color: '#A4B0BE', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between', marginBottom: 12 },
  calendarDayButton: { width: '13%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 4, borderRadius: 12 },
  calendarDayEmpty: { width: '13%', aspectRatio: 1, marginVertical: 4 },
  calendarDayText: { color: darkTextBlue, fontWeight: '700', fontSize: 14 },
  calendarDaySelected: { backgroundColor: accentColor, borderRadius: 12 },
  calendarDayTextSelected: { color: '#FFFFFF', fontWeight: '800' },

  /* --- BRAND ACTION BUTTONS SINGLE-TAP LAYOUT --- */
  btnShadowWhite: { 
    width: '100%', 
    borderRadius: 16, 
    backgroundColor: baseColor, 
    shadowColor: lightShadow, 
    shadowOffset: { width: -4, height: -4 }, 
    shadowOpacity: 0.9, 
    shadowRadius: 5,
    marginTop: 10,
  },
  btnShadowDark: { 
    width: '100%', 
    borderRadius: 16, 
    backgroundColor: baseColor, 
    shadowColor: darkShadow, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 6, 
    elevation: 4,
  },
  buttonPressedContainer: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#0E6655',
    marginTop: 10,
  },
  buttonBaseLayout: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 54,
  },
  buttonInnerUnpressed: {
    backgroundColor: accentColor, 
  },
  buttonInnerPressed: {
    backgroundColor: '#0E6655', 
    transform: [{ translateY: 1.5 }],
  },
  buttonInner: { 
    backgroundColor: accentColor, 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    width: '100%' 
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  buttonTextPressed: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },
  buttonTextWrapper: { paddingVertical: 16, width: '100%', justifyContent: 'center', alignItems: 'center' }
});