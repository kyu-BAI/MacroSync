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

export default function StepOneScreen({ onNext }) {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // BMI CALCULATION (Untouched logic)
  let bmiValue = null;
  let bmiCategory = '';
  let bmiColor = '#556B60';

  if (weight && height) {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height) / 100;

    if (weightNum > 0 && heightNum > 0) {
      const rawBmi = weightNum / (heightNum * heightNum);
      bmiValue = rawBmi.toFixed(1);

      if (rawBmi < 18.5) {
        bmiCategory = 'Underweight';
        bmiColor = '#2B6CB0'; 
      } else if (rawBmi <= 24.9) {
        bmiCategory = 'Normal Weight';
        bmiColor = '#4EA685'; 
      } else if (rawBmi <= 29.9) {
        bmiCategory = 'Overweight';
        bmiColor = '#C05621'; 
      } else {
        bmiCategory = 'Obese';
        bmiColor = '#C53030'; 
      }
    }
  }

  const handleNextStep = async () => {
    if (isLoading) return;

    // Strict client-side validation to guarantee all metrics are completely populated
    if (!age.trim() || !weight.trim() || !height.trim()) {
      Alert.alert(
        "Missing Metrics",
        "Please fill in your age, weight, and height before proceeding to the next step."
      );
      return;
    }

    setIsLoading(true);
    try {
      await onNext?.();
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={baseColor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* HEADER SECTION */}
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 1 OF 3</Text>
            <Text style={styles.brandTitle}>Your Baseline</Text>
            <Text style={styles.brandSubtitle}>
              Let's establish your starting metrics so we can track your progress.
            </Text>
          </View>

          {/* FORM CARD CONTAINER */}
          <View style={styles.formCard}>

            {/* Age input field container */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <View style={styles.neumorphicInputInset}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 21"
                  placeholderTextColor="#7FA293"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Weight input field container */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <View style={styles.neumorphicInputInset}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 66"
                  placeholderTextColor="#7FA293"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Height input field container */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <View style={styles.neumorphicInputInset}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 175"
                  placeholderTextColor="#7FA293"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* DYNAMIC BMI DISPLAY PANEL */}
            <View style={styles.bmiPanelRecess}>
              {bmiValue ? (
                <View style={styles.bmiContentCenter}>
                  <Text style={styles.bmiLabel}>Estimated BMI</Text>
                  <Text style={styles.bmiNumber}>{bmiValue}</Text>
                  <Text style={[styles.bmiCategory, { color: bmiColor }]}>
                    {bmiCategory}
                  </Text>
                </View>
              ) : (
                <Text style={styles.bmiPlaceholder}>
                  Enter weight and height to calculate BMI
                </Text>
              )}
            </View>

            {/* INTERACTIVE NAVIGATION BUTTON */}
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

// Uniform UI Design Token System Variables
const baseColor = '#F0F4F2';           
const clearWhiteHighlight = '#FFFFFF';    
const softGreenShadow = '#AEC2B7';      

// Logo Branding Metrics
const logoGreen = '#4EA685';        
const logoDarkShadow = '#37745D';   
const logoLightHighlight = '#65D8AD'; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColor,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerSection: {
    marginBottom: 35,
    alignItems: 'center',
    width: '100%',
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '900',
    color: logoGreen,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#21332A', 
    letterSpacing: -0.5,
    marginTop: 6,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#556B60',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '700',
  },
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
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    color: '#41544B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  neumorphicInputInset: {
    backgroundColor: baseColor,
    borderRadius: 24, 
    borderWidth: 1.5, 
    borderColor: '#D4E2DC',
    shadowColor: logoGreen,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.35, 
    shadowRadius: 5,
  },
  input: {
    flex: 1,
    color: '#1A2B23',
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    fontWeight: '700',
  },
  bmiPanelRecess: {
    backgroundColor: baseColor,
    borderRadius: 24,
    padding: 20,
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
    shadowColor: logoGreen,
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 110,
  },
  bmiContentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#556B60',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bmiNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: '#1A2B23',
    marginVertical: 4,
  },
  bmiCategory: {
    fontSize: 15,
    fontWeight: '800',
  },
  bmiPlaceholder: {
    color: '#7FA293',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: logoDarkShadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonTextPressed: {
    color: '#9EDEC4',
  },
});