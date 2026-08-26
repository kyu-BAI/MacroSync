import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { X, HelpCircle, Mail, ShieldCheck } from "lucide-react-native";
import {
  getRememberedGoogleEmail,
  saveRememberedGoogleEmail,
  setRememberMe,
  isRememberMeEnabled,
} from "../services/OfflineStorage";
import { useTheme } from "../context/ThemeContext";
import { getStyles } from "./GoogleAccountModal.styles";

export default function GoogleAccountModal({
  visible = false,
  onClose = () => {},
  onSelectAccount = () => {},
  isLoading = false,
}) {
  const { isDarkMode, theme } = useTheme();
  const styles = getStyles(isDarkMode, theme);

  const [googleEmail, setGoogleEmail] = useState("");
  const [rememberMe, setRememberMeState] = useState(true);

  useEffect(() => {
    if (visible) {
      const loadSavedSettings = async () => {
        const savedEmail = await getRememberedGoogleEmail();
        if (savedEmail) {
          setGoogleEmail(savedEmail);
        }
        const rememberEnabled = await isRememberMeEnabled();
        setRememberMeState(rememberEnabled);
      };
      loadSavedSettings();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (isLoading) return;
    const cleanEmail = (googleEmail || "").trim();
    if (!cleanEmail) {
      Alert.alert("Input Required", "Please enter your Google email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        "Input Error",
        "Please enter a valid email format (e.g. name@gmail.com).",
      );
      return;
    }

    // Save or clear Remember Me preference & Google email
    await setRememberMe(rememberMe);
    if (rememberMe) {
      await saveRememberedGoogleEmail(cleanEmail);
    }

    const derivedName = cleanEmail
      .split("@")[0]
      .split(/[._-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    if (typeof onSelectAccount === "function") {
      onSelectAccount(cleanEmail, derivedName, rememberMe);
    }
  };

  const handleCloseModal = () => {
    setGoogleEmail("");
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const handleOpenHelp = () => {
    Alert.alert(
      "Google Sign-In Help",
      "Enter your Google Account email to authorize MacroSync. Your account allows seamless sync of daily meal logs, AI nutrients tracking, and fitness routines.",
      [{ text: "OK" }],
    );
  };

  const handleOpenPolicy = () => {
    Alert.alert(
      "Privacy Policy & Terms",
      "MacroSync respects your privacy. Your Google profile email is strictly used to secure your personal account.",
      [{ text: "Close" }],
    );
  };

  return (
    <Modal
      visible={!!visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCloseModal}
    >
      <View style={styles.overlay}>
        {/* TOP BAR / NAVIGATION OVERLAY */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleCloseModal}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <X color={isDarkMode ? "#FFFFFF" : "#0F172A"} size={22} strokeWidth={2.4} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleOpenHelp}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <HelpCircle color={isDarkMode ? "#FFFFFF" : "#0F172A"} size={22} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {/* CENTER POPUP CARD */}
        <View style={styles.modalCardContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* APP LOGO BADGE */}
            <View style={styles.logoBadgeOuter}>
              <View style={styles.logoBadgeInner}>
                <Image
                  source={require("../images/macrosync_logo.png")}
                  style={styles.appLogoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* TITLE & SUBTITLE */}
            <Text style={styles.modalTitle}>Choose an account</Text>
            <Text style={styles.modalSubtitle}>to continue to MacroSync</Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>
                  Authenticating with Google...
                </Text>
              </View>
            ) : (
              <View style={styles.accountFormContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Google Email Address</Text>
                  <View style={styles.fieldRow}>
                    <Mail color={isDarkMode ? "#94A3B8" : "#64748B"} size={18} style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="yourname@gmail.com"
                      placeholderTextColor={isDarkMode ? "#71717A" : "#9CA3AF"}
                      value={googleEmail}
                      onChangeText={setGoogleEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* REMEMBER ME TOGGLE ROW */}
                <View style={styles.rememberRow}>
                  <View style={styles.rememberTextGroup}>
                    <View style={styles.rememberTitleRow}>
                      <ShieldCheck
                        color="#10B981"
                        size={16}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.rememberTitle}>Remember Me</Text>
                    </View>
                    <Text style={styles.rememberSubtitle}>
                      Verify Gmail one time on this device
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: isDarkMode ? "#3F3F46" : "#D1D5DB", true: "#10B981" }}
                    thumbColor={rememberMe ? "#FFFFFF" : (isDarkMode ? "#A1A1AA" : "#9CA3AF")}
                    ios_backgroundColor={isDarkMode ? "#3F3F46" : "#D1D5DB"}
                    onValueChange={setRememberMeState}
                    value={rememberMe}
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>
                    Continue with Account
                  </Text>
                </TouchableOpacity>

                {/* HAIRLINE DIVIDER */}
                <View style={styles.dividerLine} />

                {/* LEGAL / PRIVACY DISCLAIMER */}
                <Text style={styles.legalDisclaimerText}>
                  To continue, Google will share your email address with
                  MacroSync. Before using this app, review its{" "}
                  <Text style={styles.legalLinkText} onPress={handleOpenPolicy}>
                    privacy policy
                  </Text>{" "}
                  and{" "}
                  <Text style={styles.legalLinkText} onPress={handleOpenPolicy}>
                    terms of service
                  </Text>
                  .
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
