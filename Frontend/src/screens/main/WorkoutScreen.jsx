import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Camera, UtensilsCrossed, BotMessageSquare, Home, SportShoe, Settings, Flame, Clock, Trophy, Play, ArrowLeft, CheckCircle2, RotateCcw, HelpCircle, Sparkles } from 'lucide-react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

import AsyncStorage from '@react-native-async-storage/async-storage';

import { recommendedRecipesPool } from '../../data/recipes';
import API_URL from '../config/api';
import { addToSyncQueue, updateCachedDashboardField } from '../../services/OfflineStorage';
export default function WorkoutScreen({ 
  onTabChange, 
  userId, 
  onRefreshDashboard, 
  isOnline = true, 
  dailyExercise, 
  setDailyExercise 
}) {
  const styles = getStyles();
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [selectedIntensity, setSelectedIntensity] = useState('All');
  
  // --- TUTORIAL ENGINE NAVIGATION STATES ---
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const intensityTiers = ['All', 'Light', 'Moderate', 'Intense'];

  // --- AI RECOMMENDATION SYSTEM STATE ---
  const [workoutRoutines, setWorkoutRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCachedOrFetchWorkouts = async () => {
      try {
        setLoading(true);
        const todayStr = new Date().toISOString().split('T')[0]; // e.g. "2026-07-09"
        
        // 1. Check local cache
        const cachedRaw = await AsyncStorage.getItem('ms_workouts_cache');
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed.userId === userId && parsed.date === todayStr && Array.isArray(parsed.workouts)) {
            setWorkoutRoutines(parsed.workouts);
            setLoading(false);
            return; // Cache hit!
          }
        }
        
        // 2. Cache miss: Fetch from backend
        const res = await fetch(`${API_URL}/workouts/recommend/${userId || 'default'}`);
        if (!res.ok) {
          throw new Error("Failed to fetch custom workouts");
        }
        const data = await res.json();
        setWorkoutRoutines(data);
        
        // 3. Save to local cache
        const cachePayload = {
          userId,
          date: todayStr,
          workouts: data
        };
        await AsyncStorage.setItem('ms_workouts_cache', JSON.stringify(cachePayload));
      } catch (err) {
        console.warn("WORKOUT LOAD/FETCH ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadCachedOrFetchWorkouts();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);

  const handleStartTutorialEngine = (routine) => {
    setActiveRoutine(routine);
    setCurrentStepIndex(0);
  };

  const handleExitWorkout = () => {
    Alert.alert(
      "Don't Give Up Yet!",
      "You are on your way to crushing your goals! You must finish the workout to log it.",
      [
        {
          text: "Keep Going",
          style: "cancel"
        },
        {
          text: "Quit Workout",
          style: "destructive",
          onPress: () => setActiveRoutine(null)
        }
      ]
    );
  };

  const handleNextStep = async () => {
    if (currentStepIndex < activeRoutine?.tutorials?.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      if (!userId) {
        Alert.alert("Authentication Error", "You must be logged in to log workouts.");
        return;
      }

      // Optimistic UI updates
      const workoutDuration = parseInt(activeRoutine.duration) || 15;
      let newExercise = null;
      if (setDailyExercise) {
        setDailyExercise(prev => {
          const next = {
            caloriesBurned: (prev?.caloriesBurned || 0) + activeRoutine.caloriesBurn,
            activeMinutes: (prev?.activeMinutes || 0) + workoutDuration,
            recentExercise: activeRoutine.title
          };
          newExercise = next;
          return next;
        });
      }

      const workoutPayload = {
        id: Date.now().toString(),
        user_id: userId,
        name: activeRoutine.title,
        calories_burned: activeRoutine.caloriesBurn,
        active_minutes: workoutDuration
      };

      if (!isOnline) {
        await addToSyncQueue({ type: 'LOG_WORKOUT', payload: workoutPayload });
        if (newExercise) {
          await updateCachedDashboardField(userId, { exercise: newExercise });
        }
        Alert.alert(
          "Workout Complete! (Offline)",
          `Awesome work! You crushed "${activeRoutine?.title}". Since you are offline, it was saved locally and will sync later.`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null), fontWeight: '900' }]
        );
        return;
      }

      try {
        const response = await fetch(`${API_URL}/workouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workoutPayload),
        });

        if (!response.ok) {
          throw new Error('Failed to log workout on server');
        }

        if (onRefreshDashboard) {
          onRefreshDashboard();
        }

        Alert.alert(
          "Workout Complete!",
          `Awesome work! You crushed "${activeRoutine?.title}" and logged ${activeRoutine?.caloriesBurn} kcal into MacroSync!`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null), fontWeight: '900' }]
        );
      } catch (error) {
        console.warn("LOG WORKOUT API ERROR (falling back to queue):", error);
        await addToSyncQueue({ type: 'LOG_WORKOUT', payload: workoutPayload });
        if (newExercise) {
          await updateCachedDashboardField(userId, { exercise: newExercise });
        }
        Alert.alert(
          "Workout Saved Locally",
          `Could not reach the server. "${activeRoutine?.title}" has been saved locally and will sync later.`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null), fontWeight: '900' }]
        );
      }
    }
  };

  const filteredWorkouts = workoutRoutines.filter(workout => {
    return selectedIntensity === 'All' || workout.intensity === selectedIntensity;
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: baseColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor={baseColor} />
        <View style={styles.loaderOuterNeu}>
          <ActivityIndicator size="large" color={logoGreen} />
        </View>
        <Text style={styles.loaderTextTitle}>AI Trainer Active</Text>
        <Text style={styles.loaderTextDesc}>Tailoring today's routines to help you crush your goal weight...</Text>
      </View>
    );
  }

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* ── WORKOUT TUTORIAL PLAYER (FULL SCREEN MODAL) ── */}
      <Modal 
        visible={activeRoutine !== null} 
        transparent={false} 
        animationType="slide" 
        onRequestClose={handleExitWorkout}
      >
        {activeRoutine && (
          <View style={styles.playerWrapper}>
            {/* PLAYER HEADER AREA */}
            <View style={styles.playerHeaderRow}>
              <TouchableOpacity 
                style={styles.playerBackNeuButton}
                activeOpacity={0.8}
                onPress={handleExitWorkout}
              >
                <ArrowLeft color={logoGreen} size={20} strokeWidth={2.5} />
              </TouchableOpacity>
              <View style={styles.playerHeaderCenterText}>
                <Text style={styles.playerRoutineSubTitle}>{activeRoutine.title}</Text>
                <Text style={styles.playerStepIndicator}>Exercise {currentStepIndex + 1} of {activeRoutine.tutorials.length}</Text>
              </View>
              <HelpCircle color="#7FA293" size={22} />
            </View>

            {/* PLAYER MAIN EXERCISE CARD VIEWPORT */}
            <View style={styles.playerMainCard}>
              
              {/* ANIMATION COMPONENT PLACEHOLDER FRAME */}
              <View style={styles.animationPlaceholderFrame}>
                <SportShoe color={logoGreen} size={64} strokeWidth={1.5} style={styles.placeholderAnimateIcon} />
                <View style={styles.liveActivityBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.liveBadgeText}>HOME TUTORIAL ACTIVE</Text>
                </View>
              </View>

              {/* EXERCISE NAMES & METRIC SCORES */}
              <Text style={styles.playerExerciseTitle}>{activeRoutine.tutorials[currentStepIndex].name}</Text>
              <View style={styles.targetMetricChipBox}>
                <Trophy color="#FFFFFF" size={14} fill="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.targetMetricChipText}>{activeRoutine.tutorials[currentStepIndex].target}</Text>
              </View>

              <View style={styles.playerGlassDivider} />

              {/* EXPANDED INSTRUCTION MANUAL TEXTS */}
              <ScrollView showsVerticalScrollIndicator={false} style={styles.instructionsTextScroll}>
                <Text style={styles.instructionSectionTitleLabel}>How to Set Up:</Text>
                <Text style={styles.instructionParagraphText}>{activeRoutine.tutorials[currentStepIndex].setup}</Text>
                
                <Text style={[styles.instructionSectionTitleLabel, { marginTop: 14 }]}>Proper Execution Form:</Text>
                <Text style={styles.instructionParagraphText}>{activeRoutine.tutorials[currentStepIndex].form}</Text>
              </ScrollView>

              <View style={styles.playerGlassDivider} />

              {/* CONTROLS TOGGLE HUB BUTTONS */}
              <View style={styles.playerControlActionRow}>
                {currentStepIndex > 0 && (
                  <TouchableOpacity 
                    style={styles.playerSecondaryNeuActionBtn} 
                    activeOpacity={0.8}
                    onPress={() => setCurrentStepIndex(currentStepIndex - 1)}
                  >
                    <RotateCcw color="#556B60" size={16} style={{ marginRight: 4 }} />
                    <Text style={styles.playerSecondaryActionBtnText}>Previous</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={[styles.playerPrimaryActionBtn, { flex: currentStepIndex === 0 ? 1 : 1.3 }]} 
                  activeOpacity={0.8}
                  onPress={handleNextStep}
                >
                  <CheckCircle2 color="#FFFFFF" size={16} style={{ marginRight: 6 }} />
                  <Text style={styles.playerPrimaryActionBtnText}>
                    {currentStepIndex === activeRoutine.tutorials.length - 1 ? 'Complete Workout' : 'Next Exercise Step'}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        )}
      </Modal>

      {/* STANDARD ROUTINES SELECTION HUB LIST VIEW */}
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER BRANDING SECTION */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.appName}>MacroSync</Text>
            <Text style={styles.greeting}>Daily Home Workouts</Text>
            <Text style={styles.subGreeting}>Zero-equipment routines generated dynamically by Gemini AI</Text>
            <View style={styles.aiBadgeRow}>
              <Sparkles color={logoGreen} size={12} style={{ marginRight: 6 }} />
              <Text style={styles.aiBadgeText}>AI RECOMMENDED WORKOUTS</Text>
            </View>
          </View>
        </View>

        {/* WORKOUT INTENSITY FILTER CHOICES */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Exercise Intensity Preferences</Text>
          <View style={styles.filterButtonGroupRow}>
            {intensityTiers.map((tier) => (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.filterChipButton, 
                  selectedIntensity === tier ? styles.filterChipActive : styles.filterChipInactive
                ]}
                onPress={() => setSelectedIntensity(tier)}
              >
                <Text style={[
                  styles.filterChipText, 
                  { color: selectedIntensity === tier ? '#FFFFFF' : '#21332A' }
                ]}>
                  {tier}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* WORKOUT PLAN CARD LISTINGS */}
        <Text style={styles.sectionLabelTitle}>Your Tailored Home Routines</Text>

        {filteredWorkouts.map((workout) => {
          if (!workout) return null;
          return (
            <View key={workout.id} style={styles.workoutFormCard}>
              <View style={styles.workoutHeaderRow}>
                <View style={styles.workoutTitleContainer}>
                  <Text style={styles.workoutMainTitle}>{workout.title}</Text>
                  <Text style={styles.workoutDescriptionText}>{workout.description}</Text>
                </View>
              </View>

              <View style={styles.glassDivider} />

              {/* QUICK METRICS TILES */}
              <View style={styles.workoutMetricsSummaryGrid}>
                <View style={styles.metricItemBox}>
                  <Clock color={logoGreen} size={14} style={styles.metricIconSpacer} />
                  <View>
                    <Text style={styles.metricTileLabel}>Duration</Text>
                    <Text style={styles.metricTileValue}>{workout.duration}</Text>
                  </View>
                </View>
                
                <View style={styles.metricItemBox}>
                  <Flame color="#E53E3E" size={14} style={styles.metricIconSpacer} />
                  <View>
                    <Text style={styles.metricTileLabel}>Est. Burn</Text>
                    <Text style={styles.metricTileValue}>{workout?.caloriesBurn} kcal</Text>
                  </View>
                </View>

                <View style={styles.metricItemBox}>
                  <Trophy color="#D69E2E" size={14} style={styles.metricIconSpacer} />
                  <View>
                    <Text style={styles.metricTileLabel}>Intensity</Text>
                    <Text style={styles.metricTileValue}>{workout?.intensity}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.glassDivider} />

              {/* LAUNCH ENGINE HOOK TRIGGER SWITCH */}
              <TouchableOpacity 
                style={styles.startWorkoutActionButton} 
                activeOpacity={0.8}
                onPress={() => handleStartTutorialEngine(workout)}
              >
                <Play color="#FFFFFF" size={14} fill="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.startWorkoutButtonText}>Begin Active Routine</Text>
              </TouchableOpacity>
            </View>
          );
        })}

      </ScrollView>

      {/* --- FLOATING AI CHATBOT SYSTEM --- */}
    </View>
  );
}

           
    
      
        
   
 

const baseColor = '#F0F4F2';           
const clearWhiteHighlight = '#FFFFFF';    
const softGreenShadow = '#AEC2B7';      
const logoGreen = '#4EA685';        
const logoDarkShadow = '#37745D';   
const logoLightHighlight = '#65D8AD'; 

const getStyles = () => StyleSheet.create({
  fullscreenOverlay: { 
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0, 
    width: screenWidth, 
    height: screenHeight, 
    backgroundColor: baseColor,
  },
  container: { 
    flex: 1,
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 54 : 48, 
    paddingBottom: 115,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12, 
    paddingHorizontal: 4, 
    width: '100%',
  },
  headerTextGroup: { 
    flex: 1, 
    paddingRight: 12,
  },
  appName: { 
    fontSize: 12, 
    fontWeight: '900', 
    color: logoGreen, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 2,
  },
  greeting: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#21332A', 
    letterSpacing: -0.5,
  },
  subGreeting: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#556B60', 
    marginTop: 2,
  },
  formCard: {
    backgroundColor: baseColor, 
    borderRadius: 32, 
    padding: 18, 
    marginBottom: 16, 
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 1, 
    shadowRadius: 5, 
    elevation: 3,
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  cardTitle: { 
    fontSize: 11, 
    color: '#21332A', 
    textTransform: 'uppercase', 
    letterSpacing: 1.2, 
    marginBottom: 12, 
    fontWeight: '800', 
    marginLeft: 2,
  },
  filterButtonGroupRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
  },
  filterChipButton: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 16, 
    marginRight: 8, 
    marginBottom: 8, 
    backgroundColor: baseColor,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 1, 
    shadowRadius: 4, 
    elevation: 3,
    borderWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  filterChipInactive: { 
    backgroundColor: baseColor,
  },
  filterChipActive: { 
    backgroundColor: logoGreen, 
    borderWidth: 1.5,
    borderTopColor: logoLightHighlight, 
    borderLeftColor: logoLightHighlight,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  filterChipText: { 
    fontSize: 12, 
    fontWeight: '800',
  },
  sectionLabelTitle: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#21332A', 
    marginBottom: 12, 
    marginLeft: 4, 
    letterSpacing: -0.2,
  },
  workoutFormCard: {
    backgroundColor: baseColor, 
    borderRadius: 28, 
    padding: 16, 
    marginBottom: 14,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 1, 
    shadowRadius: 5, 
    elevation: 3,
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  workoutHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
  },
  workoutTitleContainer: { 
    flex: 1,
  },
  workoutMainTitle: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: '#21332A', 
    marginBottom: 6, 
    lineHeight: 20,
  },
  workoutDescriptionText: {
    fontSize: 13,
    color: '#556B60',
    fontWeight: '600',
    lineHeight: 18,
  },
  glassDivider: { 
    height: 1, 
    backgroundColor: '#D4E2DC', 
    marginVertical: 12,
  },
  workoutMetricsSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  metricItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricIconSpacer: {
    marginRight: 6,
  },
  metricTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7FA293',
  },
  metricTileValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#21332A',
    marginTop: 1,
  },
  startWorkoutActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: logoGreen,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: logoGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  startWorkoutButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingChatbotContainer: { 
    position: 'absolute', 
    bottom: 104, 
    right: 20, 
    zIndex: 99,
  },
  chatbotFloatingButton: {
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  chatbotUnpressed: { 
    backgroundColor: '#4EA685', 
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: logoLightHighlight, 
    borderLeftColor: logoLightHighlight, 
    shadowColor: logoDarkShadow, 
    shadowOffset: { width: 3, height: 4 }, 
    shadowOpacity: 0.9, 
    shadowRadius: 6, 
    elevation: 5,
  },
  chatbotPressed: { 
    backgroundColor: '#3E836A', 
    borderWidth: 1.5, 
    borderColor: logoDarkShadow, 
    transform: [{ scale: 0.95 }],
  },


  // --- RE-ENGINEERED HOME ENGINE PLAYER COMPONENT STYLES ---
  playerWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 48,
    paddingBottom: 24,
    backgroundColor: baseColor,
  },
  playerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  playerBackNeuButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: baseColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 3, height: 3 }, 
    shadowOpacity: 1, 
    shadowRadius: 4, 
    elevation: 3,
    borderTopWidth: 1, 
    borderLeftWidth: 1, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  playerHeaderCenterText: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  playerRoutineSubTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7FA293',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  playerStepIndicator: {
    fontSize: 16,
    fontWeight: '900',
    color: '#21332A',
    marginTop: 1,
  },
  playerMainCard: {
    flex: 1,
    backgroundColor: baseColor,
    borderRadius: 36,
    padding: 20,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 5, height: 5 }, 
    shadowOpacity: 1, 
    shadowRadius: 6, 
    elevation: 4,
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  animationPlaceholderFrame: {
    height: '42%',
    backgroundColor: '#E8F1EC',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: '#FFFFFF',
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
  },
  placeholderAnimateIcon: {
    transform: [{ scale: 1.1 }],
  },
  liveActivityBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E53E3E',
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#21332A',
    letterSpacing: 0.5,
  },
  playerExerciseTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#21332A',
    marginTop: 16,
    textAlign: 'center',
  },
  targetMetricChipBox: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: logoGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 8,
  },
  targetMetricChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  playerGlassDivider: {
    height: 1,
    backgroundColor: '#D4E2DC',
    marginVertical: 14,
  },
  instructionsTextScroll: {
    flex: 1,
    paddingHorizontal: 2,
  },
  instructionSectionTitleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#21332A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  instructionParagraphText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#556B60',
    lineHeight: 19,
  },
  playerControlActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  playerSecondaryNeuActionBtn: {
    flex: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: baseColor,
    paddingVertical: 14,
    borderRadius: 16,
    marginRight: 10,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 2, height: 2 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 3, 
    elevation: 0,
    borderTopWidth: 1, 
    borderLeftWidth: 1, 
    borderColor: '#FFFFFF',
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  playerSecondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#556B60',
  },
  playerPrimaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: logoGreen,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: logoGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  playerPrimaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loaderOuterNeu: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: baseColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: clearWhiteHighlight,
  },
  loaderTextTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A2B23',
    marginBottom: 8,
  },
  loaderTextDesc: {
    fontSize: 14,
    color: '#7FA293',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5F0',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#C6E0D4',
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#37745D',
    letterSpacing: 0.5,
  },
});
