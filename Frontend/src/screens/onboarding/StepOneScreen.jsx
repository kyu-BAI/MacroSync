import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';
import { getStyles } from './StepOneScreen.styles';

// ==========================================
// THEME CONFIGURATION & BRANDING TOKENS
// ==========================================
const COLORS = {
  base: '#F8FAFC',
  whiteHighlight: '#FFFFFF',
  logoGreen: '#10B981',
  textDark: '#0F172A',
  textMuted: '#64748B',
  textPlaceholder: '#94A3B8',
  borderLight: '#E2E8F0',
  borderItem: '#E2E8F0',
  bgPill: '#F1F5F9',
  
  // BMI Status Colors
  underweight: '#10B981',
  normal: '#10B981',
  overweight: '#64748B',
  obese: '#64748B'
};

export default function StepOneScreen({ onNext }) {
  const { showAlert } = useCustomAlert();
  const { theme } = useTheme();
  const isDarkMode = false;
  const styles = getStyles(theme, false);
  // --- Core Inputs ---
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');

  // --- Measurement Units ---
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('ft');

  // --- UI Interactivity ---
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // ==========================================
  // BUSINESS LOGIC & CONVERSIONS (DEBUG HUB)
  // ==========================================
  const triggerSafetyWarning = (title, message) => {
    showAlert(title, message);
  };

  const getWeightInKg = () => {
    const wNum = parseFloat(weight);
    if (isNaN(wNum) || wNum <= 0) return 0;
    return weightUnit === 'kg' ? wNum : wNum * 0.45359237;
  };

  const getHeightInCm = () => {
    if (heightUnit === 'cm') {
      const hNum = parseFloat(height);
      return isNaN(hNum) || hNum <= 0 ? 0 : hNum;
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inch = parseFloat(heightIn) || 0;
      return (ft * 30.48) + (inch * 2.54);
    }
  };

  // BMI Real-Time Calculation Engine
  const calculateBMI = () => {
    const w = getWeightInKg();
    const h = getHeightInCm();
    
    if (w > 0 && h > 0) {
      const heightInMeters = h / 100;
      const bmiValue = w / (heightInMeters * heightInMeters);
      
      let cat = 'Normal';
      let col = COLORS.normal;
      
      if (bmiValue < 18.5) { cat = 'Underweight'; col = COLORS.underweight; }
      else if (bmiValue >= 25 && bmiValue < 30) { cat = 'Overweight'; col = COLORS.overweight; }
      else if (bmiValue >= 30) { cat = 'Obese'; col = COLORS.obese; }

      return { val: bmiValue.toFixed(1), cat, col };
    }
    return { val: null, cat: '', col: COLORS.textMuted };
  };

  const bmi = calculateBMI();

  // ==========================================
  // DISPATCH CONTROLLER & VALIDATOR
  // ==========================================
  const handleNextStep = async () => {
    if (isLoading) return;

    if (!age.trim()) {
      triggerSafetyWarning("Missing Metrics", "Please fill in your age before proceeding.");
      return;
    }
    if (heightUnit === 'cm') {
      if (!height.trim()) {
        triggerSafetyWarning("Missing Metrics", "Please specify your height in centimeters.");
        return;
      }
    } else {
      if (!heightFt.trim() && !heightIn.trim()) {
        triggerSafetyWarning("Missing Metrics", "Please specify your height in feet and inches.");
        return;
      }
    }
    if (!weight.trim()) {
      triggerSafetyWarning("Missing Metrics", "Please fill in your weight metric.");
      return;
    }

    const finalWeightKg = getWeightInKg();
    const finalHeightCm = getHeightInCm();

    if (finalWeightKg <= 0 || finalHeightCm <= 0) {
      triggerSafetyWarning("Invalid Metrics", "Please provide realistic metric measurement configurations.");
      return;
    }

    setIsLoading(true);
    try {
      await onNext?.({
        age: parseInt(age, 10),
        weight: finalWeightKg,
        height: finalHeightCm,
        weightUnit: weightUnit,
        startingWeight: parseFloat(weight)
      });
    } catch (err) {
      console.log("Navigation Execution Error: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // RENDER UI LAYOUT BLOCKS
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.base} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* PAGE HEADER SECTOR */}
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 1 OF 3</Text>
            <Text style={styles.brandTitle}>Your Baseline</Text>
            <Text style={styles.brandSubtitle}>
              Let's establish your starting metrics so we can track your progress.
            </Text>
          </View>

          {/* CENTRAL CARD SYSTEM */}
          <View style={styles.formCard}>

            {/* FIELD BLOCK: AGE */}
            <View style={styles.inputGroup}>
              <View style={styles.rowLabelWrapper}>
                <Text style={styles.inputLabel}>Age</Text>
              </View>
              <View style={styles.flatInputField}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your age"
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* FIELD BLOCK: HEIGHT */}
            <View style={styles.inputGroup}>
              <View style={styles.rowLabelWrapper}>
                <Text style={styles.inputLabel}>Height (ft/in)</Text>
              </View>

              <View style={styles.splitInputRow}>
                <View style={[styles.flatInputField, { flex: 1, marginRight: 10 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="ft"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={heightFt}
                    onChangeText={setHeightFt}
                    keyboardType="numeric"
                    autoCorrect={false}
                  />
                </View>
                <View style={[styles.flatInputField, { flex: 1 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="in"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={heightIn}
                    onChangeText={setHeightIn}
                    keyboardType="numeric"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </View>

            {/* FIELD BLOCK: WEIGHT */}
            <View style={styles.inputGroup}>
              <View style={styles.rowLabelWrapper}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
              </View>
              
              <View style={styles.flatInputField}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter weight in kg"
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* DYNAMIC BMI MONITOR SECTION */}
            <View style={styles.bmiPanelRecess}>
              {bmi.val ? (
                <View style={styles.bmiContentCenter}>
                  <Text style={styles.bmiLabel}>Estimated BMI</Text>
                  <Text style={styles.bmiNumber}>{bmi.val}</Text>
                  <Text style={[styles.bmiCategory, { color: bmi.col }]}>
                    {bmi.cat}
                  </Text>
                </View>
              ) : (
                <Text style={styles.bmiPlaceholder}>
                  Enter weight and height configuration parameters to calculate baseline BMI values.
                </Text>
              )}
            </View>

            {/* FORM SUBMISSION DISPATCH TRIGGER */}
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleNextStep}
              style={[
                styles.buttonBase,
                isPressed ? styles.buttonPressed : styles.buttonUnpressed,
              ]}
            >
              <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
                {isLoading ? "Processing..." : "Continue"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
