import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';

export default function SignUpScreen({ onNavigateToLogin, onSignUpSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Tracks profile creation state

  // --- Smooth Single-Tap Account Registration Flow ---
  const handleSignUp = async () => {
    if (isLoading) return; // Hard guard to prevent redundant task triggers
    setIsLoading(true);

    try {
      await onSignUpSuccess();
    } catch (error) {
      console.error("Profile creation process dropped bounds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerSection}>
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>Build your custom nutrition profile today.</Text>
          </View>

          {/* --- HIGH VISIBILITY NEUMORPHIC FORM CONTAINER --- */}
          <View style={styles.formSectionShadowWhite}>
            <View style={[styles.formSectionShadowDark, styles.formSection]}>
              
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#A4B0BE"
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                />
              </View>

              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#A4B0BE"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#A4B0BE"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              {/* --- UNIFIED SINGLE-TAP NEUMORPHIC MAIN BUTTON --- */}
              <View style={isPressed || isLoading ? styles.buttonPressedContainer : styles.btnShadowWhite}>
                <View style={isPressed || isLoading ? null : styles.btnShadowDark}>
                  <TouchableOpacity 
                    activeOpacity={1}
                    disabled={isLoading}
                    onPressIn={() => setIsPressed(true)}
                    onPressOut={() => setIsPressed(false)}
                    onPress={handleSignUp}
                    style={[
                      styles.buttonBaseLayout, 
                      isPressed || isLoading ? styles.buttonInnerPressed : styles.buttonInnerUnpressed
                    ]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={isPressed ? styles.buttonTextPressed : styles.buttonText}>
                        Get Started
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Option 1 Slate Theme Global Style Constants 
const baseColor = '#E4E9F0';    
const lightShadow = '#FFFFFF';  
const darkShadow = '#A6B4C5';   
const accentColor = '#148F77'; 
const darkTextBlue = '#1A2332'; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColor,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerSection: {
    marginBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: darkTextBlue,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#657786',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  formSection: {
    padding: 26, 
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  formSectionShadowWhite: {
    borderRadius: 36,
    backgroundColor: baseColor,
    shadowColor: lightShadow,
    shadowOffset: { width: -7, height: -7 }, 
    shadowOpacity: 1.0,                      
    shadowRadius: 8,                         
    margin: 10, 
  },
  formSectionShadowDark: {
    backgroundColor: baseColor,
    shadowColor: darkShadow,
    shadowOffset: { width: 7, height: 7 },   
    shadowOpacity: 1.0,                      
    shadowRadius: 10,                        
    borderRadius: 36,
    elevation: 8,                            
  },
  inputLabel: {
    color: '#657786',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 6,
  },
  inputContainer: {
    backgroundColor: '#D9E1EC', 
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  input: {
    color: darkTextBlue,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32, 
    marginBottom: 16,
  },
  footerText: {
    color: '#657786',
    fontSize: 14,
  },
  linkText: {
    color: accentColor,
    fontSize: 14,
    fontWeight: '700',
  },

  /* --- FIXED HIGH CONTRAST BUTTON SINGLE-TAP STRUCTS --- */
  btnShadowWhite: {
    borderRadius: 16,
    backgroundColor: baseColor,
    shadowColor: lightShadow,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    marginTop: 10,
  },
  btnShadowDark: {
    borderRadius: 16,
    backgroundColor: baseColor,
    shadowColor: darkShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonPressedContainer: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#0E6655',
    marginTop: 10,
  },
  buttonBaseLayout: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 54,
  },
  buttonInnerUnpressed: {
    backgroundColor: accentColor, 
  },
  buttonInnerPressed: {
    backgroundColor: '#0E6655', 
    transform: [{ translateY: 1.5 }],
  },
  buttonText: {
    color: '#FFFFFF', 
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextPressed: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});