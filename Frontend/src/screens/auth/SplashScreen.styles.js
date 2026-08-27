import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const baseColor = '#F8FAFC';
const logoGreen = '#10B981';

export const getStyles = (theme) => StyleSheet.create({
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
    marginTop: -40,
  },
  logoImageLarge: {
    width: '100%',
    height: '100%',
  },
  
  spinnerContainerHub: {
    position: 'absolute',
    bottom: 100,
    width: 34,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  pulsingCoreBead: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
    backgroundColor: logoGreen,
  },
});
