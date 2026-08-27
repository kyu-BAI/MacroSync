import React, { useState } from "react";
import {
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
import { getStyles } from './ResetPasswordScreen.styles';

const baseColor = '#F8FAFC';

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

  // Live password rules
  const pwRules = [
    { label: 'At least 8 characters',          ok: newPassword.length >= 8 },
    { label: 'One uppercase letter (A–Z)',       ok: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter (a–z)',       ok: /[a-z]/.test(newPassword) },
    { label: 'One number (0–9)',                 ok: /[0-9]/.test(newPassword) },
    { label: 'One special character (!@#$…)',    ok: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const allRulesPass = pwRules.every(r => r.ok);
  const doPasswordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const [isLoading, setIsLoading] = useState(false);

  // --- PASSWORD UPDATE LIFE CYCLES ---
  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showAlert("Error", "Please fill all fields.");
      return;
    }

    if (!allRulesPass) {
      showAlert("Weak Password", "Your password does not meet all requirements. Please check the checklist.");
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
              {/* Live password requirements checklist */}
              {newPassword.length > 0 && (
                <View style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.04)',
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: allRulesPass ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.20)',
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.7 }}>Password must contain</Text>
                  {pwRules.map((rule, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                      <View style={{
                        width: 18, height: 18, borderRadius: 9,
                        backgroundColor: rule.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.10)',
                        alignItems: 'center', justifyContent: 'center',
                        marginRight: 8, borderWidth: 1,
                        borderColor: rule.ok ? '#10B981' : '#EF4444',
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: '900', color: rule.ok ? '#10B981' : '#EF4444' }}>
                          {rule.ok ? '✓' : '✕'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: rule.ok ? '#10B981' : '#94A3B8' }}>
                        {rule.label}
                      </Text>
                    </View>
                  ))}
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