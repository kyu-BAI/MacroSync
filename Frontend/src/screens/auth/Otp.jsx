// --- IMPORTS ---
import React, { useState, useEffect, useMemo } from "react";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyRound, ChevronLeft } from "lucide-react-native";

import API_URL from "../config/api";
import { useCustomAlert } from "../../context/CustomAlertContext";
import { useTheme } from "../../context/ThemeContext";

// --- CONFIG & THEME TOKENS ---
const COLORS = {
  base: "#F8FAFC",
  logoGreen: "#10B981",
  logoGreenPressed: "#059669",
  textDark: "#0F172A",
  textGrey: "#64748B",
  textMuted: "#94A3B8",
  borderLight: "#E2E8F0",
  cardBgLight: "#F1F5F9",
  white: "#FFFFFF",
};

// --- SUBCOMPONENTS ---

// 1. Resend Code Action Row
function ResendRow({ isResending, resendCooldown, onResend, styles }) {
  return (
    <View style={styles.resendContainer}>
      <Text style={styles.resendText}>Didn't receive code? </Text>
      <TouchableOpacity
        disabled={isResending || resendCooldown > 0}
        onPress={onResend}
        activeOpacity={0.7}
        style={styles.resendButton}
      >
        {isResending ? (
          <ActivityIndicator size="small" color={COLORS.logoGreen} />
        ) : (
          <Text
            style={[
              styles.resendLink,
              resendCooldown > 0 && styles.resendLinkDisabled,
            ]}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// 2. Primary Verify Action Button
function VerifyButton({ isLoading, isPressed, onPress, onPressIn, onPressOut, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isLoading}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      style={[
        styles.buttonBase,
        isPressed ? styles.buttonPressed : styles.buttonUnpressed,
      ]}
    >
      {isLoading ? (
        <View style={styles.buttonLoadingRow}>
          <ActivityIndicator size="small" color={COLORS.white} style={styles.buttonSpinner} />
          <Text style={[styles.buttonText, styles.buttonLoadingText]}>Verifying OTP...</Text>
        </View>
      ) : (
        <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
          Verify OTP
        </Text>
      )}
    </TouchableOpacity>
  );
}

// --- MAIN OTP SCREEN ---
export default function OtpScreen({ email, onVerified, onNavigateBack }) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [otp, setOtp] = useState("");
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Resend OTP Cooldown State
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Resend OTP Handler with 15s Timeout
  const handleResendOTP = async () => {
    if (isResending || resendCooldown > 0) return;
    setIsResending(true);

    try {
      const cleanEmail = (email || "").trim();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        showAlert("OTP Resent", "A new OTP code has been sent to your email.");
        setResendCooldown(30);
      } else {
        const data = await response.json().catch(() => ({}));
        showAlert("Resend Error", data.detail || "Failed to resend OTP code. Please try again.");
      }
    } catch (err) {
      console.log("RESEND OTP ERROR:", err);
      showAlert("Network Error", "Cannot connect to backend server. Make sure it is running.");
    } finally {
      setIsResending(false);
    }
  };

  // OTP Verification Lifecycle with 15s Timeout
  const handleVerifyOTP = async (codeToVerify) => {
    const targetOtp = (typeof codeToVerify === "string" ? codeToVerify : otp).trim();

    if (!targetOtp) {
      showAlert("Missing OTP", "Please enter the OTP code.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: (email || "").trim(),
          otp: targetOtp,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showAlert("Success", "OTP verified successfully.");
        if (onVerified) onVerified();
      } else {
        showAlert("Error", data.detail || "Invalid or expired OTP. Please try again.");
      }
    } catch (error) {
      console.log("VERIFY OTP ERROR:", error);
      showAlert(
        "Network Error",
        "Cannot connect to backend server. Make sure it is running and your IP is correct."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when user reaches 6th digit
  const handleOtpChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(numericText);
    if (numericText.length === 6) {
      handleVerifyOTP(numericText);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme?.background || COLORS.base}
      />

      {/* Top Navigation Row */}
      <View style={styles.topNavigationRow}>
        <TouchableOpacity
          style={styles.backArrowButton}
          onPress={onNavigateBack}
          activeOpacity={0.7}
        >
          <ChevronLeft color={COLORS.logoGreen} size={24} strokeWidth={2.5} />
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
            <Text style={styles.brandSubtitle}>We sent a verification code to:</Text>
            <View style={styles.emailBadgeContainer}>
              <Text style={styles.emailText}>{email}</Text>
            </View>
          </View>

          {/* Form Card Group */}
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>OTP Code</Text>

            {/* Input Row with Vector Badge Icon */}
            <View style={[styles.flatInputField, styles.fieldRow]}>
              <KeyRound
                color={theme?.textSecondary || COLORS.textMuted}
                size={20}
                style={styles.leadingIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={theme?.placeholderText || COLORS.textMuted}
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="numeric"
                maxLength={6}
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Action Trigger Verification Button */}
            <VerifyButton
              isLoading={isLoading}
              isPressed={isPressed}
              onPress={() => handleVerifyOTP()}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              styles={styles}
            />

            {/* Resend OTP Row */}
            <ResendRow
              isResending={isResending}
              resendCooldown={resendCooldown}
              onResend={handleResendOTP}
              styles={styles}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- COMPONENT STYLES ---
const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.background || COLORS.base,
    },
    flexContainer: {
      flex: 1,
    },
    topNavigationRow: {
      width: "100%",
      paddingHorizontal: 24,
      paddingTop: Platform.OS === "ios" ? 8 : 12,
      paddingBottom: 4,
      flexDirection: "row",
      justifyContent: "flex-start",
    },
    backArrowButton: {
      padding: 10,
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: 40,
    },
    headerSection: {
      marginBottom: 32,
      alignItems: "center",
      width: "100%",
    },
    brandTitle: {
      fontSize: 36,
      fontWeight: "900",
      color: COLORS.logoGreen,
      letterSpacing: -0.5,
      textAlign: "center",
    },
    brandSubtitle: {
      fontSize: 14,
      color: theme?.textSecondary || COLORS.textGrey,
      marginTop: 8,
      textAlign: "center",
      lineHeight: 20,
      fontWeight: "700",
    },
    emailBadgeContainer: {
      marginTop: 10,
      alignSelf: "center",
    },
    emailText: {
      fontSize: 14.5,
      fontWeight: "800",
      color: theme?.textPrimary || COLORS.textDark,
      backgroundColor: theme?.cardBg || COLORS.cardBgLight,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
      overflow: "hidden",
      textAlign: "center",
    },
    formCard: {
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.2 : 0.035,
      shadowRadius: 8,
      elevation: 1,
    },
    inputLabel: {
      color: theme?.textPrimary || COLORS.textGrey,
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginLeft: 6,
    },
    flatInputField: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme?.inputBorder || COLORS.borderLight,
      marginBottom: 24,
    },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    leadingIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      color: theme?.textPrimary || COLORS.textDark,
      paddingVertical: 14,
      paddingHorizontal: 8,
      fontSize: 20,
      fontWeight: "800",
      textAlign: "center",
      letterSpacing: 6,
    },
    buttonBase: {
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    buttonUnpressed: {
      backgroundColor: COLORS.logoGreen,
    },
    buttonPressed: {
      backgroundColor: COLORS.logoGreenPressed,
      opacity: 0.9,
    },
    buttonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    buttonTextPressed: {
      color: COLORS.borderLight,
    },
    buttonLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    buttonSpinner: {
      marginRight: 8,
    },
    buttonLoadingText: {
      opacity: 0.95,
    },
    resendContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    resendText: {
      fontSize: 13,
      color: theme?.textSecondary || COLORS.textGrey,
      fontWeight: "600",
    },
    resendButton: {
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    resendLink: {
      fontSize: 13,
      color: COLORS.logoGreen,
      fontWeight: "800",
    },
    resendLinkDisabled: {
      color: theme?.textSecondary || COLORS.textMuted,
      opacity: 0.7,
    },
  });

