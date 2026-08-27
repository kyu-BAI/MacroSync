import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * SkeletonCard
 * Renders a pulsing shimmer placeholder while content is loading.
 *
 * Props:
 *   height   {number}  — height of the skeleton block (default 160)
 *   style    {object}  — optional outer container style
 *   rows     {array}   — optional array of row configs: [{ width, height, marginTop }]
 *                        If not provided, renders a single full-width block.
 */
export default function SkeletonCard({ height = 160, style, rows }) {
  const { theme, isDarkMode } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  const baseColor  = isDarkMode ? '#1E293B' : '#F1F5F9';
  const shineColor = isDarkMode ? '#334155' : '#E2E8F0';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const bgColor = shimmer.interpolate({
    inputRange:  [0, 1],
    outputRange: [baseColor, shineColor],
  });

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme?.surface || '#FFFFFF',
      borderColor: theme?.border || '#E2E8F0',
    },
    style,
  ];

  if (rows) {
    return (
      <View style={cardStyle}>
        {rows.map((row, i) => (
          <Animated.View
            key={i}
            style={{
              height: row.height || 14,
              width: row.width || '100%',
              borderRadius: 8,
              backgroundColor: bgColor,
              marginTop: row.marginTop ?? (i === 0 ? 0 : 12),
            }}
          />
        ))}
      </View>
    );
  }

  return (
    <Animated.View style={[cardStyle, { height, backgroundColor: bgColor, borderRadius: 16 }]} />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
});
