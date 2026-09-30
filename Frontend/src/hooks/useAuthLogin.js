import { useState, useEffect, useCallback } from "react";
import API_URL from "../screens/config/api";
import { useCustomAlert } from "../context/CustomAlertContext";
import {
  saveUserId,
  setRememberMe,
  isRememberMeEnabled,
  saveRememberedGoogleEmail,
  saveRememberedCredentials,
  getRememberedCredentials,
  clearRememberedCredentials,
} from "../services/OfflineStorage";

export default function useAuthLogin({
  setCurrentUserId,
  onLoginSuccess,
  onGoogleOtpSent,
}) {
  const { showAlert: triggerCustomAlert } = useCustomAlert();

  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMeState] = useState(true);
  const [loadingType, setLoadingType] = useState(null); // 'email' | 'google' | null
  const [isGoogleModalVisible, setIsGoogleModalVisible] = useState(false);

  const isLoading = loadingType !== null;
  const isEmailLoading = loadingType === "email";
  const isGoogleLoading = loadingType === "google";

  const showAlert = useCallback(
    (message, title = "Login Error", buttons = []) => {
      triggerCustomAlert(title, message, buttons);
    },
    [triggerCustomAlert]
  );

  // Auto-restore Remembered Credentials & Toggle State on Mount
  useEffect(() => {
    let isMounted = true;
    async function loadSavedRememberedState() {
      try {
        const enabled = await isRememberMeEnabled();
        if (!isMounted) return;
        setRememberMeState(enabled);
        if (enabled) {
          const creds = await getRememberedCredentials();
          if (!isMounted) return;
          if (creds?.email || creds?.password) {
            setForm({
              email: creds.email || "",
              password: creds.password || "",
            });
          }
        }
      } catch (err) {
        if (__DEV__) console.log("Error loading remembered credentials:", err);
      }
    }
    loadSavedRememberedState();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleEmailChange = useCallback((email) => {
    setForm((prev) => ({ ...prev, email }));
  }, []);

  const handlePasswordChange = useCallback((password) => {
    setForm((prev) => ({ ...prev, password }));
  }, []);

  const handleToggleRememberMe = useCallback(() => {
    setRememberMeState((prev) => !prev);
  }, []);

  const handleOpenGoogleModal = useCallback(() => {
    if (isLoading) return;
    setIsGoogleModalVisible(true);
  }, [isLoading]);

  const handleCloseGoogleModal = useCallback(() => {
    setIsGoogleModalVisible(false);
  }, []);

  // STANDARD EMAIL/PASSWORD AUTHENTICATION FLOW
  const handleLogin = useCallback(async () => {
    if (isLoading) return;
    const trimmedEmail = form.email.trim();
    if (!trimmedEmail || !form.password) {
      showAlert("Please enter both your email and password.");
      return;
    }

    setLoadingType("email");
    try {
      const response = await fetch(`${API_URL}/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail, password: form.password }),
      });

      const data = await response.json();
      if (__DEV__) console.log("[Login] Response:", data);

      if (response.ok) {
        const userId = data.user?.id || data.user_id;
        if (setCurrentUserId && userId) {
          setCurrentUserId(userId);
        }

        // Call onLoginSuccess INSTANTLY for 0ms screen switch
        if (onLoginSuccess) {
          onLoginSuccess(userId, data.is_onboarded, data.user);
        }

        // Perform storage persistence non-blockingly in background
        Promise.all([
          userId ? saveUserId(userId) : Promise.resolve(),
          setRememberMe(rememberMe),
          rememberMe
            ? saveRememberedCredentials(trimmedEmail, form.password)
            : clearRememberedCredentials(),
        ]).catch((err) => {
          if (__DEV__) console.log("Storage persistence error:", err);
        });
      } else {
        setLoadingType(null);
        showAlert(data.detail || "Incorrect email or password. Please try again.");
      }
    } catch (error) {
      setLoadingType(null);
      if (__DEV__) console.log("LOGIN ERROR:", error);
      showAlert("Cannot connect to backend server. Check your network.");
    }
  }, [isLoading, form.email, form.password, rememberMe, setCurrentUserId, onLoginSuccess, showAlert]);

  // GOOGLE ACCOUNT SELECTION HANDLER
  const handleGoogleAccountSelect = useCallback(
    async (selectedEmail, selectedName, shouldRemember = true) => {
      try {
        setLoadingType("google");
        if (__DEV__) {
          console.log("Initiating Google Sign-In backend verification for:", selectedEmail, selectedName);
        }

        const response = await fetch(`${API_URL}/auth/google-signin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: selectedEmail, name: selectedName }),
        });

        let data = {};
        try {
          data = await response.json();
        } catch (jsonErr) {
          if (__DEV__) console.log("JSON Parse Error on Google Signin:", jsonErr);
          data = { detail: "Backend server error. Please try again in a moment." };
        }
        if (__DEV__) console.log("Google Sign-In response:", data);

        setLoadingType(null);
        setIsGoogleModalVisible(false);

        if (response.ok && data.success) {
          const uid = data.user_id || data.user?.id;
          if (setCurrentUserId && uid) {
            setCurrentUserId(uid);
          }

          if (uid) {
            await saveUserId(uid);
            await setRememberMe(shouldRemember);
            if (shouldRemember && selectedEmail) {
              await saveRememberedGoogleEmail(selectedEmail);
            }
          }

          if (data.is_new_user) {
            if (onGoogleOtpSent) {
              onGoogleOtpSent(true, selectedEmail, selectedName, data.temp_password, false);
            }
          } else if (data.is_onboarded === true) {
            if (onLoginSuccess) onLoginSuccess(uid, true, data.user);
          } else {
            if (onLoginSuccess) onLoginSuccess(uid, false, data.user);
          }
        } else {
          showAlert(data.detail || "Google authentication failed. Please try again.", "Authentication Failed");
        }
      } catch (error) {
        setLoadingType(null);
        setIsGoogleModalVisible(false);
        if (__DEV__) console.log("GOOGLE LOGIN ERROR:", error);
        showAlert("Cannot connect to backend server. Check your network.", "Connection Error");
      }
    },
    [setCurrentUserId, onGoogleOtpSent, onLoginSuccess, showAlert]
  );

  return {
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
  };
}
