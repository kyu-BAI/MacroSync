import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './src/context/ThemeContext';
import { 
  StyleSheet, 
  View,
  Alert,
  Text,
  Linking,
} from 'react-native';
import { recommendedRecipesPool } from './src/data/recipes';
import NetInfo from '@react-native-community/netinfo';
import * as WebBrowser from 'expo-web-browser';
import {
  cacheDashboardData,
  getCachedDashboardData,
  saveUserId,
  getSavedUserId,
  clearSavedUserId,
  addToSyncQueue,
  syncQueueToBackend,
} from './src/services/OfflineStorage';

// Onboarding & Auth Screen Components
import SplashScreen from "./src/screens/auth/SplashScreen"; // Cleanly imported matching your folder structure
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";
import VerifyEmailScreen from "./src/screens/auth/VerifyEmailScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import OtpScreen from "./src/screens/auth/OtpScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";

import StepOneScreen from "./src/screens/onboarding/StepOneScreen";
import StepTwoScreen from "./src/screens/onboarding/StepTwoScreen";
import StepThreeScreen from "./src/screens/onboarding/StepThreeScreen";
import GeneratingPlanScreen from "./src/screens/onboarding/GeneratingPlanScreen";

// Core Dashboard Main Screen Panels
import DashboardScreen from "./src/screens/main/DashboardScreen";
import DietRecipesScreen from "./src/screens/main/DietRecipesScreen";
import WorkoutScreen from "./src/screens/main/WorkoutScreen";
import ChatbotAIScreen from "./src/screens/main/ChatbotAIScreen";
import SettingsScreen from "./src/screens/main/SettingsScreen";
import NotificationsScreen from "./src/screens/main/NotificationsScreen";
import FoodScannerScreen from "./src/screens/main/FoodScannerScreen";
import BottomNavBar from "./src/components/BottomNavBar";
import DraggableChatbotButton from "./src/components/DraggableChatbotButton";
import API_URL from "./src/screens/config/api";


