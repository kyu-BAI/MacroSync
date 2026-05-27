import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';

export default function LoginScreen({
  onNavigateToSignUp,
  onLoginSuccess,
  onForgotPassword
}) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPressed, setIsPressed] = useState(false);

  // LOGIN FUNCTION
  const handleLogin = async () => {
    try {

      const response = await fetch(
        "http://192.168.254.133:8000/signin",
        {
          method: "POST",
          headers: {
            "Content-Type":"application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      console.log("Response:", data);

      if(response.ok){
        onLoginSuccess();
      } else {
        alert(data.detail || "Login failed");
      }

    } catch(error){
      console.log(error);
      alert("Cannot connect to backend");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.headerSection}>
            <Text style={styles.brandTitle}>
              MacroSync
            </Text>

            <Text style={styles.brandSubtitle}>
              Welcome back, Kaizer. Lock in na man!{"\n"}
              hanag pasundayag nimo oi
            </Text>
          </View>

          <View style={[styles.neumorphicOuter, styles.formSection]}>

            <Text style={styles.inputLabel}>
              Email Address
            </Text>

            <View style={styles.neumorphicInner}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#A0AAB8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.inputLabel}>
              Password
            </Text>

            <View style={styles.neumorphicInner}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#A0AAB8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={onForgotPassword}
            >
              <Text style={styles.forgotText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleLogin}
              style={
                isPressed
                  ? styles.neumorphicInnerBtn
                  : styles.neumorphicOuterBtn
              }
            >
              <Text
                style={[
                  styles.buttonText,
                  isPressed && styles.buttonTextPressed
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>
                Don't have an account?
              </Text>

              <TouchableOpacity
                onPress={onNavigateToSignUp}
              >
                <Text style={styles.linkText}>
                  Sign Up
                </Text>
              </TouchableOpacity>

            </View>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
// Add this at the very bottom of your file, outside of the SignUpScreen function!
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0E8F6', // Neumorphic background color
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  formSection: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#E0E8F6',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B7C',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 50,
    paddingHorizontal: 15,
    color: '#2C3E50',
    fontSize: 16,
  },
  neumorphicOuter: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  neumorphicInner: {
    backgroundColor: '#E0E8F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D9E6',
    marginBottom: 10,
  },
  neumorphicOuterBtn: {
    backgroundColor: '#E0E8F6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#EBF2FF',
    // Neumorphic shadow styling
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  neumorphicInnerBtn: {
    backgroundColor: '#D1D9E6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#B8C4D9',
  },
  buttonText: {
    color: '#34495E',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonTextPressed: {
    color: '#7F8C8D',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#7F8C8D',
    marginRight: 5,
  },
  linkText: {
    color: '#3498DB',
    fontWeight: 'bold',
  },
});