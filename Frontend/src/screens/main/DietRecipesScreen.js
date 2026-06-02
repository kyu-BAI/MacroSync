import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function DietRecipesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // --- CAPSTONE MODULE SPECIFIC MOCK DATA ---
  const mealSummary = { consumedKcal: 1150, targetKcal: 2800 };
  
  // Categorized filters explicitly mapping to Module 2 requirements
  const categories = ['All', 'Homemade Recipes', 'Budget-Friendly', 'Local Options'];

  const dietRecommendations = [
    {
      id: '1',
      title: 'Local Chicken Breast Bowl',
      calories: 450,
      macros: 'P: 45g • C: 35g • F: 8g',
      type: 'Local Options',
      estimatedCost: '₱120.00',
      sourceLocation: 'Bogo Public Market Vendors', // Module 2 Location Requirement
      details: 'Sourced from local accessible stalls. Optimized for high protein.',
    },
    {
      id: '2',
      title: 'Frosted Homemade Tinolang Manok',
      calories: 320,
      macros: 'P: 30g • C: 12g • F: 10g',
      type: 'Homemade Recipes',
      estimatedCost: '₱85.00',
      sourceLocation: 'Using: Chicken, Malunggay, Sayote', // Module 2 Available Ingredients Requirement
      details: 'Calculated using baseline available home ingredients and regional spices.',
    },
    {
      id: '3',
      title: 'Budget Garlic Fried Rice & Boiled Egg',
      calories: 380,
      macros: 'P: 14g • C: 50g • F: 11g',
      type: 'Budget-Friendly',
      estimatedCost: '₱35.00', // Module 2 Budget Preference Requirement
      sourceLocation: 'Any Local Sari-Sari Store',
      details: 'Low-cost carbohydrate loading option meeting strict budget constraints.',
    }
  ];

  const filteredItems = dietRecommendations.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || item.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.panelWrapper}>
      {/* VIBRANT LAYERED GLOW EFFECTS RUNNING UNDER FROSTED OVERLAYS */}
      <View style={styles.glowBlobLeft} />
      <View style={styles.glowBlobRight} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* TOP PANEL CORE TITLE HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>MacroSync • Diet Module</Text>
            <Text style={styles.greeting}>Diet & Recipes</Text>
            <Text style={styles.subGreeting}>Personalized recommendations & discovery</Text>
          </View>
          
          {/* MODULE 3: AI IMAGE SHUTTER ACCELERATOR */}
          <View style={styles.neuScanShadowDark}>
            <View style={styles.neuScanShadowLight}>
              <TouchableOpacity style={styles.scanButtonGlass} activeOpacity={0.7}>
                <Text style={styles.scanIcon}>📸</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 1. NUTRITION INTAKE CALCULATED METRICS CARD */}
        <View style={styles.neuCardShadowDark}>
          <View style={styles.neuCardShadowLight}>
            <View style={styles.glassCardBody}>
              <View style={styles.progressTextContainer}>
                <Text style={styles.label}>Total Target Energy Intake</Text>
                <Text style={styles.mainValue}>
                  {mealSummary.consumedKcal.toLocaleString()} <Text style={styles.subLabel}>/ {mealSummary.targetKcal.toLocaleString()} kcal</Text>
                </Text>
              </View>
              <View style={styles.miniBarTrack}>
                <View 
                  style={[
                    styles.miniBarFill, 
                    { width: `${(mealSummary.consumedKcal / mealSummary.targetKcal) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* 2. DYNAMIC INPUT SEARCH AND CRITERIA FILTER CHIPS */}
        <View style={styles.neuCardShadowDark}>
          <View style={styles.neuCardShadowLight}>
            <View style={[styles.glassCardBody, { flexDirection: 'column', alignItems: 'stretch', padding: 14 }]}>
              <TextInput
                style={styles.searchBar}
                placeholder="Search meals, ingredients, or places..."
                placeholderTextColor="#718096"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                {categories.map((category) => {
                  const isSelected = selectedFilter === category;
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[styles.filterTag, isSelected && styles.activeFilterTag]}
                      onPress={() => setSelectedFilter(category)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterTagText, isSelected && styles.activeFilterTagText]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* 3. VERIFIED CORE MODULE 2 TARGET RECOMMENDATIONS DISPLAY ROW */}
        <Text style={styles.sectionHeading}>System Generated Recommendations</Text>
        
        {filteredItems.length === 0 ? (
          <Text style={styles.emptyText}>No recipe records match selected preference filters.</Text>
        ) : (
          filteredItems.map((item) => (
            <View key={item.id} style={styles.neuCardShadowDark}>
              <View style={styles.neuCardShadowLight}>
                <View style={[styles.glassCardBody, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                  
                  {/* Top Heading Badge Layout Layer */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.mealTitle}>{item.title}</Text>
                    <View style={styles.mealBadge}>
                      <Text style={styles.mealBadgeText}>{item.type}</Text>
                    </View>
                  </View>

                  {/* Calculated Macro Analysis Metrics */}
                  <Text style={styles.mealMacros}>
                    {item.macros} • <Text style={{fontWeight: '700', color: '#2D3748'}}>{item.calories} kcal</Text>
                  </Text>
                  
                  <Text style={styles.mealDescription}>{item.details}</Text>
                  
                  <View style={styles.glassDivider} />
                  
                  {/* Local Sourcing & Cost Verification Layer */}
                  <View style={styles.cardFooterRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.metaLabel}>Est. Budget & Source Constraints</Text>
                      <Text style={styles.metaValue} numberOfLines={1}>
                        {item.estimatedCost} • <Text style={{fontWeight: '500', color: '#4A5568', fontSize: 12}}>{item.sourceLocation}</Text>
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.recipeLogButton} activeOpacity={0.7}>
                      <Text style={styles.recipeLogButtonText}>+ Log</Text>
                    </TouchableOpacity>
                  </View>

                </View>
              </View>
            </View>
          ))
        )}

        {/* Padding buffer ensuring full visibility over floating nav components */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panelWrapper: {
    flex: 1,
    backgroundColor: '#E0E5EC',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140, 
  },
  glowBlobLeft: {
    position: 'absolute',
    top: 60,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FBCFE8',
    opacity: 0.4,
  },
  glowBlobRight: {
    position: 'absolute',
    bottom: 180,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#A7F3D0',
    opacity: 0.45,
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
  neuScanShadowDark: {
    borderRadius: 24,
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 3,
  },
  neuScanShadowLight: {
    borderRadius: 24,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  scanButtonGlass: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIcon: {
    fontSize: 20,
  },
  neuCardShadowDark: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#E0E5EC',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 7, height: 7 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  neuCardShadowLight: {
    width: '100%',
    borderRadius: 24,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -7, height: -7 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  glassCardBody: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)', 
    borderRadius: 24, 
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)', 
  },
  progressTextContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    color: '#4A5568',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '700',
  },
  mainValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3748',
  },
  subLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  miniBarTrack: {
    height: 8,
    backgroundColor: 'rgba(163, 177, 198, 0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: '#00A3CC',
    borderRadius: 4,
  },
  searchBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
  },
  filterScrollView: {
    flexDirection: 'row',
  },
  filterTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(163, 177, 198, 0.15)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeFilterTag: {
    backgroundColor: 'rgba(0, 163, 204, 0.15)',
    borderColor: 'rgba(0, 163, 204, 0.4)',
  },
  filterTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718096',
  },
  activeFilterTagText: {
    color: '#00A3CC',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4A5568',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 6,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D3748',
    flex: 1,
    paddingRight: 8,
  },
  mealBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  mealBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4A5568',
  },
  mealMacros: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '600',
    marginBottom: 6,
  },
  mealDescription: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
  },
  glassDivider: {
    height: 1,
    backgroundColor: 'rgba(163, 177, 198, 0.25)',
    marginVertical: 12,
    width: '100%',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  metaLabel: {
    fontSize: 9,
    color: '#718096',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00A3CC',
  },
  recipeLogButton: {
    backgroundColor: 'rgba(0, 163, 204, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 204, 0.25)',
  },
  recipeLogButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00A3CC',
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
});