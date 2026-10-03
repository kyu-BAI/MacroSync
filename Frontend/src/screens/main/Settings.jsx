// --- IMPORTS ---
import React, { useMemo, useCallback, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  Image,
  ActivityIndicator,
} from "react-native";
import {
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Smartphone,
  CheckCircle2,
  Sparkles,
  Moon,
  Sun,
  Flame,
  Crown,
  Pencil,
  FileText,
  Trash2,
  MapPin,
} from "lucide-react-native";

import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useCustomAlert } from "../../context/CustomAlertContext";
import useSettings from "../../hooks/useSettings";

import PressableCard from "../../components/PressableCard";
import PrivacyModal from "../../components/PrivacyModal";
import EditProfileModal from "../../components/settings/EditProfileModal";
import ChangePasswordModal from "../../components/settings/ChangePasswordModal";
import PaymentMethodModal from "../../components/settings/PaymentMethodModal";
import PhotoPreviewModal from "../../components/settings/PhotoPreviewModal";

// --- CONSTANTS & CONFIGURATION ---
const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

// Theme selector options
const THEME_OPTIONS = [
  { id: "system", label: "System", Icon: Smartphone },
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
];

// Language selector options
const LANGUAGE_OPTIONS = [
  { id: "English", label: "English" },
  { id: "Tagalog", label: "Tagalog" },
  { id: "Cebuano", label: "Cebuano" },
];

// --- LIGHTWEIGHT SUBCOMPONENTS ---

// Section title label
const SectionTitle = React.memo(function SectionTitle({ title, styles }) {
  return <Text style={styles.sectionLabelTitle}>{title}</Text>;
});

