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
import { useCustomAlert } from '../../context/CustomAlertContext';

// Import child lookup methods from your installed library
import { provinces, cities } from 'select-philippines-address';

const ITEM_HEIGHT = 54;

export default function StepThreeScreen({ onSubmit, isLoadingExternal }) {
  const { showAlert } = useCustomAlert();
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

  const getPsgcRegionCodes = (customCode) => {
    switch (customCode) {
      case 'NCR': return ['13'];
      case 'VIS': return ['06', '07', '08'];
      case 'MIN': return ['09', '10', '11', '12', '13', '14', '15', '16', '19'];
      case 'NL': return ['01', '02', '03', '14'];
      case 'SL': return ['04', '05', '17'];
      default: return [];
    }
  };

  const triggerCustomError = (title, message) => {
    showAlert(title, message);
  };

  const openPicker = async (type) => {
    if (isLoadingExternal || isLoading) return;

    try {
      if (type === 'province') {
        // select-philippines-address requires a region code - fetch all regions and merge
        const ALL_REGION_CODES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '19'];
        let aggregated = [];
        for (const code of ALL_REGION_CODES) {
          try {
            const res = await provinces(code);
            aggregated = [...aggregated, ...res];
          } catch (_) { /* skip regions with no provinces */ }
        }
        const formatted = aggregated.map(p => ({ ...p, name: p.province_name || p.name }));
        formatted.sort((a, b) => a.name.localeCompare(b.name));
        setPickerData(formatted);
        setPickerType(type);
        setPickerVisible(true);
      } else if (type === 'city') {
        if (!province) {
          triggerCustomError("Sequence Interrupted", "Please select a Province first.");
          return;
        }
        const res = await cities(province.province_code);
        const formatted = res.map(c => ({ ...c, name: c.city_name || c.name }));
        formatted.sort((a, b) => a.name.localeCompare(b.name));
        setPickerData(formatted);
        setPickerType(type);
        setPickerVisible(true);
      }
    } catch (err) {
      console.log("Error loading dropdown data: ", err);
      triggerCustomError("Data Error", "Could not fetch local directory parameters.");
    }
  };

  const handleSelectLocation = (item) => {
    if (pickerType === 'province') {
      if (province?.province_code !== item.province_code) {
        setProvince(item); setCity(null);
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
          ...selectedAllergies,
          ...(customAllergy.trim() ? [customAllergy.trim().toLowerCase()] : [])
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
                style={[styles.neumorphicInputInset, styles.selectorRow]}
                onPress={() => openPicker('province')}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectorValueText, !province && styles.placeholderText]}>
                  {province ? province.name : "Select Province"}
                </Text>
                <Ionicons name="chevron-down" size={16} color={logoGreen} />
              </TouchableOpacity>
            </View>

            {/* CITY SELECTION INPUT BOX */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City / Municipality</Text>
              <TouchableOpacity
                style={[styles.neumorphicInputInset, styles.selectorRow, !province && styles.disabledSelector]}
                onPress={() => openPicker('city')}
                activeOpacity={0.7}
                disabled={!province}
              >
                <Text style={[styles.selectorValueText, !city && styles.placeholderText]}>
                  {city ? city.name : "Select City / Municipality"}
                </Text>
                <Ionicons name="chevron-down" size={16} color={province ? logoGreen : '#AEC2B7'} />
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
              <View style={styles.neumorphicInputInset}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Shrimp, Almonds (Optional)"
                  placeholderTextColor="#7FA293"
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
                <Ionicons name="close" size={24} color="#21332A" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContentWrapper}>
              <FlatList
                ref={flatListRef}
                data={pickerData}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                style={styles.optionsList}
                contentContainerStyle={styles.optionsListContent}
                getItemLayout={(data, index) => (
                  { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                )}
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
              <Text style={[styles.confirmDataValue, compiledAllergiesText.includes("No") ? { color: '#7FA293' } : { color: '#C05621' }]}>
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

// Global Core Neumorphic Theme Tokens
const baseColor = '#F0F4F2';
const clearWhiteHighlight = '#FFFFFF';
const softGreenShadow = '#AEC2B7';

// Logo Corporate Branding Elements
const logoGreen = '#4EA685';
const logoDarkShadow = '#37745D';
const logoLightHighlight = '#65D8AD';

const styles = StyleSheet.create({
  // --- BASE CONTAINER ARCHITECTURE ---
  container: {
    flex: 1,
    backgroundColor: baseColor,
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
    color: '#21332A',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#556B60',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '700',
    paddingHorizontal: 10,
  },

  // --- SURFACE PANEL MATRIX ---
  formCard: {
    backgroundColor: baseColor,
    borderRadius: 32,
    padding: 20,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
    marginBottom: 10,
  },
  sectionInputLabel: {
    color: '#41544B',
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
    color: '#41544B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  neumorphicInputInset: {
    backgroundColor: baseColor,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
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
    color: '#1A2B23',
  },
  placeholderText: {
    color: '#7FA293',
    fontWeight: '600',
  },
  disabledSelector: {
    backgroundColor: '#E4ECE8',
    borderColor: '#E1E9E5',
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: '#1A2B23',
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
    backgroundColor: baseColor,
    borderColor: '#E1E9E5',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: logoGreen,
    borderColor: logoGreen,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#41544B',
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
    backgroundColor: baseColor,
    borderTopWidth: 1,
    borderColor: '#E1E9E5',
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
    backgroundColor: '#53B28E',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: logoLightHighlight,
    borderLeftColor: logoLightHighlight,
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.95,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonPressed: {
    backgroundColor: '#3E836A',
    borderWidth: 1.5,
    borderColor: logoDarkShadow,
    transform: [{ translateY: 2 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: logoDarkShadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonTextPressed: {
    color: '#9EDEC4',
  },

  // --- POPUP SELECTOR INTERFACES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerModalCard: {
    backgroundColor: baseColor,
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
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#D4E2DC',
    paddingBottom: 12,
  },
  pickerModalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#21332A',
    letterSpacing: 1,
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
    borderColor: '#E1E9E5',
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2B23',
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
    backgroundColor: baseColor,
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 2,
    borderColor: clearWhiteHighlight,
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#E2EFEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#21332A',
    marginBottom: 6,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: '#556B60',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  confirmDataBlock: {
    width: '100%',
    backgroundColor: '#E4ECE8',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4E2DC',
    marginBottom: 24,
  },
  confirmDataLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#41544B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  confirmDataValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2B23',
    lineHeight: 20,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#D4E2DC',
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
    backgroundColor: baseColor,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
  },
  confirmButtonPrimary: {
    backgroundColor: logoGreen,
  },
  confirmButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#556B60',
  },
  confirmButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

});