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
  Alert,
} from "react-native";

export default function OtpScreen({
  email,
  onVerified,
  onNavigateBack,
}) {
  const [otp, setOtp] = useState("");
  const [isPressed, setIsPressed] = useState(false);

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
        onVerified(); // go to reset password screen
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            <Text style={styles.brandTitle}>Verify OTP</Text>

            <Text style={styles.brandSubtitle}>
              We sent a code to:
            </Text>

            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={[styles.neumorphicOuter, styles.formSection]}>
            <Text style={styles.inputLabel}>OTP CODE</Text>

            <View style={styles.neumorphicInner}>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#A0AAB8"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleVerifyOTP}
              style={
                isPressed
                  ? styles.neumorphicInnerBtn
                  : styles.neumorphicOuterBtn
              }
            >
              <Text
                style={[
                  styles.buttonText,
                  isPressed && styles.buttonTextPressed,
                ]}
              >
                Verify OTP
              </Text>
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

const baseColor = "#E0E5EC";
const lightShadow = "#FFFFFF";
const darkShadow = "#B8C4D2";
const accentColor = "#00a3cc";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColor,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  headerSection: {
    marginBottom: 35,
    alignItems: "center",
  },

  brandTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2D3748",
  },

  brandSubtitle: {
    fontSize: 15,
    color: "#718096",
    marginTop: 8,
    textAlign: "center",
  },

  emailText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "bold",
    color: "#2D3748",
  },

  formSection: {
    padding: 24,
    borderRadius: 28,
  },

  inputLabel: {
    color: "#4A5568",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    textTransform: "uppercase",
  },

  input: {
    color: "#2D3748",
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 4,
  },

  buttonText: {
    color: "#2D3748",
    fontSize: 16,
    fontWeight: "bold",
  },

  buttonTextPressed: {
    color: "#718096",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },

  linkText: {
    color: accentColor,
    fontSize: 14,
    fontWeight: "bold",
  },

  neumorphicOuter: {
    backgroundColor: baseColor,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopColor: lightShadow,
    borderLeftColor: lightShadow,
    borderBottomColor: darkShadow,
    borderRightColor: darkShadow,
  },

  neumorphicInner: {
    backgroundColor: baseColor,
    borderRadius: 14,
    marginBottom: 25,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopColor: darkShadow,
    borderLeftColor: darkShadow,
    borderBottomColor: lightShadow,
    borderRightColor: lightShadow,
  },

  neumorphicOuterBtn: {
    backgroundColor: baseColor,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopColor: lightShadow,
    borderLeftColor: lightShadow,
    borderBottomColor: darkShadow,
    borderRightColor: darkShadow,
  },

  neumorphicInnerBtn: {
    backgroundColor: baseColor,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopColor: darkShadow,
    borderLeftColor: darkShadow,
    borderBottomColor: lightShadow,
    borderRightColor: lightShadow,
  },
});