// Segmented 3-option control (Theme & Language)
const SegmentedSelector = React.memo(function SegmentedSelector({ options, selectedId, onSelect, theme, styles }) {
  return (
    <View style={styles.segmentedContainer}>
      {options.map((option) => {
        const isActive = selectedId === option.id;
        const IconComponent = option.Icon;
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.segmentedOption, isActive && styles.segmentedOptionActive]}
            activeOpacity={0.8}
            onPress={() => onSelect(option.id)}
          >
            {IconComponent ? (
              <View style={styles.segmentedIconContainer}>
                <IconComponent
                  size={15}
                  color={isActive ? COLORS.textWhite : COLORS.textMutedDark}
                />
              </View>
            ) : null}
            <Text style={[styles.segmentedOptionText, isActive && styles.segmentedOptionTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

// Notification toggle row with switch
const NotificationToggleRow = React.memo(function NotificationToggleRow({
  icon: IconComponent,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  value,
  onValueChange,
  isDarkMode = false,
  styles,
}) {
  return (
    <View style={styles.settingActionRowItem}>
      <View style={styles.settingIconTextGroup}>
        <View style={[styles.settingIconBadge, { backgroundColor: iconBgColor }]}>
          <IconComponent color={iconColor} size={16} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingRowItemMainTitle}>{title}</Text>
          <Text style={styles.settingRowItemSubTitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        trackColor={{ false: isDarkMode ? COLORS.borderDark : COLORS.borderLight, true: COLORS.logoGreen }}
        thumbColor={value ? COLORS.logoGreen : COLORS.textMuted}
        ios_backgroundColor={isDarkMode ? COLORS.borderDark : COLORS.borderLight}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );
});

// Setting action button row with chevron/spinner
const SettingActionRow = React.memo(function SettingActionRow({
  icon: IconComponent,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  onPress,
  disabled = false,
  isLoading = false,
  isDestructive = false,
  styles,
}) {
  return (
    <PressableCard
      scaleDown={0.97}
      style={styles.settingActionRowItem}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      <View style={styles.settingIconTextGroup}>
        <View style={[styles.settingIconBadge, { backgroundColor: iconBgColor }]}>
          <IconComponent color={iconColor} size={16} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingRowItemMainTitle, isDestructive && styles.destructiveText]}>{title}</Text>
          <Text style={styles.settingRowItemSubTitle}>{subtitle}</Text>
        </View>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.red} />
      ) : (
        <ChevronRight color={isDestructive ? COLORS.red : COLORS.textPlaceholder} size={16} />
      )}
    </PressableCard>
  );
});

// --- MAIN SETTINGS SCREEN ---

export default function SettingsScreen({ onTabChange, onLogout, userProfile, setUserProfile, userId }) {
  // Theme, language & alert contexts
  const { isDarkMode, themeMode, setThemeMode, theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { showAlert } = useCustomAlert();

  // Screen styling (memoized strictly on isDarkMode to avoid redundant StyleSheet creation)
  const styles = useMemo(() => getStyles(theme, isDarkMode), [isDarkMode]);

  // Language switch handler with localized notification alert
  const handleLanguageSelect = useCallback(
    (newLang) => {
      if (newLang === language) return;
      setLanguage(newLang);

      const alertDetails = {
        English: {
          title: "Language Updated",
          message: "Meal titles, recommendations, and recipes will now display in English.",
        },
        Tagalog: {
          title: "Na-update ang Wika",
          message: "Ang mga pangalan ng pagkain, rekomendasyon, at recipe ay ipapakita na sa Tagalog (Wikang Filipino).",
        },
        Cebuano: {
          title: "Na-update ang Sinultihan",
          message: "Ang mga ngalan sa pagkaon, rekomendasyon, ug mga recipe ipakita na sa Cebuano (Binisaya).",
        },
      };

      const details = alertDetails[newLang] || alertDetails.English;
      showAlert(details.title, details.message, [{ text: "OK", style: "default" }]);
    },
    [language, setLanguage, showAlert]
  );

  // Settings business logic hook: profile, password, billing, notifications & lifecycle
  const {
    getInitials,

    // Profile
    showEditModal,
    setShowEditModal,
    tempName,
    setTempName,
    tempImage,
    handleOpenEditModal,
    handleSaveProfile,
    handlePickTempImage,
    handleRemoveProfileImage,
    handleLaunchImagePicker,

    // Photo Preview
    showPhotoPreviewModal,
    setShowPhotoPreviewModal,
    imageError,
    setImageError,

    // Password
    showPasswordModal,
    setShowPasswordModal,
    isChangingPassword,
    handleOpenPasswordModal,
    handleChangePassword,

    // Subscription & Billing
    accountTier,
    selectedBillingCycle,
    showPaymentModal,
    setShowPaymentModal,
    paymentPlan,
    selectedMethod,
    setSelectedMethod,
    isProcessingPayment,
    handleSelectTierOption,
    handleInitiatePaymentFlow,
    handleConfirmPayment,

    // Notifications
    habitReminders,
    motivationalUpdates,
    personalizedAlerts,
    handleToggleHabitReminders,
    handleToggleMotivationalUpdates,
    handleTogglePersonalizedAlerts,

    // Account lifecycle
    handleLogOut,
    handleDeleteAccount,
    isDeletingAccount,

    // Privacy
    privacyModalVisible,
    setPrivacyModalVisible,
  } = useSettings({
    userProfile,
    setUserProfile,
    userId,
    onTabChange,
    onLogout,
  });

  // Track latest pinned location from storage
  const [storedPinnedLocation, setStoredPinnedLocation] = useState(null);

  const loadPinnedLocation = useCallback(async () => {
    try {
      const storedB = await AsyncStorage.getItem("ms_pinned_barangay");
      if (storedB) {
        try {
          const parsed = JSON.parse(storedB);
          const title =
            parsed.formattedTitle ||
            (parsed.barangay && parsed.city
              ? `Brgy. ${parsed.barangay}, ${parsed.city}`
              : parsed.city || parsed.barangay);
          if (title && typeof title === "string" && title.trim().length > 0) {
            setStoredPinnedLocation(title.trim());
            return;
          }
        } catch (_) {}
      }
      const storedDef = await AsyncStorage.getItem("@ms_default_location");
      if (storedDef) {
        try {
          const parsed = JSON.parse(storedDef);
          const title =
            parsed.address ||
            (parsed.city && parsed.province
              ? `${parsed.city}, ${parsed.province}`
              : parsed.city);
          if (title && typeof title === "string" && title.trim().length > 0) {
            setStoredPinnedLocation(title.trim());
            return;
          }
        } catch (_) {}
      }
      const fallback =
        userProfile?.address ||
        (userProfile?.city && userProfile?.province
          ? `${userProfile.city}, ${userProfile.province}`
          : userProfile?.city);
      if (fallback && typeof fallback === "string" && fallback.trim().length > 0) {
        setStoredPinnedLocation(fallback.trim());
      }
    } catch (_) {}
  }, [userProfile]);

  useEffect(() => {
    loadPinnedLocation();
    // Periodic check to capture any background pins from other tabs immediately
    const interval = setInterval(loadPinnedLocation, 1500);
    return () => clearInterval(interval);
  }, [loadPinnedLocation, showEditModal]);

  const handleOpenEditModalWithSync = useCallback(() => {
    loadPinnedLocation();
    handleOpenEditModal();
  }, [loadPinnedLocation, handleOpenEditModal]);

  /* remove everything in the screen */
  // return <View style={styles.fullscreenOverlay} />;

  return (
    <View style={styles.fullscreenOverlay}>
      {/* Top Status Bar */}
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Main Scrollable View */}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === "android"}
      >
        {/* Header Sector */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.appName}>MacroSync</Text>
            <Text style={styles.greeting}>Settings Hub</Text>
            <Text style={styles.subGreeting}>Customize your profile, preferences, and app experience</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileFormCard}>
          <View style={styles.profileUserRow}>
            {/* User Avatar */}
            <TouchableOpacity
              onPress={() => setShowPhotoPreviewModal(true)}
              activeOpacity={0.85}
              style={styles.avatarNeuOuterBox}
            >
              {userProfile?.profileImage && !imageError ? (
                <Image
                  source={{ uri: userProfile.profileImage }}
                  style={styles.avatarImageLarge}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.avatarFallbackBox}>
                  <Text style={styles.avatarFallbackText}>{getInitials(userProfile?.name)}</Text>
                </View>
              )}

              {/* Camera Badge */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleLaunchImagePicker();
                }}
                activeOpacity={0.8}
                style={styles.avatarEditBadge}
              >
                <Pencil color={COLORS.textWhite} size={14} strokeWidth={2.5} />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* User Info */}
            <View style={styles.profileMetadataTextGroup}>
              <Text style={styles.profileUserNameText}>{userProfile?.name || "User Account"}</Text>
              <Text style={styles.profileUserSubText}>{userProfile?.email || "MacroSync Active Member"}</Text>

              {Boolean(storedPinnedLocation || userProfile?.address || userProfile?.city) && (
                <View style={styles.locationBadgeRow}>
                  <MapPin color={COLORS.emerald} size={12} strokeWidth={2.5} style={{ marginRight: 4 }} />
                  <Text style={styles.locationBadgeText} numberOfLines={1}>
                    {storedPinnedLocation ||
                      userProfile?.address ||
                      (userProfile?.city
                        ? `${userProfile.city}${userProfile.province ? `, ${userProfile.province}` : ""}`
                        : "")}
                  </Text>
                </View>
              )}

              {/* Edit Profile Button */}
              <TouchableOpacity style={styles.editProfileButton} onPress={handleOpenEditModalWithSync} activeOpacity={0.75}>
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Subscription Tier Card */}
        <SectionTitle title="Account Subscription Tier" styles={styles} />
        <View style={styles.formCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.sparklesIconBadge}>
              <Sparkles color={COLORS.purple} size={18} />
            </View>
            <Text style={styles.cardTitle}>Select Target Membership Level</Text>
          </View>

          {/* Tier Chips */}
          <View style={styles.filterButtonGroupRow}>
            <TouchableOpacity
              style={[
                styles.filterChipButton,
                accountTier === "Free" ? styles.filterChipActive : styles.filterChipInactive,
              ]}
              onPress={() => handleSelectTierOption("Free")}
            >
              <Text style={[styles.filterChipText, accountTier === "Free" && styles.filterChipTextActive]}>
                Free Plan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChipButton,
                accountTier === "Premium" ? styles.filterChipPremiumActive : styles.filterChipInactive,
              ]}
              onPress={() => handleSelectTierOption("Premium")}
            >
              <Crown
                color={accountTier === "Premium" ? COLORS.textWhite : COLORS.logoGreen}
                size={13}
                style={styles.crownIconSpacer}
              />
              <Text
                style={[
                  styles.filterChipText,
                  accountTier === "Premium" && styles.filterChipPremiumTextActive,
                ]}
              >
                Premium Tier
              </Text>
            </TouchableOpacity>
          </View>

          {/* Premium Details */}
          {accountTier === "Premium" && (
            <View style={styles.premiumConfigurationWrapper}>
              <View style={styles.innerGlassDivider} />

              {/* Benefits Box */}
              <View style={[styles.premiumFeatureDetailsBox, isDarkMode && styles.premiumFeatureDetailsBoxDark]}>
                <View style={styles.featureDetailsHeadingFlexRow}>
                  <Crown color={COLORS.amber} size={18} style={styles.crownHeadingSpacer} />
                  <Text style={[styles.premiumDetailsHeadingText, isDarkMode && styles.textWhiteDark]}>
                    MacroSync Premium Benefits
                  </Text>
                </View>

                {/* AI Food Camera */}
                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color={COLORS.logoGreen} size={15} style={styles.bulletCheckIconSpacer} />
                  <Text style={[styles.featureBulletBodyText, isDarkMode && styles.textMutedDark]}>
                    Unlimited AI Food Camera & Gallery Photo Analysis
                  </Text>
                </View>

                {/* Vita AI Guidance */}
                <View style={styles.featureBulletRowItem}>
                  <CheckCircle2 color={COLORS.logoGreen} size={15} style={styles.bulletCheckIconSpacer} />
                  <Text style={[styles.featureBulletBodyText, isDarkMode && styles.textMutedDark]}>
                    Unlimited Vita AI 24/7 Health, Macro & Workout Guidance
                  </Text>
                </View>
              </View>

              {/* Billing Plans */}
              <Text style={styles.premiumPanelHeading}>Select Billing Frequency</Text>

              {/* Monthly Plan */}
              <TouchableOpacity
                style={[
                  styles.billingPlanSelectorRowItem,
                  selectedBillingCycle === "Monthly" && styles.billingPlanActive,
                  styles.marginBottom12,
                ]}
                onPress={() => handleInitiatePaymentFlow("Monthly", "₱149/mo")}
                disabled={isProcessingPayment}
              >
                <View style={styles.billingPlanTextGroup}>
                  <Text style={styles.billingPlanMainTitle}>Monthly Membership</Text>
                  <Text style={styles.billingPlanSubDescription}>Billed monthly. Cancel anytime with one tap.</Text>
                </View>
                {isProcessingPayment && selectedBillingCycle === "Monthly" ? (
                  <ActivityIndicator size="small" color={COLORS.logoGreen} />
                ) : (
                  <Text style={styles.billingPlanPriceBadgeText}>₱149/mo</Text>
                )}
              </TouchableOpacity>

              {/* Annual Plan */}
              <TouchableOpacity
                style={[
                  styles.billingPlanSelectorRowItem,
                  selectedBillingCycle === "Annual" && styles.billingPlanActive,
                ]}
                onPress={() => handleInitiatePaymentFlow("Annual", "₱1,199/yr")}
                disabled={isProcessingPayment}
              >
                <View style={styles.billingPlanTextGroup}>
                  <View style={styles.rowAlign}>
                    <Text style={styles.billingPlanMainTitle}>Annual Membership</Text>
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueBadgeText}>SAVE 33%</Text>
                    </View>
                  </View>
                  <Text style={styles.billingPlanSubDescription}>
                    ₱1,199/year (~₱99/mo). Best value for long-term health!
                  </Text>
                </View>
                {isProcessingPayment && selectedBillingCycle === "Annual" ? (
                  <ActivityIndicator size="small" color={COLORS.logoGreen} />
                ) : (
                  <Text style={styles.billingPlanPriceBadgeText}>₱1,199/yr</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Appearance Card */}
        <SectionTitle title="App Appearance" styles={styles} />
        <View style={styles.formCard}>
          <View style={styles.settingHeaderSpacing}>
            <Text style={styles.settingRowItemMainTitle}>Theme Mode</Text>
            <Text style={styles.settingRowItemSubTitle}>
              {themeMode === "system"
                ? `System Default (${isDarkMode ? "Dark" : "Light"})`
                : themeMode === "dark"
                ? "Dark Theme Enabled"
                : "Light Theme Enabled"}
            </Text>
          </View>

          {/* Theme Selector */}
          <SegmentedSelector
            options={THEME_OPTIONS}
            selectedId={themeMode}
            onSelect={setThemeMode}
            theme={theme}
            styles={styles}
          />
        </View>

        {/* Language Card */}
        <SectionTitle title="Language & Localization" styles={styles} />
        <View style={styles.formCard}>
          <View style={styles.settingHeaderSpacing}>
            <Text style={styles.settingRowItemMainTitle}>App Meal Language</Text>
            <Text style={styles.settingRowItemSubTitle}>
              {language === "English"
                ? "English (Default meal titles)"
                : language === "Tagalog"
                ? "Tagalog (Wikang Filipino)"
                : "Cebuano (Pinulongang Binisaya)"}
            </Text>
          </View>

          {/* Language Selector */}
          <SegmentedSelector
            options={LANGUAGE_OPTIONS}
            selectedId={language}
            onSelect={handleLanguageSelect}
            theme={theme}
            styles={styles}
          />
        </View>

        {/* Notification Settings Card */}
        <SectionTitle title="Notification Settings" styles={styles} />
        <View style={styles.formCard}>
          {/* Meal Reminders */}
          <NotificationToggleRow
            icon={Bell}
            iconColor={COLORS.logoGreen}
            iconBgColor={COLORS.greenAlpha}
            title="Meal & Hydration Reminders"
            subtitle="Daily reminders for breakfast, lunch, water, and dinner"
            value={habitReminders}
            onValueChange={handleToggleHabitReminders}
            isDarkMode={isDarkMode}
            styles={styles}
          />

          <View style={styles.glassDivider} />

          {/* Workout Prompts */}
          <NotificationToggleRow
            icon={Flame}
            iconColor={COLORS.orange}
            iconBgColor={COLORS.orangeAlpha}
            title="Workout & Activity Prompts"
            subtitle="Evening reminders to complete workouts and hit step goals"
            value={motivationalUpdates}
            onValueChange={handleToggleMotivationalUpdates}
            isDarkMode={isDarkMode}
            styles={styles}
          />

          <View style={styles.glassDivider} />

          {/* Macro Check-in */}
          <NotificationToggleRow
            icon={Sparkles}
            iconColor={COLORS.purple}
            iconBgColor={COLORS.purpleAlpha}
            title="Vita AI Macro Check-in"
            subtitle="Mid-day smart coaching to monitor daily calories and protein"
            value={personalizedAlerts}
            onValueChange={handleTogglePersonalizedAlerts}
            isDarkMode={isDarkMode}
            styles={styles}
          />
        </View>

        {/* Account Security Card */}
        <SectionTitle title="Account Security" styles={styles} />
        <View style={styles.formCard}>
          {/* Change Password */}
          <SettingActionRow
            icon={Shield}
            iconColor={COLORS.amber}
            iconBgColor={COLORS.amberAlpha}
            title="Change Password"
            subtitle="Update your password securely"
            onPress={handleOpenPasswordModal}
            styles={styles}
          />

          <View style={styles.glassDivider} />

          {/* Delete Account */}
          <SettingActionRow
            icon={Trash2}
            iconColor={COLORS.red}
            iconBgColor={COLORS.redAlpha}
            title={isDeletingAccount ? "Deleting Account..." : "Delete Account"}
            subtitle="Permanently erase your data & profile"
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
            isLoading={isDeletingAccount}
            isDestructive={true}
            styles={styles}
          />
        </View>

        {/* Legal & Health Policy Card */}
        <SectionTitle title="Legal & Health Policy" styles={styles} />
        <View style={styles.formCard}>
          <SettingActionRow
            icon={FileText}
            iconColor={COLORS.logoGreen}
            iconBgColor={COLORS.greenAlpha}
            title="Privacy Policy & Medical Scope"
            subtitle="RA 10173 data privacy & clinical terms"
            onPress={() => setPrivacyModalVisible(true)}
            styles={styles}
          />
        </View>

        {/* Log Out Button */}
        <PressableCard
          scaleDown={0.96}
          style={styles.logOutSecondaryNeuButton}
          onPress={handleLogOut}
        >
          <LogOut color={COLORS.red} size={18} style={styles.logoutIconSpacer} />
          <Text style={styles.logOutButtonText}>Log Out</Text>
        </PressableCard>
      </ScrollView>

      {/* Modal Dialogs */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          loadPinnedLocation();
        }}
        tempName={tempName}
        setTempName={setTempName}
        tempImage={tempImage}
        userProfile={userProfile}
        initialPinnedLocation={storedPinnedLocation}
        getInitials={getInitials}
        onPickImage={handlePickTempImage}
        onSave={async (locationPayload) => {
          await handleSaveProfile(locationPayload);
          loadPinnedLocation();
        }}
        styles={styles}
      />

      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        isChangingPassword={isChangingPassword}
        onChangePassword={handleChangePassword}
        styles={styles}
      />

      <PaymentMethodModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentPlan={paymentPlan}
        selectedMethod={selectedMethod}
        setSelectedMethod={setSelectedMethod}
        isProcessingPayment={isProcessingPayment}
        onConfirmPayment={handleConfirmPayment}
        styles={styles}
      />

      <PhotoPreviewModal
        visible={showPhotoPreviewModal}
        onClose={() => setShowPhotoPreviewModal(false)}
        userProfile={userProfile}
        imageError={imageError}
        setImageError={setImageError}
        getInitials={getInitials}
        screenWidth={screenWidth}
        onChangePhoto={handleLaunchImagePicker}
        onRemovePhoto={handleRemoveProfileImage}
      />

      <PrivacyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
        initialTab="medical"
      />
    </View>
  );
}

