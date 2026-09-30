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
import { User, Mail, Lock, Check, X, AlertCircle } from "lucide-react-native";

import { useTheme } from "../../context/ThemeContext";
import useAuthSignUp from "../../hooks/useAuthSignUp";
import InputField from "../../components/InputField";
import GoogleAccountModal from "../../components/GoogleAccountModal";
import PrivacyModal from "../../components/PrivacyModal";

// Assets
const GOOGLE_ICON = require("../../images/google.png");

// --- LIGHTWEIGHT SUBCOMPONENTS ---

// Primary registration submit button
function PrimaryButton({ onPress, isLoading, disabled, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || isLoading}
      onPress={onPress}
      style={[
        styles.buttonBase,
        styles.buttonUnpressed,
        styles.signupButtonSpacing,
      ]}
    >
      {isLoading ? (
        <View style={styles.buttonLoadingRow}>
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonSpinner} />
          <Text style={[styles.buttonText, styles.buttonLoadingText]}>
            Creating Account...
          </Text>
        </View>
      ) : (
        <Text style={styles.buttonText}>Get Started</Text>
      )}
    </TouchableOpacity>
  );
}

// Google OAuth trigger button
function GoogleSignUpButton({ onPress, isLoading, disabled, styles }) {
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
          <Text style={styles.googleButtonText}>Sign up with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Live password criteria checklist
function PasswordCriteriaList({ password, showWarning, criteria, styles }) {
  const isAllValid = criteria.every((item) => item.valid);

  // Auto-remove all text warnings once confirmed valid (or if field is empty and not in error)
  if (isAllValid || (!password.length && !showWarning)) return null;

  return (
    <View style={styles.criteriaContainer}>
      {showWarning ? (
        <View style={styles.warningHeaderRow}>
          <AlertCircle color="#EF4444" size={14} style={styles.warningHeaderIcon} />
          <Text style={styles.criteriaHeaderWarning}>Password must contain:</Text>
        </View>
      ) : null}
      {criteria.map((item, index) => {
        const isSuccess = item.valid;
        const isUnmet = !item.valid;
        return (
          <View key={index} style={styles.criteriaRow}>
            {isSuccess ? (
              <Check color="#10B981" size={16} style={styles.criteriaIcon} />
            ) : (
              <X
                color={isUnmet ? "#EF4444" : "#CBD5E1"}
                size={16}
                style={styles.criteriaIcon}
              />
            )}
            <Text
              style={[
                styles.criteriaText,
                isSuccess && styles.criteriaTextSuccess,
                isUnmet && styles.criteriaTextError,
              ]}
            >
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// Mandatory policy agreement checkbox row
function PolicyAgreementCheckbox({
  agreeToTerms,
  showTermsWarning,
  isLoading,
  onToggle,
  onOpenTerms,
  onOpenPrivacy,
  onOpenMedical,
  styles,
}) {
  return (
    <View style={styles.checkboxContainer}>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={isLoading}
        onPress={onToggle}
        style={styles.checkboxRow}
      >
        <View
          style={[
            styles.checkboxBox,
            agreeToTerms && styles.checkboxBoxChecked,
            showTermsWarning && styles.checkboxBoxError,
          ]}
        >
          {agreeToTerms ? (
            <Check color="#FFFFFF" size={13} strokeWidth={3} />
          ) : null}
        </View>
        <Text style={styles.checkboxLabel}>
          I have read and agree to MacroSync's{" "}
          <Text style={styles.policyLink} onPress={onOpenTerms}>
            Terms of Service
          </Text>
          {", "}
          <Text style={styles.policyLink} onPress={onOpenPrivacy}>
            Privacy Policy (RA 10173)
          </Text>
          {", & "}
          <Text style={styles.policyLink} onPress={onOpenMedical}>
            Medical Disclaimer
          </Text>
          .
        </Text>
      </TouchableOpacity>

      {showTermsWarning ? (
        <View style={styles.inlineWarningRow}>
          <AlertCircle color="#EF4444" size={13} style={styles.warningIcon} />
          <Text style={styles.inlineWarningText}>
            Please read and agree to the policies to continue
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// --- MAIN SIGNUP SCREEN ---

export default function SignUpScreen({ onNavigateToLogin, onSignUpSuccess }) {
  // Theme & screen styling
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // Authentication hook: form state, validations, policy modals & submit handlers
  const {
    form,
    agreeToTerms,
    isLoading,
    isSignupLoading,
    isGoogleLoading,
    isGoogleModalVisible,
    privacyModalVisible,
    privacyInitialTab,
    showNameWarning,
    showEmailWarning,
    showPasswordWarning,
    showTermsWarning,
    passwordCriteria,
    getNameErrorMessage,
    getEmailErrorMessage,
    handleNameChange,
    handleNameBlur,
    handleEmailChange,
    handleEmailBlur,
    handlePasswordChange,
    handlePasswordBlur,
    handleToggleAgreeTerms,
    handleOpenTerms,
    handleOpenPrivacy,
    handleOpenMedical,
    handleClosePrivacyModal,
    handleAgreePolicies,
    handleOpenGoogleModal,
    handleCloseGoogleModal,
    handleSignup,
    handleGoogleAccountSelect,
  } = useAuthSignUp({ onSignUpSuccess });

  // Toggle password visibility
  const handleToggleSecureTextEntry = useCallback(() => {
    setSecureTextEntry((prev) => !prev);
  }, []);

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
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>
              Build your personalized AI nutrition profile.
              {"\n"}Start scanning food & tracking workouts today.
            </Text>
          </View>

          {/* Form Card Group */}
          <View style={styles.formCard}>
            {/* Username Field */}
            <InputField
              label="Username"
              Icon={User}
              value={form.name}
              onChangeText={handleNameChange}
              onBlur={handleNameBlur}
              placeholder="Enter your username"
              placeholderTextColor={theme?.placeholderText || "#94A3B8"}
              editable={!isLoading}
              showWarning={showNameWarning}
              errorMessage={getNameErrorMessage()}
              styles={styles}
            />

            {/* Email Field */}
            <InputField
              label="Email Address"
              Icon={Mail}
              value={form.email}
              onChangeText={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="Enter your email"
              placeholderTextColor={theme?.placeholderText || "#94A3B8"}
              keyboardType="email-address"
              editable={!isLoading}
              showWarning={showEmailWarning}
              errorMessage={getEmailErrorMessage()}
              styles={styles}
            />

            {/* Password Field */}
            <InputField
              label="Password"
              Icon={Lock}
              value={form.password}
              onChangeText={handlePasswordChange}
              onBlur={handlePasswordBlur}
              placeholder="Create a password"
              placeholderTextColor={theme?.placeholderText || "#94A3B8"}
              isPassword
              isSecure={secureTextEntry}
              onToggleSecure={handleToggleSecureTextEntry}
              editable={!isLoading}
              showWarning={showPasswordWarning}
              styles={styles}
            />

            {/* Live Password Criteria Checklist */}
            <PasswordCriteriaList
              password={form.password}
              showWarning={showPasswordWarning}
              criteria={passwordCriteria}
              styles={styles}
            />

            {/* Policy Agreement Checkbox */}
            <PolicyAgreementCheckbox
              agreeToTerms={agreeToTerms}
              showTermsWarning={showTermsWarning}
              isLoading={isLoading}
              onToggle={handleToggleAgreeTerms}
              onOpenTerms={handleOpenTerms}
              onOpenPrivacy={handleOpenPrivacy}
              onOpenMedical={handleOpenMedical}
              styles={styles}
            />

            {/* Get Started Submit Button */}
            <PrimaryButton
              onPress={handleSignup}
              isLoading={isSignupLoading}
              disabled={isLoading}
              styles={styles}
            />

            {/* Inter-stage "Or" Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign Up Button */}
            <GoogleSignUpButton
              onPress={handleOpenGoogleModal}
              isLoading={isGoogleLoading}
              disabled={isLoading}
              styles={styles}
            />

            {/* Footer Navigation: Sign In Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={onNavigateToLogin}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={styles.linkText}>Sign In</Text>
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

      {/* Privacy Policy & Terms Modal */}
      <PrivacyModal
        visible={privacyModalVisible}
        onClose={handleClosePrivacyModal}
        onAgree={handleAgreePolicies}
        initialTab={privacyInitialTab}
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
    },
    // Main "Create Account" title text
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
      backgroundColor: theme?.surface || baseColor,
      borderRadius: 28,
      padding: 24,
      borderWidth: 1.5,
      borderColor: theme?.border || "#E2E8F0",
    },

    // --- INPUT FIELDS (USERNAME, EMAIL & PASSWORD) ---
    // Wrapper spacing around each input field
    inputGroup: {
      marginBottom: 22,
    },
    // Uppercase label above input ("USERNAME", "EMAIL ADDRESS", "PASSWORD")
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
    // Red border highlighting invalid input fields
    inputWarningBorder: {
      borderColor: "#EF4444",
    },
    // Horizontal row layout for leading icon + text input + eye toggle
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    // Spacing for leading icon (user/mail/lock)
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
    // Inline warning row below invalid field
    inlineWarningRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      marginLeft: 6,
    },
    // Warning icon spacing
    warningIcon: {
      marginRight: 6,
    },
    // Warning error text color & font
    inlineWarningText: {
      color: "#EF4444",
      fontSize: 12,
      fontWeight: "700",
    },

    // --- PASSWORD CRITERIA CHECKLIST ---
    // Checklist container
    criteriaContainer: {
      marginTop: 10,
      marginLeft: 6,
    },
    // Header row above checklist when invalid
    warningHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    // Warning icon in criteria header
    warningHeaderIcon: {
      marginRight: 5,
    },
    // "Password must contain:" warning title text
    criteriaHeaderWarning: {
      color: "#EF4444",
      fontSize: 12,
      fontWeight: "800",
    },
    // Each individual checklist item row
    criteriaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    // Checkmark/X icon spacing
    criteriaIcon: {
      marginRight: 8,
    },
    // Default unmet checklist item text
    criteriaText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme?.textSecondary || "#CBD5E1",
    },
    // Valid/satisfied checklist item text
    criteriaTextSuccess: {
      color: "#10B981",
      fontWeight: "700",
    },
    // Unmet checklist item text during error state
    criteriaTextError: {
      color: "#EF4444",
      fontWeight: "700",
    },

    // --- POLICY AGREEMENT CHECKBOX ---
    // Checkbox container wrapper
    checkboxContainer: {
      marginTop: 14,
      marginBottom: 6,
    },
    // Horizontal row holding checkbox box + label
    checkboxRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 2,
    },
    // Unchecked checkbox box (border and background)
    checkboxBox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.8,
      borderColor: theme?.border || "#CBD5E1",
      backgroundColor: theme?.surface || "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
      marginRight: 10,
    },
    // Checked checkbox box (filled background and border)
    checkboxBoxChecked: {
      borderColor: "#10B981",
      backgroundColor: "#10B981",
    },
    // Checkbox box highlighted red on validation failure
    checkboxBoxError: {
      borderColor: "#EF4444",
    },
    // Policy agreement description label
    checkboxLabel: {
      flex: 1,
      fontSize: 12,
      color: theme?.textSecondary || "#64748B",
      lineHeight: 18,
      fontWeight: "500",
    },
    // Underlined clickable policy link text ("Terms of Service", etc.)
    policyLink: {
      color: "#10B981",
      fontWeight: "800",
      textDecorationLine: "underline",
    },

    // --- PRIMARY BUTTON ("GET STARTED") ---
    // Common dimensions and centering for buttons
    buttonBase: {
      paddingVertical: 16,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: 54,
    },
    // Top margin spacing specifically for Get Started button
    signupButtonSpacing: {
      marginTop: 10,
    },
    // Default "Get Started" button background color
    buttonUnpressed: {
      backgroundColor: logoGreen,
      borderRadius: 20,
    },
    // "Get Started" button pressed state color
    buttonPressed: {
      backgroundColor: "#059669",
      opacity: 0.85,
    },
    // "Get Started" button text color & font
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    // "Get Started" button text color when pressed
    buttonTextPressed: {
      color: "#E2E8F0",
    },
    // Row holding spinner and "Creating Account..." text
    buttonLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    // Spinner spacing next to "Creating Account..."
    buttonSpinner: {
      marginRight: 8,
    },
    // "Creating Account..." loading text style
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

    // --- GOOGLE SIGN UP BUTTON ---
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
    // "Sign up with Google" text color & font
    googleButtonText: {
      color: theme?.textPrimary || "#64748B",
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    // "Sign up with Google" text color when pressed
    googleButtonTextPressed: {
      color: theme?.textPrimary || "#0F172A",
    },

    // --- FOOTER ("ALREADY HAVE AN ACCOUNT? SIGN IN") ---
    // Bottom row layout
    footerRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 32,
    },
    // "Already have an account?" text color
    footerText: {
      color: theme?.textSecondary || "#64748B",
      fontSize: 14,
      fontWeight: "700",
    },
    // "Sign In" clickable link text color
    linkText: {
      color: logoGreen,
      fontSize: 14,
      fontWeight: "900",
    },
  });
