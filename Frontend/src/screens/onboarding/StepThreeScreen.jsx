import React, { useState, useEffect, useRef } from 'react';
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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';

const ITEM_HEIGHT = 54;

export default function StepThreeScreen({ onSubmit, isLoadingExternal }) {
  const { showAlert } = useCustomAlert();
  const { theme } = useTheme();
  const isDarkMode = false;
  const styles = getStyles(theme, false);
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customAllergy, setCustomAllergy] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState([]);

  // Address Selector States
  const [province, setProvince] = useState(null);
  const [city, setCity] = useState(null);

  // Overlay Control States
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState('');
  const [pickerData, setPickerData] = useState([]);
  const [isFetchingPicker, setIsFetchingPicker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Confirmation Modal Sheet State
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [compiledAddress, setCompiledAddress] = useState('');
  const [compiledAllergiesText, setCompiledAllergiesText] = useState('');

  const presetAllergens = [
    { id: 'peanuts', title: 'Peanuts' },
    { id: 'seafood', title: 'Seafood' },
    { id: 'dairy', title: 'Dairy' },
    { id: 'eggs', title: 'Eggs' },
    { id: 'gluten', title: 'Gluten' },
    { id: 'nuts', title: 'Tree Nuts' }
  ];

  // References for layout tracking
  const flatListRef = useRef(null);

  const toggleAllergen = (id) => {
    if (selectedAllergies.includes(id)) {
      setSelectedAllergies(selectedAllergies.filter(item => item !== id));
    } else {
      setSelectedAllergies([...selectedAllergies, id]);
    }
  };

  const triggerCustomError = (title, message) => {
    showAlert(title, message);
  };

  const openPicker = async (type) => {
    if (isLoadingExternal || isLoading || isFetchingPicker) return;

    setIsFetchingPicker(type);
    try {
      if (type === 'province') {
        let formatted = [];
        try {
          const res = await axios.get('https://isaacdarcilla.github.io/philippine-addresses/province.json');
          if (Array.isArray(res.data)) {
            formatted = res.data.map(p => ({
              ...p,
              name: p.province_name || p.name
            }));
          }
        } catch (_) {}

        // De-duplicate by province_code or name
        const uniqueMap = new Map();
        formatted.forEach(item => {
          if (item.name && !uniqueMap.has(item.name)) {
            uniqueMap.set(item.name, item);
          }
        });
        const sorted = Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        setPickerData(sorted);
        setSearchQuery('');
        setPickerType(type);
        setPickerVisible(true);
      } else if (type === 'city') {
        if (!province) {
          triggerCustomError("Sequence Interrupted", "Please select a Province first.");
          return;
        }
        let formatted = [];
        try {
          const res = await axios.get('https://isaacdarcilla.github.io/philippine-addresses/city.json');
          if (Array.isArray(res.data)) {
            const filtered = res.data.filter(c => c.province_code === province.province_code);
            formatted = filtered.map(c => ({ ...c, name: c.city_name || c.name }));
          }
        } catch (_) {}
        formatted.sort((a, b) => a.name.localeCompare(b.name));
        setPickerData(formatted);
        setSearchQuery('');
        setPickerType(type);
        setPickerVisible(true);
      }
    } catch (err) {
      console.log("Error loading dropdown data: ", err);
      triggerCustomError("Data Error", "Could not fetch local directory parameters.");
    } finally {
      setIsFetchingPicker(null);
    }
  };

  const handleSelectLocation = (item) => {
    if (pickerType === 'province') {
      if (province?.province_code !== item.province_code) {
        setProvince(item);
        setCity(null);
      }
    } else if (pickerType === 'city') {
      if (city?.city_code !== item.city_code) {
        setCity(item);
      }
    }
    setPickerVisible(false);
  };

  const handleTriggerConfirmationModal = () => {
    if (isLoading || isLoadingExternal) return;

    if (!province || !city) {
      const missingFields = [];
      if (!province) missingFields.push("Province");
      if (!city) missingFields.push("City/Municipality");

      triggerCustomError(
        "Incomplete Location",
        `Please complete the remaining geographic selectors:\n\nMissing fields: ${missingFields.join(', ')}`
      );
      return;
    }

    const trimmedCustomAllergy = customAllergy.trim();
    if (trimmedCustomAllergy && trimmedCustomAllergy.length < 3) {
      triggerCustomError(
        "Invalid Allergy Name",
        "Please provide a realistic ingredient text description length, or clear out the custom allocation box field completely."
      );
      return;
    }

    const compiledAddressString = `${city.name}, ${province.name}`;
    const activeAllergies = [...selectedAllergies.map(id => presetAllergens.find(p => p.id === id).title)];
    if (trimmedCustomAllergy) activeAllergies.push(trimmedCustomAllergy);

    setCompiledAddress(compiledAddressString);
    setCompiledAllergiesText(activeAllergies.length === 0 ? "No allergies specified" : activeAllergies.join(', '));
    setConfirmVisible(true);
  };

  const handleFinalSubmitDispatch = async () => {
    setConfirmVisible(false);
    setIsLoading(true);
    try {
      await onSubmit?.({
        address: compiledAddress,
        structuredLocation: {
          province: province.name,
          city: city.name
        },
        allergies: [
          ...selectedAllergies.map(id => presetAllergens.find(p => p.id === id)?.title || id),
          ...(customAllergy.trim() ? [customAllergy.trim()] : [])
        ]
      });
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={baseColor} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 3 OF 3</Text>
            <Text style={styles.brandTitle}>Dietary Context</Text>
            <Text style={styles.brandSubtitle}>
              Finalize your location and constraints to ensure recommendations match your local food context.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionInputLabel}>Local Food Availability & Region</Text>

            {/* PROVINCE SELECTION INPUT BOX */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Province</Text>
              <TouchableOpacity
                style={[styles.flatInputField, styles.selectorRow]}
                onPress={() => openPicker('province')}
                activeOpacity={0.7}
                disabled={isFetchingPicker === 'province'}
              >
                <Text style={[styles.selectorValueText, !province && styles.placeholderText]}>
                  {province ? province.name : "Select Province"}
                </Text>
                {isFetchingPicker === 'province' ? (
                  <ActivityIndicator size="small" color={logoGreen} />
                ) : (
                  <Ionicons name="chevron-down" size={16} color={logoGreen} />
                )}
              </TouchableOpacity>
            </View>

            {/* CITY SELECTION INPUT BOX */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City / Municipality</Text>
              <TouchableOpacity
                style={[styles.flatInputField, styles.selectorRow, (!province || isFetchingPicker === 'city') && styles.disabledSelector]}
                onPress={() => openPicker('city')}
                activeOpacity={0.7}
                disabled={!province || isFetchingPicker === 'city'}
              >
                <Text style={[styles.selectorValueText, !city && styles.placeholderText]}>
                  {city ? city.name : "Select City / Municipality"}
                </Text>
                {isFetchingPicker === 'city' ? (
                  <ActivityIndicator size="small" color={logoGreen} />
                ) : (
                  <Ionicons name="chevron-down" size={16} color={province ? logoGreen : '#CBD5E1'} />
                )}
              </TouchableOpacity>
            </View>



            {/* ALLERGENS SELECTION LAYERS */}
            <Text style={[styles.sectionInputLabel, { marginTop: 14 }]}>Allergies & Restrictions</Text>
            <Text style={styles.inputLabel}>Select Known Allergens</Text>

            <View style={styles.chipGrid}>
              {presetAllergens.map((allergen) => {
                const isSelected = selectedAllergies.includes(allergen.id);
                return (
                  <TouchableOpacity
                    key={allergen.id}
                    activeOpacity={0.8}
                    disabled={isLoading || isLoadingExternal}
                    onPress={() => toggleAllergen(allergen.id)}
                    style={[styles.chip, isSelected ? styles.chipActive : styles.chipInactive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {allergen.title}
                    </Text>
                    {isSelected && <Ionicons name="close-circle" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Other Custom Food Allergy</Text>
              <View style={styles.flatInputField}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Shrimp, Almonds (Optional)"
                  placeholderTextColor="#94A3B8"
                  value={customAllergy}
                  onChangeText={setCustomAllergy}
                  autoCorrect={true}
                  editable={!isLoading && !isLoadingExternal}
                />
              </View>
            </View>

          </View>
        </ScrollView>

        <View style={styles.fixedFooter}>
          <TouchableOpacity
            activeOpacity={1}
            disabled={isLoading || isLoadingExternal}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            onPress={handleTriggerConfirmationModal}
            style={[styles.buttonBase, isPressed ? styles.buttonPressed : styles.buttonUnpressed]}
          >
            {isLoading || isLoadingExternal ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
                Complete Set Up
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* SEARCH/PICKER MODAL LIST DROPDOWN SELECTION */}
      <Modal visible={pickerVisible} transparent={true} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerHeaderRow}>
              <Text style={styles.pickerModalTitle}>Select {pickerType.toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${pickerType}...`}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            <View style={styles.pickerContentWrapper}>
              <FlatList
                ref={flatListRef}
                data={pickerData.filter(item =>
                  item.name ? item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) : false
                )}
                keyExtractor={(item, index) => `${item.province_code || item.city_code || 'loc'}-${item.name || 'item'}-${index}`}
                showsVerticalScrollIndicator={false}
                style={styles.optionsList}
                contentContainerStyle={styles.optionsListContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.pickerItemRow} onPress={() => handleSelectLocation(item)}>
                    <Text style={styles.pickerItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* HYBRID-NEUMORPHIC PREMIUM VERIFICATION OVERLAY SHEET */}
      <Modal visible={confirmVisible} transparent={true} animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModalCard}>

            <View style={styles.confirmIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={32} color={logoGreen} />
            </View>

            <Text style={styles.confirmTitle}>Review Metrics</Text>
            <Text style={styles.confirmSubtitle}>Please double check your parameters before finalizing baseline calibrations.</Text>

            <View style={styles.confirmDataBlock}>
              <Text style={styles.confirmDataLabel}>📍 Current Address String</Text>
              <Text style={styles.confirmDataValue}>{compiledAddress}</Text>

              <View style={styles.confirmDivider} />

              <Text style={styles.confirmDataLabel}>⚠️ Profile Exclusions & Allergies</Text>
              <Text style={[styles.confirmDataValue, compiledAllergiesText.includes("No") ? { color: '#94A3B8' } : { color: '#64748B' }]}>
                {compiledAllergiesText}
              </Text>
            </View>

            <View style={styles.confirmActionRow}>
              <TouchableOpacity
                style={[styles.confirmButtonBase, styles.confirmButtonSecondary]}
                onPress={() => setConfirmVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonTextSecondary}>Edit Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButtonBase, styles.confirmButtonPrimary]}
                onPress={handleFinalSubmitDispatch}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonTextPrimary}>Confirm</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>



    </SafeAreaView>
  );
}

// Global Core Flat Design Tokens
const baseColor = '#F8FAFC';

// Logo Corporate Branding Elements
const logoGreen = '#10B981';

const getStyles = (theme) => StyleSheet.create({
  // --- BASE CONTAINER ARCHITECTURE ---
  container: {
    flex: 1,
    backgroundColor: theme?.background || baseColor,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 35 : 25,
  },

  // --- TYPOGRAPHY HEADER SYSTEM ---
  headerSection: {
    alignItems: 'center',
    width: '100%',
    marginTop: Platform.OS === 'ios' ? 20 : 15,
    marginBottom: 20,
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: '900',
    color: logoGreen,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: theme?.textSecondary || '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '700',
    paddingHorizontal: 10,
  },

  // --- SURFACE PANEL MATRIX ---
  formCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
    marginBottom: 10,
  },
  sectionInputLabel: {
    color: theme?.textPrimary || '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 4,
  },

  // --- FORMS & SELECTION MATRIX ---
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: theme?.textPrimary || '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  flatInputField: {
    backgroundColor: theme?.inputBg || baseColor,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || '#E2E8F0',
    height: 48,
    justifyContent: 'center',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  selectorValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme?.textPrimary || '#0F172A',
  },
  placeholderText: {
    color: theme?.textSecondary || '#94A3B8',
    fontWeight: '600',
  },
  disabledSelector: {
    backgroundColor: theme?.cardBg || '#F1F5F9',
    borderColor: theme?.border || '#E2E8F0',
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: theme?.textPrimary || '#0F172A',
    paddingHorizontal: 16,
    height: '100%',
    fontSize: 14,
    fontWeight: '700',
  },

  // --- ALLERGENS SELECTION CHIPS ---
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    marginLeft: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  chipInactive: {
    backgroundColor: theme?.surface || baseColor,
    borderColor: theme?.border || '#E2E8F0',
  },
  chipActive: {
    backgroundColor: logoGreen,
    borderColor: logoGreen,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme?.textSecondary || '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // --- FIXED NAVIGATION BOTTOM HOOD ---
  fixedFooter: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 8,
    backgroundColor: theme?.background || baseColor,
    borderTopWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
  },
  buttonBase: {
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
  },
  buttonUnpressed: {
    backgroundColor: logoGreen,
    borderRadius: 20,
  },
  buttonPressed: {
    backgroundColor: '#059669',
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonTextPressed: {
    color: '#E2E8F0',
  },

  // --- POPUP SELECTOR INTERFACES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerModalCard: {
    backgroundColor: theme?.surface || baseColor,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    height: '75%',
    width: '100%',
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
    paddingBottom: 12,
  },
  pickerModalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    letterSpacing: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme?.inputBg || '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme?.inputBorder || '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme?.textPrimary || '#0F172A',
    fontWeight: '600',
    height: '100%',
  },
  pickerContentWrapper: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  optionsList: {
    flex: 1,
  },
  optionsListContent: {
    paddingBottom: 60,
  },
  pickerItemRow: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme?.textPrimary || '#0F172A',
  },

  // --- PREMIUM OVERLAY DIALOGUE (CONFIRMATION SHEET STYLE) ---
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 32, 44, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmModalCard: {
    width: '100%',
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: theme?.cardBg || '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    marginBottom: 6,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: theme?.textSecondary || '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  confirmDataBlock: {
    width: '100%',
    backgroundColor: theme?.inputBg || '#F1F5F9',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme?.inputBorder || '#E2E8F0',
    marginBottom: 24,
  },
  confirmDataLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: theme?.textSecondary || '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  confirmDataValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme?.textPrimary || '#0F172A',
    lineHeight: 20,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: theme?.border || '#E2E8F0',
    marginVertical: 12,
  },
  confirmActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButtonBase: {
    flex: 1,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonSecondary: {
    backgroundColor: theme?.surface || baseColor,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  confirmButtonPrimary: {
    backgroundColor: logoGreen,
  },
  confirmButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '800',
    color: theme?.textSecondary || '#64748B',
  },
  confirmButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

});