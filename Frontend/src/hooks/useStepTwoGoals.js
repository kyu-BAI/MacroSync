import { useState, useEffect, useCallback, useMemo } from "react";
import { useCustomAlert } from "../context/CustomAlertContext";

// Activity level configuration options
export const ACTIVITY_LEVELS = [
  { id: "sedentary", title: "Sedentary", icon: "walk-outline", subTitle: "Desk / Minimal" },
  { id: "moderate", title: "Moderate", icon: "bicycle-outline", subTitle: "3–5 Days/Wk" },
  { id: "active", title: "Active", icon: "flame-outline", subTitle: "Heavy/Intense" },
];

// Target goal configuration options
export const GOALS = [
  { id: "muscle", title: "Gain Weight", icon: "trending-up-outline", tag: "Surplus" },
  { id: "fatloss", title: "Weight Loss", icon: "trending-down-outline", tag: "Deficit" },
  { id: "maintain", title: "Maintain Weight", icon: "scale-outline", tag: "Balance" },
];

// Calendar month and day constants
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Reliable parser for date formats (MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY, YYYY-MM-DD)
export const parseMMDDYYYY = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return null;
  const clean = dateStr.trim();
  const parts = clean.split(/[/.-]/);
  if (parts.length !== 3) return null;

  let month, day, year;
  if (parts[0].length === 4) {
    // YYYY-MM-DD format
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    // MM/DD/YYYY or DD/MM/YYYY
    month = parseInt(parts[0], 10);
    day = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
    if (year < 100) {
      year += 2000;
    }
  }

  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2024) return null;

  const d = new Date(year, month - 1, day);
  d.setHours(0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
};

