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
  Switch,
  Alert,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { Camera, UtensilsCrossed, BotMessageSquare, Home, SportShoe, Settings, User, Bell, Shield, CircleHelp, LogOut, ChevronRight, Sliders, Smartphone, CheckCircle2, Sparkles, Moon, Sun, Flame, Droplets, Activity, Eye, EyeOff, Wallet, CreditCard, Crown } from 'lucide-react-native';
import API_URL from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from '../../services/NotificationService';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';
import { clearSavedUserId } from '../../services/OfflineStorage';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function SettingsScreen({ onTabChange, userProfile, setUserProfile, userId }) {
  const { showAlert } = useCustomAlert();
  const { isDarkMode, themeMode, setThemeMode, toggleTheme, theme } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [isPressedBtn, setIsPressedBtn] = useState(null);


  // --- EDIT PROFILE MODAL STATE ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempImage, setTempImage] = useState(null);

  // --- CHANGE PASSWORD STATE ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- PASSWORD VISIBILITY STATE ---
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- PAYMENT FLOW STATE ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState({ name: '', price: '' });
  const [selectedMethod, setSelectedMethod] = useState(null); // 'gcash' | 'maya' | 'card'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleOpenEditModal = () => {
    setTempName(userProfile?.name || '');
    setTempImage(userProfile?.profileImage || null);
    setShowEditModal(true);
  };


  const handleOpenPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handlePickTempImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(
          "Permission Denied",
          "You need to allow gallery access to select a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setTempImage(localUri);
      }
    } catch (error) {
      if (__DEV__) console.log("Error picking image:", error);
      showAlert("Error", "Could not pick image from gallery.");
    }
  };

  const handleSaveProfile = async () => {
    if (!tempName.trim()) {
      showAlert("Validation Error", "Name cannot be empty.");
      return;
    }

    try {
      const currentEmail = userProfile?.email || '';
      // ⚡ INSTANT OPTIMISTIC UI UPDATE
      if (setUserProfile) {
        setUserProfile(prev => ({
          ...prev,
          name: tempName.trim(),
          profileImage: tempImage
        }));
      }
      setShowEditModal(false);
      setTimeout(() => {
        showAlert("Success", "Profile updated!");
      }, 250);

      // Background network sync
      (async () => {
        try {
          await fetch(`${API_URL}/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              name: tempName.trim(),
              email: userProfile?.email
            }),
          });

          if (tempImage && tempImage !== userProfile?.profileImage) {
            await fetch(`${API_URL}/update-profile-picture`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                profile_image: tempImage
              }),
            });
          }
        } catch (e) {
          if (__DEV__) console.log("Background profile sync error:", e);
        }
      })();
    } catch (error) {
      if (__DEV__) console.error("UPDATE PROFILE ERROR:", error);
      showAlert("Error", "Failed to update profile. Please try again.");
    }
  };

  const handlePickProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(
          "Permission Denied",
          "You need to allow gallery access to select a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        const selectedUri = 'data:image/jpeg;base64,' + result.assets[0].base64;

        // ⚡ INSTANT OPTIMISTIC UI UPDATE
        if (setUserProfile) {
          setUserProfile(prev => ({
            ...prev,
            profileImage: localUri
          }));
          showAlert("Success", "Profile picture updated!");
        }

        // Background sync to backend server
        fetch(`${API_URL}/update-profile-picture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            profile_image: selectedUri
          }),
        }).catch(err => __DEV__ && console.log("Background profile pic sync error:", err));
      }
    } catch (error) {
      if (__DEV__) console.log("Error picking profile image:", error);
      showAlert("Error", "Could not pick image from gallery.");
    }
  };

  // --- DYNAMIC INTERACTIVE SWITCH STATES ---
  const [habitReminders, setHabitReminders] = useState(true);
  const [motivationalUpdates, setMotivationalUpdates] = useState(true);
  const [personalizedAlerts, setPersonalizedAlerts] = useState(false);

  // Load saved notification switch preferences on mount
  useEffect(() => {
    const loadNotificationPrefs = async () => {
      try {
        const stored = await AsyncStorage.getItem('@ms_notification_preferences');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.habitReminders !== undefined) setHabitReminders(!!parsed.habitReminders);
          if (parsed.motivationalUpdates !== undefined) setMotivationalUpdates(!!parsed.motivationalUpdates);
          if (parsed.personalizedAlerts !== undefined) setPersonalizedAlerts(!!parsed.personalizedAlerts);
        }
      } catch (e) {
        if (__DEV__) console.log("Failed to load notification prefs:", e);
      }
    };
    loadNotificationPrefs();
  }, []);

  const saveAndUpdateNotificationPrefs = async (updatedPrefs) => {
    try {
      await AsyncStorage.setItem('@ms_notification_preferences', JSON.stringify(updatedPrefs));
      await NotificationService.scheduleDailyReminders(updatedPrefs);
    } catch (e) {
      if (__DEV__) console.log("Failed to save notification prefs:", e);
    }
  };

  const handleToggleHabitReminders = (val) => {
    setHabitReminders(val);
    saveAndUpdateNotificationPrefs({ habitReminders: val, motivationalUpdates, personalizedAlerts });
  };

  const handleToggleMotivationalUpdates = (val) => {
    setMotivationalUpdates(val);
    saveAndUpdateNotificationPrefs({ habitReminders, motivationalUpdates: val, personalizedAlerts });
  };

  const handleTogglePersonalizedAlerts = (val) => {
    setPersonalizedAlerts(val);
    saveAndUpdateNotificationPrefs({ habitReminders, motivationalUpdates, personalizedAlerts: val });
  };

  // --- DYNAMIC ACCOUNT TIERS & BILLING STATES ---
  const [accountTier, setAccountTier] = useState(userProfile?.isPremium ? 'Premium' : 'Free');
  const [showBillingOptions, setShowBillingOptions] = useState(false);
  
  // Tracks exactly which option ('Monthly' or 'Annual') has the active focus/outline
  const [selectedBillingCycle, setSelectedBillingCycle] = useState(null);

  useEffect(() => {
    setAccountTier(userProfile?.isPremium ? 'Premium' : 'Free');
  }, [userProfile?.isPremium]);

  const handlePressIn = (id) => setIsPressedBtn(id);
  const handlePressOut = () => setIsPressedBtn(null);

  // --- ACCOUNT TIER MANAGER ACTIONS ---
  const handleSelectTierOption = async (tierType) => {
    if (tierType === 'Free') {
      if (userProfile?.isPremium) {
        showAlert(
          "Cancel Subscription",
          "Are you sure you want to cancel your Premium subscription and revert to the Free tier (limits apply)?",
          [
            { text: "No", style: "cancel" },
            { 
              text: "Yes, Downgrade", 
              onPress: async () => {
                try {
                  const response = await fetch(`${API_URL}/update-subscription`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, is_premium: false })
                  });
                  if (response.ok) {
                    setUserProfile(prev => ({ ...prev, isPremium: false }));
                    setAccountTier('Free');
                    showAlert("Plan Updated", "Your subscription was cancelled. You are now on the Free Plan.");
                  } else {
                    showAlert("Error", "Failed to cancel subscription on server.");
                  }
                } catch (e) {
                  showAlert("Error", "Network connection failed. Cannot connect to server.");
                }
              }
            }
          ]
        );
      } else {
        setAccountTier('Free');
      }
    } else {
      setAccountTier('Premium');
    }
  };

  // --- TRIGGER PAYMENT HANDLER FOR FRONTEND FLOW ---
  const handleInitiatePaymentFlow = (planName, price) => {
    // Instantly apply the selection outline indicator visually
    setSelectedBillingCycle(planName);

    showAlert(
      "Confirm Payment Method",
      `Would you like to proceed with the ${planName} Plan (${price})?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setSelectedBillingCycle(null) },
        {
          text: "Proceed to Pay",
          onPress: async () => {
            try {
              const amount_cents = planName === 'Monthly' ? 14900 : 119900; // ₱149.00 or ₱1,199.00 (in cents)
              const response = await fetch(`${API_URL}/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  user_id: userId, 
                  amount: amount_cents,
                  description: `MacroSync Premium - ${planName} Plan`
                })
              });
              
              if (response.ok) {
                const data = await response.json();
                const checkoutUrl = data?.data?.attributes?.checkout_url;
                if (checkoutUrl) {
                  // Open the PayMongo checkout page in an in-app browser overlay
                  await WebBrowser.openBrowserAsync(checkoutUrl);
                  
                  showAlert(
                    "Checkout Opened",
                    "Please complete your payment securely on the PayMongo page. Once you pay, your account will be automatically upgraded to Premium!"
                  );
                } else {
                  if (__DEV__) console.log("PayMongo response:", data);
                  showAlert("Error", "Could not generate payment link.");
                }
              } else {
                showAlert("Error", "Failed to initiate payment on the server.");
                setSelectedBillingCycle(null);
              }
            } catch (e) {
              showAlert("Error", "Network connection failed. Cannot connect to server.");
              setSelectedBillingCycle(null);
            }
          }
        }
      ]
    );
  };

  const handleConfirmPayment = () => {
    if (!selectedMethod) {
      showAlert("Payment Method Required", "Please select a payment method to proceed.");
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      setUserProfile(prev => ({ ...prev, isPremium: true }));
      setAccountTier('Premium');
      setShowPaymentModal(false);
      setIsProcessingPayment(false);
    }, 1000);
  };


  const handleChangePassword = async () => {
    if (!oldPassword.trim()) {
      showAlert("Validation Error", "Please enter your current password.");
      return;
    }
    if (!newPassword.trim()) {
      showAlert("Validation Error", "Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      showAlert("Validation Error", "Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Validation Error", "New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(`${API_URL}/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          password: newPassword.trim(),
          current_password: oldPassword.trim()
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update password');
      }

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);

      // Clear saved offline user session for security
      try {
        await clearSavedUserId();
      } catch (err) {
        if (__DEV__) console.log("Clear saved session error:", err);
      }

      setTimeout(() => {
        showAlert(
          "Password Updated 🔒", 
          "Your password has been changed successfully. For your security, please sign in with your new password.",
          [
            {
              text: "Sign In Now",
              onPress: () => {
                if (onTabChange) {
                  onTabChange('AUTH');
                }
              }
            }
          ]
        );
      }, 250);
    } catch (error) {
      if (__DEV__) console.error("CHANGE PASSWORD ERROR:", error);
      showAlert("Error", error.message || "Failed to change password. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePreferences = () => {
    showAlert(
      "Preferences Saved",
      "Your profile metrics and notification thresholds have been synced successfully."
    );
  };

  // --- FULL LOGOUT SYSTEM WITH CONFIRMATION AND LOGIN REDIRECT ---
  const handleLogOut = () => {
    showAlert(
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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />
      
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
                <User color="#FFFFFF" size={38} strokeWidth={2.5} />
              )}
              <View style={{
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
                borderColor: theme?.surface || '#FFFFFF'
              }}>
                <Camera color="#FFFFFF" size={12} strokeWidth={2.5} />
              </View>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', borderRadius: 10, padding: 6, marginRight: 10 }}>
              <Sparkles color="#8B5CF6" size={18} />
            </View>
            <Text style={styles.cardTitle}>Select Target Membership Level</Text>
          </View>
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
              style={[
                styles.filterChipButton,
                accountTier === 'Premium'
                  ? { backgroundColor: '#10B981', borderColor: '#10B981', borderWidth: 1.5 }
                  : styles.filterChipInactive
              ]}
              onPress={() => handleSelectTierOption('Premium')}
            >
              <Crown color={accountTier === 'Premium' ? '#FFFFFF' : '#10B981'} size={13} style={{ marginRight: 4 }} />
              <Text style={[styles.filterChipText, accountTier === 'Premium' && { color: '#FFFFFF', fontWeight: '900' }]}>
                Premium Tier
              </Text>
            </TouchableOpacity>
          </View>

          {accountTier === 'Premium' && (
            <View style={styles.premiumConfigurationWrapper}>
              <View style={styles.innerGlassDivider} />
              
              {/* Premium Feature List (Visible for BOTH Monthly & Annual plans) */}
              <View style={[
                styles.premiumFeatureDetailsBox,
                isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }
              ]}>
                <View style={styles.featureDetailsHeadingFlexRow}>
                  <Crown color="#F59E0B" size={18} style={{ marginRight: 6 }} />
                  <Text style={[
                    styles.premiumDetailsHeadingText,
                    isDarkMode && { color: '#F8FAFC' }
                  ]}>MacroSync Premium Benefits</Text>
                </View>
                
                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color={logoGreen} size={15} style={styles.bulletCheckIconSpacer} />
                  <Text style={[
                    styles.featureBulletBodyText,
                    isDarkMode && { color: '#94A3B8' }
                  ]}>Unlimited AI Food Camera & Gallery Photo Analysis</Text>
                </View>
                
                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color={logoGreen} size={15} style={styles.bulletCheckIconSpacer} />
                  <Text style={[
                    styles.featureBulletBodyText,
                    isDarkMode && { color: '#94A3B8' }
                  ]}>Unlimited Vita AI 24/7 Health, Macro & Workout Guidance</Text>
                </View>
              </View>

              <Text style={styles.premiumPanelHeading}>Select Billing Frequency</Text>
              
              {/* Monthly Plan */}
              <TouchableOpacity 
                style={[
                  styles.billingPlanSelectorRowItem,
                  selectedBillingCycle === 'Monthly' && styles.billingPlanActive,
                  { marginBottom: 12 }
                ]}
                onPress={() => handleInitiatePaymentFlow('Monthly', '₱149/mo')}
              >
                <View style={styles.billingPlanTextGroup}>
                  <Text style={styles.billingPlanMainTitle}>Monthly Membership</Text>
                  <Text style={styles.billingPlanSubDescription}>Billed monthly. Cancel anytime with one tap.</Text>
                </View>
                <Text style={styles.billingPlanPriceBadgeText}>₱149/mo</Text>
              </TouchableOpacity>

              {/* Annual Plan */}
              <TouchableOpacity 
                style={[
                  styles.billingPlanSelectorRowItem,
                  selectedBillingCycle === 'Annual' && styles.billingPlanActive
                ]}
                onPress={() => handleInitiatePaymentFlow('Annual', '₱1,199/yr')}
              >
                <View style={styles.billingPlanTextGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.billingPlanMainTitle}>Annual Membership</Text>
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueBadgeText}>SAVE 33%</Text>
                    </View>
                  </View>
                  <Text style={styles.billingPlanSubDescription}>₱1,199/year (~₱99/mo). Best value for long-term health!</Text>
                </View>
                <Text style={styles.billingPlanPriceBadgeText}>₱1,199/yr</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* APP THEME SETTINGS CARD */}
        <Text style={styles.sectionLabelTitle}>App Appearance</Text>
        <View style={styles.formCard}>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.settingRowItemMainTitle}>Theme Mode</Text>
            <Text style={styles.settingRowItemSubTitle}>
              {themeMode === 'system'
                ? `System Default (${isDarkMode ? 'Dark' : 'Light'})`
                : themeMode === 'dark'
                ? 'Dark Theme Enabled'
                : 'Light Theme Enabled'}
            </Text>
          </View>

          {/* 3-Option Segmented Selector */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: theme?.inputBg || '#F1F5F9',
            borderRadius: 14,
            padding: 4,
            borderWidth: 1,
            borderColor: theme?.border || '#E2E8F0',
          }}>
            {[
              { id: 'system', label: 'System', icon: <Smartphone size={15} color={themeMode === 'system' ? '#FFFFFF' : (theme?.textSecondary || '#94A3B8')} /> },
              { id: 'light',  label: 'Light',  icon: <Sun size={15} color={themeMode === 'light' ? '#FFFFFF' : (theme?.textSecondary || '#94A3B8')} /> },
              { id: 'dark',   label: 'Dark',   icon: <Moon size={15} color={themeMode === 'dark' ? '#FFFFFF' : (theme?.textSecondary || '#94A3B8')} /> },
            ].map((mode) => {
              const isActive = themeMode === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: isActive ? (theme?.primary || '#10B981') : 'transparent',
                  }}
                  activeOpacity={0.8}
                  onPress={() => setThemeMode(mode.id)}
                >
                  <View style={{ marginRight: 6 }}>{mode.icon}</View>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: isActive ? '#FFFFFF' : (theme?.textSecondary || '#94A3B8'),
                  }}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* NOTIFICATIONS SETTINGS CARD */}
        <Text style={styles.sectionLabelTitle}>Notification Settings</Text>
        <View style={styles.formCard}>
          <View style={styles.settingActionRowItem}>
            <View style={styles.settingIconTextGroup}>
              <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: 10, padding: 7, marginRight: 12 }}>
                <Bell color={'#10B981'} size={16} />
              </View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.settingRowItemMainTitle}>Habit & Routine Reminders</Text>
                <Text style={styles.settingRowItemSubTitle}>Automated reminders for meals, hydration, calories, and workouts</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#10B981' }}
              thumbColor={habitReminders ? '#10B981' : '#64748B'}
              ios_backgroundColor={'#E2E8F0'}
              onValueChange={handleToggleHabitReminders}
              value={habitReminders}
            />
          </View>

          <View style={styles.glassDivider} />

          <View style={styles.settingActionRowItem}>
            <View style={styles.settingIconTextGroup}>
              <View style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', borderRadius: 10, padding: 7, marginRight: 12 }}>
                <Flame color={'#F97316'} size={16} />
              </View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.settingRowItemMainTitle}>Motivational Updates</Text>
                <Text style={styles.settingRowItemSubTitle}>Updates on achievements, completed workouts, and step milestones</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#10B981' }}
              thumbColor={motivationalUpdates ? '#10B981' : '#64748B'}
              ios_backgroundColor={'#E2E8F0'}
              onValueChange={handleToggleMotivationalUpdates}
              value={motivationalUpdates}
            />
          </View>

          <View style={styles.glassDivider} />

          <View style={styles.settingActionRowItem}>
            <View style={styles.settingIconTextGroup}>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', borderRadius: 10, padding: 7, marginRight: 12 }}>
                <Sparkles color={'#8B5CF6'} size={16} />
              </View>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.settingRowItemMainTitle}>Personalized Smart Alerts</Text>
                <Text style={styles.settingRowItemSubTitle}>Adjusted based on your behavior, goals, and daily routines</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#10B981' }}
              thumbColor={personalizedAlerts ? '#10B981' : '#64748B'}
              ios_backgroundColor={'#E2E8F0'}
              onValueChange={handleTogglePersonalizedAlerts}
              value={personalizedAlerts}
            />
          </View>
        </View>

        {/* SECURITY SETTINGS CARD */}
        <Text style={styles.sectionLabelTitle}>Account Security</Text>
        <View style={styles.formCard}>

          <TouchableOpacity 
            style={styles.settingActionRowItem} 
            onPress={handleOpenPasswordModal}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconTextGroup}>
              <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', borderRadius: 10, padding: 7, marginRight: 12 }}>
                <Shield color={'#F59E0B'} size={16} />
              </View>
              <View>
                <Text style={styles.settingRowItemMainTitle}>Change Password</Text>
                <Text style={styles.settingRowItemSubTitle}>Update your password securely</Text>
              </View>
            </View>
            <ChevronRight color={'#94A3B8'} size={16} />
          </TouchableOpacity>


        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={[styles.logOutSecondaryNeuButton, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)', borderWidth: 1.2 }]} onPress={handleLogOut}>
          <LogOut color={'#EF4444'} size={18} style={{ marginRight: 8 }} />
          <Text style={[styles.logOutButtonText, { color: '#EF4444', fontWeight: '800' }]}>Log Out</Text>
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
              placeholderTextColor="#CBD5E1"
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


      {/* --- CHANGE PASSWORD MODAL --- */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPasswordModal(false);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowOldPassword(false);
          setShowNewPassword(false);
          setShowConfirmPassword(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.modalSubtitle}>Enter password details below</Text>

            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordTextInput}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter current password"
                placeholderTextColor="#CBD5E1"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showOldPassword}
              />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} activeOpacity={0.7}>
                {showOldPassword ? (
                  <Eye color="#94A3B8" size={20} />
                ) : (
                  <EyeOff color="#94A3B8" size={20} />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordTextInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#CBD5E1"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} activeOpacity={0.7}>
                {showNewPassword ? (
                  <Eye color="#94A3B8" size={20} />
                ) : (
                  <EyeOff color="#94A3B8" size={20} />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordTextInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#CBD5E1"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} activeOpacity={0.7}>
                {showConfirmPassword ? (
                  <Eye color="#94A3B8" size={20} />
                ) : (
                  <EyeOff color="#94A3B8" size={20} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
               <TouchableOpacity 
                 style={styles.modalCancel} 
                 onPress={() => {
                   setShowPasswordModal(false);
                   setOldPassword('');
                   setNewPassword('');
                   setConfirmPassword('');
                   setShowOldPassword(false);
                   setShowNewPassword(false);
                   setShowConfirmPassword(false);
                 }}
               >
                 <Text style={styles.modalCancelText}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={styles.modalSave} 
                 onPress={handleChangePassword}
                 disabled={isChangingPassword}
               >
                 <Text style={styles.modalSaveText}>
                   {isChangingPassword ? "Saving..." : "Change"}
                 </Text>
               </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* --- PAYMENT METHOD SELECTOR MODAL --- */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPaymentModal(false);
          setSelectedBillingCycle(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <Text style={styles.modalSubtitle}>
              Checkout for Premium {paymentPlan.name} Plan ({paymentPlan.price})
            </Text>

            {/* GCash Option */}
            <TouchableOpacity 
              style={[
                styles.paymentMethodOption,
                selectedMethod === 'gcash' && styles.paymentMethodActive
              ]}
              onPress={() => setSelectedMethod('gcash')}
              activeOpacity={0.8}
            >
              <View style={{ width: 32, height: 24, borderRadius: 6, backgroundColor: 'rgba(0, 85, 254, 0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Smartphone color="#0055FE" size={16} strokeWidth={2.5} />
              </View>
              <Text style={styles.paymentMethodText}>GCash</Text>
            </TouchableOpacity>

            {/* Maya Option */}
            <TouchableOpacity 
              style={[
                styles.paymentMethodOption,
                selectedMethod === 'maya' && styles.paymentMethodActive
              ]}
              onPress={() => setSelectedMethod('maya')}
              activeOpacity={0.8}
            >
              <View style={{ width: 32, height: 24, borderRadius: 6, backgroundColor: 'rgba(16, 185, 129, 0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Wallet color="#10B981" size={16} strokeWidth={2.5} />
              </View>
              <Text style={styles.paymentMethodText}>Maya</Text>
            </TouchableOpacity>

            {/* Card Option */}
            <TouchableOpacity 
              style={[
                styles.paymentMethodOption,
                selectedMethod === 'card' && styles.paymentMethodActive
              ]}
              onPress={() => setSelectedMethod('card')}
              activeOpacity={0.8}
            >
              <View style={{ width: 32, height: 24, borderRadius: 6, backgroundColor: 'rgba(16, 185, 129, 0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <CreditCard color="#10B981" size={16} strokeWidth={2.5} />
              </View>
              <Text style={styles.paymentMethodText}>Credit or Debit Card</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
               <TouchableOpacity 
                 style={styles.modalCancel} 
                 onPress={() => {
                   setShowPaymentModal(false);
                   setSelectedBillingCycle(null);
                 }}
               >
                 <Text style={styles.modalCancelText}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.modalSave, !selectedMethod && styles.modalSaveDisabled]} 
                 onPress={handleConfirmPayment}
                 disabled={!selectedMethod || isProcessingPayment}
               >
                 <Text style={styles.modalSaveText}>
                   {isProcessingPayment ? "Processing..." : "Pay Now"}
                 </Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- BOTTOM NAVIGATION BAR --- */}
    </View>
  );
}

           
    
      
        
   
 

const baseColor = '#F8FAFC';
const logoGreen = '#10B981';        

const getStyles = (theme, isDarkModePassed) => {
  const isDarkMode = isDarkModePassed ?? (theme?.isDarkMode || theme?.mode === 'dark');
  return StyleSheet.create({
  fullscreenOverlay: { 
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0, 
    width: screenWidth, 
    height: screenHeight, 
    backgroundColor: isDarkMode ? '#0F172A' : (theme?.background || baseColor),
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
    color: isDarkMode ? '#F8FAFC' : (theme?.textPrimary || '#0F172A'), 
    letterSpacing: -0.5,
  },
  subGreeting: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: isDarkMode ? '#94A3B8' : (theme?.textSecondary || '#64748B'), 
    marginTop: 2,
  },
  profileFormCard: {
    backgroundColor: isDarkMode ? '#1E293B' : (theme?.surface || baseColor), 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 24, 
    borderWidth: 1.2, 
    borderColor: isDarkMode ? '#334155' : (theme?.border || '#E2E8F0'),
    shadowOpacity: 0,
    elevation: 0,
  },
  profileUserRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarNeuOuterBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: isDarkMode ? '#334155' : (theme?.border || '#E2E8F0'),
    position: 'relative',
  },
  avatarImageLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profileMetadataTextGroup: {
    alignItems: 'center',
  },
  profileUserNameText: {
    fontSize: 18,
    fontWeight: '900',
    color: isDarkMode ? '#F8FAFC' : (theme?.textPrimary || '#0F172A'),
    marginBottom: 2,
    textAlign: 'center',
  },
  profileUserSubText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDarkMode ? '#94A3B8' : (theme?.textSecondary || '#94A3B8'),
    textAlign: 'center',
  },
  glassDivider: { 
    height: 1, 
    backgroundColor: isDarkMode ? '#334155' : (theme?.border || '#E2E8F0'), 
    marginVertical: 12,
  },
  innerGlassDivider: {
    height: 1,
    backgroundColor: isDarkMode ? '#334155' : (theme?.border || '#E2E8F0'),
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
    color: isDarkMode ? '#F8FAFC' : (theme?.textPrimary || '#0F172A'),
    marginBottom: 2,
  },
  profileMetricMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: isDarkMode ? '#94A3B8' : (theme?.textSecondary || '#94A3B8'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabelTitle: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: isDarkMode ? '#F8FAFC' : (theme?.textPrimary || '#0F172A'), 
    marginBottom: 12, 
    marginLeft: 4, 
    letterSpacing: -0.2,
  },
  formCard: {
    backgroundColor: isDarkMode ? '#1E293B' : (theme?.surface || baseColor), 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 24, 
    borderWidth: 1.2, 
    borderColor: isDarkMode ? '#334155' : (theme?.border || '#E2E8F0'),
    shadowOpacity: 0,
    elevation: 0,
  },
  cardTitle: { 
    fontSize: 11, 
    color: isDarkMode ? '#F8FAFC' : (theme?.textPrimary || '#0F172A'), 
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
    backgroundColor: isDarkMode ? '#0F172A' : (theme?.surface || baseColor),
    borderWidth: 1.2, 
    borderColor: isDarkMode ? '#334155' : (theme?.border || '#E2E8F0'),
    shadowOpacity: 0,
    elevation: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipInactive: { 
    backgroundColor: isDarkMode ? '#0F172A' : (theme?.surface || baseColor),
  },
  filterChipActive: { 
    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', 
    borderWidth: 1.5,
    borderColor: logoGreen,
    shadowOpacity: 0,
    elevation: 0,
  },
  filterChipText: { 
    fontSize: 12, 
    fontWeight: '800',
    color: isDarkMode ? '#94A3B8' : (theme?.textSecondary || '#94A3B8'),
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
    color: theme?.textSecondary || '#94A3B8',
    marginBottom: 10,
  },
  billingPlanSelectorRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme?.surface || baseColor,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
  },
  billingPlanActive: {
    borderColor: logoGreen,
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.06)',
    borderWidth: 1.5,
  },
  billingPlanTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  billingPlanMainTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    marginBottom: 4,
  },
  billingPlanSubDescription: {
    fontSize: 11,
    fontWeight: '600',
    color: theme?.textSecondary || '#64748B',
    lineHeight: 16,
  },
  billingPlanPriceBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: logoGreen,
  },
  bestValueBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  bestValueBadgeText: {
    color: '#F59E0B',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  premiumFeatureDetailsBox: {
    marginTop: 16,
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  featureDetailsHeadingFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  premiumDetailsHeadingText: {
    fontSize: 12,
    fontWeight: '900',
    color: isDarkMode ? '#F8FAFC' : '#0F172A',
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
    color: isDarkMode ? '#94A3B8' : '#475569',
    lineHeight: 18,
  },
  settingSwitchRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme?.border || '#E2E8F0',
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
    color: theme?.textPrimary || '#0F172A',
    marginBottom: 2,
  },
  settingRowItemSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme?.textSecondary || '#94A3B8',
  },
  systemActionNeuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme?.surface || baseColor,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1.5, 
    borderColor: theme?.border || '#E2E8F0',
  },
  systemActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme?.textPrimary || '#0F172A',
    marginLeft: 8,
  },
  dangerActionBtnText: {
    color: '#64748B',
  },
  dangerActionNeuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme?.cardBg || '#F8FAFC',
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  logOutSecondaryNeuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme?.surface || baseColor,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 14,
    marginTop: 12,
    borderWidth: 1.5, 
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  logOutButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme?.error || '#64748B',
  },
  versionInfoFooterText: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: theme?.textSecondary || '#CBD5E1',
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
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  chatbotPressed: { 
    backgroundColor: '#059669',
    transform: [{ scale: 0.95 }],
  },

  editProfileButton: {
    marginTop: 10,
    backgroundColor: theme?.surface || '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: theme?.border || '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileButtonText: {
    color: logoGreen,
    fontSize: 12,
    fontWeight: '800',
  },
modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: theme?.surface || baseColor, borderRadius: 20, padding: 24, borderWidth: 1.5, borderColor: theme?.border || '#E2E8F0' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: logoGreen, marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: theme?.textSecondary || '#94A3B8', textAlign: 'center', marginBottom: 20 },
  modalInput: { width: '100%', backgroundColor: theme?.inputBg || '#FFFFFF', borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '600', color: theme?.textPrimary || '#0F172A', marginBottom: 16, borderWidth: 1, borderColor: theme?.inputBorder || '#E2E8F0' },
  passwordInputContainer: { width: '100%', backgroundColor: theme?.inputBg || '#FFFFFF', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderWidth: 1, borderColor: theme?.inputBorder || '#E2E8F0', paddingRight: 14 },
  passwordTextInput: { flex: 1, padding: 14, fontSize: 16, fontWeight: '600', color: theme?.textPrimary || '#0F172A' },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 8 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme?.cardBg || '#FFFFFF', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: theme?.border || '#E2E8F0' },
  modalCancelText: { color: theme?.textSecondary || '#94A3B8', fontWeight: '700', fontSize: 14 },
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
    borderColor: theme?.surface || '#FFFFFF',
    shadowOpacity: 0,
    elevation: 0,
  },
  settingActionRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme?.inputBg || '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  paymentMethodActive: {
    borderColor: logoGreen,
    backgroundColor: theme?.cardBg || '#EBEBEB',
  },
  paymentLogoImage: {
    width: 60,
    height: 24,
    marginRight: 16,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme?.textPrimary || '#0F172A',
  },
  modalSaveDisabled: {
    backgroundColor: '#CBD5E1',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme?.textSecondary || '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
});
};