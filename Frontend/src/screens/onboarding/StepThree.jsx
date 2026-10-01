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
import useStepThreeLocation, { ITEM_HEIGHT } from "../../hooks/useStepThreeLocation";

// --- LIGHTWEIGHT SUBCOMPONENTS ---

// Geographic region & local food availability selector
function LocationSection({
  province,
  city,
  openPicker,
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
        >
          <Text
            style={[
              styles.selectorValueText,
              !province && styles.placeholderText,
            ]}
          >
            {province ? province.name : "Select Province"}
          </Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.logoGreen} />
        </TouchableOpacity>
      </View>

      {/* City / Municipality Selection Input Box */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>City / Municipality</Text>
        <TouchableOpacity
          style={[
            styles.flatInputField,
            styles.selectorRow,
            !province && styles.disabledSelector,
          ]}
          onPress={() => openPicker("city")}
          activeOpacity={0.7}
          disabled={!province}
        >
          <Text
            style={[
              styles.selectorValueText,
              !city && styles.placeholderText,
            ]}
          >
            {city ? city.name : "Select City / Municipality"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={province ? COLORS.logoGreen : COLORS.textDisabled}
          />
        </TouchableOpacity>
      </View>
    </>
  );
}

// Visual informative badge for Palengke calibration
function PalengkeRadarBadge({ styles }) {
  return (
    <View style={styles.radarCard}>
      <View style={styles.radarIconBox}>
        <Ionicons name="storefront-outline" size={22} color={COLORS.logoGreen} />
      </View>
      <View style={styles.radarContentBox}>
        <Text style={styles.radarTitle}>Palengke & Regional Food Calibration</Text>
        <Text style={styles.radarSubtitle}>
          MacroSync utilizes your location to detect nearby public wet markets, catch schedules, and authentic regional delicacies.
        </Text>
      </View>
    </View>
  );
}

// Interactive location searchable picker modal sheet
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
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerSheetContainer}>
          <View style={styles.pickerHeaderRow}>
            <Text style={styles.pickerHeaderTitle}>
              Select {pickerType === "province" ? "Province" : "City / Municipality"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closePickerBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={24}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Dynamic Search Bar */}
          <View style={styles.pickerSearchBar}>
            <Ionicons
              name="search"
              size={16}
              color={COLORS.textSecondary}
              style={styles.searchIconMargin}
            />
            <TextInput
              style={styles.pickerSearchInput}
              placeholder={`Search ${
                pickerType === "province" ? "province" : "city"
              }...`}
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={onSearchChange}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Lazy Virtualized Results List */}
          <View style={styles.pickerListContainer}>
            <FlatList
              data={pickerData}
              keyExtractor={(item, index) =>
                item.city_code ||
                item.province_code ||
                `${item.name}-${index}`
              }
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

// Navigation continue action button
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
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonSpinner} />
          <Text style={[styles.buttonText, styles.buttonLoadingText]}>Calibrating...</Text>
        </View>
      ) : (
        <Text style={styles.buttonText}>Continue to Health Screening</Text>
      )}
    </TouchableOpacity>
  );
}

// --- MAIN STEP THREE SCREEN ---

export default function StepThreeScreen({ onNext, onBack, initialLocation }) {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const {
    province,
    city,
    pickerVisible,
    pickerType,
    filteredPickerData,
    searchQuery,
    openPicker,
    handleClosePicker,
    handleSearchQueryChange,
    handleSelectLocation,
    handleContinue,
  } = useStepThreeLocation({ onNext, initialLocation });

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
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={theme?.text || COLORS.textPrimary}
                />
              </TouchableOpacity>
            )}
            <Text style={styles.stepIndicator}>STEP 3 OF 4</Text>
            <Text style={styles.brandTitle}>Regional Availability</Text>
            <Text style={styles.brandSubtitle}>
              Select your province and city to calibrate seasonal ingredients, local food availability, and nearby palengke markets.
            </Text>
          </View>

          {/* Form Configuration Card */}
          <View style={styles.formCard}>
            <LocationSection
              province={province}
              city={city}
              openPicker={openPicker}
              styles={styles}
            />

            <PalengkeRadarBadge styles={styles} />

            {/* Submit Action Button */}
            <PrimaryButton onPress={handleContinue} styles={styles} />
          </View>
        </ScrollView>
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
    </SafeAreaView>
  );
}

