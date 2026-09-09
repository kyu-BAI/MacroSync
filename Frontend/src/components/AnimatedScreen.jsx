import React, { useRef, useEffect } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

/**
 * AnimatedScreen
 * Wraps a full screen and animates it in on mount (fade + gentle slide-up).
 * Used as the transition for screen-to-screen navigation (SPLASH -> LOGIN ->
 * DASHBOARD, onboarding steps, etc.). Because App.js unmounts the previous
 * screen and mounts the next one whenever it switches screens, this wrapper
 * simply animates in on mount.
 *
 * Props:
 *   screenKey {string}  — optional key used to detect screen identity changes.
 *   style     {object}  — optional extra style for the container.
 *   children
 */
export default function AnimatedScreen({ screenKey, style, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    opacity.setValue(0);
    translateY.setValue(16);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 12,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenKey]);

  return (
    <Animated.View
      style={[styles.fill, style, { opacity, transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});