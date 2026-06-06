import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert
} from 'react-native';

// ==========================================
// THEME CONFIGURATION & BRANDING TOKENS
// ==========================================
const COLORS = {
  base: '#F0F4F2',
  whiteHighlight: '#FFFFFF',
  softGreenShadow: '#AEC2B7',
  logoGreen: '#4EA685',
  logoDarkShadow: '#37745D',
  logoLightHighlight: '#65D8AD',
  textDark: '#1A2B23',
  textMuted: '#556B60',
  textPlaceholder: '#7FA293',
  borderLight: '#D4E2DC',
  borderItem: '#E1E9E5',
  bgPill: '#E4ECE8',
  
  // BMI Status Colors
  underweight: '#2B6CB0',
  normal: '#4EA685',
  overweight: '#C05621',
  obese: '#C53030'
};

export default function StepOneScreen({ onNext }) {
  // --- Core Inputs ---
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  
  // --- Unit Tracking & Foot/Inches Sub-states ---
  const [weightUnit, setWeightUnit] = useState('kg'); // 'kg' | 'lbs'
  const [heightUnit, setHeightUnit] = useState('cm'); // 'cm' | 'ft'
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');

  // --- UI Interactivity ---
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // BUSINESS LOGIC & CONVERSIONS (DEBUG HUB)
  // ==========================================
  const getWeightInKg = () => {
    const wNum = parseFloat(weight);
    if (isNaN(wNum) || wNum <= 0) return 0;
    return weightUnit === 'lbs' ? wNum * 0.45359237 : wNum;
  };

  const getHeightInCm = () => {
    if (heightUnit === 'cm') {
      const hNum = parseFloat(height);
      return isNaN(hNum) || hNum <= 0 ? 0 : hNum;
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inch = parseFloat(heightIn) || 0;
      if (ft <= 0 && inch <= 0) return 0;
      return (ft * 12 + inch) * 2.54;
    }
  };

  // --- Dynamic BMI Engine ---
  const calculateBmiMetrics = () => {
    const wKg = getWeightInKg();
    const hCm = getHeightInCm();

    if (wKg <= 0 || hCm <= 0) return { val: null, cat: '', col: COLORS.textMuted };

    const hM = hCm / 100;
    const rawBmi = wKg / (hM * hM);
    const val = rawBmi.toFixed(1);

    if (rawBmi < 18.5) {
      return { val, cat: 'Underweight', col: COLORS.underweight };
    } else if (rawBmi <= 24.9) {
      return { val, cat: 'Normal Weight', col: COLORS.normal };
    } else if (rawBmi <= 29.9) {
      return { val, cat: 'Overweight', col: COLORS.overweight };
    } else {
      return { val, cat: 'Obese', col: COLORS.obese };
    }
  };

  const bmi = calculateBmiMetrics();

  // ==========================================
  // WORKFLOW SUBMISSION DISPATCHER
  // ==========================================
  const handleNextStep = async () => {
    if (isLoading) return;

    if (!age.trim()) {
      Alert.alert("Missing Metrics", "Please fill in your age before proceeding.");
      return;
    }
    if (heightUnit === 'cm' && !height.trim()) {
      Alert.alert("Missing Metrics", "Please fill in your height measurement.");
      return;
    }
    if (heightUnit === 'ft' && !heightFt.trim() && !heightIn.trim()) {
      Alert.alert("Missing Metrics", "Please specify your height in feet and inches.");
      return;
    }
    if (!weight.trim()) {
      Alert.alert("Missing Metrics", "Please fill in your weight metric.");
      return;
    }

    const finalWeightKg = getWeightInKg();
    const finalHeightCm = getHeightInCm();

    if (finalWeightKg <= 0 || finalHeightCm <= 0) {
      Alert.alert("Invalid Metrics", "Please provide realistic metric measurement configurations.");
      return;
    }

    setIsLoading(true);
    try {
      await onNext?.({
        age: parseInt(age, 10),
        weight: finalWeightKg,
        height: finalHeightCm
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
              <View style={styles.neumorphicInputInset}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 21"
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* FIELD BLOCK: HEIGHT WITH INTEGRATED SWITCH SWITCHERS */}
            <View style={styles.inputGroup}>
              <View style={styles.rowLabelWrapper}>
                <Text style={styles.inputLabel}>Height</Text>
                <View style={styles.togglePillContainer}>
                  <TouchableOpacity 
                    style={[styles.toggleBtn, heightUnit === 'cm' && styles.toggleBtnActive]}
                    onPress={() => setHeightUnit('cm')}
                  >
                    <Text style={[styles.toggleBtnText, heightUnit === 'cm' && styles.toggleBtnTextActive]}>cm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toggleBtn, heightUnit === 'ft' && styles.toggleBtnActive]}
                    onPress={() => setHeightUnit('ft')}
                  >
                    <Text style={[styles.toggleBtnText, heightUnit === 'ft' && styles.toggleBtnTextActive]}>ft/in</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {heightUnit === 'cm' ? (
                <View style={styles.neumorphicInputInset}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 175"
                    placeholderTextColor={COLORS.textPlaceholder}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    autoCorrect={false}
                  />
                </View>
              ) : (
                <View style={styles.splitInputRow}>
                  <View style={[styles.neumorphicInputInset, { flex: 1, marginRight: 10 }]}>
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
                  <View style={[styles.neumorphicInputInset, { flex: 1 }]}>
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
              )}
            </View>

            {/* FIELD BLOCK: WEIGHT WITH INTEGRATED SWITCH SWITCHERS */}
            <View style={styles.inputGroup}>
              <View style={styles.rowLabelWrapper}>
                <Text style={styles.inputLabel}>Weight</Text>
                <View style={styles.togglePillContainer}>
                  <TouchableOpacity 
                    style={[styles.toggleBtn, weightUnit === 'kg' && styles.toggleBtnActive]}
                    onPress={() => setWeightUnit('kg')}
                  >
                    <Text style={[styles.toggleBtnText, weightUnit === 'kg' && styles.toggleBtnTextActive]}>kg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toggleBtn, weightUnit === 'lbs' && styles.toggleBtnActive]}
                    onPress={() => setWeightUnit('lbs')}
                  >
                    <Text style={[styles.toggleBtnText, weightUnit === 'lbs' && styles.toggleBtnTextActive]}>lbs</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.neumorphicInputInset}>
                <TextInput
                  style={styles.input}
                  placeholder={weightUnit === 'kg' ? "e.g. 66" : "e.g. 145"}
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
const styles = StyleSheet.create({
  // --- Architectural Core Blocks ---
  container: { 
    flex: 1, 
    backgroundColor: COLORS.base 
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
    color: '#21332A', 
    letterSpacing: -0.5, 
    marginTop: 6 
  },
  brandSubtitle: { 
    fontSize: 14, 
    color: COLORS.textMuted, 
    marginTop: 10, 
    textAlign: 'center', 
    lineHeight: 22, 
    fontWeight: '700' 
  },
  
  // --- Surface Panel Structures ---
  formCard: {
    backgroundColor: COLORS.base,
    borderRadius: 40, 
    padding: 24,
    shadowColor: COLORS.softGreenShadow,
    shadowOffset: { width: 14, height: 14 }, 
    shadowOpacity: 1,
    shadowRadius: 16, 
    elevation: 12,    
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: COLORS.whiteHighlight,
    borderLeftColor: COLORS.whiteHighlight,
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
    color: '#41544B', 
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
    backgroundColor: COLORS.bgPill,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight
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
    color: COLORS.textMuted 
  },
  toggleBtnTextActive: { 
    color: COLORS.whiteHighlight 
  },

  // --- Core Form Elements ---
  neumorphicInputInset: {
    backgroundColor: COLORS.base,
    borderRadius: 24, 
    borderWidth: 1.5, 
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.logoGreen,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.35, 
    shadowRadius: 5,
  },
  input: { 
    flex: 1, 
    color: COLORS.textDark, 
    paddingHorizontal: 18, 
    paddingVertical: 15, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  
  // --- Metrics Display Panel Layouts ---
  bmiPanelRecess: {
    backgroundColor: COLORS.base,
    borderRadius: 24,
    padding: 20,
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.logoGreen,
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    color: COLORS.textMuted, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  bmiNumber: { 
    fontSize: 38, 
    fontWeight: '900', 
    color: COLORS.textDark, 
    marginVertical: 4 
  },
  bmiCategory: { 
    fontSize: 15, 
    fontWeight: '800' 
  },
  bmiPlaceholder: { 
    color: COLORS.textPlaceholder, 
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
    backgroundColor: '#53B28E', 
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: COLORS.logoLightHighlight,
    borderLeftColor: COLORS.logoLightHighlight,
    shadowColor: COLORS.logoDarkShadow,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.95,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonPressed: { 
    backgroundColor: '#3E836A', 
    borderWidth: 1.5, 
    borderColor: COLORS.logoDarkShadow, 
    transform: [{ translateY: 2 }] 
  },
  buttonText: { 
    color: COLORS.whiteHighlight, 
    fontSize: 16, 
    fontWeight: '800', 
    letterSpacing: 0.5, 
    textShadowColor: COLORS.logoDarkShadow, 
    textShadowOffset: { width: 0, height: 1 }, 
    textShadowRadius: 2 
  },
  buttonTextPressed: { 
    color: '#9EDEC4' 
  },
});