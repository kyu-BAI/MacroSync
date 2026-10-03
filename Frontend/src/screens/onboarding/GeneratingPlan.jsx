// --- IMPORTS ---
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';
import { clearDashboardCache } from '../../services/OfflineStorage';
import { useTheme } from '../../context/ThemeContext';

// Sequential AI engine step messages
const LOADING_MESSAGES = [
  "Analyzing your baseline metrics...",
  "Calibrating optimal daily macros...",
  "Filtering recipes based on your allergies...",
  "Structuring your exercise plan...",
  "Finalizing your personalized dashboard..."
];

// --- MAIN GENERATING PLAN SCREEN ---

export default function GeneratingPlanScreen({ profileData, onComplete }) {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [messageIndex, setMessageIndex] = useState(0);
  const [percentDisplay, setPercentDisplay] = useState(12);

  // Animation References
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim1 = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim3 = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0.12)).current;

  useEffect(() => {
    // 1. Native GPU-driven pulsing core
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // 2. Native GPU-driven infinite rotation for the 3 gyroscope rings
    Animated.loop(
      Animated.timing(rotateAnim1, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim2, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim3, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 3. Smooth animated progress bar progression (0.12 -> 0.95 -> 1.0)
    Animated.timing(progressAnim, {
      toValue: 0.92,
      duration: 5500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Listen to animated progress to update percentage text in state
    const progressListener = progressAnim.addListener(({ value }) => {
      setPercentDisplay(Math.min(100, Math.round(value * 100)));
    });

    // 4. Message Cycling logic with smooth fade transitions
    const messageInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();

      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 250);
    }, 2400);

    // 5. Backend save & profile dispatch
    const generatePlanAndSave = async () => {
      try {
        const pData = profileData || {};
        const rawGoal = (pData.goal || '').toString().toLowerCase();
        let goalLabel = 'Maintain Weight';
        if (rawGoal.includes('muscle') || rawGoal.includes('gain') || rawGoal.includes('build')) {
          goalLabel = 'Build Muscle';
        } else if (rawGoal.includes('fat') || rawGoal.includes('lose') || rawGoal.includes('loss')) {
          goalLabel = 'Lose Weight';
        }

        const payload = {
          user_id: pData.userId || null,
          age: parseInt(pData.age) || 25,
          weight_kg: parseFloat(pData.weight) || 70,
          height_cm: parseFloat(pData.height) || 170,
          goal: goalLabel,
          goal_weight: parseFloat(pData.goalWeight) || parseFloat(pData.weight) || 70,
          target_date: pData.targetDate || new Date().toISOString().split('T')[0],
          weight_unit: pData.weightUnit || "kg",
          starting_weight: parseFloat(pData.startingWeight) || parseFloat(pData.weight) || 70,
          allergies: pData.allergies || [],
          medical_conditions: pData.medical_conditions || pData.medicalConditions || [],
          address: pData.address || "",
          structured_location: pData.structuredLocation || {}
        };

        if (__DEV__) console.log("[GeneratingPlan] Saving onboarding data:", payload);
        const response = await fetch(`${API_URL}/save-onboarding`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to save onboarding data");
        }

        // Cache cleanup & local storage persistence
        await clearDashboardCache();
        try {
          await AsyncStorage.setItem('@ms_onboarding_data', JSON.stringify(profileData));
          if (profileData?.structuredLocation || profileData?.city || profileData?.address) {
            await AsyncStorage.setItem('@ms_default_location', JSON.stringify({
              address: profileData.address || "",
              city: profileData.city || profileData.structuredLocation?.city || "",
              province: profileData.province || profileData.structuredLocation?.province || "",
              structuredLocation: profileData.structuredLocation || null,
            }));
            await AsyncStorage.setItem('ms_user_profile', JSON.stringify(profileData));
          }
        } catch (_) {}

        // Complete 100% progress animation before dispatch
        Animated.timing(progressAnim, {
          toValue: 1.0,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(() => {
          setTimeout(() => {
            if (onComplete) onComplete(profileData);
          }, 400);
        });

      } catch (err) {
        if (__DEV__) console.log("[GeneratingPlan] Fallback progress:", err);
        await clearDashboardCache();
        try {
          await AsyncStorage.setItem('@ms_onboarding_data', JSON.stringify(profileData));
        } catch (_) {}

        // Finish progress bar on error fallback
        Animated.timing(progressAnim, {
          toValue: 1.0,
          duration: 400,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(() => {
          setTimeout(() => {
            if (onComplete) onComplete(profileData);
          }, 400);
        });
      }
    };

    generatePlanAndSave();

    return () => {
      clearInterval(messageInterval);
      progressAnim.removeListener(progressListener);
    };
  }, []);

  // Spin interpolations
  const spin1 = rotateAnim1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spin2 = rotateAnim2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const spin3 = rotateAnim3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Progress width interpolation
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  /* remove everything in the screen */
  // return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme?.background || COLORS.base}
      />

      <View style={styles.content}>
        {/* Futuristic Multi-Ring Gyroscope Loader */}
        <View style={styles.loaderContainer}>
          <Animated.View style={[styles.ring1, { transform: [{ rotate: spin1 }] }]} />
          <Animated.View style={[styles.ring2, { transform: [{ rotate: spin2 }] }]} />
          <Animated.View style={[styles.ring3, { transform: [{ rotate: spin3 }] }]} />

          <Animated.View style={[styles.coreIcon, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="hardware-chip-outline" size={40} color={COLORS.logoGreen} />
          </Animated.View>
        </View>

        {/* Text & Status Message Details */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>AI Engine Active</Text>
          <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
            {LOADING_MESSAGES[messageIndex]}
          </Animated.Text>
        </View>

        {/* Smooth Animated Progress Bar Track */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressStepLabel}>CALIBRATING BASELINE</Text>
            <Text style={styles.progressPercentText}>{percentDisplay}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// --- COMPONENT STYLES & COLOR CONFIGURATION ---
// ============================================================================
const COLORS = {
  base: '#F8FAFC',
  logoGreen: '#10B981',
  textDark: '#0F172A',
  textMuted: '#64748B',
  white: '#FFFFFF',
  borderLight: '#E2E8F0',
};

const getStyles = (theme, isDarkMode = false) =>
  StyleSheet.create({
    // --- MAIN SCREEN LAYOUT ---
    container: {
      flex: 1,
      backgroundColor: theme?.background || COLORS.base,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
      width: '100%',
      maxWidth: 540,
      alignSelf: 'center',
    },

    // --- AI ENGINE MULTI-RING LOADER ---
    loaderContainer: {
      width: 200,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 36,
    },
    ring1: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 3.5,
      borderColor: 'transparent',
      borderTopColor: COLORS.logoGreen,
      borderRightColor: COLORS.logoGreen,
      opacity: 0.85,
    },
    ring2: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 3.5,
      borderColor: 'transparent',
      borderBottomColor: isDarkMode ? '#475569' : '#CBD5E1',
      borderLeftColor: isDarkMode ? '#475569' : '#CBD5E1',
      opacity: 0.7,
    },
    ring3: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: 'transparent',
      borderTopColor: isDarkMode ? '#64748B' : '#94A3B8',
      borderBottomColor: isDarkMode ? '#64748B' : '#94A3B8',
      opacity: 0.5,
    },
    coreIcon: {
      position: 'absolute',
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme?.cardBg || (isDarkMode ? '#1E293B' : '#F1F5F9'),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme?.border || (isDarkMode ? '#334155' : COLORS.borderLight),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    // --- TEXT & STATUS SECTION ---
    textContainer: {
      alignItems: 'center',
      minHeight: 80,
      width: '100%',
    },
    title: {
      fontSize: 26,
      fontWeight: '900',
      color: theme?.textPrimary || COLORS.textDark,
      marginBottom: 10,
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14.5,
      color: theme?.textSecondary || COLORS.textMuted,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 8,
    },

    // --- PROGRESS BAR SECTION ---
    progressSection: {
      width: '100%',
      maxWidth: 320,
      marginTop: 32,
    },
    progressHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    progressStepLabel: {
      fontSize: 10.5,
      fontWeight: '800',
      color: COLORS.logoGreen,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    progressPercentText: {
      fontSize: 12,
      fontWeight: '900',
      color: theme?.textPrimary || COLORS.textDark,
      letterSpacing: 0.5,
    },
    progressTrack: {
      width: '100%',
      height: 7,
      backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: COLORS.logoGreen,
      borderRadius: 4,
    },
  });
