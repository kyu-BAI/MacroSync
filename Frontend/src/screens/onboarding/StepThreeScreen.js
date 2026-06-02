import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';

export default function StepThreeScreen({ onComplete }) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 3 OF 3</Text>
            <Text style={styles.brandTitle}>Preferences</Text>
            <Text style={styles.brandSubtitle}>Customize your data matrix so MacroSync can calibrate localized meal options.</Text>
          </View>
          <Text style={styles.calculatingText}>Calibrating targets...</Text>

          <TouchableOpacity 
            activeOpacity={1}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            onPress={onComplete}
            style={[isPressed ? styles.neumorphicInnerBtn : styles.neumorphicOuterBtn, { marginTop: 40 }]}
          >
            <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>Enter Dashboard</Text>
          </TouchableOpacity>

            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Global Theme Stylesheet System Configuration (Option 1 - Slate Gray Base)
const baseColor = '#E4E9F0';    
const lightShadow = '#FFFFFF';  
const darkShadow = '#A6B4C5';   
const accentColor = '#148F77'; // Consistent Logo Teal
const darkTextBlue = '#1A2332'; 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: baseColor },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 30 },
  headerSection: { marginBottom: 40, alignItems: 'center', width: '100%' },
  stepIndicator: { fontSize: 11, fontWeight: '800', color: accentColor, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  brandTitle: { fontSize: 40, fontWeight: '800', color: darkTextBlue, letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 14, color: '#657786', marginTop: 12, textAlign: 'center', lineHeight: 22, fontWeight: '500', paddingHorizontal: 20 },
  formSection: { padding: 26, borderRadius: 36, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' },
  formSectionShadowWhite: { borderRadius: 36, backgroundColor: baseColor, shadowColor: lightShadow, shadowOffset: { width: -7, height: -7 }, shadowOpacity: 1.0, shadowRadius: 8, margin: 10 },
  formSectionShadowDark: { backgroundColor: baseColor, shadowColor: darkShadow, shadowOffset: { width: 7, height: 7 }, shadowOpacity: 1.0, shadowRadius: 10, borderRadius: 36, elevation: 8 },
  inputLabel: { color: '#657786', fontSize: 11, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 6 },
  inputContainer: { backgroundColor: '#D9E1EC', borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  input: { color: darkTextBlue, paddingHorizontal: 18, paddingVertical: 16, fontSize: 15, fontWeight: '500' },

  /* --- SELECTION CHIPS FOR DIET SELECTIONS --- */
  dietOptionsContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 12 },
  chipInactiveWrap: { width: '31%', borderRadius: 14, backgroundColor: baseColor, shadowColor: lightShadow, shadowOffset: { width: -3, height: -3 }, shadowOpacity: 1.0, shadowRadius: 4, marginBottom: 12 },
  chipActiveWrap: { width: '31%', borderRadius: 14, backgroundColor: baseColor, shadowColor: darkShadow, shadowOffset: { width: 1, height: 1 }, shadowOpacity: 0.25, shadowRadius: 2, marginBottom: 12 },
  chipInner: { paddingVertical: 12, paddingHorizontal: 4, borderRadius: 14, backgroundColor: baseColor, shadowColor: darkShadow, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.7, shadowRadius: 4, elevation: 2, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
  chipInnerActive: { backgroundColor: '#D9E1EC', shadowColor: lightShadow, shadowOffset: { width: -1, height: -1 }, shadowOpacity: 1.0, shadowRadius: 2, elevation: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  chipTitle: { fontSize: 12, fontWeight: '800', color: darkTextBlue, textAlign: 'center', marginBottom: 2 },
  chipDesc: { fontSize: 9, color: '#657786', fontWeight: '600', textAlign: 'center' },

  /* --- BRAND ACTION BUTTON SINGLE-TAP SPEC --- */
  btnShadowWhite: { borderRadius: 16, backgroundColor: baseColor, shadowColor: lightShadow, shadowOffset: { width: -4, height: -4 }, shadowOpacity: 0.9, shadowRadius: 5, marginTop: 10 },
  btnShadowDark: { borderRadius: 16, backgroundColor: baseColor, shadowColor: darkShadow, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
  buttonPressedContainer: { width: '100%', borderRadius: 16, backgroundColor: '#0E6655', marginTop: 10 },
  buttonBaseLayout: { borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%', height: 54 },
  buttonInnerUnpressed: { backgroundColor: accentColor },
  buttonInnerPressed: { backgroundColor: '#0E6655', transform: [{ translateY: 1.5 }] },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  buttonTextPressed: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }
});