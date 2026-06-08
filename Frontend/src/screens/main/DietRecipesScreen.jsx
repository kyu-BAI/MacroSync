import React, { useState } from 'react';
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
  Alert
} from 'react-native';
import { Search, MapPin, DollarSign, Clock, BotMessageSquare, Home, UtensilsCrossed, SportShoe, Settings, Camera, ChevronDown, ChevronUp, ChefHat, CheckCircle2, PlusCircle, Coffee, Sun, Moon, Flame, Sparkles } from 'lucide-react-native';
import DraggableChatbotButton from '../../components/DraggableChatbotButton';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function DietRecipesScreen({ onTabChange, dailyNutrition, setDailyNutrition, guestGoals, guestBaseline, globalLoggedMeals = [], setGlobalLoggedMeals }) {
  // Use global persisted state so logged meals survive tab switches
  const loggedMeals = globalLoggedMeals;
  const setLoggedMeals = setGlobalLoggedMeals || (() => {});
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

  // Dynamic Daily Plan derived from Target Macros
  const dailyPlan = [
    { id: 'dp1', mealType: 'Breakfast', title: 'Local Eggs & Pandesal', calories: Math.round(targetCalories * 0.25), protein: `${Math.round(targetProtein * 0.25)}g`, carbs: `${Math.round(targetCarbs * 0.25)}g`, fats: `${Math.round(targetFats * 0.25)}g`, time: '8:00 AM', icon: Coffee },
    { id: 'dp2', mealType: 'Lunch', title: 'Chicken Adobo & Rice', calories: Math.round(targetCalories * 0.35), protein: `${Math.round(targetProtein * 0.35)}g`, carbs: `${Math.round(targetCarbs * 0.35)}g`, fats: `${Math.round(targetFats * 0.35)}g`, time: '12:30 PM', icon: Sun },
    { id: 'dp3', mealType: 'Snack', title: 'Banana & Peanut Butter', calories: Math.round(targetCalories * 0.10), protein: `${Math.round(targetProtein * 0.10)}g`, carbs: `${Math.round(targetCarbs * 0.10)}g`, fats: `${Math.round(targetFats * 0.10)}g`, time: '4:00 PM', icon: Flame },
    { id: 'dp4', mealType: 'Dinner', title: 'Grilled Fish & Veggies', calories: Math.round(targetCalories * 0.30), protein: `${Math.round(targetProtein * 0.30)}g`, carbs: `${Math.round(targetCarbs * 0.30)}g`, fats: `${Math.round(targetFats * 0.30)}g`, time: '7:30 PM', icon: Moon },
  ];

  const recommendedRecipes = [
    {
      id: 1,
      title: 'Fresh Kinilaw na Tangigue',
      calories: 220,
      protein: '35g',
      carbs: '8g',
      fats: '5g',
      time: '15 mins',
      budget: '₱100 - ₱300',
      location: 'San Remigio',
      ingredients: [
        '250g Fresh Tangigue (cubed)',
        '1/2 cup Coconut Vinegar (Tuba)',
        '1 Red Onion (minced)',
        'Ginger & Sili (chopped)',
        'Kalamansi juice',
      ],
      instructions: [
        'Wash the fresh tangigue cubes quickly with a little vinegar, then drain to remove the fishy smell.',
        'Mix the fish with coconut vinegar, kalamansi, minced ginger, onions, and chili.',
        'Let it chill in the fridge for 10 minutes to lightly "cook" in the acid before serving.'
      ],
      allergies: ['Seafood']
    },
    {
      id: 2,
      title: 'Pintos (Sweet Corn Tamales)',
      calories: 180,
      protein: '4g',
      carbs: '38g',
      fats: '2g',
      time: 'Ready to Eat',
      budget: 'Under ₱100',
      location: 'Bogo City',
      ingredients: [
        'Locally sourced Pintos (wrapped in corn husks)',
        'Margarine or butter (often mixed in)'
      ],
      instructions: [
        'Purchase freshly steamed Pintos from local Bogo City vendors.',
        'Unwrap the corn husks and enjoy warm as an energy-dense pre-workout snack or breakfast.'
      ],
      allergies: ['Dairy']
    },
    {
      id: 3,
      title: 'Daanbantayan Sutukil Platter',
      calories: 450,
      protein: '50g',
      carbs: '15g',
      fats: '22g',
      time: '30 mins',
      budget: 'Over ₱300',
      location: 'Daanbantayan',
      ingredients: [
        'Grilled Fish (Sugba)',
        'Fish Soup (Tuwa)',
        'Fresh Seafood Ceviche (Kilaw)',
        'Local Seaweed (Guso)'
      ],
      instructions: [
        'Select fresh catch from the local Daanbantayan market.',
        'Grill the main fish lightly over charcoal.',
        'Prepare the head and bones in a clear, ginger-infused soup.',
        'Serve together for a massive, high-protein, omega-rich feast.'
      ],
      allergies: ['Seafood']
    },
  ];

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);
  const toggleExpandRecipe = (id) => setExpandedRecipeId(expandedRecipeId === id ? null : id);
  
    const handleLogMeal = (id, macros) => {
    if (!loggedMeals.includes(id)) {
      setLoggedMeals([...loggedMeals, id]);
      if (setDailyNutrition && macros) {
        setDailyNutrition(prev => ({
          ...prev,
          consumedCalories: prev.consumedCalories + macros.calories,
          protein: { ...prev.protein, current: prev.protein.current + macros.protein },
          carbs: { ...prev.carbs, current: prev.carbs.current + macros.carbs },
          fats: { ...prev.fats, current: prev.fats.current + macros.fats }
        }));
      }
    } else {
      setLoggedMeals(loggedMeals.filter(mealId => mealId !== id));
      if (setDailyNutrition && macros) {
        setDailyNutrition(prev => ({
          ...prev,
          consumedCalories: Math.max(0, prev.consumedCalories - macros.calories),
          protein: { ...prev.protein, current: Math.max(0, prev.protein.current - macros.protein) },
          carbs: { ...prev.carbs, current: Math.max(0, prev.carbs.current - macros.carbs) },
          fats: { ...prev.fats, current: Math.max(0, prev.fats.current - macros.fats) }
        }));
      }
    }
  };

  const filteredRecipes = recommendedRecipes.filter(recipe => {
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
                const IconComponent = meal.icon;
                const isLogged = loggedMeals.includes(meal.id);
                return (
                  <View key={meal.id} style={styles.timelineItem}>
                    <View style={styles.timelineLineTrack}>
                      <View style={[styles.timelineDot, isLogged && { backgroundColor: logoGreen, borderColor: logoGreen }]} />
                      {index !== dailyPlan.length - 1 && <View style={[styles.timelineLine, isLogged && { backgroundColor: logoGreen }]} />}
                    </View>
                    <View style={[styles.timelineCard, isLogged && styles.timelineCardLogged]}>
                      <View style={styles.timelineHeader}>
                        <View style={styles.mealTypeBadge}>
                          <IconComponent color={isLogged ? '#FFFFFF' : logoGreen} size={12} />
                          <Text style={[styles.mealTypeBadgeText, isLogged && { color: '#FFFFFF' }]}>{meal.mealType}</Text>
                        </View>
                        <Text style={styles.timelineTime}>{meal.time}</Text>
                      </View>
                      <Text style={[styles.timelineTitle, isLogged && { color: '#41544B' }]}>{meal.title}</Text>
                      <View style={styles.timelineFooter}>
                        <Text style={styles.timelineMacroText}>{meal.calories} kcal • {meal.protein} protein</Text>
                        <TouchableOpacity 
                          style={[styles.logMealMiniBtn, isLogged && styles.logMealMiniBtnLogged]}
                          onPress={() => handleLogMeal(meal.id, { 
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
                        <DollarSign color={logoGreen} size={12} />
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
      <DraggableChatbotButton onPress={() => onTabChange && onTabChange('CHATBOT')} />

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
    backgroundColor: '#E2ECE7',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#AEC2B7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: baseColor, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 24,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 1, 
    shadowRadius: 6, 
    elevation: 3,
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  macroRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroMiniBox: {
    alignItems: 'center',
  },
  macroMiniVal: {
    fontSize: 15,
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
  timelineLineTrack: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#7FA293',
    backgroundColor: baseColor,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#D4E2DC',
    marginTop: -2,
    marginBottom: -4,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2ECE7',
  },
  timelineCardLogged: {
    backgroundColor: '#F4F7F5',
    opacity: 0.8,
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
  navBarOuterEdge: {
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: 84, 
    backgroundColor: baseColor, 
    borderTopWidth: 1.5, 
    borderTopColor: clearWhiteHighlight,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 0, height: -6 }, 
    shadowOpacity: 0.7, 
    shadowRadius: 10, 
    elevation: 16, 
    paddingHorizontal: 6, 
    paddingBottom: Platform.OS === 'ios' ? 18 : 2,
  },
  navBarContentRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    height: '100%', 
    position: 'relative',
  },
  navTabItem: { 
    flex: 1.1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 6,
  },
  navTabText: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: '#7FA293', 
    marginTop: 4, 
    textAlign: 'center',
  },
  centerCameraContainer: { 
    position: 'relative', 
    width: 68, 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  cameraCircleButton: { 
    width: 62, 
    height: 62, 
    borderRadius: 31, 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'absolute', 
    top: -20,
  },
  cameraUnpressed: {
    backgroundColor: '#4EA685', 
    borderTopWidth: 2, 
    borderLeftWidth: 2, 
    borderTopColor: logoLightHighlight, 
    borderLeftColor: logoLightHighlight,
    shadowColor: logoDarkShadow, 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.9, 
    shadowRadius: 8, 
    elevation: 8,
  },
  cameraPressed: { 
    backgroundColor: '#3E836A', 
    borderWidth: 1.5, 
    borderColor: logoDarkShadow, 
    top: -18,
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
});