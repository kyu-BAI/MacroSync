import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  Dimensions,
  Animated
} from 'react-native';
import { ChevronLeft, Award, Droplets, Utensils, Activity, Bell } from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function NotificationsScreen({ onTabChange, notifications: propNotifications, setNotifications: propSetNotifications }) {
  // Habit Notification and Reminder System - Mock Data reflecting requirements
  const [localNotifications, setLocalNotifications] = useState([
    { 
      id: 'n1', 
      title: 'Hydration & Routine 💧', 
      category: 'hydration', 
      time: '10:00 AM', 
      read: false, 
      message: 'Automated reminder: Time to drink water! Staying hydrated is key to your healthy routine activities.' 
    },
    { 
      id: 'n2', 
      title: 'Workout Complete! 🔥', 
      category: 'achievement', 
      time: 'Yesterday', 
      read: false, 
      message: 'Motivational update: Awesome job! You burned 320 calories. Consistency in health monitoring is key.' 
    },
    { 
      id: 'n3', 
      title: 'Milestone Reached 🏃', 
      category: 'achievement', 
      time: 'Yesterday', 
      read: true, 
      message: 'You hit your calorie target and crushed your 10,000 step milestone! Great daily progress.' 
    },
    { 
      id: 'n4', 
      title: 'Dinner Logging 🍽️', 
      category: 'meal', 
      time: '2 Days Ago', 
      read: true, 
      message: 'Automated reminder: Don\'t forget to log your dinner macros to maintain diet tracking consistency.' 
    },
    { 
      id: 'n5', 
      title: 'Smart Goal Adjustment 🧠', 
      category: 'workout', 
      time: '3 Days Ago', 
      read: true, 
      message: 'Personalized notification: Adjusted based on your behavior and daily routines to improve long-term engagement and adherence.' 
    }
  ]);

  const activeNotifications = propNotifications && propNotifications.length > 0 ? propNotifications : localNotifications;
  const activeSetNotifications = propSetNotifications || setLocalNotifications;

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'achievement': return { icon: Award, color: '#D69E2E', bgColor: '#FEFCBF' };
      case 'hydration': return { icon: Droplets, color: '#3182CE', bgColor: '#BEE3F8' };
      case 'meal': return { icon: Utensils, color: '#4EA685', bgColor: '#C6F6D5' };
      case 'workout': return { icon: Activity, color: '#E53E3E', bgColor: '#FED7D7' };
      default: return { icon: Bell, color: '#4A5568', bgColor: '#EDF2F7' };
    }
  };

  const markAllAsRead = () => {
    activeSetNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationPress = (id) => {
    activeSetNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const unreadCount = activeNotifications.filter(n => !n.read).length;

  return (
    <View style={styles.fullscreenOverlay}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

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

        <TouchableOpacity 
          style={styles.markReadBtn} 
          activeOpacity={0.7}
          onPress={markAllAsRead}
        >
          <Text style={styles.markReadText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Recent</Text>
        
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

              {!notif.read && (
                <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          );
        })}
        
        <View style={styles.footerInfo}>
          <Bell color="#7FA293" size={32} opacity={0.5} />
          <Text style={styles.footerText}>
            Notifications are personalized based on your behavior, goals, and daily routines to help you maintain consistency.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const baseColor = '#F0F4F2';           
const clearWhiteHighlight = '#FFFFFF';    
const softGreenShadow = '#AEC2B7';      
const logoGreen = '#4EA685';

const styles = StyleSheet.create({
  fullscreenOverlay: { 
    flex: 1,
    backgroundColor: baseColor,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    backgroundColor: baseColor,
    borderBottomWidth: 1,
    borderBottomColor: '#D4E2DC'
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
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center'
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
    marginLeft: 8
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  markReadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E4ECE8',
    borderRadius: 12
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#41544B'
  },
  container: { 
    flex: 1,
  },
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
    marginBottom: 16
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
    borderTopWidth: 1.5, 
    borderLeftWidth: 1.5, 
    borderTopColor: clearWhiteHighlight, 
    borderLeftColor: clearWhiteHighlight,
  },
  unreadCard: {
    backgroundColor: '#FFFFFF', // Slightly brighter to stand out
    borderColor: '#E4ECE8',
    borderWidth: 1,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  notifContent: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#41544B',
    flex: 1,
    marginRight: 8
  },
  unreadText: {
    fontWeight: '900',
    color: '#1A2B23'
  },
  notifTime: {
    fontSize: 11,
    color: '#7FA293',
    fontWeight: '600'
  },
  notifMessage: {
    fontSize: 13,
    color: '#556B60',
    lineHeight: 18,
    fontWeight: '500'
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53E3E',
    marginLeft: 12
  },
  footerInfo: {
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 20
  },
  footerText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
    color: '#7FA293',
    lineHeight: 18,
    fontWeight: '500'
  }
});
