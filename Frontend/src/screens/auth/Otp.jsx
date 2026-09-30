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
import { Ionicons } from "@expo/vector-icons";

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
  cardBgLight: "#EBEBEB",
  bgPill: "#F1F5F9",
  dangerRed: "#EF4444",
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
function VerifyButton({ isLoading, onPress, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isLoading}
      onPress={onPress}
      style={[styles.buttonBase, styles.buttonUnpressed]}
    >
      {isLoading ? (
        <View style={styles.buttonLoadingRow}>
          <ActivityIndicator size="small" color={COLORS.white} style={styles.buttonSpinner} />
          <Text style={[styles.buttonText, styles.buttonLoadingText]}>Verifying OTP...</Text>
        </View>
      ) : (
        <View style={styles.buttonLoadingRow}>
          <Text style={styles.buttonText}>Verify OTP</Text>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={COLORS.white}
            style={{ marginLeft: 8 }}
          />
        </View>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Sector (Consistent with Step 1 - 4) */}
          <View style={styles.headerSection}>
            {Boolean(onNavigateBack) && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onNavigateBack}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={theme?.textPrimary || COLORS.textDark}
                />
              </TouchableOpacity>
            )}
            <Text style={styles.stepIndicator}>SECURITY VERIFICATION</Text>
            <Text style={styles.brandTitle}>Verify OTP</Text>
            <Text style={styles.brandSubtitle}>
              We sent a 6-digit verification code to{" "}
              <Text style={styles.emailHighlight}>{email}</Text>. Enter the code below to proceed.
            </Text>
          </View>

          {/* Form Card (Consistent with Step 1 - 4) */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.rowLabelWrapper}>
                <Text style={styles.inputLabel}>6-Digit Verification Code</Text>
              </View>

              {/* Input Row with Vector Badge Icon */}
              <View style={[styles.flatInputField, styles.fieldRow]}>
                <Ionicons
                  name="key-outline"
                  size={20}
                  color={COLORS.logoGreen}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      letterSpacing: otp.length > 0 ? 8 : 0,
                      fontSize: otp.length > 0 ? 22 : 15,
                    },
                  ]}
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
            </View>

            {/* Action Trigger Verification Button */}
            <VerifyButton
              isLoading={isLoading}
              onPress={() => handleVerifyOTP()}
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

// --- COMPONENT STYLES (CONSISTENT WITH STEP 1 - 4 DESIGN LANGUAGE) ---
const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.background || COLORS.base,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingBottom: 30,
      paddingTop: Platform.OS === "ios" ? 30 : 20,
    },
    headerSection: {
      marginBottom: 24,
      alignItems: "flex-start",
      width: "100%",
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    stepIndicator: {
      fontSize: 11,
      fontWeight: "900",
      color: COLORS.logoGreen,
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    brandTitle: {
      fontSize: 34,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textDark,
      letterSpacing: -0.5,
      marginTop: 2,
    },
    brandSubtitle: {
      fontSize: 13.5,
      color: theme?.textSecondary || COLORS.textGrey,
      marginTop: 8,
      lineHeight: 20,
      fontWeight: "600",
    },
    emailHighlight: {
      color: COLORS.logoGreen,
      fontWeight: "800",
    },
    formCard: {
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.2 : 0.035,
      shadowRadius: 8,
      elevation: 1,
    },
    inputGroup: {
      marginBottom: 10,
    },
    rowLabelWrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    inputLabel: {
      color: theme?.textPrimary || COLORS.textGrey,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    flatInputField: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme?.inputBorder || COLORS.borderLight,
      height: 52,
      justifyContent: "center",
    },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    leadingIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      color: theme?.textPrimary || COLORS.textDark,
      height: "100%",
      fontWeight: "800",
      textAlign: "center",
    },
    buttonBase: {
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      marginTop: 10,
    },
    buttonUnpressed: {
      backgroundColor: COLORS.logoGreen,
    },
    buttonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
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
      marginTop: 18,
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