// ============================================================================
// --- COMPONENT STYLES & COLOR CONFIGURATION ---
// ============================================================================
const COLORS = {
  // Main Backgrounds
  base: "#F8FAFC",
  bgDark: "#0F172A",

  // Cards & Surfaces
  cardLight: "#FFFFFF",
  cardDark: "#1E293B",
  surfaceLight: "#FFFFFF",
  surfaceDark: "#1E293B",

  // Brand Green & Accents
  logoGreen: "#10B981",
  greenAlpha: "rgba(16, 185, 129, 0.12)",
  greenAlphaSubtle: "rgba(16, 185, 129, 0.06)",
  greenAlphaBorder: "rgba(16, 185, 129, 0.30)",
  greenHighlight: "rgba(16, 185, 129, 0.08)",
  greenBenefitBorder: "rgba(16, 185, 129, 0.20)",

  // Typography
  textDark: "#0F172A",
  textLight: "#F8FAFC",
  textMuted: "#64748B",
  textMutedDark: "#94A3B8",
  textPlaceholder: "#94A3B8",
  textWhite: "#FFFFFF",
  textSlate: "#475569",

  // Borders & Dividers
  borderLight: "#E2E8F0",
  borderDark: "#334155",
  inputBorderLight: "#CBD5E1",
  inputBorderDark: "#334155",
  pillLight: "#F1F5F9",

  // Accent Colors & Badges
  purple: "#8B5CF6",
  purpleAlpha: "rgba(139, 92, 246, 0.12)",
  amber: "#F59E0B",
  amberAlpha: "rgba(245, 158, 11, 0.12)",
  orange: "#F97316",
  orangeAlpha: "rgba(249, 115, 22, 0.12)",
  red: "#EF4444",
  redAlpha: "rgba(239, 68, 68, 0.12)",
  redAlphaBorder: "rgba(239, 68, 68, 0.25)",
  redAlphaBg: "rgba(239, 68, 68, 0.08)",
  overlay: "rgba(0, 0, 0, 0.60)",
};

