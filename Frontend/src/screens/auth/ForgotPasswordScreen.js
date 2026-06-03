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

export default function ForgotPasswordScreen({ onNavigateBack, onOtpSent }) {
  const [email, setEmail] = useState("");
  const [isPressed, setIsPressed] = useState(false);

  const handleForgotPassword = async () => {
    try {
      const API = process.env.EXPO_PUBLIC_API_URL;

      console.log("Calling:", `${API}/forgot-password`);

      const response = await fetch(`${API}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      console.log("Response:", data);

      if (response.ok) {
        onOtpSent(email.trim());
      } else {
        alert(data.detail || "Failed to send OTP");
      }
    } catch (error) {
      console.log("Forgot Password Error:", error);
      alert("Cannot connect to backend");
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
            <Text style={styles.brandTitle}>Recover Account</Text>

            <Text style={styles.brandSubtitle}>
              Enter your registered email address below.
            </Text>
          </View>

          <View style={[styles.neumorphicOuter, styles.formSection]}>
            <Text style={styles.inputLabel}>Email Address</Text>

            <View style={styles.neumorphicInner}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#A0AAB8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleForgotPassword}
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
                Send Reset Email
              </Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <TouchableOpacity onPress={onNavigateBack}>
                <Text style={styles.linkText}>← Back to Login</Text>
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
    letterSpacing: 1,
    marginLeft: 4,
  },

  input: {
    color: "#2D3748",
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
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
    elevation: 4,
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
    elevation: 2,
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
    transform: [{ translateY: 1.5 }],
  },
});