// ============================================================================
// --- COMPONENT STYLES & COLOR CONFIGURATION ---
// ============================================================================
const COLORS = {
  base: "#F8FAFC",
  card: "#FFFFFF",
  whiteHighlight: "#FFFFFF",
  logoGreen: "#10B981",
  textDark: "#0F172A",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textDisabled: "#94A3B8",
  textMuted: "#9CA3AF",
  borderLight: "#E2E8F0",
  inputBg: "#F8FAFC",
  buttonLabel: "#FFFFFF",
  modalOverlayBg: "rgba(0,0,0,0.5)",
  disabledBg: "#E2E8F0",
};

// Dynamic stylesheet factory
function getStyles(theme, isDarkMode) {
  return StyleSheet.create({
    // --- MAIN SCREEN LAYOUT ---
    container: {
      flex: 1,
      backgroundColor: theme?.background || COLORS.base,
    },
    scrollContainer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 30,
    },

    // --- HEADER / BRAND SECTION ---
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
      fontSize: 32,
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
      textAlign: "center",
      lineHeight: 20,
    },

    // --- FORM CONFIGURATION CARD ---
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
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: theme?.textSecondary || COLORS.textSecondary,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    flatInputField: {
      backgroundColor: theme?.inputBg || COLORS.inputBg,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme?.cardBorder || COLORS.borderLight,
      paddingHorizontal: 16,
      height: 52,
      justifyContent: "center",
    },
    selectorRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    disabledSelector: {
      backgroundColor: theme?.cardBorder || COLORS.disabledBg,
      opacity: 0.6,
    },
    selectorValueText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme?.text || COLORS.textPrimary,
    },
    placeholderText: {
      color: theme?.placeholderText || COLORS.textMuted,
      fontWeight: "500",
    },

    // --- PALENGKE RADAR BADGE ---
    radarCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "rgba(0, 176, 116, 0.12)" : "#ECFDF5",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? "rgba(0, 176, 116, 0.3)" : "#A7F3D0",
      padding: 14,
      marginTop: 8,
    },
    radarIconBox: {
      width: 42,
      height: 42,
      borderRadius: 10,
      backgroundColor: isDarkMode ? "rgba(0, 176, 116, 0.2)" : "#D1FAE5",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    radarContentBox: {
      flex: 1,
    },
    radarTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: isDarkMode ? "#34D399" : "#065F46",
      marginBottom: 2,
    },
    radarSubtitle: {
      fontSize: 11.5,
      fontWeight: "500",
      color: isDarkMode ? "#A7F3D0" : "#047857",
      lineHeight: 16,
    },

    // --- PRIMARY SUBMIT BUTTON ---
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
      color: COLORS.whiteHighlight,
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

    // --- SEARCH PICKER MODAL ---
    pickerModalOverlay: {
      flex: 1,
      backgroundColor: COLORS.modalOverlayBg,
      justifyContent: "flex-end",
    },
    pickerSheetContainer: {
      backgroundColor: theme?.cardBg || COLORS.card,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingTop: 16,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "ios" ? 40 : 20,
      maxHeight: "80%",
      width: "100%",
      maxWidth: 540,
      alignSelf: "center",
    },
    pickerHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    pickerHeaderTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: theme?.text || COLORS.textPrimary,
    },
    closePickerBtn: {
      padding: 4,
    },
    pickerSearchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme?.inputBg || COLORS.inputBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme?.cardBorder || COLORS.borderLight,
      paddingHorizontal: 12,
      height: 44,
      marginBottom: 12,
    },
    searchIconMargin: {
      marginRight: 8,
    },
    pickerSearchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: theme?.text || COLORS.textPrimary,
      height: "100%",
    },
    pickerListContainer: {
      minHeight: 200,
      maxHeight: 380,
    },
    pickerItemRow: {
      height: ITEM_HEIGHT,
      justifyContent: "center",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme?.cardBorder || COLORS.borderLight,
      paddingHorizontal: 4,
    },
    pickerItemText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme?.text || COLORS.textPrimary,
    },
  });
}
