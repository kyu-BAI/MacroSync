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
import { normalizeToCebuLGU } from "../../data/cebuPalengkeMeals";
import { getDynamicPalengkePlan } from "../../data/philippineFoodEngine";
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
  findCebuLGUForCoords,
  getBarangayMarkersForCity,
  searchPhilippineBarangays,
  POPULAR_BARANGAY_COORDINATES,
} from "../../services/barangayGeocodingService";


// Re-export normalizeToCebuLGU for backward compatibility
export { normalizeToCebuLGU };

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");
const logoGreen = "#10b981";
const memoryDailyPlanCache = {};

// High-Fidelity Instant Philippine Recipe Builder (Opens in 0ms without waiting or loading)
function buildInstantRecipe(meal, location = "Cebu City") {
  const title = meal?.title || "Healthy Meal";
  const cal = meal?.calories || meal?.kcal || 500;
  const prot = meal?.proteinNum ? `${meal.proteinNum}g` : (meal?.protein || "35g");
  const carb = meal?.carbsNum ? `${meal.carbsNum}g` : (meal?.carbs || "45g");
  const fat = meal?.fatsNum ? `${meal.fatsNum}g` : (meal?.fats || "14g");

  if (Array.isArray(meal?.ingredients) && meal.ingredients.length > 0 && Array.isArray(meal?.instructions) && meal.instructions.length > 0) {
    return {
      title,
      calories: cal,
      protein: prot,
      carbs: carb,
      fats: fat,
      time: meal.time || "20-25 mins",
      sugar: meal.sugar || "3g",
      sodium: meal.sodium || "280mg",
      ingredients: meal.ingredients,
      instructions: meal.instructions,
    };
  }

  const lowerTitle = title.toLowerCase();
  let ingredients = [];
  let instructions = [];
  let cookingTime = "20-25 mins";

  if (lowerTitle.includes("bangus") || lowerTitle.includes("silog") || lowerTitle.includes("daing")) {
    cookingTime = "20 mins";
    ingredients = [
      "1 medium fresh Bangus (milkfish), butterflied and marinated in garlic & calamansi",
      "1 cup garlic fried brown or white rice (sinangag)",
      "2 native farm eggs, cooked sunny-side up or poached",
      "1 tbsp coconut oil or olive oil for pan-searing",
      "1 medium fresh native tomato, sliced",
      "Salt and freshly ground black pepper to taste",
    ];
    instructions = [
      "Heat coconut oil in a non-stick skillet over medium heat (2-3 mins).",
      "Pan-sear the marinated bangus skin-side down until golden and crisp, then flip gently (8-10 mins).",
      "In the same pan, fry the minced garlic until aromatic, toss in the rice, and stir-fry evenly (4-5 mins).",
      "Cook the eggs to your preferred doneness and plate alongside the warm bangus and sliced fresh tomatoes (3 mins).",
    ];
  } else if (lowerTitle.includes("tinola")) {
    cookingTime = "25-30 mins";
    ingredients = [
      "350g lean chicken breast or thigh, cut into bite-sized portions",
      "1 medium green papaya or chayote (sayote), wedged",
      "1 cup fresh dahon ng sili (chili leaves) or fresh malunggay leaves",
      "1 thumb-sized fresh ginger, thinly julienned",
      "2 cloves garlic and 1 small native onion, minced",
      "2 cups boiled sweet potato mash or steamed rice",
      "3 cups water or light chicken broth, patis (fish sauce) to taste",
    ];
    instructions = [
      "Sauté ginger, garlic, and onions in a light drizzle of oil until fragrant (3 mins).",
      "Add the chicken pieces and sear lightly until the outer layer turns white (5 mins).",
      "Pour in water or broth, bring to a gentle boil, then simmer on low heat until chicken is tender (15 mins).",
      "Add green papaya and cook until tender, stir in fresh malunggay leaves, and turn off heat (3 mins). Serve hot.",
    ];
  } else if (lowerTitle.includes("sinigang")) {
    cookingTime = "30-35 mins";
    ingredients = [
      "350g lean beef sirloin or brisket cut into cubes",
      "1 bundle fresh sitaw (string beans), cut into 2-inch lengths",
      "1 bundle fresh kangkong (water spinach) leaves",
      "1 medium white radish (labanos), sliced",
      "2 ripe native tomatoes, quartered",
      "1 packet natural sampalok (tamarind) sour broth seasoning",
      "1 cup steamed white or brown rice",
    ];
    instructions = [
      "In a pot, bring water to a boil with tomatoes and onions, then add the beef cubes (5 mins).",
      "Simmer covered on low heat until beef is tender and broth is rich (20-25 mins).",
      "Add the sliced radish and sitaw, simmering for 3-4 minutes until crisp-tender.",
      "Stir in the tamarind sour seasoning and fold in the fresh kangkong leaves. Turn off heat and serve warm.",
    ];
  } else if (lowerTitle.includes("smoothie") || lowerTitle.includes("oatmeal") || lowerTitle.includes("shake")) {
    cookingTime = "5-8 mins";
    ingredients = [
      "1/2 cup whole rolled oats",
      "1 scoop quality whey protein isolate (vanilla or chocolate)",
      "2 tbsp natural creamy peanut butter (no added sugar)",
      "1 cup unsweetened soy milk or almond milk",
      "1/2 ripe native banana for potassium and natural creaminess",
      "1/2 cup crushed ice",
    ];
    instructions = [
      "Add the rolled oats, peanut butter, whey protein, and sliced banana into a blender (2 mins).",
      "Pour in the unsweetened milk and add crushed ice.",
      "Blend on high speed for 60-90 seconds until silky smooth and frothy.",
      "Pour into a chilled glass and enjoy immediately as a nutrient-dense recovery meal.",
    ];
  } else if (lowerTitle.includes("tangigue") || lowerTitle.includes("ceviche") || lowerTitle.includes("kinilaw")) {
    cookingTime = "15-20 mins";
    ingredients = [
      `350g fresh Tangigue (Spanish Mackerel) fillet, cubed (locally sourced in ${location})`,
      "1/2 cup fresh tuba coconut vinegar or cane vinegar",
      "1 thumb-sized ginger, peeled and finely minced",
      "1 small red onion, diced",
      "2-3 pieces siling labuyo (bird's eye chili), sliced",
      "1 cup boiled kamote (sweet potato) or steamed garlic rice",
      "1 calamansi, freshly juiced",
      "Salt and freshly ground black pepper to taste",
    ];
    instructions = [
      "Rinse fish cubes in a splash of vinegar to wash, then gently drain (2 mins).",
      "In a glass bowl, combine the fish with fresh vinegar, minced ginger, red onions, and chilies (3 mins).",
      "Season with salt, black pepper, and fresh calamansi juice. Let rest for 10 minutes to marinate.",
      "Serve chilled alongside warm boiled sweet potato or garlic rice for balanced carbs and lean protein.",
    ];
  } else if (lowerTitle.includes("pintos") || lowerTitle.includes("corn") || lowerTitle.includes("buko")) {
    cookingTime = "12-15 mins";
    ingredients = [
      `Fresh native sweet corn or steamed Pintos (specialty of ${location})`,
      "2 farm-fresh native eggs, hard-boiled or poached for lean protein",
      "1 glass chilled fresh buko (young coconut) water",
      "Handful of roasted native peanuts or grilled chicken breast strips",
    ];
    instructions = [
      "Steam or warm the native sweet corn or pintos until tender and aromatic (5-8 mins).",
      "Boil or poach the native eggs to pair with the clean complex carbs (6 mins).",
      "Plate together and enjoy with fresh coconut water for natural hydration and electrolytes.",
    ];
  } else {
    cookingTime = "20-25 mins";
    ingredients = [
      `300g quality lean protein (chicken breast, lean beef, or fresh fish from ${location})`,
      "1 cup steamed jasmine or brown rice",
      "1 cup fresh local greens (malunggay, kangkong, or pechay)",
      "2 cloves garlic, 1 small onion, and 1 fresh tomato, diced",
      "1 tbsp extra virgin olive oil or coconut oil",
      "Sea salt and freshly ground black pepper to taste",
    ];
    instructions = [
      "Prep and season your protein with sea salt, pepper, and fresh calamansi juice (3 mins).",
      "Heat oil in a skillet and gently sear the protein until golden and cooked through (10-12 mins).",
      "Sauté garlic, onions, and local greens in the same pan until vibrant and tender (3-4 mins).",
      "Plate the lean protein with warm steamed rice and fresh greens for optimal recovery and satiety.",
    ];
  }

  return {
    title,
    calories: cal,
    protein: prot,
    carbs: carb,
    fats: fat,
    time: cookingTime,
    sugar: meal?.sugar || "3g",
    sodium: meal?.sodium || "280mg",
    ingredients,
    instructions,
  };
}

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

    const resolvedCity = targetData.city || (typeof targetData === "string" ? targetData : "") || "";
    const resolvedProvince = targetData.province || "";
    const resolvedBarangay = targetData.barangay || "";

    const resolvedTitle =
      resolvedCity
        ? (resolvedProvince ? `${resolvedCity}, ${resolvedProvince}` : resolvedCity)
        : (targetData.formattedTitle || (typeof targetData === "string" ? targetData : ""));

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

      const city = targetData.city || (typeof targetData === "string" ? targetData : "") || "";
      const province = targetData.province || "";
      const barangay = targetData.barangay || "";

      const title =
        city
          ? (province ? `${city}, ${province}` : city)
          : (targetData.formattedTitle || (typeof targetData === "string" ? targetData : ""));

      // Preserve exact coordinates from touch/tap
      let resolvedLat = typeof locData?.lat === "number" ? locData.lat : targetData.lat;
      let resolvedLng = typeof locData?.lng === "number" ? locData.lng : targetData.lng;

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

      // Apply pin locally so radar and map reflect it right away
      setPinnedBarangay(standardizedPinned);
      AsyncStorage.setItem("ms_pinned_barangay", JSON.stringify(standardizedPinned)).catch(() => {});

      if (city) {
        const norm = normalizeToPhilippineLocation(city) || normalizeToCebuLGU(city) || city;
        setSelectedLocation(norm);
      }

      setPendingDefaultLocation(standardizedPinned);
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
      "Permanent Address Updated",
      `Your permanent address has been set to ${resolvedCity || fullTitle}. This is now reflected in your profile and Settings tab.`
    );
  }, [pendingDefaultLocation, pinnedBarangay, userProfile, setUserProfile, userId, showAlert]);

  // User chooses to use this searched/pinned location as a temporary address
  const handleSetAsTemporaryLocation = useCallback((explicitTarget) => {
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

    const resolvedCity = targetData.city || (typeof targetData === "string" ? targetData : "") || "";
    if (resolvedCity) {
      const norm = normalizeToPhilippineLocation(resolvedCity) || normalizeToCebuLGU(resolvedCity) || resolvedCity;
      setSelectedLocation(norm);
    }

    const pinObj = {
      barangay: targetData.barangay || "",
      city: resolvedCity,
      province: targetData.province || "",
      formattedTitle: targetData.formattedTitle || resolvedCity,
      lat: targetData.lat,
      lng: targetData.lng,
    };
    setPinnedBarangay(pinObj);
    AsyncStorage.setItem("ms_pinned_barangay", JSON.stringify(pinObj)).catch(() => {});

    setShowDefaultLocationPrompt(false);
    setPendingDefaultLocation(null);

    showAlert(
      "Temporary Address Set",
      `Viewing ${resolvedCity} as a temporary address. Your permanent address remains ${userHometown || "your Step 3 address"}.`
    );
  }, [pendingDefaultLocation, pinnedBarangay, userHometown, showAlert]);

  const handleRejectDefaultLocation = useCallback(() => {
    setShowDefaultLocationPrompt(false);
    setPendingDefaultLocation(null);
  }, []);

  // Live autocomplete search across Philippine municipalities and cities only
  useEffect(() => {
    let isMounted = true;
    if (!mapSearchQuery || mapSearchQuery.trim().length < 2) {
      setMapSearchResults([]);
      setIsSearchingMap(false);
      return;
    }

    const cleanQ = mapSearchQuery.trim();
    setIsSearchingMap(true);

    const cityMatches = searchPhilippineLocations(cleanQ)
      .slice(0, 120)
      .map((c) => ({
        type: "city",
        name: c.name,
        city: c.name,
        province: c.province || "",
        display: c.name,
        lat: c.lat,
        lng: c.lng,
      }));

    if (isMounted) {
      setMapSearchResults(cityMatches);
      setIsSearchingMap(false);
    }

    return () => {
      isMounted = false;
    };
  }, [mapSearchQuery]);

  const handleSelectSearchResult = useCallback(
    (item) => {
      Keyboard.dismiss();
      setMapSearchQuery("");
      setMapSearchResults([]);

      const cityName = item.city || item.name;
      const targetData = {
        city: cityName,
        formattedTitle: cityName,
        province: item.province || "",
        lat: item.lat,
        lng: item.lng,
      };

      setPendingDefaultLocation(targetData);
      setShowDefaultLocationPrompt(true);
    },
    []
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

        const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;
        const parsedOnb = onboardingData ? JSON.parse(onboardingData) : null;
        const parsedDefLoc = defaultLocData ? JSON.parse(defaultLocData) : null;
        const parsedCache = dashboardCache ? JSON.parse(dashboardCache)?.data : null;

        const allergies = [userProfile, parsedProfile, parsedOnb, parsedCache?.profile].find(
          (p) => Array.isArray(p?.allergies) && p.allergies.length > 0
        )?.allergies;
        if (allergies) setUserAllergies(allergies);

        // Permanent address strictly resolved from Step 3 onboarding or profile
        const candidateTown = [userProfile, parsedDefLoc, parsedOnb, parsedCache?.profile, parsedProfile]
          .map((p) => p?.structuredLocation?.city || p?.structured_location?.city || p?.city || p?.address)
          .find(Boolean);

        if (candidateTown) {
          const chosenTown = normalizeToPhilippineLocation(candidateTown) || normalizeToCebuLGU(candidateTown) || candidateTown;
          setUserHometown(chosenTown);
          setSelectedLocation(chosenTown);
          if (__DEV__) console.log("[DietRecipes] 📍 Resolved user permanent address from Step 3:", chosenTown);

          // Only pin: 
          // 1) What was searched and explicitly chosen as temporary/permanent
          // 2) Or their permanent address based on Step 3 input
          let pinToUse = null;
          if (storedBarangay) {
            try {
              const parsedB = JSON.parse(storedBarangay);
              if (parsedB && parsedB.city && typeof parsedB.lat === "number" && typeof parsedB.lng === "number") {
                pinToUse = {
                  city: parsedB.city,
                  formattedTitle: parsedB.city,
                  lat: parsedB.lat,
                  lng: parsedB.lng,
                  barangay: "",
                };
              }
            } catch (_) {}
          }

          if (!pinToUse) {
            const cMatches = searchPhilippineLocations(chosenTown);
            const pLat = (cMatches && cMatches[0]?.lat) || 10.3157;
            const pLng = (cMatches && cMatches[0]?.lng) || 123.8854;
            pinToUse = {
              city: chosenTown,
              formattedTitle: chosenTown,
              lat: pLat,
              lng: pLng,
              barangay: "",
            };
          }
          setPinnedBarangay(pinToUse);
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
    if (activeDietTab === "EXPLORE" && userHometown && !selectedLocation) {
      setSelectedLocation(userHometown);
    }
  }, [activeDietTab, userHometown, selectedLocation]);

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
        return ensurePlanWithinTargetCalories(rawResolved, targetCalories);
      });
    },
    [targetCalories]
  );

  useEffect(() => {
    if (Array.isArray(sessionDailyPlan) && sessionDailyPlan.length > 0) {
      setDailyPlanState((prev) => (prev === sessionDailyPlan ? prev : sessionDailyPlan));
      memoryDailyPlanCache[userId || "default"] = sessionDailyPlan;
    }
  }, [sessionDailyPlan, userId]);

  useEffect(() => {
    if (Array.isArray(dailyPlan) && dailyPlan.length > 0) {
      memoryDailyPlanCache[userId || "default"] = dailyPlan;
      if (setSessionDailyPlan && sessionDailyPlan !== dailyPlan) {
        setSessionDailyPlan(dailyPlan);
      }
    }
  }, [dailyPlan, userId, setSessionDailyPlan, sessionDailyPlan]);

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
        const fallbackPlan = getFallbackLocalPlan();
        if (fallbackPlan && fallbackPlan.length > 0) {
          setDailyPlan((prev) => {
            if (Array.isArray(prev) && prev.length > 0 && !isManualAction) return prev;
            return fallbackPlan;
          });
          AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              userId: targetId,
              date: todayStr,
              goalWeight: String(goalWeight || ""),
              goal: String(userGoal || ""),
              meals: fallbackPlan,
            })
          ).catch(() => {});
        }
      } catch (e) {
        if (__DEV__) console.log("[DietRecipes] ℹ️ Using local dynamic plan fallback:", e?.message || e);
        const fallbackPlan = getFallbackLocalPlan();
        if (fallbackPlan && fallbackPlan.length > 0) {
          setDailyPlan((prev) => {
            if (Array.isArray(prev) && prev.length > 0 && !isManualAction) return prev;
            return fallbackPlan;
          });
        }
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

  // View recipe modal & instant rendering (0ms without loading spinner)
  const handleViewRecipe = useCallback(
    (meal) => {
      if (!meal) return;
      const cacheKey = `${(meal.title || "").trim().toLowerCase()}_${selectedLocation || userHometown || "Cebu City"}`;
      const recipeData =
        meal.instructions && meal.ingredients
          ? meal
          : recipeCacheRef.current[cacheKey] || buildInstantRecipe(meal, selectedLocation || userHometown || "Cebu City");

      recipeCacheRef.current[cacheKey] = recipeData;
      setSelectedRecipe(recipeData);
      setShowRecipeModal(true);
    },
    [selectedLocation, userHometown]
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

  // High-speed GPS location handler (Instant cached fix + offline boundary resolution for whole municipality or city)
  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      // 1. Check or request permission with minimal latency
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }
      if (status !== "granted") {
        showAlert("Location Permission", "Please enable location access in your device settings to use Locate Me.");
        return;
      }

      // 2. ULTRA-FAST GPS FIX: Check last known position first (instant, <50ms)
      let pos = null;
      try {
        pos = await Location.getLastKnownPositionAsync({ maxAge: 600000 }); // Cached within 10 mins
      } catch (_) {}

      // If no fresh cached position, fetch with Balanced accuracy (~300-800ms) with a 2.5s safety timeout
      if (!pos || !pos.coords) {
        try {
          pos = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Location timeout")), 2500)),
          ]);
        } catch (_) {
          // Fallback: grab any cached position or lowest accuracy quickly
          try {
            pos = await Location.getLastKnownPositionAsync();
          } catch (_) {}
          if (!pos || !pos.coords) {
            pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
          }
        }
      }

      if (!pos || !pos.coords) {
        throw new Error("Unable to obtain GPS coordinates");
      }

      const { latitude, longitude } = pos.coords;

      // 3. LIGHTNING-FAST MUNICIPALITY/CITY RESOLUTION
      // Step A: Instant local boundary math (< 1ms, zero network)
      let detectedCity = findCebuLGUForCoords(latitude, longitude);

      // Step B: Native device OS reverse geocoder (~150ms) if outside Cebu bounds
      let resolvedProvince = "";
      if (!detectedCity) {
        try {
          const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geo) {
            detectedCity = geo.city || geo.subregion || geo.district;
            resolvedProvince = geo.region || geo.subregion || "";
          }
        } catch (_) {}
      }

      // Step C: Fallback to reverseGeocodeToBarangay only if still undetermined
      if (!detectedCity) {
        try {
          const resolved = await reverseGeocodeToBarangay(latitude, longitude);
          detectedCity = resolved?.city;
          resolvedProvince = resolved?.province || resolvedProvince;
        } catch (_) {}
      }

      const normalizedCity =
        normalizeToPhilippineLocation(detectedCity) ||
        normalizeToCebuLGU(detectedCity) ||
        detectedCity ||
        "Cebu City";

      const cMatches = searchPhilippineLocations(normalizedCity);
      const targetLat = (cMatches && cMatches[0]?.lat) || latitude;
      const targetLng = (cMatches && cMatches[0]?.lng) || longitude;
      const targetProvince = (cMatches && cMatches[0]?.province) || resolvedProvince || "";

      const locTarget = {
        lat: targetLat,
        lng: targetLng,
        city: normalizedCity,
        barangay: "", // Whole municipality or city only
        formattedTitle: normalizedCity,
        province: targetProvince,
      };

      // Prompt user whether to use this detected municipality/city as temporary or make it permanent
      setPendingDefaultLocation(locTarget);
      setShowDefaultLocationPrompt(true);

      if (__DEV__) console.log("[DietRecipes] ⚡ Fast GPS located municipality/city:", normalizedCity);
    } catch (err) {
      showAlert("Location Error", "Could not determine your location. Please ensure GPS / Location is turned on.");
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
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps={mapSearchResults.length > 0 ? "always" : "handled"}
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
                {tabKey === "PLAN" ? "Daily Plan" : "Local Dishes"}
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
                  placeholder="Search municipality or city..."
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
                  <ScrollView
                    style={{ maxHeight: 250 }}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={true}
                    persistentScrollbar={true}
                    bounces={true}
                  >
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
                              backgroundColor: "rgba(16, 185, 129, 0.12)",
                            },
                          ]}
                        >
                          <MapPin size={13} color={logoGreen} />
                        </View>
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <Text
                            style={[
                              styles.mapSearchItemTitle,
                              { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
                            ]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text
                            style={[
                              styles.mapSearchItemSub,
                              { color: isDarkMode ? "#94A3B8" : "#64748B" },
                            ]}
                            numberOfLines={1}
                          >
                            {item.province ? `${item.province} • ` : ""}Philippines
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.mapSearchItemBadge,
                            {
                              backgroundColor: "rgba(16, 185, 129, 0.1)",
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "800",
                              color: logoGreen,
                            }}
                          >
                            {item.name.toLowerCase().includes("city") ? "City" : "Municipality"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {mapSearchResults.length > 4 && (
                      <View
                        style={{
                          paddingVertical: 7,
                          alignItems: "center",
                          backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "#F8FAFC",
                          borderTopWidth: 1,
                          borderTopColor: isDarkMode ? "#334155" : "#F1F5F9",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10.5,
                            fontWeight: "700",
                            color: isDarkMode ? "#94A3B8" : "#64748B",
                          }}
                        >
                          Scroll for more matching cities & municipalities ({mapSearchResults.length} found)
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}



              {/* mapcn MAP CONTAINER */}
              <View style={styles.staticMapContainer}>
                {!isMapMaximized && (
                  <MapcnMap
                    center={pinnedBarangay ? [pinnedBarangay.lng, pinnedBarangay.lat] : currentMapCenter}
                    zoom={10}
                    markers={[]}
                    activeLocation={selectedLocation}
                    pinnedBarangay={pinnedBarangay}
                    cardContainer={false}
                    height={235}
                    style={{ width: "100%", height: 235 }}
                  />
                )}

                {/* Floating Map Controls */}
                <View style={styles.floatingMapControls}>
                  <View style={styles.floatingLeftActions}>
                    {userHometown && selectedLocation !== userHometown ? (
                      <TouchableOpacity
                        onPress={() => setSelectedLocation(userHometown)}
                        activeOpacity={0.85}
                        style={{
                          backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                          borderRadius: 50,
                          paddingVertical: 8,
                          paddingHorizontal: 13,
                          flexDirection: "row",
                          alignItems: "center",
                          borderWidth: 1.5,
                          borderColor: logoGreen,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15,
                          shadowRadius: 3,
                          elevation: 4,
                          maxWidth: 170,
                        }}
                      >
                        <Home size={13} color={logoGreen} style={{ marginRight: 5 }} />
                        <Text style={{ fontSize: 11.5, fontWeight: "800", color: logoGreen }} numberOfLines={1}>
                          Home: {userHometown}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {selectedLocation && userHometown && selectedLocation !== userHometown ? (
                      <TouchableOpacity
                        onPress={() =>
                          handleConfirmDefaultLocation({
                            city: selectedLocation,
                            formattedTitle: selectedLocation,
                            lat: pinnedBarangay?.lat,
                            lng: pinnedBarangay?.lng,
                          })
                        }
                        activeOpacity={0.85}
                        style={{
                          backgroundColor: logoGreen,
                          borderRadius: 50,
                          paddingVertical: 8,
                          paddingHorizontal: 13,
                          flexDirection: "row",
                          alignItems: "center",
                          borderWidth: 1.5,
                          borderColor: logoGreen,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          elevation: 5,
                          maxWidth: 170,
                        }}
                      >
                        <CheckCircle2 size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                        <Text style={{ fontSize: 11.5, fontWeight: "900", color: "#FFFFFF" }} numberOfLines={1}>
                          Make Permanent
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    onPress={handleLocateMe}
                    activeOpacity={0.85}
                    style={styles.floatingLocateBtn}
                    accessibilityLabel="Locate Me"
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color={logoGreen} />
                    ) : (
                      <LocateFixed size={18} color={logoGreen} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* PINNED LOCATION STATUS BANNER */}
              {pinnedBarangay || selectedLocation ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 8,
                    paddingHorizontal: 13,
                    paddingVertical: 9,
                    borderRadius: 14,
                    backgroundColor: selectedLocation === userHometown
                      ? (isDarkMode ? "rgba(6, 78, 59, 0.25)" : "#ECFDF5")
                      : (isDarkMode ? "rgba(120, 53, 15, 0.25)" : "#FFFBEB"),
                    borderWidth: 1.2,
                    borderColor: selectedLocation === userHometown
                      ? (isDarkMode ? "rgba(16, 185, 129, 0.4)" : "#A7F3D0")
                      : (isDarkMode ? "rgba(245, 158, 11, 0.4)" : "#FDE68A"),
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 6 }}>
                    {selectedLocation === userHometown ? (
                      <Home size={13} color={logoGreen} style={{ marginRight: 6 }} />
                    ) : (
                      <Compass size={13} color="#D97706" style={{ marginRight: 6 }} />
                    )}
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isDarkMode ? "#F8FAFC" : "#0F172A",
                      }}
                      numberOfLines={1}
                    >
                      <Text
                        style={{
                          fontWeight: "800",
                          color: selectedLocation === userHometown ? logoGreen : "#D97706",
                        }}
                      >
                        {selectedLocation === userHometown ? "Permanent: " : "Temporary: "}
                      </Text>
                      <Text style={{ fontWeight: "900", color: isDarkMode ? "#F8FAFC" : "#0F172A" }}>
                        {pinnedBarangay?.city || pinnedBarangay?.formattedTitle || selectedLocation || userHometown}
                      </Text>
                    </Text>
                  </View>
                  {selectedLocation !== userHometown ? (
                    <TouchableOpacity
                      onPress={() => setSelectedLocation(userHometown)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "800", color: logoGreen }}>
                        Back to Home
                      </Text>
                    </TouchableOpacity>
                  ) : null}
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
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0, marginRight: 8 }}>
                        <Navigation size={14} color={logoGreen} style={{ marginRight: 6, flexShrink: 0 }} />
                        <Text style={[styles.cityDetailTitle, { flex: 1 }]} numberOfLines={1}>
                          {currentCityProfile.marketTitle || `${selectedLocation} Food Market`}
                        </Text>
                      </View>
                      {userHometown && selectedLocation === userHometown ? (
                        <View style={[styles.hometownBadge, { flexShrink: 0 }]}>
                          <Text style={{ fontSize: 10, fontWeight: "800", color: logoGreen }}>Permanent Address</Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <View
                            style={[
                              styles.hometownBadge,
                              {
                                backgroundColor: isDarkMode ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
                                borderColor: isDarkMode ? "#F59E0B" : "#FDE68A",
                                borderWidth: 1,
                              },
                            ]}
                          >
                            <Text style={{ fontSize: 10, fontWeight: "800", color: isDarkMode ? "#FBBF24" : "#B45309" }}>
                              Temporary Address
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() =>
                              handleConfirmDefaultLocation({
                                city: selectedLocation,
                                formattedTitle: selectedLocation,
                                lat: pinnedBarangay?.lat,
                                lng: pinnedBarangay?.lng,
                              })
                            }
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 8,
                              backgroundColor: logoGreen,
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={{ fontSize: 10, fontWeight: "800", color: "#FFFFFF" }}>
                              Make Permanent
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
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
                      const categoryLabel = translateMealCategory(rawCat) || rawCat;
                      const IconComponent = getMealIconComponent(rawCat);
                      const accentColor = getMealAccentColor(rawCat);
                      const mealId = String(mealItem.id);
                      const isLogged = loggedMeals.some((mId) => String(mId) === mealId);

                      return (
                        <MealItemCard
                          key={mealId}
                          mealId={mealId}
                          isLogged={isLogged}
                          categoryLabel={categoryLabel}
                          timeLabel={mealItem.time}
                          mealTitle={translateMealTitle(mealItem.title, language)}
                          calories={mealItem.kcal}
                          proteinText={`${mealItem.proteinNum}g protein`}
                          accentColor={accentColor}
                          IconComponent={IconComponent}
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

                {/* FAMOUS NATIVE DISHES CARD (Vibrant Colorful Design) */}
                {Boolean(currentCityProfile?.famousDishes) && (
                  <View
                    style={[
                      styles.formCard,
                      {
                        marginBottom: 24,
                        backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                        borderWidth: 1.2,
                        borderColor: isDarkMode ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.2)",
                      },
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={[styles.cardTitle, { color: isDarkMode ? "#F8FAFC" : "#0F172A", marginBottom: 0, marginLeft: 0 }]}>
                        Famous Delicacies ({selectedLocation})
                      </Text>
                      <View
                        style={{
                          backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.18)" : "#ECFDF5",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: "rgba(16, 185, 129, 0.35)",
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "900", color: logoGreen }}>
                          LOCAL SPECIALTIES
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 12, color: isDarkMode ? "#94A3B8" : "#64748B", marginBottom: 14, lineHeight: 18 }}>
                      Iconic local dishes, traditional street food, and heritage delicacies famous in {selectedLocation}:
                    </Text>

                    <View style={{ gap: 12 }}>
                      {currentCityProfile.famousDishes.map((dish, idx) => {
                        const palettes = [
                          {
                            color: "#D97706",
                            lightBg: "#FFFBEB",
                            darkBg: "rgba(245, 158, 11, 0.08)",
                            border: "#FDE68A",
                            darkBorder: "rgba(245, 158, 11, 0.35)",
                            badgeBg: "#FEF3C7",
                            badgeText: "#B45309",
                            tag: "Heritage Dish",
                          },
                          {
                            color: "#059669",
                            lightBg: "#F0FDF4",
                            darkBg: "rgba(16, 185, 129, 0.08)",
                            border: "#A7F3D0",
                            darkBorder: "rgba(16, 185, 129, 0.35)",
                            badgeBg: "#D1FAE5",
                            badgeText: "#047857",
                            tag: "Local Pride",
                          },
                          {
                            color: "#EA580C",
                            lightBg: "#FFF7ED",
                            darkBg: "rgba(249, 115, 22, 0.08)",
                            border: "#FED7AA",
                            darkBorder: "rgba(249, 115, 22, 0.35)",
                            badgeBg: "#FFEDD5",
                            badgeText: "#C2410C",
                            tag: "Culinary Icon",
                          },
                          {
                            color: "#DB2777",
                            lightBg: "#FDF2F8",
                            darkBg: "rgba(236, 72, 153, 0.08)",
                            border: "#FBCFE8",
                            darkBorder: "rgba(236, 72, 153, 0.35)",
                            badgeBg: "#FCE7F3",
                            badgeText: "#BE185D",
                            tag: "Sweet Specialty",
                          },
                          {
                            color: "#7C3AED",
                            lightBg: "#F5F3FF",
                            darkBg: "rgba(139, 92, 246, 0.08)",
                            border: "#DDD6FE",
                            darkBorder: "rgba(139, 92, 246, 0.35)",
                            badgeBg: "#EDE9FE",
                            badgeText: "#6D28D9",
                            tag: "Native Favorite",
                          },
                          {
                            color: "#0891B2",
                            lightBg: "#ECFEFF",
                            darkBg: "rgba(6, 182, 212, 0.08)",
                            border: "#BAE6FD",
                            darkBorder: "rgba(6, 182, 212, 0.35)",
                            badgeBg: "#CFFAFE",
                            badgeText: "#0E7490",
                            tag: "Coastal Catch",
                          },
                        ];
                        const palette = palettes[idx % palettes.length];

                        return (
                          <View
                            key={idx}
                            style={{
                              backgroundColor: isDarkMode ? palette.darkBg : palette.lightBg,
                              padding: 14,
                              borderRadius: 16,
                              borderWidth: 1.5,
                              borderColor: isDarkMode ? palette.darkBorder : palette.border,
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: isDarkMode ? 0.2 : 0.04,
                              shadowRadius: 3,
                              elevation: 1,
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 8 }}>
                                <View
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: palette.color,
                                    marginRight: 8,
                                  }}
                                />
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: "900",
                                    color: isDarkMode ? "#F8FAFC" : "#0F172A",
                                    letterSpacing: -0.2,
                                    flex: 1,
                                  }}
                                  numberOfLines={2}
                                >
                                  {translateMealTitle(dish.name, language)}
                                </Text>
                              </View>
                              <View
                                style={{
                                  backgroundColor: palette.badgeBg,
                                  paddingHorizontal: 8,
                                  paddingVertical: 3.5,
                                  borderRadius: 8,
                                  borderWidth: 1,
                                  borderColor: isDarkMode ? palette.darkBorder : palette.border,
                                }}
                              >
                                <Text style={{ fontSize: 10, fontWeight: "800", color: palette.badgeText }}>
                                  {palette.tag}
                                </Text>
                              </View>
                            </View>

                            <Text
                              style={{
                                fontSize: 12,
                                color: isDarkMode ? "#94A3B8" : "#475569",
                                lineHeight: 17,
                                paddingLeft: 16,
                              }}
                            >
                              {dish.desc}
                            </Text>
                          </View>
                        );
                      })}
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
                placeholder="Search municipality or city..."
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
                <ScrollView
                  style={{ maxHeight: 280 }}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={true}
                  persistentScrollbar={true}
                  bounces={true}
                >
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
                            backgroundColor: "rgba(16, 185, 129, 0.12)",
                          },
                        ]}
                      >
                        <MapPin size={13} color={logoGreen} />
                      </View>
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text
                          style={[
                            styles.mapSearchItemTitle,
                            { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={[
                            styles.mapSearchItemSub,
                            { color: isDarkMode ? "#94A3B8" : "#64748B" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.province ? `${item.province} • ` : ""}Philippines
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.mapSearchItemBadge,
                          {
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "800",
                            color: logoGreen,
                          }}
                        >
                          {item.name.toLowerCase().includes("city") ? "City" : "Municipality"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {mapSearchResults.length > 4 && (
                    <View
                      style={{
                        paddingVertical: 7,
                        alignItems: "center",
                        backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "#F8FAFC",
                        borderTopWidth: 1,
                        borderTopColor: isDarkMode ? "#334155" : "#F1F5F9",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10.5,
                          fontWeight: "700",
                          color: isDarkMode ? "#94A3B8" : "#64748B",
                        }}
                      >
                        Scroll for more matching cities & municipalities ({mapSearchResults.length} found)
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}


          </View>

          {/* Full-screen Map */}
          <View style={{ flex: 1, width: "100%", position: "relative" }}>
            <MapcnMap
              center={pinnedBarangay ? [pinnedBarangay.lng, pinnedBarangay.lat] : currentMapCenter}
              zoom={pinnedBarangay ? 13 : 10}
              markers={[]}
              activeLocation={selectedLocation}
              pinnedBarangay={pinnedBarangay}
              cardContainer={false}
              height="100%"
              style={{ width: "100%", height: "100%" }}
            />

            {/* Floating Map Controls in Maximized Map */}
            <View style={styles.floatingMapControls}>
              <View style={styles.floatingLeftActions}>
                {userHometown && selectedLocation !== userHometown ? (
                  <TouchableOpacity
                    onPress={() => setSelectedLocation(userHometown)}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                      borderRadius: 50,
                      paddingVertical: 9,
                      paddingHorizontal: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1.5,
                      borderColor: logoGreen,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 5,
                      maxWidth: 175,
                    }}
                  >
                    <Home size={13} color={logoGreen} style={{ marginRight: 6 }} />
                    <Text
                      style={{ fontSize: 12, fontWeight: "800", color: logoGreen }}
                      numberOfLines={1}
                    >
                      Home: {userHometown}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {selectedLocation && userHometown && selectedLocation !== userHometown ? (
                  <TouchableOpacity
                    onPress={() =>
                      handleConfirmDefaultLocation({
                        city: selectedLocation,
                        formattedTitle: selectedLocation,
                        lat: pinnedBarangay?.lat,
                        lng: pinnedBarangay?.lng,
                      })
                    }
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: logoGreen,
                      borderRadius: 50,
                      paddingVertical: 9,
                      paddingHorizontal: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1.5,
                      borderColor: logoGreen,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 6,
                      maxWidth: 175,
                    }}
                  >
                    <CheckCircle2 size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text
                      style={{ fontSize: 12, fontWeight: "900", color: "#FFFFFF" }}
                      numberOfLines={1}
                    >
                      Make Permanent
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={handleLocateMe}
                activeOpacity={0.85}
                style={styles.floatingLocateBtn}
                accessibilityLabel="Locate Me"
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={logoGreen} />
                ) : (
                  <LocateFixed size={20} color={logoGreen} />
                )}
              </TouchableOpacity>
            </View>

            {/* Floating Top Status Badge for Permanent vs Temporary */}
            <View style={{ position: "absolute", top: 12, alignSelf: "center", zIndex: 100, maxWidth: "92%" }}>
              {pinnedBarangay || selectedLocation ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: selectedLocation === userHometown
                      ? (isDarkMode ? "rgba(6, 78, 59, 0.94)" : "#ECFDF5")
                      : (isDarkMode ? "rgba(120, 53, 15, 0.94)" : "#FFFBEB"),
                    borderRadius: 50,
                    paddingVertical: 7,
                    paddingHorizontal: 15,
                    borderWidth: 1.5,
                    borderColor: selectedLocation === userHometown
                      ? logoGreen
                      : "#F59E0B",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  {selectedLocation === userHometown ? (
                    <Home size={14} color={logoGreen} style={{ marginRight: 6 }} />
                  ) : (
                    <Compass size={14} color="#D97706" style={{ marginRight: 6 }} />
                  )}
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: selectedLocation === userHometown
                        ? (isDarkMode ? "#6EE7B7" : "#047857")
                        : (isDarkMode ? "#FDE68A" : "#B45309"),
                    }}
                  >
                    {selectedLocation === userHometown ? "Permanent: " : "Temporary: "}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      color: selectedLocation === userHometown
                        ? (isDarkMode ? "#F8FAFC" : "#065F46")
                        : (isDarkMode ? "#FEF3C7" : "#78350F"),
                    }}
                    numberOfLines={1}
                  >
                    {pinnedBarangay?.city || pinnedBarangay?.formattedTitle || selectedLocation || userHometown}
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                    borderRadius: 50,
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderWidth: 1.5,
                    borderColor: theme?.border || "#E2E8F0",
                    elevation: 3,
                  }}
                >
                  <Navigation size={12} color={logoGreen} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 11.5, fontWeight: "700", color: isDarkMode ? "#F8FAFC" : "#0F172A" }}>
                    Search or pin any municipality or city
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <LoadingModal
        visible={isGeneratingAIPlan}
        type="meal"
        title="Generating AI Daily Meal Plan"
        subtitle="Vita AI is calculating your optimal daily macros"
      />

      {/* Unified Address Option Modal (Permanent vs Temporary Address Choice) */}
      <Modal
        visible={Boolean(showDefaultLocationPrompt && pendingDefaultLocation)}
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
              <Compass size={26} color="#10B981" />
            </View>

            <Text
              style={[
                promptStyles.title,
                { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
              ]}
            >
              Address Option
            </Text>

            <Text
              style={[
                promptStyles.description,
                { color: isDarkMode ? "#94A3B8" : "#64748B" },
              ]}
            >
              You selected{" "}
              <Text
                style={{
                  fontWeight: "800",
                  color: isDarkMode ? "#34D399" : "#059669",
                }}
              >
                {pendingDefaultLocation?.city ||
                  pendingDefaultLocation?.formattedTitle ||
                  (typeof pendingDefaultLocation === "string"
                    ? pendingDefaultLocation
                    : "this location")}
              </Text>
              . Choose how you want to use this municipality or city:
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
                numberOfLines={1}
              >
                Permanent Address:{" "}
                <Text style={{ fontWeight: "700", color: isDarkMode ? "#F8FAFC" : "#0F172A" }}>
                  {userHometown || "Set in Step 3"}
                </Text>
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={promptStyles.actionsColumn}>
              <TouchableOpacity
                onPress={() => handleSetAsTemporaryLocation(pendingDefaultLocation)}
                style={promptStyles.primaryBtn}
                activeOpacity={0.85}
              >
                <Text style={promptStyles.primaryBtnText}>Use as Temporary Address</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleConfirmDefaultLocation(pendingDefaultLocation)}
                style={[
                  promptStyles.secondaryBtn,
                  {
                    borderColor: logoGreen,
                    backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.1)" : "#ECFDF5",
                  },
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    promptStyles.secondaryBtnText,
                    { color: logoGreen, fontWeight: "800" },
                  ]}
                >
                  Make Permanent Address
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRejectDefaultLocation}
                style={{ paddingVertical: 8, alignItems: "center" }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: isDarkMode ? "#64748B" : "#94A3B8",
                  }}
                >
                  Cancel
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
      bottom: 16,
      left: 14,
      right: 14,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      zIndex: 100,
      pointerEvents: "box-none",
    },
    floatingLeftActions: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      flex: 1,
      marginRight: 10,
      pointerEvents: "box-none",
    },
    floatingPillBtn: {
      backgroundColor: theme?.surface || "#FFFFFF",
      borderRadius: 50,
      paddingVertical: 8,
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 5,
      borderWidth: 1.5,
      maxWidth: 165,
    },
    floatingPillText: { fontSize: 11.5, fontWeight: "800", color: logoGreen },
    floatingLocateBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme?.surface || "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: logoGreen,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 6,
    },
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

