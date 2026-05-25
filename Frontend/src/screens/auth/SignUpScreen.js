import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function SignUpScreen({ onNavigateToLogin, onSignUpSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPressed, setIsPressed] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerSection}>
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>Build your custom nutrition profile today.</Text>
          </View>

          {/* Neumorphic Form Container */}
          <View style={[styles.neumorphicOuter, styles.formSection]}>
            
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.neumorphicInner}>
              <TextInput 
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#A0AAB8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
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

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.neumorphicInner}>
              <TextInput 
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#A0AAB8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Interactive Tactile Button */}
            <TouchableOpacity 
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={onSignUpSuccess}
              style={[isPressed ? styles.neumorphicInnerBtn : styles.neumorphicOuterBtn, { marginTop: 10 }]}
            >
              <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>Get Started</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Light White Neumorphic Color Constants
const baseColor = '#E0E5EC'; 
const lightShadow = '#FFFFFF'; 
const darkShadow = '#B8C4D2'; 
const accentColor = '#00a3cc';

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
    marginBottom: 35,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#2D3748',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
  },
  formSection: {
    padding: 24,
    borderRadius: 28,
  },
  inputLabel: {
    color: '#4A5568',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  input: {
    color: '#2D3748',
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
  },
  buttonText: {
    color: '#2D3748',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonTextPressed: {
    color: '#718096',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#718096',
    fontSize: 14,
  },
  linkText: {
    color: accentColor,
    fontSize: 14,
    fontWeight: 'bold',
  },

  /* --- LIGHT WHITE NEUMORPHIC STYLES --- */
  
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
    alignItems: 'center',
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
    alignItems: 'center',
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