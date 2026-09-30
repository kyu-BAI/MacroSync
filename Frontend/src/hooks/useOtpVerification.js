import { useState, useEffect, useCallback } from "react";
import API_URL from "../screens/config/api";
import { useCustomAlert } from "../context/CustomAlertContext";

export default function useOtpVerification({ email, onVerified }) {
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

  // Timer cooldown countdown
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
        showAlert("OTP Resent", "A new OTP code has been sent to your email.");
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

  // Verify OTP logic with 15s timeout
  const handleVerifyOTP = useCallback(
    async (codeToVerify) => {
      const targetOtp = (typeof codeToVerify === "string" ? codeToVerify : otp).trim();

      if (!targetOtp) {
        showAlert("Missing OTP", "Please enter the OTP code.");
        return;
      }

      if (isLoading) return;
      setIsLoading(true);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${API_URL}/verify-reset-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: (email || "").trim(),
            otp: targetOtp,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          showAlert("Success", "OTP verified successfully.");
          if (onVerified) onVerified();
        } else {
          showAlert(
            "Error",
            data.detail || "Invalid or expired OTP. Please try again."
          );
        }
      } catch (error) {
        if (__DEV__) console.log("VERIFY OTP ERROR:", error);
        showAlert(
          "Network Error",
          "Cannot connect to backend server. Make sure it is running and your IP is correct."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [email, otp, isLoading, onVerified, showAlert]
  );

  // Auto-submit when user reaches 6th digit
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
