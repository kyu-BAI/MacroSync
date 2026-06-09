import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './src/context/ThemeContext';
import { 
  StyleSheet, 
  View,
  Alert 
} from 'react-native';
import { recommendedRecipesPool } from './src/data/recipes';

// Onboarding & Auth Screen Components
import SplashScreen from "./src/screens/auth/SplashScreen"; // Cleanly imported matching your folder structure
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";
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
import API_URL from "./src/screens/config/api";


function MainApp() {
  // Navigation Routing States: 'SPLASH', 'LOGIN', 'SIGNUP', 'FORGOT_PASS', 'OTP_ENTRY', 'RESET_PASS', 'STEP_ONE', 'STEP_TWO', 'STEP_THREE', 'DASHBOARD'
  const [currentScreen, setCurrentScreen] = useState('SPLASH');
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  // Core Account Identity State Management
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState({ name: 'User', email: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [tempOnboardingData, setTempOnboardingData] = useState(null);

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


  const [notifications, setNotifications] = useState([
    { 
      id: 'n1', 
      title: 'Hydration & Routine 💧', 
      category: 'hydration', 
      time: '10:00 AM', 
      read: false, 
      message: 'Automated reminder: Time to drink water! Staying hydrated is key to your healthy routine activities.' 
    },
    { 
      id: 'n2', 
      title: 'Workout Complete! 🔥', 
      category: 'achievement', 
      time: 'Yesterday', 
      read: false, 
      message: 'Motivational update: Awesome job! You burned 320 calories. Consistency in health monitoring is key.' 
    },
    { 
      id: 'n3', 
      title: 'Milestone Reached 🏃', 
      category: 'achievement', 
      time: 'Yesterday', 
      read: true, 
      message: 'You hit your calorie target and crushed your 10,000 step milestone! Great daily progress.' 
    },
    { 
      id: 'n4', 
      title: 'Dinner Logging 🍽️', 
      category: 'meal', 
      time: '2 Days Ago', 
      read: true, 
      message: 'Automated reminder: Don\'t forget to log your dinner macros to maintain diet tracking consistency.' 
    },
    { 
      id: 'n5', 
      title: 'Smart Goal Adjustment 🧠', 
      category: 'workout', 
      time: '3 Days Ago', 
      read: true, 
      message: 'Personalized notification: Adjusted based on your behavior and daily routines to improve long-term engagement and adherence.' 
    }
  ]);

  const fetchDashboardData = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/dashboard/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Sync frontend states with backend response
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
          protein: {
            current: data.nutrition.protein.current,
            target: data.nutrition.protein.target
          },
          carbs: {
            current: data.nutrition.carbs.current,
            target: data.nutrition.carbs.target
          },
          fats: {
            current: data.nutrition.fats.current,
            target: data.nutrition.fats.target
          }
        });
        
        if (data.exercise) {
          setDailyExercise({
            caloriesBurned: data.exercise.caloriesBurned,
            activeMinutes: data.exercise.activeMinutes,
            recentExercise: data.exercise.recentExercise || 'None'
          });
        }

        if (data.water) {
          setGlobalConsumedGlasses(data.water.glasses || 0);
        }

        if (data.loggedMealIds) {
          setGlobalLoggedMeals(data.loggedMealIds);
        }
        
        setUserProfile(prev => ({
          ...prev,
          name: data.profile.name || 'User',
          email: data.profile.email || prev.email || '',
          profileImage: data.profile.profileImage || null
        }));
      } else {
        console.log("Failed to fetch dashboard data:", data.detail);
      }
    } catch (error) {
      console.log("Error fetching dashboard data:", error);
    }
  };

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
          setCurrentScreen("STEP_ONE");
        }}
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
  const handleLogoutRoutine = () => {
    setUserId(null);
    setUserProfile({ name: 'User', email: '', profileImage: null });
    setGlobalLoggedMeals([]);
    setGlobalConsumedGlasses(0);
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
    setActiveTab('DASHBOARD'); // Resets active navigation state variables cleanly
  };

  return (
    <View style={styles.appContainerRoot}>
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
          onLogMeal={async (macros) => {
            if (!userId) {
              Alert.alert("Authentication Error", "You must be logged in to log meals.");
              return;
            }
            const mealId = `meal-${Date.now()}`;
            try {
              const response = await fetch(`${API_URL}/meals`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id: mealId,
                  user_id: userId,
                  name: macros.name || 'Scanned Food',
                  calories: macros.calories || 0,
                  protein: macros.protein || 0,
                  carbs: macros.carbs || 0,
                  fats: macros.fats || 0
                }),
              });

              if (!response.ok) {
                let errMsg = 'Failed to log meal on server';
                try {
                  const errData = await response.json();
                  if (errData && errData.detail) {
                    errMsg = errData.detail;
                  }
                } catch (_) {}
                throw new Error(errMsg);
              }

              if (setDailyNutrition) {
                setDailyNutrition(prev => ({
                  ...prev,
                  consumedCalories: prev.consumedCalories + macros.calories,
                  protein: { ...prev.protein, current: prev.protein.current + macros.protein },
                  carbs: { ...prev.carbs, current: prev.carbs.current + macros.carbs },
                  fats: { ...prev.fats, current: prev.fats.current + macros.fats }
                }));
              }
              if (setGlobalLoggedMeals) {
                setGlobalLoggedMeals(prev => [...prev, mealId]);
              }
            } catch (error) {
              console.error("Error logging scanned food:", error);
              Alert.alert("Error", error.message || "Failed to log meal to server.");
            }
          }}
        />
      )}
      {activeTab === 'WORKOUT' && (
        <WorkoutScreen 
          onTabChange={(tab) => setActiveTab(tab)} 
          userId={userId}
          onRefreshDashboard={fetchDashboardData}
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
  }
});

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}