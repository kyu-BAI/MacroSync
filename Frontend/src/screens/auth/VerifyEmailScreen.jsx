import React, { useState, useEffect } from "react";
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
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyRound, ChevronLeft } from 'lucide-react-native';
import API_URL from '../config/api';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';

export default function VerifyEmailScreen({ email, name, password, isLogin, onVerified, onNavigateBack }) {
  const { showAlert } = useCustomAlert();
  const { theme } = useTheme();
  const isDarkMode = false;
  const styles = getStyles(theme, false);
  const [otp, setOtp] = useState("");
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Resend OTP State
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

  const handleResendOTP = async () => {
    if (isResending || resendCooldown > 0) return;
    setIsResending(true);

    try {
      const cleanEmail = (email || "").trim();
      const cleanName = (name || "").trim();
      const cleanPassword = (password || "").trim();

      const endpoint = isLogin ? "/forgot-password" : "/signup";
      const payload = isLogin 
        ? { email: cleanEmail }
        : { email: cleanEmail, name: cleanName, password: cleanPassword };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showAlert("OTP Resent", "A new verification OTP code has been sent to your email.");
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

  // --- OTP VERIFICATION LIFE CYCLES ---
  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showAlert("Missing OTP", "Please enter the OTP code.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const cleanEmail = (email || "").trim();
      const cleanOtp = (otp || "").trim();
      const cleanName = (name || "").trim();
      const cleanPassword = (password || "").trim();

      const endpoint = isLogin ? "/verify-login" : "/verify-signup";
      const payload = isLogin 
        ? { email: cleanEmail, otp: cleanOtp }
        : {
            email: cleanEmail,
            otp: cleanOtp,
            name: cleanName,
            password: cleanPassword
          };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      let data = null;
      try {
        data = await response.json();
      } catch (jsonErr) {
        data = null;
      }

      if (response.ok && data && data.user_id) {
        onVerified(data.user_id, data.is_onboarded);
      } else {
        setIsLoading(false);
        showAlert("Error", data?.detail || "Invalid or expired OTP code. Please try again.");
      }
    } catch (error) {
      setIsLoading(false);
      console.log("VERIFY OTP ERROR:", error);
      showAlert(
        "Network Error",
        "Cannot connect to backend server. Make sure it is running and your IP is correct."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme?.background || baseColor} 
      />
      
      {/* Back Button Row */}
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
            <Text style={styles.brandSubtitle}>We sent a verification code to:</Text>
            <View style={styles.emailBadgeContainer}>
              <Text style={styles.emailText}>{email}</Text>
            </View>
          </View>

          {/* Form Card Group */}
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>OTP Code</Text>

            {/* Structured Input Row with Vector Badge Icon */}
            <View style={[styles.flatInputField, styles.fieldRow]}>
              <KeyRound color={theme?.textSecondary || "#94A3B8"} size={20} style={styles.leadingIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={theme?.placeholderText || "#94A3B8"}
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
              disabled={isLoading}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleVerifyOTP}
              style={[
                styles.buttonBase,
                isPressed ? styles.buttonPressed : styles.buttonUnpressed
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
                  Verify OTP
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend OTP Row */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive code? </Text>
              <TouchableOpacity
                disabled={isResending || resendCooldown > 0}
                onPress={handleResendOTP}
                activeOpacity={0.7}
                style={styles.resendButton}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color={logoGreen} />
                ) : (
                  <Text
                    style={[
                      styles.resendLink,
                      resendCooldown > 0 && styles.resendLinkDisabled
                    ]}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Flat Design Tokens
const baseColor = '#F8FAFC';
const logoGreen = '#10B981';

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.background || baseColor,
  },
  flexContainer: {
    flex: 1,
  },
  topNavigationRow: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  backArrowButton: {
    padding: 10,
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 32,
    alignItems: "center",
    width: '100%',
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: logoGreen, 
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 14,
    color: theme?.textSecondary || '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '700',
  },
  emailBadgeContainer: {
    marginTop: 10,
    alignSelf: 'center',
  },
  emailText: {
    fontSize: 15,
    fontWeight: "800",
    color: theme?.textPrimary || "#0F172A",
    backgroundColor: theme?.cardBg || '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
    overflow: 'hidden',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  inputLabel: {
    color: theme?.textPrimary || '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  flatInputField: {
    backgroundColor: theme?.inputBg || baseColor,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || '#E2E8F0',
    marginBottom: 24,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leadingIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: theme?.textPrimary || '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 20,
    fontWeight: '800',
    textAlign: "center",
    letterSpacing: 6,
  },
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonUnpressed: {
    backgroundColor: logoGreen,
    borderRadius: 20,
  },
  buttonPressed: {
    backgroundColor: '#059669',
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonTextPressed: {
    color: '#E2E8F0',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 13,
    color: theme?.textSecondary || '#64748B',
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  resendLink: {
    fontSize: 13,
    color: logoGreen,
    fontWeight: '800',
  },
  resendLinkDisabled: {
    color: theme?.textSecondary || '#94A3B8',
    opacity: 0.7,
  },
});