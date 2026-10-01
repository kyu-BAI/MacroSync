import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import {
  ChevronLeft,
  Bell,
  CheckCheck,
  Trash2,
} from "lucide-react-native";
import { useCustomAlert } from "../../context/CustomAlertContext";
import { useTheme } from "../../context/ThemeContext";
import useNotifications from "../../hooks/useNotifications";
import StaggerCard from "../../components/StaggerCard";
import PressableCard from "../../components/PressableCard";

export default function NotificationsScreen({
  onTabChange,
  notifications: propNotifications,
  setNotifications: propSetNotifications,
}) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const {
    activeNotifications,
    unreadCount,
    hasAny,
    getCategoryStyles,
    markAllAsRead,
    clearAllNotifications,
    handleNotificationPress,
    handleDismissOne,
  } = useNotifications({
    notifications: propNotifications,
    setNotifications: propSetNotifications,
    showAlert,
    isDarkMode,
  });

  /* remove everything in the screen */
  // return <View style={styles.fullscreenOverlay} />;

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => onTabChange && onTabChange("DASHBOARD")}
        >
          <ChevronLeft
            color={theme?.textPrimary || COLORS.textPrimaryLight}
            size={24}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount} New</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === "android"}
      >
        {/* ── EMPTY STATE ── */}
        {!hasAny ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Bell color={COLORS.logoGreen} size={42} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>You're all caught up!</Text>
            <Text style={styles.emptySubtitle}>
              No notifications here. We'll let you know when something important happens.
            </Text>
          </View>
        ) : (
          <>
            {/* ── SUBHEADER ACTIONS ROW ── */}
            <View style={styles.subHeaderActionsRow}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <View style={styles.actionButtonsContainer}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.markReadBtn]}
                    activeOpacity={0.7}
                    onPress={markAllAsRead}
                  >
                    <CheckCheck
                      color={COLORS.logoGreen}
                      size={14}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.markReadText}>Mark Read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.clearAllBtn]}
                  activeOpacity={0.7}
                  onPress={clearAllNotifications}
                >
                  <Trash2
                    color={COLORS.danger}
                    size={14}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── NOTIFICATION CARDS LIST ── */}
            {activeNotifications.map((notif, index) => {
              const {
                icon: IconComponent,
                color,
                bgColor,
              } = getCategoryStyles(notif.category);
              return (
                <StaggerCard key={notif.id} index={index}>
                  <PressableCard
                    style={[
                      styles.notificationCard,
                      !notif.read && styles.unreadCard,
                    ]}
                    onPress={() => handleNotificationPress(notif.id)}
                  >
                    <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                      <IconComponent
                        color={color}
                        size={22}
                        strokeWidth={2.2}
                      />
                    </View>

                    <View style={styles.notifContent}>
                      <View style={styles.notifHeaderRow}>
                        <Text
                          style={[
                            styles.notifTitle,
                            !notif.read && styles.unreadText,
                          ]}
                        >
                          {notif.title}
                        </Text>
                        <Text style={styles.notifTime}>{notif.time}</Text>
                      </View>
                      <Text style={styles.notifMessage} numberOfLines={3}>
                        {notif.message}
                      </Text>
                    </View>

                    {/* Right-side: unread dot + dismiss button */}
                    <View style={styles.rightActions}>
                      {!notif.read && <View style={styles.unreadDot} />}
                      <TouchableOpacity
                        style={styles.dismissBtn}
                        onPress={() => handleDismissOne(notif.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.dismissX}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </PressableCard>
                </StaggerCard>
              );
            })}

            {/* ── FOOTER GUIDANCE TEXT ── */}
            <View style={styles.footerInfo}>
              <Bell color={COLORS.logoGreen} size={28} opacity={0.7} strokeWidth={2} />
              <Text style={styles.footerText}>
                Notifications are personalized based on your behavior, goals, and daily routines to help you maintain consistency.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// --- CENTRALIZED COLOR PALETTE ---
const COLORS = {
  logoGreen: "#10B981", // Brand emerald green accent
  baseColor: "#F8FAFC", // Fallback background color
  surfaceLight: "#FFFFFF", // Surface card background in light mode
  surfaceDark: "#1E293B", // Surface card background in dark mode
  borderLight: "#E2E8F0", // Card and container border light
  borderDark: "#334155", // Card and container border dark
  textPrimaryLight: "#0F172A", // High contrast dark text
  textPrimaryDark: "#F8FAFC", // High contrast white text
  textSecondaryLight: "#64748B", // Subdued slate body text
  textSecondaryDark: "#94A3B8", // Subdued slate body text dark
  danger: "#EF4444", // Destructive red for clear and alert badges
  unreadCardDark: "#1E293B", // Unread highlight card background in dark theme
  unreadCardLight: "#FFFFFF", // Unread highlight card background in light theme
  white: "#FFFFFF", // Pure white icon and label text
};

// --- STYLESHEET DEFINITION ---
const getStyles = (theme, isDarkMode = false) =>
  StyleSheet.create({
    // Fullscreen backdrop container
    fullscreenOverlay: {
      flex: 1,
      backgroundColor: theme?.background || COLORS.baseColor,
    },
    // Top app navigation header bar
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 60 : 50,
      paddingBottom: 20,
      backgroundColor: theme?.surface || COLORS.baseColor,
      borderBottomWidth: 1,
      borderBottomColor: theme?.border || COLORS.borderLight,
      gap: 8,
    },
    // Circular back navigation button
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme?.surface || COLORS.baseColor,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
      shadowOpacity: 0,
      elevation: 0,
    },
    // Group container for header title and unread pill badge
    headerTitleGroup: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    // Main bold title of notifications screen
    headerTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textPrimaryLight,
      letterSpacing: -0.5,
    },
    // Red pill badge indicating count of unread items
    badge: {
      backgroundColor: COLORS.danger,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      marginLeft: 8,
    },
    // Bold white text inside unread pill badge
    badgeText: {
      color: COLORS.white,
      fontSize: 10,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    // Generic button styling for header actions
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 12,
      gap: 4,
    },
    // Subtle green background for mark all as read action
    markReadBtn: {
      backgroundColor: "rgba(16, 185, 129, 0.12)",
    },
    // Green label text for mark all as read action
    markReadText: {
      fontSize: 11,
      fontWeight: "800",
      color: COLORS.logoGreen,
    },
    // Subtle red background for clear all notifications action
    clearAllBtn: {
      backgroundColor: "rgba(239, 68, 68, 0.12)",
    },
    // Red label text for clear all notifications action
    clearAllText: {
      fontSize: 11,
      fontWeight: "800",
      color: COLORS.danger,
    },
    // ScrollView container filling the available height
    container: {
      flex: 1,
    },
    // Inner padding container for notification items
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 60,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },
    // Small uppercase header distinguishing notification sections
    sectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: theme?.textSecondary || COLORS.textSecondaryDark,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    // Subheader row aligning section title with quick actions
    subHeaderActionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      width: "100%",
    },
    // Container row placing action buttons side-by-side
    actionButtonsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    // Standard notification item card wrapper
    notificationCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme?.surface || COLORS.baseColor,
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: theme?.border || COLORS.borderLight,
    },
    // Highlighted border and background for unread notification item
    unreadCard: {
      backgroundColor: isDarkMode
        ? COLORS.unreadCardDark
        : COLORS.unreadCardLight,
      borderColor: COLORS.logoGreen,
      borderWidth: 1.5,
    },
    // Rounded container housing notification category icon
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    // Center column holding title, timestamp, and message
    notifContent: {
      flex: 1,
    },
    // Top row inside notification item placing title and timestamp
    notifHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 4,
    },
    // Standard notification title text
    notifTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme?.textPrimary || COLORS.textSecondaryLight,
      flex: 1,
      marginRight: 8,
    },
    // Emphasized bold notification title for unread items
    unreadText: {
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textPrimaryLight,
    },
    // Timestamp displaying when notification was delivered
    notifTime: {
      fontSize: 11,
      color: theme?.textSecondary || COLORS.textSecondaryDark,
      fontWeight: "600",
    },
    // Multi-line body message description
    notifMessage: {
      fontSize: 13,
      color: theme?.textSecondary || COLORS.textSecondaryLight,
      lineHeight: 18,
      fontWeight: "500",
    },
    // Right column holding unread status dot and dismiss button
    rightActions: {
      alignItems: "center",
      marginLeft: 8,
      gap: 6,
    },
    // Small green indicator dot highlighting unread item
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: COLORS.logoGreen,
    },
    // Tiny circular close button to dismiss single notification
    dismissBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme?.cardBg || (isDarkMode ? COLORS.borderDark : COLORS.borderLight),
      alignItems: "center",
      justifyContent: "center",
    },
    // Typography style for dismiss 'X' character
    dismissX: {
      fontSize: 10,
      color: theme?.textSecondary || COLORS.textSecondaryDark,
      fontWeight: "800",
      lineHeight: 14,
    },
    // Centered placeholder layout when no notifications exist
    emptyState: {
      marginTop: 80,
      alignItems: "center",
      paddingHorizontal: 32,
    },
    // Large circular backdrop for empty state bell icon
    emptyIconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: isDarkMode
        ? "rgba(16, 185, 129, 0.16)"
        : "rgba(16, 185, 129, 0.10)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      borderWidth: 2,
      borderColor: isDarkMode
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(16, 185, 129, 0.2)",
      shadowOpacity: 0,
      elevation: 0,
    },
    // Primary title text for empty notifications state
    emptyTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: theme?.textPrimary || COLORS.textPrimaryLight,
      marginBottom: 12,
      letterSpacing: -0.3,
    },
    // Subtitle description explaining empty notifications state
    emptySubtitle: {
      fontSize: 14,
      color: theme?.textSecondary || COLORS.textSecondaryDark,
      textAlign: "center",
      lineHeight: 22,
      fontWeight: "500",
    },
    // Bottom information note informing user of notification behavior
    footerInfo: {
      marginTop: 30,
      alignItems: "center",
      paddingHorizontal: 20,
    },
    // Subdued helper text inside footer note
    footerText: {
      textAlign: "center",
      marginTop: 12,
      fontSize: 12,
      color: theme?.textSecondary || COLORS.textSecondaryDark,
      lineHeight: 18,
      fontWeight: "500",
    },
  });
