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
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  AlertCircle,
  Check,
  X,
} from "lucide-react-native";
import API_URL from "../config/api";
import { useCustomAlert } from "../../context/CustomAlertContext";
import { useTheme } from "../../context/ThemeContext";

export default function SignUpScreen({ onNavigateToLogin, onSignUpSuccess }) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false); // Tracks if the user interacted with the password field
  const [isLoading, setIsLoading] = useState(false);

  // Google Sign In States
  const [isGooglePressed, setIsGooglePressed] = useState(false);
  const [isGoogleModalVisible, setIsGoogleModalVisible] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");

  // Evaluates validation rules for password criteria
  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const isPasswordValid =
    hasMinLength && hasSpecialChar && hasLowercase && hasUppercase && hasNumber;
  const showPasswordWarning = passwordTouched && !isPasswordValid;

  const passwordCriteria = [
    {
      label: "Lowercase & uppercase letters",
      valid: hasLowercase && hasUppercase,
    },
    { label: "At least 1 number", valid: hasNumber },
    { label: "At least 1 special character", valid: hasSpecialChar },
    { label: "Minimum 8 characters", valid: hasMinLength },
  ];

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setPasswordTouched(true);
      showAlert("Registration Error", "Please fill in all fields.");
      return;
    }
    if (!isPasswordValid) {
      setPasswordTouched(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        data = {};
      }

      if (response.ok) {
        onSignUpSuccess(
          data.user_id,
          name.trim(),
          email.trim(),
          password.trim(),
        );
      } else {
        setIsLoading(false);
        showAlert(
          "Registration Error",
          data.detail || "Failed to create account. Please try again.",
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.log("SIGNUP ERROR:", error);
      showAlert(
        "Registration Error",
        "Cannot connect to backend server. Make sure it is running and your IP is correct.",
      );
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsGoogleModalVisible(true);
    setCustomGoogleEmail("");
  };

  const submitGoogleSignIn = async (selectedEmail) => {
    if (!selectedEmail) {
      showAlert("Input Error", "Please enter a Google email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(selectedEmail)) {
      showAlert("Input Error", "Please enter a valid email address.");
      return;
    }

    const derivedName = selectedEmail
      .split("@")[0]
      .split(/[._-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    setIsGoogleModalVisible(false);
    setIsLoading(true);
    setIsGooglePressed(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const generatedGooglePassword =
        "GUser!" + Math.random().toString(36).slice(2, 12);

      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedEmail,
          name: derivedName,
          password: generatedGooglePassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSignUpSuccess(
          data.user_id || null,
          derivedName,
          selectedEmail,
          generatedGooglePassword,
        );
      } else {
        setIsLoading(false);
        setIsGooglePressed(false);
        showAlert(
          "Registration Error",
          data.detail || "Google authentication failed.",
        );
      }
    } catch (error) {
      setIsLoading(false);
      setIsGooglePressed(false);
      showAlert(
        "Registration Error",
        "Cannot connect to backend server. Check your network.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme?.background || baseColor} />
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
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>
              Build your personalized AI nutrition profile.
              {"\n"}Start scanning food & tracking workouts today.
            </Text>
          </View>

          {/* Form Card Group */}
          <View style={styles.formCard}>
            {/* Username Field Group */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={[styles.flatInputField, styles.fieldRow]}>
                <User color="#94A3B8" size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor={theme?.placeholderText || "#94A3B8"}
                  value={name}
                  onChangeText={setName}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Field Group */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.flatInputField, styles.fieldRow]}>
                <Mail color="#94A3B8" size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={theme?.placeholderText || "#94A3B8"}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Field Group */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.flatInputField,
                  styles.fieldRow,
                  showPasswordWarning && styles.inputWarningBorder,
                ]}
              >
                <Lock
                  color={showPasswordWarning ? "#64748B" : "#94A3B8"}
                  size={20}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={theme?.placeholderText || "#94A3B8"}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (!passwordTouched) setPasswordTouched(true);
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  secureTextEntry={secureTextEntry}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  activeOpacity={0.6}
                >
                  {secureTextEntry ? (
                    <EyeOff
                      color={showPasswordWarning ? "#64748B" : "#94A3B8"}
                      size={22}
                    />
                  ) : (
                    <Eye
                      color={showPasswordWarning ? "#64748B" : "#10B981"}
                      size={22}
                    />
                  )}
                </TouchableOpacity>
              </View>

              {/* Live Password Criteria Checklist (only shown when user types or on error) */}
              {(password.length > 0 || showPasswordWarning) && (
                <View style={styles.criteriaContainer}>
                  {showPasswordWarning && (
                    <View style={styles.warningHeaderRow}>
                      <AlertCircle color="#64748B" size={14} />
                      <Text style={styles.criteriaHeaderWarning}>
                        Password must contain:
                      </Text>
                    </View>
                  )}
                  {passwordCriteria.map((item, index) => {
                    const isSuccess = item.valid;
                    const isError = showPasswordWarning && !item.valid;
                    return (
                      <View key={index} style={styles.criteriaRow}>
                        {isSuccess ? (
                          <Check
                            color="#10B981"
                            size={16}
                            style={styles.criteriaIcon}
                          />
                        ) : (
                          <X
                            color={isError ? "#64748B" : "#CBD5E1"}
                            size={16}
                            style={styles.criteriaIcon}
                          />
                        )}
                        <Text
                          style={[
                            styles.criteriaText,
                            isSuccess && styles.criteriaTextSuccess,
                            isError && styles.criteriaTextError,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Get Started Button */}
            <TouchableOpacity
              activeOpacity={1}
              disabled={isLoading}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleSignup}
              style={[
                styles.buttonBase,
                isPressed ? styles.buttonPressed : styles.buttonUnpressed,
                { marginTop: 10 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.buttonText,
                    isPressed && styles.buttonTextPressed,
                  ]}
                >
                  Get Started
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
                  <Image
                    source={require("../../images/google.png")}
                    style={styles.googleIconImage}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      styles.googleButtonText,
                      isGooglePressed && styles.googleButtonTextPressed,
                    ]}
                  >
                    Sign up with Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Footer Row */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* GOOGLE ACCOUNTS SELECTOR MODAL */}
      <Modal
        visible={isGoogleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsGoogleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            <Text style={styles.modalTitle}>Google Sign Up</Text>
            <Text style={styles.modalSubtitle}>
              to create an account on MacroSync
            </Text>

            <View style={styles.customInputArea}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Google Email Address</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Enter Google email"
                  placeholderTextColor={theme?.placeholderText || "#94A3B8"}
                  value={customGoogleEmail}
                  onChangeText={setCustomGoogleEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.modalActionButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setIsGoogleModalVisible(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSubmit]}
                  onPress={() => submitGoogleSignIn(customGoogleEmail)}
                >
                  <Text style={styles.modalButtonSubmitText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Flat Design Tokens
const baseColor = "#F8FAFC";
const logoGreen = "#10B981";

const getStyles = (theme, isDarkMode) => StyleSheet.create({
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
    borderColor: theme?.border || "#E2E8F0",
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
  inputWarningBorder: {
    borderColor: "#E2E8F0",
  },
  criteriaContainer: {
    marginTop: 10,
    marginLeft: 6,
  },
  warningHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  criteriaHeaderWarning: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 5,
  },
  criteriaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  criteriaIcon: {
    marginRight: 8,
  },
  criteriaText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme?.textSecondary || "#CBD5E1",
  },
  criteriaTextSuccess: {
    color: "#10B981",
    fontWeight: "700",
  },
  criteriaTextError: {
    color: "#64748B",
    fontWeight: "700",
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
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
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
    borderColor: theme?.border || "#E2E8F0",
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
