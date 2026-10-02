// --- IMPORTS ---
import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, Check } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";

import { useTheme } from "../../context/ThemeContext";
import useAuthLogin from "../../hooks/useAuthLogin";
import InputField from "../../components/InputField";
import GoogleAccountModal from "../../components/GoogleAccountModal";

// Complete any pending OAuth redirect sessions
WebBrowser.maybeCompleteAuthSession();

// Assets
const GOOGLE_ICON = require("../../images/google.png");

// --- LIGHTWEIGHT BUTTON SUBCOMPONENTS ---

// Email/password submit button
function PrimaryButton({ onPress, isLoading, disabled, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || isLoading}
      onPress={onPress}
      style={[styles.buttonBase, styles.buttonUnpressed]}
    >
      {isLoading ? (
        <View style={styles.buttonLoadingRow}>
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonSpinner} />
          <Text style={[styles.buttonText, styles.buttonLoadingText]}>Signing in...</Text>
        </View>
      ) : (
        <Text style={styles.buttonText}>Sign In</Text>
      )}
    </TouchableOpacity>
  );
}

// Google OAuth trigger button
function GoogleSignInButton({ onPress, isLoading, disabled, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || isLoading}
      onPress={onPress}
      style={[styles.buttonBase, styles.googleButtonBase, styles.googleButtonUnpressed]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#64748B" />
      ) : (
        <View style={styles.googleContentRow}>
          <Image
            source={GOOGLE_ICON}
            style={styles.googleIconImage}
            resizeMode="contain"
          />
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// --- MAIN LOGIN SCREEN ---

export default function LoginScreen({
  onNavigateToSignUp,
  onLoginSuccess,
  onForgotPassword,
  setCurrentUserId,
  onGoogleOtpSent,
}) {
  // Theme & screen styling
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // Authentication hook: form state, handlers & modal visibility
  const {
    form,
    rememberMe,
    isLoading,
    isEmailLoading,
    isGoogleLoading,
    isGoogleModalVisible,
    handleEmailChange,
    handlePasswordChange,
    handleToggleRememberMe,
    handleOpenGoogleModal,
    handleCloseGoogleModal,
    handleLogin,
    handleGoogleAccountSelect,
  } = useAuthLogin({
    setCurrentUserId,
    onLoginSuccess,
    onGoogleOtpSent,
  });

  // Toggle password visibility
  const handleToggleSecureTextEntry = useCallback(() => {
    setSecureTextEntry((prev) => !prev);
  }, []);

  /* remove everything in the screen */
  // return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Status Bar */}
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme?.background || baseColor}
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
          {/* Header: Logo & Tagline */}
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
            <InputField
              label="Email Address"
              Icon={Mail}
              value={form.email}
              onChangeText={handleEmailChange}
              placeholder="Enter your email"
              keyboardType="email-address"
              editable={!isLoading}
              styles={styles}
            />

            {/* Password Field */}
            <InputField
              label="Password"
              Icon={Lock}
              value={form.password}
              onChangeText={handlePasswordChange}
              placeholder="Enter your password"
              isPassword
              isSecure={secureTextEntry}
              onToggleSecure={handleToggleSecureTextEntry}
              editable={!isLoading}
              styles={styles}
            />

            {/* Remember Me Checkbox & Forgot Password Link */}
            <View style={styles.rememberForgotRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={handleToggleRememberMe}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe ? <Check color="#FFFFFF" size={13} strokeWidth={3} /> : null}
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
            <PrimaryButton
              onPress={handleLogin}
              isLoading={isEmailLoading}
              disabled={isLoading}
              styles={styles}
            />

            {/* Inter-stage "Or" Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In Button */}
            <GoogleSignInButton
              onPress={handleOpenGoogleModal}
              isLoading={isGoogleLoading}
              disabled={isLoading}
              styles={styles}
            />

            {/* Footer Navigation: Sign Up Link */}
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

      {/* Google Account Selector Modal */}
      <GoogleAccountModal
        visible={isGoogleModalVisible}
        onClose={handleCloseGoogleModal}
        onSelectAccount={handleGoogleAccountSelect}
        isLoading={isGoogleLoading}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// --- COMPONENT STYLES & COLOR CONFIGURATION ---
// ============================================================================
const baseColor = "#F8FAFC"; // Fallback screen background color
const logoGreen = "#10B981"; // Primary brand accent color (buttons, titles, links)

const getStyles = (theme) =>
  StyleSheet.create({
    // --- MAIN SCREEN LAYOUT ---
    // Entire full-screen background
    container: {
      flex: 1,
      backgroundColor: theme?.background || baseColor,
    },
    // ScrollView inner padding & vertical centering
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 16,
    },

    // --- HEADER / BRAND SECTION ---
    // Header wrapper holding title and subtitle
    headerSection: {
      marginBottom: 35,
      alignItems: "center",
      width: "100%",
      maxWidth: 480,
      alignSelf: "center",
    },
    // Main "MacroSync" app title text
    brandTitle: {
      fontSize: 42,
      fontWeight: "900",
      color: logoGreen,
      letterSpacing: -0.5,
      textAlign: "center",
    },
    // Subtitle description below the title
    brandSubtitle: {
      fontSize: 14,
      color: theme?.textSecondary || "#64748B",
      marginTop: 10,
      textAlign: "center",
      lineHeight: 22,
      fontWeight: "700",
    },

    // --- FORM CONTAINER CARD ---
    // The rounded card containing all input fields and buttons
    formCard: {
      backgroundColor: '#ffffff',
      borderRadius: 28,
      padding: 24,
      borderWidth: 1.5,
      borderColor: theme?.border || "#E2E8F0",
      width: "100%",
      maxWidth: 480,
      alignSelf: "center",
    },

    // --- INPUT FIELDS (EMAIL & PASSWORD) ---
    // Wrapper spacing around each input field
    inputGroup: {
      marginBottom: 22,
    },
    // Uppercase label above input ("EMAIL ADDRESS", "PASSWORD")
    inputLabel: {
      color: theme?.textPrimary || "#64748B",
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginLeft: 6,
    },
    // Input box container (background color and border outline)
    flatInputField: {
      backgroundColor: theme?.inputBg || baseColor,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme?.inputBorder || "#E2E8F0",
    },
    // Horizontal row layout for leading icon + text input + eye toggle
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    // Spacing for leading icon (mail/lock)
    leadingIcon: {
      marginRight: 4,
    },
    // The actual text typed by user inside the input field
    input: {
      flex: 1,
      color: theme?.textPrimary || "#0F172A",
      paddingVertical: 15,
      paddingHorizontal: 8,
      fontSize: 16,
      fontWeight: "700",
    },
    // Password show/hide eye icon touchable wrapper
    toggleButton: {
      paddingLeft: 10,
      paddingVertical: 10,
      justifyContent: "center",
      alignItems: "center",
    },

    // --- REMEMBER ME & FORGOT PASSWORD ROW ---
    // Horizontal container row holding both Remember Me and Forgot Password
    rememberForgotRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
      marginTop: 4,
    },
    // Remember Me checkbox + label touchable wrapper
    rememberMeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    // Unchecked checkbox box (border and background)
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme?.inputBorder || "#94A3B8",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
      backgroundColor: "transparent",
    },
    // Checked checkbox box (filled background and border)
    checkboxChecked: {
      backgroundColor: logoGreen,
      borderColor: logoGreen,
    },
    // "Remember me" text next to checkbox
    rememberMeText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme?.textSecondary || "#64748B",
    },
    // "Forgot Password?" touchable container
    forgotPassword: {
      alignSelf: "center",
    },
    // "Forgot Password?" clickable text color
    forgotText: {
      color: logoGreen,
      fontSize: 13,
      fontWeight: "800",
    },

    // --- PRIMARY BUTTON ("SIGN IN") ---
    // Common dimensions and centering for buttons
    buttonBase: {
      paddingVertical: 16,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: 54,
    },
    // Default "Sign In" button background color
    buttonUnpressed: {
      backgroundColor: logoGreen,
      borderRadius: 20,
    },
    // "Sign In" button pressed state color
    buttonPressed: {
      backgroundColor: "#059669",
      opacity: 0.85,
    },
    // "Sign In" button text color & font
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    // "Sign In" button text color when pressed
    buttonTextPressed: {
      color: "#E2E8F0",
    },
    // Row holding spinner and "Signing in..." text
    buttonLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    // Spinner spacing next to "Signing in..."
    buttonSpinner: {
      marginRight: 8,
    },
    // "Signing in..." loading text style
    buttonLoadingText: {
      opacity: 0.95,
    },

    // --- DIVIDER ("OR") ---
    // Horizontal row wrapping left line, "Or" text, and right line
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 20,
      paddingHorizontal: 10,
    },
    // Thin horizontal divider line color
    dividerLine: {
      flex: 1,
      height: 1.5,
      backgroundColor: theme?.border || "#E2E8F0",
    },
    // "Or" text between the divider lines
    dividerText: {
      fontSize: 12,
      fontWeight: "800",
      color: theme?.textSecondary || "#94A3B8",
      paddingHorizontal: 12,
      textTransform: "uppercase",
      letterSpacing: 1,
    },

    // --- GOOGLE SIGN IN BUTTON ---
    // Google button container positioning
    googleButtonBase: {
      marginTop: 0,
    },
    // Default Google button background & border
    googleButtonUnpressed: {
      backgroundColor: theme?.surface || baseColor,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme?.border || "#E2E8F0",
    },
    // Google button background & border when tapped
    googleButtonPressed: {
      backgroundColor: theme?.cardBg || "#F1F5F9",
      borderWidth: 1.5,
      borderColor: theme?.border || "#E2E8F0",
      opacity: 0.85,
    },
    // Row holding Google logo icon + text
    googleContentRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    // Google logo image dimensions
    googleIconImage: {
      width: 20,
      height: 20,
      marginRight: 10,
    },
    // "Sign in with Google" text color & font
    googleButtonText: {
      color: theme?.textPrimary || "#64748B",
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    // "Sign in with Google" text color when pressed
    googleButtonTextPressed: {
      color: theme?.textPrimary || "#0F172A",
    },

    // --- FOOTER ("DON'T HAVE AN ACCOUNT? SIGN UP") ---
    // Bottom row layout
    footerRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 32,
    },
    // "Don't have an account?" text color
    footerText: {
      color: theme?.textSecondary || "#64748B",
      fontSize: 14,
      fontWeight: "700",
    },
    // "Sign Up" clickable link text color
    linkText: {
      color: logoGreen,
      fontSize: 14,
      fontWeight: "900",
    },
  });
