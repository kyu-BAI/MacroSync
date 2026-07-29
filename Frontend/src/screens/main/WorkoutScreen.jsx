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

import API_URL from '../config/api';
import { addToSyncQueue, updateCachedDashboardField } from '../../services/OfflineStorage';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';
export default function WorkoutScreen({ 
  onTabChange, 
  userId, 
  onRefreshDashboard, 
  isOnline = true, 
  dailyExercise, 
  setDailyExercise,
  setNotifications
}) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
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
    showAlert(
      "End Workout Early?",
      "Are you sure you want to exit? Your current workout progress will not be logged.",
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
        showAlert("Authentication Error", "You must be logged in to log workouts.");
        return;
      }

      // Optimistic UI updates
      const workoutDuration = parseInt(activeRoutine.duration) || 15;
      const workoutSteps = workoutDuration * 100;
      let newExercise = null;
      if (setDailyExercise) {
        setDailyExercise(prev => {
          const next = {
            ...prev,
            caloriesBurned: (prev?.caloriesBurned || 0) + activeRoutine.caloriesBurn,
            activeMinutes: (prev?.activeMinutes || 0) + workoutDuration,
            steps: (prev?.steps || 0) + workoutSteps,
            targetSteps: prev?.targetSteps || 10000,
            recentExercise: activeRoutine.title
          };
          newExercise = next;
          return next;
        });
      }

      if (setNotifications && activeRoutine) {
        setNotifications(prev => [{
          id: `n-${Date.now()}`,
          title: 'Workout Completed! 🏋️‍♂️',
          category: 'workout',
          time: 'Just Now',
          read: false,
          message: `Motivational update: Awesome job! You burned ${activeRoutine.caloriesBurn} calories completing "${activeRoutine.title}".`
        }, ...prev]);
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
        showAlert(
          "Workout Complete! (Offline)",
          `Awesome work! You crushed "${activeRoutine?.title}". Since you are offline, it was saved locally and will sync later.`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null) }]
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

        showAlert(
          "Workout Complete!",
          `Awesome work! You crushed "${activeRoutine?.title}" and logged ${activeRoutine?.caloriesBurn} kcal into MacroSync!`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null) }]
        );
      } catch (error) {
        console.warn("LOG WORKOUT API ERROR (falling back to queue):", error);
        await addToSyncQueue({ type: 'LOG_WORKOUT', payload: workoutPayload });
        if (newExercise) {
          await updateCachedDashboardField(userId, { exercise: newExercise });
        }
        showAlert(
          "Workout Saved Locally",
          `Could not reach the server. "${activeRoutine?.title}" has been saved locally and will sync later.`,
          [{ text: "Finish", onPress: () => setActiveRoutine(null) }]
        );
      }
    }
  };

  const filteredWorkouts = workoutRoutines.filter(workout => {
    return selectedIntensity === 'All' || workout.intensity === selectedIntensity;
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme?.background || baseColor }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />
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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />
      
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
              <HelpCircle color={theme?.textSecondary || "#94A3B8"} size={22} />
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
                <Text style={[styles.instructionSectionTitleLabel, { color: logoGreen }]}>How to Set Up:</Text>
                <Text style={styles.instructionParagraphText}>{activeRoutine.tutorials[currentStepIndex].setup}</Text>
                
                <Text style={[styles.instructionSectionTitleLabel, { marginTop: 14, color: logoGreen }]}>Proper Execution Form:</Text>
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
                    <RotateCcw color={theme?.textSecondary || "#64748B"} size={16} style={{ marginRight: 4 }} />
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
              <Sparkles color={'#10B981'} size={12} style={{ marginRight: 6 }} />
              <Text style={[styles.aiBadgeText, { color: logoGreen }]}>AI RECOMMENDED WORKOUTS</Text>
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
                  { color: selectedIntensity === tier ? '#FFFFFF' : (theme?.textPrimary || '#0F172A') }
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
                  <View style={{ backgroundColor: 'rgba(14, 165, 233, 0.12)', borderRadius: 8, padding: 5, marginRight: 8 }}>
                    <Clock color={'#0EA5E9'} size={13} />
                  </View>
                  <View>
                    <Text style={styles.metricTileLabel}>Duration</Text>
                    <Text style={[styles.metricTileValue, { color: '#0EA5E9' }]}>{workout.duration}</Text>
                  </View>
                </View>
                
                <View style={styles.metricItemBox}>
                  <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', borderRadius: 8, padding: 5, marginRight: 8 }}>
                    <Flame color={'#F97316'} size={13} />
                  </View>
                  <View>
                    <Text style={styles.metricTileLabel}>Est. Burn</Text>
                    <Text style={[styles.metricTileValue, { color: '#F97316' }]}>{workout?.caloriesBurn} kcal</Text>
                  </View>
                </View>

                <View style={styles.metricItemBox}>
                  <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', borderRadius: 8, padding: 5, marginRight: 8 }}>
                    <Trophy color={'#F59E0B'} size={13} />
                  </View>
                  <View>
                    <Text style={styles.metricTileLabel}>Intensity</Text>
                    <Text style={[styles.metricTileValue, { color: '#F59E0B' }]}>{workout?.intensity}</Text>
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

           
    
      
        
   
 

const baseColor = '#F8FAFC';           
const logoGreen = '#10B981';        

const getStyles = (theme) => StyleSheet.create({
  fullscreenOverlay: { 
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0, 
    width: screenWidth, 
    height: screenHeight, 
    backgroundColor: theme?.background || baseColor,
  },
  container: { 
    flex: 1,
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 54 : 48, 
    paddingBottom: 85,
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
    color: theme?.textPrimary || '#0F172A', 
    letterSpacing: -0.5,
  },
  subGreeting: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: theme?.textSecondary || '#64748B', 
    marginTop: 2,
  },
  formCard: {
    backgroundColor: theme?.surface || baseColor, 
    borderRadius: 24, 
    padding: 18, 
    marginBottom: 16, 
    borderWidth: 1.2,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  cardTitle: { 
    fontSize: 11, 
    color: theme?.textPrimary || '#0F172A', 
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
    backgroundColor: theme?.surface || baseColor,
    borderWidth: 1.2, 
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  filterChipInactive: { 
    backgroundColor: theme?.surface || baseColor,
  },
  filterChipActive: { 
    backgroundColor: logoGreen, 
    borderWidth: 1.5,
    borderColor: logoGreen,
    shadowOpacity: 0,
    elevation: 0,
  },
  filterChipText: { 
    fontSize: 12, 
    fontWeight: '800',
  },
  sectionLabelTitle: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A', 
    marginBottom: 12, 
    marginLeft: 4, 
    letterSpacing: -0.2,
  },
  workoutFormCard: {
    backgroundColor: theme?.surface || baseColor, 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 14,
    borderWidth: 1.2,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
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
    color: theme?.textPrimary || '#0F172A', 
    marginBottom: 6, 
    lineHeight: 20,
  },
  workoutDescriptionText: {
    fontSize: 13,
    color: theme?.textSecondary || '#64748B',
    fontWeight: '600',
    lineHeight: 18,
  },
  glassDivider: { 
    height: 1, 
    backgroundColor: theme?.border || '#E2E8F0', 
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
    color: theme?.textSecondary || '#94A3B8',
  },
  metricTileValue: {
    fontSize: 13,
    fontWeight: '800',
    color: theme?.textPrimary || '#0F172A',
    marginTop: 1,
  },
  startWorkoutActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: logoGreen,
    paddingVertical: 12,
    borderRadius: 16,
    shadowOpacity: 0,
    elevation: 0,
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
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  chatbotPressed: { 
    backgroundColor: '#059669',
    transform: [{ scale: 0.95 }],
  },


  // --- RE-ENGINEERED HOME ENGINE PLAYER COMPONENT STYLES ---
  playerWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 48,
    paddingBottom: 24,
    backgroundColor: theme?.background || baseColor,
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
    backgroundColor: theme?.surface || baseColor,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1, 
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  playerHeaderCenterText: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  playerRoutineSubTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme?.textSecondary || '#94A3B8',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  playerStepIndicator: {
    fontSize: 16,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    marginTop: 1,
  },
  playerMainCard: {
    flex: 1,
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5, 
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  animationPlaceholderFrame: {
    height: '42%',
    backgroundColor: theme?.cardBg || '#F1F5F9',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
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
    backgroundColor: theme?.surface || 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  playerExerciseTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
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
    backgroundColor: theme?.border || '#E2E8F0',
    marginVertical: 14,
  },
  instructionsTextScroll: {
    flex: 1,
    paddingHorizontal: 2,
  },
  instructionSectionTitleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme?.textPrimary || '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  instructionParagraphText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme?.textSecondary || '#64748B',
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
    backgroundColor: theme?.surface || baseColor,
    paddingVertical: 14,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1, 
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  playerSecondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme?.textSecondary || '#64748B',
  },
  playerPrimaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: logoGreen,
    paddingVertical: 14,
    borderRadius: 16,
    shadowOpacity: 0,
    elevation: 0,
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
    backgroundColor: theme?.surface || baseColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  loaderTextTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    marginBottom: 8,
  },
  loaderTextDesc: {
    fontSize: 14,
    color: theme?.textSecondary || '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme?.textSecondary || '#64748B',
    letterSpacing: 0.5,
  },
});