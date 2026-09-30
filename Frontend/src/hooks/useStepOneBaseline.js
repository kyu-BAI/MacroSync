import { useState, useCallback, useMemo } from "react";
import { useCustomAlert } from "../context/CustomAlertContext";

// BMI Status category colors
const BMI_COLORS = {
  normal: "#10B981",
  underweight: "#10B981",
  overweight: "#64748B",
  obese: "#64748B",
  muted: "#64748B",
};

export default function useStepOneBaseline({ onNext }) {
  const { showAlert } = useCustomAlert();

  // Core Form Metrics State
  const [form, setForm] = useState({
    age: "",
    weight: "",
    height: "",
    heightFt: "",
    heightIn: "",
    weightUnit: "kg",
    heightUnit: "ft",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Field change handlers
  const handleAgeChange = useCallback((age) => {
    setForm((prev) => ({ ...prev, age }));
  }, []);

  const handleWeightChange = useCallback((weight) => {
    setForm((prev) => ({ ...prev, weight }));
  }, []);

  const handleHeightFtChange = useCallback((heightFt) => {
    setForm((prev) => ({ ...prev, heightFt }));
  }, []);

  const handleHeightInChange = useCallback((heightIn) => {
    setForm((prev) => ({ ...prev, heightIn }));
  }, []);

  // Conversion helpers
  const getWeightInKg = useCallback(() => {
    const wNum = parseFloat(form.weight);
    if (isNaN(wNum) || wNum <= 0) return 0;
    return form.weightUnit === "kg" ? wNum : wNum * 0.45359237;
  }, [form.weight, form.weightUnit]);

  const getHeightInCm = useCallback(() => {
    if (form.heightUnit === "cm") {
      const hNum = parseFloat(form.height);
      return isNaN(hNum) || hNum <= 0 ? 0 : hNum;
    }
    const ft = parseFloat(form.heightFt) || 0;
    const inch = parseFloat(form.heightIn) || 0;
    return ft * 30.48 + inch * 2.54;
  }, [form.height, form.heightFt, form.heightIn, form.heightUnit]);

  // Real-time BMI calculation engine
  const bmi = useMemo(() => {
    const w = getWeightInKg();
    const h = getHeightInCm();

    if (w > 0 && h > 0) {
      const heightInMeters = h / 100;
      const bmiValue = w / (heightInMeters * heightInMeters);

      let cat = "Normal";
      let col = BMI_COLORS.normal;
      let styleKey = "bmiCategoryNormal";

      if (bmiValue < 18.5) {
        cat = "Underweight";
        col = BMI_COLORS.underweight;
        styleKey = "bmiCategoryUnderweight";
      } else if (bmiValue >= 25 && bmiValue < 30) {
        cat = "Overweight";
        col = BMI_COLORS.overweight;
        styleKey = "bmiCategoryOverweight";
      } else if (bmiValue >= 30) {
        cat = "Obese";
        col = BMI_COLORS.obese;
        styleKey = "bmiCategoryObese";
      }

      return { val: bmiValue.toFixed(1), cat, col, styleKey };
    }

    return { val: null, cat: "", col: BMI_COLORS.muted, styleKey: "bmiCategoryNormal" };
  }, [getWeightInKg, getHeightInCm]);

  // Form submission handler & metric validator
  const handleNextStep = useCallback(async () => {
    if (isLoading) return;

    if (!form.age.trim()) {
      showAlert("Missing Metrics", "Please fill in your age before proceeding.");
      return;
    }

    if (form.heightUnit === "cm") {
      if (!form.height.trim()) {
        showAlert("Missing Metrics", "Please specify your height in centimeters.");
        return;
      }
    } else {
      if (!form.heightFt.trim() && !form.heightIn.trim()) {
        showAlert("Missing Metrics", "Please specify your height in feet and inches.");
        return;
      }
    }

    if (!form.weight.trim()) {
      showAlert("Missing Metrics", "Please fill in your weight metric.");
      return;
    }

    const finalWeightKg = getWeightInKg();
    const finalHeightCm = getHeightInCm();

    if (finalWeightKg <= 0 || finalHeightCm <= 0) {
      showAlert("Invalid Metrics", "Please provide realistic metric measurement configurations.");
      return;
    }

    setIsLoading(true);
    try {
      await onNext?.({
        age: parseInt(form.age, 10),
        weight: finalWeightKg,
        height: finalHeightCm,
        weightUnit: form.weightUnit,
        startingWeight: finalWeightKg,
      });
    } catch (err) {
      if (__DEV__) console.log("Navigation Execution Error: ", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, form, getWeightInKg, getHeightInCm, onNext, showAlert]);

  return {
    form,
    bmi,
    isLoading,
    handleAgeChange,
    handleWeightChange,
    handleHeightFtChange,
    handleHeightInChange,
    handleNextStep,
  };
}
