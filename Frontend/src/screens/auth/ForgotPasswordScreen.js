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
  StatusBar,
  Alert
} from 'react-native';
import { Mail, ChevronLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen({ onNavigateBack, onOtpSent }) {
  const [email, setEmail] = useState('');
  const [isPressed, setIsPressed] = useState(false);

  // --- RECOVERY LOGIC CONTROLLERS (100% Untouched Backend Integration) ---
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Missing Email',
        'Please enter your email address.'
      );
      return;
    }

    try {
      console.log(
        'Sending request to:',
        `${process.env.EXPO_PUBLIC_API_URL}/forgot-password`
      );

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email.trim()
          })
        }
      );

      const data = await response.json();
      console.log('Forgot Password Response:', data);

      if (response.ok) {
        onOtpSent(email.trim());
      } else {
        Alert.alert(
          'Error',
          data.detail || 'Failed to send password reset email.'
        );
      }

    } catch (error) {
      console.log('Forgot Password Error:', error);
      Alert.alert(
        'Connection Error',
        'Cannot connect to backend.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={baseColor} />
      
      {/* Lowered Upper Left Neumorphic Back Button Row */}
      <View style={styles.topNavigationRow}>
        <TouchableOpacity 
          style={styles.backArrowButton} 
          onPress={onNavigateBack}
          activeOpacity={0.7}
        >
          <ChevronLeft color={logoGreen} size={24} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.brandTitle}>Recover Account</Text>
            <Text style={styles.brandSubtitle}>
              Enter your registered email address below.
            </Text>
          </View>

          {/* Form Card Group */}
          <View style={styles.formCard}>
            
            {/* Email Field Group with Functional Vector Icon */}
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

            {/* Action Trigger Button (Updated to Send OTP) */}
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleForgotPassword}
              style={[
                styles.buttonBase,
                isPressed ? styles.buttonPressed : styles.buttonUnpressed
              ]}
            >
              <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
                Send OTP
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Intensified Neumorphic Theme Token Specifications
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
  flexContainer: {
    flex: 1,
  },
  topNavigationRow: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 16, 
    marginTop: Platform.OS === 'android' ? 20 : 0, 
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  backArrowButton: {
    padding: 10,
    backgroundColor: baseColor,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 30,  
    marginLeft: 5,  
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80, 
  },
  headerSection: {
    marginBottom: 45,
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
    marginBottom: 26,
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
});