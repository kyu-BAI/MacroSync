import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';

export default function StepThreeScreen({ onComplete }) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerWrapper}>
        
        <View style={styles.headerSection}>
          <Text style={styles.stepIndicator}>STEP 3 OF 3</Text>
          <Text style={styles.brandTitle}>Ready to Sync</Text>
          <Text style={styles.brandSubtitle}>Your initial profile is set. We are ready to generate your first custom meal plan.</Text>
        </View>

        <View style={[styles.neumorphicOuter, styles.formSection]}>
          
          <View style={styles.iconContainer}>
            <ActivityIndicator size="large" color="#00a3cc" style={{ transform: [{ scale: 1.5 }] }} />
          </View>
          <Text style={styles.calculatingText}>Calibrating targets...</Text>

          <TouchableOpacity 
            activeOpacity={1}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            onPress={onComplete}
            style={[isPressed ? styles.neumorphicInnerBtn : styles.neumorphicOuterBtn, { marginTop: 40 }]}
          >
            <Text style={[styles.buttonText, isPressed && styles.buttonTextPressed]}>Enter Dashboard</Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const baseColor = '#E0E5EC'; 
const lightShadow = '#FFFFFF'; 
const darkShadow = '#B8C4D2'; 
const accentColor = '#00a3cc';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: baseColor },
  centerWrapper: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  headerSection: { marginBottom: 35, alignItems: 'center' },
  stepIndicator: { fontSize: 12, fontWeight: 'bold', color: accentColor, letterSpacing: 2, marginBottom: 8 },
  brandTitle: { fontSize: 32, fontWeight: 'bold', color: '#2D3748' },
  brandSubtitle: { fontSize: 15, color: '#718096', marginTop: 8, textAlign: 'center', lineHeight: 22 },
  formSection: { padding: 30, borderRadius: 28 },
  iconContainer: { height: 100, justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  calculatingText: { textAlign: 'center', color: '#718096', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  buttonText: { color: '#2D3748', fontSize: 16, fontWeight: 'bold' },
  buttonTextPressed: { color: '#718096' },
  neumorphicOuter: { backgroundColor: baseColor, borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderTopColor: lightShadow, borderLeftColor: lightShadow, borderBottomColor: darkShadow, borderRightColor: darkShadow, elevation: 4 },
  neumorphicOuterBtn: { backgroundColor: baseColor, paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderTopWidth: 2, borderLeftWidth: 2, borderBottomWidth: 4, borderRightWidth: 4, borderTopColor: lightShadow, borderLeftColor: lightShadow, borderBottomColor: darkShadow, borderRightColor: darkShadow, elevation: 2 },
  neumorphicInnerBtn: { backgroundColor: baseColor, paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderTopWidth: 3, borderLeftWidth: 3, borderBottomWidth: 1, borderRightWidth: 1, borderTopColor: darkShadow, borderLeftColor: darkShadow, borderBottomColor: lightShadow, borderRightColor: lightShadow, transform: [{ translateY: 1.5 }] },
});