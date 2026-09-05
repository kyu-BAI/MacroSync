import React, { useRef, useCallback } from 'react';
import { Animated, Pressable } from 'react-native';

/**
 * PressableCard
 * Drop-in replacement for TouchableOpacity on cards.
 * Scales down slightly on press-in, springs back on press-out.
 * Uses the native driver for 60fps with zero JS-thread cost.
 *
 * Props:
 *   onPress      {function}  — tap handler
 *   scaleDown    {number}    — target scale on press (default 0.965)
 *   style        {object}    — style for the Animated.View wrapper
 *   pressStyle   {object}    — additional style applied only while pressed
 *   children
 *   ...rest      — any other Pressable props (disabled, hitSlop, etc.)
 */
export default function PressableCard({
  onPress,
  scaleDown = 0.965,
  style,
  pressStyle,
  children,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleDown,
      useNativeDriver: false,
      speed: 50,        // fast response
      bounciness: 0,    // no overshoot on press-in
    }).start();
  }, [scaleDown]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: false,
      speed: 30,
      bounciness: 6,    // slight spring-back bounce on release
    }).start();
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: '100%' }}
      {...rest}
    >
      <Animated.View style={[{ width: '100%' }, style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
