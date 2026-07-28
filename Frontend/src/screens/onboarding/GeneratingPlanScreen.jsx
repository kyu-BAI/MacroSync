import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import API_URL from '../config/api';

// Flat Design Tokens
const COLORS = {
  base: '#F8FAFC',
  logoGreen: '#10B981',
  textDark: '#0F172A',
  textMuted: '#64748B',
  white: '#FFFFFF',
};

const LOADING_MESSAGES = [
  "Analyzing your baseline metrics...",
  "Calibrating optimal daily macros...",
  "Filtering recipes based on your allergies...",
  "Structuring your exercise plan...",
  "Finalizing your personalized dashboard..."
];

import { useTheme } from '../../context/ThemeContext';

export default function GeneratingPlanScreen({ profileData, onComplete }) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Animation Values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim1 = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for the core icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Infinite Rotate Animation for the Rings
    Animated.loop(Animated.timing(rotateAnim1, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(rotateAnim2, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(rotateAnim3, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })).start();

    // Message Cycling logic (Fade Out -> Change Text -> Fade In)
    const messageInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();
      
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 300);
    }, 2800);

    const generatePlanAndSave = async () => {
      try {
        const pData = profileData || {};
        const payload = {
          user_id: pData.userId || null,
          age: parseInt(pData.age) || 25,
          weight_kg: parseFloat(pData.weight) || 70,
          height_cm: parseFloat(pData.height) || 170,
          goal: pData.goal === 'muscle' ? 'Build Muscle' : pData.goal === 'fatloss' ? 'Lose Weight' : 'Maintain Weight',
          goal_weight: parseFloat(pData.goalWeight) || 70,
          target_date: pData.targetDate || new Date().toISOString().split('T')[0],
          weight_unit: pData.weightUnit || "kg",
          starting_weight: parseFloat(pData.startingWeight) || parseFloat(pData.weight) || 70
        };

        console.log("Saving onboarding data to backend...", payload);
        const response = await fetch(
          `${API_URL}/save-onboarding`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to save onboarding data");
        }

        setTimeout(() => {
          if (onComplete) onComplete(profileData);
        }, 1500); // Wait for the short animation for nice UX illusion

      } catch (err) {
        console.log("Error saving onboarding data:", err);
        // Fallback progress
        setTimeout(() => {
          if (onComplete) onComplete(profileData);
        }, 1500);
      }
    };

    generatePlanAndSave();

    return () => {
      clearInterval(messageInterval);
    };
  }, []);

  const spin1 = rotateAnim1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spin2 = rotateAnim2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }); // Reverse
  const spin3 = rotateAnim3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.base} />
      
      <View style={styles.content}>
        
        {/* Futuristic Uiverse-Inspired Loader */}
        <View style={styles.loaderContainer}>
          <Animated.View style={[styles.ring1, { transform: [{ rotate: spin1 }] }]} />
          <Animated.View style={[styles.ring2, { transform: [{ rotate: spin2 }] }]} />
          <Animated.View style={[styles.ring3, { transform: [{ rotate: spin3 }] }]} />
          
          <Animated.View style={[styles.coreIcon, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="hardware-chip-outline" size={42} color={COLORS.logoGreen} />
          </Animated.View>
        </View>

        {/* Text Details Section */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>AI Engine Active</Text>
          
          <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
            {LOADING_MESSAGES[messageIndex]}
          </Animated.Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.background || COLORS.base,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loaderContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  ring1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: COLORS.logoGreen,
    borderRightColor: COLORS.logoGreen,
    opacity: 0.8,
  },
  ring2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'transparent',
    borderBottomColor: '#CBD5E1',
    borderLeftColor: '#CBD5E1',
    opacity: 0.6,
  },
  ring3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#64748B',
    borderBottomColor: '#64748B',
    opacity: 0.4,
  },
  coreIcon: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme?.cardBg || '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  textContainer: {
    alignItems: 'center',
    height: 100, // Fixed height to prevent jumping text when lines wrap
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: theme?.textPrimary || COLORS.textDark,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme?.textSecondary || COLORS.textMuted,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: theme?.border || '#E2E8F0',
    borderRadius: 4,
    marginTop: 40,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.logoGreen,
    borderRadius: 4,
  }
});
