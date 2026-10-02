// Imports
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import {
  ChefHat,
  CheckCircle2,
  PlusCircle,
  Sparkles,
  Navigation,
  LocateFixed,
  ShoppingBag,
  Maximize2,
  MapPin,
  Search,
  Compass,
  X,
} from "lucide-react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Config & Services
import API_URL from "../config/api";
import { getCityFoodProfile } from "../../services/cityFoodService";
import { addToSyncQueue, updateCachedDashboardField } from "../../services/OfflineStorage";
import {
  calculateTargetMacros,
  ensurePlanWithinTargetCalories,
  getMealAccentColor,
  getMealIconComponent,
  pushNotificationIfAllowed,
} from "../../services/nutritionCalculator";
import { normalizeToCebuLGU, getDynamicPalengkePlan } from "../../data/cebuPalengkeMeals";
import { CEBU_LOCATIONS, CEBU_CITY_COORDINATES } from "../../data/cebu_locations";
import {
  PHILIPPINE_REGIONS,
  PHILIPPINE_CITY_COORDINATES,
  normalizeToPhilippineLocation,
  searchPhilippineLocations,
} from "../../data/philippine_locations";

// Contexts & Reusable UI Components
import { useCustomAlert } from "../../context/CustomAlertContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import LoadingModal from "../../components/LoadingModal";
import RecipeModal from "../../components/RecipeModal";
import PhilippineLocationModal from "../../components/PhilippineLocationModal";
import MapcnMap from "../../components/MapcnMap";
import StaggerCard from "../../components/StaggerCard";
import SkeletonCard from "../../components/SkeletonCard";
import PressableCard from "../../components/PressableCard";
import { reverseGeocodeToBarangay, getBarangayMarkersForCity, findCebuLGUForCoords } from "../../services/barangayGeocodingService";


// Re-export normalizeToCebuLGU for backward compatibility
export { normalizeToCebuLGU };

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");
const logoGreen = "#10b981";
const memoryDailyPlanCache = {};

// Reusable Meal Item Card Component (Deduplicated across Daily Plan & Food Radar)
function MealItemCard({
  mealId,
  isLogged,
  categoryLabel,
  timeLabel,
  mealTitle,
  calories,
  proteinText,
  accentColor,
  IconComponent,
  goalTag,
  goalBadgeDesc,
  onViewRecipe,
  onLogMeal,
  styles,
}) {
  return (
    <View style={styles.timelineItem}>
      <PressableCard style={[styles.timelineCard, isLogged && styles.timelineCardLogged]}>
        <View style={styles.timelineHeader}>
          <View
            style={[
              styles.mealTypeBadge,
              isLogged
                ? { backgroundColor: "#64748B" }
                : { backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}40`, borderWidth: 1 },
            ]}
          >
            <IconComponent color={isLogged ? "#FFFFFF" : accentColor} size={12} strokeWidth={2.5} />
            <Text style={[styles.mealTypeBadgeText, isLogged ? { color: "#FFFFFF" } : { color: accentColor }]}>{categoryLabel}</Text>
          </View>
          <Text style={styles.timelineTime}>{timeLabel}</Text>
        </View>

        <Text style={[styles.timelineTitle, isLogged && { color: "#64748B" }]}>{mealTitle}</Text>

        {Boolean(goalTag) && (
          <View style={[styles.goalTagBadge, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}35` }]}>
            <Sparkles size={10} color={accentColor} style={{ marginRight: 4 }} />
            <Text style={[styles.goalTagBadgeText, { color: accentColor }]}>{goalTag}</Text>
          </View>
        )}

        {Boolean(goalBadgeDesc) && (
          <Text style={styles.goalBadgeDescText} numberOfLines={2}>
            {goalBadgeDesc}
          </Text>
        )}

        <View style={styles.timelineFooter}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.timelineMacroText}>
              {calories} kcal • {proteinText}
            </Text>
            <TouchableOpacity style={styles.viewRecipeTextBtn} onPress={onViewRecipe} activeOpacity={0.6}>
              <ChefHat color={isLogged ? "#64748B" : accentColor} size={14} style={{ marginRight: 4 }} />
              <Text style={[styles.viewRecipeTextBtnLabel, !isLogged && { color: accentColor }]}>View Recipe</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.logMealMiniBtn, isLogged ? styles.logMealMiniBtnLogged : { backgroundColor: accentColor }]}
            onPress={onLogMeal}
            activeOpacity={0.7}
          >
            {isLogged ? (
              <>
                <CheckCircle2 color="#FFFFFF" size={12} />
                <Text style={styles.logMealMiniBtnTextLogged}>Logged </Text>
              </>
            ) : (
              <>
                <PlusCircle color="#FFFFFF" size={12} />
                <Text style={styles.logMealMiniBtnText}>Log Meal</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </PressableCard>
    </View>
  );
}