export default function useStepTwoGoals({ onNext, currentWeight, height, weightUnit, initialGoals }) {
  const { showAlert } = useCustomAlert();

  // Core form metrics state
  const [form, setForm] = useState(() => {
    const selectedGoal = initialGoals?.goal || initialGoals?.selectedGoal || "muscle";
    const selectedUnit = initialGoals?.goalWeightUnit || weightUnit || "kg";
    let defaultWeight = "";

    if (initialGoals?.displayGoalWeight !== undefined && initialGoals.displayGoalWeight !== "") {
      defaultWeight = initialGoals.displayGoalWeight.toString();
    } else if (initialGoals?.goalWeight) {
      defaultWeight = initialGoals.goalWeight.toString();
    } else if (currentWeight) {
      const cur = typeof currentWeight === "number" ? currentWeight : parseFloat(currentWeight);
      if (!isNaN(cur) && cur > 0) {
        if (selectedGoal === "maintain") {
          defaultWeight = (selectedUnit === "lbs" ? cur * 2.20462 : cur).toFixed(1);
        } else if (selectedGoal === "muscle") {
          defaultWeight = (selectedUnit === "lbs" ? (cur + 2.5) * 2.20462 : cur + 2.5).toFixed(1);
        } else if (selectedGoal === "fatloss") {
          defaultWeight = (selectedUnit === "lbs" ? (cur - 3) * 2.20462 : cur - 3).toFixed(1);
        }
      }
    }

    return {
      selectedActivity: initialGoals?.activityLevel || initialGoals?.selectedActivity || "moderate",
      selectedGoal,
      goalWeight: defaultWeight,
      targetDate: initialGoals?.targetDate || "",
      goalWeightUnit: selectedUnit,
    };
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

  // Form field update handlers
  const handleSelectActivity = useCallback((selectedActivity) => {
    setForm((prev) => ({ ...prev, selectedActivity }));
  }, []);

  const handleSelectGoal = useCallback((selectedGoal) => {
    setForm((prev) => {
      let newWeight = prev.goalWeight;
      // Pre-fill target weight if switching goal and field is empty or matching previous maintain
      if (currentWeight) {
        const curW = typeof currentWeight === "number" ? currentWeight : parseFloat(currentWeight);
        if (!isNaN(curW) && curW > 0) {
          if (selectedGoal === "maintain") {
            newWeight = (prev.goalWeightUnit === "lbs" ? curW * 2.20462 : curW).toFixed(1);
          } else if (!newWeight || selectedGoal === "muscle" || selectedGoal === "fatloss") {
            const currentNum = parseFloat(newWeight);
            const isAtCurrent = !isNaN(currentNum) && Math.abs(currentNum - (prev.goalWeightUnit === "lbs" ? curW * 2.20462 : curW)) < 0.2;
            if (!newWeight || isAtCurrent) {
              if (selectedGoal === "muscle") {
                newWeight = (prev.goalWeightUnit === "lbs" ? (curW + 2.5) * 2.20462 : curW + 2.5).toFixed(1);
              } else if (selectedGoal === "fatloss") {
                newWeight = (prev.goalWeightUnit === "lbs" ? (curW - 3) * 2.20462 : curW - 3).toFixed(1);
              }
            }
          }
        }
      }
      return { ...prev, selectedGoal, goalWeight: newWeight };
    });
  }, [currentWeight]);

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
      return `Healthy standard: ${minLbs} – ${maxLbs} lbs`;
    }
    return `Healthy standard: ${minKg.toFixed(1)} – ${maxKg.toFixed(1)} kg`;
  }, [height, form.goalWeightUnit]);

  // Suggested realistic milestone date computation (Always available for ALL goals!)
  const suggestedDateInfo = useMemo(() => {
    const curW =
      currentWeight && !isNaN(parseFloat(currentWeight)) && parseFloat(currentWeight) > 0
        ? parseFloat(currentWeight)
        : 70;

    // For maintain weight: suggest a 4-week (28-day) maintenance milestone
    if (form.selectedGoal === "maintain") {
      const suggestedDate = new Date();
      suggestedDate.setDate(suggestedDate.getDate() + 28);
      const month = String(suggestedDate.getMonth() + 1).padStart(2, "0");
      const day = String(suggestedDate.getDate()).padStart(2, "0");
      const year = suggestedDate.getFullYear();
      return {
        formatted: `${month}/${day}/${year}`,
        weeks: 4,
        kgDiff: "0.0",
        label: `Tap to set suggested date: ${month}/${day}/${year} (4 wks)`,
      };
    }

    const enteredNum = parseFloat(form.goalWeight);
    if (!form.goalWeight || isNaN(enteredNum) || enteredNum <= 0) {
      // Default 4-week milestone if user hasn't typed yet
      const suggestedDate = new Date();
      suggestedDate.setDate(suggestedDate.getDate() + 28);
      const month = String(suggestedDate.getMonth() + 1).padStart(2, "0");
      const day = String(suggestedDate.getDate()).padStart(2, "0");
      const year = suggestedDate.getFullYear();
      return {
        formatted: `${month}/${day}/${year}`,
        weeks: 4,
        kgDiff: "2.0",
        label: `Tap to set suggested date: ${month}/${day}/${year} (4 wks)`,
      };
    }

    const targetKg =
      form.goalWeightUnit === "lbs" ? enteredNum * 0.45359237 : enteredNum;
    const weightDiffKg = Math.abs(targetKg - curW);

    // Realistic safe pace: 0.5kg/wk for fatloss, 0.35kg/wk for muscle gain
    const safeRate = form.selectedGoal === "fatloss" ? 0.5 : 0.35;
    const weeksNeeded = Math.max(2, Math.ceil(weightDiffKg / safeRate));
    const suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + weeksNeeded * 7);

    const month = String(suggestedDate.getMonth() + 1).padStart(2, "0");
    const day = String(suggestedDate.getDate()).padStart(2, "0");
    const year = suggestedDate.getFullYear();

    return {
      formatted: `${month}/${day}/${year}`,
      weeks: weeksNeeded,
      kgDiff: weightDiffKg.toFixed(1),
      label: `Tap to set suggested date: ${month}/${day}/${year} (${weeksNeeded} wks)`,
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
    const currentDisplay =
      form.goalWeightUnit === "lbs"
        ? (curW * 2.20462).toFixed(1)
        : curW.toFixed(1);

    if (!form.goalWeight) return null;
    const enteredNum = parseFloat(form.goalWeight);
    if (isNaN(enteredNum) || enteredNum <= 0) return null;

    const targetKg =
      form.goalWeightUnit === "lbs" ? enteredNum * 0.45359237 : enteredNum;

    if (form.selectedGoal === "maintain" && Math.abs(targetKg - curW) > 0.5) {
      return `Maintenance target should match your current weight (${currentDisplay} ${form.goalWeightUnit}).`;
    }
    if (form.selectedGoal === "fatloss" && targetKg >= curW) {
      return `Weight loss target must be lower than your current weight (${currentDisplay} ${form.goalWeightUnit}).`;
    }
    if (form.selectedGoal === "muscle" && targetKg <= curW) {
      return `Weight gain target must be higher than your current weight (${currentDisplay} ${form.goalWeightUnit}).`;
    }

    if (height) {
      const heightMeters = parseFloat(height) / 100;
      if (heightMeters > 0) {
        const bmi = targetKg / (heightMeters * heightMeters);
        if (bmi < 18.5) {
          return `Target weight results in an underweight BMI (< 18.5).`;
        }
        if (bmi >= 30.0) {
          return `Target weight results in an unhealthy high BMI (≥ 30.0).`;
        }
      }
    }
    return null;
  }, [currentWeight, form.goalWeight, form.selectedGoal, form.goalWeightUnit, height]);

  // Date validation feedback message (Catches impossible or unsafe dates!)
  const dateWarningText = useMemo(() => {
    if (!form.targetDate || !form.targetDate.trim()) return null;

    const curW =
      currentWeight && !isNaN(parseFloat(currentWeight)) && parseFloat(currentWeight) > 0
        ? parseFloat(currentWeight)
        : 70;

    const targetDateObj = parseMMDDYYYY(form.targetDate.trim());
    if (!targetDateObj) {
      if (form.targetDate.trim().length >= 6) {
        return "Please enter a valid date (MM/DD/YYYY).";
      }
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDateObj <= today) {
      return "Target date must be in the future.";
    }

    const msDiff = targetDateObj.getTime() - today.getTime();
    const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24));
    const weeksDiff = daysDiff / 7;

    // Maintenance goal check
    if (form.selectedGoal === "maintain") {
      if (daysDiff < 7) {
        return "Target date should be at least 7 days from today.";
      }
      return null;
    }

    const enteredNum = parseFloat(form.goalWeight);
    if (!form.goalWeight || isNaN(enteredNum) || enteredNum <= 0) {
      if (daysDiff < 7) {
        return "Target date should be at least 7 days from today.";
      }
      return null;
    }

    const targetKg =
      form.goalWeightUnit === "lbs" ? enteredNum * 0.45359237 : enteredNum;
    const weightDiffKg = Math.abs(targetKg - curW);

    if (weightDiffKg >= 0.3) {
      if (daysDiff < 7) {
        return "Target date should be at least 7 days from today.";
      }
      if (weeksDiff > 0) {
        const weeklyChange = weightDiffKg / weeksDiff;
        if (form.selectedGoal === "fatloss" && weeklyChange > 1.2) {
          return "Pace exceeds the safe 1.2 kg/wk rate. Please select a later date.";
        }
        if (form.selectedGoal === "muscle" && weeklyChange > 0.8) {
          return "Pace exceeds the safe 0.8 kg/wk rate. Please select a later date.";
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
