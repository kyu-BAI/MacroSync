import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Pencil } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "../../context/ThemeContext";
import { useCustomAlert } from "../../context/CustomAlertContext";
import {
  PHILIPPINE_PROVINCES,
  getCitiesForProvince,
} from "../../data/philippine_cities_by_province";

// Height per picker item row in dropdown lists
const ITEM_HEIGHT = 54;

export default function EditProfileModal({
  visible,
  onClose,
  tempName,
  setTempName,
  tempImage,
  userProfile,
  initialPinnedLocation: initialPinnedProp,
  getInitials,
  onPickImage,
  onSave,
  styles: externalStyles,
}) {
  const { theme, isDarkMode } = useTheme();
  const { showAlert } = useCustomAlert();

  // Location Selector States (initialized from userProfile)
  const [province, setProvince] = useState(null);
  const [city, setCity] = useState(null);

  // Searchable Picker Sheet States (Matching Step 3)
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(""); // "province" | "city"
  const [pickerData, setPickerData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Current Pinned Location States (resolved from userProfile & AsyncStorage)
  const [storedPinnedBarangay, setStoredPinnedBarangay] = useState(initialPinnedProp || null);
  const [storedDefaultLocation, setStoredDefaultLocation] = useState(null);
  const [storedProfileLocation, setStoredProfileLocation] = useState(null);
  const [pinnedLocationOverride, setPinnedLocationOverride] = useState(null);
  const [isNewlyPinned, setIsNewlyPinned] = useState(false);

  // Sync state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setPinnedLocationOverride(null);
      setIsNewlyPinned(false);
      if (initialPinnedProp) {
        setStoredPinnedBarangay(initialPinnedProp);
      }

      const existingProv =
        userProfile?.province ||
        userProfile?.structuredLocation?.province ||
        (typeof userProfile?.location === "object" ? userProfile?.location?.province : "") ||
        "";
      const existingCity =
        userProfile?.city ||
        userProfile?.structuredLocation?.city ||
        (typeof userProfile?.location === "object" ? userProfile?.location?.city : "") ||
        "";

      setProvince(
        existingProv
          ? { name: existingProv, province_name: existingProv }
          : null
      );
      setCity(
        existingCity
          ? { name: existingCity, city_name: existingCity }
          : null
      );
      setPickerVisible(false);
      setSearchQuery("");

      // Resolve pinned barangay or stored default location from storage
      AsyncStorage.getItem("ms_pinned_barangay")
        .then((res) => {
          if (res) {
            try {
              const parsed = JSON.parse(res);
              const title =
                parsed.formattedTitle ||
                (parsed.barangay && parsed.city
                  ? `Brgy. ${parsed.barangay}, ${parsed.city}`
                  : parsed.city || parsed.barangay);
              if (title && typeof title === "string" && title.trim().length > 0) {
                setStoredPinnedBarangay(title.trim());
              }
              if (parsed.city) {
                setCity({ name: parsed.city, city_name: parsed.city });
              }
              if (parsed.province) {
                setProvince({ name: parsed.province, province_name: parsed.province });
              }
            } catch (_) {}
          }
        })
        .catch(() => {});

      AsyncStorage.getItem("@ms_default_location")
        .then((res) => {
          if (res) {
            try {
              const parsed = JSON.parse(res);
              const title =
                parsed.address ||
                (parsed.city && parsed.province
                  ? `${parsed.city}, ${parsed.province}`
                  : parsed.city);
              if (title && typeof title === "string" && title.trim().length > 0) {
                setStoredDefaultLocation(title.trim());
              }
            } catch (_) {}
          }
        })
        .catch(() => {});

      AsyncStorage.getItem("ms_user_profile")
        .then((res) => {
          if (res) {
            try {
              const parsed = JSON.parse(res);
              const title =
                parsed.address ||
                (parsed.city && parsed.province
                  ? `${parsed.city}, ${parsed.province}`
                  : parsed.city || parsed.province);
              if (title && typeof title === "string" && title.trim().length > 0) {
                setStoredProfileLocation(title.trim());
              }
            } catch (_) {}
          }
        })
        .catch(() => {});
    }
  }, [visible, userProfile, initialPinnedProp]);

  // Compute initial pinned location prior to any new selection
  const initialPinnedLocation = useMemo(() => {
    if (storedPinnedBarangay) return storedPinnedBarangay;
    if (initialPinnedProp) return initialPinnedProp;
    if (userProfile?.address) return userProfile.address;
    if (storedDefaultLocation) return storedDefaultLocation;
    if (storedProfileLocation) return storedProfileLocation;
    if (userProfile?.city) {
      return `${userProfile.city}${
        userProfile.province ? `, ${userProfile.province}` : ""
      }`;
    }
    if (userProfile?.location) {
      if (typeof userProfile.location === "string") return userProfile.location;
      if (typeof userProfile.location === "object") {
        if (userProfile.location.city) {
          return `${userProfile.location.city}${
            userProfile.location.province ? `, ${userProfile.location.province}` : ""
          }`;
        }
        if (userProfile.location.address) return userProfile.location.address;
      }
    }
    if (userProfile?.structuredLocation?.city) {
      return `${userProfile.structuredLocation.city}${
        userProfile.structuredLocation.province
          ? `, ${userProfile.structuredLocation.province}`
          : ""
      }`;
    }
    return null;
  }, [storedPinnedBarangay, userProfile, storedDefaultLocation, storedProfileLocation]);

  // Current Pinned Location automatically updates as soon as the user pins/selects a new location
  const currentPinnedLocation = useMemo(() => {
    if (pinnedLocationOverride) return pinnedLocationOverride;
    if (initialPinnedLocation) return initialPinnedLocation;
    if (city && province) return `${city.name}, ${province.name}`;
    if (city) return city.name;
    return null;
  }, [pinnedLocationOverride, initialPinnedLocation, city, province]);

  // Determine whether current pinned location differs from initial
  const isLocationModified = useMemo(() => {
    if (!initialPinnedLocation || !currentPinnedLocation) {
      return Boolean(currentPinnedLocation && !initialPinnedLocation);
    }
    return (
      initialPinnedLocation.trim().toLowerCase() !==
      currentPinnedLocation.trim().toLowerCase()
    );
  }, [initialPinnedLocation, currentPinnedLocation]);

  // Open searchable location modal sheet
  const openPicker = useCallback(
    (type) => {
      if (type === "province") {
        setPickerData(PHILIPPINE_PROVINCES);
        setSearchQuery("");
        setPickerType("province");
        setPickerVisible(true);
      } else if (type === "city") {
        if (!province) {
          showAlert("Sequence Interrupted", "Please select a Province first.");
          return;
        }
        const cities = getCitiesForProvince(province.name);
        setPickerData(cities);
        setSearchQuery("");
        setPickerType("city");
        setPickerVisible(true);
      }
    },
    [province, showAlert]
  );

  const handleClosePicker = useCallback(() => {
    setPickerVisible(false);
    setSearchQuery("");
  }, []);

  const handleSelectLocation = useCallback(
    (item) => {
      if (pickerType === "province") {
        setProvince(item);
        setCity(null); // Reset city when province changes
      } else if (pickerType === "city") {
        setCity(item);
        // Automatically change the current pinned location to this newly pinned location!
        const resolvedPinned = province ? `${item.name}, ${province.name}` : item.name;
        setPinnedLocationOverride(resolvedPinned);
        setIsNewlyPinned(true);
      }
      setPickerVisible(false);
      setSearchQuery("");
    },
    [pickerType, province]
  );

  // Filtered picker items according to search query
  const filteredPickerData = useMemo(() => {
    if (!searchQuery.trim()) return pickerData;
    const lower = searchQuery.toLowerCase();
    return pickerData.filter((item) =>
      item.name ? item.name.toLowerCase().includes(lower) : false
    );
  }, [pickerData, searchQuery]);

  // Handle save with location payload
  const handleSaveWithLocation = useCallback(() => {
    const provinceName = province?.name || "";
    const cityName = city?.name || "";
    const address =
      cityName && provinceName
        ? `${cityName}, ${provinceName}`
        : cityName || provinceName || "";
    const structuredLocation =
      provinceName || cityName
        ? { province: provinceName, city: cityName }
        : null;

    onSave?.({
      name: tempName?.trim(),
      province: provinceName,
      city: cityName,
      address,
      structuredLocation,
    });
  }, [tempName, province, city, onSave]);

  const modalTheme = useMemo(
    () => ({
      bg: isDarkMode ? "#1E293B" : "#FFFFFF",
      inputBg: isDarkMode ? "#0F172A" : "#F8FAFC",
      border: isDarkMode ? "#334155" : "#E2E8F0",
      text: isDarkMode ? "#F8FAFC" : "#0F172A",
      textSecondary: isDarkMode ? "#94A3B8" : "#64748B",
      textMuted: isDarkMode ? "#64748B" : "#9CA3AF",
      primary: "#10B981",
      radarBg: isDarkMode ? "rgba(0, 176, 116, 0.12)" : "#ECFDF5",
      radarBorder: isDarkMode ? "rgba(0, 176, 116, 0.3)" : "#A7F3D0",
      radarText: isDarkMode ? "#34D399" : "#065F46",
      radarSubtext: isDarkMode ? "#A7F3D0" : "#047857",
    }),
    [isDarkMode]
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={localStyles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[
            localStyles.modalContent,
            {
              backgroundColor: modalTheme.bg,
              borderColor: modalTheme.border,
            },
          ]}
        >
          {/* Main Edit Profile Form View */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={localStyles.scrollContainer}
          >
            <Text style={[localStyles.modalTitle, { color: modalTheme.text }]}>
              Edit Profile
            </Text>
            <Text
              style={[
                localStyles.modalSubtitle,
                { color: modalTheme.textSecondary },
              ]}
            >
              Update your personal details & location
            </Text>

            {/* Avatar Section */}
            <TouchableOpacity
              onPress={onPickImage}
              activeOpacity={0.8}
              style={[
                externalStyles?.avatarNeuOuterBox || localStyles.avatarContainer,
                { alignSelf: "center", marginBottom: 18 },
              ]}
            >
              {tempImage ? (
                <Image
                  source={{ uri: tempImage }}
                  style={
                    externalStyles?.avatarImageLarge || localStyles.avatarImage
                  }
                />
              ) : (
                <View
                  style={[
                    externalStyles?.avatarImageLarge || localStyles.avatarImage,
                    {
                      backgroundColor: modalTheme.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Text style={localStyles.initialsText}>
                    {getInitials(tempName || userProfile?.name)}
                  </Text>
                </View>
              )}
              <View style={localStyles.cameraIconBadge}>
                <Pencil color="#FFFFFF" size={12} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            {/* Username Input */}
            <Text
              style={[
                localStyles.inputLabel,
                { color: modalTheme.textSecondary },
              ]}
            >
              Username
            </Text>
            <TextInput
              style={[
                localStyles.modalInput,
                {
                  backgroundColor: modalTheme.inputBg,
                  borderColor: modalTheme.border,
                  color: modalTheme.text,
                },
              ]}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Username"
              placeholderTextColor={modalTheme.textMuted}
            />

            {/* Current Pinned Location Card */}
            <View
              style={[
                localStyles.pinnedCard,
                {
                  backgroundColor: modalTheme.radarBg,
                  borderColor: modalTheme.radarBorder,
                },
              ]}
            >
              <View style={localStyles.pinnedCardHeader}>
                <View
                  style={[
                    localStyles.pinnedIconWrapper,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(0, 176, 116, 0.25)"
                        : "#D1FAE5",
                    },
                  ]}
                >
                  <Ionicons
                    name="location"
                    size={18}
                    color={modalTheme.primary}
                  />
                </View>
                <View style={localStyles.pinnedTextWrapper}>
                  <Text
                    style={[
                      localStyles.pinnedSectionLabel,
                      { color: modalTheme.primary },
                    ]}
                  >
                    CURRENT PINNED LOCATION
                  </Text>
                  <Text
                    style={[
                      localStyles.pinnedLocationValue,
                      { color: modalTheme.text },
                      !currentPinnedLocation && {
                        color: modalTheme.textMuted,
                        fontStyle: "italic",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {currentPinnedLocation || "No location currently pinned"}
                  </Text>
                  <Text
                    style={[
                      localStyles.pinnedSubtext,
                      { color: modalTheme.radarSubtext },
                    ]}
                    numberOfLines={1}
                  >
                    {isLocationModified
                      ? "Updated to new pin • Tap 'Save Changes' to apply"
                      : currentPinnedLocation
                      ? "Active for Palengke Radar & market prices"
                      : "Select province & city below to set your pin"}
                  </Text>
                </View>
                {Boolean(currentPinnedLocation) && (
                  <View
                    style={[
                      localStyles.activePillBadge,
                      isLocationModified && { backgroundColor: modalTheme.primary },
                    ]}
                  >
                    <Ionicons
                      name={isLocationModified ? "checkmark" : "pin"}
                      size={10}
                      color="#FFFFFF"
                      style={{ marginRight: 3 }}
                    />
                    <Text style={localStyles.activePillText}>
                      {isLocationModified ? "NEW PIN" : "PINNED"}
                    </Text>
                  </View>
                )}
              </View>

              {Boolean(isLocationModified && initialPinnedLocation) && (
                <View style={localStyles.newSelectionBanner}>
                  <Ionicons
                    name="arrow-forward-circle"
                    size={14}
                    color={modalTheme.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      localStyles.newSelectionText,
                      { color: modalTheme.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    Previous pin:{" "}
                    <Text
                      style={{
                        fontWeight: "600",
                        color: modalTheme.textMuted,
                        textDecorationLine: "line-through",
                      }}
                    >
                      {initialPinnedLocation}
                    </Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Location Section Heading */}
            <View style={localStyles.sectionHeaderRow}>
              <Ionicons
                name="compass-outline"
                size={16}
                color={modalTheme.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  localStyles.sectionTitle,
                  { color: modalTheme.text },
                ]}
              >
                Change Desired Location
              </Text>
            </View>

            {/* Province Selection Box */}
            <Text
              style={[
                localStyles.inputLabel,
                { color: modalTheme.textSecondary },
              ]}
            >
              Province
            </Text>
            <TouchableOpacity
              style={[
                localStyles.flatInputField,
                localStyles.selectorRow,
                {
                  backgroundColor: modalTheme.inputBg,
                  borderColor: modalTheme.border,
                },
              ]}
              onPress={() => openPicker("province")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  localStyles.selectorValueText,
                  {
                    color: province
                      ? modalTheme.text
                      : modalTheme.textMuted,
                  },
                ]}
              >
                {province ? province.name : "Select Province"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={modalTheme.primary}
              />
            </TouchableOpacity>

            {/* City / Municipality Selection Box */}
            <Text
              style={[
                localStyles.inputLabel,
                { color: modalTheme.textSecondary },
              ]}
            >
              City / Municipality
            </Text>
            <TouchableOpacity
              style={[
                localStyles.flatInputField,
                localStyles.selectorRow,
                {
                  backgroundColor: modalTheme.inputBg,
                  borderColor: modalTheme.border,
                },
                !province && localStyles.disabledSelector,
              ]}
              onPress={() => openPicker("city")}
              activeOpacity={0.7}
              disabled={!province}
            >
              <Text
                style={[
                  localStyles.selectorValueText,
                  {
                    color: city
                      ? modalTheme.text
                      : modalTheme.textMuted,
                  },
                ]}
              >
                {city ? city.name : "Select City / Municipality"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={province ? modalTheme.primary : modalTheme.textMuted}
              />
            </TouchableOpacity>

            {/* Informative Palengke Radar Badge */}
            <View
              style={[
                localStyles.radarCard,
                {
                  backgroundColor: modalTheme.radarBg,
                  borderColor: modalTheme.radarBorder,
                },
              ]}
            >
              <View
                style={[
                  localStyles.radarIconBox,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(0, 176, 116, 0.25)"
                      : "#D1FAE5",
                  },
                ]}
              >
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={modalTheme.primary}
                />
              </View>
              <View style={localStyles.radarContentBox}>
                <Text
                  style={[
                    localStyles.radarTitle,
                    { color: modalTheme.radarText },
                  ]}
                >
                  Palengke & Regional Calibration
                </Text>
                <Text
                  style={[
                    localStyles.radarSubtitle,
                    { color: modalTheme.radarSubtext },
                  ]}
                >
                  MacroSync uses this location to detect nearby public wet markets, catch schedules, and seasonal local ingredients.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={localStyles.modalButtons}>
              <TouchableOpacity
                style={[
                  localStyles.modalCancel,
                  {
                    borderColor: modalTheme.border,
                    backgroundColor: isDarkMode ? "#334155" : "#F1F5F9",
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    localStyles.modalCancelText,
                    { color: modalTheme.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  localStyles.modalSave,
                  { backgroundColor: modalTheme.primary },
                ]}
                onPress={handleSaveWithLocation}
                activeOpacity={0.85}
              >
                <Text style={localStyles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Interactive Searchable Location Picker Sheet (Identical to Step 3) */}
          {pickerVisible && (
            <View
              style={[
                StyleSheet.absoluteFill,
                localStyles.pickerOverlayContainer,
                { backgroundColor: modalTheme.bg },
              ]}
            >
              <View style={localStyles.pickerHeaderRow}>
                <Text
                  style={[
                    localStyles.pickerHeaderTitle,
                    { color: modalTheme.text },
                  ]}
                >
                  Select{" "}
                  {pickerType === "province"
                    ? "Province"
                    : "City / Municipality"}
                </Text>
                <TouchableOpacity
                  onPress={handleClosePicker}
                  style={localStyles.closePickerBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close-circle"
                    size={26}
                    color={modalTheme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Dynamic Search Bar */}
              <View
                style={[
                  localStyles.pickerSearchBar,
                  {
                    backgroundColor: modalTheme.inputBg,
                    borderColor: modalTheme.border,
                  },
                ]}
              >
                <Ionicons
                  name="search"
                  size={16}
                  color={modalTheme.textSecondary}
                  style={localStyles.searchIconMargin}
                />
                <TextInput
                  style={[
                    localStyles.pickerSearchInput,
                    { color: modalTheme.text },
                  ]}
                  placeholder={`Search ${
                    pickerType === "province" ? "province" : "city"
                  }...`}
                  placeholderTextColor={modalTheme.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close"
                      size={18}
                      color={modalTheme.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Virtualized Results List */}
              <View style={localStyles.pickerListContainer}>
                <FlatList
                  data={filteredPickerData}
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
                      style={[
                        localStyles.pickerItemRow,
                        { borderBottomColor: modalTheme.border },
                      ]}
                      onPress={() => handleSelectLocation(item)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          localStyles.pickerItemText,
                          { color: modalTheme.text },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={modalTheme.textMuted}
                      />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={localStyles.emptyContainer}>
                      <Ionicons
                        name="search-outline"
                        size={32}
                        color={modalTheme.textMuted}
                      />
                      <Text
                        style={[
                          localStyles.emptyText,
                          { color: modalTheme.textSecondary },
                        ]}
                      >
                        No locations found matching "{searchQuery}"
                      </Text>
                    </View>
                  }
                />
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "92%",
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: "hidden",
    position: "relative",
  },
  scrollContainer: {
    padding: 22,
    paddingBottom: 28,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    position: "relative",
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  initialsText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#10B981",
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "700",
    borderWidth: 1.5,
    marginBottom: 16,
  },
  pinnedCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 16,
  },
  pinnedCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  pinnedIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  pinnedTextWrapper: {
    flex: 1,
    marginRight: 6,
  },
  pinnedSectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  pinnedLocationValue: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  pinnedSubtext: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  activePillBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 4,
  },
  activePillText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  newSelectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(16, 185, 129, 0.3)",
  },
  newSelectionText: {
    fontSize: 11.5,
    fontWeight: "600",
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  flatInputField: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: "center",
    marginBottom: 14,
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disabledSelector: {
    opacity: 0.5,
  },
  selectorValueText: {
    fontSize: 14,
    fontWeight: "600",
  },
  radarCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  radarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radarContentBox: {
    flex: 1,
  },
  radarTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    marginBottom: 2,
  },
  radarSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "800",
  },
  modalSave: {
    flex: 1.4,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Picker Sheet Overlays
  pickerOverlayContainer: {
    padding: 18,
    paddingTop: 16,
    zIndex: 10,
  },
  pickerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  pickerHeaderTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  closePickerBtn: {
    padding: 2,
  },
  pickerSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  searchIconMargin: {
    marginRight: 8,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    height: "100%",
  },
  pickerListContainer: {
    flex: 1,
    minHeight: 280,
  },
  pickerItemRow: {
    height: ITEM_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
