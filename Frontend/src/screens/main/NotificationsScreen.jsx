import React, { useState, useRef } from 'react';
import { 
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
import { getStyles } from './NotificationsScreen.styles';

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
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Bell color="#10B981" size={42} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>You're all caught up!</Text>
            <Text style={styles.emptySubtitle}>
              No notifications here. We'll let you know when something important happens.
            </Text>
          </View>
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
                    !notif.read && styles.unreadCard
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleNotificationPress(notif.id)}
                >
                  <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                    <IconComponent color={color} size={20} strokeWidth={2.2} />
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
                    {!notif.read && <View style={[styles.unreadDot, { backgroundColor: '#10B981' }]} />}
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