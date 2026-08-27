import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const getStyles = (theme, isDarkMode) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: width - 32,
    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },

  // Spinner Orbital Styles (UIverse inspired)
  spinnerContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  outerRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderTopColor: '#10B981',
    borderRightColor: '#10B981',
    position: 'absolute',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ringDot1: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: -4,
  },
  ringDot2: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginBottom: -3,
  },
  innerOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  sparkleBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 4,
    elevation: 4,
  },

  // Typography
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: theme?.textPrimary || (isDarkMode ? '#F8FAFC' : '#0F172A'),
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme?.textSecondary || '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    fontWeight: '600',
    paddingHorizontal: 8,
  },

  // Stage Box
  stageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
    width: '100%',
    marginBottom: 16,
    minHeight: 52,
  },
  stageText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme?.textPrimary || (isDarkMode ? '#F8FAFC' : '#0F172A'),
    flex: 1,
    lineHeight: 18,
    flexWrap: 'wrap',
  },

  // Progress Bar
  progressTrack: {
    height: 6,
    width: '100%',
    backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 1.5,
  },
});
