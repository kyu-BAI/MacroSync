import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
// Using lucide-react-native for clean, minimal black iconography
import { Camera, UtensilsCrossed } from 'lucide-react-native';

export default function DashboardScreen() {
  // --- MOCK DATA ---
  const userProfile = { name: "Kaizer" };
  const goals = { primaryGoal: "Gain Weight", weeklyTarget: "1.0 lbs/week" };
  
  const weight = { starting: 66.0, current: 67.6, target: 68.0, progress: 0.80 };
  const weightChange = weight.current - weight.starting;
  const isGain = weightChange >= 0;

  const calories = { target: 2800, consumed: 1150 };
  const caloriesLeft = calories.target - calories.consumed;
  
  const macros = [
    { label: 'Protein', current: 75, target: 150, color: '#F97316', unit: 'g' },
    { label: 'Carbs', current: 110, target: 250, color: '#3B82F6', unit: 'g' },
    { label: 'Fats', current: 55, target: 70, color: '#EC4899', unit: 'g' },
  ];

  const workoutSummary = {
    completedDays: 3,
    weeklyGoalDays: 5,
    caloriesBurnedToday: 320,
    activeMinutesToday: 45,
  };

  return (
    <View style={styles.panelWrapper}>
      {/* Background colorful glows completely removed */}

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER BRANDING SECTION */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>MacroSync</Text>
            <Text style={styles.greeting}>Hello, {userProfile.name}!</Text>
            <Text style={styles.subGreeting}>Goal: {goals.primaryGoal} • {goals.weeklyTarget}</Text>
          </View>
          
          {/* Neumorphic Rounded Wrapper for Avatar */}
          <View style={styles.neuAvatarShadowDark}>
            <View style={styles.neuAvatarShadowLight}>
              <TouchableOpacity style={styles.avatarGlass} activeOpacity={0.8}>
                <Text style={styles.avatarText}>K</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 1. NEU-GLASS WEIGHT PROGRESS WIDGET */}
        <View style={styles.neuCardShadowDark}>
          <View style={styles.neuCardShadowLight}>
            <View style={styles.glassCardBody}>
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
                    <Text style={[styles.value, { color: '#3B82F6' }]}>{weight.target.toFixed(1)} kg</Text>
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
                    <Text style={[styles.subValue, { color: isGain ? '#10B981' : '#F59E0B', fontWeight: '700' }]}>
                      {isGain ? '+' : ''}{weightChange.toFixed(1)} kg
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 2. NEU-GLASS UNIFIED NUTRITION CARD */}
        <View style={styles.neuCardShadowDark}>
          <View style={styles.neuCardShadowLight}>
            <View style={[styles.glassCardBody, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={styles.cardTitle}>Nutrition Overview</Text>
              <View style={styles.nutritionRow}>
                {/* Left Column Calorie Circle */}
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
          </View>
        </View>

        {/* 3. NEU-GLASS EXERCISE ANALYTICS */}
        <View style={styles.neuCardShadowDark}>
          <View style={styles.neuCardShadowLight}>
            <View style={[styles.glassCardBody, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={styles.cardTitle}>Exercise Analytics</Text>
              
              <View style={styles.exerciseRow}>
                <View style={styles.exerciseMetricBox}>
                  <Text style={styles.label}>Weekly Routine</Text>
                  <Text style={styles.exerciseValue}>
                    {workoutSummary.completedDays} <Text style={{fontSize: 13, color: '#475569', fontWeight: '400'}}>of</Text> {workoutSummary.weeklyGoalDays} days
                  </Text>
                </View>
                <View style={styles.weekBlocksContainer}>
                  {[1, 2, 3, 4, 5].map((day) => (
                    <View 
                      key={day} 
                      style={[
                        styles.weekDayBlock, 
                        { backgroundColor: day <= workoutSummary.completedDays ? '#10B981' : 'rgba(15, 23, 42, 0.06)' }
                      ]} 
                    />
                  ))}
                </View>
              </View>

              <View style={styles.glassDivider} />

              <View style={styles.row}>
                <View style={styles.metricBox}>
                  <Text style={styles.label}>Burned Today</Text>
                  <Text style={[styles.value, {color: '#EF4444'}]}>🔥 {workoutSummary.caloriesBurnedToday} kcal</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.label}>Active Time</Text>
                  <Text style={styles.value}>⏱️ {workoutSummary.activeMinutesToday} mins</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 4. AI QUICK ACTIONS SYSTEM */}
        <Text style={styles.sectionHeading}>AI Guidance Tools</Text>
        <View style={styles.actionRow}>
          <View style={[styles.neuCardShadowDark, {flex: 0.48, marginBottom: 0}]}>
            <View style={styles.neuCardShadowLight}>
              <TouchableOpacity style={styles.glassActionButton} activeOpacity={0.7}>
                <View style={styles.actionIconContainer}>
                  <Camera size={22} color="#18181B" strokeWidth={2} />
                </View>
                <Text style={styles.actionButtonText}>Scan Food</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.neuCardShadowDark, {flex: 0.48, marginBottom: 0}]}>
            <View style={styles.neuCardShadowLight}>
              <TouchableOpacity style={styles.glassActionButton} activeOpacity={0.7}>
                <View style={styles.actionIconContainer}>
                  <UtensilsCrossed size={22} color="#18181B" strokeWidth={2} />
                </View>
                <Text style={styles.actionButtonText}>Diet & Recipes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panelWrapper: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Clean minimalist light design profile background
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  appName: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00A3CC',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D3748',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 2,
  },
  neuAvatarShadowDark: {
    borderRadius: 24,
    shadowColor: '#E4E4E7',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 2,
  },
  neuAvatarShadowLight: {
    borderRadius: 24,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarGlass: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
    color: '#2D3748',
    fontSize: 16,
  },
  neuCardShadowDark: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#E4E4E7',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 18,
  },
  neuCardShadowLight: {
    width: '100%',
    borderRadius: 24,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -4, height: -6 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  glassCardBody: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7', 
  },
  cardTitle: {
    fontSize: 12,
    color: '#4A5568',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
    fontWeight: '800',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  outerRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF', 
    borderWidth: 4.5,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D3748',
  },
  subPercentageText: {
    fontSize: 9,
    color: '#4A5568',
    fontWeight: '700',
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
    fontSize: 11,
    color: '#4A5568',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '700',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D3748',
  },
  subValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3748',
  },
  glassDivider: {
    height: 1,
    backgroundColor: '#E4E4E7',
    marginVertical: 14,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  calorieColumn: {
    marginRight: 20,
    alignItems: 'center',
  },
  calorieOuterRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieInnerCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  calorieBigText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3748',
    letterSpacing: -0.5,
  },
  calorieSubText: {
    fontSize: 10,
    color: '#4A5568',
    fontWeight: '700',
  },
  macroColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  macroRow: {
    marginBottom: 12,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D3748',
  },
  macroValue: {
    fontSize: 11,
    color: '#4A5568',
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E4E4E7',
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
    alignItems: 'center', // Fixed layout typo line completely
    width: '100%',
  },
  exerciseMetricBox: {
    flex: 1,
  },
  exerciseValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D3748',
  },
  weekBlocksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekDayBlock: {
    width: 16,
    height: 22,
    borderRadius: 5,
    marginLeft: 6,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4A5568',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  glassActionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  actionIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D3748',
  },
});