import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Dimensions, Animated, Easing,
} from 'react-native';
import { Home, UtensilsCrossed, Camera, SportShoe, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

// ── Neumorphic Design Tokens (matching app-wide theme) ──
const baseColor = '#F0F4F2';
const clearWhiteHighlight = '#FFFFFF';
const softGreenShadow = '#AEC2B7';
const logoGreen = '#4EA685';
const logoDarkShadow = '#37745D';
const logoLightHighlight = '#65D8AD';

const TABS = [
  { id: 'DASHBOARD', label: 'Home',    Icon: Home           },
  { id: 'DIET',      label: 'Diet',    Icon: UtensilsCrossed },
  { id: 'SCANNER',   label: null,      Icon: Camera         }, // center FAB
  { id: 'WORKOUT',   label: 'Workout', Icon: SportShoe      },
  { id: 'SETTINGS',  label: 'Settings',Icon: Settings       },
];

export default function BottomNavBar({ activeTab, onTabChange }) {
  // Animated scale for active icon entry bounce
  const activeScale = useRef(new Animated.Value(1)).current;
  // Animated scale for indicator line
  const indicatorScale = useRef(new Animated.Value(1)).current;
  // Continuous pulse/breath animation for center FAB
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spring animate active icon scale on tab change
    activeScale.setValue(0.75);
    Animated.spring(activeScale, {
      toValue: 1.12,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();

    // Spring animate top line indicator width scale
    indicatorScale.setValue(0.2);
    Animated.spring(indicatorScale, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handlePress = (tabId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabChange && onTabChange(tabId);
  };

  const renderTab = (tab, idx) => {
    const isActive = activeTab === tab.id;
    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tabItem}
        onPress={() => handlePress(tab.id)}
        activeOpacity={0.8}
      >
        {/* Top Active Indicator Line */}
        {isActive && (
          <Animated.View
            style={[
              styles.topIndicatorLine,
              { transform: [{ scaleX: indicatorScale }] }
            ]}
          />
        )}
        
        {/* Animated Icon Wrapper */}
        <Animated.View style={isActive ? { transform: [{ scale: activeScale }] } : {}}>
          <tab.Icon
            color={isActive ? logoGreen : '#9EB8AE'}
            size={22}
            strokeWidth={isActive ? 2.5 : 2}
          />
        </Animated.View>

        <Text style={[styles.label, isActive && styles.labelActive]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Safe coordinates for iOS and Android
  const isIos = Platform.OS === 'ios';
  const outerHeight = isIos ? 116 : 98;
  const containerHeight = isIos ? 88 : 72;
  const humpTop = isIos ? 2 : 0;
  const maskTop = isIos ? 28 : 26;
  const fabTop = isIos ? 10 : 8;

  return (
    <View style={[styles.outerWrapper, { height: outerHeight }]}>
      {/* 1. Curved Hump Background */}
      <View style={[styles.humpBg, { top: humpTop }]} />

      {/* 2. Main Tab Bar Container */}
      <View style={[styles.container, { height: containerHeight }]}>
        {/* Left tabs: Home, Diet */}
        {renderTab(TABS[0], 0)}
        {renderTab(TABS[1], 1)}

        {/* Placeholder center slot */}
        <View style={styles.centerSlot} />

        {/* Right tabs: Workout, Settings */}
        {renderTab(TABS[3], 3)}
        {renderTab(TABS[4], 4)}
      </View>

      {/* 3. Border Mask overlay to make the hump merge seamlessly */}
      <View style={[styles.humpMask, { top: maskTop }]} />

      {/* 4. Center Camera FAB */}
      <Animated.View
        style={[
          styles.centerSlotAbsolute,
          { top: fabTop, transform: [{ scale: pulseAnim }] }
        ]}
      >
        <TouchableOpacity
          style={[styles.fab, activeTab === 'SCANNER' && styles.fabActive]}
          onPress={() => handlePress('SCANNER')}
          activeOpacity={0.85}
        >
          <Camera color="#FFFFFF" size={26} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 99,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: baseColor,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Neumorphic top/left highlight
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
    // Neumorphic drop shadow
    shadowColor: softGreenShadow,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 3,
  },
  // Curved background hump circle
  humpBg: {
    position: 'absolute',
    left: screenWidth / 2 - 36, // center horizontally (72/2 = 36)
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: baseColor,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: clearWhiteHighlight,
    borderLeftColor: clearWhiteHighlight,
    shadowColor: softGreenShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1,
  },
  // Hides the straight border line of the main bar where it meets the hump
  humpMask: {
    position: 'absolute',
    left: screenWidth / 2 - 33, // centered (66/2 = 33)
    width: 66,
    height: 12,
    backgroundColor: baseColor,
    zIndex: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 10,
    position: 'relative',
  },
  topIndicatorLine: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -15, // centered (30/2 = 15)
    width: 30,
    height: 3,
    backgroundColor: logoGreen,
    borderBottomLeftRadius: 2.5,
    borderBottomRightRadius: 2.5,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9EB8AE',
    marginTop: 4,
  },
  labelActive: {
    color: logoGreen,
    fontWeight: '900',
  },
  centerSlot: {
    width: 72,
  },
  centerSlotAbsolute: {
    position: 'absolute',
    left: '50%',
    marginLeft: -28, // center horizontally (56/2 = 28)
    width: 56,
    height: 56,
    zIndex: 5,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    // Neumorphic shadow
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
    // Neumorphic highlight border
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: logoLightHighlight,
    borderLeftColor: logoLightHighlight,
  },
  fabActive: {
    backgroundColor: '#3E836A',
    borderTopColor: logoGreen,
    borderLeftColor: logoGreen,
  },
});
