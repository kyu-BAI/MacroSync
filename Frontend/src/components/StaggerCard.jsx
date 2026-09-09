import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * StaggerCard
 * Wraps a list item and fades + slides it up on mount.
 *
 * Props:
 *   index         {number}  — position in the list (0-based)
 *   staggerMs     {number}  — ms between each card (default 70)
 *   initialDelay  {number}  — base offset before stagger starts (default 190ms,
 *                             so cards start after FadeTabView's 180ms fade)
 *   shouldAnimate {boolean} — set to false to skip animation (e.g. on filter changes).
 *                             Defaults to true.
 *   style         {object}  — optional extra style
 *   children
 */
export default function StaggerCard({
  index = 0,
  staggerMs = 70,
  initialDelay = 190,
  shouldAnimate = true,
  style,
  children,
}) {
  const translateY = useRef(new Animated.Value(shouldAnimate ? 28 : 0)).current;
  const opacity    = useRef(new Animated.Value(shouldAnimate ? 0  : 1)).current;

  // Guard: prevents React Strict Mode / Fast Refresh from double-firing.
  const hasRun = useRef(false);

  useEffect(() => {
    if (!shouldAnimate) return;       // skip on filter-driven re-renders
    if (hasRun.current) return;
    hasRun.current = true;

    const delay = initialDelay + index * staggerMs;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width: '100%' },
        style,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}
