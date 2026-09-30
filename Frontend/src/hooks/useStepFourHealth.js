import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCustomAlert } from "../context/CustomAlertContext";

// Preset common food allergens
export const PRESET_ALLERGENS = [
  { id: "none", title: "No Known Allergies" },
  { id: "peanuts", title: "Peanuts" },
  { id: "seafood", title: "Seafood" },
  { id: "dairy", title: "Dairy" },
  { id: "eggs", title: "Eggs" },
  { id: "gluten", title: "Gluten" },
  { id: "nuts", title: "Tree Nuts" },
];

// Preset medical conditions for clinical screening
export const PRESET_MEDICAL_CONDITIONS = [
  { id: "none", title: "None / Healthy" },
  { id: "diabetes", title: "Diabetes (Type 1/2)" },
  { id: "eating_disorder", title: "Eating Disorder" },
  { id: "hypertension", title: "Hypertension" },
  { id: "renal", title: "Kidney / Renal Issue" },
  { id: "fatty_liver", title: "Fatty Liver" },
  { id: "gerd", title: "Acid Reflux / GERD" },
  { id: "gout", title: "Gout / Uric Acid" },
];

export default function useStepFourHealth({ locationData, onSubmit, isLoadingExternal }) {
  const { showAlert } = useCustomAlert();

  // Allergies & Restrictions States (defaults to None)
  const [selectedAllergies, setSelectedAllergies] = useState(["none"]);
  const [customAllergy, setCustomAllergy] = useState("");

  // Medical Screening States (defaults to None)
  const [selectedConditions, setSelectedConditions] = useState(["none"]);
  const [customCondition, setCustomCondition] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [hasReviewedPolicy, setHasReviewedPolicy] = useState(false);

  // Privacy Policy Modal States
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [privacyInitialTab, setPrivacyInitialTab] = useState("medical");

  // Review Confirmation Modal Sheet States
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [compiledAllergiesText, setCompiledAllergiesText] = useState("");
  const [compiledConditionsText, setCompiledConditionsText] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // Allergen selection toggle with mutually exclusive "none"
  const toggleAllergen = useCallback((id) => {
    if (id === "none") {
      setSelectedAllergies(["none"]);
      return;
    }
    setSelectedAllergies((prev) => {
      let updated = prev.filter((item) => item !== "none");
      if (updated.includes(id)) {
        updated = updated.filter((item) => item !== id);
        if (updated.length === 0) updated = ["none"];
        return updated;
      } else {
        return [...updated, id];
      }
    });
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
        return updated;
      } else {
        return [...updated, id];
      }
    });
  }, []);

  const handleCustomAllergyChange = useCallback((text) => {
    setCustomAllergy(text);
    if (text.trim()) {
      setSelectedAllergies((prev) => prev.filter((item) => item !== "none"));
    }
  }, []);

  const handleCustomConditionChange = useCallback((text) => {
    setCustomCondition(text);
    if (text.trim()) {
      setSelectedConditions((prev) => prev.filter((item) => item !== "none"));
    }
  }, []);

  const handleToggleDisclaimer = useCallback(() => {
    if (!hasReviewedPolicy) {
      setPrivacyInitialTab("medical");
      setPrivacyModalVisible(true);
      return;
    }
    setDisclaimerAccepted((prev) => !prev);
  }, [hasReviewedPolicy]);

  const handleOpenPrivacyModal = useCallback((tab = "medical") => {
    setPrivacyInitialTab(tab);
    setPrivacyModalVisible(true);
  }, []);

  const handleAgreePolicy = useCallback(() => {
    setHasReviewedPolicy(true);
    setDisclaimerAccepted(true);
    setPrivacyModalVisible(false);
  }, []);

  const handleClosePrivacyModal = useCallback(() => {
    // Closing without agreeing does NOT mark policy as reviewed
    setPrivacyModalVisible(false);
  }, []);

  // Trigger confirmation modal sheet
  const handleTriggerConfirmationModal = useCallback(() => {
    if (isLoading || isLoadingExternal) return;

    const trimmedCustomAllergy = customAllergy.trim();
    if (trimmedCustomAllergy && trimmedCustomAllergy.length < 2) {
      showAlert(
        "Invalid Allergy Name",
        "Please enter a valid allergy name or clear the custom field."
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

    if (!hasReviewedPolicy || !disclaimerAccepted) {
      setPrivacyInitialTab("medical");
      setPrivacyModalVisible(true);
      return;
    }

    const activeAllergies =
      selectedAllergies.includes("none") && !trimmedCustomAllergy
        ? ["None declared"]
        : [
            ...selectedAllergies
              .filter((id) => id !== "none")
              .map(
                (id) => PRESET_ALLERGENS.find((p) => p.id === id)?.title || id
              ),
            ...(trimmedCustomAllergy ? [trimmedCustomAllergy] : []),
          ];

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

    setCompiledAllergiesText(activeAllergies.join(", "));
    setCompiledConditionsText(activeConditions.join(", "));
    setConfirmVisible(true);
  }, [
    isLoading,
    isLoadingExternal,
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

      const activeAllergiesList =
        selectedAllergies.includes("none") && !customAllergy.trim()
          ? []
          : [
              ...selectedAllergies
                .filter((id) => id !== "none")
                .map(
                  (id) => PRESET_ALLERGENS.find((p) => p.id === id)?.title || id
                ),
              ...(customAllergy.trim() ? [customAllergy.trim()] : []),
            ];

      const stepFourPayload = {
        address: locationData?.address || "",
        structuredLocation: locationData?.structuredLocation || null,
        city: locationData?.city || "",
        province: locationData?.province || "",
        allergies: activeAllergiesList,
        medical_conditions: activeConditionsList,
        medicalConditions: activeConditionsList,
        disclaimer_accepted: true,
      };

      try {
        await AsyncStorage.setItem(
          "@ms_onboarding_data",
          JSON.stringify(stepFourPayload)
        );
      } catch (_) {}

      await onSubmit?.(stepFourPayload);
    } catch (err) {
      if (__DEV__) console.log("Final StepFour submission error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedConditions,
    customCondition,
    selectedAllergies,
    customAllergy,
    locationData,
    onSubmit,
  ]);

  return {
    selectedAllergies,
    customAllergy,
    selectedConditions,
    customCondition,
    disclaimerAccepted,
    hasReviewedPolicy,
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
  };
}
