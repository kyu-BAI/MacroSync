import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function OtpScreen({ onVerifySuccess, onNavigateBack }) {
  const [otp, setOtp] = useState('');
  const [isPressed, setIsPressed] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerSection}>
            <Text style={styles.brandTitle}>Enter Code</Text>
            <Text style={styles.brandSubtitle}>Type the 6-digit verification security OTP pin sent to your email inbox.</Text>
          </View>

          <View style={[styles.neumorphicOuter, styles.formSection]}>
            <Text style={styles.inputLabel}>Verification Pin</Text>
            <View style={styles.neumorphicInner}>
              <TextInput 
                style={styles.input}
                placeholder="0 0 0 0 0 0"
                placeholderTextColor="#A0AAB8"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
                letterSpacing={8}
                textAlign="center"
              />
            </View>

            <TouchableOpacity 
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={onVerifySuccess}
              style={isPressed ? styles.neumorphicInnerBtn : styles.neumorphicOuterBtn}
            >
              <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>Verify Code</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <TouchableOpacity onPress={onNavigateBack}>
                <Text style={styles.linkText}>← Back</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const baseColor = '#E0E5EC'; 
const lightShadow = '#FFFFFF'; 
const darkShadow = '#B8C4D2'; 
const accentColor = '#00a3cc';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: baseColor },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  headerSection: { marginBottom: 35, alignItems: 'center' },
  brandTitle: { fontSize: 32, fontWeight: 'bold', color: '#2D3748' },
  brandSubtitle: { fontSize: 15, color: '#718096', marginTop: 8, textAlign: 'center', lineHeight: 22 },
  formSection: { padding: 24, borderRadius: 28 },
  inputLabel: { color: '#4A5568', fontSize: 12, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  input: { color: '#2D3748', paddingVertical: 15, fontSize: 22, fontWeight: 'bold' },
  buttonText: { color: '#2D3748', fontSize: 16, fontWeight: 'bold' },
  buttonTextPressed: { color: '#718096' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  linkText: { color: accentColor, fontSize: 14, fontWeight: 'bold' },
  neumorphicOuter: { backgroundColor: baseColor, borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderTopColor: lightShadow, borderLeftColor: lightShadow, borderBottomColor: darkShadow, borderRightColor: darkShadow, elevation: 4 },
  neumorphicInner: { backgroundColor: baseColor, borderRadius: 14, marginBottom: 25, borderTopWidth: 3, borderLeftWidth: 3, borderBottomWidth: 1, borderRightWidth: 1, borderTopColor: darkShadow, borderLeftColor: darkShadow, borderBottomColor: lightShadow, borderRightColor: lightShadow },
  neumorphicOuterBtn: { backgroundColor: baseColor, paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderTopColor: lightShadow, borderLeftColor: lightShadow, borderBottomColor: darkShadow, borderRightColor: darkShadow, elevation: 2 },
  neumorphicInnerBtn: { backgroundColor: baseColor, paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderTopWidth: 3, borderLeftWidth: 3, borderBottomWidth: 1, borderRightWidth: 1, borderTopColor: darkShadow, borderLeftColor: darkShadow, borderBottomColor: lightShadow, borderRightColor: lightShadow, transform: [{ translateY: 1.5 }] },
});