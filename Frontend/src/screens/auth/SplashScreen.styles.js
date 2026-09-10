import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Flat Design Tokens
export const baseColor = '#F8FAFC';
export const logoGreen = '#10B981';

export const getStyles = (theme, isDarkMode = false) => StyleSheet.create({
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
