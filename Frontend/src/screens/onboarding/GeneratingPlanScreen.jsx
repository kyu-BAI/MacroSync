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

import { useTheme } from '../../context/ThemeContext';
import { getStyles, COLORS } from './GeneratingPlanScreen.styles';

const LOADING_MESSAGES = [
  "Analyzing your baseline metrics...",
  "Calibrating optimal daily macros...",
  "Filtering recipes based on your allergies...",
  "Structuring your exercise plan...",
  "Finalizing your personalized dashboard..."
];


export default function GeneratingPlanScreen({ profileData, onComplete }) {
  const { theme } = useTheme();
  const isDarkMode = false;
  const styles = getStyles(theme, false);
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
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ])
    ).start();

    // Infinite Rotate Animation for the Rings
    Animated.loop(Animated.timing(rotateAnim1, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: false })).start();
    Animated.loop(Animated.timing(rotateAnim2, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: false })).start();
    Animated.loop(Animated.timing(rotateAnim3, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: false })).start();

    // Message Cycling logic (Fade Out -> Change Text -> Fade In)
    const messageInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: false })
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
          starting_weight: parseFloat(pData.startingWeight) || parseFloat(pData.weight) || 70,
          allergies: pData.allergies || [],
          address: pData.address || "",
          structured_location: pData.structuredLocation || {}
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

