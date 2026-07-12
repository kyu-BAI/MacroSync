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
import { Camera, UtensilsCrossed, BotMessageSquare, Home, SportShoe, Settings, User, Bell, Shield, CircleHelp, LogOut, ChevronRight, Sliders, Smartphone, CheckCircle2, Sparkles, Moon, Sun, Flame, Droplets, Activity, Mail, Eye, EyeOff } from 'lucide-react-native';
import API_URL from '../config/api';

const GcashLogo = require('../../images/Gcash.png');
const MayaLogo = require('../../images/Maya.png');
const CardLogo = require('../../images/CreditDebitCard.png');
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function SettingsScreen({ onTabChange, userProfile, setUserProfile, userId }) {
  const styles = getStyles();
  const [isPressedBtn, setIsPressedBtn] = useState(null);

  // --- EDIT PROFILE MODAL STATE ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempImage, setTempImage] = useState(null);

  // --- CHANGE EMAIL STATE ---
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [tempAuthEmail, setTempAuthEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // --- CHANGE PASSWORD STATE ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- PASSWORD VISIBILITY STATE ---
  const [showEmailPassword, setShowEmailPassword] = useState(false);
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

  const handleOpenEmailModal = () => {
    setTempAuthEmail('');
    setEmailCurrentPassword('');
    setShowEmailModal(true);
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
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64Data = 'data:image/jpeg;base64,' + result.assets[0].base64;
        setTempImage(base64Data);
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

    try {
      const currentEmail = userProfile?.email || '';
      const response = await fetch(`${API_URL}/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          name: tempName.trim(),
          email: currentEmail
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile on server');
      }

      if (tempImage && tempImage !== userProfile?.profileImage) {
        const picResponse = await fetch(`${API_URL}/update-profile-picture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            profile_image: tempImage
          }),
        });

        if (!picResponse.ok) {
          throw new Error('Failed to update profile picture on server');
        }
      }

      if (setUserProfile) {
        setUserProfile(prev => ({
          ...prev,
          name: tempName.trim(),
          profileImage: tempImage
        }));
        setShowEditModal(false);
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (error) {
      console.error("UPDATE PROFILE ERROR:", error);
      Alert.alert("Error", "Failed to update profile. Please check your network and try again.");
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
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = 'data:image/jpeg;base64,' + result.assets[0].base64;
        
        const response = await fetch(`${API_URL}/update-profile-picture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            profile_image: selectedUri
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update profile picture on server');
        }

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
        Alert.alert(
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
                    Alert.alert("Plan Updated", "Your subscription was cancelled. You are now on the Free Plan.");
                  } else {
                    Alert.alert("Error", "Failed to cancel subscription on server.");
                  }
                } catch (e) {
                  Alert.alert("Error", "Network connection failed. Cannot connect to server.");
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

    Alert.alert(
      "Confirm Payment Method",
      `Would you like to proceed with the ${planName} Plan (${price})?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setSelectedBillingCycle(null) },
        {
          text: "Proceed to Pay",
          onPress: async () => {
            try {
              const amount_cents = planName === 'Monthly' ? 19900 : 202980; // Multiply by 100 to get cents
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
                  
                  Alert.alert(
                    "Checkout Opened",
                    "Please complete your payment securely on the PayMongo page. Once you pay, your account will be automatically upgraded to Premium!"
                  );
                } else {
                  console.log("PayMongo response:", data);
                  Alert.alert("Error", "Could not generate payment link.");
                }
              } else {
                Alert.alert("Error", "Failed to initiate payment on the server.");
                setSelectedBillingCycle(null);
              }
            } catch (e) {
              Alert.alert("Error", "Network connection failed. Cannot connect to server.");
              setSelectedBillingCycle(null);
            }
          }
        }
      ]
    );
  };

  const handleConfirmPayment = () => {
    if (!selectedMethod) {
      Alert.alert("Payment Method Required", "Please select a payment method to proceed.");
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

  const handleChangeEmail = async () => {
    if (!tempAuthEmail.trim()) {
      Alert.alert("Validation Error", "Please enter a new email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tempAuthEmail.trim())) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return;
    }
    if (tempAuthEmail.trim().toLowerCase() === (userProfile?.email || '').toLowerCase()) {
      Alert.alert("Validation Error", "New email is the same as your current email.");
      return;
    }
    if (!emailCurrentPassword.trim()) {
      Alert.alert("Validation Error", "Please enter your current password to authorize this email update.");
      return;
    }

    setIsChangingEmail(true);
    try {
      const response = await fetch(`${API_URL}/update-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          new_email: tempAuthEmail.trim().toLowerCase(),
          current_password: emailCurrentPassword.trim()
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update email address');
      }

      if (setUserProfile) {
        setUserProfile(prev => ({
          ...prev,
          email: tempAuthEmail.trim().toLowerCase()
        }));
      }

      Alert.alert("Success", "Email address updated successfully! Please use this new email to log in next time.");
      setTempAuthEmail('');
      setEmailCurrentPassword('');
      setShowEmailModal(false);
    } catch (error) {
      console.error("CHANGE EMAIL ERROR:", error);
      Alert.alert("Error", error.message || "Failed to update email. Please try again.");
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword.trim()) {
      Alert.alert("Validation Error", "Please enter your current password.");
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert("Validation Error", "Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Validation Error", "Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Validation Error", "New passwords do not match.");
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

      Alert.alert("Success", "Password updated successfully!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);
      Alert.alert("Error", error.message || "Failed to change password. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
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
                Premium Tier
              </Text>
            </TouchableOpacity>
          </View>

          {accountTier === 'Premium' && (
            <View style={styles.premiumConfigurationWrapper}>
              <View style={styles.innerGlassDivider} />
              
              <Text style={styles.premiumPanelHeading}>Select Billing Frequency</Text>
              
              {/* Monthly Plan */}
              <TouchableOpacity 
                style={[
                  styles.billingPlanSelectorRowItem,
                  selectedBillingCycle === 'Monthly' && styles.billingPlanActive,
                  { marginBottom: 12 }
                ]}
                onPress={() => handleInitiatePaymentFlow('Monthly', '₱199/mo')}
              >
                <View style={styles.billingPlanTextGroup}>
                  <Text style={styles.billingPlanMainTitle}>Monthly Membership</Text>
                  <Text style={styles.billingPlanSubDescription}>Billed monthly. Cancel anytime with one tap.</Text>
                </View>
                <Text style={styles.billingPlanPriceBadgeText}>₱199/mo</Text>
              </TouchableOpacity>

              {/* Annual Plan */}
              <TouchableOpacity 
                style={[
                  styles.billingPlanSelectorRowItem,
                  selectedBillingCycle === 'Annual' && styles.billingPlanActive
                ]}
                onPress={() => handleInitiatePaymentFlow('Annual', '₱2,029.80/yr')}
              >
                <View style={styles.billingPlanTextGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.billingPlanMainTitle}>Annual Membership</Text>
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueBadgeText}>SAVE 15%</Text>
                    </View>
                  </View>
                  <Text style={styles.billingPlanSubDescription}>Billed annually. Unlimited scans and chats forever.</Text>
                </View>
                <Text style={styles.billingPlanPriceBadgeText}>₱2,029.80/yr</Text>
              </TouchableOpacity>

              {/* Premium Feature List */}
              <View style={styles.premiumFeatureDetailsBox}>
                <View style={styles.featureDetailsHeadingFlexRow}>
                  <Sparkles color={logoGreen} size={16} style={{ marginRight: 6 }} />
                  <Text style={styles.premiumDetailsHeadingText}>Premium Benefits</Text>
                </View>
                
                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color={logoGreen} size={14} style={styles.bulletCheckIconSpacer} />
                  <Text style={styles.featureBulletBodyText}>Unlimited smart food scanner usage (AI vision analysis)</Text>
                </View>
                
                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color={logoGreen} size={14} style={styles.bulletCheckIconSpacer} />
                  <Text style={styles.featureBulletBodyText}>Unlimited chatbot queries & nutrition planning</Text>
                </View>

                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color={logoGreen} size={14} style={styles.bulletCheckIconSpacer} />
                  <Text style={styles.featureBulletBodyText}>Priority generation speeds and backup model availability</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* NOTIFICATIONS SETTINGS CARD */}
        <Text style={styles.sectionLabelTitle}>Notification Settings</Text>
        <View style={styles.formCard}>
          <View style={styles.settingActionRowItem}>
            <View style={styles.settingIconTextGroup}>
              <Bell color={'#4EA685'} size={18} style={styles.settingRowIconSpacer} />
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.settingRowItemMainTitle}>Habit & Routine Reminders</Text>
                <Text style={styles.settingRowItemSubTitle}>Automated reminders for meals, hydration, calories, and workouts</Text>
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

          <View style={styles.settingActionRowItem}>
            <View style={styles.settingIconTextGroup}>
              <Flame color={'#4EA685'} size={18} style={styles.settingRowIconSpacer} />
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.settingRowItemMainTitle}>Motivational Updates</Text>
                <Text style={styles.settingRowItemSubTitle}>Updates on achievements, completed workouts, and step milestones</Text>
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

          <View style={styles.settingActionRowItem}>
            <View style={styles.settingIconTextGroup}>
              <Sparkles color={'#4EA685'} size={18} style={styles.settingRowIconSpacer} />
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.settingRowItemMainTitle}>Personalized Smart Alerts</Text>
                <Text style={styles.settingRowItemSubTitle}>Adjusted based on your behavior, goals, and daily routines</Text>
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

        {/* SECURITY SETTINGS CARD */}
        <Text style={styles.sectionLabelTitle}>Security & Account</Text>
        <View style={styles.formCard}>
          <TouchableOpacity 
            style={styles.settingActionRowItem} 
            onPress={handleOpenEmailModal}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconTextGroup}>
              <Mail color={'#4EA685'} size={18} style={styles.settingRowIconSpacer} />
              <View>
                <Text style={styles.settingRowItemMainTitle}>Change Email Address</Text>
                <Text style={styles.settingRowItemSubTitle}>Update your login email address securely</Text>
              </View>
            </View>
            <ChevronRight color={'#7FA293'} size={16} />
          </TouchableOpacity>

          <View style={styles.glassDivider} />

          <TouchableOpacity 
            style={styles.settingActionRowItem} 
            onPress={handleOpenPasswordModal}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconTextGroup}>
              <Shield color={'#4EA685'} size={18} style={styles.settingRowIconSpacer} />
              <View>
                <Text style={styles.settingRowItemMainTitle}>Change Password</Text>
                <Text style={styles.settingRowItemSubTitle}>Update your password securely</Text>
              </View>
            </View>
            <ChevronRight color={'#7FA293'} size={16} />
          </TouchableOpacity>
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

      {/* --- CHANGE EMAIL MODAL --- */}
      <Modal
        visible={showEmailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowEmailModal(false);
          setTempAuthEmail('');
          setEmailCurrentPassword('');
          setShowEmailPassword(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Change Email</Text>
            <Text style={styles.modalSubtitle}>Enter details below to update your email address</Text>

            <Text style={styles.inputLabel}>Current Email</Text>
            <View style={[styles.modalInput, { backgroundColor: 'rgba(30, 60, 50, 0.6)', justifyContent: 'center' }]}>
              <Text style={{ color: '#AEC2B7', fontSize: 14 }}>{userProfile?.email || 'No email set'}</Text>
            </View>

            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordTextInput}
                value={emailCurrentPassword}
                onChangeText={setEmailCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#AEC2B7"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showEmailPassword}
              />
              <TouchableOpacity onPress={() => setShowEmailPassword(!showEmailPassword)} activeOpacity={0.7}>
                {showEmailPassword ? (
                  <Eye color="#7FA293" size={20} />
                ) : (
                  <EyeOff color="#7FA293" size={20} />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>New Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={tempAuthEmail}
              onChangeText={setTempAuthEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#AEC2B7"
            />

            <View style={styles.modalButtons}>
               <TouchableOpacity 
                 style={styles.modalCancel} 
                 onPress={() => {
                   setShowEmailModal(false);
                   setTempAuthEmail('');
                   setEmailCurrentPassword('');
                   setShowEmailPassword(false);
                 }}
               >
                 <Text style={styles.modalCancelText}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={styles.modalSave} 
                 onPress={handleChangeEmail}
                 disabled={isChangingEmail}
               >
                 <Text style={styles.modalSaveText}>
                   {isChangingEmail ? "Saving..." : "Change"}
                 </Text>
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
                placeholderTextColor="#AEC2B7"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showOldPassword}
              />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} activeOpacity={0.7}>
                {showOldPassword ? (
                  <Eye color="#7FA293" size={20} />
                ) : (
                  <EyeOff color="#7FA293" size={20} />
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
                placeholderTextColor="#AEC2B7"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} activeOpacity={0.7}>
                {showNewPassword ? (
                  <Eye color="#7FA293" size={20} />
                ) : (
                  <EyeOff color="#7FA293" size={20} />
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
                placeholderTextColor="#AEC2B7"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} activeOpacity={0.7}>
                {showConfirmPassword ? (
                  <Eye color="#7FA293" size={20} />
                ) : (
                  <EyeOff color="#7FA293" size={20} />
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
              <Image 
                source={GcashLogo} 
                style={styles.paymentLogoImage} 
                resizeMode="contain"
              />
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
              <Image 
                source={MayaLogo} 
                style={styles.paymentLogoImage} 
                resizeMode="contain"
              />
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
              <Image 
                source={CardLogo} 
                style={styles.paymentLogoImage} 
                resizeMode="contain"
              />
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
    width: 120,
    height: 120,
    borderRadius: 60,
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
    width: 120,
    height: 120,
    borderRadius: 60,
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
    backgroundColor: '#FFFFFF', 
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 5, 
    elevation: 3,
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
    borderWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
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
    borderWidth: 1.5, 
    borderTopColor: '#FFFFFF', 
    borderLeftColor: '#FFFFFF',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
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
    borderWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
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
  passwordInputContainer: { width: '100%', backgroundColor: clearWhiteHighlight, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderWidth: 1, borderColor: '#D4E2DC', paddingRight: 14 },
  passwordTextInput: { flex: 1, padding: 14, fontSize: 16, fontWeight: '600', color: '#1A2B23' },
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
  settingActionRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: clearWhiteHighlight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#D4E2DC',
    shadowColor: softGreenShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentMethodActive: {
    borderColor: logoGreen,
    backgroundColor: '#E6EFEA',
  },
  paymentLogoImage: {
    width: 60,
    height: 24,
    marginRight: 16,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#21332A',
  },
  modalSaveDisabled: {
    backgroundColor: '#AEC2B7',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7FA293',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 2,
  },
});
