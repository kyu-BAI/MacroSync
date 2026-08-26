import { StyleSheet, Platform } from 'react-native';

const baseColor = '#F0F4F2';

export const styles = StyleSheet.create({
  appContainerRoot: {
    flex: 1,
    backgroundColor: baseColor,
  },
  offlineBannerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 32,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#92400E',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    maxWidth: '90%',
  },
  offlineBannerIcon: {
    marginRight: 6,
    fontSize: 12,
  },
  offlineBannerText: {
    color: '#FEF3C7',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
