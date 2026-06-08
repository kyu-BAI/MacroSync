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
  Alert,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, UtensilsCrossed, BotMessageSquare, Home, SportShoe, Settings, User, Bell, Shield, CircleHelp, LogOut, ChevronRight, Sliders, Smartphone, CheckCircle2, Sparkles, Moon, Sun, Flame, Droplets, Activity } from 'lucide-react-native';
import DraggableChatbotButton from '../../components/DraggableChatbotButton';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function SettingsScreen({ onTabChange, userProfile, setUserProfile, userId }) {
  const styles = getStyles();
  const [isPressedBtn, setIsPressedBtn] = useState(null);

  // --- EDIT PROFILE MODAL STATE ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempImage, setTempImage] = useState(null);

  const handleOpenEditModal = () => {
    setTempName(userProfile?.name || '');
    setTempEmail(userProfile?.email || '');
    setTempImage(userProfile?.profileImage || null);
    setShowEditModal(true);
  };

  const handlePickTempImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          "You need to allow gallery access to select a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setTempImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Could not pick image from gallery.");
    }
  };

  const handleSaveProfile = async () => {
    if (!tempName.trim()) {
      Alert.alert("Validation Error", "Name cannot be empty.");
      return;
    }
    if (!tempEmail.trim()) {
      Alert.alert("Validation Error", "Email cannot be empty.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          name: tempName.trim(),
          email: tempEmail.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile on server');
      }

      if (setUserProfile) {
        setUserProfile({
          name: tempName.trim(),
          email: tempEmail.trim(),
          profileImage: tempImage
        });
        setShowEditModal(false);
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (error) {
      console.error("UPDATE PROFILE ERROR:", error);
      Alert.alert("Error", "Failed to update profile on the server. Please try again.");
    }
  };

  const handlePickProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied",
          "You need to allow gallery access to select a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        if (setUserProfile) {
          setUserProfile(prev => ({
            ...prev,
            profileImage: selectedUri
          }));
          Alert.alert("Success", "Profile picture updated successfully!");
        }
      }
    } catch (error) {
      console.log("Error picking profile image:", error);
      Alert.alert("Error", "Could not pick image from gallery.");
    }
  };

  // --- DYNAMIC INTERACTIVE SWITCH STATES ---
  const [habitReminders, setHabitReminders] = useState(true);
  const [motivationalUpdates, setMotivationalUpdates] = useState(true);
  const [personalizedAlerts, setPersonalizedAlerts] = useState(false);

  // --- DYNAMIC ACCOUNT TIERS & BILLING STATES ---
  const [accountTier, setAccountTier] = useState('Free');
  const [showBillingOptions, setShowBillingOptions] = useState(false);
  
  // Tracks exactly which option ('Monthly' or 'Annual') has the active focus/outline
  const [selectedBillingCycle, setSelectedBillingCycle] = useState(null);

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);

  // --- ACCOUNT TIER MANAGER ACTIONS ---
  const handleSelectTierOption = (tierType) => {
    setAccountTier(tierType);
    if (tierType === 'Free') {
      Alert.alert("Plan Updated", "You are currently on the Free Plan.");
    } else {
      Alert.alert("Coming Soon", "Premium plan details and pricing will be available soon. Stay tuned!");
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
            <TouchableOpacity 
              onPress={handlePickProfileImage} 
              activeOpacity={0.85} 
              style={styles.avatarNeuOuterBox}
            >
              {userProfile?.profileImage ? (
                <Image 
                  source={{ uri: userProfile.profileImage }} 
                  style={styles.avatarImageLarge} 
                />
              ) : (
                <User color="#FFFFFF" size={48} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
            <View style={styles.profileMetadataTextGroup}>
              <Text style={styles.profileUserNameText}>{userProfile?.name || 'User Account'}</Text>
              <Text style={styles.profileUserSubText}>{userProfile?.email || 'MacroSync Active Member'}</Text>
              <TouchableOpacity 
                style={styles.editProfileButton} 
                onPress={handleOpenEditModal}
                activeOpacity={0.75}
              >
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </TouchableOpacity>
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
              <Text style={[styles.filterChipText, accountTier === 'Free' && styles.filterChipTextActive]}>
                Free Plan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChipButton, accountTier === 'Premium' ? styles.filterChipActive : styles.filterChipInactive]}
              onPress={() => handleSelectTierOption('Premium')}
            >
              <Text style={[styles.filterChipText, accountTier === 'Premium' && styles.filterChipTextActive]}>
                Premium Tier ✨
              </Text>
            </TouchableOpacity>
          </View>

          {accountTier === 'Premium' && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.innerGlassDivider} />
              <Text style={[styles.premiumPanelHeading, { textAlign: 'center', color: '#7FA293' }]}>
                🚀 Premium plan details coming soon!
              </Text>
            </View>
          )}
        </View>

        {/* NOTIFICATIONS SETTINGS CARD */}
        <Text style={styles.sectionLabelTitle}>Notification Settings</Text>
        <View style={styles.formCard}>
          <View style={styles.settingSwitchRowItem}>
            <View style={styles.settingIconTextGroup}>
              <Bell color={'#4EA685'} size={18} style={styles.settingRowIconSpacer} />
              <View>
                <Text style={styles.settingRowItemMainTitle}>Habit & Routine Reminders</Text>
                <Text style={[styles.settingRowItemSubTitle, { width: 220 }]}>Automated reminders for meals, hydration, calories, and workouts</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#D4E2DC', true: '#4EA685' }}
              thumbColor={habitReminders ? '#4EA685' : '#556B60'}
              ios_backgroundColor={'#D4E2DC'}
              onValueChange={setHabitReminders}
              value={habitReminders}
            />
          </View>

          <View style={styles.glassDivider} />

          <View style={styles.settingSwitchRowItem}>
            <View style={styles.settingIconTextGroup}>
              <Flame color={'#4EA685'} size={18} style={styles.settingRowIconSpacer} />
              <View>
                <Text style={styles.settingRowItemMainTitle}>Motivational Updates</Text>
                <Text style={[styles.settingRowItemSubTitle, { width: 220 }]}>Updates on achievements, completed workouts, and step milestones</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#D4E2DC', true: '#4EA685' }}
              thumbColor={motivationalUpdates ? '#4EA685' : '#556B60'}
              ios_backgroundColor={'#D4E2DC'}
              onValueChange={setMotivationalUpdates}
              value={motivationalUpdates}
            />
          </View>

          <View style={styles.glassDivider} />

          <View style={styles.settingSwitchRowItem}>
            <View style={styles.settingIconTextGroup}>
              <Sparkles color={'#4EA685'} size={18} style={styles.settingRowIconSpacer} />
              <View>
                <Text style={styles.settingRowItemMainTitle}>Personalized Smart Alerts</Text>
                <Text style={[styles.settingRowItemSubTitle, { width: 220 }]}>Adjusted based on your behavior, goals, and daily routines</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#D4E2DC', true: '#4EA685' }}
              thumbColor={personalizedAlerts ? '#4EA685' : '#556B60'}
              ios_backgroundColor={'#D4E2DC'}
              onValueChange={setPersonalizedAlerts}
              value={personalizedAlerts}
            />
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logOutSecondaryNeuButton} onPress={handleLogOut}>
          <LogOut color={'#E53E3E'} size={18} style={{ marginRight: 8 }} />
          <Text style={styles.logOutButtonText}>Log Out</Text>
        </TouchableOpacity>
        
      </ScrollView>

      {/* --- EDIT PROFILE MODAL --- */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalSubtitle}>Update your personal details</Text>

            <TouchableOpacity 
              onPress={handlePickTempImage} 
              activeOpacity={0.8}
              style={[styles.avatarNeuOuterBox, { alignSelf: 'center', marginBottom: 20 }]}
            >
              {tempImage ? (
                <Image source={{ uri: tempImage }} style={styles.avatarImageLarge} />
              ) : (
                <User color="#FFFFFF" size={48} strokeWidth={2.5} />
              )}
              <View style={styles.cameraIconBadge}>
                <Camera color="#FFFFFF" size={12} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Username"
              placeholderTextColor="#AEC2B7"
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={tempEmail}
              onChangeText={setTempEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#AEC2B7"
            />

            <View style={styles.modalButtons}>
               <TouchableOpacity style={styles.modalCancel} onPress={() => setShowEditModal(false)}>
                 <Text style={styles.modalCancelText}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.modalSave} onPress={handleSaveProfile}>
                 <Text style={styles.modalSaveText}>Save</Text>
               </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <DraggableChatbotButton onPress={() => onTabChange && onTabChange('CHATBOT')} />

      {/* --- BOTTOM NAVIGATION BAR --- */}
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
  profileFormCard: {
    backgroundColor: baseColor, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 24, 
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
  profileUserRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarNeuOuterBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: logoDarkShadow, 
    shadowOffset: { width: 2, height: 4 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 5, 
    elevation: 4,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: logoLightHighlight,
    borderLeftColor: logoLightHighlight,
  },
  avatarImageLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileMetadataTextGroup: {
    alignItems: 'center',
  },
  profileUserNameText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#21332A',
    marginBottom: 2,
    textAlign: 'center',
  },
  profileUserSubText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7FA293',
    textAlign: 'center',
  },
  glassDivider: { 
    height: 1, 
    backgroundColor: '#D4E2DC', 
    marginVertical: 12,
  },
  innerGlassDivider: {
    height: 1,
    backgroundColor: '#D4E2DC',
    marginBottom: 12,
    marginTop: 4,
  },
  profileMetricsMiniGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileMetricMiniBox: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'transparent',
  },
  profileMetricMiniValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#21332A',
    marginBottom: 2,
  },
  profileMetricMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7FA293',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabelTitle: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#21332A', 
    marginBottom: 12, 
    marginLeft: 4, 
    letterSpacing: -0.2,
  },
  formCard: {
    backgroundColor: baseColor, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 24, 
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
    backgroundColor: '#FFFFFF', 
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4, 
    elevation: 2,
    borderWidth: 0,
  },
  filterChipText: { 
    fontSize: 12, 
    fontWeight: '800',
    color: '#7FA293',
  },
  filterChipTextActive: {
    color: logoGreen,
    fontWeight: '900',
  },
  premiumConfigurationWrapper: {
    marginTop: 6,
  },
  premiumPanelHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7FA293',
    marginBottom: 10,
  },
  billingPlanSelectorRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: baseColor,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4E2DC',
  },
  billingPlanActive: {
    borderColor: logoGreen,
    backgroundColor: '#E6EFEA',
    borderWidth: 1.5,
  },
  billingPlanTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  billingPlanMainTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#21332A',
    marginBottom: 4,
  },
  billingPlanSubDescription: {
    fontSize: 11,
    fontWeight: '600',
    color: '#556B60',
    lineHeight: 16,
  },
  billingPlanPriceBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#21332A',
  },
  bestValueBadge: {
    backgroundColor: '#E53E3E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  bestValueBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  premiumFeatureDetailsBox: {
    marginTop: 16,
    backgroundColor: '#E8F1EC',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D4E2DC',
  },
  featureDetailsHeadingFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  premiumDetailsHeadingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#21332A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featureBulletRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletCheckIconSpacer: {
    marginRight: 8,
    marginTop: 2,
  },
  featureBulletBodyText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#556B60',
    lineHeight: 18,
  },
  settingSwitchRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D4E2DC',
  },
  settingIconTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRowIconSpacer: {
    marginRight: 14,
  },
  settingRowItemMainTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#21332A',
    marginBottom: 2,
  },
  settingRowItemSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7FA293',
  },
  systemActionNeuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: baseColor,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 3, height: 3 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 4, 
    elevation: 3,
    borderTopWidth: 1, 
    borderLeftWidth: 1, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  systemActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#21332A',
    marginLeft: 8,
  },
  dangerActionBtnText: {
    color: '#E53E3E',
  },
  dangerActionNeuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEEEE',
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: '#F5A8A8', 
    shadowOffset: { width: 3, height: 3 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 4, 
    elevation: 2,
    borderTopWidth: 1, 
    borderLeftWidth: 1, 
    borderTopColor: '#FFFFFF', 
    borderLeftColor: '#FFFFFF',
  },
  logOutSecondaryNeuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: baseColor,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 14,
    marginTop: 12,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 3, height: 3 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 4, 
    elevation: 3,
    borderTopWidth: 1, 
    borderLeftWidth: 1, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  logOutButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E53E3E',
  },
  versionInfoFooterText: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: '#AEC2B7',
    marginBottom: 24,
    letterSpacing: 1,
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
    backgroundColor: logoGreen, 
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
    backgroundColor: logoGreen, 
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
  editProfileButton: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#D4E2DC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  editProfileButtonText: {
    color: logoGreen,
    fontSize: 12,
    fontWeight: '800',
  },
modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: baseColor, borderRadius: 20, padding: 24, shadowColor: softGreenShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: logoGreen, marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#7FA293', textAlign: 'center', marginBottom: 20 },
  modalInput: { width: '100%', backgroundColor: clearWhiteHighlight, borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '600', color: '#1A2B23', marginBottom: 16, borderWidth: 1, borderColor: '#D4E2DC' },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 8 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: clearWhiteHighlight, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#D4E2DC' },
  modalCancelText: { color: '#7FA293', fontWeight: '700', fontSize: 14 },
  modalSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: logoGreen, alignItems: 'center', marginLeft: 8 },
  modalSaveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: logoGreen,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
