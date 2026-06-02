import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function StepOneScreen({ onNext }) {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [isPressed, setIsPressed] = useState(false);

  // Dynamic BMI Calculation Engine
  let bmiValue = null;
  let bmiCategory = '';
  let bmiColor = '#718096'; 

  if (weight && height) {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height) / 100; // Convert cm to meters
    
    if (weightNum > 0 && heightNum > 0) {
      const rawBmi = weightNum / (heightNum * heightNum);
      bmiValue = rawBmi.toFixed(1); // Round to 1 decimal place
      
      // Determine Classification & Color
      if (rawBmi < 18.5) {
        bmiCategory = 'Underweight';
        bmiColor = '#00a3cc'; // Blue
      } else if (rawBmi >= 18.5 && rawBmi <= 24.9) {
        bmiCategory = 'Normal Weight';
        bmiColor = '#48bb78'; // Green
      } else if (rawBmi >= 25 && rawBmi <= 29.9) {
        bmiCategory = 'Overweight';
        bmiColor = '#ed8936'; // Orange
      } else {
        bmiCategory = 'Obese';
        bmiColor = '#e53e3e'; // Red
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 1 OF 3</Text>
            <Text style={styles.brandTitle}>Your Baseline</Text>
            <Text style={styles.brandSubtitle}>Let's establish your starting metrics so we can accurately track your progress.</Text>
          </View>

          <View style={[styles.neumorphicOuter, styles.formSection]}>
            
            <Text style={styles.inputLabel}>Age</Text>
            <View style={styles.neumorphicInner}>
              <TextInput 
                style={styles.input}
                placeholder="e.g. 21"
                placeholderTextColor="#A0AAB8"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.inputLabel}>Current Weight (kg)</Text>
            <View style={styles.neumorphicInner}>
              <TextInput 
                style={styles.input}
                placeholder="e.g. 66"
                placeholderTextColor="#A0AAB8"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.inputLabel}>Height (cm)</Text>
            <View style={styles.neumorphicInner}>
              <TextInput 
                style={styles.input}
                placeholder="e.g. 175"
                placeholderTextColor="#A0AAB8"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>

            {/* Dynamic BMI Display Panel */}
            <View style={styles.bmiPanel}>
              {bmiValue ? (
                <>
                  <Text style={styles.bmiLabel}>Estimated BMI</Text>
                  <Text style={styles.bmiNumber}>{bmiValue}</Text>
                  <Text style={[styles.bmiCategory, { color: bmiColor }]}>{bmiCategory}</Text>
                </>
              ) : (
                <Text style={styles.bmiPlaceholder}>Enter weight and height to calculate your BMI level.</Text>
              )}
            </View>

            <TouchableOpacity 
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={() => {

  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height) / 100;

  const bmi =
    weightNum /
    (heightNum * heightNum);

  onNext({
    age,
    weight,
    height,
    bmi: bmi.toFixed(1)
  });

}}
              style={[isPressed ? styles.neumorphicInnerBtn : styles.neumorphicOuterBtn, { marginTop: 10 }]}
            >
              <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>Continue →</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Light White Neumorphic Color Constants (FIXED)
const baseColor = '#E0E5EC'; 
const lightShadow = '#FFFFFF';
const darkShadow = '#B8C4D2'; 
const accentColor = '#00a3cc';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: baseColor },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  headerSection: { marginBottom: 35, alignItems: 'center' },
  stepIndicator: { fontSize: 12, fontWeight: 'bold', color: accentColor, letterSpacing: 2, marginBottom: 8 },
  brandTitle: { fontSize: 32, fontWeight: 'bold', color: '#2D3748' },
  brandSubtitle: { fontSize: 15, color: '#718096', marginTop: 8, textAlign: 'center', lineHeight: 22 },
  formSection: { padding: 24, borderRadius: 28 },
  inputLabel: { color: '#4A5568', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  input: { color: '#2D3748', paddingHorizontal: 16, paddingVertical: 15, fontSize: 16 },
  
  // BMI Panel Specific Styles
  bmiPanel: {
    backgroundColor: '#d1d9e6', 
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  bmiPlaceholder: { color: '#718096', fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  bmiLabel: { fontSize: 12, fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', letterSpacing: 1 },
  bmiNumber: { fontSize: 34, fontWeight: '900', color: '#2D3748', marginVertical: 2 },
  bmiCategory: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  buttonText: { color: '#2D3748', fontSize: 16, fontWeight: 'bold' },
  buttonTextPressed: { color: '#718096' },
  
  // General Neumorphic Styles
  neumorphicOuter: { backgroundColor: baseColor, borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderTopColor: lightShadow, borderLeftColor: lightShadow, borderBottomColor: darkShadow, borderRightColor: darkShadow, elevation: 4 },
  neumorphicInner: { backgroundColor: baseColor, borderRadius: 14, marginBottom: 20, borderTopWidth: 3, borderLeftWidth: 3, borderBottomWidth: 1, borderRightWidth: 1, borderTopColor: darkShadow, borderLeftColor: darkShadow, borderBottomColor: lightShadow, borderRightColor: lightShadow },
  neumorphicOuterBtn: { backgroundColor: baseColor, paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderTopColor: lightShadow, borderLeftColor: lightShadow, borderBottomColor: darkShadow, borderRightColor: darkShadow, elevation: 2 },
  neumorphicInnerBtn: { backgroundColor: baseColor, paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderTopWidth: 3, borderLeftWidth: 3, borderBottomWidth: 1, borderRightWidth: 1, borderTopColor: darkShadow, borderLeftColor: darkShadow, borderBottomColor: lightShadow, borderRightColor: lightShadow, transform: [{ translateY: 1.5 }] },
});