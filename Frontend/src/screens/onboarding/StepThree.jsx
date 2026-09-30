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
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import PrivacyModal from "../../components/PrivacyModal";
import useStepThreeDietary, {
  PRESET_ALLERGENS,
  PRESET_MEDICAL_CONDITIONS,
  ITEM_HEIGHT,
} from "../../hooks/useStepThreeDietary";

// --- LIGHTWEIGHT SUBCOMPONENTS ---

// Geographic region & local food availability selector
function LocationSection({
  province,
  city,
  openPicker,
  isFetchingPicker,
  disabled,
  styles,
}) {
  return (
    <>
      <Text style={styles.sectionInputLabel}>
        Local Food Availability & Region
      </Text>

      {/* Province Selection Input Box */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Province</Text>
        <TouchableOpacity
          style={[styles.flatInputField, styles.selectorRow]}
          onPress={() => openPicker("province")}
          activeOpacity={0.7}
          disabled={disabled || isFetchingPicker === "province"}
        >
          <Text
            style={[
              styles.selectorValueText,
              !province && styles.placeholderText,
            ]}
          >
            {province ? province.name : "Select Province"}
          </Text>
          {isFetchingPicker === "province" ? (
            <ActivityIndicator size="small" color={COLORS.logoGreen} />
          ) : (
            <Ionicons name="chevron-down" size={16} color={COLORS.logoGreen} />
          )}
        </TouchableOpacity>
      </View>

      {/* City / Municipality Selection Input Box */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>City / Municipality</Text>
        <TouchableOpacity
          style={[
            styles.flatInputField,
            styles.selectorRow,
            (!province || isFetchingPicker === "city") &&
              styles.disabledSelector,
          ]}
          onPress={() => openPicker("city")}
          activeOpacity={0.7}
          disabled={disabled || !province || isFetchingPicker === "city"}
        >
          <Text
            style={[
              styles.selectorValueText,
              !city && styles.placeholderText,
            ]}
          >
            {city ? city.name : "Select City / Municipality"}
          </Text>
          {isFetchingPicker === "city" ? (
            <ActivityIndicator size="small" color={COLORS.logoGreen} />
          ) : (
            <Ionicons
              name="chevron-down"
              size={16}
              color={province ? COLORS.logoGreen : COLORS.textDisabled}
            />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

// Allergies and dietary restrictions selector
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
      <Text style={[styles.sectionInputLabel, styles.allergiesSectionLabel]}>
        Allergies & Restrictions
      </Text>
      <Text style={styles.inputLabel}>Select Known Allergens</Text>

      {/* Preset Allergen Chips Grid */}
      <View style={styles.chipGrid}>
        {PRESET_ALLERGENS.map((allergen) => {
          const isSelected = selectedAllergies.includes(allergen.id);
          return (
            <TouchableOpacity
              key={allergen.id}
              activeOpacity={0.8}
              disabled={disabled}
              onPress={() => onToggleAllergen(allergen.id)}
              style={[
                styles.chip,
                isSelected ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive,
                ]}
              >
                {allergen.title}
              </Text>
              {isSelected && (
                <Ionicons
                  name="close-circle"
                  size={14}
                  color={COLORS.whiteHighlight}
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
            autoCorrect={true}
            editable={!disabled}
          />
        </View>
      </View>
    </>
  );
}

// Pre-existing health screening & condition selector
function MedicalScreeningSection({
  selectedConditions,
  customCondition,
  onToggleCondition,
  onCustomConditionChange,
  disabled,
  styles,
}) {
  return (
    <>
      <Text style={[styles.sectionInputLabel, styles.medicalSectionLabel]}>
        Health Screening & Clinical Notice
      </Text>

      {/* Clinical Guidance Notice Banner */}
      <View style={styles.medicalNoticeBox}>
        <View style={styles.medicalNoticeHeader}>
          <Ionicons name="medical-outline" size={16} color={COLORS.amberText} />
          <Text style={styles.medicalNoticeTitle}>
            Pre-Existing Health Screening
          </Text>
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
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive,
                ]}
              >
                {condition.title}
              </Text>
              {isSelected && (
                <Ionicons
                  name={isNone ? "checkmark-circle" : "close-circle"}
                  size={14}
                  color={COLORS.whiteHighlight}
                  style={styles.chipIconMargin}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

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
            autoCorrect={true}
            editable={!disabled}
          />
        </View>
      </View>
    </>
  );
}

// Medical disclaimer checkbox & privacy policy trigger
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
        <View
          style={[
            styles.disclaimerCheckbox,
            disclaimerAccepted && styles.disclaimerCheckboxActive,
          ]}
        >
          {disclaimerAccepted && (
            <Ionicons
              name="checkmark"
              size={14}
              color={COLORS.whiteHighlight}
            />
          )}
        </View>
        <Text style={styles.disclaimerAgreementText}>
          I acknowledge that MacroSync provides nutritional & workout tracking
          for general wellness only and does not replace licensed medical
          diagnosis or clinical treatment.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.disclaimerLinkButton}
        activeOpacity={0.7}
        onPress={() => onOpenPrivacyModal("medical")}
      >
        <Text style={styles.disclaimerLinkText}>
          Read Medical Disclaimer & Privacy Policy (RA 10173)
        </Text>
        <Ionicons
          name="open-outline"
          size={13}
          color={COLORS.logoGreen}
          style={styles.linkIconMargin}
        />
      </TouchableOpacity>
    </View>
  );
}

// Searchable location picker bottom sheet modal
function LocationPickerModal({
  visible,
  pickerType,
  pickerData,
  searchQuery,
  onSearchChange,
  onSelectLocation,
  onClose,
  styles,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModalCard}>
          <View style={styles.pickerHeaderRow}>
            <Text style={styles.pickerModalTitle}>
              Select {pickerType.toUpperCase()}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBarContainer}>
            <Ionicons
              name="search"
              size={18}
              color={COLORS.textMuted}
              style={styles.searchIconMargin}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${pickerType}...`}
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={onSearchChange}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <View style={styles.pickerContentWrapper}>
            <FlatList
              data={pickerData}
              keyExtractor={(item, index) =>
                `${item.province_code || item.city_code || "loc"}-${item.name || "item"}-${index}`
              }
              showsVerticalScrollIndicator={false}
              style={styles.optionsList}
              contentContainerStyle={styles.optionsListContent}
              keyboardShouldPersistTaps="handled"
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItemRow}
                  onPress={() => onSelectLocation(item)}
                >
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Pre-submission review summary confirmation sheet
function ReviewMetricsModal({
  visible,
  compiledAddress,
  compiledAllergiesText,
  compiledConditionsText,
  onClose,
  onConfirm,
  styles,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmModalCard}>
          <View style={styles.confirmIconContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={32}
              color={COLORS.logoGreen}
            />
          </View>

          <Text style={styles.confirmTitle}>Review Metrics</Text>
          <Text style={styles.confirmSubtitle}>
            Please double check your parameters before finalizing baseline
            calibrations.
          </Text>

          <View style={styles.confirmDataBlock}>
            <Text style={styles.confirmDataLabel}>Current Address String</Text>
            <Text style={styles.confirmDataValue}>{compiledAddress}</Text>

            <View style={styles.confirmDivider} />

            <Text style={styles.confirmDataLabel}>
              Profile Exclusions & Allergies
            </Text>
            <Text
              style={[
                styles.confirmDataValue,
                compiledAllergiesText.includes("No")
                  ? styles.confirmDataValueMuted
                  : styles.confirmDataValueNeutral,
              ]}
            >
              {compiledAllergiesText}
            </Text>

            <View style={styles.confirmDivider} />

            <Text style={styles.confirmDataLabel}>
              Health & Medical Screening
            </Text>
            <Text
              style={[
                styles.confirmDataValue,
                compiledConditionsText.includes("None")
                  ? styles.confirmDataValueMuted
                  : styles.confirmDataValueWarning,
              ]}
            >
              {compiledConditionsText}
            </Text>
          </View>

          <View style={styles.confirmActionRow}>
            <TouchableOpacity
              style={[
                styles.confirmButtonBase,
                styles.confirmButtonSecondary,
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonTextSecondary}>Edit Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButtonBase, styles.confirmButtonPrimary]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonTextPrimary}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Form dispatch submit button in footer
function PrimaryButton({ onPress, isLoading, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isLoading}
      onPress={onPress}
      style={[styles.buttonBase, styles.buttonUnpressed]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.whiteHighlight} />
      ) : (
        <Text style={styles.buttonText}>Complete Set Up</Text>
      )}
    </TouchableOpacity>
  );
}

// --- MAIN STEP THREE SCREEN ---

export default function StepThreeScreen({ onSubmit, isLoadingExternal }) {
  // Theme & screen styling
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Step three dietary hook: geographic locations, restrictions & submit dispatcher
  const {
    province,
    city,
    selectedAllergies,
    customAllergy,
    selectedConditions,
    customCondition,
    disclaimerAccepted,
    privacyModalVisible,
    privacyInitialTab,
    pickerVisible,
    pickerType,
    filteredPickerData,
    isFetchingPicker,
    searchQuery,
    confirmVisible,
    compiledAddress,
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
    openPicker,
    handleClosePicker,
    handleSearchQueryChange,
    handleSelectLocation,
    handleTriggerConfirmationModal,
    handleCloseConfirmModal,
    handleFinalSubmitDispatch,
  } = useStepThreeDietary({ onSubmit, isLoadingExternal });

  const isScreenBusy = isLoading || isLoadingExternal;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Status Bar */}
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
            <Text style={styles.stepIndicator}>STEP 3 OF 3</Text>
            <Text style={styles.brandTitle}>Dietary Context</Text>
            <Text style={styles.brandSubtitle}>
              Finalize your location and constraints to ensure recommendations
              match your local food context.
            </Text>
          </View>

          {/* Form Configuration Card */}
          <View style={styles.formCard}>
            {/* Location Selectors */}
            <LocationSection
              province={province}
              city={city}
              openPicker={openPicker}
              isFetchingPicker={isFetchingPicker}
              disabled={isScreenBusy}
              styles={styles}
            />

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
          </View>
        </ScrollView>

        {/* Fixed Footer Bottom Action */}
        <View style={styles.fixedFooter}>
          <PrimaryButton
            onPress={handleTriggerConfirmationModal}
            isLoading={isScreenBusy}
            styles={styles}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Location Search Picker Modal Dropdown */}
      <LocationPickerModal
        visible={pickerVisible}
        pickerType={pickerType}
        pickerData={filteredPickerData}
        searchQuery={searchQuery}
        onSearchChange={handleSearchQueryChange}
        onSelectLocation={handleSelectLocation}
        onClose={handleClosePicker}
        styles={styles}
      />

      {/* Pre-Submission Review Modal Sheet */}
      <ReviewMetricsModal
        visible={confirmVisible}
        compiledAddress={compiledAddress}
        compiledAllergiesText={compiledAllergiesText}
        compiledConditionsText={compiledConditionsText}
        onClose={handleCloseConfirmModal}
        onConfirm={handleFinalSubmitDispatch}
        styles={styles}
      />

      {/* Privacy Policy & Clinical Scope Modal */}
      <PrivacyModal
        visible={privacyModalVisible}
        onClose={handleClosePrivacyModal}
        initialTab={privacyInitialTab}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// --- COMPONENT STYLES & COLOR CONFIGURATION ---
// ============================================================================
const COLORS = {
  base: "#F8FAFC",
  logoGreen: "#10B981",
  logoGreenPressed: "#059669",
  textDark: "#0F172A",
  textGrey: "#64748B",
  textMuted: "#94A3B8",
  textPlaceholder: "#94A3B8",
  textDisabled: "#CBD5E1",
  borderLight: "#E2E8F0",
  bgPill: "#F1F5F9",
  cardBgLight: "#EBEBEB",
  whiteHighlight: "#FFFFFF",
  amberLight: "rgba(245, 158, 11, 0.08)",
  amberBorder: "rgba(245, 158, 11, 0.3)",
  amberText: "#B45309",
  amberSubtitle: "#92400E",
  amberActive: "#D97706",
  overlayDark: "rgba(0, 0, 0, 0.5)",
  overlayDialog: "rgba(26, 32, 44, 0.5)",
};

const getStyles = (theme, isDarkMode = false) =>
  StyleSheet.create({
    // --- MAIN SCREEN LAYOUT ---
    // Entire full-screen background
    container: {
      flex: 1,
      backgroundColor: theme?.background || COLORS.base,
    },
    // ScrollView inner padding & vertical centering
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: Platform.OS === "ios" ? 35 : 25,
    },

    // --- HEADER / BRAND SECTION ---
    // Header wrapper holding step indicator, title and subtitle
    headerSection: {
      alignItems: "center",
      width: "100%",
      marginTop: Platform.OS === "ios" ? 20 : 15,
      marginBottom: 20,
    },
    // "STEP 3 OF 3" tracking indicator text
    stepIndicator: {
      fontSize: 11,
      fontWeight: "900",
      color: COLORS.logoGreen,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    // Main "Dietary Context" screen title
    brandTitle: {
      fontSize: 36,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textDark,
      letterSpacing: -0.5,
      marginTop: 4,
    },
    // Subtitle description below the title
    brandSubtitle: {
      fontSize: 13,
      color: theme?.textSecondary || COLORS.textGrey,
      marginTop: 6,
      textAlign: "center",
      lineHeight: 19,
      fontWeight: "700",
      paddingHorizontal: 10,
    },

    // --- FORM CONTAINER CARD ---
    // Rounded card housing all dietary parameters
    formCard: {
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
      shadowOpacity: 0,
      elevation: 0,
      marginBottom: 10,
    },
    // Section header label
    sectionInputLabel: {
      color: theme?.textPrimary || COLORS.textGrey,
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginLeft: 4,
    },
    // Margin spacing above allergies section label
    allergiesSectionLabel: {
      marginTop: 14,
    },
    // Margin spacing above medical screening section label
    medicalSectionLabel: {
      marginTop: 18,
    },

    // --- INPUT FIELDS & SELECTORS ---
    // Wrapper spacing around each input field
    inputGroup: {
      marginBottom: 14,
    },
    // Field title label above input or selector
    inputLabel: {
      color: theme?.textPrimary || COLORS.textGrey,
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginLeft: 4,
    },
    // Flat rounded input container
    flatInputField: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme?.inputBorder || COLORS.borderLight,
      height: 48,
      justifyContent: "center",
    },
    // Horizontal row layout for dropdown selector touchable
    selectorRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    },
    // Dropdown selected value text
    selectorValueText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme?.textPrimary || COLORS.textDark,
    },
    // Placeholder text style when unselected
    placeholderText: {
      color: theme?.textSecondary || COLORS.textMuted,
      fontWeight: "600",
    },
    // Disabled dropdown selector appearance
    disabledSelector: {
      backgroundColor: theme?.cardBg || COLORS.bgPill,
      borderColor: theme?.border || COLORS.borderLight,
      opacity: 0.6,
    },
    // Text input inside flat input field
    input: {
      flex: 1,
      color: theme?.textPrimary || COLORS.textDark,
      paddingHorizontal: 16,
      height: "100%",
      fontSize: 14,
      fontWeight: "700",
    },

    // --- ALLERGEN & MEDICAL CHIPS ---
    // Grid container wrapping selection chips
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 14,
      marginLeft: 2,
    },
    // Individual allergen chip shape
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 14,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 1.5,
    },
    // Unselected chip styling
    chipInactive: {
      backgroundColor: theme?.surface || COLORS.base,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Selected allergen chip styling
    chipActive: {
      backgroundColor: COLORS.logoGreen,
      borderColor: COLORS.logoGreen,
    },
    // Chip label text
    chipText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme?.textSecondary || COLORS.textGrey,
    },
    // Active chip label text color
    chipTextActive: {
      color: COLORS.whiteHighlight,
      fontWeight: "800",
    },
    // Margin between chip label and dismiss icon
    chipIconMargin: {
      marginLeft: 4,
    },

    // --- MEDICAL SCREENING & NOTICE BOX ---
    // Advisory alert banner container
    medicalNoticeBox: {
      backgroundColor: COLORS.amberLight,
      borderColor: COLORS.amberBorder,
      borderWidth: 1.2,
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
    },
    // Header row inside advisory banner
    medicalNoticeHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    // Title of medical advisory banner
    medicalNoticeTitle: {
      fontSize: 12.5,
      fontWeight: "800",
      color: COLORS.amberText,
      marginLeft: 6,
    },
    // Subtitle copy inside advisory banner
    medicalNoticeSubtitle: {
      fontSize: 11.5,
      fontWeight: "600",
      color: COLORS.amberSubtitle,
      lineHeight: 16,
    },
    // Unselected medical chip style
    medicalChipInactive: {
      backgroundColor: theme?.surface || COLORS.base,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Selected medical condition chip style
    medicalChipActive: {
      backgroundColor: COLORS.amberActive,
      borderColor: COLORS.amberActive,
    },
    // Selected "None / Healthy" chip style
    medicalChipActiveNone: {
      backgroundColor: COLORS.logoGreen,
      borderColor: COLORS.logoGreen,
    },

    // --- DISCLAIMER AGREEMENT BOX ---
    // Container for medical acknowledgment & policy link
    disclaimerAgreementBox: {
      backgroundColor: theme?.inputBg || COLORS.base,
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: theme?.border || COLORS.borderLight,
      padding: 14,
      marginTop: 10,
      marginBottom: 6,
    },
    // Row holding acknowledgment checkbox and text
    disclaimerAgreementRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    // Checkbox container square
    disclaimerCheckbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.8,
      borderColor: theme?.border || COLORS.textDisabled,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.whiteHighlight,
      marginTop: 2,
      marginRight: 10,
    },
    // Checked state for disclaimer checkbox
    disclaimerCheckboxActive: {
      backgroundColor: COLORS.logoGreen,
      borderColor: COLORS.logoGreen,
    },
    // Acknowledgment description text
    disclaimerAgreementText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
      color: theme?.textPrimary || "#334155",
      lineHeight: 17,
    },
    // Link touchable to open policy modal
    disclaimerLinkButton: {
      marginTop: 8,
      marginLeft: 32,
      flexDirection: "row",
      alignItems: "center",
    },
    // Underlined policy link text
    disclaimerLinkText: {
      fontSize: 11.5,
      fontWeight: "800",
      color: COLORS.logoGreen,
      textDecorationLine: "underline",
    },
    // Margin next to external link icon
    linkIconMargin: {
      marginLeft: 4,
    },

    // --- FIXED FOOTER & PRIMARY BUTTON ---
    // Pinned bottom footer container
    fixedFooter: {
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "ios" ? 24 : 16,
      paddingTop: 8,
      backgroundColor: theme?.background || COLORS.base,
      borderTopWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Primary button dimensions & centering
    buttonBase: {
      paddingVertical: 14,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: 50,
    },
    // Primary button unpressed green background
    buttonUnpressed: {
      backgroundColor: COLORS.logoGreen,
    },
    // Primary button label typography
    buttonText: {
      color: COLORS.whiteHighlight,
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.5,
    },

    // --- SEARCH / PICKER MODAL LIST ---
    // Fullscreen backdrop for location picker modal
    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.overlayDark,
      justifyContent: "flex-end",
    },
    // Bottom sheet card for location picker
    pickerModalCard: {
      backgroundColor: theme?.surface || COLORS.base,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: Platform.OS === "ios" ? 40 : 24,
      height: "75%",
      width: "100%",
    },
    // Header row inside location picker sheet
    pickerHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      borderBottomWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
      paddingBottom: 12,
    },
    // Title inside location picker modal
    pickerModalTitle: {
      fontSize: 15,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textDark,
      letterSpacing: 1,
    },
    // Search input bar container
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme?.inputBg || COLORS.bgPill,
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 42,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme?.inputBorder || COLORS.borderLight,
    },
    // Search icon margin
    searchIconMargin: {
      marginRight: 8,
    },
    // Search text input
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme?.textPrimary || COLORS.textDark,
      fontWeight: "600",
      height: "100%",
    },
    // Content wrapper for picker list
    pickerContentWrapper: {
      flex: 1,
      flexDirection: "row",
      width: "100%",
    },
    // List container
    optionsList: {
      flex: 1,
    },
    // Bottom padding for scrollable list
    optionsListContent: {
      paddingBottom: 60,
    },
    // Individual location item row
    pickerItemRow: {
      height: ITEM_HEIGHT,
      justifyContent: "center",
      borderBottomWidth: 1,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Location item text label
    pickerItemText: {
      fontSize: 15,
      fontWeight: "700",
      color: theme?.textPrimary || COLORS.textDark,
    },

    // --- CONFIRMATION SUMMARY DIALOG ---
    // Fullscreen backdrop for review modal
    confirmOverlay: {
      flex: 1,
      backgroundColor: COLORS.overlayDialog,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    // Centered card container for review confirmation
    confirmModalCard: {
      width: "100%",
      backgroundColor: theme?.surface || COLORS.base,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
      shadowOpacity: 0,
      elevation: 0,
    },
    // Shield icon background circle
    confirmIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: theme?.cardBg || COLORS.cardBgLight,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    // Modal title text
    confirmTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textDark,
      marginBottom: 6,
    },
    // Modal subtitle description
    confirmSubtitle: {
      fontSize: 13,
      color: theme?.textSecondary || COLORS.textGrey,
      fontWeight: "600",
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: 10,
      marginBottom: 20,
    },
    // Data display block container
    confirmDataBlock: {
      width: "100%",
      backgroundColor: theme?.inputBg || COLORS.bgPill,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme?.inputBorder || COLORS.borderLight,
      marginBottom: 24,
    },
    // Section label inside review block
    confirmDataLabel: {
      fontSize: 10,
      fontWeight: "900",
      color: theme?.textSecondary || COLORS.textGrey,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4,
    },
    // Value text inside review block
    confirmDataValue: {
      fontSize: 14,
      fontWeight: "700",
      color: theme?.textPrimary || COLORS.textDark,
      lineHeight: 20,
    },
    // Muted text color for empty review fields
    confirmDataValueMuted: {
      color: COLORS.textMuted,
    },
    // Neutral text color for active allergies
    confirmDataValueNeutral: {
      color: COLORS.textGrey,
    },
    // Amber warning text color for active conditions
    confirmDataValueWarning: {
      color: COLORS.amberActive,
    },
    // Divider line between summary rows
    confirmDivider: {
      height: 1,
      backgroundColor: theme?.border || COLORS.borderLight,
      marginVertical: 12,
    },
    // Action buttons container row
    confirmActionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    // Button base shape inside confirmation dialog
    confirmButtonBase: {
      flex: 1,
      height: 48,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    // Secondary "Edit Details" button
    confirmButtonSecondary: {
      backgroundColor: theme?.surface || COLORS.base,
      marginRight: 12,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Primary "Confirm" button
    confirmButtonPrimary: {
      backgroundColor: COLORS.logoGreen,
    },
    // Secondary button label typography
    confirmButtonTextSecondary: {
      fontSize: 14,
      fontWeight: "800",
      color: theme?.textSecondary || COLORS.textGrey,
    },
    // Primary button label typography
    confirmButtonTextPrimary: {
      fontSize: 14,
      fontWeight: "800",
      color: COLORS.whiteHighlight,
    },
  });