function MainApp() {
  // Navigation Routing States: 'SPLASH', 'LOGIN', 'SIGNUP', 'VERIFY_SIGNUP', 'FORGOT_PASS', 'OTP_ENTRY', 'RESET_PASS', 'STEP_ONE', 'STEP_TWO', 'STEP_THREE', 'DASHBOARD'
  const [currentScreen, setCurrentScreen] = useState('SPLASH');
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  // Core Account Identity State Management
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState({ name: 'User', email: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [tempOnboardingData, setTempOnboardingData] = useState(null);

  // ── Offline / Connectivity State ──────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(true);
  const [isLoadedFromCache, setIsLoadedFromCache] = useState(false);
  const wasOfflineRef = useRef(false);

  // Collected Onboarding State Metrics to sync downstream
  const [userBaseline, setUserBaseline] = useState({
    age: '',
    weight: '',
    height: '',
    startingWeight: '',
  });
  const [userGoals, setUserGoals] = useState({
    activityLevel: 'moderate',
    goal: 'muscle',
    goalWeight: '',
    targetDate: '',
  });

  // Module 5 Frontend State Sharing
  const [dailyNutrition, setDailyNutrition] = useState({
    targetCalories: 2500,
    consumedCalories: 0,
    protein: { current: 0, target: 150 },
    carbs: { current: 0, target: 250 },
    fats: { current: 0, target: 70 }
  });

  const [dailyExercise, setDailyExercise] = useState({
    caloriesBurned: 320,
    activeMinutes: 45,
    recentExercise: 'Full Body HIIT - 45 mins'
  });

  // Persisted Dashboard Local State
  const [globalLoggedWeight, setGlobalLoggedWeight] = useState(null);
  const [globalConsumedGlasses, setGlobalConsumedGlasses] = useState(4);
  const [globalLoggedMeals, setGlobalLoggedMeals] = useState([]);
  const [sessionRecipes, setSessionRecipes] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  // Lifted Goal completion & Reset States to survive tab switches
  const [localStartingWeight, setLocalStartingWeight] = useState(null);
  const [localGoalWeight, setLocalGoalWeight] = useState(null);
  const [localGoalLabel, setLocalGoalLabel] = useState(null);
  const [goalReachedAlertShown, setGoalReachedAlertShown] = useState(false);

  // Lifted weight chart history (7-day window) — survives tab switches
  // Each entry is a kg value; index 6 = today (most recent)
  const [weightHistory, setWeightHistory] = useState(null);


  const [notifications, setNotifications] = useState([]);

  // ── Apply dashboard API response to all state variables ─────────────────
  const applyDashboardData = (data) => {
    setUserBaseline({
      weight: data.profile.currentWeight ? data.profile.currentWeight.toString() : '70',
      height: data.profile.height ? data.profile.height.toString() : '170',
      age: data.profile.age ? data.profile.age.toString() : '25',
      startingWeight: data.profile.startingWeight ? data.profile.startingWeight.toString() : (data.profile.currentWeight ? data.profile.currentWeight.toString() : '70')
    });
    setUserGoals({
      goal: data.profile.goal === 'Build Muscle' ? 'muscle' : data.profile.goal === 'Lose Weight' ? 'fatloss' : 'maintain',
      goalWeight: data.profile.targetWeight ? data.profile.targetWeight.toString() : '70',
      targetDate: data.profile.targetDate || '',
      activityLevel: data.profile.activityLevel || 'moderate'
    });
    setDailyNutrition({
      targetCalories: data.nutrition.targetCalories,
      consumedCalories: data.nutrition.consumedCalories,
      protein: { current: data.nutrition.protein.current, target: data.nutrition.protein.target },
      carbs: { current: data.nutrition.carbs.current, target: data.nutrition.carbs.target },
      fats: { current: data.nutrition.fats.current, target: data.nutrition.fats.target }
    });
    if (data.exercise) {
      setDailyExercise({
        caloriesBurned: data.exercise.caloriesBurned,
        activeMinutes: data.exercise.activeMinutes,
        recentExercise: data.exercise.recentExercise || 'None'
      });
    }
    if (data.water) setGlobalConsumedGlasses(data.water.glasses || 0);
    if (data.profile.currentWeight !== undefined && data.profile.currentWeight !== null) {
      const w = data.profile.currentWeight;
      setGlobalLoggedWeight(w);
      // Seed the chart history only once (when it is still null)
      setWeightHistory(prev => {
        if (prev !== null) return prev; // already seeded — don't overwrite user's logged history
        const sw = data.profile.startingWeight || w;
        // Build a realistic-looking 6-day ramp from startingWeight toward current
        const step = (w - sw) / 6;
        return Array.from({ length: 7 }, (_, i) =>
          parseFloat((sw + step * i).toFixed(1))
        );
      });
    }
    if (data.loggedMealIds) setGlobalLoggedMeals(data.loggedMealIds);
    setUserProfile(prev => ({
      ...prev,
      name: data.profile.name || 'User',
      email: data.profile.email || prev.email || '',
      profileImage: data.profile.profileImage || null,
      isPremium: !!data.nutrition.isPremium
    }));
  };

  const fetchDashboardData = async (currentUserId) => {
    const uid = currentUserId || userId;
    if (!uid) return;
    try {
      const response = await fetch(`${API_URL}/dashboard/${uid}`);
      const data = await response.json();
      if (response.ok) {
        applyDashboardData(data);
        // Save to local cache for offline use
        await cacheDashboardData(uid, data);
        setIsLoadedFromCache(false);
      } else {
        console.log('Failed to fetch dashboard data:', data.detail);
      }
    } catch (error) {
      console.log('Error fetching dashboard (trying cache):', error);
      // Try loading from local cache
      const cached = await getCachedDashboardData(uid);
      if (cached) {
        applyDashboardData(cached.data);
        setIsLoadedFromCache(true);
      }
    }
  };

  // ── DEEP LINK HANDLING FOR BROWSER-BASED GOOGLE OAUTH ────────────────────
  const handleGoogleLoginSuccess = async (email, name) => {
    try {
      console.log("Deep link sign-in payload received:", email, name);
      const response = await fetch(`${API_URL}/auth/google-signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, name })
      });
      const data = await response.json();
      console.log("Google Deep link Sign-In response:", data);

      if (response.ok && data.success) {
        const uid = data.user_id || data.user?.id;
        if (uid) {
          setUserId(uid);
          setUserProfile({ name: name, email: email });
        }
        setCurrentScreen("DASHBOARD");
      } else {
        Alert.alert("Authentication Failed", data.detail || "Google sign-in failed.");
      }
    } catch (err) {
      console.log("Deep link auth error:", err);
      Alert.alert("Connection Error", "Cannot connect to backend server.");
    }
  };

  const handleDeepLink = async (url) => {
    console.log("App Deep Link parsed:", url);
    if (!url) return;
    
    // Format: sync://google-auth?email=xxx&name=xxx
    if (url.startsWith("sync://google-auth")) {
      try {
        WebBrowser.dismissBrowser();
      } catch (e) {
        console.log("Error dismissing WebBrowser:", e);
      }
      const queryString = url.split("?")[1];
      if (queryString) {
        const params = {};
        queryString.split("&").forEach(pair => {
          const [key, val] = pair.split("=");
          if (key && val) {
            params[key] = decodeURIComponent(val);
          }
        });
        
        if (params.email && params.name) {
          await handleGoogleLoginSuccess(params.email, params.name);
        }
      }
    }
  };

  // ── NetInfo: detect connectivity changes ─────────────────────────────────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);

      if (online && wasOfflineRef.current && userId) {
        // Just came back online — sync queued actions then refresh dashboard
        console.log('Back online! Syncing queue...');
        const result = await syncQueueToBackend(API_URL);
        if (result.synced > 0) {
          Alert.alert(
            '✅ Back Online',
            `Synced ${result.synced} offline action${result.synced > 1 ? 's' : ''} to the server.`
          );
        }
        await fetchDashboardData();
      }
      wasOfflineRef.current = !online;
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    // Check if the app was opened from a deep link initially
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for incoming deep links while the app is active
    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url) {
        handleDeepLink(event.url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
  // ── NetInfo: detect connectivity changes ─────────────────────────────────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);

      if (online && wasOfflineRef.current && userId) {
        // Just came back online — sync queued actions then refresh dashboard
        console.log('Back online! Syncing queue...');
        const result = await syncQueueToBackend(API_URL);
        if (result.synced > 0) {
          Alert.alert(
            '✅ Back Online',
            `Synced ${result.synced} offline action${result.synced > 1 ? 's' : ''} to the server.`
          );
        }
        await fetchDashboardData();
      }
      wasOfflineRef.current = !online;
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (userId && currentScreen === 'DASHBOARD') {
      fetchDashboardData();
    }
  }, [userId, currentScreen]);

  useEffect(() => {
    if (userId) {
      const shuffled = [...recommendedRecipesPool].sort(() => 0.5 - Math.random());
      setSessionRecipes(shuffled.slice(0, 8));
    } else {
      setSessionRecipes([]);
    }
  }, [userId]);

  // ----------------------------------------------------
  // INITIAL INITIALIZATION STATE VIEWPORT CONTROL
  // ----------------------------------------------------
  if (currentScreen === 'SPLASH') {
    return (
      <SplashScreen 
        onAppReady={() => setCurrentScreen('LOGIN')} 
      />
    );
  }

  // ----------------------------------------------------
  // SECTION 1: AUTHENTICATION ROUTING STATE MACHINE
  // ----------------------------------------------------
  if (currentScreen === 'LOGIN') {
    return (
      <LoginScreen
        onNavigateToSignUp={() => setCurrentScreen("SIGNUP")}
        onLoginSuccess={() => setCurrentScreen("DASHBOARD")}
        onForgotPassword={() => setCurrentScreen("FORGOT_PASS")}
        setCurrentUserId={(id) => setUserId(id)} 
      />
    );
  }
  
  if (currentScreen === "SIGNUP") {
    return (
      <SignUpScreen
        onNavigateToLogin={() => setCurrentScreen("LOGIN")}
        onSignUpSuccess={(newUserId, newName, newEmail) => {
          setUserId(newUserId); 
          setUserProfile({ name: newName || 'User', email: newEmail || '' });
          setResetEmail(newEmail || '');
          setCurrentScreen("VERIFY_SIGNUP");
        }}
      />
    );
  }

  if (currentScreen === "VERIFY_SIGNUP") {
    return (
      <VerifyEmailScreen
        email={resetEmail}
        onVerified={() => setCurrentScreen("STEP_ONE")}
        onNavigateBack={() => setCurrentScreen("SIGNUP")}
      />
    );
  }

  if (currentScreen === "FORGOT_PASS") {
    return (
      <ForgotPasswordScreen
        onNavigateBack={() => setCurrentScreen("LOGIN")}
        onOtpSent={(email) => {
          setResetEmail(email); 
          setCurrentScreen("OTP_ENTRY");
        }}
      />
    );
  }
  
  if (currentScreen === "RESET_PASS") {
    return (
      <ResetPasswordScreen
        email={resetEmail}
        onResetSuccess={() => setCurrentScreen("LOGIN")}
      />
    );
  }
  
  if (currentScreen === "OTP_ENTRY") {
    return (
      <OtpScreen
        email={resetEmail}
        onVerified={() => setCurrentScreen("RESET_PASS")}
        onNavigateBack={() => setCurrentScreen("FORGOT_PASS")}
      />
    );
  }
  
  // ----------------------------------------------------
  // SECTION 2: DYNAMIC ONBOARDING PROCESS STEPS
  // ----------------------------------------------------
  if (currentScreen === 'STEP_ONE') {
    return (
      <StepOneScreen 
        onNext={(baselineMetrics) => {
          if (baselineMetrics) {
            setUserBaseline(baselineMetrics);
          }
          setCurrentScreen('STEP_TWO');
        }} 
      />
    );
  }
  if (currentScreen === 'STEP_TWO') {
    return (
      <StepTwoScreen 
        currentWeight={userBaseline.weight}
        height={userBaseline.height}
        onNext={(goalMetrics) => {
          if (goalMetrics) {
            setUserGoals(goalMetrics);
          }
          setCurrentScreen('STEP_THREE');
        }} 
      />
    );
  }
  if (currentScreen === 'STEP_THREE') {
    return (
      <StepThreeScreen 
        onSubmit={(finalPersonalizationData) => {
          // Unifies all compiled metrics for data payload synchronization
          const onboardingPayload = {
            userId: userId,
            ...userBaseline,
            ...userGoals,
            ...finalPersonalizationData
          };
          console.log("Complete Integrated Onboarding Payload Matrix:", onboardingPayload);
          setTempOnboardingData(onboardingPayload);
          setCurrentScreen('GENERATING_PLAN');
        }} 
      />
    );
  }

  if (currentScreen === 'GENERATING_PLAN') {
    return (
      <GeneratingPlanScreen
        profileData={tempOnboardingData}
        onComplete={(finalData) => {
          if (finalData) {
            setUserBaseline({
              age: finalData.age || userBaseline.age,
              weight: finalData.weight || userBaseline.weight,
              height: finalData.height || userBaseline.height,
              startingWeight: finalData.startingWeight || finalData.weight || userBaseline.startingWeight || userBaseline.weight || '70',
            });
            setUserGoals({
              activityLevel: finalData.activityLevel || userGoals.activityLevel,
              goal: finalData.goal || userGoals.goal,
              goalWeight: finalData.goalWeight || userGoals.goalWeight,
              targetDate: finalData.targetDate || userGoals.targetDate,
            });
          }
          setCurrentScreen('DASHBOARD');
        }}
      />
    );
  }

  // ----------------------------------------------------
  // SECTION 3: APP CORE VIEWPORTS (FULLY INTEGRATED SCREEN ROUTING)
  // ----------------------------------------------------
  const handleLogoutRoutine = async () => {
    await clearSavedUserId();
    setUserId(null);
    setUserProfile({ name: 'User', email: '', profileImage: null });
    setGlobalLoggedWeight(null);
    setGlobalLoggedMeals([]);
    setGlobalConsumedGlasses(0);
    setIsLoadedFromCache(false);
    setDailyNutrition({
      targetCalories: 2500,
      consumedCalories: 0,
      protein: { current: 0, target: 150 },
      carbs: { current: 0, target: 250 },
      fats: { current: 0, target: 70 }
    });
    setDailyExercise({
      caloriesBurned: 0,
      activeMinutes: 0,
      recentExercise: 'None'
    });
    setChatMessages([]);
    setCurrentScreen('LOGIN');
    setActiveTab('DASHBOARD');
  };

  // ── Offline banner shown at top of screen ───────────────────────────────
  const OfflineBanner = () => {
    if (isOnline) return null;
    return (
      <View style={styles.offlineBanner}>
        <Text style={styles.offlineBannerText}>
          {isLoadedFromCache
            ? '📴 Offline — Showing cached data. Changes will sync when back online.'
            : '📴 No internet connection. Logs saved and will sync automatically.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.appContainerRoot}>
      <OfflineBanner />
      {activeTab === 'DASHBOARD' && (
        <DashboardScreen 
          onTabChange={(tab) => setActiveTab(tab)} 
          userBaseline={userBaseline}
          userGoals={userGoals}
          dailyNutrition={dailyNutrition}
          dailyExercise={dailyExercise}
          notifications={notifications}
          setNotifications={setNotifications}
          globalLoggedWeight={globalLoggedWeight}
          setGlobalLoggedWeight={setGlobalLoggedWeight}
          globalConsumedGlasses={globalConsumedGlasses}
          setGlobalConsumedGlasses={setGlobalConsumedGlasses}
          userProfile={userProfile}
          userId={userId}
          onRefreshDashboard={fetchDashboardData}
          isOnline={isOnline}
          localStartingWeight={localStartingWeight}
          setLocalStartingWeight={setLocalStartingWeight}
          localGoalWeight={localGoalWeight}
          setLocalGoalWeight={setLocalGoalWeight}
          localGoalLabel={localGoalLabel}
          setLocalGoalLabel={setLocalGoalLabel}
          goalReachedAlertShown={goalReachedAlertShown}
          setGoalReachedAlertShown={setGoalReachedAlertShown}
          weightHistory={weightHistory}
          setWeightHistory={setWeightHistory}
        />
      )}
      {activeTab === 'DIET' && (
        <DietRecipesScreen 
          onTabChange={(tab) => setActiveTab(tab)} 
          dailyNutrition={dailyNutrition}
          setDailyNutrition={setDailyNutrition}
          guestBaseline={userBaseline}
          guestGoals={userGoals}
          globalLoggedMeals={globalLoggedMeals}
          setGlobalLoggedMeals={setGlobalLoggedMeals}
          sessionRecipes={sessionRecipes}
          userId={userId}
          isOnline={isOnline}
        />
      )}
      {activeTab === 'CHATBOT' && (
        <ChatbotAIScreen 
          onTabChange={(tab) => setActiveTab(tab)} 
          userId={userId}
          userProfile={userProfile}
          messages={chatMessages}
          setMessages={setChatMessages}
        />
      )}
      {activeTab === 'SCANNER' && (
        <FoodScannerScreen 
          onTabChange={(tab) => setActiveTab(tab)} 
          userId={userId}
          userProfile={userProfile}
          onLogMeal={async (macros) => {
            if (!userId) {
              Alert.alert('Authentication Error', 'You must be logged in to log meals.');
              return;
            }
            const mealId = `meal-${Date.now()}`;
            const mealPayload = {
              id: mealId,
              user_id: userId,
              name: macros.name || 'Scanned Food',
              calories: macros.calories || 0,
              protein: macros.protein || 0,
              carbs: macros.carbs || 0,
              fats: macros.fats || 0
            };

            if (!isOnline) {
              // Offline: queue it and update UI optimistically
              await addToSyncQueue({ type: 'LOG_MEAL', payload: mealPayload });
              setDailyNutrition(prev => ({
                ...prev,
                consumedCalories: prev.consumedCalories + mealPayload.calories,
                protein: { ...prev.protein, current: prev.protein.current + mealPayload.protein },
                carbs: { ...prev.carbs, current: prev.carbs.current + mealPayload.carbs },
                fats: { ...prev.fats, current: prev.fats.current + mealPayload.fats }
              }));
              setGlobalLoggedMeals(prev => [...prev, mealId]);
              Alert.alert('📴 Saved Offline', 'Meal saved locally. Will sync when back online.');
              return;
            }

            try {
              const response = await fetch(`${API_URL}/meals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mealPayload),
              });
              if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Failed to log meal');
              }
              setDailyNutrition(prev => ({
                ...prev,
                consumedCalories: prev.consumedCalories + mealPayload.calories,
                protein: { ...prev.protein, current: prev.protein.current + mealPayload.protein },
                carbs: { ...prev.carbs, current: prev.carbs.current + mealPayload.carbs },
                fats: { ...prev.fats, current: prev.fats.current + mealPayload.fats }
              }));
              setGlobalLoggedMeals(prev => [...prev, mealId]);
            } catch (error) {
              console.error('Error logging scanned food:', error);
              Alert.alert('Error', error.message || 'Failed to log meal to server.');
            }
          }}
        />
      )}
      {activeTab === 'WORKOUT' && (
        <WorkoutScreen 
          onTabChange={(tab) => setActiveTab(tab)} 
          userId={userId}
          onRefreshDashboard={fetchDashboardData}
          isOnline={isOnline}
          dailyExercise={dailyExercise}
          setDailyExercise={setDailyExercise}
        />
      )}
      {activeTab === 'SETTINGS' && (
        <SettingsScreen 
          onTabChange={(tab) => {
            if (tab === 'AUTH') {
              handleLogoutRoutine();
            } else {
              setActiveTab(tab);
            }
          }} 
          onLogout={handleLogoutRoutine} 
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          userId={userId}
        />
      )}
      {activeTab === 'NOTIFICATIONS' && (
        <NotificationsScreen 
          onTabChange={(tab) => setActiveTab(tab)} 
          notifications={notifications}
          setNotifications={setNotifications}
        />
      )}
      {['DASHBOARD', 'DIET', 'WORKOUT', 'SETTINGS'].includes(activeTab) && (
        <DraggableChatbotButton onPress={() => setActiveTab('CHATBOT')} />
      )}
      {['DASHBOARD', 'DIET', 'CHATBOT', 'WORKOUT', 'SETTINGS'].includes(activeTab) && (
        <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </View>
  );
}

// Uniform High-Contrast System Theme Setup Tokens
const baseColor = '#F0F4F2';

const styles = StyleSheet.create({
  appContainerRoot: {
    flex: 1,
    backgroundColor: baseColor
  },
  offlineBanner: {
    backgroundColor: '#92400E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  offlineBannerText: {
    color: '#FEF3C7',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}