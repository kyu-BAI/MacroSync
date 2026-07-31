import React, { useEffect, useRef } from 'react';
import { StyleSheet, Image, View, StatusBar, Dimensions, Animated, Easing } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// The spinner consists of exactly 8 dots spaced out at 45-degree rotations
const TOTAL_SPINNER_DOTS = 8;
const BASE_SPEED_MS = 900; // Derived directly from --uib-speed: .9s

export default function SplashScreen({ onAppReady }) {
  const { theme } = useTheme();
  const isDarkMode = false;
  const styles = getStyles(theme, false);
  // Generates 8 independent animation reference tracking timelines
  const dotTimelines = useRef(
    Array.from({ length: TOTAL_SPINNER_DOTS }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Replicates the CSS @keyframes pulse0112 calculation curve
    const executePulseLoop = (timelineNode, dotIndex) => {
      // Replicates the specific CSS negative animation-delay multipliers
      const delayOffset = dotIndex * (BASE_SPEED_MS / TOTAL_SPINNER_DOTS);

      Animated.loop(
        Animated.sequence([
          Animated.delay(delayOffset),
          Animated.timing(timelineNode, {
            toValue: 1, // Progressing to 50% marker (Scale: 1, Opacity: 1)
            duration: (BASE_SPEED_MS * 1.111) / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(timelineNode, {
            toValue: 0, // Returning to 100% marker (Scale: 0, Opacity: 0.3)
            duration: (BASE_SPEED_MS * 1.111) / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Spin up all 8 animated tracking nodes concurrently
    dotTimelines.forEach((node, index) => executePulseLoop(node, index));

    // Automated session transition routing trigger
    const bootTimer = setTimeout(() => {
      onAppReady();
    }, 2500);

    return () => clearTimeout(bootTimer);
  }, [onAppReady, dotTimelines]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme?.background || baseColor} translucent={true} />
      
      {/* Central Brand Canvas Viewport */}
      <View style={styles.imagePresenterFrame}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logoImageLarge}
          resizeMode="contain"
        />
      </View>

      {/* --- TRANSLATED COMPACT UIVERSE DOT SPINNER ENGINE --- */}
      <View style={styles.spinnerContainerHub}>
        {dotTimelines.map((timelineNode, index) => {
          const rotationAngle = index * 45; // 0deg, 45deg, 90deg, 135deg, etc.

          // Map linear progress node configurations straight to CSS properties
          const scaleMatrix = timelineNode.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1], // scale(0) to scale(1)
          });

          const opacityMatrix = timelineNode.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1], // opacity: 0.3 fallback to 1
          });

          return (
            <View
              key={`dot-spoke-${index}`}
              style={[
                styles.dotSpokeWrapperAnchor,
                { transform: [{ rotate: `${rotationAngle}deg` }] },
              ]}
            >
              {/* Pulsing Core Vector Dot */}
              <Animated.View
                style={[
                  styles.pulsingCoreBead,
                  {
                    transform: [{ scale: scaleMatrix }],
                    opacity: opacityMatrix,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Flat Design Tokens
const baseColor = '#F8FAFC';
const logoGreen = '#10B981';

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.background || baseColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePresenterFrame: {
    width: screenWidth * 0.75,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40, // Pulled up slightly to balance out the lower viewport spacing
  },
  logoImageLarge: {
    width: '100%',
    height: '100%',
  },
  
  // --- SPINNER ENGINE SPECIFICATION LAYOUTS ---
  spinnerContainerHub: {
    position: 'absolute',
    bottom: 100,
    width: 34, // Optimized from 45 down to 34 for a subtle, professional fit
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotSpokeWrapperAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start', // Anchors the nested dot straight to the outer edge vector
    alignItems: 'center',
  },
  pulsingCoreBead: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
    backgroundColor: logoGreen,
  },
});