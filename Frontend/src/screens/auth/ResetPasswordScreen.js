import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";

export default function ResetPasswordScreen({ email, onResetSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPressed, setIsPressed] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/update-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password: newPassword,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Password updated successfully.");

        onResetSuccess();
      } else {
        Alert.alert("Error", data.detail || "Failed to update password.");
      }
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "Unable to connect to backend.");
    }
  };

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
          <View style={styles.headerSection}>
            <Text style={styles.brandTitle}>New Password</Text>
            <Text style={styles.brandSubtitle}>
              Please choose a new strong security credential string for
              MacroSync.
            </Text>
          </View>

          <View style={[styles.neumorphicOuter, styles.formSection]}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.neumorphicInner}>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#A0AAB8"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.neumorphicInner}>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#A0AAB8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleUpdatePassword}
              style={
                isPressed
                  ? styles.neumorphicInnerBtn
                  : styles.neumorphicOuterBtn
              }
            >
              <Text
                style={[
                  styles.buttonText,
                  isPressed && styles.buttonTextPressed,
                ]}
              >
                Update Password
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const baseColor = "#E0E5EC";
const lightShadow = "#FFFFFF";
const darkShadow = "#B8C4D2";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: baseColor },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  headerSection: { marginBottom: 35, alignItems: "center" },
  brandTitle: { fontSize: 32, fontWeight: "bold", color: "#2D3748" },
  brandSubtitle: {
    fontSize: 15,
    color: "#718096",
    marginTop: 8,
    textAlign: "center",
  },
  formSection: { padding: 24, borderRadius: 28 },
  inputLabel: {
    color: "#4A5568",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 4,
  },
  input: {
    color: "#2D3748",
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
  },
  buttonText: { color: "#2D3748", fontSize: 16, fontWeight: "bold" },
  buttonTextPressed: { color: "#718096" },
  neumorphicOuter: {
    backgroundColor: baseColor,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopColor: lightShadow,
    borderLeftColor: lightShadow,
    borderBottomColor: darkShadow,
    borderRightColor: darkShadow,
    elevation: 4,
  },
  neumorphicInner: {
    backgroundColor: baseColor,
    borderRadius: 14,
    marginBottom: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopColor: darkShadow,
    borderLeftColor: darkShadow,
    borderBottomColor: lightShadow,
    borderRightColor: lightShadow,
  },
  neumorphicOuterBtn: {
    backgroundColor: baseColor,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopColor: lightShadow,
    borderLeftColor: lightShadow,
    borderBottomColor: darkShadow,
    borderRightColor: darkShadow,
    elevation: 2,
  },
  neumorphicInnerBtn: {
    backgroundColor: baseColor,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopColor: darkShadow,
    borderLeftColor: darkShadow,
    borderBottomColor: lightShadow,
    borderRightColor: lightShadow,
    transform: [{ translateY: 1.5 }],
  },
});
