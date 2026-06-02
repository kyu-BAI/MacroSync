import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

export default function StepTwoScreen({ onNext, currentWeight,height }) {
  const [selectedGoal, setSelectedGoal] = useState('muscle');
  const [goalWeight, setGoalWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [navDate, setNavDate] = useState(new Date());

  const goals = [
    { id: 'muscle', title: 'Build Muscle', desc: 'Focus on hypertrophy and protein intake' },
    { id: 'fatloss', title: 'Lose Fat', desc: 'Caloric deficit with balanced macros' },
    { id: 'maintain', title: 'Maintain Weight', desc: 'Optimize current body composition' }
  ];

  // --- Health Guard Validation Engine ---
  const handleContinue = () => {
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

    onNext({
  goal_type: selectedGoal,
  goal_weight: goalWeight,
  target_date: targetDate
});
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

          <View style={[styles.neumorphicOuter, styles.formSection]}>
            
            {goals.map((goal) => {
              const isActive = selectedGoal === goal.id;
              return (
                <TouchableOpacity 
                  key={goal.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedGoal(goal.id)}
                  style={[
                    isActive ? styles.neumorphicInnerBtn : styles.neumorphicOuterBtn, 
                    { marginBottom: 16, paddingVertical: 20, alignItems: 'flex-start', paddingHorizontal: 20 }
                  ]}
                >
                  <Text style={[styles.goalTitle, isActive && { color: '#00a3cc' }]}>{goal.title}</Text>
                  <Text style={styles.goalDesc}>{goal.desc}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.targetSection}>
              <Text style={styles.inputLabel}>Target Goal Weight (kg)</Text>
              <View style={styles.neumorphicInner}>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. 70"
                  placeholderTextColor="#A0AAB8"
                  value={goalWeight}
                  onChangeText={setGoalWeight}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.inputLabel}>Target Date</Text>
              <View style={[styles.neumorphicInner, styles.dateInputWrapper]}>
                <TextInput 
                  style={styles.dateInputText}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#A0AAB8"
                  value={targetDate}
                  onChangeText={setTargetDate}
                  keyboardType="numeric"
                />
                <TouchableOpacity 
                  style={styles.calendarIconBtn} 
                  onPress={() => setShowCalendar(true)}
                >
                  <Ionicons name="calendar-outline" size={24} color="#00a3cc" />
                </TouchableOpacity>
              </View>

            </View>

            <TouchableOpacity 
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleContinue}
              style={[isPressed ? styles.neumorphicInnerBtn : styles.neumorphicOuterBtn, { marginTop: 10, alignItems: 'center' }]}
            >
              <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>Continue →</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCalendar} transparent={true} animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.neumorphicOuter, styles.calendarCard]}>
            
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(-1)}>
                <Ionicons name="chevron-back" size={24} color="#00a3cc" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>{months[navDate.getMonth()]} {navDate.getFullYear()}</Text>
              <TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(1)}>
                <Ionicons name="chevron-forward" size={24} color="#00a3cc" />
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
              style={[styles.neumorphicOuterBtn, styles.closeCalendarBtn]} 
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const baseColor = '#E0E5EC'; 
const lightShadow = '#FFFFFF'; 
const darkShadow = '#B8C4D2'; 
const accentColor = '#00a3cc';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: baseColor },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 30 },
  headerSection: { marginBottom: 35, alignItems: 'center' },
  stepIndicator: { fontSize: 12, fontWeight: 'bold', color: accentColor, letterSpacing: 2, marginBottom: 8 },
  brandTitle: { fontSize: 32, fontWeight: 'bold', color: '#2D3748' },
  brandSubtitle: { fontSize: 15, color: '#718096', marginTop: 8, textAlign: 'center', lineHeight: 22 },
  formSection: { padding: 24, borderRadius: 28 },
  goalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
  goalDesc: { fontSize: 13, color: '#718096' },
  
  targetSection: { marginTop: 15, marginBottom: 10, borderTopWidth: 1, borderTopColor: '#d1d9e6', paddingTop: 20 },
  inputLabel: { color: '#4A5568', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  input: { color: '#2D3748', paddingHorizontal: 16, paddingVertical: 15, fontSize: 16 },
  
  dateInputWrapper: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  dateInputText: { flex: 1, color: '#2D3748', paddingHorizontal: 16, paddingVertical: 15, fontSize: 16 },
  calendarIconBtn: { padding: 12, backgroundColor: baseColor, borderLeftWidth: 1, borderLeftColor: '#d1d9e6' },

  buttonText: { color: '#2D3748', fontSize: 16, fontWeight: 'bold' },
  buttonTextPressed: { color: '#718096' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 32, 44, 0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  calendarCard: { width: '100%', padding: 24, borderRadius: 28, alignItems: 'center', backgroundColor: baseColor },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 25 },
  calendarMonthTitle: { fontSize: 20, fontWeight: '900', color: '#2D3748', letterSpacing: 0.5 },
  arrowButton: { padding: 10, backgroundColor: baseColor, borderRadius: 12, elevation: 2, shadowColor: darkShadow, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.5 },
  weekHeaderRow: { flexDirection: 'row', width: '100%', marginBottom: 15 },
  weekDayLabel: { flex: 1, textAlign: 'center', color: '#A0AAB8', fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' },
  calendarDayButton: { width: '13%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 4, borderRadius: 12 },
  calendarDayEmpty: { width: '13%', aspectRatio: 1, marginVertical: 4 },
  calendarDayText: { color: '#4A5568', fontWeight: '700', fontSize: 15 },
  
  calendarDaySelected: { backgroundColor: accentColor, elevation: 4, shadowColor: accentColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 4 },
  calendarDayTextSelected: { color: '#FFFFFF', fontWeight: '900' },
  
  closeCalendarBtn: { marginTop: 25, paddingVertical: 14, paddingHorizontal: 40, width: '100%' },
  closeBtnText: { color: '#2D3748', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },

  neumorphicOuter: { backgroundColor: baseColor, borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderTopColor: lightShadow, borderLeftColor: lightShadow, borderBottomColor: darkShadow, borderRightColor: darkShadow, elevation: 4 },
  neumorphicInner: { backgroundColor: baseColor, borderRadius: 14, marginBottom: 20, borderTopWidth: 3, borderLeftWidth: 3, borderBottomWidth: 1, borderRightWidth: 1, borderTopColor: darkShadow, borderLeftColor: darkShadow, borderBottomColor: lightShadow, borderRightColor: lightShadow },
  neumorphicOuterBtn: { backgroundColor: baseColor, paddingVertical: 16, borderRadius: 14, borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderTopColor: lightShadow, borderLeftColor: lightShadow, borderBottomColor: darkShadow, borderRightColor: darkShadow, elevation: 2 },
  neumorphicInnerBtn: { backgroundColor: baseColor, paddingVertical: 16, borderRadius: 14, borderTopWidth: 3, borderLeftWidth: 3, borderBottomWidth: 1, borderRightWidth: 1, borderTopColor: darkShadow, borderLeftColor: darkShadow, borderBottomColor: lightShadow, borderRightColor: lightShadow, transform: [{ translateY: 1.5 }] },
});