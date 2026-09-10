import { StyleSheet } from 'react-native';

// Flat Design Tokens
export const COLORS = {
  base: '#F8FAFC',
  logoGreen: '#10B981',
  textDark: '#0F172A',
  textMuted: '#64748B',
  white: '#FFFFFF',
};

export const getStyles = (theme, isDarkMode = false) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.background || COLORS.base,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loaderContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  ring1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: COLORS.logoGreen,
    borderRightColor: COLORS.logoGreen,
    opacity: 0.8,
  },
  ring2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'transparent',
    borderBottomColor: '#CBD5E1',
    borderLeftColor: '#CBD5E1',
    opacity: 0.6,
  },
  ring3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#64748B',
    borderBottomColor: '#64748B',
    opacity: 0.4,
  },
  coreIcon: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme?.cardBg || '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  textContainer: {
    alignItems: 'center',
    height: 100, // Fixed height to prevent jumping text when lines wrap
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: theme?.textPrimary || COLORS.textDark,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme?.textSecondary || COLORS.textMuted,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: theme?.border || '#E2E8F0',
    borderRadius: 4,
    marginTop: 40,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.logoGreen,
    borderRadius: 4,
  }
});
