// --- IMPORTS ---
import React, { useMemo } from "react";
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
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import PrivacyModal from "../../components/PrivacyModal";
import useStepFourHealth, {
  PRESET_ALLERGENS,
  PRESET_MEDICAL_CONDITIONS,
} from "../../hooks/useStepFourHealth";

// --- CONFIG & THEME TOKENS ---
const COLORS = {
  base: "#F8FAFC",
  card: "#FFFFFF",
  white: "#FFFFFF",
  logoGreen: "#10B981",
  textDark: "#0F172A",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#9CA3AF",
  borderLight: "#E2E8F0",
  amberBorder: "#FDE68A",
  amberText: "#D97706",
  amberBg: "rgba(245, 158, 11, 0.08)",
  amberTag: "#B45309",
  overlayBg: "rgba(0, 0, 0, 0.5)",
};

// --- SUBCOMPONENTS ---

// 1. Allergies and dietary restrictions selector
function AllergensSection({
  selectedAllergies,
  customAllergy,
  onToggleAllergen,
  onCustomAllergyChange,
  disabled,
  styles,
}) {
  return (
    <>
      <Text style={styles.sectionInputLabel}>Allergies & Intolerances</Text>
      <Text style={styles.inputLabel}>Select Known Allergens</Text>

      {/* Preset Allergen Chips Grid */}
      <View style={styles.chipGrid}>
        {PRESET_ALLERGENS.map((allergen) => {
          const isSelected = selectedAllergies.includes(allergen.id);
          const isNone = allergen.id === "none";
          return (
            <TouchableOpacity
              key={allergen.id}
              activeOpacity={0.8}
              disabled={disabled}
              onPress={() => onToggleAllergen(allergen.id)}
              style={[
                styles.chip,
                isSelected
                  ? isNone
                    ? styles.chipActiveNone
                    : styles.chipActive
                  : styles.chipInactive,
              ]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {allergen.title}
              </Text>
              {isSelected && (
                <Ionicons
                  name={isNone ? "checkmark-circle" : "close-circle"}
                  size={14}
                  color={COLORS.white}
                  style={styles.chipIconMargin}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Allergen Input Field */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Other Custom Food Allergy</Text>
        <View style={styles.flatInputField}>
          <TextInput
            style={styles.input}
            placeholder="e.g., Shrimp, Almonds (Optional)"
            placeholderTextColor={COLORS.textMuted}
            value={customAllergy}
            onChangeText={onCustomAllergyChange}
            autoCorrect
            editable={!disabled}
          />
        </View>
      </View>
    </>
  );
}

// 2. Pre-existing health screening & condition selector
function MedicalScreeningSection({
  selectedConditions,
  customCondition,
  onToggleCondition,
  onCustomConditionChange,
  disabled,
  styles,
}) {
  const hasActiveConditions =
    selectedConditions.some((c) => c !== "none") || Boolean(customCondition.trim());

  return (
    <>
      <Text style={[styles.sectionInputLabel, styles.medicalSectionLabel]}>
        Health Screening & Clinical Notice
      </Text>

      {/* Clinical Guidance Notice Banner */}
      <View style={styles.medicalNoticeBox}>
        <View style={styles.medicalNoticeHeader}>
          <Ionicons name="medical-outline" size={16} color={COLORS.amberText} />
          <Text style={styles.medicalNoticeTitle}>Pre-Existing Health Screening</Text>
        </View>
        <Text style={styles.medicalNoticeSubtitle}>
          MacroSync is an educational wellness tool. Users with diabetes, eating
          disorders, or chronic conditions should consult a healthcare
          professional rather than relying solely on automated advice.
        </Text>
      </View>

      <Text style={styles.inputLabel}>Select Any Known Medical Conditions</Text>

      {/* Preset Condition Chips Grid */}
      <View style={styles.chipGrid}>
        {PRESET_MEDICAL_CONDITIONS.map((condition) => {
          const isSelected = selectedConditions.includes(condition.id);
          const isNone = condition.id === "none";
          return (
            <TouchableOpacity
              key={condition.id}
              activeOpacity={0.8}
              disabled={disabled}
              onPress={() => onToggleCondition(condition.id)}
              style={[
                styles.chip,
                isSelected
                  ? isNone
                    ? styles.medicalChipActiveNone
                    : styles.medicalChipActive
                  : styles.medicalChipInactive,
              ]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {condition.title}
              </Text>
              {isSelected && (
                <Ionicons
                  name={isNone ? "checkmark-circle" : "close-circle"}
                  size={14}
                  color={COLORS.white}
                  style={styles.chipIconMargin}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contextual Safe Guardrail Alert */}
      {hasActiveConditions && (
        <View style={styles.guardrailNotice}>
          <Ionicons name="shield-outline" size={16} color={COLORS.logoGreen} />
          <Text style={styles.guardrailNoticeText}>
            MacroSync will calibrate your nutritional guidance accordingly. Please review all targets with your physician or registered dietitian.
          </Text>
        </View>
      )}

      {/* Custom Condition Input Field */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Other Medical Condition / Illness</Text>
        <View style={styles.flatInputField}>
          <TextInput
            style={styles.input}
            placeholder="e.g., PCOS, Thyroid, Fatty Liver (Optional)"
            placeholderTextColor={COLORS.textMuted}
            value={customCondition}
            onChangeText={onCustomConditionChange}
            autoCorrect
            editable={!disabled}
          />
        </View>
      </View>
    </>
  );
}

// 3. Medical disclaimer checkbox & privacy policy trigger
function DisclaimerAgreement({
  disclaimerAccepted,
  onToggleDisclaimer,
  onOpenPrivacyModal,
  styles,
}) {
  return (
    <View style={styles.disclaimerAgreementBox}>
      <TouchableOpacity
        style={styles.disclaimerAgreementRow}
        activeOpacity={0.7}
        onPress={onToggleDisclaimer}
      >
        <View style={[styles.disclaimerCheckbox, disclaimerAccepted && styles.disclaimerCheckboxActive]}>
          {disclaimerAccepted && (
            <Ionicons name="checkmark" size={13} color={COLORS.white} />
          )}
        </View>
        <Text style={styles.disclaimerAgreementText}>
          I confirm that I have reviewed the Medical Disclaimer and agree to the Philippine Data Privacy Act terms.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onOpenPrivacyModal("medical")}
        style={styles.disclaimerLinkButton}
        activeOpacity={0.7}
      >
        <Text style={styles.disclaimerLinkText}>Medical Disclaimer & Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
}

// 4. Pre-submission review summary confirmation sheet
function ReviewMetricsModal({
  visible,
  compiledAllergiesText,
  compiledConditionsText,
  onClose,
  onConfirm,
  styles,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmModalCard}>
          <View style={styles.confirmIconContainer}>
            <Ionicons name="shield-checkmark-outline" size={32} color={COLORS.logoGreen} />
          </View>

          <Text style={styles.confirmTitle}>Review Clinical Parameters</Text>
          <Text style={styles.confirmSubtitle}>
            Please double check your safety parameters before finalizing baseline calibrations.
          </Text>

          <View style={styles.confirmDataBlock}>
            <Text style={styles.confirmDataLabel}>Profile Exclusions & Allergies</Text>
            <Text
              style={[
                styles.confirmDataValue,
                compiledAllergiesText.includes("None")
                  ? styles.confirmDataValueMuted
                  : styles.confirmDataValueNeutral,
              ]}
            >
              {compiledAllergiesText}
            </Text>

            <View style={styles.confirmDivider} />

            <Text style={styles.confirmDataLabel}>Pre-Existing Medical Conditions</Text>
            <Text
              style={[
                styles.confirmDataValue,
                compiledConditionsText.includes("None")
                  ? styles.confirmDataValueMuted
                  : styles.confirmDataValueWarn,
              ]}
            >
              {compiledConditionsText}
            </Text>
          </View>

          <View style={styles.confirmButtonRow}>
            <TouchableOpacity style={styles.confirmCancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.confirmCancelText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmSubmitBtn} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={styles.confirmSubmitText}>Confirm & Build Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// 5. Primary submit button
function PrimaryButton({ onPress, isLoading, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isLoading}
      onPress={onPress}
      style={[styles.buttonBase, styles.buttonUnpressed]}
    >
      {isLoading ? (
        <View style={styles.buttonLoadingRow}>
          <ActivityIndicator size="small" color={COLORS.white} style={styles.buttonSpinner} />
          <Text style={[styles.buttonText, styles.buttonLoadingText]}>Calibrating Profile...</Text>
        </View>
      ) : (
        <View style={styles.buttonLoadingRow}>
          <Text style={styles.buttonText}>Complete Setup</Text>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// --- MAIN STEP FOUR SCREEN ---
export default function StepFourScreen({
  locationData,
  onBack,
  onSubmit,
  isLoadingExternal,
}) {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const {
    selectedAllergies,
    customAllergy,
    selectedConditions,
    customCondition,
    disclaimerAccepted,
    privacyModalVisible,
    privacyInitialTab,
    confirmVisible,
    compiledAllergiesText,
    compiledConditionsText,
    isLoading,
    toggleAllergen,
    toggleCondition,
    handleCustomAllergyChange,
    handleCustomConditionChange,
    handleToggleDisclaimer,
    handleOpenPrivacyModal,
    handleClosePrivacyModal,
    handleAgreePolicy,
    handleTriggerConfirmationModal,
    handleCloseConfirmModal,
    handleFinalSubmitDispatch,
  } = useStepFourHealth({ locationData, onSubmit, isLoadingExternal });

  const isScreenBusy = isLoading || isLoadingExternal;

  /* remove everything in the screen */
  // return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme?.background || COLORS.base}
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
          {/* Header Sector */}
          <View style={styles.headerSection}>
            {Boolean(onBack) && (
              <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={22} color={theme?.text || COLORS.textPrimary} />
              </TouchableOpacity>
            )}
            <Text style={styles.stepIndicator}>STEP 4 OF 4</Text>
            <Text style={styles.brandTitle}>Health & Safety Screening</Text>
            <Text style={styles.brandSubtitle}>
              Declare any food allergies or pre-existing conditions so MacroSync can personalize dietary safety parameters.
            </Text>
          </View>

          {/* Form Configuration Card */}
          <View style={styles.formCard}>
            {/* Allergens & Dietary Restrictions */}
            <AllergensSection
              selectedAllergies={selectedAllergies}
              customAllergy={customAllergy}
              onToggleAllergen={toggleAllergen}
              onCustomAllergyChange={handleCustomAllergyChange}
              disabled={isScreenBusy}
              styles={styles}
            />

            {/* Medical Screening & Conditions */}
            <MedicalScreeningSection
              selectedConditions={selectedConditions}
              customCondition={customCondition}
              onToggleCondition={toggleCondition}
              onCustomConditionChange={handleCustomConditionChange}
              disabled={isScreenBusy}
              styles={styles}
            />

            {/* Disclaimer & Policy Agreement */}
            <DisclaimerAgreement
              disclaimerAccepted={disclaimerAccepted}
              onToggleDisclaimer={handleToggleDisclaimer}
              onOpenPrivacyModal={handleOpenPrivacyModal}
              styles={styles}
            />

            {/* Complete Setup Action Button */}
            <PrimaryButton
              onPress={handleTriggerConfirmationModal}
              isLoading={isScreenBusy}
              styles={styles}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Review Metrics Confirmation Modal */}
      <ReviewMetricsModal
        visible={confirmVisible}
        compiledAllergiesText={compiledAllergiesText}
        compiledConditionsText={compiledConditionsText}
        onClose={handleCloseConfirmModal}
        onConfirm={handleFinalSubmitDispatch}
        styles={styles}
      />

      {/* Legal & Health Disclaimers Modal */}
      <PrivacyModal
        visible={privacyModalVisible}
        onClose={handleClosePrivacyModal}
        onAgree={handleAgreePolicy}
        initialTab={privacyInitialTab}
      />
    </SafeAreaView>
  );
}

// --- COMPONENT STYLES ---
function getStyles(theme, isDarkMode) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.background || COLORS.base,
    },
    scrollContainer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 30,
    },
    headerSection: {
      marginBottom: 24,
      alignItems: "center",
      width: "100%",
      maxWidth: 540,
      alignSelf: "center",
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      alignSelf: "flex-start",
    },
    stepIndicator: {
      fontSize: 11,
      fontWeight: "900",
      color: COLORS.logoGreen,
      letterSpacing: 2,
      marginBottom: 4,
      textTransform: "uppercase",
      textAlign: "center",
    },
    brandTitle: {
      fontSize: 28,
      fontWeight: "900",
      color: theme?.text || COLORS.textPrimary,
      letterSpacing: -0.5,
      marginTop: 2,
      marginBottom: 8,
      textAlign: "center",
    },
    brandSubtitle: {
      fontSize: 13.5,
      fontWeight: "600",
      color: theme?.textSecondary || COLORS.textSecondary,
      lineHeight: 20,
      textAlign: "center",
    },
    formCard: {
      backgroundColor: theme?.cardBg || COLORS.card,
      borderRadius: 18,
      padding: 20,
      width: "100%",
      maxWidth: 540,
      alignSelf: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.2 : 0.035,
      shadowRadius: 8,
      elevation: 1,
      borderWidth: 1.5,
      borderColor: theme?.cardBorder || COLORS.borderLight,
    },
    sectionInputLabel: {
      fontSize: 15,
      fontWeight: "800",
      color: theme?.text || COLORS.textPrimary,
      marginBottom: 14,
      letterSpacing: -0.2,
    },
    medicalSectionLabel: {
      marginTop: 22,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: theme?.textSecondary || COLORS.textSecondary,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    flatInputField: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme?.cardBorder || COLORS.borderLight,
      paddingHorizontal: 16,
      height: 52,
      justifyContent: "center",
    },
    input: {
      fontSize: 14,
      fontWeight: "600",
      color: theme?.text || COLORS.textPrimary,
    },
    // Chips Grid
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 14,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
    },
    chipInactive: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderColor: theme?.cardBorder || COLORS.borderLight,
    },
    chipActive: {
      backgroundColor: COLORS.logoGreen,
      borderColor: COLORS.logoGreen,
    },
    chipActiveNone: {
      backgroundColor: isDarkMode ? "#334155" : "#475569",
      borderColor: isDarkMode ? "#475569" : "#334155",
    },
    chipText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme?.textSecondary || COLORS.textSecondary,
    },
    chipTextActive: {
      color: COLORS.white,
      fontWeight: "700",
    },
    chipIconMargin: {
      marginLeft: 4,
    },
    medicalChipInactive: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderColor: theme?.cardBorder || COLORS.borderLight,
    },
    medicalChipActive: {
      backgroundColor: "#D97706",
      borderColor: "#D97706",
    },
    medicalChipActiveNone: {
      backgroundColor: isDarkMode ? "#334155" : "#475569",
      borderColor: isDarkMode ? "#475569" : "#334155",
    },
    // Notices
    medicalNoticeBox: {
      backgroundColor: isDarkMode ? "rgba(245, 158, 11, 0.12)" : COLORS.amberBg,
      borderWidth: 1,
      borderColor: isDarkMode ? "rgba(245, 158, 11, 0.3)" : COLORS.amberBorder,
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
    },
    medicalNoticeHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    medicalNoticeTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: isDarkMode ? "#FBBF24" : COLORS.amberTag,
      marginLeft: 6,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    medicalNoticeSubtitle: {
      fontSize: 12,
      fontWeight: "500",
      color: isDarkMode ? "#FDE68A" : "#92400E",
      lineHeight: 16,
    },
    guardrailNotice: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "rgba(0, 176, 116, 0.12)" : "#ECFDF5",
      borderWidth: 1,
      borderColor: isDarkMode ? "rgba(0, 176, 116, 0.3)" : "#A7F3D0",
      borderRadius: 12,
      padding: 10,
      marginBottom: 14,
    },
    guardrailNoticeText: {
      fontSize: 11.5,
      fontWeight: "600",
      color: isDarkMode ? "#34D399" : "#065F46",
      marginLeft: 8,
      flex: 1,
      lineHeight: 16,
    },
    // Disclaimer
    disclaimerAgreementBox: {
      marginTop: 18,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme?.cardBorder || COLORS.borderLight,
    },
    disclaimerAgreementRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    disclaimerCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: theme?.textSecondary || COLORS.textSecondary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
      marginRight: 10,
    },
    disclaimerCheckboxActive: {
      backgroundColor: COLORS.logoGreen,
      borderColor: COLORS.logoGreen,
    },
    disclaimerAgreementText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "500",
      color: theme?.text || COLORS.textPrimary,
      lineHeight: 17,
    },
    disclaimerLinkButton: {
      marginTop: 8,
      paddingLeft: 30,
    },
    disclaimerLinkText: {
      fontSize: 12,
      fontWeight: "700",
      color: COLORS.logoGreen,
      textDecorationLine: "underline",
    },
    // Button
    buttonBase: {
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      marginTop: 18,
    },
    buttonUnpressed: {
      backgroundColor: COLORS.logoGreen,
    },
    buttonText: {
      color: COLORS.white,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    buttonLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    buttonSpinner: {
      marginRight: 8,
    },
    buttonLoadingText: {
      opacity: 0.95,
    },
    // Confirmation Modal
    confirmOverlay: {
      flex: 1,
      backgroundColor: COLORS.overlayBg,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    confirmModalCard: {
      backgroundColor: theme?.cardBg || COLORS.card,
      borderRadius: 18,
      padding: 24,
      width: "100%",
      maxWidth: 360,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    confirmIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDarkMode ? "rgba(0, 176, 116, 0.15)" : "#E6F7F0",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    confirmTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme?.text || COLORS.textPrimary,
      marginBottom: 6,
      textAlign: "center",
    },
    confirmSubtitle: {
      fontSize: 13,
      fontWeight: "500",
      color: theme?.textSecondary || COLORS.textSecondary,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 18,
    },
    confirmDataBlock: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderRadius: 12,
      padding: 14,
      width: "100%",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme?.cardBorder || COLORS.borderLight,
    },
    confirmDataLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme?.textSecondary || COLORS.textSecondary,
      textTransform: "uppercase",
      marginBottom: 2,
      letterSpacing: 0.4,
    },
    confirmDataValue: {
      fontSize: 13,
      fontWeight: "700",
    },
    confirmDataValueNeutral: {
      color: theme?.text || COLORS.textPrimary,
    },
    confirmDataValueMuted: {
      color: theme?.textSecondary || COLORS.textSecondary,
      fontStyle: "italic",
    },
    confirmDataValueWarn: {
      color: "#D97706",
    },
    confirmDivider: {
      height: 1,
      backgroundColor: theme?.cardBorder || COLORS.borderLight,
      marginVertical: 10,
    },
    confirmButtonRow: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    confirmCancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme?.cardBorder || COLORS.borderLight,
      backgroundColor: theme?.cardBg || COLORS.card,
    },
    confirmCancelText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme?.textSecondary || COLORS.textSecondary,
    },
    confirmSubmitBtn: {
      flex: 2,
      height: 48,
      borderRadius: 10,
      backgroundColor: COLORS.logoGreen,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmSubmitText: {
      fontSize: 14,
      fontWeight: "800",
      color: COLORS.white,
    },
  });
}

