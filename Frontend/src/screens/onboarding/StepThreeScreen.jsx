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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal';
import { getStyles, ITEM_HEIGHT, baseColor, logoGreen } from './StepThreeScreen.styles';

export default function StepThreeScreen({ onSubmit, isLoadingExternal }) {
  const { showAlert } = useCustomAlert();
  const { theme } = useTheme();
  const isDarkMode = false;
  const styles = getStyles(theme, false);
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customAllergy, setCustomAllergy] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState([]);

  // Medical Screening States
  const [selectedConditions, setSelectedConditions] = useState(['none']);
  const [customCondition, setCustomCondition] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [privacyInitialTab, setPrivacyInitialTab] = useState('medical');
  const [compiledConditionsText, setCompiledConditionsText] = useState('');

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

  const presetMedicalConditions = [
    { id: 'diabetes', title: 'Diabetes (Type 1/2)' },
    { id: 'eating_disorder', title: 'Eating Disorder' },
    { id: 'hypertension', title: 'Hypertension' },
    { id: 'renal', title: 'Kidney / Renal Issue' },
    { id: 'fatty_liver', title: 'Fatty Liver' },
    { id: 'gerd', title: 'Acid Reflux / GERD' },
    { id: 'gout', title: 'Gout / Uric Acid' },
    { id: 'none', title: 'None / Healthy' }
  ];

  const toggleCondition = (id) => {
    if (id === 'none') {
      setSelectedConditions(['none']);
      return;
    }
    let updated = selectedConditions.filter(item => item !== 'none');
    if (updated.includes(id)) {
      updated = updated.filter(item => item !== id);
      if (updated.length === 0) updated = ['none'];
    } else {
      updated.push(id);
    }
    setSelectedConditions(updated);
  };

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

