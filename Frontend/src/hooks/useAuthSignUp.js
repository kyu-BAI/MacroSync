import { useState, useCallback, useMemo } from "react";
import API_URL from "../screens/config/api";
import { useCustomAlert } from "../context/CustomAlertContext";
import {
  saveUserId,
  setRememberMe,
  saveRememberedGoogleEmail,
} from "../services/OfflineStorage";

export default function useAuthSignUp({ onSignUpSuccess }) {
  const { showAlert: triggerCustomAlert } = useCustomAlert();

  // Form Fields State
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  // Field Touched / Validation Tracking
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    terms: false,
  });

  // Terms and Privacy State
  const [hasReadPolicies, setHasReadPolicies] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [privacyInitialTab, setPrivacyInitialTab] = useState("terms");

  // Loading & Google Modal States
  const [loadingType, setLoadingType] = useState(null); // 'signup' | 'google' | null
  const [isGoogleModalVisible, setIsGoogleModalVisible] = useState(false);

  const isLoading = loadingType !== null;
  const isSignupLoading = loadingType === "signup";
  const isGoogleLoading = loadingType === "google";

  const showAlert = useCallback(
    (title, message, buttons = []) => {
      triggerCustomAlert(title, message, buttons);
    },
    [triggerCustomAlert]
  );

  // Field change & blur handlers
  const handleNameChange = useCallback((text) => {
    setForm((prev) => ({ ...prev, name: text }));
    setTouched((prev) => (prev.name ? prev : { ...prev, name: true }));
  }, []);

  const handleNameBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, name: true }));
  }, []);

  const handleEmailChange = useCallback((text) => {
    setForm((prev) => ({ ...prev, email: text }));
    setTouched((prev) => (prev.email ? prev : { ...prev, email: true }));
  }, []);

  const handleEmailBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, email: true }));
  }, []);

  const handlePasswordChange = useCallback((text) => {
    setForm((prev) => ({ ...prev, password: text }));
    setTouched((prev) => (prev.password ? prev : { ...prev, password: true }));
  }, []);

  const handlePasswordBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, password: true }));
  }, []);

  // ==========================================
  // FIELD VALIDATIONS
  // ==========================================

  // Username validation
  const trimmedName = form.name.trim();
  const isNameEmpty = !trimmedName;
  const hasMinNameLength = trimmedName.length >= 3;
  const hasValidNameChars = /^[a-zA-Z0-9_\s]+$/.test(trimmedName);
  const isNameValid = !isNameEmpty && hasMinNameLength && hasValidNameChars;
  const showNameWarning = touched.name && !isNameValid;

  const getNameErrorMessage = useCallback(() => {
    if (isNameEmpty) return "Username is required";
    if (!hasMinNameLength) return "Username must be at least 3 characters";
    if (!hasValidNameChars) return "Only letters, numbers, spaces, or underscores allowed";
    return "";
  }, [isNameEmpty, hasMinNameLength, hasValidNameChars]);

  // Email validation
  const trimmedEmail = form.email.trim();
  const isEmailEmpty = !trimmedEmail;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = !isEmailEmpty && emailRegex.test(trimmedEmail);
  const showEmailWarning = touched.email && !isEmailValid;

  const getEmailErrorMessage = useCallback(() => {
    if (isEmailEmpty) return "Email address is required";
    if (!trimmedEmail.includes("@")) return "Email must contain '@' (e.g. name@gmail.com)";
    if (!isEmailValid) return "Please enter a valid email address (e.g. name@gmail.com)";
    return "";
  }, [isEmailEmpty, trimmedEmail, isEmailValid]);

  // Password validation
  const hasLowercase = /[a-z]/.test(form.password);
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);
  const hasMinLength = form.password.length >= 8;

  const isPasswordValid =
    hasLowercase &&
    hasUppercase &&
    hasNumber &&
    hasSpecialChar &&
    hasMinLength;

  const showPasswordWarning = touched.password && !isPasswordValid;

  const passwordCriteria = useMemo(
    () => [
      {
        label: "Lowercase & uppercase letters",
        valid: hasLowercase && hasUppercase,
      },
      { label: "At least 1 number", valid: hasNumber },
      { label: "At least 1 special character", valid: hasSpecialChar },
      { label: "Minimum 8 characters", valid: hasMinLength },
    ],
    [hasLowercase, hasUppercase, hasNumber, hasSpecialChar, hasMinLength]
  );

  // Policy agreement validation
  const isTermsValid = hasReadPolicies && agreeToTerms;
  const showTermsWarning = touched.terms && !isTermsValid;

  // Policy modal openers
  const handleToggleAgreeTerms = useCallback(() => {
    if (!hasReadPolicies) {
      setPrivacyInitialTab("terms");
      setPrivacyModalVisible(true);
    } else {
      setAgreeToTerms((prev) => !prev);
    }
  }, [hasReadPolicies]);

  const handleOpenTerms = useCallback(() => {
    setPrivacyInitialTab("terms");
    setPrivacyModalVisible(true);
  }, []);

  const handleOpenPrivacy = useCallback(() => {
    setPrivacyInitialTab("privacy");
    setPrivacyModalVisible(true);
  }, []);

  const handleOpenMedical = useCallback(() => {
    setPrivacyInitialTab("medical");
    setPrivacyModalVisible(true);
  }, []);

  const handleClosePrivacyModal = useCallback(() => {
    setPrivacyModalVisible(false);
  }, []);

  const handleAgreePolicies = useCallback(() => {
    setHasReadPolicies(true);
    setAgreeToTerms(true);
    setTouched((prev) => ({ ...prev, terms: false }));
  }, []);

  // Google modal handlers
  const handleOpenGoogleModal = useCallback(() => {
    if (isLoading) return;
    if (!isTermsValid) {
      setTouched((prev) => ({ ...prev, terms: true }));
      setPrivacyInitialTab("terms");
      setPrivacyModalVisible(true);
      return;
    }
    setIsGoogleModalVisible(true);
  }, [isLoading, isTermsValid]);

  const handleCloseGoogleModal = useCallback(() => {
    setIsGoogleModalVisible(false);
  }, []);

  // Standard Registration submit handler
  const handleSignup = useCallback(async () => {
    setTouched({
      name: true,
      email: true,
      password: true,
      terms: true,
    });

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isTermsValid) {
      return;
    }

    if (isLoading) return;
    setLoadingType("signup");

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: form.password.trim(),
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        data = {};
      }

      if (response.ok) {
        if (onSignUpSuccess) {
          onSignUpSuccess(
            data.user_id,
            trimmedName,
            trimmedEmail,
            form.password.trim()
          );
        }
      } else {
        setLoadingType(null);
        showAlert(
          "Registration Error",
          data.detail || "Failed to create account. Please try again."
        );
      }
    } catch (error) {
      setLoadingType(null);
      if (__DEV__) console.log("SIGNUP ERROR:", error);
      showAlert(
        "Registration Error",
        "Cannot connect to backend server. Make sure it is running and your IP is correct."
      );
    }
  }, [
    isNameValid,
    isEmailValid,
    isPasswordValid,
    isTermsValid,
    isLoading,
    trimmedName,
    trimmedEmail,
    form.password,
    onSignUpSuccess,
    showAlert,
  ]);

  // Google Account Select Handler
  const handleGoogleAccountSelect = useCallback(
    async (selectedEmail, selectedName, shouldRemember = true) => {
      setLoadingType("google");

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

        const data = await response.json();
        if (__DEV__) console.log("Google Sign Up response:", data);

        setLoadingType(null);
        setIsGoogleModalVisible(false);

        if (response.ok && data.success) {
          const uid = data.user_id || data.user?.id;
          if (uid) {
            await saveUserId(uid);
            await setRememberMe(shouldRemember);
            if (shouldRemember && selectedEmail) {
              await saveRememberedGoogleEmail(selectedEmail);
            }
          }

          if (!onSignUpSuccess) return;

          if (data.is_new_user) {
            onSignUpSuccess(
              uid,
              selectedName,
              selectedEmail,
              data.temp_password,
              false
            );
          } else if (data.is_onboarded === true) {
            onSignUpSuccess(uid, selectedName, selectedEmail, null, true);
          } else {
            onSignUpSuccess(uid, selectedName, selectedEmail, null, false);
          }
        } else {
          showAlert(
            "Registration Error",
            data.detail || "Google authentication failed. Please try again."
          );
        }
      } catch (error) {
        setLoadingType(null);
        setIsGoogleModalVisible(false);
        if (__DEV__) console.log("GOOGLE SIGNUP ERROR:", error);
        showAlert(
          "Registration Error",
          "Cannot connect to backend server. Check your network."
        );
      }
    },
    [onSignUpSuccess, showAlert]
  );

  return {
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
  };
}
