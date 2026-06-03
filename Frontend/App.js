import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

// Onboarding & Auth Screen Components
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import OtpScreen from "./src/screens/auth/OtpScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";

import StepOneScreen from "./src/screens/onboarding/StepOneScreen";
import StepTwoScreen from "./src/screens/onboarding/StepTwoScreen";
import StepThreeScreen from "./src/screens/onboarding/StepThreeScreen";

// Core Dashboard Main Screen Panels
import DashboardScreen from "./src/screens/main/DashboardScreen";
import DietRecipesScreen from "./src/screens/main/DietRecipesScreen";
import WorkoutScreen from "./src/screens/main/WorkoutScreen";
import SettingsScreen from "./src/screens/main/SettingsScreen";

export default function App() {
  // Navigation Routing States: 'LOGIN', 'SIGNUP', 'FORGOT_PASS', 'OTP_ENTRY', 'RESET_PASS', 'STEP_ONE', 'STEP_TWO', 'STEP_THREE', 'DASHBOARD'
  const [currentScreen, setCurrentScreen] = useState('LOGIN');
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  // Core Account Identity State Management
  const [userId, setUserId] = useState(null);
  const [resetEmail, setResetEmail] = useState('');

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
        onSignUpSuccess={(newUserId) => {
          setUserId(newUserId); 
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
    return <StepOneScreen onNext={() => setCurrentScreen('STEP_TWO')} />;
  }
  if (currentScreen === 'STEP_TWO') {
    return <StepTwoScreen onNext={() => setCurrentScreen('STEP_THREE')} />;
  }
  if (currentScreen === 'STEP_THREE') {
    return <StepThreeScreen onComplete={() => setCurrentScreen('DASHBOARD')} />;
  }

  // ----------------------------------------------------
  // SECTION 3: APP CORE VIEWPORTS (FULLY INTEGRATED SCREEN ROUTING)
  // ----------------------------------------------------
  return (
    <View style={styles.appContainerRoot}>
      {activeTab === 'DASHBOARD' && (
        <DashboardScreen 
          onTabChange={(tab) => setActiveTab(tab)} 
        />
      )}
      {activeTab === 'DIET' && (
        <DietRecipesScreen 
          onTabChange={(tab) => setActiveTab(tab)} 
        />
      )}
      {activeTab === 'WORKOUT' && (
        <WorkoutScreen 
          onTabChange={(tab) => setActiveTab(tab)} 
        />
      )}
      {activeTab === 'SETTINGS' && (
        <SettingsScreen 
          onTabChange={(tab) => setActiveTab(tab)} 
          onLogout={() => {
            setCurrentScreen('LOGIN');
            setActiveTab('DASHBOARD'); // Resets active navigation state variables cleanly
          }} 
        />
      )}
    </View>
  );

  // ---------------- MAIN RETURN ----------------
  return currentScreen === "DASHBOARD" ? renderDashboard() : renderScreen();
}

// Uniform High-Contrast System Theme Setup Tokens
const baseColor = '#F0F4F2';           

const styles = StyleSheet.create({
  appContainerRoot: { 
    flex: 1, 
    backgroundColor: baseColor 
  }
});
