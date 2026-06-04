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
  Dimensions
} from 'react-native';
import { Search, MapPin, DollarSign, Clock, BotMessageSquare, Home, UtensilsCrossed, SportShoe, Settings, Camera, ChevronDown, ChevronUp, ChefHat } from 'lucide-react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function DietRecipesScreen({ onTabChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);

  const budgetTiers = ['All', 'Budget', 'Moderate', 'Premium'];
  const locations = ['All', 'Local Markets', 'Supermarkets', 'Homemade'];

  const recommendedRecipes = [
    {
      id: 1,
      title: 'High-Protein Local Chicken & Eggs Rice Bowl',
      calories: 780,
      protein: '45g',
      carbs: '85g',
      fats: '22g',
      time: '25 mins',
      budget: 'Budget',
      location: 'Local Markets',
      ingredients: [
        '200g Chicken Breast (sliced)',
        '2 Native Eggs',
        '1.5 cups White Rice (cooked)',
        '3 cloves Garlic (minced)',
        '2 tbsp Soy Sauce',
        '1 tbsp Olive Oil',
        'Green onions for garnish'
      ],
      instructions: [
        'Heat olive oil in a pan over medium heat and sauté minced garlic until golden brown.',
        'Add sliced chicken breast and cook thoroughly until edges turn golden (approx. 7-10 minutes).',
        'Pour soy sauce over the chicken, stirring evenly to let it absorb into the meat.',
        'Push chicken to the side of the pan, crack native eggs into the space, and scramble gently.',
        'Assemble by placing warm rice in a bowl, layering chicken and eggs over the top, and garnishing with chopped green onions.'
      ]
    },
    {
      id: 2,
      title: 'Premium Lean Beef Stir-Fry Analytics',
      calories: 850,
      protein: '55g',
      carbs: '90g',
      fats: '26g',
      time: '20 mins',
      budget: 'Premium',
      location: 'Supermarkets',
      ingredients: [
        '250g Sirloin Beef (thin strips)',
        '1 cup Broccoli florets',
        '1 Bell Pepper (sliced)',
        '1.5 cups Brown Rice (cooked)',
        '1 tbsp Sesame Oil',
        '1 tbsp Oyster sauce',
        '1 tsp Sesame seeds'
      ],
      instructions: [
        'Marinate thin sirloin strips with a teaspoon of soy sauce or standard seasoning for 5 minutes.',
        'Heat sesame oil in a wok or deep skillet on high heat.',
        'Add beef strips and sear quickly for 3-4 minutes, then set aside to keep tender.',
        'Toss broccoli florets and bell peppers into the same pan, stir-frying for 3 minutes until crisp-tender.',
        'Return beef to the pan, drizzle oyster sauce over the mixture, stir rapidly for 1 minute, and serve over warm brown rice topped with sesame seeds.'
      ]
    },
    {
      id: 3,
      title: 'Budget Peanut Butter & Oats Mass Shake',
      calories: 620,
      protein: '25g',
      carbs: '75g',
      fats: '24g',
      time: '5 mins',
      budget: 'Budget',
      location: 'Homemade',
      ingredients: [
        '2 tbsp Peanut Butter',
        '1/2 cup Local Oats',
        '2 Medium Bananas',
        '350ml Full Cream Milk',
        '1 scoop Protein Powder (Optional)'
      ],
      instructions: [
        'Place the local oats into a high-speed blender and pulse briefly until pulverized into a fine powder.',
        'Add sliced bananas, full cream milk, and heavy tablespoons of smooth peanut butter into the blender jar.',
        'Blend on high speed for 45-60 seconds until completely unified, creamy, and free of lumps.',
        'Pour immediately into a shaker cup or glass and consume cold for rapid caloric tracking integration.'
      ]
    },
  ];

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);
  const toggleExpandRecipe = (id) => setExpandedRecipeId(expandedRecipeId === id ? null : id);

  const filteredRecipes = recommendedRecipes.filter(recipe => {
    const matchesBudget = selectedBudget === 'All' || recipe.budget === selectedBudget;
    const matchesLocation = selectedLocation === 'All' || recipe.location === selectedLocation;
    const ingredientsString = recipe.ingredients.join(', ').toLowerCase();
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ingredientsString.includes(searchQuery.toLowerCase());
    return matchesBudget && matchesLocation && matchesSearch;
  });

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

          <Text style={styles.cardTitle}>Sourcing & Availability</Text>
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
        </View>

        <Text style={styles.sectionLabelTitle}>Recommended Dynamic Recommendations</Text>
        
        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyFormCard}>
            <Text style={styles.emptyStateText}>No recipes matched your exact targets.</Text>
          </View>
        ) : (
          filteredRecipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
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
                    <Text style={styles.macroTileValue}>{recipe.calories} kcal</Text>
                    <Text style={styles.macroTileLabel}>Calories</Text>
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

                <TouchableOpacity 
                  style={[styles.fullRecipeViewToggleButton, isExpanded && styles.fullRecipeViewToggleActiveButton]}
                  activeOpacity={0.8}
                  onPress={() => toggleExpandRecipe(recipe.id)}
                >
                  <Text style={[styles.fullRecipeToggleButtonText, isExpanded && { color: '#FFFFFF' }]}>
                    {isExpanded ? 'Hide Recipe Details' : 'View Full Recipe & Cooking Steps'}
                  </Text>
                  {isExpanded ? (
                    <ChevronUp color={isExpanded ? '#FFFFFF' : logoGreen} size={16} />
                  ) : (
                    <ChevronDown color={logoGreen} size={16} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* --- FLOATING AI CHATBOT SYSTEM (WIRED UP TOGGLE HUB) --- */}
      <View style={styles.floatingChatbotContainer}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => handlePressIn('chatbot')}
          onPressOut={handlePressOut}
          onPress={() => onTabChange && onTabChange('CHATBOT')}
          style={[styles.chatbotFloatingButton, isPressedBtn === 'chatbot' ? styles.chatbotPressed : styles.chatbotUnpressed]}
        >
          <BotMessageSquare color="#FFFFFF" size={26} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <View style={styles.navBarOuterEdge}>
        <View style={styles.navBarContentRow}>
          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('DASHBOARD')}
          >
            <Home color="#7FA293" size={22} strokeWidth={2.5} />
            <Text style={styles.navTabText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('DIET')}
          >
            <UtensilsCrossed color={logoGreen} size={22} strokeWidth={2.5} />
            <Text style={[styles.navTabText, { color: logoGreen }]}>Diet & Recipes</Text>
          </TouchableOpacity>

          {/* --- SCAN FOOD CENTER CAMERA PROTRUDING BUTTON HUB --- */}
          <View style={styles.centerCameraContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={() => handlePressIn('camera')}
              onPressOut={handlePressOut}
              style={[styles.cameraCircleButton, isPressedBtn === 'camera' ? styles.cameraPressed : styles.cameraUnpressed]}
            >
              <Camera color="#FFFFFF" size={28} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('WORKOUT')}
          >
            <SportShoe color="#7FA293" size={22} strokeWidth={2.5} />
            <Text style={styles.navTabText}>Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('SETTINGS')}
          >
            <Settings color="#7FA293" size={22} strokeWidth={2.5} />
            <Text style={styles.navTabText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: baseColor, 
    paddingVertical: 12, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#D4E2DC',
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
});