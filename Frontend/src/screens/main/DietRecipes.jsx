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
  Modal,
  TextInput,
  Keyboard,
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
  Minimize2,
  X,
  Home,
  MapPin,
  Search,
  Compass,
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
import StaggerCard from "../../components/StaggerCard";
import SkeletonCard from "../../components/SkeletonCard";
import PressableCard from "../../components/PressableCard";
import MapcnMap from "../../components/MapcnMap";
import {
  reverseGeocodeToBarangay,
  getBarangayMarkersForCity,
  searchPhilippineBarangays,
  POPULAR_BARANGAY_COORDINATES,
} from "../../services/barangayGeocodingService";


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
  setUserProfile,
}) {
  // Hooks & Context
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const { language, t, translateMealTitle, translateMealCategory } = useLanguage();
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Navigation tabs ('PLAN' or 'EXPLORE')
  const activeDietTabState = useState("PLAN");
  const [activeDietTab, setActiveDietTab] = activeDietTabState;

  // Modal states
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [isFetchingRecipe, setIsFetchingRecipe] = useState(false);

  // Interactive Map Maximize and In-Page Location Search states (No modal)
  const [isMapMaximized, setIsMapMaximized] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  // New Default Location Prompt Modal states
  const [pendingDefaultLocation, setPendingDefaultLocation] = useState(null);
  const [showDefaultLocationPrompt, setShowDefaultLocationPrompt] = useState(false);

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

  // Dynamic city food profile state
  const [cityProfilesCache, setCityProfilesCache] = useState({});
  const [currentCityProfile, setCurrentCityProfile] = useState(null);
  const [isFetchingCityProfile, setIsFetchingCityProfile] = useState(false);

  // Handle exact Barangay pinning
  const handlePinBarangay = useCallback(async (barangayData) => {
    if (!barangayData) return;
    let targetData = barangayData;
    if (barangayData.lat && barangayData.lng && !barangayData.formattedTitle) {
      try {
        const resolved = await reverseGeocodeToBarangay(barangayData.lat, barangayData.lng);
        if (resolved) {
          targetData = resolved;
        }
      } catch (err) {
        if (__DEV__) console.warn("[DietRecipes] Reverse geocode error:", err);
      }
    }

    const resolvedTitle =
      targetData.formattedTitle ||
      (targetData.barangay && targetData.city
        ? `Brgy. ${targetData.barangay}, ${targetData.city}`
        : targetData.city || (typeof targetData === "string" ? targetData : ""));

    const resolvedCity = targetData.city || (typeof targetData === "string" ? targetData : "") || "";
    const resolvedProvince = targetData.province || "";
    const resolvedBarangay = targetData.barangay || "";

    let resolvedLat = targetData.lat;
    let resolvedLng = targetData.lng;

    if (typeof resolvedLat !== "number" || typeof resolvedLng !== "number") {
      const bKey = (resolvedBarangay || "").toLowerCase().trim();
      if (POPULAR_BARANGAY_COORDINATES && POPULAR_BARANGAY_COORDINATES[bKey]) {
        resolvedLat = POPULAR_BARANGAY_COORDINATES[bKey].lat;
        resolvedLng = POPULAR_BARANGAY_COORDINATES[bKey].lng;
      } else if (resolvedCity) {
        const cMatches = searchPhilippineLocations(resolvedCity);
        if (cMatches && cMatches.length > 0 && typeof cMatches[0].lat === "number") {
          resolvedLat = cMatches[0].lat;
          resolvedLng = cMatches[0].lng;
        }
      }
    }

    const standardizedPinned = {
      barangay: resolvedBarangay,
      city: resolvedCity,
      province: resolvedProvince,
      formattedTitle: resolvedTitle,
      lat: resolvedLat,
      lng: resolvedLng,
    };

    setPinnedBarangay(standardizedPinned);
    AsyncStorage.setItem("ms_pinned_barangay", JSON.stringify(standardizedPinned)).catch(() => {});
    if (resolvedCity) {
      const normCity =
        normalizeToPhilippineLocation(resolvedCity) ||
        normalizeToCebuLGU(resolvedCity) ||
        resolvedCity;
      setSelectedLocation(normCity);
    }
  }, []);

  // Handle checking location and prompting user every time they pin another location
  const handleCheckAndPromptDefaultLocation = useCallback(
    async (locData) => {
      if (!locData) return;

      let targetData = locData;
      if (locData.lat && locData.lng && !locData.formattedTitle) {
        try {
          const resolved = await reverseGeocodeToBarangay(locData.lat, locData.lng);
          if (resolved) {
            targetData = resolved;
          }
        } catch (err) {
          if (__DEV__) console.warn("[DietRecipes] Reverse geocode error:", err);
        }
      }

      const title =
        targetData.formattedTitle ||
        (targetData.barangay && targetData.city
          ? `Brgy. ${targetData.barangay}, ${targetData.city}`
          : targetData.city || (typeof targetData === "string" ? targetData : ""));

      const city = targetData.city || (typeof targetData === "string" ? targetData : "") || "";
      const province = targetData.province || "";
      const barangay = targetData.barangay || "";

      let resolvedLat = targetData.lat;
      let resolvedLng = targetData.lng;

      if (typeof resolvedLat !== "number" || typeof resolvedLng !== "number") {
        const bKey = (barangay || "").toLowerCase().trim();
        if (POPULAR_BARANGAY_COORDINATES && POPULAR_BARANGAY_COORDINATES[bKey]) {
          resolvedLat = POPULAR_BARANGAY_COORDINATES[bKey].lat;
          resolvedLng = POPULAR_BARANGAY_COORDINATES[bKey].lng;
        } else if (city) {
          const cMatches = searchPhilippineLocations(city);
          if (cMatches && cMatches.length > 0 && typeof cMatches[0].lat === "number") {
            resolvedLat = cMatches[0].lat;
            resolvedLng = cMatches[0].lng;
          }
        }
      }

      const standardizedPinned = {
        barangay,
        city,
        province,
        formattedTitle: title,
        lat: resolvedLat,
        lng: resolvedLng,
      };

      // Apply optimistic pin locally so radar and map reflect it right away
      setPinnedBarangay(standardizedPinned);
      AsyncStorage.setItem("ms_pinned_barangay", JSON.stringify(standardizedPinned)).catch(() => {});

      if (city) {
        const norm = normalizeToPhilippineLocation(city) || normalizeToCebuLGU(city) || city;
        setSelectedLocation(norm);
      }

      // Prompt user choice every time they pin a location
      setPendingDefaultLocation(standardizedPinned);
      setShowDefaultLocationPrompt(true);
    },
    []
  );

  // User confirms making this newly pinned location their new default
  const handleConfirmDefaultLocation = useCallback(async (explicitTarget) => {
    // CRITICAL: Prevent synthetic touch events from being treated as location targets
    const isLocationObj =
      explicitTarget &&
      typeof explicitTarget === "object" &&
      !explicitTarget.nativeEvent &&
      !explicitTarget.dispatchConfig &&
      (explicitTarget.formattedTitle || explicitTarget.barangay || explicitTarget.city || explicitTarget.name);

    const targetData = (isLocationObj ? explicitTarget : null) || pendingDefaultLocation || pinnedBarangay;
    if (!targetData) {
      setShowDefaultLocationPrompt(false);
      return;
    }

    const fullTitle =
      targetData.formattedTitle ||
      (targetData.barangay && targetData.city
        ? `Brgy. ${targetData.barangay}, ${targetData.city}`
        : targetData.city || (typeof targetData === "string" ? targetData : ""));

    const resolvedCity = targetData.city || (typeof targetData === "string" ? targetData : "") || "";
    const resolvedProvince = targetData.province || "";
    const addressStr = fullTitle || resolvedCity;
    const structuredLoc = {
      city: resolvedCity,
      province: resolvedProvince,
    };

    // 1. Update DietRecipes local state
    const newPinnedObj = {
      barangay: targetData.barangay || "",
      city: resolvedCity,
      province: resolvedProvince,
      formattedTitle: fullTitle,
      lat: targetData.lat,
      lng: targetData.lng,
    };

    setPinnedBarangay(newPinnedObj);
    setUserHometown(resolvedCity || fullTitle);
    setSelectedLocation(resolvedCity || fullTitle);

    // 2. Save ms_pinned_barangay to AsyncStorage
    await AsyncStorage.setItem("ms_pinned_barangay", JSON.stringify(newPinnedObj)).catch(() => {});

    // 3. Save @ms_default_location to AsyncStorage
    await AsyncStorage.setItem(
      "@ms_default_location",
      JSON.stringify({
        address: addressStr,
        city: resolvedCity,
        province: resolvedProvince,
        structuredLocation: structuredLoc,
      })
    ).catch(() => {});

    // 4. Update user profile in AsyncStorage and App.js state
    let baseProfile = userProfile || {};
    try {
      const storedProfile = await AsyncStorage.getItem("ms_user_profile");
      if (storedProfile) {
        baseProfile = { ...baseProfile, ...JSON.parse(storedProfile) };
      }
    } catch (_) {}

    const updatedProfile = {
      ...baseProfile,
      address: addressStr,
      city: resolvedCity,
      province: resolvedProvince,
      structuredLocation: structuredLoc,
    };
    await AsyncStorage.setItem("ms_user_profile", JSON.stringify(updatedProfile)).catch(() => {});

    if (setUserProfile) {
      setUserProfile((prev) => ({
        ...prev,
        address: addressStr,
        city: resolvedCity,
        province: resolvedProvince,
        structuredLocation: structuredLoc,
      }));
    }

    // 5. Background sync to backend database
    try {
      const activeUserId = userId || (await AsyncStorage.getItem("ms_user_id"));
      if (activeUserId) {
        fetch(`${API_URL}/update-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: activeUserId,
            name: updatedProfile.name,
            email: updatedProfile.email,
            address: addressStr,
            city: resolvedCity,
            province: resolvedProvince,
            structured_location: structuredLoc,
          }),
        }).catch((err) => {
          if (__DEV__) console.warn("[DietRecipes] Backend update-profile error:", err);
        });
      }
    } catch (e) {
      if (__DEV__) console.warn("[DietRecipes] Profile update error:", e);
    }

    setShowDefaultLocationPrompt(false);
    setPendingDefaultLocation(null);

    showAlert(
      "Default Location Updated",
      `Your default location has been updated to ${fullTitle}. This is now reflected in your profile and Settings tab.`
    );
  }, [pendingDefaultLocation, pinnedBarangay, userProfile, setUserProfile, userId, showAlert]);

  const handleRejectDefaultLocation = useCallback(() => {
    setShowDefaultLocationPrompt(false);
    setPendingDefaultLocation(null);
  }, []);

  // Live autocomplete search across all Philippine barangays and cities
  useEffect(() => {
    let isMounted = true;
    if (!mapSearchQuery || mapSearchQuery.trim().length < 2) {
      setMapSearchResults([]);
      return;
    }

    const cleanQ = mapSearchQuery.trim();
    setIsSearchingMap(true);

    const cityMatches = searchPhilippineLocations(cleanQ)
      .slice(0, 5)
      .map((c) => ({
        type: "city",
        name: c.name,
        city: c.name,
        province: c.province || "",
        display: c.name,
        lat: c.lat,
        lng: c.lng,
      }));

    searchPhilippineBarangays(cleanQ)
      .then((brgyResults) => {
        if (isMounted) {
          const combined = [
            ...(brgyResults || []).slice(0, 6).map((b) => ({ ...b, type: "barangay" })),
            ...cityMatches,
          ];
          setMapSearchResults(combined);
        }
      })
      .catch(() => {
        if (isMounted) setMapSearchResults(cityMatches);
      })
      .finally(() => {
        if (isMounted) setIsSearchingMap(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mapSearchQuery]);

  const handleSelectSearchResult = useCallback(
    (item) => {
      Keyboard.dismiss();
      setMapSearchQuery("");
      setMapSearchResults([]);

      if (item.type === "barangay" || item.barangay) {
        const locObj = {
          barangay: item.barangay || item.name.replace(/^Brgy\.\s*/i, ""),
          city: item.city || selectedLocation || "Philippines",
          province: item.province || "",
          formattedTitle: item.display || `Brgy. ${item.barangay}, ${item.city}`,
          lat: item.lat,
          lng: item.lng,
        };
        handleCheckAndPromptDefaultLocation(locObj);
      } else {
        const cityName = item.city || item.name;
        setSelectedLocation(cityName);
        handleCheckAndPromptDefaultLocation({
          city: cityName,
          formattedTitle: cityName,
          lat: item.lat,
          lng: item.lng,
        });
      }
    },
    [selectedLocation, handleCheckAndPromptDefaultLocation, setSelectedLocation]
  );

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
        const defaultLocData = await AsyncStorage.getItem("@ms_default_location");
        const dashboardCache = await AsyncStorage.getItem("ms_dashboard_cache");
        const storedBarangay = await AsyncStorage.getItem("ms_pinned_barangay");

        if (storedBarangay) {
          try {
            const parsedB = JSON.parse(storedBarangay);
            if (parsedB && (parsedB.barangay || parsedB.formattedTitle || parsedB.city)) {
              let resolvedB = { ...parsedB };
              if (typeof resolvedB.lat !== "number" || typeof resolvedB.lng !== "number") {
                const bKey = (resolvedB.barangay || "").toLowerCase().trim();
                if (POPULAR_BARANGAY_COORDINATES && POPULAR_BARANGAY_COORDINATES[bKey]) {
                  resolvedB.lat = POPULAR_BARANGAY_COORDINATES[bKey].lat;
                  resolvedB.lng = POPULAR_BARANGAY_COORDINATES[bKey].lng;
                  if (!resolvedB.city) resolvedB.city = POPULAR_BARANGAY_COORDINATES[bKey].city;
                } else if (resolvedB.city) {
                  const cMatches = searchPhilippineLocations(resolvedB.city);
                  if (cMatches && cMatches.length > 0 && typeof cMatches[0].lat === "number") {
                    resolvedB.lat = cMatches[0].lat;
                    resolvedB.lng = cMatches[0].lng;
                  }
                }
              }
              setPinnedBarangay(resolvedB);
            }
          } catch (_) {}
        }

        const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;
        const parsedOnb = onboardingData ? JSON.parse(onboardingData) : null;
        const parsedDefLoc = defaultLocData ? JSON.parse(defaultLocData) : null;
        const parsedCache = dashboardCache ? JSON.parse(dashboardCache)?.data : null;

        const allergies = [userProfile, parsedProfile, parsedOnb, parsedCache?.profile].find(
          (p) => Array.isArray(p?.allergies) && p.allergies.length > 0
        )?.allergies;
        if (allergies) setUserAllergies(allergies);

        const candidateTown = [userProfile, parsedDefLoc, parsedOnb, parsedCache?.profile, parsedProfile]
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
    if (initialHometown) {
      setUserHometown(initialHometown);
      if (!selectedLocation || selectedLocation === "Cebu City" || selectedLocation === "San Remigio") {
        setSelectedLocation(initialHometown);
      }
    }
  }, [initialHometown]);

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
      location: selectedLocation || userHometown || "Cebu City",
      totalUserCalories: targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      userAllergies,
      guestGoals,
      userId,
      cityProfile: currentCityProfile,
    });
  }, [selectedLocation, userHometown, targetCalories, targetProtein, targetCarbs, targetFats, userAllergies, guestGoals, userId, currentCityProfile]);

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

      const cacheKey = `${meal.title.trim().toLowerCase()}_${selectedLocation || userHometown || "Cebu City"}`;
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
            location: selectedLocation || userHometown || "Cebu City",
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
                {tabKey === "PLAN" ? "Daily Plan" : "Explore Recipes"}
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
          /* Tab 2: Explore Recipes */
          <View style={styles.exploreSection}>
            <View style={styles.formCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Compass size={15} color={logoGreen} style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>Philippine Food Radar</Text>
                </View>
                <TouchableOpacity
                  style={styles.maximizeMapButton}
                  onPress={() => setIsMapMaximized(true)}
                  activeOpacity={0.8}
                >
                  <Maximize2 size={13} color={logoGreen} style={{ marginRight: 5 }} />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: logoGreen }}>Maximize Map</Text>
                </TouchableOpacity>
              </View>

              {/* SEARCH TAB AT THE TOP */}
              <View
                style={[
                  styles.mapSearchBox,
                  {
                    backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC",
                    borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                  },
                ]}
              >
                <Search size={16} color={logoGreen} style={{ marginRight: 8 }} />
                <TextInput
                  style={[
                    styles.mapSearchInput,
                    { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
                  ]}
                  placeholder="Search barangay, municipality, or city..."
                  placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                  value={mapSearchQuery}
                  onChangeText={setMapSearchQuery}
                  autoCorrect={false}
                />
                {isSearchingMap ? (
                  <ActivityIndicator size="small" color={logoGreen} style={{ marginLeft: 6 }} />
                ) : mapSearchQuery.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setMapSearchQuery("");
                      setMapSearchResults([]);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={15} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* SEARCH SUGGESTIONS DROPDOWN */}
              {mapSearchResults.length > 0 && (
                <View
                  style={[
                    styles.mapSearchDropdown,
                    {
                      backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                      borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                    },
                  ]}
                >
                  <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                    {mapSearchResults.map((item, idx) => (
                      <TouchableOpacity
                        key={`${item.name}-${idx}`}
                        onPress={() => handleSelectSearchResult(item)}
                        style={[
                          styles.mapSearchItemRow,
                          { borderBottomColor: isDarkMode ? "#334155" : "#F1F5F9" },
                          idx === mapSearchResults.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.mapSearchItemIcon,
                            {
                              backgroundColor:
                                item.type === "barangay"
                                  ? "rgba(239, 68, 68, 0.12)"
                                  : "rgba(16, 185, 129, 0.12)",
                            },
                          ]}
                        >
                          {item.type === "barangay" ? (
                            <View
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "#EF4444",
                              }}
                            />
                          ) : (
                            <MapPin size={13} color={logoGreen} />
                          )}
                        </View>
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <Text
                            style={[
                              styles.mapSearchItemTitle,
                              { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
                            ]}
                            numberOfLines={1}
                          >
                            {item.type === "barangay" ? `Brgy. ${item.barangay || item.name}` : item.name}
                          </Text>
                          <Text
                            style={[
                              styles.mapSearchItemSub,
                              { color: isDarkMode ? "#94A3B8" : "#64748B" },
                            ]}
                            numberOfLines={1}
                          >
                            {item.city}
                            {item.province ? ` • ${item.province}` : ""}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.mapSearchItemBadge,
                            {
                              backgroundColor:
                                item.type === "barangay"
                                  ? "rgba(239, 68, 68, 0.1)"
                                  : "rgba(16, 185, 129, 0.1)",
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "800",
                              color: item.type === "barangay" ? "#EF4444" : logoGreen,
                            }}
                          >
                            {item.type === "barangay" ? "Barangay" : "City"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* QUICK BARANGAY SELECTOR CHIPS WITH RED DOT PINPOINT */}
              {barangayMarkers.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.hubScrollContainer}
                  contentContainerStyle={styles.hubScrollContent}
                >
                  {barangayMarkers.map((b) => {
                    const isPinned =
                      pinnedBarangay &&
                      (pinnedBarangay.barangay?.toLowerCase() === b.barangay.toLowerCase() ||
                        pinnedBarangay.formattedTitle?.toLowerCase().includes(b.barangay.toLowerCase()));
                    return (
                      <TouchableOpacity
                        key={b.id}
                        onPress={() => handleCheckAndPromptDefaultLocation(b)}
                        style={[
                          styles.hubPill,
                          isPinned && styles.hubPillActive,
                          { flexDirection: "row", alignItems: "center" },
                        ]}
                        activeOpacity={0.75}
                      >
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 4,
                            backgroundColor: isPinned ? "#FFFFFF" : "#EF4444",
                            marginRight: 5,
                            borderWidth: 1,
                            borderColor: isPinned ? "#EF4444" : "#FFFFFF",
                          }}
                        />
                        <Text style={[styles.hubPillText, isPinned && styles.hubPillTextActive]}>
                          {b.barangay}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* mapcn MAP CONTAINER */}
              <View style={styles.staticMapContainer}>
                {!isMapMaximized && (
                  <MapcnMap
                    center={pinnedBarangay ? [pinnedBarangay.lng, pinnedBarangay.lat] : currentMapCenter}
                    zoom={9}
                    markers={[]}
                    activeLocation={selectedLocation}
                    pinnedBarangay={pinnedBarangay}
                    onPinBarangay={handleCheckAndPromptDefaultLocation}
                    onMarkerPress={(cityName) => cityName && handleCheckAndPromptDefaultLocation(cityName)}
                    onSelectLocation={(cityName) => cityName && handleCheckAndPromptDefaultLocation(cityName)}
                    cardContainer={false}
                    height={235}
                    style={{ width: "100%", height: 235 }}
                  />
                )}

                {/* Tap to Maximize Map Banner on Map */}
                <TouchableOpacity
                  onPress={() => setIsMapMaximized(true)}
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.90)" : "rgba(255, 255, 255, 0.94)",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1.2,
                    borderColor: logoGreen,
                    zIndex: 50,
                  }}
                  activeOpacity={0.8}
                >
                  <Maximize2 size={12} color={logoGreen} style={{ marginRight: 5 }} />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: logoGreen }}>Tap to Maximize Map</Text>
                </TouchableOpacity>

                {/* Floating Map Controls */}
                <View style={styles.floatingMapControls}>
                  {userHometown && selectedLocation !== userHometown ? (
                    <TouchableOpacity
                      onPress={() => setSelectedLocation(userHometown)}
                      activeOpacity={0.85}
                      style={[styles.floatingPillBtn, { borderColor: logoGreen }]}
                    >
                      <Home size={13} color={logoGreen} style={{ marginRight: 5 }} />
                      <Text style={styles.floatingPillText}>{userHometown}</Text>
                    </TouchableOpacity>
                  ) : null}

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

                  {/* Press to Maximize Map pill */}
                  <TouchableOpacity
                    onPress={() => setIsMapMaximized(true)}
                    activeOpacity={0.85}
                    style={[styles.floatingPillBtn, { borderColor: logoGreen }]}
                  >
                    <Maximize2 size={13} color={logoGreen} style={{ marginRight: 5 }} />
                    <Text style={styles.floatingPillText}>Maximize</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* PINNED EXACT BARANGAY BANNER */}
              {pinnedBarangay ? (
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
                      Exact Barangay: <Text style={{ fontWeight: "900", color: logoGreen }}>{pinnedBarangay.formattedTitle || `Brgy. ${pinnedBarangay.barangay}, ${pinnedBarangay.city}`}</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setPinnedBarangay(null);
                      AsyncStorage.removeItem("ms_pinned_barangay").catch(() => {});
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: isDarkMode ? "#94A3B8" : "#64748B" }}>
                      Clear Pin
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

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

      {/* MAXIMIZED FULLSCREEN INTERACTIVE MAP MODAL */}
      <Modal
        visible={isMapMaximized}
        animationType="slide"
        onRequestClose={() => setIsMapMaximized(false)}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1, backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC" }}>
          {/* Top Bar with Search Tab & Minimize button */}
          <View
            style={[
              styles.maximizedTopBar,
              {
                backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                borderBottomColor: isDarkMode ? "#334155" : "#E2E8F0",
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 8 }}>
                <Compass size={18} color={logoGreen} style={{ marginRight: 6 }} />
                <Text style={[styles.maximizedTitle, { color: isDarkMode ? "#F8FAFC" : "#0F172A" }]}>
                  Interactive Philippine Map
                </Text>
              </View>

              {/* Minimize Map Button */}
              <TouchableOpacity
                onPress={() => setIsMapMaximized(false)}
                style={[styles.minimizeBtn, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}
                activeOpacity={0.8}
              >
                <Minimize2 size={14} color={isDarkMode ? "#F8FAFC" : "#0F172A"} style={{ marginRight: 5 }} />
                <Text style={[styles.minimizeBtnText, { color: isDarkMode ? "#F8FAFC" : "#0F172A" }]}>
                  Minimize
                </Text>
              </TouchableOpacity>
            </View>

            {/* SEARCH TAB AT THE TOP OF MAXIMIZED MAP */}
            <View
              style={[
                styles.mapSearchBox,
                {
                  backgroundColor: isDarkMode ? "#0F172A" : "#F1F5F9",
                  borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                  marginBottom: mapSearchResults.length > 0 ? 6 : 0,
                },
              ]}
            >
              <Search size={16} color={logoGreen} style={{ marginRight: 8 }} />
              <TextInput
                style={[
                  styles.mapSearchInput,
                  { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
                ]}
                placeholder="Search any barangay, municipality, or city..."
                placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                value={mapSearchQuery}
                onChangeText={setMapSearchQuery}
                autoCorrect={false}
              />
              {isSearchingMap ? (
                <ActivityIndicator size="small" color={logoGreen} style={{ marginLeft: 6 }} />
              ) : mapSearchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    setMapSearchQuery("");
                    setMapSearchResults([]);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={15} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Search Suggestions Dropdown in Maximized Map */}
            {mapSearchResults.length > 0 && (
              <View
                style={[
                  styles.mapSearchDropdown,
                  {
                    backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                    borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                  },
                ]}
              >
                <ScrollView style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                  {mapSearchResults.map((item, idx) => (
                    <TouchableOpacity
                      key={`max-${item.name}-${idx}`}
                      onPress={() => handleSelectSearchResult(item)}
                      style={[
                        styles.mapSearchItemRow,
                        { borderBottomColor: isDarkMode ? "#334155" : "#F1F5F9" },
                        idx === mapSearchResults.length - 1 && { borderBottomWidth: 0 },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.mapSearchItemIcon,
                          {
                            backgroundColor:
                              item.type === "barangay"
                                ? "rgba(239, 68, 68, 0.12)"
                                : "rgba(16, 185, 129, 0.12)",
                          },
                        ]}
                      >
                        {item.type === "barangay" ? (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "#EF4444",
                            }}
                          />
                        ) : (
                          <MapPin size={13} color={logoGreen} />
                        )}
                      </View>
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text
                          style={[
                            styles.mapSearchItemTitle,
                            { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.type === "barangay" ? `Brgy. ${item.barangay || item.name}` : item.name}
                        </Text>
                        <Text
                          style={[
                            styles.mapSearchItemSub,
                            { color: isDarkMode ? "#94A3B8" : "#64748B" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.city}
                          {item.province ? ` • ${item.province}` : ""}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.mapSearchItemBadge,
                          {
                            backgroundColor:
                              item.type === "barangay"
                                ? "rgba(239, 68, 68, 0.1)"
                                : "rgba(16, 185, 129, 0.1)",
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "800",
                            color: item.type === "barangay" ? "#EF4444" : logoGreen,
                          }}
                        >
                          {item.type === "barangay" ? "Barangay" : "City"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Quick barangay chips in maximized view */}
            {barangayMarkers.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
                contentContainerStyle={{ paddingRight: 10 }}
              >
                {barangayMarkers.map((b) => {
                  const isPinned =
                    pinnedBarangay &&
                    (pinnedBarangay.barangay?.toLowerCase() === b.barangay.toLowerCase() ||
                      pinnedBarangay.formattedTitle?.toLowerCase().includes(b.barangay.toLowerCase()));
                  return (
                    <TouchableOpacity
                      key={`max-b-${b.id}`}
                      onPress={() => handleCheckAndPromptDefaultLocation(b)}
                      style={[
                        styles.hubPill,
                        isPinned && styles.hubPillActive,
                        { flexDirection: "row", alignItems: "center" },
                      ]}
                      activeOpacity={0.75}
                    >
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: isPinned ? "#FFFFFF" : "#EF4444",
                          marginRight: 5,
                          borderWidth: 1,
                          borderColor: isPinned ? "#EF4444" : "#FFFFFF",
                        }}
                      />
                      <Text style={[styles.hubPillText, isPinned && styles.hubPillTextActive]}>
                        {b.barangay}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Full-screen Map */}
          <View style={{ flex: 1, width: "100%", position: "relative" }}>
            <MapcnMap
              center={pinnedBarangay ? [pinnedBarangay.lng, pinnedBarangay.lat] : currentMapCenter}
              zoom={pinnedBarangay ? 14 : 10}
              markers={[]}
              activeLocation={selectedLocation}
              pinnedBarangay={pinnedBarangay}
              onPinBarangay={handleCheckAndPromptDefaultLocation}
              onMarkerPress={(cityName) => cityName && handleCheckAndPromptDefaultLocation(cityName)}
              onSelectLocation={(cityName) => cityName && handleCheckAndPromptDefaultLocation(cityName)}
              cardContainer={false}
              height="100%"
              style={{ width: "100%", height: "100%" }}
            />

            {/* Floating Map Controls in Maximized Map */}
            <View style={styles.floatingMapControls}>
              {pinnedBarangay ? (
                <TouchableOpacity
                  onPress={() => {
                    setPinnedBarangay({ ...pinnedBarangay });
                  }}
                  activeOpacity={0.85}
                  style={[styles.floatingPillBtn, { borderColor: "#EF4444" }]}
                >
                  <MapPin size={13} color="#EF4444" style={{ marginRight: 5 }} />
                  <Text style={[styles.floatingPillText, { color: isDarkMode ? "#F8FAFC" : "#0F172A", fontWeight: "800" }]}>
                    Go to Pin
                  </Text>
                </TouchableOpacity>
              ) : null}

              {userHometown && selectedLocation !== userHometown ? (
                <TouchableOpacity
                  onPress={() => setSelectedLocation(userHometown)}
                  activeOpacity={0.85}
                  style={[styles.floatingPillBtn, { borderColor: logoGreen }]}
                >
                  <Home size={13} color={logoGreen} style={{ marginRight: 5 }} />
                  <Text style={styles.floatingPillText}>{userHometown}</Text>
                </TouchableOpacity>
              ) : null}

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

            {/* Floating Pinned Location Guide Pill */}
            <View style={{ position: "absolute", top: 12, alignSelf: "center", zIndex: 100 }}>
              <TouchableOpacity
                onPress={() => {
                  if (pinnedBarangay) {
                    setPinnedBarangay({ ...pinnedBarangay });
                  }
                }}
                activeOpacity={pinnedBarangay ? 0.8 : 1}
                style={[styles.floatingPillBtn, { borderColor: logoGreen, paddingVertical: 7, paddingHorizontal: 12 }]}
              >
                {pinnedBarangay ? (
                  <>
                    <CheckCircle2 size={13} color={logoGreen} style={{ marginRight: 5 }} />
                    <Text style={{ fontSize: 12, fontWeight: "800", color: isDarkMode ? "#F8FAFC" : "#0F172A" }}>
                      📍 Pinned: <Text style={{ color: logoGreen }}>{pinnedBarangay.formattedTitle || `Brgy. ${pinnedBarangay.barangay}`}</Text>
                    </Text>
                  </>
                ) : (
                  <>
                    <Navigation size={12} color={logoGreen} style={{ marginRight: 5 }} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: isDarkMode ? "#F8FAFC" : "#0F172A" }}>
                      Tap anywhere to pin your exact Barangay
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Set as New Default Location Confirmation In-Modal Overlay */}
            {showDefaultLocationPrompt && pendingDefaultLocation && (
              <View style={promptStyles.overlay}>
                <View
                  style={[
                    promptStyles.card,
                    {
                      backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                      borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                    },
                  ]}
                >
                  {/* Top Icon Badge */}
                  <View
                    style={[
                      promptStyles.iconBadge,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(16, 185, 129, 0.2)"
                          : "#ECFDF5",
                      },
                    ]}
                  >
                    <MapPin size={26} color="#10B981" />
                  </View>

                  <Text
                    style={[
                      promptStyles.title,
                      { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
                    ]}
                  >
                    Set as Default Location?
                  </Text>

                  <Text
                    style={[
                      promptStyles.description,
                      { color: isDarkMode ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    Would you like to set{" "}
                    <Text
                      style={{
                        fontWeight: "800",
                        color: isDarkMode ? "#34D399" : "#059669",
                      }}
                    >
                      {pendingDefaultLocation?.formattedTitle ||
                        (pendingDefaultLocation?.barangay && pendingDefaultLocation?.city
                          ? `Brgy. ${pendingDefaultLocation.barangay}, ${pendingDefaultLocation.city}`
                          : pendingDefaultLocation?.city ||
                            (typeof pendingDefaultLocation === "string"
                              ? pendingDefaultLocation
                              : "this location"))}
                    </Text>{" "}
                    as your new default location?
                  </Text>

                  <View
                    style={[
                      promptStyles.infoPill,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(15, 23, 42, 0.6)"
                          : "#F8FAFC",
                        borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                      },
                    ]}
                  >
                    <CheckCircle2 size={13} color="#10B981" style={{ marginRight: 6 }} />
                    <Text
                      style={[
                        promptStyles.infoPillText,
                        { color: isDarkMode ? "#94A3B8" : "#64748B" },
                      ]}
                    >
                      This will automatically reflect in your Settings tab
                    </Text>
                  </View>

                  <View style={promptStyles.actionsColumn}>
                    <TouchableOpacity
                      style={promptStyles.primaryBtn}
                      onPress={() => handleConfirmDefaultLocation()}
                      activeOpacity={0.85}
                    >
                      <Text style={promptStyles.primaryBtnText}>
                        Yes, Set as Default
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        promptStyles.secondaryBtn,
                        {
                          borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                          backgroundColor: isDarkMode ? "#0F172A" : "#F1F5F9",
                        },
                      ]}
                      onPress={handleRejectDefaultLocation}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          promptStyles.secondaryBtnText,
                          { color: isDarkMode ? "#94A3B8" : "#64748B" },
                        ]}
                      >
                        Keep Temporary
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <LoadingModal
        visible={isFetchingRecipe || isGeneratingAIPlan}
        type={isFetchingRecipe ? "recipe" : "meal"}
        title={isFetchingRecipe ? "Crafting Custom Recipe" : "Generating AI Daily Meal Plan"}
        subtitle={isFetchingRecipe ? "Vita AI is personalizing your nutrition" : "Vita AI is calculating your optimal daily macros"}
      />

      {/* Set as New Default Location Confirmation Modal (For Compact View) */}
      <Modal
        visible={showDefaultLocationPrompt && !isMapMaximized}
        transparent={true}
        animationType="fade"
        onRequestClose={handleRejectDefaultLocation}
      >
        <View style={promptStyles.overlay}>
          <View
            style={[
              promptStyles.card,
              {
                backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#E2E8F0",
              },
            ]}
          >
            {/* Top Icon Badge */}
            <View
              style={[
                promptStyles.iconBadge,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(16, 185, 129, 0.2)"
                    : "#ECFDF5",
                },
              ]}
            >
              <MapPin size={26} color="#10B981" />
            </View>

            <Text
              style={[
                promptStyles.title,
                { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
              ]}
            >
              Set as Default Location?
            </Text>

            <Text
              style={[
                promptStyles.description,
                { color: isDarkMode ? "#94A3B8" : "#64748B" },
              ]}
            >
              Would you like to set{" "}
              <Text
                style={{
                  fontWeight: "800",
                  color: isDarkMode ? "#34D399" : "#059669",
                }}
              >
                {pendingDefaultLocation?.formattedTitle ||
                  (pendingDefaultLocation?.barangay && pendingDefaultLocation?.city
                    ? `Brgy. ${pendingDefaultLocation.barangay}, ${pendingDefaultLocation.city}`
                    : pendingDefaultLocation?.city ||
                      (typeof pendingDefaultLocation === "string"
                        ? pendingDefaultLocation
                        : "this location"))}
              </Text>{" "}
              as your new default location?
            </Text>

            <View
              style={[
                promptStyles.infoPill,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(15, 23, 42, 0.6)"
                    : "#F8FAFC",
                  borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                },
              ]}
            >
              <CheckCircle2 size={13} color="#10B981" style={{ marginRight: 6 }} />
              <Text
                style={[
                  promptStyles.infoPillText,
                  { color: isDarkMode ? "#94A3B8" : "#64748B" },
                ]}
              >
                This will automatically reflect in your Settings tab
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={promptStyles.actionsColumn}>
              <TouchableOpacity
                onPress={() => handleConfirmDefaultLocation()}
                style={promptStyles.primaryBtn}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={promptStyles.primaryBtnText}>Yes, Set as Default</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRejectDefaultLocation}
                style={[
                  promptStyles.secondaryBtn,
                  {
                    borderColor: isDarkMode ? "#334155" : "#CBD5E1",
                    backgroundColor: isDarkMode ? "#0F172A" : "#F1F5F9",
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    promptStyles.secondaryBtnText,
                    { color: isDarkMode ? "#CBD5E1" : "#475569" },
                  ]}
                >
                  Keep as Temporary
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    generatePlanButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
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
    hubScrollContainer: {
      marginBottom: 12,
    },
    hubScrollContent: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 2,
    },
    hubPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
      borderWidth: 1.2,
      borderColor: theme?.border || "#E2E8F0",
      backgroundColor: theme?.surface || "#FFFFFF",
    },
    hubPillActive: {
      backgroundColor: logoGreen,
      borderColor: logoGreen,
    },
    hubPillText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme?.textSecondary || "#64748B",
    },
    hubPillTextActive: {
      color: "#FFFFFF",
      fontWeight: "800",
    },
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
    maximizeMapButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(16, 185, 129, 0.12)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
    },
    mapSearchBox: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 10 : 7,
      marginBottom: 8,
    },
    mapSearchInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      padding: 0,
    },
    mapSearchDropdown: {
      borderWidth: 1.5,
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 8,
      zIndex: 9999,
    },
    mapSearchItemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    mapSearchItemIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    mapSearchItemTitle: {
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 2,
    },
    mapSearchItemSub: {
      fontSize: 11,
    },
    mapSearchItemBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    maximizedMapOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 9999,
      elevation: 9999,
      flexDirection: "column",
    },
    maximizedTopBar: {
      paddingTop: Platform.OS === "ios" ? 54 : 38,
      paddingHorizontal: 16,
      paddingBottom: 10,
      borderBottomWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,
      zIndex: 100,
    },
    maximizedTitle: {
      fontSize: 17,
      fontWeight: "900",
      letterSpacing: -0.3,
    },
    minimizeBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
    },
    minimizeBtnText: {
      fontSize: 12,
      fontWeight: "800",
    },
  });

const promptStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 14,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 18,
    width: "100%",
    justifyContent: "center",
  },
  infoPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionsColumn: {
    width: "100%",
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});

