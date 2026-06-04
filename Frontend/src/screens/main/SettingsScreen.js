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
  Switch,
  Alert
} from 'react-native';
import { Camera, UtensilsCrossed, BotMessageSquare, Home, SportShoe, Settings, User, Bell, Shield, CircleHelp, LogOut, ChevronRight, Sliders, Smartphone, CheckCircle2, Sparkles } from 'lucide-react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function SettingsScreen({ onTabChange }) {
  const [isPressedBtn, setIsPressedBtn] = useState(null);

  // --- DYNAMIC INTERACTIVE SWITCH STATES ---
  const [mealReminders, setMealReminders] = useState(true);
  const [workoutAlerts, setWorkoutAlerts] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(false);
  const [systemSounds, setSystemSounds] = useState(true);

  // --- DYNAMIC ACCOUNT TIERS & BILLING STATES ---
  const [accountTier, setAccountTier] = useState('Free');
  const [showBillingOptions, setShowBillingOptions] = useState(false);
  
  // Tracks exactly which option ('Monthly' or 'Annual') has the active focus/outline
  const [selectedBillingCycle, setSelectedBillingCycle] = useState(null);

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);

  // --- ACCOUNT TIER MANAGER ACTIONS ---
  const handleSelectTierOption = (tierType) => {
    if (tierType === 'Free') {
      setAccountTier('Free');
      setShowBillingOptions(false);
      setSelectedBillingCycle(null);
      Alert.alert("Plan Updated", "Your tier configuration has reverted back to the Free Default Plan.");
    } else {
      setShowBillingOptions(true);
    }
  };

  // --- TRIGGER PAYMENT HANDLER FOR FRONTEND FLOW ---
  const handleInitiatePaymentFlow = (planName, price) => {
    // Instantly apply the selection outline indicator visually
    setSelectedBillingCycle(planName);

    Alert.alert(
      "Confirm Payment Method",
      `Would you like to proceed with the payment for the Premium ${planName} Plan (${price})?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            // Remove outline state focus if user backs out of the checkout modal
            setSelectedBillingCycle(null);
          }
        },
        {
          text: "Proceed to Pay",
          onPress: () => {
            setAccountTier(`Premium (${planName})`);
            setShowBillingOptions(false);
            Alert.alert(
              "Processing Payment",
              "Connecting to payment gateway handlers... Subscription initialized successfully."
            );
          }
        }
      ]
    );
  };

  const handleSavePreferences = () => {
    Alert.alert(
      "Preferences Saved",
      "Your profile metrics and notification thresholds have been synced successfully.",
      [{ text: "Done", fontWeight: '800' }]
    );
  };

  // --- FULL LOGOUT SYSTEM WITH CONFIRMATION AND LOGIN REDIRECT ---
  const handleLogOut = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to exit your active tracking session?",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Log Out", 
          style: "destructive", 
          onPress: () => {
            if (onTabChange) {
              onTabChange('AUTH');
            }
          } 
        }
      ]
    );
  };

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
            <Text style={styles.greeting}>Settings Hub</Text>
            <Text style={styles.subGreeting}>Manage your profile parameters, configurations, and alerts</Text>
          </View>
        </View>

        {/* PROFILE IDENTIFICATION CARD */}
        <View style={styles.profileFormCard}>
          <View style={styles.profileUserRow}>
            <View style={styles.avatarNeuOuterBox}>
              <User color="#FFFFFF" size={28} strokeWidth={2.5} />
            </View>
            <View style={styles.profileMetadataTextGroup}>
              <Text style={styles.profileUserNameText}>User Account</Text>
              <Text style={styles.profileUserSubText}>MacroSync Active Member Profile Plan</Text>
            </View>
          </View>
          
          <View style={styles.glassDivider} />
          
          <View style={styles.profileMetricsMiniGrid}>
            <View style={styles.profileMetricMiniBox}>
              <Text style={styles.profileMetricMiniValue}>Weight Goal</Text>
              <Text style={styles.profileMetricMiniLabel}>Active Target</Text>
            </View>
            
            <View style={[styles.profileMetricMiniBox, { borderLeftWidth: 1, borderLeftColor: '#D4E2DC' }]}>
              <Text style={[
                styles.profileMetricMiniValue, 
                { color: accountTier.includes('Premium') ? '#4EA685' : '#1A2B23' }
              ]}>
                {accountTier}
              </Text>
              <Text style={styles.profileMetricMiniLabel}>Current Tier</Text>
            </View>
          </View>
        </View>

        {/* INTERACTIVE SUBSCRIPTION CONFIGURATION TIER CARD */}
        <Text style={styles.sectionLabelTitle}>Account Subscription Tier</Text>
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Select Target Membership Level</Text>
          <View style={styles.filterButtonGroupRow}>
            <TouchableOpacity
              style={[styles.filterChipButton, accountTier === 'Free' ? styles.filterChipActive : styles.filterChipInactive]}
              onPress={() => handleSelectTierOption('Free')}
            >
              <Text style={styles.filterChipTextBlack}>
                Free Plan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChipButton, accountTier.includes('Premium') || showBillingOptions ? styles.filterChipActive : styles.filterChipInactive]}
              onPress={() => handleSelectTierOption('Premium')}
            >
              <Text style={styles.filterChipTextBlack}>
                Premium Tier ✨
              </Text>
            </TouchableOpacity>
          </View>

          {/* DYNAMIC SUBSCRIPTION SUB-MENU INTERFACE PANELS */}
          {showBillingOptions && (
            <View style={styles.premiumConfigurationWrapper}>
              <View style={styles.innerGlassDivider} />
              
              <Text style={styles.premiumPanelHeading}>Select Premium Billing Options:</Text>
              
              {/* DYNAMICALLY EVALUATED MONTHLY PLAN CARD */}
              <TouchableOpacity 
                style={[
                  styles.billingPlanSelectorRowItem,
                  selectedBillingCycle === 'Monthly' && styles.billingPlanActive
                ]}
                activeOpacity={0.7}
                onPress={() => handleInitiatePaymentFlow('Monthly', '₱99/mo')}
              >
                <View style={styles.billingPlanTextGroup}>
                  <Text style={styles.billingPlanMainTitle}>Monthly Cycle Plan</Text>
                  <Text style={styles.billingPlanSubDescription}>Flexible recurring month-to-month access</Text>
                </View>
                <Text style={styles.billingPlanPriceBadgeText}>₱99 / Mo</Text>
              </TouchableOpacity>

              {/* DYNAMICALLY EVALUATED ANNUAL PLAN CARD */}
              <TouchableOpacity 
                style={[
                  styles.billingPlanSelectorRowItem,
                  { marginTop: 10 },
                  selectedBillingCycle === 'Annual' && styles.billingPlanActive
                ]}
                activeOpacity={0.7}
                onPress={() => handleInitiatePaymentFlow('Annual', '₱1,069/yr')}
              >
                <View style={styles.billingPlanTextGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.billingPlanMainTitle, selectedBillingCycle === 'Annual' ? { color: '#37745D' } : { color: '#1A2B23' }]}>Annual Cycle Plan</Text>
                    <View style={styles.bestValueBadge}><Text style={styles.bestValueBadgeText}>SAVE 10%</Text></View>
                  </View>
                  <Text style={styles.billingPlanSubDescription}>Full 12-month access built with a 10% discount margin</Text>
                </View>
                <Text style={[styles.billingPlanPriceBadgeText, selectedBillingCycle === 'Annual' ? { color: '#37745D' } : { color: '#41544B' }]}>₱1,069 / Yr</Text>
              </TouchableOpacity>

              {/* PREMIUM FEATURE BREAKDOWNS COMPONENT */}
              <View style={styles.premiumFeatureDetailsBox}>
                <View style={styles.featureDetailsHeadingFlexRow}>
                  <Sparkles color="#37745D" size={14} style={{ marginRight: 6 }} />
                  <Text style={styles.premiumDetailsHeadingText}>Premium Feature Inclusions Detail</Text>
                </View>
                
                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color="#4EA685" size={12} style={styles.bulletCheckIconSpacer} />
                  <Text style={styles.featureBulletBodyText}>Advanced Adaptive AI Meal Plan Adaptations & Micronutrient Overlays</Text>
                </View>
                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color="#4EA685" size={12} style={styles.bulletCheckIconSpacer} />
                  <Text style={styles.featureBulletBodyText}>Unlimited Deep-Tier Chatbot Prompts with MacroSync Smart Assistance</Text>
                </View>
                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color="#4EA685" size={12} style={styles.bulletCheckIconSpacer} />
                  <Text style={styles.featureBulletBodyText}>Exclusive Custom Home Exercise Variations and Advanced Posture Tutorials</Text>
                </View>
                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color="#4EA685" size={12} style={styles.bulletCheckIconSpacer} />
                  <Text style={styles.featureBulletBodyText}>Detailed Nutritional Breakdown Analysis and Calorie Track Analytics Report Charts</Text>
                </View>
                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color="#4EA685" size={12} style={styles.bulletCheckIconSpacer} />
                  <Text style={styles.featureBulletBodyText}>Priority Access to Newly Released Diet Recipes and Specialty Local Food Profiles</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* NOTIFICATIONS SETTINGS CARD */}
        <Text style={styles.sectionLabelTitle}>Notification Settings</Text>
        <View style={styles.formCard}>
          <View style={styles.settingSwitchRowItem}>
            <View style={styles.settingIconTextGroup}>
              <Bell color={logoGreen} size={18} style={styles.settingRowIconSpacer} />
              <View>
                <Text style={styles.settingRowItemMainTitle}>Meal Reminders</Text>
                <Text style={styles.settingRowItemSubTitle}>Alert me when macros are due for entry</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#D4E2DC', true: '#65D8AD' }}
              thumbColor={mealReminders ? logoGreen : '#AEC2B7'}
              ios_backgroundColor="#D4E2DC"
              onValueChange={setMealReminders}
              value={mealReminders}
            />
          </View>

          <View style={styles.glassDivider} />

          <View style={styles.settingSwitchRowItem}>
            <View style={styles.settingIconTextGroup}>
              <SportShoe color={logoGreen} size={18} style={styles.settingRowIconSpacer} />
              <View>
                <Text style={styles.settingRowItemMainTitle}>Workout Alerts</Text>
                <Text style={styles.settingRowItemSubTitle}>Daily push indicators for home tutorials</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#D4E2DC', true: '#65D8AD' }}
              thumbColor={workoutAlerts ? logoGreen : '#AEC2B7'}
              ios_backgroundColor="#D4E2DC"
              onValueChange={setWorkoutAlerts}
              value={workoutAlerts}
            />
          </View>

          <View style={styles.glassDivider} />

          <View style={styles.settingSwitchRowItem}>
            <View style={styles.settingIconTextGroup}>
              <BotMessageSquare color={logoGreen} size={18} style={styles.settingRowIconSpacer} />
              <View>
                <Text style={styles.settingRowItemMainTitle}>AI Guidance Insights</Text>
                <Text style={styles.settingRowItemSubTitle}>Real-time advice matching profile progress</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#D4E2DC', true: '#65D8AD' }}
              thumbColor={aiSuggestions ? logoGreen : '#AEC2B7'}
              ios_backgroundColor="#D4E2DC"
              onValueChange={setAiSuggestions}
              value={aiSuggestions}
            />
          </View>

          <View style={styles.glassDivider} />

          <View style={styles.settingSwitchRowItem}>
            <View style={styles.settingIconTextGroup}>
              <Smartphone color={logoGreen} size={18} style={styles.settingRowIconSpacer} />
              <View>
                <Text style={styles.settingRowItemMainTitle}>System Sound Effects</Text>
                <Text style={styles.settingRowItemSubTitle}>Play audio tones on successful targets</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#D4E2DC', true: '#65D8AD' }}
              thumbColor={systemSounds ? logoGreen : '#AEC2B7'}
              ios_backgroundColor="#D4E2DC"
              onValueChange={setSystemSounds}
              value={systemSounds}
            />
          </View>
        </View>

        {/* PREFERENCES & APPLICATION SECURITY UTILITIES */}
        <Text style={styles.sectionLabelTitle}>System Preferences</Text>
        <View style={styles.formCard}>
          <TouchableOpacity style={styles.settingActionRowLinkItem} activeOpacity={0.7}>
            <View style={styles.settingIconTextGroup}>
              <Sliders color="#556B60" size={18} style={styles.settingRowIconSpacer} />
              <Text style={styles.settingLinkItemTitleText}>Macro & Calorie Target Adjustments</Text>
            </View>
            <ChevronRight color="#7FA293" size={16} />
          </TouchableOpacity>

          <View style={styles.glassDivider} />

          <TouchableOpacity style={styles.settingActionRowLinkItem} activeOpacity={0.7}>
            <View style={styles.settingIconTextGroup}>
              <Shield color="#556B60" size={18} style={styles.settingRowIconSpacer} />
              <Text style={styles.settingLinkItemTitleText}>Privacy Guard & Data Management</Text>
            </View>
            <ChevronRight color="#7FA293" size={16} />
          </TouchableOpacity>

          <View style={styles.glassDivider} />

          <TouchableOpacity style={styles.settingActionRowLinkItem} activeOpacity={0.7}>
            <View style={styles.settingIconTextGroup}>
              <CircleHelp color="#556B60" size={18} style={styles.settingRowIconSpacer} />
              <Text style={styles.settingLinkItemTitleText}>Technical Documentation & Support</Text>
            </View>
            <ChevronRight color="#7FA293" size={16} />
          </TouchableOpacity>
        </View>

        {/* BOTTOM UTILITY BUTTON ACTIONS */}
        <TouchableOpacity 
          style={styles.saveSettingsPrimaryButton} 
          activeOpacity={0.8}
          onPress={handleSavePreferences}
        >
          <Text style={styles.saveSettingsButtonText}>Save Account Preferences</Text>
        </TouchableOpacity>

        {/* LOGOUT BUTTON WITH ROUTING REDIRECT METRICS */}
        <TouchableOpacity 
          style={styles.logOutSecondaryNeuButton} 
          activeOpacity={0.8}
          onPress={handleLogOut}
        >
          <LogOut color="#C53030" size={16} style={{ marginRight: 6 }} />
          <Text style={styles.logOutButtonText}>Log Out Account Session</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* --- FLOATING AI CHATBOT SYSTEM --- */}
      <View style={styles.floatingChatbotContainer}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => handlePressIn('chatbot')}
          onPressOut={handlePressOut}
          onPress={() => onTabChange && onTabChange('CHATBOT')}
          style={[
            styles.chatbotFloatingButton,
            isPressedBtn === 'chatbot' ? styles.chatbotPressed : styles.chatbotUnpressed
          ]}
        >
          <BotMessageSquare color="#FFFFFF" size={26} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <View style={styles.navBarOuterEdge}>
        <View style={styles.navBarContentRow}>
          
          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('DASHBOARD')}
          >
            <Home color="#7FA293" size={22} strokeWidth={2.5} />
            <Text style={styles.navTabText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('DIET')}
          >
            <UtensilsCrossed color="#7FA293" size={22} strokeWidth={2.5} />
            <Text style={styles.navTabText}>Diet & Recipes</Text>
          </TouchableOpacity>

          {/* --- SCAN FOOD CENTER CAMERA PROTRUDING BUTTON --- */}
          <View style={styles.centerCameraContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
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

          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('WORKOUT')}
          >
            <SportShoe color="#7FA293" size={22} strokeWidth={2.5} />
            <Text style={styles.navTabText}>Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navTabItem} 
            activeOpacity={0.7}
            onPress={() => onTabChange && onTabChange('SETTINGS')}
          >
            <Settings color={logoGreen} size={22} strokeWidth={2.5} />
            <Text style={[styles.navTabText, { color: logoGreen }]}>Settings</Text>
          </TouchableOpacity>

        </View>
      </View>

    </View>
  );
}

const baseColor = '#F0F4F2';           
const clearWhiteHighlight = '#FFFFFF';    
const softGreenShadow = '#AEC2B7';      
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
    marginBottom: 16, 
    paddingHorizontal: 4, 
    width: '100%',
  },
  headerTextGroup: { 
    flex: 1,
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
  profileFormCard: {
    backgroundColor: baseColor, 
    borderRadius: 32, 
    padding: 20, 
    marginBottom: 20,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 6, height: 6 }, 
    shadowOpacity: 1, 
    shadowRadius: 8, 
    elevation: 4,    
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  profileUserRow: {
    flexDirection: 'row', 
    alignItems: 'center',
  },
  avatarNeuOuterBox: {
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: logoGreen,
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: logoDarkShadow, 
    shadowOffset: { width: 2, height: 4 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 4, 
    elevation: 3,
  },
  profileMetadataTextGroup: {
    flex: 1, 
    marginLeft: 14,
  },
  profileUserNameText: {
    fontSize: 18, 
    fontWeight: '900', 
    color: '#21332A',
  },
  profileUserSubText: {
    fontSize: 11, 
    fontWeight: '700', 
    color: '#556B60', 
    marginTop: 2,
  },
  profileMetricsMiniGrid: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 2,
  },
  profileMetricMiniBox: {
    flex: 1, 
    alignItems: 'center',
  },
  profileMetricMiniValue: {
    fontSize: 14, 
    fontWeight: '900', 
    color: '#1A2B23',
  },
  profileMetricMiniLabel: {
    fontSize: 10, 
    fontWeight: '700', 
    color: '#7FA293', 
    marginTop: 1,
  },
  formCard: {
    backgroundColor: baseColor, 
    borderRadius: 28, 
    paddingHorizontal: 18, 
    paddingVertical: 14, 
    marginBottom: 16, 
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 6, height: 6 }, 
    shadowOpacity: 1, 
    shadowRadius: 8, 
    elevation: 4,    
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  sectionLabelTitle: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#21332A', 
    marginBottom: 10, 
    marginLeft: 4, 
    letterSpacing: -0.2,
  },
  glassDivider: { 
    height: 1, 
    backgroundColor: '#D4E2DC', 
    marginVertical: 10,
  },
  innerGlassDivider: {
    height: 1,
    backgroundColor: '#D4E2DC',
    marginVertical: 14,
  },
  settingSwitchRowItem: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 6, 
    width: '100%',
  },
  settingIconTextGroup: {
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    paddingRight: 10,
  },
  settingRowIconSpacer: {
    marginRight: 12,
  },
  settingRowItemMainTitle: {
    fontSize: 14, 
    fontWeight: '800', 
    color: '#1A2B23',
  },
  settingRowItemSubTitle: {
    fontSize: 11, 
    fontWeight: '600', 
    color: '#7FA293', 
    marginTop: 1,
  },
  settingActionRowLinkItem: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    width: '100%',
  },
  settingLinkItemTitleText: {
    fontSize: 13, 
    fontWeight: '800', 
    color: '#33443C',
  },
  premiumConfigurationWrapper: {
    width: '100%',
  },
  premiumPanelHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#41544B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  billingPlanSelectorRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBF2EE',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4E2DC',
    width: '100%',
  },
  billingPlanActive: {
    borderColor: logoGreen,
    borderWidth: 1.5,
  },
  billingPlanTextGroup: {
    flex: 1,
    paddingRight: 8,
  },
  billingPlanMainTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1A2B23',
  },
  billingPlanSubDescription: {
    fontSize: 11,
    fontWeight: '600',
    color: '#556B60',
    marginTop: 2,
  },
  billingPlanPriceBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#41544B',
  },
  bestValueBadge: {
    backgroundColor: '#4EA685',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  bestValueBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  premiumFeatureDetailsBox: {
    backgroundColor: '#F4F7F5',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4E2DC',
    marginTop: 14,
    width: '100%',
  },
  featureDetailsHeadingFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  premiumDetailsHeadingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#37745D',
  },
  featureBulletRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    width: '100%',
  },
  bulletCheckIconSpacer: {
    marginRight: 8,
    marginTop: 3,
  },
  featureBulletBodyText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#33443C',
    lineHeight: 16,
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
    borderWidth: 1, 
    borderColor: '#D4E2DC',
  },
  filterChipInactive: { 
    backgroundColor: baseColor,
  },
  filterChipActive: { 
    backgroundColor: baseColor, 
    borderColor: logoGreen,
    borderWidth: 1.5,
  },
  filterChipTextBlack: { 
    fontSize: 12, 
    fontWeight: '800',
    color: '#1A2B23',
  },
  saveSettingsPrimaryButton: {
    backgroundColor: logoGreen, 
    paddingVertical: 14, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 6,
    shadowColor: logoDarkShadow, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 5, 
    elevation: 3,
  },
  saveSettingsButtonText: {
    fontSize: 14, 
    fontWeight: '900', 
    color: '#FFFFFF',
  },
  logOutSecondaryNeuButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: baseColor, 
    paddingVertical: 14, 
    borderRadius: 16, 
    marginTop: 12,
    borderWidth: 1, 
    borderColor: '#D4E2DC',
  },
  logOutButtonText: {
    fontSize: 13, 
    fontWeight: '800', 
    color: '#C53030',
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