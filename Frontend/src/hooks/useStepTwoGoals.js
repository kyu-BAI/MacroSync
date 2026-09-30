import { useState, useEffect, useCallback, useMemo } from "react";
import { useCustomAlert } from "../context/CustomAlertContext";

// Activity level configuration options
export const ACTIVITY_LEVELS = [
  { id: "sedentary", title: "Sedentary", icon: "bicycle-outline", subTitle: "Desk / Minimal" },
  { id: "moderate", title: "Moderate", icon: "fitness-outline", subTitle: "3–5 Days/Wk" },
  { id: "active", title: "Active", icon: "flame-outline", subTitle: "Heavy/Intense" },
];

// Target goal configuration options
export const GOALS = [
  { id: "muscle", title: "Gain Weight", icon: "barbell-outline", tag: "Surplus" },
  { id: "fatloss", title: "Weight Loss", icon: "trending-down-outline", tag: "Deficit" },
  { id: "maintain", title: "Maintain Weight", icon: "refresh-outline", tag: "Balance" },
];

// Calendar month and day constants
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Reliable parser for MM/DD/YYYY format
export const parseMMDDYYYY = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2020) return null;
  const d = new Date(year, month - 1, day);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function useStepTwoGoals({ onNext, currentWeight, height, weightUnit }) {
  const { showAlert } = useCustomAlert();

  // Core form metrics state
  const [form, setForm] = useState({
    selectedActivity: "moderate",
    selectedGoal: "muscle",
    goalWeight: "",
    targetDate: "",
    goalWeightUnit: weightUnit || "kg",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [navDate, setNavDate] = useState(new Date());

  // Synchronize unit when external prop updates
  useEffect(() => {
    if (weightUnit) {
      setForm((prev) => ({ ...prev, goalWeightUnit: weightUnit }));
    }
  }, [weightUnit]);

  // Maintain weight auto-fill logic
  useEffect(() => {
    if (form.selectedGoal === "maintain" && currentWeight) {
      const curW = typeof currentWeight === "number" ? currentWeight : parseFloat(currentWeight);
      if (!isNaN(curW) && curW > 0) {
        const displayWeight =
          form.goalWeightUnit === "lbs"
            ? (curW * 2.20462).toFixed(1)
            : curW.toFixed(1);
        setForm((prev) => ({ ...prev, goalWeight: displayWeight.toString() }));
      }
    }
  }, [form.selectedGoal, form.goalWeightUnit, currentWeight]);

  // Form field update handlers
  const handleSelectActivity = useCallback((selectedActivity) => {
    setForm((prev) => ({ ...prev, selectedActivity }));
  }, []);

  const handleSelectGoal = useCallback((selectedGoal) => {
    setForm((prev) => ({ ...prev, selectedGoal }));
  }, []);

  const handleGoalWeightChange = useCallback((goalWeight) => {
    setForm((prev) => ({ ...prev, goalWeight }));
  }, []);

  const handleTargetDateChange = useCallback((targetDate) => {
    setForm((prev) => ({ ...prev, targetDate }));
  }, []);

  // Healthy weight range calculation
  const healthyRangeText = useMemo(() => {
    if (!height || isNaN(parseFloat(height))) return null;
    const heightInMeters = parseFloat(height) / 100;
    if (heightInMeters <= 0) return null;

    const minKg = 18.5 * (heightInMeters * heightInMeters);
    const maxKg = 24.9 * (heightInMeters * heightInMeters);

    if (form.goalWeightUnit === "lbs") {
      const minLbs = Math.round(minKg * 2.20462);
      const maxLbs = Math.round(maxKg * 2.20462);
      return `Recommended healthy range: ${minLbs} – ${maxLbs} lbs (BMI 18.5–24.9)`;
    }
    return `Recommended healthy range: ${minKg.toFixed(1)} – ${maxKg.toFixed(1)} kg (BMI 18.5–24.9)`;
  }, [height, form.goalWeightUnit]);

  // Suggested realistic milestone date computation
  const suggestedDateInfo = useMemo(() => {
    const curW =
      currentWeight && !isNaN(parseFloat(currentWeight)) && parseFloat(currentWeight) > 0
        ? parseFloat(currentWeight)
        : 70;
    if (!form.goalWeight || form.selectedGoal === "maintain") return null;
    const enteredNum = parseFloat(form.goalWeight);
    if (isNaN(enteredNum) || enteredNum <= 0) return null;

    const targetKg =
      form.goalWeightUnit === "lbs" ? enteredNum * 0.45359237 : enteredNum;
    const weightDiffKg = Math.abs(targetKg - curW);
    if (weightDiffKg < 0.1) return null;

    const weeksNeeded = Math.max(2, Math.ceil(weightDiffKg / 0.5));
    const suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + weeksNeeded * 7);

    const month = String(suggestedDate.getMonth() + 1).padStart(2, "0");
    const day = String(suggestedDate.getDate()).padStart(2, "0");
    const year = suggestedDate.getFullYear();

    return {
      formatted: `${month}/${day}/${year}`,
      weeks: weeksNeeded,
      kgDiff: weightDiffKg.toFixed(1),
    };
  }, [currentWeight, form.goalWeight, form.selectedGoal, form.goalWeightUnit]);

  // Apply suggested date handler
  const handleApplySuggestedDate = useCallback(() => {
    if (suggestedDateInfo?.formatted) {
      setForm((prev) => ({ ...prev, targetDate: suggestedDateInfo.formatted }));
    }
  }, [suggestedDateInfo]);

  // Weight validation feedback message
  const weightWarningText = useMemo(() => {
    const curW =
      currentWeight && !isNaN(parseFloat(currentWeight)) && parseFloat(currentWeight) > 0
        ? parseFloat(currentWeight)
        : 70;
    if (!form.goalWeight || form.selectedGoal === "maintain") return null;
    const enteredNum = parseFloat(form.goalWeight);
    if (isNaN(enteredNum) || enteredNum <= 0) return null;

    const targetKg =
      form.goalWeightUnit === "lbs" ? enteredNum * 0.45359237 : enteredNum;
    const currentDisplay =
      form.goalWeightUnit === "lbs"
        ? (curW * 2.20462).toFixed(1)
        : curW.toFixed(1);

    if (form.selectedGoal === "fatloss" && targetKg >= curW) {
      return `Target weight must be lower than your current weight (${currentDisplay} ${form.goalWeightUnit}).`;
    }
    if (form.selectedGoal === "muscle" && targetKg <= curW) {
      return `Target weight must be higher than your current weight (${currentDisplay} ${form.goalWeightUnit}).`;
    }

    if (height) {
      const heightMeters = parseFloat(height) / 100;
      if (heightMeters > 0) {
        const bmi = targetKg / (heightMeters * heightMeters);
        if (bmi < 18.5) {
          return `Target weight sets BMI to ${bmi.toFixed(1)} (underweight marker < 18.5).`;
        }
        if (bmi >= 30.0) {
          return `Target weight sets BMI to ${bmi.toFixed(1)} (obesity marker ≥ 30.0).`;
        }
      }
    }
    return null;
  }, [currentWeight, form.goalWeight, form.selectedGoal, form.goalWeightUnit, height]);

  // Date validation feedback message
  const dateWarningText = useMemo(() => {
    const curW =
      currentWeight && !isNaN(parseFloat(currentWeight)) && parseFloat(currentWeight) > 0
        ? parseFloat(currentWeight)
        : 70;
    if (!form.goalWeight || form.selectedGoal === "maintain") return null;
    const enteredNum = parseFloat(form.goalWeight);
    if (isNaN(enteredNum) || enteredNum <= 0) return null;
    const targetKg =
      form.goalWeightUnit === "lbs" ? enteredNum * 0.45359237 : enteredNum;

    if (form.targetDate && form.targetDate.trim()) {
      const targetDateObj = parseMMDDYYYY(form.targetDate.trim());
      if (targetDateObj) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (targetDateObj <= today) {
          return "Target date must be at least 1 day in the future.";
        }
        const msDiff = targetDateObj.getTime() - today.getTime();
        const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24));
        const weeksDiff = daysDiff / 7;
        const weightDiffKg = Math.abs(targetKg - curW);

        if (form.selectedGoal !== "maintain" && weightDiffKg >= 0.5) {
          if (daysDiff < 7) {
            return `Target date is too soon! Weight ${form.selectedGoal === "fatloss" ? "loss" : "gain"} requires at least 7 days (1 week).`;
          }
          if (weeksDiff > 0) {
            const weeklyChange = weightDiffKg / weeksDiff;
            if (form.selectedGoal === "fatloss" && weeklyChange > 1.2) {
              return `Target date is too soon! Losing ${weightDiffKg.toFixed(1)}kg in ${daysDiff} day(s) exceeds safe 1.2kg/wk rate.`;
            }
            if (form.selectedGoal === "muscle" && weeklyChange > 0.8) {
              return `Target date is too soon! Gaining ${weightDiffKg.toFixed(1)}kg in ${daysDiff} day(s) exceeds safe 0.8kg/wk rate.`;
            }
          }
        }
      }
    }
    return null;
  }, [currentWeight, form.goalWeight, form.selectedGoal, form.goalWeightUnit, form.targetDate]);

  // Calendar navigation & day generation
  const handleOpenCalendar = useCallback(() => {
    setShowCalendar(true);
  }, []);

  const handleCloseCalendar = useCallback(() => {
    setShowCalendar(false);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setNavDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setNavDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleSelectDate = useCallback((formattedDate) => {
    setForm((prev) => ({ ...prev, targetDate: formattedDate }));
    setShowCalendar(false);
  }, []);

  const currentMonthYearTitle = useMemo(() => {
    return `${MONTH_NAMES[navDate.getMonth()]} ${navDate.getFullYear()}`;
  }, [navDate]);

  const calendarDays = useMemo(() => {
    const year = navDate.getFullYear();
    const month = navDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ key: `empty-start-${i}`, isEmpty: true });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate < today;
      const isToday = cellDate.getTime() === today.getTime();
      const formattedDate = `${String(month + 1).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
      const isSelected = form.targetDate === formattedDate;

      days.push({
        key: `day-${day}`,
        isEmpty: false,
        day,
        formattedDate,
        isSelected,
        isToday,
        isPast,
      });
    }

    const totalRenderedSlots = firstDayIndex + totalDays;
    const remainingSlots = totalRenderedSlots % 7 === 0 ? 0 : 7 - (totalRenderedSlots % 7);
    for (let j = 0; j < remainingSlots; j++) {
      days.push({ key: `empty-end-${j}`, isEmpty: true });
    }

    return days;
  }, [navDate, form.targetDate]);

  // Form submission handler & metric validator
  const handleContinue = useCallback(async () => {
    if (isLoading) return;

    if (!form.goalWeight.trim() || !form.targetDate.trim()) {
      showAlert(
        "Missing Fields",
        "Please specify your target goal weight and select a milestone target date before continuing to the next step."
      );
      return;
    }

    const targetDateObj = parseMMDDYYYY(form.targetDate.trim());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!targetDateObj) {
      showAlert("Invalid Date", "Please enter the date in valid MM/DD/YYYY format.");
      return;
    }

    if (targetDateObj <= today) {
      showAlert("Invalid Date", "Target date must be at least 1 day in the future.");
      return;
    }

    const enteredWeightNum = parseFloat(form.goalWeight);
    if (isNaN(enteredWeightNum) || enteredWeightNum <= 0) {
      showAlert("Invalid Input", "Please enter a valid numeric target weight.");
      return;
    }

    const targetWeightInKg =
      form.goalWeightUnit === "lbs"
        ? enteredWeightNum * 0.45359237
        : enteredWeightNum;
    const curW =
      currentWeight && !isNaN(parseFloat(currentWeight)) && parseFloat(currentWeight) > 0
        ? parseFloat(currentWeight)
        : 70;

    if (form.selectedGoal === "fatloss" && targetWeightInKg >= curW) {
      showAlert(
        "Goal Mismatch",
        "For weight loss, your target weight must be lower than your current weight."
      );
      return;
    }
    if (form.selectedGoal === "muscle" && targetWeightInKg <= curW) {
      showAlert(
        "Goal Mismatch",
        "For gaining weight, your target weight must be higher than your current weight."
      );
      return;
    }
    if (form.selectedGoal === "maintain" && Math.abs(targetWeightInKg - curW) > 0.5) {
      showAlert(
        "Goal Mismatch",
        "For maintaining weight, your target weight must equal your current weight."
      );
      return;
    }

    const msDiff = targetDateObj.getTime() - today.getTime();
    const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24));
    const weeksDiff = daysDiff / 7;
    const weightDiffKg = Math.abs(targetWeightInKg - curW);
    const weeklyChange = weeksDiff > 0 ? weightDiffKg / weeksDiff : 0;

    if (form.selectedGoal !== "maintain" && weightDiffKg >= 0.5) {
      if (daysDiff < 7) {
        showAlert(
          "Target Date Too Soon",
          `Weight ${form.selectedGoal === "fatloss" ? "loss" : "gain"} goals require at least 1 week (7 days) for safe, healthy progress. Tomorrow is too soon to change ${weightDiffKg.toFixed(1)} kg. Please select a date at least 7 days from today or tap the suggested realistic date.`
        );
        return;
      }
      if (weeklyChange > 1.2 && form.selectedGoal === "fatloss") {
        showAlert(
          "Aggressive Goal",
          "This goal requires losing more than 1.2kg per week, which is medically unsafe. Please select a later date for sustainable results."
        );
        return;
      }
      if (weeklyChange > 0.8 && form.selectedGoal === "muscle") {
        showAlert(
          "Aggressive Goal",
          "This goal requires gaining more than 0.8kg per week, which is medically unsafe. Please select a later date for sustainable results."
        );
        return;
      }
    }

    if (height) {
      const heightInMeters = parseFloat(height) / 100;
      if (heightInMeters > 0) {
        const targetBmi = targetWeightInKg / (heightInMeters * heightInMeters);

        if (targetBmi < 18.5) {
          showAlert(
            "Safety Weight Restriction",
            `The target weight specified sets your expected BMI target at ${targetBmi.toFixed(1)}, dropping below medically recommended health markers (< 18.5).\n\nPlease calibrate a sustainable baseline fitness target weight.`
          );
          return;
        }

        if (targetBmi >= 30.0) {
          showAlert(
            "Safety Weight Restriction",
            `The target weight specified sets your potential BMI threshold at ${targetBmi.toFixed(1)}, crossing into critical health risk markers (BMI ≥ 30.0).\n\nPlease aim for a healthier weight strategy.`
          );
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      await onNext?.({
        activityLevel: form.selectedActivity,
        goal: form.selectedGoal,
        goalWeight: targetWeightInKg,
        displayGoalWeight: enteredWeightNum,
        goalWeightUnit: form.goalWeightUnit,
        targetDate: form.targetDate.trim(),
        targetDateISO: targetDateObj.toISOString(),
        currentWeight: curW,
      });
    } catch (err) {
      if (__DEV__) console.log("StepTwo Form Dispatch Fail: ", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, form, currentWeight, height, onNext, showAlert]);

  return {
    form,
    isLoading,
    showCalendar,
    navDate,
    currentMonthYearTitle,
    calendarDays,
    healthyRangeText,
    suggestedDateInfo,
    weightWarningText,
    dateWarningText,
    handleSelectActivity,
    handleSelectGoal,
    handleGoalWeightChange,
    handleTargetDateChange,
    handleApplySuggestedDate,
    handleOpenCalendar,
    handleCloseCalendar,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDate,
    handleContinue,
  };
}
