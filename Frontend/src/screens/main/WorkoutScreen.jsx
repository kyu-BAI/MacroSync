import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { Camera, UtensilsCrossed, BotMessageSquare, Home, SportShoe, Settings, Flame, Clock, Trophy, Play, ArrowLeft, CheckCircle2, RotateCcw, HelpCircle } from 'lucide-react-native';
import DraggableChatbotButton from '../../components/DraggableChatbotButton';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function WorkoutScreen({ onTabChange }) {
  const styles = getStyles();
  const [isPressedBtn, setIsPressedBtn] = useState(null);
  const [selectedIntensity, setSelectedIntensity] = useState('All');
  
  // --- TUTORIAL ENGINE NAVIGATION STATES ---
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const intensityTiers = ['All', 'Light', 'Moderate', 'Intense'];

  // --- RE-ENGINEERED DATA STRUCTURE WITH EMBEDDED EXERCISE TUTORIALS ---
  const workoutRoutines = [
    {
      id: 1,
      title: 'Home Calisthenics Push & Core Mass',
      intensity: 'Intense',
      duration: '25 mins',
      targetGains: 'Muscle Growth',
      caloriesBurn: 290,
      description: 'Decline push-ups, explosive push-ups, chair dips, planks, and leg raises for upper body muscle development.',
      tutorials: [
        {
          name: 'Decline Bodyweight Push-Ups',
          target: '3 Sets x 12 Reps',
          setup: 'Elevate your feet on a stable household chair, sofa, or bed structure. Place your hands flat on the floor slightly wider than shoulder-width apart.',
          form: 'Keep your body in a rigid straight line from head to heels. Lower your chest toward the floor slowly, control the descent, then push back up explosively.'
        },
        {
          name: 'Tricep Chair Dips',
          target: '3 Sets x 15 Reps',
          setup: 'Sit on the edge of your chair or bed. Place hands right next to your hips, slide your glutes forward off the seat, extending legs out.',
          form: 'Lower your body by bending your elbows down to a 90-degree angle. Press firmly through your palms to return to the starting lock position.'
        },
        {
          name: 'Strict Isometric Floor Plank',
          target: '3 Sets x 45 Seconds',
          setup: 'Rest your forearms squarely on the floor with elbows aligned perfectly underneath your shoulders.',
          form: 'Squeeze your core, glutes, and thighs intensely. Prevent your lower back from sagging toward the ground; maintain a flat table posture.'
        }
      ]
    },
    {
      id: 2,
      title: 'Full-Body High-Intensity Home Conditioning',
      intensity: 'Moderate',
      duration: '20 mins',
      targetGains: 'Functional Strength',
      caloriesBurn: 240,
      description: 'Bodyweight squats, jumping jacks, mountain climbers, and lunges to burn energy without needing open space.',
      tutorials: [
        {
          name: 'Air Squats (Tempo Focused)',
          target: '4 Sets x 20 Reps',
          setup: 'Stand tall with feet tracking shoulder-width apart, toes pointing slightly outward.',
          form: 'Drive hips back and sit down deeply as if entering a chair until thighs go parallel to the floor. Drive hard through your heels to stand up.'
        },
        {
          name: 'Alternating Reverse Lunges',
          target: '3 Sets x 12 Reps Per Leg',
          setup: 'Stand with hands secured on your hips or chest area for total balance control.',
          form: 'Take a controlled step backward with one leg. Lower your hips until both knees bend at a 90-degree threshold, then drop straight up.'
        },
        {
          name: 'Mountain Climbers (Pacing Core)',
          target: '3 Sets x 30 Seconds',
          setup: 'Assume a rigid high push-up plank position with palms locked underneath shoulders.',
          form: 'Drive your knees forward toward your chest rapidly in an alternating pattern. Maintain hip stability without bouncing upwards.'
        }
      ]
    },
    {
      id: 3,
      title: 'Living Room Mobility & Posture Alignment',
      intensity: 'Light',
      duration: '15 mins',
      targetGains: 'Flexibility & Health',
      caloriesBurn: 85,
      description: 'Dynamic stretching sequences, yoga-inspired spinal decompression, and core stability activation patterns.',
      tutorials: [
        {
          name: 'Quadruped Cat-Cow Flow',
          target: '2 Sets x 10 Cycles',
          setup: 'Get down on all fours on a comfortable mat or floor towel with knees under hips and hands under shoulders.',
          form: 'Inhale deeply as you arch your back downwards and look up. Exhale smoothly while tucking your chin and rounding your spine up.'
        },
        {
          name: 'Deep Living Room Yogi Squat Hold',
          target: '2 Sets x 45 Seconds',
          setup: 'Step your feet slightly wider than standard squat metrics with toes flared open.',
          form: 'Drop your weight all the way down into a deep squat. Press elbows outwards against the inside of knees to decompress your groin and lower back safely.'
        }
      ]
    },
  ];

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);

  const handleStartTutorialEngine = (routine) => {
    setActiveRoutine(routine);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    if (currentStepIndex < activeRoutine?.tutorials?.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      Alert.alert(
        "Workout Complete!",
        `Awesome work Kaizer! You crushed "${activeRoutine?.title}" and logged ${activeRoutine?.caloriesBurn} kcal into MacroSync!`,
        [{ text: "Finish", onPress: () => setActiveRoutine(null), fontWeight: '900' }]
      );
    }
  };

  const filteredWorkouts = workoutRoutines.filter(workout => {
    return selectedIntensity === 'All' || workout.intensity === selectedIntensity;
  });

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* ------------------------------------------------------------------ */}
      {/* VIEWPORT MODE A: ACTIVE REAL-TIME INTERACTIVE TUTORIAL PLAYER */}
      {/* ------------------------------------------------------------------ */}
      {activeRoutine ? (
        <View style={styles.playerWrapper}>
          {/* PLAYER HEADER AREA */}
          <View style={styles.playerHeaderRow}>
            <TouchableOpacity 
              style={styles.playerBackNeuButton}
              activeOpacity={0.8}
              onPress={() => setActiveRoutine(null)}
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
      ) : (
        /* ------------------------------------------------------------------ */
        /* VIEWPORT MODE B: STANDARD ROUTINES SELECTION HUB LIST VIEW */
        /* ------------------------------------------------------------------ */
        <>
          <ScrollView 
            style={styles.container} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            {/* HEADER BRANDING SECTION */}
            <View style={styles.header}>
              <View style={styles.headerTextGroup}>
                <Text style={styles.appName}>MacroSync</Text>
                <Text style={styles.greeting}>Basic Home Workout</Text>
                <Text style={styles.subGreeting}>Zero-equipment exercises built for busy schedules and zero cost</Text>
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
          <DraggableChatbotButton onPress={() => onTabChange && onTabChange('CHATBOT')} />

          {/* --- BOTTOM NAVIGATION BAR --- */}
        </>
      )}
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
    shadowOffset: { width: 2, height: 2 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 3, 
    elevation: 2,
    borderTopWidth: 1, 
    borderLeftWidth: 1, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  filterChipInactive: { 
    backgroundColor: baseColor,
  },
  filterChipActive: { 
    backgroundColor: '#3E836A', 
    borderTopColor: logoDarkShadow, 
    borderLeftColor: logoDarkShadow,
    borderWidth: 1,
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
  navBarOuterEdge: {
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: 84, 
    backgroundColor: baseColor, 
    borderTopWidth: 1.5, 
    borderTopColor: clearWhiteHighlight,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 0, height: -6 }, 
    shadowOpacity: 0.7, 
    shadowRadius: 10, 
    elevation: 16, 
    paddingHorizontal: 6, 
    paddingBottom: Platform.OS === 'ios' ? 18 : 2,
  },
  navBarContentRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    height: '100%', 
    position: 'relative',
  },
  navTabItem: { 
    flex: 1.1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 6,
  },
  navTabText: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: '#7FA293', 
    marginTop: 4, 
    textAlign: 'center',
  },
  centerCameraContainer: { 
    position: 'relative', 
    width: 68, 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  cameraCircleButton: {
    width: 62, 
    height: 62, 
    borderRadius: 31, 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'absolute', 
    top: -20,
  },
  cameraUnpressed: { 
    backgroundColor: '#4EA685', 
    borderTopWidth: 2, 
    borderLeftWidth: 2, 
    borderTopColor: logoLightHighlight, 
    borderLeftColor: logoLightHighlight,
    shadowColor: logoDarkShadow, 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.9, 
    shadowRadius: 8, 
    elevation: 8,
  },
  cameraPressed: { 
    backgroundColor: '#3E836A', 
    borderWidth: 1.5, 
    borderColor: logoDarkShadow, 
    top: -18,
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
    borderWidth: 1,
    borderColor: '#D4E2DC',
    overflow: 'hidden',
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
    borderWidth: 0.5,
    borderColor: '#D4E2DC',
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
    elevation: 2,
    borderTopWidth: 1, 
    borderLeftWidth: 1, 
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
  },
  playerPrimaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
