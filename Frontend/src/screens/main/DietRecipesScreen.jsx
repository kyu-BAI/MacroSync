import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  Linking
} from 'react-native';
import { Search, MapPin, Clock, BotMessageSquare, Home, UtensilsCrossed, SportShoe, Settings, Camera, ChevronDown, ChevronUp, ChefHat, CheckCircle2, PlusCircle, Coffee, Sun, Moon, Flame, Sparkles, Compass, Navigation, LocateFixed, ShoppingBag, Maximize2, X } from 'lucide-react-native';
import API_URL from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToSyncQueue, updateCachedDashboardField } from '../../services/OfflineStorage';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';
import AILoadingModal from '../../components/AILoadingModal';
import { WebView } from 'react-native-webview';
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const pushNotificationIfAllowed = async (newNotif, setNotifications) => {
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

export default function DietRecipesScreen({ 
  onTabChange, 
  dailyNutrition, 
  setDailyNutrition, 
  guestGoals, 
  guestBaseline, 
  globalLoggedMeals = [], 
  setGlobalLoggedMeals,
  sessionRecipes,
  userId,
  isOnline = true,
  setNotifications
}) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isFetchingRecipe, setIsFetchingRecipe] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  const recipeCacheRef = React.useRef({});

  const handleViewRecipe = useCallback(async (meal) => {
    // 1. Check if recipe already attached to meal
    if (meal.instructions && meal.ingredients) {
      setSelectedRecipe(meal);
      setShowRecipeModal(true);
      return;
    }

    // 2. Check local client cache for instant 0ms load
    const cacheKey = `${meal.title.trim().toLowerCase()}_${selectedLocation || 'San Remigio'}`;
    if (recipeCacheRef.current[cacheKey]) {
      setSelectedRecipe(recipeCacheRef.current[cacheKey]);
      setShowRecipeModal(true);
      return;
    }

    setIsFetchingRecipe(true);
    try {
      const response = await fetch(`${API_URL}/generate-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ingredients: meal.title,
          budget: 'All',
          location: selectedLocation || 'San Remigio'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recipe');
      }

      const data = await response.json();
      recipeCacheRef.current[cacheKey] = data;
      setSelectedRecipe(data);
      setShowRecipeModal(true);
    } catch (error) {
      if (__DEV__) console.error("VIEW RECIPE ERROR:", error);
      showAlert('Unable to load recipe', 'Failed to retrieve recipe from AI. Please check your network connection.');
    } finally {
      setIsFetchingRecipe(false);
    }
  }, [selectedLocation]);

  // Use global persisted state so logged meals survive tab switches
  const loggedMeals = globalLoggedMeals;
  const setLoggedMeals = setGlobalLoggedMeals || (() => {});
  const [recipes, setRecipes] = useState(sessionRecipes || []);

  useEffect(() => {
    if (sessionRecipes && sessionRecipes.length > 0) {
      setRecipes(sessionRecipes);
    } else if (userId) {
      // Defer heavy fetch until after tab animation completes
      const timer = setTimeout(() => {
        fetch(`${API_URL}/meals/recommend/${userId}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              setRecipes(data);
            }
          })
          .catch(err => __DEV__ && console.warn("Error loading AI meals in DietRecipesScreen:", err));
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [sessionRecipes, userId]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('San Remigio');
  const [showFullMapModal, setShowFullMapModal] = useState(false);
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  
  // New UI States
  const [activeDietTab, setActiveDietTab] = useState('PLAN'); // 'PLAN' or 'EXPLORE'

  const CITY_PROFILES = {
    'San Remigio': {
      marketTitle: 'San Remigio Municipal Public Market',
      specialty: 'Sinugbang Tilapia/Bangus & Fresh Seaweed (Lato)',
      palengkeItems: 'Fresh Bangus, Tilapia, Lato, Kangkong, Squash, Gabi Leaves',
      avgCost: '₱70 - ₱120',
      peakHours: '5:30 AM – 8:30 AM (Coastal Catch Arrival)',
      healthBenefit: 'High Omega-3 & Natural Electrolytes (Low Calorie)',
      topRatio: '60% Seafood, 40% Greens'
    },
    'Bogo City': {
      marketTitle: 'Bogo City Public Market (Palengke sa Bogo)',
      specialty: 'Kinilaw na Tangigue & Fresh Palengke Greens',
      palengkeItems: 'Tangigue, Cucumber, Native Tomatoes, Calamansi, Sweet Corn',
      avgCost: '₱85 - ₱150',
      peakHours: '6:00 AM – 9:00 AM (Wholesale Harvest Arrival)',
      healthBenefit: 'Lean Protein & Slow-Release Carbs from Yellow Corn',
      topRatio: '50% Lean Protein, 50% Fiber'
    },
    'Daanbantayan': {
      marketTitle: 'Daanbantayan Public Market & Fish Landing',
      specialty: 'Inun-unan na Bodboron & Kamote Harvest Bowl',
      palengkeItems: 'Bodboron, Tulingan, Purple Kamote, Eggplant, Native Ginger',
      avgCost: '₱60 - ₱110',
      peakHours: '6:00 AM – 10:00 AM (Northern Wharf Supply)',
      healthBenefit: 'Rich in Vitamin A, Fiber, & Low-GI Complex Carbs',
      topRatio: '70% Fresh Catch, 30% Carbs'
    }
  };

  const locations = ['San Remigio', 'Bogo City', 'Daanbantayan'];

  // --- DYNAMIC CALORIE & MACRO CALCULATOR ENGINE ---
  let calculatedTargetCalories = 2000;
  let targetProtein = 150;
  let targetCarbs = 225;
  let targetFats = 55;

  if (guestBaseline?.weight && guestBaseline?.height && guestBaseline?.age && guestGoals?.activityLevel) {
    const w = parseFloat(guestBaseline.weight);
    const h = parseFloat(guestBaseline.height);
    const a = parseInt(guestBaseline.age, 10);
    
    // Base BMR (Mifflin-St Jeor)
    let bmr = (10 * w) + (6.25 * h) - (5 * a) + 5; 
    
    // Activity Multiplier
    let multiplier = 1.2; // sedentary
    if (guestGoals.activityLevel === 'moderate') multiplier = 1.55;
    if (guestGoals.activityLevel === 'active') multiplier = 1.725;
    
    let tdee = bmr * multiplier;
    
    // Goal Adjustment
    if (guestGoals.goal === 'muscle') tdee += 300;
    if (guestGoals.goal === 'fatloss') tdee -= 500;
    
    calculatedTargetCalories = Math.round(tdee);
    
    // Calculate Macros (30% Protein, 45% Carbs, 25% Fats)
    targetProtein = Math.round((calculatedTargetCalories * 0.30) / 4);
    targetCarbs = Math.round((calculatedTargetCalories * 0.45) / 4);
    targetFats = Math.round((calculatedTargetCalories * 0.25) / 9);
  }

  const targetCalories = calculatedTargetCalories;

  const getMealAccentColor = (typeOrTime) => {
    const val = String(typeOrTime || '');
    if (val.includes('Breakfast')) return '#F59E0B'; // Amber Gold 🌅
    if (val.includes('Lunch'))     return '#10B981'; // Emerald Green ☀️
    if (val.includes('Snack'))     return '#0EA5E9'; // Sky Blue ⚡
    if (val.includes('Dinner'))    return '#8B5CF6'; // Royal Purple 🌙
    return '#3B82F6'; // Vibrant Blue Default
  };

  // Mapping helper to resolve Lucide icon components from meal type names
  const getMealIconComponent = (typeOrTime) => {
    const val = String(typeOrTime || '');
    if (val.includes('Breakfast')) return Coffee;
    if (val.includes('Lunch'))     return Sun;
    if (val.includes('Snack'))     return Flame;
    if (val.includes('Dinner'))    return Moon;
    return UtensilsCrossed;
  };

  // AI Daily Meal Recommendation State
  const [dailyPlan, setDailyPlan] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCachedOrFetchMeals = async () => {
      if (!userId) {
        setLoadingMeals(false);
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const CACHE_KEY = `ms_meals_cache_${userId}`;

      try {
        // 1. Check cache first — show instantly if not stale/generic
        const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed.meals) && parsed.meals.length > 0) {
            const hasGenericTitle = parsed.meals.some(m => String(m.title || '').includes('Allergen-Free Pinoy High-Protein'));
            if (!hasGenericTitle && isMounted) {
              setDailyPlan(parsed.meals);
              setLoadingMeals(false); // Instant load
            }
          }
        }

        // 2. Fetch fresh from server to ensure up-to-date allergy safety & analytics
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${API_URL}/meals/recommend/${userId}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            if (isMounted) {
              setDailyPlan(data);
            }
            // Save fresh data to user-specific cache
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
              userId,
              date: todayStr,
              meals: data
            }));
          }
        }
      } catch (err) {
        if (__DEV__) console.log("MEAL RECOMMENDATION FETCH ERROR:", err);
      } finally {
        if (isMounted) setLoadingMeals(false);
      }
    };

    loadCachedOrFetchMeals();

    return () => { isMounted = false; };
  }, [userId]);

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);
  const toggleExpandRecipe = (id) => setExpandedRecipeId(expandedRecipeId === id ? null : id);

  const handleGenerateRecipe = async () => {
    if (!searchQuery.trim()) {
      showAlert('Ingredients Required', 'Please enter some ingredients in the search bar first.');
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_URL}/generate-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ingredients: searchQuery.trim(),
          budget: 'All',
          location: selectedLocation,
          allergy: 'None'
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setRecipes(prev => [data, ...(Array.isArray(prev) ? prev : [])]);
        setExpandedRecipeId(data.id);
        showAlert('Success', 'AI generated a healthy recipe matching your preferences!');
      } else {
        showAlert('AI Recipe Error', 'Failed to generate recipe. Please check your network connection.');
      }
    } catch (error) {
      showAlert('AI Recipe Error', 'Failed to generate recipe. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleLogMeal = async (id, macros) => {
    if (!userId) {
      showAlert("Authentication Error", "You must be logged in to log meals.");
      return;
    }

    const safeId = String(id || `meal-${Date.now()}`);
    const safeMacros = macros || {};
    const isRecipe = safeId.startsWith('recipe-');
    const mealName = safeMacros.name || (isRecipe ? (Array.isArray(recipes) ? recipes.find(r => `recipe-${r.id}` === safeId)?.title : null) : null) || 'Meal';
    const addedCal = parseInt(safeMacros.calories) || 0;
    const addedProt = parseInt(safeMacros.protein) || 0;
    const addedCarb = parseInt(safeMacros.carbs) || 0;
    const addedFat = parseInt(safeMacros.fats) || 0;

    const mealPayload = {
      id: safeId,
      user_id: userId,
      name: mealName,
      calories: addedCal,
      protein: addedProt,
      carbs: addedCarb,
      fats: addedFat
    };

    if (!loggedMeals.includes(safeId)) {
      const currentConsumed = dailyNutrition?.consumedCalories || 0;
      const targetCalories = dailyNutrition?.targetCalories || 2500;
      const newTotal = currentConsumed + addedCal;
      const excess = newTotal - targetCalories;

      const executeMealLog = async () => {
        // Optimistic UI updates
        const updatedLoggedMeals = [...loggedMeals, safeId];
        setLoggedMeals(updatedLoggedMeals);
        
        await pushNotificationIfAllowed({
          id: `n-${Date.now()}`,
          title: 'Meal Logged! 🍽️',
          category: 'meal',
          time: 'Just Now',
          read: false,
          message: `Successfully logged your meal: ${mealName} (${addedCal} Kcal). Keep it up!`
        }, setNotifications);
        
        const newNutrition = dailyNutrition ? {
          consumedCalories: (dailyNutrition.consumedCalories || 0) + addedCal,
          protein: { ...(dailyNutrition.protein || {}), current: ((dailyNutrition.protein?.current || 0) + addedProt) },
          carbs: { ...(dailyNutrition.carbs || {}), current: ((dailyNutrition.carbs?.current || 0) + addedCarb) },
          fats: { ...(dailyNutrition.fats || {}), current: ((dailyNutrition.fats?.current || 0) + addedFat) }
        } : null;

        if (setDailyNutrition && newNutrition) {
          setDailyNutrition(prev => ({
            ...prev,
            ...newNutrition
          }));
        }

        // If offline
        if (!isOnline) {
          await addToSyncQueue({ type: 'LOG_MEAL', payload: mealPayload });
          if (newNutrition) {
            await updateCachedDashboardField(userId, {
              loggedMealIds: updatedLoggedMeals,
              nutrition: {
                consumedCalories: newNutrition.consumedCalories,
                protein: { ...newNutrition.protein },
                carbs: { ...newNutrition.carbs },
                fats: { ...newNutrition.fats }
              }
            });
          }
          showAlert("📴 Saved Offline", `${mealName} logged locally. It will sync when connection returns.`);
          return;
        }

        try {
          const res = await fetch(`${API_URL}/meals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mealPayload)
          });
          
          if (!res.ok) {
            if (__DEV__) console.log("Failed to persist meal log upstream:", res.status);
          } else {
            if (newNutrition) {
              await updateCachedDashboardField(userId, {
                loggedMealIds: updatedLoggedMeals,
                nutrition: {
                  consumedCalories: newNutrition.consumedCalories,
                  protein: { ...newNutrition.protein },
                  carbs: { ...newNutrition.carbs },
                  fats: { ...newNutrition.fats }
                }
              });
            }
          }
        } catch (err) {
          if (__DEV__) console.warn("Offline or network issue while logging meal:", err);
          await addToSyncQueue({ type: 'LOG_MEAL', payload: mealPayload });
          if (newNutrition) {
            await updateCachedDashboardField(userId, {
              loggedMealIds: updatedLoggedMeals,
              nutrition: {
                consumedCalories: newNutrition.consumedCalories,
                protein: { ...newNutrition.protein },
                carbs: { ...newNutrition.carbs },
                fats: { ...newNutrition.fats }
              }
            });
          }
          showAlert("📴 Saved Offline", `${mealName} logged locally. It will sync when connection returns.`);
        }
      };

      if (excess > 0) {
        showAlert(
          "Calorie Target Exceeded ⚠️",
          `Logging this meal (${mealCalories} kcal) will put you ${excess} kcal over your daily target of ${targetCalories} kcal.\n\nDo you still want to proceed?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Proceed & Log", style: "destructive", onPress: executeMealLog }
          ]
        );
      } else {
        await executeMealLog();
      }
    } else {
      // Optimistic UI updates
      const updatedLoggedMeals = loggedMeals.filter(mealId => mealId !== id);
      setLoggedMeals(updatedLoggedMeals);
      
      let newNutrition = null;
      if (setDailyNutrition && macros) {
        setDailyNutrition(prev => {
          const next = {
            ...prev,
            consumedCalories: Math.max(0, prev.consumedCalories - macros.calories),
            protein: { ...prev.protein, current: Math.max(0, prev.protein.current - macros.protein) },
            carbs: { ...prev.carbs, current: Math.max(0, prev.carbs.current - macros.carbs) },
            fats: { ...prev.fats, current: Math.max(0, prev.fats.current - macros.fats) }
          };
          newNutrition = next;
          return next;
        });
      }

      // If offline
      if (!isOnline) {
        await addToSyncQueue({ type: 'DELETE_MEAL', payload: { user_id: userId, id } });
        if (newNutrition) {
          await updateCachedDashboardField(userId, {
            loggedMealIds: updatedLoggedMeals,
            nutrition: {
              consumedCalories: newNutrition.consumedCalories,
              protein: { ...newNutrition.protein },
              carbs: { ...newNutrition.carbs },
              fats: { ...newNutrition.fats }
            }
          });
        }
        showAlert('📴 Saved Offline', 'Meal removed locally. Will sync when back online.');
        return;
      }

      // Online: call API but handle failure gracefully
      try {
        const response = await fetch(`${API_URL}/meals/${userId}/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete meal on server');
        }
      } catch (error) {
        if (__DEV__) console.warn("DELETE MEAL API ERROR (falling back to queue):", error);
        await addToSyncQueue({ type: 'DELETE_MEAL', payload: { user_id: userId, id } });
        if (newNutrition) {
          await updateCachedDashboardField(userId, {
            loggedMealIds: updatedLoggedMeals,
            nutrition: {
              consumedCalories: newNutrition.consumedCalories,
              protein: { ...newNutrition.protein },
              carbs: { ...newNutrition.carbs },
              fats: { ...newNutrition.fats }
            }
          });
        }
      }
    }
  };

  // Deduplicate recipes by ID to ensure no duplicate cards are shown in the Explore tab
  const uniqueRecipes = recipes.filter((recipe, index, self) =>
    recipe && index === self.findIndex((r) => r && r.id === recipe.id)
  );

  const filteredRecipes = uniqueRecipes.filter(recipe => {
    const matchesLocation = !recipe.location || recipe.location === selectedLocation;
    const ingredientsString = (recipe.ingredients || []).join(', ').toLowerCase();
    const matchesSearch = !searchQuery.trim() ||
                          (recipe.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ingredientsString.includes(searchQuery.toLowerCase());
    return matchesLocation && matchesSearch;
  });

  const consumedCalories = dailyNutrition?.consumedCalories || 0;
  const isOverCalories = consumedCalories > targetCalories;



  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.appName}>MacroSync</Text>
            <Text style={styles.greeting}>Diet & Recipes</Text>
            <Text style={styles.subGreeting}>Personalized meal suggestions built for your goals</Text>
          </View>
        </View>

        {/* --- TAB SWITCHER --- */}
        <View style={styles.tabSwitcherContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeDietTab === 'PLAN' ? styles.tabButtonActive : styles.tabButtonInactive]}
            onPress={() => setActiveDietTab('PLAN')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeDietTab === 'PLAN' ? styles.tabTextActive : styles.tabTextInactive]}>Daily Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeDietTab === 'EXPLORE' ? styles.tabButtonActive : styles.tabButtonInactive]}
            onPress={() => setActiveDietTab('EXPLORE')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeDietTab === 'EXPLORE' ? styles.tabTextActive : styles.tabTextInactive]}>Explore Recipes</Text>
          </TouchableOpacity>
        </View>

        {activeDietTab === 'PLAN' ? (
          /* --- TAB A: DAILY PLAN --- */
          <View style={styles.dailyPlanSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginLeft: 4 }}>
              <Text style={[styles.sectionLabelTitle, { marginBottom: 0, marginLeft: 0 }]}>Today's Target Macros</Text>
              {isOverCalories && (
                <View style={styles.warningBadge}>
                  <Text style={styles.warningBadgeText}>Over Calories!</Text>
                </View>
              )}
            </View>
            <View style={styles.dailyProgressCard}>
              <View style={styles.macroRowInline}>
                <View style={styles.macroMiniBox}>
                  <Text style={[styles.macroMiniVal, { color: isOverCalories ? '#EF4444' : '#F97316' }]}>
                    {consumedCalories} / {targetCalories}
                  </Text>
                  <Text style={styles.macroMiniLabel}>Kcal</Text>
                </View>
                <View style={styles.macroMiniBox}>
                  <Text style={[styles.macroMiniVal, { color: '#10B981' }]}>{dailyNutrition?.protein?.current || 0}g</Text>
                  <Text style={styles.macroMiniLabel}>Protein</Text>
                </View>
                <View style={styles.macroMiniBox}>
                  <Text style={[styles.macroMiniVal, { color: '#F59E0B' }]}>{dailyNutrition?.carbs?.current || 0}g</Text>
                  <Text style={styles.macroMiniLabel}>Carbs</Text>
                </View>
                <View style={styles.macroMiniBox}>
                  <Text style={[styles.macroMiniVal, { color: '#EC4899' }]}>{dailyNutrition?.fats?.current || 0}g</Text>
                  <Text style={styles.macroMiniLabel}>Fats</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionLabelTitle}>Your AI Scheduled Meals</Text>
            <View style={styles.timelineContainer}>
              {loadingMeals && dailyPlan.length === 0 ? (
                // First-load skeleton — only shown when there's truly no data yet
                <View style={{ gap: 12 }}>
                  {[0,1,2,3].map(i => (
                    <View key={i} style={{
                      borderRadius: 18,
                      backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                      padding: 18,
                      borderWidth: 1,
                      borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                      opacity: 0.7
                    }}>
                      <View style={{ width: 80, height: 22, borderRadius: 8, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', marginBottom: 10 }} />
                      <View style={{ width: '65%', height: 16, borderRadius: 6, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', marginBottom: 8 }} />
                      <View style={{ width: '45%', height: 13, borderRadius: 6, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }} />
                    </View>
                  ))}
                  <View style={{ alignItems: 'center', paddingTop: 8 }}>
                    <ActivityIndicator size="small" color="#10B981" />
                    <Text style={{ marginTop: 8, fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: '600' }}>
                      Generating personalized AI meals for your goals...
                    </Text>
                  </View>
                </View>
              ) : dailyPlan.length === 0 ? (
                <View style={{
                  padding: 24,
                  borderRadius: 18,
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: isDarkMode ? '#334155' : '#E2E8F0'
                }}>
                  <UtensilsCrossed color="#10B981" size={36} style={{ marginBottom: 10 }} />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: isDarkMode ? '#F8FAFC' : '#0F172A', textAlign: 'center', marginBottom: 4 }}>
                    No AI Meals Generated Yet
                  </Text>
                  <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B', textAlign: 'center', marginBottom: 16 }}>
                    Tap below to generate custom meal recommendations calculated for your exact daily macros.
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#10B981',
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                    onPress={async () => {
                      try {
                        setLoadingMeals(true);
                        const res = await fetch(`${API_URL}/meals/recommend/${userId || 'default'}`);
                        if (res.ok) {
                          const data = await res.json();
                          if (Array.isArray(data) && data.length > 0) {
                            setDailyPlan(data);
                            // Persist to cache so user sees it instantly on return
                            const todayStr = new Date().toISOString().split('T')[0];
                            const CACHE_KEY = `ms_meals_cache_${userId}`;
                            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ userId, date: todayStr, meals: data }));
                          }
                        }
                      } catch (e) {
                        showAlert("Error", "Could not fetch AI recommendations. Please check connection.");
                      } finally {
                        setLoadingMeals(false);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Sparkles color="#FFFFFF" size={16} style={{ marginRight: 6 }} />
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                      Generate AI Meals
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                (Array.isArray(dailyPlan) ? dailyPlan : []).map((meal, index) => {
                  const mealCat = meal?.mealType || meal?.time || '';
                  const IconComponent = getMealIconComponent(mealCat);
                  const accentColor = getMealAccentColor(mealCat);
                  const isLogged = loggedMeals.includes(meal?.id);
                  return (
                    <View key={meal?.id || `m-${index}`} style={styles.timelineItem}>
                      <View 
                        style={[
                          styles.timelineCard, 
                          isLogged && styles.timelineCardLogged
                        ]}
                      >
                        <View style={styles.timelineHeader}>
                          <View style={[
                            styles.mealTypeBadge, 
                            isLogged 
                              ? { backgroundColor: '#64748B' } 
                              : { backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}40`, borderWidth: 1 }
                          ]}>
                            <IconComponent color={isLogged ? '#FFFFFF' : accentColor} size={12} strokeWidth={2.5} />
                            <Text style={[
                              styles.mealTypeBadgeText, 
                              isLogged ? { color: '#FFFFFF' } : { color: accentColor }
                            ]}>
                              {meal?.mealType || 'Meal'}
                            </Text>
                          </View>
                          <Text style={styles.timelineTime}>{meal?.time || 'Today'}</Text>
                        </View>
                        <Text style={[styles.timelineTitle, isLogged && { color: '#64748B' }]}>{meal?.title || 'Healthy Meal'}</Text>
                        <View style={styles.timelineFooter}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.timelineMacroText}>{meal?.calories || 0} kcal • {meal?.protein || '0g'} protein</Text>
                            <TouchableOpacity 
                              style={styles.viewRecipeTextBtn} 
                              onPress={() => handleViewRecipe(meal)}
                              activeOpacity={0.6}
                            >
                              <ChefHat color={isLogged ? '#64748B' : accentColor} size={14} style={{ marginRight: 4 }} />
                              <Text style={[styles.viewRecipeTextBtnLabel, !isLogged && { color: accentColor }]}>View Recipe</Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity 
                            style={[
                              styles.logMealMiniBtn, 
                              isLogged ? styles.logMealMiniBtnLogged : { backgroundColor: accentColor }
                            ]}
                            onPress={() => handleLogMeal(meal?.id, { 
                              name: meal?.title || 'Meal',
                              calories: meal?.calories || 0, 
                              protein: parseInt(meal?.protein) || 0,
                              carbs: parseInt(meal?.carbs) || 0,
                              fats: parseInt(meal?.fats) || 0
                            })}
                            activeOpacity={0.7}
                          >
                            {isLogged ? (
                              <>
                                <CheckCircle2 color="#FFFFFF" size={12} />
                                <Text style={styles.logMealMiniBtnTextLogged}>Logged</Text>
                              </>
                            ) : (
                              <>
                                <PlusCircle color="#FFFFFF" size={12} />
                                <Text style={styles.logMealMiniBtnText}>Log Meal</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        ) : (
          /* --- TAB B: EXPLORE RECIPES --- */
          <View style={styles.exploreSection}>
            {/* CARD 1: SEARCH & RECIPE FILTERS */}
            <View style={styles.searchFormCard}>
              <View style={styles.searchBarInnerContainer}>
                <Search color="#64748B" size={20} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchTextInput}
                  placeholder="Search or type ingredients (e.g. Bangus, Kangkong)..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              {searchQuery.trim().length > 0 && (
                <TouchableOpacity 
                  style={styles.aiGenerateBtn} 
                  onPress={handleGenerateRecipe}
                  disabled={isGenerating}
                  activeOpacity={0.8}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Sparkles color="#FFFFFF" size={16} style={{ marginRight: 6 }} />
                      <Text style={styles.aiGenerateBtnText}>Generate Recipe with Vita AI</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}


            </View>

            {/* CARD 2: INTERACTIVE CITY FOOD RADAR */}
            <View style={styles.formCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.cardTitle}>Interactive City Food Radar</Text>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.10)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}
                  onPress={() => setShowFullMapModal(true)}
                  activeOpacity={0.8}
                >
                  <Maximize2 size={12} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>Full Map</Text>
                </TouchableOpacity>
              </View>

              {/* NATIVE CITY SELECTION RADAR */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {locations.map((loc) => {
                  const isSelected = selectedLocation === loc;
                  return (
                    <TouchableOpacity
                      key={loc}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderRadius: 14,
                        alignItems: 'center',
                        justify: 'center',
                        backgroundColor: isSelected ? '#10B981' : (isDarkMode ? '#334155' : '#F1F5F9'),
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#10B981' : (isDarkMode ? '#475569' : '#E2E8F0')
                      }}
                      onPress={() => setSelectedLocation(loc)}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: isSelected ? '#FFFFFF' : (isDarkMode ? '#CBD5E1' : '#475569')
                      }}>
                        📍 {loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* REAL INTERACTIVE OPENSTREETMAP WEBVIEW */}
              <View style={styles.staticMapContainer}>
                <WebView
                  originWhitelist={['*']}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  mixedContentMode="always"
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                        <style>
                          * { -webkit-tap-highlight-color: transparent; }
                          body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: ${isDarkMode ? '#0F172A' : '#F1F5F9'}; }
                          #map { height: 100%; width: 100%; }
                          .leaflet-control-attribution { display: none !important; }
                          ${isDarkMode ? '.leaflet-tile { filter: brightness(0.65) invert(1) contrast(1.3) hue-rotate(200deg); }' : ''}
                          .custom-div-icon {
                            background: transparent !important;
                            border: none !important;
                          }
                          .city-marker {
                            background: #10B981;
                            color: #FFFFFF;
                            padding: 6px 13px;
                            border-radius: 16px;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            font-size: 12px;
                            font-weight: 800;
                            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5);
                            border: 2.2px solid #FFFFFF;
                            white-space: nowrap;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s ease;
                          }
                          .city-marker.active {
                            background: #059669;
                            border-color: #A7F3D0;
                            box-shadow: 0 0 18px rgba(16, 185, 129, 0.9);
                          }
                        </style>
                      </head>
                      <body>
                        <div id="map"></div>
                        <script>
                          var map = L.map('map', { 
                            zoomControl: false, 
                            attributionControl: false,
                            dragging: false, 
                            touchZoom: false, 
                            scrollWheelZoom: false, 
                            doubleClickZoom: false 
                          }).setView([11.14, 123.97], 9.6);
                          
                          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 18
                          }).addTo(map);

                          var locations = [
                            { name: 'Daanbantayan', lat: 11.2589, lng: 124.0153 },
                            { name: 'San Remigio',  lat: 11.0772, lng: 123.9356 },
                            { name: 'Bogo City',     lat: 11.0517, lng: 124.0055 }
                          ];

                          locations.forEach(function(loc) {
                            var isSelected = loc.name === "${selectedLocation}";
                            var customIcon = L.divIcon({
                              className: 'custom-div-icon',
                              html: "<div class='city-marker " + (isSelected ? "active" : "") + "'>📍 " + loc.name + "</div>",
                              iconSize: [110, 32],
                              iconAnchor: [55, 16]
                            });

                            var marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
                            marker.on('click', function() {
                              if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(loc.name);
                              }
                            });
                          });
                        </script>
                      </body>
                      </html>
                    `
                  }}
                  onMessage={(event) => {
                    const cityName = event.nativeEvent.data;
                    if (cityName && locations.includes(cityName)) {
                      setSelectedLocation(cityName);
                    }
                  }}
                  style={{ flex: 1, backgroundColor: 'transparent' }}
                />
              </View>

              {/* SELECTED CITY CULINARY PROFILE BANNER */}
              {CITY_PROFILES[selectedLocation] && (
                <View style={styles.cityDetailCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 6 }}>
                      <Navigation size={14} color={logoGreen} style={{ marginRight: 6 }} />
                      <Text style={styles.cityDetailTitle} numberOfLines={1}>
                        {CITY_PROFILES[selectedLocation].marketTitle || `${selectedLocation} Food Market`}
                      </Text>
                    </View>
                    <View style={styles.cityCostBadge}>
                      <Text style={styles.cityCostBadgeText}>{CITY_PROFILES[selectedLocation].avgCost}</Text>
                    </View>
                  </View>

                  <Text style={styles.citySpecialtyText}>
                    ✨ <Text style={{ fontWeight: '800', color: logoGreen }}>Specialty:</Text> {CITY_PROFILES[selectedLocation].specialty}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                    <ShoppingBag size={12} color={theme?.textSecondary || '#94A3B8'} style={{ marginRight: 5 }} />
                    <Text style={[styles.cityPalengkeText, { flex: 1 }]}>
                      <Text style={{ fontWeight: '700' }}>Palengke Fresh:</Text> {CITY_PROFILES[selectedLocation].palengkeItems}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Clock size={12} color="#F59E0B" style={{ marginRight: 5 }} />
                    <Text style={[styles.cityPalengkeText, { color: theme?.textSecondary || '#64748B', flex: 1 }]}>
                      <Text style={{ fontWeight: '700', color: '#F59E0B' }}>Peak Fresh Catch:</Text> {CITY_PROFILES[selectedLocation].peakHours}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Sparkles size={12} color="#8B5CF6" style={{ marginRight: 5 }} />
                    <Text style={[styles.cityPalengkeText, { color: theme?.textSecondary || '#64748B', flex: 1 }]}>
                      <Text style={{ fontWeight: '700', color: '#8B5CF6' }}>Nutrition Boost:</Text> {CITY_PROFILES[selectedLocation].healthBenefit}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.sectionLabelTitle}>Recommended Local Recipes</Text>
            
            {filteredRecipes.length === 0 ? (
              <View style={styles.emptyFormCard}>
                <Text style={styles.emptyStateText}>No recipes matched your exact targets.</Text>
              </View>
            ) : (
          filteredRecipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
            const isLogged = loggedMeals.includes(`recipe-${recipe.id}`);
            return (
              <View key={recipe.id} style={styles.recipeFormCard}>
                <View style={styles.recipeHeaderRow}>
                  <View style={styles.recipeTitleContainer}>
                    <Text style={styles.recipeMainTitle}>{recipe.title}</Text>
                    <View style={styles.metaBadgeRow}>
                      <View style={[styles.metaBadge, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.10)' }]}>
                        <Clock color="#10B981" size={12} strokeWidth={2.2} />
                        <Text style={[styles.metaBadgeText, { color: '#10B981' }]}>{recipe.time}</Text>
                      </View>
                      <View style={[styles.metaBadge, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.10)' }]}>
                        <Text style={[styles.metaBadgeText, { color: '#F59E0B' }]}>{recipe.budget}</Text>
                      </View>
                      <View style={[styles.metaBadge, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.16)' : 'rgba(14, 165, 233, 0.10)' }]}>
                        <MapPin color="#0EA5E9" size={12} strokeWidth={2.2} />
                        <Text style={[styles.metaBadgeText, { color: '#0EA5E9' }]}>{recipe.location}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.glassDivider} />

                <View style={styles.macroMetricsSummaryGrid}>
                  <View style={styles.macroTileBox}>
                    <Text style={[styles.macroTileValue, { color: '#F97316' }]}>{recipe.calories}</Text>
                    <Text style={styles.macroTileLabel}>Kcal</Text>
                  </View>
                  <View style={[styles.macroTileBox, { borderLeftWidth: 1, borderLeftColor: theme?.border || '#E2E8F0' }]}>
                    <Text style={[styles.macroTileValue, { color: '#10B981' }]}>{recipe.protein}</Text>
                    <Text style={styles.macroTileLabel}>Protein</Text>
                  </View>
                  <View style={[styles.macroTileBox, { borderLeftWidth: 1, borderLeftColor: theme?.border || '#E2E8F0' }]}>
                    <Text style={[styles.macroTileValue, { color: '#F59E0B' }]}>{recipe.carbs}</Text>
                    <Text style={styles.macroTileLabel}>Carbs</Text>
                  </View>
                  <View style={[styles.macroTileBox, { borderLeftWidth: 1, borderLeftColor: theme?.border || '#E2E8F0' }]}>
                    <Text style={[styles.macroTileValue, { color: '#EC4899' }]}>{recipe.fats}</Text>
                    <Text style={styles.macroTileLabel}>Fats</Text>
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.expandedRecipeContentAnimation}>
                    <View style={styles.glassDivider} />
                    <View style={styles.ingredientsBox}>
                      <Text style={styles.extendedSectionHeaderLabel}>Ingredients Needed</Text>
                      {recipe.ingredients.map((ingredient, i) => (
                        <Text key={i} style={styles.recipeListItemRowText}>• {ingredient}</Text>
                      ))}
                    </View>

                    <View style={styles.instructionsBox}>
                      <View style={styles.instructionHeaderFlexTitle}>
                        <ChefHat color={logoGreen} size={16} style={{ marginRight: 6 }} />
                        <Text style={styles.extendedSectionHeaderLabel}>How to Prepare & Cook</Text>
                      </View>
                      {recipe.instructions.map((step, i) => (
                        <View key={i} style={styles.stepParagraphBlockItemRow}>
                          <Text style={styles.stepIndexMarkerBadgeText}>{i + 1}</Text>
                          <Text style={styles.stepBodyInstructionParagraphText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.glassDivider} />

                <View style={styles.recipeFooterActions}>

                  <TouchableOpacity 
                    style={[styles.fullRecipeViewToggleButton, isExpanded && styles.fullRecipeViewToggleActiveButton]}
                    activeOpacity={0.8}
                    onPress={() => toggleExpandRecipe(recipe.id)}
                  >
                    <Text style={[styles.fullRecipeToggleButtonText, isExpanded && { color: '#FFFFFF' }]}>
                      {isExpanded ? 'Hide Details' : 'View Recipe'}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp color={isExpanded ? '#FFFFFF' : logoGreen} size={16} />
                    ) : (
                      <ChevronDown color={logoGreen} size={16} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.logRecipeBtn, isLogged && styles.logRecipeBtnLogged]}
                    onPress={() => handleLogMeal(`recipe-${recipe.id}`, {
                      name: recipe.title,
                      calories: recipe.calories,
                      protein: parseInt(recipe.protein) || 0,
                      carbs: parseInt(recipe.carbs) || 0,
                      fats: parseInt(recipe.fats) || 0,
                    })}
                    activeOpacity={0.8}
                  >
                    {isLogged ? (
                      <>
                        <CheckCircle2 color="#FFFFFF" size={14} />
                        <Text style={styles.logRecipeBtnTextLogged}>Logged</Text>
                      </>
                    ) : (
                      <>
                        <PlusCircle color="#FFFFFF" size={14} />
                        <Text style={styles.logRecipeBtnText}>Log Meal</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        </View>
      )}
      </ScrollView>

      {/* --- FLOATING AI CHATBOT SYSTEM (WIRED UP TOGGLE HUB) --- */}

      {/* ── RECIPE MODAL ── */}
      <Modal visible={showRecipeModal} transparent={false} animationType="slide" onRequestClose={() => setShowRecipeModal(false)}>
        <View style={styles.recipeModalContent}>
          {selectedRecipe && (
            <>
              <Text style={styles.recipeModalTitle}>{selectedRecipe.title}</Text>
              
              {/* Meta Row */}
              <View style={styles.recipeModalMetaRow}>
                <View style={styles.recipeModalMetaBadge}>
                  <Clock color={logoGreen} size={12} />
                  <Text style={styles.recipeModalMetaText}>{selectedRecipe.time || '15 mins'}</Text>
                </View>
                <View style={[styles.recipeModalMetaBadge, { marginLeft: 8 }]}>
                  <Text style={{ color: logoGreen, fontSize: 13, fontWeight: '700', marginRight: 3 }}>₱</Text>
                  <Text style={styles.recipeModalMetaText}>{selectedRecipe.budget || 'Under ₱100'}</Text>
                </View>
              </View>

              {/* Macro Details Grid */}
              <View style={styles.recipeModalMacrosGrid}>
                <View style={styles.recipeModalMacroBox}>
                  <Text style={[styles.recipeModalMacroVal, { color: '#F97316' }]}>{selectedRecipe.calories}</Text>
                  <Text style={styles.recipeModalMacroLabel}>Kcal</Text>
                </View>
                <View style={[styles.recipeModalMacroBox, { borderLeftWidth: 1, borderLeftColor: theme?.border || '#E2E8F0' }]}>
                  <Text style={[styles.recipeModalMacroVal, { color: '#10B981' }]}>{selectedRecipe.protein}</Text>
                  <Text style={styles.recipeModalMacroLabel}>Protein</Text>
                </View>
                <View style={[styles.recipeModalMacroBox, { borderLeftWidth: 1, borderLeftColor: theme?.border || '#E2E8F0' }]}>
                  <Text style={[styles.recipeModalMacroVal, { color: '#F59E0B' }]}>{selectedRecipe.carbs}</Text>
                  <Text style={styles.recipeModalMacroLabel}>Carbs</Text>
                </View>
                <View style={[styles.recipeModalMacroBox, { borderLeftWidth: 1, borderLeftColor: theme?.border || '#E2E8F0' }]}>
                  <Text style={[styles.recipeModalMacroVal, { color: '#EC4899' }]}>{selectedRecipe.fats}</Text>
                  <Text style={styles.recipeModalMacroLabel}>Fats</Text>
                </View>
              </View>

              {/* Ingredients & Instructions Scroll */}
              <ScrollView showsVerticalScrollIndicator={false} style={styles.recipeModalScroll}>
                <View style={styles.recipeModalIngredientsBox}>
                  <Text style={styles.recipeModalSecTitle}>Ingredients</Text>
                  {(selectedRecipe.ingredients || []).map((ing, i) => (
                    <Text key={i} style={styles.recipeModalListItem}>• {ing}</Text>
                  ))}
                </View>

                <View style={styles.recipeModalInstructionsBox}>
                  <Text style={styles.recipeModalSecTitle}>Instructions</Text>
                  {(selectedRecipe.instructions || []).map((step, i) => (
                    <View key={i} style={styles.recipeModalStepRow}>
                      <Text style={styles.recipeModalStepNum}>{i + 1}</Text>
                      <Text style={styles.recipeModalStepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity style={styles.recipeModalCloseBtn} onPress={() => setShowRecipeModal(false)}>
                <Text style={styles.recipeModalCloseBtnText}>Dismiss Recipe</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      {/* ── FULL SCREEN INTERACTIVE MAP MODAL ── */}
      <Modal
        visible={showFullMapModal}
        animationType="slide"
        onRequestClose={() => setShowFullMapModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' }}>
          {/* Header Bar */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingHorizontal: 20,
            paddingBottom: 16,
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0',
            zIndex: 10
          }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                🗺️ Full Northern Cebu Food Map
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 }}>
                Tap any city marker to select local food market
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowFullMapModal(false)}
              style={{
                padding: 8,
                backgroundColor: isDarkMode ? '#334155' : '#F1F5F9',
                borderRadius: 20
              }}
            >
              <X color={isDarkMode ? '#F8FAFC' : '#0F172A'} size={20} />
            </TouchableOpacity>
          </View>

          {/* FULLSCREEN INTERACTIVE OPENSTREETMAP WEBVIEW */}
          <View style={{ flex: 1 }}>
            <WebView
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mixedContentMode="always"
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                    <style>
                      * { -webkit-tap-highlight-color: transparent; }
                      body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: ${isDarkMode ? '#0F172A' : '#F1F5F9'}; }
                      #map { height: 100%; width: 100%; }
                      .leaflet-control-attribution { display: none !important; }
                      ${isDarkMode ? '.leaflet-tile { filter: brightness(0.65) invert(1) contrast(1.3) hue-rotate(200deg); }' : ''}
                      .city-marker {
                        background: #10B981;
                        color: white;
                        padding: 7px 14px;
                        border-radius: 18px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        font-size: 13px;
                        font-weight: 800;
                        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5);
                        border: 2.5px solid white;
                        white-space: nowrap;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      }
                      .city-marker.active {
                        background: #059669;
                        border-color: #A7F3D0;
                        box-shadow: 0 0 20px rgba(16, 185, 129, 0.9);
                      }
                    </style>
                  </head>
                  <body>
                    <div id="map"></div>
                    <script>
                      var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([11.12, 123.98], 10);
                      
                      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 18
                      }).addTo(map);

                      var locations = [
                        { name: 'Daanbantayan', lat: 11.2589, lng: 124.0153 },
                        { name: 'San Remigio', lat: 11.0827, lng: 123.9536 },
                        { name: 'Bogo City', lat: 11.0500, lng: 124.0053 }
                      ];

                      locations.forEach(function(loc) {
                        var isSelected = loc.name === "${selectedLocation}";
                        var customIcon = L.divIcon({
                          className: 'custom-div-icon',
                          html: "<div class='city-marker " + (isSelected ? "active" : "") + "'>📍 " + loc.name + "</div>",
                          iconSize: [110, 36],
                          iconAnchor: [55, 18]
                        });

                        var marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
                        marker.on('click', function() {
                          if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(loc.name);
                          }
                        });
                      });
                    </script>
                  </body>
                  </html>
                `
              }}
              onMessage={(event) => {
                const cityName = event.nativeEvent.data;
                if (cityName && locations.includes(cityName)) {
                  setSelectedLocation(cityName);
                }
              }}
              style={{ flex: 1 }}
            />
          </View>

          {/* Bottom Floating City Bar */}
          <View style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 36 : 20,
            left: 20,
            right: 20,
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderRadius: 20,
            padding: 16,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            borderWidth: 1.5,
            borderColor: '#10B981'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: isDarkMode ? '#F8FAFC' : '#0F172A' }} numberOfLines={1}>
                  📍 {CITY_PROFILES[selectedLocation]?.marketTitle || selectedLocation}
                </Text>
                <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
                  ✨ {CITY_PROFILES[selectedLocation]?.specialty}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFullMapModal(false)}
                style={{
                  backgroundColor: '#10B981',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 14
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── UIVERSE INSPIRED AI LOADING MODAL ── */}
      <AILoadingModal
        visible={isGenerating || isFetchingRecipe}
        type={isFetchingRecipe ? "recipe" : "meal"}
        title={isFetchingRecipe ? "Crafting Custom Recipe" : "Generating Custom AI Recipe"}
        subtitle="Vita AI is personalizing your nutrition"
      />
    </View>
  );
}

