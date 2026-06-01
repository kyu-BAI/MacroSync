import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';

export default function StepOneScreen({ onNext }) {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Manages safe submission lifecycle state

  // Dynamic BMI Calculation Engine
  let bmiValue = null;
  let bmiCategory = '';
  let bmiColor = '#657786'; 

  if (weight && height) {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height) / 100; // Convert cm to meters
    
    if (weightNum > 0 && heightNum > 0) {
      const rawBmi = weightNum / (heightNum * heightNum);
      bmiValue = rawBmi.toFixed(1); // Round to 1 decimal place
      
      // Determine Classification & Color (Updated for High Visibility Palette)
      if (rawBmi < 18.5) {
        bmiCategory = 'Underweight';
        bmiColor = '#2B6CB0'; // Vibrant Info Blue
      } else if (rawBmi >= 18.5 && rawBmi <= 24.9) {
        bmiCategory = 'Normal Weight';
        bmiColor = '#2F855A'; // Healthy Green
      } else if (rawBmi >= 25 && rawBmi <= 29.9) {
        bmiCategory = 'Overweight';
        bmiColor = '#C05621'; // Warning Orange
      } else {
        bmiCategory = 'Obese';
        bmiColor = '#C53030'; // Danger Red
      }
    }
  }

  // --- Smooth Single-Tap Multi-Step Progression ---
  const handleNextStep = async () => {
    if (isLoading) return; // Secure double-submit intercept guard
    setIsLoading(true);

    try {
      await onNext();
    } catch (error) {
      console.error("Baseline Processing Failure bounds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 1 OF 3</Text>
            <Text style={styles.brandTitle}>Your Baseline</Text>
            <Text style={styles.brandSubtitle}>Let's establish your starting metrics so we can accurately track your progress.</Text>
          </View>

          {/* --- HIGH VISIBILITY NEUMORPHIC FORM CONTAINER --- */}
          <View style={styles.formSectionShadowWhite}>
            <View style={[styles.formSectionShadowDark, styles.formSection]}>
              
              <Text style={styles.inputLabel}>Age</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. 21"
                  placeholderTextColor="#A4B0BE"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>

              <Text style={styles.inputLabel}>Current Weight (kg)</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. 66"
                  placeholderTextColor="#A4B0BE"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>

              <Text style={styles.inputLabel}>Height (cm)</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. 175"
                  placeholderTextColor="#A4B0BE"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>

              {/* --- MINIMALIST INSET BMI DISPLAY PANEL --- */}
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

              {/* --- UNIFIED SINGLE-TAP NEUMORPHIC BUTTON BLOCK --- */}
              <View style={isPressed || isLoading ? styles.buttonPressedContainer : styles.btnShadowWhite}>
                <View style={isPressed || isLoading ? null : styles.btnShadowDark}>
                  <TouchableOpacity 
                    activeOpacity={1}
                    disabled={isLoading}
                    onPressIn={() => setIsPressed(true)}
                    onPressOut={() => setIsPressed(false)}
                    onPress={handleNextStep}
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
    </SafeAreaView>
  );
}

// Global Theme Stylesheet System Configuration
const baseColor = '#E4E9F0';    
const lightShadow = '#FFFFFF';  
const darkShadow = '#A6B4C5';   
const accentColor = '#148F77'; 
const darkTextBlue = '#1A2332'; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColor,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerSection: {
    marginBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: '800',
    color: accentColor,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: darkTextBlue,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#657786',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  formSection: {
    padding: 26, 
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  formSectionShadowWhite: {
    borderRadius: 36,
    backgroundColor: baseColor,
    shadowColor: lightShadow,
    shadowOffset: { width: -7, height: -7 }, 
    shadowOpacity: 1.0,                      
    shadowRadius: 8,                         
    margin: 10, 
  },
  formSectionShadowDark: {
    backgroundColor: baseColor,
    shadowColor: darkShadow,
    shadowOffset: { width: 7, height: 7 },   
    shadowOpacity: 1.0,                      
    shadowRadius: 10,                        
    borderRadius: 36,
    elevation: 8,                            
  },
  inputLabel: {
    color: '#657786',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 6,
  },
  inputContainer: {
    backgroundColor: '#D9E1EC', 
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  input: {
    color: darkTextBlue,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  bmiPanel: {
    backgroundColor: '#D9E1EC', 
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  bmiPlaceholder: {
    color: '#657786',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  bmiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#657786',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  bmiNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: darkTextBlue,
    marginVertical: 4,
  },
  bmiCategory: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  /* --- FIXED HIGH CONTRAST BUTTON STYLING CHAIN --- */
  btnShadowWhite: {
    borderRadius: 16,
    backgroundColor: baseColor,
    shadowColor: lightShadow,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    marginTop: 10,
  },
  btnShadowDark: {
    borderRadius: 16,
    backgroundColor: baseColor,
    shadowColor: darkShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonPressedContainer: {
    borderRadius: 16,
    backgroundColor: '#0E6655',
    marginTop: 10,
    width: '100%',
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
    paddingVertical: 16,
  },
  buttonInnerPressed: {
    backgroundColor: '#0E6655', 
    transform: [{ translateY: 1.5 }],
    paddingVertical: 16,
  },
  buttonText: {
    color: '#FFFFFF', 
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextPressed: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});