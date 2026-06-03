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
  ScrollView,
  StatusBar
} from 'react-native';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle } from 'lucide-react-native';

export default function SignUpScreen({ onNavigateToLogin, onSignUpSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false); // Tracks if the user interacted with the password field

  // Evaluates validation rules for password length threshold
  const showPasswordWarning = passwordTouched && password.length > 0 && password.length < 8;

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
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>
              Build your custom nutrition profile today.
            </Text>
          </View>

          {/* Form Card Group - High Intensity Neumorphic Extrusion */}
          <View style={styles.formCard}>
            
            {/* Full Name Field Group */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
                <User color="#7FA293" size={20} style={styles.leadingIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#7FA293"
                  value={name}
                  onChangeText={setName}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Field Group */}
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
                />
              </View>
            </View>

            {/* Password Field Group with Swapped Visibility Toggles */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[
                styles.neumorphicInputInset, 
                styles.fieldRow,
                showPasswordWarning && styles.inputWarningBorder
              ]}>
                <Lock color={showPasswordWarning ? "#C53030" : "#7FA293"} size={20} style={styles.leadingIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#7FA293"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (!passwordTouched) setPasswordTouched(true);
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  secureTextEntry={secureTextEntry}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.toggleButton} 
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  activeOpacity={0.6}
                >
                  {secureTextEntry ? (
                    /* Text is Hidden -> Show Eye with Slash to represent current hidden state */
                    <EyeOff color={showPasswordWarning ? "#C53030" : "#7FA293"} size={22} />
                  ) : (
                    /* Text is Unhidden -> Show plain open Eye to represent clear vision state */
                    <Eye color={showPasswordWarning ? "#C53030" : "#4EA685"} size={22} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Unified Dynamic Warning Feedback Message Row */}
              {showPasswordWarning && (
                <View style={styles.warningContainer}>
                  <AlertCircle color="#C53030" size={14} />
                  <Text style={styles.warningText}>Password must be at least 8 characters</Text>
                </View>
              )}
            </View>

            {/* Get Started Button */}
            <TouchableOpacity 
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={onSignUpSuccess}
              style={[
                styles.buttonBase,
                isPressed ? styles.buttonPressed : styles.buttonUnpressed,
                { marginTop: 10 }
              ]}
            >
              <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
                Get Started
              </Text>
            </TouchableOpacity>

            {/* Footer Row */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Intensified Hybrid Neumorphic Theme Constants
const baseColor = '#F0F4F2';           
const clearWhiteHighlight = '#FFFFFF';    
const softGreenShadow = '#AEC2B7';      

// Logo Branding Metrics
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
    shadowColor: logoGreen,
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.35, 
    shadowRadius: 5,
  },
  inputWarningBorder: {
    borderColor: '#FEB2B2',
    shadowColor: '#C53030',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 8,
  },
  warningText: {
    color: '#C53030',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
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
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonUnpressed: {
    backgroundColor: '#53B28E', 
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: logoLightHighlight,
    borderLeftColor: logoLightHighlight,
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 6, height: 6 },
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
    textShadowColor: logoDarkShadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonTextPressed: {
    color: '#9EDEC4',
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