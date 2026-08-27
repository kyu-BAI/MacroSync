import React, { useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  Platform, Animated,
} from 'react-native';
import { Home, UtensilsCrossed, Camera, Dumbbell, Settings } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from './BottomNavBar.styles';

// ── Design Tokens ──
const logoGreen = '#10B981';

const TABS = [
  { id: 'DASHBOARD', label: 'Home',    Icon: Home            },
  { id: 'DIET',      label: 'Diet',    Icon: UtensilsCrossed },
  { id: 'SCANNER',   label: null,      Icon: Camera          }, // center FAB
  { id: 'WORKOUT',   label: 'Workout', Icon: Dumbbell        },
  { id: 'SETTINGS',  label: 'Settings',Icon: Settings        },
];

export default function BottomNavBar({ activeTab, onTabChange }) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  // ── Each tab gets its own independent Animated.Value ──
  const scaleRefs = useRef(
    TABS.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(1);
      return acc;
    }, {})
  ).current;

  // FAB scale ref
  const fabScale = useRef(new Animated.Value(1)).current;

  const springBounce = useCallback((anim) => {
    anim.setValue(0.72);
    Animated.spring(anim, {
      toValue: 1,
      friction: 5,       // lower = bouncier
      tension: 160,      // higher = snappier
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = useCallback((tabId) => {
    const anim = tabId === 'SCANNER' ? fabScale : scaleRefs[tabId];
    springBounce(anim);
    onTabChange && onTabChange(tabId);
  }, [onTabChange, springBounce, scaleRefs, fabScale]);

  const renderTab = (tab) => {
    const isActive = activeTab === tab.id;
    const inactiveColor = isDarkMode ? '#64748B' : '#94A3B8';

    // Center FAB slot — placeholder only, FAB rendered separately
    if (tab.id === 'SCANNER') {
      return <View key={tab.id} style={styles.centerSlot} />;
    }

    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tabItem}
        onPress={() => handlePress(tab.id)}
        activeOpacity={1}          // disable built-in fade; we handle feedback
      >
        {/* Active indicator bar — slides in from top */}
        {isActive && <View style={styles.topAccentBar} />}

        {/* ✅ Icon + label wrapped in Animated.View — bounce now renders */}
        <Animated.View
          style={[
            styles.pillContainer,
            { transform: [{ scale: scaleRefs[tab.id] }] },
          ]}
        >
          <tab.Icon
            color={isActive ? logoGreen : inactiveColor}
            size={22}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <Text style={[styles.label, isActive && styles.labelActive]}>
            {tab.label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const isIos = Platform.OS === 'ios';
  const barHeight = isIos ? 76 : 68;
  const fabBottom = isIos ? 30 : 24;

  return (
    <View style={[styles.outerWrapper, { height: isIos ? 96 : 84 }]}>
      {/* Edge-to-Edge Tab Bar */}
      <View style={[styles.container, { height: barHeight }]}>
        {renderTab(TABS[0])}
        {renderTab(TABS[1])}
        {renderTab(TABS[2])}
        {renderTab(TABS[3])}
        {renderTab(TABS[4])}
      </View>

      {/* Center Camera FAB — with its own bounce */}
      <View style={[styles.fabWrapper, { bottom: fabBottom }]}>
        <TouchableOpacity
          onPress={() => handlePress('SCANNER')}
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
