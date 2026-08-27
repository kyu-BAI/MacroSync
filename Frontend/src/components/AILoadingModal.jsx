import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { Sparkles, ChefHat, Flame, Utensils, UtensilsCrossed, Cpu, SportShoe } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const MEAL_STAGES = [
  "Analyzing your target calories & macros...",
  "Checking local ingredient availability...",
  "Balancing protein, carb & fat ratios...",
  "Crafting chef-curated recipe instructions...",
  "Finalizing your personalized meal plan..."
];

const WORKOUT_STAGES = [
  "Analyzing your fitness intensity preference...",
  "Selecting zero-equipment home exercises...",
  "Calculating optimal set reps & calorie burn...",
  "Structuring step-by-step tutorial guides...",
  "Finalizing your AI workout routine..."
];

const RECIPE_STAGES = [
  "Fetching local food market prices...",
  "Calculating ingredient measurements...",
  "Generating step-by-step cooking guide...",
  "Estimating nutritional breakdown...",
  "Finalizing AI recipe card..."
];

export default function AILoadingModal({
  visible,
  type = 'meal', // 'meal' | 'workout' | 'recipe'
  title,
  subtitle
}) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  // Animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeTextAnim = useRef(new Animated.Value(1)).current;

  const [stageIndex, setStageIndex] = useState(0);

  const stages = type === 'workout' 
    ? WORKOUT_STAGES 
    : type === 'recipe' 
      ? RECIPE_STAGES 
      : MEAL_STAGES;

  const defaultTitle = type === 'workout' 
    ? "Generating Workout Routine" 
    : type === 'recipe' 
      ? "Crafting Custom Recipe" 
      : "Customizing AI Meal Plan";

  // Cycle animation and stages
  useEffect(() => {
    if (!visible) {
      setStageIndex(0);
      progressAnim.setValue(0);
      return;
    }

    // 1. Rotation animation
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    // 2. Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );

    // 3. Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 12000,
      easing: Easing.linear,
      useNativeDriver: false
    }).start();

    rotateLoop.start();
    pulseLoop.start();

    // 4. Cycle stage text every 2.4s
    const stageTimer = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeTextAnim, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(fadeTextAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      setStageIndex(prev => (prev + 1) % stages.length);
    }, 2400);

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
      clearInterval(stageTimer);
    };
  }, [visible]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['5%', '98%']
  });

  const IconComponent = type === 'workout' 
    ? SportShoe 
    : type === 'recipe' 
      ? UtensilsCrossed 
      : UtensilsCrossed;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          
          {/* UIverse Inspired Glowing Spinner Orbital */}
          <View style={styles.spinnerContainer}>
            {/* Outer Rotating Neon Dashed Ring */}
            <Animated.View 
              style={[
                styles.outerRing, 
                { transform: [{ rotate: spin }] }
              ]} 
            >
              <View style={styles.ringDot1} />
              <View style={styles.ringDot2} />
            </Animated.View>

            {/* Inner Pulsing Glowing Orb */}
            <Animated.View 
              style={[
                styles.innerOrb,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <IconComponent size={28} color="#10B981" strokeWidth={2.2} />
            </Animated.View>

            {/* Sparkle Badge Accent */}
            <View style={styles.sparkleBadge}>
              <Sparkles size={12} color="#FFFFFF" />
            </View>
          </View>

          {/* Title & Header */}
          <Text style={styles.modalTitle}>{title || defaultTitle}</Text>
          <Text style={styles.modalSubtitle}>
            {subtitle || "MacroSync AI Engine is processing your request"}
          </Text>

          {/* Animated Stage Message Box */}
          <View style={styles.stageBox}>
            <Cpu size={14} color="#10B981" style={{ marginRight: 8 }} />
            <Animated.Text style={[styles.stageText, { opacity: fadeTextAnim }]}>
              {stages[stageIndex]}
            </Animated.Text>
          </View>

          {/* UIverse Style Shimmer Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
          </View>

          {/* Footer Badge */}
          <View style={styles.footerRow}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.footerText}>POWERED BY VITA AI</Text>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  card: {
    width: width - 32,
    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12
  },

  // Spinner Orbital Styles (UIverse inspired)
  spinnerContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative'
  },
  outerRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderTopColor: '#10B981',
    borderRightColor: '#10B981',
    position: 'absolute',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ringDot1: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: -4
  },
  ringDot2: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginBottom: -3
  },
  innerOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  sparkleBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 4,
    elevation: 4
  },

  // Typography
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: theme?.textPrimary || (isDarkMode ? '#F8FAFC' : '#0F172A'),
    textAlign: 'center',
    letterSpacing: -0.3
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme?.textSecondary || '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    fontWeight: '600',
    paddingHorizontal: 8
  },

  // Stage Box
  stageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
    width: '100%',
    marginBottom: 16,
    minHeight: 52
  },
  stageText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme?.textPrimary || (isDarkMode ? '#F8FAFC' : '#0F172A'),
    flex: 1,
    lineHeight: 18,
    flexWrap: 'wrap'
  },

  // Progress Bar
  progressTrack: {
    height: 6,
    width: '100%',
    backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 18
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6
  },
  footerText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 1.5
  }
});
