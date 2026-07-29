import React, { useState } from "react";
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
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyRound, ChevronLeft } from 'lucide-react-native';
import API_URL from '../config/api';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';

export default function VerifyEmailScreen({ email, name, password, isLogin, onVerified, onNavigateBack }) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [otp, setOtp] = useState("");
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- OTP VERIFICATION LIFE CYCLES ---
  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      showAlert("Missing OTP", "Please enter the OTP code.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/verify-login" : "/verify-signup";
      const payload = isLogin 
        ? { email: email.trim(), otp: otp.trim() }
        : {
            email: email.trim(),
            otp: otp.trim(),
            name: name ? name.trim() : "",
            password: password ? password.trim() : ""
          };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        showAlert("Success", "Email verified successfully.");
        onVerified(data.user_id, data.is_onboarded); // Moves cleanly to onboarding if not onboarded
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={baseColor} />
      
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
            <Text style={styles.brandSubtitle}>We sent a code to:</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Form Card Group */}
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>OTP Code</Text>

            {/* Structured Input Row with Vector Badge Icon */}
            <View style={[styles.flatInputField, styles.fieldRow]}>
              <KeyRound color="#94A3B8" size={20} style={styles.leadingIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#94A3B8"
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

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Flat Design Tokens
const baseColor = '#F8FAFC';
const logoGreen = '#10B981';

const getStyles = (theme) => StyleSheet.create({
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
    paddingTop: Platform.OS === 'ios' ? 20 : 16, 
    marginTop: Platform.OS === 'android' ? 20 : 0, 
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  backArrowButton: {
    padding: 10,
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
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
    color: theme?.textSecondary || '#64748B',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '700',
  },
  emailText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "900",
    color: theme?.textPrimary || "#0F172A",
    backgroundColor: theme?.cardBg || '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
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
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || '#E2E8F0',
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
    color: theme?.textPrimary || '#0F172A',
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
});