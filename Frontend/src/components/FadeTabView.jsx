import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';

/**
 * FadeTabView
 * Wraps any tab screen content and fades it in whenever `tabKey` changes.
 * Uses the native driver for silky 60fps on both iOS and Android.
 *
 * Props:
 *   tabKey  {string} — unique key for the active tab (e.g. 'DASHBOARD')
 *   style   {object} — optional extra style for the container
 *   children
 */
export default function FadeTabView({ tabKey, style, children }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset instantly, then fade in
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,           // snappy — not sluggish
      useNativeDriver: true,
    }).start();
  }, [tabKey]);

  return (
    <Animated.View style={[styles.fill, style, { opacity }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
