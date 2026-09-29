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
import { getStyles } from './ResetPasswordScreen.styles';



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
