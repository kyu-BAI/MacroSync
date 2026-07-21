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

export default function SignUpScreen({ onNavigateToLogin, onSignUpSuccess }) {
  const { showAlert } = useCustomAlert();
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
        showAlert(
          "Registration Error",
          data.detail || "Failed to create account. Please try again.",
        );
      }
    } catch (error) {
      console.log("SIGNUP ERROR:", error);
      showAlert(
        "Registration Error",
        "Cannot connect to backend server. Make sure it is running and your IP is correct.",
      );
    } finally {
      setIsLoading(false);
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
        showAlert(
          "Registration Error",
          data.detail || "Google authentication failed.",
        );
      }
    } catch (error) {
      showAlert(
        "Registration Error",
        "Cannot connect to backend server. Check your network.",
      );
    } finally {
      setIsLoading(false);
      setIsGooglePressed(false);
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
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>
              Build your personalized AI nutrition profile.
              {"\n"}Start scanning food & tracking workouts today.
            </Text>
          </View>

          {/* Form Card Group - High Intensity Neumorphic Extrusion */}
          <View style={styles.formCard}>
            {/* Username Field Group */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
                <User color="#7FA293" size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="#7FA293"
                  value={name}
                  onChangeText={setName}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Field Group */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
                <Mail color="#7FA293" size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#7FA293"
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
                  styles.neumorphicInputInset,
                  styles.fieldRow,
                  showPasswordWarning && styles.inputWarningBorder,
                ]}
              >
                <Lock
                  color={showPasswordWarning ? "#C53030" : "#7FA293"}
                  size={20}
                  style={styles.leadingIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#7FA293"
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
                      color={showPasswordWarning ? "#C53030" : "#7FA293"}
                      size={22}
                    />
                  ) : (
                    <Eye
                      color={showPasswordWarning ? "#C53030" : "#4EA685"}
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
                      <AlertCircle color="#C53030" size={14} />
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
                            color="#2E7D32"
                            size={16}
                            style={styles.criteriaIcon}
                          />
                        ) : (
                          <X
                            color={isError ? "#C53030" : "#94A3B8"}
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
                <ActivityIndicator size="small" color="#41544B" />
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
                  placeholderTextColor="#7FA293"
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

// Intensified Hybrid Neumorphic Theme Constants
const baseColor = "#F0F4F2";
const clearWhiteHighlight = "#FFFFFF";
const softGreenShadow = "#AEC2B7";

// Logo Branding Metrics
const logoGreen = "#4EA685";
const logoDarkShadow = "#37745D";
const logoLightHighlight = "#65D8AD";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColor,
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
    color: "#556B60",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "700",
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
    marginBottom: 22,
  },
  inputLabel: {
    color: "#41544B",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  neumorphicInputInset: {
    backgroundColor: baseColor,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#D4E2DC",
    shadowColor: logoGreen,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  inputWarningBorder: {
    borderColor: "#FEB2B2",
    shadowColor: "#C53030",
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
    color: "#C53030",
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
    color: "#94A3B8",
  },
  criteriaTextSuccess: {
    color: "#2E7D32",
    fontWeight: "700",
  },
  criteriaTextError: {
    color: "#C53030",
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
    color: "#1A2B23",
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
    backgroundColor: "#53B28E",
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
    backgroundColor: "#3E836A",
    borderWidth: 1.5,
    borderColor: logoDarkShadow,
    transform: [{ translateY: 2 }],
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
    textShadowColor: logoDarkShadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonTextPressed: {
    color: "#9EDEC4",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    color: "#556B60",
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
    backgroundColor: "#D4E2DC",
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7FA293",
    paddingHorizontal: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  googleButtonBase: {
    marginTop: 0,
  },
  googleButtonUnpressed: {
    backgroundColor: baseColor,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "#E1E9E5",
  },
  googleButtonPressed: {
    backgroundColor: "#E4ECE8",
    borderWidth: 1.5,
    borderColor: "#D4E2DC",
    transform: [{ translateY: 2 }],
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
    color: "#41544B",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  googleButtonTextPressed: {
    color: "#21332A",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 43, 35, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContentCard: {
    backgroundColor: baseColor,
    borderRadius: 36,
    width: "100%",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: "#D4E2DC",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1A2B23",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#556B60",
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
    color: "#41544B",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalTextInput: {
    backgroundColor: "#E4ECE8",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A2B23",
    fontWeight: "700",
    borderWidth: 1,
    borderColor: "#D4E2DC",
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
    backgroundColor: "#E4ECE8",
    borderWidth: 1,
    borderColor: "#D4E2DC",
  },
  modalButtonCancelText: {
    color: "#556B60",
    fontWeight: "800",
    fontSize: 15,
  },
  modalButtonSubmit: {
    backgroundColor: "#53B28E",
  },
  modalButtonSubmitText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
});
