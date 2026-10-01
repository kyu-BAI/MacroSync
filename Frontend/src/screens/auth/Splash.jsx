// --- IMPORTS ---
import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Animated,
  Easing,
  Image,
} from "react-native";

// Assets
const LOGO_IMAGE = require("../../images/macrosync_logo.png");

// Brand tokens
const baseColor = "#F8FAFC";
const logoGreen = "#10B981";
const textSecondary = "#64748B";

// Spinner config
const TOTAL_SPINNER_DOTS = 8;
const BASE_SPEED_MS = 900;

export default function SplashScreen({ onAppReady }) {
  // Entrance animations (GPU-driven native driver)
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(12)).current;

  // 8 independent spinner dot timelines
  const dotTimelines = useRef(
    Array.from({ length: TOTAL_SPINNER_DOTS }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Stage 1: Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 28,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 2: Tagline slides up into view
    Animated.parallel([
      Animated.timing(taglineFade, {
        toValue: 1,
        duration: 500,
        delay: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(taglineSlide, {
        toValue: 0,
        duration: 450,
        delay: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 3: Spinner dots
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

    // Boot transition
    const bootTimer = setTimeout(() => {
      if (onAppReady) onAppReady();
    }, 1900);

    return () => {
      clearTimeout(bootTimer);
      activeAnimations.forEach((anim) => anim.stop());
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={baseColor}
        translucent={true}
      />

      {/* Central Logo */}
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

      {/* Tagline only — no redundant app name text */}
      <Animated.View
        style={[
          styles.brandTaglineGroup,
          {
            opacity: taglineFade,
            transform: [{ translateY: taglineSlide }],
          },
        ]}
      >
        <Text style={styles.brandTagline}>SMART NUTRITION & MACRO TRACKING</Text>
      </Animated.View>


      {/* Dot Spinner Hub */}
      <View style={styles.spinnerContainerHub}>
        {dotTimelines.map((timelineNode, index) => {
          const rotationAngle = index * 45;

          const scaleMatrix = timelineNode.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1],
          });

          const opacityMatrix = timelineNode.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1],
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

// --- COMPONENT STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColor,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePresenterFrame: {
    width: "60%",
    maxWidth: 230,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -50,
  },
  logoImageLarge: {
    width: "100%",
    height: "100%",
  },
  // Only the tagline — no redundant app name
  brandTaglineGroup: {
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 24,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: "800",
    color: textSecondary,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
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
