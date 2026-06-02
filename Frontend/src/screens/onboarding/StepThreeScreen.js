import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

export default function StepThreeScreen({ onComplete }) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 3 OF 3</Text>
            <Text style={styles.brandTitle}>Preferences</Text>
            <Text style={styles.brandSubtitle}>
              Customize your data matrix so MacroSync can calibrate meal
              options.
            </Text>
          </View>

          {/* STATUS TEXT */}
          <Text style={styles.calculatingText}>Calibrating targets...</Text>

          {/* BUTTON */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            onPress={onComplete}
            style={[
              isPressed ? styles.neumorphicInnerBtn : styles.neumorphicOuterBtn,
              { marginTop: 40 },
            ]}
          >
            <Text style={styles.buttonText}>Enter Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const baseColor = "#E4E9F0";
const darkTextBlue = "#1A2332";
const accentColor = "#148F77";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColor,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 30,
  },

  headerSection: {
    marginBottom: 40,
    alignItems: "center",
  },

  stepIndicator: {
    fontSize: 11,
    fontWeight: "800",
    color: accentColor,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: "uppercase",
  },

  brandTitle: {
    fontSize: 40,
    fontWeight: "800",
    color: darkTextBlue,
  },

  brandSubtitle: {
    fontSize: 14,
    color: "#657786",
    marginTop: 12,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
    paddingHorizontal: 20,
  },

  calculatingText: {
    textAlign: "center",
    fontSize: 14,
    color: "#657786",
    marginBottom: 20,
    fontStyle: "italic",
  },

  /* BUTTONS */
  neumorphicOuterBtn: {
    backgroundColor: baseColor,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#fff",
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },

  neumorphicInnerBtn: {
    backgroundColor: "#D1D9E6",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
