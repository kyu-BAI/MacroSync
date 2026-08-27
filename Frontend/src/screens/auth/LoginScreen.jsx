import React, { useState, useEffect } from "react";
import {
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
import { Eye, EyeOff, Mail, Lock, Check } from "lucide-react-native";
import API_URL from "../config/api";
import * as WebBrowser from "expo-web-browser";
import { useCustomAlert } from "../../context/CustomAlertContext";
import { useTheme } from "../../context/ThemeContext";
import { getStyles } from "./LoginScreen.styles";
import { 
  saveUserId, 
  clearSavedUserId,
  setRememberMe, 
  isRememberMeEnabled,
  saveRememberedGoogleEmail,
  saveRememberedCredentials,
  getRememberedCredentials,
  clearRememberedCredentials
} from "../../services/OfflineStorage";

import GoogleAccountModal from "../../components/GoogleAccountModal";

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
  const [rememberMe, setRememberMeState] = useState(true);

  // Interaction & Loading State Tracking
  const [isPressed, setIsPressed] = useState(false);
  const [isGooglePressed, setIsGooglePressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Google Account Selector Modal State
  const [isGoogleModalVisible, setIsGoogleModalVisible] = useState(false);

  // Auto-restore Remembered Credentials & Toggle State on Mount
  useEffect(() => {
    async function loadSavedRememberedState() {
      try {
        const enabled = await isRememberMeEnabled();
        setRememberMeState(enabled);
        if (enabled) {
          const creds = await getRememberedCredentials();
          if (creds?.email) setEmail(creds.email);
          if (creds?.password) setPassword(creds.password);
        }
      } catch (err) {
        console.log("Error loading remembered credentials:", err);
      }
    }
    loadSavedRememberedState();
  }, []);

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

        // Call onLoginSuccess INSTANTLY for 0ms screen switch
        onLoginSuccess(userId, data.is_onboarded);

        // Perform storage persistence non-blockingly in background
        Promise.all([
          userId ? saveUserId(userId) : Promise.resolve(),
          setRememberMe(rememberMe),
          rememberMe
            ? saveRememberedCredentials(email, password)
            : clearRememberedCredentials(),
        ]).catch((err) => console.log("Storage persistence error:", err));
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

  // GOOGLE OAUTH POPUP TRIGGER
  const handleGoogleSignIn = () => {
    if (isLoading) return;
    setIsGoogleModalVisible(true);
  };

  // GOOGLE ACCOUNT SELECTION HANDLER
  const handleGoogleAccountSelect = async (selectedEmail, selectedName, rememberMe = true) => {
    setIsLoading(true);
    setIsGooglePressed(true);

    try {
      const response = await fetch(`${API_URL}/auth/google-signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedEmail,
          name: selectedName,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.log("JSON Parse Error on Google Signin:", jsonErr);
        data = { detail: "Backend server error. Please try again in a moment." };
      }
      console.log("Google Sign-In response:", data);

      setIsLoading(false);
      setIsGooglePressed(false);
      setIsGoogleModalVisible(false);

      if (response.ok && data.success) {
        const uid = data.user_id || data.user?.id;
        if (setCurrentUserId && uid) {
          setCurrentUserId(uid);
        }

        // Save session & Remember Me state
        if (uid) {
          await saveUserId(uid);
          await setRememberMe(rememberMe);
          if (rememberMe && selectedEmail) {
            await saveRememberedGoogleEmail(selectedEmail);
          }
        }

        if (data.is_new_user) {
          // First time Google user -> follow verification & onboarding process
          if (onGoogleOtpSent) {
            onGoogleOtpSent(true, selectedEmail, selectedName, data.temp_password, false);
          }
        } else if (data.is_onboarded === true) {
          // Existing registered & onboarded user -> redirect directly to dashboard
          onLoginSuccess(uid, true);
        } else {
          // Existing user but not onboarded -> redirect to onboarding STEP_ONE
          onLoginSuccess(uid, false);
        }
      } else {
        showAlert(
          data.detail || "Google authentication failed. Please try again.",
          "Authentication Failed",
        );
      }
    } catch (error) {
      setIsLoading(false);
      setIsGooglePressed(false);
      setIsGoogleModalVisible(false);
      console.log("GOOGLE LOGIN ERROR:", error);
      showAlert("Cannot connect to backend server. Check your network.", "Connection Error");
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

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.rememberForgotRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMeState(!rememberMe)}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Check color="#FFFFFF" size={13} strokeWidth={3} />}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={onForgotPassword}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

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

      {/* GOOGLE ACCOUNT SELECTOR MODAL */}
      <GoogleAccountModal
        visible={isGoogleModalVisible}
        onClose={() => setIsGoogleModalVisible(false)}
        onSelectAccount={handleGoogleAccountSelect}
        isLoading={isLoading && isGooglePressed}
      />
    </SafeAreaView>
  );
}

// --- Flat Design Tokens ---
const baseColor = "#F8FAFC";

