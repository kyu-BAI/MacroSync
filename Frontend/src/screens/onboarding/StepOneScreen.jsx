import React, { useState } from 'react';
import {
  StyleSheet,
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
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
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
    if (!heightFt.trim() && !heightIn.trim()) {
      triggerSafetyWarning("Missing Metrics", "Please specify your height in feet and inches.");
      return;
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
              <Text style={styles.inputLabel}>Age</Text>
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

// ==========================================
// STYLE DEFINITIONS SYSTEM Namespace Architecture
// ==========================================
const getStyles = (theme) => StyleSheet.create({
  // --- Architectural Core Blocks ---
  container: { 
    flex: 1, 
    backgroundColor: theme?.background || COLORS.base 
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16 
  },
  
  // --- Typography Header Formatting ---
  headerSection: { 
    marginBottom: 35, 
    alignItems: 'center', 
    width: '100%' 
  },
  stepIndicator: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: COLORS.logoGreen, 
    letterSpacing: 2, 
    textTransform: 'uppercase' 
  },
  brandTitle: { 
    fontSize: 42, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A', 
    letterSpacing: -0.5, 
    marginTop: 6 
  },
  brandSubtitle: { 
    fontSize: 14, 
    color: theme?.textSecondary || COLORS.textMuted, 
    marginTop: 10, 
    textAlign: 'center', 
    lineHeight: 22, 
    fontWeight: '700' 
  },
  
  // --- Surface Panel Structures ---
  formCard: {
    backgroundColor: theme?.surface || COLORS.base,
    borderRadius: 28, 
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme?.border || COLORS.borderLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  inputGroup: { 
    marginBottom: 22 
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
  splitInputRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  
  // --- Unit Selector Controls ---
  togglePillContainer: {
    flexDirection: 'row',
    backgroundColor: theme?.cardBg || COLORS.bgPill,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: theme?.border || COLORS.borderLight
  },
  toggleBtn: { 
    paddingVertical: 4, 
    paddingHorizontal: 10, 
    borderRadius: 9 
  },
  toggleBtnActive: { 
    backgroundColor: COLORS.logoGreen 
  },
  toggleBtnText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: theme?.textSecondary || COLORS.textMuted 
  },
  toggleBtnTextActive: { 
    color: COLORS.whiteHighlight 
  },

  // --- Core Form Elements ---
  flatInputField: {
    backgroundColor: theme?.inputBg || COLORS.base,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || COLORS.borderLight,
  },
  input: { 
    flex: 1, 
    color: theme?.textPrimary || COLORS.textDark, 
    paddingHorizontal: 18, 
    paddingVertical: 15, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  
  // --- Metrics Display Panel Layouts ---
  bmiPanelRecess: {
    backgroundColor: theme?.inputBg || COLORS.base,
    borderRadius: 16,
    padding: 20,
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 110,
  },
  bmiContentCenter: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  bmiLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: theme?.textSecondary || COLORS.textMuted, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  bmiNumber: { 
    fontSize: 38, 
    fontWeight: '900', 
    color: theme?.textPrimary || COLORS.textDark, 
    marginVertical: 4 
  },
  bmiCategory: { 
    fontSize: 15, 
    fontWeight: '800' 
  },
  bmiPlaceholder: { 
    color: theme?.textSecondary || COLORS.textPlaceholder, 
    fontSize: 13, 
    fontWeight: '700', 
    textAlign: 'center', 
    lineHeight: 20 
  },
  
  // --- Dispatch Button States ---
  buttonBase: { 
    paddingVertical: 16, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
    marginTop: 16 
  },
  buttonUnpressed: {
    backgroundColor: COLORS.logoGreen,
    borderRadius: 20,
  },
  buttonPressed: { 
    backgroundColor: '#059669',
    opacity: 0.85,
  },
  buttonText: { 
    color: COLORS.whiteHighlight, 
    fontSize: 16, 
    fontWeight: '800', 
    letterSpacing: 0.5, 
  },
  buttonTextPressed: { 
    color: '#E2E8F0' 
  },
});