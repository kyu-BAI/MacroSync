import { useWindowDimensions, PixelRatio, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Reference baseline design metrics (Standard mobile reference: 375 x 812)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

/**
 * Custom React hook returning reactive responsive metrics and scale helpers
 * that automatically re-calculate on window resize, tablet mode, or split-screen.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallDevice = width < 375 || height < 680;
  const isTablet = width >= 768;
  const isLandscape = width > height;

  // Proportional horizontal scaling clamped to safe bounds
  const scale = (size) => {
    const ratio = width / GUIDELINE_BASE_WIDTH;
    const clampedRatio = Math.min(Math.max(ratio, 0.85), 1.35);
    return Math.round(size * clampedRatio);
  };

  // Proportional vertical scaling
  const verticalScale = (size) => {
    const ratio = height / GUIDELINE_BASE_HEIGHT;
    const clampedRatio = Math.min(Math.max(ratio, 0.85), 1.35);
    return Math.round(size * clampedRatio);
  };

  // Moderate scaling for padding/margins
  const moderateScale = (size, factor = 0.5) => {
    return Math.round(size + (scale(size) - size) * factor);
  };

  // Clamped font scaling to avoid text overflow when device has high display zoom
  const scaleFont = (size) => {
    const fontScale = PixelRatio.getFontScale();
    const clampedFontScale = Math.min(fontScale, 1.25);
    return Math.round(size * (width / GUIDELINE_BASE_WIDTH) * (1 / clampedFontScale));
  };

  // Standard container constraint ensuring apps look sleek on tablets/foldables
  const maxContentWidth = isTablet ? 600 : width;

  return {
    width,
    height,
    insets,
    isSmallDevice,
    isTablet,
    isLandscape,
    scale,
    verticalScale,
    moderateScale,
    scaleFont,
    maxContentWidth,
    contentContainerStyle: {
      width: "100%",
      maxWidth: isTablet ? 640 : "100%",
      alignSelf: "center",
    },
  };
}

// Static scale helpers using initial window dimensions (useful outside render cycle)
import { Dimensions } from "react-native";
const { width: initialWidth, height: initialHeight } = Dimensions.get("window");

export const scale = (size) => {
  const ratio = initialWidth / GUIDELINE_BASE_WIDTH;
  const clampedRatio = Math.min(Math.max(ratio, 0.85), 1.35);
  return Math.round(size * clampedRatio);
};

export const verticalScale = (size) => {
  const ratio = initialHeight / GUIDELINE_BASE_HEIGHT;
  const clampedRatio = Math.min(Math.max(ratio, 0.85), 1.35);
  return Math.round(size * clampedRatio);
};

export const moderateScale = (size, factor = 0.5) => {
  return Math.round(size + (scale(size) - size) * factor);
};

export const isSmallDevice = initialWidth < 375 || initialHeight < 680;
export const isTablet = initialWidth >= 768;

export const RESPONSIVE_CARD_MAX_WIDTH = 640;
