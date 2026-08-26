import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const logoGreen = '#10B981';

export const getStyles = (theme, isDarkMode) => StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },

  // Edge-to-Edge Container
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme?.surface || '#FFFFFF',
    borderTopWidth: 1.2,
    borderTopColor: theme?.border || '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 14 : 0,
    zIndex: 3,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },

  topAccentBar: {
    position: 'absolute',
    top: -1,
    width: 28,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: logoGreen,
  },

  pillContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  label: {
    fontSize: 10,
    fontWeight: '600',
    color: isDarkMode ? '#64748B' : '#94A3B8',
    marginTop: 2,
  },
  labelActive: {
    color: logoGreen,
    fontWeight: '900',
  },

  // Placeholder for center slot spacing
  centerSlot: {
    width: 60,
  },

  // FAB — with ring accent
  fabWrapper: {
    position: 'absolute',
    left: screenWidth / 2 - 29, // center (58/2 = 29)
    zIndex: 5,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  fabActive: {
    backgroundColor: '#059669',
  },
});
