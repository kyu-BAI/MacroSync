import React, { useState } from "react";
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
  Alert,
} from "react-native";
import { KeyRound, ChevronLeft } from 'lucide-react-native';

export default function OtpScreen({ email, onVerified, onNavigateBack }) {
  const [otp, setOtp] = useState("");
  const [isPressed, setIsPressed] = useState(false);

  // --- OTP VERIFICATION LIFE CYCLES (100% Untouched Backend Integration) ---
  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert("Missing OTP", "Please enter the OTP code.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/verify-reset-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp: otp.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "OTP verified successfully.");
        onVerified(); // Moves cleanly to reset password screen
      } else {
        Alert.alert("Invalid OTP", data.detail || "Verification failed.");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Connection Error", "Unable to connect to backend.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={baseColor} />
      
      {/* Upper Left Neumorphic Back Button Row - Perfectly Aligned and Styled */}
      <View style={styles.topNavigationRow}>
        <TouchableOpacity 
          style={styles.backArrowButton} 
          onPress={onNavigateBack}
          activeOpacity={0.7}
        >
          <ChevronLeft color={logoGreen} size={24} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flexContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.brandTitle}>Verify OTP</Text>
            <Text style={styles.brandSubtitle}>We sent a code to:</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Form Card Group - High Intensity Neumorphic Extrusion Layout */}
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>OTP Code</Text>

            {/* Structured Input Row with Vector Badge Icon */}
            <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
              <KeyRound color="#7FA293" size={20} style={styles.leadingIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#7FA293"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
                autoCorrect={false}
              />
            </View>

            {/* Action Trigger Verification Button */}
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleVerifyOTP}
              style={[
                styles.buttonBase,
                isPressed ? styles.buttonPressed : styles.buttonUnpressed
              ]}
            >
              <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
                Verify OTP
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Unified High-Contrast Hybrid Neumorphic Theme Tokens
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
  flexContainer: {
    flex: 1,
  },
  topNavigationRow: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 16, 
    marginTop: Platform.OS === 'android' ? 20 : 0, 
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  backArrowButton: {
    padding: 10,
    backgroundColor: baseColor,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 30,  
    marginLeft: 5,  
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  headerSection: {
    marginBottom: 45,
    alignItems: "center",
    width: '100%',
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: logoGreen, 
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#556B60',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '700',
  },
  emailText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "900",
    color: "#21332A",
    backgroundColor: '#E4ECE8',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
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
    marginBottom: 26,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leadingIcon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: '#1A2B23',
    paddingVertical: 15,
    paddingHorizontal: 8,
    fontSize: 18,
    fontWeight: '800',
    textAlign: "center",
    letterSpacing: 4,
  },
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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