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

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

export default function BottomNavBar({ activeTab, onTabChange }) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

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

  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 14 : 6);
  const barHeight = (Platform.OS === 'ios' ? 62 : 58) + bottomInset;
  const outerHeight = barHeight + 20;
  const fabBottomElevation = bottomInset + (Platform.OS === 'ios' ? 18 : 14);

  return (
    <View style={[styles.outerWrapper, { height: outerHeight }]} pointerEvents="box-none">
      {/* 1. Full-Width Background Bar */}
      <View
        style={[
          styles.barBackground,
          {
            height: barHeight,
            backgroundColor: theme?.surface || (isDarkMode ? '#1E293B' : '#FFFFFF'),
            borderTopColor: theme?.border || (isDarkMode ? '#334155' : '#E2E8F0'),
          },
        ]}
      >
        {/* 2. Responsive Centered Content Container */}
        <View
          style={[
            styles.innerContentRow,
            {
              height: barHeight,
              paddingBottom: bottomInset,
            },
          ]}
        >
          {TABS.map(renderTab)}

          {/* 3. Center Floating Camera FAB (Directly Centered within the Tabs Row) */}
          <View
            style={[
              styles.fabWrapper,
              {
                bottom: fabBottomElevation,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleTabPress('SCANNER')}
              activeOpacity={0.9}
            >
              <Animated.View
                style={[
                  styles.fab,
                  { borderColor: theme?.surface || (isDarkMode ? '#1E293B' : '#FFFFFF') },
                  activeTab === 'SCANNER' && styles.fabActive,
                  { transform: [{ scale: fabScale }] },
                ]}
              >
                <Camera color="#FFFFFF" size={26} strokeWidth={2.5} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
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
      alignItems: 'center',
    },
    // Edge-to-edge background bar across the screen
    barBackground: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      width: '100%',
      borderTopWidth: 1,
      zIndex: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Centered content container matching max card width on tablets/desktop
    innerContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      position: 'relative',
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
      paddingHorizontal: 8,
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
      width: FAB_SIZE + 8,
    },
    // Perfectly centered within the inner row
    fabWrapper: {
      position: 'absolute',
      left: '50%',
      marginLeft: -FAB_SIZE / 2,
      zIndex: 10,
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
      shadowColor: DEFAULT_ACTIVE_COLOR,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    fabActive: {
      backgroundColor: '#059669',
    },
  });
