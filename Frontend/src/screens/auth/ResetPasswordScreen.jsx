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
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import API_URL from '../config/api';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';

export default function ResetPasswordScreen({ email, onResetSuccess }) {
  const { showAlert } = useCustomAlert();
  const { theme } = useTheme();
  const isDarkMode = false;
  const styles = getStyles(theme, false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPressed, setIsPressed] = useState(false);

  // Visibility toggle states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Live on-screen inline validation indicators
  const isPasswordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const doPasswordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const [isLoading, setIsLoading] = useState(false);

  // --- PASSWORD UPDATE LIFE CYCLES ---
  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showAlert("Error", "Please fill all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Error", "Passwords do not match.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert("Success", "Password updated successfully.");
        onResetSuccess();
      } else {
        showAlert("Error", data.detail || "Failed to update password. Please try again.");
      }
    } catch (error) {
      console.log("UPDATE PASSWORD ERROR:", error);
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
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme?.background || baseColor} 
      />
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
            <Text style={styles.brandTitle}>New Password</Text>
            <Text style={styles.brandSubtitle}>
              Please choose a new strong security credential string for MacroSync.
            </Text>
          </View>

          {/* Form Card Group */}
          <View style={styles.formCard}>
            
            {/* New Password input block */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={[styles.flatInputField, styles.fieldRow]}>
                <Lock color={theme?.textSecondary || "#94A3B8"} size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor={theme?.placeholderText || "#94A3B8"}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  activeOpacity={0.7}
                  style={styles.toggleIconButton}
                >
                  {showNewPassword ? (
                    <Eye color="#10B981" size={20} />
                  ) : (
                    <EyeOff color={theme?.textSecondary || "#94A3B8"} size={20} />
                  )}
                </TouchableOpacity>
              </View>
              {/* Dynamic live length alert notice */}
              {isPasswordTooShort && (
                <View style={styles.warningContainer}>
                  <AlertCircle color="#EF4444" size={14} />
                  <Text style={styles.warningText}>Password must be at least 8 characters</Text>
                </View>
              )}
            </View>

            {/* Confirm Password input block */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={[styles.flatInputField, styles.fieldRow]}>
                <Lock color={theme?.textSecondary || "#94A3B8"} size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={theme?.placeholderText || "#94A3B8"}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                  style={styles.toggleIconButton}
                >
                  {showConfirmPassword ? (
                    <Eye color="#10B981" size={20} />
                  ) : (
                    <EyeOff color={theme?.textSecondary || "#94A3B8"} size={20} />
                  )}
                </TouchableOpacity>
              </View>
              {/* Dynamic live match parity notice */}
              {doPasswordsMismatch && (
                <View style={styles.warningContainer}>
                  <AlertCircle color="#EF4444" size={14} />
                  <Text style={styles.warningText}>Passwords do not match</Text>
                </View>
              )}
            </View>

            {/* Action Trigger Button */}
            <TouchableOpacity
              activeOpacity={1}
              disabled={isLoading}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleUpdatePassword}
              style={[
                styles.buttonBase,
                isPressed ? styles.buttonPressed : styles.buttonUnpressed,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
                  Update Password
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

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme?.background || baseColor 
  },
  flexContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerSection: { 
    marginBottom: 32, 
    alignItems: "center",
    width: '100%',
  },
  brandTitle: { 
    fontSize: 38, 
    fontWeight: "900", 
    color: logoGreen,
    letterSpacing: -0.5,
    textAlign: 'center', 
  },
  brandSubtitle: {
    fontSize: 14,
    color: theme?.textSecondary || '#64748B',
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    color: theme?.textPrimary || '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  flatInputField: {
    backgroundColor: theme?.inputBg || baseColor,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || '#E2E8F0',
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
    fontSize: 16,
    fontWeight: '700',
  },
  toggleIconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 6,
  },
  warningText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
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
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  buttonTextPressed: { 
    color: '#E2E8F0' 
  },
});