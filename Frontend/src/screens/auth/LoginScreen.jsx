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
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, Mail, Lock } from "lucide-react-native";
import API_URL from "../config/api";
import * as WebBrowser from "expo-web-browser";
import { useCustomAlert } from "../../context/CustomAlertContext";
import { useTheme } from "../../context/ThemeContext";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({
  onNavigateToSignUp,
  onLoginSuccess,
  onForgotPassword,
  setCurrentUserId,
  onGoogleOtpSent,
}) {
  const { showAlert: triggerCustomAlert } = useCustomAlert();
  const { theme } = useTheme();
  const isDarkMode = false;
  const styles = getStyles(theme, false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // Interaction & Loading State Tracking
  const [isPressed, setIsPressed] = useState(false);
  const [isGooglePressed, setIsGooglePressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Google Sign-In interaction states are managed via deep linking now

  const showAlert = (message, title = "Login Error", buttons = []) => {
    triggerCustomAlert(title, message, buttons);
  };

  // STANDARD EMAIL/PASSWORD AUTHENTICATION FLOW
  const handleLogin = async () => {
    if (isLoading) return;
    if (!email || !password) {
      showAlert("Please enter both your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Response:", data);

      if (response.ok) {
        const userId = data.user?.id || data.user_id;
        if (setCurrentUserId && userId) {
          setCurrentUserId(userId);
        }
        onLoginSuccess(userId, data.is_onboarded);
      } else {
        setIsLoading(false);
        showAlert(
          data.detail || "Incorrect email or password. Please try again.",
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.log("LOGIN ERROR:", error);
      showAlert("Cannot connect to backend server. Check your network.");
    }
  };

  // GOOGLE OAUTH SECURITY AUTHENTICATION HANDLER
  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    try {
      const url = `${API_URL}/auth/google-webpage`;
      console.log("Opening Google Sign-In webpage modal:", url);
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.log("ERROR OPENING GOOGLE SIGN-IN MODAL:", error);
      showAlert(
        "Could not open the Google sign-in browser. Please try again.",
        "Google Sign-In Error",
      );
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
            <Text style={styles.brandTitle}>MacroSync</Text>
            <Text style={styles.brandSubtitle}>
              Scan meals with AI & track daily macros.
              {"\n"}Get custom diet recipes & workout plans.
            </Text>
          </View>

          {/* Form Card Group */}
          <View style={styles.formCard}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.flatInputField, styles.fieldRow]}>
                <Mail color="#94A3B8" size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.flatInputField, styles.fieldRow]}>
                <Lock color="#94A3B8" size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  activeOpacity={0.6}
                  disabled={isLoading}
                >
                  {secureTextEntry ? (
                    <EyeOff color="#94A3B8" size={22} />
                  ) : (
                    <Eye color="#10B981" size={22} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={onForgotPassword}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              activeOpacity={1}
              disabled={isLoading}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleLogin}
              style={[
                styles.buttonBase,
                isPressed ? styles.buttonPressed : styles.buttonUnpressed,
              ]}
            >
              {isLoading && !isGooglePressed ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={[styles.buttonText, { opacity: 0.95 }]}>Signing in...</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.buttonText,
                    isPressed && styles.buttonTextPressed,
                  ]}
                >
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* INTER-STAGE VISUAL DIVIDER */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* PREMIUM GOOGLE TRIGGER COMPONENT BUTTON */}
            <TouchableOpacity
              activeOpacity={1}
              disabled={isLoading}
              onPressIn={() => setIsGooglePressed(true)}
              onPressOut={() => setIsGooglePressed(false)}
              onPress={handleGoogleSignIn}
              style={[
                styles.buttonBase,
                styles.googleButtonBase,
                isGooglePressed
                  ? styles.googleButtonPressed
                  : styles.googleButtonUnpressed,
              ]}
            >
              {isLoading && isGooglePressed ? (
                <ActivityIndicator size="small" color="#64748B" />
              ) : (
                <View style={styles.googleContentRow}>
                  {/* Fixed relative path jump parameter */}
                  <Image
                    source={require("../../images/google.png")}
                    style={{ width: 20, height: 20, marginRight: 10 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      styles.googleButtonText,
                      isGooglePressed && styles.googleButtonTextPressed,
                    ]}
                  >
                    Sign in with Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Footer Navigation */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={onNavigateToSignUp}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Flat Design Tokens ---
const baseColor = "#F8FAFC";
const logoGreen = "#10B981";

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.background || baseColor,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerSection: {
    marginBottom: 35,
    alignItems: "center",
    width: "100%",
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: logoGreen,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  brandSubtitle: {
    fontSize: 14,
    color: theme?.textSecondary || "#64748B",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    color: theme?.textPrimary || "#64748B",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  flatInputField: {
    backgroundColor: theme?.inputBg || baseColor,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || "#E2E8F0",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  leadingIcon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: theme?.textPrimary || "#0F172A",
    paddingVertical: 15,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: "700",
  },
  toggleButton: {
    paddingLeft: 10,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 26,
    marginTop: 2,
  },
  forgotText: {
    color: logoGreen,
    fontSize: 14,
    fontWeight: "800",
  },
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 54,
  },
  buttonUnpressed: {
    backgroundColor: logoGreen,
    borderRadius: 20,
  },
  buttonPressed: {
    backgroundColor: "#059669",
    opacity: 0.85,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  buttonTextPressed: {
    color: "#E2E8F0",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: theme?.border || "#E2E8F0",
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme?.textSecondary || "#94A3B8",
    paddingHorizontal: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  googleButtonBase: {
    marginTop: 0,
  },
  googleButtonUnpressed: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  googleButtonPressed: {
    backgroundColor: theme?.cardBg || "#F1F5F9",
    borderWidth: 1.5,
    borderColor: theme?.border || "#E2E8F0",
    opacity: 0.85,
  },
  googleContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconImage: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  googleButtonText: {
    color: theme?.textPrimary || "#64748B",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  googleButtonTextPressed: {
    color: theme?.textPrimary || "#0F172A",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    color: theme?.textSecondary || "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  linkText: {
    color: logoGreen,
    fontSize: 14,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 43, 35, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContentCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 24,
    width: "100%",
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme?.border || "#E2E8F0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme?.textPrimary || "#0F172A",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme?.textSecondary || "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
    fontWeight: "600",
  },
  accountsList: {
    marginBottom: 16,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme?.cardBg || baseColor,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme?.border || "#E2E8F0",
  },
  accountGoogleIcon: {
    width: 24,
    height: 24,
    marginRight: 14,
  },
  accountTextContainer: {
    flex: 1,
  },
  accountNameText: {
    fontSize: 15,
    fontWeight: "800",
    color: theme?.textPrimary || "#0F172A",
  },
  accountEmailText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme?.textSecondary || "#64748B",
    marginTop: 2,
  },
  useAnotherButton: {
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#64748B",
    marginBottom: 12,
  },
  useAnotherButtonText: {
    color: "#10B981",
    fontWeight: "800",
    fontSize: 15,
  },
  modalCloseButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: theme?.textSecondary || "#94A3B8",
    fontWeight: "800",
    fontSize: 15,
  },
  customInputArea: {
    marginTop: 8,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalInputLabel: {
    color: theme?.textPrimary || "#64748B",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalTextInput: {
    backgroundColor: theme?.inputBg || "#F1F5F9",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme?.textPrimary || "#0F172A",
    fontWeight: "700",
    borderWidth: 1,
    borderColor: theme?.inputBorder || "#E2E8F0",
  },
  modalActionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 4,
  },
  modalButton: {
    flex: 0.48,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: theme?.cardBg || "#F1F5F9",
    borderWidth: 1,
    borderColor: theme?.border || "#E2E8F0",
  },
  modalButtonCancelText: {
    color: theme?.textSecondary || "#64748B",
    fontWeight: "800",
    fontSize: 15,
  },
  modalButtonSubmit: {
    backgroundColor: "#64748B",
  },
  modalButtonSubmitText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});