const baseColor = '#F8FAFC';
const logoGreen = '#10B981';        

const getStyles = (theme) => StyleSheet.create({
  fullscreenOverlay: { 
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0, 
    width: screenWidth, 
    height: screenHeight, 
    backgroundColor: theme?.background || baseColor,
  },
  container: { 
    flex: 1,
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 54 : 48, 
    paddingBottom: 85,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16, 
    paddingHorizontal: 4, 
    width: '100%',
  },
  headerTextGroup: { 
    flex: 1,
  },
  appName: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: logoGreen, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 2,
  },
  greeting: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A', 
    letterSpacing: -0.5,
  },
  subGreeting: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: theme?.textSecondary || '#64748B', 
    marginTop: 2,
  },
  searchFormCard: {
    backgroundColor: theme?.surface || baseColor, 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 4, 
    marginBottom: 14,
    borderWidth: 1.2, 
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  searchBarInnerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 46,
  },
  searchIcon: { 
    marginRight: 10,
  },
  searchTextInput: { 
    flex: 1, 
    fontSize: 14, 
    fontWeight: '700', 
    color: theme?.textPrimary || '#0F172A',
  },
  formCard: {
    backgroundColor: theme?.surface || baseColor, 
    borderRadius: 20, 
    padding: 18, 
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  cardTitle: { 
    fontSize: 11, 
    color: theme?.textPrimary || '#64748B', 
    textTransform: 'uppercase', 
    letterSpacing: 1.2, 
    marginBottom: 10, 
    fontWeight: '800', 
    marginLeft: 2,
  },
  sectionLabelTitle: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A', 
    marginBottom: 12, 
    marginLeft: 4, 
    letterSpacing: -0.2,
  },
  filterButtonGroupRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
  },
  filterChipButton: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 16, 
    marginRight: 8, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: theme?.border || '#E2E8F0',
  },
  filterChipInactive: { 
    backgroundColor: theme?.surface || baseColor,
  },
  filterChipActive: { 
    backgroundColor: logoGreen, 
    borderColor: logoGreen,
  },
  filterChipText: { 
    fontSize: 12, 
    fontWeight: '800',
  },
  glassDivider: { 
    height: 1, 
    backgroundColor: theme?.border || '#E2E8F0', 
    marginVertical: 12,
  },
  recipeFormCard: {
    backgroundColor: theme?.surface || baseColor, 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 14,
    borderWidth: 1.2,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  recipeHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
  },
  recipeTitleContainer: { 
    flex: 1,
  },
  recipeMainTitle: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A', 
    marginBottom: 6, 
    lineHeight: 20,
  },
  metaBadgeRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginTop: 2,
  },
  metaBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme?.cardBg || '#EBEBEB', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 10, 
    marginRight: 6, 
    marginBottom: 4,
  },
  metaBadgeText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: theme?.primary || '#64748B', 
    marginLeft: 4,
  },
  macroMetricsSummaryGrid: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 4,
  },
  macroTileBox: { 
    flex: 1, 
    alignItems: 'center',
  },
  macroTileValue: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A',
  },
  macroTileLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: theme?.textSecondary || '#94A3B8', 
    marginTop: 2,
  },
  expandedRecipeContentAnimation: { 
    marginTop: 4,
  },
  ingredientsBox: { 
    backgroundColor: theme?.cardBg || '#F1F5F9', 
    padding: 14, 
    borderRadius: 18, 
    marginBottom: 12,
  },
  extendedSectionHeaderLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: theme?.primary || '#64748B', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5, 
    marginBottom: 8,
  },
  recipeListItemRowText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme?.textPrimary || '#0F172A', 
    marginBottom: 4,
  },
  instructionsBox: { 
    backgroundColor: theme?.cardBg || '#F8FAFC', 
    padding: 14, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: theme?.border || '#E2E8F0',
  },
  instructionHeaderFlexTitle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8,
  },
  stepParagraphBlockItemRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 10,
  },
  stepIndexMarkerBadgeText: { 
    backgroundColor: '#10B981', 
    color: '#FFFFFF', 
    fontSize: 10, 
    fontWeight: '900', 
    width: 18, 
    height: 18, 
    borderRadius: 9, 
    textAlign: 'center', 
    lineHeight: 18, 
    marginRight: 8, 
    marginTop: 2,
  },
  stepBodyInstructionParagraphText: { 
    flex: 1, 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme?.textPrimary || '#10B981', 
    lineHeight: 18,
  },
  fullRecipeViewToggleButton: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: theme?.surface || baseColor, 
    paddingVertical: 12, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: theme?.border || '#E2E8F0',
    marginRight: 8,
  },
  fullRecipeViewToggleActiveButton: { 
    backgroundColor: '#10B981', 
    borderColor: '#10B981',
  },
  fullRecipeToggleButtonText: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#10B981', 
    marginRight: 6,
  },
  recipeFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logRecipeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: logoGreen,
    paddingVertical: 12,
    borderRadius: 16,
  },
  logRecipeBtnLogged: {
    backgroundColor: '#64748B',
  },
  logRecipeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 6,
  },
  logRecipeBtnTextLogged: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 6,
  },
  aiGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 8,
  },
  aiGenerateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  warningBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  warningBadgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  // --- TAB SWITCHER UI ---
  tabSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: theme?.cardBg || '#EBEBEB',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1.2,
    borderColor: theme?.border || '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: theme?.surface || baseColor,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: '800',
    color: logoGreen,
  },
  tabTextInactive: {
    fontSize: 13,
    fontWeight: '700',
    color: theme?.textSecondary || '#94A3B8',
  },
  // --- DAILY PLAN UI ---
  dailyProgressCard: {
    backgroundColor: 'transparent', 
    borderRadius: 24, 
    padding: 0, 
    marginBottom: 24,
  },
  macroRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroMiniBox: {
    flex: 1,
    backgroundColor: theme?.surface || baseColor,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  macroMiniVal: {
    fontSize: 14,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
  },
  macroMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme?.textSecondary || '#94A3B8',
    marginTop: 2,
  },
  timelineContainer: {
    marginTop: 6,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  timelineCard: {
    flex: 1,
    backgroundColor: theme?.surface || '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  timelineCardLogged: {
    backgroundColor: theme?.cardBg || '#F8FAFC',
    borderWidth: 1.5,
    borderColor: theme?.border || '#CBD5E1',
    opacity: 0.85,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme?.cardBg || '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mealTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: logoGreen,
    marginLeft: 4,
  },
  timelineTime: {
    fontSize: 11,
    fontWeight: '700',
    color: theme?.textSecondary || '#94A3B8',
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme?.textPrimary || '#0F172A',
    marginBottom: 10,
  },
  timelineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme?.border || '#F8FAFC',
    paddingTop: 10,
  },
  timelineMacroText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme?.textSecondary || '#64748B',
  },
  logMealMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: logoGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  logMealMiniBtnLogged: {
    backgroundColor: '#94A3B8',
  },
  logMealMiniBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  logMealMiniBtnTextLogged: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  emptyFormCard: { 
    padding: 32, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  emptyStateText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: theme?.textSecondary || '#64748B',
  },
  floatingChatbotContainer: { 
    position: 'absolute', 
    bottom: 104, 
    right: 20, 
    zIndex: 99,
  },
  chatbotFloatingButton: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  chatbotUnpressed: { 
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  chatbotPressed: { 
    backgroundColor: '#059669',
    transform: [{ scale: 0.95 }],
  },

  staticMapContainer: {
    height: 235,
    width: '100%',
    backgroundColor: theme?.inputBg || '#F1F5F9', 
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: theme?.border || '#E2E8F0',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mapGridPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
  },
  mapCoastline: {
    position: 'absolute',
    top: -50,
    left: -20,
    width: 210,
    height: 300,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 100,
  },
  mapRouteLine: {
    position: 'absolute',
    top: '15%',
    left: '42%',
    width: 2,
    height: '70%',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    transform: [{ rotate: '15deg' }],
  },
  mapPinContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    top: -6,
  },
  mapPinLabel: {
    fontSize: 10,
    color: theme?.textSecondary || '#94A3B8',
    fontWeight: '700',
    marginTop: 2,
  },
  mapPinLabelActive: {
    color: logoGreen,
    fontWeight: '900',
    fontSize: 11,
  },
  cityDetailCard: {
    backgroundColor: theme?.inputBg || '#F1F5F9',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
    marginBottom: 16,
  },
  cityDetailTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
  },
  cityCostBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cityCostBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: logoGreen,
  },
  citySpecialtyText: {
    fontSize: 12,
    color: theme?.textPrimary || '#0F172A',
    fontWeight: '600',
    marginTop: 2,
  },
  cityPalengkeText: {
    fontSize: 11,
    color: theme?.textSecondary || '#64748B',
    flex: 1,
  },
  staticMapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
    backgroundColor: theme?.cardBackground || '#FFFFFF',
  },
  aiGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: logoGreen,
    paddingVertical: 10,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 8,
    shadowOpacity: 0,
    elevation: 0,
  },
  aiGenerateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  // --- View Recipe Button Styles ---
  viewRecipeTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  viewRecipeTextBtnLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: logoGreen,
  },
  // --- View Recipe Modal Styles ---
  recipeModalContent: {
    flex: 1,
    backgroundColor: baseColor,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  recipeModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  recipeModalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  recipeModalMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBEBEB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  recipeModalMetaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  recipeModalMacrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    marginBottom: 16,
  },
  recipeModalMacroBox: {
    flex: 1,
    alignItems: 'center',
  },
  recipeModalMacroVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  recipeModalMacroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  recipeModalScroll: {
    flex: 1,
    marginBottom: 16,
  },
  recipeModalIngredientsBox: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  recipeModalInstructionsBox: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recipeModalSecTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  recipeModalListItem: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 18,
  },
  recipeModalStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recipeModalStepNum: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    marginRight: 8,
    marginTop: 2,
  },
  recipeModalStepText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    lineHeight: 18,
  },
  recipeModalCloseBtn: {
    backgroundColor: logoGreen,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeModalCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  loadingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 35, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModalContent: {
    backgroundColor: baseColor,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingModalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 12,
  },
  loaderOuterNeu: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: baseColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loaderTextTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  loaderTextDesc: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});