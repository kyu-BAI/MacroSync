import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const baseColor = '#F8FAFC';
const logoGreen = '#10B981';

export const getStyles = (theme, isDarkMode) => StyleSheet.create({
  fullscreenOverlay: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: theme?.background || baseColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 54 : 48,
    marginBottom: 10,
    paddingHorizontal: 24,
    width: '100%',
  },
  headerTextGroup: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  appName: {
    fontSize: 12,
    fontWeight: '900',
    color: logoGreen,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  chatBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  normalBadgePill: {
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
  },
  warningBadgePill: {
    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.16)' : 'rgba(254, 242, 242, 1)',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.35)' : 'rgba(252, 165, 165, 0.8)',
  },
  premiumBadgePill: {
    backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.16)' : 'rgba(245, 243, 255, 1)',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.35)' : 'rgba(221, 214, 254, 0.8)',
  },
  chatBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  normalBadgeText: {
    color: '#10B981',
  },
  warningBadgeText: {
    color: '#EF4444',
  },
  premiumBadgeText: {
    color: '#8B5CF6',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '900',
    color: theme?.textPrimary || '#0F172A',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 13,
    fontWeight: '700',
    color: theme?.textSecondary || '#64748B',
    marginTop: 2,
  },
  keyboardContainer: {
    flex: 1,
    marginBottom: 84,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  chatScrollContent: {
    paddingBottom: 16,
  },
  messageRowFlex: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    width: '100%',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  aiIconAvatarNeuBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  userIconAvatarNeuBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  chatBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '78%',
  },
  aiMessageFormCard: {
    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  userMessageFormCard: {
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#E6F4EA',
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
  },
  typingIndicatorBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  typingIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: logoGreen
  },
  messageBubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiBubbleText: {
    color: theme?.textPrimary || '#0F172A',
    fontWeight: '600',
    textAlign: 'left',
  },
  userBubbleText: {
    color: theme?.textPrimary || '#0F172A',
    fontWeight: '700',
  },
  messageTimeStampText: {
    fontSize: 9,
    color: theme?.textSecondary || '#94A3B8',
    fontWeight: '700',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  suggestionsWrapper: {
    paddingVertical: 6,
    backgroundColor: theme?.background || baseColor,
    overflow: 'visible'
  },
  suggestionsScroll: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 8,
    overflow: 'visible',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderWidth: 1.2,
    borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
  },
  suggestionChipText: {
    color: isDarkMode ? '#34D399' : '#059669',
    fontSize: 12,
    fontWeight: '800',
  },
  chatInputFormCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 6 : 0,
    marginTop: 5,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  chatInputInnerLayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatTextInputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: theme?.textPrimary || '#0F172A',
    maxHeight: 60,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  sendActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: logoGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
