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
} from 'react-native';

export default function StepOneScreen({ onNext }) {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // BMI CALCULATION
  let bmiValue = null;
  let bmiCategory = '';
  let bmiColor = '#657786';

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
        bmiColor = '#2F855A';
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>

          {/* HEADER */}
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 1 OF 3</Text>
            <Text style={styles.brandTitle}>Your Baseline</Text>
            <Text style={styles.brandSubtitle}>
              Let's establish your starting metrics so we can track your progress.
            </Text>
          </View>

          {/* FORM */}
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
                />
              </View>

              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 66"
                  placeholderTextColor="#A4B0BE"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
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
                />
              </View>

              {/* BMI */}
              <View style={styles.bmiPanel}>
                {bmiValue ? (
                  <>
                    <Text style={styles.bmiLabel}>Estimated BMI</Text>
                    <Text style={styles.bmiNumber}>{bmiValue}</Text>
                    <Text style={[styles.bmiCategory, { color: bmiColor }]}>
                      {bmiCategory}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.bmiPlaceholder}>
                    Enter weight and height to calculate BMI
                  </Text>
                )}
              </View>

              {/* BUTTON */}
              <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => setIsPressed(true)}
                onPressOut={() => setIsPressed(false)}
                onPress={handleNextStep}
                style={[
                  isPressed
                    ? styles.neumorphicInnerBtn
                    : styles.neumorphicOuterBtn,
                ]}
              >
                <Text style={styles.buttonText}>Continue →</Text>
              </TouchableOpacity>

            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const baseColor = '#E4E9F0';
const darkText = '#1A2332';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColor,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },

  stepIndicator: {
    fontSize: 12,
    fontWeight: '800',
    color: '#148F77',
    letterSpacing: 2,
  },

  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: darkText,
    marginTop: 10,
  },

  brandSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    color: '#657786',
  },

  formSectionShadowWhite: {
    borderRadius: 30,
    backgroundColor: baseColor,
    shadowColor: '#fff',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },

  formSectionShadowDark: {
    shadowColor: '#A6B4C5',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    borderRadius: 30,
  },

  formSection: {
    padding: 20,
    borderRadius: 30,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#657786',
    marginTop: 10,
  },

  inputContainer: {
    backgroundColor: '#D9E1EC',
    borderRadius: 12,
    marginTop: 6,
  },

  input: {
    padding: 14,
    color: darkText,
  },

  bmiPanel: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#D9E1EC',
    alignItems: 'center',
  },

  bmiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#657786',
  },

  bmiNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: darkText,
  },

  bmiCategory: {
    fontSize: 14,
    fontWeight: '700',
  },

  bmiPlaceholder: {
    color: '#657786',
    fontSize: 13,
    textAlign: 'center',
  },

  neumorphicOuterBtn: {
    marginTop: 20,
    backgroundColor: '#E4E9F0',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },

  neumorphicInnerBtn: {
    marginTop: 20,
    backgroundColor: '#D1D9E6',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#148F77',
  },
});