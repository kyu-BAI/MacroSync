// Nutrition and Macro Calculations
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Coffee, Sun, Flame, Moon, ChefHat } from "lucide-react-native";

// Calculate BMR, TDEE, and macro distribution
export const calculateTargetMacros = (guestBaseline, guestGoals, dailyNutrition) => {
  let calculatedTargetCalories = 2000;
  let targetProtein = 150;
  let targetCarbs = 225;
  let targetFats = 55;

  if (
    guestBaseline?.weight && 
    guestBaseline?.height && 
    guestBaseline?.age && 
    guestGoals?.activityLevel
  ) {
    const w = parseFloat(guestBaseline.weight);
    const h = parseFloat(guestBaseline.height);
    const a = parseInt(guestBaseline.age, 10);
    
    // BMR (Mifflin-St Jeor formula)
    const bmr = (10 * w) + (6.25 * h) - (5 * a) + 5; 
    
    // Activity Multiplier
    let multiplier = 1.2; // Sedentary
    if (guestGoals.activityLevel === 'moderate') multiplier = 1.55;
    if (guestGoals.activityLevel === 'active')   multiplier = 1.725;
    
    let tdee = bmr * multiplier;
    
    // Goal adjustment
    const g = String(guestGoals?.goal || '').toLowerCase();
    if (g.includes('fat') || g.includes('lose')) {
      tdee -= 500;
      calculatedTargetCalories = Math.max(1200, Math.round(tdee));
      targetProtein = Math.round((calculatedTargetCalories * 0.35) / 4);
      targetCarbs   = Math.round((calculatedTargetCalories * 0.35) / 4);
      targetFats    = Math.round((calculatedTargetCalories * 0.30) / 9);
    } else if (g.includes('muscle') || g.includes('gain')) {
      tdee += 300;
      calculatedTargetCalories = Math.max(2000, Math.round(tdee));
      targetProtein = Math.round((calculatedTargetCalories * 0.30) / 4);
      targetCarbs   = Math.round((calculatedTargetCalories * 0.50) / 4);
      targetFats    = Math.round((calculatedTargetCalories * 0.20) / 9);
    } else {
      calculatedTargetCalories = Math.max(1500, Math.round(tdee));
      targetProtein = Math.round((calculatedTargetCalories * 0.25) / 4);
      targetCarbs   = Math.round((calculatedTargetCalories * 0.50) / 4);
      targetFats    = Math.round((calculatedTargetCalories * 0.25) / 9);
    }
  }

  const targetCalories = (dailyNutrition && dailyNutrition.targetCalories && dailyNutrition.targetCalories > 0)
    ? dailyNutrition.targetCalories
    : calculatedTargetCalories;

  return {
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
    calculatedTargetCalories
  };
};

// Scale meal calories proportionally to fit within target
export const ensurePlanWithinTargetCalories = (plan, maxTarget) => {
  if (!Array.isArray(plan) || plan.length === 0 || !maxTarget || maxTarget <= 0) return plan;
  
  const currentTotal = plan.reduce((sum, m) => sum + (parseInt(m.calories || m.kcal, 10) || 0), 0);
  if (currentTotal <= 0) return plan;

  if (currentTotal > maxTarget || Math.abs(currentTotal - maxTarget) > 10) {
    const ratio = maxTarget / currentTotal;
    let runningSum = 0;

    return plan.map((m, idx) => {
      const origCal = parseInt(m.calories || m.kcal, 10) || 0;
      let newCal;
      if (idx === plan.length - 1) {
        newCal = Math.max(1, maxTarget - runningSum);
      } else {
        newCal = Math.max(1, Math.round(origCal * ratio));
        runningSum += newCal;
      }

      const scaleMacro = (strVal) => {
        if (!strVal) return strVal;
        const num = parseInt(String(strVal).replace(/[^0-9]/g, ''), 10);
        if (isNaN(num)) return strVal;
        return `${Math.max(0, Math.round(num * ratio))}g`;
      };

      return {
        ...m,
        calories: newCal,
        kcal: newCal,
        protein: scaleMacro(m.protein),
        carbs: scaleMacro(m.carbs),
        fats: scaleMacro(m.fats),
      };
    });
  }
  return plan;
};

// Meal accent colors
export const getMealAccentColor = (typeOrTime) => {
  const val = String(typeOrTime || '');
  if (val.includes('Breakfast') || val.includes('Pamahaw')) return '#F59E0B'; // Gold
  if (val.includes('Lunch')     || val.includes('Paniudto')) return '#10B981'; // Green
  if (val.includes('Snack')     || val.includes('Pama-an'))  return '#0EA5E9'; // Blue
  if (val.includes('Dinner')    || val.includes('Panihapon')) return '#8B5CF6'; // Purple
  return '#3B82F6';
};

// Meal icons
export const getMealIconComponent = (typeOrTime) => {
  const val = String(typeOrTime || '');
  if (val.includes('Breakfast') || val.includes('Pamahaw')) return Coffee;
  if (val.includes('Lunch')     || val.includes('Paniudto')) return Sun;
  if (val.includes('Snack')     || val.includes('Pama-an'))  return Flame;
  if (val.includes('Dinner')    || val.includes('Panihapon')) return Moon;
  return ChefHat;
};

// Notification helper
export const pushNotificationIfAllowed = async (newNotif, setNotifications) => {
  if (!setNotifications) return;
  try {
    const stored = await AsyncStorage.getItem('@ms_notification_preferences');
    const prefs = stored ? JSON.parse(stored) : { habitReminders: true, motivationalUpdates: true, personalizedAlerts: true };
    const category = newNotif.category;
    if ((category === 'hydration' || category === 'meal') && prefs.habitReminders === false) return;
    if ((category === 'workout' || category === 'achievement') && prefs.motivationalUpdates === false) return;
    if (category === 'smart' && prefs.personalizedAlerts === false) return;
    setNotifications(prev => [newNotif, ...prev]);
  } catch (e) {
    setNotifications(prev => [newNotif, ...prev]);
  }
};
