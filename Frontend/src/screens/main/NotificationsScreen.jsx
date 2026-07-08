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
  Alert,
  Animated,
} from 'react-native';
import { ChevronLeft, Award, Droplets, Utensils, Activity, Bell, CheckCheck, Trash2 } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function NotificationsScreen({ onTabChange, notifications: propNotifications, setNotifications: propSetNotifications }) {
  const emptyAnim = useRef(new Animated.Value(0)).current;

  const activeNotifications    = propNotifications || [];
  const activeSetNotifications = propSetNotifications;

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'achievement': return { icon: Award,    color: '#D69E2E', bgColor: '#FEFCBF' };
      case 'hydration':   return { icon: Droplets, color: '#3182CE', bgColor: '#BEE3F8' };
      case 'meal':        return { icon: Utensils, color: '#4EA685', bgColor: '#C6F6D5' };
      case 'workout':     return { icon: Activity, color: '#E53E3E', bgColor: '#FED7D7' };
      default:            return { icon: Bell,     color: '#4A5568', bgColor: '#EDF2F7' };
    }
  };

  const unreadCount = activeNotifications.filter(n => !n.read).length;
  const hasAny      = activeNotifications.length > 0;

  const markAllAsRead = () => {
    activeSetNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    Alert.alert(
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          activeOpacity={0.7}
          onPress={() => onTabChange && onTabChange('DASHBOARD')}
        >
          <ChevronLeft color="#1A2B23" size={28} />
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
              <Bell color="#AEC2B7" size={40} strokeWidth={1.5} />
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
                    <CheckCheck color="#4EA685" size={14} strokeWidth={2.5} />
                    <Text style={styles.markReadText}>Mark Read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.clearAllBtn]}
                  activeOpacity={0.7}
                  onPress={clearAllNotifications}
                >
                  <Trash2 color="#E53E3E" size={14} strokeWidth={2.5} />
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>

            {activeNotifications.map((notif) => {
              const { icon: IconComponent, color, bgColor } = getCategoryStyles(notif.category);
              return (
                <TouchableOpacity 
                  key={notif.id}
                  style={[styles.notificationCard, !notif.read && styles.unreadCard]}
                  activeOpacity={0.7}
                  onPress={() => handleNotificationPress(notif.id)}
                >
                  <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                    <IconComponent color={color} size={24} />
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
                    {!notif.read && <View style={styles.unreadDot} />}
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
              <Bell color="#7FA293" size={32} opacity={0.5} />
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

const baseColor           = '#F0F4F2';
const clearWhiteHighlight = '#FFFFFF';
const softGreenShadow     = '#AEC2B7';

const styles = StyleSheet.create({
  fullscreenOverlay: { 
    flex: 1,
    backgroundColor: baseColor,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    backgroundColor: baseColor,
    borderBottomWidth: 1,
    borderBottomColor: '#D4E2DC',
    gap: 8,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: baseColor, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 3, height: 3 }, 
    shadowOpacity: 1, 
    shadowRadius: 5, 
    elevation: 3, 
    borderWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#1A2B23', 
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: '#E53E3E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
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
    backgroundColor: '#E8F5F0',
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4EA685',
  },
  clearAllBtn: {
    backgroundColor: '#FEE2E2',
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E53E3E',
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
    color: '#7FA293',
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
    backgroundColor: baseColor,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: softGreenShadow, 
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 0.7, 
    shadowRadius: 6, 
    elevation: 4,    
    borderWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4ECE8',
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
    color: '#41544B',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '900',
    color: '#1A2B23',
  },
  notifTime: {
    fontSize: 11,
    color: '#7FA293',
    fontWeight: '600',
  },
  notifMessage: {
    fontSize: 13,
    color: '#556B60',
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
    backgroundColor: '#E53E3E',
  },
  dismissBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E4ECE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissX: {
    fontSize: 10,
    color: '#7FA293',
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F0ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A2B23',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7FA293',
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
    color: '#7FA293',
    lineHeight: 18,
    fontWeight: '500',
  },
});
