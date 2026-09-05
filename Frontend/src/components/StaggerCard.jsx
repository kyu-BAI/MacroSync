import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * StaggerCard
 * Wraps a list item and slides it up on mount.
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
  const translateY = useRef(new Animated.Value(shouldAnimate ? 22 : 0)).current;

  // Guard: prevents React Strict Mode / Fast Refresh from double-firing.
  const hasRun = useRef(false);

  useEffect(() => {
    if (!shouldAnimate) return;       // skip on filter-driven re-renders
    if (hasRun.current) return;
    hasRun.current = true;

    const delay = initialDelay + index * staggerMs;
    Animated.timing(translateY, {
      toValue: 0,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ width: '100%' }, style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
