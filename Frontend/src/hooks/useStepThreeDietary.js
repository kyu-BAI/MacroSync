import { useState, useCallback, useMemo } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCustomAlert } from "../context/CustomAlertContext";

// Height per picker item row in dropdown lists
export const ITEM_HEIGHT = 54;

// Preset common food allergens
export const PRESET_ALLERGENS = [
  { id: "peanuts", title: "Peanuts" },
  { id: "seafood", title: "Seafood" },
  { id: "dairy", title: "Dairy" },
  { id: "eggs", title: "Eggs" },
  { id: "gluten", title: "Gluten" },
  { id: "nuts", title: "Tree Nuts" },
];

// Preset medical conditions for screening
export const PRESET_MEDICAL_CONDITIONS = [
  { id: "diabetes", title: "Diabetes (Type 1/2)" },
  { id: "eating_disorder", title: "Eating Disorder" },
  { id: "hypertension", title: "Hypertension" },
  { id: "renal", title: "Kidney / Renal Issue" },
  { id: "fatty_liver", title: "Fatty Liver" },
  { id: "gerd", title: "Acid Reflux / GERD" },
  { id: "gout", title: "Gout / Uric Acid" },
  { id: "none", title: "None / Healthy" },
];

// Comprehensive fallback list of Philippine provinces
export const PHILIPPINE_PROVINCES_FALLBACK = [
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
  "Tarlac", "Tawi-Tawi", "Zambales", "Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay",
].map((name, i) => ({ province_code: `P${100 + i}`, name, province_name: name }));