// Main Component
export default function DietRecipesScreen({
  onTabChange,
  dailyNutrition,
  setDailyNutrition,
  dailyExercise,
  guestGoals,
  guestBaseline,
  globalLoggedMeals = [],
  setGlobalLoggedMeals,
  sessionRecipes,
  sessionDailyPlan,
  setSessionDailyPlan,
  userId,
  isOnline = true,
  setNotifications,
  userProfile,
}) {
  // Hooks & Context
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const { language, t, translateMealTitle, translateMealCategory } = useLanguage();
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Navigation tabs ('PLAN' or 'EXPLORE')
  const [activeDietTab, setActiveDietTab] = useState("PLAN");

  // Modal states
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [isFetchingRecipe, setIsFetchingRecipe] = useState(false);
  const [showFullMapModal, setShowFullMapModal] = useState(false);
  const [mapModalMode, setMapModalMode] = useState("EXPLORE");

  // Recipe cache
  const recipeCacheRef = useRef({});

  // User profile & location
  const initialHometown = useMemo(() => {
    const raw =
      userProfile?.structuredLocation?.city || userProfile?.city || userProfile?.address || userProfile?.structured_location?.city;
    return normalizeToPhilippineLocation(raw) || normalizeToCebuLGU(raw) || raw || "Cebu City";
  }, [userProfile]);

  const [userHometown, setUserHometown] = useState(initialHometown || null);
  const [selectedLocation, setSelectedLocation] = useState(initialHometown || null);
  const [pinnedBarangay, setPinnedBarangay] = useState(null);
  const [userAllergies, setUserAllergies] = useState(userProfile?.allergies || []);
  const [isLocating, setIsLocating] = useState(false);
  const [radarSearchQuery, setRadarSearchQuery] = useState("");

  const radarSearchResults = useMemo(() => {
    if (!radarSearchQuery.trim()) return [];
    return searchPhilippineLocations(radarSearchQuery.trim(), "All");
  }, [radarSearchQuery]);

  // Dynamic city food profile state
  const [cityProfilesCache, setCityProfilesCache] = useState({});
  const [currentCityProfile, setCurrentCityProfile] = useState(null);
  const [isFetchingCityProfile, setIsFetchingCityProfile] = useState(false);

  // Handle City / Municipality selection from Map tap
  const handlePinBarangay = useCallback(async (locationData) => {
    if (!locationData) return;

    // 1. Resolve coordinates into Municipality / City using Cebu boundary GeoJSON
    if (locationData.lat && locationData.lng) {
      const lgu = findCebuLGUForCoords(locationData.lat, locationData.lng);
      if (lgu) {
        const normCity = normalizeToCebuLGU(lgu) || normalizeToPhilippineLocation(lgu) || lgu;
        setSelectedLocation(normCity);
        return;
      }

      try {
        const resolved = await reverseGeocodeToBarangay(locationData.lat, locationData.lng);
        if (resolved && resolved.city) {
          const normCity =
            normalizeToPhilippineLocation(resolved.city) ||
            normalizeToCebuLGU(resolved.city) ||
            resolved.city;
          setSelectedLocation(normCity);
          return;
        }
      } catch (err) {
        if (__DEV__) console.warn("[DietRecipes] Reverse geocode error:", err);
      }
    }

    // 2. Direct city / municipality object
    const target = locationData.city || locationData.name || locationData.barangay;
    if (target) {
      const normCity =
        normalizeToPhilippineLocation(target) ||
        normalizeToCebuLGU(target) ||
        target;
      setSelectedLocation(normCity);
    }
  }, []);

  // Dynamic barangay markers with red dots for the selected city
  const barangayMarkers = useMemo(() => {
    return getBarangayMarkersForCity(selectedLocation);
  }, [selectedLocation]);

  // Global meal log synchronization
  const loggedMeals = globalLoggedMeals;
  const setLoggedMeals = setGlobalLoggedMeals || (() => {});

  // Nutrition & target macros
  const { targetCalories, targetProtein, targetCarbs, targetFats } = useMemo(() => {
    return calculateTargetMacros(guestBaseline, guestGoals, dailyNutrition);
  }, [guestBaseline, guestGoals, dailyNutrition]);

  // Calorie calculations
  const consumedCalories = dailyNutrition?.consumedCalories || 0;
  const burnedCalories = dailyExercise?.caloriesBurned || 0;
  const netCalories = Math.max(0, consumedCalories - burnedCalories);
  const isOverGross = consumedCalories > targetCalories;
  const isOverCalories = netCalories > targetCalories;
  const isSavedByWorkout = isOverGross && !isOverCalories;

  // Load preferences & location
  useEffect(() => {
    const loadUserDataAndLocation = async () => {
      try {
        const storedProfile = (await AsyncStorage.getItem("ms_user_profile")) || (await AsyncStorage.getItem("@ms_user_profile"));
        const onboardingData = await AsyncStorage.getItem("@ms_onboarding_data");
        const dashboardCache = await AsyncStorage.getItem("ms_dashboard_cache");
        const storedBarangay = await AsyncStorage.getItem("ms_pinned_barangay");

        if (storedBarangay) {
          try {
            const parsedB = JSON.parse(storedBarangay);
            if (parsedB && (parsedB.barangay || parsedB.formattedTitle)) {
              setPinnedBarangay(parsedB);
            }
          } catch (_) {}
        }

        const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;
        const parsedOnb = onboardingData ? JSON.parse(onboardingData) : null;
        const parsedCache = dashboardCache ? JSON.parse(dashboardCache)?.data : null;

        const allergies = [userProfile, parsedProfile, parsedOnb, parsedCache?.profile].find(
          (p) => Array.isArray(p?.allergies) && p.allergies.length > 0
        )?.allergies;
        if (allergies) setUserAllergies(allergies);

        const candidateTown = [userProfile, parsedOnb, parsedCache?.profile, parsedProfile]
          .map((p) => p?.structuredLocation?.city || p?.structured_location?.city || p?.city || p?.address)
          .find(Boolean);

        if (candidateTown) {
          const chosenTown = normalizeToPhilippineLocation(candidateTown) || normalizeToCebuLGU(candidateTown) || candidateTown;
          setUserHometown(chosenTown);
          setSelectedLocation(chosenTown);
          if (__DEV__) console.log("[DietRecipes] 📍 Resolved user hometown:", chosenTown);
        }
      } catch (err) {
        if (__DEV__) console.warn("[DietRecipes] Error loading preferences & location:", err);
      }
    };
    loadUserDataAndLocation();
  }, [userProfile]);

  useEffect(() => {
    if (activeDietTab === "EXPLORE" && userHometown && !pinnedBarangay) {
      setSelectedLocation(userHometown);
    }
  }, [activeDietTab, userHometown, pinnedBarangay]);

  // City food profile
  useEffect(() => {
    let isMounted = true;
    const cityName = selectedLocation;
    if (!cityName) return;

    if (cityProfilesCache[cityName]) {
      setCurrentCityProfile(cityProfilesCache[cityName]);
      return;
    }

    setIsFetchingCityProfile(true);
    getCityFoodProfile(cityName)
      .then((profile) => {
        if (!isMounted) return;
        if (profile) {
          setCityProfilesCache((prev) => ({ ...prev, [cityName]: profile }));
          setCurrentCityProfile(profile);
          if (__DEV__) console.log("[DietRecipes] 🌾 City food profile loaded for:", cityName);
        } else {
          setCurrentCityProfile(null);
        }
      })
      .catch(() => {
        if (isMounted) setCurrentCityProfile(null);
      })
      .finally(() => {
        if (isMounted) setIsFetchingCityProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedLocation]);

  // Daily meal plan state & fetcher
  const userKey = userId || "default";
  const [dailyPlan, setDailyPlanState] = useState(() => {
    if (Array.isArray(sessionDailyPlan) && sessionDailyPlan.length > 0) return sessionDailyPlan;
    if (Array.isArray(memoryDailyPlanCache[userKey]) && memoryDailyPlanCache[userKey].length > 0) return memoryDailyPlanCache[userKey];
    return [];
  });
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [isGeneratingAIPlan, setIsGeneratingAIPlan] = useState(false);

  const setDailyPlan = useCallback(
    (newPlan) => {
      setDailyPlanState((prev) => {
        const rawResolved = typeof newPlan === "function" ? newPlan(prev) : newPlan;
        const resolved = ensurePlanWithinTargetCalories(rawResolved, targetCalories);
        memoryDailyPlanCache[userId || "default"] = resolved;
        if (setSessionDailyPlan) setSessionDailyPlan(resolved);
        return resolved;
      });
    },
    [userId, setSessionDailyPlan, targetCalories]
  );

  useEffect(() => {
    if (Array.isArray(sessionDailyPlan) && sessionDailyPlan.length > 0) {
      setDailyPlanState(sessionDailyPlan);
      memoryDailyPlanCache[userId || "default"] = sessionDailyPlan;
    }
  }, [sessionDailyPlan, userId]);

  const goalWeight = guestGoals?.goalWeight || guestBaseline?.targetWeight || "";
  const currentWeight = guestBaseline?.weight || "";
  const userGoal = guestGoals?.goal || "";

  // Helper for deterministic local Palengke plan
  const getFallbackLocalPlan = useCallback(() => {
    return getDynamicPalengkePlan({
      location: selectedLocation || "Cebu City",
      totalUserCalories: targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      userAllergies,
      guestGoals,
      userId,
      cityProfile: currentCityProfile,
    });
  }, [selectedLocation, targetCalories, targetProtein, targetCarbs, targetFats, userAllergies, guestGoals, userId, currentCityProfile]);

  const handleFetchFreshMeals = useCallback(
    async (force = false, isManualAction = false) => {
      if (isManualAction) setIsGeneratingAIPlan(true);
      setLoadingMeals(true);
      const todayStr = new Date().toISOString().split("T")[0];
      const targetId = userId || "guest";
      const CACHE_KEY = `ms_meals_cache_${targetId}_${todayStr}`;

      if (force && isManualAction) {
        try {
          await AsyncStorage.removeItem(CACHE_KEY);
        } catch (_) {}
      }

      try {
        if (__DEV__) console.log("[DietRecipes] 🍽️ Requesting fresh meals for:", targetId);
        const params = new URLSearchParams();
        if (goalWeight) params.append("goal_weight", String(goalWeight));
        if (userGoal) params.append("goal", String(userGoal));
        if (currentWeight) params.append("current_weight", String(currentWeight));
        params.append("date", todayStr);
        params.append("_t", String(Date.now()));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(`${API_URL}/meals/recommend/${targetId}?${params.toString()}`, {
          signal: controller.signal,
          headers: { "Cache-Control": "no-cache" },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDailyPlan(data);
            await AsyncStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                userId: targetId,
                date: todayStr,
                goalWeight: String(goalWeight || ""),
                goal: String(userGoal || ""),
                meals: data,
              })
            );
            if (__DEV__) console.log("[DietRecipes] ✅ Fresh AI meals saved to cache for:", todayStr);
            return;
          }
        }

        // Fallback: local Palengke plan
        setDailyPlan((prev) => {
          if (Array.isArray(prev) && prev.length > 0 && !isManualAction) return prev;
          const localPlan = getFallbackLocalPlan();
          if (localPlan && localPlan.length > 0) {
            AsyncStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                userId: targetId,
                date: todayStr,
                goalWeight: String(goalWeight || ""),
                goal: String(userGoal || ""),
                meals: localPlan,
              })
            ).catch(() => {});
            return localPlan;
          }
          return prev;
        });
      } catch (e) {
        if (__DEV__) console.log("[DietRecipes] ℹ️ Using local dynamic plan fallback:", e?.message || e);
        setDailyPlan((prev) => {
          if (Array.isArray(prev) && prev.length > 0 && !isManualAction) return prev;
          const localPlan = getFallbackLocalPlan();
          return localPlan && localPlan.length > 0 ? localPlan : prev;
        });
      } finally {
        setLoadingMeals(false);
        setIsGeneratingAIPlan(false);
      }
    },
    [userId, goalWeight, userGoal, currentWeight, getFallbackLocalPlan, setDailyPlan]
  );

  // Initial meal plan load (cache check + silent background fetch if needed)
  useEffect(() => {
    let isMounted = true;
    const loadCachedOrFetchMeals = async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const targetId = userId || "guest";
      const CACHE_KEY = `ms_meals_cache_${targetId}_${todayStr}`;

      if (Array.isArray(sessionDailyPlan) && sessionDailyPlan.length > 0) return;

      try {
        const cachedRaw = (await AsyncStorage.getItem(CACHE_KEY)) || (await AsyncStorage.getItem(`ms_meals_cache_${targetId}`));
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed.meals) && parsed.meals.length > 0 && isMounted) {
            setDailyPlan(parsed.meals);
            setLoadingMeals(false);
            if (parsed.date === todayStr) return;
          }
        }
        if (isMounted) handleFetchFreshMeals(false, false);
      } catch (err) {
        if (__DEV__) console.log("[DietRecipes] Meal cache verification notice:", err);
        if (isMounted) {
          const localPlan = getFallbackLocalPlan();
          if (localPlan && localPlan.length > 0) setDailyPlan(localPlan);
          handleFetchFreshMeals(false, false);
        }
      }
    };

    loadCachedOrFetchMeals();
    return () => {
      isMounted = false;
    };
  }, [userId, getFallbackLocalPlan, handleFetchFreshMeals, sessionDailyPlan, setDailyPlan]);

  // View recipe modal & caching
  const handleViewRecipe = useCallback(
    async (meal) => {
      if (meal.instructions && meal.ingredients) {
        setSelectedRecipe(meal);
        setShowRecipeModal(true);
        return;
      }

      const cacheKey = `${meal.title.trim().toLowerCase()}_${selectedLocation || "San Remigio"}`;
      if (recipeCacheRef.current[cacheKey]) {
        setSelectedRecipe(recipeCacheRef.current[cacheKey]);
        setShowRecipeModal(true);
        return;
      }

      setIsFetchingRecipe(true);
      try {
        if (__DEV__) console.log("[DietRecipes] 🤖 Generating full recipe details for:", meal.title);
        const response = await fetch(`${API_URL}/generate-recipe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            ingredients: meal.title,
            budget: "All",
            location: selectedLocation || "San Remigio",
          }),
        });

        if (!response.ok) throw new Error("Failed to generate recipe");
        const data = await response.json();
        recipeCacheRef.current[cacheKey] = data;
        setSelectedRecipe(data);
        setShowRecipeModal(true);
      } catch (error) {
        if (__DEV__) console.error("[DietRecipes] View Recipe Error:", error);
        showAlert("Unable to load recipe", "Failed to retrieve recipe from AI. Please check your network connection.");
      } finally {
        setIsFetchingRecipe(false);
      }
    },
    [selectedLocation, userId, showAlert]
  );

  // Meal logging & offline sync
  const handleLogMeal = async (id, macros) => {
    if (!userId) {
      showAlert("Authentication Error", "You must be logged in to log meals.");
      return;
    }

    const safeId = String(id || `meal-${Date.now()}`);
    const safeMacros = macros || {};
    const mealName = safeMacros.name || "Meal";
    const addedCal = parseInt(safeMacros.calories, 10) || 0;
    const addedProt = parseInt(safeMacros.protein, 10) || 0;
    const addedCarb = parseInt(safeMacros.carbs, 10) || 0;
    const addedFat = parseInt(safeMacros.fats, 10) || 0;

    const mealPayload = {
      id: safeId,
      user_id: userId,
      name: mealName,
      calories: addedCal,
      protein: addedProt,
      carbs: addedCarb,
      fats: addedFat,
    };

    const syncLocalDashboard = (ids, nut) => {
      if (nut) {
        updateCachedDashboardField(userId, {
          loggedMealIds: ids,
          nutrition: {
            consumedCalories: nut.consumedCalories,
            protein: { ...nut.protein },
            carbs: { ...nut.carbs },
            fats: { ...nut.fats },
          },
        }).catch(() => {});
      }
    };

    if (!loggedMeals.includes(safeId)) {
      // Log new meal
      const currentConsumed = dailyNutrition?.consumedCalories || 0;
      const targetMaxCalories = dailyNutrition?.targetCalories || 2500;
      const newTotal = currentConsumed + addedCal;
      const excess = newTotal - targetMaxCalories;

      const executeMealLog = async () => {
        const updatedLoggedMeals = [...loggedMeals, safeId];
        setLoggedMeals(updatedLoggedMeals);

        await pushNotificationIfAllowed(
          {
            id: `n-${Date.now()}`,
            title: "Meal Logged!",
            category: "meal",
            time: "Just Now",
            read: false,
            message: `Successfully logged your meal: ${mealName} (${addedCal} Kcal). Keep it up!`,
          },
          setNotifications
        );

        const newNutrition = dailyNutrition
          ? {
              consumedCalories: (dailyNutrition.consumedCalories || 0) + addedCal,
              protein: { ...(dailyNutrition.protein || {}), current: (dailyNutrition.protein?.current || 0) + addedProt },
              carbs: { ...(dailyNutrition.carbs || {}), current: (dailyNutrition.carbs?.current || 0) + addedCarb },
              fats: { ...(dailyNutrition.fats || {}), current: (dailyNutrition.fats?.current || 0) + addedFat },
            }
          : null;

        if (setDailyNutrition && newNutrition) setDailyNutrition((prev) => ({ ...prev, ...newNutrition }));

        // Optimistically sync local dashboard cache immediately (zero-delay tab switching)
        syncLocalDashboard(updatedLoggedMeals, newNutrition);

        if (!isOnline) {
          await addToSyncQueue({ type: "LOG_MEAL", payload: mealPayload });
          showAlert("Saved Offline", `${mealName} logged locally. It will sync when connection returns.`);
          return;
        }

        try {
          const res = await fetch(`${API_URL}/meals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mealPayload),
          });
          if (!res.ok) {
            throw new Error("Server rejected meal log");
          }
        } catch (err) {
          if (__DEV__) console.warn("[DietRecipes] Network issue logging meal, enqueuing:", err);
          await addToSyncQueue({ type: "LOG_MEAL", payload: mealPayload });
          showAlert("Saved Offline", `${mealName} logged locally. It will sync when connection returns.`);
        }
      };

      if (excess > 0 && addedCal > 0) {
        showAlert(
          "Target Calories Exceeded",
          `Logging this meal (${addedCal} kcal) will put you ${excess} kcal over your daily target of ${targetCalories} kcal.\n\nDo you still want to proceed?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Proceed & Log", style: "destructive", onPress: executeMealLog },
          ]
        );
      } else {
        await executeMealLog();
      }
    } else {
      // Remove meal
      const updatedLoggedMeals = loggedMeals.filter((mealId) => mealId !== id);
      setLoggedMeals(updatedLoggedMeals);

      let newNutrition = null;
      if (setDailyNutrition && macros) {
        setDailyNutrition((prev) => {
          const next = {
            ...prev,
            consumedCalories: Math.max(0, prev.consumedCalories - macros.calories),
            protein: { ...prev.protein, current: Math.max(0, (prev.protein?.current || 0) - macros.protein) },
            carbs: { ...prev.carbs, current: Math.max(0, (prev.carbs?.current || 0) - macros.carbs) },
            fats: { ...prev.fats, current: Math.max(0, (prev.fats?.current || 0) - macros.fats) },
          };
          newNutrition = next;
          return next;
        });
      }

      // Optimistically sync local dashboard cache immediately
      syncLocalDashboard(updatedLoggedMeals, newNutrition);

      if (!isOnline) {
        await addToSyncQueue({ type: "DELETE_MEAL", payload: { user_id: userId, id } });
        showAlert("Saved Offline", "Meal removed locally. Will sync when back online.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/meals/${userId}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete meal on server");
      } catch (error) {
        if (__DEV__) console.warn("[DietRecipes] Meal delete API error, enqueuing:", error);
        await addToSyncQueue({ type: "DELETE_MEAL", payload: { user_id: userId, id } });
      }
    }
  };

  // GPS location handler
  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert("Location Permission", "Please enable location access to use Locate Me.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const candidates = [geo.city, geo.subregion, geo.district, geo.region, geo.name].filter(Boolean);
      let matched = candidates.map(normalizeToPhilippineLocation).find(Boolean) || candidates.map(normalizeToCebuLGU).find(Boolean);

      if (matched) {
        setSelectedLocation(matched);
        if (__DEV__) console.log("[DietRecipes] 🧭 GPS successfully matched Philippine location:", matched);
      } else {
        const rawCity = geo.city || geo.subregion || "Cebu City";
        setSelectedLocation(normalizeToPhilippineLocation(rawCity) || rawCity);
      }
    } catch (err) {
      showAlert("Location Error", "Could not determine your location. Please try again.");
    } finally {
      setIsLocating(false);
    }
  };

  // Map data & coordinates
  const currentMapCenter = useMemo(() => {
    if (currentCityProfile?.lat && currentCityProfile?.lng) return [currentCityProfile.lng, currentCityProfile.lat];
    if (selectedLocation && PHILIPPINE_CITY_COORDINATES[selectedLocation]) {
      return [PHILIPPINE_CITY_COORDINATES[selectedLocation].lng, PHILIPPINE_CITY_COORDINATES[selectedLocation].lat];
    }
    if (selectedLocation && CEBU_CITY_COORDINATES[selectedLocation]) {
      return [CEBU_CITY_COORDINATES[selectedLocation].lng, CEBU_CITY_COORDINATES[selectedLocation].lat];
    }
    return [123.8854, 10.3157]; // Default: Cebu City
  }, [currentCityProfile, selectedLocation]);

  const mapMarkers = useMemo(() => [], []);

  // Local palengke plan for selected city (memoized to eliminate inline IIFE in JSX)
  const localPalengkePlan = useMemo(() => getFallbackLocalPlan(), [getFallbackLocalPlan]);
  const localPalengkeTotalKcal = useMemo(() => (localPalengkePlan || []).reduce((acc, m) => acc + (m.kcal || 0), 0), [localPalengkePlan]);
  const allergiesSummaryText = useMemo(
    () => (userAllergies && userAllergies.length > 0 ? userAllergies.join(", ") : "None"),
    [userAllergies]
  );

  // Macro Summary Items Array
  const macroStats = useMemo(
    () => [
      {
        label: "Net Kcal",
        val: `${Math.round(parseFloat(netCalories) || 0)}/${Math.round(parseFloat(targetCalories) || 0)}`,
        color: isOverCalories ? "#EF4444" : isSavedByWorkout ? logoGreen : "#F97316",
      },
      {
        label: "Protein",
        val: `${Math.round(parseFloat(dailyNutrition?.protein?.current) || 0)}/${Math.round(parseFloat(targetProtein) || 0)}g`,
        color: logoGreen,
      },
      {
        label: "Carbs",
        val: `${Math.round(parseFloat(dailyNutrition?.carbs?.current) || 0)}/${Math.round(parseFloat(targetCarbs) || 0)}g`,
        color: "#F59E0B",
      },
      {
        label: "Fats",
        val: `${Math.round(parseFloat(dailyNutrition?.fats?.current) || 0)}/${Math.round(parseFloat(targetFats) || 0)}g`,
        color: "#EC4899",
      },
    ],
    [netCalories, targetCalories, isOverCalories, isSavedByWorkout, dailyNutrition, targetProtein, targetCarbs, targetFats]
  );

  /* remove everything in the screen */
  // return <View style={styles.fullscreenOverlay} />;

  // Render
  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loadingMeals}
            onRefresh={() => handleFetchFreshMeals(true, false)}
            tintColor={logoGreen}
            colors={[logoGreen]}
          />
        }
      >
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.appName}>MacroSync</Text>
            <Text style={styles.greeting}>Diet & Recipes</Text>
            <Text style={styles.subGreeting}>Personalized meal suggestions built for your goals</Text>
          </View>
        </View>

        {/* TAB SWITCHER */}
        <View style={styles.tabSwitcherContainer}>
          {["PLAN", "EXPLORE"].map((tabKey) => (
            <TouchableOpacity
              key={tabKey}
              style={[styles.tabButton, activeDietTab === tabKey ? styles.tabButtonActive : styles.tabButtonInactive]}
              onPress={() => setActiveDietTab(tabKey)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeDietTab === tabKey ? styles.tabTextActive : styles.tabTextInactive]}>
                {tabKey === "PLAN" ? "Daily Plan" : "Food Radar"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab 1: Daily Plan */}
        {activeDietTab === "PLAN" ? (
          <View style={styles.dailyPlanSection}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginLeft: 4 }}>
              <Text style={[styles.sectionLabelTitle, { marginBottom: 0, marginLeft: 0 }]}>Today's Target Macros</Text>
            </View>

            {/* TARGET MACROS SUMMARY CARD */}
            <View style={styles.dailyProgressCard}>
              <View style={styles.macroRowInline}>
                {macroStats.map((item, idx) => (
                  <View key={idx} style={styles.macroMiniBox}>
                    <Text style={[styles.macroMiniVal, { fontSize: 10, color: item.color }]} numberOfLines={1}>
                      {item.val}
                    </Text>
                    <Text style={styles.macroMiniLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* AI SCHEDULED MEALS LIST */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
                paddingHorizontal: 4,
              }}
            >
              <Text style={[styles.sectionLabelTitle, { marginBottom: 0 }]}>Your AI Scheduled Meals</Text>
            </View>
            <View style={styles.timelineContainer}>
              {loadingMeals && (!dailyPlan || dailyPlan.length === 0) ? (
                <View style={{ gap: 12 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <SkeletonCard key={i} height={110} borderRadius={20} />
                  ))}
                </View>
              ) : !dailyPlan || dailyPlan.length === 0 ? (
                <View style={styles.emptyPlanCard}>
                  <ChefHat color={logoGreen} size={36} style={{ marginBottom: 10 }} />
                  <Text style={styles.emptyPlanTitle}>No AI Meals Generated Yet</Text>
                  <Text style={styles.emptyPlanSubtitle}>
                    Tap below to generate custom meal recommendations calculated for your exact daily macros.
                  </Text>
                  <TouchableOpacity style={styles.generatePlanButton} onPress={() => handleFetchFreshMeals(true, true)} activeOpacity={0.8}>
                    <Sparkles color="#FFFFFF" size={16} style={{ marginRight: 6 }} />
                    <Text style={styles.generatePlanButtonText}>Generate AI Meals</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                dailyPlan.map((meal, index) => {
                  const mealCat = meal?.mealType || meal?.time || "";
                  const IconComponent = getMealIconComponent(mealCat);
                  const accentColor = getMealAccentColor(mealCat);
                  const mealId = String(meal?.id || `meal-plan-${index}`);
                  const isLogged = loggedMeals.some((mId) => String(mId) === mealId);

                  return (
                    <StaggerCard key={mealId} index={index}>
                      <MealItemCard
                        mealId={mealId}
                        isLogged={isLogged}
                        categoryLabel={translateMealCategory(meal?.mealType) || t("Meal")}
                        timeLabel={t(meal?.time) || meal?.time || t("Today")}
                        mealTitle={translateMealTitle(meal?.title, language) || t("Healthy Meal")}
                        calories={meal?.calories || 0}
                        proteinText={`${meal?.protein || "0g"} ${t("Protein")}`}
                        accentColor={accentColor}
                        IconComponent={IconComponent}
                        onViewRecipe={() => handleViewRecipe(meal)}
                        onLogMeal={() =>
                          handleLogMeal(mealId, {
                            name: meal?.title || "Meal",
                            calories: meal?.calories || 0,
                            protein: parseInt(meal?.protein, 10) || 0,
                            carbs: parseInt(meal?.carbs, 10) || 0,
                            fats: parseInt(meal?.fats, 10) || 0,
                          })
                        }
                        styles={styles}
                      />
                    </StaggerCard>
                  );
                })
              )}
            </View>
          </View>
        ) : (
          /* Tab 2: Food Radar */
          <View style={styles.exploreSection}>
            <View style={styles.formCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Compass size={15} color={logoGreen} style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>Philippine Food Radar</Text>
                </View>
                <TouchableOpacity
                  style={styles.fullMapButton}
                  onPress={() => {
                    setMapModalMode("EXPLORE");
                    setShowFullMapModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Search size={12} color={logoGreen} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: logoGreen }}>Choose Any City</Text>
                </TouchableOpacity>
              </View>

              {/* INLINE QUICK SEARCH INPUT */}
              <View style={{ marginBottom: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isDarkMode ? "#1E293B" : "#F1F5F9",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                    paddingHorizontal: 12,
                    height: 40,
                  }}
                >
                  <Search size={14} color={isDarkMode ? "#94A3B8" : "#64748B"} style={{ marginRight: 8 }} />
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: "600",
                      color: isDarkMode ? "#F8FAFC" : "#0F172A",
                    }}
                    placeholder="Search Cebu town or Philippine city..."
                    placeholderTextColor={isDarkMode ? "#94A3B8" : "#64748B"}
                    value={radarSearchQuery}
                    onChangeText={setRadarSearchQuery}
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={() => {
                      if (radarSearchResults.length > 0) {
                        setSelectedLocation(radarSearchResults[0].name);
                        setRadarSearchQuery("");
                      } else if (radarSearchQuery.trim()) {
                        setSelectedLocation(radarSearchQuery.trim());
                        setRadarSearchQuery("");
                      }
                    }}
                  />
                  {radarSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setRadarSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X size={14} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Instant Suggestions Dropdown */}
                {radarSearchQuery.trim().length > 0 && radarSearchResults.length > 0 && (
                  <View
                    style={{
                      marginTop: 4,
                      backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                      overflow: "hidden",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                      elevation: 4,
                      zIndex: 100,
                    }}
                  >
                    {radarSearchResults.slice(0, 5).map((item) => (
                      <TouchableOpacity
                        key={item.name}
                        onPress={() => {
                          setSelectedLocation(item.name);
                          setRadarSearchQuery("");
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: isDarkMode ? "#334155" : "#F1F5F9",
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 8 }}>
                          <MapPin size={13} color={logoGreen} style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 13, fontWeight: "700", color: isDarkMode ? "#F8FAFC" : "#0F172A" }}>
                            {item.name}
                          </Text>
                          {item.region && (
                            <Text style={{ fontSize: 10, color: isDarkMode ? "#94A3B8" : "#64748B", marginLeft: 6 }}>
                              ({item.region})
                            </Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: logoGreen }} numberOfLines={1}>
                          {item.specialty || `${item.province || "Palengke"}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* INTERACTIVE MUNICIPALITY & CITY MAP */}
              <View style={styles.staticMapContainer}>
                <MapcnMap
                  center={currentMapCenter}
                  zoom={9}
                  markers={[]}
                  activeLocation={selectedLocation}
                  pinnedBarangay={null}
                  showPin={true}
                  onPinBarangay={handlePinBarangay}
                  onMarkerPress={(cityName) => cityName && setSelectedLocation(cityName)}
                  onSelectLocation={(cityName) => cityName && setSelectedLocation(cityName)}
                  cardContainer={false}
                  height="100%"
                  style={{ width: "100%", height: "100%" }}
                />

                {/* Floating Full Screen Button */}
                <TouchableOpacity
                  onPress={() => {
                    setMapModalMode("MAP");
                    setShowFullMapModal(true);
                  }}
                  activeOpacity={0.85}
                  style={styles.floatingFullscreenBtn}
                >
                  <Maximize2 size={13} color={logoGreen} style={{ marginRight: 5 }} />
                  <Text style={styles.floatingFullscreenText}>Full Screen</Text>
                </TouchableOpacity>

                {/* Floating Map Controls */}
                <View style={styles.floatingMapControls}>
                  <TouchableOpacity
                    onPress={handleLocateMe}
                    activeOpacity={0.85}
                    style={[styles.floatingPillBtn, { borderColor: logoGreen }]}
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color={logoGreen} style={{ marginRight: 6 }} />
                    ) : (
                      <LocateFixed size={14} color={logoGreen} style={{ marginRight: 6 }} />
                    )}
                    <Text style={styles.floatingPillText}>{isLocating ? "Locating..." : "Locate Me"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* SELECTED CITY / MUNICIPALITY STATUS BANNER */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: isDarkMode ? "#1E293B" : "#ECFDF5",
                  borderWidth: 1,
                  borderColor: isDarkMode ? "#334155" : "#A7F3D0",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 6 }}>
                  <MapPin size={13} color={logoGreen} style={{ marginRight: 6 }} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: isDarkMode ? "#F8FAFC" : "#065F46",
                    }}
                    numberOfLines={1}
                  >
                    {userHometown && selectedLocation?.toLowerCase() === userHometown?.toLowerCase() ? (
                      <>Hometown: <Text style={{ fontWeight: "900", color: logoGreen }}>{selectedLocation} (Your Base)</Text></>
                    ) : (
                      <>Viewing: <Text style={{ fontWeight: "900", color: logoGreen }}>{selectedLocation}</Text></>
                    )}
                  </Text>
                </View>

                {userHometown && selectedLocation?.toLowerCase() !== userHometown?.toLowerCase() ? (
                  <TouchableOpacity
                    onPress={() => setSelectedLocation(userHometown)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.15)" : "#D1FAE5",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Home size={11} color={logoGreen} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: "800", color: logoGreen }}>
                      Back to {userHometown}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* SELECTED CITY CULINARY BANNER */}
              {isFetchingCityProfile ? (
                <View style={{ marginTop: 12, alignItems: "center", paddingVertical: 14 }}>
                  <ActivityIndicator size="small" color={logoGreen} />
                  <Text style={{ fontSize: 11, color: isDarkMode ? "#94A3B8" : "#64748B", marginTop: 6 }}>
                    Loading local food profile for {selectedLocation}...
                  </Text>
                </View>
              ) : (
                Boolean(currentCityProfile) && (
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 6 }}>
                        <Navigation size={14} color={logoGreen} style={{ marginRight: 6 }} />
                        <Text style={styles.cityDetailTitle} numberOfLines={1}>
                          {currentCityProfile.marketTitle || `${selectedLocation} Food Market`}
                        </Text>
                        {userHometown && selectedLocation === userHometown ? (
                          <View style={styles.hometownBadge}>
                            <Text style={{ fontSize: 10, fontWeight: "800", color: logoGreen }}>Your Hometown</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                      <ShoppingBag size={12} color={theme?.textSecondary || "#94A3B8"} style={{ marginRight: 5 }} />
                      <Text style={[styles.cityPalengkeText, { flex: 1 }]}>
                        <Text style={{ fontWeight: "700" }}>Local Supplies:</Text> {currentCityProfile.palengkeItems}
                      </Text>
                    </View>
                  </View>
                )
              )}
            </View>

            {/* 1-DAY PALENGKE MEAL RECOMMENDATION CARD */}
            {Boolean(currentCityProfile) && (
              <>
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={[styles.sectionLabelTitle, { marginBottom: 0 }]}>1-Day Local Diet ({selectedLocation})</Text>
                    <View style={styles.calorieBadge}>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: logoGreen }}>~{localPalengkeTotalKcal} Kcal Total</Text>
                    </View>
                  </View>

                  {/* GOAL PROGRESS GUARD BANNER */}
                  <View style={styles.goalGuardBanner}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      <Sparkles size={14} color={logoGreen} style={{ marginRight: 6 }} />
                      <Text style={styles.goalGuardTitle}>
                        Goal-Aligned Nutrition ({guestGoals?.goal || "Maintain Weight"})
                      </Text>
                    </View>
                    <Text style={styles.goalGuardText}>
                      These local meal recommendations utilize {selectedLocation}’s famous native delicacies with customized portioning, lean protein substitutions, and calorie-controlled macros (~{targetCalories} kcal) so your fitness progress does not become stagnant.
                    </Text>
                  </View>

                  <View style={styles.allergyBanner}>
                    <CheckCircle2 size={14} color={logoGreen} style={{ marginRight: 6 }} />
                    <Text style={[styles.allergyBannerText, { color: isDarkMode ? "#A7F3D0" : "#047857" }]}>
                      Allergy Safety Active: Filtered for your profile ({allergiesSummaryText})
                    </Text>
                  </View>

                  <View style={styles.timelineList}>
                    {localPalengkePlan.map((mealItem) => {
                      const rawCat = mealItem.mealType || "Meal";
                      const cebuanoCat =
                        { Breakfast: "Pamahaw", Lunch: "Paniudto", Snack: "Pama-an", Dinner: "Panihapon" }[rawCat] || rawCat;
                      const IconComponent = getMealIconComponent(rawCat);
                      const accentColor = getMealAccentColor(rawCat);
                      const mealId = String(mealItem.id);
                      const isLogged = loggedMeals.some((mId) => String(mId) === mealId);

                      return (
                        <MealItemCard
                          key={mealId}
                          mealId={mealId}
                          isLogged={isLogged}
                          categoryLabel={cebuanoCat}
                          timeLabel={mealItem.time}
                          mealTitle={translateMealTitle(mealItem.title, language)}
                          calories={mealItem.kcal}
                          proteinText={`${mealItem.proteinNum}g protein`}
                          accentColor={accentColor}
                          IconComponent={IconComponent}
                          goalTag={mealItem.goalTag}
                          goalBadgeDesc={mealItem.goalBadgeDesc}
                          onViewRecipe={() => handleViewRecipe(mealItem)}
                          onLogMeal={() =>
                            handleLogMeal(mealId, {
                              name: mealItem?.title || "Meal",
                              calories: mealItem?.kcal || 0,
                              protein: mealItem?.proteinNum || 0,
                              carbs: mealItem?.carbsNum || 0,
                              fats: mealItem?.fatsNum || 0,
                            })
                          }
                          styles={styles}
                        />
                      );
                    })}
                  </View>
                </View>

                {/* FAMOUS NATIVE DISHES CARD */}
                {Boolean(currentCityProfile?.famousDishes) && (
                  <View style={[styles.formCard, { marginBottom: 24 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Text style={styles.cardTitle}>Famous Delicacies ({selectedLocation})</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: isDarkMode ? "#94A3B8" : "#64748B", marginBottom: 14, lineHeight: 18 }}>
                      Iconic local dishes, traditional street food, and heritage delicacies famous in {selectedLocation}:
                    </Text>

                    <View style={{ gap: 10 }}>
                      {currentCityProfile.famousDishes.map((dish, idx) => (
                        <View
                          key={idx}
                          style={{
                            backgroundColor: isDarkMode ? "#1E293B" : "#F8FAFC",
                            padding: 14,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: "800", color: isDarkMode ? "#F8FAFC" : "#0F172A" }}>
                            {translateMealTitle(dish.name, language)}
                          </Text>
                          <Text style={{ fontSize: 11, color: isDarkMode ? "#94A3B8" : "#64748B", marginTop: 4, lineHeight: 16 }}>
                            {dish.desc}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <RecipeModal
        visible={showRecipeModal}
        recipe={selectedRecipe}
        onClose={() => setShowRecipeModal(false)}
        theme={theme}
        language={language}
        translateMealTitle={translateMealTitle}
      />

      <PhilippineLocationModal
        visible={showFullMapModal}
        onClose={() => setShowFullMapModal(false)}
        isDarkMode={isDarkMode}
        currentMapCenter={currentMapCenter}
        mapMarkers={[]}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        pinnedBarangay={null}
        showPin={false}
        onPinBarangay={handlePinBarangay}
        userHometown={userHometown}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        currentCityProfile={currentCityProfile}
        initialViewMode={mapModalMode}
      />

      <LoadingModal
        visible={isFetchingRecipe || isGeneratingAIPlan}
        type={isFetchingRecipe ? "recipe" : "meal"}
        title={isFetchingRecipe ? "Crafting Custom Recipe" : "Generating AI Daily Meal Plan"}
        subtitle={isFetchingRecipe ? "Vita AI is personalizing your nutrition" : "Vita AI is calculating your optimal daily macros"}
      />
    </View>
  );
}

// Styles
const baseColor = "#F8FAFC";

const getStyles = (theme) =>
  StyleSheet.create({
    fullscreenOverlay: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: "100%",
      height: "100%",
      backgroundColor: theme?.background || baseColor,
    },
    container: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 54 : 48,
      paddingBottom: 85,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      paddingHorizontal: 4,
      width: "100%",
    },
    headerTextGroup: { flex: 1 },
    appName: {
      fontSize: 12,
      fontWeight: "900",
      color: logoGreen,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 2,
    },
    greeting: {
      fontSize: 28,
      fontWeight: "900",
      color: theme?.textPrimary || "#0F172A",
      letterSpacing: -0.5,
    },
    subGreeting: {
      fontSize: 13,
      fontWeight: "700",
      color: theme?.textSecondary || "#64748B",
      marginTop: 2,
    },
    formCard: {
      backgroundColor: theme?.surface || baseColor,
      borderRadius: 20,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1.2,
      borderColor: theme?.border || "#E2E8F0",
    },
    cardTitle: {
      fontSize: 11,
      color: theme?.textPrimary || "#64748B",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 10,
      fontWeight: "800",
      marginLeft: 2,
    },
    sectionLabelTitle: {
      fontSize: 14,
      fontWeight: "900",
      color: theme?.textPrimary || "#0F172A",
      marginBottom: 12,
      marginLeft: 4,
      letterSpacing: -0.2,
    },
    tabSwitcherContainer: {
      flexDirection: "row",
      backgroundColor: theme?.cardBg || "#EBEBEB",
      borderRadius: 20,
      padding: 4,
      marginBottom: 20,
      borderWidth: 1.2,
      borderColor: theme?.border || "#E2E8F0",
    },
    tabButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 16,
    },
    tabButtonActive: {
      backgroundColor: theme?.surface || baseColor,
      borderWidth: 1.5,
      borderColor: theme?.border || "#E2E8F0",
    },
    tabButtonInactive: { backgroundColor: "transparent" },
    tabButtonText: { fontSize: 13 },
    tabTextActive: { fontSize: 13, fontWeight: "800", color: logoGreen },
    tabTextInactive: { fontSize: 13, color: theme?.textSecondary || "#94A3B8" },
    dailyProgressCard: {
      backgroundColor: "transparent",
      borderRadius: 24,
      padding: 0,
      marginBottom: 24,
    },
    macroRowInline: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    macroMiniBox: {
      width: "23.5%",
      maxWidth: "24%",
      height: 54,
      backgroundColor: theme?.surface || baseColor,
      paddingVertical: 6,
      paddingHorizontal: 2,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: theme?.border || "#E2E8F0",
      overflow: "hidden",
    },
    macroMiniVal: {
      width: "100%",
      fontSize: 9.5,
      fontWeight: "900",
      color: theme?.textPrimary || "#0F172A",
      textAlign: "center",
    },
    macroMiniLabel: {
      width: "100%",
      fontSize: 9.5,
      fontWeight: "700",
      color: theme?.textSecondary || "#94A3B8",
      marginTop: 2,
      textAlign: "center",
    },
    timelineContainer: { marginTop: 6 },
    timelineItem: { flexDirection: "row", marginBottom: 16, width: "100%" },
    timelineCard: {
      flex: 1,
      backgroundColor: theme?.surface || "#FFFFFF",
      borderRadius: 20,
      padding: 14,
      borderWidth: 1.5,
      borderColor: theme?.border || "#E2E8F0",
    },
    timelineCardLogged: {
      backgroundColor: theme?.cardBg || "#F8FAFC",
      borderWidth: 1.5,
      borderColor: theme?.border || "#CBD5E1",
      opacity: 0.85,
    },
    timelineHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    mealTypeBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme?.cardBg || "#F1F5F9",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    mealTypeBadgeText: { fontSize: 10, fontWeight: "800", color: logoGreen, marginLeft: 4 },
    timelineTime: { fontSize: 11, fontWeight: "700", color: theme?.textSecondary || "#94A3B8" },
    timelineTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: theme?.textPrimary || "#0F172A",
      marginBottom: 10,
    },
    timelineFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: theme?.border || "#F8FAFC",
      paddingTop: 10,
    },
    timelineMacroText: { fontSize: 11, fontWeight: "700", color: theme?.textSecondary || "#64748B" },
    logMealMiniBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: logoGreen,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    logMealMiniBtnLogged: { backgroundColor: "#94A3B8" },
    logMealMiniBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", marginLeft: 4 },
    logMealMiniBtnTextLogged: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", marginLeft: 4 },
    emptyPlanCard: {
      padding: 24,
      borderRadius: 18,
      backgroundColor: theme?.surface || "#FFFFFF",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: theme?.border || "#E2E8F0",
    },
    emptyPlanTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: theme?.textPrimary || "#0F172A",
      textAlign: "center",
      marginBottom: 4,
    },
    emptyPlanSubtitle: {
      fontSize: 12,
      color: theme?.textSecondary || "#64748B",
      textAlign: "center",
      marginBottom: 16,
    },
    generatePlanButton: {
      backgroundColor: logoGreen,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
    },
    staticMapContainer: {
      height: 235,
      width: "100%",
      backgroundColor: theme?.inputBg || "#F1F5F9",
      borderRadius: 20,
      borderWidth: 1.2,
      borderColor: theme?.border || "#E2E8F0",
      marginBottom: 12,
      overflow: "hidden",
      position: "relative",
    },
    floatingMapControls: {
      position: "absolute",
      bottom: 14,
      right: 14,
      flexDirection: "row",
      gap: 8,
      zIndex: 100,
    },
    floatingPillBtn: {
      backgroundColor: theme?.surface || "#FFFFFF",
      borderRadius: 50,
      paddingVertical: 9,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 8,
      borderWidth: 1.5,
    },
    floatingPillText: { fontSize: 12, fontWeight: "800", color: logoGreen },
    floatingFullscreenBtn: {
      position: "absolute",
      top: 12,
      left: 12,
      backgroundColor: theme?.surface || "#FFFFFF",
      borderRadius: 50,
      paddingVertical: 7,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 5,
      elevation: 6,
      borderWidth: 1.2,
      borderColor: logoGreen,
      zIndex: 100,
    },
    floatingFullscreenText: { fontSize: 11, fontWeight: "800", color: logoGreen },
    fullMapButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(16, 185, 129, 0.10)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    cityDetailTitle: { fontSize: 14, fontWeight: "900", color: theme?.textPrimary || "#0F172A" },
    cityPalengkeText: { fontSize: 11, color: theme?.textSecondary || "#64748B" },
    viewRecipeTextBtn: { flexDirection: "row", alignItems: "center", marginTop: 6 },
    viewRecipeTextBtnLabel: { fontSize: 11, fontWeight: "800", color: logoGreen },
    hometownBadge: {
      marginLeft: 8,
      backgroundColor: "rgba(16, 185, 129, 0.15)",
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
    },
    calorieBadge: {
      backgroundColor: "rgba(16, 185, 129, 0.10)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    allergyBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(16, 185, 129, 0.12)",
      borderWidth: 1,
      borderColor: "rgba(16, 185, 129, 0.3)",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    allergyBannerText: { fontSize: 11, fontWeight: "700", flex: 1 },
    timelineList: { gap: 0 },
    goalGuardBanner: {
      backgroundColor: "rgba(16, 185, 129, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(16, 185, 129, 0.25)",
      borderRadius: 14,
      padding: 12,
      marginBottom: 12,
    },
    goalGuardTitle: {
      fontSize: 12,
      fontWeight: "900",
      color: logoGreen,
      marginBottom: 2,
    },
    goalGuardText: {
      fontSize: 11,
      lineHeight: 16,
      color: theme?.textSecondary || "#64748B",
    },
    goalTagBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginVertical: 4,
      borderWidth: 1,
    },
    goalTagBadgeText: {
      fontSize: 10,
      fontWeight: "800",
    },
    goalBadgeDescText: {
      fontSize: 10.5,
      color: theme?.textSecondary || "#64748B",
      marginBottom: 6,
      lineHeight: 14,
    },
  });
