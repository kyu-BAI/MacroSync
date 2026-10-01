// ============================================================================
// File: Frontend/src/components/settings/ChangePasswordModal.jsx
// Description: Encapsulated Change Password modal dialog for MacroSync.
// Performance Optimization: Holds password inputs and visibility toggles in
//                           local state to eliminate re-renders of SettingsScreen.
// ============================================================================

import React, { useState, useMemo, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

export default React.memo(function ChangePasswordModal({
  visible,
  onClose,
  isChangingPassword,
  onChangePassword,
  styles,
}) {
  // Local form inputs (eliminates re-renders of the parent screen while typing)
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Local visibility toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Memoized live password validation rules (only recomputed when newPassword changes)
  const pwRules = useMemo(
    () => [
      { label: "At least 8 characters", ok: newPassword.length >= 8 },
      { label: "One uppercase letter (A–Z)", ok: /[A-Z]/.test(newPassword) },
      { label: "One lowercase letter (a–z)", ok: /[a-z]/.test(newPassword) },
      { label: "One number (0–9)", ok: /[0-9]/.test(newPassword) },
      {
        label: "One special character (!@#$…)",
        ok: /[^A-Za-z0-9]/.test(newPassword),
      },
    ],
    [newPassword],
  );

  const allRulesPass = useMemo(
    () => pwRules.every((r) => r.ok),
    [pwRules],
  );

  // Form validity check for button affordance
  const isFormValid =
    oldPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    allRulesPass &&
    newPassword === confirmPassword;

  // Clear inputs and dismiss modal
  const handleDismiss = useCallback(() => {
    if (isChangingPassword) return; // Prevent dismissing while request is in-flight
    onClose();
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [isChangingPassword, onClose]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!onChangePassword || isChangingPassword) return;

    const success = await onChangePassword({
      oldPassword: oldPassword.trim(),
      newPassword: newPassword.trim(),
      confirmPassword: confirmPassword.trim(),
    });

    if (success) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [onChangePassword, isChangingPassword, oldPassword, newPassword, confirmPassword]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Change Password</Text>
          <Text style={styles.modalSubtitle}>
            Enter password details below
          </Text>

          {/* Current Password Field */}
          <Text style={styles.inputLabel}>Current Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordTextInput}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Enter current password"
              placeholderTextColor="#CBD5E1"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showOldPassword}
              editable={!isChangingPassword}
            />
            <TouchableOpacity
              onPress={() => setShowOldPassword((prev) => !prev)}
              activeOpacity={0.7}
              disabled={isChangingPassword}
            >
              {showOldPassword ? (
                <Eye color="#94A3B8" size={20} />
              ) : (
                <EyeOff color="#94A3B8" size={20} />
              )}
            </TouchableOpacity>
          </View>

          {/* New Password Field */}
          <Text style={styles.inputLabel}>New Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordTextInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#CBD5E1"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showNewPassword}
              editable={!isChangingPassword}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword((prev) => !prev)}
              activeOpacity={0.7}
              disabled={isChangingPassword}
            >
              {showNewPassword ? (
                <Eye color="#94A3B8" size={20} />
              ) : (
                <EyeOff color="#94A3B8" size={20} />
              )}
            </TouchableOpacity>
          </View>

          {/* Live Password Requirements Checklist */}
          {newPassword.length > 0 && !allRulesPass && (
            <View
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.06)",
                borderRadius: 12,
                padding: 12,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.20)",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: "#64748B",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                }}
              >
                Password must contain
              </Text>
              {pwRules.map((rule, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 5,
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: rule.ok
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(239,68,68,0.10)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: rule.ok ? "#10B981" : "#EF4444",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "900",
                        color: rule.ok ? "#10B981" : "#EF4444",
                      }}
                    >
                      {rule.ok ? "✓" : "✕"}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: rule.ok ? "#10B981" : "#94A3B8",
                    }}
                  >
                    {rule.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Confirm New Password Field */}
          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordTextInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#CBD5E1"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showConfirmPassword}
              editable={!isChangingPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              activeOpacity={0.7}
              disabled={isChangingPassword}
            >
              {showConfirmPassword ? (
                <Eye color="#94A3B8" size={20} />
              ) : (
                <EyeOff color="#94A3B8" size={20} />
              )}
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[
                styles.modalCancel,
                isChangingPassword && { opacity: 0.5 },
              ]}
              onPress={handleDismiss}
              disabled={isChangingPassword}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSave,
                (!isFormValid || isChangingPassword) && styles.modalSaveDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isChangingPassword}
            >
              {isChangingPassword ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.modalSaveText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.modalSaveText}>Change</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});
