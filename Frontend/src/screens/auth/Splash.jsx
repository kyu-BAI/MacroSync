// --- IMPORTS ---
import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  Image,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

// Assets
const LOGO_IMAGE = require("../../images/macrosync_logo.png");

// Option A: Signature clean light brand tokens
const baseColor = "#F8FAFC";
const logoGreen = "#10B981";
const textSecondary = "#64748B";

// Spinner configurations
const TOTAL_SPINNER_DOTS = 8;
const BASE_SPEED_MS = 900;

export default function SplashScreen({ onAppReady }) {
  // Entrance animations for branding (GPU driven)
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  // Generates 8 independent animation timelines for the spinner
  const dotTimelines = useRef(
    Array.from({ length: TOTAL_SPINNER_DOTS }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // 1. Logo & Content Entrance Animation (60 FPS Native GPU)
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 30,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Pulse animation loop for 8 spinner dots (GPU Native Driver)
    const activeAnimations = dotTimelines.map((timelineNode, dotIndex) => {
      const delayOffset = dotIndex * (BASE_SPEED_MS / TOTAL_SPINNER_DOTS);

      const anim = Animated.loop(
        Animated.sequence([
          Animated.delay(delayOffset),
          Animated.timing(timelineNode, {
            toValue: 1,
            duration: (BASE_SPEED_MS * 1.111) / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(timelineNode, {
            toValue: 0,
            duration: (BASE_SPEED_MS * 1.111) / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      return anim;
    });

    // 3. Smooth transition to main app flow
    const bootTimer = setTimeout(() => {
      if (onAppReady) onAppReady();
    }, 1800);

    return () => {
      clearTimeout(bootTimer);
      activeAnimations.forEach((anim) => anim.stop());
    };
  }, [onAppReady, dotTimelines, logoOpacity, logoScale, contentFade]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={baseColor}
        translucent={true}
      />

      {/* Central Brand Frame */}
      <Animated.View
        style={[
          styles.imagePresenterFrame,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={LOGO_IMAGE}
          style={styles.logoImageLarge}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Brand Subtitle Tagline */}
      <Animated.View style={[styles.brandSubtitleGroup, { opacity: contentFade }]}>
        <Text style={styles.brandTitle}>MacroSync</Text>
        <Text style={styles.brandTagline}>SMART NUTRITION & MACRO TRACKING</Text>
      </Animated.View>

      {/* Modern Compact Dot Spinner Hub */}
      <View style={styles.spinnerContainerHub}>
        {dotTimelines.map((timelineNode, index) => {
          const rotationAngle = index * 45;

          const scaleMatrix = timelineNode.interpolate({
            inputRange: [0, 1],
            outputRange: [0.25, 1],
          });

          const opacityMatrix = timelineNode.interpolate({
            inputRange: [0, 1],
            outputRange: [0.25, 1],
          });

          return (
            <View
              key={`dot-spoke-${index}`}
              style={[
                styles.dotSpokeWrapperAnchor,
                { transform: [{ rotate: `${rotationAngle}deg` }] },
              ]}
            >
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

// --- COMPONENT STYLES (OPTION A: FIXED SIGNATURE LIGHT PALETTE) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColor,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePresenterFrame: {
    width: Math.min(screenWidth * 0.65, 240),
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -60,
  },
  logoImageLarge: {
    width: "100%",
    height: "100%",
  },
  brandSubtitleGroup: {
    alignItems: "center",
    marginTop: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: logoGreen,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: "800",
    color: textSecondary,
    letterSpacing: 1.5,
    marginTop: 4,
    textTransform: "uppercase",
  },
  spinnerContainerHub: {
    position: "absolute",
    bottom: 80,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  dotSpokeWrapperAnchor: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  pulsingCoreBead: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: logoGreen,
  },
});
