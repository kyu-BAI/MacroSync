import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { ChevronLeft, Award, Droplets, Utensils, Activity, Bell, CheckCheck, Trash2 } from 'lucide-react-native';
import { useCustomAlert } from '../../context/CustomAlertContext';
import { useTheme } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export default function NotificationsScreen({ onTabChange, notifications: propNotifications, setNotifications: propSetNotifications }) {
  const { showAlert } = useCustomAlert();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const [localNotifications, setLocalNotifications] = useState([]);

  const emptyAnim = useRef(new Animated.Value(0)).current;

  const activeNotifications    = propNotifications || localNotifications;
  const activeSetNotifications = propSetNotifications || setLocalNotifications;

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'achievement': 
        return { 
          icon: Award,    
          color: '#F59E0B', 
          bgColor: isDarkMode ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.12)' 
        };
      case 'hydration':   
        return { 
          icon: Droplets, 
          color: '#0EA5E9', 
          bgColor: isDarkMode ? 'rgba(14, 165, 233, 0.18)' : 'rgba(14, 165, 233, 0.12)' 
        };
      case 'meal':        
        return { 
          icon: Utensils, 
          color: '#10B981', 
          bgColor: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)' 
        };
      case 'workout':     
        return { 
          icon: Activity, 
          color: '#F97316', 
          bgColor: isDarkMode ? 'rgba(249, 115, 22, 0.18)' : 'rgba(249, 115, 22, 0.12)' 
        };
      default:            
        return { 
          icon: Bell,     
          color: '#8B5CF6', 
          bgColor: isDarkMode ? 'rgba(139, 92, 246, 0.18)' : 'rgba(139, 92, 246, 0.12)' 
        };
    }
  };

  const unreadCount = activeNotifications.filter(n => !n.read).length;
  const hasAny      = activeNotifications.length > 0;

  const markAllAsRead = () => {
    activeSetNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    showAlert(
      'Clear All Notifications',
      'This will permanently remove all notifications. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            activeSetNotifications([]);
            Animated.spring(emptyAnim, { toValue: 1, useNativeDriver: true }).start();
          },
        },
      ]
    );
  };

  const handleNotificationPress = (id) => {
    activeSetNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleDismissOne = (id) => {
    activeSetNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          activeOpacity={0.7}
          onPress={() => onTabChange && onTabChange('DASHBOARD')}
        >
          <ChevronLeft color={theme?.textPrimary || '#0F172A'} size={24} />
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
      >

        {/* ── EMPTY STATE ── */}
        {!hasAny ? (
          <Animated.View style={[styles.emptyState, {
            opacity: emptyAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1] }),
            transform: [{ scale: emptyAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }]
          }]}>
            <View style={styles.emptyIconCircle}>
              <Bell color="#10B981" size={42} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>You're all caught up!</Text>
            <Text style={styles.emptySubtitle}>
              No notifications here. We'll let you know when something important happens.
            </Text>
          </Animated.View>
        ) : (
          <>
            <View style={styles.subHeaderActionsRow}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <View style={styles.actionButtonsContainer}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.markReadBtn]}
                    activeOpacity={0.7}
                    onPress={markAllAsRead}
                  >
                    <CheckCheck color="#10B981" size={14} strokeWidth={2.5} />
                    <Text style={styles.markReadText}>Mark Read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.clearAllBtn]}
                  activeOpacity={0.7}
                  onPress={clearAllNotifications}
                >
                  <Trash2 color="#EF4444" size={14} strokeWidth={2.5} />
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>

            {activeNotifications.map((notif) => {
              const { icon: IconComponent, color, bgColor } = getCategoryStyles(notif.category);
              return (
                <TouchableOpacity 
                  key={notif.id}
                  style={[
                    styles.notificationCard,
                    !notif.read && [styles.unreadCard, { borderLeftWidth: 4, borderLeftColor: color }]
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleNotificationPress(notif.id)}
                >
                  <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                    <IconComponent color={color} size={22} strokeWidth={2.2} />
                  </View>
                  
                  <View style={styles.notifContent}>
                    <View style={styles.notifHeaderRow}>
                      <Text style={[styles.notifTitle, !notif.read && styles.unreadText]}>
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
                    {!notif.read && <View style={[styles.unreadDot, { backgroundColor: '#EF4444' }]} />}
                    <TouchableOpacity
                      style={styles.dismissBtn}
                      onPress={() => handleDismissOne(notif.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.dismissX}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={styles.footerInfo}>
              <Bell color="#10B981" size={28} opacity={0.7} strokeWidth={2} />
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

const baseColor           = '#F8FAFC';

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  fullscreenOverlay: { 
    flex: 1,
    backgroundColor: theme?.background || baseColor,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    backgroundColor: theme?.surface || baseColor,
    borderBottomWidth: 1,
    borderBottomColor: theme?.border || '#E2E8F0',
    gap: 8,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: theme?.surface || baseColor, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1.5, 
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: theme?.textPrimary || '#0F172A', 
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  markReadBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  clearAllBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  container: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme?.textSecondary || '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subHeaderActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.2, 
    borderColor: theme?.border || '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  unreadCard: {
    backgroundColor: theme?.cardBg || '#FFFFFF',
    borderColor: theme?.border || '#F1F5F9',
    borderWidth: 1,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  notifContent: { flex: 1 },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme?.textPrimary || '#64748B',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
  },
  notifTime: {
    fontSize: 11,
    color: theme?.textSecondary || '#94A3B8',
    fontWeight: '600',
  },
  notifMessage: {
    fontSize: 13,
    color: theme?.textSecondary || '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  rightActions: {
    alignItems: 'center',
    marginLeft: 8,
    gap: 6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#64748B',
  },
  dismissBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme?.cardBg || '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissX: {
    fontSize: 10,
    color: theme?.textSecondary || '#94A3B8',
    fontWeight: '800',
    lineHeight: 14,
  },
  // ── Empty state ──
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
    shadowOpacity: 0,
    elevation: 0,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme?.textSecondary || '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  footerInfo: {
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
    color: theme?.textSecondary || '#94A3B8',
    lineHeight: 18,
    fontWeight: '500',
  },
});