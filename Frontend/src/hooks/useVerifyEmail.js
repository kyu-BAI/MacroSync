import { useState, useEffect, useCallback } from "react";
import API_URL from "../screens/config/api";
import { useCustomAlert } from "../context/CustomAlertContext";

export default function useVerifyEmail({
  email,
  name,
  password,
  isLogin,
  onVerified,
}) {
  const { showAlert: triggerAlert } = useCustomAlert();

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const showAlert = useCallback(
    (title, message) => {
      triggerAlert(title, message);
    },
    [triggerAlert]
  );

  // Cooldown timer tick down
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Resend OTP logic with 15s timeout
  const handleResendOTP = useCallback(async () => {
    if (isResending || resendCooldown > 0) return;
    setIsResending(true);

    try {
      const cleanEmail = (email || "").trim();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        showAlert("OTP Resent", "A new verification code has been sent to your email.");
        setResendCooldown(30);
      } else {
        const data = await response.json().catch(() => ({}));
        showAlert(
          "Resend Error",
          data.detail || "Failed to resend OTP code. Please try again."
        );
      }
    } catch (err) {
      if (__DEV__) console.log("RESEND OTP ERROR:", err);
      showAlert(
        "Network Error",
        "Cannot connect to backend server. Make sure it is running."
      );
    } finally {
      setIsResending(false);
    }
  }, [email, isResending, resendCooldown, showAlert]);

  // Verify OTP for Signup or Login with 15s timeout
  const handleVerifyOTP = useCallback(
    async (codeToVerify) => {
      const targetOtp = (typeof codeToVerify === "string" ? codeToVerify : otp).trim();
      if (!targetOtp) {
        showAlert("Missing OTP", "Please enter the 6-digit OTP code.");
        return;
      }

      if (isLoading) return;
      setIsLoading(true);

      try {
        const cleanEmail = (email || "").trim();
        const cleanOtp = targetOtp;
        const cleanName = (name || "").trim();
        const cleanPassword = (password || "").trim();

        const endpoint = isLogin ? "/verify-login" : "/verify-signup";
        const payload = isLogin
          ? { email: cleanEmail, otp: cleanOtp }
          : {
              email: cleanEmail,
              otp: cleanOtp,
              name: cleanName,
              password: cleanPassword,
            };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        let data = null;
        try {
          data = await response.json();
        } catch (jsonErr) {
          data = null;
        }

        if (response.ok && data && data.user_id) {
          setIsLoading(false);
          if (onVerified) onVerified(data.user_id, data.is_onboarded);
        } else {
          setIsLoading(false);
          showAlert(
            "Verification Error",
            data?.detail || "Invalid or expired OTP code. Please check your email."
          );
        }
      } catch (error) {
        setIsLoading(false);
        if (__DEV__) console.log("VERIFY OTP ERROR:", error);
        showAlert(
          "Network Error",
          "Connection timed out or failed to reach the server. Please check your internet connection."
        );
      }
    },
    [email, otp, name, password, isLogin, isLoading, onVerified, showAlert]
  );

  // Auto-submit on 6th digit
  const handleOtpChange = useCallback(
    (text) => {
      const numericText = text.replace(/[^0-9]/g, "").slice(0, 6);
      setOtp(numericText);
      if (numericText.length === 6) {
        handleVerifyOTP(numericText);
      }
    },
    [handleVerifyOTP]
  );

  return {
    otp,
    isLoading,
    isResending,
    resendCooldown,
    handleResendOTP,
    handleVerifyOTP,
    handleOtpChange,
  };
}
