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
  ActivityIndicator
} from "react-native";
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import API_URL from '../config/api';

export default function ResetPasswordScreen({ email, onResetSuccess }) {
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
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
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
        Alert.alert("Success", "Password updated successfully.");
        onResetSuccess();
      } else {
        Alert.alert("Error", data.detail || "Failed to update password. Please try again.");
      }
    } catch (error) {
      console.log("UPDATE PASSWORD ERROR:", error);
      Alert.alert(
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
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
              <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
                <Lock color="#7FA293" size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#7FA293"
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
                    /* Text is Visible -> Show plain open Eye to represent clear vision state */
                    <Eye color="#4EA685" size={20} />
                  ) : (
                    /* Text is Hidden -> Show Eye with Slash to represent current hidden state */
                    <EyeOff color="#7FA293" size={20} />
                  )}
                </TouchableOpacity>
              </View>
              {/* Dynamic live length alert notice */}
              {isPasswordTooShort && (
                <View style={styles.warningContainer}>
                  <AlertCircle color="#C53030" size={14} />
                  <Text style={styles.warningText}>Password must be at least 8 characters</Text>
                </View>
              )}
            </View>

            {/* Confirm Password input block */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
                <Lock color="#7FA293" size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor="#7FA293"
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
                    /* Text is Visible -> Show plain open Eye to represent clear vision state */
                    <Eye color="#4EA685" size={20} />
                  ) : (
                    /* Text is Hidden -> Show Eye with Slash to represent current hidden state */
                    <EyeOff color="#7FA293" size={20} />
                  )}
                </TouchableOpacity>
              </View>
              {/* Dynamic live match parity notice */}
              {doPasswordsMismatch && (
                <View style={styles.warningContainer}>
                  <AlertCircle color="#C53030" size={14} />
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

// Unified High-Contrast Hybrid Neumorphic Theme Tokens
const baseColor = '#F0F4F2';           
const clearWhiteHighlight = '#FFFFFF';    
const softGreenShadow = '#AEC2B7';      

// Logo Branding Metrics
const logoGreen = '#4EA685';        
const logoDarkShadow = '#37745D';   
const logoLightHighlight = '#65D8AD'; 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: baseColor },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerSection: { 
    marginBottom: 45, 
    alignItems: "center",
    width: '100%',
    paddingHorizontal: 12,
  },
  brandTitle: { 
    fontSize: 42, 
    fontWeight: "900", 
    color: logoGreen,
    letterSpacing: -0.5,
    textAlign: 'center', 
    width: '100%',
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#556B60',
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: '700',
    width: '100%',
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
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#41544B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: "uppercase",
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
    marginTop: 6,
    marginLeft: 8,
  },
  warningText: {
    color: '#C53030',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
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
    fontWeight: "800",
    letterSpacing: 0.5,
    textShadowColor: logoDarkShadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonTextPressed: { color: '#9EDEC4' },
});