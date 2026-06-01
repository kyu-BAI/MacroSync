import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, TouchableOpacity, Text, Image, Animated } from 'react-native';

// Clean, minimal black vector icons matching the new dashboard system
import { Home, ClipboardList, Dumbbell, Settings as SettingsIcon } from 'lucide-react-native';

// Onboarding & Auth Imports
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import OtpScreen from './src/screens/auth/OtpScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import StepOneScreen from './src/screens/onboarding/StepOneScreen';
import StepTwoScreen from './src/screens/onboarding/StepTwoScreen';
import StepThreeScreen from './src/screens/onboarding/StepThreeScreen';

// Core Dashboard Panels
import DashboardScreen from './src/screens/main/DashboardScreen';
import DietRecipesScreen from './src/screens/main/DietRecipesScreen';
import WorkoutScreen from './src/screens/main/WorkoutScreen';
import SettingsScreen from './src/screens/main/SettingsScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true); // Control flag for custom loading visibility
  const [currentScreen, setCurrentScreen] = useState('LOGIN');
  const [activeTab, setActiveTab] = useState('Home'); 
  
  // Animated value initialization for a premium opacity fade transition
  const [fadeAnim] = useState(new Animated.Value(1));

  // ⏱️ TIMER HOOK FOR RUNTIME ENGINE INJECTION
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // Smooth 500ms exit fade animation
        useNativeDriver: true,
      }).start(() => {
        setIsLoading(false); // Drop splash from component tree upon animation close
      });
    }, 3000); // Displays for 3000ms (3 seconds)

    return () => clearTimeout(timer);
  }, []);

  // 🎬 INTERCEPT WITH CUSTOM RUNTIME ANIMATED SPLASH ELEMENT
  if (isLoading) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <Image 
          source={require('./assets/splash-icon.png')} 
          style={styles.splashLogo}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }

  // 🔐 AUTH STATE MACHINE ROUTING
  if (currentScreen === 'LOGIN') {
    return (
      <LoginScreen 
        onNavigateToSignUp={() => setCurrentScreen('SIGNUP')} 
        onLoginSuccess={() => setCurrentScreen('DASHBOARD')}
        onForgotPassword={() => setCurrentScreen('FORGOT_PASS')}
      />
    );
  }
  if (currentScreen === 'SIGNUP') {
    return <SignUpScreen onNavigateToLogin={() => setCurrentScreen('LOGIN')} onSignUpSuccess={() => setCurrentScreen('STEP_ONE')} />;
  }
  if (currentScreen === 'FORGOT_PASS') {
    return <ForgotPasswordScreen onNavigateBack={() => setCurrentScreen('LOGIN')} onCodeSent={() => setCurrentScreen('OTP_ENTRY')} />;
  }
  if (currentScreen === 'OTP_ENTRY') {
    return <OtpScreen onNavigateBack={() => setCurrentScreen('FORGOT_PASS')} onVerifySuccess={() => setCurrentScreen('RESET_PASS')} />;
  }
  if (currentScreen === 'RESET_PASS') {
    return <ResetPasswordScreen onResetSuccess={() => setCurrentScreen('LOGIN')} />;
  }
  
  // 📋 ONBOARDING SCREEN INTERCHANGES
  if (currentScreen === 'STEP_ONE') {
    return <StepOneScreen onNext={() => setCurrentScreen('STEP_TWO')} />;
  }
  if (currentScreen === 'STEP_TWO') {
    return <StepTwoScreen onNext={() => setCurrentScreen('STEP_THREE')} />;
  }
  if (currentScreen === 'STEP_THREE') {
    return <StepThreeScreen onComplete={() => setCurrentScreen('DASHBOARD')} />;
  }

  // 🥗 NAVIGATION DEFINITION WITH LUCIDE COMPONENT REFERENCES
  const navItems = [
    { id: 'Home', label: 'Home', IconComponent: Home },
    { id: 'Diet', label: 'Diet & Recipes', IconComponent: ClipboardList }, 
    { id: 'Workout', label: 'Workout', IconComponent: Dumbbell },
    { id: 'Settings', label: 'Settings', IconComponent: SettingsIcon },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Dynamic Main Viewport Display Layer */}
      <View style={styles.mainContent}>
        {activeTab === 'Home' && <DashboardScreen />}
        {activeTab === 'Diet' && <DietRecipesScreen />}
        {activeTab === 'Workout' && <WorkoutScreen />}
        {activeTab === 'Settings' && <SettingsScreen onLogout={() => {
          setCurrentScreen('LOGIN');
          setActiveTab('Home'); 
        }} />}
      </View>

      {/* SINGLE UNIFIED FLOATING LIGHT GLASS NAVIGATION BAR */}
      <View style={styles.navBarWrapper}>
        <View style={styles.glassNavBar}>
          {navItems.map((item) => {
            const isSelected = activeTab === item.id;
            const Icon = item.IconComponent;
            
            return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.navItem, isSelected && styles.activeNavItem]}
                onPress={() => setActiveTab(item.id)}
                activeOpacity={0.7}
              >
                <Icon 
                  size={20} 
                  color={isSelected ? '#18181B' : '#A1A1AA'} 
                  strokeWidth={isSelected ? 2.5 : 1.75} 
                />
                <Text style={[styles.navLabel, isSelected && styles.activeNavLabelText]} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  mainContent: {
    flex: 1,
  },
  // 🎨 STYLING FOR THE NEW INTEGRATED EMBEDDED SPLASH CONTROLLER
  splashContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Soft layout background perfectly matching MacroSync Logo.png margins
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: '80%', // Safely contains logo scale boundary away from dynamic notches
    height: '80%',
  },
  navBarWrapper: {
    position: 'absolute',
    bottom: 28, 
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  glassNavBar: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA', 
    width: '100%',
    height: 74,
    borderRadius: 36,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E4E4E7', 
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3, 
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    marginHorizontal: 2,
  },
  activeNavItem: {
    backgroundColor: '#F4F4F5', 
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A1A1AA',
    marginTop: 4,
  },
  activeNavLabelText: {
    color: '#18181B', 
    fontWeight: '800',
  },
});