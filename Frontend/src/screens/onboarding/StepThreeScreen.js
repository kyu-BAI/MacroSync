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
import { MapPin, ShieldAlert } from 'lucide-react-native';

export default function StepThreeScreen({ onComplete }) {
  const [location, setLocation] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [dietPreference, setDietPreference] = useState('none');
  const [isPressed, setIsPressed] = useState(false);

  const dietOptions = [
    { id: 'none', label: 'No Restriction' },
    { id: 'highprotein', label: 'High Protein' },
    { id: 'lowcarb', label: 'Low Carb' },
    { id: 'keto', label: 'Keto' },
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'diabetic', label: 'Low Sugar' },
    { id: 'lowsodium', label: 'Low Sodium' }
  ];

  const handleValidationAndComplete = () => {
    if (!location.trim()) {
      Alert.alert(
        "Missing Location",
        "Please specify your location or city to unlock accessible, budget-friendly meal suggestions."
      );
      return;
    }
    
    // Callback passes the user data cleanly to App.js without mutating backend code
    onComplete?.({
      location: location.trim(),
      allergies: allergiesText.trim(),
      dietPreference
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={baseColor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* HEADER SECTION */}
          <View style={styles.headerSection}>
            <Text style={styles.stepIndicator}>STEP 3 OF 3</Text>
            <Text style={styles.brandTitle}>Personalization</Text>
            <Text style={styles.brandSubtitle}>
              Fine-tune your lifestyle parameters to optimize personalized diet and recommendation routines.
            </Text>
          </View>

          {/* MAIN FORM CARD */}
          <View style={styles.formCard}>
            
            {/* LOCATION INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Location / Area</Text>
              <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
                <MapPin color="#7FA293" size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bogo City, Cebu"
                  placeholderTextColor="#7FA293"
                  value={location}
                  onChangeText={setLocation}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* ALLERGIES FREEFORM ENTRY */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Allergies & Restrictions</Text>
              <View style={[styles.neumorphicInputInset, styles.fieldRow]}>
                <ShieldAlert color="#7FA293" size={20} style={styles.leadingIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Peanuts, Dairy, Seafood (or None)"
                  placeholderTextColor="#7FA293"
                  value={allergiesText}
                  onChangeText={setAllergiesText}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* DIETARY PREFERENCES FLEX-GRID MATRICES */}
            <Text style={[styles.inputLabel, { marginTop: 4 }]}>Dietary Preference</Text>
            <View style={styles.dietGrid}>
              {dietOptions.map((option) => {
                const isSelected = dietPreference === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    activeOpacity={0.8}
                    onPress={() => setDietPreference(option.id)}
                    style={[styles.badgeBase, isSelected ? styles.badgeActive : styles.badgeInactive]}
                  >
                    <Text style={[styles.badgeText, isSelected ? styles.badgeTextActive : styles.badgeTextInactive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* FINAL COMPLETION CTA TRIGGER BUTTON */}
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleValidationAndComplete}
              style={[
                styles.buttonBase,
                isPressed ? styles.buttonPressed : styles.buttonUnpressed,
              ]}
            >
              <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>
                Complete Setup
              </Text>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Uniform UI Design Token System Variables
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
    backgroundColor: baseColor 
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24, 
    paddingBottom: 24,
    paddingTop: Platform.OS === 'ios' ? 40 : 30, 
  },
  headerSection: { 
    marginBottom: 30, 
    alignItems: 'center', 
    width: '100%' 
  },
  stepIndicator: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: logoGreen, 
    letterSpacing: 2, 
    textTransform: 'uppercase' 
  },
  brandTitle: { 
    fontSize: 42, 
    fontWeight: '900', 
    color: '#21332A', 
    letterSpacing: -0.5, 
    marginTop: 6 
  },
  brandSubtitle: { 
    fontSize: 14, 
    color: '#556B60', 
    marginTop: 10, 
    textAlign: 'center', 
    lineHeight: 22, 
    fontWeight: '700' 
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
    marginBottom: 20, 
    width: '100%' 
  },
  inputLabel: { 
    color: '#41544B', 
    fontSize: 11, 
    fontWeight: '800', 
    marginBottom: 10, 
    textTransform: 'uppercase', 
    letterSpacing: 1.2, 
    marginLeft: 6 
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
    paddingHorizontal: 16 
  },
  leadingIcon: { marginRight: 4 },
  input: { 
    flex: 1, 
    color: '#1A2B23', 
    paddingVertical: 15, 
    paddingHorizontal: 8, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  dietGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: 6, 
    marginTop: 2 
  },
  badgeBase: { 
    width: '47%', 
    paddingVertical: 12, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12, 
    borderWidth: 1.5 
  },
  badgeInactive: {
    backgroundColor: baseColor,
    borderColor: '#E1E9E5',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 1,
  },
  badgeActive: { 
    backgroundColor: '#E4ECE8', 
    borderColor: logoGreen 
  },
  badgeText: { 
    fontSize: 14, 
    fontWeight: '700' 
  },
  badgeTextInactive: { color: '#556B60' },
  badgeTextActive: { color: logoGreen },
  buttonBase: { 
    paddingVertical: 16, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
    marginTop: 22, 
    height: 54 
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
    transform: [{ translateY: 2 }] 
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '800', 
    letterSpacing: 0.5, 
    textShadowColor: logoDarkShadow, 
    textShadowOffset: { width: 0, height: 1 }, 
    textShadowRadius: 2 
  },
  buttonTextPressed: { color: '#9EDEC4' },
});