const PHILIPPINE_PROVINCES_FALLBACK = [
  "Metro Manila (NCR)", "Abra", "Agusan del Norte", "Agusan del Sur", "Aklan", "Albay", 
  "Antique", "Apayao", "Aurora", "Basilan", "Bataan", "Batanes", "Batangas", "Benguet", 
  "Biliran", "Bohol", "Bukidnon", "Bulacan", "Cagayan", "Camarines Norte", "Camarines Sur", 
  "Camiguin", "Capiz", "Catanduanes", "Cavite", "Cebu", "Cotabato", "Davao de Oro", 
  "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental", "Dinagat Islands", 
  "Eastern Samar", "Guimaras", "Ifugao", "Ilocos Norte", "Ilocos Sur", "Iloilo", "Isabela", 
  "Kalinga", "La Union", "Laguna", "Lanao del Norte", "Lanao del Sur", "Leyte", "Maguindanao", 
  "Marinduque", "Masbate", "Misamis Occidental", "Misamis Oriental", "Mountain Province", 
  "Negros Occidental", "Negros Oriental", "Northern Samar", "Nueva Ecija", "Nueva Vizcaya", 
  "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Pampanga", "Pangasinan", "Quezon", 
  "Quirino", "Rizal", "Romblon", "Samar", "Sarangani", "Siquijor", "Sorsogon", "South Cotabato", 
  "Southern Leyte", "Sultan Kudarat", "Sulu", "Surigao del Norte", "Surigao del Sur", 
  "Tarlac", "Tawi-Tawi", "Zambales", "Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay"
].map((name, i) => ({ province_code: `P${100 + i}`, name, province_name: name }));

  const openPicker = async (type) => {
    if (isLoadingExternal || isLoading || isFetchingPicker) return;

    setIsFetchingPicker(type);
    try {
      if (type === 'province') {
        let formatted = [];
        try {
          const res = await axios.get('https://isaacdarcilla.github.io/philippine-addresses/province.json', { timeout: 3500 });
          if (Array.isArray(res.data) && res.data.length > 0) {
            formatted = res.data.map(p => ({
              ...p,
              name: p.province_name || p.name
            }));
          }
        } catch (_) {
          try {
            const res2 = await axios.get('https://psgc.gitlab.io/api/provinces/', { timeout: 3500 });
            if (Array.isArray(res2.data) && res2.data.length > 0) {
              formatted = res2.data.map(p => ({
                province_code: p.code,
                name: p.name,
                province_name: p.name
              }));
            }
          } catch (_) {}
        }

        if (!formatted || formatted.length === 0) {
          formatted = PHILIPPINE_PROVINCES_FALLBACK;
        }

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
          const res = await axios.get('https://isaacdarcilla.github.io/philippine-addresses/city.json', { timeout: 3500 });
          if (Array.isArray(res.data) && res.data.length > 0) {
            const filtered = res.data.filter(c => c.province_code === province.province_code);
            formatted = filtered.map(c => ({ ...c, name: c.city_name || c.name }));
          }
        } catch (_) {
          try {
            const res2 = await axios.get(`https://psgc.gitlab.io/api/provinces/${province.province_code}/cities-municipalities/`, { timeout: 3500 });
            if (Array.isArray(res2.data) && res2.data.length > 0) {
              formatted = res2.data.map(c => ({
                city_code: c.code,
                province_code: province.province_code,
                name: c.name
              }));
            }
          } catch (_) {}
        }

        if (!formatted || formatted.length === 0) {
          formatted = [
            { city_code: `${province.province_code}-c1`, name: `${province.name} City / Capital` },
            { city_code: `${province.province_code}-c2`, name: `Central ${province.name}` },
            { city_code: `${province.province_code}-c3`, name: `North ${province.name}` },
            { city_code: `${province.province_code}-c4`, name: `South ${province.name}` }
          ];
        }

        formatted.sort((a, b) => a.name.localeCompare(b.name));
        setPickerData(formatted);
        setSearchQuery('');
        setPickerType(type);
        setPickerVisible(true);
      }
    } catch (err) {
      console.log("Error loading dropdown data: ", err);
      // Fallback to static data on error
      if (type === 'province') {
        setPickerData(PHILIPPINE_PROVINCES_FALLBACK);
        setSearchQuery('');
        setPickerType(type);
        setPickerVisible(true);
      }
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

    const trimmedCustomCondition = customCondition.trim();
    if (trimmedCustomCondition && trimmedCustomCondition.length < 2) {
      triggerCustomError(
        "Invalid Condition Name",
        "Please enter a valid condition name or clear the custom field."
      );
      return;
    }

    if (!disclaimerAccepted) {
      triggerCustomError(
        "Medical Disclaimer Required",
        "Please review and check the Medical Disclaimer acknowledgment below before completing your set up."
      );
      return;
    }

    const compiledAddressString = `${city.name}, ${province.name}`;
    const activeAllergies = [...selectedAllergies.map(id => presetAllergens.find(p => p.id === id).title)];
    if (trimmedCustomAllergy) activeAllergies.push(trimmedCustomAllergy);

    const activeConditions = selectedConditions.includes('none') && !trimmedCustomCondition
      ? ["None declared (Healthy)"]
      : [
          ...selectedConditions.filter(id => id !== 'none').map(id => presetMedicalConditions.find(p => p.id === id)?.title || id),
          ...(trimmedCustomCondition ? [trimmedCustomCondition] : [])
        ];

    setCompiledAddress(compiledAddressString);
    setCompiledAllergiesText(activeAllergies.length === 0 ? "No allergies specified" : activeAllergies.join(', '));
    setCompiledConditionsText(activeConditions.join(', '));
    setConfirmVisible(true);
  };

  const handleFinalSubmitDispatch = async () => {
    setConfirmVisible(false);
    setIsLoading(true);
    try {
      const activeConditionsList = selectedConditions.includes('none') && !customCondition.trim()
        ? []
        : [
            ...selectedConditions.filter(id => id !== 'none').map(id => presetMedicalConditions.find(p => p.id === id)?.title || id),
            ...(customCondition.trim() ? [customCondition.trim()] : [])
          ];

      const stepThreePayload = {
        address: compiledAddress,
        structuredLocation: {
          province: province.name,
          city: city.name
        },
        city: city.name,
        allergies: [
          ...selectedAllergies.map(id => presetAllergens.find(p => p.id === id)?.title || id),
          ...(customAllergy.trim() ? [customAllergy.trim()] : [])
        ],
        medical_conditions: activeConditionsList,
        medicalConditions: activeConditionsList,
        disclaimer_accepted: true
      };
      try {
        await AsyncStorage.setItem('@ms_onboarding_data', JSON.stringify(stepThreePayload));
      } catch (_) {}
      await onSubmit?.(stepThreePayload);
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

            {/* HEALTH SCREENING & MEDICAL CONDITIONS */}
            <Text style={[styles.sectionInputLabel, { marginTop: 18 }]}>Health Screening & Clinical Notice</Text>
            
            <View style={styles.medicalNoticeBox}>
              <View style={styles.medicalNoticeHeader}>
                <Ionicons name="medical-outline" size={16} color="#B45309" />
                <Text style={styles.medicalNoticeTitle}>Pre-Existing Health Screening</Text>
              </View>
              <Text style={styles.medicalNoticeSubtitle}>
                MacroSync is an educational wellness tool. Users with diabetes, eating disorders, or chronic conditions should consult a healthcare professional rather than relying solely on automated advice.
              </Text>
            </View>

            <Text style={styles.inputLabel}>Select Any Known Medical Conditions</Text>
            <View style={styles.chipGrid}>
              {presetMedicalConditions.map((condition) => {
                const isSelected = selectedConditions.includes(condition.id);
                const isNone = condition.id === 'none';
                return (
                  <TouchableOpacity
                    key={condition.id}
                    activeOpacity={0.8}
                    disabled={isLoading || isLoadingExternal}
                    onPress={() => toggleCondition(condition.id)}
                    style={[
                      styles.chip,
                      isSelected
                        ? isNone
                          ? styles.medicalChipActiveNone
                          : styles.medicalChipActive
                        : styles.medicalChipInactive
                    ]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {condition.title}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name={isNone ? "checkmark-circle" : "close-circle"}
                        size={14}
                        color="#FFFFFF"
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Other Medical Condition / Illness</Text>
              <View style={styles.flatInputField}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., PCOS, Thyroid, Fatty Liver (Optional)"
                  placeholderTextColor="#94A3B8"
                  value={customCondition}
                  onChangeText={setCustomCondition}
                  autoCorrect={true}
                  editable={!isLoading && !isLoadingExternal}
                />
              </View>
            </View>

            {/* MANDATORY DISCLAIMER CHECKBOX & PRIVACY POLICY TRIGGER */}
            <View style={styles.disclaimerAgreementBox}>
              <TouchableOpacity
                style={styles.disclaimerAgreementRow}
                activeOpacity={0.7}
                onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}
              >
                <View style={[styles.disclaimerCheckbox, disclaimerAccepted && styles.disclaimerCheckboxActive]}>
                  {disclaimerAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.disclaimerAgreementText}>
                  I acknowledge that MacroSync provides nutritional & workout tracking for general wellness only and does not replace licensed medical diagnosis or clinical treatment.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.disclaimerLinkButton}
                activeOpacity={0.7}
                onPress={() => {
                  setPrivacyInitialTab('medical');
                  setPrivacyModalVisible(true);
                }}
              >
                <Text style={styles.disclaimerLinkText}>
                  Read Medical Disclaimer & Privacy Policy (RA 10173)
                </Text>
                <Ionicons name="open-outline" size={13} color={logoGreen} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
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
              <Text style={styles.confirmDataLabel}>Current Address String</Text>
              <Text style={styles.confirmDataValue}>{compiledAddress}</Text>

              <View style={styles.confirmDivider} />

              <Text style={styles.confirmDataLabel}>Profile Exclusions & Allergies</Text>
              <Text style={[styles.confirmDataValue, compiledAllergiesText.includes("No") ? { color: '#94A3B8' } : { color: '#64748B' }]}>
                {compiledAllergiesText}
              </Text>

              <View style={styles.confirmDivider} />

              <Text style={styles.confirmDataLabel}>Health & Medical Screening</Text>
              <Text style={[styles.confirmDataValue, compiledConditionsText.includes("None") ? { color: '#94A3B8' } : { color: '#D97706' }]}>
                {compiledConditionsText}
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

      {/* PRIVACY POLICY & CLINICAL SCOPE MODAL */}
      <PrivacyPolicyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
        initialTab={privacyInitialTab}
      />

    </SafeAreaView>
  );
}