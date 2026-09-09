import React, { useRef, useState, useEffect } from 'react';
import { Animated, Easing, Text } from 'react-native';

/**
 * AnimatedCount
 * -------------
 * Smoothly counts numbers up/down when their value changes.
 * Renders a <Text> (or <Animated.Text>) whose displayed number eases from the
 * previous value to the new one. Uses the JS thread (useNativeDriver: false)
 * because it drives a string value via a listener.
 *
 * Props:
 *   value    {number}  — the actual numeric value to display.
 *   decimals {number}  — decimal places (default 0).
 *   duration {number}  — ms for the count transition (default 650).
 *   style    {object}  — style for the <Animated.Text>.
 *   children — (optional) static suffix/text rendered after the number.
 */
export default function AnimatedCount({
  value,
  decimals = 0,
  duration = 650,
  style,
  children,
}) {
  const anim = useRef(new Animated.Value(value)).current;
  const currentRef = useRef(value);
  const [display, setDisplay] = useState(format(value));

  function format(n) {
    const fixed = n.toFixed(decimals);
    return decimals > 0
      ? parseFloat(fixed).toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(n).toLocaleString();
  }

  useEffect(() => {
    if (currentRef.current === value) return;

    const from = currentRef.current;
    currentRef.current = value;
    anim.setValue(from);

    const id = anim.addListener(({ value: v }) => {
      setDisplay(format(v));
    });

    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => anim.removeListener(id);
  }, [value, anim, duration, decimals]);

  return (
    <Animated.Text style={style}>
      {display}
      {children}
    </Animated.Text>
  );
}