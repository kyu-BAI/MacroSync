import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { X, HelpCircle, Mail, ShieldCheck } from "lucide-react-native";
import {
  getRememberedGoogleEmail,
  saveRememberedGoogleEmail,
  setRememberMe,
  isRememberMeEnabled,
} from "../services/OfflineStorage";

export default function GoogleAccountModal({
  visible = false,
  onClose = () => {},
  onSelectAccount = () => {},
  isLoading = false,
}) {
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
      Alert.alert("Input Error", "Please enter a valid email format (e.g. name@gmail.com).");
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
      [{ text: "OK" }]
    );
  };

  const handleOpenPolicy = () => {
    Alert.alert(
      "Privacy Policy & Terms",
      "MacroSync respects your privacy. Your Google profile email is strictly used to secure your personal account.",
      [{ text: "Close" }]
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
            <X color="#FFFFFF" size={24} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleOpenHelp}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <HelpCircle color="#FFFFFF" size={24} strokeWidth={2} />
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
                <Text style={styles.loadingText}>Authenticating with Google...</Text>
              </View>
            ) : (
              <View style={styles.accountFormContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Google Email Address</Text>
                  <View style={styles.fieldRow}>
                    <Mail color="#94A3B8" size={18} style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="yourname@gmail.com"
                      placeholderTextColor="#71717A"
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
                      <ShieldCheck color="#10B981" size={16} style={{ marginRight: 6 }} />
                      <Text style={styles.rememberTitle}>Remember Me</Text>
                    </View>
                    <Text style={styles.rememberSubtitle}>Verify Gmail one time on this device</Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#3F3F46", true: "#10B981" }}
                    thumbColor={rememberMe ? "#FFFFFF" : "#A1A1AA"}
                    ios_backgroundColor="#3F3F46"
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
                  To continue, Google will share your email address with MacroSync.
                  Before using this app, review its{" "}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  topHeaderBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 32,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCardContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#262626",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    borderWidth: 1,
    borderColor: "#3F3F46",
  },
  scrollContent: {
    alignItems: "center",
  },
  logoBadgeOuter: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#18181A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3F3F46",
  },
  logoBadgeInner: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  appLogoImage: {
    width: 40,
    height: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#A1A1AA",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: "#CBD5E1",
    fontWeight: "500",
  },
  accountFormContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 14,
    width: "100%",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D4D4D8",
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3F3F46",
    paddingHorizontal: 12,
    height: 46,
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#18181B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3F3F46",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    width: "100%",
  },
  rememberTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  rememberTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  rememberSubtitle: {
    fontSize: 11,
    color: "#A1A1AA",
    marginTop: 2,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#10B981",
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#3F3F46",
    marginVertical: 18,
    width: "100%",
  },
  legalDisclaimerText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#A1A1AA",
    textAlign: "left",
  },
  legalLinkText: {
    color: "#60A5FA",
    fontWeight: "600",
  },
});