const getStyles = (theme, isDarkMode = false) =>
  StyleSheet.create({
    // --- MAIN SCREEN LAYOUT ---
    // Fullscreen fixed background wrapper
    fullscreenOverlay: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: "100%",
      height: "100%",
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.base,
    },
    // Main flex container
    container: {
      flex: 1,
    },
    // ScrollView inner padding & safe margins
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 54 : 48,
      paddingBottom: 85,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },

    // --- HEADER / BRAND SECTION ---
    // Screen title and subtitle row
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingHorizontal: 4,
      width: "100%",
    },
    // Header text group wrapper
    headerTextGroup: {
      flex: 1,
      paddingRight: 12,
    },
    // Top app category tag
    appName: {
      fontSize: 12,
      fontWeight: "900",
      color: COLORS.logoGreen,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 2,
    },
    // Main "Settings Hub" heading
    greeting: {
      fontSize: 28,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      letterSpacing: -0.5,
    },
    // Subtitle description below the heading
    subGreeting: {
      fontSize: 13,
      fontWeight: "700",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      marginTop: 2,
    },

    // --- PROFILE CARD ---
    // Outer card container for profile section
    profileFormCard: {
      backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.cardLight,
      borderRadius: 20,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      shadowOpacity: 0,
      elevation: 0,
    },
    // Centered vertical stack holding avatar and user metadata
    profileUserRow: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    // Circular container holding user photo or initials
    avatarNeuOuterBox: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: COLORS.logoGreen,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      borderWidth: 2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      position: "relative",
    },
    // Large avatar image
    avatarImageLarge: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    // Fallback circle when no image is uploaded
    avatarFallbackBox: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: COLORS.logoGreen,
      alignItems: "center",
      justifyContent: "center",
    },
    // Fallback initials text inside avatar
    avatarFallbackText: {
      color: COLORS.textWhite,
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: 1,
    },
    // Pencil badge overlay to change avatar
    avatarEditBadge: {
      position: "absolute",
      bottom: -2,
      right: -2,
      backgroundColor: COLORS.logoGreen,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2.5,
      borderColor: isDarkMode ? COLORS.surfaceDark : COLORS.surfaceLight,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 6,
      zIndex: 10,
    },
    // Text container holding name, email and edit button
    profileMetadataTextGroup: {
      alignItems: "center",
    },
    // User display name text
    profileUserNameText: {
      fontSize: 18,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginBottom: 2,
      textAlign: "center",
    },
    // User email text
    profileUserSubText: {
      fontSize: 12,
      fontWeight: "700",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      textAlign: "center",
    },
    // Location badge row
    locationBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5",
    },
    locationBadgeText: {
      fontSize: 11.5,
      fontWeight: "700",
      color: COLORS.emerald,
    },
    // "Edit Profile" pill button
    editProfileButton: {
      marginTop: 10,
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: COLORS.greenAlpha,
      borderWidth: 1,
      borderColor: COLORS.greenAlphaBorder,
    },
    // "Edit Profile" pill button text
    editProfileButtonText: {
      fontSize: 12,
      fontWeight: "800",
      color: COLORS.logoGreen,
    },

    // --- SECTION LABELS ---
    // Uppercase category section headers
    sectionLabelTitle: {
      fontSize: 14,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginBottom: 10,
      marginLeft: 4,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },

    // --- FORM CARDS & FILTER CHIPS ---
    // Standard content card container
    formCard: {
      backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.cardLight,
      borderRadius: 20,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Header row inside card with icon badge and title
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    // Purple icon container for membership header
    sparklesIconBadge: {
      backgroundColor: COLORS.purpleAlpha,
      borderRadius: 10,
      padding: 6,
      marginRight: 10,
    },
    // Title inside card header
    cardTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
    },
    // Horizontal row holding Free and Premium plan chips
    filterButtonGroupRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 4,
    },
    // Base style for plan selector chip
    filterChipButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.2,
    },
    // Active style for Free Plan chip
    filterChipActive: {
      backgroundColor: COLORS.greenAlpha,
      borderColor: COLORS.logoGreen,
    },
    // Active style for Premium Tier chip
    filterChipPremiumActive: {
      backgroundColor: COLORS.logoGreen,
      borderColor: COLORS.logoGreen,
      borderWidth: 1.5,
    },
    // Inactive style for plan chips
    filterChipInactive: {
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.pillLight,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Default text inside plan chips
    filterChipText: {
      fontSize: 13,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
    },
    // Active text for Free Plan chip
    filterChipTextActive: {
      color: COLORS.logoGreen,
      fontWeight: "900",
    },
    // Active text for Premium Tier chip
    filterChipPremiumTextActive: {
      color: COLORS.textWhite,
      fontWeight: "900",
    },
    // Crown icon spacing inside Premium chip
    crownIconSpacer: {
      marginRight: 4,
    },

    // --- SUBSCRIPTION & PREMIUM BENEFITS ---
    // Expanded container when Premium is active
    premiumConfigurationWrapper: {
      marginTop: 12,
    },
    // Light background box displaying premium perks
    premiumFeatureDetailsBox: {
      backgroundColor: COLORS.greenAlphaSubtle,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: COLORS.greenBenefitBorder,
      marginBottom: 16,
    },
    // Dark mode variant for perks box
    premiumFeatureDetailsBoxDark: {
      backgroundColor: COLORS.cardDark,
      borderColor: COLORS.borderDark,
    },
    // Perks box top title row
    featureDetailsHeadingFlexRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    // Crown icon spacing in perks title
    crownHeadingSpacer: {
      marginRight: 6,
    },
    // Perks title text
    premiumDetailsHeadingText: {
      fontSize: 13,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
    },
    // Individual feature bullet row
    featureBulletRowItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    // Checkmark icon spacing
    bulletCheckIconSpacer: {
      marginRight: 8,
    },
    // Text description of feature bullet
    featureBulletBodyText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textSlate,
      flex: 1,
    },
    // Heading above Monthly/Annual selectors
    premiumPanelHeading: {
      fontSize: 13,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginBottom: 10,
    },

    // --- BILLING FREQUENCY SELECTORS ---
    // Plan selection card (Monthly or Annual)
    billingPlanSelectorRowItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.cardLight,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Active highlight on selected billing card
    billingPlanActive: {
      borderColor: COLORS.logoGreen,
      backgroundColor: COLORS.greenHighlight,
    },
    // Plan title and description text wrapper
    billingPlanTextGroup: {
      flex: 1,
      marginRight: 10,
    },
    // Plan name text (e.g. Monthly Membership)
    billingPlanMainTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginBottom: 2,
    },
    // Plan subtitle / billing interval description
    billingPlanSubDescription: {
      fontSize: 11,
      fontWeight: "600",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
    },
    // Plan price badge text (e.g. ₱149/mo)
    billingPlanPriceBadgeText: {
      fontSize: 14,
      fontWeight: "900",
      color: COLORS.logoGreen,
    },
    // "SAVE 33%" badge on annual plan
    bestValueBadge: {
      backgroundColor: COLORS.logoGreen,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
    // "SAVE 33%" text
    bestValueBadgeText: {
      color: COLORS.textWhite,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.5,
    },

    // --- SEGMENTED OPTION SELECTOR ---
    // Outer container for 3-option selector (Theme & Language)
    segmentedContainer: {
      flexDirection: "row",
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.pillLight,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Individual segmented option tab
    segmentedOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: "transparent",
    },
    // Active segmented option tab background
    segmentedOptionActive: {
      backgroundColor: COLORS.logoGreen,
    },
    // Icon container inside segmented tab
    segmentedIconContainer: {
      marginRight: 6,
    },
    // Segmented tab label text
    segmentedOptionText: {
      fontSize: 13,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
    },
    // Active segmented tab label text
    segmentedOptionTextActive: {
      color: COLORS.textWhite,
    },

    // --- SETTING ACTION ROWS ---
    // Action row item with icon, titles, and switch or chevron
    settingActionRowItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    // Icon and text group
    settingIconTextGroup: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    // Rounded container holding action row icon
    settingIconBadge: {
      borderRadius: 10,
      padding: 7,
      marginRight: 12,
    },
    // Text container holding title and subtitle
    settingTextContainer: {
      flex: 1,
      marginRight: 10,
    },
    // Action row primary title text
    settingRowItemMainTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      marginBottom: 2,
    },
    // Action row subtitle description
    settingRowItemSubTitle: {
      fontSize: 11,
      fontWeight: "600",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
    },
    // Red color for destructive action titles
    destructiveText: {
      color: COLORS.red,
    },

    // --- DIVIDERS & HELPERS ---
    // Glass divider line between card items
    glassDivider: {
      height: 1,
      backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      marginVertical: 12,
    },
    // Inner divider inside expanded panels
    innerGlassDivider: {
      height: 1,
      backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      marginBottom: 12,
      marginTop: 4,
    },
    // Spacing above selectors
    settingHeaderSpacing: {
      marginBottom: 12,
    },
    // Margin utility
    marginBottom12: {
      marginBottom: 12,
    },
    // Flex row alignment utility
    rowAlign: {
      flexDirection: "row",
      alignItems: "center",
    },
    // White text utility for dark mode
    textWhiteDark: {
      color: COLORS.textLight,
    },
    // Muted text utility for dark mode
    textMutedDark: {
      color: COLORS.textMutedDark,
    },

    // --- LOGOUT BUTTON ---
    // Destructive secondary logout button container
    logOutSecondaryNeuButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: COLORS.redAlphaBg,
      borderColor: COLORS.redAlphaBorder,
      borderWidth: 1.2,
      marginBottom: 30,
    },
    // Logout icon spacing
    logoutIconSpacer: {
      marginRight: 8,
    },
    // Logout button label text
    logOutButtonText: {
      fontSize: 15,
      fontWeight: "800",
      color: COLORS.red,
    },

    // --- MODAL DIALOGS ---
    // Dimmed modal backdrop overlay
    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.overlay,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    // Modal dialog content container
    modalContent: {
      width: "100%",
      maxWidth: 460,
      alignSelf: "center",
      backgroundColor: isDarkMode ? COLORS.surfaceDark : COLORS.surfaceLight,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Modal dialog title text
    modalTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      textAlign: "center",
      marginBottom: 4,
    },
    // Modal dialog subtitle description
    modalSubtitle: {
      fontSize: 13,
      fontWeight: "600",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
      textAlign: "center",
      marginBottom: 20,
    },
    // Form input label text
    inputLabel: {
      fontSize: 12,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textPlaceholder : COLORS.textSlate,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    // Modal text input box
    modalInput: {
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.cardLight,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      fontWeight: "700",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      borderWidth: 1,
      borderColor: isDarkMode ? COLORS.inputBorderDark : COLORS.inputBorderLight,
      marginBottom: 20,
    },
    // Password input row with toggle eye icon
    passwordInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.cardLight,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? COLORS.inputBorderDark : COLORS.inputBorderLight,
      marginBottom: 14,
    },
    // Password input text field
    passwordTextInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
      paddingVertical: 2,
    },
    // Camera icon badge in photo modal
    cameraIconBadge: {
      position: "absolute",
      bottom: 2,
      right: 2,
      backgroundColor: COLORS.logoGreen,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: isDarkMode ? COLORS.surfaceDark : COLORS.surfaceLight,
    },
    // Modal action buttons container
    modalButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    // Modal cancel button
    modalCancel: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: isDarkMode ? COLORS.borderDark : COLORS.pillLight,
      alignItems: "center",
    },
    // Modal cancel button text
    modalCancelText: {
      fontSize: 14,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textMutedDark : COLORS.textMuted,
    },
    // Modal primary action button (Save / Confirm)
    modalSave: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: COLORS.logoGreen,
      alignItems: "center",
    },
    // Disabled save button state
    modalSaveDisabled: {
      opacity: 0.5,
    },
    // Modal primary action button text
    modalSaveText: {
      fontSize: 14,
      fontWeight: "900",
      color: COLORS.textWhite,
    },
    // Payment method selector option item
    paymentMethodOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1.2,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.cardLight,
      marginBottom: 10,
    },
    // Selected payment method option state
    paymentMethodActive: {
      borderColor: COLORS.logoGreen,
      backgroundColor: COLORS.greenHighlight,
    },
    // Payment method label text
    paymentMethodText: {
      fontSize: 14,
      fontWeight: "800",
      color: isDarkMode ? COLORS.textLight : COLORS.textDark,
    },
  });
