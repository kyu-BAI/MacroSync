import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from "react-native";

// Onboarding & Auth Imports
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import OtpScreen from "./src/screens/auth/OtpScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";
import StepOneScreen from "./src/screens/onboarding/StepOneScreen";
import StepTwoScreen from "./src/screens/onboarding/StepTwoScreen";
import StepThreeScreen from "./src/screens/onboarding/StepThreeScreen";

// Core Dashboard Panels
import DashboardScreen from "./src/screens/main/DashboardScreen";
import DietRecipesScreen from "./src/screens/main/DietRecipesScreen";
import WorkoutScreen from "./src/screens/main/WorkoutScreen";
import SettingsScreen from "./src/screens/main/SettingsScreen";

export default function App() {
  // Navigation states: 'LOGIN', 'SIGNUP', 'FORGOT_PASS', 'OTP_ENTRY', 'RESET_PASS', 'STEP_ONE', 'STEP_TWO', 'STEP_THREE', 'DASHBOARD'
  const [currentScreen, setCurrentScreen] = useState("LOGIN");
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [resetEmail, setResetEmail] = useState("");

  // AUTH STATE MACHINE ROUTING
  if (currentScreen === "LOGIN") {
    return (
      <LoginScreen
        onNavigateToSignUp={() => setCurrentScreen("SIGNUP")}
        onLoginSuccess={() => setCurrentScreen("DASHBOARD")}
        onForgotPassword={() => setCurrentScreen("FORGOT_PASS")}
      />
    );
  }
  if (currentScreen === "SIGNUP") {
    return (
      <SignUpScreen
        onNavigateToLogin={() => setCurrentScreen("LOGIN")}
        onSignUpSuccess={() => setCurrentScreen("STEP_ONE")}
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
      <ResetPasswordScreen onResetSuccess={() => setCurrentScreen("LOGIN")} />
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

  // ONBOARDING SCREEN INTERCHANGES
  if (currentScreen === "STEP_ONE") {
    return <StepOneScreen onNext={() => setCurrentScreen("STEP_TWO")} />;
  }
  if (currentScreen === "STEP_TWO") {
    return <StepTwoScreen onNext={() => setCurrentScreen("STEP_THREE")} />;
  }
  if (currentScreen === "STEP_THREE") {
    return <StepThreeScreen onComplete={() => setCurrentScreen("DASHBOARD")} />;
  }

  // CORE APPLICATION DASHBOARD PANELS
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E0E5EC" />

      <View style={styles.header}>
        <Text style={styles.appName}>MacroSync</Text>
        <Text style={styles.activeTabIndicator}>{activeTab}</Text>
      </View>

      <View style={styles.mainContent}>
        {activeTab === "DASHBOARD" && <DashboardScreen />}
        {activeTab === "DIET" && <DietRecipesScreen />}
        {activeTab === "WORKOUT" && <WorkoutScreen />}
        {activeTab === "SETTINGS" && (
          <SettingsScreen onLogout={() => setCurrentScreen("LOGIN")} />
        )}
      </View>

      <View style={styles.bottomTabBar}>
        {["DASHBOARD", "DIET", "WORKOUT", "SETTINGS"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabItemText,
                activeTab === tab
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              {tab.substring(0, 4)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0E5EC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 15,
  },
  appName: { fontSize: 24, fontWeight: "bold", color: "#2D3748" },
  activeTabIndicator: {
    fontSize: 12,
    color: "#00a3cc",
    fontWeight: "bold",
    textTransform: "uppercase",
    backgroundColor: "#d1d9e6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mainContent: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  bottomTabBar: {
    flexDirection: "row",
    height: 70,
    backgroundColor: "#E0E5EC",
    borderTopWidth: 1,
    borderTopColor: "#d1d9e6",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 15 : 0,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabItemText: { fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 },
  tabTextActive: { color: "#00a3cc" },
  tabTextInactive: { color: "#718096" },
});
