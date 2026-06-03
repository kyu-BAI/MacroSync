import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { Camera, UtensilsCrossed, MessageSquare, Home, BarChart2, Settings } from 'lucide-react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function DashboardScreen() {
  const [isPressedBtn, setIsPressedBtn] = useState(null);

  // --- MOCK DATA ---
  const userProfile = { name: "Kaizer" };
  const goals = { primaryGoal: "Gain Weight", weeklyTarget: "1.0 lbs/week" };
  
  const weight = { starting: 66.0, current: 67.6, target: 68.0, progress: 0.80 };
  const weightChange = weight.current - weight.starting;
  const isGain = weightChange >= 0;

  const calories = { target: 2800, consumed: 1150 };
  const caloriesLeft = calories.target - calories.consumed;
  
  const macros = [
    { label: 'Protein', current: 75, target: 150, color: '#4EA685', unit: 'g' }, 
    { label: 'Carbs', current: 110, target: 250, color: '#3B82F6', unit: 'g' },
    { label: 'Fats', current: 55, target: 70, color: '#EC4899', unit: 'g' },
  ];

  const workoutSummary = {
    completedDays: 3,
    weeklyGoalDays: 5,
    caloriesBurnedToday: 320,
    activeMinutesToday: 45,
  };

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* HEADER BRANDING SECTION */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.appName}>MacroSync</Text>
            <Text style={styles.greeting}>Hello, {userProfile.name}!</Text>
            <Text style={styles.subGreeting}>Goal: {goals.primaryGoal} • {goals.weeklyTarget}</Text>
          </View>
          
          {/* Neumorphic Rounded Wrapper for Avatar */}
          <View style={styles.neuAvatarShadowDark}>
            <View style={styles.avatarGlass}>
              <Text style={styles.avatarText}>K</Text>
            </View>
          </View>
        </View>

        {/* 1. NEUMORPHIC WEIGHT PROGRESS WIDGET (Big Ring Layout) */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Weight Tracking Dashboard</Text>
          <View style={styles.weightCardLayout}>
            <View style={styles.ringContainer}>
              <View style={styles.outerRing}>
                <View style={styles.innerCircle}>
                  <Text style={styles.percentageText}>{Math.round(weight.progress * 100)}%</Text>
                  <Text style={styles.subPercentageText}>to Goal</Text>
                </View>
              </View>
            </View>

            <View style={styles.metricsContainer}>
              <View style={styles.row}>
                <View style={styles.metricBox}>
                  <Text style={styles.label}>Current</Text>
                  <Text style={styles.value}>{weight.current.toFixed(1)} kg</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.label}>Goal Target</Text>
                  <Text style={[styles.value, { color: logoGreen }]}>{weight.target.toFixed(1)} kg</Text>
                </View>
              </View>

              <View style={styles.glassDivider} />

              <View style={styles.row}>
                <View style={styles.metricBox}>
                  <Text style={styles.label}>Starting</Text>
                  <Text style={styles.subValue}>{weight.starting.toFixed(1)} kg</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.label}>{isGain ? 'Gained' : 'Lost'}</Text>
                  <Text style={[styles.subValue, { color: isGain ? logoGreen : '#C53030', fontWeight: '800' }]}>
                    {isGain ? '+' : ''}{weightChange.toFixed(1)} kg
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 2. NEUMORPHIC UNIFIED NUTRITION CARD (Big Ring Layout Matching Weight Trackers) */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Nutrition Overview</Text>
          <View style={styles.nutritionRow}>
            {/* Left Column Large Calorie Tracker Ring */}
            <View style={styles.calorieColumn}>
              <View style={styles.calorieOuterRing}>
                <View style={styles.calorieInnerCircle}>
                  <Text style={styles.calorieBigText}>{caloriesLeft.toLocaleString()}</Text>
                  <Text style={styles.calorieSubText}>kcal left</Text>
                </View>
              </View>
            </View>

            {/* Right Column Macro Bars */}
            <View style={styles.macroColumn}>
              {macros.map((macro, idx) => {
                const pct = Math.min(macro.current / macro.target, 1);
                return (
                  <View key={idx} style={styles.macroRow}>
                    <View style={styles.macroInfo}>
                      <Text style={styles.macroLabel}>{macro.label}</Text>
                      <Text style={styles.macroValue}>{macro.current}/{macro.target}{macro.unit}</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${pct * 100}%`, backgroundColor: macro.color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* 3. NEUMORPHIC EXERCISE ANALYTICS */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Exercise Analytics</Text>
          
          <View style={styles.exerciseRow}>
            <View style={styles.exerciseMetricBox}>
              <Text style={styles.label}>Weekly Routine</Text>
              <Text style={styles.exerciseValue}>
                {workoutSummary.completedDays} <Text style={{fontSize: 13, color: '#556B60', fontWeight: '500'}}>of</Text> {workoutSummary.weeklyGoalDays} days
              </Text>
            </View>
            <View style={styles.weekBlocksContainer}>
              {[1, 2, 3, 4, 5].map((day) => (
                <View 
                  key={day} 
                  style={[
                    styles.weekDayBlock, 
                    { backgroundColor: day <= workoutSummary.completedDays ? logoGreen : '#D4E2DC' }
                  ]} 
                />
              ))}
            </View>
          </View>

          <View style={styles.glassDivider} />

          <View style={styles.row}>
            <View style={styles.metricBox}>
              <Text style={styles.label}>Burned Today</Text>
              <Text style={[styles.value, {color: '#C53030'}]}>🔥 {workoutSummary.caloriesBurnedToday} kcal</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.label}>Active Time</Text>
              <Text style={[styles.value, {color: '#2B6CB0'}]}>⏱️ {workoutSummary.activeMinutesToday} mins</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* --- FLOATING AI CHATBOT SYSTEM --- */}
      <View style={styles.floatingChatbotContainer}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => handlePressIn('chatbot')}
          onPressOut={handlePressOut}
          style={[
            styles.chatbotFloatingButton,
            isPressedBtn === 'chatbot' ? styles.chatbotPressed : styles.chatbotUnpressed
          ]}
        >
          <MessageSquare color="#FFFFFF" size={26} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <View style={styles.navBarOuterEdge}>
        <View style={styles.navBarContentRow}>
          
          <TouchableOpacity style={styles.navTabItem} activeOpacity={0.7}>
            <Home color={logoGreen} size={22} strokeWidth={2.5} />
            <Text style={[styles.navTabText, { color: logoGreen }]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navTabItem} activeOpacity={0.7}>
            <BarChart2 color="#7FA293" size={22} strokeWidth={2} />
            <Text style={styles.navTabText}>Diet & Recipes</Text>
          </TouchableOpacity>

          {/* --- SCAN FOOD CENTER CAMERA PROTRUDING BUTTON --- */}
          <View style={styles.centerCameraContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => handlePressIn('camera')}
              onPressOut={handlePressOut}
              style={[
                styles.cameraCircleButton,
                isPressedBtn === 'camera' ? styles.cameraPressed : styles.cameraUnpressed
              ]}
            >
              <Camera color="#FFFFFF" size={28} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.navTabItem} activeOpacity={0.7}>
            <UtensilsCrossed color="#7FA293" size={22} strokeWidth={2} />
            <Text style={styles.navTabText}>Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navTabItem} activeOpacity={0.7}>
            <Settings color="#7FA293" size={22} strokeWidth={2} />
            <Text style={styles.navTabText}>Settings</Text>
          </TouchableOpacity>

        </View>
      </View>

    </View>
  );
}

// Unified High-Contrast Hybrid Neumorphic Theme Tokens
const baseColor = '#F0F4F2';           
const clearWhiteHighlight = '#FFFFFF';    
const softGreenShadow = '#AEC2B7';      

// Logo Branding Metrics
const logoGreen = '#4EA685';        
const logoDarkShadow = '#37745D';   
const logoLightHighlight = '#65D8AD'; 

const styles = StyleSheet.create({
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
  neuAvatarShadowDark: {
    borderRadius: 24,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
  },
  avatarGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: baseColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '900',
    color: logoGreen,
    fontSize: 16,
  },
  formCard: {
    backgroundColor: baseColor,
    borderRadius: 32, 
    padding: 18,
    marginBottom: 12, 
    shadowColor: softGreenShadow,
    shadowOffset: { width: 8, height: 8 }, 
    shadowOpacity: 1,
    shadowRadius: 10, 
    elevation: 6,    
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
  },
  cardTitle: {
    fontSize: 11,
    color: '#41544B',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    fontWeight: '800',
    marginLeft: 2,
  },
  weightCardLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  // Unified, enlarged dimensions for the tracking dashboard ring layer (120px)
  outerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: baseColor,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
    shadowColor: logoGreen,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  innerCircle: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: baseColor, 
    borderWidth: 7, 
    borderColor: logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 24, 
    fontWeight: '900',
    color: '#1A2B23',
  },
  subPercentageText: {
    fontSize: 10,
    color: '#556B60',
    fontWeight: '800',
    marginTop: 1,
  },
  metricsContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricBox: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: '#556B60',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    fontWeight: '800',
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A2B23',
  },
  subValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#21332A',
  },
  glassDivider: {
    height: 1,
    backgroundColor: '#D4E2DC',
    marginVertical: 10,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  calorieColumn: {
    marginRight: 18,
    alignItems: 'center',
  },
  // Expanded to match the weight tracking ring dimensions exactly (120px)
  calorieOuterRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: baseColor,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
    shadowColor: logoGreen,
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  calorieInnerCircle: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: baseColor,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
  },
  calorieBigText: {
    fontSize: 22, 
    fontWeight: '900',
    color: '#1A2B23',
    letterSpacing: -0.5,
  },
  calorieSubText: {
    fontSize: 11,
    color: '#556B60',
    fontWeight: '800',
  },
  macroColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  macroRow: {
    marginBottom: 10,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2B23',
  },
  macroValue: {
    fontSize: 11,
    color: '#556B60',
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#D4E2DC',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  exerciseMetricBox: {
    flex: 1,
  },
  exerciseValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A2B23',
  },
  weekBlocksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekDayBlock: {
    width: 14,
    height: 20,
    borderRadius: 5,
    marginLeft: 5,
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
});