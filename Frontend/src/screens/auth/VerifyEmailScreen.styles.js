import { StyleSheet, Platform } from 'react-native';

const baseColor = '#F8FAFC';
const logoGreen = '#10B981';

export const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.background || baseColor,
  },
  flexContainer: {
    flex: 1,
  },
  topNavigationRow: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  backArrowButton: {
    padding: 10,
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 32,
    alignItems: "center",
    width: '100%',
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: logoGreen, 
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 14,
    color: theme?.textSecondary || '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '700',
  },
  emailBadgeContainer: {
    marginTop: 10,
    alignSelf: 'center',
  },
  emailText: {
    fontSize: 15,
    fontWeight: "800",
    color: theme?.textPrimary || "#0F172A",
    backgroundColor: theme?.cardBg || '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme?.border || '#E2E8F0',
    overflow: 'hidden',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: theme?.surface || baseColor,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme?.border || '#E2E8F0',
  },
  inputLabel: {
    color: theme?.textPrimary || '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  flatInputField: {
    backgroundColor: theme?.inputBg || baseColor,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme?.inputBorder || '#E2E8F0',
    marginBottom: 24,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leadingIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: theme?.textPrimary || '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 20,
    fontWeight: '800',
    textAlign: "center",
    letterSpacing: 6,
  },
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonUnpressed: {
    backgroundColor: logoGreen,
    borderRadius: 20,
  },
  buttonPressed: {
    backgroundColor: '#059669',
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonTextPressed: {
    color: '#E2E8F0',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 13,
    color: theme?.textSecondary || '#64748B',
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  resendLink: {
    fontSize: 13,
    color: logoGreen,
    fontWeight: '800',
  },
  resendLinkDisabled: {
    color: theme?.textSecondary || '#94A3B8',
    opacity: 0.7,
  },
});
