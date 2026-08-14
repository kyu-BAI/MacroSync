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
  const [userAllergies, setUserAllergies] = useState([]);

  useEffect(() => {
    const loadUserAllergies = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem('ms_user_profile');
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          if (Array.isArray(parsed.allergies) && parsed.allergies.length > 0) {
            setUserAllergies(parsed.allergies);
            return;
          }
        }
        const onboardingData = await AsyncStorage.getItem('@ms_onboarding_data');
        if (onboardingData) {
          const parsedOnb = JSON.parse(onboardingData);
          if (Array.isArray(parsedOnb.allergies) && parsedOnb.allergies.length > 0) {
            setUserAllergies(parsedOnb.allergies);
            return;
          }
        }
      } catch (err) {
        if (__DEV__) console.log("Error loading user allergies:", err);
      }
    };
    loadUserAllergies();
  }, []);

  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Cebu City');
  const [showFullMapModal, setShowFullMapModal] = useState(false);
  const [showCityPickerModal, setShowCityPickerModal] = useState(false);
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  
  // New UI States
  const [activeDietTab, setActiveDietTab] = useState('PLAN'); // 'PLAN' or 'EXPLORE'

  const locations = [
    'Cebu City',
    'Lapu-Lapu City',
    'Mandaue City',
    'Talisay City',
    'Carcar City',
    'Argao',
    'Bogo City',
    'San Remigio',
    'Daanbantayan',
    'Bantayan Island',
    'Camotes Islands',
    'Toledo City',
    'Balamban',
    'Moalboal',
    'Oslob',
    'Danao City',
    'Liloan',
    'Dalaguete',
    'Barili'
  ];

  const CITY_PROFILES = {
    'Cebu City': {
      marketTitle: 'Carbon Market & Pasil Fish Port (Cebu City)',
      palengkeItems: 'Pasil Fresh Fish, Singkamas, Pork Belly, Kangkong, Calamansi',
      lat: 10.3157, lng: 123.8854,
      famousDishes: [
        { name: 'Pasil Tuslob Buwa', emoji: '🧠', desc: 'Frothy pig brain & liver stew cooked with onions & chili, dipped with puso (hanging rice).' },
        { name: 'Cebuano Ngohiong', emoji: '🌯', desc: 'Crispy five-spice fried lumpia stuffed with ubod/singkamas, served with garlic brown dip.' },
        { name: 'Lechon sa Sugbo', emoji: '🐖', desc: 'World-famous herb & lemongrass stuffed charcoal roasted pork with super crispy skin.' },
        { name: 'Ginabot (Chicharon Bulaklak)', emoji: '🍳', desc: 'Deep-fried pork mesentery, a legendary Cebuano night market street food staple.' }
      ]
    },
    'Lapu-Lapu City': {
      marketTitle: 'Mactan Public Market & Saang Pier (Lapu-Lapu City)',
      palengkeItems: 'Tangigue, Saang, Bakasi, Calamansi, Fresh Lato',
      lat: 10.3103, lng: 123.9494,
      famousDishes: [
        { name: 'Sutukil Seafood Trilogy', emoji: '🐟', desc: 'Iconic 3-way seafood meal: Sugba (Grilled), Tula (Fish Soup), and Kinilaw (Raw Cured).' },
        { name: 'Linarang na Bakasi sa Cordova', emoji: '🐍', desc: 'Cordova moray eel stew cooked with kamias souring broth, black beans, and chili.' },
        { name: 'Presko nga Saang sa Mactan', emoji: '🐚', desc: 'Steamed local sea snails dipped in spicy native tuba vinegar and ginger.' }
      ]
    },
    'Mandaue City': {
      marketTitle: 'Mandaue City Public Market',
      palengkeItems: 'Native Chicken, Kangkong, Sayote, Eggplant, Sweet Rice',
      lat: 10.3333, lng: 123.9333,
      famousDishes: [
        { name: 'Bibingka sa Mandaue', emoji: '🫓', desc: 'Heritage baked rice cake made with tuba yeast, coconut milk, and banana leaves.' },
        { name: 'Tagaktak sa Mandaue', emoji: '🕸️', desc: 'Crispy net-like sweet rice flour treat fried to golden perfection.' },
        { name: 'Utan Bisaya sa Mandaue', emoji: '🥣', desc: 'Clear vegetable soup seasoned with fried tuyô/danggit and fresh local greens.' }
      ]
    },
    'Talisay City': {
      marketTitle: 'Talisay City Public Market (Poblacion)',
      palengkeItems: 'Pork Belly, Inun-unan Fish, Kangkong, Cucumber, Native Tomatoes',
      lat: 10.2447, lng: 123.8494,
      famousDishes: [
        { name: 'Inasal nga Lechon sa Talisay', emoji: '🍖', desc: 'Home of the original Cebu Lechon Festival, famed for rich savory herb-infused pork.' },
        { name: 'Inun-unan nga Bisaya', emoji: '🐟', desc: 'Fish braised in native tuba vinegar, garlic, ginger, finger chilies, and eggplant.' }
      ]
    },
    'Carcar City': {
      marketTitle: 'Carcar City Public Market (Palengke sa Carcar)',
      palengkeItems: 'Native Pork, Ampaw, Chicharon, Kangkong, Squash, Sitaw',
      lat: 10.1044, lng: 123.6419,
      famousDishes: [
        { name: 'Chicharon sa Carcar', emoji: '🥓', desc: 'Famous crunchy pork cracklings crafted with thick savory meat & fat layers.' },
        { name: 'Ampaw sa Carcar', emoji: '🍿', desc: 'Puffed rice crispy square treats bound with sweet native syrup and peanuts.' },
        { name: 'Humba sa Carcar', emoji: '🍲', desc: 'Tender pork belly braised with fermented black beans, banana blossoms, and tuba sugar.' }
      ]
    },
    'Argao': {
      marketTitle: 'Argao Public Market & Heritage District',
      palengkeItems: 'Native Sikwate (Cacao), Torta, Native Pork, Alugbati, Eggplant',
      lat: 9.8808, lng: 123.5975,
      famousDishes: [
        { name: 'Torta sa Argao', emoji: '🥮', desc: 'Heritage Spanish-era cake baked with tuba yeast, lard, egg yolks, and grated cheese.' },
        { name: 'Batirol nga Sikwate sa Argao', emoji: '☕', desc: 'Rich hot chocolate frothed with a batirol using 100% native cacao tablea.' },
        { name: 'Chiu-Chiu nga Baboy sa Argao', emoji: '🍲', desc: 'Traditional Argao braised pork belly stewed with spices and native herbs.' }
      ]
    },
    'Bogo City': {
      marketTitle: 'Bogo City Public Market (Palengke sa Bogo)',
      palengkeItems: 'Tangigue, Sweet Corn, Native Tomatoes, Cucumber, Calamansi',
      lat: 11.0517, lng: 124.0055,
      famousDishes: [
        { name: 'Pintos sa Bogo', emoji: '🌽', desc: 'Famous sweet corn tamales mixed with coconut milk, steamed inside fresh corn husks.' },
        { name: 'Kinilaw nga Tangigue sa Amihanan', emoji: '🥗', desc: 'Fresh Spanish mackerel cured in native coconut vinegar, ginger, and chilies.' }
      ]
    },
    'San Remigio': {
      marketTitle: 'San Remigio Municipal Public Market',
      palengkeItems: 'Bangus, Tilapia, Fresh Lato, Kangkong, Squash, Gabi Leaves',
      lat: 11.0772, lng: 123.9356,
      famousDishes: [
        { name: 'Presko nga Salada nga Lato', emoji: '🌿', desc: 'Crunchy grape seaweed tossed with native tomatoes, calamansi juice, and onions.' },
        { name: 'Sinugbang Bangus sa Dahon sa Saging', emoji: '🐟', desc: 'Charcoal-grilled milkfish stuffed with tomatoes and onions, wrapped in banana leaf.' }
      ]
    },
    'Daanbantayan': {
      marketTitle: 'Daanbantayan Public Market & Fish Landing',
      palengkeItems: 'Bodboron, Tulingan, Purple Kamote, Eggplant, Native Ginger',
      lat: 11.2589, lng: 124.0153,
      famousDishes: [
        { name: 'Inun-unan nga Bodboron', emoji: '🍲', desc: 'Small ocean fish simmered gently in native vinegar, ginger, and green peppers.' },
        { name: 'Linat-ang Tulingan sa Daanbantayan', emoji: '🐟', desc: 'Rich tuna-like fish stewed with native ginger, dried kamias, and tomatoes.' }
      ]
    },
    'Bantayan Island': {
      marketTitle: 'Bantayan Island Fish Landing & Santa Fe Market',
      palengkeItems: 'Dried Danggit, Blue Crab, Shellfish, Calamansi, Young Coconut',
      lat: 11.1681, lng: 123.7222,
      famousDishes: [
        { name: 'Buwad nga Danggit sa Bantayan', emoji: '🐟', desc: 'World-renowned crispy rabbitfish dried under the island sun, dipped in vinegar.' },
        { name: 'Nilung-ag nga Kasag sa Bantayan', emoji: '🦀', desc: 'Freshly caught ocean blue swimmer crabs steamed with ginger and calamansi.' },
        { name: 'Buwad nga Pusit', emoji: '🦑', desc: 'Crispy sun-dried squid toasted over coals until golden and fragrant.' }
      ]
    },
    'Camotes Islands': {
      marketTitle: 'San Francisco Public Market (Camotes)',
      palengkeItems: 'Cassava, Buko, Native Chicken, Fresh Ocean Fish, Kangkong',
      lat: 10.6558, lng: 124.3431,
      famousDishes: [
        { name: 'Cassava Cake sa Camotes', emoji: '🥧', desc: 'Traditional baked cassava root cake enriched with fresh coconut milk and sugar.' },
        { name: 'Halang-Halang nga Manok sa Gata', emoji: '🌶️', desc: 'Spicy chicken coconut milk soup infused with chili leaves, ginger, and lemongrass.' }
      ]
    },
    'Toledo City': {
      marketTitle: 'Toledo City Public Market',
      palengkeItems: 'River Prawns, Tilapia, Corn Grit, Squash, Sitaw',
      lat: 10.3772, lng: 123.6406,
      famousDishes: [
        { name: 'Gisadong Ulang sa Toledo', emoji: '🦐', desc: 'Large freshwater river prawns sautéed in garlic, butter, and native tomatoes.' },
        { name: 'Sinugbang Tilapia sa Kamayan', emoji: '🐟', desc: 'Fresh river tilapia grilled over charcoal, served with calamansi soy dip.' }
      ]
    },
    'Balamban': {
      marketTitle: 'Balamban Public Market & Herb Port',
      palengkeItems: 'Stuffed Liempo, Native Chicken, Malunggay, Sayote',
      lat: 10.5042, lng: 123.7194,
      famousDishes: [
        { name: 'Sinugbang Liempo sa Balamban', emoji: '🥓', desc: 'Famous pork belly rolled and stuffed with secret herbs, scallions, and lemongrass.' },
        { name: 'Tinolang Manok sa Balamban', emoji: '🍲', desc: 'Free-range chicken stewed with green papaya, ginger, and fresh malunggay.' }
      ]
    },
    'Moalboal': {
      marketTitle: 'Moalboal Public Market & Beach Fish Landing',
      palengkeItems: 'Tuna Steak, Mackerel, Buko Water, Calamansi, Cucumber',
      lat: 9.9575, lng: 123.4000,
      famousDishes: [
        { name: 'Sinugbang Tangigue Steak sa Moalboal', emoji: '🥩', desc: 'Thick yellowfin tuna steak seared over high heat, drizzled with calamansi dip.' },
        { name: 'Kinilaw nga Mackerel sa Baybayon', emoji: '🥗', desc: 'Freshly caught mackerel cured in coconut vinegar, cucumber, and ginger.' }
      ]
    },
    'Oslob': {
      marketTitle: 'Oslob Municipal Market',
      palengkeItems: 'Tangigue, Kamote Tops, Sinigang Greens, Calamansi, Mango',
      lat: 9.5350, lng: 123.4319,
      famousDishes: [
        { name: 'Sinigang nga Tangigue sa Oslob', emoji: '🍲', desc: 'Sour fish soup made with fresh king mackerel, native tomatoes, and greens.' },
        { name: 'Salada nga Dahon sa Kamote', emoji: '🌿', desc: 'Blanched sweet potato leaves tossed with calamansi, onions, and native tomatoes.' }
      ]
    },
    'Danao City': {
      marketTitle: 'Danao City Central Market',
      palengkeItems: 'Kalamay, Bangus, Kangkong, Eggplant, Tomatoes',
      lat: 10.5256, lng: 124.0264,
      famousDishes: [
        { name: 'Kalamay sa Danao', emoji: '🍯', desc: 'Famous sticky sweet coconut & glutinous rice delicacy packaged in coconut shells.' },
        { name: 'Inasal nga Bangus sa Danao', emoji: '🐟', desc: 'Whole milkfish deboned and stuffed with savory meat, raisins, and spices.' }
      ]
    },
    'Liloan': {
      marketTitle: 'Liloan Public Market',
      palengkeItems: 'Lato, Fresh Fish, Native Chicken, Sayote, Masi',
      lat: 10.4000, lng: 123.9833,
      famousDishes: [
        { name: 'Rosquillos sa Titay (Liloan)', emoji: '🥨', desc: 'The original ring-shaped crisp biscuit created in Liloan back in 1907.' },
        { name: 'Masi sa Liloan', emoji: '🍡', desc: 'Soft glutinous rice balls filled with a sweet molten peanut and brown sugar center.' }
      ]
    },
    'Dalaguete': {
      marketTitle: 'Dalaguete Vegetable Trading Post (Mantalongon)',
      palengkeItems: 'Highland Sayote, Broccoli, Carrots, Cabbage, Pork Chops',
      lat: 9.7619, lng: 123.5350,
      famousDishes: [
        { name: 'Gisadong Utan sa Mantalongon', emoji: '🥦', desc: 'Crispy stir-fried Sayote, Broccoli, Carrots & Cabbage from the Vegetable Basket of Cebu.' },
        { name: 'Linat-ang Baboy ug Sayote', emoji: '🍲', desc: 'Hearty highland pork soup simmered with freshly harvested sayote and ginger.' }
      ]
    },
    'Barili': {
      marketTitle: 'Barili Public Market & Dairy Farm Center',
      palengkeItems: 'Carabao Milk, Pastillas, Native Eggs, Native Chicken, Squash',
      lat: 10.1133, lng: 123.5083,
      famousDishes: [
        { name: 'Presko nga Gatas sa Kabaw ug Pastillas', emoji: '🥛', desc: 'Creamy fresh water-buffalo milk and handcrafted sweet milk candies.' },
        { name: 'Kinalan nga Manok Bisaya sa Barili', emoji: '🍲', desc: 'Slow-simmered native farm chicken with fresh yellow squash and sitaw.' }
      ]
    }
  };

  const getDynamicPalengkePlan = (location, totalUserCalories = 2000) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    let hash = 0;
    const seedString = `${todayStr}_${location}`;
    for (let i = 0; i < seedString.length; i++) {
      hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    const LOCATION_MEALS = {
      'Cebu City': {
        breakfast: ['Luto nga Itlog sa Subak nga Kangkong ug Calamansi Tea', 'Gisadong Singkamas ug Scrambled Itlog Bisaya', 'Sinugbang Tyan sa Bangus ug Binisaya nga Humay'],
        lunch: ['Kinilaw nga Tangigue ug Sabaw sa Pasil Isda ug Bugas', 'Sinugbang Tilapia Fillet ug Salada nga Lato', 'Tinolang Manok Bisaya nga adunay Sayote ug Malunggay'],
        snack: ['Hilaw nga Singkamas ug Tumparik nga Calamansi', 'Luto nga Mais ug Barato nga Tubig sa Buko', 'Giatas nga Pipino ug Calamansi Juice'],
        dinner: ['Sinugbang Isda sa Palengke ug Salada nga Kamatis', 'Gisadong Kangkong ug Halang nga Halang Isda', 'Utan Bisaya nga Kalabasa, Malunggay ug Manok']
      },
      'Lapu-Lapu City': {
        breakfast: ['Sinugbang Bangus ug Presko nga Lato sa Calamansi', 'Luto nga Itlog Bisaya sa Giatas nga Kangkong', 'Gisadong Kamatis sa Palengke ug Puti sa Itlog'],
        lunch: ['Sutukil Seafood Plate (Sinugba, Tinola, ug Kinilaw)', 'Sinugbang Tangigue Steak ug Kamatis sa Mactan', 'Halang-Halang nga Manok Bisaya sa Gata'],
        snack: ['Presko nga Buko Juice ug Luto nga Mais sa Karsada', 'Salada nga Lato ug Aslum nga Calamansi', 'Sinugbang Mais sa Mactan Market'],
        dinner: ['Sinugbang Tanguigue Steak ug Relish sa Kamatis', 'Sinigang nga Isda sa Subak nga Utan Bisaya', 'Gisadong Talong ug Sinugbang Daghang Manok']
      },
      'Mandaue City': {
        breakfast: ['Gisadong Kamatis ug Scrambled Itlog sa Calamansi', 'Luto nga Kamote Slices ug Luto nga Itlog', 'Gisadong Kangkong sa Ahos ug Itlog'],
        lunch: ['Tinolang Manok Bisaya sa Sayote ug Malunggay', 'Pan-Seared Isda Fillet ug Salada nga Talong', 'Sinugbang Pork Chop ug Sabaw sa Utan'],
        snack: ['Luto nga Kamote sa Mandaue ug Presko nga Buko', 'Sinugbang Yellow Mais sa Palengke', 'Mangga sa Cebu ug Salabat (Ginger Tea)'],
        dinner: ['Gisadong Talong ug Sinugbang Tilapia', 'Sabaw sa Manok Bisaya, Kalabasa ug Sitaw', 'Sinugbang Bangus ug Presko nga Greens']
      },
      'Talisay City': {
        breakfast: ['Luto nga Itlog ug Presko nga Pipino sa Calamansi', 'Luto nga Kamote ug Scrambled Itlog', 'Gisadong Kamatis sa Ahos ug Puti sa Itlog'],
        lunch: ['Inun-unan na Isda sa Sukang Tuba ug Talong', 'Sinugbang Baboy nga Lean cut ug Sabaw sa Kangkong', 'Tinolang Manok Bisaya sa Malunggay'],
        snack: ['Sinugbang Yellow Mais sa Talisay Market', 'Tuba nga Buko Water ug Pipino Slices', 'Inasal nga Kamote Chips sa Hurno'],
        dinner: ['Sinugbang Baboy sa Binisaya nga Greens', 'Sinugbang Tilapia ug Relish sa Kamatis', 'Sabaw sa Kalabasa ug Sinugbang Manok']
      },
      'Carcar City': {
        breakfast: ['Gisadong Itlog Bisaya, Kamatis ug Alugbati', 'Luto nga Kamote Slices ug Calamansi Tea', 'Gisadong Sitaw ug Luto nga Itlog'],
        lunch: ['Binisayang Humba sa Carcar ug Utan Bisaya', 'Tinolang Manok Bisaya sa Sayote', 'Kinilaw nga Isda sa Sukang Tuba ug Greens'],
        snack: ['Presko nga Juice sa Calamansi ug Sinugbang Mais', 'Giatas nga Pipino sa Sukang Tuba', 'Luto nga Yellow Mais sa Carcar'],
        dinner: ['Sinugbang Pork Chop sa Sabaw sa Kalabasa', 'Gisadong Talong ug Sinugbang Isda', 'Utan Bisayanga Sabaw sa Kamatis ug Sitaw']
      },
      'Argao': {
        breakfast: ['Batirol nga Sikwate ug Luto nga Itlog Bisaya', 'Luto nga Itlog sa Gisadong Kangkong', 'Luto nga Kamote Slices ug Puti sa Itlog'],
        lunch: ['Chiu-Chiu nga Baboy sa Argao ug Sabaw sa Alugbati', 'Tinolang Manok Bisaya sa Malunggay', 'Sinugbang Isda Fillet ug Salada nga Kamatis'],
        snack: ['Mangga sa Argao ug Binisayang Salabat', 'Tuba Buko Water ug Luto nga Mais', 'Salada nga Pipino sa Calamansi'],
        dinner: ['Sinugbang Manok Bisaya ug Gisadong Talong', 'Sabaw sa Alugbati, Kalabasa ug Isda', 'Sinugbang Pork Chop ug Presko nga Greens']
      },
      'Bogo City': {
        breakfast: ['Gisadong Kamatis ug Pipino sa Itlog Bisaya', 'Lugaw nga Mais sa Bogo ug Luto nga Itlog', 'Salada nga Pipino ug Gisadong Itlog'],
        lunch: ['Kinilaw nga Tangigue sa Bogo ug Luto nga Mais', 'Sinugbang Tangigue Steak ug Relish sa Kamatis', 'Tinolang Manok Bisaya sa Sayote'],
        snack: ['Sinugbang Sweet Corn sa Bogo Market', 'Luto nga Yellow Mais ug Tubig sa Calamansi', 'Giatas nga Kamatis sa Calamansi'],
        dinner: ['Gisadong Utan Bisaya ug Sinugbang Daghang Manok', 'Gisadong Greens sa Palengke ug Steamed Tangigue', 'Sinugbang Tangigue ug Salada nga Pipino']
      },
      'San Remigio': {
        breakfast: ['Presko nga Lato (Grapes Seaweed) Salad ug Luto nga Itlog', 'Sinugbang Tyan sa Bangus ug Ahos nga Humay', 'Luto nga Itlog sa Gisadong Kangkong ug Calamansi'],
        lunch: ['Sinugbang Tilapia sa Kangkong Soup ug Mais', 'Sinugbang Lato Bowl ug Halang nga Calamansi Dip', 'Sinugbang Bangus sa Dahon sa Saging ug Sabaw sa Kalabasa'],
        snack: ['Presko nga Juice sa Calamansi ug Luto nga Mais', 'Tugob nga Buko Water ug Mangga Slices', 'Luto nga Sweet Corn sa San Remigio'],
        dinner: ['Laing nga Dahon sa Gabi sa Gata ug Sinugbang Bangus', 'Sabaw sa Kalabasa ug Kangkong sa Tilapia', 'Sinugbang Bangus ug Binisayang Utan Stew']
      },
      'Daanbantayan': {
        breakfast: ['Luto nga Ube Kamote, Itlog Bisaya ug Kape', 'Gihurnong Kamote Bowl ug Binisayang Salabat', 'Luto nga Kamote Slices ug Scrambled Itlog'],
        lunch: ['Inun-unan na Bodboron sa Sukang Tuba ug Talong', 'Sinugbang Tulingan ug Salada nga Talong', 'Halang-Halang nga Manok Bisaya sa Daanbantayan'],
        snack: ['Gihurnong Kamote Slices sa Palengke', 'Luto nga Ube Kamote sa Daanbantayan', 'Kamote Chips (Walay Manteka) ug Salabat'],
        dinner: ['Sabaw sa Tulingan sa Luya ug Kalabasa', 'Inun-unan nga Isda ug Luto nga Greens', 'Sinugbang Bodboron ug Sabaw sa Luya']
      },
      'Bantayan Island': {
        breakfast: ['Luto nga Kasag (Blue Crab) ug Itlog sa Calamansi', 'Sinugbang Isda Fillet ug Presko nga Greens', 'Luto nga Itlog sa Gisadong Kangkong'],
        lunch: ['Sinugbang Isda sa Santa Fe ug Salada nga Lato', 'Sinigang nga Isda sa Binisayang Utan', 'Tinolang Manok Bisaya sa Sayote'],
        snack: ['Presko nga Buko Water ug Calamansi Spritz', 'Luto nga Sweet Corn sa Bantayan', 'Mangga Slices ug Salabat'],
        dinner: ['Sinigang na Isda sa Binisayang Greens', 'Sinugbang Isda sa Dagat ug Kamatis', 'Sabaw sa Kalabasa ug Malunggay']
      },
      'Camotes Islands': {
        breakfast: ['Luto nga Balanghoy (Cassava) ug Itlog Bisaya', 'Luto nga Kamote ug Gisadong Itlog', 'Presko nga Kamatis ug Pipino Salad'],
        lunch: ['Halang-Halang nga Manok Bisaya sa Gata ug Luya', 'Sinugbang Isda sa Dagat ug Gisadong Kangkong', 'Sabaw sa Utan Bisaya ug Brown Rice'],
        snack: ['Presko nga Buko Water ug Unod sa Buko', 'Gihurnong Balanghoy Slices', 'Presko nga Mangga sa Camotes'],
        dinner: ['Sinugbang Isda sa Dagat ug Kangkong', 'Sabaw sa Manok Bisaya ug Kapaya', 'Gisadong Talong ug Luto nga Humay']
      },
      'Toledo City': {
        breakfast: ['Scrambled Itlog sa Gisadong Sitaw ug Kamatis', 'Luto nga Kamote ug Luto nga Itlog', 'Luto nga Itlog sa Gisadong Kangkong'],
        lunch: ['Gisadong Ulang (Fresh River Prawns) sa Ahos ug Kamatis', 'Sinugbang Tilapia sa Kamayan ug Sabaw sa Kalabasa', 'Tinolang Manok Bisaya sa Sayote'],
        snack: ['Luto nga Yellow Mais ug Salabat', 'Presko nga Calamansi Juice ug Pipino', 'Tuba Buko Water'],
        dinner: ['Sinugbang Pork Chop ug Binisayang Utan Stew', 'Pan-Seared Tilapia ug Sabaw sa Kalabasa', 'Sabaw sa Sitaw, Kalabasa ug Manok']
      },
      'Balamban': {
        breakfast: ['Luto nga Itlog sa Gisadong Malunggay ug Kamatis', 'Luto nga Kamote Slices ug Scrambled Itlog', 'Omelette sa Itlog Bisaya sa Ahos ug Dahon'],
        lunch: ['Balamban Sinugbang Liempo sa Tanglad ug Sabaw sa Sayote', 'Tinolang Manok Bisaya sa Kapaya ug Malunggay', 'Sinugbang Isda Fillet ug Binisayang Greens'],
        snack: ['Sinugbang Kamote Slices ug Calamansi Juice', 'Tuba Buko Water sa Balamban', 'Luto nga Yellow Mais'],
        dinner: ['Tinolang Manok Bisaya sa Kapaya ug Malunggay', 'Sinugbang Pork Tenderloin ug Utan', 'Sabaw sa Malunggay ug Kalabasa']
      },
      'Moalboal': {
        breakfast: ['Salada nga Pipino ug Kamatis sa Luto nga Itlog', 'Luto nga Kamote ug Luto nga Itlog', 'Binisayang Calamansi Tea ug Scrambled Itlog'],
        lunch: ['Sinugbang Tangigue Steak sa Calamansi Dip ug Humay', 'Kinilaw nga Mackerel sa Sukang Tuba ug Greens', 'Halang-Halang nga Manok Bisaya sa Moalboal'],
        snack: ['Tuba Coconut Shake (Walay Asukal)', 'Presko nga Mangga Slices', 'Giatas nga Pipino Water'],
        dinner: ['Kinilaw nga Mackerel sa Binisayang Greens', 'Sinugbang Tangigue Steak ug Gisadong Kangkong', 'Sabaw sa Utan Bisaya ug Brown Rice']
      },
      'Oslob': {
        breakfast: ['Gisadong Dahon sa Kamote (Kamote Tops) ug Luto nga Itlog', 'Luto nga Itlog ug Presko nga Kamatis', 'Luto nga Ube Kamote ug Kape'],
        lunch: ['Sinigang nga Tangigue sa Oslob ug Utan Bisaya', 'Sinugbang Isda Fillet ug Relish sa Kamatis', 'Tinolang Manok Bisaya sa Sayote'],
        snack: ['Presko nga Mangga sa Oslob ug Buko Juice', 'Luto nga Sweet Corn', 'Calamansi Juice'],
        dinner: ['Sinugbang Isda Fillet ug Sabaw sa Kalabasa', 'Sinigang na Tangigue sa Presko nga Greens', 'Gisadong Dahon sa Kamote ug Sinugbang Manok']
      },
      'Danao City': {
        breakfast: ['Scrambled Itlog Bisaya sa Gisadong Kamatis', 'Luto nga Kamote Slices ug Calamansi Tea', 'Luto nga Itlog sa Kangkong'],
        lunch: ['Inasal nga Bangus sa Danao ug Garlic Kangkong', 'Tinolang Manok Bisaya sa Sayote', 'Gisadong Talong ug Sinugbang Isda'],
        snack: ['Presko nga Luto nga Sweet Corn ug Buko Water', 'Giatas nga Pipino Slices', 'Sinugbang Mais sa Danao'],
        dinner: ['Gisadong Talong ug Sinugbang Tilapia', 'Inasal nga Bangus Fillet ug Sabaw sa Kalabasa', 'Utan Bisayanga Sabaw sa Danao']
      },
      'Liloan': {
        breakfast: ['Presko nga Lato Salad sa Liloan ug Luto nga Itlog', 'Luto nga Kamote ug Luto nga Itlog', 'Gisadong Kamatis sa Puti sa Itlog'],
        lunch: ['Sabaw sa Manok Bisaya, Sayote ug Malunggay', 'Sinugbang Isda Fillet ug Relish sa Kamatis', 'Bowl sa Lato Seaweed ug Brown Rice'],
        snack: ['Tuba Buko Juice ug Presko nga Mangga', 'Luto nga Yellow Mais', 'Calamansi Water'],
        dinner: ['Sinugbang Isda Fillet ug Relish sa Kamatis', 'Sabaw sa Manok Bisaya sa Malunggay', 'Gisadong Kangkong ug Luto nga Humay']
      },
      'Dalaguete': {
        breakfast: ['Scrambled Itlog sa Presko nga Broccoli ug Karots', 'Luto nga Itlog sa Gisadong Sayote ug Kamatis', 'Luto nga Kamote sa Dalaguete ug Puti sa Itlog'],
        lunch: ['Gisadong Utan sa Mantalongon (Sayote & Repolyo) ug Sinugbang Pork Chop', 'Tinolang Manok Bisaya sa Sayote ug Broccoli', 'Sabaw sa Sayote ug Gusok sa Baboy'],
        snack: ['Presko nga Karots ug Sayote Sticks sa Calamansi Dip', 'Tuba Buko Water', 'Sinugbang Yellow Mais'],
        dinner: ['Sabaw sa Sayote ug Gusok sa Baboy sa Brown Rice', 'Gisadong Utan sa Mantalongon ug Sinugbang Manok', 'Gisadong Repolyo ug Karots sa Pork Chop']
      },
      'Barili': {
        breakfast: ['Luto nga Itlog Bisaya sa Gisadong Kamatis ug Calamansi', 'Luto nga Kamote ug Scrambled Itlog sa Barili', 'Luto nga Itlog sa Gisadong Greens'],
        lunch: ['Kinalan nga Manok Bisaya sa Kalabasa ug Sitaw', 'Pan-Seared Tilapia Fillet ug Sabaw sa Utan', 'Sinugbang Pork Tenderloin ug Salada nga Talong'],
        snack: ['Tuba Buko Water sa Barili ug Luto nga Mais', 'Presko nga Mangga Slices', 'Giatas nga Pipino Dip'],
        dinner: ['Pan-Seared Tilapia Fillet ug Sabaw sa Utan', 'Kinalan nga Manok Bisaya sa Kalabasa', 'Gisadong Sitaw ug Kalabasa sa Manok']
      }
    };

    const locData = LOCATION_MEALS[location] || LOCATION_MEALS['Cebu City'];
    
    // Select base daily item using date seed
    let bTitle = locData.breakfast[(seed) % locData.breakfast.length];
    let lTitle = locData.lunch[(seed + 1) % locData.lunch.length];
    let sTitle = locData.snack[(seed + 2) % locData.snack.length];
    let dTitle = locData.dinner[(seed + 3) % locData.dinner.length];

    // ALLERGY SAFETY FILTER FUNCTION
    const sanitizeMealForUserAllergies = (mealTitle, mealType) => {
      if (!userAllergies || userAllergies.length === 0) return mealTitle;
      
      const lower = mealTitle.toLowerCase();
      const allergiesLower = userAllergies.map(a => String(a).toLowerCase());

      const hasSeafoodAllergy = allergiesLower.some(a => a.includes('seafood') || a.includes('fish') || a.includes('shellfish') || a.includes('shrimp') || a.includes('crab'));
      const hasEggAllergy = allergiesLower.some(a => a.includes('egg'));
      const hasPorkAllergy = allergiesLower.some(a => a.includes('pork'));

      let safeTitle = mealTitle;

      // 1. Seafood / Fish Allergy Filter
      const isSeafoodMeal = ['fish', 'bangus', 'tilapia', 'tangigue', 'tanguigue', 'lato', 'seaweed', 'sutukil', 'kinilaw', 'inun-unan', 'bodboron', 'tulingan', 'crab', 'eel', 'bakasi', 'seafood'].some(kw => lower.includes(kw));
      if (hasSeafoodAllergy && isSeafoodMeal) {
        if (mealType === 'Breakfast') safeTitle = 'Sautéed Native Tomatoes & Malunggay with Steamed Kamote';
        else if (mealType === 'Lunch') safeTitle = 'Grilled Native Chicken Breast with Highland Sayote & Rice';
        else if (mealType === 'Snack') safeTitle = 'Steamed Sweet Corn & Cold Buko Water';
        else safeTitle = 'Native Chicken Tinola with Squash & Kangkong Soup';
      }

      // 2. Egg Allergy Filter
      const isEggMeal = ['egg', 'scramble', 'omelette', 'poached'].some(kw => lower.includes(kw));
      if (hasEggAllergy && isEggMeal) {
        if (mealType === 'Breakfast') safeTitle = 'Steamed Kamote Slices & Calamansi Tea with Native Greens';
        else safeTitle = safeTitle.replace(/egg[s]?|omelette|scramble|poached/gi, 'Native Greens');
      }

      // 3. Pork Allergy Filter
      const isPorkMeal = ['pork', 'humba', 'liempo', 'chicharon', 'tuslob buwa', 'chiu-chiu'].some(kw => lower.includes(kw));
      if (hasPorkAllergy && isPorkMeal) {
        safeTitle = safeTitle.replace(/pork|humba|liempo|chicharon|tuslob buwa|chiu-chiu/gi, 'Grilled Native Chicken');
      }

      return safeTitle;
    };

    bTitle = sanitizeMealForUserAllergies(bTitle, 'Breakfast');
    lTitle = sanitizeMealForUserAllergies(lTitle, 'Lunch');
    sTitle = sanitizeMealForUserAllergies(sTitle, 'Snack');
    dTitle = sanitizeMealForUserAllergies(dTitle, 'Dinner');

    // Dynamically scale calories & macros tailored to user target protein, carbs & fats
    const bKcal = Math.round(totalUserCalories * 0.25);
    const bProt = Math.round(targetProtein * 0.25);
    const bCarb = Math.round(targetCarbs * 0.25);
    const bFat = Math.round(targetFats * 0.25);

    const lKcal = Math.round(totalUserCalories * 0.35);
    const lProt = Math.round(targetProtein * 0.35);
    const lCarb = Math.round(targetCarbs * 0.35);
    const lFat = Math.round(targetFats * 0.35);

    const sKcal = Math.round(totalUserCalories * 0.15);
    const sProt = Math.round(targetProtein * 0.15);
    const sCarb = Math.round(targetCarbs * 0.15);
    const sFat = Math.round(targetFats * 0.15);

    const dKcal = Math.round(totalUserCalories * 0.25);
    const dProt = Math.round(targetProtein * 0.25);
    const dCarb = Math.round(targetCarbs * 0.25);
    const dFat = Math.round(targetFats * 0.25);

    return [
      { id: `palengke-${location.toLowerCase().replace(/\s+/g, '')}-breakfast`, mealType: 'Breakfast', time: '7:30 AM', title: bTitle, calories: bKcal, kcal: bKcal, proteinNum: bProt, carbsNum: bCarb, fatsNum: bFat, protein: `${bProt} protein`, carbs: `${bCarb}g`, fats: `${bFat}g` },
      { id: `palengke-${location.toLowerCase().replace(/\s+/g, '')}-lunch`, mealType: 'Lunch', time: '12:30 PM', title: lTitle, calories: lKcal, kcal: lKcal, proteinNum: lProt, carbsNum: lCarb, fatsNum: lFat, protein: `${lProt} protein`, carbs: `${lCarb}g`, fats: `${lFat}g` },
      { id: `palengke-${location.toLowerCase().replace(/\s+/g, '')}-snack`, mealType: 'Snack', time: '4:00 PM', title: sTitle, calories: sKcal, kcal: sKcal, proteinNum: sProt, carbsNum: sCarb, fatsNum: sFat, protein: `${sProt} protein`, carbs: `${sCarb}g`, fats: `${sFat}g` },
      { id: `palengke-${location.toLowerCase().replace(/\s+/g, '')}-dinner`, mealType: 'Dinner', time: '7:00 PM', title: dTitle, calories: dKcal, kcal: dKcal, proteinNum: dProt, carbsNum: dCarb, fatsNum: dFat, protein: `${dProt} protein`, carbs: `${dCarb}g`, fats: `${dFat}g` }
    ];
  };


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
  const [loadingMeals, setLoadingMeals] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCachedOrFetchMeals = async () => {
      if (!userId) return;

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
            // If cache is from today and valid, skip network fetch
            if (parsed.date === todayStr && !hasGenericTitle) return;
          }
        }

        // If no cached plan exists for today, show loading modal only for initial generation
        if (isMounted && (!dailyPlan || dailyPlan.length === 0)) {
          setLoadingMeals(true);
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
          `Logging this meal (${addedCal} kcal) will put you ${excess} kcal over your daily target of ${targetCalories} kcal.\n\nDo you still want to proceed?`,
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
                  <Text style={[styles.macroMiniVal, { fontSize: 10, color: isOverCalories ? '#EF4444' : '#F97316' }]} numberOfLines={1} ellipsizeMode="tail">
                    {Math.round(parseFloat(consumedCalories) || 0)}/{Math.round(parseFloat(targetCalories) || 0)}
                  </Text>
                  <Text style={styles.macroMiniLabel} numberOfLines={1}>Kcal</Text>
                </View>
                <View style={styles.macroMiniBox}>
                  <Text style={[styles.macroMiniVal, { fontSize: 10, color: '#10B981' }]} numberOfLines={1} ellipsizeMode="tail">
                    {Math.round(parseFloat(dailyNutrition?.protein?.current) || 0)}/{Math.round(parseFloat(targetProtein) || 0)}g
                  </Text>
                  <Text style={styles.macroMiniLabel} numberOfLines={1}>Protein</Text>
                </View>
                <View style={styles.macroMiniBox}>
                  <Text style={[styles.macroMiniVal, { fontSize: 10, color: '#F59E0B' }]} numberOfLines={1} ellipsizeMode="tail">
                    {Math.round(parseFloat(dailyNutrition?.carbs?.current) || 0)}/{Math.round(parseFloat(targetCarbs) || 0)}g
                  </Text>
                  <Text style={styles.macroMiniLabel} numberOfLines={1}>Carbs</Text>
                </View>
                <View style={styles.macroMiniBox}>
                  <Text style={[styles.macroMiniVal, { fontSize: 10, color: '#EC4899' }]} numberOfLines={1} ellipsizeMode="tail">
                    {Math.round(parseFloat(dailyNutrition?.fats?.current) || 0)}/{Math.round(parseFloat(targetFats) || 0)}g
                  </Text>
                  <Text style={styles.macroMiniLabel} numberOfLines={1}>Fats</Text>
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
                  const mealId = String(meal?.id || `meal-plan-${index}`);
                  const isLogged = loggedMeals.some(mId => String(mId) === mealId);
                  return (
                    <View key={mealId} style={styles.timelineItem}>
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
                            onPress={() => handleLogMeal(mealId, { 
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

            {/* CARD 2: INTERACTIVE CITY FOOD RADAR */}
            <View style={styles.formCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.cardTitle}>Interactive Cebu Food Radar</Text>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.10)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}
                  onPress={() => setShowFullMapModal(true)}
                  activeOpacity={0.8}
                >
                  <Maximize2 size={12} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}>Full Map</Text>
                </TouchableOpacity>
              </View>

              {/* NATIVE CITY SELECTION HORIZONTAL SCROLL RADAR */}
              <View style={{ marginBottom: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
                  <TouchableOpacity
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#10B981',
                      borderWidth: 1.5,
                      borderColor: '#10B981'
                    }}
                    onPress={() => setShowCityPickerModal(true)}
                    activeOpacity={0.8}
                  >
                    <Compass size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                      All Cities ({locations.length})
                    </Text>
                  </TouchableOpacity>

                  {locations.map((loc) => {
                    const isSelected = selectedLocation === loc;
                    return (
                      <TouchableOpacity
                        key={loc}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
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
                </ScrollView>
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
                            padding: 6px 12px;
                            border-radius: 16px;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            font-size: 11px;
                            font-weight: 800;
                            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5);
                            border: 2px solid #FFFFFF;
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
                          var selectedLoc = "${selectedLocation}";
                          var cityProfiles = ${JSON.stringify(CITY_PROFILES)};
                          var activeCoords = cityProfiles[selectedLoc] ? [cityProfiles[selectedLoc].lat, cityProfiles[selectedLoc].lng] : [10.3157, 123.8854];

                          var map = L.map('map', { 
                            zoomControl: true, 
                            attributionControl: false,
                            dragging: true, 
                            touchZoom: true, 
                            scrollWheelZoom: true, 
                            doubleClickZoom: true 
                          }).setView(activeCoords, 9);
                          
                          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 18
                          }).addTo(map);

                          Object.keys(cityProfiles).forEach(function(cityName) {
                            var prof = cityProfiles[cityName];
                            var isSelected = cityName === selectedLoc;
                            var customIcon = L.divIcon({
                              className: 'custom-div-icon',
                              html: "<div class='city-marker " + (isSelected ? "active" : "") + "'>📍 " + cityName + "</div>",
                              iconSize: [110, 32],
                              iconAnchor: [55, 16]
                            });

                            var marker = L.marker([prof.lat, prof.lng], { icon: customIcon }).addTo(map);
                            marker.on('click', function() {
                              if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(cityName);
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
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 6 }}>
                      <Navigation size={14} color={logoGreen} style={{ marginRight: 6 }} />
                      <Text style={styles.cityDetailTitle} numberOfLines={1}>
                        {CITY_PROFILES[selectedLocation].marketTitle || `${selectedLocation} Food Market`}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <ShoppingBag size={12} color={theme?.textSecondary || '#94A3B8'} style={{ marginRight: 5 }} />
                    <Text style={[styles.cityPalengkeText, { flex: 1 }]}>
                      <Text style={{ fontWeight: '700' }}>Local Supplies:</Text> {CITY_PROFILES[selectedLocation].palengkeItems}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* 1-DAY PALENGKE MEAL RECOMMENDATION CARD & FAMOUS DELICACIES CARD */}
            {CITY_PROFILES[selectedLocation] && (
              <>
                <View style={{ marginBottom: 16 }}>
                  {(() => {
                    const todayPlan = getDynamicPalengkePlan(selectedLocation, targetCalories, targetProtein, targetCarbs, targetFats);
                    const totalKcal = todayPlan.reduce((acc, m) => acc + m.kcal, 0);
                    const allergiesText = userAllergies && userAllergies.length > 0 ? userAllergies.join(', ') : 'None';

                    return (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={[styles.sectionLabelTitle, { marginBottom: 0 }]}>🍽️ 1-Day Local Diet ({selectedLocation})</Text>
                          <View style={{ backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.10)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: logoGreen }}>
                              ~{totalKcal} Kcal Total
                            </Text>
                          </View>
                        </View>

                        {/* ALLERGY SAFETY STATUS BANNER */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                          borderWidth: 1,
                          borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          marginBottom: 12
                        }}>
                          <CheckCircle2 size={14} color="#10B981" style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: isDarkMode ? '#A7F3D0' : '#047857', flex: 1 }}>
                            🛡️ Allergy Safety Active: Filtered for your profile ({allergiesText})
                          </Text>
                        </View>

                        <View style={styles.timelineList}>
                          {todayPlan.map((mealItem, idx) => {
                            const rawCat = mealItem.mealType || 'Meal';
                            const cebuanoCat = rawCat === 'Breakfast' ? 'Pamahaw' : rawCat === 'Lunch' ? 'Paniudto' : rawCat === 'Snack' ? 'Pama-an' : rawCat === 'Dinner' ? 'Panihapon' : rawCat;
                            const IconComponent = getMealIconComponent(rawCat);
                            const accentColor = getMealAccentColor(rawCat);
                            const mealId = String(mealItem.id);
                            const isLogged = loggedMeals.some(mId => String(mId) === mealId);

                            return (
                              <View key={mealId} style={styles.timelineItem}>
                                <View style={[styles.timelineCard, isLogged && styles.timelineCardLogged]}>
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
                                        {cebuanoCat}
                                      </Text>
                                    </View>
                                    <Text style={styles.timelineTime}>{mealItem.time}</Text>
                                  </View>

                                  <Text style={[styles.timelineTitle, isLogged && { color: '#64748B' }]}>
                                    {mealItem.title}
                                  </Text>

                                  <View style={styles.timelineFooter}>
                                    <View style={{ flex: 1, paddingRight: 8 }}>
                                      <Text style={styles.timelineMacroText}>
                                        {mealItem.kcal} kcal • {mealItem.proteinNum} protein
                                      </Text>
                                      <TouchableOpacity 
                                        style={styles.viewRecipeTextBtn} 
                                        onPress={() => handleViewRecipe(mealItem)}
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
                                      onPress={() => handleLogMeal(mealId, { 
                                        name: mealItem.title,
                                        calories: mealItem.kcal, 
                                        protein: mealItem.proteinNum,
                                        carbs: mealItem.carbsNum,
                                        fats: mealItem.fatsNum
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
                      </>
                    );
                  })()}
                </View>

                {/* FAMOUS NATIVE DISHES & CULINARY HERITAGE CARD */}
                {CITY_PROFILES[selectedLocation].famousDishes && (
                  <View style={[styles.formCard, { marginBottom: 24 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Sparkles size={18} color="#F59E0B" style={{ marginRight: 6 }} />
                      <Text style={styles.cardTitle}>Famous Delicacies ({selectedLocation})</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B', marginBottom: 14, lineHeight: 18 }}>
                      Iconic local dishes, traditional street food, and heritage delicacies famous in {selectedLocation}:
                    </Text>

                    <View style={{ gap: 10 }}>
                      {CITY_PROFILES[selectedLocation].famousDishes.map((dish, idx) => (
                        <View key={idx} style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                          padding: 12,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: isDarkMode ? '#334155' : '#E2E8F0'
                        }}>
                          <View style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12
                          }}>
                            <Text style={{ fontSize: 20 }}>{dish.emoji || '🍲'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                              {dish.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2, lineHeight: 16 }}>
                              {dish.desc}
                            </Text>
                          </View>
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
                🗺️ Full Cebu Island Food Map
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 }}>
                Tap any city marker to select local food market ({locations.length} cities)
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
                      var selectedLoc = "${selectedLocation}";
                      var cityProfiles = ${JSON.stringify(CITY_PROFILES)};
                      var activeCoords = cityProfiles[selectedLoc] ? [cityProfiles[selectedLoc].lat, cityProfiles[selectedLoc].lng] : [10.3157, 123.8854];

                      var map = L.map('map', { zoomControl: true, attributionControl: false }).setView(activeCoords, 9);
                      
                      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 18
                      }).addTo(map);

                      Object.keys(cityProfiles).forEach(function(cityName) {
                        var prof = cityProfiles[cityName];
                        var isSelected = cityName === selectedLoc;
                        var customIcon = L.divIcon({
                          className: 'custom-div-icon',
                          html: "<div class='city-marker " + (isSelected ? "active" : "") + "'>📍 " + cityName + "</div>",
                          iconSize: [110, 36],
                          iconAnchor: [55, 18]
                        });

                        var marker = L.marker([prof.lat, prof.lng], { icon: customIcon }).addTo(map);
                        marker.on('click', function() {
                          if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(cityName);
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
                  setShowFullMapModal(false);
                }
              }}
              style={{ flex: 1, backgroundColor: 'transparent' }}
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
        visible={isFetchingRecipe || loadingMeals}
        type={isFetchingRecipe ? "recipe" : "meal"}
        title={isFetchingRecipe ? "Crafting Custom Recipe" : "Generating AI Daily Meal Plan"}
        subtitle={isFetchingRecipe ? "Vita AI is personalizing your nutrition" : "Vita AI is calculating your optimal daily macros"}
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
    width: '100%',
  },
  macroMiniBox: {
    width: '23.5%',
    maxWidth: '24%',
    height: 54,
    minHeight: 54,
    maxHeight: 54,
    backgroundColor: theme?.surface || baseColor,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
    overflow: 'hidden',
  },
  macroMiniVal: {
    width: '100%',
    fontSize: 9.5,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    textAlign: 'center',
  },
  macroMiniLabel: {
    width: '100%',
    fontSize: 9.5,
    fontWeight: '700',
    color: theme?.textSecondary || '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
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
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
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