export default function useStepThreeDietary({ onSubmit, isLoadingExternal }) {
  const { showAlert } = useCustomAlert();

  // Location Selector States
  const [province, setProvince] = useState(null);
  const [city, setCity] = useState(null);

  // Allergies & Restrictions States
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [customAllergy, setCustomAllergy] = useState("");

  // Medical Screening States
  const [selectedConditions, setSelectedConditions] = useState(["none"]);
  const [customCondition, setCustomCondition] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Privacy Policy Modal States
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [privacyInitialTab, setPrivacyInitialTab] = useState("medical");

  // Location Picker Dropdown Modal States
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState("");
  const [pickerData, setPickerData] = useState([]);
  const [isFetchingPicker, setIsFetchingPicker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Review Confirmation Modal Sheet States
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [compiledAddress, setCompiledAddress] = useState("");
  const [compiledAllergiesText, setCompiledAllergiesText] = useState("");
  const [compiledConditionsText, setCompiledConditionsText] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // Allergen selection toggle
  const toggleAllergen = useCallback((id) => {
    setSelectedAllergies((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  // Medical condition toggle with mutually exclusive "none"
  const toggleCondition = useCallback((id) => {
    if (id === "none") {
      setSelectedConditions(["none"]);
      return;
    }
    setSelectedConditions((prev) => {
      let updated = prev.filter((item) => item !== "none");
      if (updated.includes(id)) {
        updated = updated.filter((item) => item !== id);
        if (updated.length === 0) updated = ["none"];
      } else {
        updated.push(id);
      }
      return updated;
    });
  }, []);

  // Custom text input handlers
  const handleCustomAllergyChange = useCallback((text) => {
    setCustomAllergy(text);
  }, []);

  const handleCustomConditionChange = useCallback((text) => {
    setCustomCondition(text);
  }, []);

  const handleToggleDisclaimer = useCallback(() => {
    setDisclaimerAccepted((prev) => !prev);
  }, []);

  // Privacy policy modal openers
  const handleOpenPrivacyModal = useCallback((tab = "medical") => {
    setPrivacyInitialTab(tab);
    setPrivacyModalVisible(true);
  }, []);

  const handleClosePrivacyModal = useCallback(() => {
    setPrivacyModalVisible(false);
  }, []);

  // Fetch geographic location data (Provinces or Cities)
  const openPicker = useCallback(
    async (type) => {
      if (isLoadingExternal || isLoading || isFetchingPicker) return;

      setIsFetchingPicker(type);
      try {
        if (type === "province") {
          let formatted = [];
          try {
            const res = await axios.get(
              "https://isaacdarcilla.github.io/philippine-addresses/province.json",
              { timeout: 3500 }
            );
            if (Array.isArray(res.data) && res.data.length > 0) {
              formatted = res.data.map((p) => ({
                ...p,
                name: p.province_name || p.name,
              }));
            }
          } catch (_) {
            try {
              const res2 = await axios.get("https://psgc.gitlab.io/api/provinces/", {
                timeout: 3500,
              });
              if (Array.isArray(res2.data) && res2.data.length > 0) {
                formatted = res2.data.map((p) => ({
                  province_code: p.code,
                  name: p.name,
                  province_name: p.name,
                }));
              }
            } catch (_) {}
          }

          if (!formatted || formatted.length === 0) {
            formatted = PHILIPPINE_PROVINCES_FALLBACK;
          }

          // De-duplicate by name
          const uniqueMap = new Map();
          formatted.forEach((item) => {
            if (item.name && !uniqueMap.has(item.name)) {
              uniqueMap.set(item.name, item);
            }
          });
          const sorted = Array.from(uniqueMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          );

          setPickerData(sorted);
          setSearchQuery("");
          setPickerType(type);
          setPickerVisible(true);
        } else if (type === "city") {
          if (!province) {
            showAlert("Sequence Interrupted", "Please select a Province first.");
            return;
          }
          let formatted = [];
          try {
            const res = await axios.get(
              "https://isaacdarcilla.github.io/philippine-addresses/city.json",
              { timeout: 3500 }
            );
            if (Array.isArray(res.data) && res.data.length > 0) {
              const filtered = res.data.filter(
                (c) => c.province_code === province.province_code
              );
              formatted = filtered.map((c) => ({
                ...c,
                name: c.city_name || c.name,
              }));
            }
          } catch (_) {
            try {
              const res2 = await axios.get(
                `https://psgc.gitlab.io/api/provinces/${province.province_code}/cities-municipalities/`,
                { timeout: 3500 }
              );
              if (Array.isArray(res2.data) && res2.data.length > 0) {
                formatted = res2.data.map((c) => ({
                  city_code: c.code,
                  province_code: province.province_code,
                  name: c.name,
                }));
              }
            } catch (_) {}
          }

          if (!formatted || formatted.length === 0) {
            formatted = [
              { city_code: `${province.province_code}-c1`, name: `${province.name} City / Capital` },
              { city_code: `${province.province_code}-c2`, name: `Central ${province.name}` },
              { city_code: `${province.province_code}-c3`, name: `North ${province.name}` },
              { city_code: `${province.province_code}-c4`, name: `South ${province.name}` },
            ];
          }

          formatted.sort((a, b) => a.name.localeCompare(b.name));
          setPickerData(formatted);
          setSearchQuery("");
          setPickerType(type);
          setPickerVisible(true);
        }
      } catch (err) {
        if (__DEV__) console.log("Error loading dropdown location data: ", err);
        if (type === "province") {
          setPickerData(PHILIPPINE_PROVINCES_FALLBACK);
          setSearchQuery("");
          setPickerType(type);
          setPickerVisible(true);
        }
      } finally {
        setIsFetchingPicker(null);
      }
    },
    [isLoadingExternal, isLoading, isFetchingPicker, province, showAlert]
  );

  const handleClosePicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  const handleSearchQueryChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleSelectLocation = useCallback(
    (item) => {
      if (pickerType === "province") {
        if (province?.province_code !== item.province_code) {
          setProvince(item);
          setCity(null);
        }
      } else if (pickerType === "city") {
        if (city?.city_code !== item.city_code) {
          setCity(item);
        }
      }
      setPickerVisible(false);
    },
    [pickerType, province, city]
  );

  // Validate inputs and open review confirmation sheet
  const handleTriggerConfirmationModal = useCallback(() => {
    if (isLoading || isLoadingExternal) return;

    if (!province || !city) {
      const missingFields = [];
      if (!province) missingFields.push("Province");
      if (!city) missingFields.push("City/Municipality");

      showAlert(
        "Incomplete Location",
        `Please complete the remaining geographic selectors:\n\nMissing fields: ${missingFields.join(", ")}`
      );
      return;
    }

    const trimmedCustomAllergy = customAllergy.trim();
    if (trimmedCustomAllergy && trimmedCustomAllergy.length < 3) {
      showAlert(
        "Invalid Allergy Name",
        "Please provide a realistic ingredient text description length, or clear out the custom allocation box field completely."
      );
      return;
    }

    const trimmedCustomCondition = customCondition.trim();
    if (trimmedCustomCondition && trimmedCustomCondition.length < 2) {
      showAlert(
        "Invalid Condition Name",
        "Please enter a valid condition name or clear the custom field."
      );
      return;
    }

    if (!disclaimerAccepted) {
      showAlert(
        "Medical Disclaimer Required",
        "Please review and check the Medical Disclaimer acknowledgment below before completing your set up."
      );
      return;
    }

    const compiledAddressString = `${city.name}, ${province.name}`;
    const activeAllergies = [
      ...selectedAllergies.map(
        (id) => PRESET_ALLERGENS.find((p) => p.id === id)?.title || id
      ),
    ];
    if (trimmedCustomAllergy) activeAllergies.push(trimmedCustomAllergy);

    const activeConditions =
      selectedConditions.includes("none") && !trimmedCustomCondition
        ? ["None declared (Healthy)"]
        : [
            ...selectedConditions
              .filter((id) => id !== "none")
              .map(
                (id) =>
                  PRESET_MEDICAL_CONDITIONS.find((p) => p.id === id)?.title || id
              ),
            ...(trimmedCustomCondition ? [trimmedCustomCondition] : []),
          ];

    setCompiledAddress(compiledAddressString);
    setCompiledAllergiesText(
      activeAllergies.length === 0
        ? "No allergies specified"
        : activeAllergies.join(", ")
    );
    setCompiledConditionsText(activeConditions.join(", "));
    setConfirmVisible(true);
  }, [
    isLoading,
    isLoadingExternal,
    province,
    city,
    customAllergy,
    customCondition,
    disclaimerAccepted,
    selectedAllergies,
    selectedConditions,
    showAlert,
  ]);

  const handleCloseConfirmModal = useCallback(() => {
    setConfirmVisible(false);
  }, []);

  // Final submission dispatcher
  const handleFinalSubmitDispatch = useCallback(async () => {
    setConfirmVisible(false);
    setIsLoading(true);
    try {
      const activeConditionsList =
        selectedConditions.includes("none") && !customCondition.trim()
          ? []
          : [
              ...selectedConditions
                .filter((id) => id !== "none")
                .map(
                  (id) =>
                    PRESET_MEDICAL_CONDITIONS.find((p) => p.id === id)?.title || id
                ),
              ...(customCondition.trim() ? [customCondition.trim()] : []),
            ];

      const stepThreePayload = {
        address: compiledAddress,
        structuredLocation: {
          province: province.name,
          city: city.name,
        },
        city: city.name,
        allergies: [
          ...selectedAllergies.map(
            (id) => PRESET_ALLERGENS.find((p) => p.id === id)?.title || id
          ),
          ...(customAllergy.trim() ? [customAllergy.trim()] : []),
        ],
        medical_conditions: activeConditionsList,
        medicalConditions: activeConditionsList,
        disclaimer_accepted: true,
      };

      try {
        await AsyncStorage.setItem(
          "@ms_onboarding_data",
          JSON.stringify(stepThreePayload)
        );
      } catch (_) {}

      await onSubmit?.(stepThreePayload);
    } catch (err) {
      if (__DEV__) console.log("Final StepThree submission error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedConditions,
    customCondition,
    compiledAddress,
    province,
    city,
    selectedAllergies,
    customAllergy,
    onSubmit,
  ]);

  // Filtered picker items according to search query
  const filteredPickerData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return pickerData;
    return pickerData.filter((item) =>
      item.name ? item.name.toLowerCase().includes(q) : false
    );
  }, [pickerData, searchQuery]);

  return {
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
  };
}
