import React, { useState, useEffect } from 'react';
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
  Modal
} from 'react-native';
import { Search, MapPin, Clock, BotMessageSquare, Home, UtensilsCrossed, SportShoe, Settings, Camera, ChevronDown, ChevronUp, ChefHat, CheckCircle2, PlusCircle, Coffee, Sun, Moon, Flame, Sparkles, DollarSign } from 'lucide-react-native';
import { recommendedRecipesPool } from '../../data/recipes';
import API_URL from '../config/api';
import { addToSyncQueue, updateCachedDashboardField } from '../../services/OfflineStorage';
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

import AsyncStorage from '@react-native-async-storage/async-storage';

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
  isOnline = true
}) {
  // Static Recipes for Default Scheduled Meals (Offline Fallback)
  const DEFAULT_RECIPES = {
    dp1: {
      id: 'dp1',
      title: 'Local Eggs & Pandesal',
      calories: 320,
      protein: '15g',
      carbs: '35g',
      fats: '12g',
      time: '10 mins',
      budget: 'Under ₱100',
      location: 'San Remigio',
      ingredients: [
        '2 fresh local eggs',
        '2 pieces whole-wheat or regular pandesal bread',
        '1 tsp oil or butter for frying',
        'Pinch of salt and black pepper'
      ],
      instructions: [
        'Heat oil or butter in a non-stick pan over medium heat.',
        'Crack the eggs in and cook scrambled or sunny-side-up as preferred.',
        'Toast your pandesal slices lightly in a toaster or pan.',
        'Plate the hot toasted pandesal, serve with the cooked eggs, and optionally season with salt and pepper.'
      ]
    },
    dp2: {
      id: 'dp2',
      title: 'Chicken Adobo & Rice',
      calories: 550,
      protein: '35g',
      carbs: '65g',
      fats: '14g',
      time: '35 mins',
      budget: '₱100 - ₱300',
      location: 'San Remigio',
      ingredients: [
        '150g skinless chicken thigh or breast, chopped',
        '1 cup cooked white or brown rice',
        '2 tbsp soy sauce',
        '1 tbsp vinegar',
        '2 cloves garlic, crushed',
        '1 dried bay leaf',
        '1/2 tsp whole black peppercorns'
      ],
      instructions: [
        'Combine chicken, soy sauce, garlic, and peppercorns in a bowl. Marinate for 10-15 minutes.',
        'Heat a pot over medium-high heat and sear the chicken pieces until lightly browned.',
        'Pour in the marinade, vinegar, and add the bay leaf. Bring to a boil, then cover and lower the heat to simmer for 20 minutes.',
        'Serve hot chicken adobo with its savory sauce over a cup of steamed rice.'
      ]
    },
    dp3: {
      id: 'dp3',
      title: 'Banana & Peanut Butter',
      calories: 220,
      protein: '6g',
      carbs: '28g',
      fats: '11g',
      time: '5 mins',
      budget: 'Under ₱100',
      location: 'San Remigio',
      ingredients: [
        '1 medium local banana (Lakatan or Latundan)',
        '1.5 tbsp natural unsweetened peanut butter'
      ],
      instructions: [
        'Peel the banana and slice it horizontally or into bite-sized coins.',
        'Spread the natural peanut butter evenly across the banana slices.',
        'Eat immediately for a quick pre-workout carb and healthy fat boost.'
      ]
    },
    dp4: {
      id: 'dp4',
      title: 'Grilled Fish & Veggies',
      calories: 410,
      protein: '32g',
      carbs: '12g',
      fats: '9g',
      time: '20 mins',
      budget: '₱100 - ₱300',
      location: 'San Remigio',
      ingredients: [
        '150g fresh local fish fillet (bangus, lapu-lapu, or tilapya)',
        '1 cup chopped local vegetables (kangkong, sitaw, eggplant)',
        '1 tsp calamansi juice',
        '1 tsp olive or coconut oil',
        'Salt and pepper to taste'
      ],
      instructions: [
        'Season fish fillet with calamansi juice, salt, and pepper.',
        'Brush a pan with oil, heat it, and grill the fish for 4-5 minutes on each side until cooked through.',
        'Steam or blanch the mixed vegetables in boiling water for 3-5 minutes until tender-crisp.',
        'Serve the grilled fish hot alongside the steamed local veggies.'
      ]
    }
  };

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isFetchingRecipe, setIsFetchingRecipe] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  const handleViewRecipe = async (meal) => {
    if (DEFAULT_RECIPES[meal.id]) {
      setSelectedRecipe(DEFAULT_RECIPES[meal.id]);
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
          ingredients: meal.title,
          budget: 'All',
          location: selectedLocation || 'San Remigio'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recipe');
      }

      const data = await response.json();
      setSelectedRecipe(data);
      setShowRecipeModal(true);
    } catch (error) {
      console.error("VIEW RECIPE ERROR:", error);
      Alert.alert('Unable to load recipe', 'Failed to retrieve recipe from AI. Please check your network connection.');
    } finally {
      setIsFetchingRecipe(false);
    }
  };

  // Use global persisted state so logged meals survive tab switches
  const loggedMeals = globalLoggedMeals;
  const setLoggedMeals = setGlobalLoggedMeals || (() => {});
  const [recipes, setRecipes] = useState(
    sessionRecipes && sessionRecipes.length > 0 
      ? sessionRecipes 
      : recommendedRecipesPool.slice(0, 4)
  );

  useEffect(() => {
    if (sessionRecipes && sessionRecipes.length > 0) {
      setRecipes(sessionRecipes);
    }
  }, [sessionRecipes]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('San Remigio');
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  
  // New UI States
  const [activeDietTab, setActiveDietTab] = useState('PLAN'); // 'PLAN' or 'EXPLORE'

  const budgetTiers = ['All', 'Under ₱100', '₱100 - ₱300', 'Over ₱300'];
  const locations = ['San Remigio', 'Bogo City', 'Daanbantayan'];
  
  const [selectedAllergy, setSelectedAllergy] = useState('None');
  const allergyList = ['None', 'Peanuts', 'Dairy', 'Gluten', 'Seafood'];

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

  const getMealAccentColor = (mealType) => {
    switch (mealType) {
      case 'Breakfast': return '#F28D52';
      case 'Lunch': return '#E4B53D';
      case 'Snack': return '#5FB496';
      case 'Dinner': return '#6A82E6';
      default: return '#4EA685';
    }
  };

  // Mapping helper to resolve Lucide icon components from meal type names
  const getMealIconComponent = (mealType) => {
    switch (mealType) {
      case 'Breakfast': return Coffee;
      case 'Lunch': return Sun;
      case 'Snack': return Flame;
      case 'Dinner': return Moon;
      default: return UtensilsCrossed;
    }
  };

  // AI Daily Meal Recommendation State
  const [dailyPlan, setDailyPlan] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(true);

  useEffect(() => {
    const loadCachedOrFetchMeals = async () => {
      try {
        setLoadingMeals(true);
        const todayStr = new Date().toISOString().split('T')[0]; // e.g. "2026-07-09"

        // 1. Check local cache
        const cachedRaw = await AsyncStorage.getItem('ms_meals_cache');
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed.userId === userId && parsed.date === todayStr && Array.isArray(parsed.meals)) {
            setDailyPlan(parsed.meals);
            setLoadingMeals(false);
            return; // Cache hit!
          }
        }

        // 2. Cache miss: Fetch from backend
        const res = await fetch(`${API_URL}/meals/recommend/${userId || 'default'}`);
        if (!res.ok) {
          throw new Error("Failed to fetch custom meal suggestions");
        }
        const data = await res.json();
        setDailyPlan(data);

        // 3. Save to local cache
        const cachePayload = {
          userId,
          date: todayStr,
          meals: data
        };
        await AsyncStorage.setItem('ms_meals_cache', JSON.stringify(cachePayload));
      } catch (err) {
        console.warn("MEAL RECOMMENDATION LOAD ERROR:", err);
      } finally {
        setLoadingMeals(false);
      }
    };

    if (userId) {
      loadCachedOrFetchMeals();
    } else {
      setLoadingMeals(false);
    }
  }, [userId]);

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);
  const toggleExpandRecipe = (id) => setExpandedRecipeId(expandedRecipeId === id ? null : id);

  const handleGenerateRecipe = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Ingredients Required', 'Please enter some ingredients in the search bar first.');
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
          ingredients: searchQuery,
          budget: selectedBudget,
          location: selectedLocation
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate recipe');
      }
      const data = await response.json();
      setRecipes(prev => [data, ...prev]);
      setExpandedRecipeId(data.id);
      Alert.alert('Success', 'AI generated a healthy recipe matching your preferences!');
    } catch (error) {
      console.error("GENERATE RECIPE ERROR:", error);
      Alert.alert('Generation Failed', 'Failed to generate recipe with AI. Please check your network and try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleLogMeal = async (id, macros) => {
    if (!userId) {
      Alert.alert("Authentication Error", "You must be logged in to log meals.");
      return;
    }

    const isRecipe = id.startsWith('recipe-');
    const mealName = macros.name || (isRecipe ? recipes.find(r => `recipe-${r.id}` === id)?.title : null) || 'Meal';
    const mealPayload = {
      id,
      user_id: userId,
      name: mealName,
      calories: macros.calories || 0,
      protein: macros.protein || 0,
      carbs: macros.carbs || 0,
      fats: macros.fats || 0
    };

    if (!loggedMeals.includes(id)) {
      // Optimistic UI updates
      const updatedLoggedMeals = [...loggedMeals, id];
      setLoggedMeals(updatedLoggedMeals);
      
      let newNutrition = null;
      if (setDailyNutrition && macros) {
        setDailyNutrition(prev => {
          const next = {
            ...prev,
            consumedCalories: prev.consumedCalories + macros.calories,
            protein: { ...prev.protein, current: prev.protein.current + macros.protein },
            carbs: { ...prev.carbs, current: prev.carbs.current + macros.carbs },
            fats: { ...prev.fats, current: prev.fats.current + macros.fats }
          };
          newNutrition = next;
          return next;
        });
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
        Alert.alert('📴 Saved Offline', 'Meal logged locally. Will sync when back online.');
        return;
      }

      // Online: call API but handle failure gracefully
      try {
        const response = await fetch(`${API_URL}/meals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mealPayload),
        });

        if (!response.ok) {
          throw new Error('Failed to log meal on server');
        }
      } catch (error) {
        console.warn("LOG MEAL API ERROR (falling back to queue):", error);
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
        Alert.alert('📴 Saved Offline', 'Meal removed locally. Will sync when back online.');
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
        console.warn("DELETE MEAL API ERROR (falling back to queue):", error);
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
    const matchesBudget = selectedBudget === 'All' || recipe.budget === selectedBudget;
    const matchesLocation = recipe.location === selectedLocation;
    const matchesAllergy = selectedAllergy === 'None' || !(recipe.allergies || []).includes(selectedAllergy);
    const ingredientsString = recipe.ingredients.join(', ').toLowerCase();
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ingredientsString.includes(searchQuery.toLowerCase());
    return matchesBudget && matchesLocation && matchesAllergy && matchesSearch;
  });

  const consumedCalories = dailyNutrition?.consumedCalories || 0;
  const isOverCalories = consumedCalories > targetCalories;

  if (loadingMeals) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: baseColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor={baseColor} />
        <View style={styles.loaderOuterNeu}>
          <ActivityIndicator size="large" color={logoGreen} />
        </View>
        <Text style={styles.loaderTextTitle}>AI Dietitian Active</Text>
        <Text style={styles.loaderTextDesc}>Customizing today's meal suggestions based on your target macros...</Text>
      </View>
    );
  }

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
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
                  <Text style={[styles.macroMiniVal, isOverCalories && { color: '#C53030' }]}>
                    {consumedCalories} / {targetCalories}
                  </Text>
                  <Text style={styles.macroMiniLabel}>Kcal</Text>
                </View>
                <View style={styles.macroMiniBox}><Text style={styles.macroMiniVal}>{dailyNutrition?.protein?.current || 0}g</Text><Text style={styles.macroMiniLabel}>Protein</Text></View>
                <View style={styles.macroMiniBox}><Text style={styles.macroMiniVal}>{dailyNutrition?.carbs?.current || 0}g</Text><Text style={styles.macroMiniLabel}>Carbs</Text></View>
                <View style={styles.macroMiniBox}><Text style={styles.macroMiniVal}>{dailyNutrition?.fats?.current || 0}g</Text><Text style={styles.macroMiniLabel}>Fats</Text></View>
              </View>
            </View>

            <Text style={styles.sectionLabelTitle}>Your Scheduled Meals</Text>
            <View style={styles.timelineContainer}>
              {dailyPlan.map((meal, index) => {
                const IconComponent = getMealIconComponent(meal.mealType);
                const isLogged = loggedMeals.includes(meal.id);
                return (
                  <View key={meal.id} style={styles.timelineItem}>
                    <View 
                      style={[
                        styles.timelineCard, 
                        isLogged && styles.timelineCardLogged,
                        { borderLeftColor: getMealAccentColor(meal.mealType), borderLeftWidth: 5 }
                      ]}
                    >
                      <View style={styles.timelineHeader}>
                        <View style={[styles.mealTypeBadge, isLogged && { backgroundColor: '#37745D' }]}>
                          <IconComponent color={isLogged ? '#FFFFFF' : logoGreen} size={12} />
                          <Text style={[styles.mealTypeBadgeText, isLogged && { color: '#FFFFFF' }]}>{meal.mealType}</Text>
                        </View>
                        <Text style={styles.timelineTime}>{meal.time}</Text>
                      </View>
                      <Text style={[styles.timelineTitle, isLogged && { color: '#41544B' }]}>{meal.title}</Text>
                      <View style={styles.timelineFooter}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.timelineMacroText}>{meal.calories} kcal • {meal.protein} protein</Text>
                          <TouchableOpacity 
                            style={styles.viewRecipeTextBtn} 
                            onPress={() => handleViewRecipe(meal)}
                            activeOpacity={0.6}
                          >
                            <ChefHat color={logoGreen} size={14} style={{ marginRight: 4 }} />
                            <Text style={styles.viewRecipeTextBtnLabel}>View Recipe</Text>
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity 
                          style={[styles.logMealMiniBtn, isLogged && styles.logMealMiniBtnLogged]}
                          onPress={() => handleLogMeal(meal.id, { 
                            name: meal.title,
                            calories: meal.calories, 
                            protein: parseInt(meal.protein) || 0,
                            carbs: parseInt(meal.carbs) || 0,
                            fats: parseInt(meal.fats) || 0
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
              })}
            </View>
          </View>
        ) : (
          /* --- TAB B: EXPLORE RECIPES --- */
          <View style={styles.exploreSection}>
            <View style={styles.searchFormCard}>
              <View style={styles.searchBarInnerContainer}>
                <Search color="#556B60" size={20} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchTextInput}
                  placeholder="Search ingredients or meals..."
                  placeholderTextColor="#7FA293"
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
                      <Text style={styles.aiGenerateBtnText}>Generate recipe with Gemini</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Budget Preferences</Text>
              <View style={styles.filterButtonGroupRow}>
                {budgetTiers.map((tier) => (
                  <TouchableOpacity
                    key={tier}
                    style={[styles.filterChipButton, selectedBudget === tier ? styles.filterChipActive : styles.filterChipInactive]}
                    onPress={() => setSelectedBudget(tier)}
                  >
                    <Text style={[styles.filterChipText, { color: selectedBudget === tier ? '#FFFFFF' : '#41544B' }]}>{tier}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.glassDivider} />

              <Text style={styles.cardTitle}>📍 Local Food Radar</Text>

              {/* STATIC VISUAL MAP REPLACEMENT */}
              <View style={styles.staticMapContainer}>
                {/* Decorative Map Background Elements */}
                <View style={styles.mapCoastline} />
                <View style={styles.mapRouteLine} />

                {/* Daanbantayan Pin */}
                <TouchableOpacity 
                  style={[styles.mapPinContainer, { top: '15%', left: '42%' }]}
                  onPress={() => setSelectedLocation('Daanbantayan')}
                  activeOpacity={0.8}
                >
                  <MapPin 
                    color={selectedLocation === 'Daanbantayan' ? logoGreen : '#7FA293'} 
                    size={selectedLocation === 'Daanbantayan' ? 32 : 24} 
                  />
                  <Text style={[styles.mapPinLabel, selectedLocation === 'Daanbantayan' && styles.mapPinLabelActive]}>Daanbantayan</Text>
                </TouchableOpacity>

                {/* San Remigio Pin */}
                <TouchableOpacity 
                  style={[styles.mapPinContainer, { top: '45%', left: '15%' }]}
                  onPress={() => setSelectedLocation('San Remigio')}
                  activeOpacity={0.8}
                >
                  <MapPin 
                    color={selectedLocation === 'San Remigio' ? logoGreen : '#7FA293'} 
                    size={selectedLocation === 'San Remigio' ? 32 : 24} 
                  />
                  <Text style={[styles.mapPinLabel, selectedLocation === 'San Remigio' && styles.mapPinLabelActive]}>San Remigio</Text>
                </TouchableOpacity>

                {/* Bogo City Pin */}
                <TouchableOpacity 
                  style={[styles.mapPinContainer, { top: '65%', left: '55%' }]}
                  onPress={() => setSelectedLocation('Bogo City')}
                  activeOpacity={0.8}
                >
                  <MapPin 
                    color={selectedLocation === 'Bogo City' ? logoGreen : '#7FA293'} 
                    size={selectedLocation === 'Bogo City' ? 32 : 24} 
                  />
                  <Text style={[styles.mapPinLabel, selectedLocation === 'Bogo City' && styles.mapPinLabelActive]}>Bogo City</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterButtonGroupRow}>
                {locations.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.filterChipButton, selectedLocation === loc ? styles.filterChipActive : styles.filterChipInactive]}
                    onPress={() => setSelectedLocation(loc)}
                  >
                    <Text style={[styles.filterChipText, { color: selectedLocation === loc ? '#FFFFFF' : '#41544B' }]}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.glassDivider} />

              <Text style={styles.cardTitle}>Allergy Filtering</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                <View style={styles.filterButtonGroupRow}>
                  {allergyList.map((allergy) => (
                    <TouchableOpacity
                      key={allergy}
                      style={[styles.filterChipButton, selectedAllergy === allergy ? styles.filterChipActive : styles.filterChipInactive]}
                      onPress={() => setSelectedAllergy(allergy)}
                    >
                      <Text style={[styles.filterChipText, { color: selectedAllergy === allergy ? '#FFFFFF' : '#41544B' }]}>{allergy}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <Text style={styles.sectionLabelTitle}>Dynamic Recommendations</Text>
            
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
                      <View style={styles.metaBadge}>
                        <Clock color={logoGreen} size={12} />
                        <Text style={styles.metaBadgeText}>{recipe.time}</Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>{recipe.budget}</Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <MapPin color={logoGreen} size={12} />
                        <Text style={styles.metaBadgeText}>{recipe.location}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.glassDivider} />

                <View style={styles.macroMetricsSummaryGrid}>
                  <View style={styles.macroTileBox}>
                    <Text style={styles.macroTileValue}>{recipe.calories}</Text>
                    <Text style={styles.macroTileLabel}>Kcal</Text>
                  </View>
                  <View style={[styles.macroTileBox, { borderLeftWidth: 1, borderLeftColor: '#D4E2DC' }]}>
                    <Text style={[styles.macroTileValue, { color: '#4EA685' }]}>{recipe.protein}</Text>
                    <Text style={styles.macroTileLabel}>Protein</Text>
                  </View>
                  <View style={[styles.macroTileBox, { borderLeftWidth: 1, borderLeftColor: '#D4E2DC' }]}>
                    <Text style={[styles.macroTileValue, { color: '#3B82F6' }]}>{recipe.carbs}</Text>
                    <Text style={styles.macroTileLabel}>Carbs</Text>
                  </View>
                  <View style={[styles.macroTileBox, { borderLeftWidth: 1, borderLeftColor: '#D4E2DC' }]}>
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
                <View style={styles.recipeModalMetaBadge}>
                  <Text style={styles.recipeModalMetaText}>{selectedRecipe.budget || 'Under ₱100'}</Text>
                </View>
              </View>

              {/* Macro Details Grid */}
              <View style={styles.recipeModalMacrosGrid}>
                <View style={styles.recipeModalMacroBox}>
                  <Text style={styles.recipeModalMacroVal}>{selectedRecipe.calories}</Text>
                  <Text style={styles.recipeModalMacroLabel}>Kcal</Text>
                </View>
                <View style={[styles.recipeModalMacroBox, { borderLeftWidth: 1, borderLeftColor: '#D4E2DC' }]}>
                  <Text style={[styles.recipeModalMacroVal, { color: logoGreen }]}>{selectedRecipe.protein}</Text>
                  <Text style={styles.recipeModalMacroLabel}>Protein</Text>
                </View>
                <View style={[styles.recipeModalMacroBox, { borderLeftWidth: 1, borderLeftColor: '#D4E2DC' }]}>
                  <Text style={[styles.recipeModalMacroVal, { color: '#3B82F6' }]}>{selectedRecipe.carbs}</Text>
                  <Text style={styles.recipeModalMacroLabel}>Carbs</Text>
                </View>
                <View style={[styles.recipeModalMacroBox, { borderLeftWidth: 1, borderLeftColor: '#D4E2DC' }]}>
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

      {/* ── LOADING OVERLAY FOR RECIPE FETCHING ── */}
      <Modal visible={isFetchingRecipe} transparent={true} animationType="fade">
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModalContent}>
            <ActivityIndicator size="large" color={logoGreen} />
            <Text style={styles.loadingModalText}>Consulting AI Nutritionist...</Text>
          </View>
        </View>
      </Modal>

      {/* ── RECIPE MODAL ── */}
      <Modal visible={showRecipeModal} transparent={true} animationType="fade" onRequestClose={() => setShowRecipeModal(false)}>
        <View style={styles.modalOverlay}>
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
                  <View style={styles.recipeModalMetaBadge}>
                    <DollarSign color={logoGreen} size={12} />
                    <Text style={styles.recipeModalMetaText}>{selectedRecipe.budget || 'Under ₱100'}</Text>
                  </View>
                </View>

                {/* Macro Details Grid */}
                <View style={styles.recipeModalMacrosGrid}>
                  <View style={styles.recipeModalMacroBox}>
                    <Text style={styles.recipeModalMacroVal}>{selectedRecipe.calories}</Text>
                    <Text style={styles.recipeModalMacroLabel}>Kcal</Text>
                  </View>
                  <View style={[styles.recipeModalMacroBox, { borderLeftWidth: 1, borderLeftColor: '#D4E2DC' }]}>
                    <Text style={[styles.recipeModalMacroVal, { color: logoGreen }]}>{selectedRecipe.protein}</Text>
                    <Text style={styles.recipeModalMacroLabel}>Protein</Text>
                  </View>
                  <View style={[styles.recipeModalMacroBox, { borderLeftWidth: 1, borderLeftColor: '#D4E2DC' }]}>
                    <Text style={[styles.recipeModalMacroVal, { color: '#3B82F6' }]}>{selectedRecipe.carbs}</Text>
                    <Text style={styles.recipeModalMacroLabel}>Carbs</Text>
                  </View>
                  <View style={[styles.recipeModalMacroBox, { borderLeftWidth: 1, borderLeftColor: '#D4E2DC' }]}>
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
        </View>
      </Modal>

      {/* ── LOADING OVERLAY FOR RECIPE FETCHING ── */}
      <Modal visible={isFetchingRecipe} transparent={true} animationType="fade">
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModalContent}>
            <ActivityIndicator size="large" color={logoGreen} />
            <Text style={styles.loadingModalText}>Consulting AI Nutritionist...</Text>
          </View>
        </View>
      </Modal>

      {/* --- BOTTOM NAVIGATION BAR --- */}
    </View>
  );
}

const baseColor = '#F0F4F2';           
const clearWhiteHighlight = '#FFFFFF';    
const softGreenShadow = '#AEC2B7';      
const logoGreen = '#4EA685';        
const logoDarkShadow = '#37745D';   
const logoLightHighlight = '#65D8AD'; 

const styles = StyleSheet.create({
  fullscreenOverlay: { 
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0, 
    width: screenWidth, 
    height: screenHeight, 
    backgroundColor: baseColor,
  },
  container: { 
    flex: 1,
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 54 : 48, 
    paddingBottom: 115,
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
    color: '#21332A', 
    letterSpacing: -0.5,
  },
  subGreeting: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#556B60', 
    marginTop: 2,
  },
  searchFormCard: {
    backgroundColor: baseColor, 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 4, 
    marginBottom: 14,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 1, 
    shadowRadius: 5, 
    elevation: 3,
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
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
    color: '#21332A',
  },
  formCard: {
    backgroundColor: baseColor, 
    borderRadius: 28, 
    padding: 18, 
    marginBottom: 16,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 6, height: 6 }, 
    shadowOpacity: 1, 
    shadowRadius: 8, 
    elevation: 4,
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  cardTitle: { 
    fontSize: 11, 
    color: '#41544B', 
    textTransform: 'uppercase', 
    letterSpacing: 1.2, 
    marginBottom: 10, 
    fontWeight: '800', 
    marginLeft: 2,
  },
  sectionLabelTitle: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#21332A', 
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
    borderColor: '#D4E2DC',
  },
  filterChipInactive: { 
    backgroundColor: baseColor,
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
    backgroundColor: '#D4E2DC', 
    marginVertical: 12,
  },
  recipeFormCard: {
    backgroundColor: baseColor, 
    borderRadius: 28, 
    padding: 16, 
    marginBottom: 14,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 6, height: 6 }, 
    shadowOpacity: 1, 
    shadowRadius: 8, 
    elevation: 4,
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
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
    color: '#1A2B23', 
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
    backgroundColor: '#E2ECE7', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 10, 
    marginRight: 6, 
    marginBottom: 4,
  },
  metaBadgeText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#37745D', 
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
    color: '#1A2B23',
  },
  macroTileLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: '#7FA293', 
    marginTop: 2,
  },
  expandedRecipeContentAnimation: { 
    marginTop: 4,
  },
  ingredientsBox: { 
    backgroundColor: '#EBF2EE', 
    padding: 14, 
    borderRadius: 18, 
    marginBottom: 12,
  },
  extendedSectionHeaderLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#37745D', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5, 
    marginBottom: 8,
  },
  recipeListItemRowText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#21332A', 
    marginBottom: 4,
  },
  instructionsBox: { 
    backgroundColor: '#F4F7F5', 
    padding: 14, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: '#D4E2DC',
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
    backgroundColor: '#4EA685', 
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
    color: '#33443C', 
    lineHeight: 18,
  },
  fullRecipeViewToggleButton: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: baseColor, 
    paddingVertical: 12, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#D4E2DC',
    marginRight: 8,
  },
  fullRecipeViewToggleActiveButton: { 
    backgroundColor: '#4EA685', 
    borderColor: '#4EA685',
  },
  fullRecipeToggleButtonText: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#4EA685', 
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
    shadowColor: logoGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  logRecipeBtnLogged: {
    backgroundColor: '#37745D',
    shadowOpacity: 0,
    elevation: 0,
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
  warningBadge: {
    backgroundColor: '#FED7D7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  warningBadgeText: {
    color: '#C53030',
    fontSize: 10,
    fontWeight: '800',
  },
  // --- TAB SWITCHER UI ---
  tabSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5ECE8',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1.2,
    borderColor: '#D4E2DC',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: baseColor,
    borderWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#7FA293',
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
    backgroundColor: baseColor,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  macroMiniVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#21332A',
  },
  macroMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7FA293',
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
    backgroundColor: baseColor,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  timelineCardLogged: {
    backgroundColor: '#E6EFEA',
    borderWidth: 1.5,
    borderTopColor: '#C2D6CE',
    borderLeftColor: '#C2D6CE',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
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
    backgroundColor: '#EBF2EE',
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
    color: '#7FA293',
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A2B23',
    marginBottom: 10,
  },
  timelineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingTop: 10,
  },
  timelineMacroText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#556B60',
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
    backgroundColor: '#7FA293',
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
    color: '#556B60',
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
    backgroundColor: '#4EA685', 
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: logoLightHighlight, 
    borderLeftColor: logoLightHighlight, 
    shadowColor: logoDarkShadow, 
    shadowOffset: { width: 3, height: 4 }, 
    shadowOpacity: 0.9, 
    shadowRadius: 6, 
    elevation: 5,
  },
  chatbotPressed: { 
    backgroundColor: '#3E836A', 
    borderWidth: 1.5, 
    borderColor: logoDarkShadow, 
    transform: [{ scale: 0.95 }],
  },

  staticMapContainer: {
    height: 220,
    width: '100%',
    backgroundColor: '#E8F1EC', 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4E2DC',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapCoastline: {
    position: 'absolute',
    top: -50,
    left: -20,
    width: 200,
    height: 300,
    backgroundColor: '#D1E5DB',
    borderRadius: 100,
    opacity: 0.5,
  },
  mapRouteLine: {
    position: 'absolute',
    top: '20%',
    left: '48%',
    width: 2,
    height: '60%',
    backgroundColor: '#B5D3C5',
    transform: [{ rotate: '15deg' }],
  },
  mapPinContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinLabel: {
    fontSize: 10,
    color: '#7FA293',
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mapPinLabelActive: {
    color: '#41544B',
    fontWeight: '800',
    fontSize: 11,
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
    shadowColor: logoGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
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
    color: '#1A2B23',
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
    backgroundColor: '#E2ECE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  recipeModalMetaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#37745D',
    marginLeft: 4,
  },
  recipeModalMacrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2ECE7',
    marginBottom: 16,
  },
  recipeModalMacroBox: {
    flex: 1,
    alignItems: 'center',
  },
  recipeModalMacroVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A2B23',
  },
  recipeModalMacroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7FA293',
    marginTop: 2,
  },
  recipeModalScroll: {
    flex: 1,
    marginBottom: 16,
  },
  recipeModalIngredientsBox: {
    backgroundColor: '#EBF2EE',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  recipeModalInstructionsBox: {
    backgroundColor: '#F4F7F5',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4E2DC',
  },
  recipeModalSecTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#37745D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  recipeModalListItem: {
    fontSize: 13,
    fontWeight: '600',
    color: '#21332A',
    marginBottom: 6,
    lineHeight: 18,
  },
  recipeModalStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recipeModalStepNum: {
    backgroundColor: '#4EA685',
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
    color: '#33443C',
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
    borderColor: '#D4E2DC',
  },
  loadingModalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#37745D',
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
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: clearWhiteHighlight,
  },
  loaderTextTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A2B23',
    marginBottom: 8,
  },
  loaderTextDesc: {
    fontSize: 14,
    color: '#7FA293',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});