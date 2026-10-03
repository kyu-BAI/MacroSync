import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import {
  Send,
  User,
  Sparkles,
  Zap,
  Info,
  Mic,
  BotMessageSquare,
  X,
} from "lucide-react-native";
import useChatbotAI from "../../hooks/useChatbotAI";
import { useCustomAlert } from "../../context/CustomAlertContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

// Sub-component: Animated row entrance for each chat message
function AnimatedMessageRow({ children, isAI }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}



export default function ChatbotAIScreen({
  onTabChange,
  userId,
  userProfile,
  messages = [],
  setMessages,
  onRefreshDashboard,
}) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const { language = "English" } = useLanguage();
  const styles = getStyles(theme, isDarkMode);

  const subGreetingText =
    language === "Tagalog"
      ? "Real-time na nutrisyon at gabay sa ehersisyo"
      : language === "Cebuano"
      ? "Real-time nga nutrisyon ug giya sa ehersisyo"
      : "Real-time nutrition & zero-equipment fitness guidance";

  const placeholderText = showKeyboardMicHint
    ? language === "Tagalog"
      ? "Pindutin ang 🎤 sa keyboard para magsalita..."
      : language === "Cebuano"
      ? "I-tap ang 🎤 sa keyboard aron mosulti..."
      : "Tap 🎤 on your keyboard to speak..."
    : language === "Tagalog"
    ? "Magtanong kay Vita AI tungkol sa diyeta o ehersisyo..."
    : language === "Cebuano"
    ? "Pangutana kang Vita AI bahin sa pagkaon o ehersisyo..."
    : "Ask Vita AI about diet, macros, or workouts...";

  const typingIndicatorText =
    language === "Tagalog"
      ? "Nag-iisip si Vita AI..."
      : language === "Cebuano"
      ? "Naghunahuna si Vita AI..."
      : "Vita AI is thinking...";

  const {
    inputText,
    setInputText,
    isLoading,
    keyboardVisible,
    showKeyboardMicHint,
    setShowKeyboardMicHint,
    inputRef,
    chatInfo,
    flatListRef,
    containerFade,
    containerScale,
    containerTranslateY,
    handleToggleVoiceDictation,
    handleSendMessage,
    renderMessageText,
    handleShowTipsModal,
  } = useChatbotAI({
    userId,
    userProfile,
    messages,
    setMessages,
    onRefreshDashboard,
    onTabChange,
    showAlert,
    language,
  });

  return (
    <Animated.View
      style={[
        styles.fullscreenOverlay,
        {
          opacity: containerFade,
          transform: [
            { scale: containerScale },
            { translateY: containerTranslateY },
          ],
        },
      ]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* ── HEADER BRANDING SECTION ── */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <View style={styles.appNameRow}>
            <Text style={styles.appName}>MacroSync</Text>

            {/* REMAINING CHAT COUNT BADGE WITH INFO TRIGGER */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleShowTipsModal}
                style={[
                  styles.chatBadgePill,
                  chatInfo.isPremium
                    ? styles.premiumBadgePill
                    : chatInfo.remaining <= 2
                    ? styles.warningBadgePill
                    : styles.normalBadgePill,
                ]}
              >
                {chatInfo.isPremium ? (
                  <Sparkles
                    color={COLORS.purple}
                    size={11}
                    style={{ marginRight: 4 }}
                  />
                ) : (
                  <Zap
                    color={chatInfo.remaining <= 2 ? COLORS.danger : COLORS.logoGreen}
                    size={11}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.chatBadgeText,
                    chatInfo.isPremium
                      ? styles.premiumBadgeText
                      : chatInfo.remaining <= 2
                      ? styles.warningBadgeText
                      : styles.normalBadgeText,
                  ]}
                >
                  {chatInfo.isPremium
                    ? "Unlimited Messages"
                    : `${chatInfo.remaining} / 10 Messages Left`}
                </Text>
                <Info
                  color={
                    chatInfo.isPremium
                      ? COLORS.purple
                      : chatInfo.remaining <= 2
                      ? COLORS.danger
                      : COLORS.logoGreen
                  }
                  size={11}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>

              {/* Close Button to return back to previous tab / Dashboard */}
              {Boolean(onTabChange) && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onTabChange("DASHBOARD")}
                  style={styles.closeHeaderBtn}
                >
                  <X color={isDarkMode ? "#CBD5E1" : "#64748B"} size={16} strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.greeting}>Vita AI Assistant</Text>
          <Text style={styles.subGreeting}>{subGreetingText}</Text>
        </View>
      </View>

      {/* ── KEYBOARD REGION WRAPPER ── */}
      <KeyboardAvoidingView
        style={[
          styles.keyboardContainer,
          {
            marginBottom: keyboardVisible
              ? 0
              : Platform.OS === "ios"
              ? 125
              : 115,
          },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      >
        {/* CHAT MESSAGES — VIRTUALIZED FLATLIST FOR 60 FPS PERFORMANCE */}
        <FlatList
          ref={flatListRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatScrollContent}
          showsVerticalScrollIndicator={false}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={7}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === "android"}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item: msg }) => {
            const isAI = msg.sender === "ai";
            return (
              <AnimatedMessageRow isAI={isAI}>
                <View
                  style={[
                    styles.messageRowFlex,
                    isAI ? styles.messageRowLeft : styles.messageRowRight,
                  ]}
                >
                  {isAI && (
                    <View style={styles.aiIconAvatarNeuBox}>
                      <BotMessageSquare
                        color={COLORS.logoGreen}
                        size={16}
                        strokeWidth={2.5}
                      />
                    </View>
                  )}

                  <View
                    style={[
                      styles.chatBubble,
                      isAI
                        ? styles.aiMessageFormCard
                        : styles.userMessageFormCard,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageBubbleText,
                        isAI ? styles.aiBubbleText : styles.userBubbleText,
                      ]}
                    >
                      {renderMessageText(msg.text, isAI)}
                    </Text>
                    <Text style={styles.messageTimeStampText}>{msg.time}</Text>
                  </View>

                  {!isAI && (
                    <View style={styles.userIconAvatarNeuBox}>
                      <User color={COLORS.white} size={15} strokeWidth={2.5} />
                    </View>
                  )}
                </View>
              </AnimatedMessageRow>
            );
          }}
          ListFooterComponent={
            isLoading ? (
              <View style={[styles.messageRowFlex, styles.messageRowLeft]}>
                <View style={styles.aiIconAvatarNeuBox}>
                  <BotMessageSquare
                    color={COLORS.logoGreen}
                    size={16}
                    strokeWidth={2.5}
                  />
                </View>
                <View
                  style={[
                    styles.chatBubble,
                    styles.aiMessageFormCard,
                    styles.typingIndicatorBubble,
                  ]}
                >
                  <ActivityIndicator
                    size="small"
                    color={COLORS.logoGreen}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.typingIndicatorText}>
                    {typingIndicatorText}
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* ── CHAT INPUT BAR HUB ── */}
        <View style={styles.chatInputFormCard}>
          {/* Guidance tooltip directing user to use their native keyboard microphone */}
          {showKeyboardMicHint && (
            <View style={styles.keyboardMicHintBar}>
              <View style={styles.keyboardMicBadge}>
                <Mic color={COLORS.logoGreen} size={13} />
              </View>
              <Text style={styles.keyboardMicHintText}>
                {language === "Tagalog"
                  ? "Bukas ang keyboard! Pindutin ang "
                  : language === "Cebuano"
                  ? "Abli ang keyboard! I-tap ang "
                  : "Keyboard opened! Tap the "}
                <Text style={{ fontWeight: "800", color: COLORS.logoGreen }}>
                  🎤 mic key
                </Text>{" "}
                {language === "Tagalog"
                  ? "sa keyboard para magsalita."
                  : language === "Cebuano"
                  ? "sa keyboard aron mosulti."
                  : "on your keyboard to speak."}
              </Text>
              <TouchableOpacity
                onPress={() => setShowKeyboardMicHint(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X color={isDarkMode ? "#94A3B8" : "#64748B"} size={14} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.chatInputInnerLayoutRow}>
            <TextInput
              ref={inputRef}
              style={styles.chatTextInputField}
              placeholder={placeholderText}
              placeholderTextColor={
                showKeyboardMicHint
                  ? COLORS.logoGreen
                  : isDarkMode
                  ? COLORS.textSecondaryDark
                  : COLORS.textSecondaryLight
              }
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                if (showKeyboardMicHint) setShowKeyboardMicHint(false);
              }}
              multiline={true}
            />

            {/* Keyboard Voice Dictation Microphone Button */}
            <TouchableOpacity
              style={[
                styles.voiceMicBtn,
                {
                  backgroundColor: showKeyboardMicHint
                    ? isDarkMode
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(16, 185, 129, 0.12)"
                    : isDarkMode
                    ? COLORS.borderDark
                    : COLORS.cardBgLight,
                  borderColor: showKeyboardMicHint
                    ? COLORS.logoGreen
                    : isDarkMode
                    ? "#475569"
                    : COLORS.borderLight,
                },
              ]}
              activeOpacity={0.7}
              onPress={handleToggleVoiceDictation}
            >
              <Mic
                color={
                  showKeyboardMicHint
                    ? COLORS.logoGreen
                    : isDarkMode
                    ? COLORS.textPrimaryDark
                    : COLORS.textPrimaryLight
                }
                size={17}
              />
            </TouchableOpacity>

            {/* Primary Send Button */}
            <TouchableOpacity
              style={[
                styles.sendActionButton,
                { opacity: inputText.trim() ? 1 : 0.6 },
              ]}
              activeOpacity={0.8}
              onPress={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Send color={COLORS.white} size={15} fill={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// --- CENTRALIZED COLOR PALETTE ---
const COLORS = {
  logoGreen: "#10B981", // Brand emerald green accent
  baseColor: "#F8FAFC", // Fallback background color
  surfaceLight: "#FFFFFF", // Elevated card background light
  surfaceDark: "#1E293B", // Elevated card background dark
  borderLight: "#E2E8F0", // Hairline border light
  borderDark: "#334155", // Hairline border dark
  cardBgLight: "#F1F5F9", // Card and input fill light
  textPrimaryLight: "#0F172A", // Primary high contrast dark text
  textPrimaryDark: "#F8FAFC", // Primary high contrast light text
  textSecondaryLight: "#64748B", // Subdued slate text light
  textSecondaryDark: "#94A3B8", // Subdued slate text dark
  danger: "#EF4444", // Destructive and quota warning red
  purple: "#8B5CF6", // Premium quota purple accent
  white: "#FFFFFF", // Pure white icon and text
};

// --- STYLESHEET DEFINITION ---
const getStyles = (theme, isDarkMode = false) =>
  StyleSheet.create({
    // Fullscreen backdrop filling the device dimensions
    fullscreenOverlay: {
      flex: 1,
      width: "100%",
      height: "100%",
      backgroundColor: theme?.background || COLORS.baseColor,
    },
    // Top app navigation header grouping title and badge
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: Platform.OS === "ios" ? 54 : 48,
      marginBottom: 10,
      paddingHorizontal: 24,
      width: "100%",
      maxWidth: 680,
      alignSelf: "center",
    },
    // Text container organizing app label and heading
    headerTextGroup: {
      flex: 1,
    },
    // App name row with quota counter badge
    appNameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    // Brand header label in emerald green
    appName: {
      fontSize: 12,
      fontWeight: "900",
      color: COLORS.logoGreen,
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    // Pill capsule badge indicating remaining AI chat count
    chatBadgePill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
    },
    // Header dismiss/back button
    closeHeaderBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    // Normal green badge fill when user has free quota left
    normalBadgePill: {
      backgroundColor: isDarkMode
        ? "rgba(16, 185, 129, 0.16)"
        : "rgba(16, 185, 129, 0.10)",
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(16, 185, 129, 0.2)",
    },
    // Warning red badge fill when user has 2 or fewer messages left
    warningBadgePill: {
      backgroundColor: isDarkMode
        ? "rgba(239, 68, 68, 0.16)"
        : "rgba(254, 242, 242, 1)",
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(239, 68, 68, 0.35)"
        : "rgba(252, 165, 165, 0.8)",
    },
    // Premium purple badge fill for unlimited subscribers
    premiumBadgePill: {
      backgroundColor: isDarkMode
        ? "rgba(139, 92, 246, 0.16)"
        : "rgba(245, 243, 255, 1)",
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(139, 92, 246, 0.35)"
        : "rgba(221, 214, 254, 0.8)",
    },
    // Typography style for remaining chat count text
    chatBadgeText: {
      fontSize: 11,
      fontWeight: "800",
    },
    // Emerald green font for normal badge
    normalBadgeText: {
      color: COLORS.logoGreen,
    },
    // Red font for quota warning badge
    warningBadgeText: {
      color: COLORS.danger,
    },
    // Purple font for premium unlimited tier
    premiumBadgeText: {
      color: COLORS.purple,
    },
    // Main bold greeting title
    greeting: {
      fontSize: 26,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textPrimaryLight,
      letterSpacing: -0.5,
    },
    // Sub-heading describing assistant capabilities
    subGreeting: {
      fontSize: 13,
      fontWeight: "700",
      color: theme?.textSecondary || COLORS.textSecondaryLight,
      marginTop: 2,
    },
    // Flexible wrapper adapting to software keyboard height
    keyboardContainer: {
      flex: 1,
      marginBottom: 84,
    },
    // Message feed container
    chatContainer: {
      flex: 1,
      paddingHorizontal: 20,
      marginTop: 8,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },
    // Inner scrollable content padding for chat messages
    chatScrollContent: {
      paddingBottom: 16,
    },
    // Row container wrapping message bubble and sender avatar
    messageRowFlex: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: 16,
      width: "100%",
    },
    // Left-aligned alignment for incoming Vita AI responses
    messageRowLeft: {
      justifyContent: "flex-start",
    },
    // Right-aligned alignment for outgoing user messages
    messageRowRight: {
      justifyContent: "flex-end",
    },
    // Avatar badge displaying AI robot icon
    aiIconAvatarNeuBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.18)" : "#ECFDF5",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
      borderWidth: 1.5,
      borderColor: "rgba(16, 185, 129, 0.35)",
    },
    // Avatar badge displaying user silhouette icon
    userIconAvatarNeuBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: COLORS.logoGreen,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    // Base container styling for conversational message bubbles
    chatBubble: {
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxWidth: "78%",
    },
    // Elevated card styling for Vita AI message bubble
    aiMessageFormCard: {
      backgroundColor: isDarkMode ? COLORS.surfaceDark : COLORS.surfaceLight,
      borderTopLeftRadius: 4,
      borderWidth: 1.5,
      borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight,
    },
    // Tinted emerald card styling for user message bubble
    userMessageFormCard: {
      backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.18)" : "#E6F4EA",
      borderTopRightRadius: 4,
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(16, 185, 129, 0.25)",
    },
    // Typing indicator container when awaiting AI response
    typingIndicatorBubble: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    // Label text displaying 'Vita AI is thinking...'
    typingIndicatorText: {
      fontSize: 12,
      fontWeight: "700",
      color: COLORS.logoGreen,
    },
    // Base typography for message content
    messageBubbleText: {
      fontSize: 14,
      lineHeight: 20,
    },
    // Typography style for AI text content
    aiBubbleText: {
      color: theme?.textPrimary || COLORS.textPrimaryLight,
      fontWeight: "600",
      textAlign: "left",
    },
    // Typography style for user text content
    userBubbleText: {
      color: theme?.textPrimary || COLORS.textPrimaryLight,
      fontWeight: "700",
    },
    // Micro timestamp text at the bottom edge of chat bubbles
    messageTimeStampText: {
      fontSize: 9,
      color: theme?.textSecondary || COLORS.textSecondaryDark,
      fontWeight: "700",
      marginTop: 5,
      alignSelf: "flex-end",
    },
    // Input form card anchored above the navigation bar
    chatInputFormCard: {
      backgroundColor: theme?.surface || COLORS.baseColor,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginHorizontal: 20,
      marginBottom: Platform.OS === "ios" ? 6 : 0,
      marginTop: 5,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
      maxWidth: 680,
      width: "92%",
      alignSelf: "center",
    },
    // Guidance hint notifying user to use their native keyboard microphone
    keyboardMicHintBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode
        ? "rgba(16, 185, 129, 0.14)"
        : "rgba(16, 185, 129, 0.08)",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(16, 185, 129, 0.35)"
        : "rgba(16, 185, 129, 0.22)",
    },
    // Icon badge inside keyboard mic hint bar
    keyboardMicBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: isDarkMode
        ? "rgba(16, 185, 129, 0.25)"
        : "rgba(16, 185, 129, 0.15)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    // Hint text explaining how to dictate using the keyboard microphone
    keyboardMicHintText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDarkMode ? "#E2E8F0" : "#334155",
      flex: 1,
    },
    // Horizontal row holding text input, mic button, and send button
    chatInputInnerLayoutRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    // Multi-line text entry field for chat prompt
    chatTextInputField: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: theme?.textPrimary || COLORS.textPrimaryLight,
      maxHeight: 60,
      paddingTop: Platform.OS === "ios" ? 8 : 4,
      paddingBottom: Platform.OS === "ios" ? 8 : 4,
    },
    // Voice dictation microphone action button
    voiceMicBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
      borderWidth: 1,
    },
    // Circular emerald button dispatching message to Vita AI
    sendActionButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: COLORS.logoGreen,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
    },
  });
