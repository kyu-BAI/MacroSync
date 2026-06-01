import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function LoginScreen({ onNavigateToSignUp, onLoginSuccess, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPressed, setIsPressed] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerSection}>
            <Text style={styles.brandTitle}>MacroSync</Text>
            <Text style={styles.brandSubtitle}>
              Welcome back, Kaizer. Ready to lock in your targets today?
            </Text>
          </View>

          {/* --- HIGH VISIBILITY NEUMORPHIC FORM CONTAINER --- */}
          <View style={styles.formSectionShadowWhite}>
            <View style={[styles.formSectionShadowDark, styles.formSection]}>
              
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
                />
              </View>

              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#A4B0BE"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity style={styles.forgotPassword} onPress={onForgotPassword}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* --- HIGH-CONTRAST VIBRANT TEAL NEUMORPHIC BUTTON --- */}
              {isPressed ? (
                <View style={styles.buttonPressed}>
                  <TouchableOpacity 
                    activeOpacity={1}
                    onPressIn={() => setIsPressed(true)}
                    onPressOut={() => setIsPressed(false)}
                    onPress={onLoginSuccess}
                    style={styles.buttonTextWrapper}
                  >
                    <Text style={styles.buttonTextPressed}>Login</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.btnShadowWhite}>
                  <View style={styles.btnShadowDark}>
                    <TouchableOpacity 
                      activeOpacity={1}
                      onPressIn={() => setIsPressed(true)}
                      onPressOut={() => setIsPressed(false)}
                      onPress={onLoginSuccess}
                      style={styles.buttonInner}
                    >
                      <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignUp}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const baseColor = '#E4E9F0';    
const lightShadow = '#FFFFFF';  
const darkShadow = '#A6B4C5';   
const accentColor = '#148F77'; // Consistent Logo Teal
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: 4,
    marginRight: 4,
  },
  forgotText: {
    color: accentColor,
    fontSize: 13,
    fontWeight: '600',
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
  btnShadowWhite: {
    borderRadius: 16,
    backgroundColor: baseColor,
    shadowColor: lightShadow,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
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
  buttonInner: {
    backgroundColor: accentColor, 
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF', 
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonPressed: {
    backgroundColor: '#0E6655', 
    borderRadius: 16,
    transform: [{ translateY: 1.5 }],
  },
  buttonTextPressed: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextWrapper: {
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  }
});