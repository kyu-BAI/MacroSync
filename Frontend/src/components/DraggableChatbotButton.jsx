import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Platform
} from 'react-native';
import { BotMessageSquare } from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Logo colors
const logoGreen = '#4EA685';
const logoDarkShadow = '#37745D';
const logoLightHighlight = '#65D8AD';

// Spacing bounds to clear header and absolute bottom navigation bar
const NAV_BAR_HEIGHT = Platform.OS === 'ios' ? 116 : 98;
const TOP_BOUND = Platform.OS === 'ios' ? 80 : 60;
const BOTTOM_BOUND = screenHeight - NAV_BAR_HEIGHT - 65;
const LEFT_BOUND = 16;
const RIGHT_BOUND = screenWidth - 56 - 16;

export default function DraggableChatbotButton({ onPress }) {
  // Initialize position to bottom right
  const pan = useRef(new Animated.ValueXY({
    x: RIGHT_BOUND,
    y: BOTTOM_BOUND - 20
  })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Prevent capturing gestures for simple taps
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        
        // Determine nearest edge (Left vs Right)
        const currentX = pan.x._value;
        const currentY = pan.y._value;
        
        const finalX = currentX > (screenWidth - 56) / 2 ? RIGHT_BOUND : LEFT_BOUND;
        
        // Bound Y position within dynamic safe zone
        const finalY = Math.max(TOP_BOUND, Math.min(BOTTOM_BOUND, currentY));

        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
          friction: 6,
          tension: 80
        }).start();
      }
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.floatingChatbotContainer,
        {
          transform: pan.getTranslateTransform()
        }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.chatbotFloatingButton}
      >
        <BotMessageSquare color="#FFFFFF" size={26} strokeWidth={2.5} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingChatbotContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
    width: 56,
    height: 56,
  },
  chatbotFloatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: logoGreen,
    borderWidth: 1.5,
    borderColor: logoLightHighlight,
    // Premium soft Neumorphic shadow styling
    shadowColor: logoDarkShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  }
});
