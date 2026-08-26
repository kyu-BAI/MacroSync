import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  Platform, Animated,
} from 'react-native';
import { Home, UtensilsCrossed, Camera, SportShoe, Settings } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from './BottomNavBar.styles';

// ── Flat Design Tokens ──
const logoGreen = '#10B981';

const TABS = [
  { id: 'DASHBOARD', label: 'Home',     Icon: Home            },
  { id: 'DIET',      label: 'Diet',     Icon: UtensilsCrossed },
  { id: 'SCANNER',   label: null,       Icon: Camera          }, // center FAB
  { id: 'WORKOUT',   label: 'Workout',  Icon: SportShoe       },
  { id: 'SETTINGS',  label: 'Settings', Icon: Settings        },
];

export default function BottomNavBar({ activeTab, onTabChange }) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  // Animated scale for active icon entry bounce
  const activeScale = useRef(new Animated.Value(1)).current;
  // Animated scale for active indicator dot
  const indicatorScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    activeScale.setValue(0.75);
    Animated.spring(activeScale, {
      toValue: 1.1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();

    indicatorScale.setValue(0.2);
    Animated.spring(indicatorScale, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const handlePress = (tabId) => {
    onTabChange && onTabChange(tabId);
  };

  const renderTab = (tab) => {
    const isActive = activeTab === tab.id;
    const inactiveColor = isDarkMode ? '#64748B' : '#94A3B8';

    // Center FAB slot — render plain placeholder, FAB is rendered separately
    if (tab.id === 'SCANNER') {
      return <View key={tab.id} style={styles.centerSlot} />;
    }

    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tabItem}
        onPress={() => handlePress(tab.id)}
        activeOpacity={0.7}
      >
        {isActive && <View style={styles.topAccentBar} />}
        <View style={styles.pillContainer}>
          {/* Icon */}
          <tab.Icon
            color={isActive ? logoGreen : inactiveColor}
            size={22}
            strokeWidth={isActive ? 2.5 : 2}
          />

          {/* Label */}
          <Text style={[styles.label, isActive && styles.labelActive]}>
            {tab.label}
          </Text>
        </View>
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

      {/* Center Camera FAB — with outer ring accent */}
      <View style={[styles.fabWrapper, { bottom: fabBottom }]}>
        <TouchableOpacity
          style={[
            styles.fab,
            { borderColor: theme?.surface || '#FFFFFF' },
            activeTab === 'SCANNER' && styles.fabActive
          ]}
          onPress={() => handlePress('SCANNER')}
          activeOpacity={0.8}
        >
          <Camera color="#FFFFFF" size={26} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

