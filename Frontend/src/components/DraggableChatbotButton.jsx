import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Easing,
  useWindowDimensions,
} from "react-native";
import { BotMessageSquare } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const logoGreen = "#10B981";

export default function DraggableChatbotButton({ onPress }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Pattern 1: center mobile container on wide screens
  const CONTENT_MAX_WIDTH = 680;
  const contentWidth = Math.min(screenWidth, CONTENT_MAX_WIDTH);
  const contentLeft = Math.max(0, (screenWidth - contentWidth) / 2);
  const contentRight = contentLeft + contentWidth;

  const BUTTON_SIZE = 56;
  const MARGIN_OFFSET = 16;
  const CARD_PADDING = 20;

  // Vertical safe bounds — always relative to the VIEWPORT (not scroll offset)
  const NAV_BAR_HEIGHT = Platform.OS === "ios" ? 82 : 72;
  const TOP_BOUND = Math.max(Platform.OS === "ios" ? 70 : 50, insets.top + 20);
  const BOTTOM_BOUND =
    screenHeight - NAV_BAR_HEIGHT - BUTTON_SIZE - 16 - Math.max(insets.bottom, 0);

  // Horizontal bounds aligned to content container
  const LEFT_BOUND =
    screenWidth > CONTENT_MAX_WIDTH
      ? contentLeft + CARD_PADDING + MARGIN_OFFSET
      : MARGIN_OFFSET;

  const RIGHT_BOUND =
    screenWidth > CONTENT_MAX_WIDTH
      ? contentRight - CARD_PADDING - BUTTON_SIZE - MARGIN_OFFSET
      : Math.max(LEFT_BOUND, screenWidth - BUTTON_SIZE - MARGIN_OFFSET);

  // Absolute X/Y position (not offsets from scroll)
  const posX = useRef(new Animated.Value(RIGHT_BOUND)).current;
  const posY = useRef(new Animated.Value(BOTTOM_BOUND)).current;

  // Sync position on window resize (smooth on web)
  useEffect(() => {
    if (Platform.OS === "web") {
      Animated.parallel([
        Animated.timing(posX, {
          toValue: RIGHT_BOUND,
          duration: 120,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(posY, {
          toValue: BOTTOM_BOUND,
          duration: 120,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      posX.setValue(RIGHT_BOUND);
      posY.setValue(BOTTOM_BOUND);
    }
  }, [RIGHT_BOUND, BOTTOM_BOUND]);

  const [isGrabbing, setIsGrabbing] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartTimeRef = useRef(0);
  const dragStartX = useRef(RIGHT_BOUND);
  const dragStartY = useRef(BOTTOM_BOUND);
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.88,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,

      onPanResponderGrant: () => {
        isDraggingRef.current = false;
        dragStartTimeRef.current = Date.now();
        // Snapshot the current absolute position as drag origin
        dragStartX.current =
          typeof posX.__getValue === "function"
            ? posX.__getValue()
            : (posX._value ?? RIGHT_BOUND);
        dragStartY.current =
          typeof posY.__getValue === "function"
            ? posY.__getValue()
            : (posY._value ?? BOTTOM_BOUND);
        setIsGrabbing(true);
        handlePressIn();
      },

      onPanResponderMove: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4) {
          isDraggingRef.current = true;
        }
        // Move from snapshot origin + delta (viewport-relative, no scroll issues)
        const nextX = Math.max(
          LEFT_BOUND,
          Math.min(RIGHT_BOUND, dragStartX.current + gestureState.dx)
        );
        const nextY = Math.max(
          TOP_BOUND,
          Math.min(BOTTOM_BOUND, dragStartY.current + gestureState.dy)
        );
        posX.setValue(nextX);
        posY.setValue(nextY);
      },

      onPanResponderRelease: (evt, gestureState) => {
        setIsGrabbing(false);
        handlePressOut();

        const moveDist = Math.hypot(gestureState.dx, gestureState.dy);
        const touchDuration = Date.now() - dragStartTimeRef.current;

        // TAP: small movement + short duration
        if (!isDraggingRef.current && moveDist < 6 && touchDuration < 350) {
          if (onPress) onPress();
          return;
        }

        // DRAG: snap to nearest horizontal edge
        const currentX =
          typeof posX.__getValue === "function"
            ? posX.__getValue()
            : (posX._value ?? RIGHT_BOUND);
        const currentY =
          typeof posY.__getValue === "function"
            ? posY.__getValue()
            : (posY._value ?? BOTTOM_BOUND);

        const centerThreshold = contentLeft + (contentWidth - BUTTON_SIZE) / 2;
        const finalX = currentX > centerThreshold ? RIGHT_BOUND : LEFT_BOUND;
        const finalY = Math.max(TOP_BOUND, Math.min(BOTTOM_BOUND, currentY));

        Animated.parallel([
          Animated.spring(posX, {
            toValue: finalX,
            useNativeDriver: false,
            friction: 6,
            tension: 90,
          }),
          Animated.spring(posY, {
            toValue: finalY,
            useNativeDriver: false,
            friction: 6,
            tension: 90,
          }),
        ]).start();
      },

      onPanResponderTerminate: () => {
        setIsGrabbing(false);
        handlePressOut();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.floatingChatbotContainer,
        {
          left: posX,
          top: posY,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.chatbotFloatingButton,
          isGrabbing && styles.chatbotFloatingButtonGrabbing,
          { transform: [{ scale: pressScale }] },
        ]}
      >
        <BotMessageSquare color="#FFFFFF" size={26} strokeWidth={2.5} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingChatbotContainer: {
    // Use fixed on web so it doesn't move when the page scrolls.
    // On native, absolute is correct since we're always in the root view.
    position: Platform.OS === "web" ? "fixed" : "absolute",
    zIndex: 9999,
    width: 56,
    height: 56,
  },
  chatbotFloatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: logoGreen,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    ...Platform.select({
      web: {
        cursor: "grab",
        userSelect: "none",
        boxShadow:
          "0 8px 20px rgba(16, 185, 129, 0.42), 0 2px 6px rgba(0, 0, 0, 0.16)",
        // Prevent touch scroll from interfering with drag on web
        touchAction: "none",
      },
      default: {
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  chatbotFloatingButtonGrabbing: {
    ...Platform.select({
      web: {
        cursor: "grabbing",
      },
      default: {},
    }),
  },
});
