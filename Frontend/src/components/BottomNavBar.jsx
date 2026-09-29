import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Home, UtensilsCrossed, Camera, Dumbbell, Settings } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

// --- 1. COLORS ---
export const DEFAULT_ACTIVE_COLOR = '#10B981';
const INACTIVE_LIGHT = '#94A3B8';
const INACTIVE_DARK = '#64748B';

// --- 2. CAMERA BUTTON SETTINGS ---
const FAB_SIZE = 56;
const FAB_ELEVATION = Platform.OS === 'ios' ? 28 : 22; 

// --- 3. TABS ---
export const TABS = [
  { id: 'DASHBOARD', label: 'Home', Icon: Home },
  { id: 'DIET',      label: 'Diet',     Icon: UtensilsCrossed },
  { id: 'SCANNER',   label: null,       Icon: Camera }, // Center Camera Button
  { id: 'WORKOUT',   label: 'Workout',  Icon: Dumbbell },
  { id: 'SETTINGS',  label: 'Settings', Icon: Settings },
];

export default function BottomNavBar({ activeTab, onTabChange }) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  // --- 4. ANIMATIONS ---
  const scaleRefs = useRef(
    TABS.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(1);
      return acc;
    }, {})
  ).current;

  const fabScale = useRef(new Animated.Value(1)).current;

  const triggerSpringBounce = useCallback((anim) => {
    if (!anim) return;
    anim.setValue(0.75);
    Animated.spring(anim, {
      toValue: 1,
      friction: 5,
      tension: 160,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleTabPress = useCallback(
    (tabId) => {
      const anim = tabId === 'SCANNER' ? fabScale : scaleRefs[tabId];
      if (anim) triggerSpringBounce(anim);
      if (onTabChange) onTabChange(tabId);
    },
    [onTabChange, triggerSpringBounce, scaleRefs, fabScale]
  );

  // --- 5. RENDER TAB ---
  const renderTab = (tab) => {
    // Empty spacer in the bar row so tabs do not collide with center button
    if (tab.id === 'SCANNER') {
      return <View key={tab.id} style={styles.centerSlot} />;
    }

    const isActive = activeTab === tab.id;
    const tabActiveColor = tab.activeColor || DEFAULT_ACTIVE_COLOR;
    const inactiveColor = isDarkMode ? INACTIVE_DARK : INACTIVE_LIGHT;
    const currentTabColor = isActive ? tabActiveColor : inactiveColor;

    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tabItem}
        onPress={() => handleTabPress(tab.id)}
        activeOpacity={1}
      >
        {/* Top Active Indicator Line */}
        {isActive && (
          <View style={[styles.topAccentBar, { backgroundColor: tabActiveColor }]} />
        )}

        <Animated.View
          style={[
            styles.pillContainer,
            { transform: [{ scale: scaleRefs[tab.id] || 1 }] },
          ]}
        >
          <tab.Icon
            color={currentTabColor}
            size={22}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <Text
            style={[
              styles.label,
              { color: currentTabColor },
              isActive && styles.labelActive,
            ]}
          >
            {tab.label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const isIos = Platform.OS === 'ios';
  const barHeight = isIos ? 76 : 68;

  return (
    <View style={[styles.outerWrapper, { height: isIos ? 96 : 84 }]}>
      {/* Tab Row Container */}
      <View style={[styles.container, { height: barHeight }]}>
        {TABS.map(renderTab)}
      </View>

      {/* Center Floating Camera FAB (Auto-Centered with alignSelf) */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          onPress={() => handleTabPress('SCANNER')}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.fab,
              { borderColor: theme?.surface || '#FFFFFF' },
              activeTab === 'SCANNER' && styles.fabActive,
              { transform: [{ scale: fabScale }] },
            ]}
          >
            <Camera color="#FFFFFF" size={26} strokeWidth={2.5} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- 6. STYLES ---
const getStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    outerWrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 99,
    },
    // Main navigation bar background and top border
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme?.surface || '#FFFFFF',
      paddingBottom: Platform.OS === 'ios' ? 14 : 0,
      zIndex: 3,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      position: 'relative',
    },
    topAccentBar: {
      position: 'absolute',
      top: -1,
      width: 28,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: DEFAULT_ACTIVE_COLOR,
    },
    pillContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: isDarkMode ? INACTIVE_DARK : INACTIVE_LIGHT,
      marginTop: 2,
    },
    labelActive: {
      fontWeight: '900',
    },
    centerSlot: {
      width: FAB_SIZE + 4,
    },
    // Auto-centers the camera button horizontally on any screen
    fabWrapper: {
      position: 'absolute',
      alignSelf: 'center',
      bottom: FAB_ELEVATION,
      zIndex: 5,
    },
    // Circular camera button
    fab: {
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      backgroundColor: DEFAULT_ACTIVE_COLOR,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3.5,
      shadowOpacity: 0,
      elevation: 0,
    },
    fabActive: {
      backgroundColor: '#059669ff',
    },
  });
