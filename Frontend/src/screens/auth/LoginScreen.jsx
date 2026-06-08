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
  StatusBar,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';

export default function LoginScreen({
  onNavigateToSignUp,
  onLoginSuccess,
  onForgotPassword,
  setCurrentUserId
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  
  // Interaction & Loading State Tracking
  const [isPressed, setIsPressed] = useState(false);
  const [isGooglePressed, setIsGooglePressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (message) => {
    Alert.alert(
      "Login Error",
      message,
      [{ text: "Acknowledge", fontWeight: '800' }]
    );
  };

  // STANDARD EMAIL/PASSWORD AUTHENTICATION FLOW
  const handleLogin = async () => {
    // FRONT-END DEV BYPASS: Go directly to dashboard
    console.log("FRONT-END DEV BYPASS: Skipping backend auth, routing to Dashboard...");
    onLoginSuccess();
    
    /* 
    // ORIGINAL BACKEND LOGIC (Keep for later reversion)
    if (isLoading) return;
    if (!email || !password) {
      showAlert("Please enter both your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        }
      );

      const data = await response.json();
      console.log("Response:", data);

      if (response.ok) {
        onLoginSuccess();
        if (setCurrentUserId) {
          setCurrentUserId(data.user_id || response.user_id);
        }
      } else {
        showAlert(data.detail || "Incorrect email or password. Please try again.");
      }
    } catch (error) {
      console.log("LOGIN ERROR:", error);
      showAlert("Cannot connect to backend server. Check your network.");
    } finally {
      setIsLoading(false);
    }
    */
  };

  // GOOGLE OAUTH SECURITY AUTHENTICATION HANDLER
  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      console.log("GOOGLE OAUTH INITIALIZED");
    } catch (error) {
      console.log("GOOGLE SIGN IN ERROR:", error);
      showAlert("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={baseColor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.brandTitle}>MacroSync</Text>
            <Text style={styles.brandSubtitle}>
              Optimize your nutrition and achieve your fitness goals.
              {"\n"}Sign in to manage your daily macro targets.
            </Text>
          </View>

          {/* Form Card Group */}
          <View style={styles.formCard}>
            
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
                <Mail color="#7FA293" size={20} style={styles.leadingIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#7FA293"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
                <Lock color="#7FA293" size={20} style={styles.leadingIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#7FA293"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.toggleButton} 
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  activeOpacity={0.6}
                  disabled={isLoading}
                >
                  {secureTextEntry ? (
                    <EyeOff color="#7FA293" size={22} />
                  ) : (
                    <Eye color="#4EA685" size={22} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={onForgotPassword}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity 
              activeOpacity={1}
              disabled={isLoading}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleLogin}
              style={[
                styles.buttonBase,
                isPressed ? styles.buttonPressed : styles.buttonUnpressed
              ]}
            >
              {isLoading && !isGooglePressed ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* INTER-STAGE VISUAL DIVIDER */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or sign in with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* PREMIUM GOOGLE TRIGGER COMPONENT BUTTON */}
            <TouchableOpacity 
              activeOpacity={1}
              disabled={isLoading}
              onPressIn={() => setIsGooglePressed(true)}
              onPressOut={() => setIsGooglePressed(false)}
              onPress={handleGoogleSignIn}
              style={[
                styles.buttonBase,
                styles.googleButtonBase,
                isGooglePressed ? styles.googleButtonPressed : styles.googleButtonUnpressed
              ]}
            >
              {isLoading && isGooglePressed ? (
                <ActivityIndicator size="small" color="#41544B" />
              ) : (
                <View style={styles.googleContentRow}>
                  {/* Fixed relative path jump parameter */}
                  <Image 
                    source={require('../../images/google.png')} 
                    style={styles.googleIconImage} 
                    resizeMode="contain"
                  />
                  <Text style={[styles.googleButtonText, isGooglePressed && styles.googleButtonTextPressed]}>
                    Continue with Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Footer Navigation */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={onNavigateToSignUp} activeOpacity={0.7} disabled={isLoading}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>


    </SafeAreaView>
  );
}

// --- Neumorphic Theme Setup ---
const baseColor = '#F0F4F2';          
const clearWhiteHighlight = '#FFFFFF';    
const softGreenShadow = '#AEC2B7';      
const logoGreen = '#4EA685';        
const logoDarkShadow = '#37745D';   
const logoLightHighlight = '#65D8AD'; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColor,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerSection: {
    marginBottom: 35,
    alignItems: 'center',
    width: '100%',
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: logoGreen, 
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#556B60',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: baseColor,
    borderRadius: 40, 
    padding: 24,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 14, height: 14 }, 
    shadowOpacity: 1,
    shadowRadius: 16, 
    elevation: 12,    
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    color: '#41544B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  neumorphicInputInset: {
    backgroundColor: baseColor,
    borderRadius: 24, 
    borderWidth: 1.5, 
    borderColor: '#D4E2DC',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leadingIcon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: '#1A2B23',
    paddingVertical: 15,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  toggleButton: {
    paddingLeft: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 26,
    marginTop: 2,
  },
  forgotText: {
    color: logoGreen,
    fontSize: 14,
    fontWeight: '800',
  },
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 54,
  },
  buttonUnpressed: {
    backgroundColor: '#53B28E', 
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: logoLightHighlight,
    borderLeftColor: logoLightHighlight,
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.95,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonPressed: {
    backgroundColor: '#3E836A', 
    borderWidth: 1.5,
    borderColor: logoDarkShadow,
    transform: [{ translateY: 2 }], 
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonTextPressed: {
    color: '#9EDEC4',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#D4E2DC',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7FA293',
    paddingHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleButtonBase: {
    marginTop: 0,
  },
  googleButtonUnpressed: {
    backgroundColor: baseColor,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#E1E9E5',
  },
  googleButtonPressed: {
    backgroundColor: '#E4ECE8',
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
    transform: [{ translateY: 2 }],
  },
  googleContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconImage: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#41544B',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  googleButtonTextPressed: {
    color: '#21332A',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#556B60',
    fontSize: 14,
    fontWeight: '700',
  },
  linkText: {
    color: logoGreen,
    fontSize: 14,
    fontWeight: '900',
  },

});